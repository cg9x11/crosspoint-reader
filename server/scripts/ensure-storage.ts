import { loadConfig } from "../src/config/env.js";
import { createStorageLayout, ensureStorageLayout } from "../src/storage/paths.js";

async function main() {
  const config = loadConfig();
  const layout = createStorageLayout(config.STORAGE_PATH);
  await ensureStorageLayout(layout);
  console.log(`Storage prepared at ${layout.root}`);
}

void main();
