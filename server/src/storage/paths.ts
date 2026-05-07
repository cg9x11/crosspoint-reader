import fs from "node:fs/promises";
import path from "node:path";

export interface StorageLayout {
  root: string;
  databaseDir: string;
  backupsDir: string;
  cacheDir: string;
  cacheCoversDir: string;
  cacheHtmlDir: string;
  cacheTextDir: string;
  extensionsDir: string;
  logsDir: string;
  pluginLogsDir: string;
  opdsDir: string;
  runtimeDir: string;
  runtimeHealthDir: string;
  runtimeMetricsDir: string;
  tempDir: string;
  tempDownloadsDir: string;
  tempEpubBuildDir: string;
}

export function createStorageLayout(root: string): StorageLayout {
  return {
    root,
    databaseDir: path.join(root, "database"),
    backupsDir: path.join(root, "database", "backups"),
    cacheDir: path.join(root, "cache"),
    cacheCoversDir: path.join(root, "cache", "covers"),
    cacheHtmlDir: path.join(root, "cache", "html"),
    cacheTextDir: path.join(root, "cache", "text"),
    extensionsDir: path.join(root, "extensions"),
    logsDir: path.join(root, "logs"),
    pluginLogsDir: path.join(root, "logs", "plugin"),
    opdsDir: path.join(root, "opds"),
    runtimeDir: path.join(root, "runtime"),
    runtimeHealthDir: path.join(root, "runtime", "health"),
    runtimeMetricsDir: path.join(root, "runtime", "metrics"),
    tempDir: path.join(root, "temp"),
    tempDownloadsDir: path.join(root, "temp", "downloads"),
    tempEpubBuildDir: path.join(root, "temp", "epub-build")
  };
}

export async function ensureStorageLayout(layout: StorageLayout) {
  await Promise.all(
    Object.values(layout).map(async (entryPath) => {
      await fs.mkdir(entryPath, { recursive: true });
    })
  );
}
