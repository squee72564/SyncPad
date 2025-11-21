import { describe, expect, it, vi, beforeEach } from "vitest";
import { EmbeddingWorker } from "@/worker.ts";
import type { StreamMessage } from "@/queue.ts";

vi.mock("@/lib/prisma.ts", () => ({
  disconnectPrisma: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/controllers/document.controller.ts", () => ({
  __esModule: true,
  default: {
    getDocumentById: vi.fn(),
  },
}));

vi.mock("@/controllers/documentEmbedding.controller.ts", () => ({
  __esModule: true,
  default: {
    storeDocumentEmbeddings: vi.fn(),
  },
}));

const mockDocumentController = (await import("@/controllers/document.controller.ts")).default;
const mockDocumentEmbeddingController = (
  await import("@/controllers/documentEmbedding.controller.ts")
).default;
const getDocumentByIdMock = mockDocumentController.getDocumentById as unknown as ReturnType<
  typeof vi.fn
>;
const storeDocumentEmbeddingsMock =
  mockDocumentEmbeddingController.storeDocumentEmbeddings as unknown as ReturnType<typeof vi.fn>;

const createMessage = (): StreamMessage => ({
  id: "1-0",
  payload: {
    jobId: "job-1",
    workspaceId: "workspace-1",
    documentId: "doc-1",
    revisionId: "rev-1",
    type: "EMBED_DOCUMENT",
  },
});

const createWorker = () => {
  const redisClient = {
    isOpen: true,
    connect: vi.fn(),
    quit: vi.fn(),
  };

  const idlePoll = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return [];
  };

  const embeddingQueue = {
    init: vi.fn().mockResolvedValue(undefined),
    claimPending: vi.fn().mockResolvedValue([]),
    readNext: vi.fn().mockImplementation(idlePoll),
    acknowledge: vi.fn().mockResolvedValue(undefined),
    sendToDeadLetter: vi.fn().mockResolvedValue(undefined),
  };

  const embeddingProvider = {
    generateEmbeddings: vi.fn(),
  };

  const documentChunker = {
    chunkDocument: vi.fn(),
  };

  const worker = new EmbeddingWorker({
    redisClient: redisClient as any,
    embeddingQueue: embeddingQueue as any,
    embeddingProvider: embeddingProvider as any,
    documentChunker: documentChunker as any,
  });

  return {
    worker,
    redisClient,
    embeddingQueue,
    embeddingProvider,
    documentChunker,
  };
};

describe("EmbeddingWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes messages and acknowledges them", { timeout: 10_000 }, async () => {
    const { worker, embeddingQueue, embeddingProvider, documentChunker } = createWorker();
    const message = createMessage();

    embeddingQueue.readNext
      .mockImplementationOnce(async () => [message])
      .mockImplementationOnce(async () => []);
    getDocumentByIdMock.mockResolvedValue({ content: "doc content" });
    documentChunker.chunkDocument.mockReturnValue(["chunk"]);
    embeddingProvider.generateEmbeddings.mockResolvedValue([[0.1, 0.2]]);
    storeDocumentEmbeddingsMock.mockResolvedValue(1);

    worker.start();
    await vi.waitFor(() => expect(storeDocumentEmbeddingsMock).toHaveBeenCalled());
    await worker.stop();

    expect(getDocumentByIdMock).toHaveBeenCalledWith("doc-1");
    expect(storeDocumentEmbeddingsMock).toHaveBeenCalledWith(
      "doc-1",
      "workspace-1",
      [{ chunkText: "chunk", embeddingVector: [0.1, 0.2] }],
      "rev-1"
    );
    expect(embeddingQueue.acknowledge).toHaveBeenCalledWith("1-0");
  });

  it("sends message to dead letter on processing failure", { timeout: 10_000 }, async () => {
    const { worker, embeddingQueue, embeddingProvider, documentChunker } = createWorker();
    const message = createMessage();

    embeddingQueue.readNext
      .mockImplementationOnce(async () => [message])
      .mockImplementationOnce(async () => []);
    getDocumentByIdMock.mockResolvedValue({ content: "doc content" });
    documentChunker.chunkDocument.mockReturnValue(["chunk"]);
    embeddingProvider.generateEmbeddings.mockRejectedValue(new Error("provider failure"));

    worker.start();
    await vi.waitFor(() => expect(embeddingQueue.sendToDeadLetter).toHaveBeenCalled());
    await worker.stop();

    expect(embeddingQueue.sendToDeadLetter).toHaveBeenCalledWith(message, "provider failure");
    expect(embeddingQueue.acknowledge).not.toHaveBeenCalled();
  });

  it("reclaims pending messages during startup", { timeout: 10_000 }, async () => {
    const { worker, embeddingQueue, documentChunker, embeddingProvider } = createWorker();
    const pendingMessage = createMessage();
    embeddingQueue.claimPending.mockResolvedValueOnce([pendingMessage]);
    embeddingQueue.readNext.mockImplementationOnce(async () => []);
    getDocumentByIdMock.mockResolvedValue({ content: "content" });
    documentChunker.chunkDocument.mockReturnValue(["chunk"]);
    embeddingProvider.generateEmbeddings.mockResolvedValue([[1]]);
    storeDocumentEmbeddingsMock.mockResolvedValue(1);

    worker.start();
    await vi.waitFor(() => expect(storeDocumentEmbeddingsMock).toHaveBeenCalled());
    await worker.stop();

    expect(embeddingQueue.claimPending).toHaveBeenCalled();
    expect(embeddingQueue.acknowledge).toHaveBeenCalledWith("1-0");
  });

  it("stops processing when shutdown is triggered", { timeout: 30_000 }, async () => {
    const { worker, embeddingQueue } = createWorker();
    worker.start();
    await vi.waitFor(() => expect(embeddingQueue.readNext).toHaveBeenCalled());
    await worker.stop();
    expect(embeddingQueue.readNext).toHaveBeenCalled();
  });

  it("retries when readNext throws transient errors", { timeout: 10_000 }, async () => {
    const { worker, embeddingQueue } = createWorker();
    const error = new Error("redis read failure");

    embeddingQueue.readNext
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockImplementationOnce(async () => {
        await worker.stop();
        return [];
      });

    const delaySpy = vi
      .spyOn(EmbeddingWorker.prototype as any, "delay")
      .mockResolvedValue(undefined);

    worker.start();
    await vi.waitFor(() => expect(embeddingQueue.readNext).toHaveBeenCalledTimes(3));
    expect(delaySpy).toHaveBeenCalled();
  });

  it("normalizes JSON document content before chunking", async () => {
    const { worker, embeddingQueue, documentChunker, embeddingProvider } = createWorker();
    const message = createMessage();

    embeddingQueue.readNext
      .mockImplementationOnce(async () => [message])
      .mockImplementationOnce(async () => []);
    getDocumentByIdMock.mockResolvedValue({
      content: { blocks: [{ type: "paragraph", data: "hi" }] },
    });
    documentChunker.chunkDocument.mockReturnValue(["serialized"]);
    embeddingProvider.generateEmbeddings.mockResolvedValue([[0.5]]);
    storeDocumentEmbeddingsMock.mockResolvedValue(1);

    worker.start();
    await vi.waitFor(() =>
      expect(documentChunker.chunkDocument).toHaveBeenCalledWith(expect.stringContaining("blocks"))
    );
    await worker.stop();
  });
});
