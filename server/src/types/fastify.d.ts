import type { PrismaClient } from "@prisma/client";
import type { Redis } from "ioredis";

import type { AppConfig } from "../config/env.js";
import type { AdminAuthState } from "../lib/adminAuth.js";
import type { AppQueues } from "../queues/index.js";
import type { StorageLayout } from "../storage/paths.js";

declare module "fastify" {
  interface FastifyInstance {
    appConfig: AppConfig;
    prisma: PrismaClient;
    redis: Redis;
    queues: AppQueues;
    storagePaths: StorageLayout;
  }

  interface FastifyRequest {
    sessionUser: string | null;
    authState: AdminAuthState | null;
  }
}

export {};
