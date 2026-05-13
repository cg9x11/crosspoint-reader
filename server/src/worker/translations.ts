import type { Job } from "bullmq";
import type { PrismaClient } from "../lib/prisma.js";

import type { AppConfig } from "../config/env.js";
import type { AppQueues } from "../queues/index.js";
import type { TranslationChapterJobData } from "../queues/jobs.js";
import type { StorageLayout } from "../storage/paths.js";
import { translateProjectChapter } from "../translations/service.js";

interface WorkerContext {
  config: AppConfig;
  prisma: PrismaClient;
  queues: AppQueues;
  storagePaths: StorageLayout;
}

export async function processTranslationChapterJob(
  context: WorkerContext,
  job: Job<TranslationChapterJobData>
) {
  try {
    const version = await translateProjectChapter(context.prisma, context.storagePaths, context.config, {
      projectId: job.data.projectId,
      chapterId: job.data.chapterId,
      triggerType: job.data.triggerType || "queue",
      forcePublish: job.data.forcePublish
    });
    if (job.data.runId) {
      await context.prisma.translationRun.update({
        where: { id: job.data.runId },
        data: {
          status: "running",
          completedCount: { increment: 1 }
        }
      }).catch(() => undefined);
    }
    return { ok: true, versionId: version.id };
  } catch (error) {
    if (job.data.runId) {
      await context.prisma.translationRun.update({
        where: { id: job.data.runId },
        data: {
          status: "running",
          failedCount: { increment: 1 },
          errorMessage: error instanceof Error ? error.message : "Translation failed"
        }
      }).catch(() => undefined);
    }
    throw error;
  }
}

