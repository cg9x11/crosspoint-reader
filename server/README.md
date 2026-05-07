# XteinkReader Server

Server workspace for the web app, worker, database schema, queue runtime, and deployment files described in `DOC.md`.

## Current scope

- Fastify app bootstrap
- Prisma + SQLite schema
- Storage path abstraction
- BullMQ + Redis worker bootstrap
- Executable `vbook-js` runtime bridge for compatible community extensions
- Docker/Compose deployment for Raspberry Pi 4 8GB
- OPDS publish flow for firmware consumption

## Quick start

```bash
npm install
cp .env.example .env
npm run storage:ensure
npm run prisma:generate
npx prisma migrate deploy
npm run dev
```

## Production notes

- Compose bind mount path is controlled by `APP_DATA_DIR`
- Current production runbook is in `docs/PRODUCTION_RUNBOOK.md`
- Verified community source on the Raspberry Pi host:
  - `Truyện Hoàn`
