import { createWorkerDependencies, runWorker } from "./worker.ts";

const workerContext = createWorkerDependencies();

runWorker(workerContext).catch((error) => {
  console.error("Error running worker:", error);
  process.exit(1);
});
