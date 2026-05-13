import type { PrismaClient } from "./prisma.js";

import type { AppConfig } from "../config/env.js";

export const SOURCE_POLICY_SETTING_KEYS = {
  enabledAllowlist: "source.policy.enabled_allowlist",
  priorityIds: "source.policy.priority_ids"
} as const;

type SourcePolicySettingKey =
  (typeof SOURCE_POLICY_SETTING_KEYS)[keyof typeof SOURCE_POLICY_SETTING_KEYS];

export interface SourcePolicySnapshot {
  enabledAllowlist: string[];
  priorityIds: string[];
  source: {
    enabledAllowlist: "db" | "env";
    priorityIds: "db" | "env";
  };
}

function normalizeList(items: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of items) {
    const value = item.trim();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

export function parsePolicyList(value?: string | null) {
  if (!value) {
    return [];
  }

  return normalizeList(value.split(","));
}

function hasOwnSetting(map: Map<string, string>, key: SourcePolicySettingKey) {
  return map.has(key);
}

function getFallbackSourcePolicy(fallback?: Pick<AppConfig, "SOURCE_ENABLED_ALLOWLIST" | "SOURCE_PRIORITY_IDS">) {
  return {
    enabledAllowlist: parsePolicyList(fallback?.SOURCE_ENABLED_ALLOWLIST ?? process.env.SOURCE_ENABLED_ALLOWLIST),
    priorityIds: parsePolicyList(fallback?.SOURCE_PRIORITY_IDS ?? process.env.SOURCE_PRIORITY_IDS)
  };
}

export async function resolveSourcePolicy(
  prisma: PrismaClient,
  fallback?: Pick<AppConfig, "SOURCE_ENABLED_ALLOWLIST" | "SOURCE_PRIORITY_IDS">
): Promise<SourcePolicySnapshot> {
  const settings = await prisma.appSetting.findMany({
    where: {
      key: {
        in: [SOURCE_POLICY_SETTING_KEYS.enabledAllowlist, SOURCE_POLICY_SETTING_KEYS.priorityIds]
      }
    }
  });
  const map = new Map(settings.map((item) => [item.key, item.value]));
  const fallbackPolicy = getFallbackSourcePolicy(fallback);

  const allowlistFromDb = hasOwnSetting(map, SOURCE_POLICY_SETTING_KEYS.enabledAllowlist)
    ? parsePolicyList(map.get(SOURCE_POLICY_SETTING_KEYS.enabledAllowlist))
    : undefined;
  const priorityFromDb = hasOwnSetting(map, SOURCE_POLICY_SETTING_KEYS.priorityIds)
    ? parsePolicyList(map.get(SOURCE_POLICY_SETTING_KEYS.priorityIds))
    : undefined;

  return {
    enabledAllowlist: allowlistFromDb ?? fallbackPolicy.enabledAllowlist,
    priorityIds: priorityFromDb ?? fallbackPolicy.priorityIds,
    source: {
      enabledAllowlist: allowlistFromDb !== undefined ? "db" : "env",
      priorityIds: priorityFromDb !== undefined ? "db" : "env"
    }
  };
}

export async function updateSourcePolicy(
  prisma: PrismaClient,
  patch: {
    enabledAllowlist?: string[];
    priorityIds?: string[];
  },
  fallback?: Pick<AppConfig, "SOURCE_ENABLED_ALLOWLIST" | "SOURCE_PRIORITY_IDS">
) {
  const writes = [];

  if (patch.enabledAllowlist !== undefined) {
    writes.push(
      prisma.appSetting.upsert({
        where: { key: SOURCE_POLICY_SETTING_KEYS.enabledAllowlist },
        create: {
          key: SOURCE_POLICY_SETTING_KEYS.enabledAllowlist,
          value: normalizeList(patch.enabledAllowlist).join(",")
        },
        update: {
          value: normalizeList(patch.enabledAllowlist).join(",")
        }
      })
    );
  }

  if (patch.priorityIds !== undefined) {
    writes.push(
      prisma.appSetting.upsert({
        where: { key: SOURCE_POLICY_SETTING_KEYS.priorityIds },
        create: {
          key: SOURCE_POLICY_SETTING_KEYS.priorityIds,
          value: normalizeList(patch.priorityIds).join(",")
        },
        update: {
          value: normalizeList(patch.priorityIds).join(",")
        }
      })
    );
  }

  if (writes.length > 0) {
    await Promise.all(writes);
  }

  return resolveSourcePolicy(prisma, fallback);
}

