import { loadConfig } from "../src/config/env.js";
import { createQueues } from "../src/queues/index.js";
import { createRedisConnection } from "../src/queues/redis.js";

async function main() {
  const config = loadConfig();
  const redis = createRedisConnection(config.REDIS_URL);
  const queues = createQueues(config, redis);

  const job = await queues.maintenance.add(
    "ping",
    { timestamp: new Date().toISOString() },
    { jobId: `maintenance:ping:${Date.now()}` }
  );

  console.log(`Enqueued job ${job.id}`);

  await Promise.all(Object.values(queues).map(async (queue) => queue.close()));
  redis.disconnect();
}

void main();
