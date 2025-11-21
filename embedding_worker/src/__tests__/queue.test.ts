import { describe, expect, it, vi, beforeEach } from "vitest";
import EmbeddingQueue, { type EmbeddingQueueMessage } from "@/queue.ts";
import { RedisClientType } from "redis";

const createRedisMock = () => {
  const client = {
    isOpen: false,
    connect: vi.fn(),
    xGroupCreate: vi.fn(),
    xAdd: vi.fn(),
    xReadGroup: vi.fn(),
    xAutoClaim: vi.fn(),
    xAck: vi.fn(),
    xPending: vi.fn(),
  };

  return client;
};

const baseOptions = {
  streamKey: "test-stream",
  groupName: "test-group",
  consumerName: "consumer-1",
  blockMs: 1,
  readCount: 2,
  minIdleMs: 1000,
};

const createMessage = (overrides: Partial<EmbeddingQueueMessage> = {}): EmbeddingQueueMessage => ({
  jobId: "job-123",
  workspaceId: "workspace-1",
  documentId: "document-1",
  type: "EMBED_DOCUMENT",
  ...overrides,
});

describe("EmbeddingQueue", () => {
  let redisClient: ReturnType<typeof createRedisMock>;
  let queue: EmbeddingQueue;

  beforeEach(() => {
    redisClient = createRedisMock();
    queue = new EmbeddingQueue(redisClient as unknown as RedisClientType, baseOptions);
  });

  it("connects and creates consumer group on init when client not open", async () => {
    redisClient.isOpen = false;
    await queue.init();
    expect(redisClient.connect).toHaveBeenCalled();
    expect(redisClient.xGroupCreate).toHaveBeenCalledWith(
      "test-stream",
      "test-group",
      "0",
      expect.objectContaining({ MKSTREAM: true })
    );
  });

  it("skips connect when client already open", async () => {
    redisClient.isOpen = true;
    await queue.init();
    expect(redisClient.connect).not.toHaveBeenCalled();
    expect(redisClient.xGroupCreate).toHaveBeenCalled();
  });

  it("serializes and enqueues message via xAdd", async () => {
    const payload = createMessage({ revisionId: "rev-1", payload: '{"hello":"world"}' });
    await queue.addTask(payload);
    expect(redisClient.xAdd).toHaveBeenCalledWith(
      "test-stream",
      "*",
      expect.objectContaining({
        jobId: "job-123",
        revisionId: "rev-1",
        payload: '{"hello":"world"}',
      })
    );
  });

  it("reads next messages and deserializes payloads", async () => {
    redisClient.xReadGroup.mockResolvedValue([
      {
        messages: [
          {
            id: "1-0",
            message: {
              jobId: "job-1",
              workspaceId: "workspace",
              documentId: "doc",
              type: "EMBED_DOCUMENT",
            },
          },
        ],
      },
    ]);

    const messages = await queue.readNext();
    expect(redisClient.xReadGroup).toHaveBeenCalledWith(
      "test-group",
      "consumer-1",
      { key: "test-stream", id: ">" },
      expect.objectContaining({ COUNT: 2, BLOCK: 1 })
    );
    expect(messages).toEqual([
      {
        id: "1-0",
        payload: expect.objectContaining({
          jobId: "job-1",
          workspaceId: "workspace",
        }),
      },
    ]);
  });

  it("returns empty array when readNext finds no messages", async () => {
    redisClient.xReadGroup.mockResolvedValue([]);
    const messages = await queue.readNext();
    expect(messages).toEqual([]);
  });

  it("claims pending messages via xAutoClaim", async () => {
    redisClient.xAutoClaim.mockResolvedValue({
      messages: [
        {
          id: "5-0",
          message: {
            jobId: "job-5",
            workspaceId: "workspace",
            documentId: "doc",
            type: "EMBED_DOCUMENT",
          },
        },
      ],
      deletedMessages: [],
      nextStart: "0-0",
    });

    const pending = await queue.claimPending();
    expect(redisClient.xAutoClaim).toHaveBeenCalledWith(
      "test-stream",
      "test-group",
      "consumer-1",
      1000,
      "0-0",
      expect.objectContaining({ COUNT: 2 })
    );
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe("5-0");
  });

  it("acknowledges a single message ID", async () => {
    await queue.acknowledge("123-0");
    expect(redisClient.xAck).toHaveBeenCalledWith("test-stream", "test-group", "123-0");
  });

  it("acknowledges multiple message IDs", async () => {
    await queue.acknowledge(["123-0", "456-0"]);
    expect(redisClient.xAck).toHaveBeenCalledTimes(2);
  });

  it("sends message to dead-letter stream with reason", async () => {
    redisClient.xAdd.mockResolvedValue("dead-1");
    await queue.sendToDeadLetter(
      {
        id: "1-0",
        payload: createMessage(),
      },
      "test failure"
    );

    expect(redisClient.xAdd).toHaveBeenCalledWith(
      "test-stream:dead",
      "*",
      expect.objectContaining({
        jobId: "job-123",
        originalId: "1-0",
        error: "test failure",
      })
    );
    expect(redisClient.xAck).toHaveBeenCalledWith("test-stream", "test-group", "1-0");
  });

  it("returns pending summary via xPending", async () => {
    redisClient.xPending.mockResolvedValue({ pending: 3 });
    const summary = await queue.pendingSummary();
    expect(redisClient.xPending).toHaveBeenCalledWith("test-stream", "test-group");
    expect(summary).toEqual({ pending: 3 });
  });

  it("sends invalid messages to dead letter during readNext", async () => {
    redisClient.xReadGroup.mockResolvedValue([
      {
        messages: [
          {
            id: "bad-1",
            message: {
              workspaceId: "workspace",
            },
          },
        ],
      },
    ]);

    const messages = await queue.readNext();

    expect(messages).toEqual([]);
    expect(redisClient.xAdd).toHaveBeenCalledWith(
      "test-stream:dead",
      "*",
      expect.objectContaining({
        workspaceId: "workspace",
        originalId: "bad-1",
        error: expect.any(String),
      })
    );
    expect(redisClient.xAck).toHaveBeenCalledWith("test-stream", "test-group", "bad-1");
  });
});
