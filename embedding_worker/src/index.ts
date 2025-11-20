import { createWorkerDependencies, runWorker } from "@/worker.ts";
import logger from "@/config/logger.ts";

const workerContext = createWorkerDependencies();

runWorker(workerContext).catch((error) => {
  logger.error("Error running worker:", error);
  process.exit(1);
});
