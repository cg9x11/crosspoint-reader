# Firmware Implementation Status

Date: 2026-05-05

## Completed in this repo

- `TASK-FW-101` complete:
  - `OpdsBookBrowserActivity` now detects chapter-style downloads (`ch_NNN.epub`)
  - series chapters are stored under a dedicated local folder instead of flat `/`
  - firmware tries to download sibling `_series.json` beside the chapter asset
  - if the remote manifest is unavailable, firmware synthesizes a minimal local `_series.json` from the current OPDS feed
- `TASK-FW-102` complete:
  - `OpdsParser` now parses feed title, summary/content, and OPDS image links in addition to the existing title/author/id/href fields
- `TASK-FW-103` partial-complete:
  - added `SeriesManifest`, `SeriesChapter`, `SeriesReadingContext`
  - added `_series.json` parsing and chapter resolution helpers
- `TASK-FW-104` complete:
  - `ReaderActivity` and `ActivityManager` now open EPUB by `SeriesReadingContext`
  - direct open by file path now auto-infers series context from `_series.json` when available
- `TASK-FW-105` complete:
  - `EpubReaderActivity` now supports inter-EPUB next/previous chapter navigation
  - backward turn from chapter start can open previous chapter at last page
  - forward turn from end-of-book can open next chapter
- `TASK-FW-106` complete:
  - `CrossPointState`, `JsonSettingsIO`, and `main.cpp` now persist and resume
    `openSeriesId`, `openSeriesDir`, `openChapterPath`, `openChapterIndex`
  - legacy `openEpubPath` is still kept in sync for compatibility
- `TASK-FW-107` partial-complete:
  - `RecentBooksStore` now dedupes by `seriesId` when present
  - recent-book JSON now persists `seriesId`
- `TASK-FW-108` complete:
  - `SleepActivity` now prefers `openChapterPath` over legacy `openEpubPath`
- reader-state hygiene complete:
  - TXT/XTC readers now clear stale series state before saving their own resume path

## Verified

- `pio run` succeeded on Windows after forcing UTF-8 console encoding.
- Final successful command:

```powershell
$env:PYTHONIOENCODING='utf-8'
$env:PLATFORMIO_FORCE_COLOR='false'
chcp 65001 > $null
pio run
```

## Still pending

- `TASK-FW-101` not implemented in this repo yet:
  - current `OpdsBookBrowserActivity` still downloads flat EPUB files to `/`
  - current OPDS parser/feed model does not yet provide a complete series materialization flow in firmware
- `TASK-FW-102` pending:
  - OPDS parser has not been extended with extra series metadata
- `TASK-FW-109` partial:
  - current behavior safely falls back to single-EPUB mode when manifest is missing/invalid
  - missing remote `_series.json` now falls back to synthesized local manifest
  - missing next-series chapter no longer forces an immediate jump home from end-of-book mode
- `TASK-FW-110` partial:
  - compile/build regression passed
  - runtime device validation matrix still needs manual testing on hardware

## Recommended next execution order

1. Run hardware regression for:
   - legacy single EPUB
   - series with valid `_series.json`
   - series with synthesized local manifest from OPDS feed
   - missing next chapter file
   - invalid `_series.json`
