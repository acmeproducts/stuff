# CIRCLE MENU — MASTER PLAN (v2 — FULL REBUILD)

> **NOTE (2026-10-21):** Owner rejected the v1 prototype ("pathetic kiddy script"). The previous HTML is to be discarded. This plan is a complete rewrite: architecture + design for the full product, built as one coherent release, not incremental scraps.

## CURRENT RELEASE STATE

The current build is the first production-quality vertical slice:

- Replace the legacy prototype completely.
- Establish the real floating heart, draggable behavior, transparent ring, and close control.
- Add the 600 ms heart long-press popover with working **Configure** and **Quit** commands.
- Establish a functional quick-settings foundation without inventing fake menu data.
- Keep carousel rotation, tilt, pinch, nested JSON, GitHub persistence, and the complete icon system in their planned release slices.

## PRODUCT VISION
A floating, always-on-top circular launcher. A smiling orange heart floats over everything. One tap blooms a rotatable, tiltable, zoomable ring of action nodes. Content is data-driven (JSON, hosted on GitHub), so menus can nest infinitely. Standalone first; designed to embed later into the owner's existing page.

## CORE CONCEPTS & VOCABULARY
- **Heart (The Orb):** Orange circle with smiling face. The idle state of the whole app. Draggable anywhere on screen. Sits above all other content (top z-index layer).
- **Ring:** Transparent container that blooms around the heart's position. Contains the node carousel + center button + close X (top-right corner of the container).
- **Nodes:** Circular icon buttons arranged on the ring. Count is dynamic = number of entries in the active JSON menu definition.
- **Center Button:** Dual-role. Root menu = gear icon (opens Settings). Inside a submenu = up-arrow (go back one level). Tap-and-hold on up-arrow = breadcrumb chain for jumping to any ancestor level.
- **Menu Definition (JSON):** Array of `{ label, icon, action }` entries. `action` is either a URL to open, or a URL ending in `.json` which loads as a submenu (nesting).
- **Diagnostics Panel:** In-app collapsible log strip. All state changes, gesture events, loads, and errors are reported here — never console-only.

## FEATURE SPECIFICATION (COMPLETE SCOPE)

### F1 — The Heart (Orb)
- Orange gradient sphere with a friendly smiling face (drawn SVG, not emoji).
- Free drag-and-drop anywhere; position persists for the session (and later via localStorage).
- **Single tap:** bloom the ring, anchored at the heart's current position.
- **Tap-and-hold (long-press ~600ms):** small radial popover with two options: **Configure** (opens Settings) and **Quit** (collapses app to a minimal dormant state / removes overlay).
- While ring is open, the heart remains the gesture surface (see F3).

### F2 — The Ring Container
- Transparent box (no visible background; only ring track, nodes, center, X are visible).
- Close **✕** pinned to its top-right corner; collapses back to just the heart.
- Ring sizes itself to viewport with safe margins so nodes never clip off-screen; if the heart is near an edge, the ring shifts to stay fully visible.

### F3 — Gesture Engine (on the heart face + ring)
- **Horizontal drag on face:** rotate ring. Drag right → clockwise; left → counter-clockwise. Ring rotation has inertia (flick and it spins, easing to rest).
- **Carousel drag on nodes:** dragging any node around the circle rotates the whole ring the same way.
- **Vertical drag on face:** tilt the ring in 3D perspective through discrete detents: **0° → 10° → 25° → 45° → 65° → 85° → 90°**. Drag down increases tilt, drag up decreases. Snaps to nearest detent with haptic-like visual bounce. At 90° the ring is edge-on (a thin line) — a deliberate "minimized ribbon" state.
- **Pinch on face:** scales ring radius (circumference), which re-spaces nodes evenly. Clamped min/max. Live during the pinch.

### F4 — Center Button & Settings Modal
- Root level: **gear icon**. Tap opens Settings modal:
  - Ring color / theme
  - Ring size (default radius)
  - Gesture sensitivity (rotation + tilt thresholds)
  - Assignable actions for **tap-and-hold on center** and **double-tap on center** (pick from: open settings, collapse, back, rotate-to-top, custom URL)
- Submenu level: center becomes **↑** (back one level). Tap-and-hold shows breadcrumb chain of the navigation path; tapping any crumb jumps straight there.

