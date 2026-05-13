import fs from "node:fs/promises";
import path from "node:path";

import type { PrismaClient } from "../lib/prisma.js";

import { buildBmpImageAsset, buildEpubImageAsset } from "../lib/image-assets.js";
import { ensureDir, fileExists, writeFileAtomic } from "../lib/filesystem.js";
import type { StorageLayout } from "../storage/paths.js";
import {
  getCachedCoverBmpPath,
  getCachedCoverPngPath,
  getPublishedCoverBmpPath,
  getPublishedCoverRelativePath,
  getPublishedSeriesDir
} from "./service.js";

export interface NovelCoverAssets {
  epubCoverPath: string | null;
  publishedCoverPath: string | null;
  publishedCoverRelativePath: string | null;
}

export async function syncNovelCoverAssets(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  novel: {
    id: string;
    coverUrl: string | null;
  }
) {
  if (!novel.coverUrl) {
    await Promise.all([
      fs.rm(getCachedCoverPngPath(storagePaths, novel.id), { force: true }),
      fs.rm(getCachedCoverBmpPath(storagePaths, novel.id), { force: true }),
      fs.rm(getPublishedCoverBmpPath(storagePaths, novel.id), { force: true })
    ]);
    await prisma.novel.update({
      where: { id: novel.id },
      data: {
        coverLocalPath: null
      }
    });
    return {
      epubCoverPath: null,
      publishedCoverPath: null,
      publishedCoverRelativePath: null
    } satisfies NovelCoverAssets;
  }

  const [epubCover, publishedCover] = await Promise.all([
    buildEpubImageAsset(novel.coverUrl, {
      maxWidth: 1200,
      maxHeight: 1600
    }),
    buildBmpImageAsset(novel.coverUrl, {
      maxWidth: 1200,
      maxHeight: 1600
    })
  ]);

  const epubCoverPath = getCachedCoverPngPath(storagePaths, novel.id);
  const publishedCoverPath = getPublishedCoverBmpPath(storagePaths, novel.id);
  const publishedCoverRelativePath = getPublishedCoverRelativePath(novel.id);

  await ensureDir(path.dirname(epubCoverPath));
  await ensureDir(getPublishedSeriesDir(storagePaths, novel.id));
  await Promise.all([
    writeFileAtomic(epubCoverPath, epubCover.buffer),
    writeFileAtomic(publishedCoverPath, publishedCover.buffer)
  ]);

  await prisma.novel.update({
    where: { id: novel.id },
    data: {
      coverLocalPath: publishedCoverRelativePath
    }
  });

  return {
    epubCoverPath,
    publishedCoverPath,
    publishedCoverRelativePath
  } satisfies NovelCoverAssets;
}

export async function getNovelCoverAssets(storagePaths: StorageLayout, novelId: string) {
  const epubCoverPath = getCachedCoverPngPath(storagePaths, novelId);
  const publishedCoverPath = getPublishedCoverBmpPath(storagePaths, novelId);
  const [hasEpubCover, hasPublishedCover] = await Promise.all([
    fileExists(epubCoverPath),
    fileExists(publishedCoverPath)
  ]);

  return {
    epubCoverPath: hasEpubCover ? epubCoverPath : null,
    publishedCoverPath: hasPublishedCover ? publishedCoverPath : null,
    publishedCoverRelativePath: hasPublishedCover ? getPublishedCoverRelativePath(novelId) : null
  } satisfies NovelCoverAssets;
}

export async function readEpubCoverBuffer(storagePaths: StorageLayout, novelId: string) {
  const coverPath = getCachedCoverPngPath(storagePaths, novelId);
  if (!(await fileExists(coverPath))) {
    return null;
  }

  return {
    path: coverPath,
    buffer: await fs.readFile(coverPath),
    mediaType: "image/png"
  };
}

