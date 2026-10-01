<plan>
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
| 2026-10-01 | DELTA | Owner confirmed snow1.html baseline exists and requested high-level delta list (max 10 items) between wsl.html (reference) and snow1.html (target). Compiled 10 major system groups for selective porting. |

# WSL — Master Plan (Active Target: snow1.html)

Single-file mobile-first HTML app. Baseline shifting to **snow1.html** using current wsl.html as the authoritative reference catalog.

## Delta Analysis: wsl.html → snow1.html

Assuming snow1.html is a minimal/empty baseline, these are the 10 high-level feature systems present in wsl.html that constitute the migration scope:

1. **Multi-Track Drawing System** — Cumulative arc-length parameterization, nearest-point queries, support for multiple simultaneous tracks (primary + rescue branches), editable track coloring.
2. **Newtonian Physics Core** — Gravity (1050 px/s²), velocity-dependent drag, rolling resistance, velocity clamping (±2000), ground-to-air transitions.
3. **Aerial Mechanics Suite** — Jump chaining (3× tap detection → "BIG JUMP" 1.6× force), front/back flips with angular momentum, air control while falling.
4. **Game State Machine** — READY → RUN → FALL → RESCUE_EDIT → SUCK → OVER lifecycle with distinct update/draw behaviors for each state.
5. **Obstacle Ecology** — Procedural spawn system (black holes, rocks, fences) gated by difficulty slider (Zen/Low/Med/Hard), radial-physics pull zones, collision detection.
6. **Audio Engine** — Web Audio API implementation with 4-theme oscillator (calm/sine, fun/triangle, whimsical/square, zen), event-specific beeps (jump, land, rescue, die).
7. **Visual Polish Layer** — Parallax starfield (80 stars), animated snow overlay (50 flakes), death-hole vortex animation, floating text effects (+100, BOOST, LAND), camera follow with lookahead.
8. **Scoring & Persistence** — Page-based scoring (+100 per screen-width), pixel-to-inches distance tracking, localStorage best-score persistence, survival timer with pause/resume logic.
9. **Rescue System** — Charge-limited rescue branches (3 charges), physics-freeze edit mode during rescue drawing, rescue track join logic.
10. **Mobile UX Suite** — Pinch-zoom (0.35×–3.5×), safe-area insets (env(safe-area-inset-*)), orientation change handling, settings panel with intensity presets and difficulty slider.

## Implementation Strategy (unchanged)
- **Constraint**: 8-minute worker timeout prohibits full-file writes
- **Method**: Incremental patch mode — select 2-3 items from delta list per turn
- **Target**: snow1.html (replaces wsl.html as build output)

## Immediate Next Step
Reply with bracket codes from the detailed catalog (or reference the numbers 1-10 above) to select which systems to include in the first snow1.html chunk. Suggested first tranche for a playable skeleton: Track Drawing (1), Physics Core (2), and State Machine (4).
</plan>
</plan>