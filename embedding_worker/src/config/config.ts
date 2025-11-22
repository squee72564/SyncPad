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
  BACKEND_REDIS_URL: z.url().default("redis://localhost:6379"),
  REDIS_STREAM_KEY: z.string().default("embedding_tasks"),
  REDIS_CONSUMER_GROUP: z.string().default("embedding_workers"),
  EMBEDDING_PROVIDER: z.enum(["openai", "azure", "voyage", "self_hosted"]).default("openai"),
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  EMBEDDING_BASE_URL: z.url().transform((value) => value?.replace(/\/+$/, "")),
  EMBEDDING_API_KEY: z.string(),
  EMBEDDING_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  EMBEDDING_MAX_BATCH: z.coerce.number().int().positive().default(16),
  EMBEDDING_CONCURRENCY: z.coerce.number().int().positive().default(4),
  EMBEDDING_MAX_TOKENS_PER_INPUT: z.coerce.number().int().positive().default(8000),
  EMBEDDING_MAX_RETRIES: z.coerce.number().int().min(0).default(5),
  EMBEDDING_CHUNK_TARGET_TOKENS: z.coerce.number().int().positive().default(800),
  EMBEDDING_CHUNK_MIN_TOKENS: z.coerce.number().int().positive().default(200),
  EMBEDDING_CHUNK_OVERLAP_TOKENS: z.coerce.number().int().nonnegative().default(200),
  EMBEDDING_CHUNK_AVG_CHARS_PER_TOKEN: z.coerce.number().positive().default(4),
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
