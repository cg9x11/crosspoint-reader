import type { PrismaClient } from "./prisma.js";

import type { AppConfig } from "../config/env.js";
import { hashAdminPassword } from "./auth.js";

const AUTH_SETTING_KEYS = {
  username: "auth.admin.username",
  passwordHash: "auth.admin.password_hash",
  mustChangePassword: "auth.admin.must_change_password"
} as const;

const AUTH_HIDDEN_SETTING_KEYS = new Set<string>(Object.values(AUTH_SETTING_KEYS));
const TRANSLATION_HIDDEN_PREFIXES = ["translation.secret.", "translation.settings."];

export interface AdminAuthState {
  username: string;
  passwordHash: string;
  mustChangePassword: boolean;
  bootstrapMode: boolean;
  bootstrapCredentials:
    | {
        username: string;
        password: string;
      }
    | null;
}

function parseBooleanSetting(value?: string | null) {
  return value === "true";
}

function getBootstrapCredentials(config: AppConfig) {
  const username = config.BOOTSTRAP_ADMIN_USERNAME.trim() || "admin";
  const password = config.BOOTSTRAP_ADMIN_PASSWORD || "ChangeMe123!";

  return {
    username,
    password,
    passwordHash: hashAdminPassword(password)
  };
}

export async function resolveAdminAuthState(prisma: PrismaClient, config: AppConfig): Promise<AdminAuthState> {
  const settings = await prisma.appSetting.findMany({
    where: {
      key: {
        in: [...AUTH_HIDDEN_SETTING_KEYS]
      }
    }
  });
  const valueMap = new Map(settings.map((entry) => [entry.key, entry.value]));

  const storedUsername = valueMap.get(AUTH_SETTING_KEYS.username)?.trim();
  const storedPasswordHash = valueMap.get(AUTH_SETTING_KEYS.passwordHash)?.trim();

  if (storedUsername && storedPasswordHash) {
    return {
      username: storedUsername,
      passwordHash: storedPasswordHash,
      mustChangePassword: parseBooleanSetting(valueMap.get(AUTH_SETTING_KEYS.mustChangePassword)),
      bootstrapMode: false,
      bootstrapCredentials: null
    };
  }

  const bootstrap = getBootstrapCredentials(config);
  return {
    username: bootstrap.username,
    passwordHash: bootstrap.passwordHash,
    mustChangePassword: true,
    bootstrapMode: true,
    bootstrapCredentials: {
      username: bootstrap.username,
      password: bootstrap.password
    }
  };
}

export async function persistAdminCredentials(
  prisma: PrismaClient,
  input: {
    username: string;
    password: string;
    mustChangePassword?: boolean;
  }
) {
  const username = input.username.trim();
  const passwordHash = hashAdminPassword(input.password);
  const mustChangePassword = input.mustChangePassword ?? false;

  await Promise.all([
    prisma.appSetting.upsert({
      where: { key: AUTH_SETTING_KEYS.username },
      create: { key: AUTH_SETTING_KEYS.username, value: username },
      update: { value: username }
    }),
    prisma.appSetting.upsert({
      where: { key: AUTH_SETTING_KEYS.passwordHash },
      create: { key: AUTH_SETTING_KEYS.passwordHash, value: passwordHash },
      update: { value: passwordHash }
    }),
    prisma.appSetting.upsert({
      where: { key: AUTH_SETTING_KEYS.mustChangePassword },
      create: { key: AUTH_SETTING_KEYS.mustChangePassword, value: mustChangePassword ? "true" : "false" },
      update: { value: mustChangePassword ? "true" : "false" }
    })
  ]);
}

export function isHiddenAppSettingKey(key: string) {
  return AUTH_HIDDEN_SETTING_KEYS.has(key) || TRANSLATION_HIDDEN_PREFIXES.some((prefix) => key.startsWith(prefix));
}



