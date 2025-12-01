import { Router } from "express";

import {
  auth,
  validate,
  attachWorkspaceContext,
  requireWorkspacePermission,
} from "@/middleware/index.ts";
import { ragController } from "@/controllers/index.js";
import { ragValidations } from "@/validations/index.js";
import { adminRoles, defaultRoles } from "@/lib/permissions.ts";

const router: Router = Router({ mergeParams: true });

router.post(
  "/query",
  auth([...defaultRoles, ...adminRoles]),
  validate(ragValidations.RunRagPipelineRequestSchema),
  attachWorkspaceContext(),
  requireWorkspacePermission("document:read"),
  ragController.runRagPipeline
);

export default router;
