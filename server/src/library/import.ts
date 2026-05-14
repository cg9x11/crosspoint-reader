import fs from "node:fs/promises";
import path from "node:path";

import { load } from "cheerio";
import { unzipSync, strFromU8 } from "fflate";

import type { PrismaClient } from "../lib/prisma.js";

import {
  ensureDir,
  formatChapterFilename,
  sanitizeFileSegment,
  sha256Hex,
  writeFileAtomic,
  writeJsonFileAtomic
} from "../lib/filesystem.js";
import { getChapterHtmlPath, getPublishedManifestPath, getPublishedSeriesDir, updateNovelAggregateState } from "./service.js";
import type { StorageLayout } from "../storage/paths.js";

interface ImportedChapter {
  chapterIndex: number;
  title: string;
  html: string;
  text: string;
  sourceName: string;
}

interface ImportedNovelPayload {
  title: string;
  author?: string | null;
  description?: string | null;
  chapters: ImportedChapter[];
}

function plainTextToHtml(text: string) {
  const escaped = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const blocks = escaped
    .split(/\r?\n\r?\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return "<p></p>";
  }

  return blocks.map((block) => `<p>${block.replace(/\r?\n/g, "<br/>")}</p>`).join("\n");
}

function normalizeChapterTitle(title: string, fallbackName: string, chapterIndex: number) {
  const cleaned = String(title || "").replace(/\s+/g, " ").trim();
  if (cleaned) {
    return cleaned;
  }
  const base = sanitizeFileSegment(fallbackName).replace(/\.(txt|html|xhtml)$/i, "").trim();
  return base || `Chương ${chapterIndex}`;
}

