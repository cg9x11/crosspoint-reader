# Route Map v1

## Public shell

- `GET /`
- `GET /meta`
- `GET /login`
- `GET /assets/app.css`
- `GET /assets/app.js`
- `GET /healthz`
- `GET /readyz`

## Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

## Library

- `GET /library`
- `GET /library/:novelId`
- `GET /api/library/novels`
- `POST /api/library/novels`
- `GET /api/library/novels/:novelId`
- `POST /api/library/novels/:novelId/sync`
- `POST /api/library/novels/:novelId/retry`
- `DELETE /api/library/novels/:novelId`

## Sources

- `GET /sources`
- `GET /sources/:sourceId`
- `GET /api/sources`
- `GET /api/sources/:sourceId/home`
- `GET /api/sources/:sourceId/search`
- `GET /api/sources/:sourceId/detail`

## Tasks

- `GET /tasks`
- `GET /api/tasks/jobs`
- `POST /api/tasks/jobs/:jobId/retry`

## Extensions

- `GET /extensions`
- `GET /api/extensions`
- `GET /api/extensions/registries`
- `POST /api/extensions/registries`
- `POST /api/extensions/registries/refresh`
- `POST /api/extensions/registries/:registryId/refresh`
- `DELETE /api/extensions/registries/:registryId`
- `POST /api/extensions/:extensionId/install`
- `POST /api/extensions/:extensionId/enable`
- `POST /api/extensions/:extensionId/disable`

## Settings

- `GET /settings`
- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/settings/storage`
- `GET /api/settings/system`

## OPDS

- `GET /opds`
- `GET /opds/library`
- `GET /opds/series/:novelId`
- `GET /opds/download/:novelId/_series.json`
- `GET /opds/download/:novelId/:chapterIndex`
