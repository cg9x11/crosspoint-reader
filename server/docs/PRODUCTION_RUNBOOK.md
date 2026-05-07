# Production Runbook

## Target host

- Raspberry Pi 4 8GB
- Docker Compose stack
- current bind mount data path:
  - `/srv/dev-disk-by-uuid-efa4bb57-8270-4740-be2c-01caa4be7407/docker-data/crosspoint-reader/runtime`

## Current production shape

- app:
  - Fastify HTTP API + OPDS + web admin shell
- worker:
  - BullMQ consumers for sync/fetch/build
- redis:
  - queue-only, no persistence enabled

## Primary URLs

- browser shell:
  - `http://<host>:8787/`
- direct login:
  - `http://<host>:8787/login`
- health:
  - `http://<host>:8787/readyz`
- OPDS:
  - `http://<host>:8787/opds/library`

## Deploy

1. Sync `server/` source to `~/crosspoint-reader-server`
2. Keep `.env` on host
3. Rebuild and restart:

```sh
cd ~/crosspoint-reader-server
sudo -n docker compose up --build -d
sudo -n docker compose ps
```

## Required env

- `APP_BASE_URL=http://<host>:8787`
- `DATABASE_URL=file:/data/database/library.db`
- `STORAGE_PATH=/data`
- `APP_DATA_DIR=/srv/dev-disk-by-uuid-efa4bb57-8270-4740-be2c-01caa4be7407/docker-data/crosspoint-reader/runtime`
- `REDIS_URL=redis://redis:6379`
- `ADMIN_PASSWORD_HASH=sha256:<digest>`
- `SOURCE_ENABLED_ALLOWLIST=<sourceId1>,<sourceId2>`
- `SOURCE_PRIORITY_IDS=<sourceId1>,<sourceId2>`

## Source policy for current production

- active sources:
  - `ext:vbook-extensions-hako-novel-https-docln-sbs-b2fef1a6`
  - `ext:vbook-extensions-truyen-full-https-truyenfull-vi-556a351d`
- `SOURCE_ENABLED_ALLOWLIST` hides every other source from `/api/sources`, including bundled `core-demo`
- `SOURCE_PRIORITY_IDS` keeps `Hako Novel` first and `Truyện Full` second in the UI
- scheduled sync only enqueues novels whose `sourceId` is still visible by this policy

## Smoke checklist

1. `curl http://<host>:8787/readyz`
2. open `http://<host>:8787/` in browser and confirm redirect/login works
3. verify `/library`, `/sources`, `/tasks`, `/extensions`, `/settings` load after sign-in
4. login via `/api/auth/login`
5. `GET /api/sources`
6. `GET /api/sources/<sourceId>/home`
7. `GET /api/sources/<sourceId>/search?query=...`
8. `GET /api/sources/<sourceId>/detail?url=...`
9. `POST /api/library/novels`
10. verify `/opds/library`
11. verify `/opds/series/<novelId>`
12. verify `/opds/download/<novelId>/_series.json`

## Backup

Prefer backup when `app` and `worker` are stopped, or during a quiet window.

```sh
cd ~/crosspoint-reader-server
APP_DATA_DIR=/srv/dev-disk-by-uuid-efa4bb57-8270-4740-be2c-01caa4be7407/docker-data/crosspoint-reader/runtime \
BACKUP_DIR=/srv/dev-disk-by-uuid-efa4bb57-8270-4740-be2c-01caa4be7407/docker-data/crosspoint-reader/backups \
./scripts/backup-runtime.sh
```

## Known community-source caveats

- `Truyện Hoàn` is verified end-to-end on the production host.
- `qubook` redirects to ad domains and is not production-safe.
- `truyenchuth` no longer fails TLS inside runtime, but the upstream site/ext currently returns no usable detail/search payload.
- `nTruyen` and `Truyện Mới` install successfully, but some script paths still return upstream `HTTP Error: undefined`; those sources need site-specific follow-up.
