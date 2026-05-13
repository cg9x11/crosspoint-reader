# Task 05 — Library + Export Integration

## Objective

Đưa bản dịch vào library như edition/variant của cùng truyện, hỗ trợ preview và export đúng version publish.

## Scope

- edition section trong library detail
- preview theo edition
- export EPUB/TXT theo edition
- default edition behavior cho web

## Required Changes

### Library behavior
- Trong detail của `Novel`, thêm section `Bản đọc` hoặc `Ấn bản`.
- Hiển thị:
  - bản gốc
  - các project dịch tương ứng như editions
- Với mỗi edition hiển thị:
  - label
  - language
  - progress
  - last updated
  - status

### Default selection
- `Novel` có default edition cho web preview nếu user chọn.
- Gốc luôn còn sẵn như fallback.

### Preview
- Preview chapter cho edition dịch đọc từ `published version` hiện tại.
- Nếu edition không có chapter dịch tương ứng, UI phải báo rõ missing/not translated.

### Export
- Export EPUB/TXT cho edition dịch dùng `published version` của từng chapter.
- Export metadata phải ghi rõ edition label / language / project name.

### Data path
- Tạo artifact path riêng cho edition translation export, không dùng path gốc.

## API
- `GET /api/library/novels/:novelId/editions`
- `PATCH /api/library/novels/:novelId/default-edition`
- `GET /api/library/novels/:novelId/editions/:editionId/chapters/:chapterId/preview`
- `GET /api/library/novels/:novelId/editions/:editionId/export.epub`
- `GET /api/library/novels/:novelId/editions/:editionId/export.txt`

## Acceptance Criteria

- Library detail hiển thị edition gốc/dịch.
- Preview edition dịch đọc đúng published version.
- Export edition dịch đúng nội dung và metadata.

## Validation

- Web preview switch edition pass.
- Export round-trip pass.
- Missing translation UX pass.

## Dependencies

- `01-foundation.md`
- `04-editor.md`
