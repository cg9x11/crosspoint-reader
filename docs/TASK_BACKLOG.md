# XteinkReader Server - Task Backlog

## 1. Cách đọc backlog

- `Priority`: `P0`, `P1`, `P2`
- `Depends on`: task hoặc phase cần xong trước
- `Output`: đầu ra bắt buộc
- `Acceptance`: tiêu chí hoàn thành

### 1.1. Boundary correction

Backlog được tách thành 2 lane:

- `Lane A - Firmware`: làm trong repo `crosspoint-reader`
- `Lane B - Server`: làm ở project/library server riêng

Repo hiện tại đã có:

- OPDS browser
- multi-server OPDS store
- web server/settings API trên thiết bị
- EPUB reader với chapter navigation trong một EPUB

Thiếu chính:

- `inter-EPUB series navigation`
- `_series.json` ingestion
- `series-aware progress/resume/recent/sleep`

Phân tích chi tiết:

- [docs/FIRMWARE_SCOPE_REVIEW.md](/d:/6.Work/AI-AGENTS/crosspoint-reader/docs/FIRMWARE_SCOPE_REVIEW.md)

---

## 2. Lane A - Firmware contract and architecture

### TASK-FW-001 - Chốt `_series.json` contract cho firmware

- Priority: `P0`
- Depends on: none
- Output:
  - schema tối thiểu của `_series.json`
  - naming rule cho `ch_NNN.epub`
- Acceptance:
  - firmware và server dùng cùng contract
  - đủ dữ liệu để resolve `next/previous chapter`

### TASK-FW-002 - Chốt series session model

- Priority: `P0`
- Depends on: TASK-FW-001
- Output:
  - model cho `seriesId`, `chapterIndex`, `chapterPath`, `resume state`
- Acceptance:
  - thay thế được mô hình chỉ dựa vào `openEpubPath`

### TASK-FW-003 - Map module firmware bị ảnh hưởng

- Priority: `P0`
- Depends on: none
- Output:
  - danh sách module và trách nhiệm sửa
- Acceptance:
  - cover đủ các module: browser, parser, reader, state, recent, sleep

---

## 3. Lane A - Firmware implementation

### TASK-FW-101 - Sửa `OpdsBookBrowserActivity` sang series-aware download

- Priority: `P0`
- Depends on: TASK-FW-001, TASK-FW-003
- Output:
  - download flow lưu chapter vào thư mục series
  - naming `ch_NNN.epub`
- Acceptance:
  - không còn lưu tất cả sách OPDS thành file EPUB phẳng ở root
  - code chạm tối thiểu:
    - [src/activities/browser/OpdsBookBrowserActivity.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/browser/OpdsBookBrowserActivity.cpp)
    - [src/activities/browser/OpdsBookBrowserActivity.h](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/browser/OpdsBookBrowserActivity.h)
  - cần quyết định:
    - firmware tự tạo `_series.json` local tối thiểu hay server luôn publish sẵn qua download flow riêng

### TASK-FW-102 - Mở rộng `OpdsParser` nếu cần metadata series

- Priority: `P1`
- Depends on: TASK-FW-001
- Output:
  - parser cho metadata cần thiết ngoài title/author/id/href
- Acceptance:
  - parse được phần metadata firmware thật sự dùng
  - code chạm tối thiểu:
    - [lib/OpdsParser/OpdsParser.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/lib/OpdsParser/OpdsParser.cpp)
    - [lib/OpdsParser/OpdsParser.h](/d:/6.Work/AI-AGENTS/crosspoint-reader/lib/OpdsParser/OpdsParser.h)
  - ghi chú:
    - chỉ thêm field thật sự dùng trên device, tránh parser phình to không cần

### TASK-FW-103 - Thêm series manifest ingestion

- Priority: `P0`
- Depends on: TASK-FW-001, TASK-FW-101
- Output:
  - load/validate `_series.json` từ SD
- Acceptance:
  - firmware resolve được chapter hiện tại, chapter kế, chapter trước
  - code chạm tối thiểu:
    - thêm module mới dưới `src/` hoặc `lib/`
    - được dùng bởi `ReaderActivity` và `EpubReaderActivity`
  - deliverable kỹ thuật:
    - parser manifest
    - model `SeriesManifest`, `SeriesChapter`
    - helper resolve `next/prev/current`

### TASK-FW-104 - Sửa `ReaderActivity` để mở theo series context

