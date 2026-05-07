# XteinkReader Server - Tài Liệu Thiết Kế Kỹ Thuật v4.0

**Phiên bản:** 4.0  
**Ngày:** Tháng 5, 2026  
**Trạng thái:** Draft - Production-ready design  
**Public Domain:** `https://online-library.noe.asia`  
**LAN Endpoint:** `http://192.168.1.202:8787`  
**Target Host:** `Raspberry Pi 4 - 8GB RAM`  
**Docker Data Root:** `/srv/dev-disk-by-uuid-efa4bb57-8270-4740-be2c-01caa4be7407/docker-data/online-library`

---

## 1. Mục tiêu tài liệu

Tài liệu này mô tả kiến trúc `XteinkReader Server v4.0`, là phiên bản self-hosted chạy liên tục trên Docker để:

- Quản lý thư viện truyện từ web.
- Tự động crawl chương mới từ nhiều nguồn.
- Build EPUB theo từng chương.
- Phục vụ OPDS cho thiết bị đọc sách Xteink/CrossPoint.
- Vận hành ổn định trong môi trường thực tế với retry, logging, backup và kiểm soát lỗi.

Phiên bản v4 thay cho hướng tiếp cận prototype ở v3 bằng một thiết kế có thể triển khai lâu dài trên server nội bộ hoặc public internet.

---

## 2. Bối cảnh và lý do chuyển đổi

Kiến trúc cũ dựa trên iOS app làm HTTP server và crawler trung tâm. Hướng này không phù hợp để vận hành liên tục vì:

- iOS giới hạn background execution.
- HTTP server ngầm có thể bị đóng băng sau vài phút.
- Tác vụ crawl dài hoặc đồng bộ định kỳ không ổn định.
- Người dùng buộc phải giữ thiết bị iPhone hoạt động để E-ink tải sách.

Giải pháp v4 là chuyển toàn bộ backend sang server Docker luôn bật:

- Server online 24/7.
- Tác vụ nền chạy độc lập với thiết bị người dùng.
- Web UI dùng được từ PC, Mac, Android, iPhone.
- Thiết bị Xteink chỉ cần trỏ đến OPDS endpoint mới.

---

## 3. Phạm vi và non-goals

### 3.1. Phạm vi

Hệ thống phải hỗ trợ:

- Quản lý thư viện truyện qua web.
- Tìm truyện bằng plugin crawler.
- Đồng bộ chương mới theo lịch.
- Build EPUB từng chương theo format tương thích firmware.
- Phục vụ feed OPDS và file EPUB.
- Theo dõi trạng thái job và lỗi đồng bộ.
- Backup dữ liệu thư viện và metadata.

### 3.2. Non-goals

Hệ thống không nhắm tới:

- Multi-tenant SaaS.
- Chia sẻ thư viện công khai cho số lượng người dùng lớn.
- Xử lý DRM.
- Full-text search trên nội dung toàn bộ chương.
- Crawl phân tán trên nhiều worker node ở giai đoạn đầu.

---

## 4. Yêu cầu chức năng

1. Người dùng có thể tìm truyện từ một hoặc nhiều nguồn.
2. Người dùng có thể thêm truyện vào thư viện.
3. Hệ thống tự tải danh sách chương và các chương mới.
4. Mỗi chương tải xong phải được build thành một file EPUB riêng.
5. EPUB phải được publish vào thư mục OPDS sau khi hoàn chỉnh.
6. Thiết bị Xteink phải đọc được danh sách series và chapter qua OPDS.
7. Firmware bắt buộc phải được sửa để hỗ trợ flow đọc theo chapter EPUB và chuyển chapter tiếp theo. Backend v4 chỉ hoàn chỉnh khi firmware mới tiêu thụ đúng cấu trúc series/chapter.
8. Người dùng có thể xem trạng thái đồng bộ, lỗi gần nhất và retry thủ công.
9. Hệ thống phải có cron đồng bộ định kỳ.
10. Hệ thống phải hỗ trợ xóa truyện và dọn dữ liệu liên quan.

---

## 5. Yêu cầu phi chức năng

### 5.1. Độ tin cậy

- Không mất trạng thái job khi container restart.
- Retry có backoff khi crawl hoặc build thất bại.
- Không publish file EPUB dở dang.
- Chỉ cho phép một tiến trình sync hoạt động trên mỗi truyện tại cùng thời điểm.

### 5.2. Bảo mật

- Web UI admin bắt buộc đăng nhập.
- API admin không public tự do ra internet.
- Validate toàn bộ input từ web và plugin.
- File serving không được cho phép path traversal.

### 5.3. Khả năng vận hành

- Có healthcheck, structured logs, queue metrics cơ bản.
- Có backup định kỳ cho DB và thư mục OPDS.
- Có cơ chế xem lỗi cuối cùng theo truyện/chương/plugin.

### 5.4. Hiệu năng

- Phục vụ OPDS và file EPUB với độ trễ thấp trong LAN.
- Crawl và build không làm nghẽn request phục vụ OPDS.
- Hệ thống phải chịu được việc đồng bộ vài chục truyện mà không khóa toàn bộ DB.

