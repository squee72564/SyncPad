import { ZodRequest } from "../utils/zodReqeust.ts";
import aiJobValidations from "@/validations/ai-job.validations.ts";

export type GetAiJobsRequest = ZodRequest<typeof aiJobValidations.GetAiJobsSchema>;
export type GetAiJobsArgs = GetAiJobsRequest["params"];

export type GetAiJobRequest = ZodRequest<typeof aiJobValidations.GetAiJobSchema>;
export type GetAiJobArgs = GetAiJobsRequest["params"] & { aiJobId: string };
