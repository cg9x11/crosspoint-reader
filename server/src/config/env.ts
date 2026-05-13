import path from "node:path";

import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

loadDotEnv();

const booleanLike = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }
    return value === "true";
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ROLE: z.enum(["app", "worker"]).default("app"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(8787),
  APP_BASE_URL: z.string().url().default("http://localhost:8787"),
  DATABASE_URL: z.string().default("file:./local-dev/library.db"),
  STORAGE_PATH: z.string().default("./runtime"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  SESSION_SECRET: z.string().default("replace_me"),
  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD_HASH: z.string().default("replace_me"),
  BOOTSTRAP_ADMIN_USERNAME: z.string().default("admin"),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().default("ChangeMe123!"),
  SYNC_CRON: z.string().default("0 * * * *"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  ENABLE_PUPPETEER: booleanLike.default(false),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional().default(""),
  PROXY_TRUST: booleanLike.default(false),
  SOURCE_ENABLED_ALLOWLIST: z.string().optional().default(""),
  SOURCE_PRIORITY_IDS: z.string().optional().default(""),
  QUEUE_CONCURRENCY_NOVEL_SYNC: z.coerce.number().int().positive().default(1),
  QUEUE_CONCURRENCY_CHAPTER_FETCH: z.coerce.number().int().positive().default(1),
  QUEUE_CONCURRENCY_CHAPTER_BUILD: z.coerce.number().int().positive().default(1),
  QUEUE_CONCURRENCY_TRANSLATION: z.coerce.number().int().positive().default(1),
  QUEUE_CONCURRENCY_MAINTENANCE: z.coerce.number().int().positive().default(1)
});

export type AppConfig = z.infer<typeof envSchema> & {
  STORAGE_PATH: string;
};

export function loadConfig(): AppConfig {
  const parsed = envSchema.parse(process.env);
  return {
    ...parsed,
    STORAGE_PATH: path.resolve(process.cwd(), parsed.STORAGE_PATH)
  };
}
