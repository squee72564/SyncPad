import { z } from "zod";
import type {
  Workspace,
  WorkspaceMember,
  DocumentShareLink,
  WorkspaceRole,
  SharePermission,
} from "../../prisma/generated/prisma-postgres/index.js";

import { Request } from "express";
import workspaceValidations from "@/validations/workspace.validations.js";
import { ZodRequest } from "../utils/zodReqeust.ts";

export type WorkspacePermission =
  | "workspace:view"
  | "workspace:manage"
  | "workspace:delete"
  | "member:invite"
  | "member:manage"
  | "document:create"
  | "document:read"
  | "document:update"
  | "document:delete"
  | "document:publish"
  | "comment:create"
  | "comment:resolve"
  | "share:create"
  | "share:manage"
  | "ai:trigger"
  | "ai:view";

export type EffectiveWorkspaceRole = WorkspaceRole | "SUPERADMIN" | "ANONYMOUS";

export interface WorkspaceContext {
  workspace: Workspace;
  membership?: WorkspaceMember | undefined;
  shareLink?: DocumentShareLink | undefined;
  effectiveRole: EffectiveWorkspaceRole;
  permissions: WorkspacePermission[];
}

// Baseline permissions per workspace role; adjust as policy evolves.
export const ownerPermissions: WorkspacePermission[] = [
  "workspace:view",
  "workspace:manage",
  "workspace:delete",
  "member:invite",
  "member:manage",
  "document:create",
  "document:read",
  "document:update",
  "document:delete",
  "document:publish",
  "comment:create",
  "comment:resolve",
  "share:create",
  "share:manage",
  "ai:trigger",
  "ai:view",
];

export const adminPermissions: WorkspacePermission[] = ownerPermissions.filter(
  (permission) => permission !== "workspace:delete"
);

export const editorPermissions: WorkspacePermission[] = [
  "workspace:view",
  "document:create",
  "document:read",
  "document:update",
  "document:publish",
  "comment:create",
  "comment:resolve",
  "share:create",
  "share:manage",
  "ai:trigger",
  "ai:view",
];

export const commenterPermissions: WorkspacePermission[] = [
  "workspace:view",
  "document:read",
  "comment:create",
  "ai:view",
];

export const viewerPermissions: WorkspacePermission[] = [
  "workspace:view",
  "document:read",
  "ai:view",
];

export const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  OWNER: ownerPermissions,
  ADMIN: adminPermissions,
  EDITOR: editorPermissions,
  COMMENTER: commenterPermissions,
  VIEWER: viewerPermissions,
};

export const SHARE_PERMISSION_MAP: Record<SharePermission, WorkspacePermission[]> = {
  VIEW: ["workspace:view", "document:read", "ai:view"],
  COMMENT: ["workspace:view", "document:read", "comment:create", "ai:view"],
  EDIT: ["workspace:view", "document:read", "document:update", "comment:create", "ai:view"],
};

export const ALL_PERMISSIONS: WorkspacePermission[] = Array.from(
  new Set(Object.values(WORKSPACE_ROLE_PERMISSIONS).flat())
);

export const DEFAULT_WORKSPACE_ID_PARAM = "workspaceId";
export const DEFAULT_SHARE_TOKEN_PARAM = "shareToken";
export const DEFAULT_SHARE_TOKEN_HEADER = "x-share-token";

export type WorkspaceLookupField = "id" | "slug" | "auto";

export interface AttachWorkspaceContextOptions {
  workspaceIdParam?: string;
  workspaceLookup?: WorkspaceLookupField;
  requireMembership?: boolean;
  allowShareLinks?: boolean;
  shareTokenParam?: string;
  shareTokenHeader?: string;
  shareTokenExtractor?: (req: Request) => string | undefined;
}

export type { WorkspaceRole };

export type ListWorkspacesRequest = ZodRequest<
  typeof workspaceValidations.ListWorkspacesRequestSchema
>;
export type ListWorkspacesArgs = ListWorkspacesRequest["query"];

export type CreateWorkspaceRequest = ZodRequest<
  typeof workspaceValidations.CreateWorkspaceRequestSchema
>;
export type CreateWorkspaceArgs = CreateWorkspaceRequest["body"];

export type GetWorkspaceRequest = ZodRequest<typeof workspaceValidations.GetWorkspaceRequestSchema>;

export type UpdateWorkspaceRequest = ZodRequest<
  typeof workspaceValidations.UpdateWorkspaceRequestSchema
>;
export type UpdateWorkspaceArgs = UpdateWorkspaceRequest["params"] &
  z.infer<typeof workspaceValidations.UpdateWorkspaceBodySchema>;
export type UpdateWorkspaceBody = z.infer<typeof workspaceValidations.UpdateWorkspaceBodySchema>;

export type DeleteWorkspaceRequest = ZodRequest<
  typeof workspaceValidations.DeleteWorkspaceRequestSchema
>;
export type DeleteWorkspaceArgs = DeleteWorkspaceRequest["params"];
