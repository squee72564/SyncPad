import morgan from "morgan";
import type { Request, Response } from "express";
import env from "@/config/index.js";
import logger from "@/config/logger.js";

morgan.token("message", (_req: Request, res: Response) => res.locals.errorMessage || "");

const getIpFormat = () => (env.NODE_ENV === "production" ? ":remote-addr - " : "");

const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const successHandler = morgan(successResponseFormat, {
  skip: (_req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

const errorHandler = morgan(errorResponseFormat, {
  skip: (_req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});

export default {
  successHandler: successHandler,
  errorHandler: errorHandler,
};
