import fs from "node:fs/promises";

import type { FastifyInstance } from "fastify";

import { z } from "zod";

import {
  deleteLibraryNovel,
  getChapterHtmlPath,
  getLibraryNovel,
  getPublishedChapterPath,
  listLibraryNovels,
  purgeLibraryNovelArtifacts,
  upsertNovelFromSourceDetail
} from "../../library/service.js";
import { fileExists, formatChapterFilename } from "../../lib/filesystem.js";
import { getSourceDetail } from "../../plugins/service.js";
import {
  removeNovelQueueJobs,
  retryChapterPipeline,
  retryNovelPipeline,
  scheduleNovelSync
} from "../../worker/handlers.js";

const createLibraryNovelSchema = z.object({
  sourceId: z.string().min(1),
  detailUrl: z.string().min(1),
  syncNow: z.boolean().optional().default(true)
});

export async function registerLibraryApiRoutes(app: FastifyInstance) {
  app.get("/api/library/novels", async (request) => {
    const query = z
      .object({
        query: z.string().trim().optional(),
        status: z.string().trim().optional(),
        syncStatus: z.string().trim().optional()
      })
      .parse(request.query);

    return {
      items: await listLibraryNovels(app.prisma, query)
    };
  });

  app.post("/api/library/novels", async (request) => {
    const body = createLibraryNovelSchema.parse(request.body);
    const detail = await getSourceDetail(app.storagePaths, app.prisma, body.sourceId, body.detailUrl);
    const novel = await upsertNovelFromSourceDetail(app.prisma, body.sourceId, detail);

    if (body.syncNow) {
      await scheduleNovelSync(app.queues, app.prisma, novel.id, "add");
    }

    return {
      ok: true,
      item: await getLibraryNovel(app.prisma, novel.id)
    };
  });

  app.get("/api/library/novels/:novelId", async (request, reply) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    const item = await getLibraryNovel(app.prisma, params.novelId);

    if (!item) {
      reply.code(404);
      return {
        ok: false,
        error: "NOVEL_NOT_FOUND"
      };
    }

    return item;
  });

  app.get("/api/library/novels/:novelId/chapters/:chapterId/preview", async (request, reply) => {
    const params = z
      .object({
        novelId: z.string().min(1),
        chapterId: z.string().min(1)
      })
      .parse(request.params);

    const chapter = await app.prisma.chapter.findFirst({
      where: {
        id: params.chapterId,
        novelId: params.novelId
      },
      include: {
        novel: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!chapter) {
      reply.code(404);
      return {
        ok: false,
        error: "CHAPTER_NOT_FOUND",
        message: "Không tìm thấy chương trong thư viện."
      };
    }

    const htmlPath = getChapterHtmlPath(app.storagePaths, chapter.novelId, chapter.chapterIndex);
    const epubPath = getPublishedChapterPath(app.storagePaths, chapter.novelId, chapter.chapterIndex);
    const [htmlExists, epubExists] = await Promise.all([fileExists(htmlPath), fileExists(epubPath)]);

    if (chapter.status !== "published") {
      reply.code(409);
      return {
        ok: false,
        error: "CHAPTER_NOT_PUBLISHED",
        message: "Chương này chưa hoàn tất publish nên chưa thể xem local.",
        integrity: {
          htmlExists,
          epubExists
        }
      };
    }

    if (!htmlExists) {
      reply.code(409);
      return {
        ok: false,
        error: "CHAPTER_HTML_MISSING",
        message: "Không tìm thấy HTML local của chương đã tải.",
        integrity: {
          htmlExists,
          epubExists
        }
      };
    }

    if (!epubExists) {
      reply.code(409);
      return {
        ok: false,
        error: "CHAPTER_EPUB_MISSING",
        message: "Chương đã đánh dấu publish nhưng file EPUB đang thiếu.",
        integrity: {
          htmlExists,
          epubExists
        }
      };
    }

    const html = await fs.readFile(htmlPath, "utf8");

    return {
      ok: true,
      item: {
        id: chapter.id,
        novelId: chapter.novelId,
        novelTitle: chapter.novel.title,
        chapterIndex: chapter.chapterIndex,
        title: chapter.title,
        status: chapter.status,
        sourceUrl: chapter.sourceUrl,
        html,
        fileSize: chapter.fileSize,
        checksum: chapter.checksum,
        publishedAt: chapter.publishedAt?.toISOString() ?? null,
        updatedAt: chapter.updatedAt.toISOString(),
        epubUrl: `/opds/download/${encodeURIComponent(chapter.novelId)}/${formatChapterFilename(chapter.chapterIndex, 3)}`,
        integrity: {
          htmlExists,
          epubExists
        }
      }
    };
  });

  app.post("/api/library/novels/:novelId/sync", async (request) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    await scheduleNovelSync(app.queues, app.prisma, params.novelId, "manual");
    return { ok: true };
  });

  app.post("/api/library/novels/:novelId/retry", async (request) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    return retryNovelPipeline(app.queues, app.prisma, app.storagePaths, params.novelId);
  });

  app.post("/api/library/novels/:novelId/chapters/:chapterId/retry", async (request) => {
    const params = z
      .object({
        novelId: z.string().min(1),
        chapterId: z.string().min(1)
      })
      .parse(request.params);
    return retryChapterPipeline(app.queues, app.prisma, app.storagePaths, params.novelId, params.chapterId);
  });

  app.delete("/api/library/novels/:novelId", async (request, reply) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    const novel = await getLibraryNovel(app.prisma, params.novelId);
    if (!novel) {
      reply.code(404);
      return {
        ok: false,
        error: "NOVEL_NOT_FOUND"
      };
    }

    await removeNovelQueueJobs(
      app.queues,
      novel.id,
      novel.chapters.map((chapter) => chapter.id)
    );
    await purgeLibraryNovelArtifacts(app.storagePaths, params.novelId);
    await deleteLibraryNovel(app.prisma, params.novelId);
    return { ok: true };
  });
}
