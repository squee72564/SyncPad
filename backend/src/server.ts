import app from "./app.js";
import env from "./config/index.js";
import logger from "./config/logger.js";
import { disconnectPrisma } from "./lib/prisma.js";

// Maybe handle db connection here?

const server = app.listen(env.PORT, () => {
  logger.info(`Listening to port ${env.PORT}`);
});

const exitHandler = async (exitCode = 0) => {
  try {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      logger.info("Server closed");
    }
    await disconnectPrisma();
  } catch (err) {
    logger.error("Error during shutdown", err);
  } finally {
    process.exit(exitCode);
  }
};

const unexpectedErrorHandler = async (error: Error) => {
  logger.error(error);
  await exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGINT", async () => {
  logger.info("SIGINT received");
  await exitHandler();
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received");
  await exitHandler();
});

process.on("beforeExit", async () => {
  await exitHandler();
});
