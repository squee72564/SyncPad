import prisma from "../lib/prisma.js";

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
