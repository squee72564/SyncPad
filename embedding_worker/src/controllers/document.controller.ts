import { documentService } from "@/services/index.ts";

const getContentForEmbedding = async (documentId: string, revisionId?: string | null) => {
  const content = await documentService.getContentForEmbedding(documentId, revisionId);
  if (content === undefined) {
    throw new Error("No document content found");
  }
  return content;
};

export default {
  getContentForEmbedding,
};
