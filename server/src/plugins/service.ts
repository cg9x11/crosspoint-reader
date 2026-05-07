import fs from "node:fs/promises";
import path from "node:path";

import type { PrismaClient } from "@prisma/client";

import type { StorageLayout } from "../storage/paths.js";
import { coreDemoRuntime, coreDemoSource } from "./core/demoCatalog.js";
import {
  fileExists,
  readJsonFile,
  sanitizeFileSegment,
  stableId,
  writeJsonFileAtomic
} from "../lib/filesystem.js";
import { fetchBuffer, fetchJson } from "../lib/http.js";
import {
  buildVbookStateDir,
  createVbookSourceRuntime,
  hydrateVbookPackage,
  inspectVbookPackage,
  materializeVbookPackage
} from "./vbook/runtime.js";
import type {
  CatalogExtensionRecord,
  ExtensionStateFile,
  InstalledExtensionRecord,
  RegistryRecord,
  RuntimeKind,
  SourceCapabilities,
  SourceDetailPayload,
  SourceHandler,
  SourceHomePayload,
  SourceListItem,
  SourceSearchPayload
} from "./types.js";

const EXTENSION_STATE_VERSION = 1;
const EXTENSION_STATE_FILENAME = "state.json";
let extensionStateMutationQueue: Promise<void> = Promise.resolve();
const SOURCE_CACHE_TTLS_MS = {
  home: 5 * 60 * 1000,
  search: 2 * 60 * 1000,
  detail: 10 * 60 * 1000,
  chapters: 10 * 60 * 1000
} as const;

interface SourcePayloadCacheEntry<T> {
  expiresAt: number;
  pending?: Promise<T>;
  value?: T;
}

const sourcePayloadCache = new Map<string, SourcePayloadCacheEntry<unknown>>();

const EMPTY_CAPABILITIES: SourceCapabilities = {
  supportsHome: false,
  supportsSearch: false,
  supportsGenre: false,
  supportsPagination: false,
  supportsDetailDescription: false,
  supportsBrowserAutomation: false
};

function getStatePath(storagePaths: StorageLayout) {
  return path.join(storagePaths.extensionsDir, EXTENSION_STATE_FILENAME);
}

function getPackageDir(storagePaths: StorageLayout, extensionId: string) {
  return path.join(storagePaths.extensionsDir, "packages", sanitizeFileSegment(extensionId));
}

