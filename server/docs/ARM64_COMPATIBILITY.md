# ARM64 Compatibility Notes

## Baseline

- Base image: `node:22-bookworm-slim`
- Architecture target: `linux/arm64`
- Database: SQLite
- Queue broker: Redis 7

## Notes

- Prisma supports ARM64 Linux when `prisma generate` runs inside the target image.
- SQLite has no special ARM64 blocker for this deployment shape.
- Chromium is the heaviest dependency. Keep it optional until browser-driven sources are needed.
- Prefer Debian-based images over Alpine for Chromium/Puppeteer compatibility on Raspberry Pi.
- Avoid native add-ons unless they provide a clear benefit over pure JS alternatives.
