"use server";

import { revalidatePath } from "next/cache";

import {
  createActivityLog,
  deleteActivityLog,
  CreateActivityLogPayload,
  ActivityLogRecord,
  listActivityLogs,
  ListActivityLogsParams,
} from "@/lib/activity-log";

import { formatError } from "@/lib/utils";
import { ActionResult, PaginatedResult } from "@/lib/types";

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

export const loadActivityLogsAction = async (
  workspaceId: string,
  params: ListActivityLogsParams
): Promise<ActionResult<PaginatedResult<ActivityLogRecord>>> => {
  try {
    const result = await listActivityLogs(workspaceId, params);

    return {
      success: true,
      data: {
        data: result.data,
        nextCursor: result.nextCursor,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to load more activity"),
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
