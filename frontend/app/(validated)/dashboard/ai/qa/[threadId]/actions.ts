"use server";

import { revalidatePaths } from "@/lib/api-client";
import { AiChatMessageRecord, listAiChatMessages, runRagQuery } from "@/lib/ai-chat-message";
import { formatError } from "@/lib/utils";
import { ActionResult, PaginatedResult } from "@/lib/types";
import { resolveActiveWorkspace } from "@/lib/workspaces";

const THREAD_PATH = "/dashboard/ai/qa";

async function ensureWorkspace() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    throw new Error("Select a workspace before chatting.");
  }

  return activeWorkspace.workspace;
}

export async function loadAiChatMessagesAction(input: {
  threadId: string;
  cursor?: string;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<AiChatMessageRecord>>> {
  let workspace;

  try {
    workspace = await ensureWorkspace();
  } catch (error) {
    return { success: false, error: formatError(error, "Select a workspace first") };
  }

  try {
    const data = await listAiChatMessages(
      workspace.id,
      workspace.slug,
      input.threadId,
      input.limit ? { cursor: input.cursor, limit: input.limit } : { cursor: input.cursor }
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to load messages") };
  }
}

export async function sendQaMessageAction(input: {
  threadId: string;
  query: string;
}): Promise<ActionResult<{ assistantResponse?: string }>> {
  let workspace;

  try {
    workspace = await ensureWorkspace();
  } catch (error) {
    return { success: false, error: formatError(error, "Select a workspace first") };
  }

  const trimmedQuery = input.query.trim();
  if (!trimmedQuery) {
    return { success: false, error: "Ask a question to start the chat." };
  }

  try {
    const result = await runRagQuery(workspace.id, workspace.slug, input.threadId, trimmedQuery);

    await revalidatePaths([`${THREAD_PATH}/${input.threadId}`]);

    if (!result.success) {
      if (result.type === "Agent") {
        return {
          success: true,
          data: { assistantResponse: result.error ?? "I am unable to process your request." },
        };
      }

      return {
        success: false,
        error: result.error ?? "Unable to process your request.",
      };
    }

    return {
      success: true,
      data: { assistantResponse: result.data },
    };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to send message") };
  }
}
