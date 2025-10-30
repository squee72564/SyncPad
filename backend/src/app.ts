import express, { type Request, type Response, type NextFunction, type Express } from "express";

import httpStatus from "http-status";

import morgan from "./config/morgan.js";

import env from "./config/index.js";

import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import compression from "compression";
import xssSanitize from "./middleware/xss-clean/index.js";
import rateLimiter from "./middleware/ratelimit.js";

import routes from "./routes/v1/index.js";
import ApiError from "./utils/ApiError.js";
import { errorConverter, errorHandler } from "./middleware/errors.js";

const app: Express = express();

if (env.NODE_ENV !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// https://helmetjs.github.io/
// Secruity HTTP headers
app.use(helmet());

// https://github.com/expressjs/cors
// Enable cors
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// https://express-rate-limit.mintlify.app/overview
app.use(rateLimiter);

// Gzip compression
app.use(compression());

// Sanitize request data
app.use(xssSanitize());

// Protect against HTTP Parameter Pollution
app.use(hpp());

// Mount express json middleware after Bearer Auth Handler
// or only apply to routes that dont interact with better-auth

app.use("/v1", routes.authRoute);

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// api routes
app.use("/v1", routes.default);

// Send a 404 error for unknown api requests
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not Found"));
});

// Convert errors to custom ApiError if needed
app.use(errorConverter);

// Handle Errors
app.use(errorHandler);

export default app;
