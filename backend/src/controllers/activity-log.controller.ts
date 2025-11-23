import type { Response, NextFunction } from "express";
import httpStatus from "http-status";

import activityLogService from "@/services/activity-log.service.js";
import ApiError from "@/utils/ApiError.js";
import catchAsync from "@/utils/catchAsync.js";
import {
  CreateActivityLogRequest,
  DeleteActivityLogRequest,
  ListActivityLogsRequest,
} from "@/types/activity-log.types.ts";

const listActivityLogs = catchAsync(
  async (req: ListActivityLogsRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const result = await activityLogService.listActivityLogs({
      workspaceId: context.workspace.id,
      limit: req.query?.limit,
      cursor: req.query?.cursor,
      documentId: req.query?.documentId,
      actorId: req.query?.actorId,
      event: req.query?.event,
    });

    res.status(httpStatus.OK).json(result);
  }
);

const createActivityLog = catchAsync(
  async (req: CreateActivityLogRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const activityLog = await activityLogService.createActivityLog(context.workspace.id, {
      event: req.body.event,
      metadata: req.body.metadata,
      documentId: req.body.documentId,
      actorId: req.user.id,
    });

    res.status(httpStatus.CREATED).json({ activityLog: activityLog });
  }
);

const deleteActivityLog = catchAsync(
  async (req: DeleteActivityLogRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    await activityLogService.deleteActivityLog(context.workspace.id, req.params.activityLogId);

    res.status(httpStatus.NO_CONTENT).send();
  }
);

export default {
  listActivityLogs,
  createActivityLog,
  deleteActivityLog,
};
