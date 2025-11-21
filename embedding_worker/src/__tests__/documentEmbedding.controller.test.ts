import { describe, expect, it, vi, beforeEach } from "vitest";
import { storeDocumentEmbeddings } from "@/controllers/documentEmbedding.controller.ts";
import { documentEmbeddingService } from "@/services/index.ts";

vi.mock("@/services/index.ts", () => {
  const replaceDocumentEmbeddings = vi.fn();
  return {
    documentEmbeddingService: {
      replaceDocumentEmbeddings,
    },
  };
});

const replaceMock = documentEmbeddingService.replaceDocumentEmbeddings as unknown as ReturnType<
  typeof vi.fn
>;

describe("documentEmbedding.controller", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it("filters invalid chunks and stores embeddings", async () => {
    replaceMock.mockResolvedValue(1);

    const result = await storeDocumentEmbeddings(
      "doc-1",
      "workspace-1",
      [
        { chunkText: "  valid chunk ", embeddingVector: [1, 2, 3] },
        { chunkText: "   ", embeddingVector: [4, 5, 6] },
        { chunkText: "ignored", embeddingVector: [] },
      ],
      "rev-1"
    );

    expect(replaceMock).toHaveBeenCalledWith(
      "doc-1",
      "workspace-1",
      [{ chunkText: "valid chunk", vector: "[1,2,3]" }],
      "rev-1"
    );
    expect(result).toBe(1);
  });

  it("throws when embedding vector contains non-finite values", async () => {
    await expect(
      storeDocumentEmbeddings("doc", "workspace", [
        { chunkText: "text", embeddingVector: [1, NaN] },
      ])
    ).rejects.toThrow("Embedding vector contains non-finite number");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("wraps errors from the service layer", async () => {
    replaceMock.mockRejectedValue(new Error("db failure"));

    await expect(
      storeDocumentEmbeddings("doc", "workspace", [{ chunkText: "text", embeddingVector: [1, 2] }])
    ).rejects.toThrow("Failed to store document embeddings: db failure");
  });
});
