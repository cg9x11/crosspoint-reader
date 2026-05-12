import fs from "node:fs/promises";
import path from "node:path";

import type { Job } from "bullmq";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

import type { AppConfig } from "../config/env.js";
import {
  getNovelCoverAssets,
  syncNovelCoverAssets
} from "../library/cover-assets.js";
import {
  buildSeriesId,
  getChapterHtmlPath,
  getPublishedChapterCandidates,
  getPublishedChapterPath,
  getPublishedChapterRelativePath,
  getPublishedManifestPath,
  getPublishedSeriesDir,
  updateNovelAggregateState
} from "../library/service.js";
import { ensureDir, fileExists, readJsonFile, sha256Hex, writeFileAtomic, writeJsonFileAtomic } from "../lib/filesystem.js";
import { sanitizeHtmlFragment, stripHtmlToReadableText, stripLeadingSourceFilename } from "../lib/sanitize.js";
import { getSourceHandler, listSources } from "../plugins/service.js";
import type { ChapterBuildJobData, ChapterFetchJobData, NovelSyncJobData } from "../queues/jobs.js";
import type { AppQueues } from "../queues/index.js";
import type { StorageLayout } from "../storage/paths.js";
import {
  enqueueChapterBuild,
  enqueueChapterFetch,
  enqueueNovelSync,
  getChapterBuildJobId,
  getChapterFetchJobId,
  getNovelSyncJobId
} from "../queues/jobs.js";
import { repairJsonStringsDeep } from "../lib/text.js";

interface WorkerContext {
  config: AppConfig;
  prisma: PrismaClient;
  queues: AppQueues;
  storagePaths: StorageLayout;
}

interface SeriesManifestShape {
  version: number;
  seriesId: string;
  title: string;
  author: string | null;
  sourceId: string;
  sourceName: string | null;
  description: string | null;
  coverPath?: string;
  status: string;
  updatedAt: string;
  chapters: Array<{
    chapterIndex: number;
    title: string;
    file: string;
  }>;
}

const ENABLED_SOURCE_IDS_CACHE_TTL_MS = 30_000;
const HAKO_SYNC_DELAY_MS = 1200;
const HAKO_CHAPTER_FETCH_DELAY_MS = 1800;
let enabledSourceIdsCache:
  | {
      expiresAt: number;
      value?: Set<string>;
      pending?: Promise<Set<string>>;
    }
  | undefined;

function isRecordMissingError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

function isTransientDatabaseTimeout(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("socket timeout") ||
    message.includes("database failed to respond") ||
    message.includes("timed out") ||
    message.includes("database is locked") ||
    message.includes("busy")
  );
}

async function runWithDatabaseRetry<T>(
  action: () => Promise<T>,
  options?: {
    attempts?: number;
    initialDelayMs?: number;
  }
) {
  const attempts = Math.max(1, options?.attempts ?? 4);
  let delayMs = Math.max(100, options?.initialDelayMs ?? 250);
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isTransientDatabaseTimeout(error)) {
        throw error;
      }
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, 2_000);
    }
  }

  throw lastError;
}

function isHakoSourceId(sourceId: string) {
  return sourceId.toLowerCase().includes("hako");
}

async function sleep(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getEnabledSourceIds(context: WorkerContext, force = false) {
  const now = Date.now();
  if (!force && enabledSourceIdsCache?.value && enabledSourceIdsCache.expiresAt > now) {
    return enabledSourceIdsCache.value;
  }

  if (!force && enabledSourceIdsCache?.pending) {
    return enabledSourceIdsCache.pending;
  }

  const pending = listSources(context.storagePaths, context.prisma).then(
    (sources) => new Set(sources.map((source) => source.id))
  );
  enabledSourceIdsCache = {
    expiresAt: now + ENABLED_SOURCE_IDS_CACHE_TTL_MS,
    pending
  };

  try {
    const value = await pending;
    enabledSourceIdsCache = {
      expiresAt: Date.now() + ENABLED_SOURCE_IDS_CACHE_TTL_MS,
      value
    };
    return value;
  } catch (error) {
    enabledSourceIdsCache = undefined;
    throw error;
  }
}

async function buildSeriesManifestFromDatabase(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  novelId: string
): Promise<SeriesManifestShape | null> {
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
    return null;
  }

  const seriesDir = getPublishedSeriesDir(storagePaths, novelId);
  await ensureDir(seriesDir);
  const coverAssets = await getNovelCoverAssets(storagePaths, novelId);

  return repairJsonStringsDeep({
    version: 1,
    seriesId: buildSeriesId(novel),
    title: novel.title,
    author: novel.author,
    sourceId: novel.sourceId,
    sourceName: novel.sourceName,
    description: novel.description,
    coverPath: coverAssets.publishedCoverPath ? path.basename(coverAssets.publishedCoverPath) : undefined,
    status: novel.status,
    updatedAt: new Date().toISOString(),
    chapters: novel.chapters.map((chapter) => ({
      chapterIndex: chapter.chapterIndex,
      title: chapter.title,
      file: path.basename(chapter.epubPath ?? getPublishedChapterRelativePath(novelId, chapter.chapterIndex))
    }))
  } satisfies SeriesManifestShape);
}

