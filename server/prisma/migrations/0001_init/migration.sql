-- CreateTable
CREATE TABLE "Novel" (
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
    "lastCheckedAt" DATETIME,
    "lastSyncStartedAt" DATETIME,
    "lastSyncEndedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "novelId" TEXT NOT NULL,
    "chapterIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "epubPath" TEXT,
    "fileSize" INTEGER,
    "checksum" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Chapter_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "novelId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "totalFound" INTEGER NOT NULL DEFAULT 0,
    "newChapters" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncRun_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PluginSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT,
    "trustType" TEXT NOT NULL DEFAULT 'community',
    "supportsHome" BOOLEAN NOT NULL DEFAULT false,
    "supportsSearch" BOOLEAN NOT NULL DEFAULT true,
    "supportsGenre" BOOLEAN NOT NULL DEFAULT false,
    "supportsPagination" BOOLEAN NOT NULL DEFAULT false,
    "supportsDetailDescription" BOOLEAN NOT NULL DEFAULT false,
    "supportsBrowserAutomation" BOOLEAN NOT NULL DEFAULT false,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "lastCheckedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Novel_sourceId_idx" ON "Novel"("sourceId");

-- CreateIndex
CREATE INDEX "Novel_syncStatus_idx" ON "Novel"("syncStatus");

-- CreateIndex
CREATE INDEX "Chapter_novelId_status_idx" ON "Chapter"("novelId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_novelId_chapterIndex_key" ON "Chapter"("novelId", "chapterIndex");

-- CreateIndex
CREATE INDEX "SyncRun_novelId_status_idx" ON "SyncRun"("novelId", "status");
