import type { Response, NextFunction } from "express";
import httpStatus from "http-status";

import shareLinkService, { buildShareLinkUrl } from "@/services/share-link.service.js";
import ApiError from "@/utils/ApiError.ts";
import catchAsync from "@/utils/catchAsync.js";
import {
  CreateShareLinkRequest,
  DeleteShareLinkRequest,
  ListShareLinksRequest,
  ShareLinkTokenRequest,
  UpdateShareLinkRequest,
} from "@/types/share-link.types.ts";
import activityLogService from "@/services/activity-log.service.js";

const listShareLinks = catchAsync(
  async (req: ListShareLinksRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const result = await shareLinkService.listShareLinks({ ...req.params, ...req.query });

    res.status(httpStatus.OK).json({
      data: result.shareLinks,
      nextCursor: result.nextCursor,
    });
  }
);

const createShareLink = catchAsync(
  async (req: CreateShareLinkRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const expiresAt =
      req.body.expiresAt === null || req.body.expiresAt === undefined
        ? null
        : new Date(req.body.expiresAt);

    const shareLink = await shareLinkService.createShareLink(
      context.workspace.id,
      req.params.documentId,
      req.body.permission,
      expiresAt,
      req.user?.id
    );

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "shareLink.created",
      documentId: req.params.documentId,
      actorId: req.user?.id ?? null,
      metadata: {
        shareLinkId: shareLink.id,
        permission: shareLink.permission,
        expiresAt: shareLink.expiresAt,
      },
    });

    res.status(httpStatus.CREATED).json({
      shareLink: shareLink,
    });
  }
);

const updateShareLink = catchAsync(
  async (req: UpdateShareLinkRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const expiresAt =
      req.body.expiresAt === undefined
        ? undefined
        : req.body.expiresAt === null
          ? null
          : new Date(req.body.expiresAt);

    const shareLink = await shareLinkService.updateShareLink(
      context.workspace.id,
      req.params.documentId,
      req.params.shareLinkId,
      {
        permission: req.body.permission,
        expiresAt,
        regenerateToken: req.body.regenerateToken,
      }
    );

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "shareLink.updated",
      documentId: req.params.documentId,
      actorId: req.user?.id ?? null,
      metadata: {
        shareLinkId: shareLink.id,
        permission: shareLink.permission,
        expiresAt: shareLink.expiresAt,
        regenerateToken: Boolean(req.body.regenerateToken),
      },
    });

    res.status(httpStatus.OK).json({
      shareLink: shareLink,
    });
  }
);

const deleteShareLink = catchAsync(
  async (req: DeleteShareLinkRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    await shareLinkService.deleteShareLink(
      context.workspace.id,
      req.params.documentId,
      req.params.shareLinkId
    );

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "shareLink.deleted",
      documentId: req.params.documentId,
      actorId: req.user?.id ?? null,
      metadata: {
        shareLinkId: req.params.shareLinkId,
      },
    });

    res.status(httpStatus.NO_CONTENT).send();
  }
);

const previewShareLink = catchAsync(
  async (req: ShareLinkTokenRequest, res: Response, _next: NextFunction) => {
    const shareLink = await shareLinkService.getShareLinkByToken(req.params.token);

    if (!shareLink) {
      throw new ApiError(httpStatus.NOT_FOUND, "Share link not found");
    }

    res.status(httpStatus.OK).json({
      token: req.params.token,
      permission: shareLink.permission,
      expiresAt: shareLink.expiresAt,
      document: {
        id: shareLink.document.id,
        title: shareLink.document.title,
      },
      workspace: {
        id: shareLink.workspace.id,
        name: shareLink.workspace.name,
        slug: shareLink.workspace.slug,
      },
      url: buildShareLinkUrl(req.params.token),
    });
  }
);

export default {
  listShareLinks,
  createShareLink,
  updateShareLink,
  deleteShareLink,
  previewShareLink,
};
