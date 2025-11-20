import config from "./config/config.ts";
import redisClientFactory from "./redisClient.ts";
import EmbeddingQueue from "./queue.ts";
import logger from "./config/logger.ts";
import EmbeddingProvider from "./embed.ts";
import DocumentChunker from "./chunker.ts";
import { RedisClientType } from "redis";
import { disconnectPrisma } from "./lib/prisma.ts";
import documentController from "./controllers/document.controller.ts";
import documentEmbeddingController from "./controllers/documentEmbedding.controller.ts";

type WorkerDependencies = {
  redisClient: RedisClientType;
  embeddingQueue: EmbeddingQueue;
  embeddingProvider: EmbeddingProvider;
  documentChunker: DocumentChunker;
};

export function createWorkerDependencies(): WorkerDependencies {
  const redisClient = redisClientFactory() as RedisClientType;

  const embeddingQueue = new EmbeddingQueue(redisClient, {
    streamKey: config.REDIS_STREAM_KEY,
    groupName: config.REDIS_CONSUMER_GROUP,
    consumerName: `worker-${process.pid}`,
  });

  const embeddingProvider = new EmbeddingProvider();

  const documentChunker = new DocumentChunker();

  logger.info("Worker dependencies created");

  return {
    redisClient,
    embeddingQueue,
    embeddingProvider,
    documentChunker,
  };
}

export async function runWorker(context: WorkerDependencies) {
  const { redisClient, embeddingQueue, embeddingProvider, documentChunker } = context;

  await embeddingQueue.init();

  let shouldExit = false;

  process.on("SIGINT", () => {
    shouldExit = true;
  });

  process.on("SIGTERM", () => {
    shouldExit = true;
  });

  while (!shouldExit) {
    const messages = await embeddingQueue.readNext();

    for (const message of messages) {
      logger.info(`Processing message ${message.id}`, message.payload);

      // Get document from database
      const document = await documentController.getDocumentById(message.payload.documentId);

      // Chunk document using documentChunker
      const chunks = documentChunker.chunkDocument(document?.content?.toString() || "");

      // Generate embeddings using embeddingProvider
      const chunkPromises = [];
      for (const chunk of chunks) {
        chunkPromises.push(embeddingProvider.generateEmbedding(chunk));
      }
      const embeddings = await Promise.all(chunkPromises);

      // Store embeddings back to database
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const embeddingVector = embeddings[i];

        if (!embeddingVector || embeddingVector.length === 0) {
          logger.warn(`No embedding generated for chunk: ${chunkText}`);
          continue;
        }

        if (!chunkText || chunkText.length === 0) {
          logger.warn(`Empty chunk text for embedding vector: ${embeddingVector}`);
          continue;
        }

        // Store document embedding
        await documentEmbeddingController.storeDocumentEmbedding(
          message.payload.documentId,
          message.payload.workspaceId,
          chunkText,
          embeddingVector
        );
      }

      // Acknowledge message
      await embeddingQueue.acknowledge(message.id);
      logger.info(`Acknowledged message ${message.id}`);
    }
  }

  await disconnectPrisma();
  await redisClient.quit();
  logger.info("Worker shut down gracefully");
}