async function writeSeriesManifest(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  novelId: string,
  options?: {
    novel?: {
      id: string;
      title: string;
      author: string | null;
      sourceId: string;
      sourceName: string | null;
      description: string | null;
      status: string;
    };
    chapter?: {
      chapterIndex: number;
      title: string;
      epubPath: string | null;
    };
  }
) {
  const manifestPath = getPublishedManifestPath(storagePaths, novelId);
  const coverAssets = await getNovelCoverAssets(storagePaths, novelId);

  if (options?.novel && options.chapter) {
    const existing = await readJsonFile<SeriesManifestShape | null>(manifestPath, null);
    if (existing && Array.isArray(existing.chapters)) {
      const chapterEntry = {
        chapterIndex: options.chapter.chapterIndex,
        title: options.chapter.title,
        file: path.basename(options.chapter.epubPath ?? getPublishedChapterRelativePath(novelId, options.chapter.chapterIndex))
      };

      const chapters = existing.chapters
        .filter((chapter) => chapter.chapterIndex !== chapterEntry.chapterIndex)
        .concat(chapterEntry)
        .sort((left, right) => left.chapterIndex - right.chapterIndex);

      await writeJsonFileAtomic(
        manifestPath,
        repairJsonStringsDeep({
        version: 1,
        seriesId: buildSeriesId(options.novel),
        title: options.novel.title,
        author: options.novel.author,
        sourceId: options.novel.sourceId,
        sourceName: options.novel.sourceName,
        description: options.novel.description,
        coverPath: coverAssets.publishedCoverPath ? path.basename(coverAssets.publishedCoverPath) : undefined,
        status: options.novel.status,
        updatedAt: new Date().toISOString(),
        chapters
      } satisfies SeriesManifestShape)
      );
      return;
    }
  }

  const manifest = await buildSeriesManifestFromDatabase(prisma, storagePaths, novelId);
  if (!manifest) {
    return;
  }

  await writeJsonFileAtomic(manifestPath, manifest);
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

async function removeStalePublishedChapterArtifacts(
  storagePaths: StorageLayout,
  novelId: string,
  chapterIndex: number,
  keepRelativePath: string
) {
  const keepNormalized = keepRelativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const candidates = getPublishedChapterCandidates(storagePaths, novelId, chapterIndex, keepNormalized);
  await Promise.all(
    candidates
      .filter((candidate) => candidate.relativePath !== keepNormalized)
      .map((candidate) => fs.rm(candidate.path, { force: true }).catch(() => undefined))
  );
}

async function closeRunningRebuildRunIfSettled(prisma: PrismaClient, novelId: string) {
  const runningRebuild = await prisma.syncRun.findFirst({
    where: {
      novelId,
      triggerType: "rebuild",
      status: "running"
    },
    orderBy: { createdAt: "desc" }
  });

  if (!runningRebuild) {
    return null;
  }

  const [unfinishedBuilds, failedBuilds] = await Promise.all([
    prisma.chapter.count({
      where: {
        novelId,
        status: { in: ["queued_build", "building"] }
      }
    }),
    prisma.chapter.count({
      where: {
        novelId,
        status: "build_failed"
      }
    })
  ]);

  if (unfinishedBuilds > 0) {
    return null;
  }

  const endedAt = new Date();
  const status = failedBuilds > 0 ? "failed" : "completed";
  await prisma.syncRun.update({
    where: { id: runningRebuild.id },
    data: {
      status,
      errorMessage: failedBuilds > 0 ? "One or more chapters failed during rebuild." : null,
      endedAt
    }
  });
  await prisma.novel.update({
    where: { id: novelId },
    data: {
      lastSyncEndedAt: endedAt
    }
  });

  return status;
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
  const enabledSourceIds = await getEnabledSourceIds(context, true);
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

export async function removeNovelQueueJobs(queues: AppQueues, novelId: string, chapterIds: string[]) {
  const jobIds = [
    { queue: queues.novelSync, jobId: getNovelSyncJobId(novelId) },
    ...chapterIds.flatMap((chapterId) => [
      { queue: queues.chapterFetch, jobId: getChapterFetchJobId(chapterId) },
      { queue: queues.chapterBuild, jobId: getChapterBuildJobId(chapterId) }
    ])
  ];

  await Promise.all(
    jobIds.map(async ({ queue, jobId }) => {
      const job = await queue.getJob(jobId);
      if (!job) {
        return;
      }

      await job.remove().catch(() => undefined);
    })
  );
}

async function queueChapterRecovery(
  queues: AppQueues,
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  chapter: {
    id: string;
    novelId: string;
    chapterIndex: number;
    status: string;
  }
) {
  const htmlPath = getChapterHtmlPath(storagePaths, chapter.novelId, chapter.chapterIndex);
  const shouldQueueBuild =
    chapter.status === "build_failed" ||
    chapter.status === "queued_build" ||
    chapter.status === "building" ||
    (await fileExists(htmlPath));

  await prisma.chapter.update({
    where: { id: chapter.id },
    data: {
      status: shouldQueueBuild ? "queued_build" : "queued_fetch",
      lastError: null
    }
  });

  if (shouldQueueBuild) {
    await enqueueChapterBuild(queues, {
      novelId: chapter.novelId,
      chapterId: chapter.id
    });
    return "build";
  }

  await enqueueChapterFetch(queues, {
    novelId: chapter.novelId,
    chapterId: chapter.id
  });
  return "fetch";
}

export async function retryChapterPipeline(
  queues: AppQueues,
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  novelId: string,
  chapterId: string
) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      novelId: true,
      chapterIndex: true,
      status: true
    }
  });

  if (!chapter || chapter.novelId !== novelId) {
    throw new Error("Chapter not found");
  }

  const strategy = await queueChapterRecovery(queues, prisma, storagePaths, chapter);
  await updateNovelAggregateState(prisma, novelId);
  return {
    ok: true,
    strategy
  };
}

