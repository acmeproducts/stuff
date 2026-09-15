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

## 1. RELEASES
| # | Goal | Target |
|---|------|--------|
| R1 | Stabilize current Three.js instanced quilt (v3) | 2025-08-26 |
| R2 | **Procedural Sierpinski Tapestry** — infinite zoom via hierarchical 3×3 rebasing; all tiles are recursive carpets | 2026-09-13 (active) |
| R3 | Unified toggle between Wave Field and Tapestry modes | TBD |

## 2. PER-RELEASE SECTIONS

### R2 — Sierpinski Tapestry (Pure Canvas2D) — 🔨 ACTIVE (Turn 8)
**Status:** Implementing eager pre-baking to eliminate zoom-out stutter.

**Core Mechanism**
- **Grid:** 3×3 arrangement of Sierpinski carpets (center + 8 neighbors).
- **Hierarchical Bitmap Stack:** During initialization (and whenever parameters change), the engine eagerly generates an array of `ImageBitmap` levels (0 to `maxLevels-1`).  
  - `levelBitmap[0]`: A square canvas containing a 3×3 grid of carpets (center uses `centerColor`/`baseDepth`; 8 neighbors use their respective configs).  
  - `levelBitmap[n]` (n>0): A square canvas containing a 3×3 grid where the center tile is `levelBitmap[n-1]` scaled into the middle third, and the 8 peripheral tiles are freshly rendered carpets using neighbor configs.
- **Rebasing:** Render loop remains synchronous. When zoom scale ≤ 1/3, `level` increments and `scale` resets to 1.0; the new center simply displays the pre-baked `levelBitmap[level-1]`. No canvas creation or `await` occurs during the animation frame.
- **Tessellation:** Because each bitmap is generated at a fixed high resolution (e.g., 2048×2048) with exact 1/3 subdivisions, edges between the bitmap center and the 8 live neighbor carpets align seamlessly (both use the same geometric algorithm).

**Scope (In)**
- Single-file HTML5, zero deps.
- Recursive carpet algorithm (depth-culled, sub-pixel terminated).
- **Eager Baking:** Async `rebuildCache()` function generates the full bitmap stack upfront; UI shows “Baking…” overlay with progress indicator during this phase.
- **Cache Invalidation:** Automatically triggered when `centerColor`, `baseDepth`, any neighbor color/depth, or `maxLevels` changes. Old bitmaps are `.close()`’d to free GPU memory.
- **Smooth Zoom:** All level transitions are instantaneous swaps of pre-baked assets; no runtime lag or black frames.
- **Tour Mode:** Animates from `maxLevels` down to 0 and back, relying on cached bitmaps for intermediate levels.
- Mobile-first culling: Skip off-screen tiles (though with bitmaps this mainly applies to the 8 live neighbors at the current level).

**Scope (Out)**
- True infinite mathematical precision (finite stack capped by `maxLevels` parameter).
- Runtime procedural generation during zoom (all heavy work moved to bake phase).
- Export/serialization of bitmaps.

**Build Gates**
- 60 fps on iOS Safari during pinch-zoom with no frame drops when crossing rebasing thresholds.
- Zero console errors; all state visible in HUD or drawer.
- “Rectangular warp” fix verified: all baked canvases are strictly square (1:1 aspect ratio).

**Decision Log Addition**
| Date | Decision | Owner |
|------|----------|-------|
| 2026-09-13 | R2 scope correction: Neighbors changed from mixed pattern patches to contiguous Sierpinski carpets with configurable hues only. | User |
| 2026-09-15 | Performance architecture: Moved from on-demand capture to eager pre-baking of ImageBitmap stack to eliminate zoom-out lag. | User |

## 3. IMMUTABLE WORKING RULES
- The PLAN is the sole memory; code changes are guided by ledger entries.
- No external assets; single-file HTML only.
- Render loop must be synchronous (no async/await per frame).

## 4. APPENDIX — AUTHORITY ORDER
1. Owner feedback (latest turn)
2. This PLAN document
3. Reference files (if provided)
4. Working CODE file
</plan>