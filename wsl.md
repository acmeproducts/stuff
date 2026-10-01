<plan>
| Date | Stage | What happened |
|---|---|---|
| 2026-09-20 | DEFINE | Refined controls to four buttons (RESCUE/BACK/JUMP/FRONT); removed all automatic deadpool detection; rescue usable anytime; jump supports repeated taps for extra height; timer pauses in RESCUE_EDIT. |
| 2026-09-22 | DESIGN | Proposed five engagement concepts tiered a/b/c (Shadow Racing, Rhythm Rails, Momentum Multiplier, Weather Whimsy, Flake Currency) to increase session depth without heavy UI or tutorial burden; awaiting owner selection/ordering. |
| 2026-09-24 | SELECT | Owner selected #1 Shadow Racing and #2 Rhythm Rails for implementation. Verified current build passes all acceptance checks (persistent settings, jump stacking, rescue freeze, no disabled buttons, mobile-optimized). |
| 2026-09-24 | IMPL | Re-reviewed the master plan and confirmed Shadow Racing (Ghost Lane) is the next concrete item; Rhythm Rails remains queued. No code was written in this checkpoint run. |
| 2026-09-27 | BUILD | Attempted Shadow Racing implementation; build attempts failed validation/timeouts. No code written. |
| 2026-09-30 | BUILD | Attempted Shadow Racing implementation; build exceeded 8-minute timeout. No code written. |
| 2026-09-30 | DIAGNOSE | Root cause identified: full-file writes exceed worker time limit. Shadow Racing is not present in codebase (ghost recording/replay/absent). Rhythm Rails blocked pending stable build. Strategy: incremental patch mode. |
| 2026-10-01 | DIAGNOSE | Build worker hard limit is 8 minutes. Full HTML file writes (>400KB) consistently timeout. Previous commit 193798a unavailable in context. Owner clarified: use snow1.html as baseline target, extract features from current wsl.html for selective porting. Feature catalog extraction required before any file write. |
| 2026-10-01 | CATALOG | Extracted complete feature inventory from wsl.html (provided in context). Awaiting owner selection of which features to merge into snow1.html baseline. No code written—plan update only to prevent timeout. |

# WSL — Master Plan (Active Target: snow1.html)

Single-file mobile-first HTML app. Baseline shifting to **snow1.html** using current wsl.html as the authoritative reference catalog. The owner will select specific features from the catalog below to port into the new baseline.

## Diagnosis & Constraints
- **Root cause**: Build worker terminates after 8 minutes; full-file writes of complete HTML games exceed this limit
- **Mitigation**: Plan-only updates until feature selection is finalized; incremental implementation thereafter
- **Target change**: snow1.html (replaces previous snowy.html/193798a baseline which was unavailable in context)

## Feature Catalog (from current wsl.html implementation)

Select features by referencing the bracketed codes (e.g., "[CORE-1]" through [AUDIO-4], etc.) in your next message.

### [CORE] Track & Drawing
- **[CORE-1]** Manual Bezier-like track drawing via touch/mouse with cumulative length tracking
- **[CORE-2]** Multi-track support (array of track objects with individual colors and rescue flags)
- **[CORE-3]** Edit-mode highlighting (pulse animation at track endpoint, color-coded rescue tracks: orange→blue→red)

### [PHYS] Physics Engine
- **[PHYS-1]** Gravity (1050 px/s²), drag (0.1), rolling resistance (5), velocity clamping (±2000)
- **[PHYS-2]** Momentum-based cart movement along drawn paths with tangent angle calculation
- **[PHYS-3]** Accurate arc-length parameterization for position lookup along arbitrary track segments

### [CTRL] Four-Button Control Layout
- **[CTRL-1]** Fixed bottom-center row: RESCUE (orange), BACK < (blue), JUMP (green), FRONT > (red)
- **[CTRL-2]** Active states: RESCUE always enabled (3 charges), BACK/FRONT only active during FALL
- **[CTRL-3]** Jump chaining: repeated taps within 800ms window stack up to "BIG JUMP" (3× multiplier)

### [MOVE] Movement & Rescue
- **[MOVE-1]** Jump system: launch from track + mid-air boost stacking, velocity cap (-4000)
- **[MOVE-2]** Flip mechanics: BACK (left/up boost, -spin), FRONT (right/forward boost, +spin), 360° spin animation
- **[MOVE-3]** Rescue system: 3 charges, freeze physics + timer, spawn new colored track segment, edit mode entry
- **[MOVE-4]** Landing detection: proximity + velocity-based landing on any track during fall

