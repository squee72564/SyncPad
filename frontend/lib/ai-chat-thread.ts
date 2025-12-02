"use server";

import { authorizedFetch } from "./api-client";
import { PaginatedResult } from "./types";
import { readActiveWorkspaceSelection } from "./workspaces";
import Prisma from "@generated/prisma-postgres";

export type AiChatThreadRecord = Prisma.RagChatThread;

export type ListAiChatThreadOptions = {
  cursor?: string;
  limit?: number;
};

export type CreateAiChatThreadPayload = {
  title?: string | null;
};

export type UpdateAiChatThreadPayload = {
  title?: string | null;
};

async function workspacePath(workspaceId?: string, workspaceSlug?: string) {
  if (workspaceSlug) return workspaceSlug;
  if (workspaceId) return workspaceId;

  const selection = await readActiveWorkspaceSelection();

  if (selection?.workspaceSlug) return selection.workspaceSlug;
  if (selection?.workspaceId) return selection.workspaceId;

  throw new Error("Select a workspace before managing chat threads.");
}

export async function listAiChatThreads(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  options: ListAiChatThreadOptions = {}
): Promise<PaginatedResult<AiChatThreadRecord>> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const query = new URLSearchParams();

  if (options.cursor) query.set("cursor", options.cursor);
  if (options.limit) query.set("limit", String(options.limit));

  const response = await authorizedFetch(
    `/v1/workspaces/${identifier}/thread${query.size ? `?${query.toString()}` : ""}`
  );

  return (await response.json()) as PaginatedResult<AiChatThreadRecord>;
}

export async function createAiChatThread(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  payload: CreateAiChatThreadPayload
): Promise<AiChatThreadRecord> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const response = await authorizedFetch(`/v1/workspaces/${identifier}/thread`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as AiChatThreadRecord;
}

export async function getAiChatThread(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  threadId: string
): Promise<AiChatThreadRecord> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const response = await authorizedFetch(`/v1/workspaces/${identifier}/thread/${threadId}`);

  return (await response.json()) as AiChatThreadRecord;
}

export async function updateAiChatThread(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  threadId: string,
  payload: UpdateAiChatThreadPayload
): Promise<AiChatThreadRecord> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const response = await authorizedFetch(`/v1/workspaces/${identifier}/thread/${threadId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as AiChatThreadRecord;
}

export async function deleteAiChatThread(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  threadId: string
) {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  await authorizedFetch(`/v1/workspaces/${identifier}/thread/${threadId}`, {
    method: "DELETE",
  });
}
