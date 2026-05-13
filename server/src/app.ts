import Fastify from "fastify";
import cookie from "@fastify/cookie";

import type { PrismaClient } from "./lib/prisma.js";
import type { Redis } from "ioredis";

import type { AppConfig } from "./config/env.js";
import { getSessionCookieName, getSessionFromRequest } from "./lib/auth.js";
import { resolveAdminAuthState } from "./lib/adminAuth.js";
import { buildLoggerConfig } from "./lib/logger.js";
import { createQueues } from "./queues/index.js";
import { registerRoutes } from "./routes/index.js";
import type { StorageLayout } from "./storage/paths.js";

interface BuildAppOptions {
  config: AppConfig;
  prisma: PrismaClient;
  redis: Redis;
  storagePaths: StorageLayout;
}

export async function buildApp({ config, prisma, redis, storagePaths }: BuildAppOptions) {
  const app = Fastify({
    logger: buildLoggerConfig(config),
    trustProxy: config.PROXY_TRUST
  });
  const queues = createQueues(config, redis);

  await app.register(cookie);

  app.decorate("appConfig", config);
  app.decorate("prisma", prisma);
  app.decorate("redis", redis);
  app.decorate("queues", queues);
  app.decorate("storagePaths", storagePaths);

  app.decorateRequest("sessionUser", null);
  app.decorateRequest("authState", null);

  app.addHook("onRequest", async (request, reply) => {
    const requestPath = request.url.split("?")[0] ?? request.url;
    const session = getSessionFromRequest(request, config.SESSION_SECRET);
    request.sessionUser = session?.user ?? null;

    if (request.sessionUser) {
      const authState = await resolveAdminAuthState(prisma, config);
      request.authState = authState;

      if (request.sessionUser !== authState.username) {
        request.sessionUser = null;
        request.authState = null;
        reply.clearCookie(getSessionCookieName(), { path: "/" });
      }
    }

    const publicApiPaths = new Set([
      "/api/auth/login",
      "/api/auth/logout",
      "/api/auth/session"
    ]);
    const lockedSessionApiPaths = new Set([
      "/api/auth/logout",
      "/api/auth/session",
      "/api/auth/change-password"
    ]);

    if (requestPath.startsWith("/api/") && !publicApiPaths.has(requestPath) && !request.sessionUser) {
      reply.code(401);
      return reply.send({
        ok: false,
        error: "UNAUTHORIZED",
        message: "Sign in to continue."
      });
    }

    if (
      requestPath.startsWith("/api/") &&
      request.sessionUser &&
      request.authState?.mustChangePassword &&
      !lockedSessionApiPaths.has(requestPath)
    ) {
      reply.code(403);
      return reply.send({
        ok: false,
        error: "PASSWORD_CHANGE_REQUIRED",
        message: "Change the admin password before using the control panel."
      });
    }
  });

  app.addHook("onClose", async () => {
    await Promise.all(Object.values(queues).map(async (queue) => queue.close()));
    await prisma.$disconnect();
    redis.disconnect();
  });

  await registerRoutes(app);

  return app;
}

