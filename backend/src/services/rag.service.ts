import RAGOrchestrator from "@/lib/rag/rag-pipeline.ts";

const orchestrator = new RAGOrchestrator();

const runPipeline = async (workspaceId: string, query: string, history?: unknown) => {
  return orchestrator.runRAGPipeline(workspaceId, query, history);
};

export default {
  runPipeline,
};
