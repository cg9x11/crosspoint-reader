import { hakoSource } from "./hako.js";
import { truyenFullSource } from "./truyenfull.js";

export const sources = {
  hako: hakoSource,
  truyenfull: truyenFullSource
};

export const sourceCatalog = [
  {
    id: "hako",
    name: "Hako",
    profile: "hako",
    locale: "vi-VN",
    contentType: "webnovel",
    supportsSearch: true,
    supportsTrackedUpdates: true,
    supportsBackgroundDownloads: true,
    supportsPagedToc: false,
    supportsX3: true,
    supportsX4: true
  },
  {
    id: "truyenfull",
    name: "Truyen Full",
    profile: "truyenfull",
    locale: "vi-VN",
    contentType: "webnovel",
    supportsSearch: true,
    supportsTrackedUpdates: false,
    supportsBackgroundDownloads: false,
    supportsPagedToc: true,
    supportsX3: true,
    supportsX4: true
  }
];

export function getSource(profile) {
  return sources[profile] || null;
}
