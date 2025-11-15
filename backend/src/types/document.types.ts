import documentValidations from "@/validations/document.validations.js";
import type { ZodRequest } from "../utils/zodReqeust.ts";

export type ListDocumentsRequest = ZodRequest<
  typeof documentValidations.ListDocumentsRequestSchema
>;
export type ListDocumentsParams = ListDocumentsRequest["params"];
export type ListDocumentsQuery = ListDocumentsRequest["query"];

export type CreateDocumentRequest = ZodRequest<
  typeof documentValidations.CreateDocumentRequestSchema
>;
export type CreateDocumentArgs = CreateDocumentRequest["body"];
export type CreateDocumentParams = CreateDocumentRequest["params"];

export type GetDocumentRequest = ZodRequest<typeof documentValidations.GetDocumentRequestSchema>;
export type GetDocumentParams = GetDocumentRequest["params"];
export type GetDocumentQuery = GetDocumentRequest["query"];

export type UpdateDocumentRequest = ZodRequest<
  typeof documentValidations.UpdateDocumentRequestSchema
>;
export type UpdateDocumentBody = UpdateDocumentRequest["body"];
export type UpdateDocumentParams = UpdateDocumentRequest["params"];

export type DeleteDocumentRequest = ZodRequest<
  typeof documentValidations.DeleteDocumentRequestSchema
>;
export type DeleteDocumentParams = DeleteDocumentRequest["params"];

export type UpdateDocumentCollabStateRequest = ZodRequest<
  typeof documentValidations.UpdateDocumentCollabStateRequestSchema
>;
