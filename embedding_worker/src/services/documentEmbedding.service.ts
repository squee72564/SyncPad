import prisma from "@/lib/prisma.ts";

const createDocumentEmbedding = async (
  documentId: string,
  workspaceId: string,
  chunkText: string,
  embeddingVector: string
) => {
  return prisma.$queryRaw`
      INSERT INTO document_embedding (document_id, workspace_id, content, embedding)
      VALUES (${documentId}, ${workspaceId}, ${chunkText}, ${embeddingVector}::vector)
      RETURNING *
    `;
};

export default { createDocumentEmbedding };
