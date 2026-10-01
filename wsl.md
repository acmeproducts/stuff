| Date | Stage | What happened |
|---|---|---|
| 2026-09-20 | DEFINE | Refined controls to four buttons (RESCUE/BACK/JUMP/FRONT); removed all automatic deadpool detection; rescue usable anytime; jump supports repeated taps for extra height; timer pauses in RESCUE_EDIT. |
| 2026-09-22 | DESIGN | Proposed five engagement concepts tiered a/b/c (Shadow Racing, Rhythm Rails, Momentum Multiplier, Weather Whimsy, Flake Currency) to increase session depth without heavy UI or tutorial burden; awaiting owner selection/ordering. |
| 2026-09-24 | SELECT | Owner selected #1 Shadow Racing and #2 Rhythm Rails for implementation. Verified current build passes all acceptance checks (persistent settings, jump stacking, rescue freeze, no disabled buttons, mobile-optimized). |
| 2026-09-24 | IMPL | Re-reviewed the master plan and confirmed Shadow Racing (Ghost Lane) is the next concrete item; Rhythm Rails remains queued. No code was written in this checkpoint run. |
| 2026-09-27 | BUILD | Attempted Shadow Racing implementation; build attempts failed validation/timeouts. No code written. |
| 2026-09-30 | BUILD | Attempted Shadow Racing implementation; build exceeded 8-minute timeout. No code written. |
| 2026-09-30 | DIAGNOSE | Root cause identified: full-file writes exceed worker time limit. Shadow Racing is not present in codebase (ghost recording/replay/absent). Rhythm Rails blocked pending stable build. Strategy: incremental patch mode. |
| 2026-10-01 | PIVOT | Owner requested creation of snowy.html using commit 193798a as baseline; cataloged features from current wsl.html for selection. Note: 193798a content not in context—using provided wsl.html as reference for feature extraction. Awaiting owner selection. |

# WSL — Master Plan (Active Fork: snowy.html)

Single-file mobile-first HTML app pivot to **snowy.html**. This plan remains the sole authority. The owner will select features from the catalog below to port into the new baseline.

## Baseline Reference
- **Target**: snowy.html
- **Source baseline**: Commit 193798a (requested by owner; content pending availability)
- **Reference catalog**: Current wsl.html features (listed below) extracted for selection

## Feature Catalog (from current wsl.html implementation)

### Core Mechanics
- **Manual Track Drawing**: Touch/mouse drawing of Bezier-like line segments (tracks) with cumulative length tracking
- **Four-Button Control Layout**: Fixed bottom-center row (RESCUE, BACK <, JUMP, FRONT >)
- **Physics Simulation**: Gravity (1050 px/s²), drag (0.1), rolling resistance, velocity clamping (±2000), momentum-based cart movement along drawn paths
- **State Machine**: READY → RUN → FALL → RESCUE_EDIT ↔ SUCK → OVER

### Movement & Rescue
- **Jump System**: Initial launch from track + mid-air boost stacking (chain up to 3 for "BIG JUMP"), velocity cap (-4000), pitch-shifted audio feedback
- **Flip Mechanics**: BACK (left/up boost) and FRONT (right/forward boost) accessible only during FALL state; adds spin and velocity changes
- **Rescue System**: 3 charges (consumes one per use), freezes physics and timer, spawns new colored track segment (orange→blue→red gradient), enters edit mode, resumes on cart tap
- **No Auto-Death**: Player exclusively decides when to trigger rescue; no stuck detection algorithms

### Scoring & Progression
- **Page System**: Infinite scrolling based on screen width segments; +100 points per new page reached
- **Distance Tracking**: Total pixels traveled converted to inches (20px = 1 inch), contributes to final score
- **Survival Timer**: Millisecond-accurate timing paused during RESCUE_EDIT; converts to points at 10× multiplier
- **High Score Persistence**: LocalStorage key `scl_best`

### Obstacles & Difficulty
- **Difficulty Levels**: Zen (0), Low (3 obstacles), Med (6), Hard (12)
- **Obstacle Types**: 
  - Black holes (circular pull zones, instant death on contact)
  - Rocks (circular collision, solid)
  - Fences (rectangular barriers, Hard mode only)
- **Procedural Placement**: Random X positioning (800–3800px), Y variation (20%–70% screen height)

### Visual & Audio
- **Atmosphere**: Parallax starfield (80 stars), animated snowflakes (50 particles, sine-wave drift)
- **Cart Rendering**: Snowman emoji + coal cart chassis with wheel rotation during movement, flip animation (360° spin) during tricks
- **Death Animation**: "Black hole suck" with radial gradient, rotation, and scale-to-zero effect
- **Audio Synthesis**: Web Audio API, 4 themes (Calm/sine, Fun/triangle, Whimsical/square-vibrato, Zen/sine-reverb), dynamic pitch mapping to jump chains
- **UI Elements**: Floating combat text ("JUMP", "FLIP >", "+100", "NO CHARGES"), blur-resistant HUD with safe-area insets for mobile notches

### Settings & Persistence
- **Settings Panel**: Modal overlay with intensity presets (Low/Med/High/Custom), physics sliders (jump 400–2000, flip 200–1200), audio theme selector, difficulty slider
- **Persistent Storage**: `localStorage` keys `scl_settings` (JSON) and `scl_best` (int)

### Input & Camera
- **Multi-touch**: Pointer API with pinch-to-zoom (0.35×–3.5×), panning camera lerp (k=4)
- **Gesture Recognition**: Pinch distance calculation for zoom, drawing vs. tapping discrimination (10px threshold)
- **Camera Modes**: Ready/Edit follows track end; Run/Fall follows cart with Y-offset adjustment when falling

### Safety & Polish
- **Mobile Optimization**: `touch-action: none`, `user-select: none`, overscroll prevention, orientation change handling, env(safe-area-inset) support
- **Visual Feedback**: Button press scaling (0.92×), track pulse animation at edit endpoint, color-coded rescue tracks with highlight stroke

## Pending Feature Integration
Awaiting owner selection from catalog above to merge into snowy.html baseline. Once selected, features will be added to the Sprint section below.

## Backlog (Deferred from wsl.html)
- IDEA (a)  — **Shadow Racing (Ghost Lane)**: Record position every 50ms, translucent ghost replay, overtaking detection, "PERSONAL BEST" floater (was active sprint—now pending feature selection for snowy.html)
- IDEA (b) OK — **Rhythm Rails**: 110BPM pulse, beat-aligned track tinting, micro-boosts
- IDEA (b) OK — **Momentum Multiplier (Streak)**: Clean landing combo system (×2–×4)
- IDEA (b) OK — **Weather Whimsy**: Aurora (magnetic track attraction), Snow drag, Starfall bridges
- IDEA (c) MUNDANE — **Flake Currency**: Golden snowflakes for bonus rescue charges