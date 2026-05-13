# Task 02 — Translation Engine

## Objective

Xây lane dịch nền riêng dùng external model API, lấy input từ HTML cache gốc, tạo generated versions, và auto dịch chap mới cho project active.

## Scope

- queue translation riêng
- provider abstraction
- HTML segmentation + prompt composition
- context/history layer
- version output generation
- retry/backoff/budget guard

## Required Changes

### Queue topology
- Thêm queue mới, ví dụ:
  - `translation-project-run`
  - `translation-chapter`
- Queue này phải tách khỏi lane crawl/fetch/build hiện tại.

### Trigger rules
- Manual run:
  - translate missing chapters
  - retranslate stale chapters
  - retranslate single chapter
- Auto run:
  - sau khi chapter gốc fetch/build thành công
  - nếu novel có project active và `autoTranslateNewChapters=true`
  - enqueue chapter translation job

### Translation input pipeline
- Đọc source từ `getChapterHtmlPath(...)` hoặc abstraction tương đương.
- Chuẩn hóa HTML thành segment ổn định để:
  - giữ heading/paragraph/inline formatting
  - giảm drift khi rebuild
- Mỗi run snapshot:
  - source checksum
  - model/provider
  - prompt snapshot
  - glossary version
  - context policy

### Provider layer
- Tạo adapter thống nhất cho:
  - OpenAI-compatible
  - Gemini hoặc OpenRouter phase đầu
- Contract tối thiểu:
  - `translateHtmlSegments`
  - `summarizeChapterContext`
  - `suggestGlossaryCandidates`
- Provider layer phải hỗ trợ:
  - timeout
  - retry with backoff
  - rate-limit handling
  - cost/token capture

### Context/history
- Hỗ trợ `contextMode`: `off`, `light`, `strong`
- Hỗ trợ `historyDepth`
- Lưu chapter summary ngắn để chap sau dùng lại.
- Không giữ history dài trong RAM; đọc từ persisted summary/state.

### Output versioning
- Mỗi lần dịch tạo `ChapterTranslationVersion` mới với `kind=generated` hoặc `kind=retranslated`.
- Nếu chapter chưa manual edited:
  - có thể promote version mới thành published
- Nếu chapter đã manual edited:
  - giữ published cũ
  - set marker `newGeneratedAvailable=true`

### Stale detection
- Mark chapter stale khi:
  - source checksum đổi
  - glossary active version đổi
  - project prompt/style đổi
  - model/provider đổi nếu policy yêu cầu rebuild

## Acceptance Criteria

- Manual run dịch được batch chapters.
- Chap mới auto enqueue translation đúng project active.
- Mỗi chapter tạo generated version mới.
- Cost/token/error logs được lưu.
- Manual edited chapter không bị auto overwrite.

## Validation

- Test enqueue + worker process pass.
- Simulate provider error/rate-limit pass.
- Verify generated vs published separation pass.

## Dependencies

- `01-foundation.md`