### 5.5. Ràng buộc tài nguyên phần cứng

Hệ thống được tối ưu cho `Raspberry Pi 4 8GB RAM` chạy Docker, nên phải tuân thủ:

- ưu tiên footprint RAM thấp
- tránh giữ nhiều browser instance đồng thời
- số worker đồng thời phải nhỏ và kiểm soát được
- không dùng kiến trúc nặng kiểu nhiều service phụ không cần thiết
- ưu tiên parser HTML tĩnh thay vì browser automation

---

## 6. Kiến trúc tổng thể

### 6.1. Service topology

Hệ thống gồm 4 service chính:

- `proxy`: reverse proxy + TLS termination.
- `app`: HTTP server phục vụ Web UI, REST API, OPDS API, static files.
- `worker`: xử lý queue cho crawl, parse, build EPUB, sync lịch.
- `redis`: broker cho BullMQ.

Trong môi trường `Raspberry Pi 4 8GB`, topology này vẫn giữ nguyên nhưng vận hành theo cấu hình nhẹ:

- `1 app container`
- `1 worker container`
- `1 redis container`
- `1 proxy container`
- không scale nhiều worker ở phase đầu

### 6.2. Sơ đồ logic

```text
Browser/Admin
    |
    v
[ Reverse Proxy ]
    |
    +--> /            -> Web UI
    +--> /api/*       -> Admin REST API
    +--> /opds/*      -> OPDS Feed
    +--> /storage/*   -> EPUB / cover files
    |
    v
[ App Server ] <--------------------+
    |                               |
    | writes/read                   | queue status / commands
    v                               |
[ SQLite ]                          |
    ^                               |
    |                               v
[ Shared Storage ] <---------- [ Worker ]
                                     |
                                     +--> Plugin Engine
                                     +--> Cheerio crawler
                                     +--> Puppeteer fallback
                                     +--> EPUB Builder
                                     |
                                     v
                                   [ Redis ]
```

### 6.3. Quy tắc phân tách trách nhiệm

- `app` không crawl và không build EPUB trong request cycle.
- `worker` không phục vụ HTTP public.
- `proxy` là điểm public duy nhất nếu mở internet.
- `storage` là persistent layer cho EPUB, covers, logs, DB backups.

---

## 7. Công nghệ chốt

- **Backend HTTP:** `Fastify`
- **Web UI:** `React + Vite + TailwindCSS`
- **Queue:** `BullMQ`
- **Broker:** `Redis`
- **ORM:** `Prisma`
- **Database:** `SQLite`
- **Crawler HTML:** `Cheerio`
- **Headless browser:** `Puppeteer`
- **EPUB builder:** `archiver`
- **Reverse proxy:** `Caddy` hoặc `Traefik`
- **Container runtime:** `Docker Compose`

### 7.1. Lý do chọn

- `Fastify` cho cấu trúc plugin tốt, hiệu năng cao, validation rõ ràng.
- `BullMQ + Redis` giải quyết retry, dedupe, delayed jobs, persistence sau restart.
- `SQLite` đủ đơn giản cho single-host self-hosted giai đoạn đầu.
- `Puppeteer` chỉ dùng khi site không thể parse tĩnh bằng Cheerio và phải được giới hạn chặt trên Raspberry Pi.

### 7.2. Nguyên tắc tối ưu cho Raspberry Pi 4

- `Cheerio-first`, `Puppeteer-last resort`
- chỉ chạy `1` tác vụ browser-heavy tại một thời điểm
- queue concurrency thấp, mặc định `1`
- build EPUB theo kiểu streaming, không giữ dữ liệu lớn quá lâu trong RAM
- tránh cron/job trùng lặp làm tăng tải CPU
- ưu tiên ảnh bìa nhỏ hoặc cache đã nén

---

## 8. Kiến trúc lưu trữ

### 8.1. Host path

`/srv/dev-disk-by-uuid-efa4bb57-8270-4740-be2c-01caa4be7407/docker-data/online-library`

### 8.2. Layout thư mục

```text
/online-library/
├── database/
│   ├── library.db
│   └── backups/
│       ├── library-2026-05-05.sqlite
│       └── ...
├── cache/
│   ├── covers/
│   ├── html/
│   └── text/
├── opds/
│   ├── Dau Pha Thuong Khung/
│   │   ├── _series.json
│   │   ├── ch_001.epub
│   │   └── ch_002.epub
│   └── Conan/
├── temp/
│   ├── epub-build/
│   └── downloads/
├── logs/
│   ├── app.log
│   ├── worker.log
│   └── plugin/
└── runtime/
    ├── health/
    └── metrics/
```

### 8.3. Nguyên tắc lưu trữ

- Chỉ dữ liệu đã hoàn chỉnh mới được ghi vào `opds/`.
- File build tạm phải nằm trong `temp/`.
- DB backup tách riêng trong `database/backups/`.
- Không lưu cookie, token plugin vào repo.

---

## 9. Mô hình dữ liệu

### 9.1. Bảng chính

- `Novel`
- `Chapter`
- `SyncRun`
- `PluginSource`
- `AppSetting`

