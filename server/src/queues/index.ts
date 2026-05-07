import { Queue } from "bullmq";
import type { Redis } from "ioredis";

import type { AppConfig } from "../config/env.js";
import { QUEUE_NAMES } from "./names.js";

export function createQueues(config: AppConfig, connection: Redis) {
  return {
    novelSync: new Queue(QUEUE_NAMES.novelSync, { connection }),
    chapterFetch: new Queue(QUEUE_NAMES.chapterFetch, { connection }),
    chapterBuild: new Queue(QUEUE_NAMES.chapterBuild, { connection }),
    maintenance: new Queue(QUEUE_NAMES.maintenance, { connection })
  };
}

export type AppQueues = ReturnType<typeof createQueues>;
