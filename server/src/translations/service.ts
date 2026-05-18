import fs from "node:fs/promises";
import path from "node:path";

import type {
  Chapter,
  ChapterTranslation,
  PrismaClient,
  TranslationGlossaryEntry,
  TranslationProject
} from "../lib/prisma.js";

import type { AppConfig } from "../config/env.js";
import { buildBookEpub } from "../epub/builder.js";
import { ensureDir, fileExists, readJsonFile, sha256Hex, writeFileAtomic } from "../lib/filesystem.js";
import { stripHtmlToReadableText } from "../lib/sanitize.js";
import type { AppQueues } from "../queues/index.js";
import type { StorageLayout } from "../storage/paths.js";
import { getChapterHtmlPath } from "../library/service.js";
import { buildChapterSummary, buildTranslationSystemPrompt, extractTranslatableBlocks, replaceTranslatedBlocks } from "./prompts.js";
import { suggestGlossaryCandidates, translateTexts } from "./provider.js";
import { DEFAULT_TRANSLATION_RUNTIME, getTranslationSettings } from "./settings.js";
import {
  ensureTranslationProjectLayout,
  getTranslationExportDir,
  getTranslationVersionHtmlPath,
  getTranslationVersionTextPath
} from "./storage.js";

export interface TranslationProjectPayload {
  name: string;
  targetLanguage?: string;
  provider?: string;
  model?: string;
  systemPrompt?: string;
  styleGuideJson?: string;
  contextMode?: string;
  historyDepth?: number;
  autoTranslateNewChapters?: boolean;
  chapterConcurrency?: number;
  isActiveAuto?: boolean;
  isDefaultEdition?: boolean;
}

function safeJsonStringify(value: unknown, fallback = "{}") {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return fallback;
  }
}

async function unsetOtherActiveProjects(prisma: PrismaClient, novelId: string, projectId: string) {
  await prisma.translationProject.updateMany({
    where: {
      novelId,
      id: { not: projectId },
      isActiveAuto: true
    },
    data: { isActiveAuto: false }
  });
}

async function unsetOtherDefaultProjects(prisma: PrismaClient, novelId: string, projectId: string) {
  await prisma.translationProject.updateMany({
    where: {
      novelId,
      id: { not: projectId },
      isDefaultEdition: true
    },
    data: { isDefaultEdition: false }
  });
}

