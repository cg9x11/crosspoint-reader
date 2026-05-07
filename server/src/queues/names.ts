export const QUEUE_NAMES = {
  novelSync: "novel-sync",
  chapterFetch: "chapter-fetch",
  chapterBuild: "chapter-build",
  maintenance: "maintenance"
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
