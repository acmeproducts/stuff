# test-product — Master Plan

Sole authority for this project. Chat history loses to this file. Read this first every run.

## 0. TURN/STAGE LEDGER

Every build session appends a row here BEFORE touching code.

| Date | Turn/Stage | What happened | Status |
|---|---|---|---|
| 2026-09-27 | T0 — Plan init | Created master plan; seeded known facts | Done |
| 2026-10-25 | T1 — Analysis request | Owner asked to audit particle.html; source not yet in hand | Blocked → resolved T2 |
| 2026-10-25 | T2 — Audit done | Owner pasted full particle.html source. Four-part audit completed and recorded under R1 (below). Verdict: keep the core; fix mobile/perf; add presets + touch | Done |
| 2026-10-25 | T3 — Build ordered + rename | Owner said "build the whole thing, call it sndwiz.html". Code file officially renamed to projects/sndwiz.html (owner explicit instruction overrides default path; recorded in Decision Log). Plan updated before code per Rule 3. Build of full R1 scope begins next run | Plan done → code next |

## 1. RELEASES

| # | Name | One-line goal |
|---|---|---|
| R1 | sndwiz — mobile-first particle waves | Build projects/sndwiz.html: touch-first, phone-fast rebuild of particle.html with same visuals + mic reactivity, plus presets |

## 2. RELEASE DETAIL

### R1 — sndwiz, mobile-first
- **Goal:** A compelling single-file phone-first particle wave app at **projects/sndwiz.html**, rebuilt from the audited baseline.
- **Scope IN:**
  - Everything in "Keep" + "Needs work" fixes below.
  - Touch camera (orbit + pinch + double-tap reset), collapsible bottom-sheet controls, viewport meta, DPR-aware canvas, adaptive resolution.
  - Presets, mic UX with in-app status/errors, settings persistence, first-run hint, fullscreen, prefers-reduced-motion respect.
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
1. Build projects/sndwiz.html with full R1 scope (owner confirmed: "build the whole thing") — **next run, code write**.
2. Device-test gates above; log results in ledger.

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
6. One file write per response; code lives at projects/sndwiz.html (owner-renamed from projects/test-product.html, 2026-10-25).
7. Never fabricate analysis of a file whose contents were not provided; ask for the source instead.

## 5. DECISION LOG

| Date | Decision | By |
|---|---|---|
| 2026-09-27 | Plan structure adopted (ledger → releases → detail → ideas → rules → decisions → appendix) | Owner |
| 2026-10-25 | particle.html chosen as candidate baseline; audit precedes any build | Owner |
| 2026-10-25 | Audit verdict: keep core engine + audio pipeline; rebuild UI mobile-first; R1 = fix list + add list | Agent (recorded) |
| 2026-10-25 | Full R1 scope confirmed for build ("build the whole thing") | Owner |
| 2026-10-25 | Code file renamed: projects/test-product.html → projects/sndwiz.html. Owner explicit instruction in-request overrides default path; sndwiz.html is the project's code file from now on | Owner |

## 6. APPENDIX

**Authority order (highest wins):**
1. This plan file (projects/test-product.md) — sole authority for goals, open tasks, backlog, bugs.
2. Owner's latest explicit instruction in the current request.
3. Referenced file contents provided by the owner.
4. Chat history — partial or missing; loses to all of the above.

**Known facts:**
- Code file: **projects/sndwiz.html** — single-file, mobile-first HTML app. Not yet created. (Supersedes projects/test-product.html per owner instruction, 2026-10-25.)
- Plan file: projects/test-product.md (this file) — path never changes.
- Baseline: particle.html (acmeproducts/dev) — full source received and audited 2026-10-25; catalog stored under R1.
- App concept: audio-reactive 3D particle wave field; audience/features per R1 scope.
