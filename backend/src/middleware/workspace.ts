import type { Request, RequestHandler } from "express";
import httpStatus from "http-status";

import prisma from "@syncpad/prisma-client";
import ApiError from "@/utils/ApiError.js";
import catchAsync from "@/utils/catchAsync.js";
import {
  type EffectiveWorkspaceRole,
  type WorkspaceContext,
  type WorkspacePermission,
  type WorkspaceRole,
  type AttachWorkspaceContextOptions,
  DEFAULT_WORKSPACE_ID_PARAM,
  DEFAULT_SHARE_TOKEN_PARAM,
  DEFAULT_SHARE_TOKEN_HEADER,
  ALL_PERMISSIONS,
  WORKSPACE_ROLE_PERMISSIONS,
  SHARE_PERMISSION_MAP,
} from "@/types/workspace.types.ts";

import workspaceService from "@/services/workspace.service.js";

// Resolve identifier precedence: params > query > body.
const extractFromRequest = (req: Request, key: string): string | undefined => {
  const paramValue = req.params?.[key];

  if (typeof paramValue === "string" && paramValue) {
    return req.params[key];
  }

  const queryValue = req.query?.[key];
  if (typeof queryValue === "string" && queryValue) {
    return queryValue;
  }
  if (Array.isArray(queryValue) && queryValue.length > 0) {
    const value = queryValue.find((v) => typeof v === "string" && v);
    if (value) {
      return value as string;
    }
  }

  if (req.body && typeof req.body === "object" && key in req.body) {
    const bodyValue = (req.body as Record<string, unknown>)[key];
    if (typeof bodyValue === "string" && bodyValue) {
      return bodyValue;
    }
  }

  return undefined;
};

// Support share tokens from headers or request payloads.
const extractShareToken = (
  req: Request,
  options: Required<Pick<AttachWorkspaceContextOptions, "shareTokenHeader" | "shareTokenParam">>
): string | undefined => {
  const headerKey = options.shareTokenHeader.toLowerCase();
  const headerValue = req.headers[headerKey];
  if (typeof headerValue === "string" && headerValue) {
    return headerValue;
  }
  if (Array.isArray(headerValue) && headerValue.length > 0) {
    const value = headerValue.find((v) => typeof v === "string" && v);
    if (value) {
      return value;
    }
  }

  const paramValue = extractFromRequest(req, options.shareTokenParam);
  return paramValue;
};

// Collapse global, workspace, and share-link state into a unified role concept.
const computeEffectiveRole = (
  isSuperAdmin: boolean,
  membershipRole?: WorkspaceRole,
  hasShareLink?: boolean
): EffectiveWorkspaceRole => {
  if (isSuperAdmin) {
    return "SUPERADMIN";
  }
  if (membershipRole) {
    return membershipRole;
  }
  if (hasShareLink) {
    return "ANONYMOUS";
  }
  return "ANONYMOUS";
};

// Enrich the request with workspace + membership context for downstream guards.
export const attachWorkspaceContext = (
  options: AttachWorkspaceContextOptions = {}
): RequestHandler => {
  const {
    workspaceIdParam = DEFAULT_WORKSPACE_ID_PARAM,
    workspaceLookup = "auto",
    requireMembership = true,
    allowShareLinks = false,
    shareTokenParam = DEFAULT_SHARE_TOKEN_PARAM,
    shareTokenHeader = DEFAULT_SHARE_TOKEN_HEADER,
    shareTokenExtractor,
  } = options;

  return catchAsync(async (req: Request, _res, next) => {
    const identifier = extractFromRequest(req, workspaceIdParam);

    if (!identifier) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Missing workspace identifier: ${workspaceIdParam}`
      );
    }

    const workspace = await workspaceService.getWorkspaceByIdentifier(workspaceLookup, identifier);

    if (!workspace) {
      throw new ApiError(httpStatus.NOT_FOUND, "Workspace not found");
    }

    // Parse Better Auth global roles (useful for super admin bypass).
    const globalRoles = (req.user?.role || "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
    const isSuperAdmin = globalRoles.includes("superAdmin");

    // Look up workspace membership for authenticated users.
    const membership = req.user
      ? await workspaceService.getWorkspaceMemeber(workspace.id, req.user.id)
      : null;

    // Allow token-based access for non-members when enabled.
    let shareLink = null;
    if (!membership && allowShareLinks) {
      const token =
        shareTokenExtractor?.(req) ?? extractShareToken(req, { shareTokenHeader, shareTokenParam });

      if (token) {
        shareLink = await prisma.documentShareLink.findFirst({
          where: {
            token,
            workspaceId: workspace.id,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });
      }
    }

    if (requireMembership && !membership && !isSuperAdmin) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: workspace membership required");
    }

    // Aggregate permissions from global role, membership role, and share link.
    const permissions = new Set<WorkspacePermission>();

    if (isSuperAdmin) {
      ALL_PERMISSIONS.forEach((permission) => permissions.add(permission));
    }

    if (membership) {
      WORKSPACE_ROLE_PERMISSIONS[membership.role].forEach((permission) =>
        permissions.add(permission)
      );
    }

    if (shareLink) {
      SHARE_PERMISSION_MAP[shareLink.permission].forEach((permission) =>
        permissions.add(permission)
      );
    }

    // Persist resolved context on the request for downstream handlers.
    const workspaceContext: WorkspaceContext = {
      workspace,
      ...(membership && { membership }),
      ...(shareLink && { shareLink }),
      effectiveRole: computeEffectiveRole(isSuperAdmin, membership?.role, Boolean(shareLink)),
      permissions: Array.from(permissions),
    };

    req.workspaceContext = workspaceContext;

    next();
  });
};

// Guard route handlers by workspace role (super admins always pass).
export const requireWorkspaceRole = (roles: EffectiveWorkspaceRole[]): RequestHandler => {
  return (req, _res, next) => {
    const context = req.workspaceContext;

    if (!context) {
      return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found"));
    }

    if (context.effectiveRole === "SUPERADMIN") {
      return next();
    }

    if (!context.membership) {
      if (roles.includes("ANONYMOUS") && context.effectiveRole === "ANONYMOUS") {
        return next();
      }

      return next(new ApiError(httpStatus.FORBIDDEN, "Forbidden: workspace membership required"));
    }

    if (!roles.includes(context.membership.role)) {
      return next(new ApiError(httpStatus.FORBIDDEN, "Forbidden: insufficient workspace role"));
    }

    return next();
  };
};

// Guard route handlers by explicit workspace permission strings.
export const requireWorkspacePermission = (
  permission: WorkspacePermission | WorkspacePermission[]
): RequestHandler => {
  const expectedPermissions = Array.isArray(permission) ? permission : [permission];

  return (req, _res, next) => {
    const context = req.workspaceContext;

    if (!context) {
      return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found"));
    }

    if (context.effectiveRole === "SUPERADMIN") {
      return next();
    }

    const permissionSet = new Set(context.permissions);
    const missing = expectedPermissions.filter((perm) => !permissionSet.has(perm));

    if (missing.length > 0) {
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          `Forbidden: missing workspace permissions [${missing.join(", ")}]`
        )
      );
    }

    return next();
  };
};
