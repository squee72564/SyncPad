import prisma from "@syncpad/prisma-client";

type EmbeddingRecord = {
  chunkText: string;
  vector: string;
};

const deleteEmbeddingsForDocument = async (documentId: string, revisionId?: string) => {
  return prisma.documentEmbedding.deleteMany({
    where: {
      documentId,
      ...(revisionId ? { revisionId } : {}),
    },
  });
};

const replaceDocumentEmbeddings = async (
  documentId: string,
  workspaceId: string,
  records: EmbeddingRecord[],
  revisionId?: string
): Promise<number> => {
  return prisma.$transaction(async (tx) => {
    await tx.documentEmbedding.deleteMany({
      where: {
        documentId,
        ...(revisionId ? { revisionId } : {}),
      },
    });

    if (!records.length) {
      return 0;
    }

    for (const record of records) {
      await tx.$queryRaw`
        INSERT INTO document_embedding (document_id, workspace_id, revision_id, content, embedding)
        VALUES (${documentId}, ${workspaceId}, ${revisionId ?? null}, ${record.chunkText}, ${record.vector}::vector)
      `;
    }

    return records.length;
  });
};

export default {
  replaceDocumentEmbeddings,
  deleteEmbeddingsForDocument,
};
