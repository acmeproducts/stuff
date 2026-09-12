# quilt.md — Master Plan

## 0. TURN/STAGE LEDGER
| Date | Turn | Stage | Status | Notes |
|------|------|-------|--------|-------|
| 2025-08-26 | 1 | DEFINE | ✅ done | Plan created from existing quilt.html v3; owner intent captured (wave field + Sierpinski carpet) |
| 2026-09-12 | 2 | DEFINE | ✅ done | Added build request to backlog and updated ledger |

## 1. RELEASES
| # | Goal | Target |
|---|------|--------|
| R1 | Stabilize current Three.js instanced quilt (v3) — mobile-first, touch-friendly, performant | 2025-08-26 |
| R2 | Add Sierpinski carpet fractal mode (pure JS, no Three.js) as alternate renderer | TBD |
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

### R2 — Sierpinski Carpet Quilt (Pure JS, Canvas2D)
**Scope (In)**
- Single-file HTML5, zero deps, no importmap
- Recursive Sierpinski carpet generation to configurable depth
- Color palette per recursion level
- Pan/zoom via touch (two-finger) and mouse (wheel + drag)
- Mobile-first: viewport meta, safe-area insets, 60fps at depth 6 (46k rects)
- In-app stats: depth, rect count, fps, render ms

**Scope (Out)**
- Three.js dependency
- Wave animation
- OrbitControls

**Build Gates**
- iOS Safari: depth 6 @ 60fps, pinch-zoom smooth, no jank on drawer open
- Android Chrome: same
- Desktop: depth 7 @ 60fps
- Zero console logs; all perf in HUD

**Backlog**
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
| 2026-09-12 | Added build request to backlog for R2 implementation. | User |

## 6. APPENDIX — AUTHORITY ORDER
1. **quilt.md** (this plan) — sole persistent authority; chat history is ephemeral and loses to the plan.
2. **quilt.html** — implementation; must match plan's current release scope.
3. **Owner directives in chat** — captured into plan via DECISION LOG or scope changes before code.
4. **External docs (MDN, Three.js, etc.)** — referenced only to unblock; cited in SUMMARY.