- Priority: `P0`
- Depends on: TASK-FW-002, TASK-FW-103
- Output:
  - reader entrypoint hỗ trợ `series + chapter` thay vì path đơn thuần
- Acceptance:
  - có thể mở chapter trong series bằng context đã chuẩn hóa
  - code chạm tối thiểu:
    - [src/activities/reader/ReaderActivity.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/reader/ReaderActivity.cpp)
    - [src/activities/reader/ReaderActivity.h](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/reader/ReaderActivity.h)
    - [src/activities/ActivityManager.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/ActivityManager.cpp)
    - [src/activities/ActivityManager.h](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/ActivityManager.h)
  - ghi chú:
    - cần giữ backward compatibility với `goToReader(path)` cho EPUB cũ

### TASK-FW-105 - Sửa `EpubReaderActivity` cho `next/previous chapter` liên EPUB

- Priority: `P0`
- Depends on: TASK-FW-104
- Output:
  - handoff giữa chapter EPUB hiện tại và chapter EPUB kế/trước
- Acceptance:
  - đọc hết chapter sang chapter kế
  - ở đầu chapter có thể quay chapter trước
  - code chạm tối thiểu:
    - [src/activities/reader/EpubReaderActivity.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/reader/EpubReaderActivity.cpp)
    - [src/activities/reader/EpubReaderActivity.h](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/reader/EpubReaderActivity.h)
  - điểm kỹ thuật cần chốt:
    - trigger sang chapter kế khi user page-turn ở end-of-book screen hay ngay khi vượt spine cuối
    - mở chapter trước ở last page khi page-turn ngược từ đầu chapter

### TASK-FW-106 - Sửa `CrossPointState` + `JsonSettingsIO` sang series-aware resume

- Priority: `P0`
- Depends on: TASK-FW-002, TASK-FW-104
- Output:
  - state mới cho resume series
- Acceptance:
  - resume đúng chapter và không phụ thuộc riêng vào `openEpubPath`
  - code chạm tối thiểu:
    - [src/CrossPointState.h](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/CrossPointState.h)
    - [src/CrossPointState.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/CrossPointState.cpp)
    - [src/JsonSettingsIO.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/JsonSettingsIO.cpp)
    - [src/main.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/main.cpp)
  - migration:
    - phải giữ load được state cũ chỉ có `openEpubPath`

### TASK-FW-107 - Sửa `RecentBooksStore` sang series-aware

- Priority: `P1`
- Depends on: TASK-FW-106
- Output:
  - recent item theo series identity
- Acceptance:
  - recent books không bị đầy bởi từng chapter file
  - code chạm tối thiểu:
    - [src/RecentBooksStore.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/RecentBooksStore.cpp)
    - [src/RecentBooksStore.h](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/RecentBooksStore.h)
    - [src/JsonSettingsIO.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/JsonSettingsIO.cpp)
    - [src/activities/home/RecentBooksActivity.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/home/RecentBooksActivity.cpp)
  - ghi chú:
    - nếu chưa refactor xong model recent, phase đầu có thể dedupe theo `seriesId`

### TASK-FW-108 - Sửa `SleepActivity` cho cover theo series

- Priority: `P1`
- Depends on: TASK-FW-106
- Output:
  - sleep cover resolve theo series hoặc chapter hiện tại
- Acceptance:
  - sleep screen vẫn hiển thị cover đúng sau khi chuyển sang series-aware state
  - code chạm tối thiểu:
    - [src/activities/boot_sleep/SleepActivity.cpp](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/boot_sleep/SleepActivity.cpp)
  - ghi chú:
    - ưu tiên dùng `openChapterPath`
    - nếu có `coverPath` trong manifest thì dùng nó

### TASK-FW-109 - Fallback cho chapter thiếu hoặc manifest lỗi

- Priority: `P1`
- Depends on: TASK-FW-105
- Output:
  - error handling khi thiếu file hoặc `_series.json` hỏng
- Acceptance:
  - firmware không crash hoặc treo
  - user có trạng thái lỗi hợp lý
  - code chạm:
    - parser manifest
    - `ReaderActivity`
    - `EpubReaderActivity`
  - behavior:
    - fallback về mở EPUB đơn lẻ nếu có thể
    - disable inter-EPUB navigation khi metadata hỏng

### TASK-FW-110 - Regression với EPUB cũ và OPDS cũ

- Priority: `P0`
- Depends on: TASK-FW-105, TASK-FW-106, TASK-FW-109
- Output:
  - checklist test pass cho EPUB đơn lẻ cũ và series mới