export async function listTranslationProjects(prisma: PrismaClient) {
  return prisma.translationProject.findMany({
    include: {
      novel: {
        select: {
          id: true,
          title: true,
          author: true,
          downloadedChapters: true,
          totalChapters: true
        }
      },
      _count: {
        select: {
          chapterTranslations: true,
          runs: true,
          glossaries: true
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }]
  });
}

export async function getTranslationProject(prisma: PrismaClient, projectId: string) {
  const projectSeed = await prisma.translationProject.findUnique({
    where: { id: projectId },
    select: { id: true, novelId: true }
  });
  if (!projectSeed) {
    return null;
  }

  const chapters = await prisma.chapter.findMany({
    where: { novelId: projectSeed.novelId, status: "published" },
    select: { id: true },
    orderBy: { chapterIndex: "asc" }
  });

  if (chapters.length) {
    const existing = await prisma.chapterTranslation.findMany({
      where: { projectId: projectSeed.id },
      select: { chapterId: true }
    });
    const existingIds = new Set(existing.map((item) => item.chapterId));
    for (const chapter of chapters) {
      if (existingIds.has(chapter.id)) {
        continue;
      }
      await prisma.chapterTranslation.create({
        data: {
          projectId: projectSeed.id,
          chapterId: chapter.id,
          sourceChecksum: "bootstrap",
          status: "pending"
        }
      });
    }
  }

  return prisma.translationProject.findUnique({
    where: { id: projectId },
    include: {
      novel: true,
      glossaries: {
        include: {
          entries: {
            orderBy: [{ priority: "desc" }, { rawName: "asc" }]
          }
        },
        orderBy: { version: "desc" }
      },
      chapterTranslations: {
        include: {
          chapter: true,
          versions: {
            orderBy: { versionNumber: "desc" }
          }
        },
        orderBy: {
          chapter: {
            chapterIndex: "asc"
          }
        }
      },
      runs: {
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  });
}

export async function createTranslationProject(
  prisma: PrismaClient,
  novelId: string,
  input: TranslationProjectPayload
) {
  const project = await prisma.translationProject.create({
    data: {
      novelId,
      name: input.name,
      targetLanguage: input.targetLanguage || "vi",
      provider: input.provider || "openai",
      model: input.model || "gpt-4.1-mini",
      systemPrompt: input.systemPrompt || null,
      styleGuideJson: input.styleGuideJson || "{}",
      contextMode: input.contextMode || "light",
      historyDepth: Math.max(0, Math.min(12, Number(input.historyDepth || 3))),
      autoTranslateNewChapters: Boolean(input.autoTranslateNewChapters),
      chapterConcurrency: Math.max(1, Math.min(4, Number(input.chapterConcurrency || 1))),
      isActiveAuto: Boolean(input.isActiveAuto),
      isDefaultEdition: Boolean(input.isDefaultEdition)
    }
  });
  if (project.isActiveAuto) {
    await unsetOtherActiveProjects(prisma, novelId, project.id);
  }
  if (project.isDefaultEdition) {
    await unsetOtherDefaultProjects(prisma, novelId, project.id);
    await prisma.novel.update({
      where: { id: novelId },
      data: {
        defaultEditionKind: "translation",
        defaultTranslationProjectId: project.id
      }
    });
  }
  await prisma.translationGlossary.create({
    data: {
      projectId: project.id,
      version: 1,
      sourceType: "manual",
      rawPayload: "[]",
      isActive: true
    }
  });
  return getTranslationProject(prisma, project.id);
}

export async function updateTranslationProject(
  prisma: PrismaClient,
  projectId: string,
  input: Partial<TranslationProjectPayload>
) {
  const existing = await prisma.translationProject.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new Error("TRANSLATION_PROJECT_NOT_FOUND");
  }
  const project = await prisma.translationProject.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.targetLanguage !== undefined ? { targetLanguage: input.targetLanguage } : {}),
      ...(input.provider !== undefined ? { provider: input.provider } : {}),
      ...(input.model !== undefined ? { model: input.model } : {}),
      ...(input.systemPrompt !== undefined ? { systemPrompt: input.systemPrompt || null } : {}),
      ...(input.styleGuideJson !== undefined ? { styleGuideJson: input.styleGuideJson || "{}" } : {}),
      ...(input.contextMode !== undefined ? { contextMode: input.contextMode } : {}),
      ...(input.historyDepth !== undefined ? { historyDepth: Math.max(0, Math.min(12, Number(input.historyDepth || 0))) } : {}),
      ...(input.autoTranslateNewChapters !== undefined ? { autoTranslateNewChapters: Boolean(input.autoTranslateNewChapters) } : {}),
      ...(input.chapterConcurrency !== undefined ? { chapterConcurrency: Math.max(1, Math.min(4, Number(input.chapterConcurrency || 1))) } : {}),
      ...(input.isActiveAuto !== undefined ? { isActiveAuto: Boolean(input.isActiveAuto) } : {}),
      ...(input.isDefaultEdition !== undefined ? { isDefaultEdition: Boolean(input.isDefaultEdition) } : {})
    }
  });
  if (input.isActiveAuto) {
    await unsetOtherActiveProjects(prisma, existing.novelId, project.id);
  }
  if (input.isDefaultEdition) {
    await unsetOtherDefaultProjects(prisma, existing.novelId, project.id);
    await prisma.novel.update({
      where: { id: existing.novelId },
      data: {
        defaultEditionKind: "translation",
        defaultTranslationProjectId: project.id
      }
    });
  }
  if (input.systemPrompt !== undefined || input.styleGuideJson !== undefined || input.contextMode !== undefined || input.historyDepth !== undefined || input.provider !== undefined || input.model !== undefined) {
    await prisma.chapterTranslation.updateMany({
      where: { projectId },
      data: { staleReason: "project_config_changed" }
    });
  }
  return getTranslationProject(prisma, project.id);
}

export async function deleteTranslationProject(prisma: PrismaClient, projectId: string) {
  const existing = await prisma.translationProject.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new Error("TRANSLATION_PROJECT_NOT_FOUND");
  }

  await prisma.translationProject.delete({ where: { id: projectId } });

  if (existing.isDefaultEdition) {
    await prisma.novel.update({
      where: { id: existing.novelId },
      data: {
        defaultEditionKind: "original",
        defaultTranslationProjectId: null
      }
    });
  }

  if (existing.isActiveAuto) {
    const nextActive = await prisma.translationProject.findFirst({
      where: { novelId: existing.novelId },
      orderBy: { createdAt: "desc" }
    });
    if (nextActive) {
      await prisma.translationProject.update({
        where: { id: nextActive.id },
        data: { isActiveAuto: true }
      });
    }
  }

  return { id: projectId, novelId: existing.novelId };
}

