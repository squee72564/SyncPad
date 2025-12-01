import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteManyMock = vi.fn();
const countMock = vi.fn();
const queryRawMock = vi.fn();

vi.mock("@syncpad/prisma-client", () => ({
  __esModule: true,
  default: {
    documentEmbedding: {
      deleteMany: deleteManyMock,
      count: countMock,
    },
    $queryRaw: queryRawMock,
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

  describe("findSimilarDocuments", () => {
    it("returns null when the source document has no embeddings", async () => {
      countMock.mockResolvedValue(0);

      const result = await documentEmbeddingService.findSimilarDocuments({
        workspaceId: "ws-1",
        documentId: "doc-1",
      });

      expect(result).toBeNull();
      expect(queryRawMock).not.toHaveBeenCalled();
    });

    it("returns top results honoring limit", async () => {
      countMock.mockResolvedValue(2);
      queryRawMock.mockResolvedValue([
        { documentId: "doc-2", distance: 0.1 },
        { documentId: "doc-3", distance: 0.2 },
      ]);

      const result = await documentEmbeddingService.findSimilarDocuments({
        workspaceId: "ws-1",
        documentId: "doc-1",
        limit: 1,
      });

      expect(queryRawMock).toHaveBeenCalled();
      expect(result).toEqual({
        similarDocuments: [{ documentId: "doc-2", distance: 0.1 }],
      });
    });
  });
});