- Acceptance:
  - không phá reader EPUB hiện có
  - `next/previous chapter` series mới hoạt động
  - test matrix tối thiểu:
    - EPUB cũ mở trực tiếp từ file browser
    - EPUB tải từ OPDS cũ
    - series mới có đủ manifest + nhiều chapter
    - thiếu chapter kế
    - `_series.json` lỗi cú pháp

---

## 4. Lane B - Server product and architecture

### TASK-001 - Chốt route map frontend

- Priority: `P0`
- Depends on: none
- Output:
  - route map cho `Thư viện`, `Nguồn`, `Tác vụ`, `Tiện ích`, `Cài đặt`
  - route detail cho source novel và library novel
- Acceptance:
  - route map không chồng chéo
  - mobile và desktop dùng cùng cấu trúc thông tin

### TASK-002 - Chốt API contract v1

- Priority: `P0`
- Depends on: TASK-001
- Output:
  - danh sách endpoint cần cho frontend
  - payload mẫu cho library/source/extensions/tasks/settings
- Acceptance:
  - đủ contract cho frontend không phải đoán field
  - tách rõ local search và remote search

### TASK-003 - Chốt source capability model

- Priority: `P0`
- Depends on: none
- Output:
  - schema cho `supportsHome`, `supportsSearch`, `supportsGenre`, `supportsPagination`, `supportsDetailDescription`
- Acceptance:
  - mọi source có thể map vào model này
  - frontend render được UI theo capability

### TASK-004 - Chốt extension trust model

- Priority: `P0`
- Depends on: none
- Output:
  - rule cho `Core`, `Community`, `Custom`
  - metadata tối thiểu để hiển thị
- Acceptance:
  - UI có thể phân biệt rõ ext gốc và ext cài thêm

---

## 5. Lane B - Backend foundation

### TASK-100 - Chốt resource profile cho Raspberry Pi 4

- Priority: `P0`
- Depends on: none
- Output:
  - default memory/concurrency profile cho `app`, `worker`, `redis`, `proxy`
  - rule bật/tắt Puppeteer
- Acceptance:
  - có cấu hình mặc định nhẹ cho host `Raspberry Pi 4 8GB`
  - frontend/backend không giả định tài nguyên dư

### TASK-101 - Bootstrap Fastify app

- Priority: `P0`
- Depends on: TASK-002
- Output:
  - app shell
  - route modules
  - config loader
- Acceptance:
  - app khởi động được
  - có route `/healthz`

### TASK-102 - Setup Prisma + SQLite schema v1

- Priority: `P0`
- Depends on: TASK-002
- Output:
  - `schema.prisma`
  - migration đầu tiên
- Acceptance:
  - có bảng `Novel`, `Chapter`, `SyncRun`, `PluginSource`, `AppSetting`
  - migrate chạy được trên máy dev

### TASK-103 - Setup auth/session

- Priority: `P0`
- Depends on: TASK-101
- Output:
  - login/logout
  - session middleware
  - protected admin routes
- Acceptance:
  - `/api/*` ngoài login yêu cầu auth
  - session hoạt động ổn định

### TASK-104 - Storage abstraction

- Priority: `P0`
- Depends on: TASK-101
- Output:
  - module quản lý path cho database/cache/opds/temp/logs
- Acceptance:
  - không hard-code path rải rác
  - tạo được folder nếu thiếu

### TASK-105 - Readyz integration

- Priority: `P1`
- Depends on: TASK-101, TASK-102
- Output:
  - `/readyz`
  - check DB, Redis, storage
- Acceptance:
  - trả fail nếu một dependency không sẵn sàng

### TASK-106 - ARM64 compatibility check

- Priority: `P0`
- Depends on: TASK-101, TASK-102
- Output:
  - xác nhận dependency chạy được trên Raspberry Pi Docker image
- Acceptance:
  - Prisma, Chromium/Puppeteer, Redis client, native deps đều có hướng build/run rõ ràng trên ARM64

---

## 6. Lane B - Queue and worker

### TASK-201 - Setup Redis + BullMQ

- Priority: `P0`
- Depends on: TASK-101
- Output:
  - queue factory
  - shared Redis connection
- Acceptance:
  - enqueue/dequeue được ít nhất một job mẫu

### TASK-202 - Bootstrap worker process

- Priority: `P0`
- Depends on: TASK-201
- Output:
  - worker entrypoint
  - queue consumers