async function getActiveGlossary(prisma: PrismaClient, projectId: string) {
  return prisma.translationGlossary.findFirst({
    where: { projectId, isActive: true },
    include: {
      entries: {
        orderBy: [{ priority: "desc" }, { rawName: "asc" }]
      }
    }
  });
}

function normalizeGlossaryEntries(input: Array<Record<string, unknown>>) {
  return input
    .map((entry) => ({
      type: String(entry.type || "term").trim() || "term",
      rawName: String(entry.rawName || entry.raw_name || "").trim(),
      translatedName: String(entry.translatedName || entry.translated_name || entry.rawName || entry.raw_name || "").trim(),
      gender: entry.gender ? String(entry.gender) : null,
      description: entry.description ? String(entry.description) : null,
      aliasesJson: safeJsonStringify(Array.isArray(entry.aliases) ? entry.aliases : [] , "[]"),
      notes: entry.notes ? String(entry.notes) : null,
      locked: Boolean(entry.locked),
      priority: Number(entry.priority || 0) || 0
    }))
    .filter((entry) => entry.rawName && entry.translatedName);
}

export async function createGlossaryVersion(
  prisma: PrismaClient,
  projectId: string,
  input: {
    sourceType: string;
    entries: Array<Record<string, unknown>>;
    activate?: boolean;
  }
) {
  const latest = await prisma.translationGlossary.findFirst({
    where: { projectId },
    orderBy: { version: "desc" }
  });
  const version = (latest?.version || 0) + 1;
  const glossary = await prisma.translationGlossary.create({
    data: {
      projectId,
      version,
      sourceType: input.sourceType,
      rawPayload: JSON.stringify(input.entries),
      isActive: Boolean(input.activate),
      entries: {
        create: normalizeGlossaryEntries(input.entries)
      }
    },
    include: { entries: true }
  });
  if (input.activate) {
    await activateGlossaryVersion(prisma, projectId, glossary.id);
  }
  return glossary;
}

export async function activateGlossaryVersion(prisma: PrismaClient, projectId: string, glossaryId: string) {
  await prisma.translationGlossary.updateMany({
    where: { projectId },
    data: { isActive: false }
  });
  const glossary = await prisma.translationGlossary.update({
    where: { id: glossaryId },
    data: { isActive: true },
    include: { entries: true }
  });
  await prisma.chapterTranslation.updateMany({
    where: { projectId },
    data: { staleReason: "glossary_changed" }
  });
  return glossary;
}

export async function updateGlossaryEntries(
  prisma: PrismaClient,
  glossaryId: string,
  entries: Array<Record<string, unknown>>
) {
  const glossary = await prisma.translationGlossary.findUnique({ where: { id: glossaryId } });
  if (!glossary) {
    throw new Error("TRANSLATION_GLOSSARY_NOT_FOUND");
  }
  await prisma.translationGlossaryEntry.deleteMany({ where: { glossaryId } });
  await prisma.translationGlossary.update({
    where: { id: glossaryId },
    data: {
      rawPayload: JSON.stringify(entries),
      entries: {
        create: normalizeGlossaryEntries(entries)
      }
    }
  });
  if (glossary.isActive) {
    await prisma.chapterTranslation.updateMany({
      where: { projectId: glossary.projectId },
      data: { staleReason: "glossary_changed" }
    });
  }
  return prisma.translationGlossary.findUnique({
    where: { id: glossaryId },
    include: { entries: { orderBy: [{ priority: "desc" }, { rawName: "asc" }] } }
  });
}

async function buildProjectContextSummaries(prisma: PrismaClient, projectId: string, chapter: Chapter, historyDepth: number) {
  if (historyDepth <= 0) {
    return [];
  }
  const previous = await prisma.chapterTranslation.findMany({
    where: {
      projectId,
      chapter: {
        novelId: chapter.novelId,
        chapterIndex: {
          lt: chapter.chapterIndex
        }
      },
      currentPublishedVersionId: {
        not: null
      }
    },
    include: {
      versions: true,
      chapter: true
    },
    orderBy: {
      chapter: {
        chapterIndex: "desc"
      }
    },
    take: historyDepth
  });
  return previous
    .map((item) => item.versions.find((entry) => entry.id === item.currentPublishedVersionId)?.summary)
    .filter((entry): entry is string => Boolean(entry));
}

