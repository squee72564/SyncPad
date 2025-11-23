import type { Response, NextFunction } from "express";
import httpStatus from "http-status";

import { aiJobService } from "@/services/index.ts";

import ApiError from "@/utils/ApiError.js";
import catchAsync from "@/utils/catchAsync.js";

import { GetAiJobsRequest, GetAiJobRequest } from "@/types/ai-job.types.ts";

const listAiJobs = catchAsync(async (req: GetAiJobsRequest, res: Response, _next: NextFunction) => {
  const context = req.workspaceContext;

  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (!context || context.workspace.id !== req.params.workspaceId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
  }

  const result = await aiJobService.listAiJobs(context.workspace.id);

  res.status(httpStatus.OK).json(result);
});

const listAiJob = catchAsync(async (req: GetAiJobRequest, res: Response, _next: NextFunction) => {
  const context = req.workspaceContext;

  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (!context || context.workspace.id !== req.params.workspaceId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
  }

  const result = await aiJobService.listAiJob(req.params.aiJobId, context.workspace.id);

  res.status(httpStatus.OK).json(result);
});

export default {
  listAiJobs,
  listAiJob,
};
