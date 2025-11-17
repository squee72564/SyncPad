"use server";

import {
  createDocument,
  deleteDocument,
  updateDocument,
  saveDocumentCollabState,
} from "@/lib/documents";
import { resolveActiveWorkspace } from "@/lib/workspaces";

export type CreateDocumentInput = {
  title: string;
  slug?: string;
  headline?: string | null;
  summary?: string | null;
  parentId?: string | null;
  status?: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  content?: unknown;
  publishedAt?: string;
};

import { ActionResult, formatError } from "@/lib/utils";
import { revalidatePaths } from "@/lib/api-client";

export type DocumentActionResult = ActionResult<{ documentId: string }>;

type CollabStateActionResult = ActionResult<{ version: number }>;

function sanitizeSlug(slug?: string | null) {
  if (slug === null) {
    return undefined;
  }

  const next = slug?.trim().toLowerCase();
  return next && next.length > 0 ? next : undefined;
}

function sanitizeNullable(value: string | null | undefined) {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ensureWorkspace() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    throw new Error("Select a workspace before managing documents.");
  }

  return activeWorkspace.workspace;
}

export async function createDocumentAction(
  input: CreateDocumentInput
): Promise<DocumentActionResult> {
  let workspace;
  try {
    workspace = await ensureWorkspace();
  } catch (error) {
    return { success: false, error: formatError(error, "Select a workspace first") };
  }

  const title = input.title?.trim();
  if (!title) {
    return { success: false, error: "Document title is required" };
  }

  const payload: {
    title: string;
    slug?: string;
    headline?: string;
    summary?: string;
    parentId?: string | null;
    status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
    content?: unknown;
    publishedAt?: string;
  } = {
    title,
    status: input.status ?? "DRAFT",
  };

  const slugValue = sanitizeSlug(input.slug);
  if (slugValue) {
    payload.slug = slugValue;
  }

  const headlineValue = input.headline?.trim();
  if (headlineValue) {
    payload.headline = headlineValue;
  }

  const summaryValue = input.summary?.trim();
  if (summaryValue) {
    payload.summary = summaryValue;
  }

  if (input.parentId !== undefined) {
    payload.parentId = input.parentId ? input.parentId : null;
  }

  if (input.content !== undefined) {
    payload.content = input.content;
  }

  if (input.publishedAt !== undefined) {
    payload.publishedAt = input.publishedAt;
  }

  try {
    const document = await createDocument(workspace.id, workspace.slug, payload);

    await revalidatePaths([
      "/dashboard/documents",
      "/dashboard/documents/drafts",
      "/dashboard/documents/published",
      "/dashboard/documents/new",
    ]);

    return { success: true, data: { documentId: document.id } };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to create document") };
  }
}

export type UpdateDocumentInput = {
  documentId: string;
  title?: string;
  slug?: string | null;
  headline?: string | null;
  summary?: string | null;
  parentId?: string | null;
  status?: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  content?: unknown;
  publishedAt?: string | null;
};

export async function updateDocumentAction(
  input: UpdateDocumentInput
): Promise<DocumentActionResult> {
  let workspace;
  try {
    workspace = await ensureWorkspace();
  } catch (error) {
    return { success: false, error: formatError(error, "Select a workspace first") };
  }

  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      return { success: false, error: "Title cannot be empty" };
    }
    payload.title = title;
  }

  if (input.slug !== undefined) {
    payload.slug = sanitizeSlug(input.slug);
  }

  if (input.headline !== undefined) {
    payload.headline = sanitizeNullable(input.headline);
  }

  if (input.summary !== undefined) {
    payload.summary = sanitizeNullable(input.summary);
  }

  if (input.parentId !== undefined) {
    payload.parentId = input.parentId ? input.parentId : null;
  }

  if (input.status !== undefined) {
    payload.status = input.status;
  }

  if (input.content !== undefined) {
    payload.content = input.content;
  }

  if (input.publishedAt !== undefined) {
    payload.publishedAt = input.publishedAt;
  }

  if (Object.keys(payload).length === 0) {
    return { success: false, error: "Provide at least one field to update." };
  }

  try {
    const document = await updateDocument(workspace.id, workspace.slug, input.documentId, payload);

    await revalidatePaths([
      "/dashboard/documents",
      "/dashboard/documents/drafts",
      "/dashboard/documents/published",
      "/dashboard/documents/new",
    ]);

    return { success: true, data: { documentId: document.id } };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to update document") };
  }
}

export async function saveDocumentCollabStateAction(input: {
  documentId: string;
  snapshot: unknown;
  version?: number;
}): Promise<CollabStateActionResult> {
  let workspace;
  try {
    workspace = await ensureWorkspace();
  } catch (error) {
    return { success: false, error: formatError(error, "Select a workspace first") };
  }

  if (!input.documentId) {
    return { success: false, error: "Document id is required" };
  }

  try {
    const collabState = await saveDocumentCollabState(workspace.id, workspace.slug, input);

    return { success: true, data: { version: collabState.version } };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to save document") };
  }
}

export async function deleteDocumentAction(documentId: string): Promise<DocumentActionResult> {
  let workspace;
  try {
    workspace = await ensureWorkspace();
  } catch (error) {
    return { success: false, error: formatError(error, "Select a workspace first") };
  }

  try {
    await deleteDocument(workspace.id, workspace.slug, documentId);

    await revalidatePaths([
      "/dashboard/documents",
      "/dashboard/documents/drafts",
      "/dashboard/documents/published",
      "/dashboard/documents/new",
    ]);

    return { success: true, data: { documentId } };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to delete document") };
  }
}