### 9.2. Prisma schema đề xuất

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Novel {
  id                String      @id @default(uuid())
  title             String
  author            String?
  sourceId          String
  sourceUrl         String
  coverUrl          String?
  coverLocalPath    String?
  status            String      @default("ongoing")
  syncStatus        String      @default("idle")
  totalChapters     Int         @default(0)
  downloadedChaps   Int         @default(0)
  lastCheckedAt     DateTime?
  lastSyncStartedAt DateTime?
  lastSyncEndedAt   DateTime?
  lastError         String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  chapters          Chapter[]
  syncRuns          SyncRun[]

  @@index([sourceId])
  @@index([syncStatus])
}

model Chapter {
  id             String    @id @default(uuid())
  novelId        String
  chapterIndex   Int
  title          String
  sourceUrl      String
  status         String    @default("pending")
  epubPath       String?
  fileSize       Int?
  checksum       String?
  retryCount     Int       @default(0)
  publishedAt    DateTime?
  lastError      String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  novel          Novel     @relation(fields: [novelId], references: [id], onDelete: Cascade)

  @@unique([novelId, chapterIndex])
  @@index([novelId, status])
}

model SyncRun {
  id            String    @id @default(uuid())
  novelId       String
  triggerType   String
  status        String    @default("queued")
  totalFound    Int       @default(0)
  newChapters   Int       @default(0)
  errorMessage  String?
  startedAt     DateTime?
  endedAt       DateTime?
  createdAt     DateTime  @default(now())
  novel         Novel     @relation(fields: [novelId], references: [id], onDelete: Cascade)

  @@index([novelId, status])
}

model PluginSource {
  id             String    @id
  name           String
  enabled        Boolean   @default(true)
  version        String?
  supportsJs     Boolean   @default(false)
  timeoutMs      Int       @default(30000)
  lastCheckedAt  DateTime?
  lastError      String?
}

