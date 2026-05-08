import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeFileAtomic(filePath: string, content: Buffer | string) {
  const dirPath = path.dirname(filePath);
  await ensureDir(dirPath);

  const tempPath = path.join(
    dirPath,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );

  await fs.writeFile(tempPath, content);

  try {
    await fs.rename(tempPath, filePath);
  } catch {
    await fs.rm(filePath, { force: true });
    await fs.rename(tempPath, filePath);
  }
}

export async function writeJsonFileAtomic(filePath: string, value: unknown) {
  await writeFileAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function sanitizeFileSegment(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
  const safe = normalized.replace(/[<>:"/\\|?*\x00-\x1F]/g, " ").replace(/\s+/g, " ").trim();
  return safe.length > 0 ? safe : "item";
}

export function formatChapterStem(chapterIndex: number, minWidth = 3) {
  const width = Math.max(minWidth, String(chapterIndex).length);
  return `ch_${String(chapterIndex).padStart(width, "0")}`;
}

export function formatChapterFilename(chapterIndex: number, minWidth = 3) {
  return `${formatChapterStem(chapterIndex, minWidth)}.txt`;
}

export function sha256Hex(input: Buffer | string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function stableId(prefix: string, value: string) {
  const slug = sanitizeFileSegment(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const hash = sha256Hex(value).slice(0, 8);
  return `${prefix}:${slug || "item"}-${hash}`;
}
