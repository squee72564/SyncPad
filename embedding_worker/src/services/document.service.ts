import prisma from "@/lib/prisma.ts";

const getById = async (documentId: string) => {
  return prisma.document.findUnique({
    where: {
      id: documentId,
    },
    select: {
      id: true,
      content: true,
    },
  });
};

export default {
  getById,
};
