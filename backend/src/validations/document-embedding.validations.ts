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

export default {
  ListDocumentEmbeddingsRequestSchema,
};
