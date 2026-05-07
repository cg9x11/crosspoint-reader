import type { FastifyInstance } from "fastify";

import type { Queue } from "bullmq";
import { z } from "zod";

import { retryNovelPipeline } from "../../worker/handlers.js";

const ACTIVE_JOB_STATES = ["active", "waiting", "waiting-children", "delayed", "prioritized"] as const;

interface QueueNovelActivity {
  queues: Set<string>;
  totalJobs: number;
  activeJobs: number;
  waitingJobs: number;
  latestCreatedAt: string | null;
}

interface QueueJobsByState {
  state: (typeof ACTIVE_JOB_STATES)[number];
  jobs: Awaited<ReturnType<Queue["getJobs"]>>;
}

function updateLatestTimestamp(current: string | null, next: string | null) {
  if (!next) {
    return current;
  }
  if (!current) {
    return next;
  }
  return current > next ? current : next;
}

async function collectQueueNovelActivity(queue: Queue) {
  const jobsByState: QueueJobsByState[] = await Promise.all(
    ACTIVE_JOB_STATES.map(async (state) => ({
      state,
      jobs: await queue.getJobs([state], 0, 500, true)
    }))
  );
  const map = new Map<string, QueueNovelActivity>();

  for (const { state, jobs } of jobsByState) {
    for (const job of jobs) {
      const novelId = typeof job.data?.novelId === "string" ? job.data.novelId : null;
      if (!novelId) {
        continue;
      }

      const entry = map.get(novelId) ?? {
        queues: new Set<string>(),
        totalJobs: 0,
        activeJobs: 0,
        waitingJobs: 0,
        latestCreatedAt: null
      };
      entry.queues.add(queue.name);
      entry.totalJobs += 1;
      if (state === "active") {
        entry.activeJobs += 1;
      } else {
        entry.waitingJobs += 1;
      }
      entry.latestCreatedAt = updateLatestTimestamp(
        entry.latestCreatedAt,
        job.timestamp ? new Date(job.timestamp).toISOString() : null
      );
      map.set(novelId, entry);
    }
  }

  return map;
}

function mergeQueueActivity(activityMaps: Array<Map<string, QueueNovelActivity>>) {
  const merged = new Map<string, QueueNovelActivity>();

  for (const activityMap of activityMaps) {
    for (const [novelId, activity] of activityMap.entries()) {
      const current = merged.get(novelId) ?? {
        queues: new Set<string>(),
        totalJobs: 0,
        activeJobs: 0,
        waitingJobs: 0,
        latestCreatedAt: null
      };

      activity.queues.forEach((queueName) => current.queues.add(queueName));
      current.totalJobs += activity.totalJobs;
      current.activeJobs += activity.activeJobs;
      current.waitingJobs += activity.waitingJobs;
      current.latestCreatedAt = updateLatestTimestamp(current.latestCreatedAt, activity.latestCreatedAt);
      merged.set(novelId, current);
    }
  }

  return merged;
}

function buildTaskState(input: {
  syncStatus: string;
  hasRunningJobs: boolean;
  failedChapters: number;
  remainingChapters: number;
}) {
  if (input.hasRunningJobs || input.syncStatus === "queued" || input.syncStatus === "syncing") {
    return input.syncStatus === "queued" ? "queued" : "running";
  }

  if (input.failedChapters > 0 || input.syncStatus === "error" || input.remainingChapters > 0) {
    return "stopped";
  }

  return "completed";
}

