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
  .route("/")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatMessagesValidations.ListAiChatMessageSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatMessageController.ListAiChatMessages
  )
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatMessagesValidations.RunRagPipelineRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatMessageController.runRagPipeline
  );

router
  .route("/:messageId")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatMessagesValidations.RetrieveAiChatMessageSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatMessageController.GetAiChatMessage
  )
  .patch(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatMessagesValidations.UpdateAiChatMessageSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatMessageController.UpdateAiChatMessage
  )
  .delete(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatMessagesValidations.DeleteAiChatMessageSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatMessageController.DeleteAiChatMessage
  );

export default router;
