import { documentService } from "@/services/index.ts";

const getDocumentById = async (documentId: string) => {
  return documentService.getById(documentId);
};

export default {
  getDocumentById,
};
