# CIRCLE MENU — MASTER PLAN (v2 — FULL REBUILD)

> **NOTE (2026-10-21):** Owner rejected the v1 prototype ("pathetic kiddy script"). The previous HTML is discarded. This plan is the complete rewrite: architecture + design for the full product, built in verifiable slices. All v1 remnants (theme toggle, A–F placeholder nodes, emoji heart) have been purged from the code.

## CURRENT RELEASE STATE

- Production shell: gradient SVG smiling heart launcher (draggable, tap to bloom, long‑press popover with Configure/Quit).
- Glass ring overlay: close X, center gear button (stub), 5 real SVG action icons (back, forward, share, print, quit).
- **Carousel rotation + inertia ✅** — tangential drag on the ring rotates nodes; flick decays with friction; angle wraps 0‑360; fully pointer‑event based (mouse + touch).
- In‑app diagnostics panel (collapsible) logs all interactions. No console‑only output.
- Not yet built: tilt detents, pinch radius, center‑action assignments, JSON menu loading, nested submenus, GitHub persistence.

## PRODUCT VISION
A floating, always‑on‑top circular launcher. A smiling orange heart floats over everything. One tap blooms a rotatable, tiltable, zoomable ring of action nodes. Content is data‑driven (JSON, hosted on GitHub), so menus can nest infinitely. Standalone first; designed to embed later into the owner's existing page.

## CORE CONCEPTS & VOCABULARY
*(unchanged — see previous plan)*

## FEATURE SPECIFICATION (COMPLETE SCOPE)
*(unchanged — see previous plan)*

## BUILD ORDER (one complete release, built in verifiable slices)
1. **Production shell + heart command popover** — ✅
2. **Carousel rotation + inertia** — ✅
3. **Tilt detents + pinch radius** — **next slice (active)**
4. **Center button actions & settings** — later
5. **Menu engine + nested JSON + breadcrumbs** — later
6. **Content panel + GitHub save/load** — later
7. **Icon tiers + polish** — later
8. **Final integration & QA** — later

## ACTIVE BUILD — TURN 9 (2026-10-21)

### Goal
Give the ring physical depth: vertical drags tilt it in 3D with snapping detents, and two‑finger pinch (plus mouse wheel) rescales the ring radius.

### Design decisions
- **Tilt model:** `state.tilt` in degrees, clamped 0–60. Applied as `perspective() rotateX()` on `#ringStage` so the far edge recedes. Nodes stay children of the stage so they tilt together (no per-node math).
- **Detents:** 0°, 15°, 30°, 45°, 60°. When a tilt drag ends, the tilt animates to the nearest detent over ~200 ms with ease-out. While dragging there is no snapping (direct control).
- **Gesture split:** single-pointer drags on the ring stage classify by dominant axis after ~8 px of movement — horizontal → rotation (existing), vertical → tilt (new). Once classified, the axis locks until pointerup. This prevents accidental tilt while spinning.
- **Pinch:** two pointers on the stage → track distance; radius scales by distance ratio. Desktop fallback: mouse wheel over the ring adjusts radius. Radius clamps to 70 px min and `(min(panelW,panelH)/2 − 46)` max. `state.radiusScale` (0.5–1.0 multiplier) persists across open/close.
- **Inertia unchanged:** rotation inertia only applies to rotation gestures; tilt has no inertia (snaps to detent instead).
- **Diagnostics:** log "tilt start", "tilt → N° (detent)", "pinch start", "radius → Npx", "wheel radius → Npx".

### Implementation scope
- Extend `state` with `tilt` (0) and `radiusScale` (1.0).
- Wrap ring contents: apply `transform: perspective(700px) rotateX(var)` on `#ringStage`; add CSS `transform-style: preserve-3d` where needed.
- Extend the pointer handler on `#ringStage` to support two simultaneous pointers (pinch) and axis classification for single-pointer drags.
- Add `snapTilt()` animation helper (requestAnimationFrame, ease-out cubic).
- Add wheel listener on `#ringPanel` for desktop radius control.
- `layoutRing()` computes `state.radius = baseRadius * state.radiusScale`; call `positionNodes()` after every tilt/radius change.
- Node click suppression already keyed off `rotDrag.moved`; extend to tilt/pinch moves.

### Acceptance checks
- [ ] Dragging up/down on the ring tilts it smoothly (3D perspective visible).
- [ ] Releasing a tilt drag snaps to the nearest detent (0/15/30/45/60) with a short animation.
- [ ] Horizontal drags still rotate; vertical drags tilt; never both at once.
- [ ] Two-finger pinch grows/shrinks the ring radius live; clamps at min/max.
- [ ] Mouse wheel over the ring resizes on desktop.
- [ ] Rotation inertia still works after these changes.
- [ ] Tap, long-press popover, close X, and node clicks unaffected (no click fires after a drag).
- [ ] Radius scale persists when closing and reopening the ring.
- [ ] Diagnostics log tilt snaps and radius changes.
- [ ] Usable at 360×800 and 390×844; tilt never clips nodes outside the panel.

### Deferred to later slices
- Center-button gesture-action assignment (slice 4).
- JSON menu loading, nested submenus, breadcrumbs (slice 5).
- GitHub token, save, load workflow (slice 6).
- Full icon tier system (slice 7).

## BACKLOG / FUTURE
*(unchanged — see previous plan)*

## DECISION LOG
- **2026-10-20:** v1 prototype built and iterated.
- **2026-10-21:** Owner rejected v1; full redesign plan created.
- **2026-10-21 — Turn 7:** Production shell + long-press popover built.
- **2026-10-21 — Turn 8:** Carousel rotation + inertia built (tangential drag, flick decay, wrap 0‑360). Owner then ordered purge of all v1 remnants; code rebuilt clean.
- **2026-10-21 — Turn 9 (this update):** Tilt detents + pinch-to-resize slice planned; axis-locked gesture classification chosen so rotation and tilt never fight.

## TURN/STAGE LEDGER
| Turn | Stage | Status | Notes |
|------|-------|--------|-------|
| 1–4 | v1 prototype | ❌ Rejected |
| 5 | Full redesign plan | ✅ |
| 6 | Slice 1: Shell (heart + bloom + collapse) | ✅ |
| 7 | Slice 1A: production shell + long-press popover | ✅ |
| 8 | Slice 2: carousel rotation + inertia | ✅ |
| 9 | Slice 3: tilt detents + pinch radius | 📋 Planned — code next |

## RUN LOG
| Date | Result | What |
|---|---|---|
| 2026-10-20 | built | v1 prototype (superseded) |
| 2026-10-21 | updated plan | Full v2 redesign |
| 2026-10-21 | added slice 1A | Heart popover, quick-settings placeholder |
| 2026-10-21 | built | Carousel rotation + inertia (9b34031) |
| 2026-10-21 | rebuilt | Professional shell, all v1 remnants purged (a853b33) |
| 2026-10-21 | plan updated | Slice 3 (tilt detents + pinch radius) specified; code to land next turn |
