import fs from "node:fs/promises";
import path from "node:path";

import type { Job } from "bullmq";
import type { PrismaClient } from "@prisma/client";

import type { AppConfig } from "../config/env.js";
import { buildChapterEpub } from "../epub/builder.js";
import {
  buildSeriesId,
  getChapterHtmlPath,
  getPublishedChapterPath,
  getPublishedChapterRelativePath,
  getPublishedManifestPath,
  getPublishedSeriesDir,
  updateNovelAggregateState
} from "../library/service.js";
import { ensureDir, writeJsonFileAtomic } from "../lib/filesystem.js";
import { sanitizeHtmlFragment } from "../lib/sanitize.js";
import { getSourceHandler, listSources } from "../plugins/service.js";
import type { ChapterBuildJobData, ChapterFetchJobData, NovelSyncJobData } from "../queues/jobs.js";
import type { AppQueues } from "../queues/index.js";
import type { StorageLayout } from "../storage/paths.js";
import {
  enqueueChapterBuild,
  enqueueChapterFetch,
  enqueueNovelSync,
  getNovelSyncJobId
} from "../queues/jobs.js";

interface WorkerContext {
  config: AppConfig;
  prisma: PrismaClient;
  queues: AppQueues;
  storagePaths: StorageLayout;
}

async function writeSeriesManifest(prisma: PrismaClient, storagePaths: StorageLayout, novelId: string) {
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      chapters: {
        where: { status: "published" },
        orderBy: { chapterIndex: "asc" }
      }
    }
  });

  if (!novel) {
    return;
  }

  const seriesDir = getPublishedSeriesDir(storagePaths, novelId);
  await ensureDir(seriesDir);
  const firstChapter = novel.chapters[0];

  const manifest = {
    version: 1,
    seriesId: buildSeriesId(novel),
    title: novel.title,
    author: novel.author,
    sourceId: novel.sourceId,
    sourceName: novel.sourceName,
    description: novel.description,
    coverPath:
      firstChapter ? path.basename(getPublishedChapterRelativePath(novelId, firstChapter.chapterIndex)) : undefined,
    status: novel.status,
    updatedAt: new Date().toISOString(),
    chapters: novel.chapters.map((chapter) => ({
      chapterIndex: chapter.chapterIndex,
      title: chapter.title,
      file: path.basename(chapter.epubPath ?? getPublishedChapterRelativePath(novelId, chapter.chapterIndex))
    }))
  };

  await writeJsonFileAtomic(getPublishedManifestPath(storagePaths, novelId), manifest);
}

async function moveFile(tempPath: string, targetPath: string) {
  await ensureDir(path.dirname(targetPath));
  try {
    await fs.rename(tempPath, targetPath);
  } catch {
    await fs.rm(targetPath, { force: true });
    await fs.rename(tempPath, targetPath);
  }
}

export async function scheduleNovelSync(
  queues: AppQueues,
  prisma: PrismaClient,
  novelId: string,
  triggerType = "manual"
) {
  await prisma.novel.update({
    where: { id: novelId },
    data: {
      syncStatus: "queued",
      lastError: null
    }
  });

  return enqueueNovelSync(queues, { novelId, triggerType });
}

export async function runScheduledSyncScan(context: WorkerContext) {
  const enabledSourceIds = new Set(
    (await listSources(context.storagePaths, context.prisma)).map((source) => source.id)
  );
  const novels = await context.prisma.novel.findMany({
    select: { id: true, sourceId: true }
  });

  let enqueued = 0;
  for (const novel of novels) {
    if (!enabledSourceIds.has(novel.sourceId)) {
      continue;
    }

    const existingJob = await context.queues.novelSync.getJob(getNovelSyncJobId(novel.id));
    const state = existingJob ? await existingJob.getState() : null;

    if (state && ["active", "waiting", "delayed"].includes(state)) {
      continue;
    }

    await scheduleNovelSync(context.queues, context.prisma, novel.id, "cron");
    enqueued += 1;
  }

  return { ok: true, enqueued };
}

