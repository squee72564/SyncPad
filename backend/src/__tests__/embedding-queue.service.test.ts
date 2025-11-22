import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedisClient = {
  isOpen: false,
  connect: vi.fn(),
  xAdd: vi.fn(),
};

const getRedisClientMock = vi.fn(() => mockRedisClient);

vi.mock("../lib/redis.js", () => ({
  __esModule: true,
  default: getRedisClientMock,
}));

vi.mock("../config/index.js", () => ({
  __esModule: true,
  default: {
    EMBEDDING_REDIS_STREAM_KEY: "test-stream",
  },
}));

const loggerInfoMock = vi.fn();
vi.mock("../config/logger.js", () => ({
  __esModule: true,
  default: {
    info: loggerInfoMock,
    error: vi.fn(),
  },
}));

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "generated-id"),
}));

const embeddingQueueService = (await import("../services/embedding-queue.service.js")).default;

describe("embedding-queue.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisClient.isOpen = false;
  });

  it("connects and enqueues embedding job", async () => {
    mockRedisClient.xAdd.mockResolvedValue("job-1");

    const jobId = await embeddingQueueService.enqueueEmbeddingJob({
      workspaceId: "workspace-1",
      documentId: "doc-1",
    });

    expect(mockRedisClient.connect).toHaveBeenCalled();
    expect(mockRedisClient.xAdd).toHaveBeenCalledWith(
      "test-stream",
      "*",
      expect.objectContaining({
        jobId: "generated-id",
        workspaceId: "workspace-1",
        documentId: "doc-1",
        type: "EMBEDDING",
      })
    );
    expect(jobId).toBe("generated-id");
    expect(loggerInfoMock).toHaveBeenCalledWith(
      "Queued embedding job",
      expect.objectContaining({
        workspaceId: "workspace-1",
        documentId: "doc-1",
        jobId: "generated-id",
      })
    );
  });

  it("throws when required fields are missing", async () => {
    await expect(
      embeddingQueueService.enqueueEmbeddingJob({
        workspaceId: "",
        documentId: "",
      })
    ).rejects.toThrow("Workspace ID and Document ID are required for embedding job");
  });
});
