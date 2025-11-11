import dotenv from "dotenv";
import { z } from "zod";
import path from "path";
import logger from "./logger.js";

const envFile =
  process.env.NODE_ENV === "development"
    ? path.resolve(process.cwd(), ".env.development")
    : path.resolve(process.cwd(), ".env");

dotenv.config({ path: envFile });

const envSchema = z.object({
  // App
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_BASE_URL: z.url().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z.url(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),

  // Better Auth
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),

  CORS_ORIGIN: z.string().default("*"),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  INVITE_EMAIL_FROM: z.email("INVITE_EMAIL_FROM must be a valid email address").optional(),
  RESEND_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error("Invalid environment variables", {
    errors: parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    })),
  });
  process.exit(1);
}

const env = parsed.data;

export default Object.freeze(env);

export type Env = z.infer<typeof envSchema>;
