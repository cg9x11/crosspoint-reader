import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/index.js";

const AUTH_SETTING_KEYS = [
  "auth.admin.username",
  "auth.admin.password_hash",
  "auth.admin.must_change_password"
];

const prisma = new PrismaClient();

try {
  const result = await prisma.appSetting.deleteMany({
    where: {
      key: {
        in: AUTH_SETTING_KEYS
      }
    }
  });

  console.log(JSON.stringify({
    ok: true,
    deleted: result.count,
    bootstrapMode: true
  }));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    message: error instanceof Error ? error.message : String(error)
  }));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