export async function registerTasksApiRoutes(app: FastifyInstance) {
  const listTasks = async () => {
    const novels = await app.prisma.novel.findMany({
      where: {
        OR: [
          { syncRuns: { some: {} } },
          { syncStatus: { in: ["queued", "syncing", "error"] } },
          { totalChapters: { gt: 0 } },
          { downloadedChapters: { gt: 0 } }
        ]
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 20,
      select: {
        id: true,
        title: true,
        sourceId: true,
        sourceName: true,
        syncStatus: true,
        totalChapters: true,
        downloadedChapters: true,
        lastError: true,
        lastSyncStartedAt: true,
        lastSyncEndedAt: true,
        updatedAt: true,
        syncRuns: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            triggerType: true,
            errorMessage: true,
            createdAt: true,
            startedAt: true,
            endedAt: true,
            totalFound: true,
            newChapters: true
          }
        }
      }
    });

    const novelIds = novels.map((novel) => novel.id);
    const chapterStates = novelIds.length
      ? await app.prisma.chapter.findMany({
          where: {
            novelId: { in: novelIds },
            status: { not: "published" }
          },
          select: {
            novelId: true,
            status: true
          }
        })
      : [];
    const chapterStats = new Map<
      string,
      {
        failed: number;
        pending: number;
      }
    >();

    for (const chapter of chapterStates) {
      const entry = chapterStats.get(chapter.novelId) ?? { failed: 0, pending: 0 };
      entry.pending += 1;
      if (chapter.status === "fetch_failed" || chapter.status === "build_failed") {
        entry.failed += 1;
      }
      chapterStats.set(chapter.novelId, entry);
    }

    const queueActivity = mergeQueueActivity(
      await Promise.all([
        collectQueueNovelActivity(app.queues.novelSync),
        collectQueueNovelActivity(app.queues.chapterFetch),
        collectQueueNovelActivity(app.queues.chapterBuild)
      ])
    );

    const items = novels
      .map((novel) => {
        const stats = chapterStats.get(novel.id) ?? { failed: 0, pending: 0 };
        const queue = queueActivity.get(novel.id);
        const remainingChapters = Math.max(
          stats.pending,
          Math.max(0, Number(novel.totalChapters) - Number(novel.downloadedChapters))
        );
        const state = buildTaskState({
          syncStatus: novel.syncStatus,
          hasRunningJobs: Boolean(queue?.totalJobs),
          failedChapters: stats.failed,
          remainingChapters
        });
        const latestRun = novel.syncRuns[0] ?? null;
        const lastActivityAt =
          queue?.latestCreatedAt ||
          novel.lastSyncEndedAt?.toISOString() ||
          novel.lastSyncStartedAt?.toISOString() ||
          novel.updatedAt.toISOString();

        return {
          id: novel.id,
          novelId: novel.id,
          title: novel.title,
          sourceId: novel.sourceId,
          sourceName: novel.sourceName,
          syncStatus: novel.syncStatus,
          state,
          totalChapters: novel.totalChapters,
          downloadedChapters: novel.downloadedChapters,
          remainingChapters,
          failedChapters: stats.failed,
          queueDepth: queue?.totalJobs ?? 0,
          activeJobs: queue?.activeJobs ?? 0,
          waitingJobs: queue?.waitingJobs ?? 0,
          activeQueues: queue ? Array.from(queue.queues) : [],
          retryable: state === "stopped",
          lastError: novel.lastError || latestRun?.errorMessage || null,
          triggerType: latestRun?.triggerType || null,
          lastRunStatus: latestRun?.status || null,
          lastRunFound: latestRun?.totalFound ?? null,
          lastRunNewChapters: latestRun?.newChapters ?? null,
          createdAt: latestRun?.createdAt?.toISOString() || novel.updatedAt.toISOString(),
          startedAt: latestRun?.startedAt?.toISOString() || novel.lastSyncStartedAt?.toISOString() || null,
          finishedAt: latestRun?.endedAt?.toISOString() || novel.lastSyncEndedAt?.toISOString() || null,
          lastActivityAt
        };
      })
      .sort((left, right) => {
        const stateRank = new Map([
          ["running", 0],
          ["queued", 1],
          ["stopped", 2],
          ["completed", 3]
        ]);
        const leftRank = stateRank.get(left.state) ?? 99;
        const rightRank = stateRank.get(right.state) ?? 99;
        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }
        return (right.lastActivityAt ?? "").localeCompare(left.lastActivityAt ?? "");
      });

    return { items };
  };

  app.get("/api/tasks/jobs", listTasks);
  app.get("/api/tasks/novels", listTasks);

  const retryTask = async (novelId: string) =>
    retryNovelPipeline(app.queues, app.prisma, app.storagePaths, novelId);

  app.post("/api/tasks/jobs/:jobId/retry", async (request) => {
    const params = z.object({ jobId: z.string().min(1) }).parse(request.params);
    return retryTask(params.jobId);
  });

  app.post("/api/tasks/novels/:novelId/retry", async (request) => {
    const params = z.object({ novelId: z.string().min(1) }).parse(request.params);
    return retryTask(params.novelId);
  });
}
