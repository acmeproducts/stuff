# test-product — Master Plan

Sole authority for this project. Chat history loses to this file. Read this first every run.

## 0. TURN/STAGE LEDGER

Every build session appends a row here BEFORE touching code.

| Date | Turn/Stage | What happened | Status |
|---|---|---|---|
| 2026-09-27 | T0 — Plan init | Created master plan; seeded known facts | Done |
| 2026-10-25 | T1 — Analysis request | Owner asked to audit particle.html; source not yet in hand | Blocked → resolved T2 |
| 2026-10-25 | T2 — Audit done | Owner pasted full particle.html source. Four-part audit completed and recorded under R1 (below). Verdict: keep the core; fix mobile/perf; add presets + touch | Done |

## 1. RELEASES

| # | Name | One-line goal |
|---|---|---|
| R1 | Particle Waves — mobile-first rebuild | Port particle.html into projects/test-product.html: touch-first, phone-fast, same visuals + mic reactivity, plus presets |

## 2. RELEASE DETAIL

### R1 — Particle Waves, mobile-first
- **Goal:** A compelling single-file phone-first particle wave app at projects/test-product.html, rebuilt from the audited baseline.
- **Scope IN:**
  - Everything in "Keep" + "Needs work" fixes below.
  - Touch camera (orbit + pinch), collapsible controls, viewport meta, DPR-aware canvas, adaptive resolution.
  - Presets, mic UX with in-app status/errors, settings persistence.
- **Scope OUT:** WebGL renderer, multi-user/share links, audio file input (Future Ideas).
- **Build gates (verify on real devices):**
  - Opens on a phone browser; no blank screen, no dead controls.
  - Holds ~30+ fps on a mid-range phone at default settings (in-app FPS readout proves it).
  - One-finger orbit and pinch zoom work; no page-scroll fighting (touch-action handled).
  - Every control visibly works; no stubs, no fake data.
  - Mic flow: permission, denial, and errors all reported inside the app.
  - Desktop still works (mouse orbit, wheel zoom).
- **Backlog (deferred from R1):** screenshot/PNG export, color-trail fade effect, WebGL path.

#### AUDIT of particle.html (2026-10-25)

**✅ WORKS WELL (keep as-is):**
- Self-contained: zero dependencies, hand-rolled 4×4 matrix math, 2D canvas.
- Animated 3D point grid (wave / radial / noise modes) with height-based 2-color gradient.
- All sliders live-wired: resolution, amplitude, frequency, point size, speed.
- Camera: drag orbit + wheel zoom + auto-rotate; behind-camera points culled (outW check).
- Mic pipeline: getUserMedia → AnalyserNode; FFT column mapping (min/max Hz, clamped) and RMS→dB loudness with EMA beat detection; beat pulse drives color bias + point size.
- On-screen FPS counter and mic status line (matches our in-app-diagnostics rule).
- Pause/resume, resize handling, min<max frequency clamping.

**🔧 NEEDS WORK (fix to keep):**
- **No touch events** — orbit/zoom are mouse-only; broken on phones (violates mobile-first).
- **No `<meta viewport>`** — page renders wrong on mobile.
- **Perf:** up to 300×300 = 90k points/frame, each building an `rgb()` string + fillRect → stutters on phones. Add color lookup table, cap DPR, adaptive resolution tied to FPS.
- **GUI panel:** fixed 240px, 12px font, always covers canvas — needs collapsible sheet with 44px targets.
- **DPR ignored** → blurry on retina screens.
- **Grid desync bug:** resolution slider updates `resolution` on 'input' but only regenerates points on 'change' → row/col mapping skews while dragging. Regenerate (throttled) on input.
- **AudioContext/mic edge cases:** no handling for revoked permission, track end, or suspended context resume.
- FFT mode modulates by column only (rows identical) — fine, but radial/band mapping would look better.

**🗑 ELIMINATE / REPLACE:**
- Always-on desktop GUI panel → replace with collapsible bottom sheet.
- Per-frame string color building → replace with precomputed gradient LUT.
- "Mic already enabled" dead-end button state → replace with proper enable/disable toggle.
- Desktop-era `<hr>` layout and tiny fonts.

**➕ ADD (to be compelling):**
- Touch: one-finger orbit, pinch zoom, double-tap reset; `touch-action: none`.
- One-tap presets (e.g., Calm Sea, Storm, Bass Reactor) — instant wow on first open.
- Auto-quality: FPS-driven resolution scaling + in-app perf status.
- Mic onboarding: clear in-app prompts for allow/deny/no-mic/insecure-context.
- Palette picker + dark trails option.
- Settings persist (localStorage); fullscreen button.
- First-run hint overlay ("drag to orbit · pinch to zoom · enable mic to react").
- Respect prefers-reduced-motion.

### Open items (top priority first)
1. Owner confirms R1 scope (default: all "fix" + "add" items above) — or just say "build it".
2. First build of projects/test-product.html per audit.
3. Device-test gates above; log results in ledger.

## 3. FUTURE IDEAS

Unscheduled parking lot. Nothing here is promised.
- WebGL renderer for 1M+ points.
- Screenshot/PNG export + shareable settings link.
- Audio file / tab audio input (not just mic).
- Beat-synced color palettes; radial FFT surface mode.

## 4. IMMUTABLE WORKING RULES

1. Mobile-first: design and test for a phone screen first, desktop second.
2. All diagnostics in-app: errors and status shown on screen, never DevTools/console only.
3. Update plan before code: this file changes first, code second, every time.
4. Read-back verification after every push: re-read what was written and confirm it matches intent.
5. No stubs or fake data: everything on screen works with real logic.
6. One file write per response; code lives at projects/test-product.html unless the owner says otherwise.
7. Never fabricate analysis of a file whose contents were not provided; ask for the source instead.

## 5. DECISION LOG

| Date | Decision | By |
|---|---|---|
| 2026-09-27 | Plan structure adopted (ledger → releases → detail → ideas → rules → decisions → appendix) | Owner |
| 2026-10-25 | particle.html chosen as candidate baseline; audit precedes any build | Owner |
| 2026-10-25 | Audit verdict: keep core engine + audio pipeline; rebuild UI mobile-first; R1 = fix list + add list | Agent (recorded) |

## 6. APPENDIX

**Authority order (highest wins):**
1. This plan file (projects/test-product.md) — sole authority for goals, open tasks, backlog, bugs.
2. Owner's latest explicit instruction in the current request.
3. Referenced file contents provided by the owner.
4. Chat history — partial or missing; loses to all of the above.

**Known facts:**
- Code file: projects/test-product.html — single-file, mobile-first HTML app. Not yet created.
- Baseline: particle.html (acmeproducts/dev) — full source received and audited 2026-10-25; catalog stored under R1.
- App concept: audio-reactive 3D particle wave field; audience/features per R1 scope.