async function resolveCredential(config: AppConfig, prisma: PrismaClient, provider: string) {
  const settings = await getTranslationSettings(prisma, config);
  return {
    runtime: settings.runtime || DEFAULT_TRANSLATION_RUNTIME,
    credential: settings.credentials.find((item) => item.provider === provider && item.enabled !== false)
  };
}

async function nextVersionNumber(prisma: PrismaClient, chapterTranslationId: string) {
  const latest = await prisma.chapterTranslationVersion.findFirst({
    where: { chapterTranslationId },
    orderBy: { versionNumber: "desc" }
  });
  return (latest?.versionNumber || 0) + 1;
}

async function persistVersion(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  payload: {
    chapterTranslationId: string;
    projectId: string;
    chapterId: string;
    chapterIndex: number;
    title: string;
    html: string;
    summary: string;
    sourceChecksum: string;
    kind: string;
    createdBy: string;
    provider?: string;
    model?: string;
    promptSnapshot?: string;
    glossaryVersion?: number | null;
    publish?: boolean;
  }
) {
  const versionNumber = await nextVersionNumber(prisma, payload.chapterTranslationId);
  const htmlPath = getTranslationVersionHtmlPath(storagePaths, payload.projectId, payload.chapterId, versionNumber, payload.chapterIndex);
  const textPath = getTranslationVersionTextPath(storagePaths, payload.projectId, payload.chapterId, versionNumber, payload.chapterIndex);
  await ensureDir(path.dirname(htmlPath));
  await writeFileAtomic(htmlPath, payload.html);
  await writeFileAtomic(textPath, `${stripHtmlToReadableText(payload.html)}\n`);
  if (payload.publish) {
    await prisma.chapterTranslationVersion.updateMany({
      where: { chapterTranslationId: payload.chapterTranslationId },
      data: { isPublished: false }
    });
  }
  const version = await prisma.chapterTranslationVersion.create({
    data: {
      chapterTranslationId: payload.chapterTranslationId,
      versionNumber,
      kind: payload.kind,
      title: payload.title,
      htmlPath,
      textPath,
      summary: payload.summary,
      provider: payload.provider || null,
      model: payload.model || null,
      promptSnapshot: payload.promptSnapshot || null,
      glossaryVersion: payload.glossaryVersion ?? null,
      sourceChecksum: payload.sourceChecksum,
      isPublished: Boolean(payload.publish),
      createdBy: payload.createdBy
    }
  });
  await prisma.chapterTranslation.update({
    where: { id: payload.chapterTranslationId },
    data: {
      latestGeneratedVersionId: version.id,
      ...(payload.publish
        ? {
            currentPublishedVersionId: version.id,
            newGeneratedAvailable: false
          }
        : {
            newGeneratedAvailable: true
          })
    }
  });
  return version;
}

async function ensureChapterTranslation(prisma: PrismaClient, projectId: string, chapter: Chapter, sourceChecksum: string) {
  const existing = await prisma.chapterTranslation.findUnique({
    where: {
      projectId_chapterId: {
        projectId,
        chapterId: chapter.id
      }
    }
  });
  if (existing) {
    if (existing.sourceChecksum !== sourceChecksum) {
      return prisma.chapterTranslation.update({
        where: { id: existing.id },
        data: {
          sourceChecksum,
          staleReason: "source_changed"
        }
      });
    }
    return existing;
  }
  return prisma.chapterTranslation.create({
    data: {
      projectId,
      chapterId: chapter.id,
      sourceChecksum,
      status: "pending"
    }
  });
}

