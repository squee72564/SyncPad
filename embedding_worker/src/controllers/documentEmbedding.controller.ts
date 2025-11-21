import { documentEmbeddingService } from "@/services/index.ts";

export type ChunkEmbeddingPayload = {
  chunkText: string;
  embeddingVector: number[];
};

const toPgVector = (embeddingVector: number[]): string => {
  const normalized = embeddingVector
    .map((value) => {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) {
        throw new Error("Embedding vector contains non-finite number");
      }
      return numberValue;
    })
    .join(",");

  if (!normalized.length) {
    throw new Error("Embedding vector is empty");
  }

  return `[${normalized}]`;
};

export const storeDocumentEmbeddings = async (
  documentId: string,
  workspaceId: string,
  chunks: ChunkEmbeddingPayload[],
  revisionId?: string
): Promise<number> => {
  const validChunks = chunks
    .map((chunk) => {
      const chunkText = chunk.chunkText.trim();
      if (!chunkText.length || !chunk.embeddingVector?.length) {
        return null;
      }

      return {
        chunkText,
        vector: toPgVector(chunk.embeddingVector),
      };
    })
    .filter((chunk): chunk is { chunkText: string; vector: string } => Boolean(chunk));

  try {
    return await documentEmbeddingService.replaceDocumentEmbeddings(
      documentId,
      workspaceId,
      validChunks,
      revisionId
    );
  } catch (error) {
    throw new Error(
      `Failed to store document embeddings: ${error instanceof Error ? error.message : error}`
    );
  }
};

export default {
  storeDocumentEmbeddings,
};
