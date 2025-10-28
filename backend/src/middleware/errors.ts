import type { Response, Request, NextFunction } from "express";

import httpStatus from "http-status";
import env from "../config/index.js";
import logger from "../config/logger.js";
import ApiError from "../utils/ApiError.js";

export const errorConverter = (
  err: Error & { statusCode?: number },
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  let error = err;

  if (error instanceof ApiError) {
    error = err;
  } else if (error instanceof Error) {
    const statusCode = error.statusCode ? error.statusCode : httpStatus.INTERNAL_SERVER_ERROR;
    error = new ApiError(statusCode, err.message, false, err.stack);
  } else {
    const message = typeof err === "string" ? err : "Internal Server Error";
    error = new ApiError(httpStatus.INTERNAL_SERVER_ERROR, message, false);
  }
  next(error);
};

export const errorHandler = (err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  let { statusCode, message } = err;
  if (env.NODE_ENV === "production" && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  };

  if (env.NODE_ENV === "development") {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};
