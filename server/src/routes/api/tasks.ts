import type { FastifyInstance } from "fastify";

import type { Queue } from "bullmq";
import { z } from "zod";

import { retryNovelPipeline } from "../../worker/handlers.js";

const ACTIVE_JOB_STATES = ["active", "waiting", "waiting-children", "delayed", "prioritized"] as const;
const FAILED_CHAPTER_STATES = ["fetch_failed", "build_failed"] as const;

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

interface FailedChapterSnapshot {
  chapterIndex: number;
  title: string;
  status: (typeof FAILED_CHAPTER_STATES)[number];
  lastError: string | null;
  retryCount: number;
  updatedAt: Date;
}

interface ChapterTaskStats {
  failed: number;
  pending: number;
  queuedBuild: number;
  building: number;
  buildFailed: number;
  lastFailedChapter: FailedChapterSnapshot | null;
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
  triggerType: string | null;
  lastRunStatus: string | null;
  hasRunningJobs: boolean;
  failedChapters: number;
  remainingChapters: number;
}) {
  if (input.triggerType === "export") {
    if (input.lastRunStatus === "running") {
      return "running";
    }
    if (input.lastRunStatus === "failed") {
      return "stopped";
    }
    if (input.lastRunStatus === "completed") {
      return "completed";
    }
  }

  if (input.hasRunningJobs || input.syncStatus === "queued" || input.syncStatus === "syncing") {
    return input.syncStatus === "queued" ? "queued" : "running";
  }

  if (input.failedChapters > 0 || input.syncStatus === "error") {
    return "stopped";
  }

  if (input.triggerType === "rebuild") {
    return "completed";
  }

  if (input.remainingChapters > 0) {
    return "stopped";
  }

  return "completed";
}

