import type { Response, NextFunction } from "express";
import httpStatus from "http-status";

import activityLogService from "../services/activity-log.service.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";
import {
  CreateActivityLogRequest,
  DeleteActivityLogRequest,
} from "../types/activity-log.types.ts";

const createActivityLog = catchAsync(
  async (req: CreateActivityLogRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized")
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

    res.status(httpStatus.CREATED).json({ activityLog });
  }
);

const deleteActivityLog = catchAsync(
  async (req: DeleteActivityLogRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized")
    }

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    await activityLogService.deleteActivityLog(context.workspace.id, req.params.activityLogId);

    res.status(httpStatus.NO_CONTENT).send();
  }
);

export default {
  createActivityLog,
  deleteActivityLog,
};
