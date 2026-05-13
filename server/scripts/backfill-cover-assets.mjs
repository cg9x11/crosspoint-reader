import { PrismaClient } from "../src/generated/prisma/index.js";

import { syncNovelCoverAssets } from "../dist/src/library/cover-assets.js";
import { createStorageLayout } from "../dist/src/storage/paths.js";

const prisma = new PrismaClient();
const storagePaths = createStorageLayout(process.env.STORAGE_PATH || "/data");

try {
  const novels = await prisma.novel.findMany({
    where: {
      coverUrl: {
        not: null
      }
    },
    select: {
      id: true,
      coverUrl: true
    }
  });

  let processed = 0;
  for (const novel of novels) {
    if (!novel.coverUrl) {
      continue;
    }

    try {
      await syncNovelCoverAssets(prisma, storagePaths, {
        id: novel.id,
        coverUrl: novel.coverUrl
      });
      processed += 1;
    } catch (error) {
      console.warn("Failed to backfill cover asset", {
        novelId: novel.id,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log(JSON.stringify({ ok: true, processed }));
} finally {
  await prisma.$disconnect();
}

