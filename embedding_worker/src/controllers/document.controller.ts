import { documentService } from "@/services/index.ts";

const getDocumentById = async (documentId: string) => {
  const document = await documentService.getById(documentId);
  if (!document) throw new Error("No document found");
  return document;
};

export default {
  getDocumentById,
};
