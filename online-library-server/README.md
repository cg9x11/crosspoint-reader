# CrossPoint Online Library Server

This service moves HTML parsing for Hako and TruyenFull off the X3/X4 firmware and exposes a small JSON API instead.

## Stack

- Node 20
- Fastify
- Cheerio
- Docker

## Run locally

```bash
cd online-library-server
npm install
npm start
```

Server URL:

- `http://127.0.0.1:8787`

Health check:

- `GET /health`

## Docker

```bash
cd online-library-server
docker compose up -d --build
```

Server URL on LAN:

- `http://192.168.1.202:8787`

## Nginx Proxy Manager

Recommended proxy host:

- Domain: `online-library.noe.asia`
- Forward host: `192.168.1.202`
- Forward port: `8787`
- Websocket support: off
- Cache assets: off
- Force SSL: on

Then use the public base URL in the plugin JSON:

- `https://online-library.noe.asia`

## Plugin mẫu cho firmware

Có sẵn hai file plugin mẫu trong repo:

- `artifacts/hako.server.cpplugin.json`
- `artifacts/truyenfull.server.cpplugin.json`

Mặc định hai file này đang trỏ tới:

- `https://online-library.noe.asia`

Nếu muốn test nội bộ trước khi mở qua Internet, đổi `source.baseUrl` thành:

- `http://192.168.1.202:8787`

## API

- `GET /health`
- `GET /api/v1/source/hako/home`
- `GET /api/v1/source/hako/search?query=sword&page=1`
- `GET /api/v1/source/hako/detail?url=<absolute-or-relative-url>`
- `GET /api/v1/source/hako/toc?url=<absolute-or-relative-url>`
- `GET /api/v1/source/hako/toc-page?url=<absolute-or-relative-url>&page=1`
- `GET /api/v1/source/hako/chapter?url=<absolute-or-relative-url>&title=...&index=1&sectionTitle=...&text=1&html=0`
- `GET /api/v1/source/truyenfull/home`
- `GET /api/v1/source/truyenfull/search?query=kiem&page=1`
- `GET /api/v1/source/truyenfull/detail?url=<absolute-or-relative-url>`
- `GET /api/v1/source/truyenfull/toc?url=<absolute-or-relative-url>`
- `GET /api/v1/source/truyenfull/toc-page?url=<absolute-or-relative-url>&page=1`
- `GET /api/v1/source/truyenfull/chapter?url=<absolute-or-relative-url>&title=...&index=1&sectionTitle=...&text=1&html=0`

All responses return HTTP 200 and use this shape:

```json
{
  "ok": true
}
```

Or:

```json
{
  "ok": false,
  "error": "short readable message"
}
```

## Notes

- `text=1&html=0` is the low-memory reader path for firmware.
- `text=0&html=1` is the EPUB/download path for firmware.
- Parser tests use the real HTML snapshots under repo `artifacts/`.

## VBook extension direction

Current server code still contains hardcoded source handlers for `hako` and `truyenfull`.

If we want the server to share the wider VBook extension ecosystem instead of rewriting source logic per site, the practical direction is:

- load real VBook extension packages or source directories
- preserve the original script entrypoints such as `home`, `search`, `detail`, `page`, `toc`, `chap`
- run those scripts inside a compatibility runtime that provides VBook globals like `load()`, `fetch()`, `Http`, `Html`, and `Response`
- normalize `Response.success(...)` back into the CrossPoint JSON API

The converter at `tools/convert_vbook_extension.py` now preserves `runtime.adapter.entrypoints` inside generated `cpplugin` files so a future server runtime can execute the original script map instead of guessing from filenames.

Important limitation:

- VBook scripts are synchronous and use jsoup-style DOM selectors.
- A Node-only VM can emulate part of that API, but a Java sidecar runner is likely the cleanest medium-term path for broader compatibility.
