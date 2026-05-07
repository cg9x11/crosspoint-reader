# XteinkReader Server - Implementation Plan

## 1. Mục tiêu

Kế hoạch này chuyển tài liệu kiến trúc `v4` và đặc tả `UX/UI` thành các workstream triển khai thực tế cho:

- firmware CrossPoint hiện có trong repo này
- hệ thống server/library bên ngoài firmware

Mục tiêu của plan là:

- xác định thứ tự làm việc đúng
- giảm phụ thuộc vòng lặp giữa backend và frontend
- đảm bảo boundary giữa `firmware repo` và `server project` rõ ràng
- đảm bảo phần `Nguồn`, `Thư viện`, `Tiện ích` và `Tác vụ` được dựng trên contract rõ ràng

### 1.1. Điều chỉnh quan trọng sau khi review source

Repo `crosspoint-reader` là firmware `ESP32-C3`, không phải codebase của web server/library server.

Source đã có sẵn:

- OPDS browser
- multi-server OPDS config
- web server/file transfer/settings API trên thiết bị
- EPUB reader với chapter navigation bên trong một EPUB

Thứ còn thiếu là `inter-EPUB series navigation`, tức:

- nhiều file EPUB, mỗi file là một chapter
- đọc `_series.json`
- `next chapter` / `previous chapter` giữa các EPUB
- lưu tiến độ theo `series + chapter index`

Phân tích chi tiết nằm tại:

- [docs/FIRMWARE_SCOPE_REVIEW.md](/d:/6.Work/AI-AGENTS/crosspoint-reader/docs/FIRMWARE_SCOPE_REVIEW.md)

---

## 2. Nguyên tắc triển khai

1. Ưu tiên dựng `data model` và `API contract` trước UI phức tạp.
2. Tách `app` và `worker` từ đầu để tránh refactor lớn sau này.
3. Làm `source browsing` và `extension management` như capability-driven system, không hard-code từng nguồn.
4. Frontend triển khai mobile-first với `iPhone 13 mini` làm baseline.
5. Chỉ mở rộng desktop layout sau khi luồng mobile đã ổn.
6. Mọi phase phải có output kiểm chứng được.
7. Tối ưu mặc định cho `Raspberry Pi 4 8GB`: concurrency thấp, RAM thấp, browser automation hạn chế.

### 2.1. Runtime constraints

Target host là `Raspberry Pi 4 8GB RAM` chạy Docker. Điều này kéo theo:

- không thiết kế theo hướng scale-out nhiều worker
- `Cheerio-first`, `Puppeteer-fallback`
- Redis giữ vai trò tối thiểu, không mở rộng thêm service phụ nếu chưa cần
- mọi phase phải cân nhắc footprint RAM/CPU

---

## 3. Workstreams

Kế hoạch được tách thành 2 lane:

- `Lane A - Firmware`: làm trong repo này
- `Lane B - Server`: làm ở project/library server riêng

### 3.1. Product and UX

- chốt information architecture
- chốt route map
- chốt component model
- chốt empty/loading/error states

### 3.2. Lane A - Firmware integration

- review OPDS client hiện tại
- review reader/session model hiện tại
- implement series manifest ingestion
- implement inter-EPUB next/previous chapter
- implement series-aware progress/resume/recent/sleep
- regression cho EPUB cũ không thuộc series

### 3.3. Lane B - Core backend

- Fastify app shell
- auth/session
- Prisma schema
- REST API admin
- storage abstraction

### 3.4. Queue and worker

- BullMQ queues
- sync scheduler
- chapter pipeline
- retry/backoff
- job status reporting
- low-concurrency tuning for Raspberry Pi

### 3.5. Source and extension platform

- extension registry ingestion
- extension metadata model
- core/community/custom trust model
- source capability model
- source home/search/detail abstraction

### 3.6. OPDS and file publishing

- OPDS feed
- chapter EPUB publish
- `_series.json`
- compatibility validation with firmware contract

### 3.7. Frontend web UI

- app shell
- library screens
- source screens
- task screens
- extension screens
- settings screens

### 3.8. DevOps and operations

- Docker topology
- proxy/TLS
- health/readiness
- logs
- backup/restore
- memory and CPU envelope tuning

---

## 4. Phase plan

## 4. Lane A - Firmware phases

## Firmware Phase A0 - Scope and contract freeze

### Mục tiêu

Chốt contract giữa firmware và library server.

### Phạm vi

- review code hiện có
- chốt `_series.json` schema
- chốt chapter naming/path rules
- chốt session/progress model mới

### Kết quả đầu ra

