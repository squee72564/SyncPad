import { documentEmbeddingService } from "@/services/index.ts";

export const storeDocumentEmbedding = async (
  documentId: string,
  workspaceId: string,
  chunkText: string,
  embeddingVector: number[]
) => {
  const vector = `[${embeddingVector.join(",")}]`;

  try {
    return await documentEmbeddingService.createDocumentEmbedding(
      documentId,
      workspaceId,
      chunkText,
      vector
    );
  } catch (error) {
    throw new Error(`Failed to store document embedding: ${error}`);
  }
};

export default {
  storeDocumentEmbedding,
};
