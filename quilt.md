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

## 1. RELEASES
| # | Goal | Target |
|---|------|--------|
| R1 | Stabilize current Three.js instanced quilt (v3) | 2025-08-26 |
| R2 | **Procedural Sierpinski Tapestry** — infinite zoom via hierarchical 3×3 rebasing; all tiles are recursive carpets | 2026-09-13 (active) |
| R3 | Unified toggle between Wave Field and Tapestry modes | TBD |

## 2. PER-RELEASE SECTIONS

### R2 — Sierpinski Tapestry (Pure Canvas2D) — 🔨 ACTIVE (Corrected)
**Status:** Implementation corrected per owner feedback (Turn 7). Mixed pattern patches removed; all tiles are Sierpinski fractals.

**Core Mechanism**
- **Grid:** 3×3 arrangement of Sierpinski carpets (center + 8 neighbors).
- **Rebasing:** When zoom scale ≤ 1/3, the canvas is captured as an ImageBitmap representing the current 3×3 “super-tile.” View ascends one hierarchy level (`level++`), scale resets to 1.0 (so the super-tile becomes the new single center tile), and 8 new carpets surround it.
- **Tiles:** Every position renders the same recursive Sierpinski algorithm, but each of the 8 neighbors carries its own `hue` (and optional `depth` override) for variety while maintaining contiguous geometry.
- **Tessellation:** Because all tiles are aligned squares with 1/3 subdivision, edges meet seamlessly; the “hole” in the center of each carpet is internal and does not break adjacency.

**Scope (In)**
- Single-file HTML5, zero deps.
- Recursive carpet generator (depth 1–6) with viewport culling and sub-pixel termination.
- **Contiguous 3×3 grid at every hierarchy level.** Center tile is either:
  - Live carpet (level 0), or
  - Captured bitmap of previous level’s 3×3 grid (level ≥ 1).
- **8 neighbor configs:** Each stores `hue` (0–360) controlling its carpet’s base color; optional independent `depth` for variety.
- Pan/zoom via wheel (desktop) and two-finger pinch (touch).
- Parameter drawer: per-neighbor hue editors (3×3 grid UI), global carpet depth, global hue shift, max hierarchy levels.
- In-app HUD: level, zoom scale, visible cell count, FPS, render time.
- Mobile-first culling: skip off-screen tiles and recurse only while squares > 0.5 px.

**Scope (Out)**
- Mixed “patch” patterns (stripes, dots, checker) — **removed per Turn 7 correction**.
- Three.js or WebGL dependencies for this mode.
- True infinite mathematical precision (finite bitmap stack capped by `maxLevels`).
- Export/serialization.

**Build Gates**
- 60 fps on iOS Safari at depth 5 with culling active during pinch-zoom.
- No console logs; all state visible in HUD or drawer.
- Match between preview icons (mini carpets) and rendered canvas.

**Decision Log Addition**
| Date | Decision | Owner |
|------|----------|-------|
| 2026-09-13 | R2 scope correction: Neighbors changed from mixed pattern patches to contiguous Sierpinski carpets with configurable hues only. | User |

## 3. IMMUTABLE WORKING RULES
*(unchanged)*

## 4. APPENDIX — AUTHORITY ORDER
*(unchanged)*
</plan>