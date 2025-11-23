import z from "zod";

import workspaceValidations from "./workspace.validations.js";

const AiJobParamsSchema = z.object({
  workspaceId: workspaceValidations.workspaceIdentifier,
});

const GetAiJobsSchema = z.object({
  params: AiJobParamsSchema,
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