export async function translateProjectChapter(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  config: AppConfig,
  payload: {
    projectId: string;
    chapterId: string;
    forcePublish?: boolean;
    triggerType?: string;
  }
) {
  const project = await prisma.translationProject.findUnique({
    where: { id: payload.projectId },
    include: { novel: true }
  });
  if (!project) {
    throw new Error("TRANSLATION_PROJECT_NOT_FOUND");
  }
  const chapter = await prisma.chapter.findUnique({
    where: { id: payload.chapterId }
  });
  if (!chapter) {
    throw new Error("TRANSLATION_CHAPTER_NOT_FOUND");
  }
  const htmlPath = getChapterHtmlPath(storagePaths, chapter.novelId, chapter.chapterIndex);
  const html = await fs.readFile(htmlPath, "utf8");
  const sourceChecksum = sha256Hex(html);
  await ensureTranslationProjectLayout(storagePaths, project.id);
  let chapterTranslation = await ensureChapterTranslation(prisma, project.id, chapter, sourceChecksum);
  await prisma.chapterTranslation.update({
    where: { id: chapterTranslation.id },
    data: {
      status: "translating",
      lastError: null
    }
  });
  const glossary = await getActiveGlossary(prisma, project.id);
  const contextSummaries = await buildProjectContextSummaries(prisma, project.id, chapter, project.historyDepth);
  const { credential, runtime } = await resolveCredential(config, prisma, project.provider);
  const prompt = buildTranslationSystemPrompt(project, glossary?.entries || [], {
    chapterTitle: chapter.title,
    previousSummaries: contextSummaries
  });
  const extracted = extractTranslatableBlocks(html);
  const translated = await translateTexts(
    credential,
    project.provider,
    project.model,
    prompt,
    extracted.blocks.map((block) => block.text),
    runtime
  );
  const translatedHtml = replaceTranslatedBlocks(html, translated.texts);
  const summary = buildChapterSummary(translatedHtml);
  chapterTranslation = await prisma.chapterTranslation.findUniqueOrThrow({ where: { id: chapterTranslation.id } });
  const publish = !chapterTranslation.hasManualEdits || Boolean(payload.forcePublish);
  const version = await persistVersion(prisma, storagePaths, {
    chapterTranslationId: chapterTranslation.id,
    projectId: project.id,
    chapterId: chapter.id,
    chapterIndex: chapter.chapterIndex,
    title: chapter.title,
    html: translatedHtml,
    summary,
    sourceChecksum,
    kind: chapterTranslation.hasManualEdits ? "retranslated" : "generated",
    createdBy: payload.triggerType || "system",
    provider: project.provider,
    model: project.model,
    promptSnapshot: prompt,
    glossaryVersion: glossary?.version ?? null,
    publish
  });
  await prisma.chapterTranslation.update({
    where: { id: chapterTranslation.id },
    data: {
      status: "ready",
      sourceChecksum,
      staleReason: null,
      lastError: null,
      ...(publish
        ? {
            currentPublishedVersionId: version.id,
            newGeneratedAvailable: false
          }
        : {
            newGeneratedAvailable: true
          })
    }
  });
  return version;
}

export async function createEditedVersion(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  payload: {
    chapterTranslationId: string;
    html: string;
    createdBy: string;
    publish?: boolean;
  }
) {
  const chapterTranslation = await prisma.chapterTranslation.findUnique({
    where: { id: payload.chapterTranslationId },
    include: {
      chapter: true,
      project: true,
      versions: {
        orderBy: { versionNumber: "desc" }
      }
    }
  });
  if (!chapterTranslation) {
    throw new Error("CHAPTER_TRANSLATION_NOT_FOUND");
  }
  const version = await persistVersion(prisma, storagePaths, {
    chapterTranslationId: chapterTranslation.id,
    projectId: chapterTranslation.projectId,
    chapterId: chapterTranslation.chapterId,
    chapterIndex: chapterTranslation.chapter.chapterIndex,
    title: chapterTranslation.chapter.title,
    html: payload.html,
    summary: buildChapterSummary(payload.html),
    sourceChecksum: chapterTranslation.sourceChecksum,
    kind: "edited",
    createdBy: payload.createdBy,
    publish: payload.publish !== false
  });
  await prisma.chapterTranslation.update({
    where: { id: chapterTranslation.id },
    data: {
      hasManualEdits: true,
      status: "ready",
      currentPublishedVersionId: payload.publish === false ? chapterTranslation.currentPublishedVersionId : version.id
    }
  });
  return version;
}

export async function setPublishedVersion(prisma: PrismaClient, chapterTranslationId: string, versionId: string) {
  const version = await prisma.chapterTranslationVersion.findFirst({
    where: {
      id: versionId,
      chapterTranslationId
    }
  });
  if (!version) {
    throw new Error("TRANSLATION_VERSION_NOT_FOUND");
  }
  await prisma.chapterTranslationVersion.updateMany({
    where: { chapterTranslationId },
    data: { isPublished: false }
  });
  await prisma.chapterTranslationVersion.update({
    where: { id: versionId },
    data: { isPublished: true }
  });
  await prisma.chapterTranslation.update({
    where: { id: chapterTranslationId },
    data: {
      currentPublishedVersionId: versionId,
      newGeneratedAvailable: false
    }
  });
  return version;
}

