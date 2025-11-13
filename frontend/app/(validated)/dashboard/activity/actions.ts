"use server";

import { revalidatePath } from "next/cache";

import {
  createActivityLog,
  deleteActivityLog,
  CreateActivityLogPayload,
  CreateActivityLogRecord
} from "@/lib/activity-log";

const ACTIVITY_LOG_PATH = "/dashboard/activity";

type ActionResult<T = undefined> = { success: true; data?: T } | { success: false; error: string };

const formatError = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const createActivityLogAction = async (
  workspaceId: string,
  payload: CreateActivityLogPayload
): Promise<ActionResult<CreateActivityLogRecord>> => {
  try {
    const data = await createActivityLog(workspaceId, payload);

    revalidatePath(ACTIVITY_LOG_PATH);

    return {
      success: true,
      data
    };

  } catch (error) {

    return {
      success: false,
      error: formatError(error, "Failed to create Activity Log"),
    }
    
  }
}

export const deleteActivityLogAction = async (
  workspaceId: string,
  activityLogId: string,
): Promise<ActionResult> => {
  try {
    await deleteActivityLog(workspaceId, activityLogId);

    revalidatePath(ACTIVITY_LOG_PATH);

    return {
      success: true
    };

  } catch (error) {

    return {
      success: false,
      error: formatError(error, "Failed to delete Activity Log")
    }

  }
}