# CIRCLE MENU — MASTER PLAN (v2 — FULL REBUILD)

> **NOTE (2026-10-21):** Owner rejected the v1 prototype ("pathetic kiddy script"). The previous HTML is to be discarded. This plan is a complete rewrite: architecture + design for the full product, built as one coherent release, not incremental scraps.

## CURRENT RELEASE STATE

- Production shell + heart command popover (Configure/Quit) built on a clean SVG heart.
- Drag, tap, long‑press, ring bloom/collapse, close X, quick‑settings placeholder, diagnostics panel all functional.
- No carousel rotation, tilt, pinch, center‑action assignments, JSON menu loading, or GitHub persistence yet.

## PRODUCT VISION
A floating, always‑on‑top circular launcher. A smiling orange heart floats over everything. One tap blooms a rotatable, tiltable, zoomable ring of action nodes. Content is data‑driven (JSON, hosted on GitHub), so menus can nest infinitely. Standalone first; designed to embed later into the owner's existing page.

## CORE CONCEPTS & VOCABULARY
*(unchanged – see previous plan)*

## FEATURE SPECIFICATION (COMPLETE SCOPE)
*(unchanged – see previous plan)*

## BUILD ORDER (one complete release, built in verifiable slices)
1. **Production shell + heart command popover** – ✅ (current)
2. **Carousel rotation + inertia** – **next slice**
3. **Tilt detents + pinch radius** – later
4. **Center button actions & settings** – later
5. **Menu engine + nested JSON + breadcrumbs** – later
6. **Content panel + GitHub save/load** – later
7. **Icon tiers + polish** – later
8. **Final integration & QA** – later

## BUILD GATES (per slice)
- **Slice 2 (Carousel rotation + inertia)**  
  - Horizontal drag on heart or any node rotates the ring.  
  - Flick gesture adds inertia; rotation slows with easing.  
  - Rotation state stored in `state.rotation` (degrees).  
  - Diagnostics log every rotation start, update, and stop.  
  - No visual glitches; nodes stay evenly spaced during rotation.  

*(subsequent slices retain their own gates as previously defined)*

## ACTIVE BUILD — TURN 8 (2026-10-21)

### Goal
Add carousel rotation with inertia to the existing production shell.

### Implementation scope
- Extend the global `state` object with `rotation` (0‑360).  
- Add pointer‑event listeners for horizontal drags on the heart (and fallback on the ring area).  
- Compute delta‑X → rotation delta (configurable sensitivity).  
- On `pointerup`, calculate flick velocity; if above a threshold, start an animation that decays rotation (inertia).  
- Update node positions on each animation frame using the current `state.rotation`.  
- Log start, updates, and inertia end to the diagnostics panel.  
- Ensure drag does not trigger tap or long‑press (already handled).  
- No changes to tilt, pinch, center actions, or JSON loading yet.

### Acceptance checks
- [ ] Dragging right rotates ring clockwise; left rotates counter‑clockwise.  
- [ ] A quick flick continues rotation with smooth deceleration.  
- [ ] Rotation angle wraps correctly (0‑360).  
- [ ] Nodes reposition instantly as rotation changes, staying on the circle.  
- [ ] Diagnostics panel records “rotation start”, “rotation delta X”, and “inertia end”.  
- [ ] No interference with existing tap/long‑press behavior.  
- [ ] Works on both mouse and touch (pointer events).  
- [ ] Layout remains usable on 360 × 800 and 390 × 844 screens.  

### Deferred to later slices
- Tilt detents & pinch‑to‑resize.  
- Center‑button gesture‑action assignment.  
- JSON menu loading, nested submenus, GitHub token workflow.  
- Full icon tier system.

## BACKLOG / FUTURE
*(unchanged – see previous plan)*

## DECISION LOG
- **2026-10-20:** v1 prototype built and iterated (core menu, theme toggle, draggable heart).  
- **2026-10-21:** Owner rejected v1; full redesign plan created.  
- **2026-10-21 — Turn 7:** Implemented production shell + long‑press popover.  
- **2026-10-21 — Turn 8 (this update):** Added carousel rotation with inertia to the plan; code to follow in next turn.

## TURN/STAGE LEDGER
| Turn | Stage | Status | Notes |
|------|-------|--------|-------|
| 1–4 | v1 prototype | ❌ Rejected |
| 5 | Full redesign plan | ✅ |
| 6 | Slice 1: Shell (heart + bloom + collapse) | ⏳ |
| 7 | Slice 1A: production shell + long‑press popover | ✅ |
| 8 | Slice 2: carousel rotation + inertia | 📋 Ready |

## RUN LOG
| Date | Result | What |
|---|---|---|
| 2026-10-20 | built | v1 prototype (superseded) |
| 2026-10-21 | updated plan | Full v2 redesign |
| 2026-10-21 | added slice 1A | Heart popover, quick‑settings placeholder |
| 2026-10-21 | plan updated | Carousel rotation slice added |
