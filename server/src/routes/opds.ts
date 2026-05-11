import type { FastifyInstance } from "fastify";

import fs from "node:fs/promises";
import path from "node:path";

import { resolvePublicBaseUrl } from "../lib/requestBaseUrl.js";
import { buildOpdsFeed } from "../opds/feed.js";
import {
  getPublishedChapterCandidates,
  getPublishedCoverBmpPath,
  getPublishedManifestPath
} from "../library/service.js";
import { fileExists, writeJsonFileAtomic } from "../lib/filesystem.js";
import { repairJsonStringsDeep } from "../lib/text.js";

function absoluteUrl(baseUrl: string, routePath: string) {
  return new URL(routePath, `${baseUrl}/`).toString();
}

const OPDS_LIBRARY_PAGE_SIZE = 12;

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
  const resolveChapterDownloadAsset = async (
    novelId: string,
    chapterIndex: number,
    storedRelativePath?: string | null
  ) => {
    const candidates = getPublishedChapterCandidates(app.storagePaths, novelId, chapterIndex, storedRelativePath);
    for (const candidate of candidates) {
      if (await fileExists(candidate.path)) {
        return candidate;
      }
    }
    return candidates[0] ?? null;
  };

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
    const rawPage =
      "page" in request.query && typeof (request.query as { page?: unknown }).page === "string"
        ? Number((request.query as { page?: string }).page)
        : 1;
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

    const where = {
      chapters: {
        some: {
          status: "published"
        }
      }
    } as const;

    const [totalNovels, novels] = await Promise.all([
      app.prisma.novel.count({ where }),
      app.prisma.novel.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * OPDS_LIBRARY_PAGE_SIZE,
        take: OPDS_LIBRARY_PAGE_SIZE
      })
    ]);

    const libraryPath = `/opds/library?page=${page}`;
    const links = [
      {
        href: absoluteUrl(baseUrl, libraryPath),
        rel: "self",
        type: "application/atom+xml;profile=opds-catalog;kind=navigation"
      },
      {
        href: absoluteUrl(baseUrl, "/opds"),
        rel: "start",
        type: "application/atom+xml;profile=opds-catalog;kind=navigation"
      }
    ];

    if (page > 1) {
      links.push({
        href: absoluteUrl(baseUrl, `/opds/library?page=${page - 1}`),
        rel: "previous",
        type: "application/atom+xml;profile=opds-catalog;kind=navigation"
      });
    }

    if (page * OPDS_LIBRARY_PAGE_SIZE < totalNovels) {
      links.push({
        href: absoluteUrl(baseUrl, `/opds/library?page=${page + 1}`),
        rel: "next",
        type: "application/atom+xml;profile=opds-catalog;kind=navigation"
      });
    }

    const feed = buildOpdsFeed({
      id: absoluteUrl(baseUrl, libraryPath),
      title: "Thu vien OPDS",
      updatedAt: new Date().toISOString(),
      links,
      entries: novels.map((novel) => ({
        id: `urn:novel:${novel.id}`,
        title: novel.title,
        updatedAt: novel.updatedAt.toISOString(),
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
      entries: await Promise.all(
        novel.chapters.map(async (chapter) => {
          const asset = await resolveChapterDownloadAsset(novelId, chapter.chapterIndex, chapter.epubPath);
          const fileName = asset?.fileName || `ch_${String(chapter.chapterIndex).padStart(3, "0")}.txt`;
          const mediaType = fileName.toLowerCase().endsWith(".epub")
            ? "application/epub+zip"
            : "text/plain; charset=utf-8";

          return {
            id: `urn:chapter:${chapter.id}`,
            title: chapter.title,
            updatedAt: (chapter.publishedAt ?? chapter.updatedAt).toISOString(),
            summary: novel.description ?? undefined,
            author: novel.author ?? undefined,
            links: [
              {
                href: absoluteUrl(baseUrl, `/opds/download/${novelId}/${fileName}`),
                rel: "http://opds-spec.org/acquisition",
                type: mediaType
              }
            ]
          };
        })
      )
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

    const chapter = await app.prisma.chapter.findFirst({
      where: {
        novelId,
        chapterIndex,
        status: "published"
      },
      select: {
        epubPath: true
      }
    });

    const asset = await resolveChapterDownloadAsset(novelId, chapterIndex, chapter?.epubPath);
    if (!asset || !(await fileExists(asset.path))) {
      reply.code(404);
      return {
        ok: false,
        error: "CHAPTER_NOT_FOUND"
      };
    }

    try {
      const file = await fs.readFile(asset.path);
      reply.header("Content-Disposition", `attachment; filename="${path.basename(asset.path)}"`);
      if (asset.path.toLowerCase().endsWith(".txt")) {
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
