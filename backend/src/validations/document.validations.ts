import { z } from "zod";
import workspaceValidations from "@/validations/workspace.validations.js";
import { paginationSchema } from "@/validations/common/pagination.ts";

const documentId = z
  .cuid({ message: "documentId must be a valid CUID" })
  .describe("Document identifier (cuid)");

const documentSlug = z
  .string()
  .min(1, "document slug is required")
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])?$/i, {
    message: "slug must be alphanumeric and may include dashes",
  });

const documentStatus = z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]);

const DocumentParamsSchema = z.object({
  documentId: documentId,
  workspaceId: workspaceValidations.workspaceIdentifier,
});

const booleanQueryParam = z.union([z.boolean(), z.enum(["true", "false"])]);

const ListDocumentsRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceValidations.workspaceIdentifier,
  }),
  query: paginationSchema
    .extend({
      parentId: z.cuid({ message: "parentId must be a valid CUID" }).optional(),
      status: documentStatus.optional(),
      includeContent: booleanQueryParam.optional(),
    })
    .optional(),
});

const CreateDocumentRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceValidations.workspaceIdentifier,
  }),
  body: z.object({
    title: z.string().min(1, "title is required").max(200, "title must be 200 characters or less"),
    slug: documentSlug.optional(),
    headline: z.string().max(240, "headline must be 240 characters or less").optional(),
    summary: z.string().max(1024, "summary must be 1024 characters or less").optional(),
    parentId: z.cuid({ message: "parentId must be a valid CUID" }).nullable().optional(),
    status: documentStatus.optional(),
    content: z.any().optional(),
    publishedAt: z.iso.datetime().optional(),
  }),
});

const UpdateDocumentRequestSchema = z.object({
  params: DocumentParamsSchema,
  body: z
    .object({
      title: z
        .string()
        .min(1, "title is required")
        .max(200, "title must be 200 characters or less")
        .optional(),
      slug: documentSlug.optional(),
      headline: z
        .string()
        .max(240, "headline must be 240 characters or less")
        .nullable()
        .optional(),
      summary: z
        .string()
        .max(1024, "summary must be 1024 characters or less")
        .nullable()
        .optional(),
      parentId: z.cuid({ message: "parentId must be a valid CUID" }).nullable().optional(),
      status: documentStatus.optional(),
      content: z.any().optional(),
      publishedAt: z.iso.datetime().nullable().optional(),
    })
    .refine((val) => Object.keys(val).length > 0, {
      message: "At least one field must be provided",
    }),
});

const GetDocumentRequestSchema = z.object({
  params: DocumentParamsSchema,
  query: z
    .object({
      includeCollabState: booleanQueryParam.optional(),
    })
    .optional(),
});

const DeleteDocumentRequestSchema = z.object({
  params: DocumentParamsSchema,
});

const UpdateDocumentCollabStateRequestSchema = z.object({
  params: DocumentParamsSchema,
  body: z.object({
    snapshot: z.any(),
    version: z.number().int().nonnegative().optional(),
  }),
});

export default {
  documentId,
  documentSlug,
  documentStatus,
  ListDocumentsRequestSchema,
  CreateDocumentRequestSchema,
  UpdateDocumentRequestSchema,
  GetDocumentRequestSchema,
  DeleteDocumentRequestSchema,
  UpdateDocumentCollabStateRequestSchema,
};
