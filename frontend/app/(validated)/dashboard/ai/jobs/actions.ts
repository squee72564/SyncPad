"use server";

import { revalidatePath } from "next/cache";

import { listAiJob, listAiJobs, AiListJobRecord, ListAiJobsParams } from "@/lib/ai-jobs";

import { formatError } from "@/lib/utils";
import { ActionResult, PaginatedResult } from "@/lib/types";

const AI_JOB_PATH = "/dashboard/ai/jobs";

export const loadAiJobsAction = async (
  workspaceId: string,
  params: ListAiJobsParams
): Promise<ActionResult<PaginatedResult<AiListJobRecord>>> => {
  try {
    const result = await listAiJobs(workspaceId, params);

    revalidatePath(AI_JOB_PATH);

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
      error: formatError(error, "Failed to load more Ai Jobs"),
    };
  }
};

export const loadAiJobAction = async (
  workspaceId: string,
  aiJobId: string
): Promise<ActionResult<AiListJobRecord>> => {
  try {
    const data = await listAiJob(workspaceId, aiJobId);

    revalidatePath(AI_JOB_PATH);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to get Ai Job"),
    };
  }
};
