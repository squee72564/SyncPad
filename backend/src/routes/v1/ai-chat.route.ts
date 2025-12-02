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

router
  .route("/:threadId")
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(ragValidations.RunRagPipelineRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    ragController.runRagPipeline
  )
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(ragValidations.RunRagPipelineRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    ragController.getConversationHistory
  );

export default router;
