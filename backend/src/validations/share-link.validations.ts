import { z } from "zod";
import workspaceValidations from "@/validations/workspace.validations.js";
import { paginationSchema } from "./common/pagination.ts";

const documentId = z.cuid({ message: "documentId must be a valid CUID" });
const shareLinkId = z.cuid({ message: "shareLinkId must be a valid CUID" });

const WorkspaceDocumentParamsSchema = z.object({
  workspaceId: workspaceValidations.workspaceIdentifier,
  documentId,
});

const ShareLinkParamsSchema = WorkspaceDocumentParamsSchema.extend({
  shareLinkId,
});

const permissionEnum = z.enum(["VIEW", "COMMENT", "EDIT"]);

const expiresAtSchema = z.iso
  .datetime({ message: "expiresAt must be an ISO 8601 datetime string" })
  .optional()
  .nullable();

const ListShareLinksRequestSchema = z.object({
  params: WorkspaceDocumentParamsSchema,
  query: paginationSchema,
});

const CreateShareLinkRequestSchema = z.object({
  params: WorkspaceDocumentParamsSchema,
  body: z.object({
    permission: permissionEnum,
    expiresAt: expiresAtSchema,
  }),
});

const UpdateShareLinkRequestSchema = z.object({
  params: ShareLinkParamsSchema,
  body: z
    .object({
      permission: permissionEnum.optional(),
      expiresAt: expiresAtSchema,
      regenerateToken: z.boolean().optional(),
    })
    .refine(
      (body) =>
        body.permission !== undefined ||
        body.expiresAt !== undefined ||
        body.regenerateToken === true,
      { message: "At least one field must be provided" }
    ),
});

const DeleteShareLinkRequestSchema = z.object({
  params: ShareLinkParamsSchema,
});

const ShareLinkTokenRequestSchema = z.object({
  params: z.object({
    token: z.string().min(1, "token is required"),
  }),
});

export default {
  ListShareLinksRequestSchema,
  CreateShareLinkRequestSchema,
  UpdateShareLinkRequestSchema,
  DeleteShareLinkRequestSchema,
  ShareLinkTokenRequestSchema,
};
