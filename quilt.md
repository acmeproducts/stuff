# quilt.md — Master Plan

## 0. TURN/STAGE LEDGER
| Date | Turn | Stage | Status | Notes |
|------|------|-------|--------|-------|
| 2025-08-26 | 1 | DEFINE | ✅ done | Plan seeded from existing quilt.html v3 (Three.js instanced cube wave field); owner intent captured. |
| 2026-09-12 | 2 | DEFINE | ✅ done | Build request added to backlog; ledger updated. |
| 2026-09-12 | 3 | DEFINE | ✅ closed | DEFINE phase completed; ready for BUILD. |
| 2026-09-12 | 4 | BUILD | ⏸️ halted | R2 build opened, then owner issued "stop". |
| 2026-09-12 | 5 | PAUSED | ⏸️ active | Work suspended pending owner direction. |
| 2026-09-13 | 6 | BUILD | 🔨 active | Owner "build it" resumed R2; initial implementation attempted. |
| 2026-09-13 | 7 | BUILD | 🔨 active | Owner clarified neighbors must be Sierpinski carpets — contiguous tapestry of fractal squares. |
| 2026-09-15 | 8 | BUILD | 🔨 active | Performance fix: eager pre-bake of all levels; render loop synchronous. |
| 2026-09-15 | 9 | BUILD | 🔨 active | Build command reissued; proceeding with eager pre-baking, square capture, neighbor hues, tour mode, smooth pan/zoom. |
| 2026-09-16 | 10 | BUILD | 🔨 active | Transition fix: rebind at exact 1/3 and 3.0 thresholds with ×3 / ÷3 scale compensation. |
| 2026-09-17 | 11 | DEFINE | 🔄 pivot | Owner: "Discuss before more development." Issues: black bars on wide screens; no seamless endless loop. |
| 2026-09-17 | 12 | DEFINE | 🔄 active | Owner: "cache everything up front so it's smooth" → promoted to R2 acceptance requirement. No code written this turn. |
| 2026-10-18 | 13 | DEFINE | ✅ done | Added R2 acceptance note and locked cache‑up‑front rule. |

## 1. RELEASES
| # | Goal | Status |
|---|------|--------|
| R1 | Keep existing Three.js instanced wave‑field quilt stable while R2 is built. | ✅ Live in quilt.html |
| R2 | **Sierpinski Tapestry** — a regressive quilt of Sierpinski‑carpet squares with infinite, seamless zoom, all levels cached up front. | 🔄 Pending final owner sign‑off |
| R3 | Unified mode toggle between the wave field and the tapestry. | TBD |

## 2. PER‑RELEASE SECTIONS

### R1 — Existing Instanced Wave Field
- **Scope in:** Current Three.js wave of instanced cubes, orbit controls, parameter drawer, in‑app readout.
- **Scope out:** Any new rendering path, visual redesign, or behavior changes outside bug fixes.
- **Build gates:** App opens on mobile Chrome/Safari; all current controls still work; no console errors.
- **Backlog:** None until R2 is accepted.

### R2 — Sierpinski Tapestry (Cache‑Everything‑Up‑Front)
**Status:** 🔄 Pending owner sign‑off (added acceptance note on 2026‑10‑18)

#### Acceptance Note
> Owner has approved R2 and mandated that **all rendering levels must be pre‑baked before the first frame** to ensure smooth, lag‑free operation on mid‑range phones.

#### Scope — In
- Pre‑bake a cyclic stack of **N** Sierpinski‑carpet levels **completely before first paint**.
- Render loop performs **no allocations** after the initial frame.
- Seamless infinite zoom via cyclic wrap: Level 0 contains Level N‑1 in its centre, and vice‑versa.
- Full‑viewport coverage on any aspect ratio (no black bars).
- Mobile‑first UI pattern, in‑app diagnostics only.

#### Scope — Out
- No lazy baking or runtime tiling.
- No placeholder textures or fake data.
- No new network assets beyond existing CDN imports.
- No DevTools‑only debugging.

#### Proposed Mechanics
- Bake levels `0 → 1 → … → N‑1`, then embed level N‑1 (scaled 1/3) into level 0’s centre.
- Zoom‑in wrap: when at level 0 and scale reaches `3.0`, switch to level N‑1 and divide scale by 3.
- Zoom‑out wrap: when at level N‑1 and scale reaches `1/3`, switch to level 0 and multiply scale by 3.
- Parent bitmap drawn at `max(viewportWidth, viewportHeight) * 1.1`, centered.

#### Build Gates
- [ ] **No black bars** on 16:9, 9:16, 21:9, square viewports at any zoom.
- [ ] **Seamless loop** with zero visual discontinuity in both directions.
- [ ] **All levels cached** before first `requestAnimationFrame`.
- [ ] **≥60 fps** on a mid‑range phone (DPR ≤ 2).
- [ ] **On‑device verification** on iOS Safari & Android Chrome; diagnostics displayed in‑app.

#### Backlog / Deferred
- Tour mode polish.
- Configurable neighbor hues.
- Wave‑field toggle (moves to R3).
- Shareable preset URL.

### R3 — Unified Mode Toggle (future)
- Scope and gates to be defined after R2 is stable.

## 3. FUTURE IDEAS
- Export current frame as PNG / seamless GIF.
- Audio‑reactive amplitude.
- Multi‑touch pan/zoom gestures.
- Saved parameter presets.
- WebGPU renderer for larger stacks.
- Sparkle/shimmer effect on square edges.

## 4. IMMUTABLE WORKING RULES
1. **Mobile‑first** – touch targets ≥44 px, safe‑area aware, DPR capped.
2. **All diagnostics in‑app** – never rely on DevTools.
3. **Update the plan before code** – ledger row first.
4. **Read‑back verification after every push**.
5. **No stubs or fake data** – every control wired to real effect.
6. **Single‑file HTML** – CDN imports allowed; no binary assets.
7. **Cache everything up front for R2** – mandatory acceptance gate.

## 5. DECISION LOG
| Date | Decision |
|------|----------|
| 2026-09-15 | Owner chose eager pre‑baking to prevent lag/black flash. |
| 2026-09-16 | Fixed wrap thresholds at 1/3 and 3.0 with inverse scale compensation. |
| 2026-09-17 | Development paused to discuss black‑bar coverage and seamless zoom. |
| 2026-09-17 | Owner: “cache everything up front so it’s smooth” – mandatory R2 gate. |
| 2026-10-18 | Added acceptance note confirming R2 and cache‑up‑front rule. |

## 6. APPENDIX — AUTHORITY ORDER
1. Owner feedback (latest turn)  
2. This PLAN document (sole authority)  
3. Reference files, if provided  
4. Working CODE file  

> Chat history is not authoritative; this PLAN is the sole memory that persists between runs.