### F5 — Content Configuration & Data Layer
- **Content panel** (opened from Settings): edit the menu as pairs — `icon` + `action URL` (+ optional label). Add/remove/reorder entries.
- Definitions saved as **JSON to GitHub** (repo file via GitHub Contents API with a personal access token entered in Settings; stored locally, never hardcoded).
- **Nesting:** an action URL ending in `.json` is fetched and rendered as a submenu instead of navigating away. Navigation stack maintained in memory.
- **Dynamic nodes:** node count = entries in active JSON; layout, angles, and carousel all compute from live count.

### F6 — Icon System
- Quality tiers selectable in configuration: **Tier 1 flat SVG** → **Tier 2 gradient/depth SVG** → **Tier 3 glossy 3D-style** (layered SVG with highlights/shadows).
- Starter set (all three tiers, hand-drawn inline SVG): **forward, back, quit, print, share, gear, up-arrow, close-X, heart-face**.
- Icons referenced by name in JSON; unknown names fall back to a neutral dot icon.

### F7 — Integration Path (Deferred but designed-for)
- Standalone page now; later embed into the owner's existing page by dropping in the single file + one container div. All styles namespaced (`cm-` prefix) to avoid collisions. No global CSS leaks.

## ARCHITECTURE (single file, modular sections)
1. **CSS layer** — variables (colors, radius, tilt), namespaced classes, 3D perspective on ring wrapper.
2. **Icon library** — `ICONS = { name: {tier1, tier2, tier3} }` SVG factories.
3. **State store** — single `state` object: `{ navStack, activeMenu, rotation, tilt, radius, settings, heartPos }` + `render()` that reflects state to DOM.
4. **Gesture engine** — pointer-event based (mouse+touch unified): tap / double-tap / long-press / horizontal-drag / vertical-drag / pinch, with sensitivity from settings and inertia for rotation.
5. **Menu engine** — fetch/parse JSON, validate entries, build nodes, push/pop nav stack, breadcrumbs.
6. **Settings & content panels** — modals bound to state, persisted to localStorage; GitHub save via Contents API.
7. **Diagnostics** — `log()` writes to in-app panel + optional state inspector readout.

## DATA SCHEMA (menu JSON)
```json
{
  "menu": [
    { "label": "Share", "icon": "share", "action": "https://example.com/share" },
    { "label": "Tools", "icon": "gear", "action": "https://example.com/menus/tools.json" }
  ]
}
```
- `action` ending in `.json` → submenu; anything else → open URL.
- Validation: entries missing icon get fallback; bad URLs are flagged in diagnostics and skipped.

## BUILD ORDER (one complete release, built in verifiable slices)
1. **Production shell + heart command popover:** polished orange SVG face, drag-anywhere, tap → transparent ring blooms at heart position, ✕ collapses, 600 ms long-press → Configure/Quit, and a functional quick-settings foundation. *(CURRENT)*
2. **Gesture engine:** face drag rotate (CW/CCW + inertia), node carousel drag.
3. **Tilt detents + pinch radius.**
4. **Complete center role + settings:** sensitivity controls, center tap-and-hold and double-tap assignments, and submenu up-arrow behavior.
5. **Menu engine + nested JSON + breadcrumbs.**
6. **Content panel + GitHub JSON save/load.**
7. **Icon tiers + starter set polish.**
8. **Final integration pass + real-device QA.**

## BUILD GATES (per slice)
- Works on a real phone viewport: touch gestures smooth, no clipped nodes.
- Diagnostics panel shows every gesture/state event live.
- No console-only output; no placeholder stubs — every control functional.
- Read-back verify after each write.

## ACTIVE BUILD — TURN 7 (2026-10-21)

### Goal
Deliver the first production-quality vertical slice rather than another patch to the rejected prototype. The visible new improvement is the heart long-press command popover, built on the real shell so it is not another remedial demo.

