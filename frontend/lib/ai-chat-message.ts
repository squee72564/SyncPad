"use server";

import { authorizedFetch } from "./api-client";
import { PaginatedResult } from "./types";
import { readActiveWorkspaceSelection } from "./workspaces";
import Prisma from "@generated/prisma-postgres";

export type AiChatMessageRecord = Prisma.RagChatMessage & {
  author?: {
    name: string | null;
    email: string | null;
  } | null;
};

export type ListAiChatMessageOptions = {
  cursor?: string;
  limit?: number;
};

export type UpdateAiChatMessagePayload = Partial<
  Pick<AiChatMessageRecord, "authorId" | "role" | "content" | "error">
>;

export type RagPipelineResult =
  | { success: true; data: string }
  | { success: false; type: "Agent" | "InputGuardrail"; error: string };

async function workspacePath(workspaceId?: string, workspaceSlug?: string) {
  if (workspaceSlug) return workspaceSlug;
  if (workspaceId) return workspaceId;

  const selection = await readActiveWorkspaceSelection();

  if (selection?.workspaceSlug) return selection.workspaceSlug;
  if (selection?.workspaceId) return selection.workspaceId;

  throw new Error("Select a workspace before managing chat messages.");
}

export async function listAiChatMessages(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  threadId: string,
  options: ListAiChatMessageOptions = {}
): Promise<PaginatedResult<AiChatMessageRecord>> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const query = new URLSearchParams();

  if (options.cursor) query.set("cursor", options.cursor);
  if (options.limit) query.set("limit", String(options.limit));

  const response = await authorizedFetch(
    `/v1/workspaces/${identifier}/thread/${threadId}/message${query.size ? `?${query.toString()}` : ""}`
  );

  return (await response.json()) as PaginatedResult<AiChatMessageRecord>;
}

export async function getAiChatMessage(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  threadId: string,
  messageId: string
): Promise<AiChatMessageRecord> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const response = await authorizedFetch(
    `/v1/workspaces/${identifier}/thread/${threadId}/message/${messageId}`
  );

  return (await response.json()) as AiChatMessageRecord;
}

export async function updateAiChatMessage(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  threadId: string,
  messageId: string,
  payload: UpdateAiChatMessagePayload
): Promise<AiChatMessageRecord> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const response = await authorizedFetch(
    `/v1/workspaces/${identifier}/thread/${threadId}/message/${messageId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return (await response.json()) as AiChatMessageRecord;
}

export async function deleteAiChatMessage(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  threadId: string,
  messageId: string
) {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  await authorizedFetch(`/v1/workspaces/${identifier}/thread/${threadId}/message/${messageId}`, {
    method: "DELETE",
  });
}

export async function runRagQuery(
  workspaceId: string | undefined,
  workspaceSlug: string | undefined,
  threadId: string,
  query: string
): Promise<RagPipelineResult> {
  const identifier = await workspacePath(workspaceId, workspaceSlug);
  const response = await authorizedFetch(
    `/v1/workspaces/${identifier}/thread/${threadId}/message`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const data = (await response.json()) as { result: RagPipelineResult };

  return data.result;
}
