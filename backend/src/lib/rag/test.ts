import RAGOrchestrator from "./rag-pipeline.ts";
import config from "@/config/index.ts";

const [workspaceIdArg, ...restArgs] = process.argv.slice(2);
const userInputArg = restArgs.join(" ").trim();

if (!workspaceIdArg || !userInputArg) {
  console.error(
    "Usage: pnpm --filter ./backend tsx src/lib/rag/test.ts <workspaceId> <user input>"
  );
  process.exit(1);
}

const run = async () => {
  const orchestrator = new RAGOrchestrator();

  try {
    const result = await orchestrator.runRAGPipeline(workspaceIdArg, userInputArg, null);
    if (result.success) {
      console.log("RAG response:");
      console.dir(result.data, { depth: null });
    } else {
      console.error(`RAG failed (${result.type}):`);
      console.dir(result, { depth: null });
      process.exit(1);
    }
  } catch (error) {
    console.error("Unhandled error running RAG pipeline:");
    console.error(error);
    process.exit(1);
  }
};

void run();
