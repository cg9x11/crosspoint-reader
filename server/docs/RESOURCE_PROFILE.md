# Raspberry Pi 4 Resource Profile

Target host: Raspberry Pi 4 with 8 GB RAM, Docker deployment.

## Default service limits

- `proxy`: 128 MB
- `app`: 512 MB
- `worker`: 1024 MB
- `redis`: 256 MB

## Queue concurrency defaults

- `novel-sync`: 1
- `chapter-fetch`: 1
- `chapter-build`: 1
- `maintenance`: 1

## Runtime rules

- Prefer `Cheerio-first`, `Puppeteer-fallback`.
- `ENABLE_PUPPETEER=false` by default.
- Never run more than one browser-heavy task concurrently on the initial Pi profile.
- Use SQLite WAL mode and keep DB writes serialized through low worker concurrency.
- Build EPUBs through temp files and streaming where possible.
