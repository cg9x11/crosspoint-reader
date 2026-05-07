import type { FastifyInstance } from "fastify";

import { z } from "zod";

import type { Queue } from "bullmq";

async function listQueueJobs(queue: Queue) {
  const jobs = await queue.getJobs(["active", "waiting", "delayed", "failed", "completed"], 0, 50, true);
  const mapped = await Promise.all(
    jobs.map(async (job) => ({
      id: job.id,
      queue: queue.name,
      name: job.name,
      state: await job.getState(),
      attemptsMade: job.attemptsMade,
      createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
      startedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      novelId: typeof job.data?.novelId === "string" ? job.data.novelId : null,
      error: job.failedReason || null
    }))
  );

  return mapped;
}

function buildRetryJobId(jobId: string) {
  return `${jobId.replaceAll(":", "_")}__retry__${Date.now()}`;
}

export async function registerTasksApiRoutes(app: FastifyInstance) {
  app.get("/api/tasks/jobs", async () => {
    const jobs = (
      await Promise.all([
        listQueueJobs(app.queues.novelSync),
        listQueueJobs(app.queues.chapterFetch),
        listQueueJobs(app.queues.chapterBuild),
        listQueueJobs(app.queues.maintenance)
      ])
    )
      .flat()
      .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));

    const novelIds = jobs
      .map((job) => job.novelId)
      .filter((novelId): novelId is string => Boolean(novelId));
    const novels = novelIds.length
      ? await app.prisma.novel.findMany({
          where: {
            id: { in: [...new Set(novelIds)] }
          },
          select: {
            id: true,
            title: true,
            sourceId: true,
            sourceName: true
          }
        })
      : [];
    const novelMap = new Map(novels.map((novel) => [novel.id, novel]));

    return {
      items: jobs.map((job) => ({
        ...job,
        novelTitle: job.novelId ? novelMap.get(job.novelId)?.title ?? null : null,
        sourceId: job.novelId ? novelMap.get(job.novelId)?.sourceId ?? null : null,
        sourceName: job.novelId ? novelMap.get(job.novelId)?.sourceName ?? null : null
      }))
    };
  });

  app.post("/api/tasks/jobs/:jobId/retry", async (request, reply) => {
    const params = z.object({ jobId: z.string().min(1) }).parse(request.params);
    const queues = [app.queues.novelSync, app.queues.chapterFetch, app.queues.chapterBuild, app.queues.maintenance];

    for (const queue of queues) {
      const job = await queue.getJob(params.jobId);
      if (!job) {
        continue;
      }

      const state = await job.getState();
      if (state === "failed") {
        await job.retry();
        return { ok: true, queue: queue.name, retried: true };
      }

      await queue.add(job.name, job.data, { jobId: buildRetryJobId(String(job.id)) });
      return { ok: true, queue: queue.name, retried: false, requeued: true };
    }

    reply.code(404);
    return {
      ok: false,
      error: "JOB_NOT_FOUND"
    };
  });
}
