import type { FastifyInstance } from "fastify";

import { z } from "zod";

import { isHiddenAppSettingKey } from "../../lib/adminAuth.js";

const patchSettingsSchema = z.object({
  settings: z.record(z.string(), z.string())
});

function parseEnvList(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function registerSettingsApiRoutes(app: FastifyInstance) {
  app.get("/api/settings", async () => {
    const settings = await app.prisma.appSetting.findMany({
      orderBy: { key: "asc" }
    });

    return {
      items: settings.filter((item) => !isHiddenAppSettingKey(item.key))
    };
  });

  app.patch("/api/settings", async (request, reply) => {
    const body = patchSettingsSchema.parse(request.body);
    const hiddenKeys = Object.keys(body.settings).filter((key) => isHiddenAppSettingKey(key));

    if (hiddenKeys.length) {
      reply.code(400);
      return {
        ok: false,
        error: "SETTING_KEY_FORBIDDEN",
        message: "Protected security keys cannot be edited from the generic settings API."
      };
    }

    const updates = await Promise.all(
      Object.entries(body.settings).map(async ([key, value]) =>
        app.prisma.appSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value }
        })
      )
    );

    return {
      ok: true,
      count: updates.length,
      items: updates
    };
  });

  app.get("/api/settings/storage", async () => {
    return {
      root: app.storagePaths.root,
      directories: app.storagePaths
    };
  });

  app.get("/api/settings/system", async () => {
    return {
      role: app.appConfig.APP_ROLE,
      nodeEnv: app.appConfig.NODE_ENV,
      baseUrl: app.appConfig.APP_BASE_URL,
      redisUrl: app.appConfig.REDIS_URL,
      syncCron: app.appConfig.SYNC_CRON,
      puppeteer: {
        enabled: app.appConfig.ENABLE_PUPPETEER,
        executablePath: app.appConfig.PUPPETEER_EXECUTABLE_PATH || null
      },
      queueConcurrency: {
        novelSync: app.appConfig.QUEUE_CONCURRENCY_NOVEL_SYNC,
        chapterFetch: app.appConfig.QUEUE_CONCURRENCY_CHAPTER_FETCH,
        chapterBuild: app.appConfig.QUEUE_CONCURRENCY_CHAPTER_BUILD,
        maintenance: app.appConfig.QUEUE_CONCURRENCY_MAINTENANCE
      },
      sourcePolicy: {
        enabledAllowlist: parseEnvList(app.appConfig.SOURCE_ENABLED_ALLOWLIST),
        priorityIds: parseEnvList(app.appConfig.SOURCE_PRIORITY_IDS)
      }
    };
  });
}
