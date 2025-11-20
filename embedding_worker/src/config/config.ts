import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import logger from "@/config/logger.ts";

const envFile =
  process.env.NODE_ENV === "development"
    ? path.resolve(process.cwd(), "../.env.development")
    : path.resolve(process.cwd(), "../.env.production");

logger.info(`Environment file path: ${envFile}`);

dotenv.config({ path: envFile });

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  REDIS_URL: z.url().default("redis://redis:6379"),
  REDIS_STREAM_KEY: z.string().default("embedding_tasks"),
  REDIS_CONSUMER_GROUP: z.string().default("embedding_workers"),
  EMBEDDING_CHUNK_SIZE: z.coerce.number().default(500),
  EMBEDDING_CHUNK_OVERLAP: z.coerce.number().default(50),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error(
    "Invalid environment variables",
    parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }))
  );
  process.exit(1);
}

const env = parsed.data;

export default Object.freeze(env);

export type Env = z.infer<typeof envSchema>;