function parseEnvList(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getEnabledSourceAllowlist() {
  const items = parseEnvList(process.env.SOURCE_ENABLED_ALLOWLIST);
  return items.length > 0 ? new Set(items) : null;
}

function getSourcePriorityOrder() {
  return parseEnvList(process.env.SOURCE_PRIORITY_IDS);
}

function applySourceVisibilityPolicy<T extends { id: string }>(items: T[]) {
  const allowlist = getEnabledSourceAllowlist();
  const visibleItems = allowlist ? items.filter((item) => allowlist.has(item.id)) : items;
  const priority = getSourcePriorityOrder();

  if (priority.length === 0) {
    return visibleItems;
  }

  const priorityIndex = new Map(priority.map((id, index) => [id, index]));
  return [...visibleItems].sort((left, right) => {
    const leftPriority = priorityIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = priorityIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.id.localeCompare(right.id);
  });
}

function defaultRegistries(): RegistryRecord[] {
  return [
    {
      id: "ext-vbook",
      name: "ext-vbook",
      url: "https://raw.githubusercontent.com/dat-bi/ext-vbook/main/plugin.json",
      trustType: "community",
      status: "offline",
      lastSyncedAt: null,
      lastError: null,
      extensionCount: 0
    },
    {
      id: "vbook-extensions",
      name: "vbook-extensions",
      url: "https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/master/repository.json",
      trustType: "community",
      status: "offline",
      lastSyncedAt: null,
      lastError: null,
      extensionCount: 0
    }
  ];
}

function createDefaultState(): ExtensionStateFile {
  return {
    version: EXTENSION_STATE_VERSION,
    registries: defaultRegistries(),
    catalog: [],
    installed: []
  };
}

function deriveManifestUrl(installUrl?: string) {
  if (!installUrl) {
    return undefined;
  }

  if (installUrl.endsWith("/plugin.zip")) {
    return installUrl.slice(0, -"/plugin.zip".length) + "/plugin.json";
  }

  if (installUrl.endsWith(".zip")) {
    return installUrl.replace(/\.zip$/i, ".json");
  }

  if (installUrl.endsWith(".json")) {
    return installUrl;
  }

  return undefined;
}

function parseCapabilitiesFromScriptMap(scriptMap?: Record<string, unknown>): SourceCapabilities {
  const keys = new Set(Object.keys(scriptMap ?? {}));

  return {
    supportsHome: keys.has("home") || keys.has("gen"),
    supportsSearch: keys.has("search"),
    supportsGenre: keys.has("genre"),
    supportsPagination: keys.has("page"),
    supportsDetailDescription: keys.has("detail"),
    supportsBrowserAutomation: keys.has("config") || keys.has("crypto")
  };
}

function normalizeCollectionEntry(
  registry: RegistryRecord,
  rawItem: Record<string, unknown>
): CatalogExtensionRecord {
  const installUrl = typeof rawItem.path === "string" ? rawItem.path : undefined;
  const manifestUrl = deriveManifestUrl(installUrl);
  const sourceName = typeof rawItem.name === "string" ? rawItem.name : "unknown";
  const sourceUrl = typeof rawItem.source === "string" ? rawItem.source : undefined;

  return {
    id: stableId("ext", `${registry.id}:${sourceName}:${sourceUrl ?? installUrl ?? ""}`),
    name: sourceName,
    author: typeof rawItem.author === "string" ? rawItem.author : undefined,
    version: String(rawItem.version ?? "0"),
    sourceUrl,
    iconUrl: typeof rawItem.icon === "string" ? rawItem.icon : undefined,
    description: typeof rawItem.description === "string" ? rawItem.description : undefined,
    type: typeof rawItem.type === "string" ? rawItem.type : undefined,
    locale: typeof rawItem.locale === "string" ? rawItem.locale : undefined,
    trustType: registry.trustType,
    registryId: registry.id,
    registryName: registry.name,
    installUrl,
    manifestUrl,
    runtimeKind: "vbook-js",
    runtimeSupported: false,
    capabilities: EMPTY_CAPABILITIES
  };
}

function normalizeManifestEntry(
  registry: RegistryRecord,
  manifestUrl: string,
  payload: Record<string, unknown>
): CatalogExtensionRecord {
  const metadata = (payload.metadata as Record<string, unknown> | undefined) ?? {};
  const script = (payload.script as Record<string, unknown> | undefined) ?? {};
  const sourceName = typeof metadata.name === "string" ? metadata.name : "unknown";
  const sourceUrl = typeof metadata.source === "string" ? metadata.source : undefined;
  const installUrl = manifestUrl.endsWith("/plugin.json")
    ? manifestUrl.slice(0, -"/plugin.json".length) + "/plugin.zip"
    : manifestUrl;

  return {
    id: stableId("ext", `${registry.id}:${sourceName}:${sourceUrl ?? manifestUrl}`),
    name: sourceName,
    author: typeof metadata.author === "string" ? metadata.author : undefined,
    version: String(metadata.version ?? "0"),
    sourceUrl,
    iconUrl: undefined,
    description: typeof metadata.description === "string" ? metadata.description : undefined,
    type: typeof metadata.type === "string" ? metadata.type : undefined,
    locale:
      typeof metadata.locale === "string"
        ? metadata.locale
        : typeof metadata.local === "string"
          ? metadata.local
          : undefined,
    trustType: registry.trustType,
    registryId: registry.id,
    registryName: registry.name,
    installUrl,
    manifestUrl,
    runtimeKind: "vbook-js",
    runtimeSupported: false,
    capabilities: parseCapabilitiesFromScriptMap(script)
  };
}

async function loadState(storagePaths: StorageLayout) {
  const statePath = getStatePath(storagePaths);
  const state = await readJsonFile<ExtensionStateFile>(statePath, createDefaultState());

  const mergedRegistries = [...defaultRegistries()];
  for (const registry of state.registries) {
    const index = mergedRegistries.findIndex((candidate) => candidate.id === registry.id);
    if (index >= 0) {
      mergedRegistries[index] = registry;
    } else {
      mergedRegistries.push(registry);
    }
  }

  const normalized: ExtensionStateFile = {
    version: EXTENSION_STATE_VERSION,
    registries: mergedRegistries,
    catalog: state.catalog ?? [],
    installed: state.installed ?? []
  };

  if (!(await fileExists(statePath))) {
    await saveState(storagePaths, normalized);
  }

  return normalized;
}

async function saveState(storagePaths: StorageLayout, state: ExtensionStateFile) {
  await writeJsonFileAtomic(getStatePath(storagePaths), state);
}

function queueExtensionStateMutation<T>(operation: () => Promise<T>) {
  const next = extensionStateMutationQueue.then(operation, operation);
  extensionStateMutationQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function buildSourcePayloadCacheKey(scope: string, parts: Array<string | undefined>) {
  return [scope, ...parts.map((value) => value ?? "")].join("::");
}

function clearSourcePayloadCache(prefix?: string) {
  if (!prefix) {
    sourcePayloadCache.clear();
    return;
  }

  for (const key of sourcePayloadCache.keys()) {
    if (key.startsWith(prefix)) {
      sourcePayloadCache.delete(key);
    }
  }
}

async function withSourcePayloadCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = sourcePayloadCache.get(key) as SourcePayloadCacheEntry<T> | undefined;

  if (existing?.value !== undefined && existing.expiresAt > now) {
    return existing.value;
  }

  if (existing?.pending) {
    return existing.pending;
  }

  const pending = loader();
  sourcePayloadCache.set(key, {
    expiresAt: now + ttlMs,
    pending
  });

  try {
    const value = await pending;
    sourcePayloadCache.set(key, {
      expiresAt: Date.now() + ttlMs,
      value
    });
    return value;
  } catch (error) {
    sourcePayloadCache.delete(key);
    throw error;
  }
}

function bundledExtensionRecord(): InstalledExtensionRecord {
  return {
    id: coreDemoSource.id,
    name: coreDemoSource.name,
    author: coreDemoSource.author,
    version: coreDemoSource.version,
    sourceUrl: coreDemoSource.sourceUrl,
    iconUrl: coreDemoSource.iconUrl,
    description: coreDemoSource.description,
    type: coreDemoSource.type,
    locale: coreDemoSource.locale,
    trustType: "core",
    registryId: "bundled",
    registryName: "Bundled",
    installUrl: undefined,
    manifestUrl: undefined,
    runtimeKind: "builtin",
    runtimeSupported: true,
    capabilities: {
      supportsHome: coreDemoSource.supportsHome,
      supportsSearch: coreDemoSource.supportsSearch,
      supportsGenre: coreDemoSource.supportsGenre,
      supportsPagination: coreDemoSource.supportsPagination,
      supportsDetailDescription: coreDemoSource.supportsDetailDescription,
      supportsBrowserAutomation: coreDemoSource.supportsBrowserAutomation
    },
    enabled: true,
    installedAt: "bundled",
    updatedAt: "bundled",
    bundled: true,
    lastError: null
  };
}

function toSourceListItem(extension: InstalledExtensionRecord): SourceListItem {
  return {
    id: extension.id,
    name: extension.name,
    trustType: extension.trustType,
    version: extension.version,
    enabled: extension.enabled,
    runtimeKind: extension.runtimeKind,
    runtimeSupported: extension.runtimeSupported,
    description: extension.description,
    sourceUrl: extension.sourceUrl,
    iconUrl: extension.iconUrl,
    author: extension.author,
    locale: extension.locale,
    type: extension.type,
    installedAt: extension.installedAt,
    updatedAt: extension.updatedAt,
    lastError: extension.lastError,
    registryId: extension.registryId,
    registryName: extension.registryName,
    ...extension.capabilities
  };
}

async function syncPluginSources(prisma: PrismaClient, installed: InstalledExtensionRecord[]) {
  await Promise.all(
    installed.map(async (extension) =>
      prisma.pluginSource.upsert({
        where: { id: extension.id },
        create: {
          id: extension.id,
          name: extension.name,
          enabled: extension.enabled,
          version: extension.version,
          trustType: extension.trustType,
          supportsHome: extension.capabilities.supportsHome,
          supportsSearch: extension.capabilities.supportsSearch,
          supportsGenre: extension.capabilities.supportsGenre,
          supportsPagination: extension.capabilities.supportsPagination,
          supportsDetailDescription: extension.capabilities.supportsDetailDescription,
          supportsBrowserAutomation: extension.capabilities.supportsBrowserAutomation,
          lastCheckedAt: new Date(),
          lastError: extension.lastError
        },
        update: {
          name: extension.name,
          enabled: extension.enabled,
          version: extension.version,
          trustType: extension.trustType,
          supportsHome: extension.capabilities.supportsHome,
          supportsSearch: extension.capabilities.supportsSearch,
          supportsGenre: extension.capabilities.supportsGenre,
          supportsPagination: extension.capabilities.supportsPagination,
          supportsDetailDescription: extension.capabilities.supportsDetailDescription,
          supportsBrowserAutomation: extension.capabilities.supportsBrowserAutomation,
          lastCheckedAt: new Date(),
          lastError: extension.lastError
        }
      })
    )
  );
}

async function refreshInstalledExtensionRuntime(
  storagePaths: StorageLayout,
  extension: InstalledExtensionRecord
): Promise<InstalledExtensionRecord> {
  if (extension.runtimeKind !== "vbook-js") {
    return extension;
  }

  try {
    const packageDir = getPackageDir(storagePaths, extension.id);
    const manifest = await hydrateVbookPackage(packageDir, extension.manifestUrl);
    const inspection = await inspectVbookPackage(packageDir);
    const nextCapabilities =
      manifest && manifest.script && typeof manifest.script === "object"
        ? parseCapabilitiesFromScriptMap(manifest.script as Record<string, unknown>)
        : inspection.capabilities;
    const nextLastError = inspection.runtimeSupported
      ? null
      : inspection.issues.join("; ") || "Runtime package is not executable";

    return {
      ...extension,
      runtimeSupported: inspection.runtimeSupported,
      capabilities: nextCapabilities,
      lastError: nextLastError
    };
  } catch (error) {
    return {
      ...extension,
      runtimeSupported: false,
      lastError: error instanceof Error ? error.message : "Runtime package is not executable"
    };
  }
}

async function refreshInstalledExtensionState(storagePaths: StorageLayout, state: ExtensionStateFile) {
  let changed = false;
  const installed = await Promise.all(
    state.installed.map(async (extension) => {
      const refreshed = await refreshInstalledExtensionRuntime(storagePaths, extension);
      if (
        refreshed.runtimeSupported !== extension.runtimeSupported ||
        refreshed.lastError !== extension.lastError ||
        JSON.stringify(refreshed.capabilities) !== JSON.stringify(extension.capabilities)
      ) {
        changed = true;
      }
      return refreshed;
    })
  );

  if (changed) {
    state.installed = installed;
  }

  return installed;
}

async function findInstalledExtension(storagePaths: StorageLayout, sourceId: string) {
  if (sourceId === coreDemoSource.id) {
    return bundledExtensionRecord();
  }

  const state = await loadState(storagePaths);
  const extension = state.installed.find((item) => item.id === sourceId);
  if (!extension) {
    return null;
  }

  const refreshed = await refreshInstalledExtensionRuntime(storagePaths, extension);
  return refreshed;
}

export async function listRegistries(storagePaths: StorageLayout) {
  const state = await loadState(storagePaths);
  return state.registries;
}

export async function listCatalog(storagePaths: StorageLayout) {
  const state = await loadState(storagePaths);
  return state.catalog;
}

export async function listInstalledExtensions(storagePaths: StorageLayout, prisma: PrismaClient) {
  const state = await loadState(storagePaths);
  const installed = [bundledExtensionRecord(), ...(await refreshInstalledExtensionState(storagePaths, state))];
  await syncPluginSources(prisma, installed);
  return installed;
}

export async function listSources(storagePaths: StorageLayout, prisma: PrismaClient) {
  const installed = await listInstalledExtensions(storagePaths, prisma);
  return applySourceVisibilityPolicy(installed.filter((item) => item.enabled).map(toSourceListItem));
}

export async function addRegistry(storagePaths: StorageLayout, input: { name?: string; url: string; trustType?: "community" | "custom" }) {
  return queueExtensionStateMutation(async () => {
    const state = await loadState(storagePaths);
    const id = stableId("registry", input.url);
    const record: RegistryRecord = {
      id,
      name: input.name?.trim() || input.url,
      url: input.url,
      trustType: input.trustType ?? "custom",
      status: "offline",
      lastSyncedAt: null,
      lastError: null,
      extensionCount: 0
    };

    const existingIndex = state.registries.findIndex((entry) => entry.id === id);
    if (existingIndex >= 0) {
      state.registries[existingIndex] = record;
    } else {
      state.registries.push(record);
    }

    await saveState(storagePaths, state);
    clearSourcePayloadCache();
    return record;
  });
}

export async function removeRegistry(storagePaths: StorageLayout, registryId: string) {
  await queueExtensionStateMutation(async () => {
    const state = await loadState(storagePaths);
    state.registries = state.registries.filter((entry) => entry.id !== registryId);
    state.catalog = state.catalog.filter((entry) => entry.registryId !== registryId);
    await saveState(storagePaths, state);
    clearSourcePayloadCache();
  });
}

async function fetchRegistryEntries(registry: RegistryRecord): Promise<CatalogExtensionRecord[]> {
  const payload = await fetchJson<unknown>(registry.url);

  if (Array.isArray(payload)) {
    const entries: CatalogExtensionRecord[] = [];
    for (const item of payload) {
      if (!item || typeof item !== "object" || typeof (item as Record<string, unknown>).link !== "string") {
        continue;
      }

      const childUrl = (item as Record<string, unknown>).link as string;
      try {
        const childPayload = await fetchJson<Record<string, unknown>>(childUrl);
        if (Array.isArray(childPayload.data)) {
          for (const rawEntry of childPayload.data) {
            if (rawEntry && typeof rawEntry === "object") {
              entries.push(normalizeCollectionEntry(registry, rawEntry as Record<string, unknown>));
            }
          }
        } else {
          entries.push(normalizeManifestEntry(registry, childUrl, childPayload));
        }
      } catch {
        continue;
      }
    }
    return entries;
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;

    if (Array.isArray(objectPayload.data)) {
      return objectPayload.data
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map((entry) => normalizeCollectionEntry(registry, entry));
    }

    return [normalizeManifestEntry(registry, registry.url, objectPayload)];
  }

  throw new Error("Unsupported registry payload");
}

export async function refreshRegistry(storagePaths: StorageLayout, registryId: string) {
  return queueExtensionStateMutation(async () => {
    const state = await loadState(storagePaths);
    const registry = state.registries.find((entry) => entry.id === registryId);

    if (!registry) {
      throw new Error("Registry not found");
    }

    try {
      const entries = await fetchRegistryEntries(registry);
      registry.status = "online";
      registry.lastSyncedAt = new Date().toISOString();
      registry.lastError = null;
      registry.extensionCount = entries.length;

      state.catalog = state.catalog.filter((entry) => entry.registryId !== registryId).concat(entries);
      await saveState(storagePaths, state);
      clearSourcePayloadCache();
      return { registry, entries };
    } catch (error) {
      registry.status = "offline";
      registry.lastError = error instanceof Error ? error.message : "Unknown registry error";
      await saveState(storagePaths, state);
      clearSourcePayloadCache();
      throw error;
    }
  });
}

export async function refreshAllRegistries(storagePaths: StorageLayout) {
  const state = await loadState(storagePaths);
  const results = [];

  for (const registry of state.registries) {
    try {
      results.push(await refreshRegistry(storagePaths, registry.id));
    } catch {
      results.push({ registry, entries: [] });
    }
  }

  return results;
}

async function fetchInstalledManifest(entry: CatalogExtensionRecord) {
  if (!entry.manifestUrl) {
    return null;
  }
  try {
    return await fetchJson<Record<string, unknown>>(entry.manifestUrl);
  } catch {
    return null;
  }
}

export async function installExtension(storagePaths: StorageLayout, prisma: PrismaClient, extensionId: string) {
  return queueExtensionStateMutation(async () => {
    const state = await loadState(storagePaths);
    const entry = state.catalog.find((catalogEntry) => catalogEntry.id === extensionId);

    if (!entry) {
      throw new Error("Extension not found in catalog");
    }

    const manifest = await fetchInstalledManifest(entry);
    const capabilities =
      manifest && manifest.script && typeof manifest.script === "object"
        ? parseCapabilitiesFromScriptMap(manifest.script as Record<string, unknown>)
        : entry.capabilities;

    const installed: InstalledExtensionRecord = {
      ...entry,
      enabled: false,
      bundled: false,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastError: null,
      capabilities
    };

    const packageDir = getPackageDir(storagePaths, extensionId);
    let archive: Buffer | null = null;
    if (entry.installUrl) {
      try {
        archive = await fetchBuffer(entry.installUrl);
      } catch {
        archive = null;
      }
    }

    const inspection = await materializeVbookPackage({
      packageDir,
      manifest,
      archive,
      manifestUrl: entry.manifestUrl
    });

    installed.runtimeSupported = inspection.runtimeSupported;
    installed.capabilities = inspection.capabilities;
    installed.lastError = inspection.runtimeSupported
      ? null
      : inspection.issues.join("; ") || "Runtime package is not executable";

    const existingIndex = state.installed.findIndex((item) => item.id === extensionId);
    if (existingIndex >= 0) {
      state.installed[existingIndex] = installed;
    } else {
      state.installed.push(installed);
    }

    await saveState(storagePaths, state);
    await syncPluginSources(prisma, [bundledExtensionRecord(), ...state.installed]);
    clearSourcePayloadCache();
    return installed;
  });
}

async function toggleExtension(
  storagePaths: StorageLayout,
  prisma: PrismaClient,
  extensionId: string,
  enabled: boolean
) {
  if (extensionId === coreDemoSource.id) {
    return bundledExtensionRecord();
  }

  return queueExtensionStateMutation(async () => {
    const state = await loadState(storagePaths);
    const extension = state.installed.find((item) => item.id === extensionId);

    if (!extension) {
      throw new Error("Installed extension not found");
    }

    extension.enabled = enabled;
    extension.updatedAt = new Date().toISOString();

    await saveState(storagePaths, state);
    await syncPluginSources(prisma, [bundledExtensionRecord(), ...state.installed]);
    clearSourcePayloadCache();
    return extension;
  });
}

export async function enableExtension(storagePaths: StorageLayout, prisma: PrismaClient, extensionId: string) {
  return toggleExtension(storagePaths, prisma, extensionId, true);
}

export async function disableExtension(storagePaths: StorageLayout, prisma: PrismaClient, extensionId: string) {
  return toggleExtension(storagePaths, prisma, extensionId, false);
}

export async function removeExtension(storagePaths: StorageLayout, prisma: PrismaClient, extensionId: string) {
  if (extensionId === coreDemoSource.id) {
    throw new Error("Bundled extension cannot be removed");
  }

  return queueExtensionStateMutation(async () => {
    const state = await loadState(storagePaths);
    const index = state.installed.findIndex((item) => item.id === extensionId);

    if (index < 0) {
      throw new Error("Installed extension not found");
    }

    const [removed] = state.installed.splice(index, 1);
    await saveState(storagePaths, state);
    await fs.rm(getPackageDir(storagePaths, extensionId), {
      recursive: true,
      force: true
    });
    await prisma.pluginSource.deleteMany({
      where: { id: extensionId }
    });
    clearSourcePayloadCache();

    return removed;
  });
}

async function findSourceRecord(storagePaths: StorageLayout, prisma: PrismaClient, sourceId: string) {
  const sources = await listSources(storagePaths, prisma);
  return sources.find((item) => item.id === sourceId) ?? null;
}

function resolveBuiltinRuntime(sourceId: string): SourceHandler | null {
  if (sourceId === coreDemoSource.id) {
    return coreDemoRuntime;
  }
  return null;
}

async function resolveRuntime(storagePaths: StorageLayout, prisma: PrismaClient, sourceId: string) {
  const source = await findSourceRecord(storagePaths, prisma, sourceId);

  if (!source) {
    throw new Error("Source not found");
  }

  const runtime = resolveBuiltinRuntime(sourceId);
  if (runtime) {
    return { source, runtime };
  }

  const extension = await findInstalledExtension(storagePaths, sourceId);
  if (!extension || !extension.enabled) {
    throw new Error("Source not found");
  }

  if (!extension.runtimeSupported) {
    throw new Error(extension.lastError ?? `Source ${sourceId} requires unsupported runtime features`);
  }

  return {
    source: toSourceListItem(extension),
    runtime: await createVbookSourceRuntime({
      packageDir: getPackageDir(storagePaths, sourceId),
      stateDir: buildVbookStateDir(storagePaths.runtimeDir, sourceId),
      source: toSourceListItem(extension)
    })
  };
}

export async function getSourceHome(
  storagePaths: StorageLayout,
  prisma: PrismaClient,
  sourceId: string
): Promise<SourceHomePayload> {
  return withSourcePayloadCache(
    buildSourcePayloadCacheKey("home", [sourceId]),
    SOURCE_CACHE_TTLS_MS.home,
    async () => {
      const { runtime } = await resolveRuntime(storagePaths, prisma, sourceId);
      return runtime.home();
    }
  );
}

export async function getSourceSearch(
  storagePaths: StorageLayout,
  prisma: PrismaClient,
  sourceId: string,
  query: string,
  page?: string
): Promise<SourceSearchPayload> {
  return withSourcePayloadCache(
    buildSourcePayloadCacheKey("search", [sourceId, query, page]),
    SOURCE_CACHE_TTLS_MS.search,
    async () => {
      const { runtime } = await resolveRuntime(storagePaths, prisma, sourceId);
      return runtime.search(query, page);
    }
  );
}

export async function getSourceDetail(
  storagePaths: StorageLayout,
  prisma: PrismaClient,
  sourceId: string,
  detailUrl: string
): Promise<SourceDetailPayload> {
  return withSourcePayloadCache(
    buildSourcePayloadCacheKey("detail", [sourceId, detailUrl]),
    SOURCE_CACHE_TTLS_MS.detail,
    async () => {
      const { runtime } = await resolveRuntime(storagePaths, prisma, sourceId);
      return runtime.detail(detailUrl);
    }
  );
}

export async function getSourceChapters(
  storagePaths: StorageLayout,
  prisma: PrismaClient,
  sourceId: string,
  detailUrl: string
) {
  return withSourcePayloadCache(
    buildSourcePayloadCacheKey("chapters", [sourceId, detailUrl]),
    SOURCE_CACHE_TTLS_MS.chapters,
    async () => {
      const { runtime } = await resolveRuntime(storagePaths, prisma, sourceId);
      return runtime.chapters(detailUrl);
    }
  );
}

export async function getSourceHandler(
  storagePaths: StorageLayout,
  prisma: PrismaClient,
  sourceId: string
): Promise<SourceHandler> {
  const { runtime } = await resolveRuntime(storagePaths, prisma, sourceId);
  return runtime;
}
