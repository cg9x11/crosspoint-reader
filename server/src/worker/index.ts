import { Worker } from "bullmq";
import cron from "node-cron";

import { loadConfig } from "../config/env.js";
import { createPrismaClient } from "../lib/db.js";
import { createQueues } from "../queues/index.js";
import { createRedisConnection } from "../queues/redis.js";
import { QUEUE_NAMES } from "../queues/names.js";
import { createStorageLayout, ensureStorageLayout } from "../storage/paths.js";
import {
  processChapterBuildJob,
  processChapterFetchJob,
  processNovelSyncJob,
  runScheduledSyncScan
} from "./handlers.js";

async function main() {
  const config = loadConfig();
  const storagePaths = createStorageLayout(config.STORAGE_PATH);
  await ensureStorageLayout(storagePaths);

  const prisma = createPrismaClient();
  const connection = createRedisConnection(config.REDIS_URL);
  const queues = createQueues(config, connection);
  const logPrefix = `[worker:${process.pid}]`;
  const context = {
    config,
    prisma,
    queues,
    storagePaths
  };

  const workers = [
    new Worker(
      QUEUE_NAMES.novelSync,
      async (job) => processNovelSyncJob(context, job),
      { connection, concurrency: config.QUEUE_CONCURRENCY_NOVEL_SYNC }
    ),
    new Worker(
      QUEUE_NAMES.chapterFetch,
      async (job) => processChapterFetchJob(context, job),
      { connection, concurrency: config.QUEUE_CONCURRENCY_CHAPTER_FETCH }
    ),
    new Worker(
      QUEUE_NAMES.chapterBuild,
      async (job) => processChapterBuildJob(context, job),
      { connection, concurrency: config.QUEUE_CONCURRENCY_CHAPTER_BUILD }
    ),
    new Worker(
      QUEUE_NAMES.maintenance,
      async (job) => {
        console.log(`${logPrefix} maintenance job ${job.name} (${job.id}) received`);
        return { ok: true, queue: QUEUE_NAMES.maintenance, name: job.name };
      },
      { connection, concurrency: config.QUEUE_CONCURRENCY_MAINTENANCE }
    )
  ];
  const scheduledTask = cron.schedule(config.SYNC_CRON, async () => {
    try {
      const result = await runScheduledSyncScan(context);
      console.log(`${logPrefix} scheduled sync scan enqueued=${result.enqueued}`);
    } catch (error) {
      console.error(`${logPrefix} scheduled sync scan failed`, error);
    }
  });

  const shutdown = async () => {
    scheduledTask.stop();
    await Promise.all(workers.map(async (worker) => worker.close()));
    await Promise.all(Object.values(queues).map(async (queue) => queue.close()));
    await prisma.$disconnect();
    connection.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

void main();
