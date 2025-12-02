import { ZodRequest } from "@/utils/zodReqeust.ts";
import { aiChatMessagesValidations } from "@/validations/index.ts";

export type RunRagPipelineRequest = ZodRequest<
  typeof aiChatMessagesValidations.RunRagPipelineRequestSchema
>;
export type RunRagPipelineParams = RunRagPipelineRequest["params"];
export type RunRagPipelineBody = RunRagPipelineRequest["body"];

export type GetConversationHistoryRequest = ZodRequest<
  typeof aiChatMessagesValidations.GetConversationHistorySchema
>;
export type GetConversationHistoryParams = GetConversationHistoryRequest["params"];
