# Redboard — Master Plan (sole authority)

## Vision
A single-file, mobile-first HTML app that faithfully recreates the **Caseboard** conspiracy-wall experience (original: React/Vite/TS app by vishalnaikawadi; ours must remain ONE self-contained file: `projects/redboard.html`). No backend beyond GitHub file storage via PAT. All diagnostics in-app, never console-only.

## What the ORIGINAL actually is (authoritative reference, from owner 2026-10-21)
- **Home screen**: grid of case boards with live thumbnails; rename/delete; "Add new board".
- **Infinite canvas**: pan/zoom like Figma, on a **procedurally generated cork board texture** (warm brown, NOT black).
- **Evidence dock**: magnifying dock at the bottom; drag tools onto the board; tools with variants open a picker.
- **Item types**: Polaroid photos (upload/URL/drop/paste, handwritten caption), sticky notes + lined notes (handwritten font, colour variants), newspaper clippings (Microlink link preview, torn-paper style), map clippings (Nominatim search + OSM tiles, circle spots), case folders (manila folder holding PDFs/docs).
- **Red thread**: connect any two items (or a circled map spot); push-pins appear at tie points; thread mode via T or spool tool; click-to-chain; Esc to exit.
- **Per-item editing**: move, resize, rotate (Shift snaps 15°), bring-to-front/send-to-back, duplicate, delete; floating toolbar + right-click menu; full undo/redo.
- **PNG export** at 2× (whole board or current view).
- **Storage**: IndexedDB only (owner adds: boards must import/export as JSON files, PNG/JPEG, stored in GitHub using a PAT held in secrets).
- **Aesthetic**: warm cork/paper/handwritten detective look. Red is for THREAD and pins only — never big red UI buttons on black.

## v1 post-mortem (owner feedback 2026-10-21)
- ❌ Dark navy background + big red toolbar buttons on black = "engineering debacle"; must look professional like the original.
- ❌ Items "can't move or resize" — drag wiring unreliable; no resize/rotate at all; no selection model.
- ❌ Wrong storage (localStorage), wrong item set (only note/photo), strings drawn wrong (used screen coords via toBoardPos on world coords).
- Decision: **full rewrite** of redboard.html against the corrected spec below, staged so each build stays playable.

## Scope correction
- TARGET remains `projects/redboard.html` (single file). The original's `src/` React structure is reference only — we do NOT recreate the file tree.
- Microlink/Nominatim/OSM tiles: allowed as browser-side calls, same as original, but degrade gracefully offline with in-app diagnostic messages.

## Build backlog (priority order)
1. **R2 — Canvas & look**: cork texture background (procedural, tiled), warm palette, professional dark-neutral dock (magnify-on-hover) instead of red button bar; proper world-coordinate pan/zoom (single translate+scale transform); in-app diagnostics panel (collapsible).
2. **R3 — Items**: sticky notes (colour variants, handwritten-style font via Google Fonts or fallback), polaroid photos (upload + paste + drop, caption), lined note. Each item: select, drag-move, resize handle, rotate handle (Shift snaps 15°), z-order raise/lower, duplicate, delete via floating mini-toolbar.
3. **R4 — Thread**: red curved thread (quadratic curve) between item pin anchors, push-pin rendering at anchors, thread mode (T / spool tool, click-to-chain, Esc exit), click thread to cut.
4. **R5 — Boards & storage**: multiple boards + home grid with thumbnails; IndexedDB persistence (debounced); undo/redo stack.
5. **R6 — Clippings**: newspaper (Microlink preview, torn-paper variant), map (Nominatim + OSM tiles, circle markers, threads can tie to visible markers only).
6. **R7 — Case folder**: drop files into manila folder item, click to open/download (stored as blobs in IndexedDB).
7. **R8 — GitHub sync**: export/import board as JSON (+ embedded images) to a repo file using a PAT the user pastes (stored locally in-browser, never hardcoded); PNG export of board at 2×.
8. **R9 — Shortcuts & polish**: keyboard shortcut set from original (T, Enter, ⌫, ⌘D, ]/[, arrows, ⌘Z/⇧⌘Z, ⌘+/−/0, ⇧1, Esc); context menu; toasts.

## Open bugs
- B1: v1 items not reliably draggable; no resize/rotate (fixed by R3 rewrite).
- B2: v1 string coordinates wrong after pan/zoom (fixed by R4 world-space rendering).
- B3: v1 saves to localStorage not IndexedDB (fixed by R5).

## Open questions
- Q1: Which item types are must-have for the first rebuilt version? (Recommendation: sticky notes + polaroids + thread first, maps/newspapers later.)
- Q2: GitHub PAT sync — owner pastes PAT into an in-app settings dialog stored in localStorage, correct? (No real "secrets" store exists in a static single file.)

## TURN/STAGE LEDGER
| Date | Turn/Stage | Action | Status |
|------|-----------|--------|--------|
| 2026-10-21 | T4 | Wrote projects/redboard.html v1 (dark theme, note/photo/string, localStorage) | ✅ Done |
| 2026-10-21 | T5 | Owner supplied original Caseboard README + harsh feedback; recorded authoritative spec, v1 post-mortem, staged rebuild backlog R2–R9; plan corrected (TARGET stays projects/redboard.html) | ✅ Done |

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-10-21 12:58 | Main | failed | The AI account is out of credit or at its spending limit. |  |
| 2026-10-21 13:03 | Main | failed | The AI account is out of credit or at its spending limit. |  |
