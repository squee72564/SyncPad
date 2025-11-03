"use server";

import { authorizedFetch } from "./api-client";
import { readActiveWorkspaceSelection } from "./workspaces";

export type DocumentRecord = {
  id: string;
  workspaceId: string;
  authorId: string | null;
  parentId: string | null;
  title: string;
  slug: string | null;
  headline: string | null;
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  searchText: string | null;
  summary: string | null;
  content: unknown;
  publishedAt: string | null;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
};

type DocumentListResponse = {
  documents: DocumentRecord[];
};

type DocumentResponse = {
  document: DocumentRecord;
};

export type ListDocumentsOptions = {
  parentId?: string;
  status?: DocumentRecord["status"];
  includeContent?: boolean;
};

type CreateDocumentPayload = {
  title: string;
  slug?: string;
  headline?: string | null;
  summary?: string | null;
  parentId?: string | null;
  status?: DocumentRecord["status"];
  content?: unknown;
  publishedAt?: string | null;
};

type UpdateDocumentPayload = Partial<CreateDocumentPayload>;

async function workspacePath(workspaceId: string | undefined, workspaceSlug: string | undefined) {
  if (workspaceSlug) {
    return workspaceSlug;
  }

  if (workspaceId) {
    return workspaceId;
  }

  const selection = await readActiveWorkspaceSelection();

  if (selection?.workspaceSlug) {
    return selection.workspaceSlug;
  }

  if (selection?.workspaceId) {
    return selection.workspaceId;
  }

  throw new Error("Select a workspace before managing documents.");
}

export async function listDocuments(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  options: ListDocumentsOptions = {}
): Promise<DocumentRecord[]> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const query = new URLSearchParams();

  if (options.parentId) {
    query.set("parentId", options.parentId);
  }

  if (options.status) {
    query.set("status", options.status);
  }

  if (options.includeContent) {
    query.set("includeContent", "true");
  }

  const response = await authorizedFetch(
    `/v1/workspaces/${identifier}/documents${query.size > 0 ? `?${query.toString()}` : ""}`
  );

  const data = (await response.json()) as DocumentListResponse;
  return data.documents;
}

export async function createDocument(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  payload: CreateDocumentPayload
): Promise<DocumentRecord> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const response = await authorizedFetch(`/v1/workspaces/${identifier}/documents`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as DocumentResponse;
  return data.document;
}

export async function getDocument(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  documentId: string
): Promise<DocumentRecord> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const response = await authorizedFetch(`/v1/workspaces/${identifier}/documents/${documentId}`);

  const data = (await response.json()) as DocumentResponse;
  return data.document;
}

export async function updateDocument(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  documentId: string,
  payload: UpdateDocumentPayload
): Promise<DocumentRecord> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const response = await authorizedFetch(`/v1/workspaces/${identifier}/documents/${documentId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as DocumentResponse;
  return data.document;
}

export async function deleteDocument(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  documentId: string
) {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  await authorizedFetch(`/v1/workspaces/${identifier}/documents/${documentId}`, {
    method: "DELETE",
  });
}
