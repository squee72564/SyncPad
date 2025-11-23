import { z } from "zod";
import workspaceValidations from "@/validations/workspace.validations.js";

const ActivityLogParamsSchema = z.object({
  workspaceId: workspaceValidations.workspaceIdentifier,
});

const CreateActivityLogRequestSchema = z.object({
  params: ActivityLogParamsSchema,
  body: z.object({
    event: z.string().min(1, "event is required"),
    documentId: z.cuid("documentId must be a valid CUID").optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

const DeleteActivityLogRequestSchema = z.object({
  params: ActivityLogParamsSchema.extend({
    activityLogId: z.cuid("activityLogId must be a valid CUID"),
  }),
});

const ListActivityLogsRequestSchema = z.object({
  params: ActivityLogParamsSchema,
  query: z
    .object({
      cursor: z.cuid("cursor must be a valid CUID").optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      documentId: z.cuid("documentId must be a valid CUID").optional(),
      actorId: z.cuid("actorId must be a valid CUID").optional(),
      event: z.string().min(1, "event filter must not be empty").optional(),
    })
    .optional(),
});

export default {
  CreateActivityLogRequestSchema,
  DeleteActivityLogRequestSchema,
  ListActivityLogsRequestSchema,
};
