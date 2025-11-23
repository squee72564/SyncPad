import { Router } from "express";

import {
  auth,
  validate,
  attachWorkspaceContext,
  requireWorkspacePermission,
} from "@/middleware/index.js";
import { activityLogController } from "@/controllers/index.js";
import { activityLogValidations } from "@/validations/index.js";
import { adminRoles, defaultRoles } from "@/lib/permissions.ts";

const router: Router = Router({ mergeParams: true });

router
  .route("/")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(activityLogValidations.ListActivityLogsRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("workspace:manage"),
    activityLogController.listActivityLogs
  )
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(activityLogValidations.CreateActivityLogRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("workspace:manage"),
    activityLogController.createActivityLog
  );

router
  .route("/:activityLogId")
  .delete(
    auth([...defaultRoles, ...adminRoles]),
    validate(activityLogValidations.DeleteActivityLogRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("workspace:manage"),
    activityLogController.deleteActivityLog
  );

export default router;
