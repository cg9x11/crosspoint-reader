# Translation Integration Plan

Mục tiêu: tích hợp lane dịch truyện kiểu Glossarion vào web `online-library.noe.asia` theo hướng web-native, giữ bản gốc, tạo bản dịch riêng, hỗ trợ version, edit tay, export, và chuẩn bị sẵn cho OPDS edition download sau này.

## Cấu trúc

- `plan.md`: master plan và thứ tự triển khai
- `tasks/01-foundation.md`: schema, settings, shell UI, project model
- `tasks/02-engine.md`: queue dịch, provider layer, build version
- `tasks/03-glossary.md`: glossary editor, import/export, AI suggest
- `tasks/04-editor.md`: editor chapter, version switching, publish version
- `tasks/05-library-export.md`: edition in library, preview, export
- `tasks/06-opds-ready.md`: chuẩn bị edition artifacts cho OPDS phase sau

## Quy tắc triển khai

- Dịch luôn từ HTML cache gốc, không dịch từ file publish text.
- Không ghi đè artifact gốc.
- Manual edit luôn thắng generated output cho bản đang publish.
- Rebuild tạo version mới, không tự đè publish version nếu chapter đã sửa tay.
- Cấu hình model/provider/concurrency đổi trên web, không cần redeploy.
- Phase đầu có thể có nhiều project/version dịch, nhưng chỉ 1 project active-auto mỗi truyện.

## Deliverable cuối phase đầu

- Menu `Bản Dịch` hoạt động trên web.
- Tạo project dịch từ truyện đã có trong thư viện.
- Glossary editable trên web, có AI suggest.
- Chapter translation có generated/published/manual versions.
- Library hiển thị edition gốc/dịch.
- Export EPUB/TXT theo edition dịch.
- Data model sẵn cho OPDS chọn bản gốc/dịch1/dịch2/dịch3 về sau.
