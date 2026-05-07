import type { FastifyInstance } from "fastify";

import { z } from "zod";

import { isHiddenAppSettingKey } from "../../lib/adminAuth.js";
import { resolveSourcePolicy, updateSourcePolicy } from "../../lib/sourcePolicy.js";

const patchSettingsSchema = z.object({
  settings: z.record(z.string(), z.string())
});

const patchSourcePolicySchema = z.object({
  enabledAllowlist: z.array(z.string().trim().min(1)).optional(),
  priorityIds: z.array(z.string().trim().min(1)).optional()
});

function buildRoleMeta(role: "app" | "worker") {
  if (role === "worker") {
    return {
      roleLabel: "Worker đồng bộ",
      roleDescription: "Xử lý hàng đợi đồng bộ chương và build EPUB nền."
    };
  }

  return {
    roleLabel: "Web app / OPDS",
    roleDescription: "Phục vụ giao diện quản trị, API và feed OPDS cho thiết bị đọc."
  };
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

  app.get("/api/settings/source-policy", async () => {
    return resolveSourcePolicy(app.prisma, app.appConfig);
  });

  app.patch("/api/settings/source-policy", async (request) => {
    const body = patchSourcePolicySchema.parse(request.body);
    return updateSourcePolicy(app.prisma, body, app.appConfig);
  });

  app.get("/api/settings/system", async () => {
    const roleMeta = buildRoleMeta(app.appConfig.APP_ROLE);
    const sourcePolicy = await resolveSourcePolicy(app.prisma, app.appConfig);

    return {
      role: app.appConfig.APP_ROLE,
      ...roleMeta,
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
      sourcePolicy
    };
  });
}
