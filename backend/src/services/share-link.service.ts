import crypto from "node:crypto";
import httpStatus from "http-status";

import env from "@/config/index.js";
import prisma from "@syncpad/prisma-client";
import { DocumentShareLink, Prisma, SharePermission } from "@generated/prisma-postgres/index.js";
import ApiError from "@/utils/ApiError.ts";
import { ListShareLinksArgs } from "@/types/share-link.types.ts";
import { buildPaginationParams, paginateItems } from "@/utils/pagination.ts";

const SHARE_LINK_TOKEN_LENGTH = 32;

const generateShareLinkToken = () => crypto.randomBytes(SHARE_LINK_TOKEN_LENGTH).toString("hex");

export const buildShareLinkUrl = (token: string) => {
  const url = new URL(`/share-links/${token}`, env.NEXT_APP_BASE_URL);
  return url.toString();
};

const serializeShareLink = (
  link: DocumentShareLink & { createdBy: { email: string; name: string; id: string } | null }
) => ({
  id: link.id,
  permission: link.permission,
  expiresAt: link.expiresAt,
  createdAt: link.createdAt,
  createdBy: link.createdBy,
  url: buildShareLinkUrl(link.token),
});

const ensureDocumentBelongsToWorkspace = async (workspaceId: string, documentId: string) => {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
    },
    select: { id: true },
  });

  if (!document) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found in workspace");
  }
};

const listShareLinks = async (args: ListShareLinksArgs) => {
  await ensureDocumentBelongsToWorkspace(args.workspaceId, args.documentId);

  const pagination = buildPaginationParams({ cursor: args.cursor, limit: args.limit });

  const shareLinks = await prisma.documentShareLink.findMany({
    where: { workspaceId: args.workspaceId, documentId: args.documentId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: pagination.take,
    ...(pagination.cursor ? { cursor: pagination.cursor, skip: pagination.skip } : {}),
  });

  const shareLinksSerialized = shareLinks.map(serializeShareLink);

  const { items, nextCursor } = paginateItems(shareLinksSerialized, pagination.limit);

  return {
    shareLinks: items,
    nextCursor,
  };
};

const createShareLink = async (
  workspaceId: string,
  documentId: string,
  permission: SharePermission,
  expiresAt: Date | null,
  createdById?: string
) => {
  await ensureDocumentBelongsToWorkspace(workspaceId, documentId);

  const data = {
    workspaceId,
    documentId,
    permission,
    expiresAt,
    createdById: createdById ?? null,
    token: generateShareLinkToken(),
  };

  try {
    const shareLink = await prisma.documentShareLink.create({
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return serializeShareLink(shareLink);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      data.token = generateShareLinkToken();
      const shareLink = await prisma.documentShareLink.create({
        data,
        include: { createdBy: { select: { id: true, name: true, email: true } } },
      });
      return serializeShareLink(shareLink);
    }
    throw error;
  }
};

const ensureShareLinkBelongsToDocument = async (
  workspaceId: string,
  documentId: string,
  shareLinkId: string
) => {
  const shareLink = await prisma.documentShareLink.findFirst({
    where: { id: shareLinkId, workspaceId, documentId },
  });

  if (!shareLink) {
    throw new ApiError(httpStatus.NOT_FOUND, "Share link not found");
  }

  return shareLink;
};

const updateShareLink = async (
  workspaceId: string,
  documentId: string,
  shareLinkId: string,
  updates: {
    permission?: "VIEW" | "COMMENT" | "EDIT" | undefined;
    expiresAt?: Date | null | undefined;
    regenerateToken?: boolean | undefined;
  }
) => {
  await ensureDocumentBelongsToWorkspace(workspaceId, documentId);
  await ensureShareLinkBelongsToDocument(workspaceId, documentId, shareLinkId);

  const data: {
    permission?: SharePermission;
    expiresAt?: Date | null;
    token?: string;
  } = {};

  if (updates.permission !== undefined) {
    data.permission = updates.permission;
  }

  if (updates.expiresAt !== undefined) {
    data.expiresAt = updates.expiresAt;
  }

  if (updates.regenerateToken) {
    data.token = generateShareLinkToken();
  }

  const shareLink = await prisma.documentShareLink.update({
    where: { id: shareLinkId },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return serializeShareLink(shareLink);
};

const deleteShareLink = async (workspaceId: string, documentId: string, shareLinkId: string) => {
  await ensureDocumentBelongsToWorkspace(workspaceId, documentId);
  await ensureShareLinkBelongsToDocument(workspaceId, documentId, shareLinkId);

  await prisma.documentShareLink.delete({
    where: { id: shareLinkId },
  });
};

const getShareLinkByToken = async (token: string) => {
  return prisma.documentShareLink.findFirst({
    where: {
      token,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          workspaceId: true,
        },
      },
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
};

export default {
  listShareLinks,
  createShareLink,
  updateShareLink,
  deleteShareLink,
  getShareLinkByToken,
};
