import { describe, expect, it, vi, beforeEach } from "vitest";
import documentEmbeddingService from "@/services/documentEmbedding.service.ts";
import prisma from "@syncpad/prisma-client";

vi.mock("@/lib/prisma.ts", () => {
  const deleteMany = vi.fn();
  const $queryRaw = vi.fn();
  const $transaction = vi.fn((callback: (tx: unknown) => Promise<unknown>) =>
    callback({ documentEmbedding: { deleteMany }, $queryRaw })
  );

  return {
    default: {
      documentEmbedding: { deleteMany },
      $queryRaw,
      $transaction,
    },
  };
});

const prismaMock = prisma as unknown as {
  documentEmbedding: { deleteMany: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
  $transaction: ReturnType<typeof vi.fn>;
};

describe("documentEmbedding.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes embeddings for a document optionally scoped to revision", async () => {
    await documentEmbeddingService.deleteEmbeddingsForDocument("doc-1", "rev-1");
    expect(prismaMock.documentEmbedding.deleteMany).toHaveBeenCalledWith({
      where: {
        documentId: "doc-1",
        revisionId: "rev-1",
      },
    });
  });

  it("replaces embeddings transactionally", async () => {
    prismaMock.$queryRaw.mockResolvedValue(undefined);
    const count = await documentEmbeddingService.replaceDocumentEmbeddings(
      "doc-1",
      "workspace-1",
      [{ chunkText: "c1", vector: "[1,2,3]" }],
      "rev-1"
    );

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(count).toBe(1);
  });

  it("short circuits when there are no records", async () => {
    const count = await documentEmbeddingService.replaceDocumentEmbeddings(
      "doc-1",
      "workspace-1",
      []
    );
    expect(count).toBe(0);
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });
});
