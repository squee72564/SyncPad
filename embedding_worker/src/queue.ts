import { RedisClientType } from "redis";
import { z } from "zod";
import logger from "./config/logger.ts";

const messageSchema = z.object({
  jobId: z.string(),
  workspaceId: z.string(),
  documentId: z.string(),
  revisionId: z.string().optional(),
  type: z.string().default("EMBED_DOCUMENT"),
  payload: z.string().optional(),
});

export type EmbeddingQueueMessage = z.infer<typeof messageSchema>;

export interface StreamMessage {
  id: string;
  payload: EmbeddingQueueMessage;
}

type ReadOptions = {
  COUNT?: number;
  BLOCK?: number;
};

export interface EmbeddingQueueOptions {
  streamKey: string;
  groupName: string;
  consumerName: string;
  blockMs?: number;
  readCount?: number;
  minIdleMs?: number;
  deadLetterStream?: string;
}

const DEFAULTS = {
  blockMs: 5000,
  readCount: 1,
  minIdleMs: 60_000,
} satisfies Required<Pick<EmbeddingQueueOptions, "blockMs" | "readCount" | "minIdleMs">>;

export default class EmbeddingQueue {
  private readonly streamKey: string;
  private readonly groupName: string;
  private readonly consumerName: string;
  private readonly blockMs: number;
  private readonly readCount: number;
  private readonly minIdleMs: number;
  private readonly deadLetterStream: string;

  constructor(
    private readonly redisClient: RedisClientType,
    options: EmbeddingQueueOptions
  ) {
    this.streamKey = options.streamKey;
    this.groupName = options.groupName;
    this.consumerName = options.consumerName;
    this.blockMs = options.blockMs ?? DEFAULTS.blockMs;
    this.readCount = options.readCount ?? DEFAULTS.readCount;
    this.minIdleMs = options.minIdleMs ?? DEFAULTS.minIdleMs;
    this.deadLetterStream = options.deadLetterStream ?? `${this.streamKey}:dead`;
  }

  async init() {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
    await this.ensureConsumerGroup();
  }

  async addTask(message: EmbeddingQueueMessage) {
    const serialized = this.serializeMessage(message);
    return this.redisClient.xAdd(this.streamKey, "*", serialized);
  }

  async readNext(options?: Partial<ReadOptions>): Promise<StreamMessage[]> {
    const readOptions: ReadOptions = {
      COUNT: options?.COUNT ?? this.readCount,
      BLOCK: options?.BLOCK ?? this.blockMs,
    };

    const response = await this.redisClient.xReadGroup(
      this.groupName,
      this.consumerName,
      { key: this.streamKey, id: ">" },
      readOptions
    );

    if (!response || response.length === 0) {
      return [];
    }

    const streamMessages = response.flatMap((stream) => stream.messages);
    return streamMessages.map((msg) => ({
      id: msg.id,
      payload: this.deserializeMessage(msg.message),
    }));
  }

  async claimPending(): Promise<StreamMessage[]> {
    const result = await this.redisClient.xAutoClaim(
      this.streamKey,
      this.groupName,
      this.consumerName,
      this.minIdleMs,
      "0-0",
      { COUNT: this.readCount }
    );

    if (result.messages.length === 0) {
      return [];
    }

    const { messages, deletedMessages } = result;

    logger.debug("Deleted Messages:", deletedMessages);

    return messages
      .filter((msg) => msg !== null)
      .map((msg) => ({
        id: msg.id,
        payload: this.deserializeMessage(msg.message),
      }));
  }

  async acknowledge(messageIds: string | string[]) {
    const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
    for (const id of ids) {
      await this.redisClient.xAck(this.streamKey, this.groupName, id);
    }
  }

  async sendToDeadLetter(message: StreamMessage, reason: string) {
    const payload = {
      ...this.serializeMessage(message.payload),
      originalId: message.id,
      error: reason,
    };

    await this.redisClient.xAdd(this.deadLetterStream, "*", payload);
    await this.acknowledge(message.id);
  }

  async pendingSummary() {
    return this.redisClient.xPending(this.streamKey, this.groupName);
  }

  private serializeMessage(message: EmbeddingQueueMessage): Record<string, string> {
    return {
      jobId: message.jobId,
      workspaceId: message.workspaceId,
      documentId: message.documentId,
      ...(message.revisionId ? { revisionId: message.revisionId } : {}),
      type: message.type,
      ...(message.payload ? { payload: message.payload } : {}),
    };
  }

  private deserializeMessage(raw: Record<string, string>): EmbeddingQueueMessage {
    const parsed = messageSchema.safeParse({
      ...raw,
      revisionId: raw.revisionId ?? undefined,
      payload: raw.payload ?? undefined,
    });

    if (!parsed.success) {
      throw new Error(
        `Invalid queue message: ${parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ")}`
      );
    }

    return parsed.data;
  }

  private async ensureConsumerGroup() {
    try {
      await this.redisClient.xGroupCreate(this.streamKey, this.groupName, "0", {
        MKSTREAM: true,
      });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("BUSYGROUP")) {
        throw error;
      }
    }
  }
}
