# Webserver Endpoints

This document describes all HTTP and WebSocket endpoints available on the CrossPoint Reader webserver.

- [Webserver Endpoints](#webserver-endpoints)
  - [Overview](#overview)
  - [HTTP Endpoints](#http-endpoints)
    - [GET `/` - Home Page](#get----home-page)
    - [GET `/files` - File Browser Page](#get-files---file-browser-page)
    - [GET `/api/status` - Device Status](#get-apistatus---device-status)
    - [GET `/api/files` - List Files](#get-apifiles---list-files)
    - [POST `/upload` - Upload File](#post-upload---upload-file)
    - [POST `/mkdir` - Create Folder](#post-mkdir---create-folder)
    - [POST `/delete` - Delete File or Folder](#post-delete---delete-file-or-folder)
    - [GET `/api/plugins` - List Installed Plugins](#get-apiplugins---list-installed-plugins)
    - [POST `/api/plugins/import` - Import cpplugin](#post-apipluginsimport---import-cpplugin)
    - [POST `/api/plugins/delete` - Delete cpplugin](#post-apipluginsdelete---delete-cpplugin)
    - [GET `/api/plugins/tracked` - List Tracked Series](#get-apipluginstracked---list-tracked-series)
    - [POST `/api/plugins/tracked` - Upsert Tracked Series](#post-apipluginstracked---upsert-tracked-series)
    - [POST `/api/plugins/tracked/delete` - Delete Tracked Series](#post-apipluginstrackeddelete---delete-tracked-series)
    - [GET `/api/plugins/hako/search` - Search Hako Titles](#get-apipluginshakosearch---search-hako-titles)
    - [GET `/api/plugins/hako/detail` - Fetch Hako Title Metadata](#get-apipluginshakodetail---fetch-hako-title-metadata)
    - [GET `/api/plugins/hako/toc` - Fetch Hako Table Of Contents](#get-apipluginshakotoc---fetch-hako-table-of-contents)
    - [GET `/api/plugins/hako/chapter` - Fetch Hako Chapter Content](#get-apipluginshakochapter---fetch-hako-chapter-content)
    - [GET `/api/plugins/hako/updates` - Check Hako Updates](#get-apipluginshakoupdates---check-hako-updates)
  - [WebSocket Endpoint](#websocket-endpoint)
    - [Port 81 - Fast Binary Upload](#port-81---fast-binary-upload)
  - [Network Modes](#network-modes)
    - [Station Mode (STA)](#station-mode-sta)
    - [Access Point Mode (AP)](#access-point-mode-ap)
  - [Notes](#notes)


## Overview

The CrossPoint Reader exposes a webserver for file management and device monitoring:

- **HTTP Server**: Port 80
- **WebSocket Server**: Port 81 (for fast binary uploads)

---

## HTTP Endpoints

### GET `/` - Home Page

Serves the home page HTML interface.

**Request:**
```bash
curl http://crosspoint.local/
```

**Response:** HTML page (200 OK)

---

### GET `/files` - File Browser Page

Serves the file browser HTML interface.

**Request:**
```bash
curl http://crosspoint.local/files
```

**Response:** HTML page (200 OK)

---

### GET `/api/status` - Device Status

Returns JSON with device status information.

**Request:**
```bash
curl http://crosspoint.local/api/status
```

**Response (200 OK):**
```json
{
  "version": "1.0.0",
  "ip": "192.168.1.100",
  "mode": "STA",
  "rssi": -45,
  "freeHeap": 123456,
  "uptime": 3600
}
```

| Field      | Type   | Description                                               |
| ---------- | ------ | --------------------------------------------------------- |
| `version`  | string | CrossPoint firmware version                               |
| `ip`       | string | Device IP address                                         |
| `mode`     | string | `"STA"` (connected to WiFi) or `"AP"` (access point mode) |
| `rssi`     | number | WiFi signal strength in dBm (0 in AP mode)                |
| `freeHeap` | number | Free heap memory in bytes                                 |
| `uptime`   | number | Seconds since device boot                                 |

---

### GET `/api/files` - List Files

Returns a JSON array of files and folders in the specified directory.

**Request:**
```bash
# List root directory
curl http://crosspoint.local/api/files

# List specific directory
curl "http://crosspoint.local/api/files?path=/Books"
```

**Query Parameters:**

| Parameter | Required | Default | Description            |
| --------- | -------- | ------- | ---------------------- |
| `path`    | No       | `/`     | Directory path to list |

**Response (200 OK):**
```json
[
  {"name": "MyBook.epub", "size": 1234567, "isDirectory": false, "isEpub": true},
  {"name": "Notes", "size": 0, "isDirectory": true, "isEpub": false},
  {"name": "document.pdf", "size": 54321, "isDirectory": false, "isEpub": false}
]
```

| Field         | Type    | Description                              |
| ------------- | ------- | ---------------------------------------- |
| `name`        | string  | File or folder name                      |
| `size`        | number  | Size in bytes (0 for directories)        |
| `isDirectory` | boolean | `true` if the item is a folder           |
| `isEpub`      | boolean | `true` if the file has `.epub` extension |

**Notes:**
- Hidden files (starting with `.`) are automatically filtered out
- System folders (`System Volume Information`, `XTCache`) are hidden

---

### POST `/upload` - Upload File

Uploads a file to the SD card via multipart form data.

**Request:**
```bash
# Upload to root directory
curl -X POST -F "file=@mybook.epub" http://crosspoint.local/upload

# Upload to specific directory
curl -X POST -F "file=@mybook.epub" "http://crosspoint.local/upload?path=/Books"
```

**Query Parameters:**

| Parameter | Required | Default | Description                     |
| --------- | -------- | ------- | ------------------------------- |
| `path`    | No       | `/`     | Target directory for the upload |

**Response (200 OK):**
```
File uploaded successfully: mybook.epub
```

**Error Responses:**

| Status | Body                                            | Cause                       |
| ------ | ----------------------------------------------- | --------------------------- |
| 400    | `Failed to create file on SD card`              | Cannot create file          |
| 400    | `Failed to write to SD card - disk may be full` | Write error during upload   |
| 400    | `Failed to write final data to SD card`         | Error flushing final buffer |
| 400    | `Upload aborted`                                | Client aborted the upload   |
| 400    | `Unknown error during upload`                   | Unspecified error           |

**Notes:**
- Existing files with the same name will be overwritten
- Uses a 4KB buffer for efficient SD card writes

---

### POST `/mkdir` - Create Folder

Creates a new folder on the SD card.

**Request:**
```bash
curl -X POST -d "name=NewFolder&path=/" http://crosspoint.local/mkdir
```

**Form Parameters:**

| Parameter | Required | Default | Description                  |
| --------- | -------- | ------- | ---------------------------- |
| `name`    | Yes      | -       | Name of the folder to create |
| `path`    | No       | `/`     | Parent directory path        |

**Response (200 OK):**
```
Folder created: NewFolder
```

**Error Responses:**

| Status | Body                          | Cause                         |
| ------ | ----------------------------- | ----------------------------- |
| 400    | `Missing folder name`         | `name` parameter not provided |
| 400    | `Folder name cannot be empty` | Empty folder name             |
| 400    | `Folder already exists`       | Folder with same name exists  |
| 500    | `Failed to create folder`     | SD card error                 |

---

### POST `/delete` - Delete File or Folder

Deletes a file or folder from the SD card.

**Request:**
```bash
# Delete a file
curl -X POST -d "path=/Books/mybook.epub&type=file" http://crosspoint.local/delete

# Delete an empty folder
curl -X POST -d "path=/OldFolder&type=folder" http://crosspoint.local/delete
```

**Form Parameters:**

| Parameter | Required | Default | Description                      |
| --------- | -------- | ------- | -------------------------------- |
| `path`    | Yes      | -       | Path to the item to delete       |
| `type`    | No       | `file`  | Type of item: `file` or `folder` |

**Response (200 OK):**
```
Deleted successfully
```

**Error Responses:**

| Status | Body                                          | Cause                         |
| ------ | --------------------------------------------- | ----------------------------- |
| 400    | `Missing path`                                | `path` parameter not provided |
| 400    | `Cannot delete root directory`                | Attempted to delete `/`       |
| 400    | `Folder is not empty. Delete contents first.` | Non-empty folder              |
| 403    | `Cannot delete system files`                  | Hidden file (starts with `.`) |
| 403    | `Cannot delete protected items`               | Protected system folder       |
| 404    | `Item not found`                              | Path does not exist           |
| 500    | `Failed to delete item`                       | SD card error                 |

**Protected Items:**
- Files/folders starting with `.`
- `System Volume Information`
- `XTCache`

---

### GET `/api/plugins` - List Installed Plugins

Returns installed `cpplugin` metadata discovered under `/.crosspoint/plugins/`.

**Request:**
```bash
curl http://crosspoint.local/api/plugins
```

**Response (200 OK):**
```json
{
  "plugins": [
    {
      "id": "hako",
      "name": "Hako",
      "version": 1,
      "runtimeMode": "adapter",
      "runtimeProfile": "hako",
      "runtimeOrigin": "vbook",
      "baseUrl": "https://docln.sbs",
      "locale": "vi-VN",
      "contentType": "webnovel",
      "supportsSearch": true,
      "supportsTrackedUpdates": true,
      "supportsX3": true,
      "supportsX4": true,
      "filePath": "/.crosspoint/plugins/hako.cpplugin.json"
    }
  ]
}
```

---

### POST `/api/plugins/import` - Import cpplugin

Imports a raw `cpplugin` JSON document into `/.crosspoint/plugins/`.

**Request:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  --data @hako.cpplugin.json \
  http://crosspoint.local/api/plugins/import
```

**Response:** `OK`

**Validation notes:**
- requires `plugin`, `source`, and `runtime` sections
- requires a safe plugin id
- requires plugin version > 0
- requires `source.baseUrl`
- `runtime.mode = "adapter"` also requires `runtime.adapter.profile`
- requires at least one supported device in `deviceSupport`

**vBook conversion helper:**
```bash
python tools/convert_vbook_extension.py ../vbook-extensions/hako \
  --output artifacts/hako.adapter.cpplugin.json
```

---

### POST `/api/plugins/delete` - Delete cpplugin

Deletes an installed plugin by id.

**Request:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"hako\"}" \
  http://crosspoint.local/api/plugins/delete
```

**Response:** `OK`

---

### GET `/api/plugins/tracked` - List Tracked Series

Returns tracked series metadata used by the Hako EPUB update flow.

**Request:**
```bash
curl http://crosspoint.local/api/plugins/tracked
```

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "hako-12345678",
      "pluginId": "hako",
      "runtimeProfile": "hako",
      "title": "Example Title",
      "author": "Author Name",
      "seriesUrl": "https://docln.sbs/truyen/1234-example",
      "coverUrl": "https://docln.sbs/img/example.jpg",
      "epubPath": "/Books/Example Title.epub",
      "lastChapterUrl": "https://docln.sbs/truyen/1234-example/chuong-99",
      "lastChapterTitle": "Chapter 99",
      "chapterCount": 99
    }
  ]
}
```

---

### POST `/api/plugins/tracked` - Upsert Tracked Series

Creates or updates a tracked series record.

**Request:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{\"pluginId\":\"hako\",\"title\":\"Example Title\",\"seriesUrl\":\"https://docln.sbs/truyen/1234-example\",\"epubPath\":\"/Books/Example Title.epub\",\"lastChapterUrl\":\"https://docln.sbs/truyen/1234-example/chuong-99\",\"lastChapterTitle\":\"Chapter 99\",\"chapterCount\":99}" \
  http://crosspoint.local/api/plugins/tracked
```

**Notes:**
- `id` is optional for create; when omitted the firmware store generates/preserves the identity
- sending an existing `id` updates the record in place
- `runtimeProfile` is optional but recommended for adapter-imported sources so queued jobs still resolve the correct runtime path

**Response:** `OK`

---

### POST `/api/plugins/tracked/delete` - Delete Tracked Series

Deletes one tracked series record by id.

**Request:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"hako-12345678\"}" \
  http://crosspoint.local/api/plugins/tracked/delete
```

**Response:** `OK`

---

### GET `/api/plugins/hako/search` - Search Hako Titles

Executes the built-in Hako firmware adapter against the remote source search page.

**Request:**
```bash
curl "http://crosspoint.local/api/plugins/hako/search?query=overlord&page=1"
```

**Query Parameters:**

| Parameter | Required | Default | Description           |
| --------- | -------- | ------- | --------------------- |
| `query`   | Yes      | -       | Search keyword string |
| `page`    | No       | `1`     | Search result page    |

**Response (200 OK):**
```json
{
  "query": "overlord",
  "page": 1,
  "results": [
    {
      "title": "Overlord",
      "url": "https://docln.sbs/truyen/...",
      "description": "Latest chapter ...",
      "coverUrl": "https://docln.sbs/img/..."
    }
  ]
}
```

---

### GET `/api/plugins/hako/detail` - Fetch Hako Title Metadata

Fetches metadata for a Hako series detail page.

**Request:**
```bash
curl "http://crosspoint.local/api/plugins/hako/detail?url=https://docln.sbs/truyen/1234-example"
```

**Query Parameters:**

| Parameter | Required | Default | Description       |
| --------- | -------- | ------- | ----------------- |
| `url`     | Yes      | -       | Series detail URL |

**Response (200 OK):**
```json
{
  "title": "Example Title",
  "url": "https://docln.sbs/truyen/1234-example",
  "author": "Author Name",
  "coverUrl": "https://docln.sbs/img/example.jpg",
  "descriptionHtml": "<p>Series summary...</p>",
  "genres": ["Action", "Fantasy"],
  "ongoing": true
}
```

---

### GET `/api/plugins/hako/toc` - Fetch Hako Table Of Contents

Fetches the chapter list for a Hako series.

**Request:**
```bash
curl "http://crosspoint.local/api/plugins/hako/toc?url=https://docln.sbs/truyen/1234-example"
```

**Query Parameters:**

| Parameter | Required | Default | Description       |
| --------- | -------- | ------- | ----------------- |
| `url`     | Yes      | -       | Series detail URL |

**Response (200 OK):**
```json
{
  "url": "https://docln.sbs/truyen/1234-example",
  "chapters": [
    {
      "index": 1,
      "title": "Volume 1 Chapter 1",
      "url": "https://docln.sbs/truyen/1234-example/chuong-1"
    }
  ]
}
```

---

### GET `/api/plugins/hako/chapter` - Fetch Hako Chapter Content

Fetches and decodes a Hako chapter body, including protected chapter content when possible.

**Request:**
```bash
curl "http://crosspoint.local/api/plugins/hako/chapter?url=https://docln.sbs/truyen/1234-example/chuong-1&title=Chapter%201&index=1"
```

**Query Parameters:**

| Parameter | Required | Default | Description               |
| --------- | -------- | ------- | ------------------------- |
| `url`     | Yes      | -       | Chapter URL               |
| `title`   | No       | `""`    | Optional chapter title    |
| `index`   | No       | `0`     | Optional chapter sequence |

**Response (200 OK):**
```json
{
  "title": "Chapter 1",
  "url": "https://docln.sbs/truyen/1234-example/chuong-1",
  "index": 1,
  "html": "<div id=\"chapter-content\">...</div>",
  "text": "Plain text chapter content..."
}
```

---

### GET `/api/plugins/hako/updates` - Check Hako Updates

Compares the currently tracked chapter with the live Hako TOC and returns the delta needed to append or rebuild an EPUB.

**Request:**
```bash
curl "http://crosspoint.local/api/plugins/hako/updates?url=https://docln.sbs/truyen/1234-example&lastChapterUrl=https://docln.sbs/truyen/1234-example/chuong-99"
```

**Query Parameters:**

| Parameter        | Required | Default | Description |
| ---------------- | -------- | ------- | ----------- |
| `url`            | Yes      | -       | Series detail URL |
| `lastChapterUrl` | No       | `""`    | Last chapter already included in the local EPUB |

**Response (200 OK):**
```json
{
  "url": "https://docln.sbs/truyen/1234-example",
  "title": "Example Title",
  "author": "Author Name",
  "coverUrl": "https://docln.sbs/img/example.jpg",
  "chapterCount": 103,
  "lastKnownFound": true,
  "hasUpdates": true,
  "latestChapterUrl": "https://docln.sbs/truyen/1234-example/chuong-103",
  "latestChapterTitle": "Chapter 103",
  "newChapters": [
    {
      "index": 100,
      "title": "Chapter 100",
      "url": "https://docln.sbs/truyen/1234-example/chuong-100"
    }
  ]
}
```

**Notes:**
- `lastKnownFound=false` means the remote TOC changed and the client should rebuild the EPUB instead of appending
- `newChapters` may contain the full TOC when no `lastChapterUrl` is provided

---

## WebSocket Endpoint

### Port 81 - Fast Binary Upload

A WebSocket endpoint for high-speed binary file uploads. More efficient than HTTP multipart for large files.

**Connection:**
```
ws://crosspoint.local:81/
```

**Protocol:**

1. **Client** sends TEXT message: `START:<filename>:<size>:<path>`
2. **Server** responds with TEXT: `READY`
3. **Client** sends BINARY messages with file data chunks
4. **Server** sends TEXT progress updates: `PROGRESS:<received>:<total>`
5. **Server** sends TEXT when complete: `DONE` or `ERROR:<message>`

**Example Session:**

```
Client -> "START:mybook.epub:1234567:/Books"
Server -> "READY"
Client -> [binary chunk 1]
Client -> [binary chunk 2]
Server -> "PROGRESS:65536:1234567"
Client -> [binary chunk 3]
...
Server -> "PROGRESS:1234567:1234567"
Server -> "DONE"
```

**Error Messages:**

| Message                           | Cause                              |
| --------------------------------- | ---------------------------------- |
| `ERROR:Failed to create file`     | Cannot create file on SD card      |
| `ERROR:Invalid START format`      | Malformed START message            |
| `ERROR:No upload in progress`     | Binary data received without START |
| `ERROR:Write failed - disk full?` | SD card write error                |

**Example with `websocat`:**
```bash
# Interactive session
websocat ws://crosspoint.local:81

# Then type:
START:mybook.epub:1234567:/Books
# Wait for READY, then send binary data
```

**Notes:**
- Progress updates are sent every 64KB or at completion
- Disconnection during upload will delete the incomplete file
- Existing files with the same name will be overwritten

---

## Network Modes

The device can operate in two network modes:

### Station Mode (STA)
- Device connects to an existing WiFi network
- IP address assigned by router/DHCP
- `mode` field in `/api/status` returns `"STA"`
- `rssi` field shows signal strength

### Access Point Mode (AP)
- Device creates its own WiFi hotspot
- Default IP is typically `192.168.4.1`
- `mode` field in `/api/status` returns `"AP"`
- `rssi` field returns `0`

---

## Notes

- These examples use `crosspoint.local`. If your network does not support mDNS or the address does not resolve, replace it with the specific **IP Address** displayed on your device screen (e.g., `http://192.168.1.102/`).
- All paths on the SD card start with `/`
- Trailing slashes are automatically stripped (except for root `/`)
- The webserver uses chunked transfer encoding for file listings
