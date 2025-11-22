import prisma from "@syncpad/prisma-client";

const deleteDocumentEmbeddings = async (documentId: string, revisionId?: string) => {
  return prisma.documentEmbedding.deleteMany({
    where: {
      documentId,
      ...(revisionId ? { revisionId } : {}),
    },
  });
};

export default {
  deleteDocumentEmbeddings,
};
