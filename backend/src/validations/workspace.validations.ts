import { z } from "zod";

const workspaceIdentifier = z
  .union([
    z.string().cuid({ message: "workspaceId must be a valid CUID" }),
    z
      .string()
      .regex(/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])?$/i, {
        message: "workspaceId must be a valid slug (alphanumeric and dashes)",
      }),
  ])
  .describe("Workspace identifier (cuid or slug)");

const WorkspaceParamsSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdentifier,
  }),
});

const WorkspaceShareTokenSchema = WorkspaceParamsSchema.extend({
  query: z
    .object({
      shareToken: z.string().min(1, "shareToken cannot be empty").optional(),
    })
    .optional(),
});

const withWorkspaceScope = <Schema extends z.ZodObject<any>>(schema: Schema) => {
  const existingParams = schema.shape.params;

  const paramsSchema =
    existingParams instanceof z.ZodObject
      ? existingParams.extend({
          workspaceId: workspaceIdentifier,
        })
      : z.object({
          workspaceId: workspaceIdentifier,
        });

  return schema.extend({
    params: paramsSchema,
  });
};

export default {
  workspaceIdentifier,
  WorkspaceParamsSchema,
  WorkspaceShareTokenSchema,
  withWorkspaceScope,
};