- Acceptance:
  - worker chạy độc lập với app

### TASK-203 - Job lifecycle model

- Priority: `P0`
- Depends on: TASK-102, TASK-201
- Output:
  - mapping giữa job state và DB state
- Acceptance:
  - `Novel.syncStatus` và `Chapter.status` được cập nhật nhất quán

### TASK-204 - Retry and backoff policy

- Priority: `P1`
- Depends on: TASK-202
- Output:
  - retry policy cho sync/fetch/build
- Acceptance:
  - retry được cấu hình theo queue type

### TASK-206 - Low-concurrency worker tuning

- Priority: `P0`
- Depends on: TASK-202, TASK-203, TASK-100
- Output:
  - cấu hình concurrency thấp cho sync/fetch/build
- Acceptance:
  - worker mặc định chạy an toàn trên Raspberry Pi 4 8GB
  - không tạo nhiều job chạy song song ngoài dự kiến

### TASK-205 - Scheduled sync trigger

- Priority: `P1`
- Depends on: TASK-202, TASK-203
- Output:
  - scheduler tạo sync jobs định kỳ
- Acceptance:
  - sync theo cron hoạt động
  - không enqueue trùng cho cùng novel

---

## 7. Lane B - Extension and source platform

### TASK-301 - Extension metadata schema

- Priority: `P0`
- Depends on: TASK-003, TASK-004
- Output:
  - schema validate metadata ext/registry
- Acceptance:
  - parse được metadata tối thiểu từ ext core và ext community

### TASK-302 - Registry management API

- Priority: `P0`
- Depends on: TASK-101, TASK-301
- Output:
  - add/list/remove/refresh registry
- Acceptance:
  - thêm được registry URL
  - lưu được trạng thái fetch cuối

### TASK-303 - Extension install/enable/disable API

- Priority: `P0`
- Depends on: TASK-302
- Output:
  - install ext từ registry
  - enable/disable ext
- Acceptance:
  - ext đã bật xuất hiện trong source list

### TASK-304 - Source list API

- Priority: `P0`
- Depends on: TASK-303
- Output:
  - endpoint trả source theo capability và trust type
- Acceptance:
  - frontend render được source browser entry screen

### TASK-305 - Source capability resolution

- Priority: `P1`
- Depends on: TASK-303
- Output:
  - resolver xác định source có `home/search/genre/detail`
- Acceptance:
  - source thiếu `home` vẫn browse được theo fallback

### TASK-306 - Lightweight source priority rules

- Priority: `P1`
- Depends on: TASK-305
- Output:
  - rule đánh dấu source `html-static-preferred` hoặc `js-heavy`
- Acceptance:
  - scheduler và UI có thể phân biệt nguồn nhẹ và nguồn nặng

---

## 8. Lane B - Crawl pipeline

### TASK-401 - Plugin runtime execution layer

- Priority: `P0`
- Depends on: TASK-303, TASK-202
- Output:
  - runtime load script ext
  - sandbox/timeouts cơ bản
- Acceptance:
  - gọi được function `search`, `getDetail`, `getChapterList`, `getChapterContent`

### TASK-406 - Puppeteer fallback gate

- Priority: `P0`
- Depends on: TASK-401, TASK-100
- Output:
  - config bật/tắt Puppeteer theo môi trường
  - giới hạn browser concurrency
- Acceptance:
  - source JS-heavy không làm cạn tài nguyên mặc định
  - có thể chạy chế độ `no-browser` nếu cần

### TASK-402 - Source home/search/detail APIs

- Priority: `P0`
- Depends on: TASK-401, TASK-304
- Output:
  - endpoint browse `home`
  - endpoint `search`
  - endpoint `detail`
- Acceptance:
  - frontend lấy được dữ liệu thật từ source

### TASK-403 - Add novel to library flow

- Priority: `P0`
- Depends on: TASK-402, TASK-102
- Output:
  - API thêm truyện từ source vào DB
- Acceptance:
  - truyện mới xuất hiện trong thư viện

### TASK-404 - Chapter list sync

- Priority: `P0`
- Depends on: TASK-403, TASK-202
- Output:
  - fetch và upsert chapter list
- Acceptance:
  - tạo chapter records đúng index

### TASK-405 - Chapter content fetch and sanitize

- Priority: `P1`
- Depends on: TASK-404
- Output:
  - fetch raw content
  - sanitize HTML
- Acceptance:
  - chapter content hợp lệ để đưa sang EPUB builder

