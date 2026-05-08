import type { FastifyInstance } from "fastify";

import fs from "node:fs/promises";
import path from "node:path";

import { resolvePublicBaseUrl } from "../lib/requestBaseUrl.js";
import { buildOpdsFeed } from "../opds/feed.js";
import {
  getPublishedChapterPath,
  getPublishedCoverBmpPath,
  getPublishedManifestPath
} from "../library/service.js";
import { fileExists, writeJsonFileAtomic } from "../lib/filesystem.js";
import { repairJsonStringsDeep } from "../lib/text.js";

function absoluteUrl(baseUrl: string, routePath: string) {
  return new URL(routePath, `${baseUrl}/`).toString();
}

function chapterFilename(chapterIndex: number) {
  return `ch_${String(chapterIndex).padStart(3, "0")}.txt`;
}

function parseChapterIndex(input: string) {
  if (/^\d+$/.test(input)) {
    return Number(input);
  }

  const match = /^ch_(\d+)\.(txt|epub)$/i.exec(input);
  return match ? Number(match[1]) : 0;
}

function buildCoverDownloadPath(novelId: string) {
  return `/opds/download/${encodeURIComponent(novelId)}/cover.bmp`;
}

function repairSeriesManifestPayload(payload: unknown, hasCoverBmp: boolean) {
  const repaired = repairJsonStringsDeep(payload as Record<string, unknown>);
  if (!repaired || typeof repaired !== "object" || Array.isArray(repaired)) {
    return repaired;
  }

  if (hasCoverBmp) {
    const coverPath = typeof repaired.coverPath === "string" ? repaired.coverPath : "";
    if (!coverPath || /\.epub$/i.test(coverPath)) {
      repaired.coverPath = "cover.bmp";
    }
  }

  return repaired;
}