model AppSetting {
  key        String   @id
  value      String
  updatedAt  DateTime @updatedAt
}
```

---

## 10. State machine

### 10.1. `Novel.syncStatus`

- `idle`
- `queued`
- `syncing`
- `partial_failed`
- `failed`
- `completed`

### 10.2. `Chapter.status`

- `pending`
- `fetching`
- `parsed`
- `building`
- `built`
- `published`
- `failed`
- `skipped`

### 10.3. Quy tắc

- `published` chỉ được set sau khi file EPUB đã tồn tại, pass validation cơ bản và được move atomically vào thư mục public.
- `failed` phải có `lastError`.
- `retryCount` tăng theo mỗi lần queue retry chạy lại.

---

## 11. Queue và job lifecycle

### 11.1. Queue chính

- `novel-sync`
- `chapter-fetch`
- `chapter-build`
- `maintenance`

Trên `Raspberry Pi 4 8GB`, concurrency mặc định nên là:

- `novel-sync`: `1`
- `chapter-fetch`: `1` hoặc `2` tối đa
- `chapter-build`: `1`
- `maintenance`: `1`

### 11.2. Luồng chuẩn

1. User thêm truyện hoặc cron tạo `novel-sync job`.
2. Worker lấy danh sách chương từ plugin.
3. Tạo `chapter-fetch jobs` cho các chương mới.
4. Worker fetch nội dung chương.
5. Parse, sanitize, chuẩn hóa HTML.
6. Tạo `chapter-build job`.
7. Build EPUB vào thư mục tạm.
8. Verify file.
9. Atomic rename sang `opds/.../ch_NNN.epub`.
10. Cập nhật DB sang `published`.

### 11.3. Chính sách retry

- Retry tối đa 3 lần với lỗi mạng tạm thời.
- Backoff theo hàm mũ: `30s`, `2m`, `10m`.
- Puppeteer timeout hoặc crash được xem là retryable nếu chưa quá ngưỡng.
- HTML parse lỗi do source thay đổi cấu trúc được đánh dấu `failed` và cần can thiệp.

### 11.4. Dedupe và idempotency

- Mỗi `novel-sync` dùng `jobId = sync:<novelId>`.
- Mỗi `chapter-fetch` dùng `jobId = fetch:<novelId>:<chapterIndex>`.
- Mỗi `chapter-build` dùng `jobId = build:<chapterId>`.
- Nếu job đã tồn tại, không enqueue lại trừ khi là retry explicit.

---

## 12. Plugin engine và crawler policy

### 12.1. Plugin contract

```javascript
module.exports = {
  id: "truyenfull",
  name: "Truyen Full",
  async search(query, page = 1) {},
  async getDetail(url) {},
  async getChapterList(url) {},
  async getChapterContent(url) {}
}
```

### 12.2. Chính sách thực thi plugin

- Plugin chạy trong tiến trình worker, không chạy trong request của app.
- Mỗi lời gọi plugin có timeout rõ ràng.
- Ghi log theo `pluginId`.
- Mọi dữ liệu trả về phải được validate schema trước khi ghi DB.

### 12.3. Chính sách dùng Puppeteer

Chỉ dùng Puppeteer khi:

- Trang yêu cầu render JS.
- Site chặn bot với HTML rỗng hoặc challenge.
- Plugin khai báo `supportsJs = true`.

Trên `Raspberry Pi 4 8GB`, Puppeteer phải có thêm quy tắc:

- không mở nhiều browser song song
- ưu tiên reuse browser process nếu an toàn
- timeout ngắn và fail fast
- cho phép tắt hoàn toàn Puppeteer bằng config nếu server thiếu tài nguyên

### 12.4. Kiểm soát tài nguyên

- Giới hạn số browser instance đồng thời.
- Đóng browser/page bắt buộc trong `finally`.
- Thiết lập timeout cho `goto`, `waitForSelector`, `content`.
- Cô lập user-data-dir nếu cần session.

---

## 13. EPUB build và publish strategy

### 13.1. Quy tắc EPUB

- `mimetype` là file đầu tiên.
- `mimetype` không được nén.
- Cấu trúc EPUB phải nhất quán giữa các chapter.
- Tên file chapter theo format `ch_NNN.epub`.

### 13.2. Quy trình publish an toàn

1. Build EPUB tại `temp/epub-build/<uuid>.epub`
2. Kiểm tra file tồn tại và kích thước > 0
3. Tính checksum nếu cần
4. Ghi `_series.json` nếu metadata thay đổi
5. Rename atomically sang đường dẫn public
6. Cập nhật `Chapter.status = published`

### 13.3. Không được làm

- Không ghi trực tiếp từ builder vào thư mục public.
- Không set `published` trước khi rename xong.
- Không expose file tạm qua static route.

---

## 14. Hợp đồng tương thích với firmware Xteink

### 14.1. Bất biến cần giữ

- `_series.json` phải tồn tại cho mỗi series.
- Chapter filename phải theo pattern `ch_NNN.epub`.
- Danh sách chapter phải sắp theo `chapterIndex` tăng dần.
- OPDS download link phải trỏ đúng file public.

### 14.1.1. Nguyên tắc tương thích

Firmware là một phần bắt buộc của scope v4. Lý do là thiết bị hiện tại không có cơ chế đọc và `next chapter` theo mô hình mỗi chương là một file EPUB riêng. Trong v4:

- backend và firmware phải được thiết kế như một cặp tương thích
- firmware phải hiểu cấu trúc series/chapter do backend publish
- `next chapter` không còn là giả định có sẵn, mà là tính năng phải triển khai trong firmware
- mọi thay đổi phải giữ an toàn cho dữ liệu đọc và hành vi fallback khi metadata thiếu hoặc lỗi

### 14.2. Endpoint OPDS

| Method | Path | Mục đích |
|---|---|---|
| GET | `/opds` | Root feed |
| GET | `/opds/library` | Danh sách series |
| GET | `/opds/series/:novelId` | Chi tiết series + chapter |
| GET | `/opds/download/:novelId/:chapterIndex` | Tải EPUB |

### 14.3. Metadata tối thiểu

- `title`
- `id`
- `updated`
- `author`
- `link`
- `cover` nếu có

### 14.4. Các vùng bắt buộc phải sửa trong firmware

Các thay đổi firmware bắt buộc có trong scope:

- cơ chế ánh xạ một series thành chuỗi chapter EPUB
- cơ chế `next chapter` và `previous chapter`
- đọc và validate `_series.json`
- logic lưu tiến độ ở mức chapter index thay vì chỉ file đơn lẻ
- xử lý chapter thiếu, chapter lỗi hoặc chapter chưa tải đủ

Các thay đổi firmware nên có nếu phù hợp:

- cải thiện flow thêm và quản lý OPDS server trên thiết bị
- hỗ trợ auth tốt hơn cho OPDS nếu cần bảo vệ feed
- xử lý cache feed/chapter thông minh hơn
- hiển thị metadata tốt hơn như mô tả ngắn, cover hoặc trạng thái truyện nếu muốn mở rộng
- bổ sung telemetry/debug log cho flow tải OPDS

### 14.5. Nguyên tắc sửa firmware

- không phá vỡ thư viện nội bộ hiện có trên thiết bị
- không làm tăng đáng kể footprint RAM/flash trên thiết bị
- mọi thay đổi phải giữ fallback tương thích với backend v4 hiện hành
- ưu tiên sửa nhỏ, kiểm soát rõ impact đến `OPDS client`, `series_progress`, `download manager`, `EPUB open/read flow`

---

## 15. REST API quản trị

### 15.1. Nhóm endpoint

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/dashboard`
- `GET /api/novels`
- `POST /api/novels`
- `GET /api/novels/:id`
- `POST /api/novels/:id/sync`
- `POST /api/novels/:id/retry-failed`
- `DELETE /api/novels/:id`
- `GET /api/plugins`
- `GET /api/jobs`
- `GET /api/settings`
- `PUT /api/settings`

### 15.2. Nguyên tắc

- Toàn bộ `/api/*` ngoài login phải yêu cầu auth.
- Input dùng schema validation.
- API trả về trạng thái `syncStatus`, `lastError`, số chapter mới, tiến độ publish.

---

## 16. Bảo mật

### 16.1. Xác thực

