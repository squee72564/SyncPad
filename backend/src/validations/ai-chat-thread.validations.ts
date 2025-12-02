import { z } from "zod";
import workspaceValidations from "@/validations/workspace.validations.js";
import { paginationSchema } from "./common/pagination.ts";

const AiChatThreadParamsSchema = z.object({
  workspaceId: workspaceValidations.workspaceIdentifier,
  threadId: z.cuid({ error: "threadId must be a valid cuid" }),
});

const GetAiChatThreadSchema = z.object({
  params: AiChatThreadParamsSchema,
});

const CreateAiChatThreadSchema = z.object({
  params: z.object({
    workspaceId: workspaceValidations.workspaceIdentifier,
  }),
  body: z.object({
    title: z.string().optional(),
  }),
});

const EditAiChatThreadSchema = z.object({
  params: AiChatThreadParamsSchema,
  body: z.object({
    title: z.string().optional(),
  }),
});

const DeleteAiChatThreadSchema = z.object({
  params: AiChatThreadParamsSchema,
});

const ListAiChatThreadSchema = z.object({
  params: z.object({
    workspaceId: workspaceValidations.workspaceIdentifier,
  }),
  query: paginationSchema,
});

export default {
  GetAiChatThreadSchema,
  CreateAiChatThreadSchema,
  EditAiChatThreadSchema,
  DeleteAiChatThreadSchema,
  ListAiChatThreadSchema,
};
