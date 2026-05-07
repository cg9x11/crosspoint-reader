# API Contract v1

## Library novel summary

```json
{
  "id": "uuid",
  "title": "Dau Pha Thuong Khung",
  "author": "Thien Tam Tho Dau",
  "sourceId": "truyenfull",
  "sourceName": "TruyenFull",
  "coverUrl": "/storage/covers/dptk.jpg",
  "status": "ongoing",
  "syncStatus": "idle",
  "totalChapters": 240,
  "downloadedChapters": 128,
  "lastCheckedAt": "2026-05-05T08:30:00.000Z",
  "lastSyncEndedAt": "2026-05-05T08:25:00.000Z",
  "lastError": null
}
```

## Source summary

```json
{
  "id": "truyenfull",
  "name": "TruyenFull",
  "trustType": "community",
  "version": "1.2.0",
  "enabled": true,
  "supportsHome": true,
  "supportsSearch": true,
  "supportsGenre": true,
  "supportsPagination": true,
  "supportsDetailDescription": true,
  "supportsBrowserAutomation": false,
  "language": "vi"
}
```

## Source home payload

```json
{
  "source": {
    "id": "truyenfull",
    "name": "TruyenFull"
  },
  "sections": [
    {
      "id": "latest",
      "title": "Moi cap nhat",
      "items": [
        {
          "id": "novel-1",
          "title": "Dau Pha Thuong Khung",
          "author": "Thien Tam Tho Dau",
          "coverUrl": "https://...",
          "description": "Mo ta ngan...",
          "status": "ongoing",
          "detailUrl": "https://..."
        }
      ]
    }
  ]
}
```

## Extension registry payload

```json
{
  "id": "ext-vbook",
  "name": "ext-vbook",
  "url": "https://github.com/dat-bi/ext-vbook",
  "trustType": "community",
  "status": "online",
  "lastSyncedAt": "2026-05-05T08:30:00.000Z",
  "extensionCount": 12
}
```

## Task/job payload

```json
{
  "id": "sync:novel-uuid",
  "queue": "novel-sync",
  "name": "sync-novel",
  "state": "active",
  "attemptsMade": 0,
  "createdAt": "2026-05-05T08:30:00.000Z",
  "startedAt": "2026-05-05T08:31:00.000Z",
  "finishedAt": null,
  "novelId": "uuid",
  "error": null
}
```

## Search separation rules

- `/api/library/novels?query=` always searches local database only.
- `/api/sources/:sourceId/search?query=` always searches a remote source only.
- Federated multi-source search is out of scope for v1.