- Admin Web UI bắt buộc đăng nhập.
- Có thể dùng `username/password` đơn giản cho giai đoạn đầu.
- Session lưu bằng cookie `httpOnly`, `secure`, `sameSite=lax` nếu chạy HTTPS.

### 16.2. Phân tách public/private

- `/opds/*` và `/storage/*` là public cho thiết bị đọc.
- `/api/*` là private.
- Nếu firmware hỗ trợ, có thể thêm basic auth cho OPDS trong tương lai.

### 16.3. Hardening

- Rate limit cho login và admin API.
- Helmet/CSP ở mức phù hợp cho web UI.
- Sanitize HTML nội dung trước khi nhúng vào EPUB.
- Không trust URL do plugin trả về nếu chưa validate domain/schema.

### 16.4. Secret management

- Secret chỉ nằm trong `.env`.
- Không commit tài khoản nguồn crawl nếu có.
- Cookie secret, admin password hash, token proxy phải tách khỏi source code.

---

## 17. Observability và vận hành

### 17.1. Health endpoints

- `GET /healthz`
- `GET /readyz`

`/healthz` kiểm tra tiến trình app còn sống.  
`/readyz` kiểm tra DB mở được, Redis kết nối được, storage ghi được.

### 17.2. Logging

- Structured logs dạng JSON.
- Mỗi log nên có: `timestamp`, `level`, `service`, `requestId` hoặc `jobId`, `novelId`, `pluginId`.
- Tách log app và worker.

### 17.3. Metrics tối thiểu

- Số job chờ, chạy, fail.
- Số lần sync thành công gần nhất.
- Số chapter fail theo source.
- Dung lượng `opds/` và `database/`.
- Mức sử dụng RAM của app/worker nếu có thể thu thập nhẹ.

### 17.4. Dashboard admin

Dashboard cần hiển thị:

- số truyện
- số chapter đã publish
- queue depth
- truyện đang sync
- lỗi gần nhất
- thời gian sync thành công gần nhất

---

## 18. Backup, restore, disaster recovery

### 18.1. Backup

- SQLite backup hằng ngày.
- Snapshot thư mục `opds/` hằng ngày hoặc theo giờ tùy dung lượng.
- Lưu ít nhất 7 bản gần nhất.

### 18.2. Restore

Kịch bản restore tối thiểu:

1. Dừng app và worker.
2. Khôi phục `library.db`.
3. Khôi phục `opds/`.
4. Chạy consistency check.
5. Khởi động lại app, worker, redis, proxy.

### 18.3. Kiểm tra sau restore

- OPDS root feed trả dữ liệu.
- Một series bất kỳ tải được chapter.
- Dashboard hiển thị đúng số lượng truyện.

---

## 19. Triển khai Docker

### 19.1. Dockerfile app/worker

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

EXPOSE 8787

CMD ["npm", "run", "start:app"]
```

### 19.2. docker-compose.yml đề xuất

```yaml
version: "3.9"

services:
  proxy:
    image: caddy:2
    container_name: online-library-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app

  app:
    build: .
    container_name: online-library-app
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - APP_ROLE=app
      - PORT=8787
      - DATABASE_URL=file:/data/database/library.db
      - STORAGE_PATH=/data
      - REDIS_URL=redis://redis:6379
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    volumes:
      - /srv/dev-disk-by-uuid-efa4bb57-8270-4740-be2c-01caa4be7407/docker-data/online-library:/data
    depends_on:
      - redis
    mem_limit: 512m
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8787/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3

  worker:
    build: .
    container_name: online-library-worker
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - APP_ROLE=worker
      - DATABASE_URL=file:/data/database/library.db
      - STORAGE_PATH=/data
      - REDIS_URL=redis://redis:6379
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    volumes:
      - /srv/dev-disk-by-uuid-efa4bb57-8270-4740-be2c-01caa4be7407/docker-data/online-library:/data
    depends_on:
      - redis
    mem_limit: 1024m

  redis:
    image: redis:7-alpine
    container_name: online-library-redis
    restart: unless-stopped
    mem_limit: 256m
    volumes:
      - redis_data:/data

volumes:
  redis_data:
  caddy_data:
  caddy_config:
```

---

## 20. Môi trường cấu hình

Ví dụ `.env`:

```env
NODE_ENV=production
PORT=8787
APP_BASE_URL=https://online-library.noe.asia
DATABASE_URL=file:/data/database/library.db
STORAGE_PATH=/data
REDIS_URL=redis://redis:6379
SESSION_SECRET=replace_me
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=replace_me
SYNC_CRON=0 * * * *
LOG_LEVEL=info
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

---

## 21. Failure scenarios và cách xử lý

### 21.1. Site nguồn đổi cấu trúc HTML

- Plugin trả lỗi parse.
- Chapter hoặc sync run bị đánh dấu `failed`.
- Dashboard hiển thị `lastError`.
- Không ảnh hưởng các truyện từ source khác.

### 21.2. Worker restart giữa lúc build EPUB

- File tạm vẫn nằm trong `temp/`.
- Chapter không được set `published`.
- Job sẽ retry lại theo queue policy.

