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

router.route("/");

router.route("/:messageId");

export default router;
