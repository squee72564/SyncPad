import { ZodRequest } from "@/utils/zodReqeust.ts";
import documentEmbeddingValidations from "@/validations/document-embedding.validations.ts";

export type ListDocumentEmbeddingsRequest = ZodRequest<
  typeof documentEmbeddingValidations.ListDocumentEmbeddingsRequestSchema
>;
export type ListDocumentEmbeddingParams = ListDocumentEmbeddingsRequest["params"];
export type ListDocumentEmbeddingQuery = ListDocumentEmbeddingsRequest["query"];
export type ListDocumentEmbeddingArgs = ListDocumentEmbeddingParams & ListDocumentEmbeddingQuery;

export type SimilarDocumentEmbeddingsRequest = ZodRequest<
  typeof documentEmbeddingValidations.SimilarDocumentEmbeddingsRequestSchema
>;
export type SimilarDocumentEmbeddingsParams = SimilarDocumentEmbeddingsRequest["params"];
export type SimilarDocumentEmbeddingsQuery = SimilarDocumentEmbeddingsRequest["query"];
export type SimilarDocumentEmbeddingsArgs = SimilarDocumentEmbeddingsParams &
  SimilarDocumentEmbeddingsQuery;
