import { describe, expect, it, beforeEach, vi } from "vitest";

const prismaDocumentMock = {
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../lib/prisma.js", () => ({
  __esModule: true,
  default: {
    document: prismaDocumentMock,
    documentCollabState: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

const enqueueEmbeddingJobMock = vi.fn();
vi.mock("../services/embedding-queue.service.js", () => ({
  __esModule: true,
  default: {
    enqueueEmbeddingJob: enqueueEmbeddingJobMock,
  },
}));

const deleteDocumentEmbeddingsMock = vi.fn();
vi.mock("../services/document-embedding.service.js", () => ({
  __esModule: true,
  default: {
    deleteDocumentEmbeddings: deleteDocumentEmbeddingsMock,
  },
}));

vi.mock("../config/logger.js", () => ({
  __esModule: true,
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

const createAiJobMock = vi.fn();
const markJobFailedMock = vi.fn();
vi.mock("../services/ai-job.service.js", () => ({
  __esModule: true,
  default: {
    createAiJob: createAiJobMock,
    markJobFailed: markJobFailedMock,
  },
}));

const documentService = (await import("../services/document.service.ts")).default;

describe("document.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAiJobMock.mockResolvedValue({ id: "ai-job-1" });
    markJobFailedMock.mockResolvedValue(undefined);
  });

  it("enqueues embedding job when document is created in a RAG-eligible status", async () => {
    prismaDocumentMock.create.mockResolvedValue({
      id: "doc-1",
      status: "PUBLISHED",
    });

    await documentService.createDocument("workspace-1", "user-1", {
      title: "Test",
      content: null,
      status: "PUBLISHED",
    });

    expect(createAiJobMock).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      documentId: "doc-1",
      requestedById: "user-1",
      revisionId: null,
      type: "EMBEDDING",
    });
    expect(enqueueEmbeddingJobMock).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      documentId: "doc-1",
      revisionId: null,
      jobId: "ai-job-1",
      type: "EMBEDDING",
    });
  });

  it("does not enqueue embedding job when document stays in draft status", async () => {
    prismaDocumentMock.create.mockResolvedValue({
      id: "doc-1",
      status: "DRAFT",
    });

    await documentService.createDocument("workspace-1", "user-1", {
      title: "Test",
      content: null,
      status: "DRAFT",
    });

    expect(enqueueEmbeddingJobMock).not.toHaveBeenCalled();
  });

  it("marks ai job failed when enqueueing to Redis fails", async () => {
    prismaDocumentMock.create.mockResolvedValue({
      id: "doc-1",
      status: "PUBLISHED",
    });
    const error = new Error("redis unavailable");
    enqueueEmbeddingJobMock.mockRejectedValue(error);

    await expect(
      documentService.createDocument("workspace-1", "user-1", {
        title: "Test",
        content: null,
        status: "PUBLISHED",
      })
    ).resolves.toBeDefined();

    expect(markJobFailedMock).toHaveBeenCalledWith("ai-job-1", "redis unavailable");
  });

  it("enqueues embedding job when status changes to published", async () => {
    prismaDocumentMock.findFirst.mockResolvedValueOnce({
      id: "doc-1",
      status: "DRAFT",
    });
    prismaDocumentMock.update.mockResolvedValue({
      id: "doc-1",
      status: "PUBLISHED",
    });

    await documentService.updateDocument(
      "workspace-1",
      "doc-1",
      {
        status: "PUBLISHED",
      },
      "user-2"
    );

    expect(enqueueEmbeddingJobMock).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      documentId: "doc-1",
      revisionId: null,
      jobId: "ai-job-1",
      type: "EMBEDDING",
    });
  });

  it("removes embeddings when status transitions away from published", async () => {
    prismaDocumentMock.findFirst.mockResolvedValueOnce({
      id: "doc-1",
      status: "PUBLISHED",
    });
    prismaDocumentMock.update.mockResolvedValue({
      id: "doc-1",
      status: "DRAFT",
    });

    await documentService.updateDocument("workspace-1", "doc-1", {
      status: "DRAFT",
    });

    expect(deleteDocumentEmbeddingsMock).toHaveBeenCalledWith("doc-1");
  });

  it("removes embeddings when document is deleted", async () => {
    prismaDocumentMock.findFirst.mockResolvedValueOnce({
      id: "doc-1",
      status: "PUBLISHED",
    });
    prismaDocumentMock.delete.mockResolvedValue(undefined);

    await documentService.deleteDocument("workspace-1", "doc-1");

    expect(deleteDocumentEmbeddingsMock).toHaveBeenCalledWith("doc-1");
  });
});
