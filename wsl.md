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
| 2026-10-01 | CATALOG | Extracted complete feature inventory from wsl.html. Awaiting owner selection of which features to merge into snow1.html baseline. No code written—plan update only to prevent timeout. |
| 2026-10-01 | RECOMMEND | Confirmed next steps: owner selects features via bracket codes → first incremental chunk (<100KB) → subsequent patches. CODE path updated to snow1.html per owner directive. No full-file writes until size <300KB. |

# WSL — Master Plan (Active Target: snow1.html)

Single-file mobile-first HTML app. Baseline shifting to **snow1.html** using current wsl.html as the authoritative reference catalog. The owner will select specific features from the catalog below to port into the new baseline.

## Diagnosis & Constraints
- **Root cause**: Build worker terminates after 8 minutes; full-file writes of complete HTML games (~400KB) exceed this limit
- **Mitigation**: 
  - Incremental implementation only: core loop first, then features in <100KB chunks
  - Strict feature selection required before any code write to minimize initial payload
  - Plan updates must remain concise; full catalog already extracted below
- **Target**: snow1.html (replaces previous wsl.html per owner instruction)
- **Reference**: wsl.html serves as the feature catalog source only; it is no longer the build target

## Recommended Next Steps

Because the worker enforces a hard 8-minute ceiling, we cannot emit the full game in one turn. Here is the safest path forward:

1.  **Select Your Features** (this turn): Reply with the bracket codes you want in the first playable skeleton (see catalog below).  
    *Suggested minimal "STARTER_PACK":* `[CORE-1]`, `[PHYS-1]`, `[CTRL-1]`, `[STATE-1]`, `[RENDER-1]`, `[INPUT-1]`, `[SAFETY-1]`.
2.  **Validate the Pipeline** (next turn): I will write snow1.html containing only the selected starter systems (~50–80KB). This verifies the incremental build works without timeout.
3.  **Patch-Mode Expansion** (subsequent turns): Each reply of "Add [CODE]" appends the next logical subsystem (e.g., `[OBS-1]` for obstacles, `[AUDIO-1]` for sound) until the baseline matches your preferred complexity.
4.  **Backlog Activation** (future): Once snow1.html is stable and under 300KB total, we resume deferred features (Shadow Racing, Rhythm Rails).

*If you want to skip the catalog review:* simply reply **"Use STARTER_PACK"** and I will immediately write the minimal snow1.html skeleton.

## Available Feature Catalog (Select by Code)
Reply with codes like: `[CORE-1],[PHYS-1],[CTRL-1]`

**[CORE]** Track & World
- `[CORE-1]` Single track drawing (mouse/touch), cumulative arc-length parameterization, nearest-point queries
- `[CORE-2]` Multi-track support (array of tracks, track switching during fall)
- `[CORE-3]` Edit-mode pulse (animated indicator on last point)
- `[CORE-4]` Parallax starfield (80 stars, depth-layered)

**[PHYS]** Physics & Motion
- `[PHYS-1]` Gravity 1050 px/s², velocity clamp ±2000, drag 0.1, rolling resistance 5
- `[PHYS-2]` Jump chaining (3× tap detection → "BIG JUMP" 1.6× force)
- `[PHYS-3]` Flip mechanics (front/back rotation with angular momentum)
- `[PHYS-4]` Rescue track physics (freeze timer, new track branch)

**[CTRL]** Controls
- `[CTRL-1]` Four-button layout (RESCUE/BACK/JUMP/FRONT) with pointer events
- `[CTRL-2]` Pointer drawing (world-space conversion, 3px minimum distance)
- `[CTRL-3]` Pinch-zoom (0.35×–3.5×) with wheel fallback

**[STATE]** Game State Machine
- `[STATE-1]` READY → RUN → FALL → RESCUE_EDIT → SUCK → OVER transitions
- `[STATE-2]` Rescue charge system (3 charges, decrement logic, button text update)
- `[STATE-3]` Survival timer (pause in RESCUE_EDIT, pause when not RUN/FALL)

**[SCORE]** Scoring & HUD
- `[SCORE-1]` Page system (+100 every screen-width crossed)
- `[SCORE-2]` Distance tracking (pixels → inches conversion)
- `[SCORE-3]` Best score persistence (localStorage)
- `[SCORE-4]` Floaters (animated +100, BOOST, LAND text)

**[OBS]** Obstacles (difficulty-gated)
- `[OBS-1]` Black holes (radial-gradient pull zones)
- `[OBS-2]` Rocks (gray circles, collision)
- `[OBS-3]` Fences (brown horizontal bars)
- `[OBS-4]` Difficulty slider (Zen/Low/Med/Hard controlling spawn count)

**[VIS]** Visual Polish
- `[VIS-1]` Snowman cart rendering (⛄ emoji, wheels, coal cart body)
- `[VIS-2]` Animated snow overlay (50 flakes, sine drift)
- `[VIS-3]` Death hole animation (purple-black radial, spinning rings)
- `[VIS-4]` Camera follow (lerp to cart, lookahead)

**[AUDIO]** Web Audio API
- `[AUDIO-1]` 4-theme oscillator (calm/sine, fun/triangle, whimsical/square, Zen/reverb-approx)
- `[AUDIO-2]` Event beeps (jump, land, rescue, die)

**[INPUT]** Input Safety
- `[INPUT-1]` Pointer API multi-touch support
- `[INPUT-2]` Touch-action:none, overscroll-behavior:none
- `[INPUT-3]` Prevent default on gestures (stop zoom/refresh)

**[SAFETY]** Mobile Polish
- `[SAFETY-1]` Safe-area insets (env(safe-area-inset-*))
- `[SAFETY-2]` Orientation change handling (resize debounce)
- `[SAFETY-3]` Meta viewport (no user scaling, viewport-fit=cover)

## Backlog (Deferred until snow1.html baseline stable)
- **[BACKLOG-1]** Shadow Racing (Ghost Lane): 50ms position recording, translucent ghost replay
- **[BACKLOG-2]** Rhythm Rails: 110BPM pulse, beat-aligned track tinting
- **[BACKLOG-3]** Momentum Multiplier (Streak): Clean landing combo system
- **[BACKLOG-4]** Weather Whimsy: Aurora magnetic attraction, snow drag
- **[BACKLOG-5]** Flake Currency: Golden snowflakes for bonus rescue charges

## Immediate Next Step
**Reply with one of:**
- A comma-separated list of bracket codes (e.g., `[CORE-1],[PHYS-1],[CTRL-1]`)
- The keyword **"STARTER_PACK"** to accept the suggested minimal feature set
- **"List [CATEGORY]"** (e.g., "List [PHYS]") to see detailed descriptions of a specific category before choosing

*Once you reply, I will write the first chunk of snow1.html containing only the selected features to stay well under the 8-minute timeout.*
</plan>