-- CreateTable
CREATE TABLE "TranslationProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "novelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL DEFAULT 'vi',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "model" TEXT NOT NULL DEFAULT 'mock-vi',
    "systemPrompt" TEXT,
    "styleGuideJson" TEXT NOT NULL DEFAULT '{}',
    "contextMode" TEXT NOT NULL DEFAULT 'light',
    "historyDepth" INTEGER NOT NULL DEFAULT 3,
    "autoTranslateNewChapters" BOOLEAN NOT NULL DEFAULT false,
    "chapterConcurrency" INTEGER NOT NULL DEFAULT 1,
    "isActiveAuto" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultEdition" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TranslationProject_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TranslationGlossary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "rawPayload" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TranslationGlossary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TranslationGlossaryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "glossaryId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'term',
    "rawName" TEXT NOT NULL,
    "translatedName" TEXT NOT NULL,
    "gender" TEXT,
    "description" TEXT,
    "aliasesJson" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TranslationGlossaryEntry_glossaryId_fkey" FOREIGN KEY ("glossaryId") REFERENCES "TranslationGlossary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChapterTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "sourceChecksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentPublishedVersionId" TEXT,
    "latestGeneratedVersionId" TEXT,
    "hasManualEdits" BOOLEAN NOT NULL DEFAULT false,
    "newGeneratedAvailable" BOOLEAN NOT NULL DEFAULT false,
    "staleReason" TEXT,
    "lastError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChapterTranslation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChapterTranslation_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChapterTranslationVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterTranslationId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT,
    "htmlPath" TEXT NOT NULL,
    "textPath" TEXT,
    "summary" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "promptSnapshot" TEXT,
    "glossaryVersion" INTEGER,
    "sourceChecksum" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChapterTranslationVersion_chapterTranslationId_fkey" FOREIGN KEY ("chapterTranslationId") REFERENCES "ChapterTranslation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TranslationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'project',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "queuedCount" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "tokenUsage" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" REAL NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TranslationRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "TranslationProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Novel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "sourceId" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "coverUrl" TEXT,
    "coverLocalPath" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "syncStatus" TEXT NOT NULL DEFAULT 'idle',
    "totalChapters" INTEGER NOT NULL DEFAULT 0,
    "downloadedChapters" INTEGER NOT NULL DEFAULT 0,
    "defaultEditionKind" TEXT NOT NULL DEFAULT 'original',
    "defaultTranslationProjectId" TEXT,
    "lastCheckedAt" DATETIME,
    "lastSyncStartedAt" DATETIME,
    "lastSyncEndedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Novel" ("author", "coverLocalPath", "coverUrl", "createdAt", "description", "downloadedChapters", "id", "lastCheckedAt", "lastError", "lastSyncEndedAt", "lastSyncStartedAt", "sourceId", "sourceName", "sourceUrl", "status", "syncStatus", "title", "totalChapters", "updatedAt") SELECT "author", "coverLocalPath", "coverUrl", "createdAt", "description", "downloadedChapters", "id", "lastCheckedAt", "lastError", "lastSyncEndedAt", "lastSyncStartedAt", "sourceId", "sourceName", "sourceUrl", "status", "syncStatus", "title", "totalChapters", "updatedAt" FROM "Novel";
DROP TABLE "Novel";
ALTER TABLE "new_Novel" RENAME TO "Novel";
CREATE INDEX "Novel_sourceId_idx" ON "Novel"("sourceId");
CREATE INDEX "Novel_syncStatus_idx" ON "Novel"("syncStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TranslationProject_novelId_status_idx" ON "TranslationProject"("novelId", "status");

-- CreateIndex
CREATE INDEX "TranslationProject_novelId_isActiveAuto_idx" ON "TranslationProject"("novelId", "isActiveAuto");

-- CreateIndex
CREATE INDEX "TranslationGlossary_projectId_isActive_idx" ON "TranslationGlossary"("projectId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationGlossary_projectId_version_key" ON "TranslationGlossary"("projectId", "version");

-- CreateIndex
CREATE INDEX "TranslationGlossaryEntry_glossaryId_type_idx" ON "TranslationGlossaryEntry"("glossaryId", "type");

-- CreateIndex
CREATE INDEX "TranslationGlossaryEntry_glossaryId_rawName_idx" ON "TranslationGlossaryEntry"("glossaryId", "rawName");

-- CreateIndex
CREATE INDEX "ChapterTranslation_projectId_status_idx" ON "ChapterTranslation"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterTranslation_projectId_chapterId_key" ON "ChapterTranslation"("projectId", "chapterId");

-- CreateIndex
CREATE INDEX "ChapterTranslationVersion_chapterTranslationId_isPublished_idx" ON "ChapterTranslationVersion"("chapterTranslationId", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterTranslationVersion_chapterTranslationId_versionNumber_key" ON "ChapterTranslationVersion"("chapterTranslationId", "versionNumber");

-- CreateIndex
CREATE INDEX "TranslationRun_projectId_status_idx" ON "TranslationRun"("projectId", "status");
