import fs from "node:fs/promises";

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getChapterHtmlPath } from "../../library/service.js";

import {
  activateGlossaryVersion,
  buildTranslationExportEpub,
  buildTranslationExportTxt,
  createEditedVersion,
  createGlossaryVersion,
  createTranslationProject,
  deleteTranslationProject,
  deleteTranslationVersion,
  generateGlossarySuggestions,
  getProjectChapterDetail,
  getProjectEditions,
  getTranslationProject,
  listTranslationProjects,
  scheduleProjectRun,
  setDefaultEdition,
  setPublishedVersion,
  updateGlossaryEntries,
  updateTranslationProject
} from "../../translations/service.js";
import { getTranslationSettings, saveTranslationSettings } from "../../translations/settings.js";
import { translateTexts } from "../../translations/provider.js";

const projectCreateSchema = z.object({
  novelId: z.string().min(1),
  name: z.string().trim().min(1),
  targetLanguage: z.string().trim().default("vi"),
  provider: z.enum(["openai", "gemini"]).default("openai"),
  model: z.string().trim().default("gpt-4.1-mini"),
  systemPrompt: z.string().optional(),
  styleGuideJson: z.string().optional(),
  contextMode: z.enum(["off", "light", "strong"]).default("light"),
  historyDepth: z.coerce.number().int().min(0).max(12).default(3),
  autoTranslateNewChapters: z.boolean().optional(),
  chapterConcurrency: z.coerce.number().int().min(1).max(4).default(1),
  isActiveAuto: z.boolean().optional(),
  isDefaultEdition: z.boolean().optional()
});

const settingsPatchSchema = z.object({
  credentials: z.array(z.object({
    provider: z.string().trim().min(1),
    label: z.string().trim().min(1),
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
    modelHint: z.string().optional(),
    enabled: z.boolean().optional()
  })).optional(),
  runtime: z.object({
    maxActiveProjects: z.coerce.number().int().min(1).max(8).optional(),
    maxChapterConcurrency: z.coerce.number().int().min(1).max(8).optional(),
    requestTimeoutMs: z.coerce.number().int().min(5000).max(180000).optional(),
    maxCharsPerRequest: z.coerce.number().int().min(500).max(12000).optional()
  }).optional()
});

const settingsTestSchema = z.object({
  provider: z.string().trim().min(1),
  baseUrl: z.string().trim().optional(),
  apiKey: z.string().optional(),
  modelHint: z.string().trim().min(1),
  runtime: z.object({
    maxActiveProjects: z.coerce.number().int().min(1).max(8).optional(),
    maxChapterConcurrency: z.coerce.number().int().min(1).max(8).optional(),
    requestTimeoutMs: z.coerce.number().int().min(5000).max(180000).optional(),
    maxCharsPerRequest: z.coerce.number().int().min(500).max(12000).optional()
  }).optional()
});

const glossaryVersionCreateSchema = z.object({
  sourceType: z.string().trim().default("manual"),
  activate: z.boolean().optional(),
  entries: z.array(z.record(z.string(), z.unknown()))
});

const projectRunSchema = z.object({
  triggerType: z.string().trim().default("manual"),
  scope: z.string().trim().default("project")
});

const chapterVersionCreateSchema = z.object({
  html: z.string().min(1),
  publish: z.boolean().optional(),
  createdBy: z.string().trim().default("web-editor")
});