### 21.3. Redis mất kết nối

- App vẫn có thể phục vụ OPDS và web read-only ở mức nhất định.
- Tác vụ sync mới bị chặn hoặc xếp chờ.
- `readyz` phải báo fail.

### 21.4. SQLite lock contention

- Giảm concurrency worker ghi DB.
- Dùng WAL mode.
- Nếu khối lượng tăng vượt ngưỡng, roadmap nâng lên Postgres.

### 21.6. Cạn RAM do browser automation

- Worker phải hạ concurrency về `1`.
- Tắt Puppeteer cho source không thực sự cần.
- Ưu tiên source dùng HTML tĩnh.
- Nếu vẫn thiếu tài nguyên, tách sync nặng sang khung giờ ít sử dụng.

### 21.5. Hết dung lượng ổ đĩa

- `readyz` fail.
- Worker dừng publish file mới.
- Dashboard hiển thị cảnh báo dung lượng.

---

## 22. Lộ trình triển khai

### Phase 1 - Core platform

- Setup Fastify app
- Setup Prisma + SQLite
- Setup Redis + BullMQ
- Setup auth cơ bản
- Setup storage layout

### Phase 2 - Crawl pipeline

- Port plugin từ v2
- Tích hợp Cheerio
- Thêm Puppeteer fallback
- Tạo queue `novel-sync`, `chapter-fetch`

### Phase 3 - EPUB + OPDS

- Build EPUB per chapter
- Atomic publish
- Tạo feed OPDS
- Kiểm thử tương thích Xteink

### Phase 4 - Firmware compatibility and enhancements

- Review OPDS client hiện có
- Thiết kế và triển khai cơ chế series/chapter navigation bắt buộc
- Sửa firmware cho chapter-based reading flow
- Sửa auth/cache/series handling nếu cần
- Kiểm thử tải feed, mở chapter, lưu tiến độ và chuyển chapter liên tục trên thiết bị

### Phase 5 - Web UI

- Dashboard
- Quản lý truyện
- Retry failed jobs
- Cấu hình cron và plugin status

### Phase 6 - Operations

- Healthchecks
- Structured logs
- Backup jobs
- Restore checklist

---

## 23. Tiêu chí hoàn thành

Hệ thống được xem là đạt v4 khi:

1. Người dùng thêm được truyện từ Web UI.
2. Sync chương mới hoạt động qua queue bền vững.
3. EPUB được build và publish an toàn.
4. Thiết bị Xteink đọc được OPDS feed, mở chapter EPUB và chuyển chapter đúng thứ tự.
5. Container restart không làm mất trạng thái sync.
6. Dashboard hiển thị lỗi và trạng thái chính xác.
7. Có backup DB và OPDS chạy định kỳ.
8. Admin API được bảo vệ bởi xác thực.

---

## 24. Quyết định kiến trúc

- Chọn `Fastify` thay vì để mở `Express/Fastify`.
- Chọn `BullMQ + Redis` thay vì `node-cron` đơn lẻ.
- Chọn `SQLite` cho single-host phase 1, chấp nhận giới hạn concurrency.
- Chọn `Puppeteer` làm fallback, không dùng mặc định cho mọi nguồn.
- Chọn `proxy + app + worker + redis` thay vì một container all-in-one.
- Tối ưu mặc định cho `Raspberry Pi 4 8GB` với concurrency thấp và browser automation giới hạn.

---

## 25. UX/UI Specification

### 25.1. Mục tiêu UX

Web UI không chỉ là bảng quản trị kỹ thuật. Đây là một sản phẩm hai lớp:

- lớp duyệt nội dung: tìm truyện, xem nguồn, xem mô tả, thêm vào thư viện
- lớp vận hành hệ thống: quản lý sync, extension, lỗi, cài đặt

Mục tiêu UX là:

- dùng tốt trên `iPhone 13 mini` trước, sau đó mở rộng lên tablet và desktop
- tách rõ `Thư viện` và `Nguồn`
- cho phép duyệt nội dung theo source ngay từ `home` của source
- hiển thị đủ thông tin để quyết định thêm truyện mà không phải mở nhiều màn hình
- quản lý extension theo kho, loại và trạng thái cài đặt

### 25.2. Information architecture

Điều hướng chính của hệ thống gồm:

- `Thư viện`
- `Nguồn`
- `Tác vụ`
- `Tiện ích`
- `Cài đặt`

Ý nghĩa từng khu:

- `Thư viện`: dữ liệu đã lưu cục bộ và đang được đồng bộ
- `Nguồn`: dữ liệu từ các extension, dùng để khám phá truyện mới
- `Tác vụ`: queue, tiến độ sync, lỗi, retry
- `Tiện ích`: quản lý extension core/community/custom và các registry
- `Cài đặt`: auth, lịch sync, storage, hệ thống

Không gộp `Thư viện` và `Nguồn` vào chung một menu vì chúng thuộc hai trạng thái dữ liệu khác nhau:

- `Thư viện` là dữ liệu local đã được theo dõi
- `Nguồn` là dữ liệu live từ external source

### 25.3. Navigation model

#### Mobile

