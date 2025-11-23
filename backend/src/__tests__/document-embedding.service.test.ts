import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteManyMock = vi.fn();

vi.mock("@syncpad/prisma-client", () => ({
  __esModule: true,
  default: {
    documentEmbedding: {
      deleteMany: deleteManyMock,
    },
  },
}));

const documentEmbeddingService = (await import("../services/document-embedding.service.js"))
  .default;

describe("document-embedding.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes embeddings for a document", async () => {
    await documentEmbeddingService.deleteDocumentEmbeddings("doc-1");

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        documentId: "doc-1",
      },
    });
  });

  it("scopes deletions by revision when provided", async () => {
    await documentEmbeddingService.deleteDocumentEmbeddings("doc-1", "rev-1");

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        documentId: "doc-1",
        revisionId: "rev-1",
      },
    });
  });
});