export async function deleteTranslationVersion(prisma: PrismaClient, versionId: string) {
  const version = await prisma.chapterTranslationVersion.findUnique({ where: { id: versionId } });
  if (!version) {
    return { ok: true, missing: true };
  }
  if (version.isPublished) {
    throw new Error("TRANSLATION_VERSION_IS_PUBLISHED");
  }
  await fs.rm(version.htmlPath, { force: true }).catch(() => undefined);
  if (version.textPath) {
    await fs.rm(version.textPath, { force: true }).catch(() => undefined);
  }
  await prisma.chapterTranslationVersion.delete({ where: { id: versionId } });
  return { ok: true };
}

export async function getProjectChapterDetail(prisma: PrismaClient, chapterTranslationId: string) {
  return prisma.chapterTranslation.findUnique({
    where: { id: chapterTranslationId },
    include: {
      chapter: true,
      project: true,
      versions: {
        orderBy: { versionNumber: "desc" }
      }
    }
  });
}

export async function getProjectEditions(prisma: PrismaClient, novelId: string) {
  const novel = await prisma.novel.findUnique({ where: { id: novelId } });
  if (!novel) {
    throw new Error("NOVEL_NOT_FOUND");
  }
  const projects = await prisma.translationProject.findMany({
    where: { novelId },
    orderBy: [{ isDefaultEdition: "desc" }, { updatedAt: "desc" }]
  });
  return {
    novel,
    items: [
      {
        id: "original",
        kind: "original",
        label: "Bản gốc",
        language: "source",
        isDefault: novel.defaultEditionKind !== "translation"
      },
      ...projects.map((project) => ({
        id: project.id,
        kind: "translation",
        label: project.name,
        language: project.targetLanguage,
        isDefault: novel.defaultTranslationProjectId === project.id || project.isDefaultEdition,
        status: project.status,
        projectId: project.id
      }))
    ]
  };
}

export async function setDefaultEdition(prisma: PrismaClient, novelId: string, mode: { kind: string; projectId?: string | null }) {
  if (mode.kind === "original") {
    await prisma.novel.update({
      where: { id: novelId },
      data: {
        defaultEditionKind: "original",
        defaultTranslationProjectId: null
      }
    });
    await prisma.translationProject.updateMany({
      where: { novelId },
      data: { isDefaultEdition: false }
    });
    return { ok: true };
  }
  if (!mode.projectId) {
    throw new Error("TRANSLATION_PROJECT_ID_REQUIRED");
  }
  await unsetOtherDefaultProjects(prisma, novelId, mode.projectId);
  await prisma.translationProject.update({
    where: { id: mode.projectId },
    data: { isDefaultEdition: true }
  });
  await prisma.novel.update({
    where: { id: novelId },
    data: {
      defaultEditionKind: "translation",
      defaultTranslationProjectId: mode.projectId
    }
  });
  return { ok: true };
}

export async function buildTranslationExportEpub(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  projectId: string
) {
  const project = await prisma.translationProject.findUnique({
    where: { id: projectId },
    include: {
      novel: true,
      chapterTranslations: {
        include: {
          chapter: true,
          versions: true
        },
        orderBy: {
          chapter: {
            chapterIndex: "asc"
          }
        }
      }
    }
  });
  if (!project) {
    throw new Error("TRANSLATION_PROJECT_NOT_FOUND");
  }
  const chapters = [] as Array<{ title: string; contentHtml: string; sourceUrl?: string | null }>;
  for (const item of project.chapterTranslations) {
    const published = item.versions.find((entry) => entry.id === item.currentPublishedVersionId);
    if (!published || !(await fileExists(published.htmlPath))) {
      continue;
    }
    chapters.push({
      title: item.chapter.title,
      contentHtml: await fs.readFile(published.htmlPath, "utf8"),
      sourceUrl: item.chapter.sourceUrl
    });
  }
  if (!chapters.length) {
    throw new Error("NO_TRANSLATED_CHAPTERS_AVAILABLE");
  }
  const exportDir = getTranslationExportDir(storagePaths, projectId);
  await ensureDir(exportDir);
  const outputPath = path.join(exportDir, `${projectId}.epub`);
  await buildBookEpub({
    outputPath,
    identifier: `${project.novel.sourceId}:${project.id}`,
    title: `${project.novel.title} — ${project.name}`,
    author: project.novel.author,
    description: project.novel.description,
    chapters
  });
  return outputPath;
}

