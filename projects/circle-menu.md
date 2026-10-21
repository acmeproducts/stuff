# CIRCLE MENU — MASTER PLAN (v2 — FULL REBUILD)

> **NOTE (2026-10-21):** Owner rejected the v1 prototype ("pathetic kiddy script"). The previous HTML is discarded. This plan is the complete rewrite: architecture + design for the full product, built in verifiable slices. All v1 remnants (theme toggle, A–F placeholder nodes, emoji heart) have been purged from the code.

## CURRENT RELEASE STATE

- Production shell: gradient SVG smiling heart launcher (draggable, tap to bloom, long‑press popover with Configure/Quit).
- Glass ring overlay: close X, center gear button (stub), 5 real SVG action icons (back, forward, share, print, quit).
- **Carousel rotation + inertia ✅** — tangential drag on the ring rotates nodes; flick decays with friction; angle wraps 0‑360; fully pointer‑event based (mouse + touch).
- In‑app diagnostics panel (collapsible) logs all interactions. No console‑only output.
- **Owner direction (2026-10-21):** next code must include tilt detents + pinch-to-resize AND seeded Configure-panel menus for real browser use plus at least one multi-level nested menu. GitHub token/save/load remains later unless owner re-prioritizes.
- Built since: tilt detents (0/15/30/45/60 snap), pinch + wheel radius, seeded Browser & multi-level Launcher menus, nested submenu navigation with breadcrumbs + back node, Configure panel (menu list, add/delete items, view readouts, reset), hover tooltips, pop-out window + PWA manifest, GitHub token save/load of menus JSON.
- Not yet built in code: editing existing items in-place, reordering items, center-action gesture assignment, icon tier system, embed mode.

## PRODUCT VISION
A floating, always‑on‑top circular launcher. A smiling orange heart floats over everything. One tap blooms a rotatable, tiltable, zoomable ring of action nodes. Content is data‑driven (local seeded menus now; JSON/GitHub later), so menus can nest infinitely. Standalone first; designed to embed later into the owner's existing page.

## CORE CONCEPTS & VOCABULARY
- **Heart:** floating launcher; tap toggles ring; drag moves; long-press opens command popover.
- **Ring/Stage:** overlay surface containing nodes; supports rotation, tilt, radius scaling.
- **Node:** circular action button positioned around the ring.
- **Menu:** data object `{ id, label, icon?, action?, children?[] }`; children create nested submenus.
- **Breadcrumb:** path stack for nested menus, rendered in config/ring header when menu engine lands.
- **Detent:** fixed tilt angle the ring snaps to after a vertical drag.

## FEATURE SPECIFICATION (COMPLETE SCOPE)
- Floating heart launcher: drag, tap bloom/collapse, long-press commands.
- Ring overlay: glass panel, close X, center button.
- Gestures: carousel rotation with inertia; axis-locked vertical tilt with detents; two-finger pinch and desktop wheel radius scaling.
- Data-driven menus: seeded local menus now; JSON load and nested navigation next; GitHub persistence later.
- Configure panel: local menu editor/seed viewer now; later imports/exports JSON, assigns center gestures, manages tokens.
- Diagnostics always visible/collapsible in-app.

## BUILD ORDER (adjusted by owner 2026-10-21)
1. **Production shell + heart command popover** — ✅
2. **Carousel rotation + inertia** — ✅
3. **Tilt detents + pinch radius + seeded Configure menus** — ✅
4. **Menu navigation engine: nested submenus, breadcrumbs, back node** — ✅
5. **GitHub token save/load of menus JSON** — ✅ (shipped early with slice 3/4 code)
6. **Editor upgrade: edit existing items in place + reorder (▲▼ first, drag later)** — **active next code**
7. **Center-button gesture-action assignment** — next after editor upgrade
8. **Icon tiers + polish** — later
9. **Final integration & QA** — later

## ACTIVE BUILD — TURN 10 (2026-10-21)

### Goal
Land code for slice 3: physical ring depth (tilt detents, pinch/wheel radius) plus a useful Configure panel seeded with professional menus: a Browser menu and a multi-level demo menu using repo/GitHub Pages-style entries and existing SVG icons. No GitHub network workflow yet.