export async function registerTranslationsApiRoutes(app: FastifyInstance) {
  app.get("/api/translations/projects", async () => {
    return { items: await listTranslationProjects(app.prisma) };
  });

  app.post("/api/translations/projects", async (request) => {
    const body = projectCreateSchema.parse(request.body);
    const settings = await getTranslationSettings(app.prisma, app.appConfig);
    const defaultCredential = settings.credentials.find((item) => item.enabled !== false) || settings.credentials[0];
    return {
      ok: true,
      item: await createTranslationProject(app.prisma, body.novelId, {
        ...body,
        provider: body.provider || defaultCredential?.provider || "openai",
        model: body.model || defaultCredential?.modelHint || "gpt-4.1-mini"
      })
    };
  });

  app.get("/api/translations/projects/:projectId", async (request, reply) => {
    const params = z.object({ projectId: z.string().min(1) }).parse(request.params);
    const item = await getTranslationProject(app.prisma, params.projectId);
    if (!item) {
      reply.code(404);
      return { ok: false, error: "TRANSLATION_PROJECT_NOT_FOUND" };
    }
    return { item };
  });

  app.patch("/api/translations/projects/:projectId", async (request) => {
    const params = z.object({ projectId: z.string().min(1) }).parse(request.params);
    const body = projectCreateSchema.partial().parse(request.body);
    const settings = await getTranslationSettings(app.prisma, app.appConfig);
    const defaultCredential = settings.credentials.find((item) => item.enabled !== false) || settings.credentials[0];
    return {
      ok: true,
      item: await updateTranslationProject(app.prisma, params.projectId, {
        ...body,
        provider: body.provider === undefined ? (defaultCredential?.provider || "openai") : body.provider,
        model: body.model === undefined ? (defaultCredential?.modelHint || "gpt-4.1-mini") : body.model
      })
    };
  });

  app.delete("/api/translations/projects/:projectId", async (request) => {
    const params = z.object({ projectId: z.string().min(1) }).parse(request.params);
    return {
      ok: true,
      item: await deleteTranslationProject(app.prisma, params.projectId)
    };
  });

  app.post("/api/translations/projects/:projectId/start", async (request) => {
    const params = z.object({ projectId: z.string().min(1) }).parse(request.params);
    const body = projectRunSchema.parse(request.body || {});
    return {
      ok: true,
      item: await scheduleProjectRun(app.prisma, app.queues, params.projectId, body.triggerType, body.scope)
    };
  });

  app.post("/api/translations/projects/:projectId/rebuild", async (request) => {
    const params = z.object({ projectId: z.string().min(1) }).parse(request.params);
    return {
      ok: true,
      item: await scheduleProjectRun(app.prisma, app.queues, params.projectId, "rebuild", "project")
    };
  });

  app.get("/api/translations/settings", async () => {
    return await getTranslationSettings(app.prisma, app.appConfig);
  });

  app.patch("/api/translations/settings", async (request) => {
    const body = settingsPatchSchema.parse(request.body);
    return await saveTranslationSettings(app.prisma, app.appConfig, body);
  });


  app.post("/api/translations/settings/test", async (request, reply) => {
    const body = settingsTestSchema.parse(request.body);
    try {
      const current = await getTranslationSettings(app.prisma, app.appConfig);
      const runtime = {
        ...current.runtime,
        ...(body.runtime || {}),
        requestTimeoutMs: Math.min(Number(body.runtime?.requestTimeoutMs || current.runtime.requestTimeoutMs || 12000), 12000),
        maxCharsPerRequest: Math.min(Number(body.runtime?.maxCharsPerRequest || current.runtime.maxCharsPerRequest || 500), 500)
      };
      const startedAt = Date.now();
      const result = await translateTexts(
        {
          provider: body.provider,
          label: 'test',
          apiKey: body.apiKey,
          baseUrl: body.baseUrl,
          modelHint: body.modelHint,
          enabled: true
        },
        body.provider,
        body.modelHint,
        'Return same text in JSON items array.',
        ['ping'],
        runtime
      );
      return {
        ok: true,
        latencyMs: Date.now() - startedAt,
        preview: result.texts?.[0] || '',
        tokenUsage: result.tokenUsage || 0
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Provider test failed';
      if (/429|Too Many Requests/i.test(message)) {
        reply.code(429);
      } else {
        reply.code(400);
      }
      return {
        ok: false,
        error: 'TRANSLATION_PROVIDER_TEST_FAILED',
        message: /Invalid JSON response:/i.test(message)
          ? `${message}. Upstream có thể đang trả SSE/HTML hoặc endpoint không tương thích OpenAI-compatible.`
          : message
      };
    }
  });

  app.get("/api/translations/projects/:projectId/glossaries", async (request, reply) => {
    const params = z.object({ projectId: z.string().min(1) }).parse(request.params);
    const item = await getTranslationProject(app.prisma, params.projectId);
    if (!item) {
      reply.code(404);
      return { ok: false, error: "TRANSLATION_PROJECT_NOT_FOUND" };
    }
    return { items: item.glossaries };
  });

  app.post("/api/translations/projects/:projectId/glossaries", async (request) => {
    const params = z.object({ projectId: z.string().min(1) }).parse(request.params);
    const body = glossaryVersionCreateSchema.parse(request.body);
    return {
      ok: true,
      item: await createGlossaryVersion(app.prisma, params.projectId, body)
    };
  });

  app.patch("/api/translations/projects/:projectId/glossaries/:glossaryId", async (request) => {
    const params = z.object({ projectId: z.string().min(1), glossaryId: z.string().min(1) }).parse(request.params);
    const body = z.object({ entries: z.array(z.record(z.string(), z.unknown())) }).parse(request.body);
    return {
      ok: true,
      item: await updateGlossaryEntries(app.prisma, params.glossaryId, body.entries)
    };
  });

  app.post("/api/translations/projects/:projectId/glossaries/:glossaryId/activate", async (request) => {
    const params = z.object({ projectId: z.string().min(1), glossaryId: z.string().min(1) }).parse(request.params);
    return {
      ok: true,
      item: await activateGlossaryVersion(app.prisma, params.projectId, params.glossaryId)
    };
  });

  app.post("/api/translations/projects/:projectId/glossary/import", async (request) => {
    const params = z.object({ projectId: z.string().min(1) }).parse(request.params);
    const body = z.object({ entries: z.array(z.record(z.string(), z.unknown())), activate: z.boolean().optional() }).parse(request.body);
    return {
      ok: true,
      item: await createGlossaryVersion(app.prisma, params.projectId, {
        sourceType: "import",
        entries: body.entries,
        activate: body.activate ?? true
      })
    };
  });

  app.get("/api/translations/projects/:projectId/glossary/export", async (request, reply) => {
    const params = z.object({ projectId: z.string().min(1) }).parse(request.params);
    const item = await getTranslationProject(app.prisma, params.projectId);
    if (!item) {
      reply.code(404);
      return { ok: false, error: "TRANSLATION_PROJECT_NOT_FOUND" };
    }
    const glossary = item.glossaries.find((entry) => entry.isActive) || item.glossaries[0];
    return {
      ok: true,
      item: glossary,
      entries: glossary?.entries || []
    };
  });

  app.post("/api/translations/projects/:projectId/glossary/suggest", async (request) => {
    const params = z.object({ projectId: z.string().min(1) }).parse(request.params);
    return {
      ok: true,
      items: await generateGlossarySuggestions(app.prisma, app.appConfig, app.storagePaths, params.projectId)
    };
  });

  app.get("/api/translations/projects/:projectId/chapters/:chapterTranslationId", async (request, reply) => {
    const params = z.object({ projectId: z.string().min(1), chapterTranslationId: z.string().min(1) }).parse(request.params);
    const item = await getProjectChapterDetail(app.prisma, params.chapterTranslationId);
    if (!item || item.projectId !== params.projectId) {
      reply.code(404);
      return { ok: false, error: "CHAPTER_TRANSLATION_NOT_FOUND" };
    }
    const versions = await Promise.all(item.versions.map(async (version) => ({
      ...version,
      html: await fs.readFile(version.htmlPath, "utf8").catch(() => "")
    })));
    const sourceHtml = await fs.readFile(getChapterHtmlPath(app.storagePaths, item.chapter.novelId, item.chapter.chapterIndex), "utf8").catch(() => "");
    return {
      item: {
        ...item,
        sourceHtml,
        versions
      }
    };
  });

  app.post("/api/translations/projects/:projectId/chapters/:chapterTranslationId/versions", async (request) => {
    const params = z.object({ projectId: z.string().min(1), chapterTranslationId: z.string().min(1) }).parse(request.params);
    const body = chapterVersionCreateSchema.parse(request.body);
    return {
      ok: true,
      item: await createEditedVersion(app.prisma, app.storagePaths, {
        chapterTranslationId: params.chapterTranslationId,
        html: body.html,
        publish: body.publish,
        createdBy: body.createdBy
      })
    };
  });

  app.patch("/api/translations/projects/:projectId/chapters/:chapterTranslationId/published-version", async (request) => {
    const params = z.object({ projectId: z.string().min(1), chapterTranslationId: z.string().min(1) }).parse(request.params);
    const body = z.object({ versionId: z.string().min(1) }).parse(request.body);
    return {
      ok: true,
      item: await setPublishedVersion(app.prisma, params.chapterTranslationId, body.versionId)
    };
  });

  app.delete("/api/translations/projects/:projectId/chapters/:chapterTranslationId/versions/:versionId", async (request) => {
    const params = z.object({ projectId: z.string().min(1), chapterTranslationId: z.string().min(1), versionId: z.string().min(1) }).parse(request.params);
    return await deleteTranslationVersion(app.prisma, params.versionId);
  });

  app.post("/api/translations/projects/:projectId/chapters/:chapterTranslationId/retranslate", async (request) => {
    const params = z.object({ projectId: z.string().min(1), chapterTranslationId: z.string().min(1) }).parse(request.params);
    const chapterTranslation = await getProjectChapterDetail(app.prisma, params.chapterTranslationId);
    if (!chapterTranslation) {
      throw new Error("CHAPTER_TRANSLATION_NOT_FOUND");
    }
    await app.queues.translationChapter.add("translate-chapter", {
      projectId: params.projectId,
      chapterId: chapterTranslation.chapterId,
      triggerType: "manual_retranslate"
    });
    return { ok: true };
  });

  app.get("/api/library/novels/:novelId/editions", async (request) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    return await getProjectEditions(app.prisma, params.novelId);
  });

  app.patch("/api/library/novels/:novelId/default-edition", async (request) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    const body = z.object({ kind: z.enum(["original", "translation"]), projectId: z.string().optional().nullable() }).parse(request.body);
    return await setDefaultEdition(app.prisma, params.novelId, body);
  });

  app.get("/api/library/novels/:novelId/editions/:editionId/export.epub", async (request, reply) => {
    const params = z.object({ novelId: z.string().min(1), editionId: z.string().min(1) }).parse(request.params);
    if (params.editionId === "original") {
      reply.code(400);
      return { ok: false, error: "ORIGINAL_EDITION_USE_DEFAULT_EXPORT" };
    }
    const filePath = await buildTranslationExportEpub(app.prisma, app.storagePaths, params.editionId);
    reply.header("content-disposition", `attachment; filename="${encodeURIComponent(`${params.editionId}.epub`)}`);
    reply.type("application/epub+zip");
    return reply.send(await fs.readFile(filePath));
  });

  app.get("/api/library/novels/:novelId/editions/:editionId/export.txt", async (request, reply) => {
    const params = z.object({ novelId: z.string().min(1), editionId: z.string().min(1) }).parse(request.params);
    if (params.editionId === "original") {
      reply.code(400);
      return { ok: false, error: "ORIGINAL_EDITION_USE_DEFAULT_EXPORT" };
    }
    const filePath = await buildTranslationExportTxt(app.prisma, app.storagePaths, params.editionId);
    reply.header("content-disposition", `attachment; filename="${encodeURIComponent(`${params.editionId}.txt`)}`);
    reply.type("text/plain; charset=utf-8");
    return reply.send(await fs.readFile(filePath));
  });
}


