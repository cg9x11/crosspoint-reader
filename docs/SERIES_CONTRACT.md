# CrossPoint Reader - Series Contract v1

## 1. Mục tiêu

Tài liệu này định nghĩa contract chung giữa:

- `Firmware CrossPoint`
- `Library/OPDS Server`

cho use case:

- mỗi chapter là một file EPUB riêng
- nhiều chapter thuộc một `series`
- firmware phải đọc được `_series.json`
- firmware phải hỗ trợ `next chapter` / `previous chapter`
- firmware phải lưu được tiến độ theo `series + chapter`

Đây là contract nền cho:

- download layout trên SD
- resume state
- recent books
- sleep cover
- OPDS publish strategy

---

## 2. Nguyên tắc thiết kế

1. Firmware không scan thư mục một cách suy diễn nếu đã có `_series.json`.
2. Một `series` có identity ổn định, không phụ thuộc riêng vào tên file chapter hiện tại.
3. Mỗi chapter có `chapterIndex` nguyên dương tăng dần.
4. Tên file chapter phải ổn định và dễ sort.
5. Contract phải có fallback an toàn khi chapter thiếu hoặc manifest lỗi.
6. Contract phải đủ nhẹ để parse trên ESP32-C3.

---

## 3. Layout trên SD card

Mỗi series được materialize thành một thư mục riêng:

```text
/Series Name/
  _series.json
  ch_001.epub
  ch_002.epub
  ch_003.epub
```

### 3.1. Quy tắc thư mục

- tên thư mục series là tên hiển thị đã sanitize
- không dùng ký tự cấm của filesystem
- backend có thể thêm suffix ngắn nếu cần để tránh trùng tên

Ví dụ:

```text
/Dau Pha Thuong Khung/
/Conan/
/Overlord/
```

### 3.2. Quy tắc tên file chapter

Pattern bắt buộc:

```text
ch_NNN.epub
```

Trong đó:

- `NNN` là số chapter zero-padded tối thiểu 3 ký tự
- nếu chapter > 999, backend tăng độ rộng khi cần, nhưng phải nhất quán trong cùng series

Ví dụ:

```text
ch_001.epub
ch_002.epub
ch_120.epub
ch_1001.epub
```

Firmware không nên suy ra chapter index từ sort string nếu đã có manifest, nhưng naming rule này vẫn giúp fallback và debug.

---

## 4. `_series.json` schema v1

## 4.1. Mục tiêu schema

Manifest phải cho firmware biết:

- series này là gì
- chapter hiện có là những chapter nào
- chapter kế / trước resolve ra file nào
- cover nên lấy ở đâu

## 4.2. JSON mẫu

```json
{
  "version": 1,
  "seriesId": "truyenfull:dau-pha-thuong-khung",
  "title": "Dau Pha Thuong Khung",
  "author": "Thien Tam Tho Dau",
  "sourceId": "truyenfull",
  "sourceName": "TruyenFull",
  "description": "Tieu thuyet tien hiep...",
  "coverPath": "ch_001.epub",
  "status": "ongoing",
  "updatedAt": "2026-05-05T08:30:00Z",
  "chapters": [
    {
      "chapterIndex": 1,
      "title": "Chuong 1",
      "file": "ch_001.epub"
    },
    {
      "chapterIndex": 2,
      "title": "Chuong 2",
      "file": "ch_002.epub"
    }
  ]
}
```

## 4.3. Field bắt buộc

### Top-level

- `version`
- `seriesId`
- `title`
- `chapters`

### Per chapter

- `chapterIndex`
- `file`

## 4.4. Field khuyến nghị

- `author`
- `sourceId`
- `sourceName`
- `description`
- `coverPath`
- `status`
- `updatedAt`
- `title` của chapter

## 4.5. Ý nghĩa field

### `version`

- phiên bản schema
- firmware phải check để hỗ trợ migration hoặc fail an toàn

### `seriesId`

- identity ổn định của series
- không phụ thuộc tên thư mục
- dùng cho resume, recent, sleep, progress mapping

### `coverPath`

- đường dẫn tương đối bên trong thư mục series
- v1 cho phép trỏ đến chapter EPUB đầu tiên để firmware tự lấy cover
- về sau có thể trỏ file bitmap riêng nếu server materialize cover local

### `chapters`

- danh sách chapter hiện có trên SD
- chỉ chứa chapter đã download/publish xong

---

## 5. Quy tắc resolve chapter

## 5.1. Resolve chapter hiện tại

Firmware xác định chapter hiện tại bằng:

- `seriesId`
- `chapterIndex`
- `chapterPath`

Nếu `chapterPath` tồn tại và khớp manifest, dùng trực tiếp.

Nếu `chapterPath` mất nhưng manifest còn:

- tìm chapter theo `chapterIndex`
- nếu có `file`, rebuild path từ thư mục series + `file`

## 5.2. Resolve `next chapter`

