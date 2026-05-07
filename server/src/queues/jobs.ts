import type { AppQueues } from "./index.js";

export interface NovelSyncJobData {
  novelId: string;
  triggerType: string;
}

export interface ChapterFetchJobData {
  novelId: string;
  chapterId: string;
}

export interface ChapterBuildJobData {
  novelId: string;
  chapterId: string;
}

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5000
  },
  removeOnComplete: 100,
  removeOnFail: 200
};

const ACTIVE_JOB_STATES = new Set([
  "active",
  "waiting",
  "waiting-children",
  "delayed",
  "prioritized"
]);

function buildSafeJobId(prefix: string, value: string) {
  return `${prefix}__${value.replaceAll(":", "_")}`;
}

async function addOrReplaceJob<T>(
  queue: AppQueues[keyof AppQueues],
  name: string,
  data: T,
  jobId: string
) {
  const existingJob = await queue.getJob(jobId);
  if (existingJob) {
    const state = await existingJob.getState();
    if (ACTIVE_JOB_STATES.has(state)) {
      return existingJob;
    }

    await existingJob.remove();
  }

  return queue.add(name, data, {
    ...DEFAULT_JOB_OPTIONS,
    jobId
  });
}

export function getNovelSyncJobId(novelId: string) {
  return buildSafeJobId("novel-sync", novelId);
}

export function getChapterFetchJobId(chapterId: string) {
  return buildSafeJobId("chapter-fetch", chapterId);
}

export function getChapterBuildJobId(chapterId: string) {
  return buildSafeJobId("chapter-build", chapterId);
}

export async function enqueueNovelSync(
  queues: AppQueues,
  data: NovelSyncJobData
) {
  return addOrReplaceJob(queues.novelSync, "sync-novel", data, getNovelSyncJobId(data.novelId));
}

export async function enqueueChapterFetch(
  queues: AppQueues,
  data: ChapterFetchJobData
) {
  return addOrReplaceJob(queues.chapterFetch, "fetch-chapter", data, getChapterFetchJobId(data.chapterId));
}

export async function enqueueChapterBuild(
  queues: AppQueues,
  data: ChapterBuildJobData
) {
  return addOrReplaceJob(queues.chapterBuild, "build-chapter", data, getChapterBuildJobId(data.chapterId));
}
