import z from "zod";
import workspaceValidations from "@/validations/workspace.validations.js";
import { paginationSchema } from "@/validations/common/pagination.ts";

const AiJobParamsSchema = z.object({
  workspaceId: workspaceValidations.workspaceIdentifier,
});

const AiJobQuerySchema = paginationSchema.extend({
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]).optional(),
  type: z.enum(["EMBEDDING", "SUMMARY", "QA", "ALERT"]).optional(),
  documentId: z.cuid("documentId must be a valid CUID").optional(),
});

const GetAiJobsSchema = z.object({
  params: AiJobParamsSchema,
  query: AiJobQuerySchema,
});

const GetAiJobSchema = z.object({
  params: AiJobParamsSchema.extend({
    aiJobId: z.cuid("aiJobId must be a valid CUID"),
  }),
});

export default {
  GetAiJobsSchema,
  GetAiJobSchema,
};
