# Online Library Device Validation

This checklist is for validating `Online Library` on real `X3` and `X4` devices after emulator verification.

## Goal

Confirm that button timing, e-ink refresh behavior, network handling, and background download flows still feel correct on hardware.

## Devices

- `xT/eInk X3`
- `xT/eInk X4`

## Preflight

1. Install a build that includes the latest `Online Library` changes.
2. Connect to Wi-Fi and confirm normal browsing works.
3. Start from a clean state if possible:
   - empty `Story Library`
   - empty `Downloads`
   - default `Online Library` settings unless a specific scenario is being tested

## Core Flow

1. Open `Online Library`.
2. Enter `Sources`.
3. Open `Hako`, `Truyen Full`, and `Web Truyen` one by one.
4. Confirm list movement and `Select` response feel immediate and consistent.
5. Confirm `Back` always returns to the previous screen without accidental double navigation.

## Search

1. Open a source and press `LEFT` to search.
2. Enter a query with fewer than 3 characters and confirm search is blocked clearly.
3. Enter a normal query and confirm results load correctly.
4. Move through results quickly and watch for:
   - selection lag
   - delayed e-ink refresh
   - stale preview content
   - accidental extra movement while holding buttons

## Preview Panels

1. In search results, stop on a story with a short summary.
2. Stop on a story with a long summary.
3. Confirm the preview hint makes sense on-device:
   - `Select: open detail for full summary`
4. Repeat the same check in `Story Library`.
5. Confirm text does not overflow or become too faint to read.

## Detail Screen

1. Open a story detail screen.
2. Confirm cover, metadata, and summary layout all fit without overlap.
3. On a long summary:
   - hold `Select`
   - confirm scroll mode is obvious
   - use `Up/Down` to move between summary pages
   - press `Select` again to exit
4. Confirm the hint text is understandable:
   - `Hold Select to scroll summary`
   - `Up/Down scroll | Select done`
5. Confirm normal actions still feel safe:
   - `Read Latest`
   - `Browse Chapters`
   - `Download EPUB` or `Update EPUB`
   - `Add to Library` / `Remove from Library`

## Story Library

1. Add multiple stories from different sources.
2. Open `Story Library`.
3. Confirm:
   - selection stays stable
   - preview updates after selection changes
   - `Select` opens detail directly
4. Hold `LEFT` to cycle filter.
5. Hold `RIGHT` to cycle sort.
6. Watch for accidental item open, accidental sync, or skipped input while holding.

## Downloads

1. Queue one story download.
2. Confirm only one active story download is processed at a time.
3. Confirm progress is visible and remains understandable during slow network conditions.
4. Test:
   - cancel
   - retry
   - clear finished
5. Confirm the device remains responsive while background work is active.

## Update Flow

1. Add a tracked story to `Story Library`.
2. Trigger `Check` on one item.
3. Trigger `All` on multiple items.
4. Confirm status transitions are understandable:
   - `Queued`
   - `Updating`
   - `Retry wait`
   - `Failed`
   - `New chapters`

## E-Ink Quality

Check these on both devices:

- text contrast remains readable in preview and detail panels
- no severe ghosting after repeated navigation
- popups remain legible
- selection highlight remains easy to track
- long summaries do not cause visually confusing partial refreshes

## Failure Cases

Test at least one failure path:

- source timeout
- missing cover
- failed detail load
- failed chapter load
- failed download retry path

Confirm the device still recovers cleanly and the user can back out safely.

## Sign-Off Notes

For each device, record:

- build version
- source tested
- pass/fail for search
- pass/fail for preview
- pass/fail for detail scroll mode
- pass/fail for background download
- pass/fail for story update flow
- notes about button timing or e-ink refresh quirks
