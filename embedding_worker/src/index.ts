import { EmbeddingWorker, createWorkerDependencies } from "@/worker.ts";
import logger from "@/config/logger.ts";

const worker = new EmbeddingWorker(createWorkerDependencies());

setupSignalHandlers(worker);

async function main() {
  await worker.start();
}

main().catch((error) => {
  logger.error("Error running worker:", error);
  process.exitCode = 1;
});

function setupSignalHandlers(currentWorker: EmbeddingWorker) {
  let shuttingDown = false;

  const requestShutdown = async (reason: string, error?: unknown) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    if (error) {
      logger.error(`Shutting down worker after ${reason}`, error);
      process.exitCode = 1;
    } else {
      logger.info(`Received ${reason}. Shutting down worker.`);
    }

    try {
      await currentWorker.stop();
    } catch (shutdownError) {
      logger.error("Error while shutting down worker", shutdownError);
      process.exitCode = 1;
    }
  };

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGQUIT"];

  for (const signal of signals) {
    process.once(signal, () => {
      void requestShutdown(signal);
    });
  }

  process.once("unhandledRejection", (reason) => {
    void requestShutdown("unhandledRejection", reason);
  });

  process.once("uncaughtException", (error) => {
    void requestShutdown("uncaughtException", error);
  });
}