- firmware contract v1
- danh sách module cần sửa chính xác
- checklist regression cho EPUB cũ

---

## Firmware Phase A1 - Series manifest and download model

### Mục tiêu

Đổi từ mô hình tải một EPUB rời sang mô hình `series-aware`.

### Phạm vi

- sửa download flow OPDS
- lưu chapter vào thư mục series
- ingest `_series.json`
- chuẩn hóa `ch_NNN.epub`

### Kết quả đầu ra

- firmware hiểu được cấu trúc series trên SD
- chapter EPUB được lưu đúng layout

---

## Firmware Phase A2 - Inter-EPUB reader navigation

### Mục tiêu

Thêm `next chapter` / `previous chapter` giữa các file EPUB.

### Phạm vi

- patch `ReaderActivity`
- patch `EpubReaderActivity`
- handoff giữa EPUB hiện tại và EPUB kế/ trước
- fallback khi chapter thiếu

### Kết quả đầu ra

- đọc hết chapter hiện tại có thể sang chapter kế
- quay lại chapter trước hoạt động ổn định

---

## Firmware Phase A3 - Series-aware state and UI

### Mục tiêu

Làm cho resume/recent/sleep hiểu theo series thay vì file đơn.

### Phạm vi

- `CrossPointState`
- `JsonSettingsIO`
- `RecentBooksStore`
- `SleepActivity`
- nếu cần, `RecentBooksActivity` và `HomeActivity`

### Kết quả đầu ra

- resume đúng chapter trong series
- recent books không bị loạn theo từng chapter file
- sleep cover ổn với series

---

## Firmware Phase A4 - Firmware regression

### Mục tiêu

Xác nhận patch series không phá EPUB cũ và OPDS cũ.

### Phạm vi

- test EPUB đơn lẻ cũ
- test OPDS download cũ
- test series nhiều EPUB
- test thiếu chapter / metadata lỗi

### Kết quả đầu ra

- firmware regression checklist pass

---

## 5. Lane B - Server phases

## Phase 0 - Discovery and contract freeze

### Mục tiêu

Chốt contract trước khi code lớn.

### Kết quả đầu ra

- information architecture cuối
- route map frontend
- API surface v1
- Prisma schema v1
- extension metadata contract v1

### Điều kiện hoàn thành

- không còn tranh cãi về menu chính
- rõ API nào phục vụ `Thư viện`, `Nguồn`, `Tiện ích`, `Tác vụ`
- rõ capability model cho source/ext

---

## Phase 1 - Core platform foundation

### Mục tiêu

Dựng xương sống runtime cho app và worker.

### Phạm vi

- Fastify bootstrap
- Prisma setup
- Redis + BullMQ
- auth/session
- storage path config
- health endpoints
- base config for Raspberry Pi resource limits

### Kết quả đầu ra

- app chạy được
- worker chạy được
- DB migrate được
- queue tạo được
- healthcheck trả kết quả

### Phụ thuộc

- Phase 0 hoàn tất

---

## Phase 2 - Source and extension platform

### Mục tiêu

Dựng năng lực quản lý nguồn và extension trước khi làm UI browse hoàn chỉnh.

### Phạm vi

- registry model
- extension install/update/enable/disable
- source capability detection
- extension storage layout
- metadata validation

### Kết quả đầu ra

- có thể thêm registry
- có thể import extension
- extension xuất hiện như source khả dụng
- backend trả được source list theo capability

### Phụ thuộc

- Phase 1

---

## Phase 3 - Crawl and sync pipeline

### Mục tiêu

Làm được luồng đồng bộ truyện từ source đến database và storage.

### Phạm vi

- plugin runtime
- source home/search/detail/toc/chap execution
- sync novel pipeline
- chapter fetch
- parse/sanitize
- error handling
- disable or throttle browser-heavy flows by default

### Kết quả đầu ra

- tìm được truyện từ source
- thêm được truyện vào thư viện
- tải được chapter
- chapter có trạng thái vòng đời rõ ràng

### Phụ thuộc

- Phase 2

---

## Phase 4 - EPUB and OPDS delivery

### Mục tiêu

Xuất bản chapter thành EPUB và phục vụ cho Xteink.

### Phạm vi

- EPUB builder
- temp build path
- atomic publish
- `_series.json`
- OPDS root/library/series/download

### Kết quả đầu ra

- chapter được publish an toàn
- Xteink đọc được OPDS
- naming và metadata tương thích firmware

### Phụ thuộc

- Phase 3

---

## Phase 5 - Frontend core flows

### Mục tiêu

Dựng được các luồng người dùng chính trên mobile và desktop.

### Phạm vi

