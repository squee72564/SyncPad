import { Router } from "express";

import {
  auth,
  validate,
  attachWorkspaceContext,
  requireWorkspacePermission,
} from "@/middleware/index.ts";
import { aiChatMessageController } from "@/controllers/index.js";
import { aiChatMessagesValidations } from "@/validations/index.js";
import { adminRoles, defaultRoles } from "@/lib/permissions.ts";

const router: Router = Router({ mergeParams: true });

router
  .route("/message")
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatMessagesValidations.RunRagPipelineRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatMessageController.runRagPipeline
  )
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatMessagesValidations.GetConversationHistorySchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatMessageController.getConversationHistory
  );

export default router;
