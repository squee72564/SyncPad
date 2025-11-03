import httpStatus from "http-status";

import prisma from "../lib/prisma.js";
import ApiError from "../utils/ApiError.js";
import type {
  CreateDocumentArgs,
  ListDocumentsQuery,
  UpdateDocumentBody,
} from "@/types/document.ts";
import { Prisma } from "../../prisma/generated/prisma-postgres/index.js";

// Align slug format for uniqueness checks.
const normalizeSlug = (slug?: string) => slug?.trim().toLowerCase();

// Support query params that arrive as either boolean or stringified boolean.
const parseBoolean = (value: boolean | "true" | "false" | undefined) => {
  if (value === undefined) {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return value === "true";
};

// Convert optional ISO strings to Date/null for Prisma writes.
const parsePublishedAt = (value: string | null) => {
  if (value === null) {
    return null;
  }
  return new Date(value);
};

// Validate parent-child relationships stay within the workspace and are not cyclical
const ensureParentDocument = async (
  workspaceId: string,
  parentId: string | null | undefined,
  childId?: string | null | undefined
) => {
  if (!parentId) {
    return;
  }

  const parent = await prisma.document.findFirst({
    where: {
      id: parentId,
      workspaceId,
    },
  });

  if (!parent) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Parent document not found in workspace");
  }

  if (childId && parent.parentId == childId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Parent references cannot be cyclical");
  }
};

// Lookup helper scoped to workspace to avoid leaking cross-workspace ids.
const getDocumentById = async (workspaceId: string, documentId: string) => {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
    },
  });
};

// Return workspace documents filtering by parent/status and optionally omitting content payloads.
const listDocuments = async (workspaceId: string, query?: ListDocumentsQuery) => {
  const where: Prisma.DocumentWhereInput = {
    workspaceId,
  };

  if (query?.status) {
    where.status = query.status;
  }

  if (query?.parentId !== undefined) {
    where.parentId = query.parentId;
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: [{ parentId: "asc" }, { updatedAt: "desc" }],
  });

  const includeContent = parseBoolean(query?.includeContent);

  if (includeContent) {
    return documents;
  }

  return documents.map(({ content: _content, ...document }) => ({
    ...document,
    content: undefined,
  }));
};

// Insert a new document while enforcing parent existence and slug uniqueness.
const createDocument = async (workspaceId: string, userId: string, payload: CreateDocumentArgs) => {
  await ensureParentDocument(workspaceId, payload.parentId ?? null);

  const slug = normalizeSlug(payload.slug);

  const data: Prisma.DocumentUncheckedCreateInput = {
    workspaceId,
    authorId: userId,
    parentId: payload.parentId ?? null,
    title: payload.title,
    headline: payload.headline ?? null,
    summary: payload.summary ?? null,
    status: payload.status ?? "DRAFT",
    content: payload.content ?? null,
    lastEditedAt: new Date(),
  };

  if (slug !== undefined) {
    data.slug = slug;
  }

  if (payload.publishedAt !== undefined) {
    data.publishedAt = payload.publishedAt ? parsePublishedAt(payload.publishedAt) : null;
  }

  try {
    return await prisma.document.create({
      data,
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(httpStatus.CONFLICT, "Document slug must be unique within the workspace");
    }

    throw error;
  }
};

// Apply partial updates to an existing workspace document with hierarchy and slug safeguards.
const updateDocument = async (
  workspaceId: string,
  documentId: string,
  updates: UpdateDocumentBody
) => {
  const existing = await getDocumentById(workspaceId, documentId);

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
  }

  if (updates.parentId !== undefined) {
    if (updates.parentId === existing.id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Document cannot be its own parent");
    }

    await ensureParentDocument(workspaceId, updates.parentId, existing.id);
  }

  const data: Prisma.DocumentUncheckedUpdateInput = {
    lastEditedAt: new Date(),
  };

  if (updates.title !== undefined) {
    data.title = updates.title;
  }

  if (updates.slug !== undefined) {
    const normalizedSlug = normalizeSlug(updates.slug);
    if (normalizedSlug !== undefined) {
      data.slug = normalizedSlug;
    }
  }

  if (updates.headline !== undefined) {
    data.headline = updates.headline ?? null;
  }

  if (updates.summary !== undefined) {
    data.summary = updates.summary ?? null;
  }

  if (updates.parentId !== undefined) {
    data.parentId = updates.parentId ?? null;
  }

  if (updates.status !== undefined) {
    data.status = updates.status;
  }

  if (updates.content !== undefined) {
    data.content = updates.content ?? null;
  }

  if (updates.publishedAt !== undefined) {
    data.publishedAt = updates.publishedAt ? parsePublishedAt(updates.publishedAt) : null;
  }

  try {
    return await prisma.document.update({
      where: { id: documentId },
      data,
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(httpStatus.CONFLICT, "Document slug must be unique within the workspace");
    }

    throw error;
  }
};

// Delete a document once confirmed to belong to the workspace.
const deleteDocument = async (workspaceId: string, documentId: string) => {
  const existing = await getDocumentById(workspaceId, documentId);

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
  }

  await prisma.document.delete({
    where: {
      id: documentId,
    },
  });
};

export default {
  listDocuments,
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
};
