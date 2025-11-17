"use server";

import { revalidatePath } from "next/cache";

import {
  createActivityLog,
  deleteActivityLog,
  CreateActivityLogPayload,
  ActivityLogRecord,
} from "@/lib/activity-log";

import { ActionResult, formatError } from "@/lib/utils";

const ACTIVITY_LOG_PATH = "/dashboard/activity";

export const createActivityLogAction = async (
  workspaceId: string,
  payload: CreateActivityLogPayload
): Promise<ActionResult<ActivityLogRecord>> => {
  try {
    const data = await createActivityLog(workspaceId, payload);

    revalidatePath(ACTIVITY_LOG_PATH);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to create Activity Log"),
    };
  }
};

export const deleteActivityLogAction = async (
  workspaceId: string,
  activityLogId: string
): Promise<ActionResult> => {
  try {
    await deleteActivityLog(workspaceId, activityLogId);

    revalidatePath(ACTIVITY_LOG_PATH);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to delete Activity Log"),
    };
  }
};
