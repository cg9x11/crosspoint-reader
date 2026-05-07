# XteinkReader Server - UX/UI Sitemap và Wireframe Text

## 1. Mục tiêu tài liệu

Tài liệu này cụ thể hóa phần UX/UI trong [DOC.md](/d:/6.Work/AI-AGENTS/crosspoint-reader/DOC.md) thành:

- sitemap
- navigation model
- wireframe text cho mobile và desktop
- component rules
- empty/loading/error states

Ưu tiên thiết kế:

- `iPhone 13 mini` trước
- desktop sau
- cấu trúc nhất quán giữa hai nền tảng

---

## 2. Sitemap

```text
App
├── Thư viện
│   ├── Danh sách truyện
│   ├── Filter trạng thái
│   ├── Search local
│   ├── Chi tiết truyện đã theo dõi
│   └── Hành động: Sync / Retry / Xóa
├── Nguồn
│   ├── Danh sách source
│   ├── Source Home
│   ├── Search theo source
│   ├── Thể loại / danh mục
│   ├── Kết quả tìm kiếm
│   └── Chi tiết truyện nguồn
├── Tác vụ
│   ├── Đang chạy
│   ├── Thất bại
│   ├── Retry queue
│   └── Nhật ký rút gọn
├── Tiện ích
│   ├── Đã cài
│   ├── Kho
│   ├── Khám phá
│   ├── Thêm kho
│   └── Chi tiết extension
└── Cài đặt
    ├── Tài khoản
    ├── Sync schedule
    ├── Storage
    ├── Hệ thống
    └── Trạng thái dịch vụ
```

---

## 3. Navigation model

### 3.1. Mobile

Bottom tabs:

- `Thư viện`
- `Nguồn`
- `Tác vụ`
- `Tiện ích`

Top bar:

- trái: tiêu đề màn hình
- phải: `Cài đặt` hoặc action context

Nguyên tắc:

- mỗi màn hình là một page độc lập
- detail là full-screen push navigation
- filter nhiều điều kiện dùng bottom sheet đơn giản hoặc page riêng

### 3.2. Desktop

Sidebar trái:

- logo
- Thư viện
- Nguồn
- Tác vụ
- Tiện ích
- Cài đặt

Vùng giữa:

- nội dung chính

Panel phải tùy màn:

- preview
- metadata
- action context

---

## 4. Wireframe mobile

## 4.1. Mobile - Thư viện

```text
┌──────────────────────────────┐
│ Thu vien                ⚙    │
├──────────────────────────────┤
│ [ Tim trong thu vien... ]    │
│ [Dang theo doi] [Co loi] [All]│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ [Cover] Ten truyen       │ │
│ │ Nguon: Truyenfull        │ │
│ │ 128/240 chuong           │ │
│ │ Sync: dang cap nhat      │ │
│ │ Cap nhat: 10 phut truoc  │ │
│ │ [Sync] [Retry]           │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ [Cover] Ten truyen B     │ │
│ │ Nguon: Tangthuvien       │ │
│ │ 80/80 chuong             │ │
│ │ Sync: hoan tat           │ │
│ │ Cap nhat: hom qua        │ │
│ │ [Sync] [Xoa]             │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Thu vien | Nguon | Tac vu... │
└──────────────────────────────┘
```

Ghi chú:

- search sticky
- filter là chip ngang
- mỗi card có quick action
- trạng thái dùng badge màu + text

## 4.2. Mobile - Chi tiết truyện trong Thư viện

```text
┌──────────────────────────────┐
│ ← Chi tiet truyện            │
├──────────────────────────────┤
│ [ Cover lon ]                │
│ Ten truyen                   │
│ Nguon: Truyenfull            │
│ 128/240 chuong               │
│ Sync: partial_failed         │
│ Loi cuoi: timeout chapter 129│
│                              │
│ [Dong bo ngay] [Retry loi]   │
│ [Xoa khoi thu vien]          │
├──────────────────────────────┤
│ Chuong moi nhat              │
│ - ch_128                     │
│ - ch_127                     │
│ - ch_126                     │
└──────────────────────────────┘
```

