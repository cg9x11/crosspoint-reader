# Server Implementation Status

Date: 2026-05-05

## Completed

- `TASK-001` complete:
  - route map v1 in [ROUTE_MAP.md](/d:/6.Work/AI-AGENTS/crosspoint-reader/server/docs/ROUTE_MAP.md)
- `TASK-002` complete:
  - API contract v1 in [API_CONTRACT_V1.md](/d:/6.Work/AI-AGENTS/crosspoint-reader/server/docs/API_CONTRACT_V1.md)
- `TASK-003` complete:
  - source capability model in [SOURCE_CAPABILITY_MODEL.md](/d:/6.Work/AI-AGENTS/crosspoint-reader/server/docs/SOURCE_CAPABILITY_MODEL.md)
- `TASK-004` complete:
  - extension trust model in [EXTENSION_TRUST_MODEL.md](/d:/6.Work/AI-AGENTS/crosspoint-reader/server/docs/EXTENSION_TRUST_MODEL.md)
- `TASK-100` complete:
  - Raspberry Pi 4 resource profile in [RESOURCE_PROFILE.md](/d:/6.Work/AI-AGENTS/crosspoint-reader/server/docs/RESOURCE_PROFILE.md)
- `TASK-101` complete:
  - Fastify app bootstrap, config loader, root route, `/healthz`, `/readyz`
- `TASK-102` partial-complete:
  - Prisma schema implemented
  - initial SQL migration committed
  - `prisma generate` passes
- `TASK-103` complete at baseline level:
  - cookie-based admin session with signed HMAC token
  - `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`
  - `/api/*` protection hook added
- `TASK-104` complete:
  - storage abstraction and directory preparation scripts implemented
- `TASK-106` complete:
  - ARM64 runtime notes documented in [ARM64_COMPATIBILITY.md](/d:/6.Work/AI-AGENTS/crosspoint-reader/server/docs/ARM64_COMPATIBILITY.md)
- `TASK-201` complete at scaffold level:
  - BullMQ queues and Redis connection factory implemented
- `TASK-202` complete:
  - worker bootstrap and queue consumers implemented
- `TASK-203` complete:
  - `Novel.syncStatus` and `Chapter.status` move through queue-backed lifecycle
- `TASK-205` complete:
  - cron-based scheduled sync scan added in worker
- `TASK-206` complete:
  - low-concurrency defaults wired through env/config
- `TASK-1101` partial-complete:
  - Dockerfile and compose are now deployed on Raspberry Pi with healthchecks, bind-mounted app data, and log rotation
- `TASK-1105` complete:
  - resource limits/logging/healthcheck baseline applied in compose
- `TASK-301` complete:
  - extension metadata normalization for bundled/core and community registries
- `TASK-302` complete:
  - registry add/list/remove/refresh APIs implemented
  - real registry ingestion verified against `ext-vbook` and `vbook-extensions`
- `TASK-303` complete:
  - extension install/enable/disable implemented
  - installed package metadata cached under runtime storage
- `TASK-304` complete:
  - source list API implemented from bundled + enabled extensions
- `TASK-401` complete:
  - plugin runtime execution layer implemented for bundled/core sources
  - compatible `vbook-js` extensions can now execute `home/search/detail/toc/chap`
- `TASK-402` complete:
  - source home/search/detail APIs implemented
- `TASK-403` complete:
  - add-novel-to-library flow implemented from source detail
- `TASK-404` complete:
  - chapter list sync and upsert implemented through worker jobs
- `TASK-405` complete:
  - chapter content fetch and sanitize implemented before EPUB build
- `TASK-501` complete:
  - per-chapter EPUB builder implemented
- `TASK-502` complete:
  - atomic publish flow implemented through temp build + rename
- `TASK-503` complete:
  - `_series.json` generation implemented and aligned with firmware contract
- `TASK-504` complete:
  - OPDS root/library/series/download routes implemented

## Verified

- `npm install` passed
- `npm run storage:ensure` passed
- `npm run validate` passed:
  - `prisma generate`
  - TypeScript build
- auth/session routes compile in the main app build
- local smoke passed using direct worker handlers:
  - bundled core source detail
  - novel sync -> fetch -> build
  - EPUB publish
  - `_series.json` publish
- local registry smoke passed:
  - `ext-vbook` refresh
  - `vbook-extensions` refresh
  - community extension install + enable state
- remote deploy verified on `192.168.1.202` on 2026-05-05:
  - SSH reachable
  - Docker Compose build/start succeeded on Raspberry Pi 4 ARM64
  - host bind-mount data moved to `/srv/dev../data-docker/crosspoint-reader/runtime`
  - HTTP auth/session verified
  - source list/home/search/detail verified for compatible sources
  - demo novel sync/build verified
  - OPDS feed + chapter download verified
  - community registry refresh + extension visibility verified
  - community source end-to-end verified:
    - `Truyện Hoàn`
    - `home -> search -> detail -> add library -> sync -> build -> OPDS download`
  - extension state mutation race fixed:
    - concurrent install/enable no longer drops installed entries
  - DOM compatibility gap fixed:
    - `NodeList.text()/html()/attr()` now follow jQuery-like semantics needed by vbook scripts

## Not fully verified locally

- `prisma migrate deploy` could not be verified on this Windows host because Prisma returned a generic schema engine error even with a committed migration file.
- BullMQ full runtime still relies on Redis, so the local end-to-end proof on Windows used direct handler execution instead of a real local Redis-backed compose stack.

## Known limits

1. Not every community extension is production-safe; upstream site behavior is still the biggest source of breakage.
2. `qubook` currently redirects to ad domains and fails intentionally in runtime validation flow.
3. `truyenchuth` no longer fails on TLS inside the runtime, but the upstream site/ext currently returns no usable payload.
4. Some compatible sources still need source-specific follow-up, for example `nTruyen` and `Truyện Mới` returning upstream `HTTP Error: undefined`.
5. Redis is intentionally configured without persistence in Docker to avoid Raspberry Pi snapshot/write failures for queue-only usage.
6. Frontend web UI routes and screens are still pending; current deliverable is backend + OPDS vertical slice.