Ưu tiên cho `iPhone 13 mini`:

- bottom tab bar gồm `Thư viện`, `Nguồn`, `Tác vụ`, `Tiện ích`
- `Cài đặt` nằm ở góc trên phải hoặc trong menu phụ
- mỗi màn hình là một cột duy nhất
- tránh modal phức tạp, ưu tiên full-screen page

#### Desktop

- sidebar trái cố định
- vùng nội dung chính ở giữa
- có thể có panel phải cho preview hoặc metadata
- giữ nguyên cùng tên menu như mobile để không đổi mental model

### 25.4. Responsive rules

#### Mobile first

Trên `iPhone 13 mini`, giao diện phải tuân thủ:

- tất cả màn chính dùng layout 1 cột
- mọi CTA chính nằm trong tầm ngón tay cái
- search bar sticky ở đầu màn
- card item không quá cao
- text truncate có kiểm soát
- không dùng hover để chứa hành động quan trọng

#### Breakpoints đề xuất

- `< 640px`: mobile compact
- `640px - 1023px`: tablet / large mobile
- `>= 1024px`: desktop

#### Hành vi theo breakpoint

- mobile: list/card 1 cột
- tablet: list 2 cột ở `Nguồn`, 1.5 pane ở `Tiện ích`
- desktop: sidebar + content + optional preview pane

### 25.5. Màn hình Thư viện

Đây là không gian quản lý dữ liệu local đã theo dõi. Nó không nên giống UX của màn hình browse source.

#### Mục tiêu

- biết truyện nào đang theo dõi
- biết truyện nào lỗi
- biết tiến độ tải
- sync hoặc retry thật nhanh

#### Thành phần chính

- local search
- filter theo trạng thái: `Đang theo dõi`, `Có lỗi`, `Hoàn tất`
- sort theo `Mới cập nhật`, `Tên`, `Nguồn`
- item card hoặc row có:
  - ảnh bìa
  - tên truyện
  - nguồn
  - số chương đã tải / tổng chương
  - trạng thái sync
  - lần cập nhật gần nhất
  - lỗi gần nhất nếu có
  - action: `Sync`, `Retry`, `Xóa`

#### Ưu tiên mobile

Trên mobile, item thư viện ưu tiên thông tin vận hành hơn mô tả dài:

- tên
- nguồn
- progress
- badge trạng thái
- action nhanh

Mô tả truyện chỉ nên xuất hiện ở detail, không cần chiếm nhiều diện tích ở list thư viện.

### 25.6. Màn hình Nguồn

Đây là màn hình quan trọng nhất sau `Thư viện`.

#### Mục tiêu

- duyệt truyện theo source
- xem `home` của source ngay khi chọn source
- tìm kiếm theo source
- xem mô tả trước khi thêm vào thư viện

#### Điều hướng trong màn Nguồn

Khi user chọn một source, phải có sub-navigation:

- `Trang chủ`
- `Tìm kiếm`
- `Thể loại` hoặc `Danh mục` nếu source hỗ trợ

Nếu source không hỗ trợ `home`, UI fallback sang trạng thái `search-first`.

#### Source home

Khi chọn source, hệ thống cần hiển thị ngay nội dung từ source:

- `Mới cập nhật`
- `Nổi bật`
- `Phổ biến`
- `Đề xuất`

Tùy extension, đây có thể là nhiều section hoặc một feed duy nhất. Tuyệt đối tránh trạng thái trắng chỉ có ô tìm kiếm nếu source có hỗ trợ `home`.

#### Search trong Nguồn

Search ở `Nguồn` là remote search, khác hoàn toàn với search local trong `Thư viện`.

Yêu cầu UX:

- search full-width
- filter source bằng chip hoặc source picker
- loading state rõ ràng
- cho phép `Tất cả nguồn` ở giai đoạn sau nếu có federated search

#### Item card truyện ở Nguồn

Mỗi item truyện cần có:

- ảnh bìa
- tên truyện
- tên nguồn
- tác giả nếu có
- mô tả ngắn 2-3 dòng
- thể loại hoặc tag
- trạng thái `ongoing/completed` nếu source trả về
- action chính `Thêm vào thư viện`

Card phải đủ thông tin để user quyết định mà không cần mở detail trong mọi trường hợp.

### 25.7. Màn hình Chi tiết truyện từ Nguồn

Đây là màn quyết định chuyển đổi từ browse sang follow.

#### Thành phần bắt buộc

- cover lớn
- tên truyện
- tác giả
- nguồn
- mô tả đầy đủ
- thể loại
- trạng thái
- tổng số chương nếu có
- preview chapter list
- action `Thêm vào thư viện`
- action `Đồng bộ ngay`

#### Fallback

Nếu source không trả mô tả:

- hiển thị `Chưa có mô tả từ nguồn`
- không để khoảng trắng lớn

### 25.8. Màn hình Tiện ích

Đây là khu vực quản lý extension và registry.

Hệ thống cần hỗ trợ:

- ext gốc đi kèm hệ thống
- ext cài thêm từ kho cộng đồng
- ext cài thêm từ registry hoặc URL riêng

#### Phân tầng trong Tiện ích

