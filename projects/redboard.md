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
- Decision: **full rewrite** of redboard.html against the corrected spec, staged so each build stays playable.
- v2 (current code, commit a4852d4): cork texture, pan/zoom, neutral dock, sticky/lined/photo items, move/resize/rotate, red thread with pins, IndexedDB. ✅ look fixed; gestures now reworked per T6.

## NEW OWNER DIRECTIVES (2026-10-21, T6 — implement in next code write)
1. **Gesture rework (fixes select-vs-drag conflict):**
   - Single tap/click an item = select only (no accidental drag).
   - **Double-tap/double-click an item = enter edit mode** for that item: now it can be dragged to move, and the resize + rotate (reorient) handles appear. Tap empty space or another item to leave edit mode.
   - **Long-press on a push-pin = unpin** (cut all threads tied at that pin, remove pin). No other unpin gesture.
2. **Map link item (new type `maplink`):**
   - Added via a **proper in-app modal** — never `prompt()`/`alert()`. Modal fields: **Title** (text) + **URL** (validated: must be http(s); Google Maps links — google.com/maps, maps.google.*, maps.app.goo.gl, goo.gl/maps — recognised and flagged as map links).
   - Item shows a **small location preview** (Google Maps embed/static preview when possible; graceful fallback: title text + link icon).
   - **Title is clickable** → opens the URL in a new tab.
   - Fully board-native: resizable, rotatable, movable, thread-tieable like any item.
   - The generic photo-by-URL dock button must ALSO use this same modal pattern (title + validated URL), not `prompt()`.
3. **Undo/redo:** snapshot stack (items + threads + z-order), ⌘Z / ⇧⌘Z plus toolbar buttons; debounced snapshots on every mutation.
4. **GitHub JSON sync (required):** push/pull the board as JSON (images embedded as data-URLs) to a repo file via the GitHub Contents API. Settings dialog collects: PAT, owner/repo, path, branch. PAT stored in localStorage only.
   - ⚠️ **PAT caveat (flagged to owner):** no PAT value is visible to the build agent in chat, and a static HTML file cannot read server-side "secrets". So the PAT must be pasted into the app's settings dialog by the owner. If the owner expected automatic secret injection, they must say so or paste the PAT.

## Scope correction
- TARGET remains `projects/redboard.html` (single file). The original's `src/` React structure is reference only — we do NOT recreate the file tree.
- Microlink/Nominatim/OSM tiles/Google embeds: allowed as browser-side calls, but degrade gracefully with in-app diagnostic messages.

## Build backlog (priority order)
1. ~~R2 — Canvas & look~~ ✅ (v2)
2. ~~R3 — Items: sticky/lined/photo, select/move/resize/rotate, toolbar~~ ✅ (v2)
3. ~~R4 — Thread: curved red thread, push-pins, thread mode, cut~~ ✅ (v2)
4. **R5 — Gesture rework** (T6 #1): double-tap edit mode, tap=select, long-press pin to unpin, no drag-on-first-touch.
5. **R6 — Modal system + maplink item** (T6 #2): reusable modal (title + validated URL), maplink item with preview/fallback, clickable title; migrate photo-URL tool to modal.
6. **R7 — Undo/redo** (T6 #3): history stack, shortcuts, buttons.
7. **R8 — GitHub sync** (T6 #4): settings dialog (PAT/repo/path), push/pull JSON via Contents API, conflict handling, in-app status + diagnostics.
8. **R9 — Boards & storage**: multiple boards + home grid with thumbnails; IndexedDB (already present for single board).
9. **R10 — Clippings**: newspaper (Microlink, torn-paper), map clippings (Nominatim + OSM tiles, circled spots, thread to visible markers only).
10. **R11 — Case folder**: drop files into manila folder, click to open/download (blobs in IndexedDB).
11. **R12 — PNG export** at 2× (whole board or view) + JSON file export/import (local).
12. **R13 — Shortcuts & polish**: full shortcut set, context menu, toasts.

## Open bugs
- B1: v1 items not reliably draggable; no resize/rotate → fixed in v2, being reworked in R5 per new gesture model.
- B2: v1 string coordinates wrong after pan/zoom → fixed in v2 (world-space rendering).
- B3: v1 saves to localStorage not IndexedDB → fixed in v2 (IndexedDB + fallback).
- B4: drag fires on first touch instead of requiring double-tap edit mode → R5.
- B5: photo-URL uses system `prompt()` → R6.

## Open questions
- Q1: Which item types are must-have next after R5–R8? (Recommendation: maplink + undo/redo + sync first, then newspaper/map clippings.)
- Q2: ~~GitHub PAT storage~~ → partially resolved T6: owner says "use the PAT in the secret provided", but no secret reaches the agent and static files can't read server secrets. Default: paste-PAT settings dialog (localStorage). **Awaiting owner confirmation or pasted PAT.**
- Q3: Map preview preference — Google Maps embed iframe (works without API key) vs static image? (Recommendation: embed iframe, fallback to link icon + title.)

## TURN/STAGE LEDGER
| Date | Turn/Stage | Action | Status |
|------|-----------|--------|--------|
| 2026-10-21 | T4 | Wrote projects/redboard.html v1 (dark theme, note/photo/string, localStorage) | ✅ Done |
| 2026-10-21 | T5 | Owner supplied original Caseboard README + harsh feedback; recorded authoritative spec, v1 post-mortem, staged rebuild backlog; plan corrected (TARGET stays projects/redboard.html) | ✅ Done |
| 2026-10-21 | T5b | v2 rewrite landed (a4852d4): cork texture, pan/zoom, neutral dock, sticky/lined/photo, move/resize/rotate, red thread + pins, IndexedDB | ✅ Done |
| 2026-10-21 | T6 | Owner directives recorded: gesture rework (double-tap edit, long-press pin to unpin), maplink item via proper modal (title + validated URL, preview, clickable title), undo/redo, GitHub JSON sync; PAT caveat flagged (no secret visible to agent; paste-in-dialog default); backlog re-ordered R5–R8 | ✅ Done |

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-10-21 12:58 | Main | failed | The AI account is out of credit or at its spending limit. |  |
| 2026-10-21 13:03 | Main | failed | The AI account is out of credit or at its spending limit. |  |
| 2026-10-21 13:19 | Main | failed | The AI account is out of credit or at its spending limit. |  |
| 2026-10-21 13:52 | Main | failed | Venice took too long. |  |
| 2026-10-21 14:42 | Main | failed | Venice took too long. |  |
| 2026-10-21 20:21 | Main | built projects/redboard.html | Full professional rebuild: warm procedural cork board with Figma-style pan/zoom (wheel + pinch), a neutral magnifying evidence dock (sticky | a4852d4 |
