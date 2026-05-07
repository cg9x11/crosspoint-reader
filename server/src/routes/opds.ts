import type { FastifyInstance } from "fastify";

import fs from "node:fs/promises";
import path from "node:path";

import { buildOpdsFeed } from "../opds/feed.js";
import {
  getPublishedChapterPath,
  getPublishedCoverBmpPath,
  getPublishedManifestPath
} from "../library/service.js";

function absoluteUrl(baseUrl: string, routePath: string) {
  return new URL(routePath, `${baseUrl}/`).toString();
}

function chapterFilename(chapterIndex: number) {
  return `ch_${String(chapterIndex).padStart(3, "0")}.epub`;
}

function parseChapterIndex(input: string) {
  if (/^\d+$/.test(input)) {
    return Number(input);
  }

  const match = /^ch_(\d+)\.epub$/i.exec(input);
  return match ? Number(match[1]) : 0;
}

function buildCoverDownloadPath(novelId: string) {
  return `/opds/download/${encodeURIComponent(novelId)}/cover.bmp`;
}

export async function registerOpdsRoutes(app: FastifyInstance) {
  app.get("/opds", async (_, reply) => {
    const updatedAt = new Date().toISOString();
    const feed = buildOpdsFeed({
      id: absoluteUrl(app.appConfig.APP_BASE_URL, "/opds"),
      title: "CrossPoint Reader OPDS",
      updatedAt,
      links: [
        {
          href: absoluteUrl(app.appConfig.APP_BASE_URL, "/opds"),
          rel: "self",
          type: "application/atom+xml;profile=opds-catalog;kind=navigation"
        }
      ],
      entries: [
        {
          id: absoluteUrl(app.appConfig.APP_BASE_URL, "/opds/library"),
          title: "Thu vien",
          updatedAt,
          summary: "Danh sach series da publish",
          links: [
            {
              href: absoluteUrl(app.appConfig.APP_BASE_URL, "/opds/library"),
              type: "application/atom+xml;profile=opds-catalog;kind=navigation"
            }
          ]
        }
      ]
    });

    reply.type("application/atom+xml; charset=utf-8");
    return feed;
  });

  app.get("/opds/library", async (_, reply) => {
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
      id: absoluteUrl(app.appConfig.APP_BASE_URL, "/opds/library"),
      title: "Thu vien OPDS",
      updatedAt: new Date().toISOString(),
      links: [
        {
          href: absoluteUrl(app.appConfig.APP_BASE_URL, "/opds/library"),
          rel: "self",
          type: "application/atom+xml;profile=opds-catalog;kind=navigation"
        },
        {
          href: absoluteUrl(app.appConfig.APP_BASE_URL, "/opds"),
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
            href: absoluteUrl(app.appConfig.APP_BASE_URL, `/opds/series/${novel.id}`),
            type: "application/atom+xml;profile=opds-catalog;kind=acquisition"
          },
          ...(novel.coverLocalPath
            ? [
                {
                  href: absoluteUrl(app.appConfig.APP_BASE_URL, buildCoverDownloadPath(novel.id)),
                  rel: "http://opds-spec.org/image",
                  type: "image/bmp"
                },
                {
                  href: absoluteUrl(app.appConfig.APP_BASE_URL, buildCoverDownloadPath(novel.id)),
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
      id: absoluteUrl(app.appConfig.APP_BASE_URL, `/opds/series/${novelId}`),
      title: novel.title,
      updatedAt: novel.updatedAt.toISOString(),
      links: [
        {
          href: absoluteUrl(app.appConfig.APP_BASE_URL, `/opds/series/${novelId}`),
          rel: "self",
          type: "application/atom+xml;profile=opds-catalog;kind=acquisition"
        },
        {
          href: absoluteUrl(app.appConfig.APP_BASE_URL, "/opds/library"),
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
            href: absoluteUrl(
              app.appConfig.APP_BASE_URL,
              `/opds/download/${novelId}/${chapterFilename(chapter.chapterIndex)}`
            ),
            rel: "http://opds-spec.org/acquisition",
            type: "application/epub+zip"
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

    try {
      const raw = await fs.readFile(manifestPath, "utf8");
      reply.type("application/json; charset=utf-8");
      return raw;
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
      reply.type("application/epub+zip");
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
