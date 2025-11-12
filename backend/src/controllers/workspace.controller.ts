import type { NextFunction, Response } from "express";
import httpStatus from "http-status";

import env from "../config/index.js";
import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";
import workspaceService from "../services/workspace.service.js";
import emailService from "../services/email.service.js";
import {
  CreateWorkspaceArgs,
  CreateWorkspaceRequest,
  CreateWorkspaceInviteRequest,
  DeleteWorkspaceRequest,
  GetWorkspaceMembersRequest,
  GetWorkspaceRequest,
  ListWorkspacesArgs,
  ListWorkspacesRequest,
  ListWorkspaceInvitesRequest,
  ResendWorkspaceInviteRequest,
  RevokeWorkspaceInviteRequest,
  UpdateWorkspaceRequest,
  AcceptWorkspaceInviteRequest,
  RemoveWorkspaceMemberRequest,
  UpdateWorkspaceMemberRoleRequest,
} from "../types/workspace.types.ts";

const includeInviteLinksInResponses = env.NODE_ENV !== "production";

const serializeInvite = <T extends { token: string }>(
  invite: T,
  options?: { acceptUrl?: string }
): Omit<T, "token"> & { acceptUrl?: string } => {
  const { token, ...rest } = invite;

  if (!includeInviteLinksInResponses) {
    return rest;
  }

  const acceptUrl = options?.acceptUrl ?? emailService.buildWorkspaceInviteAcceptUrl(token);
  return {
    ...rest,
    acceptUrl,
  };
};

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

const getWorkspaceMembers = catchAsync(
  async (req: GetWorkspaceMembersRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const workspaceMembers = await workspaceService.getWorkspaceMembers(req.params);

    res.status(httpStatus.OK).json(workspaceMembers);
  }
);

const listWorkspaceInvites = catchAsync(
  async (req: ListWorkspaceInvitesRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const invites = await workspaceService.listWorkspaceInvites(context.workspace.id);

    res.status(httpStatus.OK).json({
      invites: invites.map((invite) => serializeInvite(invite)),
    });
  }
);

const createWorkspaceInvite = catchAsync(
  async (req: CreateWorkspaceInviteRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const invite = await workspaceService.createWorkspaceInvite({
      workspaceId: context.workspace.id,
      email: req.body.email,
      role: req.body.role,
      invitedById: req.user.id,
    });

    const acceptUrl = emailService.buildWorkspaceInviteAcceptUrl(invite.token);
    emailService.queueWorkspaceInviteEmail({
      invite,
      workspace: context.workspace,
      acceptUrl,
    });

    res.status(httpStatus.CREATED).json({
      invite: serializeInvite(invite, { acceptUrl }),
    });
  }
);

const resendWorkspaceInvite = catchAsync(
  async (req: ResendWorkspaceInviteRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const invite = await workspaceService.resendWorkspaceInvite(
      context.workspace.id,
      req.params.inviteId,
      req.user.id
    );

    const acceptUrl = emailService.buildWorkspaceInviteAcceptUrl(invite.token);
    emailService.queueWorkspaceInviteEmail({
      invite,
      workspace: context.workspace,
      acceptUrl,
    });

    res.status(httpStatus.OK).json({
      invite: serializeInvite(invite, { acceptUrl }),
    });
  }
);

const revokeWorkspaceInvite = catchAsync(
  async (req: RevokeWorkspaceInviteRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    await workspaceService.revokeWorkspaceInvite(context.workspace.id, req.params.inviteId);

    res.status(httpStatus.NO_CONTENT).send();
  }
);

const acceptWorkspaceInvite = catchAsync(
  async (req: AcceptWorkspaceInviteRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await workspaceService.acceptWorkspaceInvite(req.params.token, req.user.id);

    res.status(httpStatus.OK).json({
      workspaceId: result.invite.workspaceId,
      acceptedAt: result.invite.acceptedAt,
      membership: result.membership,
    });
  }
);

const updateWorkspace = catchAsync(
  async (req: UpdateWorkspaceRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const workspace = await workspaceService.updateWorkspace(context.workspace.id, req.body);
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

const removeWorkspaceMember = catchAsync(
  async (req: RemoveWorkspaceMemberRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    await workspaceService.removeWorkspaceMember(context.workspace.id, req.params.memberId);

    res.status(httpStatus.NO_CONTENT).send();
  }
);

const updateWorkspaceMemberRole = catchAsync(
  async (req: UpdateWorkspaceMemberRoleRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;
    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const updatedMember = await workspaceService.updateWorkspaceMemberRole(
      context.workspace.id,
      req.params.memberId,
      req.body.role
    );

    res.status(httpStatus.OK).json({ member: updatedMember });
  }
);

export default {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  getWorkspaceMembers,
  listWorkspaceInvites,
  createWorkspaceInvite,
  resendWorkspaceInvite,
  revokeWorkspaceInvite,
  acceptWorkspaceInvite,
  updateWorkspace,
  deleteWorkspace,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
};