function normalizeTextContent(input: string) {
  return String(input || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
}

function extractTxtChapter(fileName: string, input: string, chapterIndex: number): ImportedChapter {
  const text = normalizeTextContent(input);
  const lines = text.split("\n").map((line) => line.trim());
  const titleLine = lines.find(Boolean) || "";
  const body = lines.slice(titleLine ? lines.indexOf(titleLine) + 1 : 0).join("\n").trim() || text;
  const title = normalizeChapterTitle(titleLine, fileName, chapterIndex);
  return {
    chapterIndex,
    title,
    html: plainTextToHtml(body),
    text: body,
    sourceName: fileName
  };
}

function naturalSort(left: string, right: string) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

function parseZipTxtEntries(buffer: Buffer) {
  const archive = unzipSync(new Uint8Array(buffer));
  const files = Object.keys(archive)
    .filter((name) => /\.txt$/i.test(name) && !name.endsWith("/"))
    .sort(naturalSort);
  return files
    .map((name, index) => {
      const entry = archive[name];
      if (!entry) {
        return null;
      }
      return extractTxtChapter(path.posix.basename(name), strFromU8(entry), index + 1);
    })
    .filter((entry): entry is ImportedChapter => Boolean(entry));
}

function extractEpubSpineOrder(entries: Record<string, Uint8Array>) {
  const containerEntry = Object.keys(entries).find((name) => /META-INF\/container\.xml$/i.test(name));
  if (!containerEntry) {
    return [];
  }
  const containerBytes = entries[containerEntry];
  if (!containerBytes) {
    return [];
  }
  const containerXml = strFromU8(containerBytes);
  const container = load(containerXml, { xmlMode: true });
  const opfPath = container("rootfile").attr("full-path") || "";
  if (!opfPath || !entries[opfPath]) {
    return [];
  }
  const opfBytes = entries[opfPath];
  if (!opfBytes) {
    return [];
  }
  const opfXml = strFromU8(opfBytes);
  const opf = load(opfXml, { xmlMode: true });
  const baseDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const manifest = new Map<string, string>();
  opf("manifest > item").each((_, node) => {
    const item = opf(node);
    const id = item.attr("id") || "";
    const href = item.attr("href") || "";
    if (id && href) {
      manifest.set(id, `${baseDir}${href}`);
    }
  });
  return opf("spine > itemref")
    .map((_, node) => manifest.get(opf(node).attr("idref") || "") || "")
    .get()
    .filter(Boolean);
}

function parseEpub(buffer: Buffer, fallbackTitle: string) {
  const entries = unzipSync(new Uint8Array(buffer));
  const ordered = extractEpubSpineOrder(entries);
  const chapterFiles = (ordered.length
    ? ordered
    : Object.keys(entries).filter((name) => /\.(xhtml|html|htm)$/i.test(name) && !/(nav|toc|cover)\./i.test(name)))
    .sort(naturalSort);

  const chapters = chapterFiles
    .map((name, index) => {
      const chapterBytes = entries[name];
      if (!chapterBytes) {
        return null;
      }
      const html = strFromU8(chapterBytes);
      const $ = load(html, { xmlMode: false });
      const title = normalizeChapterTitle($("h1, h2, title").first().text(), path.posix.basename(name), index + 1);
      const bodyHtml = $("body").length ? ($("body").html() || "") : html;
      const bodyText = normalizeTextContent($("body").text() || $.text() || title);
      if (!bodyHtml.trim() && !bodyText.trim()) {
        return null;
      }
      return {
        chapterIndex: index + 1,
        title,
        html: bodyHtml.trim() ? bodyHtml : plainTextToHtml(bodyText),
        text: bodyText,
        sourceName: path.posix.basename(name)
      } as ImportedChapter;
    })
    .filter((entry): entry is ImportedChapter => Boolean(entry));

  const title = fallbackTitle || "Imported EPUB";
  return {
    title,
    author: null,
    description: null,
    chapters
  } satisfies ImportedNovelPayload;
}

async function persistImportedChapters(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  novelId: string,
  chapters: ImportedChapter[],
  replaceExisting = false
) {
  const seriesDir = getPublishedSeriesDir(storagePaths, novelId);

  if (replaceExisting) {
    await prisma.chapter.deleteMany({ where: { novelId } });
    await fs.rm(seriesDir, { recursive: true, force: true }).catch(() => undefined);
  }

  await ensureDir(seriesDir);

  for (const chapter of chapters) {
    const txtRelativePath = path.posix.join("series", novelId, formatChapterFilename(chapter.chapterIndex, 3));
    const txtPath = path.join(storagePaths.opdsDir, txtRelativePath);
    const htmlPath = getChapterHtmlPath(storagePaths, novelId, chapter.chapterIndex);
    await writeFileAtomic(txtPath, `${chapter.title}\n\n${chapter.text.trim()}\n`);
    await writeFileAtomic(htmlPath, chapter.html);
    await prisma.chapter.upsert({
      where: {
        novelId_chapterIndex: {
          novelId,
          chapterIndex: chapter.chapterIndex
        }
      },
      update: {
        title: chapter.title,
        sourceUrl: `upload:${sanitizeFileSegment(chapter.sourceName)}`,
        status: "published",
        epubPath: txtRelativePath,
        fileSize: Buffer.byteLength(chapter.text, "utf8"),
        checksum: sha256Hex(chapter.text),
        publishedAt: new Date(),
        lastError: null
      },
      create: {
        novelId,
        chapterIndex: chapter.chapterIndex,
        title: chapter.title,
        sourceUrl: `upload:${sanitizeFileSegment(chapter.sourceName)}`,
        status: "published",
        epubPath: txtRelativePath,
        fileSize: Buffer.byteLength(chapter.text, "utf8"),
        checksum: sha256Hex(chapter.text),
        publishedAt: new Date()
      }
    });
  }

  const totalPublishedChapters = await prisma.chapter.count({ where: { novelId } });

  await writeJsonFileAtomic(getPublishedManifestPath(storagePaths, novelId), {
    novelId,
    chapters: totalPublishedChapters,
    generatedAt: new Date().toISOString(),
    source: "upload"
  });
  await updateNovelAggregateState(prisma, novelId);
}

export async function importNovelFromUpload(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  payload: {
    fileName: string;
    buffer: Buffer;
    title?: string | null;
    author?: string | null;
    description?: string | null;
  }
) {
  const lowerName = payload.fileName.toLowerCase();
  const imported = lowerName.endsWith(".epub")
    ? parseEpub(payload.buffer, payload.title || path.parse(payload.fileName).name)
    : {
        title: payload.title || path.parse(payload.fileName).name,
        author: payload.author || null,
        description: payload.description || null,
        chapters: parseZipTxtEntries(payload.buffer)
      } satisfies ImportedNovelPayload;

  if (!imported.chapters.length) {
    throw new Error("UPLOAD_NO_CHAPTERS_FOUND");
  }

  const novel = await prisma.novel.create({
    data: {
      title: payload.title || imported.title,
      author: payload.author || imported.author || null,
      sourceId: "local-upload",
      sourceName: "Local Upload",
      sourceUrl: `upload:${Date.now()}:${sanitizeFileSegment(payload.fileName)}`,
      description: payload.description || imported.description || null,
      status: "completed",
      syncStatus: "ready"
    }
  });

  await persistImportedChapters(prisma, storagePaths, novel.id, imported.chapters, false);
  return novel;
}

export async function appendChaptersFromUpload(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  payload: {
    novelId: string;
    fileName: string;
    buffer: Buffer;
    startIndex?: number | null;
  }
) {
  const novel = await prisma.novel.findUnique({
    where: { id: payload.novelId },
    select: { id: true, totalChapters: true }
  });
  if (!novel) {
    throw new Error("NOVEL_NOT_FOUND");
  }
  const lowerName = payload.fileName.toLowerCase();
  const chapters = lowerName.endsWith(".txt")
    ? [extractTxtChapter(payload.fileName, payload.buffer.toString("utf8"), 1)]
    : parseZipTxtEntries(payload.buffer);

  if (!chapters.length) {
    throw new Error("UPLOAD_NO_CHAPTERS_FOUND");
  }

  const firstIndex = payload.startIndex && payload.startIndex > 0 ? payload.startIndex : novel.totalChapters + 1;
  const normalized = chapters.map((chapter, index) => ({
    ...chapter,
    chapterIndex: firstIndex + index
  }));
  await persistImportedChapters(prisma, storagePaths, novel.id, normalized, false);
  return prisma.novel.findUnique({ where: { id: novel.id } });
}