---

## 9. Lane B - EPUB and OPDS

### TASK-501 - EPUB builder module

- Priority: `P0`
- Depends on: TASK-405
- Output:
  - builder tạo EPUB per chapter
- Acceptance:
  - tạo được file EPUB hợp lệ với mimetype đúng chuẩn

### TASK-506 - Memory-safe EPUB build path

- Priority: `P1`
- Depends on: TASK-501
- Output:
  - builder tránh giữ nội dung/chapter lớn trong RAM quá lâu
- Acceptance:
  - build chapter theo hướng stream hoặc buffer nhỏ, phù hợp Raspberry Pi

### TASK-502 - Atomic publish flow

- Priority: `P0`
- Depends on: TASK-501, TASK-104
- Output:
  - temp build path
  - rename sang public path
- Acceptance:
  - không có file dở dang trong `opds/`

### TASK-503 - `_series.json` generator

- Priority: `P1`
- Depends on: TASK-502
- Output:
  - metadata file cho mỗi series
- Acceptance:
  - firmware đọc đúng danh sách chapter

### TASK-504 - OPDS feed API

- Priority: `P0`
- Depends on: TASK-502
- Output:
  - `/opds`
  - `/opds/library`
  - `/opds/series/:novelId`
  - `/opds/download/:novelId/:chapterIndex`
- Acceptance:
  - feed hợp lệ
  - file download được

### TASK-505 - Xteink compatibility verification

- Priority: `P1`
- Depends on: TASK-503, TASK-504
- Output:
  - checklist tương thích
- Acceptance:
  - chapter tải và nhảy series đúng

---

## 10. Lane B - Frontend shell and shared UI

### TASK-601 - Frontend app shell

- Priority: `P0`
- Depends on: TASK-001, TASK-002
- Output:
  - route shell
  - nav mobile/desktop
  - auth guard
- Acceptance:
  - có menu `Thư viện`, `Nguồn`, `Tác vụ`, `Tiện ích`, `Cài đặt`

### TASK-602 - Responsive layout baseline

- Priority: `P0`
- Depends on: TASK-601
- Output:
  - mobile-first layout
  - breakpoints cho tablet/desktop
- Acceptance:
  - dùng ổn trên `iPhone 13 mini`

### TASK-604 - Lightweight frontend delivery

- Priority: `P1`
- Depends on: TASK-601, TASK-602
- Output:
  - chiến lược bundle nhẹ, lazy load theo route
- Acceptance:
  - web UI không quá nặng khi phục vụ từ Raspberry Pi

### TASK-603 - Shared components

- Priority: `P1`
- Depends on: TASK-602
- Output:
  - `NovelCard`
  - `StatusBadge`
  - `SearchBar`
  - `SectionHeader`
  - `EmptyState`
- Acceptance:
  - dùng lại được ở library/source/extensions

---

## 11. Lane B - Frontend - Library

### TASK-701 - Library list screen

- Priority: `P0`
- Depends on: TASK-601, TASK-002
- Output:
  - search local
  - filter trạng thái
  - list truyện đang theo dõi
- Acceptance:
  - hiển thị progress, source, sync status

### TASK-702 - Library detail screen

- Priority: `P1`
- Depends on: TASK-701
- Output:
  - chi tiết truyện local
  - action sync/retry/delete
- Acceptance:
  - hiển thị được lỗi gần nhất và chapter mới

---

## 12. Lane B - Frontend - Sources

### TASK-801 - Source entry screen

- Priority: `P0`
- Depends on: TASK-304, TASK-601
- Output:
  - list source theo nhóm `Core`, `Community`, `Custom`
- Acceptance:
  - source bật mới hiển thị

### TASK-802 - Source home screen

- Priority: `P0`
- Depends on: TASK-402, TASK-801
- Output:
  - section `Trang chủ`
  - feed theo source
- Acceptance:
  - source hỗ trợ `home` hiển thị nội dung ngay

### TASK-803 - Source search screen

- Priority: `P0`
- Depends on: TASK-402
- Output:
  - remote search UI
- Acceptance:
  - loading, empty, error state rõ

### TASK-804 - Source detail screen

- Priority: `P0`
- Depends on: TASK-402, TASK-403
- Output:
  - mô tả đầy đủ
  - metadata
  - CTA thêm vào thư viện
- Acceptance:
  - user thêm truyện được từ detail

### TASK-805 - Source genre/category screen

