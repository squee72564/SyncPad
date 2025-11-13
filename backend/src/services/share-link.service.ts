import crypto from "node:crypto";

import prisma from "../lib/prisma.js";
import { Prisma, SharePermission } from "../../prisma/generated/prisma-postgres/index.js";
import ApiError from "@/utils/ApiError.ts";
import httpStatus from "http-status";

const SHARE_LINK_TOKEN_LENGTH = 32;

const generateShareLinkToken = () => crypto.randomBytes(SHARE_LINK_TOKEN_LENGTH).toString("hex");

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

const listShareLinks = async (workspaceId: string, documentId: string) => {
  await ensureDocumentBelongsToWorkspace(workspaceId, documentId);

  return prisma.documentShareLink.findMany({
    where: { workspaceId, documentId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
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
    return await prisma.documentShareLink.create({
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      data.token = generateShareLinkToken();
      return prisma.documentShareLink.create({
        data,
        include: { createdBy: { select: { id: true, name: true, email: true } } },
      });
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

  return prisma.documentShareLink.update({
    where: { id: shareLinkId },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
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
