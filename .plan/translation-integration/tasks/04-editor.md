# Task 04 — Chapter Editor + Version Manager

## Objective

Cho phép hậu biên tập chapter dịch trực tiếp trên web, quản lý nhiều version, và chọn version nào được publish.

## Scope

- rich text editor
- source/generated/published compare
- create edited version
- publish version selection
- delete version
- retranslate chapter UX

## Required Changes

### Version semantics
- `generated version`: output từ model
- `edited version`: output sau chỉnh tay
- `published version`: version đang dùng cho preview/export/library/OPDS tương lai
- Có thể publish bất kỳ version hợp lệ nào.

### Editor UX
- Rich text editor dùng HTML-safe editing cho chapter content.
- Side-by-side hoặc segmented compare view:
  - source
  - latest generated
  - current published
- Actions:
  - save as edited version
  - set as published
  - discard draft changes
  - retranslate chapter
  - delete non-published version

### Safety rules
- Không được xóa version đang published nếu chưa chọn version thay thế.
- Retranslate tạo version mới, không xóa version cũ.
- Nếu user publish generated mới lên chapter đã từng edit tay, vẫn giữ lịch sử edited version cũ.

### State flags
- `hasManualEdits`
- `newGeneratedAvailable`
- `publishedVersionId`
- `latestGeneratedVersionId`

## API
- `GET /api/translations/projects/:projectId/chapters/:chapterId`
- `GET /api/translations/projects/:projectId/chapters/:chapterId/versions`
- `POST /api/translations/projects/:projectId/chapters/:chapterId/versions`
- `PATCH /api/translations/projects/:projectId/chapters/:chapterId/published-version`
- `DELETE /api/translations/projects/:projectId/chapters/:chapterId/versions/:versionId`
- `POST /api/translations/projects/:projectId/chapters/:chapterId/retranslate`

## Acceptance Criteria

- User sửa chapter dịch trực tiếp trên web được.
- Save edit tạo version mới.
- Chọn published version cập nhật preview/export đúng.
- Retranslate không đè bản sửa tay đang publish.

## Validation

- Published version switch pass.
- Delete rules pass.
- Re-translate after manual edit pass.

## Dependencies

- `01-foundation.md`
- `02-engine.md`