- Priority: `P2`
- Depends on: TASK-305, TASK-802
- Output:
  - browse theo thể loại
- Acceptance:
  - chỉ hiển thị khi source có capability tương ứng

---

## 13. Lane B - Frontend - Extensions

### TASK-901 - Installed extensions screen

- Priority: `P0`
- Depends on: TASK-303, TASK-601
- Output:
  - list ext đã cài
  - enable/disable/update actions
- Acceptance:
  - hiển thị trust type, version, repo, status

### TASK-902 - Registry list screen

- Priority: `P0`
- Depends on: TASK-302
- Output:
  - list kho ext
  - refresh/add/remove
- Acceptance:
  - thấy trạng thái online/offline và lần sync cuối

### TASK-903 - Add registry flow

- Priority: `P0`
- Depends on: TASK-902
- Output:
  - form nhập URL registry
  - validate trước khi thêm
- Acceptance:
  - thêm được kho mới từ URL

### TASK-904 - Explore extensions screen

- Priority: `P1`
- Depends on: TASK-302, TASK-303
- Output:
  - search/filter ext trong kho
- Acceptance:
  - cài ext trực tiếp từ màn khám phá

---

## 14. Lane B - Frontend - Tasks and Settings

### TASK-1001 - Task monitoring screen

- Priority: `P1`
- Depends on: TASK-203, TASK-601
- Output:
  - list job đang chạy/thất bại
  - retry action
- Acceptance:
  - user nhìn thấy job nào lỗi và retry được

### TASK-1002 - Settings baseline screen

- Priority: `P2`
- Depends on: TASK-103
- Output:
  - thông tin hệ thống
  - sync schedule
  - storage summary
- Acceptance:
  - hiển thị đủ thông tin cấu hình tối thiểu

---

## 15. Lane B - DevOps and operations

### TASK-1101 - Docker compose production topology

- Priority: `P1`
- Depends on: TASK-101, TASK-202
- Output:
  - compose cho `proxy`, `app`, `worker`, `redis`
- Acceptance:
  - chạy được toàn stack local/prod-like

### TASK-1105 - Raspberry Pi resource limits

- Priority: `P0`
- Depends on: TASK-1101, TASK-100
- Output:
  - memory limits và env defaults cho Docker services
- Acceptance:
  - compose có cấu hình giới hạn RAM hợp lý cho `app`, `worker`, `redis`

### TASK-1106 - Runtime resource monitoring

- Priority: `P1`
- Depends on: TASK-1102, TASK-1105
- Output:
  - cách quan sát RAM/CPU tối thiểu cho app và worker
- Acceptance:
  - có thể phát hiện source hoặc job gây tăng RAM bất thường

### TASK-1102 - Structured logging

- Priority: `P1`
- Depends on: TASK-101, TASK-202
- Output:
  - log format thống nhất
- Acceptance:
  - log có `service`, `jobId` hoặc `requestId`

### TASK-1103 - Backup job

- Priority: `P1`
- Depends on: TASK-102, TASK-104
- Output:
  - backup DB và OPDS
- Acceptance:
  - tạo được backup định kỳ

### TASK-1104 - Restore checklist and drill

- Priority: `P2`
- Depends on: TASK-1103
- Output:
  - tài liệu restore và kiểm tra sau restore
- Acceptance:
  - có thể chạy restore test một lần end-to-end

---

## 16. Đề xuất thứ tự bắt đầu

### Firmware first

1. TASK-FW-001
2. TASK-FW-002
3. TASK-FW-003
4. TASK-FW-101
5. TASK-FW-103
6. TASK-FW-104
7. TASK-FW-105
8. TASK-FW-106
9. TASK-FW-109
10. TASK-FW-110
11. TASK-FW-107
12. TASK-FW-108

### Server second

13. TASK-001
14. TASK-002
15. TASK-003
16. TASK-004
17. TASK-100
18. TASK-101
19. TASK-102
20. TASK-106
21. TASK-201
22. TASK-202
23. TASK-206
24. TASK-301
25. TASK-302
26. TASK-303
27. TASK-304
28. TASK-401
29. TASK-402
30. TASK-403
31. TASK-404
32. TASK-501
33. TASK-502
34. TASK-503
35. TASK-504
36. TASK-601
37. TASK-602
38. TASK-701
39. TASK-801
40. TASK-802
41. TASK-803
42. TASK-804
43. TASK-901
44. TASK-902
45. TASK-903
46. TASK-1001
