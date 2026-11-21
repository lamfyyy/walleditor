# walleditor TODO

## Global Liquid Glass and themes
- Apply the selected White, OLED black, or Kawarp theme to Home, Projects, Settings, modals, cards, editor panels, status bar surfaces, and the bottom tab bar.
- Add a persistent Appearance settings subsection with theme selection and an always-visible Liquid Glass material.
- Keep Kawarp pink `#FF4FA3` as the active action accent while allowing the animated background colors to be changed.

## Project library and persistence
- Show locally persisted projects with search, modified date, active selection, duplicate, rename, create draft project, and delete project actions.
- Repair malformed/old local data through the versioned project model and serialize writes.
- Keep project state and export state separate; record the last successful export time.

## Layer editor
- Add layers from the supplied background, asset1, and asset2 resources.
- Support selection, rename, visibility, lock/unlock, delete, duplicate, z-order up/down, opacity, scale, position, rotation, reset, and per-layer animation controls.
- Enforce locked layers and expose undo/redo for active-project mutations.

## Kawarp preview
- Animate the supplied topographic texture with pan and zoom.
- Animate between configurable primary/secondary colors with intensity and speed controls.
- Keep the character artwork as independent layers and show the animated background in the full canvas preview and Kawarp-themed dashboard surfaces.

## Tendies export/import
- Build a portable walleditor `.tendies` package with manifest, project JSON, resource keys, and validation checks.
- Export to the native Share Sheet / Files flow and download on Web.
- Import through the native document picker, parse and validate the package, and add it as a new local project.
- Keep manual Pocket Poster import instructions and clearly label PosterBoard/CAML compatibility as unverified until device-tested.

## Settings
- Add Appearance, Storage & Projects, Export & Import, Logs/Diagnostics, and About subsections.
- Provide actionable project count, storage reset/repair, import/export shortcuts, test log event, and local-only diagnostics.

## Verification
- Run `pnpm check`, `pnpm lint`, and `pnpm test` after implementation.
- Build and download the unsigned device IPA through the macOS GitHub Actions workflow after the source checkpoint is pushed.
