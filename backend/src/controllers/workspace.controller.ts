import type { NextFunction, Response } from "express";
import httpStatus from "http-status";

import catchAsync from "@/utils/catchAsync.js";
import ApiError from "@/utils/ApiError.js";
import workspaceService from "@/services/workspace.service.js";
import emailService from "@/services/email.service.js";
import activityLogService from "@/services/activity-log.service.js";
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
} from "@/types/workspace.types.ts";
import { parseBoolean } from "@/utils/parse.ts";

const listWorkspaces = catchAsync(
  async (req: ListWorkspacesRequest, res: Response, _next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const query: ListWorkspacesArgs | undefined = req.query;
    const workspaces = await workspaceService.listUserWorkspaces(userId, query);

    const includeMembership = parseBoolean(req.query?.includeMembership);

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

    await activityLogService.createActivityLog(workspace.workspace.id, {
      event: "workspace.created",
      actorId: userId,
      metadata: {
        name: workspace.workspace.name,
        slug: workspace.workspace.slug,
      },
    });

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

    res.status(httpStatus.OK).json({
      data: workspaceMembers.members,
      nextCursor: workspaceMembers.nextCursor,
    });
  }
);

const listWorkspaceInvites = catchAsync(
  async (req: ListWorkspaceInvitesRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const result = await workspaceService.listWorkspaceInvites({ ...req.query, ...req.params });

    res.status(httpStatus.OK).json({
      data: result.workspaceInvites,
      nextCursor: result.nextCursor,
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

    const { token, acceptUrl, invite } = await workspaceService.createWorkspaceInvite({
      workspaceId: context.workspace.id,
      email: req.body.email,
      role: req.body.role,
      invitedById: req.user.id,
    });

    emailService.queueWorkspaceInviteEmail({
      invite: { ...invite, token },
      workspace: context.workspace,
      acceptUrl,
    });

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "workspace.invite.created",
      actorId: req.user.id,
      metadata: {
        inviteId: invite.id,
        email: invite.email,
        role: invite.role,
      },
    });

    res.status(httpStatus.CREATED).json({
      invite: invite,
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

    const { acceptUrl, invite, token } = await workspaceService.resendWorkspaceInvite(
      context.workspace.id,
      req.params.inviteId,
      req.user.id
    );

    emailService.queueWorkspaceInviteEmail({
      invite: { ...invite, token },
      workspace: context.workspace,
      acceptUrl,
    });

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "workspace.invite.resent",
      actorId: req.user.id,
      metadata: {
        inviteId: invite.id,
        email: invite.email,
        role: invite.role,
      },
    });

    res.status(httpStatus.OK).json({
      invite: invite,
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

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "workspace.invite.revoked",
      actorId: req.user?.id ?? null,
      metadata: {
        inviteId: req.params.inviteId,
      },
    });

    res.status(httpStatus.NO_CONTENT).send();
  }
);

const acceptWorkspaceInvite = catchAsync(
  async (req: AcceptWorkspaceInviteRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await workspaceService.acceptWorkspaceInvite(req.params.token, req.user.id);

    await activityLogService.createActivityLog(result.invite.workspaceId, {
      event: "workspace.invite.accepted",
      actorId: req.user.id,
      metadata: {
        inviteId: result.invite.id,
        membershipId: result.membership.id,
        role: result.membership.role,
      },
    });

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
    await activityLogService.createActivityLog(context.workspace.id, {
      event: "workspace.updated",
      actorId: req.user?.id ?? null,
      metadata: {
        updatedFields: Object.keys(req.body),
      },
    });
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

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "workspace.member.removed",
      actorId: req.user?.id ?? null,
      metadata: {
        memberId: req.params.memberId,
      },
    });

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

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "workspace.member.role-updated",
      actorId: req.user?.id ?? null,
      metadata: {
        memberId: req.params.memberId,
        role: req.body.role,
      },
    });

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
