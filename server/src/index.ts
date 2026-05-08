import { loadConfig } from "./config/env.js";
import { buildApp } from "./app.js";
import { createPrismaClient, initializePrismaClient } from "./lib/db.js";
import { createRedisConnection } from "./queues/redis.js";
import { createStorageLayout, ensureStorageLayout } from "./storage/paths.js";

async function main() {
  const config = loadConfig();
  const storagePaths = createStorageLayout(config.STORAGE_PATH);
  await ensureStorageLayout(storagePaths);

  const prisma = createPrismaClient();
  await initializePrismaClient(prisma);
  const redis = createRedisConnection(config.REDIS_URL);
  const app = await buildApp({ config, prisma, redis, storagePaths });

  try {
    await app.listen({ host: config.HOST, port: config.PORT });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }

  const shutdown = async () => {
    try {
      await app.close();
      process.exit(0);
    } catch (error) {
      app.log.error(error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

void main();
