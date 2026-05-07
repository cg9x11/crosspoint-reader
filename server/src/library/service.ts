import fs from "node:fs/promises";
import path from "node:path";

import type { PrismaClient, Novel } from "@prisma/client";

import { formatChapterFilename } from "../lib/filesystem.js";
import type { SourceDetailPayload } from "../plugins/types.js";
import type { StorageLayout } from "../storage/paths.js";

export function getChapterHtmlPath(storagePaths: StorageLayout, novelId: string, chapterIndex: number) {
  return path.join(storagePaths.cacheTextDir, novelId, `${formatChapterFilename(chapterIndex, 3)}.html`);
}

export function getPublishedSeriesDir(storagePaths: StorageLayout, novelId: string) {
  return path.join(storagePaths.opdsDir, "series", novelId);
}

export function getPublishedChapterPath(storagePaths: StorageLayout, novelId: string, chapterIndex: number) {
  return path.join(getPublishedSeriesDir(storagePaths, novelId), formatChapterFilename(chapterIndex, 3));
}

export function getPublishedManifestPath(storagePaths: StorageLayout, novelId: string) {
  return path.join(getPublishedSeriesDir(storagePaths, novelId), "_series.json");
}

export function getPublishedChapterRelativePath(novelId: string, chapterIndex: number) {
  return path.posix.join("series", novelId, formatChapterFilename(chapterIndex, 3));
}

export async function upsertNovelFromSourceDetail(
  prisma: PrismaClient,
  sourceId: string,
  detail: SourceDetailPayload
) {
  const existing = await prisma.novel.findFirst({
    where: {
      sourceId,
      sourceUrl: detail.sourceUrl
    }
  });

  if (existing) {
    return prisma.novel.update({
      where: { id: existing.id },
      data: {
        title: detail.title,
        author: detail.author,
        coverUrl: detail.coverUrl,
        description: detail.description,
        status: detail.status
      }
    });
  }

  return prisma.novel.create({
    data: {
      title: detail.title,
      author: detail.author,
      sourceId,
      sourceName: sourceId,
      sourceUrl: detail.sourceUrl,
      coverUrl: detail.coverUrl,
      description: detail.description,
      status: detail.status,
      syncStatus: "idle"
    }
  });
}

export async function listLibraryNovels(
  prisma: PrismaClient,
  filters?: {
    query?: string;
    status?: string;
    syncStatus?: string;
  }
) {
  return prisma.novel.findMany({
    where: {
      ...(filters?.query
        ? {
            OR: [
              { title: { contains: filters.query } },
              { author: { contains: filters.query } },
              { description: { contains: filters.query } }
            ]
          }
        : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.syncStatus ? { syncStatus: filters.syncStatus } : {})
    },
    orderBy: [{ updatedAt: "desc" }]
  });
}

export async function getLibraryNovel(prisma: PrismaClient, novelId: string) {
  return prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      chapters: {
        orderBy: { chapterIndex: "asc" }
      },
      syncRuns: {
        orderBy: { createdAt: "desc" },
        take: 10
      }
    }
  });
}

export async function deleteLibraryNovel(prisma: PrismaClient, novelId: string) {
  await prisma.chapter.deleteMany({ where: { novelId } });
  await prisma.syncRun.deleteMany({ where: { novelId } });
  await prisma.novel.delete({ where: { id: novelId } });
}

export async function purgeLibraryNovelArtifacts(storagePaths: StorageLayout, novelId: string) {
  await Promise.all([
    fs.rm(path.join(storagePaths.cacheTextDir, novelId), { recursive: true, force: true }),
    fs.rm(path.join(storagePaths.tempEpubBuildDir, novelId), { recursive: true, force: true }),
    fs.rm(getPublishedSeriesDir(storagePaths, novelId), { recursive: true, force: true })
  ]);
}

export async function updateNovelAggregateState(prisma: PrismaClient, novelId: string) {
  const [totalChapters, downloadedChapters, failedChapters] = await Promise.all([
    prisma.chapter.count({ where: { novelId } }),
    prisma.chapter.count({ where: { novelId, status: "published" } }),
    prisma.chapter.count({ where: { novelId, status: { in: ["fetch_failed", "build_failed"] } } })
  ]);

  const syncStatus =
    failedChapters > 0
      ? "error"
      : totalChapters > 0 && downloadedChapters === totalChapters
        ? "ready"
        : totalChapters > 0
          ? "syncing"
          : "idle";

  return prisma.novel.update({
    where: { id: novelId },
    data: {
      totalChapters,
      downloadedChapters,
      syncStatus,
      lastSyncEndedAt: syncStatus === "ready" ? new Date() : undefined
    }
  });
}

export function buildSeriesId(novel: Pick<Novel, "id" | "sourceId">) {
  return `${novel.sourceId}:${novel.id}`;
}
