# Master Plan — Glossarion-style Translation Integration

## Summary

Xây một subsystem dịch web-native cho `server/` hiện tại. Hệ thống dùng external model API, lấy input từ HTML cache gốc, tạo translation project theo từng truyện, quản lý glossary/style/context riêng, cho phép edit trực tiếp chapter dịch, lưu nhiều version của chapter dịch, và gắn bản dịch vào thư viện như edition/variant. Phase đầu ưu tiên web preview + export; model dữ liệu phải sẵn để phase sau publish OPDS đúng edition/version.

## Goals

- Bản dịch đủ ổn để đọc, ít thao tác khởi tạo.
- Cấu hình model/provider/API key/concurrency trên web.
- Có glossary + style per truyện để tránh lệch chap.
- Có thể rebuild sau khi sửa cấu hình.
- Có thể edit trực tiếp chapter đã dịch.
- Có thể chọn version hiển thị / export / OPDS tương lai.
- Có nhiều project/version dịch, nhưng chỉ 1 project active-auto mỗi truyện ở phase đầu.

## Implementation Order

1. Foundation
2. Translation Engine
3. Glossary Workspace
4. Chapter Editor + Version Manager
5. Library + Export Integration
6. OPDS-ready Edition Bridge

## Cross-cutting Rules

- `source_html` là nguồn sự thật đầu vào cho translation.
- `generated_version` và `published_version` phải tách riêng.
- Mọi chapter translation phải snapshot `source checksum`, `project config version`, `glossary version`, `provider/model` lúc chạy.
- Worker translation chạy queue riêng, không làm nghẽn lane crawl/publish gốc.
- Global runtime phải có safety caps cho concurrency và budget.
- Secrets không lưu plaintext trong settings generic path.

## Acceptance Criteria

- Tạo project dịch từ truyện có sẵn trong library.
- Chạy dịch batch và auto dịch chap mới cho project active.
- Có glossary import/export/edit/AI suggest.
- Có rich text editor cho chapter dịch.
- Có thể publish version bất kỳ của chapter dịch.
- Library hiển thị edition gốc/dịch.
- Export EPUB/TXT đúng published edition.
- Dữ liệu sẵn cho phase OPDS selection.

## Task Map

- `tasks/01-foundation.md`
- `tasks/02-engine.md`
- `tasks/03-glossary.md`
- `tasks/04-editor.md`
- `tasks/05-library-export.md`
- `tasks/06-opds-ready.md`
