import { createId } from "@paralleldrive/cuid2";
import { randomUUID } from "node:crypto";
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
      const id = createId();
      const chunkId = randomUUID();

      await tx.$executeRaw`
        INSERT INTO "document_embedding" ("id", "documentId", "workspaceId", "revisionId", "chunkId", "content", "embedding")
        VALUES (${id}, ${documentId}, ${workspaceId}, ${revisionId ?? null}, ${chunkId}, ${record.chunkText}, ${record.vector}::vector)
      `;
    }

    return records.length;
  });
};

export default {
  replaceDocumentEmbeddings,
  deleteEmbeddingsForDocument,
};
