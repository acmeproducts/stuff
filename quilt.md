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

## 1. RELEASES
| # | Goal | Status |
|---|------|--------|
| R1 | Keep existing Three.js instanced wave-field quilt stable while R2 is built. | ✅ Live in quilt.html |
| R2 | **Sierpinski Tapestry** — a regressive quilt of Sierpinski-carpet squares with infinite, seamless zoom, all levels cached up front. | 🔄 Pending design confirmation |
| R3 | Unified mode toggle between the wave field and the tapestry. | TBD |

## 2. PER-RELEASE SECTIONS

### R1 — Existing Instanced Wave Field
- **Scope in:** Current Three.js wave of instanced cubes, orbit controls, parameter drawer, in-app readout.
- **Scope out:** Any new rendering path, visual redesign, or behavior changes outside bug fixes.
- **Build gates:** Existing app opens on current mobile Chrome/Safari; all current controls still work; no console errors.
- **Backlog:** None until R2 is accepted.

### R2 — Sierpinski Tapestry (Cache-Everything-Up-Front)
**Status:** 🔄 PENDING OWNER CONFIRMATION

#### Scope — In
- Pre-bake a cyclic stack of N Sierpinski-carpet levels **completely before first frame**.
- Render loop is synchronous; zero canvas/texture creation during animation.
- Seamless infinite zoom via cyclic wrap: Level 0 contains Level N−1 in its center, so zooming in wraps around with no pop.
- Parent bitmap always covers the full viewport on any aspect ratio.
- Keep the mobile drawer/control pattern; diagnostics stay in-app.

#### Scope — Out
- No lazy baking, no on-the-fly tiling, no runtime bitmap generation.
- No stubs, placeholder textures, or fake data.
- No new network assets beyond the existing CDN import map.
- No DevTools-based debugging; all state visible in the app.

#### Proposed Mechanics
- Bake levels: `0 → 1 → … → N−1`, then make level 0's center tile contain a 1/3-scale copy of level N−1.
- Ascend / zoom out: when current level is N−1 and scale reaches `1/3`, wrap to level 0 and multiply scale by 3.
- Descend / zoom in: when current level is 0 and scale reaches `3.0`, wrap to level N−1 and divide scale by 3.
- Coverage fix: parent bitmap drawn at `max(viewportWidth, viewportHeight) × 1.1`, centered — no more side bars on 16:9/21:9 screens.

#### Build Gates
- [ ] **No black bars** at any zoom level on 16:9, 9:16, 21:9, and square viewports.
- [ ] **Seamless loop:** zooming past level 0 wraps to level N−1 with zero visual discontinuity; same in reverse.
- [ ] **Cache up front:** all levels are created before first paint; animation frame performs no allocations.
- [ ] **60fps** on a mid-range phone with 2x DPR.
- [ ] **On-device verification** on iOS Safari and Android Chrome; no DevTools required.

#### Backlog / Deferred
- [ ] Tour mode polish.
- [ ] Configurable neighbor hues.
- [ ] Wave-field mode toggle (moves to R3).
- [ ] Shareable preset URL.

## 3. FUTURE IDEAS
- Export current quilt frame as PNG or seamless loop GIF.
- Audio-reactive amplitude.
- Multi-touch direct pan/zoom gestures.
- Saved parameter presets.
- WebGPU renderer for larger stacks.
- "Sparkle" / shimmer effect on square edges (owner's "sparkly" intent).

## 4. IMMUTABLE WORKING RULES
1. **Mobile-first** — touch targets ≥44px, safe-area aware, DPR capped.
2. **All diagnostics in-app** — never rely on DevTools for primary feedback.
3. **Update the plan before code** — append a ledger row before touching any file.
4. **Read-back verification after every push** — reread the pushed diff and confirm it matches the plan.
5. **No stubs or fake data** — every control is wired to a real, working effect.
6. **Single-file HTML** — CDN module imports allowed; no binary assets.
7. **Cache everything up front for R2** — no expensive work after the first frame.

## 5. DECISION LOG
| Date | Decision |
|------|----------|
| 2026-09-15 | Owner chose eager pre-baking to prevent lag/black flash. |
| 2026-09-16 | Rebase thresholds fixed at 1/3 and 3.0 with inverse scale compensation. |
| 2026-09-17 | Owner paused development to discuss black-bar coverage and seamless infinite zoom. |
| 2026-09-17 | Owner: "cache everything up front so it's smooth" — mandatory R2 acceptance gate. |

## 6. APPENDIX — AUTHORITY ORDER
1. Owner feedback (latest turn)
2. This PLAN document
3. Reference files, if provided
4. Working CODE file

> Chat history is not authoritative; this PLAN is the sole memory that persists between runs.