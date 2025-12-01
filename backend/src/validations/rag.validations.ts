import { z } from "zod";
import workspaceValidations from "@/validations/workspace.validations.js";

const ConversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const RunRagPipelineRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceValidations.workspaceIdentifier,
  }),
  body: z.object({
    query: z.string().min(1, "Query is required"),
    history: z.array(ConversationMessageSchema).max(50).optional(),
  }),
});

export default {
  RunRagPipelineRequestSchema,
};