- `Đã cài`
- `Kho`
- `Khám phá`

#### Đã cài

Hiển thị:

- tên extension
- badge `Core`, `Community`, `Custom`
- version
- author
- source repo
- trạng thái `enabled/disabled/error/update available`
- action: `Bật`, `Tắt`, `Gỡ`, `Cập nhật`

#### Kho

Mỗi kho extension là một thực thể riêng:

- tên kho
- URL registry
- loại kho
- số extension tìm thấy
- lần đồng bộ cuối
- trạng thái online/offline

Ví dụ các kho ban đầu:

- `ext-vbook`
- `vbook-extensions`
- custom registry

#### Khám phá

Cho phép duyệt extension theo kho:

- search theo tên
- filter theo loại
- filter theo locale
- xem mô tả
- cài trực tiếp

### 25.9. Trust model cho extension

Vì extension đến từ nhiều nguồn, UI phải truyền tải được mức độ tin cậy.

#### Nhóm phân loại

- `Core`: extension ship cùng hệ thống
- `Community`: extension từ kho public
- `Custom`: extension từ URL hoặc kho người dùng thêm

#### Metadata nên hiển thị

- tác giả
- version
- source domain
- loại nội dung
- locale
- mô tả
- repo hoặc registry gốc

#### Cảnh báo

Khi cài `Custom` hoặc kho lạ, UI nên hiển thị cảnh báo nhẹ:

- extension này đến từ nguồn ngoài
- cần được user chủ động tin cậy

### 25.10. Tương thích với mô hình extension hiện có

UX cần tương thích với các repo extension đang tồn tại như:

- `https://github.com/dat-bi/ext-vbook`
- `https://github.com/Darkrai9x/vbook-extensions`

Từ góc nhìn sản phẩm, điều này kéo theo các yêu cầu:

- hệ thống phải hiểu khái niệm `registry`
- mỗi extension cần metadata riêng
- một source có thể hỗ trợ `home`, `search`, `detail`, `toc`, `chap`
- một số source có thể thêm `genre` hoặc listing theo trang

Vì vậy, UI không nên hard-code chỉ một kiểu source. Cần mô hình khả năng source theo capability:

- `supportsHome`
- `supportsSearch`
- `supportsGenre`
- `supportsPagination`
- `supportsDetailDescription`

### 25.11. Màn hình Tác vụ

Đây là cầu nối giữa người dùng và queue nền.

#### Nội dung cần có

- danh sách sync đang chạy
- failed jobs
- retry queue
- log rút gọn theo truyện hoặc source
- thời điểm sync gần nhất

#### Ưu tiên UX

- đơn giản hơn dashboard DevOps
- tập trung vào câu hỏi: cái gì đang chạy, cái gì đang hỏng, tôi làm gì tiếp

### 25.12. Search model

Hệ thống cần tách rõ hai kiểu search:

- `Search thư viện`: query local database
- `Search nguồn`: query remote source qua extension

Không dùng chung một ô search toàn cục cho cả hai ngữ cảnh ở phiên bản đầu vì dễ gây nhầm lẫn.

### 25.13. Empty, loading, error states

Các state bắt buộc phải có thiết kế riêng:

- thư viện trống
- chưa cài extension
- source không hỗ trợ `home`
- search không có kết quả
- source timeout
- ext registry fetch fail
- extension disabled
- extension incompatible schema
- sync đang chạy
- sync failed
- storage gần đầy

### 25.14. Accessibility baseline

UI cần đáp ứng tối thiểu:

- target cảm ứng tối thiểu đủ lớn cho mobile
- text không nhỏ quá trên `iPhone 13 mini`
- contrast rõ cho badge trạng thái
- icon không là nguồn thông tin duy nhất
- mô tả bị truncate phải có cách mở rộng ở detail

### 25.15. Visual direction

Phong cách giao diện nên là:

- giống trình quản lý thư viện hơn là bảng điều khiển kỹ thuật
- dùng cover truyện như điểm nhấn thị giác
- tông sáng hoặc neutral ấm
- badge trạng thái rõ nhưng không quá gắt
- card rõ cấu trúc, dễ quét bằng mắt trên mobile

Không nên dùng phong cách generic dashboard với quá nhiều bảng, số liệu và icon kỹ thuật ở tầng đầu.

### 25.16. Tài liệu wireframe

Wireframe chi tiết và sitemap cho mobile/desktop được tách riêng tại:

- [docs/UX_UI_WIREFRAMES.md](/d:/6.Work/AI-AGENTS/crosspoint-reader/docs/UX_UI_WIREFRAMES.md)

---

## 26. Kết luận

`XteinkReader Server v4.0` là bản thiết kế hướng production cho một hệ thống thư viện truyện self-hosted, tối ưu cho:

- tính liên tục 24/7
- tương thích firmware hiện có
- tự động hóa crawl và publish
- quản trị đơn giản qua web
- vận hành an toàn với queue, backup, logging và retry

Kiến trúc này giữ nguyên trải nghiệm đọc trên Xteink nhưng loại bỏ hoàn toàn phụ thuộc vào iOS app làm server nền.
