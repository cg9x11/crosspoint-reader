# Task 03 — Glossary Workspace

## Objective

Đưa glossary từ khái niệm file-centric của Glossarion thành workspace web-native: editable, import/export, AI suggest, versioned.

## Scope

- glossary table editor
- CSV import/export
- AI suggest candidates
- activate glossary version
- lock/alias/notes support

## Required Changes

### Data behavior
- Mỗi project có nhiều glossary versions.
- Chỉ 1 glossary version active tại một thời điểm.
- Khi activate glossary mới:
  - project config version tăng
  - chapters liên quan mark stale-by-glossary

### CSV format
- Hỗ trợ import gần shape Glossarion:
  - `type`
  - `raw_name`
  - `translated_name`
  - `gender`
  - `description`
- Cho phép cột phụ:
  - `aliases`
  - `notes`
  - `locked`
  - `priority`

### Web editor
- Table editor có:
  - add/remove row
  - inline edit
  - filter theo type/locked
  - bulk import/export
  - duplicate detection UI nhẹ

### AI suggest flow
- Endpoint suggest candidates từ:
  - title
  - description
  - vài chapter đầu
- Kết quả vào bảng candidate review, không auto merge ngay.
- User có thể accept/reject/edit candidate trước khi lưu thành glossary version mới.

### Consistency rules
- Locked entry luôn ưu tiên khi compose prompt.
- Alias map phải collapse về canonical translation.
- Nếu raw name trùng mà translation khác, UI phải báo conflict.

## API
- `GET /api/translations/projects/:projectId/glossaries`
- `POST /api/translations/projects/:projectId/glossaries`
- `PATCH /api/translations/projects/:projectId/glossaries/:glossaryId`
- `POST /api/translations/projects/:projectId/glossaries/:glossaryId/activate`
- `POST /api/translations/projects/:projectId/glossary/import`
- `GET /api/translations/projects/:projectId/glossary/export`
- `POST /api/translations/projects/:projectId/glossary/suggest`

## Acceptance Criteria

- Import CSV tạo glossary version được.
- Edit table trên web lưu được.
- AI suggest tạo candidate set review được.
- Activate glossary mới mark chapters stale đúng.

## Validation

- Import/export round-trip pass.
- Conflict detection pass.
- Locked entry xuất hiện đúng trong prompt snapshot.

## Dependencies

- `01-foundation.md`
- `02-engine.md` cho prompt integration hoàn chỉnh
