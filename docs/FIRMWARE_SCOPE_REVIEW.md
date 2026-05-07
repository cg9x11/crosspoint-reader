# CrossPoint Reader - Firmware Scope Review for Chapter-Series OPDS

## 1. Kết luận ngắn

Source hiện tại đã có sẵn:

- OPDS browser
- quản lý nhiều OPDS server
- basic auth cho OPDS server
- web server và web API cấu hình trên thiết bị
- EPUB reader đầy đủ với chapter navigation bên trong một EPUB
- cache, progress, recent books, sleep cover theo file EPUB

Điểm chưa có là:

- mô hình `series` gồm nhiều file EPUB, mỗi file là một chapter
- `next chapter` / `previous chapter` giữa nhiều EPUB độc lập
- đọc `_series.json`
- lưu tiến độ theo `series + chapter index` thay vì chỉ theo `file path`

Vì vậy, task firmware không phải là viết mới reader hoặc OPDS browser từ đầu. Task thật là thêm `inter-EPUB series navigation`.

---

## 2. Module đã có thể tận dụng

## 2.1. OPDS browser

`OpdsBookBrowserActivity` đã xử lý:

- kiểm tra và kết nối WiFi
- fetch feed OPDS
- điều hướng feed
- search
- tải file EPUB

Tham chiếu:

- [src/activities/browser/OpdsBookBrowserActivity.cpp:23](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/browser/OpdsBookBrowserActivity.cpp:23)
- [src/activities/browser/OpdsBookBrowserActivity.cpp:182](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/browser/OpdsBookBrowserActivity.cpp:182)
- [src/activities/browser/OpdsBookBrowserActivity.cpp:257](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/browser/OpdsBookBrowserActivity.cpp:257)

## 2.2. OPDS parser

`OpdsParser` đã parse:

- navigation/feed entry
- acquisition EPUB link
- search template
- next/previous page
- title/author/id

Tham chiếu:

- [lib/OpdsParser/OpdsParser.cpp:90](/d:/6.Work/AI-AGENTS/crosspoint-reader/lib/OpdsParser/OpdsParser.cpp:90)
- [lib/OpdsParser/OpdsParser.cpp:133](/d:/6.Work/AI-AGENTS/crosspoint-reader/lib/OpdsParser/OpdsParser.cpp:133)

## 2.3. OPDS server persistence

`OpdsServerStore` đã hỗ trợ:

- multi-server
- migration từ single-server cũ
- save/load JSON

Tham chiếu:

- [src/OpdsServerStore.cpp:22](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/OpdsServerStore.cpp:22)
- [src/OpdsServerStore.cpp:47](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/OpdsServerStore.cpp:47)
- [src/OpdsServerStore.cpp:74](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/OpdsServerStore.cpp:74)

## 2.4. Web server và settings API trên thiết bị

Firmware đã có sẵn:

- web UI file transfer
- settings API
- OPDS server CRUD API

Tham chiếu:

- [src/network/CrossPointWebServer.cpp:134](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/network/CrossPointWebServer.cpp:134)
- [src/network/CrossPointWebServer.cpp:159](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/network/CrossPointWebServer.cpp:159)
- [src/network/CrossPointWebServer.cpp:1255](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/network/CrossPointWebServer.cpp:1255)

## 2.5. EPUB reader

`EpubReaderActivity` đã có:

- đọc EPUB theo `spineIndex`
- page turn trong chapter
- chuyển chapter trong cùng EPUB
- save progress theo `progress.bin`
- silent indexing chapter kế tiếp trong cùng EPUB

Tham chiếu:

- [src/activities/reader/EpubReaderActivity.cpp:62](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/reader/EpubReaderActivity.cpp:62)
- [src/activities/reader/EpubReaderActivity.cpp:488](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/reader/EpubReaderActivity.cpp:488)
- [src/activities/reader/EpubReaderActivity.cpp:688](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/reader/EpubReaderActivity.cpp:688)
- [src/activities/reader/EpubReaderActivity.cpp:720](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/reader/EpubReaderActivity.cpp:720)

---

## 3. Chỗ thật sự thiếu

## 3.1. Download flow hiện chỉ lưu một file EPUB độc lập

Hiện tại download từ OPDS ghi trực tiếp thành:

- `/<author - title>.epub`

Nó không biết:

- series folder
- chapter index
- `_series.json`
- chapter kế tiếp

Tham chiếu:

- [src/activities/browser/OpdsBookBrowserActivity.cpp:263](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/browser/OpdsBookBrowserActivity.cpp:263)

## 3.2. Reader/session model khóa vào một file path

Các module sau đều lấy `file path` làm identity chính:

- `APP_STATE.openEpubPath`
- `RecentBooksStore`
- `ReaderActivity::goToReader(path)`
- `SleepActivity`

