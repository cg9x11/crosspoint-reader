import fs from "node:fs/promises";
import path from "node:path";

import type { FastifyInstance } from "fastify";
import { load as loadHtml } from "cheerio";
import { z } from "zod";

import { buildBookEpub } from "../../epub/builder.js";
import { readEpubCoverBuffer, syncNovelCoverAssets } from "../../library/cover-assets.js";
import { appendChaptersFromUpload, importNovelFromUpload } from "../../library/import.js";
import { getSourceHandler } from "../../plugins/service.js";
import {
  deleteLibraryNovel,
  getChapterHtmlPath,
  getCachedCoverPngPath,
  getPublishedChapterCandidates,
  getLibraryNovel,
  getPublishedCoverBmpPath,
  listLibraryNovels,
  purgeLibraryNovelArtifacts,
  updateNovelAggregateState,
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
import sharp from "sharp";

const createLibraryNovelSchema = z.object({
  sourceId: z.string().min(1),
  detailUrl: z.string().min(1),
  syncNow: z.boolean().optional().default(true)
});

const updateUploadedNovelSchema = z.object({
  title: z.string().trim().min(1).optional(),
  author: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional()
});

function isLocalUploadNovel(novel: { sourceId?: string | null; sourceUrl?: string | null }) {
  return novel.sourceId === "local-upload" || String(novel.sourceUrl || "").startsWith("upload:");
}

async function createCompletedSyncRun(
  app: FastifyInstance,
  novelId: string,
  triggerType: string,
  totalFound: number,
  newChapters: number
) {
  await app.prisma.syncRun.create({
    data: {
      novelId,
      triggerType,
      status: "completed",
      totalFound,
      newChapters,
      startedAt: new Date(),
      endedAt: new Date()
    }
  });
}

function plainTextToHtml(text: string) {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const blocks = escaped
    .split(/\r?\n\r?\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return "<p></p>";
  }

  return blocks
    .map((block) => `<p>${block.replace(/\r?\n/g, "<br/>")}</p>`)
    .join("\n");
}

function stripLeadingChapterTitle(text: string, chapterTitle: string) {
  const normalizedTitle = String(chapterTitle || "").trim();
  if (!normalizedTitle) {
    return text;
  }

  const lines = String(text || "").split(/\r?\n/);
  while (lines.length && !lines[0]?.trim()) {
    lines.shift();
  }

  if (lines[0]?.trim() === normalizedTitle) {
    lines.shift();
    while (lines.length && !lines[0]?.trim()) {
      lines.shift();
    }
  }

  return lines.join("\n");
}

function stripLeadingSourceFilename(text: string) {
  const lines = String(text || "").split(/\r?\n/);
  while (lines.length && !lines[0]?.trim()) {
    lines.shift();
  }

  const firstLine = lines[0]?.trim() || "";
  if (/^[^\s\\/:*?"<>|]+\.html$/i.test(firstLine)) {
    lines.shift();
    while (lines.length && !lines[0]?.trim()) {
      lines.shift();
    }
  }

  return lines.join("\n");
}

function looksLikeSlugChapterTitle(title: string, sourceUrl?: string | null) {
  const normalized = String(title || "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const sourceSlug = sourceUrl
    ? path.posix.basename(new URL(sourceUrl).pathname).trim().toLowerCase()
    : "";

  return normalized === sourceSlug || /^c\d+-/i.test(normalized) || normalized.endsWith(".html");
}

function extractTitleFromStoredHtml(html: string) {
  try {
    const $ = loadHtml(html);
    return $("h1").first().text().trim() || $("h2").first().text().trim() || $("title").first().text().trim() || null;
  } catch {
    return null;
  }
}

async function resolveReadableChapterTitle(
  app: FastifyInstance,
  chapter: {
    sourceId?: string;
    novelSourceUrl?: string | null;
    novelId: string;
    chapterIndex: number;
    title: string;
    sourceUrl?: string | null;
    epubPath?: string | null;
  }
) {
  if (!looksLikeSlugChapterTitle(chapter.title, chapter.sourceUrl)) {
    return chapter.title;
  }

  const content = await loadChapterContentHtml(app, chapter);
  if (content.html) {
    const extracted = extractTitleFromStoredHtml(content.html);
    if (extracted && !looksLikeSlugChapterTitle(extracted, chapter.sourceUrl)) {
      return extracted;
    }
  }

  if (content.chapterAsset?.path?.toLowerCase().endsWith(".txt")) {
    try {
      const rawText = await fs.readFile(content.chapterAsset.path, "utf8");
      const firstLine = String(rawText || "").split(/\r?\n/).find((line) => line.trim())?.trim() || "";
      if (firstLine && !looksLikeSlugChapterTitle(firstLine, chapter.sourceUrl)) {
        return firstLine;
      }
    } catch {
      return chapter.title;
    }
  }

  if (chapter.sourceId && chapter.novelSourceUrl && chapter.sourceUrl) {
    try {
      const handler = await getSourceHandler(app.storagePaths, app.prisma, chapter.sourceId);
      const upstreamChapters = await handler.chapters(chapter.novelSourceUrl);
      const matchedChapter =
        upstreamChapters.find((item) => item.sourceUrl === chapter.sourceUrl) ||
        upstreamChapters.find((item) => item.chapterIndex === chapter.chapterIndex);
      if (matchedChapter?.title && !looksLikeSlugChapterTitle(matchedChapter.title, chapter.sourceUrl)) {
        return matchedChapter.title;
      }
    } catch {
      return chapter.title;
    }
  }

  return chapter.title;
}

async function resolvePublishedChapterAsset(
  storagePaths: FastifyInstance["storagePaths"],
  novelId: string,
  chapterIndex: number,
  storedRelativePath?: string | null
) {
  const candidates = getPublishedChapterCandidates(storagePaths, novelId, chapterIndex, storedRelativePath);
  for (const candidate of candidates) {
    if (await fileExists(candidate.path)) {
      return candidate;
    }
  }
  return null;
}

async function loadChapterContentHtml(
  app: FastifyInstance,
  chapter: {
    novelId: string;
    chapterIndex: number;
    title: string;
    epubPath?: string | null;
  }
) {
  const htmlPath = getChapterHtmlPath(app.storagePaths, chapter.novelId, chapter.chapterIndex);
  const chapterAsset = await resolvePublishedChapterAsset(
    app.storagePaths,
    chapter.novelId,
    chapter.chapterIndex,
    chapter.epubPath
  );
  const htmlExists = await fileExists(htmlPath);
  const chapterFileExists = Boolean(chapterAsset);

  if (htmlExists) {
    return {
      html: await fs.readFile(htmlPath, "utf8"),
      htmlExists,
      chapterFileExists,
      chapterAsset,
      source: "html_cache" as const
    };
  }

  if (!chapterAsset) {
    return {
      html: null,
      htmlExists,
      chapterFileExists,
      chapterAsset,
      source: "missing" as const
    };
  }

  if (chapterAsset.path.toLowerCase().endsWith(".txt")) {
    const rawText = await fs.readFile(chapterAsset.path, "utf8");
    return {
      html: plainTextToHtml(stripLeadingChapterTitle(stripLeadingSourceFilename(rawText), chapter.title)),
      htmlExists,
      chapterFileExists,
      chapterAsset,
      source: "published_txt" as const
    };
  }

  return {
    html: null,
    htmlExists,
    chapterFileExists,
    chapterAsset,
    source: "legacy_asset" as const
  };
}

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

  app.post("/api/library/uploads/novel", async (request, reply) => {
    const file = await request.file();
    if (!file) {
      reply.code(400);
      return { ok: false, error: "UPLOAD_FILE_REQUIRED", message: "Chọn file EPUB hoặc ZIP chứa chapter TXT." };
    }
    const fields = file.fields as Record<string, { value: string }>;
    const title = fields.title?.value?.trim() || null;
    const author = fields.author?.value?.trim() || null;
    const description = fields.description?.value?.trim() || null;
    const buffer = await file.toBuffer();
    const lowerName = file.filename.toLowerCase();
    if (!lowerName.endsWith(".epub") && !lowerName.endsWith(".zip")) {
      reply.code(400);
      return { ok: false, error: "UPLOAD_FILE_TYPE_UNSUPPORTED", message: "Chỉ hỗ trợ .epub hoặc .zip." };
    }
    const item = await importNovelFromUpload(app.prisma, app.storagePaths, {
      fileName: file.filename,
      buffer,
      title,
      author,
      description
    });
    await createCompletedSyncRun(app, item.id, "upload", 0, Number(item.totalChapters) || 0);
    return { ok: true, item: await getLibraryNovel(app.prisma, item.id) };
  });

  app.patch("/api/library/novels/:novelId/uploaded", async (request, reply) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    const body = updateUploadedNovelSchema.parse(request.body || {});
    const novel = await app.prisma.novel.findUnique({
      where: { id: params.novelId },
      select: { id: true, sourceId: true, sourceUrl: true }
    });
    if (!novel) {
      reply.code(404);
      return { ok: false, error: "NOVEL_NOT_FOUND" };
    }
    if (!isLocalUploadNovel(novel)) {
      reply.code(400);
      return { ok: false, error: "NOVEL_NOT_LOCAL_UPLOAD", message: "Chỉ sửa trực tiếp truyện upload local." };
    }

    await app.prisma.novel.update({
      where: { id: params.novelId },
      data: {
        title: body.title,
        author: body.author === undefined ? undefined : body.author || null,
        description: body.description === undefined ? undefined : body.description || null
      }
    });

    return { ok: true, item: await getLibraryNovel(app.prisma, params.novelId) };
  });

  app.post("/api/library/novels/:novelId/uploaded/cover", async (request, reply) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    const novel = await app.prisma.novel.findUnique({
      where: { id: params.novelId },
      select: { id: true, sourceId: true, sourceUrl: true }
    });
    if (!novel) {
      reply.code(404);
      return { ok: false, error: "NOVEL_NOT_FOUND" };
    }
    if (!isLocalUploadNovel(novel)) {
      reply.code(400);
      return { ok: false, error: "NOVEL_NOT_LOCAL_UPLOAD", message: "Chỉ sửa trực tiếp truyện upload local." };
    }

    const file = await request.file();
    if (!file) {
      reply.code(400);
      return { ok: false, error: "UPLOAD_FILE_REQUIRED", message: "Chọn file cover." };
    }

    const mediaType = String(file.mimetype || "").toLowerCase();
    if (!mediaType.startsWith("image/")) {
      reply.code(400);
      return { ok: false, error: "UPLOAD_FILE_TYPE_UNSUPPORTED", message: "Cover phải là file ảnh." };
    }

    const buffer = await file.toBuffer();
    const optimized = await sharp(buffer, { animated: false })
      .rotate()
      .flatten({ background: "#ffffff" })
      .png({ compressionLevel: 9, effort: 10, palette: true })
      .toBuffer();
    const coverUrl = `data:image/png;base64,${optimized.toString("base64")}`;

    await app.prisma.novel.update({
      where: { id: params.novelId },
      data: { coverUrl }
    });
    await syncNovelCoverAssets(app.prisma, app.storagePaths, {
      id: params.novelId,
      coverUrl
    });

    return { ok: true, item: await getLibraryNovel(app.prisma, params.novelId) };
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

    const chapters = await Promise.all(
      (item.chapters || []).map(async (chapter) => ({
        ...chapter,
        title: await resolveReadableChapterTitle(app, {
          ...chapter,
          sourceId: item.sourceId,
          novelSourceUrl: item.sourceUrl
        })
      }))
    );

    return {
      ...item,
      chapters
    };
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

    const content = await loadChapterContentHtml(app, chapter);
    const { htmlExists, chapterFileExists, chapterAsset } = content;

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

    if (!content.html && content.source === "legacy_asset") {
      reply.code(409);
      return {
        ok: false,
        error: "CHAPTER_PREVIEW_REBUILD_REQUIRED",
        message: "Chuong dang o dinh dang cu. Hay rebuild lai truyen de xem preview tren web.",
        integrity: {
          htmlExists,
          chapterFileExists
        }
      };
    }

    if (!content.html) {
      reply.code(409);
      return {
        ok: false,
        error: "CHAPTER_HTML_MISSING",
        message: "Khong tim thay noi dung local de preview chuong nay.",
        integrity: {
          htmlExists,
          chapterFileExists
        }
      };
    }

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
        html: content.html,
        fileSize: chapter.fileSize,
        checksum: chapter.checksum,
        publishedAt: chapter.publishedAt?.toISOString() ?? null,
        updatedAt: chapter.updatedAt.toISOString(),
        chapterUrl: `/opds/download/${encodeURIComponent(chapter.novelId)}/${chapterAsset?.fileName || formatChapterFilename(chapter.chapterIndex, 3)}`,
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

  app.post("/api/library/novels/:novelId/uploads/chapters", async (request, reply) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    const beforeNovel = await app.prisma.novel.findUnique({ where: { id: params.novelId }, select: { totalChapters: true } });
    const file = await request.file();
    if (!file) {
      reply.code(400);
      return { ok: false, error: "UPLOAD_FILE_REQUIRED", message: "Chọn file TXT hoặc ZIP chapter." };
    }
    const fields = file.fields as Record<string, { value: string }>;
    const startIndexRaw = Number(fields.startIndex?.value || 0);
    const buffer = await file.toBuffer();
    const lowerName = file.filename.toLowerCase();
    if (!lowerName.endsWith(".txt") && !lowerName.endsWith(".zip")) {
      reply.code(400);
      return { ok: false, error: "UPLOAD_FILE_TYPE_UNSUPPORTED", message: "Chỉ hỗ trợ .txt hoặc .zip cho upload chapter." };
    }
    const item = await appendChaptersFromUpload(app.prisma, app.storagePaths, {
      novelId: params.novelId,
      fileName: file.filename,
      buffer,
      startIndex: Number.isFinite(startIndexRaw) && startIndexRaw > 0 ? startIndexRaw : null
    });
    await createCompletedSyncRun(
      app,
      params.novelId,
      "upload_chapters",
      0,
      Math.max(0, Number(item?.totalChapters || 0) - Number(beforeNovel?.totalChapters || 0))
    );
    return { ok: true, item };
  });

  app.delete("/api/library/novels/:novelId/chapters/:chapterId", async (request, reply) => {
    const params = z
      .object({
        novelId: z.string().min(1),
        chapterId: z.string().min(1)
      })
      .parse(request.params);

    const chapter = await app.prisma.chapter.findFirst({
      where: { id: params.chapterId, novelId: params.novelId },
      include: { novel: { select: { sourceId: true, sourceUrl: true } } }
    });
    if (!chapter) {
      reply.code(404);
      return { ok: false, error: "CHAPTER_NOT_FOUND" };
    }
    if (!isLocalUploadNovel(chapter.novel)) {
      reply.code(400);
      return { ok: false, error: "NOVEL_NOT_LOCAL_UPLOAD", message: "Chỉ xóa chapter của truyện upload local." };
    }

    const htmlPath = getChapterHtmlPath(app.storagePaths, params.novelId, chapter.chapterIndex);
    const chapterAssets = getPublishedChapterCandidates(app.storagePaths, params.novelId, chapter.chapterIndex, chapter.epubPath);

    await app.prisma.chapter.delete({ where: { id: chapter.id } });
    await Promise.all([
      fs.rm(htmlPath, { force: true }).catch(() => undefined),
      ...chapterAssets.map((asset) => fs.rm(asset.path, { force: true }).catch(() => undefined))
    ]);
    await updateNovelAggregateState(app.prisma, params.novelId);

    return { ok: true, item: await getLibraryNovel(app.prisma, params.novelId) };
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

    try {
      const chapterPayload = [];
      for (const chapter of novel.chapters) {
        const content = await loadChapterContentHtml(app, chapter);
        if (!content.chapterFileExists) {
          reply.code(409);
          return {
            ok: false,
            error: "CHAPTER_FILE_MISSING",
            message: `Chuong ${chapter.chapterIndex} dang thieu file local, khong the xuat EPUB.`,
            chapterIndex: chapter.chapterIndex
          };
        }

        if (!content.html && content.source === "legacy_asset") {
          reply.code(409);
          return {
            ok: false,
            error: "EXPORT_REBUILD_REQUIRED",
            message: `Chuong ${chapter.chapterIndex} dang o dinh dang cu. Hay rebuild lai truyen truoc khi xuat EPUB.`,
            chapterIndex: chapter.chapterIndex
          };
        }

        if (!content.html) {
          reply.code(409);
          return {
            ok: false,
            error: "CHAPTER_HTML_MISSING",
            message: `Khong tim thay noi dung local cua chuong ${chapter.chapterIndex}.`,
            chapterIndex: chapter.chapterIndex
          };
        }

        chapterPayload.push({
          title: chapter.title,
          sourceUrl: chapter.sourceUrl,
          contentHtml: content.html
        });
      }

      const now = new Date();
      await app.prisma.syncRun.updateMany({
        where: {
          novelId: novel.id,
          triggerType: "export",
          status: "running"
        },
        data: {
          status: "failed",
          errorMessage: "Superseded by a newer export request.",
          endedAt: now
        }
      });

      const syncRun = await app.prisma.syncRun.create({
        data: {
          novelId: novel.id,
          triggerType: "export",
          status: "running",
          startedAt: now,
          totalFound: chapterPayload.length,
          newChapters: 0
        }
      });

      let outputPath = "";

      try {
        const coverImage = await readEpubCoverBuffer(app.storagePaths, novel.id);
        outputPath = path.join(
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
          chapters: chapterPayload,
          onProgress: async (completedChapters, totalChapters) => {
            await app.prisma.syncRun.update({
              where: { id: syncRun.id },
              data: {
                totalFound: totalChapters,
                newChapters: completedChapters
              }
            });
          }
        });

        await app.prisma.syncRun.update({
          where: { id: syncRun.id },
          data: {
            status: "completed",
            endedAt: new Date(),
            totalFound: chapterPayload.length,
            newChapters: chapterPayload.length,
            errorMessage: null
          }
        });

        const fileName = `${sanitizeFileSegment(novel.title)}.epub`;
        const file = await fs.readFile(outputPath);
        reply.header("Content-Disposition", `attachment; filename="${fileName}"`);
        reply.type("application/epub+zip");
        return file;
      } catch (error) {
        await app.prisma.syncRun.update({
          where: { id: syncRun.id },
          data: {
            status: "failed",
            endedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : "Export EPUB failed"
          }
        });
        throw error;
      } finally {
        if (outputPath) {
          await fs.rm(outputPath, { force: true }).catch(() => undefined);
        }
      }
    } catch (error) {
      throw error;
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

    const translationProjectCount = await app.prisma.translationProject.count({
      where: { novelId: params.novelId }
    });
    if (translationProjectCount > 0) {
      reply.code(409);
      return {
        ok: false,
        error: "NOVEL_HAS_TRANSLATION_PROJECTS",
        message: `Không thể xóa truyện vì còn ${translationProjectCount} project dịch. Hãy xóa project dịch trước.`
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