export async function retryNovelPipeline(
  queues: AppQueues,
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  novelId: string
) {
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      chapters: {
        orderBy: { chapterIndex: "asc" }
      },
      syncRuns: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!novel) {
    throw new Error("Novel not found");
  }

  const retryableChapters = novel.chapters.filter((chapter) => chapter.status !== "published");
  let chapterJobs = 0;

  for (const chapter of retryableChapters) {
    await queueChapterRecovery(queues, prisma, storagePaths, chapter);
    chapterJobs += 1;
  }

  let scheduledNovelSync = false;
  if (chapterJobs === 0 && novel.syncStatus === "error") {
    await scheduleNovelSync(queues, prisma, novelId, "retry");
    scheduledNovelSync = true;
  }

  await updateNovelAggregateState(prisma, novelId);
  return {
    ok: true,
    chapterJobs,
    scheduledNovelSync
  };
}

export async function rebuildNovelPipeline(
  queues: AppQueues,
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  novelId: string
) {
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      chapters: {
        orderBy: { chapterIndex: "asc" }
      }
    }
  });

  if (!novel) {
    throw new Error("Novel not found");
  }

  const now = new Date();
  await fs.rm(path.join(storagePaths.tempEpubBuildDir, novelId), {
    recursive: true,
    force: true
  }).catch(() => undefined);
  await prisma.syncRun.updateMany({
    where: {
      novelId,
      triggerType: "rebuild",
      status: "running"
    },
    data: {
      status: "failed",
      errorMessage: "Superseded by a newer rebuild request.",
      endedAt: now
    }
  });

  let chapterJobs = 0;
  for (const chapter of novel.chapters) {
    const htmlPath = getChapterHtmlPath(storagePaths, chapter.novelId, chapter.chapterIndex);
    if (!(await fileExists(htmlPath))) {
      continue;
    }

    await prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        status: "queued_build",
        lastError: null
      }
    });

    await enqueueChapterBuild(queues, {
      novelId: chapter.novelId,
      chapterId: chapter.id
    });
    chapterJobs += 1;
  }

  await prisma.syncRun.create({
    data: {
      novelId,
      triggerType: "rebuild",
      status: chapterJobs > 0 ? "running" : "completed",
      startedAt: now,
      endedAt: chapterJobs > 0 ? null : now,
      totalFound: chapterJobs,
      newChapters: 0
    }
  });

  await prisma.novel.update({
    where: { id: novelId },
    data: {
      syncStatus: chapterJobs > 0 ? "syncing" : novel.syncStatus,
      lastError: chapterJobs > 0 ? null : novel.lastError,
      lastSyncStartedAt: now,
      lastSyncEndedAt: chapterJobs > 0 ? null : now
    }
  });

  await updateNovelAggregateState(prisma, novelId);
  return {
    ok: true,
    chapterJobs
  };
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

  const enabledSourceIds = await getEnabledSourceIds(context);
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
    if (isHakoSourceId(novel.sourceId)) {
      await sleep(HAKO_SYNC_DELAY_MS);
    }
    const chapters = await handler.chapters(novel.sourceUrl);
    const existingChapters = await context.prisma.chapter.findMany({
      where: { novelId: novel.id },
      select: {
        id: true,
        chapterIndex: true,
        title: true,
        sourceUrl: true,
        status: true
      }
    });
    const existingChapterMap = new Map(existingChapters.map((chapter) => [chapter.chapterIndex, chapter]));

    let newChapters = 0;
    for (const chapter of chapters) {
      const existing = existingChapterMap.get(chapter.chapterIndex);
      if (!existing) {
        newChapters += 1;
        const created = await context.prisma.chapter.create({
          data: {
            novelId: novel.id,
            chapterIndex: chapter.chapterIndex,
            title: chapter.title,
            sourceUrl: chapter.sourceUrl,
            status: "queued_fetch"
          }
        });

        await enqueueChapterFetch(context.queues, {
          novelId: novel.id,
          chapterId: created.id
        });
        continue;
      }

      if (existing.status !== "published") {
        await context.prisma.chapter.update({
          where: { id: existing.id },
          data: {
            title: chapter.title,
            sourceUrl: chapter.sourceUrl,
            status: "queued_fetch",
            lastError: null
          }
        });

        await enqueueChapterFetch(context.queues, {
          novelId: novel.id,
          chapterId: existing.id
        });
        continue;
      }

      if (existing.title !== chapter.title || existing.sourceUrl !== chapter.sourceUrl) {
        await context.prisma.chapter.update({
          where: { id: existing.id },
          data: {
            title: chapter.title,
            sourceUrl: chapter.sourceUrl
          }
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

    if (novel.coverUrl) {
      try {
        await syncNovelCoverAssets(context.prisma, context.storagePaths, {
          id: novel.id,
          coverUrl: novel.coverUrl
        });
      } catch (error) {
        console.warn("Failed to refresh published cover assets", {
          novelId: novel.id,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }

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

  const enabledSourceIds = await getEnabledSourceIds(context);
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
    if (isHakoSourceId(chapter.novel.sourceId)) {
      await sleep(HAKO_CHAPTER_FETCH_DELAY_MS);
    }
    const content = await handler.chapterContent(chapter.sourceUrl);
    const html = sanitizeHtmlFragment(content.html);
    const htmlPath = getChapterHtmlPath(context.storagePaths, chapter.novelId, chapter.chapterIndex);

    await ensureDir(path.dirname(htmlPath));
    await fs.writeFile(htmlPath, html, "utf8");

    try {
      await context.prisma.chapter.update({
        where: { id: chapter.id },
        data: {
          title: content.title || chapter.title,
          status: "queued_build",
          lastError: null
        }
      });
    } catch (error) {
      if (isRecordMissingError(error)) {
        await fs.rm(htmlPath, { force: true });
        return { ok: true, skipped: "chapter_deleted" };
      }
      throw error;
    }

    await enqueueChapterBuild(context.queues, {
      novelId: chapter.novelId,
      chapterId: chapter.id
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chapter fetch failed";
    await context.prisma.chapter
      .update({
        where: { id: chapter.id },
        data: {
          status: "fetch_failed",
          retryCount: { increment: 1 },
          lastError: message
        }
      })
      .catch((updateError) => {
        if (!isRecordMissingError(updateError)) {
          throw updateError;
        }
      });
    await context.prisma.novel
      .update({
        where: { id: chapter.novelId },
        data: {
          syncStatus: "error",
          lastError: message
        }
      })
      .catch((updateError) => {
        if (!isRecordMissingError(updateError)) {
          throw updateError;
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
    await runWithDatabaseRetry(() =>
      context.prisma.chapter.update({
        where: { id: chapter.id },
        data: {
          status: "building",
          lastError: null
        }
      })
    );

    const htmlPath = getChapterHtmlPath(context.storagePaths, chapter.novelId, chapter.chapterIndex);
    const html = await fs.readFile(htmlPath, "utf8");

    const tempPath = path.join(
      context.storagePaths.tempEpubBuildDir,
      chapter.novelId,
      `${chapter.id}.txt`
    );
    const targetPath = getPublishedChapterPath(context.storagePaths, chapter.novelId, chapter.chapterIndex);

    await ensureDir(path.dirname(tempPath));
    const chapterText = stripLeadingSourceFilename(stripHtmlToReadableText(`<h1>${chapter.title}</h1>\n${html}`));
    const chapterBuffer = Buffer.from(`${chapterText}\n`, "utf8");
    await writeFileAtomic(tempPath, chapterBuffer);

    await moveFile(tempPath, targetPath);

    const epubPath = getPublishedChapterRelativePath(chapter.novelId, chapter.chapterIndex);
    await removeStalePublishedChapterArtifacts(
      context.storagePaths,
      chapter.novelId,
      chapter.chapterIndex,
      epubPath
    );
    try {
      await runWithDatabaseRetry(() =>
        context.prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            status: "published",
            epubPath,
            fileSize: chapterBuffer.byteLength,
            checksum: sha256Hex(chapterBuffer),
            publishedAt: new Date(),
            lastError: null
          }
        })
      );
    } catch (error) {
      if (isRecordMissingError(error)) {
        await fs.rm(targetPath, { force: true });
        return { ok: true, skipped: "chapter_deleted" };
      }
      throw error;
    }

    await runWithDatabaseRetry(async () => {
      await writeSeriesManifest(context.prisma, context.storagePaths, chapter.novelId, {
        novel: {
          id: chapter.novel.id,
          title: chapter.novel.title,
          author: chapter.novel.author,
          sourceId: chapter.novel.sourceId,
          sourceName: chapter.novel.sourceName,
          description: chapter.novel.description,
          status: chapter.novel.status
        },
        chapter: {
          chapterIndex: chapter.chapterIndex,
          title: chapter.title,
          epubPath
        }
      });
      await updateNovelAggregateState(context.prisma, chapter.novelId);
      await closeRunningRebuildRunIfSettled(context.prisma, chapter.novelId);
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chapter build failed";
    await runWithDatabaseRetry(() =>
      context.prisma.chapter
        .update({
          where: { id: chapter.id },
          data: {
            status: "build_failed",
            retryCount: { increment: 1 },
            lastError: message
          }
        })
        .catch((updateError) => {
          if (!isRecordMissingError(updateError)) {
            throw updateError;
          }
        })
    ).catch(() => undefined);
    await runWithDatabaseRetry(() =>
      context.prisma.novel
        .update({
          where: { id: chapter.novelId },
          data: {
            syncStatus: "error",
            lastError: message
          }
        })
        .catch((updateError) => {
          if (!isRecordMissingError(updateError)) {
            throw updateError;
          }
        })
    ).catch(() => undefined);
    await runWithDatabaseRetry(() => closeRunningRebuildRunIfSettled(context.prisma, chapter.novelId)).catch(
      () => undefined
    );
    throw error;
  }
}
