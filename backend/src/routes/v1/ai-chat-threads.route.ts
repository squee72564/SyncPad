import { Router } from "express";

import {
  auth,
  validate,
  attachWorkspaceContext,
  requireWorkspacePermission,
} from "@/middleware/index.ts";
import { adminRoles, defaultRoles } from "@/lib/permissions.ts";
import aiChatThreadValidations from "@/validations/ai-chat-thread.validations.ts";
import aiChatThreadController from "@/controllers/ai-chat-thread.controller.ts";

const router: Router = Router({ mergeParams: true });

router
  .route("/")
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatThreadValidations.CreateAiChatThreadSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatThreadController.CreateAiChatThread
  )
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatThreadValidations.ListAiChatThreadSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatThreadController.ListAiChatThreads
  );

router
  .route("/:threadId")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatThreadValidations.GetAiChatThreadSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatThreadController.GetAiChatThread
  )
  .patch(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatThreadValidations.EditAiChatThreadSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatThreadController.EditAiChatThread
  )
  .delete(
    auth([...defaultRoles, ...adminRoles]),
    validate(aiChatThreadValidations.DeleteAiChatThreadSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    aiChatThreadController.DeleteAiChatThread
  );

export default router;