Từ chapter hiện tại:

1. đọc manifest
2. tìm entry có `chapterIndex = current + 1`
3. lấy `file`
4. kiểm tra file tồn tại
5. nếu tồn tại, mở chapter kế
6. nếu không tồn tại, báo `end of downloaded series` hoặc trạng thái tương đương

## 5.3. Resolve `previous chapter`

Tương tự:

1. tìm entry có `chapterIndex = current - 1`
2. nếu tồn tại, mở file đó
3. mở ở last page nếu user page-turn ngược từ đầu chapter

---

## 6. Fallback rules

## 6.1. `_series.json` thiếu

Nếu chapter EPUB nằm trong thư mục series nhưng thiếu manifest:

- firmware không được crash
- chapter hiện tại vẫn có thể mở như EPUB đơn lẻ
- `next chapter` / `previous chapter` giữa nhiều EPUB bị disable

## 6.2. Chapter trong manifest nhưng file thiếu

- firmware báo không tìm thấy chapter kế/trước
- không tự xóa state hiện tại
- không loop vô hạn

## 6.3. `seriesId` rỗng hoặc lỗi

- firmware fallback về path-based reader đơn lẻ
- không dùng chapter navigation giữa nhiều EPUB

## 6.4. JSON parse lỗi

- firmware hiển thị lỗi hoặc log lỗi
- vẫn cho phép mở chapter hiện tại như file đơn lẻ nếu file EPUB hợp lệ

---

## 7. Session model v1

Firmware không thể chỉ lưu `openEpubPath` nữa. Cần session model mới.

## 7.1. State đề xuất

```json
{
  "openSeriesId": "truyenfull:dau-pha-thuong-khung",
  "openSeriesDir": "/Dau Pha Thuong Khung",
  "openChapterPath": "/Dau Pha Thuong Khung/ch_002.epub",
  "openChapterIndex": 2,
  "lastSleepFromReader": true
}
```

## 7.2. Field bắt buộc

- `openChapterPath`
- `openChapterIndex`

## 7.3. Field khuyến nghị

- `openSeriesId`
- `openSeriesDir`

## 7.4. Quy tắc resume

Khi boot/resume:

1. nếu có `openSeriesId` và `openChapterPath`, thử resume theo series session
2. nếu chapter path còn tồn tại, mở chapter đó
3. nếu chapter path mất nhưng manifest còn, tìm chapter theo `openChapterIndex`
4. nếu vẫn fail, fallback về file browser/home

---

## 8. Progress model

## 8.1. Tiến độ trong chapter

Tiếp tục dùng `progress.bin` ở cache của chapter EPUB hiện tại cho:

- current page
- page count
- spine index trong chapter EPUB đó

## 8.2. Tiến độ ở mức series

Ngoài `progress.bin`, firmware cần lưu ở state/session:

- `seriesId`
- `chapterIndex`
- `chapterPath`

Như vậy:

- progress nội bộ chapter vẫn dùng cơ chế cũ
- progress giữa các chapter dùng session model mới

---

## 9. Recent books model

Recent books không nên ghi mỗi chapter file như một “book” riêng.

### 9.1. Rule

- một series là một entry recent
- recent entry trỏ đến chapter hiện tại cuối cùng đã đọc trong series

### 9.2. Metadata

Recent entry nên chứa:

- `seriesId`
- `displayPath` hoặc `chapterPath`
- `title`
- `author`
- `coverBmpPath`

Nếu chưa refactor được toàn bộ recent model ngay, có thể tạm:

- vẫn lưu `chapterPath`
- nhưng dedupe theo `seriesId`

---

## 10. Sleep cover model

Sleep screen hiện đang lấy cover từ `openEpubPath`.

Sau khi chuyển sang series-aware:

- ưu tiên `openChapterPath`
- nếu có `coverPath` trong manifest, firmware có thể dùng nó để tạo/resolve cover

---

## 11. Trách nhiệm của server

Server phải:

- tạo thư mục series ổn định
- tạo `_series.json` hợp lệ
- chỉ ghi manifest sau khi chapter files liên quan đã hoàn chỉnh
- giữ `seriesId` ổn định qua các lần sync

Server không nên:

- đổi `seriesId` tùy ý
- đổi chapter naming giữa các lần sync
- publish manifest trỏ tới file chưa tồn tại

---

## 12. Versioning

`version = 1` cho contract đầu tiên.

Nếu sau này thêm field:

- firmware phải ignore field lạ
- server phải giữ các field bắt buộc của v1

---

## 13. Checklist dùng contract này

Firmware cần implement:

1. parse `_series.json`
2. resolve chapter kế/trước
3. lưu state theo series
4. fallback an toàn khi manifest hỏng

Server cần implement:

1. publish series folder
2. publish `_series.json`
3. giữ `seriesId` ổn định
4. không expose chapter chưa hoàn chỉnh
