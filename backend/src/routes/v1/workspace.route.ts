import { Router } from "express";

import auth from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import {
  attachWorkspaceContext,
  requireWorkspacePermission,
  requireWorkspaceRole,
} from "../../middleware/workspace.js";
import { workspaceController } from "../../controllers/index.js";
import { workspaceValidations } from "../../validations/index.js";
import { adminRoles, defaultRoles } from "@/lib/permissions.ts";

const router: Router = Router();

router
  .route("/")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.ListWorkspacesRequestSchema),
    workspaceController.listWorkspaces
  )
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.CreateWorkspaceRequestSchema),
    workspaceController.createWorkspace
  );

router
  .route("/:workspaceId")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.GetWorkspaceRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("workspace:view"),
    workspaceController.getWorkspace
  )
  .patch(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.UpdateWorkspaceRequestSchema),
    attachWorkspaceContext(),
    requireWorkspaceRole(["OWNER", "ADMIN"]),
    requireWorkspacePermission("workspace:manage"),
    workspaceController.updateWorkspace
  )
  .delete(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.DeleteWorkspaceRequestSchema),
    attachWorkspaceContext(),
    requireWorkspaceRole(["OWNER"]),
    requireWorkspacePermission("workspace:delete"),
    workspaceController.deleteWorkspace
  );

router
  .route("/:workspaceId/members")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.GetWorkspaceMembersRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("workspace:view"),
    workspaceController.getWorkspaceMembers
  );

router
  .route("/:workspaceId/invites")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.WorkspaceInviteListRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("member:invite"),
    workspaceController.listWorkspaceInvites
  )
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.WorkspaceInviteRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("member:invite"),
    workspaceController.createWorkspaceInvite
  );

router
  .route("/:workspaceId/invites/:inviteId/resend")
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.WorkspaceInviteResendRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("member:invite"),
    workspaceController.resendWorkspaceInvite
  );

router
  .route("/:workspaceId/invites/:inviteId")
  .delete(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.WorkspaceInviteRevokeRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("member:invite"),
    workspaceController.revokeWorkspaceInvite
  );

router
  .route("/invites/:token/accept")
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(workspaceValidations.WorkspaceInviteAcceptRequestSchema),
    workspaceController.acceptWorkspaceInvite
  );

export default router;
