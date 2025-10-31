import { z } from "zod";

const workspaceSlug = z
  .string()
  .min(1, "workspace slug is required")
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])?$/i, {
    message: "slug must be alphanumeric and may include dashes",
  });

const workspaceIdentifier = z
  .union([z.cuid({ message: "workspaceId must be a valid CUID" }), workspaceSlug])
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

const withWorkspaceScope = <Schema extends z.ZodObject<z.ZodRawShape>>(schema: Schema) => {
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

const ListWorkspacesRequestSchema = z.object({
  query: z
    .object({
      includeMembership: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
    })
    .optional(),
});

const CreateWorkspaceRequestSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "workspace name is required")
      .max(120, "name must be 120 characters or less"),
    slug: workspaceSlug,
    description: z.string().max(512, "description must be 512 characters or less").optional(),
  }),
});

const GetWorkspaceRequestSchema = withWorkspaceScope(z.object({}));

const UpdateWorkspaceBodySchema = z
  .object({
    name: z
      .string()
      .min(1, "workspace name is required")
      .max(120, "name must be 120 characters or less")
      .optional(),
    slug: workspaceSlug.optional(),
    description: z
      .union([z.string().max(512, "description must be 512 characters or less"), z.null()])
      .optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.slug !== undefined || data.description !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

const UpdateWorkspaceRequestSchema = withWorkspaceScope(
  z.object({
    body: UpdateWorkspaceBodySchema,
  })
);

const DeleteWorkspaceRequestSchema = withWorkspaceScope(z.object({}));

export default {
  workspaceIdentifier,
  WorkspaceParamsSchema,
  WorkspaceShareTokenSchema,
  withWorkspaceScope,
  workspaceSlug,
  ListWorkspacesRequestSchema,
  CreateWorkspaceRequestSchema,
  GetWorkspaceRequestSchema,
  UpdateWorkspaceRequestSchema,
  DeleteWorkspaceRequestSchema,
  UpdateWorkspaceBodySchema,
};
