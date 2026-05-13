import { PrismaClient } from "./prisma.js";

export function createPrismaClient() {
  return new PrismaClient();
}

export async function initializePrismaClient(prisma: PrismaClient) {
  await prisma.$connect();

  try {
    await prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL");
  } catch {
    // Ignore pragma failures on non-SQLite drivers or restricted runtimes.
  }

  try {
    await prisma.$executeRawUnsafe("PRAGMA synchronous = NORMAL");
  } catch {
    // Best-effort only.
  }

  try {
    await prisma.$executeRawUnsafe("PRAGMA busy_timeout = 10000");
  } catch {
    // Best-effort only.
  }
}

