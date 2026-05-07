# Extension Trust Model v1

## Trust types

- `core`: shipped with the system, enabled by default unless explicitly disabled.
- `community`: installed from known public registries, enabled only after explicit install.
- `custom`: installed from user-supplied URLs or private registries, always requires warning UI.

## Required metadata

- `id`
- `name`
- `version`
- `trustType`
- `sourceUrl`
- `description`
- `maintainer`
- `capabilities`

## UI rules

- `core` extensions use neutral status styling and are not removable in v1.
- `community` extensions show repository origin and last sync state.
- `custom` extensions show an explicit external-source warning before enable/install.

## Execution rules

- Disabled extensions never appear in the source list.
- Extensions with invalid metadata are rejected before registration.
- `custom` extensions are opt-in and can be globally disabled through policy later.