export async function buildTranslationExportTxt(
  prisma: PrismaClient,
  storagePaths: StorageLayout,
  projectId: string
) {
  const project = await prisma.translationProject.findUnique({
    where: { id: projectId },
    include: {
      novel: true,
      chapterTranslations: {
        include: {
          chapter: true,
          versions: true
        },
        orderBy: {
          chapter: {
            chapterIndex: "asc"
          }
        }
      }
    }
  });
  if (!project) {
    throw new Error("TRANSLATION_PROJECT_NOT_FOUND");
  }
  const exportDir = getTranslationExportDir(storagePaths, projectId);
  await ensureDir(exportDir);
  const outputPath = path.join(exportDir, `${projectId}.txt`);
  const chunks: string[] = [];
  for (const item of project.chapterTranslations) {
    const published = item.versions.find((entry) => entry.id === item.currentPublishedVersionId);
    if (!published) {
      continue;
    }
    const html = await fs.readFile(published.htmlPath, "utf8");
    chunks.push(`# ${item.chapter.title}\n\n${stripHtmlToReadableText(html)}`);
  }
  await writeFileAtomic(outputPath, `${chunks.join("\n\n")}`);
  return outputPath;
}

export async function generateGlossarySuggestions(
  prisma: PrismaClient,
  config: AppConfig,
  storagePaths: StorageLayout,
  projectId: string
) {
  const project = await prisma.translationProject.findUnique({
    where: { id: projectId },
    include: {
      novel: true
    }
  });
  if (!project) {
    throw new Error("TRANSLATION_PROJECT_NOT_FOUND");
  }
  const sampleChapters = await prisma.chapter.findMany({
    where: { novelId: project.novelId, status: "published" },
    orderBy: { chapterIndex: "asc" },
    take: 3
  });
  const samples: string[] = [project.novel.title, project.novel.description || ""];
  for (const chapter of sampleChapters) {
    const htmlPath = getChapterHtmlPath(storagePaths, chapter.novelId, chapter.chapterIndex);
    if (await fileExists(htmlPath)) {
      samples.push(await fs.readFile(htmlPath, "utf8"));
    }
  }
  const sourceText = samples.join("\n\n").slice(0, 12000);
  const { credential, runtime } = await resolveCredential(config, prisma, project.provider);
  return suggestGlossaryCandidates(credential, project.provider, project.model, sourceText, runtime, project.targetLanguage);
}

export async function scheduleProjectRun(
  prisma: PrismaClient,
  queues: AppQueues,
  projectId: string,
  triggerType: string,
  scope = "project"
) {
  const project = await prisma.translationProject.findUnique({
    where: { id: projectId },
    include: {
      novel: true
    }
  });
  if (!project) {
    throw new Error("TRANSLATION_PROJECT_NOT_FOUND");
  }
  const chapters = await prisma.chapter.findMany({
    where: { novelId: project.novelId, status: "published" },
    orderBy: { chapterIndex: "asc" }
  });
  const existingTranslations = await prisma.chapterTranslation.findMany({ where: { projectId } });
  const existingByChapter = new Map(existingTranslations.map((item) => [item.chapterId, item]));
  const candidates = chapters.filter((chapter) => {
    const translation = existingByChapter.get(chapter.id);
    return !translation || Boolean(translation.staleReason) || translation.status !== "ready";
  });
  const run = await prisma.translationRun.create({
    data: {
      projectId,
      triggerType,
      scope,
      status: "queued",
      queuedCount: candidates.length,
      startedAt: new Date()
    }
  });
  for (const chapter of candidates) {
    await queues.translationChapter.add("translate-chapter", {
      projectId,
      chapterId: chapter.id,
      runId: run.id,
      triggerType
    }, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      },
      removeOnComplete: 100,
      removeOnFail: 200,
      jobId: `translation-chapter__${projectId}__${chapter.id}`
    });
  }
  await prisma.translationProject.update({
    where: { id: projectId },
    data: { status: candidates.length ? "queued" : "ready", lastError: null }
  });
  return run;
}

