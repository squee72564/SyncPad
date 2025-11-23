import { Router } from "express";

import {
  auth,
  validate,
  attachWorkspaceContext,
  requireWorkspacePermission,
} from "@/middleware/index.ts";
import { adminRoles, defaultRoles } from "@/lib/permissions.ts";
import { aiJobValidations } from "@/validations/index.ts";

import { aiJobController } from "@/controllers/index.ts";

const router: Router = Router();

router
  .route("/workspaces/:workspaceId/ai-jobs")
  .get(
    auth([...adminRoles, ...defaultRoles]),
    validate(aiJobValidations.GetAiJobsSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("ai:view"),
    aiJobController.listAiJobs
  );

router
  .route("/workspaces/:workspaceId/ai-jobs/:aiJobId")
  .get(
    auth([...adminRoles, ...defaultRoles]),
    validate(aiJobValidations.GetAiJobSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("ai:view"),
    aiJobController.listAiJob
  );
