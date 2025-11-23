import { z, ZodObject } from "zod";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import httpStatus from "http-status";
import ApiError from "@/utils/ApiError.js";
import catchAsync from "@/utils/catchAsync.js";

const validate: (schema: ZodObject) => RequestHandler = (schema) =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new ApiError(httpStatus.BAD_REQUEST, errorMessage);
      }
      throw new ApiError(httpStatus.BAD_REQUEST, "Validation error");
    }
    next();
  });

export default validate;
