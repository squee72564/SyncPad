import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

const envFile =
  process.env.NODE_ENV === "development"
    ? path.resolve(process.cwd(), "../.env.development")
    : path.resolve(process.cwd(), "../.env.production");

dotenv.config({ path: envFile });

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
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
