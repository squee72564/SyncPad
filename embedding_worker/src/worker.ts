import config from "@/config/config.ts";
import redisClientFactory from "@/lib/redisClient.ts";
import EmbeddingQueue, { StreamMessage } from "@/queue.ts";
import logger from "@/config/logger.ts";
import { createEmbeddingProvider, EmbeddingProvider } from "@/embed.ts";
import DocumentChunker from "@/chunker.ts";
import { RedisClientType } from "redis";
import { disconnectPrisma } from "@/lib/prisma.ts";
import documentController from "@/controllers/document.controller.ts";
import documentEmbeddingController from "@/controllers/documentEmbedding.controller.ts";

type WorkerDependencies = {
  redisClient: RedisClientType;
  embeddingQueue: EmbeddingQueue;
  embeddingProvider: EmbeddingProvider;
  documentChunker: DocumentChunker;
};

export class EmbeddingWorker {
  private shuttingDown = false;
  private loopPromise?: Promise<void>;

  constructor(private readonly context: WorkerDependencies) {}

  start(): Promise<void> {
    if (this.loopPromise) {
      return this.loopPromise;
    }

    if (this.shuttingDown) {
      return Promise.resolve();
    }

    this.loopPromise = this.run();
    return this.loopPromise;
  }

  stop(): Promise<void> {
    if (this.shuttingDown) {
      return this.loopPromise ?? Promise.resolve();
    }

    logger.info("Shutdown requested");
    this.shuttingDown = true;
    return this.loopPromise ?? Promise.resolve();
  }

  private async run() {
    const { redisClient, embeddingQueue } = this.context;

    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }

      await embeddingQueue.init();
      await this.reclaimPendingMessages();

      while (!this.shuttingDown) {
        try {
          const messages = await embeddingQueue.readNext();

          if (this.shuttingDown) {
            break;
          }

          if (!messages.length) {
            continue;
          }

          await this.processMessages(messages);
        } catch (error) {
          if (this.shuttingDown) {
            break;
          }

          logger.error("Error while reading from queue", error);
          await this.delay(1000);
        }
      }
    } finally {
      await this.cleanup();
    }
  }

  private async reclaimPendingMessages() {
    if (this.shuttingDown) {
      return;
    }

    try {
      const pending = await this.context.embeddingQueue.claimPending();

      if (!pending.length) {
        return;
      }

      logger.info(`Reclaimed ${pending.length} pending messages`);
      await this.processMessages(pending);
    } catch (error) {
      logger.error("Failed to reclaim pending messages", error);
    }
  }

  private async processMessages(messages: StreamMessage[]) {
    for (const message of messages) {
      if (this.shuttingDown) {
        return;
      }

      await this.processMessage(message);
    }
  }

  private async processMessage(message: StreamMessage) {
    try {
      await this.processEmbedding(message);
    } catch (error) {
      logger.error(`Failed to process message ${message.id}`, error);
      await this.handleFailedMessage(message, error);
      return;
    }

    try {
      await this.context.embeddingQueue.acknowledge(message.id);
      logger.info(`Acknowledged message ${message.id}`);
    } catch (error) {
      logger.error(`Failed to acknowledge message ${message.id}`, error);
      throw error;
    }
  }

  private async processEmbedding(message: StreamMessage) {
    const { embeddingProvider, documentChunker } = this.context;
    const { documentId } = message.payload;

    logger.info(`Processing message ${message.id}`, message.payload);

    const document = await documentController.getDocumentById(documentId);

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    const content = this.normalizeDocumentContent(document.content);
    const chunks = documentChunker.chunkDocument(content);

    if (!chunks.length) {
      logger.warn(`No chunks generated for document ${documentId}`);
      return;
    }

    const embeddings: number[][] = await embeddingProvider.generateEmbeddings(chunks);

    if (!embeddings || embeddings.length === 0) {
      throw new Error(`No embeddings generated for document ${documentId}`);
    }

    if (embeddings.length !== chunks.length) {
      throw new Error(
        `Mismatch between chunks (${chunks.length}) and embeddings (${embeddings.length}) for document ${documentId}`
      );
    }

    const chunkEmbeddings = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const embeddingVector = embeddings[i];

      if (!embeddingVector?.length) {
        logger.warn(`No embedding generated for chunk ${i} of document ${documentId}`);
        continue;
      }

      if (!chunkText?.length) {
        logger.warn(`Empty chunk text for embedding vector ${i} of document ${documentId}`);
        continue;
      }

      chunkEmbeddings.push({
        chunkText,
        embeddingVector,
      });
    }

    const storedCount = await documentEmbeddingController.storeDocumentEmbeddings(
      message.payload.documentId,
      message.payload.workspaceId,
      chunkEmbeddings,
      message.payload.revisionId
    );

    logger.info(`Stored ${storedCount} embeddings for document ${documentId}`);
  }

  private normalizeDocumentContent(content: unknown): string {
    if (content === null || content === undefined) {
      return "";
    }

    if (typeof content === "string") {
      return content;
    }

    if (typeof content === "object") {
      try {
        return JSON.stringify(content);
      } catch (_error) {
        return "";
      }
    }

    return String(content);
  }

  private async handleFailedMessage(message: StreamMessage, error: unknown) {
    try {
      const reason = error instanceof Error ? error.message : "Unknown error";
      await this.context.embeddingQueue.sendToDeadLetter(message, reason);
      logger.warn(`Moved message ${message.id} to dead letter queue`);
    } catch (deadLetterError) {
      logger.error(`Failed to send message ${message.id} to dead letter queue`, deadLetterError);
    }
  }

  private async cleanup() {
    const { redisClient } = this.context;

    try {
      await disconnectPrisma();
    } catch (error) {
      logger.error("Error disconnecting Prisma", error);
    }

    if (redisClient.isOpen) {
      try {
        await redisClient.quit();
      } catch (error) {
        logger.error("Error closing Redis connection", error);
      }
    }

    logger.info("Worker shut down gracefully");
  }

  protected async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createWorkerDependencies(): WorkerDependencies {
  const redisClient = redisClientFactory() as RedisClientType;

  const embeddingQueue = new EmbeddingQueue(redisClient, {
    streamKey: config.REDIS_STREAM_KEY,
    groupName: config.REDIS_CONSUMER_GROUP,
    consumerName: `worker-${process.pid}`,
  });

  const embeddingProvider = createEmbeddingProvider();

  const documentChunker = new DocumentChunker();

  logger.info("Worker dependencies created");

  return {
    redisClient,
    embeddingQueue,
    embeddingProvider,
    documentChunker,
  };
}