- app shell
- library list/detail
- source list/home/search/detail
- extension installed/repository/explore
- task queue list
- settings tối thiểu

### Kết quả đầu ra

- user duyệt được source
- user thấy mô tả truyện
- user thêm truyện vào thư viện
- user theo dõi được sync và lỗi
- user quản lý được extension

### Phụ thuộc

- Phase 2, 3, 4

---

## Phase 6 - Hardening and operations

### Mục tiêu

Đưa hệ thống từ trạng thái chạy được sang vận hành ổn định.

### Phạm vi

- structured logs
- backup jobs
- restore checklist
- storage monitoring
- retry tuning
- auth hardening
- production compose/proxy

### Kết quả đầu ra

- deploy được trên server mục tiêu
- có backup định kỳ
- có trạng thái health/ready/log đủ dùng

### Phụ thuộc

- Phase 5

---

## 6. Dependency map

```text
Firmware A0 -> A1 -> A2 -> A3 -> A4

Server 0
  -> Server 1
  -> Server 2
Server 2
  -> Server 3
Server 3
  -> Server 4
Server 2 + Server 3 + Server 4
  -> Server 5
Server 5
  -> Server 6

Shared contract:
  Firmware A0 <-> Server 0
  Firmware A1 <-> Server 4
  Firmware A2/A3 <-> Server 4
```

---

## 7. Ưu tiên triển khai

### Ưu tiên P0 - Firmware

- `_series.json` contract
- download path model
- inter-EPUB next/previous chapter
- series-aware progress/resume
- regression với EPUB cũ

### Ưu tiên P0 - Server

- data model
- source/ext contract
- queue architecture
- auth/session
- source APIs cho browse/search/detail
- Raspberry Pi resource profile

### Ưu tiên P1 - Firmware

- recent/sleep UI theo series
- parser metadata mở rộng nếu cần cho device UX
- telemetry/debug cho series flow

### Ưu tiên P1 - Server

- EPUB publishing
- OPDS feed
- library UI
- source UI
- extension UI

### Ưu tiên P2 - Firmware

- auth support cho OPDS nếu cần
- cache/feed tuning phía firmware

### Ưu tiên P2 - Server

- dashboard polish
- advanced filters
- desktop preview pane
- update channel cho extension

---

## 8. Milestones

### FM1 - Firmware contract frozen

- `_series.json` schema chốt
- module firmware bị ảnh hưởng được map xong

### FM2 - Series-aware download model ready

- chapter EPUB được lưu theo thư mục series
- firmware đọc được manifest

### FM3 - Inter-EPUB chapter navigation works

- `next chapter` / `previous chapter` chạy qua nhiều EPUB

### FM4 - Series-aware state works

- resume/recent/sleep chạy theo series

### FM5 - Firmware regression passes

- EPUB cũ và series mới cùng hoạt động

### M1 - Runtime skeleton

- app + worker + redis chạy được
- DB sẵn sàng
- health/readiness sẵn sàng

### M2 - Source platform ready

- registry add/list
- ext install/enable
- source list trả về capability

### M3 - First novel sync

- search source
- add novel
- fetch chapter
- lưu database

### M4 - First OPDS-compatible publish

- build EPUB
- publish chapter
- Xteink tải được

### M5 - End-to-end web flow

- từ source đến library đến task monitoring

### M6 - Production deployment ready

- proxy/TLS
- backup
- logging
- restore drill

---

## 9. Rủi ro chính

- capability model không đủ tổng quát cho nhiều repo extension
- source home/search trả data không đồng nhất
- Puppeteer làm tăng độ phức tạp vận hành
- UI bị lệ thuộc vào API chưa chốt
- SQLite contention nếu worker concurrency quá cao
- Raspberry Pi thiếu RAM nếu browser automation hoặc nhiều sync chạy đồng thời
- firmware hiện tại dùng `file path` làm identity chính cho open/recent/sleep/progress
- nếu `_series.json` contract không chốt sớm, server và firmware sẽ lệch nhau

---

## 10. Khuyến nghị thực thi

1. Chốt firmware contract trước khi code server publish `_series.json`.
2. Trong repo này, ưu tiên firmware lane trước mọi task server-app không thuộc codebase.
3. Server project phải được tách repo hoặc ít nhất tách backlog riêng.
4. Dựng UI theo dữ liệu thật từ API mock hoặc contract fixtures.
5. Giữ `iPhone 13 mini` làm chuẩn layout chính cho phase đầu frontend của server app.
6. Khóa cấu hình mặc định ở mức nhẹ: `1 app`, `1 worker`, queue concurrency thấp, Puppeteer opt-in.
