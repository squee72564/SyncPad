import { ZodRequest } from "@/utils/zodReqeust.ts";
import { aiChatMessagesValidations } from "@/validations/index.ts";

export type RunRagPipelineRequest = ZodRequest<
  typeof aiChatMessagesValidations.RunRagPipelineRequestSchema
>;
export type RunRagPipelineParams = RunRagPipelineRequest["params"];
export type RunRagPipelineBody = RunRagPipelineRequest["body"];
export type RunRagPipelineArgs = RunRagPipelineBody & RunRagPipelineParams;

export type CreateAiChatMessageRequest = ZodRequest<
  typeof aiChatMessagesValidations.CreateAiChatMessageSchema
>;
export type CreateAiChatMessageParams = CreateAiChatMessageRequest["params"];
export type CreateAiChatMessageBody = CreateAiChatMessageRequest["body"];
export type CreateAiChatMessageArgs = CreateAiChatMessageParams & CreateAiChatMessageBody;

export type RetrieveAiChatMessageRequest = ZodRequest<
  typeof aiChatMessagesValidations.RetrieveAiChatMessageSchema
>;
export type RetrieveAiChatMessageParams = RetrieveAiChatMessageRequest["params"];

export type UpdateAiChatMessageRequest = ZodRequest<
  typeof aiChatMessagesValidations.UpdateAiChatMessageSchema
>;
export type UpdateAiChatMessageParams = UpdateAiChatMessageRequest["params"];
export type UpdateAiChatMessageBody = UpdateAiChatMessageRequest["body"];
export type UpdateAiChatMessageArgs = UpdateAiChatMessageParams & UpdateAiChatMessageBody;

export type DeleteAiChatMessageRequest = ZodRequest<
  typeof aiChatMessagesValidations.DeleteAiChatMessageSchema
>;
export type DeleteAiChatMessageParams = DeleteAiChatMessageRequest["params"];

export type ListAiChatMessageRequest = ZodRequest<
  typeof aiChatMessagesValidations.ListAiChatMessageSchema
>;
export type ListAiChatMessageParams = ListAiChatMessageRequest["params"];
export type ListAiChatMessageQuery = ListAiChatMessageRequest["query"];
export type ListAiChatMessageArgs = ListAiChatMessageParams & ListAiChatMessageQuery;
