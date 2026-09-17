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
| 2026-09-17 | 11 | DEFINE | 🔄 pivot | **Owner request:** "Discuss before more development." Issues identified: (1) Horizontal black bars during zoom-out on wide screens (parent tile coverage insufficient); (2) Requirement for seamless endless zoom loop (currently linear stack terminates). |

## 1. RELEASES
| # | Goal | Target |
|---|------|--------|
| R1 | Stabilize current Three.js instanced quilt (v3) | 2025-08-26 |
| R2 | **Procedural Sierpinski Tapestry** — infinite zoom via hierarchical 3×3 rebasing; all tiles are recursive carpets with eager pre-baked ImageBitmap stack | 2026-09-16 (Turn 10) |
| R3 | Unified toggle between Wave Field and Tapestry modes | TBD |

## 2. PER-RELEASE SECTIONS

### R2 — Sierpinski Tapestry (Pure Canvas2D) — 🔄 PENDING DESIGN CONFIRMATION (Turn 11)

**Status:** Awaiting owner confirmation on cyclic baking architecture and screen-coverage math fix.

---

#### 2.1 Problem Analysis (Turn 11 Owner Feedback)

**A. Black Bars on Left/Right (Aspect Ratio Coverage Failure)**
- **Symptom:** At scale 0.68–0.36 (between REBASE_OUT and 1.0), black bars appear on screen sides but not top/bottom on landscape displays.
- **Root Cause:** The parent bitmap (level+1) is drawn at size `currentTileSize × 3`. `currentTileSize` is derived from `min(screenWidth, screenHeight) × 0.9 × scale`. On a 16:9 landscape display, `minDim` equals height. When scale = 0.5, `tile = 0.45 × height`, so `parentTile = 1.35 × height`. Screen width = `1.78 × height`. Since `1.35 < 1.78`, the parent bitmap does not cover the full width, revealing black.
- **Why intermittent:** At scale ≈0.97 (near 1.0), the current level nearly fills the screen, masking the issue. At scale ≈0.36 (near REBASE_OUT), the rebase triggers and switches to the parent as the new current level (now at scale ≈1.0), which again fills the screen. The gap only exists in the mid-range where `tile × 3 < max(screenWidth, screenHeight)`.

**B. Endless Seamless Loop Requirement**
- **Current Behavior:** Linear stack `0 … maxLevels-1`. Zooming-in stops at 0; zooming-out stops at maxLevels-1 (or clamps).
- **Desired Behavior:** Infinite, seamless zoom. When descending past level 0, the view should transition to level maxLevels-1 (or deeper) without visual pop, creating a **Droste effect** (fractal zoom loop).
- **Technical Requirement:** The hierarchy must become cyclic. Level 0’s center tile must contain a scaled-down copy of Level maxLevels-1, so that zooming into Level 0’s center reveals Level maxLevels-1, whose center contains Level maxLevels-2, …, whose center eventually contains Level 0 again.

---

#### 2.2 Proposed Solutions (Pending Confirmation)

**Solution A: Cyclic Bitmap Stack (Recommended)**
Instead of a linear hierarchy where Level n contains Level n-1, create a **cycle**:
1. Bake levels in ascending index order: `0, 1, 2, …, N-1`.
2. When baking Level 0, instead of drawing a fresh carpet in the center, draw the already-baked Level N-1 bitmap scaled to 1/3 size into the center tile.
3. This creates a closed loop: L0 contains L(N-1) contains L(N-2) … contains L1 contains L0.

**Zoom Logic Adaptation:**
- **Descend (zoom in):** When `scale ≥ REBASE_IN` and `level === 0`, instead of clamping, wrap to `level = N-1`. Compensate scale by `scale /= REBASE_IN` (maintaining visual continuity because L0’s center pixel is exactly L(N-1)’s full image).
- **Ascend (zoom out):** When `scale ≤ REBASE_OUT` and `level === N-1`, wrap to `level = 0`. Compensate scale by `scale *= 3`.

**Outcome:** The zoom is infinite and seamless; the pre-baked stack acts as a cyclic animation strip.

**Solution B: Extended Parent Coverage (Fix for Black Bars)**
- **Approach:** When drawing the parent bitmap (level+1) behind the current level, ensure it covers the entire viewport regardless of aspect ratio.
- **Implementation:** Compute `coverSize = max(screenWidth, screenHeight) × 1.1` (10% safety margin). Draw the parent bitmap centered at `(cx, cy)` with size `coverSize`. Since the parent bitmap is square and contains the current level’s bitmap in its exact center 1/3 region, scaling it up uniformly preserves the alignment (the current level drawn on top will perfectly obscure the center of the parent).
- **Risk:** If `coverSize` is much larger than `tile × 3`, we may expose the edges of the parent bitmap (which contains neighbor tiles). However, since the parent bitmap represents a 3×3 grid and we only ever look at its center when zooming out, and we rebase at 1/3 scale (when the current tile shrinks to 1/3, matching the parent’s center tile size), the exposed edges will actually be the correct neighbor tiles emerging from the sides, not black. This is the desired behavior.

**Combined Architecture:**
- Pre-bake cyclic stack of N levels (e.g., N=6).
- Render loop:
  1. Draw parent (level+1) at size sufficient to cover screen (using `maxDim` logic), centered.
  2. Draw current (level) at size `baseTile × scale`, centered.
  3. Handle wrapping at boundaries for infinite loop.

---

#### 2.3 Build Gates (R2 Acceptance — Updated Turn 11)
- [ ] **Coverage:** No black bars appear at any zoom level on any screen aspect ratio (16:9, 9:16, 21:9, etc.). The parent bitmap (or wrapping logic) always fills the viewport.
- [ ] **Seamless Loop:** Zooming in past depth 0 continues seamlessly from depth N-1, and vice versa, with no visual discontinuity (pixel-perfect rebasing at wrap points).
- [ ] **Cyclic Validity:** The center of Level 0 must visually match the entirety of Level N-1 at 1/3 scale, ensuring the loop is undetectable.
- [ ] **Performance:** Render loop remains 60fps; no runtime canvas creation.

---

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