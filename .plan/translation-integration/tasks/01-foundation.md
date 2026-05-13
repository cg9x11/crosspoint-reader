# Task 01 — Foundation

## Objective

Đặt nền schema, settings, shell UI, và runtime boundaries cho subsystem dịch.

## Scope

- Prisma schema cho translation project / glossary / chapter translation / versions / edition
- secure settings cho provider/model credentials và runtime caps
- thêm page `Bản Dịch` vào web shell hiện tại
- thêm API shell cho project list/create/detail/update

## Required Changes

### Data model
- Thêm `TranslationProject`
- Thêm `TranslationProjectConfigVersion` hoặc trường versioning tương đương
- Thêm `TranslationGlossary`
- Thêm `TranslationGlossaryEntry`
- Thêm `ChapterTranslation`
- Thêm `ChapterTranslationVersion`
- Thêm `TranslationRun`
- Thêm `NovelEdition` hoặc model edition tương đương

### Suggested minimum fields
- `TranslationProject`: `id`, `novelId`, `name`, `targetLanguage`, `provider`, `model`, `systemPrompt`, `styleGuideJson`, `contextMode`, `historyDepth`, `autoTranslateNewChapters`, `chapterConcurrency`, `isActiveAuto`, `status`, timestamps
- `TranslationGlossary`: `id`, `projectId`, `version`, `sourceType`, `rawPayload`, `isActive`, timestamps
- `TranslationGlossaryEntry`: `id`, `glossaryId`, `type`, `rawName`, `translatedName`, `gender`, `description`, `aliasesJson`, `notes`, `locked`, `priority`
- `ChapterTranslation`: `id`, `projectId`, `chapterId`, `sourceChecksum`, `status`, `currentPublishedVersionId`, `latestGeneratedVersionId`, `hasManualEdits`, `staleReason`, timestamps
- `ChapterTranslationVersion`: `id`, `chapterTranslationId`, `versionNumber`, `kind`, `htmlPath`, `textPath`, `summary`, `provider`, `model`, `promptSnapshot`, `glossaryVersion`, `sourceChecksum`, `isPublished`, `createdBy`, timestamps
- `TranslationRun`: `id`, `projectId`, `triggerType`, `scope`, `status`, `queuedCount`, `completedCount`, `failedCount`, `tokenUsage`, `estimatedCost`, `errorMessage`, timestamps
- `NovelEdition`: `id`, `novelId`, `kind`, `projectId?`, `label`, `language`, `isDefault`, `status`, timestamps

### Settings lane
- Tạo settings riêng cho translation runtime, không dùng generic visible `AppSetting` path cho secrets.
- Hỗ trợ:
  - provider credentials
  - provider enable/disable
  - global max active projects
  - global max chapter concurrency
  - token/cost guard
  - request timeout / retry caps

### UI shell
- Thêm `Translations` page vào sidebar/theme shell.
- Thêm state management frontend cho page mới.
- Thêm list screen cho projects.
- Thêm create project drawer/modal.

### API shell
- `GET /api/translations/projects`
- `POST /api/translations/projects`
- `GET /api/translations/projects/:projectId`
- `PATCH /api/translations/projects/:projectId`
- `GET /api/translations/settings`
- `PATCH /api/translations/settings`

## Decisions Locked

- Có thể có nhiều project/version dịch, nhưng chỉ 1 `isActiveAuto=true` mỗi truyện.
- Edition gắn cùng novel, không tạo novel riêng.
- Secrets phải có lớp bảo vệ riêng.

## Acceptance Criteria

- Schema migrate được.
- Tạo project được từ UI.
- Settings translation runtime đổi được trên web.
- Sidebar có page `Bản Dịch`.
- Library model đã sẵn cho edition.

## Validation

- Prisma generate/build pass.
- API create/list/detail/update project pass.
- UI hiển thị project list rỗng/đã có dữ liệu.

## Dependencies

- Không phụ thuộc task khác.
