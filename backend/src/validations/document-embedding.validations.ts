import { z } from "zod";
import workspaceValidations from "@/validations/workspace.validations.js";
import { paginationSchema } from "@/validations/common/pagination.ts";
import { documentId } from "./document.validations.ts";

const ListDocumentEmbeddingsRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceValidations.workspaceIdentifier,
  }),
  query: paginationSchema
    .extend({
      documentId: documentId.optional(),
    })
    .optional(),
});

const SimilarDocumentEmbeddingsRequestSchema = z.object({
  params: z.object({
    workspaceId: workspaceValidations.workspaceIdentifier,
    documentId,
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  }),
});

export default {
  ListDocumentEmbeddingsRequestSchema,
  SimilarDocumentEmbeddingsRequestSchema,
};
