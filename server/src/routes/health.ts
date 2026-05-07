import type { FastifyInstance } from "fastify";

import fs from "node:fs/promises";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/healthz", async () => {
    return {
      status: "ok",
      service: "xteinkreader-server",
      role: app.appConfig.APP_ROLE,
      uptimeSeconds: Math.round(process.uptime())
    };
  });

  app.get("/readyz", async (_, reply) => {
    const checks = {
      database: false,
      redis: false,
      storage: false
    };

    try {
      await app.prisma.$queryRawUnsafe("SELECT 1");
      checks.database = true;
    } catch {
      checks.database = false;
    }

    try {
      await app.redis.ping();
      checks.redis = true;
    } catch {
      checks.redis = false;
    }

    try {
      await fs.access(app.storagePaths.root);
      checks.storage = true;
    } catch {
      checks.storage = false;
    }

    const ok = Object.values(checks).every(Boolean);
    if (!ok) {
      reply.code(503);
    }

    return {
      status: ok ? "ready" : "not_ready",
      checks
    };
  });
}