## 4.3. Mobile - Nguồn, bước chọn source

```text
┌──────────────────────────────┐
│ Nguon                   +Kho │
├──────────────────────────────┤
│ [ Tim source hoac truyen... ]│
│                              │
│ Core                        │
│ [Truyenfull] [Tangthuvien]  │
│                              │
│ Community                   │
│ [Cuu Truyen] [Hako] [Khac]  │
│                              │
│ Gan day                      │
│ [Truyenfull] [Cuu Truyen]   │
└──────────────────────────────┘
```

Ghi chú:

- source là điểm vào chính
- không bắt user chọn source qua dropdown khó dùng
- source card có thể có badge `Core`, `Community`, `Error`

## 4.4. Mobile - Nguồn, home của source

```text
┌──────────────────────────────┐
│ ← Truyenfull            ...  │
├──────────────────────────────┤
│ [ Tim trong Truyenfull... ]  │
│ [Trang chu] [Tim kiem] [Loai]│
├──────────────────────────────┤
│ Moi cap nhat                 │
│ ┌──────────────────────────┐ │
│ │ [Cover] Ten truyện       │ │
│ │ Tac gia                  │ │
│ │ Mo ta ngan 2-3 dong...   │ │
│ │ [Fantasy] [Action]       │ │
│ │ [Them vao thu vien]      │ │
│ └──────────────────────────┘ │
│                              │
│ Noi bat                      │
│ ┌──────────────────────────┐ │
│ │ [Cover] Ten truyện B     │ │
│ │ Mo ta ngan...            │ │
│ │ [Them]                   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Ghi chú:

- `Trang chủ` phải có nội dung ngay nếu source hỗ trợ `home`
- mô tả luôn xuất hiện ở card nguồn
- nút `Thêm vào thư viện` là CTA chính

## 4.5. Mobile - Search trong source

```text
┌──────────────────────────────┐
│ ← Truyenfull - Tim kiem      │
├──────────────────────────────┤
│ [ Dau pha thuong khung   🔍 ]│
│                              │
│ Dang tim...                  │
│                              │
│ Ket qua                      │
│ ┌──────────────────────────┐ │
│ │ [Cover] Dau Pha...       │ │
│ │ Tac gia: ...             │ │
│ │ Mo ta ngan 3 dong...     │ │
│ │ [Them vao thu vien]      │ │
│ └──────────────────────────┘ │
│ [Xem them]                  │
└──────────────────────────────┘
```

## 4.6. Mobile - Chi tiết truyện từ source

```text
┌──────────────────────────────┐
│ ← Chi tiet nguon             │
├──────────────────────────────┤
│ [ Cover lon ]                │
│ Ten truyen                   │
│ Tac gia                      │
│ Nguon: Truyenfull            │
│ [Ongoing] [Fantasy] [Action] │
│                              │
│ Mo ta day du o day...        │
│                              │
│ [Them vao thu vien]          │
│ [Dong bo ngay sau khi them]  │
├──────────────────────────────┤
│ Chuong moi / preview         │
│ - Chuong 1                   │
│ - Chuong 2                   │
│ - Chuong 3                   │
└──────────────────────────────┘
```

## 4.7. Mobile - Tiện ích, danh sách đã cài

```text
┌──────────────────────────────┐
│ Tien ich                +Kho │
├──────────────────────────────┤
│ [Da cai] [Kho] [Kham pha]    │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ Truyenfull              │ │
│ │ Core • v1.0             │ │
│ │ Source: built-in        │ │
│ │ Status: enabled         │ │
│ │ [Tat] [Chi tiet]        │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Hako                    │ │
│ │ Community • v0.9        │ │
│ │ Repo: vbook-extensions  │ │
│ │ Status: update available│ │
│ │ [Cap nhat] [Tat]        │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## 4.8. Mobile - Tiện ích, danh sách kho

