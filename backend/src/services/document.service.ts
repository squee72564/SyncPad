import httpStatus from "http-status";

import prisma from "@syncpad/prisma-client";
import ApiError from "@/utils/ApiError.js";
import type {
  CreateDocumentArgs,
  ListDocumentsQuery,
  UpdateDocumentBody,
} from "@/types/document.types.ts";
import { Prisma, AiJobType } from "../../../prisma/generated/prisma-postgres/index.js";
import { embeddingQueueService, documentEmbeddingService, aiJobService } from "@/services/index.ts";
import logger from "@/config/logger.js";
import { collabSnapshotToPlainText } from "@/utils/collabSerializer.js";

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

const RAG_ELIGIBLE_STATUSES = new Set(["PUBLISHED", "ARCHIVED"]);

const isRagEligibleStatus = (status?: string | null) => {
  if (!status) {
    return false;
  }
  return RAG_ELIGIBLE_STATUSES.has(status);
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === "string" ? error : "Unknown error";
};

const enqueueDocumentEmbeddingJob = async (
  workspaceId: string,
  documentId: string,
  requestedById?: string | null,
  revisionId?: string | null
) => {
  const aiJob = await aiJobService.createAiJob({
    workspaceId,
    documentId,
    revisionId: revisionId ?? null,
    requestedById: requestedById ?? null,
    type: AiJobType.EMBEDDING,
  });

  try {
    await embeddingQueueService.enqueueEmbeddingJob({
      workspaceId,
      documentId,
      revisionId: revisionId ?? null,
      jobId: aiJob.id,
      type: "EMBEDDING",
    });
  } catch (error) {
    const errorMessage = toErrorMessage(error);
    await aiJobService.markJobFailed(aiJob.id, errorMessage);
    logger.error("Failed to enqueue document embedding job", {
      workspaceId,
      documentId,
      error,
    });
  }
};

const removeDocumentEmbeddings = async (documentId: string) => {
  try {
    await documentEmbeddingService.deleteDocumentEmbeddings(documentId);
  } catch (error) {
    logger.error("Failed to delete document embeddings", { documentId, error });
  }
};

const normalizeEmbeddingContent = (content: unknown): string => {
  if (content === null || content === undefined) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  if (typeof content === "object") {
    try {
      return JSON.stringify(content);
    } catch (_error) {
      return "";
    }
  }

  return String(content);
};

const fetchNextRevisionVersion = async (documentId: string) => {
  const latest = await prisma.documentRevision.findFirst({
    where: { documentId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  return (latest?.version ?? 0) + 1;
};

const materializeDocumentForEmbedding = async (
  workspaceId: string,
  documentId: string,
  requestedById?: string | null
) => {
  const [document, collabState, nextVersion] = await Promise.all([
    getDocumentById(workspaceId, documentId),
    getDocumentCollabState(workspaceId, documentId),
    fetchNextRevisionVersion(documentId),
  ]);

  if (!document) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
  }

  // Prefer the collaborative snapshot; fall back to existing content.
  const collabText = collabSnapshotToPlainText(collabState?.snapshot as string | null);
  const embeddingContent = collabText || normalizeEmbeddingContent(document.content);

  const revision = await prisma.$transaction(async (tx) => {
    const createdRevision = await tx.documentRevision.create({
      data: {
        documentId: document.id,
        authorId: requestedById ?? null,
        version: nextVersion,
        content: embeddingContent || Prisma.JsonNull,
      },
    });

    await tx.document.update({
      where: { id: document.id },
      data: {
        content: embeddingContent || Prisma.JsonNull,
        lastEditedAt: new Date(),
      },
    });

    return createdRevision;
  });

  return {
    revisionId: revision.id,
    embeddingContent,
  };
};

const handleEmbeddingStatusTransition = async (
  workspaceId: string,
  documentId: string,
  previousStatus?: string | null,
  nextStatus?: string | null,
  requestedById?: string | null
) => {
  const wasEligible = isRagEligibleStatus(previousStatus);
  const isEligible = isRagEligibleStatus(nextStatus);

  if (!wasEligible && isEligible) {
    const materialized = await materializeDocumentForEmbedding(
      workspaceId,
      documentId,
      requestedById
    );
    await enqueueDocumentEmbeddingJob(
      workspaceId,
      documentId,
      requestedById,
      materialized.revisionId
    );
  } else if (wasEligible && !isEligible) {
    await removeDocumentEmbeddings(documentId);
  }
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

const getDocumentCollabState = async (workspaceId: string, documentId: string) => {
  return prisma.documentCollabState.findFirst({
    where: {
      documentId,
      workspaceId,
    },
  });
};

const upsertDocumentCollabState = async (
  workspaceId: string,
  documentId: string,
  snapshot: Prisma.JsonValue | undefined,
  version?: number
) => {
  return prisma.documentCollabState.upsert({
    where: { documentId },
    update: {
      snapshot: snapshot ?? Prisma.JsonNull,
      version: version !== undefined ? version : { increment: 1 },
      workspaceId,
    },
    create: {
      documentId,
      workspaceId,
      snapshot: snapshot ?? Prisma.JsonNull,
      version: version ?? 1,
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
    const document = await prisma.document.create({
      data,
    });

    await handleEmbeddingStatusTransition(workspaceId, document.id, null, document.status, userId);

    return document;
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
  updates: UpdateDocumentBody,
  requestedById?: string | null
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
    const document = await prisma.document.update({
      where: { id: documentId },
      data,
    });

    await handleEmbeddingStatusTransition(
      workspaceId,
      document.id,
      existing.status,
      document.status,
      requestedById
    );

    return document;
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

  await removeDocumentEmbeddings(documentId);
};

export default {
  listDocuments,
  createDocument,
  getDocumentById,
  getDocumentCollabState,
  upsertDocumentCollabState,
  updateDocument,
  deleteDocument,
};
