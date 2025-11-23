import { describe, expect, it, vi, beforeEach } from "vitest";

const deleteMany = vi.fn();
const executeRaw = vi.fn();
const transaction = vi.fn((callback: (tx: unknown) => Promise<unknown>) =>
  callback({ documentEmbedding: { deleteMany }, $executeRaw: executeRaw })
);

vi.mock("@syncpad/prisma-client", () => ({
  __esModule: true,
  default: {
    documentEmbedding: { deleteMany },
    $executeRaw: executeRaw,
    $transaction: transaction,
  },
}));

const documentEmbeddingService = (await import("@/services/documentEmbedding.service.ts")).default;

describe("documentEmbedding.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes embeddings for a document optionally scoped to revision", async () => {
    await documentEmbeddingService.deleteEmbeddingsForDocument("doc-1", "rev-1");
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        documentId: "doc-1",
        revisionId: "rev-1",
      },
    });
  });

  it("replaces embeddings transactionally", async () => {
    executeRaw.mockResolvedValue(undefined);
    const count = await documentEmbeddingService.replaceDocumentEmbeddings(
      "doc-1",
      "workspace-1",
      [{ chunkText: "c1", vector: "[1,2,3]" }],
      "rev-1"
    );

    expect(transaction).toHaveBeenCalled();
    expect(count).toBe(1);
  });

  it("short circuits when there are no records", async () => {
    const count = await documentEmbeddingService.replaceDocumentEmbeddings(
      "doc-1",
      "workspace-1",
      []
    );
    expect(count).toBe(0);
    expect(executeRaw).not.toHaveBeenCalled();
  });
});
