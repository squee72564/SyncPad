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
  )

export default router;
