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
| 2026-10-01 | BLOCKER | **Confirmed**: 8-minute computation hard-stop prevents monolithic file delivery (400KB+ HTML/plan updates). **Workaround**: Incremental patch strategy—implement snow1.html in small chunks (<100KB) or await strict feature selection to reduce payload. No full-file writes until size <300KB. |

# WSL — Master Plan (Active Target: snow1.html)

Single-file mobile-first HTML app. Baseline shifting to **snow1.html** using current wsl.html as the authoritative reference catalog. The owner will select specific features from the catalog below to port into the new baseline.

## Diagnosis & Constraints
- **Root cause**: Build worker terminates after 8 minutes; full-file writes of complete HTML games (~400KB) exceed this limit
- **Mitigation**: 
  - Incremental implementation only: core loop first, then features in <100KB chunks
  - Strict feature selection required before any code write to minimize initial payload
  - Plan updates must remain concise; full catalog already extracted above (reference previous ledger)
- **Target**: snow1.html (replaces previous snowy.html/193798a baseline)

## Workaround Strategy ("Patch Mode")
1. **Owner selects features** from catalog using bracket codes (e.g., "include [CORE-1],[PHYS-1],[CTRL-1]" etc.)
2. **I implement incrementally**: First write skeletal HTML/structure (~50KB), then append features in separate turns
3. **No full rewrites**: Once snow1.html exists, only patch deltas (new script sections) will be written
4. **Timeout guard**: If any single write approaches 6 minutes, split into smaller logical chunks (e.g., physics separate from rendering)

## Available Feature Catalog (Abbreviated codes)
Select features by replying with codes:
- **[CORE]** Track drawing, multi-track support, edit-mode pulse
- **[PHYS]** Gravity(1050), drag, rolling resistance, velocity clamp
- **[CTRL]** Four-button layout (RESCUE/BACK/JUMP/FRONT)
- **[MOVE]** Jump chaining (3× BIG JUMP), flip mechanics, 3-charge rescue
- **[STATE]** READY→RUN→FALL→RESCUE_EDIT→SUCK→OVER machine
- **[SCORE]** Page system (+100), distance (px→in), survival timer
- **[OBS]** Obstacles (holes/rocks/fences) with 4 difficulty levels
- **[VIS]** Parallax stars, animated snow, snowman cart, death animation
- **[AUDIO]** Web Audio API with 4 themes (sine/triangle/square)
- **[INPUT]** Pointer API, pinch-zoom (0.35×–3.5×), camera follow
- **[SAFETY]** Mobile polish (touch-action, safe-area, orientation handling)

## Backlog (Deferred until baseline stable)
- **[BACKLOG-1]** Shadow Racing (Ghost Lane): 50ms position recording, translucent ghost replay
- **[BACKLOG-2]** Rhythm Rails: 110BPM pulse, beat-aligned track tinting
- **[BACKLOG-3]** Momentum Multiplier (Streak): Clean landing combo system
- **[BACKLOG-4]** Weather Whimsy: Aurora magnetic attraction, snow drag
- **[BACKLOG-5]** Flake Currency: Golden snowflakes for bonus rescue charges

## Immediate Next Step
**Reply format**: "Include [CORE], [PHYS], [CTRL], [MOVE], [STATE], [INPUT], [SAFETY]" (or specific sub-codes) to trigger first incremental build of snow1.html. Unselected features excluded from initial build to guarantee <8min write time.
</plan>