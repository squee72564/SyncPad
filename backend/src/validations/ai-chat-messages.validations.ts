import { z } from "zod";
import workspaceValidations from "@/validations/workspace.validations.js";
import Prisma from "@generated/prisma-postgres/index.js";
import { paginationSchema } from "./common/pagination.ts";

const AiChatMessageParams = z.object({
  workspaceId: workspaceValidations.workspaceIdentifier,
  threadId: z.cuid(),
});

const RunRagPipelineRequestSchema = z.object({
  params: AiChatMessageParams,
  body: z.object({
    query: z.string().min(1, "Query is required"),
  }),
});

const CreateAiChatMessageSchema = z.object({
  params: AiChatMessageParams,
  body: z.object({
    authorId: z.cuid().optional(),
    role: z.enum([Prisma.RagChatRole.ASSISTANT, Prisma.RagChatRole.USER]),
    content: z.string(),
    error: z.boolean(),
  }),
});

const RetrieveAiChatMessageSchema = z.object({
  params: AiChatMessageParams.extend({
    messageId: z.cuid(),
  }),
});

const UpdateAiChatMessageSchema = z.object({
  params: AiChatMessageParams.extend({
    messageId: z.cuid(),
  }),
  body: z.object({
    authorId: z.string().optional(),
    role: z.enum([Prisma.RagChatRole.ASSISTANT, Prisma.RagChatRole.USER]).optional(),
    content: z.string().optional(),
    error: z.boolean().default(false).optional(),
  }),
});

const DeleteAiChatMessageSchema = z.object({
  params: AiChatMessageParams.extend({
    messageId: z.cuid(),
  }),
});

const ListAiChatMessageSchema = z.object({
  params: AiChatMessageParams,
  query: paginationSchema,
});

export default {
  RunRagPipelineRequestSchema,
  CreateAiChatMessageSchema,
  RetrieveAiChatMessageSchema,
  UpdateAiChatMessageSchema,
  DeleteAiChatMessageSchema,
  ListAiChatMessageSchema,
};
