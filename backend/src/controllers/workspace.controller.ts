import type { NextFunction, Response } from "express";
import httpStatus from "http-status";

import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";
import workspaceService from "../services/workspace.service.js";
import {
  CreateWorkspaceArgs,
  CreateWorkspaceRequest,
  DeleteWorkspaceRequest,
  GetWorkspaceRequest,
  ListWorkspacesArgs,
  ListWorkspacesRequest,
  UpdateWorkspaceBody,
  UpdateWorkspaceRequest,
} from "../types/workspace.ts";

const listWorkspaces = catchAsync(
  async (req: ListWorkspacesRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const query: ListWorkspacesArgs | undefined = req.query;
    const workspaces = await workspaceService.listUserWorkspaces(userId, query);

    const includeMembership =
      req.query?.includeMembership === true || req.query?.includeMembership === "true";

    const payload = includeMembership
      ? workspaces
      : workspaces.map(({ workspace, effectiveRole }) => ({
          workspace,
          effectiveRole,
        }));

    res.status(httpStatus.OK).json({ workspaces: payload });
  }
);

const createWorkspace = catchAsync(
  async (req: CreateWorkspaceRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const args: CreateWorkspaceArgs = req.body;
    const workspace = await workspaceService.createWorkspace(args, userId);
    res.status(httpStatus.CREATED).json(workspace);
  }
);

const getWorkspace = catchAsync(
  async (req: GetWorkspaceRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    res.status(httpStatus.OK).json({
      workspace: context.workspace,
      membership: context.membership,
      effectiveRole: context.effectiveRole,
      permissions: context.permissions,
    });
  }
);

const updateWorkspace = catchAsync(
  async (req: UpdateWorkspaceRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const updates = req.body as UpdateWorkspaceBody;
    const workspace = await workspaceService.updateWorkspace(context.workspace.id, updates);
    res.status(httpStatus.OK).json({ workspace });
  }
);

const deleteWorkspace = catchAsync(
  async (req: DeleteWorkspaceRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    await workspaceService.deleteWorkspace(context.workspace.id);
    res.status(httpStatus.NO_CONTENT).send();
  }
);

export default {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
