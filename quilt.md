# quilt.md — Master Plan

## 0. TURN/STAGE LEDGER
| Date | Turn | Stage | Status | Notes |
|------|------|-------|--------|-------|
| 2025-08-26 | 1 | DEFINE | ✅ done | Plan created from existing quilt.html v3; owner intent captured (wave field + Sierpinski carpet) |
| 2026-09-12 | 2 | DEFINE | ✅ done | Added build request to backlog and updated ledger |
| 2026-09-12 | 3 | DEFINE | ✅ closed | DEFINE phase completed; ready to proceed to BUILD |
| 2026-09-12 | 4 | BUILD | ⏸️ halted | R2 build opened, then owner issued "stop" — no code written; quilt.html unchanged at v3 |
| 2026-09-12 | 5 | PAUSED | ⏸️ active | All work suspended pending owner direction |

## 1. RELEASES
| # | Goal | Target |
|---|------|--------|
| R1 | Stabilize current Three.js instanced quilt (v3) — mobile-first, touch-friendly, performant | 2025-08-26 |
| R2 | Add Sierpinski carpet fractal mode (pure JS, no Three.js) as alternate renderer | 2026-09-12 (paused) |
| R3 | Unify UI: single app toggling between "Wave Field" (Three.js) and "Sierpinski Quilt" (Canvas2D) | TBD |

## 2. PER-RELEASE SECTIONS

### R1 — Three.js Instanced Quilt v3 (Current)
**Scope (In)**
- Infinite instanced mesh grid (Box/Sphere/Icosahedron)
- Wave height field: `y = (sin(ax·fx + t) + sin(az·fz + t)) * amp`
- OrbitControls with damping, min/max distance
- Parameter drawer: shape, color, count, render distance, separation, amplitude, freq X/Z, speed, bg, damping, min/max dist
- Zoom In/Out/Reset camera buttons
- Readout HUD (object count)
- Mobile-safe areas, touch-action:none, no devtools-only logs

**Scope (Out)**
- Sierpinski/fractal patterns
- Pure Canvas2D/WebGL1 fallback
- Export/share, presets, URL hash state
- Multi-touch gesture parity (pinch = dolly)

**Build Gates (Real Device Verification)**
- iOS Safari (iPhone 13+): 60fps at 50k instances, drawer scroll smooth, no zoom on input focus
- Android Chrome (Pixel 6+): same
- Desktop Chrome/Firefox/Safari: 60fps at 100k instances
- No console errors/warnings; all diagnostics in-app (readout + footer)

**Backlog (Deferred to R2+)**
- URL hash sync for params
- Preset save/load (localStorage)
- Reduced-motion media query support
- WebGL2 instanced attributes for custom per-instance color
- Orientationchange handling

### R2 — Sierpinski Carpet Quilt (Pure JS, Canvas2D) — ⏸️ PAUSED
**Status:** Build halted by owner ("stop") on 2026-09-12 before any code was written. Scope below is preserved unchanged for resume.

**Scope (In)**
- Single-file HTML5, zero deps, no importmap
- Recursive Sierpinski carpet generation to configurable depth (1–6)
- Viewport culling: skip off-screen branches; stop recursion when sub-pixel
- Color palette per recursion level (HSL, hue shift per level)
- Pan/zoom via touch (two-finger pinch) and mouse (wheel + drag)
- Mobile-first: viewport meta, safe-area insets, 60fps target at depth 6 with culling
- In-app stats HUD: depth setting, visible rect count, FPS, render time (ms)
- All diagnostics in-app; zero console logs

**Scope (Out)**
- Three.js dependency (this mode is pure Canvas2D)
- Wave animation/instanced mesh
- Preset persistence across sessions (keep single-file; URL hash optional backlog)
- Export PNG/WebP

**Build Gates**
- iOS Safari: depth 6 @ 60fps when zoomed to fit (culling active), pinch-zoom smooth, no jank on drawer open
- Android Chrome: same
- Desktop: depth 6+ @ 60fps
- Zero console logs; all perf indicators in HUD

**Backlog (Post-R2)**
- Hilbert/Z-order traversal for cache-friendly drawing
- Web Worker offload for depth ≥7
- Export PNG/WebP

### R3 — Unified App (Toggle Between Modes)
**Scope (In)**
- Top-level mode switch: "Wave Field" | "Sierpinski Quilt"
- Shared parameter drawer pattern
- Persistent mode+params in URL hash
- Single footer with version+timestamp

**Scope (Out)**
- Server/backend
- WebGL compute shaders

## 3. FUTURE IDEAS (Parking Lot)
- Penrose tiling mode
- Shadertoy-style GLSL mode (instanced quad + fragment shader)
- Audio-reactive amplitude/speed
- Collaborative sync (WebRTC)
- PWA install + offline

## 4. IMMUTABLE WORKING RULES
1. **Mobile-first** — every feature works on phone without hover/keyboard.
2. **All diagnostics in-app** — no `console.log` required to understand state; HUD/readout only.
3. **Update-plan-before-code** — every change starts with a plan row in LEDGER + scope update.
4. **Read-back verification** — after writing a file, re-read it and confirm content matches intent.
5. **No stubs or fake data** — real math, real render, real touch events.
6. **Single-file HTML** — each release is one `.html` (importmap allowed for Three.js mode).
7. **Accessibility** — keyboard operable, ARIA labels, color contrast ≥4.5:1.

## 5. DECISION LOG
| Date | Decision | Owner |
|------|----------|-------|
| 2025-08-26 | Current codebase is Three.js v3 (instanced mesh wave field). Owner also wants a pure-JS Sierpinski carpet quilt. Plan accommodates both as R1 (stabilize current) and R2 (new pure-JS mode). | User |
| 2026-09-12 | DEFINE phase closed; BUILD phase opened for R2 implementation. | User |
| 2026-09-12 | Owner issued "stop" — R2 build halted immediately, no code written, quilt.html preserved at v3. Work paused until further direction. | User |

## 6. APPENDIX — AUTHORITY ORDER
1. **quilt.md** (this plan) — sole persistent authority; chat history is ephemeral and loses to the plan.
2. **quilt.html** — implementation; must match plan's current release scope.
3. **Owner directives in chat** — captured into plan via DECISION LOG or scope changes before code.
4. **External docs (MDN, Three.js, etc.)** — referenced only to unblock; cited in SUMMARY.