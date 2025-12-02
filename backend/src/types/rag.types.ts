import { ZodRequest } from "@/utils/zodReqeust.ts";
import ragValidations from "@/validations/rag.validations.ts";

export type RunRagPipelineRequest = ZodRequest<typeof ragValidations.RunRagPipelineRequestSchema>;
export type RunRagPipelineParams = RunRagPipelineRequest["params"];
export type RunRagPipelineBody = RunRagPipelineRequest["body"];

export type GetConversationHistoryRequest = ZodRequest<
  typeof ragValidations.GetConversationHistorySchema
>;
export type GetConversationHistoryParams = GetConversationHistoryRequest["params"];
