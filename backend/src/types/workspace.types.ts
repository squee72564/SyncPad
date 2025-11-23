import { Request } from "express";
import { ZodRequest } from "@/utils/zodReqeust.ts";
import workspaceValidations from "@/validations/workspace.validations.js";
import {
  Workspace,
  WorkspaceMember,
  DocumentShareLink,
  WorkspaceRole,
  SharePermission,
} from "@generated/prisma-postgres/index.js";

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
export type WorkspaceInviteRole = Exclude<WorkspaceRole, "OWNER">;

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

export type UpdateWorkspaceArgs = UpdateWorkspaceRequest["body"];

export type DeleteWorkspaceRequest = ZodRequest<
  typeof workspaceValidations.DeleteWorkspaceRequestSchema
>;
export type DeleteWorkspaceArgs = DeleteWorkspaceRequest["params"];

export type GetWorkspaceMembersRequest = ZodRequest<
  typeof workspaceValidations.GetWorkspaceMembersRequestSchema
>;
export type GetWorkspaceMembersArgs = GetWorkspaceMembersRequest["params"];

export type CreateWorkspaceInviteRequest = ZodRequest<
  typeof workspaceValidations.WorkspaceInviteRequestSchema
>;
export type CreateWorkspaceInviteArgs = CreateWorkspaceInviteRequest["params"] &
  CreateWorkspaceInviteRequest["body"];

export type ListWorkspaceInvitesRequest = ZodRequest<
  typeof workspaceValidations.WorkspaceInviteListRequestSchema
>;
export type ListWorkspaceInvitesArgs = ListWorkspaceInvitesRequest["params"];

export type ResendWorkspaceInviteRequest = ZodRequest<
  typeof workspaceValidations.WorkspaceInviteResendRequestSchema
>;
export type RevokeWorkspaceInviteRequest = ZodRequest<
  typeof workspaceValidations.WorkspaceInviteRevokeRequestSchema
>;

export type AcceptWorkspaceInviteRequest = ZodRequest<
  typeof workspaceValidations.WorkspaceInviteAcceptRequestSchema
>;
export type AcceptWorkspaceInviteArgs = AcceptWorkspaceInviteRequest["params"];

export type RemoveWorkspaceMemberRequest = ZodRequest<
  typeof workspaceValidations.RemoveWorkspaceMemberRequestSchema
>;
export type RemoveWorkspaceMemberArgs = RemoveWorkspaceMemberRequest["params"];

export type UpdateWorkspaceMemberRoleRequest = ZodRequest<
  typeof workspaceValidations.UpdateWorkspaceMemberRoleRequestSchema
>;
export type UpdateWorkspaceMemberRoleArgs = UpdateWorkspaceMemberRoleRequest["params"] &
  UpdateWorkspaceMemberRoleRequest["body"];