### Implementation scope
- Delete the legacy emoji heart, fake A–F menu entries, old theme button, and obsolete compatibility markup.
- Create a namespaced single-file shell with no external dependencies.
- Draw the orange smiling face as inline SVG with gradient depth; do not use an emoji.
- Keep the heart as the topmost interactive layer and support free pointer dragging with viewport clamping.
- Resolve pointer actions so dragging, long-press, and tapping cannot accidentally trigger one another.
- A short tap opens the transparent ring around the heart; the ring shifts when necessary to remain inside the viewport.
- Place a real close control in the ring's top-right corner; tapping it collapses the ring.
- After approximately 600 ms, show a small accessible popover with **Configure** and **Quit**.
- **Configure** opens the quick-settings panel and changes ring color and radius immediately.
- **Quit** hides the entire interactive overlay and leaves a minimal restore affordance so the app is not permanently trapped.
- Provide a collapsible in-app diagnostics strip that records pointer gestures, long-press activation, ring state, settings changes, quit, and restore.
- Use pointer events for mouse, pen, and touch, with equivalent keyboard activation where practical.

### Acceptance checks
- [ ] The previous remedial UI is absent; no emoji heart, fake menu entries, or old theme toggle remain.
- [ ] The heart is a polished inline-SVG orange sphere with a clearly drawn smile.
- [ ] The heart renders above all page content and remains within the viewport when dragged.
- [ ] A drag does not also produce a tap or long-press command.
- [ ] A short tap blooms the transparent ring and shows the close control.
- [ ] The close control collapses the ring without hiding the heart.
- [ ] Holding for approximately 600 ms opens the Configure/Quit popover.
- [ ] Moving beyond the gesture cancellation threshold prevents long-press activation.
- [ ] Configure opens working controls that visibly update ring color and radius.
- [ ] Quit hides the interactive overlay and the restore control brings the heart back.
- [ ] Keyboard activation can open the ring and invoke the long-press menu without pointer input.
- [ ] All visible controls have labels, keyboard focus states, and adequate touch targets.
- [ ] The layout is usable at 360 × 800 and 390 × 844 without clipping.
- [ ] Every gesture and state change appears in the in-app diagnostics panel.
- [ ] There are no console-only diagnostics and no fake data or dead controls.

### Explicitly deferred to later release slices
- Carousel rotation and inertia.
- Tilt detents and pinch-to-resize.
- Center gesture-action assignment.
- JSON menu loading and nested submenus.
- GitHub token, save, and load workflow.
- Complete three-tier icon library.

## BACKLOG / FUTURE
- Persist heart position + open state across reloads.
- Sound/haptic feedback on detent snap.
- PWA manifest + offline caching of fetched menus.
- Remote analytics/export of diagnostics.

## DECISION LOG
- **2026-10-20:** v1 prototype built and iterated (core menu, theme toggle, draggable heart).
- **2026-10-21:** Owner rejected v1 as too primitive; ordered full redesign with complete requirements (heart orb, gesture engine, tilt detents, pinch, nested JSON menus via GitHub, icon tiers). Plan rewritten from scratch; previous HTML to be replaced wholesale. ✅
- **2026-10-21 — Turn 7:** The long-press Configure/Quit feature is promoted into the first production shell slice so it is implemented on the real SVG heart and ring rather than attached to the rejected prototype. A functional quick-settings panel is included in this slice to avoid dead controls; advanced settings and the remaining release features remain queued.

## IMMUTABLE WORKING RULES
- Mobile-first; touch and mouse both supported via pointer events.
- All diagnostics in-app.
- Update this plan before code changes.
- No stubs, no fake data — real working slices only.

## TURN/STAGE LEDGER
| Turn | Stage | Status | Notes |
|------|-------|--------|-------|
| 1–4 | v1 prototype | ❌ Rejected | Owner discarded approach |
| 5 | Full redesign plan | ✅ | This document — complete architecture & spec |
| 6 | Slice 1: Shell (heart + bloom + collapse) | ⏳ | Next build |
| 7 — 2026-10-21 | Slice 1A: production shell + 600 ms heart command popover | 📋 Ready | Replace rejected v1 wholesale. Acceptance: real SVG heart; drag/tap/long-press separation; ring bloom/collapse; functional Configure/Quit; quick settings; quit/restore; in-app diagnostics; phone-viewport QA. |

## RUN LOG
| Date | Result | What |
|---|---|---|
| 2026-10-20 | built | v1 prototype (superseded) |
| 2026-10-21 | updated plan | Full v2 redesign — architecture, gesture spec, data schema, build order |
| 2026-10-21 03:51 | Main | failed | I couldn't finish that one. Your app is unchanged. |
| 2026-10-21 | planned | Turn 7 — production shell and heart long-press Configure/Quit slice; detailed acceptance checks recorded |