Tham chiếu:

- [src/CrossPointState.h:12](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/CrossPointState.h:12)
- [src/JsonSettingsIO.cpp:70](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/JsonSettingsIO.cpp:70)
- [src/activities/ActivityManager.cpp:193](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/ActivityManager.cpp:193)
- [src/activities/reader/ReaderActivity.cpp:94](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/reader/ReaderActivity.cpp:94)
- [src/RecentBooksStore.cpp:23](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/RecentBooksStore.cpp:23)
- [src/activities/boot_sleep/SleepActivity.cpp:227](/d:/6.Work/AI-AGENTS/crosspoint-reader/src/activities/boot_sleep/SleepActivity.cpp:227)

## 3.3. OPDS parser chưa parse metadata giàu

Nếu muốn UI/UX tốt hơn trên thiết bị, parser hiện còn thiếu:

- summary/description
- image/cover
- series-specific metadata
- custom links ngoài acquisition/navigation

Tham chiếu:

- [lib/OpdsParser/OpdsParser.cpp:99](/d:/6.Work/AI-AGENTS/crosspoint-reader/lib/OpdsParser/OpdsParser.cpp:99)
- [lib/OpdsParser/OpdsParser.cpp:111](/d:/6.Work/AI-AGENTS/crosspoint-reader/lib/OpdsParser/OpdsParser.cpp:111)

---

## 4. Module cần sửa cho flow `_series.json -> next chapter -> progress`

## 4.1. Nhóm bắt buộc

### A. `OpdsBookBrowserActivity`

Lý do:

- cần đổi cách đặt tên/lưu chapter EPUB
- có thể cần tải thêm hoặc resolve metadata series

Khả năng sửa:

- lưu vào thư mục series
- đặt tên `ch_NNN.epub`
- sau download, mở đúng chapter đầu hoặc cập nhật manifest local

### B. `OpdsParser`

Lý do:

- nếu server đưa metadata series qua OPDS entry hoặc extension tags, firmware phải parse được phần cần thiết

Khả năng sửa:

- parse extra metadata
- parse cover/summary nếu dùng cho UI

### C. `ReaderActivity`

Lý do:

- hiện chỉ nhận `path`
- cần biết khi nào open một chapter thuộc series

Khả năng sửa:

- thêm khái niệm `reader session context`
- load từ `series context` thay vì chỉ `epub path`

### D. `EpubReaderActivity`

Lý do:

- hiện chapter navigation chỉ trong một EPUB
- cần thêm handoff sang EPUB khác

Khả năng sửa:

- detect end-of-file và resolve chapter kế
- detect beginning-of-file và resolve chapter trước
- lưu tiến độ series-aware

### E. `CrossPointState` + `JsonSettingsIO`

Lý do:

- `openEpubPath` hiện không đủ để resume series session

Khả năng sửa:

- thêm session fields như `openSeriesId`, `openChapterPath`, `openChapterIndex`

### F. `RecentBooksStore`

Lý do:

- recent book hiện lưu theo file path
- series nhiều file chapter sẽ làm recent bị loạn nếu giữ nguyên

Khả năng sửa:

- lưu recent theo series identity
- title/cover lấy từ series manifest hoặc chapter metadata

### G. `SleepActivity`

Lý do:

- sleep cover hiện đọc từ `openEpubPath`

Khả năng sửa:

- lấy cover theo series/session
- fallback về chapter EPUB hiện tại nếu không có manifest cover

## 4.2. Nhóm có thể cần sửa

### H. `FileBrowserActivity`

Lý do:

- nếu chapter EPUB được lưu trong series folder, UX browse thủ công có thể cần xử lý riêng

### I. `HomeActivity` / `RecentBooksActivity`

Lý do:

- nếu recent được chuyển sang series-aware, UI hiển thị cần đi theo model mới

---

## 5. Đề xuất contract firmware tối thiểu

Firmware cần một contract tối thiểu như sau:

- mỗi series có một thư mục riêng
- có `_series.json`
- chapter file theo pattern `ch_NNN.epub`
- manifest chứa ít nhất:
  - `seriesId`
  - `title`
  - `author`
  - `coverPath` hoặc cover URL đã materialize
  - danh sách chapter theo index
  - path file từng chapter

Firmware không nên scan thư mục tự do để đoán series nếu đã có manifest.

---

## 6. Kết luận cho việc lập task

Task firmware nên tập trung vào:

1. `series manifest ingestion`
2. `inter-EPUB chapter navigation`
3. `series-aware progress and resume`
4. `series-aware recent/sleep UI`
5. `regression với EPUB cũ không thuộc series`

Task firmware không nên tập trung vào:

- viết mới OPDS browser
- viết mới multi-server config
- viết mới EPUB reader từ đầu
- viết mới web config server trên thiết bị
