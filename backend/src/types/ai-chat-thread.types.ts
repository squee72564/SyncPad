import { ZodRequest } from "@/utils/zodReqeust.ts";
import aiChatThreadValidations from "@/validations/ai-chat-thread.validations.ts";

export type GetAiChatThreadRequest = ZodRequest<
  typeof aiChatThreadValidations.GetAiChatThreadSchema
>;
export type GetAiChatThreadParams = GetAiChatThreadRequest["params"];

export type CreateAiChatThreadRequest = ZodRequest<
  typeof aiChatThreadValidations.CreateAiChatThreadSchema
>;
export type CreateAiChatThreadBody = CreateAiChatThreadRequest["body"];
export type CreateAiChatThreadParams = CreateAiChatThreadRequest["params"];
export type CreateAiChatThreadArgs = CreateAiChatThreadBody & CreateAiChatThreadParams;

export type EditAiChatThreadRequest = ZodRequest<
  typeof aiChatThreadValidations.EditAiChatThreadSchema
>;
export type EditAiChatThreadBody = EditAiChatThreadRequest["body"];
export type EditAiChatThreadParams = EditAiChatThreadRequest["params"];
export type EditAiChatThreadArgs = EditAiChatThreadBody & EditAiChatThreadParams;

export type DeleteAiChatThreadRequest = ZodRequest<
  typeof aiChatThreadValidations.DeleteAiChatThreadSchema
>;
export type DeleteAiChatThreadParams = DeleteAiChatThreadRequest["params"];

export type ListAiChatThreadRequest = ZodRequest<
  typeof aiChatThreadValidations.ListAiChatThreadSchema
>;
export type ListAiChatThreadParams = ListAiChatThreadRequest["params"];
export type ListAiChatThreadQuery = ListAiChatThreadRequest["query"];
export type ListAiChatThreadArgs = ListAiChatThreadParams & ListAiChatThreadQuery;