### Non-negotiables
- Professional presentation only. No placeholder labels like A–F, no theme toggle, no cartoon/emoji assets.
- Existing tap, drag-heart, long-press popover, close X, rotation inertia, and node click suppression must keep working.
- All diagnostics in the in-app panel.

### Design decisions
- **Tilt model:** `state.tilt` degrees clamped 0–60. Applied to `#ringStage` as `transform: perspective(700px) rotateX(<tilt>deg)`; `transform-style: preserve-3d` on stage; nodes remain children so no per-node 3D math.
- **Detents:** 0°, 15°, 30°, 45°, 60°. No snapping while dragging; on pointerup animate to nearest detent in ~200 ms ease-out cubic.
- **Axis lock:** single-pointer stage drag classifies after ~8 px: dominant horizontal => rotation; dominant vertical => tilt. Lock until pointerup. Rotation inertia unchanged and only for rotation gestures; tilt has no inertia.
- **Pinch:** track two active pointers on stage; radius scale = start distance ratio. Desktop fallback: wheel over `#ringPanel`. Clamp `state.radiusScale` 0.5–1.0 and final radius to `>=70px` and `<= min(panelW,panelH)/2 - 46`. Persist `radiusScale` across close/open.
- **Seeded menus:** introduce `DEFAULT_MENUS` local data with at least:
  - `browser`: Back, Forward, Reload, Share, Print, Open Repo (stub/logs for now), children example under “More”.
  - `launcher`: nested multi-level sample such as Browser -> Dev -> GitHub Pages/Repo Actions; Media -> Volume/Play stubs; System -> Settings/Quit.
- **Configure panel:** center gear and popover Configure open a right-side/bottom sheet listing seeded menus, current ring menu, tilt/radius readouts, and buttons: Load Browser, Load Launcher Demo, Reset Defaults. Actions log to diagnostics; real editing/JSON/GitHub later.
- **Data boundary:** seeded menus are local constants in the HTML for this slice. They are shaped like final JSON so slice 4/5 can swap in loading without changing node rendering.

### Implementation scope
- Extend `state`: `tilt`, `radiusScale`, `activeMenuId`, `menuStack`.
- Add `TILT` constants, `PINCH` constants, pointer map for multi-pointer, axis classifier, `snapTilt()` rAF helper, wheel handler.
- Update `layoutRing()` to use `baseRadius * radiusScale`; call `positionNodes()` after tilt/radius changes.
- Extend click suppression from `rotDrag.moved` to shared `gesture.moved`.
- Add config sheet DOM/CSS and `renderConfig()`; wire center gear + popover Configure.
- Replace hard-coded `menuItems` usage with `renderMenu(currentMenu)` while preserving existing five browser actions as defaults.

### Acceptance checks
- [ ] Vertical drag tilts in 3D; release snaps to 0/15/30/45/60 with animation.
- [ ] Horizontal drag rotates with existing inertia; a drag never does rotation and tilt simultaneously.
- [ ] Pinch resizes live on touch; wheel resizes on desktop; clamps hold; radius persists across close/reopen.
- [ ] Configure opens from center gear and long-press Configure; shows seeded Browser and multi-level Launcher demo.
- [ ] Loading seeded menus rebuilds nodes using SVG icons; nested entries are present in data even if full navigation lands next slice.
- [ ] No v1 remnants reappear; no console-only diagnostics.
- [ ] Usable at 360×800 and 390×844; tilted nodes remain inside panel.

### Deferred (turn 11)
- Drag-to-reorder as a later enhancement on top of ▲▼ buttons.
- Center gesture assignment and full icon tier system.

## ACTIVE BUILD — TURN 11 (2026-10-21)

### Goal
Upgrade the Configure panel's menu editor: today items can only be added and deleted. Add in-place editing of existing items and reordering.

