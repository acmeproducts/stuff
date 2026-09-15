# quilt.md — Master Plan

## 0. TURN/STAGE LEDGER
| Date | Turn | Stage | Status | Notes |
|------|------|-------|--------|-------|
| 2025-08-26 | 1 | DEFINE | ✅ done | Plan created from existing quilt.html v3; owner intent captured |
| 2026-09-12 | 2 | DEFINE | ✅ done | Added build request to backlog and updated ledger |
| 2026-09-12 | 3 | DEFINE | ✅ closed | DEFINE phase completed; ready to proceed to BUILD |
| 2026-09-12 | 4 | BUILD | ⏸️ halted | R2 build opened, then owner issued "stop" |
| 2026-09-12 | 5 | PAUSED | ⏸️ active | Work suspended pending owner direction |
| 2026-09-13 | 6 | BUILD | 🔨 active | Owner "build it" resumed R2; initial implementation attempted |
| 2026-09-13 | 7 | BUILD | 🔨 active | **Correction logged:** Owner clarified neighbors must be Sierpinski carpets (not mixed stripes/dots), forming a contiguous tapestry of fractal squares. Scope updated below. |
| 2026-09-15 | 8 | BUILD | 🔨 active | **Performance fix:** Owner reports lag/black flash during zoom-out due to runtime bitmap creation. Adding eager pre-bake of all levels; render loop becomes strictly synchronous. |
| 2026-09-15 | 9 | BUILD | 🔨 active | **Build command issued:** Owner commanded "Build it" — proceeding to generate the-quilt.html with eager pre-baking, square canvas capture, configurable neighbor hues, tour mode, and smooth pan/zoom. |

## 1. RELEASES
| # | Goal | Target |
|---|------|--------|
| R1 | Stabilize current Three.js instanced quilt (v3) | 2025-08-26 |
| R2 | **Procedural Sierpinski Tapestry** — infinite zoom via hierarchical 3×3 rebasing; all tiles are recursive carpets with eager pre-baked ImageBitmap stack | 2026-09-15 (Turn 9) |
| R3 | Unified toggle between Wave Field and Tapestry modes | TBD |

## 2. PER-RELEASE SECTIONS

### R2 — Sierpinski Tapestry (Pure Canvas2D) — 🔨 ACTIVE (Turn 9)
**Status:** Generating code implementation with eager pre-baking.

**Core Mechanism**
- **Grid:** 3×3 arrangement of Sierpinski carpets (center + 8 neighbors).
- **Eager Bitmap Stack:** On initialization and parameter changes, the engine asynchronously generates `state.stack[]` — an array of `ImageBitmap` objects representing levels 0 to `maxLevels-1`.
  - Each bitmap is **strictly square** (e.g., 2048×2048px offscreen) to eliminate rectangular warping.
  - Level 0: Renders 9 carpets (center + 8 unique neighbors) into a 3×3 grid on the square canvas.
  - Level n (n>0): Renders level n-1 bitmap into center third; draws 8 fresh neighbor carpets around it.
- **Synchronous Render Loop:** `requestAnimationFrame` loop simply draws `stack[level]` (or live carpet if level 0) and the 8 live neighbor carpets. No `createImageBitmap`, no `await`, no offscreen canvas creation during animation.
- **Rebasing:** When `scale <= 1/3`, increment `level` and reset `scale` to 1.0. The view switches to the pre-baked bitmap instantly.
- **Descent (Zoom In):** When `scale >= 3.0` and `level > 0`, decrement `level` and set `scale` to 1/3.
- **Panning:** Offset state (`ox`, `oy`) dragged via pointer events; applied to center calculation.
- **Tour Mode:** Automatically animates from `maxLevels` down to 0 (zooming in) then back out (zooming out), relying on cached bitmaps for smooth frame rates.

**Configuration UI**
- **Center Color:** Hex color picker for the central carpet.
- **Neighbor Editors:** 3×3 grid selector; selecting a neighbor reveals a hex color picker and depth slider unique to that position.
- **Base Recursion:** Global default recursion depth.
- **Max Hierarchy:** Determines how many bitmaps to pre-bake (stack size).
- **Start Level / Jump:** Instantly jump to a specific level (requires bitmaps up to that level to be baked).
- **Tour Button:** Toggles auto-pilot zoom animation.

**Build Gates (R2 Acceptance)**
- Zero frame drops when crossing rebasing thresholds during pinch-to-zoom on mid-tier mobile devices.
- All tiles are perfectly square; no aspect ratio distortion.
- Parameter changes trigger cache rebuild with "Baking..." indicator; UI remains responsive.
- Single-file HTML5, zero dependencies, runs offline.

## 3. IMMUTABLE WORKING RULES
- The PLAN is the sole memory; code changes are guided by ledger entries.
- No external assets; single-file HTML only.
- Render loop must be synchronous (no async/await per frame).
- Cache rebuild is async but strictly separated from animation frames.

## 4. APPENDIX — AUTHORITY ORDER
1. Owner feedback (latest turn)
2. This PLAN document
3. Reference files (if provided)
4. Working CODE file