import { z } from "zod";
import workspaceValidations from "./workspace.validations.js";

const ActivityLogParamsSchema = z.object({
  workspaceId: workspaceValidations.workspaceIdentifier,
});

const CreateActivityLogRequestSchema = z.object({
  params: ActivityLogParamsSchema,
  body: z.object({
    event: z.string().min(1, "event is required"),
    documentId: z.cuid("documentId must be a valid CUID").optional(),
    actorId: z.cuid("actorId must be a valid CUID").optional(),
    metadata: z.record(z.any(), z.any()).optional(),
  }),
});

const DeleteActivityLogRequestSchema = z.object({
  params: ActivityLogParamsSchema.extend({
    activityLogId: z.cuid("activityLogId must be a valid CUID"),
  }),
});

export default {
  CreateActivityLogRequestSchema,
  DeleteActivityLogRequestSchema,
};
