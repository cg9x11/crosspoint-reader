import { Redis } from "ioredis";

export function createRedisConnection(redisUrl: string) {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false
  });
}
