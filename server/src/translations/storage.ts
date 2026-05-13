import path from "node:path";

import type { StorageLayout } from "../storage/paths.js";
import { ensureDir, formatChapterStem, sanitizeFileSegment } from "../lib/filesystem.js";

export function getTranslationsRootDir(storagePaths: StorageLayout) {
  return path.join(storagePaths.root, "translations");
}

export function getTranslationProjectDir(storagePaths: StorageLayout, projectId: string) {
  return path.join(getTranslationsRootDir(storagePaths), sanitizeFileSegment(projectId));
}

export function getTranslationChapterDir(storagePaths: StorageLayout, projectId: string, chapterId: string) {
  return path.join(getTranslationProjectDir(storagePaths, projectId), "chapters", sanitizeFileSegment(chapterId));
}

export function getTranslationVersionHtmlPath(
  storagePaths: StorageLayout,
  projectId: string,
  chapterId: string,
  versionNumber: number,
  chapterIndex: number
) {
  return path.join(
    getTranslationChapterDir(storagePaths, projectId, chapterId),
    `${formatChapterStem(chapterIndex, 3)}.v${String(versionNumber).padStart(3, "0")}.html`
  );
}

export function getTranslationVersionTextPath(
  storagePaths: StorageLayout,
  projectId: string,
  chapterId: string,
  versionNumber: number,
  chapterIndex: number
) {
  return path.join(
    getTranslationChapterDir(storagePaths, projectId, chapterId),
    `${formatChapterStem(chapterIndex, 3)}.v${String(versionNumber).padStart(3, "0")}.txt`
  );
}

export function getTranslationExportDir(storagePaths: StorageLayout, projectId: string) {
  return path.join(getTranslationProjectDir(storagePaths, projectId), "exports");
}

export async function ensureTranslationProjectLayout(storagePaths: StorageLayout, projectId: string) {
  await Promise.all([
    ensureDir(getTranslationProjectDir(storagePaths, projectId)),
    ensureDir(getTranslationExportDir(storagePaths, projectId))
  ]);
}