### Scope
- **Edit:** each row in "Edit: <menu>" gets an edit affordance. Clicking loads the item's label, icon, action and URL into the form, switches the form button to "Save Changes" with a Cancel option, and writes back to the same item on save (preserving id and children).
- **Reorder:** each row gets ▲ ▼ buttons that move the item up/down within its parent menu, persist, and rebuild nodes so ring order updates live. Button-based (not drag) for v1 so it works on touch and mouse alike.
- **Submenu safety:** editing an item with children keeps its children intact; reorder only touches the current level's array.
- Persist via existing `persistMenus()`; rebuild nodes + refresh ring layout after every edit/reorder; log each operation to diagnostics.

### Acceptance checks
- [ ] Edit populates the form from an existing item and saving updates it in place (id/children preserved).
- [ ] ▲▼ reorder updates ring node order immediately and survives reload.
- [ ] Add mode still works; switching between add/edit modes is explicit (Cancel restores add mode).
- [ ] No regressions: submenu navigation, GitHub save/load, gestures, tooltips.

## BACKLOG / FUTURE
- Drag-to-reorder items in the editor (▲▼ shipped first).
- Center button gesture-action assignment (tap/double-tap/long-press).
- Icon tiers: built-in SVG, URL, emoji-free professional sets.
- Embed mode for owner’s existing page.
- Multi-window sync: pop-out window reflects menu edits via storage events.

## DECISION LOG
- **2026-10-20:** v1 prototype built and iterated.
- **2026-10-21:** Owner rejected v1; full redesign plan created.
- **2026-10-21 — Turn 7:** Production shell + long-press popover built.
- **2026-10-21 — Turn 8:** Carousel rotation + inertia built; owner ordered purge of all v1 remnants; code rebuilt clean.
- **2026-10-21 — Turn 9:** Tilt/pinch slice specified; earlier engine runs failed on credit/time.
- **2026-10-21 — Turn 10:** Owner re-scoped slice 3 to include seeded Configure menus for browser and multi-level demo; plan updated before code.
- **2026-10-21 — Turn 11:** Owner asked for editor item editing + reordering; plan updated before code. Build order re-baselined to reflect slices 3–5 already shipped.

## TURN/STAGE LEDGER
| Turn | Stage | Status | Notes |
|------|-------|--------|-------|
| 1–4 | v1 prototype | ❌ Rejected |
| 5 | Full redesign plan | ✅ |
| 6 | Slice 1: Shell (heart + bloom + collapse) | ✅ |
| 7 | Slice 1A: production shell + long-press popover | ✅ |
| 8 | Slice 2: carousel rotation + inertia | ✅ |
| 9 | Slice 3 planned | ✅ |
| 10 | Slice 3 re-scoped: gestures + seeded config menus | ✅ Built |
| 10b | Submenus, tooltips, pop-out window, GitHub sync | ✅ Built |
| 11 | Editor upgrade planned: edit + reorder items | 📋 Plan updated — code next |

## RUN LOG
| Date | Result | What |
|---|---|---|
| 2026-10-20 | built | v1 prototype (superseded) |
| 2026-10-21 | updated plan | Full v2 redesign |
| 2026-10-21 | added slice 1A | Heart popover, quick-settings placeholder |
| 2026-10-21 | built | Carousel rotation + inertia |
| 2026-10-21 | rebuilt | Professional shell, all v1 remnants purged |
| 2026-10-21 | plan updated | Slice 3 specified |
| 2026-10-21 11:54 | failed | Engine credit/time failure |
| 2026-10-21 13:01 | failed | Engine credit/time failure |
| 2026-10-21 13:22 | failed | Engine credit/time failure |
| 2026-10-21 | plan updated | Owner re-scope accepted; code for tilt/pinch + seeded menus is next |
| 2026-10-21 14:14 | Main | built projects/circle-menu.html | Done. | 5c2fe4f |
| 2026-10-21 14:41 | Main | built projects/circle-menu.html | Fixed the real bugs — node clicks were being killed by pointer capture, and tilt rotated the wrong way — and added the missing pieces: hover | 0fee5f2 |
| 2026-10-21 | plan updated | Turn 11: editor item editing + reordering specified; build order re-baselined |
| 2026-10-21 23:08 | Main | built projects/circle-menu.html | Honest answer: the editor upgrade was planned but hadn't fully landed in the code yet — it's landing now. This update adds the missing "Open | a6f1032 |
