import prisma from "@syncpad/prisma-client";

const getContentForEmbedding = async (documentId: string, revisionId?: string | null) => {
  if (revisionId) {
    const revision = await prisma.documentRevision.findUnique({
      where: { id: revisionId },
      select: {
        id: true,
        documentId: true,
        content: true,
      },
    });

    if (revision && revision.documentId !== documentId) {
      throw new Error("Revision does not belong to the requested document");
    }

    if (revision) {
      return revision.content;
    }
  }

  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
    },
    select: {
      id: true,
      content: true,
    },
  });

  return document?.content ?? null;
};

export default {
  getContentForEmbedding,
};