```text
┌──────────────────────────────┐
│ Kho tien ich            +Them│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ ext-vbook               │ │
│ │ github.com/dat-bi/...   │ │
│ │ 12 ext • online         │ │
│ │ Dong bo: 5 phut truoc   │ │
│ │ [Lam moi] [Xem ext]     │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ vbook-extensions        │ │
│ │ github.com/Darkrai9x/...│ │
│ │ 30 ext • online         │ │
│ │ [Lam moi] [Xem ext]     │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## 4.9. Mobile - Thêm kho extension

```text
┌──────────────────────────────┐
│ ← Them kho extension         │
├──────────────────────────────┤
│ URL registry                 │
│ [ https://.../plugin.json ]  │
│                              │
│ [Kiem tra kho]               │
│                              │
│ Preview                      │
│ Ten kho: ...                 │
│ So extension: ...            │
│ Loai: community/custom       │
│                              │
│ [Them kho]                   │
└──────────────────────────────┘
```

## 4.10. Mobile - Tác vụ

```text
┌──────────────────────────────┐
│ Tac vu                  ↻    │
├──────────────────────────────┤
│ [Dang chay] [That bai] [All] │
├──────────────────────────────┤
│ Sync: Dau Pha...             │
│ Trang thai: fetching ch_129  │
│ Source: Truyenfull           │
│ Bat dau: 2 phut truoc        │
│                              │
│ Sync: Conan                  │
│ Trang thai: failed           │
│ Loi: parser changed          │
│ [Retry] [Xem chi tiet]       │
└──────────────────────────────┘
```

---

## 5. Wireframe desktop

## 5.1. Desktop shell

```text
┌──────────────┬──────────────────────────────┬──────────────────────┐
│ Sidebar      │ Main content                 │ Context panel        │
│              │                              │                      │
│ Logo         │ Page title                   │ Preview / metadata   │
│ Thu vien     │ Toolbar                      │ or secondary actions │
│ Nguon        │ Content grid/list            │                      │
│ Tac vu       │                              │                      │
│ Tien ich     │                              │                      │
│ Cai dat      │                              │                      │
└──────────────┴──────────────────────────────┴──────────────────────┘
```

## 5.2. Desktop - Thư viện

```text
┌──────────────┬─────────────────────────────────────────────────────┐
│ Sidebar      │ Thu vien                                            │
│              │ [ Tim local... ] [Status] [Sort] [Sync all]        │
│              ├─────────────────────────────────────────────────────┤
│              │ Cover | Ten | Nguon | Progress | Last sync | Action│
│              │-----------------------------------------------------│
│              │ ...                                                 │
└──────────────┴─────────────────────────────────────────────────────┘
```

Ghi chú:

- desktop hợp table/card hybrid hơn mobile card-only
- row click mở panel phải với thông tin chi tiết

## 5.3. Desktop - Nguồn

```text
┌──────────────┬───────────────────────────────────────┬──────────────┐
│ Sidebar      │ Truyenfull                            │ Chi tiet nhanh│
│              │ [ Search in source... ]              │ [cover]       │
│              │ [Trang chu] [Tim kiem] [Loai]        │ ten truyện    │
│              ├───────────────────────────────────────┤ mo ta         │
│              │ Moi cap nhat                          │ [Them]        │
│              │ [Card] [Card] [Card] [Card]          │               │
│              │ Noi bat                               │               │
│              │ [Card] [Card] [Card] [Card]          │               │
└──────────────┴───────────────────────────────────────┴──────────────┘
```

## 5.4. Desktop - Tiện ích

```text
┌──────────────┬──────────────────────────────┬──────────────────────┐
│ Sidebar      │ Kho / Da cai / Kham pha      │ Chi tiet extension   │
│              │ [ Search ext... ]            │ name                 │
│              │                              │ version              │
│              │ ext-vbook                    │ author               │
│              │ - Truyenfull                 │ source repo          │
│              │ - ...                        │ description          │
│              │                              │ [Cai] [Bat] [Tat]    │
│              │ vbook-extensions             │                      │
│              │ - Hako                       │                      │
└──────────────┴──────────────────────────────┴──────────────────────┘
```

## 5.5. Desktop - Tác vụ

```text
┌──────────────┬─────────────────────────────────────────────────────┐
│ Sidebar      │ Tac vu                                              │
│              │ [Dang chay] [That bai] [All] [Lam moi]             │
│              ├─────────────────────────────────────────────────────┤
│              │ Job | Novel | Source | Stage | Started | Error     │
│              │-----------------------------------------------------│
│              │ ...                                                 │
└──────────────┴─────────────────────────────────────────────────────┘
```

---

## 6. Component rules

### 6.1. Novel card trong Nguồn

Bắt buộc có:

- cover
- title
- source
- description snippet
- tags
- CTA `Thêm vào thư viện`

Tùy chọn:

- author
- total chapters
- completion status

### 6.2. Novel item trong Thư viện

Bắt buộc có:

- cover
- title
- source
- progress
- sync status
- quick actions

Không cần:

- mô tả dài ở list

### 6.3. Extension item

Bắt buộc có:

- tên extension
- badge phân loại
- version
- repo
- status
- action chính

### 6.4. Status badge

Các badge cốt lõi:

- `Idle`
- `Syncing`
- `Completed`
- `Failed`
- `Disabled`
- `Update available`
- `Registry offline`

Badge phải luôn đi kèm text, không dùng màu đơn độc.

---

## 7. Empty, loading, error states

### 7.1. Thư viện trống

Thông điệp:

- `Bạn chưa theo dõi truyện nào`
- CTA: `Mở Nguồn để tìm truyện`

### 7.2. Chưa có extension

Thông điệp:

- `Chưa có nguồn nào khả dụng`
- CTA: `Mở Tiện ích`

### 7.3. Source không có home

Thông điệp:

- `Nguồn này không hỗ trợ trang chủ`
- CTA chính: focus vào search

### 7.4. Search không có kết quả

Thông điệp:

- `Không tìm thấy truyện phù hợp`
- gợi ý đổi từ khóa hoặc đổi source

### 7.5. Registry lỗi

Thông điệp:

- `Không thể tải kho tiện ích`
- hiển thị URL và lỗi rút gọn
- CTA: `Thử lại`

### 7.6. Sync lỗi

Thông điệp:

- `Đồng bộ thất bại`
- hiển thị source, chương lỗi, thời điểm lỗi
- CTA: `Retry`

---

## 8. Luồng người dùng quan trọng

### 8.1. Luồng thêm truyện mới

1. Mở `Nguồn`
2. Chọn source
3. Xem `Trang chủ` hoặc dùng `Tìm kiếm`
4. Mở `Chi tiết truyện`
5. Bấm `Thêm vào thư viện`
6. Chọn có sync ngay hay không
7. Theo dõi tiến độ trong `Tác vụ`
8. Truyện xuất hiện trong `Thư viện`

### 8.2. Luồng cài source mới

1. Mở `Tiện ích`
2. Vào `Kho`
3. `Thêm kho`
4. Dán URL registry
5. Validate
6. Xem extension trong kho
7. Cài và bật extension
8. Source mới xuất hiện trong `Nguồn`

### 8.3. Luồng xử lý lỗi sync

1. Mở `Tác vụ`
2. Xem job thất bại
3. Mở chi tiết lỗi
4. Retry
5. Nếu do source/ext lỗi, chuyển qua `Tiện ích` để disable hoặc update extension

---

## 9. Ghi chú cho implementation frontend

- `Thư viện` và `Nguồn` cần hai data store riêng vì semantics khác nhau
- `Nguồn` phải hỗ trợ capability-driven UI thay vì hard-code một layout duy nhất
- tất cả search remote phải có loading state và cancel previous request
- trạng thái card không phụ thuộc riêng vào màu
- detail page trên mobile nên ưu tiên vertical rhythm và CTA rõ ràng
- ext management cần biểu diễn được `Core`, `Community`, `Custom`

---

## 10. Deliverables design tiếp theo

Sau tài liệu này, có thể làm tiếp:

1. Low-fidelity mockup trong Figma
2. Design tokens cho màu, spacing, typography
3. Component spec cho `NovelCard`, `SourceTabs`, `ExtensionRow`, `StatusBadge`
4. Frontend route map cho React/Vite
