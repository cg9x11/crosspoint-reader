import type { FastifyInstance } from "fastify";

import { z } from "zod";

import {
  deleteLibraryNovel,
  getLibraryNovel,
  listLibraryNovels,
  upsertNovelFromSourceDetail
} from "../../library/service.js";
import { getSourceDetail } from "../../plugins/service.js";
import { scheduleNovelSync } from "../../worker/handlers.js";

const createLibraryNovelSchema = z.object({
  sourceId: z.string().min(1),
  detailUrl: z.string().min(1),
  syncNow: z.boolean().optional().default(true)
});

export async function registerLibraryApiRoutes(app: FastifyInstance) {
  app.get("/api/library/novels", async (request) => {
    const query = z
      .object({
        query: z.string().trim().optional(),
        status: z.string().trim().optional(),
        syncStatus: z.string().trim().optional()
      })
      .parse(request.query);

    return {
      items: await listLibraryNovels(app.prisma, query)
    };
  });

  app.post("/api/library/novels", async (request) => {
    const body = createLibraryNovelSchema.parse(request.body);
    const detail = await getSourceDetail(app.storagePaths, app.prisma, body.sourceId, body.detailUrl);
    const novel = await upsertNovelFromSourceDetail(app.prisma, body.sourceId, detail);

    if (body.syncNow) {
      await scheduleNovelSync(app.queues, app.prisma, novel.id, "add");
    }

    return {
      ok: true,
      item: await getLibraryNovel(app.prisma, novel.id)
    };
  });

  app.get("/api/library/novels/:novelId", async (request, reply) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    const item = await getLibraryNovel(app.prisma, params.novelId);

    if (!item) {
      reply.code(404);
      return {
        ok: false,
        error: "NOVEL_NOT_FOUND"
      };
    }

    return item;
  });

  app.post("/api/library/novels/:novelId/sync", async (request) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    await scheduleNovelSync(app.queues, app.prisma, params.novelId, "manual");
    return { ok: true };
  });

  app.post("/api/library/novels/:novelId/retry", async (request) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    await scheduleNovelSync(app.queues, app.prisma, params.novelId, "retry");
    return { ok: true };
  });

  app.delete("/api/library/novels/:novelId", async (request) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    await deleteLibraryNovel(app.prisma, params.novelId);
    return { ok: true };
  });
}
