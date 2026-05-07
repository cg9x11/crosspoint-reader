import type { FastifyInstance } from "fastify";

import { registerApiRoutes } from "./api/index.js";
import { registerHealthRoutes } from "./health.js";
import { registerOpdsRoutes } from "./opds.js";
import { registerRootRoutes } from "./root.js";

export async function registerRoutes(app: FastifyInstance) {
  await registerRootRoutes(app);
  await registerHealthRoutes(app);
  await registerOpdsRoutes(app);
  await registerApiRoutes(app);
}
