import type { FastifyInstance } from "fastify";

import { z } from "zod";

import {
  getSourceChapters,
  getSourceDetail,
  getSourceHome,
  getSourceSearch,
  listSources
} from "../../plugins/service.js";
import { isVbookUpstreamBlockedError } from "../../plugins/vbook/runtime.js";

function isRecoverableChapterListError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("extension returned no data");
}

function isHakoSource(sourceId: string, detailUrl?: string) {
  return (
    sourceId.toLowerCase().includes("hako") ||
    (detailUrl ? /docln\.sbs|ln\.hako\.vn|ln\.hako\.re/i.test(detailUrl) : false)
  );
}

function buildBlockedSourceMessage(sourceId: string, context: string) {
  if (isHakoSource(sourceId)) {
    return `Nguồn Hako đang chặn truy cập tự động từ server nên chưa lấy được ${context}. Hãy thử lại sau hoặc duyệt từ dữ liệu preview/home.`;
  }

  return `Nguồn này đang chặn truy cập tự động từ server nên chưa lấy được ${context}. Hãy thử lại sau hoặc dùng nguồn khác.`;
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

    try {
      return await getSourceSearch(app.storagePaths, app.prisma, params.sourceId, query.query, query.page);
    } catch (error) {
      if (!isVbookUpstreamBlockedError(error)) {
        throw error;
      }

      app.log.warn(
        {
          err: error,
          sourceId: params.sourceId,
          query: query.query,
          page: query.page
        },
        "Source search blocked by upstream protection"
      );

      return {
        source: {
          id: params.sourceId,
          name: params.sourceId,
          runtimeSupported: true
        },
        query: query.query,
        page: query.page ?? "1",
        nextPage: null,
        items: [],
        blocked: true,
        warning: buildBlockedSourceMessage(params.sourceId, "kết quả tìm kiếm")
      };
    }
  });

  app.get("/api/sources/:sourceId/detail", async (request) => {
    const params = z.object({ sourceId: z.string().min(1) }).parse(request.params);
    const query = z
      .object({
        url: z.string().trim().min(1)
      })
      .parse(request.query);

    try {
      return await getSourceDetail(app.storagePaths, app.prisma, params.sourceId, query.url);
    } catch (error) {
      if (!isVbookUpstreamBlockedError(error)) {
        throw error;
      }

      app.log.warn(
        {
          err: error,
          sourceId: params.sourceId,
          detailUrl: query.url
        },
        "Source detail blocked by upstream protection"
      );

      return {
        id: `${params.sourceId}:${query.url}`,
        sourceId: params.sourceId,
        title: query.url,
        status: "unknown",
        genres: [],
        sourceUrl: query.url,
        blocked: true,
        warning: buildBlockedSourceMessage(params.sourceId, "thông tin truyện")
      };
    }
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
      if (isVbookUpstreamBlockedError(error)) {
        app.log.warn(
          {
            err: error,
            sourceId: params.sourceId,
            detailUrl: query.url
          },
          "Source chapter list blocked by upstream protection"
        );

        return {
          items: [],
          blocked: true,
          warning: buildBlockedSourceMessage(params.sourceId, "danh sách chương")
        };
      }

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
