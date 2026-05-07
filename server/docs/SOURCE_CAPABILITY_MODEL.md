# Source Capability Model v1

## Required fields

- `id`
- `name`
- `trustType`
- `enabled`

## Capability flags

- `supportsHome`
- `supportsSearch`
- `supportsGenre`
- `supportsPagination`
- `supportsDetailDescription`
- `supportsBrowserAutomation`

## Optional metadata

- `language`
- `region`
- `baseUrl`
- `version`
- `maintainer`

## Rendering rules

- If `supportsHome=false`, UI opens the source in search-first mode.
- If `supportsGenre=false`, UI hides category browsing entirely.
- If `supportsPagination=false`, UI treats listing responses as complete pages.
- If `supportsDetailDescription=false`, UI shows title/author/cover only and hides long-description blocks.
- If `supportsBrowserAutomation=true`, scheduler must treat the source as high-cost on Raspberry Pi.
