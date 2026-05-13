import crypto from "node:crypto";

import type { PrismaClient } from "../lib/prisma.js";

import type { AppConfig } from "../config/env.js";
import { isHiddenAppSettingKey as isAdminHiddenAppSettingKey } from "../lib/adminAuth.js";

const PREFIX = "translation.";
const SECRET_PREFIX = `${PREFIX}secret.`;
const SETTINGS_PREFIX = `${PREFIX}settings.`;

const TRANSLATION_HIDDEN_KEYS = new Set<string>([
  `${SETTINGS_PREFIX}provider_credentials`,
  `${SETTINGS_PREFIX}runtime`
]);

function getKeyMaterial(config: AppConfig) {
  return crypto.createHash("sha256").update(config.SESSION_SECRET || "translation-secret").digest();
}

function encryptValue(value: string, config: AppConfig) {
  const iv = crypto.randomBytes(12);
  const key = getKeyMaterial(config);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decryptValue(value: string | null | undefined, config: AppConfig) {
  if (!value) {
    return "";
  }
  try {
    const raw = Buffer.from(value, "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKeyMaterial(config), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export interface TranslationProviderCredential {
  provider: string;
  label: string;
  apiKey?: string;
  baseUrl?: string;
  modelHint?: string;
  enabled?: boolean;
}

export interface TranslationRuntimeSettings {
  maxActiveProjects: number;
  maxChapterConcurrency: number;
  requestTimeoutMs: number;
  maxCharsPerRequest: number;
}

export interface TranslationSettingsState {
  credentials: TranslationProviderCredential[];
  runtime: TranslationRuntimeSettings;
}

export const DEFAULT_TRANSLATION_RUNTIME: TranslationRuntimeSettings = {
  maxActiveProjects: 1,
  maxChapterConcurrency: 2,
  requestTimeoutMs: 45000,
  maxCharsPerRequest: 4000
};

export async function getTranslationSettings(prisma: PrismaClient, config: AppConfig): Promise<TranslationSettingsState> {
  const rows = await prisma.appSetting.findMany({
    where: {
      key: {
        in: [...TRANSLATION_HIDDEN_KEYS]
      }
    }
  });
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    credentials: parseJson<TranslationProviderCredential[]>(
      decryptValue(map.get(`${SETTINGS_PREFIX}provider_credentials`), config),
      []
    ),
    runtime: {
      ...DEFAULT_TRANSLATION_RUNTIME,
      ...parseJson<Partial<TranslationRuntimeSettings>>(
        decryptValue(map.get(`${SETTINGS_PREFIX}runtime`), config),
        {}
      )
    }
  };
}

export async function saveTranslationSettings(
  prisma: PrismaClient,
  config: AppConfig,
  input: { credentials?: TranslationProviderCredential[]; runtime?: Partial<TranslationRuntimeSettings> }
) {
  const current = await getTranslationSettings(prisma, config);
  const next: TranslationSettingsState = {
    credentials: input.credentials ?? current.credentials,
    runtime: {
      ...current.runtime,
      ...(input.runtime ?? {})
    }
  };
  await Promise.all([
    prisma.appSetting.upsert({
      where: { key: `${SETTINGS_PREFIX}provider_credentials` },
      create: {
        key: `${SETTINGS_PREFIX}provider_credentials`,
        value: encryptValue(JSON.stringify(next.credentials), config)
      },
      update: {
        value: encryptValue(JSON.stringify(next.credentials), config)
      }
    }),
    prisma.appSetting.upsert({
      where: { key: `${SETTINGS_PREFIX}runtime` },
      create: {
        key: `${SETTINGS_PREFIX}runtime`,
        value: encryptValue(JSON.stringify(next.runtime), config)
      },
      update: {
        value: encryptValue(JSON.stringify(next.runtime), config)
      }
    })
  ]);
  return next;
}

export function isHiddenTranslationSettingKey(key: string) {
  return TRANSLATION_HIDDEN_KEYS.has(key) || key.startsWith(SECRET_PREFIX) || isAdminHiddenAppSettingKey(key);
}


