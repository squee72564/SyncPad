"use server";

import { revalidatePaths } from "@/lib/api-client";
import {
  createAiChatThread,
  deleteAiChatThread,
  listAiChatThreads,
  updateAiChatThread,
  AiChatThreadRecord,
} from "@/lib/ai-chat-thread";
import { formatError } from "@/lib/utils";
import { ActionResult, PaginatedResult } from "@/lib/types";
import { resolveActiveWorkspace } from "@/lib/workspaces";

const QA_PATH = "/dashboard/ai/qa";

async function ensureWorkspace() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    throw new Error("Select a workspace before managing chat threads.");
  }

  return activeWorkspace.workspace;
}

export async function createAiChatThreadAction(input: {
  title?: string | null;
}): Promise<ActionResult<{ thread: AiChatThreadRecord }>> {
  let workspace;

  try {
    workspace = await ensureWorkspace();
  } catch (error) {
    return { success: false, error: formatError(error, "Select a workspace first") };
  }

  const title = input.title?.trim();

  try {
    const thread = await createAiChatThread(workspace.id, workspace.slug, {
      title: title && title.length > 0 ? title : null,
    });

    await revalidatePaths([QA_PATH]);

    return { success: true, data: { thread } };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to create chat thread") };
  }
}

export async function updateAiChatThreadAction(input: {
  threadId: string;
  title?: string | null;
}): Promise<ActionResult<{ thread: AiChatThreadRecord }>> {
  let workspace;

  try {
    workspace = await ensureWorkspace();
  } catch (error) {
    return { success: false, error: formatError(error, "Select a workspace first") };
  }

  const title = input.title?.trim() ?? null;

  try {
    const thread = await updateAiChatThread(workspace.id, workspace.slug, input.threadId, {
      title,
    });
    await revalidatePaths([QA_PATH, `${QA_PATH}/${input.threadId}`]);
    return { success: true, data: { thread } };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to update chat thread") };
  }
}

export async function deleteAiChatThreadAction(threadId: string): Promise<ActionResult> {
  let workspace;

  try {
    workspace = await ensureWorkspace();
  } catch (error) {
    return { success: false, error: formatError(error, "Select a workspace first") };
  }

  try {
    await deleteAiChatThread(workspace.id, workspace.slug, threadId);
    await revalidatePaths([QA_PATH]);
    return { success: true };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to delete chat thread") };
  }
}

export async function loadAiChatThreadsAction(params: {
  cursor?: string;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<AiChatThreadRecord>>> {
  let workspace;

  try {
    workspace = await ensureWorkspace();
  } catch (error) {
    return { success: false, error: formatError(error, "Select a workspace first") };
  }

  try {
    const data = await listAiChatThreads(workspace.id, workspace.slug, params);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to load chat threads") };
  }
}
