import RAGOrchestrator from "@/lib/rag/rag-pipeline.ts";
import Prisma from "@generated/prisma-postgres/index.js";

const orchestrator = new RAGOrchestrator();

const runPipeline = async (
  workspaceId: string,
  query: string,
  history?: Array<{ role: Prisma.RagChatRole; content: string }>
) => {
  return orchestrator.runRAGPipeline(workspaceId, query, history);
};

export default {
  runPipeline,
};
