import { ZodRequest } from "@/utils/zodReqeust.ts";
import ragValidations from "@/validations/rag.validations.ts";

export type RunRagPipelineRequest = ZodRequest<typeof ragValidations.RunRagPipelineRequestSchema>;
export type RunRagPipelineParams = RunRagPipelineRequest["params"];
export type RunRagPipelineBody = RunRagPipelineRequest["body"];
