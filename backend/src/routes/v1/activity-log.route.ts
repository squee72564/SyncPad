import { Router } from "express";

import auth from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { attachWorkspaceContext, requireWorkspacePermission } from "../../middleware/workspace.js";
import { activityLogController } from "../../controllers/index.js";
import { activityLogValidations } from "../../validations/index.js";
import { adminRoles, defaultRoles } from "@/lib/permissions.ts";

const router: Router = Router({ mergeParams: true });

router
  .route("/")
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
