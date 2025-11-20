import { createLogger, format, transports } from "winston";

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const isDocker = process.env.DOCKER === "true" || false;

const logger = createLogger({
  level: isDevelopment ? "debug" : "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: {
    service: "syncpad_embedding_worker",
    ...(isDocker && { container: process.env.HOSTNAME }),
  },
  transports: [
    new transports.File({
      filename: "syncpad_embedding_worker.log",
      level: "error",
    }),
    new transports.File({ filename: "syncpad_embedding_worker_combined.log" }),
  ],
});

// file transports in development
if (isDevelopment) {
  logger.add(
    new transports.File({
      filename: "syncpad_embedding_worker.log",
      level: "error",
    })
  );
  logger.add(
    new transports.File({
      filename: "syncpad_embedding_worker_combined.log",
    })
  );
}

if (isDevelopment || isTest) {
  // Pretty Console for dev
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, stack, ...meta }) => {
          const { service, ...rest } = meta;

          let stackStr = "";
          if (stack) {
            stackStr = `\n${stack}`;
            delete rest.stack;
          }

          const metaStr = Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : "";
          return `${service} ${timestamp} [${level}]: ${message}${metaStr}${stackStr}`;
        })
      ),
    })
  );
} else {
  // JSON console for production (captured by PM2 / Docker)
  logger.add(
    new transports.Console({
      format: format.json(),
    })
  );
}

export default logger;
