import fs from "node:fs/promises";
import path from "node:path";

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { buildBookEpub } from "../../epub/builder.js";
import { readEpubCoverBuffer } from "../../library/cover-assets.js";
import {
  deleteLibraryNovel,
  getChapterHtmlPath,
  getCachedCoverPngPath,
  getLibraryNovel,
  getPublishedChapterPath,
  getPublishedCoverBmpPath,
  listLibraryNovels,
  purgeLibraryNovelArtifacts,
  upsertNovelFromSourceDetail
} from "../../library/service.js";
import { fileExists, formatChapterFilename, sanitizeFileSegment } from "../../lib/filesystem.js";
import { getSourceDetail } from "../../plugins/service.js";
import { isVbookUpstreamBlockedError } from "../../plugins/vbook/runtime.js";
import {
  rebuildNovelPipeline,
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

  app.get("/api/library/novels/:novelId/cover", async (request, reply) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    const pngPath = getCachedCoverPngPath(app.storagePaths, params.novelId);
    if (await fileExists(pngPath)) {
      reply.type("image/png");
      return fs.readFile(pngPath);
    }

    const bmpPath = getPublishedCoverBmpPath(app.storagePaths, params.novelId);
    if (await fileExists(bmpPath)) {
      reply.type("image/bmp");
      return fs.readFile(bmpPath);
    }

    reply.code(404);
    return {
      ok: false,
      error: "COVER_NOT_FOUND"
    };
  });

  app.post("/api/library/novels", async (request, reply) => {
    const body = createLibraryNovelSchema.parse(request.body);
    let detail;
    try {
      detail = await getSourceDetail(app.storagePaths, app.prisma, body.sourceId, body.detailUrl);
    } catch (error) {
      if (!isVbookUpstreamBlockedError(error)) {
        throw error;
      }

      reply.code(409);
      return {
        ok: false,
        error: "SOURCE_UPSTREAM_BLOCKED",
        message:
          "Nguon dang chan truy cap chi tiet truyen tu server, nen hien chua the them truc tiep vao thu vien. Hay thu lai sau."
      };
    }

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
        message: "Khong tim thay chuong trong thu vien."
      };
    }

    const htmlPath = getChapterHtmlPath(app.storagePaths, chapter.novelId, chapter.chapterIndex);
    const chapterPath = getPublishedChapterPath(app.storagePaths, chapter.novelId, chapter.chapterIndex);
    const [htmlExists, chapterFileExists] = await Promise.all([
      fileExists(htmlPath),
      fileExists(chapterPath)
    ]);

    if (chapter.status !== "published") {
      reply.code(409);
      return {
        ok: false,
        error: "CHAPTER_NOT_PUBLISHED",
        message: "Chuong nay chua hoan tat publish nen chua the xem local.",
        integrity: {
          htmlExists,
          chapterFileExists
        }
      };
    }

    if (!htmlExists) {
      reply.code(409);
      return {
        ok: false,
        error: "CHAPTER_HTML_MISSING",
        message: "Khong tim thay HTML local cua chuong da tai.",
        integrity: {
          htmlExists,
          chapterFileExists
        }
      };
    }

    if (!chapterFileExists) {
      reply.code(409);
      return {
        ok: false,
        error: "CHAPTER_FILE_MISSING",
        message: "Chuong da publish nhung file local dang thieu.",
        integrity: {
          htmlExists,
          chapterFileExists
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
        chapterUrl: `/opds/download/${encodeURIComponent(chapter.novelId)}/${formatChapterFilename(chapter.chapterIndex, 3)}`,
        integrity: {
          htmlExists,
          chapterFileExists
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

  app.post("/api/library/novels/:novelId/rebuild", async (request) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    return rebuildNovelPipeline(app.queues, app.prisma, app.storagePaths, params.novelId);
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

  app.get("/api/library/novels/:novelId/export.epub", async (request, reply) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    const novel = await app.prisma.novel.findUnique({
      where: { id: params.novelId },
      include: {
        chapters: {
          where: { status: "published" },
          orderBy: { chapterIndex: "asc" }
        }
      }
    });

    if (!novel) {
      reply.code(404);
      return {
        ok: false,
        error: "NOVEL_NOT_FOUND"
      };
    }

    if (!novel.chapters.length) {
      reply.code(409);
      return {
        ok: false,
        error: "NO_PUBLISHED_CHAPTERS",
        message: "Truyen chua co chuong nao da tai de xuat EPUB."
      };
    }

    const chapterPayload = await Promise.all(
      novel.chapters.map(async (chapter) => {
        const htmlPath = getChapterHtmlPath(app.storagePaths, chapter.novelId, chapter.chapterIndex);
        return {
          title: chapter.title,
          sourceUrl: chapter.sourceUrl,
          contentHtml: await fs.readFile(htmlPath, "utf8")
        };
      })
    );

    const coverImage = await readEpubCoverBuffer(app.storagePaths, novel.id);
    const outputPath = path.join(
      app.storagePaths.tempEpubBuildDir,
      "exports",
      `${novel.id}-${Date.now()}.epub`
    );

    await buildBookEpub({
      outputPath,
      identifier: `${novel.sourceId}:${novel.id}:full`,
      title: novel.title,
      author: novel.author,
      description: novel.description,
      coverImage: coverImage
        ? {
            buffer: coverImage.buffer,
            mediaType: coverImage.mediaType,
            fileName: "images/cover.png"
          }
        : null,
      chapters: chapterPayload
    });

    const fileName = `${sanitizeFileSegment(novel.title)}.epub`;

    try {
      const file = await fs.readFile(outputPath);
      reply.header("Content-Disposition", `attachment; filename="${fileName}"`);
      reply.type("application/epub+zip");
      return file;
    } finally {
      await fs.rm(outputPath, { force: true }).catch(() => undefined);
    }
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
