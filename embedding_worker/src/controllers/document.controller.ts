import { documentService } from "@/services/index.ts";

const getDocumentById = async (documentId: string) => {
  try {
    const document = await documentService.getById(documentId);
    return document;
  } catch (error) {
    throw error;
  }
};

export default {
  getDocumentById,
};
