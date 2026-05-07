import type { FastifyInstance } from "fastify";

import { z } from "zod";

import {
  getSourceChapters,
  getSourceDetail,
  getSourceHome,
  getSourceSearch,
  listSources
} from "../../plugins/service.js";

function isRecoverableChapterListError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("extension returned no data");
}

export async function registerSourcesApiRoutes(app: FastifyInstance) {
  app.get("/api/sources", async () => {
    return {
      items: await listSources(app.storagePaths, app.prisma)
    };
  });

  app.get("/api/sources/:sourceId/home", async (request) => {
    const params = z.object({ sourceId: z.string().min(1) }).parse(request.params);
    return getSourceHome(app.storagePaths, app.prisma, params.sourceId);
  });

  app.get("/api/sources/:sourceId/search", async (request) => {
    const params = z.object({ sourceId: z.string().min(1) }).parse(request.params);
    const query = z
      .object({
        query: z.string().trim().default(""),
        page: z.string().trim().optional()
      })
      .parse(request.query);

    return getSourceSearch(app.storagePaths, app.prisma, params.sourceId, query.query, query.page);
  });

  app.get("/api/sources/:sourceId/detail", async (request) => {
    const params = z.object({ sourceId: z.string().min(1) }).parse(request.params);
    const query = z
      .object({
        url: z.string().trim().min(1)
      })
      .parse(request.query);

    return getSourceDetail(app.storagePaths, app.prisma, params.sourceId, query.url);
  });

  app.get("/api/sources/:sourceId/chapters", async (request) => {
    const params = z.object({ sourceId: z.string().min(1) }).parse(request.params);
    const query = z
      .object({
        url: z.string().trim().min(1)
      })
      .parse(request.query);

    try {
      return {
        items: await getSourceChapters(app.storagePaths, app.prisma, params.sourceId, query.url)
      };
    } catch (error) {
      if (!isRecoverableChapterListError(error)) {
        throw error;
      }

      app.log.warn(
        {
          err: error,
          sourceId: params.sourceId,
          detailUrl: query.url
        },
        "Source returned no chapter data for detail request"
      );

      return {
        items: [],
        warning: "Nguồn không trả về danh sách chương cho truyện này. Bạn vẫn có thể mở nguồn khác hoặc thử lại sau."
      };
    }
  });
}
