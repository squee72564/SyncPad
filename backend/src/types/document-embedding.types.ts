import { ZodRequest } from "@/utils/zodReqeust.ts";
import documentEmbeddingValidations from "@/validations/document-embedding.validations.ts";

export type ListDocumentEmbeddingsRequest = ZodRequest<
  typeof documentEmbeddingValidations.ListDocumentEmbeddingsRequestSchema
>;
export type ListDocumentEmbeddingParams = ListDocumentEmbeddingsRequest["params"];
export type ListDocumentEmbeddingQuery = ListDocumentEmbeddingsRequest["query"];
export type ListDocumentEmbeddingArgs = ListDocumentEmbeddingParams & ListDocumentEmbeddingQuery;
