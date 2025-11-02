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

const WorkspaceShareTokenSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdentifier,
  }),
  query: z
    .object({
      shareToken: z.string().min(1, "shareToken cannot be empty").optional(),
    })
    .optional(),
});

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

const GetWorkspaceRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdentifier,
  }),
});

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

const UpdateWorkspaceRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdentifier,
  }),
  body: UpdateWorkspaceBodySchema,
});

const DeleteWorkspaceRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdentifier,
  }),
});

export default {
  workspaceIdentifier,
  WorkspaceShareTokenSchema,
  workspaceSlug,
  ListWorkspacesRequestSchema,
  CreateWorkspaceRequestSchema,
  GetWorkspaceRequestSchema,
  UpdateWorkspaceRequestSchema,
  DeleteWorkspaceRequestSchema,
  UpdateWorkspaceBodySchema,
};