export async function registerTasksApiRoutes(app: FastifyInstance) {
  const listTasks = async () => {
    const runs = await app.prisma.syncRun.findMany({
      where: {
        novel: {
          OR: [
            { syncRuns: { some: {} } },
            { syncStatus: { in: ["queued", "syncing", "error"] } },
            { totalChapters: { gt: 0 } },
            { downloadedChapters: { gt: 0 } }
          ]
        }
      },
      orderBy: [{ createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        status: true,
        triggerType: true,
        errorMessage: true,
        createdAt: true,
        startedAt: true,
        endedAt: true,
        totalFound: true,
        newChapters: true,
        novelId: true,
        novel: {
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
                id: true
              }
            }
          }
        }
      }
    });

    const novelIds = Array.from(new Set(runs.map((run) => run.novelId)));
    const chapterStates = novelIds.length
      ? await app.prisma.chapter.findMany({
          where: {
            novelId: { in: novelIds },
            status: { not: "published" }
          },
          select: {
            novelId: true,
            chapterIndex: true,
            title: true,
            status: true,
            lastError: true,
            retryCount: true,
            updatedAt: true
          }
        })
      : [];
    const chapterStats = new Map<string, ChapterTaskStats>();

    for (const chapter of chapterStates) {
      const entry = chapterStats.get(chapter.novelId) ?? {
        failed: 0,
        pending: 0,
        queuedBuild: 0,
        building: 0,
        buildFailed: 0,
        lastFailedChapter: null
      };
      entry.pending += 1;
      if (chapter.status === "queued_build") {
        entry.queuedBuild += 1;
      } else if (chapter.status === "building") {
        entry.building += 1;
      } else if (chapter.status === "build_failed") {
        entry.buildFailed += 1;
      }
      if (chapter.status === "fetch_failed" || chapter.status === "build_failed") {
        entry.failed += 1;
        if (
          !entry.lastFailedChapter ||
          chapter.updatedAt.getTime() >= entry.lastFailedChapter.updatedAt.getTime()
        ) {
          entry.lastFailedChapter = {
            chapterIndex: chapter.chapterIndex,
            title: chapter.title,
            status: chapter.status,
            lastError: chapter.lastError,
            retryCount: chapter.retryCount,
            updatedAt: chapter.updatedAt
          };
        }
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

    const items = runs
      .map((run) => {
        const novel = run.novel;
        const stats = chapterStats.get(novel.id) ?? {
          failed: 0,
          pending: 0,
          queuedBuild: 0,
          building: 0,
          buildFailed: 0,
          lastFailedChapter: null
        };
        const queue = queueActivity.get(novel.id);
        const isLatestRunForNovel = novel.syncRuns[0]?.id === run.id;
        const remainingChapters = Math.max(
          stats.pending,
          Math.max(0, Number(novel.totalChapters) - Number(novel.downloadedChapters))
        );
        const state = buildTaskState({
          syncStatus: isLatestRunForNovel ? novel.syncStatus : run.status === "failed" ? "error" : "ready",
          triggerType: run.triggerType || null,
          lastRunStatus: run.status || null,
          hasRunningJobs: isLatestRunForNovel ? Boolean(queue?.totalJobs) : false,
          failedChapters: isLatestRunForNovel ? stats.failed : 0,
          remainingChapters: isLatestRunForNovel ? remainingChapters : 0
        });
        const lastFailedChapter = stats.lastFailedChapter;
        const lastError = isLatestRunForNovel
          ? lastFailedChapter?.lastError || novel.lastError || run.errorMessage || null
          : run.errorMessage || null;
        const lastErrorSource = isLatestRunForNovel && lastFailedChapter
          ? lastFailedChapter.status === "build_failed"
            ? "chapter_build"
            : "chapter_fetch"
          : isLatestRunForNovel && novel.lastError
            ? "novel"
            : run.errorMessage
              ? "sync_run"
              : null;
        const lastActivityAt =
          (isLatestRunForNovel ? queue?.latestCreatedAt : null) ||
          run.endedAt?.toISOString() ||
          run.startedAt?.toISOString() ||
          run.createdAt.toISOString();
        const rebuildTargetChapters =
          run.triggerType === "rebuild" ? Math.max(0, run.totalFound ?? 0) : 0;
        const rebuildRemainingChapters =
          run.triggerType === "rebuild"
            ? isLatestRunForNovel && run.status === "running"
              ? Math.min(rebuildTargetChapters, stats.queuedBuild + stats.building + stats.buildFailed)
              : Math.max(0, rebuildTargetChapters - Math.max(0, run.newChapters ?? 0))
            : 0;
        const rebuildCompletedChapters =
          run.triggerType === "rebuild"
            ? Math.max(0, rebuildTargetChapters - rebuildRemainingChapters)
            : 0;
        const exportTargetChapters =
          run.triggerType === "export" ? Math.max(0, run.totalFound ?? 0) : 0;
        const exportCompletedChapters =
          run.triggerType === "export" ? Math.max(0, run.newChapters ?? 0) : 0;
        const exportRemainingChapters =
          run.triggerType === "export"
            ? Math.max(0, exportTargetChapters - exportCompletedChapters)
            : 0;

        return {
          id: run.id,
          novelId: novel.id,
          title: novel.title,
          sourceId: novel.sourceId,
          sourceName: novel.sourceName,
          syncStatus: novel.syncStatus,
          state,
          totalChapters: novel.totalChapters,
          downloadedChapters: novel.downloadedChapters,
          remainingChapters: isLatestRunForNovel ? remainingChapters : 0,
          failedChapters: isLatestRunForNovel ? stats.failed : 0,
          queueDepth: isLatestRunForNovel ? queue?.totalJobs ?? 0 : 0,
          activeJobs: isLatestRunForNovel ? queue?.activeJobs ?? 0 : 0,
          waitingJobs: isLatestRunForNovel ? queue?.waitingJobs ?? 0 : 0,
          activeQueues: isLatestRunForNovel && queue ? Array.from(queue.queues) : [],
          rebuildTargetChapters,
          rebuildCompletedChapters,
          rebuildRemainingChapters,
          exportTargetChapters,
          exportCompletedChapters,
          exportRemainingChapters,
          retryable: isLatestRunForNovel && state === "stopped",
          lastError,
          lastErrorSource,
          lastErrorAt:
            (isLatestRunForNovel ? lastFailedChapter?.updatedAt.toISOString() : null) ||
            run.endedAt?.toISOString() ||
            (isLatestRunForNovel ? novel.lastSyncEndedAt?.toISOString() : null) ||
            null,
          lastErrorChapter: isLatestRunForNovel && lastFailedChapter
            ? {
                chapterIndex: lastFailedChapter.chapterIndex,
                title: lastFailedChapter.title,
                status: lastFailedChapter.status,
                retryCount: lastFailedChapter.retryCount,
                updatedAt: lastFailedChapter.updatedAt.toISOString()
              }
            : null,
          triggerType: run.triggerType || null,
          lastRunStatus: run.status || null,
          lastRunFound: run.totalFound ?? null,
          lastRunNewChapters: run.newChapters ?? null,
          createdAt: run.createdAt.toISOString(),
          startedAt: run.startedAt?.toISOString() || null,
          finishedAt: run.endedAt?.toISOString() || null,
          lastActivityAt
        };
      })
      .sort((left, right) => {
        return (right.createdAt ?? "").localeCompare(left.createdAt ?? "");
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