### [STATE] State Machine
- **[STATE-1]** READY → RUN → FALL → RESCUE_EDIT ↔ SUCK → OVER
- **[STATE-2]** Timer pauses during RESCUE_EDIT, accumulates survival time for scoring
- **[STATE-3]** No auto-death: player exclusively decides when to trigger rescue

### [SCORE] Scoring & Progression
- **[SCORE-1]** Page system: infinite scrolling segments (+100 points per new page)
- **[SCORE-2]** Distance tracking: total pixels → inches conversion (20px = 1 inch)
- **[SCORE-3]** Survival timer: millisecond-accurate, converts to points at 10× multiplier
- **[SCORE-4]** High score persistence via localStorage (`scl_best`)

### [OBS] Obstacles & Difficulty
- **[OBS-1]** Four difficulty levels: Zen (0), Low (3), Med (6), Hard (12 obstacles)
- **[OBS-2]** Black holes: circular pull zones, instant death on contact
- **[OBS-3]** Rocks: circular collision barriers
- **[OBS-4]** Fences: rectangular barriers (Hard mode only)
- **[OBS-5]** Procedural placement: random X (800–3800px), Y variation (20%–70% screen height)

### [VIS] Visual Atmosphere
- **[VIS-1]** Parallax starfield (80 stars, depth-layered scrolling)
- **[VIS-2]** Animated snowflakes (50 particles, sine-wave drift, bounds wrapping)
- **[VIS-3]** Cart rendering: snowman emoji + chassis with rotating wheels, flip animation
- **[VIS-4]** Death animation: "Black hole suck" with radial gradient, rotation, scale-to-zero
- **[VIS-5]** Floating combat text ("JUMP", "FLIP >", "+100", "NO CHARGES") with fade-out
- **[VIS-6]** Blur-resistant HUD with safe-area insets for mobile notches

### [AUDIO] Audio Synthesis
- **[AUDIO-1]** Web Audio API with 4 themes: Calm/sine, Fun/triangle, Whimsical/square-vibrato, Zen/sine-reverb
- **[AUDIO-2]** Dynamic pitch mapping to jump chains (frequency increases with chain count)
- **[AUDIO-3]** Beep synthesis for UI feedback, jumps, flips, and death events

### [UI] Settings & Persistence
- **[UI-1]** Settings modal: intensity presets (Low/Med/High/Custom), physics sliders (jump 400–2000, flip 200–1200)
- **[UI-2]** Audio theme selector, difficulty slider with preview text
- **[UI-3]** Persistent storage: `localStorage` keys `scl_settings` (JSON) and `scl_best` (int)

### [INPUT] Input & Camera
- **[INPUT-1]** Pointer API with multi-touch support
- **[INPUT-2]** Pinch-to-zoom (0.35×–3.5×) with lerp smoothing (k=4)
- **[INPUT-3]** Camera modes: Ready/Edit follows track end; Run/Fall follows cart with Y-offset adjustment
- **[INPUT-4]** Gesture discrimination: 10px threshold distinguishes drawing vs. tapping

### [SAFETY] Mobile Polish
- **[SAFETY-1]** `touch-action: none`, `user-select: none`, overscroll prevention
- **[SAFETY-2]** Orientation change handling with 300ms resize debounce
- **[SAFETY-3]** env(safe-area-inset) support for notches/buttons
- **[SAFETY-4]** Button press feedback (0.92× scale)

## Pending Owner Selection
Reply with desired features by code (e.g., "Include [CORE-1], [PHYS-1], [CTRL-1], [MOVE-1], [STATE-1], [SCORE-1], [VIS-1], [AUDIO-1], [SAFETY-1]") to proceed with snow1.html implementation. Unselected features will be excluded from initial build to minimize file size and prevent timeouts.

## Backlog (Deferred Ideas)
- **[BACKLOG-1]** Shadow Racing (Ghost Lane): 50ms position recording, translucent ghost replay, overtaking detection
- **[BACKLOG-2]** Rhythm Rails: 110BPM pulse, beat-aligned track tinting, micro-boosts  
- **[BACKLOG-3]** Momentum Multiplier (Streak): Clean landing combo system (×2–×4)
- **[BACKLOG-4]** Weather Whimsy: Aurora (magnetic track attraction), Snow drag, Starfall bridges
- **[BACKLOG-5]** Flake Currency: Golden snowflakes for bonus rescue charges
</plan>