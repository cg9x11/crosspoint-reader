import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "src", "generated");
const targetDir = path.join(rootDir, "dist", "src", "generated");

await fs.mkdir(path.dirname(targetDir), { recursive: true });
await fs.rm(targetDir, { recursive: true, force: true });
await fs.cp(sourceDir, targetDir, { recursive: true });

console.log(`Copied Prisma generated client to ${targetDir}`);
