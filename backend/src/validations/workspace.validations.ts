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

const UpdateWorkspaceRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdentifier,
  }),
  body: z
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
      (data) =>
        data.name !== undefined || data.slug !== undefined || data.description !== undefined,
      {
        message: "At least one field must be provided",
      }
    ),
});

const DeleteWorkspaceRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdentifier,
  }),
});

const GetWorkspaceMembersRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdentifier,
  }),
});

const WorkspaceInviteRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdentifier,
  }),
  body: z.object({
    email: z.email(),
    role: z.enum(["ADMIN", "EDITOR", "VIEWER", "COMMENTER"]),
  }),
});

const WorkspaceInviteListRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceIdentifier,
  }),
});

const WorkspaceInviteIdParamsSchema = z.object({
  workspaceId: workspaceIdentifier,
  inviteId: z.cuid("inviteId must be a valid CUID"),
});

const WorkspaceInviteResendRequestSchema = z.object({
  params: WorkspaceInviteIdParamsSchema,
});

const WorkspaceInviteRevokeRequestSchema = z.object({
  params: WorkspaceInviteIdParamsSchema,
});

const WorkspaceInviteAcceptRequestSchema = z.object({
  params: z.object({
    token: z.string().min(1, "invite token is required"),
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
  GetWorkspaceMembersRequestSchema,
  WorkspaceInviteRequestSchema,
  WorkspaceInviteListRequestSchema,
  WorkspaceInviteResendRequestSchema,
  WorkspaceInviteRevokeRequestSchema,
  WorkspaceInviteAcceptRequestSchema,
};
