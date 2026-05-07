export type TrustType = "core" | "community" | "custom";
export type RuntimeKind = "builtin" | "vbook-js";

export interface SourceCapabilities {
  supportsHome: boolean;
  supportsSearch: boolean;
  supportsGenre: boolean;
  supportsPagination: boolean;
  supportsDetailDescription: boolean;
  supportsBrowserAutomation: boolean;
}

export interface SourceListItem extends SourceCapabilities {
  id: string;
  name: string;
  trustType: TrustType;
  version: string;
  systemSource?: boolean;
  enabled: boolean;
  runtimeKind: RuntimeKind;
  runtimeSupported: boolean;
  description?: string;
  sourceUrl?: string;
  iconUrl?: string;
  author?: string;
  locale?: string;
  type?: string;
  installedAt?: string;
  updatedAt?: string;
  lastError?: string | null;
  registryId?: string | null;
  registryName?: string | null;
}

export interface SourceHomeItem {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  description?: string;
  status?: string;
  detailUrl: string;
}

export interface SourceHomeSection {
  id: string;
  title: string;
  items: SourceHomeItem[];
}

export interface SourceHomePayload {
  source: Pick<SourceListItem, "id" | "name" | "description" | "runtimeSupported">;
  sections: SourceHomeSection[];
  warning?: string;
  blocked?: boolean;
}

export interface SourceSearchPayload {
  source: Pick<SourceListItem, "id" | "name" | "runtimeSupported">;
  query: string;
  page: string | null;
  nextPage: string | null;
  items: SourceHomeItem[];
  warning?: string;
  blocked?: boolean;
}

export interface SourceDetailPayload {
  id: string;
  sourceId: string;
  title: string;
  author?: string;
  coverUrl?: string;
  description?: string;
  status: string;
  genres: string[];
  sourceUrl: string;
  warning?: string;
  blocked?: boolean;
}

export interface SourceChapterPayload {
  chapterIndex: number;
  title: string;
  sourceUrl: string;
}

export interface SourceChapterContentPayload {
  title: string;
  html: string;
}

export interface SourceHandler {
  home(): Promise<SourceHomePayload>;
  search(query: string, page?: string): Promise<SourceSearchPayload>;
  detail(detailUrl: string): Promise<SourceDetailPayload>;
  chapters(detailUrl: string): Promise<SourceChapterPayload[]>;
  chapterContent(chapterUrl: string): Promise<SourceChapterContentPayload>;
}

export interface RegistryRecord {
  id: string;
  name: string;
  url: string;
  trustType: TrustType;
  status: "online" | "offline";
  lastSyncedAt: string | null;
  lastError: string | null;
  extensionCount: number;
}

export interface CatalogExtensionRecord {
  id: string;
  name: string;
  author?: string;
  version: string;
  sourceUrl?: string;
  iconUrl?: string;
  description?: string;
  type?: string;
  locale?: string;
  trustType: TrustType;
  registryId: string;
  registryName: string;
  installUrl?: string;
  manifestUrl?: string;
  runtimeKind: RuntimeKind;
  runtimeSupported: boolean;
  capabilities: SourceCapabilities;
}

export interface InstalledExtensionRecord extends CatalogExtensionRecord {
  enabled: boolean;
  installedAt: string;
  updatedAt: string;
  bundled: boolean;
  systemSource?: boolean;
  lastError: string | null;
}

export interface ExtensionStateFile {
  version: 1;
  registries: RegistryRecord[];
  catalog: CatalogExtensionRecord[];
  installed: InstalledExtensionRecord[];
}
