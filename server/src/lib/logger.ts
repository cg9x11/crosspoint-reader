import type { AppConfig } from "../config/env.js";

export function buildLoggerConfig(config: AppConfig) {
  return {
    level: config.LOG_LEVEL,
    transport:
      config.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
              translateTime: "SYS:standard",
              singleLine: true,
              ignore: "pid,hostname"
            }
          }
        : undefined
  };
}
