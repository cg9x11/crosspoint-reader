import type { FastifyInstance } from "fastify";

import { registerAuthApiRoutes } from "./auth.js";
import { registerExtensionsApiRoutes } from "./extensions.js";
import { registerLibraryApiRoutes } from "./library.js";
import { registerSettingsApiRoutes } from "./settings.js";
import { registerSourcesApiRoutes } from "./sources.js";
import { registerTasksApiRoutes } from "./tasks.js";

export async function registerApiRoutes(app: FastifyInstance) {
  await registerAuthApiRoutes(app);
  await registerExtensionsApiRoutes(app);
  await registerSourcesApiRoutes(app);
  await registerLibraryApiRoutes(app);
  await registerTasksApiRoutes(app);
  await registerSettingsApiRoutes(app);
}