export async function registerOpdsRoutes(app: FastifyInstance) {
  app.get("/opds", async (request, reply) => {
    const baseUrl = resolvePublicBaseUrl(request, app.appConfig.APP_BASE_URL);
    const updatedAt = new Date().toISOString();
    const feed = buildOpdsFeed({
      id: absoluteUrl(baseUrl, "/opds"),
      title: "CrossPoint Reader OPDS",
      updatedAt,
      links: [
        {
          href: absoluteUrl(baseUrl, "/opds"),
          rel: "self",
          type: "application/atom+xml;profile=opds-catalog;kind=navigation"
        }
      ],
      entries: [
        {
          id: absoluteUrl(baseUrl, "/opds/library"),
          title: "Thu vien",
          updatedAt,
          summary: "Danh sach series da publish",
          links: [
            {
              href: absoluteUrl(baseUrl, "/opds/library"),
              type: "application/atom+xml;profile=opds-catalog;kind=navigation"
            }
          ]
        }
      ]
    });

    reply.type("application/atom+xml; charset=utf-8");
    return feed;
  });

  app.get("/opds/library", async (request, reply) => {
    const baseUrl = resolvePublicBaseUrl(request, app.appConfig.APP_BASE_URL);
    const novels = await app.prisma.novel.findMany({
      where: {
        chapters: {
          some: {
            status: "published"
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const feed = buildOpdsFeed({
      id: absoluteUrl(baseUrl, "/opds/library"),
      title: "Thu vien OPDS",
      updatedAt: new Date().toISOString(),
      links: [
        {
          href: absoluteUrl(baseUrl, "/opds/library"),
          rel: "self",
          type: "application/atom+xml;profile=opds-catalog;kind=navigation"
        },
        {
          href: absoluteUrl(baseUrl, "/opds"),
          rel: "start",
          type: "application/atom+xml;profile=opds-catalog;kind=navigation"
        }
      ],
      entries: novels.map((novel) => ({
        id: `urn:novel:${novel.id}`,
        title: novel.title,
        updatedAt: novel.updatedAt.toISOString(),
        summary: novel.description ?? undefined,
        author: novel.author ?? undefined,
        links: [
          {
            href: absoluteUrl(baseUrl, `/opds/series/${novel.id}`),
            type: "application/atom+xml;profile=opds-catalog;kind=acquisition"
          },
          ...(novel.coverLocalPath
            ? [
                {
                  href: absoluteUrl(baseUrl, buildCoverDownloadPath(novel.id)),
                  rel: "http://opds-spec.org/image",
                  type: "image/bmp"
                },
                {
                  href: absoluteUrl(baseUrl, buildCoverDownloadPath(novel.id)),
                  rel: "http://opds-spec.org/image/thumbnail",
                  type: "image/bmp"
                }
              ]
            : [])
        ]
      }))
    });

    reply.type("application/atom+xml; charset=utf-8");
    return feed;
  });

  app.get("/opds/series/:novelId", async (request, reply) => {
    const baseUrl = resolvePublicBaseUrl(request, app.appConfig.APP_BASE_URL);
    const novelId = (request.params as { novelId: string }).novelId;
    const novel = await app.prisma.novel.findUnique({
      where: { id: novelId },
      include: {
        chapters: {
          where: { status: "published" },
          orderBy: { chapterIndex: "asc" }
        }
      }
    });

    if (!novel) {
      reply.code(404);
      return { ok: false, error: "SERIES_NOT_FOUND" };
    }

    const feed = buildOpdsFeed({
      id: absoluteUrl(baseUrl, `/opds/series/${novelId}`),
      title: novel.title,
      updatedAt: novel.updatedAt.toISOString(),
      links: [
        {
          href: absoluteUrl(baseUrl, `/opds/series/${novelId}`),
          rel: "self",
          type: "application/atom+xml;profile=opds-catalog;kind=acquisition"
        },
        {
          href: absoluteUrl(baseUrl, "/opds/library"),
          rel: "start",
          type: "application/atom+xml;profile=opds-catalog;kind=navigation"
        }
      ],
      entries: novel.chapters.map((chapter) => ({
        id: `urn:chapter:${chapter.id}`,
        title: chapter.title,
        updatedAt: (chapter.publishedAt ?? chapter.updatedAt).toISOString(),
        summary: novel.description ?? undefined,
        author: novel.author ?? undefined,
        links: [
          {
            href: absoluteUrl(baseUrl, `/opds/download/${novelId}/${chapterFilename(chapter.chapterIndex)}`),
            rel: "http://opds-spec.org/acquisition",
            type: "text/plain; charset=utf-8"
          }
        ]
      }))
    });

    reply.type("application/atom+xml; charset=utf-8");
    return feed;
  });

  app.get("/opds/download/:novelId/_series.json", async (request, reply) => {
    const novelId = (request.params as { novelId: string }).novelId;
    const manifestPath = getPublishedManifestPath(app.storagePaths, novelId);
    const coverPath = getPublishedCoverBmpPath(app.storagePaths, novelId);

    try {
      const raw = await fs.readFile(manifestPath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      const repaired = repairSeriesManifestPayload(parsed, await fileExists(coverPath));
      const normalized = `${JSON.stringify(repaired, null, 2)}\n`;

      if (normalized !== raw) {
        await writeJsonFileAtomic(manifestPath, repaired);
      }

      reply.type("application/json; charset=utf-8");
      return normalized;
    } catch {
      reply.code(404);
      return {
        ok: false,
        error: "MANIFEST_NOT_FOUND"
      };
    }
  });

  app.get("/opds/download/:novelId/cover.bmp", async (request, reply) => {
    const novelId = (request.params as { novelId: string }).novelId;
    const coverPath = getPublishedCoverBmpPath(app.storagePaths, novelId);

    try {
      const file = await fs.readFile(coverPath);
      reply.header("Content-Disposition", 'attachment; filename="cover.bmp"');
      reply.type("image/bmp");
      return file;
    } catch {
      reply.code(404);
      return {
        ok: false,
        error: "COVER_NOT_FOUND"
      };
    }
  });

  app.get("/opds/download/:novelId/:chapterRef", async (request, reply) => {
    const { novelId, chapterRef } = request.params as { novelId: string; chapterRef: string };
    const chapterIndex = parseChapterIndex(chapterRef);

    if (chapterIndex <= 0) {
      reply.code(404);
      return {
        ok: false,
        error: "CHAPTER_NOT_FOUND"
      };
    }

    const filePath = getPublishedChapterPath(app.storagePaths, novelId, chapterIndex);

    try {
      const file = await fs.readFile(filePath);
      reply.header("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
      if (filePath.toLowerCase().endsWith(".txt")) {
        reply.type("text/plain; charset=utf-8");
      } else {
        reply.type("application/epub+zip");
      }
      return file;
    } catch {
      reply.code(404);
      return {
        ok: false,
        error: "CHAPTER_NOT_FOUND"
      };
    }
  });
}
