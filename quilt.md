<plan>
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
| 2026-09-16 | 10 | BUILD | 🔨 active | **Transition fix:** Eliminating black interstitial frames between level switches. Rebinds must occur at exact 1/3 and 3.0 thresholds with scale compensation (×3 or ÷3) to maintain pixel-perfect continuity. Tour mode logic aligned to these thresholds. Navigation clamped to `stack.length` to prevent accessing unbaked levels. |

## 1. RELEASES
| # | Goal | Target |
|---|------|--------|
| R1 | Stabilize current Three.js instanced quilt (v3) | 2025-08-26 |
| R2 | **Procedural Sierpinski Tapestry** — infinite zoom via hierarchical 3×3 rebasing; all tiles are recursive carpets with eager pre-baked ImageBitmap stack | 2026-09-16 (Turn 10) |
| R3 | Unified toggle between Wave Field and Tapestry modes | TBD |

## 2. PER-RELEASE SECTIONS

### R2 — Sierpinski Tapestry (Pure Canvas2D) — 🔨 ACTIVE (Turn 10)
**Status:** Implementing pixel-perfect level transitions and cache safety guards.

**Core Mechanism**
- **Grid:** 3×3 arrangement of Sierpinski carpets (center + 8 neighbors).
- **Eager Bitmap Stack:** On initialization and parameter changes, the engine asynchronously generates `state.stack[]` — an array of `ImageBitmap` objects representing levels 0 to `maxLevels-1`.
  - Each bitmap is **strictly square** (e.g., 2048×2048px offscreen) to eliminate rectangular warping.
  - Level 0: Renders 9 carpets (center + 8 unique neighbors) into a 3×3 grid on the square canvas.
  - Level n (n>0): Renders level n-1 bitmap into center third; draws 8 fresh neighbor carpets around it.
- **Synchronous Render Loop:** `requestAnimationFrame` loop simply draws `stack[level]` (if cached) and the 8 live neighbor carpets. No `createImageBitmap`, no `await`, no offscreen canvas creation during animation.
- **Rebasing (Zoom Out / Ascend):** When `scale < 1/3` (threshold 0.333...), increment `level` and multiply `scale` by exactly `3.0`. This ensures the center tile of the new level (which contains the previous bitmap at 1/3 size) aligns perfectly with the previous view.
- **Rebasing (Zoom In / Descend):** When `scale > 3.0`, decrement `level` and divide `scale` by exactly `3.0`.
- **No Black Frames:** The render loop clamps `level` to `[0, stack.length-1]`. If `level` exceeds cached bounds (e.g., during rapid parameter change), the view snaps to the highest available cached level rather than showing empty/black background.
- **Panning:** Offset state (`ox`, `oy`) dragged via pointer events; applied to center calculation.
- **Tour Mode:** Automatically animates from `maxLevels-1` down to `0` (zooming in) then back out (zooming out).
  - Descending: `scale` increases by 2% per frame; at `scale >= 3.0`, rebases down (`level--`, `scale /= 3`).
  - Ascending: `scale` decreases by 2% per frame; at `scale <= 1/3`, rebases up (`level++`, `scale *= 3`).
  - Scale continuity is maintained by using the inverse of the trigger threshold for the reset value (e.g., trigger at 3.0, reset to 1.0; trigger at 0.333, reset to 1.0).

**Configuration UI**
- **Center Color:** Hex color picker for the central carpet.
- **Neighbor Editors:** 3×3 grid selector; selecting a neighbor reveals a hex color picker and depth slider unique to that position.
- **Base Recursion:** Global default recursion depth.
- **Max Hierarchy:** Determines how many bitmaps to pre-bake (stack size).
- **Start Level / Jump:** Instantly jump to a specific level clamped to `[0, stack.length-1]`.
- **Tour Button:** Toggles auto-pilot zoom animation using same rebasing math as manual.

**Build Gates (R2 Acceptance)**
- Zero visual discontinuity (black frames or size jumps) when crossing rebasing thresholds during zoom.
- Rebase triggers at exact `1/3` (0.333...) and `3.0` with scale compensation to maintain 1:1 pixel mapping.
- Tour mode uses identical rebasing math to manual zoom; no divergence.
- Navigation clamped to available cache; never attempts to render unbaked levels.
- Single-file HTML5, zero dependencies, runs offline.

## 3. IMMUTABLE WORKING RULES
- The PLAN is the sole memory; code changes are guided by ledger entries.
- No external assets; single-file HTML only.
- Render loop must be synchronous (no async/await per frame).
- Cache rebuild is async but strictly separated from animation frames.
- Rebasing math must be inverse operations: scale ×3 on ascend, scale ÷3 on descend.

## 4. APPENDIX — AUTHORITY ORDER
1. Owner feedback (latest turn)
2. This PLAN document
3. Reference files (if provided)
4. Working CODE file
</plan>