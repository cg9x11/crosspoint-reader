import type { FastifyInstance } from "fastify";

import { z } from "zod";

import {
  addRegistry,
  disableExtension,
  enableExtension,
  installExtension,
  listCatalog,
  listInstalledExtensions,
  listRegistries,
  removeExtension,
  refreshAllRegistries,
  refreshRegistry,
  removeRegistry
} from "../../plugins/service.js";

const addRegistrySchema = z.object({
  name: z.string().trim().min(1).optional(),
  url: z.string().url(),
  trustType: z.enum(["community", "custom"]).optional()
});

export async function registerExtensionsApiRoutes(app: FastifyInstance) {
  app.get("/api/extensions", async () => {
    const [installed, catalog] = await Promise.all([
      listInstalledExtensions(app.storagePaths, app.prisma),
      listCatalog(app.storagePaths)
    ]);

    return {
      installed,
      catalog
    };
  });

  app.get("/api/extensions/registries", async () => {
    return {
      items: await listRegistries(app.storagePaths)
    };
  });

  app.post("/api/extensions/registries", async (request) => {
    const body = addRegistrySchema.parse(request.body);
    const registry = await addRegistry(app.storagePaths, body);
    return {
      ok: true,
      item: registry
    };
  });

  app.post("/api/extensions/registries/refresh", async () => {
    const results = await refreshAllRegistries(app.storagePaths);
    return {
      ok: true,
      count: results.length,
      items: results.map((entry) => entry.registry)
    };
  });

  app.post("/api/extensions/registries/:registryId/refresh", async (request) => {
    const params = z.object({ registryId: z.string().min(1) }).parse(request.params);
    const result = await refreshRegistry(app.storagePaths, params.registryId);
    return {
      ok: true,
      registry: result.registry,
      count: result.entries.length
    };
  });

  app.delete("/api/extensions/registries/:registryId", async (request) => {
    const params = z.object({ registryId: z.string().min(1) }).parse(request.params);
    await removeRegistry(app.storagePaths, params.registryId);
    return { ok: true };
  });

  app.post("/api/extensions/:extensionId/install", async (request) => {
    const params = z.object({ extensionId: z.string().min(1) }).parse(request.params);
    const item = await installExtension(app.storagePaths, app.prisma, params.extensionId);
    return {
      ok: true,
      item
    };
  });

  app.post("/api/extensions/:extensionId/enable", async (request) => {
    const params = z.object({ extensionId: z.string().min(1) }).parse(request.params);
    const item = await enableExtension(app.storagePaths, app.prisma, params.extensionId);
    return {
      ok: true,
      item
    };
  });

  app.post("/api/extensions/:extensionId/disable", async (request) => {
    const params = z.object({ extensionId: z.string().min(1) }).parse(request.params);
    const item = await disableExtension(app.storagePaths, app.prisma, params.extensionId);
    return {
      ok: true,
      item
    };
  });

  app.delete("/api/extensions/:extensionId", async (request) => {
    const params = z.object({ extensionId: z.string().min(1) }).parse(request.params);
    const item = await removeExtension(app.storagePaths, app.prisma, params.extensionId);
    return {
      ok: true,
      item
    };
  });
}
