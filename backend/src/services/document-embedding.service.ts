import { ListDocumentEmbeddingArgs } from "@/types/document-embedding.types.ts";
import { buildPaginationParams, paginateItems } from "@/utils/pagination.ts";
import Prisma, { Prisma as PrismaNamespace } from "@generated/prisma-postgres/index.js";
import prisma from "@syncpad/prisma-client";

const deleteDocumentEmbeddings = async (documentId: string, revisionId?: string) => {
  return prisma.documentEmbedding.deleteMany({
    where: {
      documentId,
      ...(revisionId ? { revisionId } : {}),
    },
  });
};

const listDocumentEmbeddings = async (args: ListDocumentEmbeddingArgs) => {
  const pagination = buildPaginationParams({ cursor: args?.cursor, limit: args?.limit });

  let cursorRow: { createdAt: Date; id: string } | null = null;

  if (args.cursor) {
    cursorRow = await prisma.documentEmbedding.findUnique({
      where: { id: args.cursor },
      select: { createdAt: true, id: true },
    });
    if (!cursorRow) {
      return { documentEmbeddings: [], nextCursor: null };
    }
  }

  const rows = await prisma.$queryRaw<
    Array<
      Pick<
        Prisma.DocumentEmbedding,
        "id" | "documentId" | "workspaceId" | "revisionId" | "chunkId" | "content"
      > & { embedding: number[] }
    >
  >(PrismaNamespace.sql`
      SELECT "id", "documentId", "workspaceId", "revisionId", "chunkId", "content", embedding::float4[] AS embedding
      FROM "document_embedding"
      WHERE "workspaceId" = ${args.workspaceId}
        ${args.documentId ? PrismaNamespace.sql`AND "documentId" = ${args.documentId}` : PrismaNamespace.empty}
        ${
          cursorRow
            ? PrismaNamespace.sql`AND ("createdAt", "id") < (${cursorRow.createdAt}, ${cursorRow.id})`
            : PrismaNamespace.empty
        }
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT ${pagination.take}
    `);

  const { items, nextCursor } = paginateItems(rows, pagination.limit);

  return {
    documentEmbeddings: items,
    nextCursor,
  };
};

export default {
  deleteDocumentEmbeddings,
  listDocumentEmbeddings,
};