export async function processNovelSyncJob(
  context: WorkerContext,
  job: Job<NovelSyncJobData>
) {
  const novel = await context.prisma.novel.findUnique({
    where: { id: job.data.novelId }
  });

  if (!novel) {
    return { ok: true, skipped: "novel_missing" };
  }

  const enabledSourceIds = new Set(
    (await listSources(context.storagePaths, context.prisma)).map((source) => source.id)
  );
  if (!enabledSourceIds.has(novel.sourceId)) {
    await context.prisma.novel.update({
      where: { id: novel.id },
      data: {
        lastError: null
      }
    });
    await updateNovelAggregateState(context.prisma, novel.id);
    return { ok: true, skipped: "source_disabled" };
  }

  const syncRun = await context.prisma.syncRun.create({
    data: {
      novelId: novel.id,
      triggerType: job.data.triggerType,
      status: "running",
      startedAt: new Date()
    }
  });

  try {
    await context.prisma.novel.update({
      where: { id: novel.id },
      data: {
        syncStatus: "syncing",
        lastSyncStartedAt: new Date(),
        lastError: null
      }
    });

    const handler = await getSourceHandler(context.storagePaths, context.prisma, novel.sourceId);
    const chapters = await handler.chapters(novel.sourceUrl);

    let newChapters = 0;
    for (const chapter of chapters) {
      const existing = await context.prisma.chapter.findUnique({
        where: {
          novelId_chapterIndex: {
            novelId: novel.id,
            chapterIndex: chapter.chapterIndex
          }
        }
      });

      if (!existing) {
        newChapters += 1;
      }

      const upserted = await context.prisma.chapter.upsert({
        where: {
          novelId_chapterIndex: {
            novelId: novel.id,
            chapterIndex: chapter.chapterIndex
          }
        },
        create: {
          novelId: novel.id,
          chapterIndex: chapter.chapterIndex,
          title: chapter.title,
          sourceUrl: chapter.sourceUrl,
          status: "pending"
        },
        update: {
          title: chapter.title,
          sourceUrl: chapter.sourceUrl
        }
      });

      if (upserted.status !== "published") {
        await context.prisma.chapter.update({
          where: { id: upserted.id },
          data: {
            status: "queued_fetch",
            lastError: null
          }
        });

        await enqueueChapterFetch(context.queues, {
          novelId: novel.id,
          chapterId: upserted.id
        });
      }
    }

    await context.prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "completed",
        totalFound: chapters.length,
        newChapters,
        endedAt: new Date()
      }
    });

    await context.prisma.novel.update({
      where: { id: novel.id },
      data: {
        totalChapters: chapters.length,
        lastCheckedAt: new Date(),
        lastError: null
      }
    });

    await updateNovelAggregateState(context.prisma, novel.id);
    return { ok: true, chapters: chapters.length, newChapters };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Novel sync failed";
    await context.prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "failed",
        errorMessage: message,
        endedAt: new Date()
      }
    });
    await context.prisma.novel.update({
      where: { id: novel.id },
      data: {
        syncStatus: "error",
        lastError: message,
        lastSyncEndedAt: new Date()
      }
    });
    throw error;
  }
}

export async function processChapterFetchJob(
  context: WorkerContext,
  job: Job<ChapterFetchJobData>
) {
  const chapter = await context.prisma.chapter.findUnique({
    where: { id: job.data.chapterId },
    include: { novel: true }
  });

  if (!chapter) {
    return { ok: true, skipped: "chapter_missing" };
  }

  const enabledSourceIds = new Set(
    (await listSources(context.storagePaths, context.prisma)).map((source) => source.id)
  );
  if (!enabledSourceIds.has(chapter.novel.sourceId)) {
    await context.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        status: "pending",
        lastError: null
      }
    });
    await context.prisma.novel.update({
      where: { id: chapter.novelId },
      data: {
        lastError: null
      }
    });
    await updateNovelAggregateState(context.prisma, chapter.novelId);
    return { ok: true, skipped: "source_disabled" };
  }

  try {
    await context.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        status: "fetching",
        lastError: null
      }
    });

    const handler = await getSourceHandler(context.storagePaths, context.prisma, chapter.novel.sourceId);
    const content = await handler.chapterContent(chapter.sourceUrl);
    const html = sanitizeHtmlFragment(content.html);
    const htmlPath = getChapterHtmlPath(context.storagePaths, chapter.novelId, chapter.chapterIndex);

    await ensureDir(path.dirname(htmlPath));
    await fs.writeFile(htmlPath, html, "utf8");

    await context.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        title: content.title || chapter.title,
        status: "queued_build",
        lastError: null
      }
    });

    await enqueueChapterBuild(context.queues, {
      novelId: chapter.novelId,
      chapterId: chapter.id
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chapter fetch failed";
    await context.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        status: "fetch_failed",
        retryCount: { increment: 1 },
        lastError: message
      }
    });
    await context.prisma.novel.update({
      where: { id: chapter.novelId },
      data: {
        syncStatus: "error",
        lastError: message
      }
    });
    throw error;
  }
}

export async function processChapterBuildJob(
  context: WorkerContext,
  job: Job<ChapterBuildJobData>
) {
  const chapter = await context.prisma.chapter.findUnique({
    where: { id: job.data.chapterId },
    include: { novel: true }
  });

  if (!chapter) {
    return { ok: true, skipped: "chapter_missing" };
  }

  try {
    await context.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        status: "building",
        lastError: null
      }
    });

    const htmlPath = getChapterHtmlPath(context.storagePaths, chapter.novelId, chapter.chapterIndex);
    const html = await fs.readFile(htmlPath, "utf8");

    const tempPath = path.join(
      context.storagePaths.tempEpubBuildDir,
      chapter.novelId,
      `${chapter.id}.epub`
    );
    const targetPath = getPublishedChapterPath(context.storagePaths, chapter.novelId, chapter.chapterIndex);

    await ensureDir(path.dirname(tempPath));
    const buildResult = await buildChapterEpub({
      outputPath: tempPath,
      identifier: `${chapter.novelId}:${chapter.chapterIndex}`,
      title: chapter.title,
      author: chapter.novel.author,
      contentHtml: html
    });

    await moveFile(tempPath, targetPath);

    await context.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        status: "published",
        epubPath: getPublishedChapterRelativePath(chapter.novelId, chapter.chapterIndex),
        fileSize: buildResult.fileSize,
        checksum: buildResult.checksum,
        publishedAt: new Date(),
        lastError: null
      }
    });

    await writeSeriesManifest(context.prisma, context.storagePaths, chapter.novelId);
    await updateNovelAggregateState(context.prisma, chapter.novelId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chapter build failed";
    await context.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        status: "build_failed",
        retryCount: { increment: 1 },
        lastError: message
      }
    });
    await context.prisma.novel.update({
      where: { id: chapter.novelId },
      data: {
        syncStatus: "error",
        lastError: message
      }
    });
    throw error;
  }
}
