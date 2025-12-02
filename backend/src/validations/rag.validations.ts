import { z } from "zod";
import workspaceValidations from "@/validations/workspace.validations.js";

const RunRagPipelineRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceValidations.workspaceIdentifier,
    threadId: z.cuid(),
  }),
  body: z.object({
    query: z.string().min(1, "Query is required"),
  }),
});

const GetConversationHistorySchema = z.object({
  params: z.object({
    workspaceId: workspaceValidations.workspaceIdentifier,
    threadId: z.cuid(),
  }),
});

export default {
  RunRagPipelineRequestSchema,
  GetConversationHistorySchema,
};
