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
| 2026-10-01 | SELECT | Owner selected items 1, 8, 9, and 10 for porting to snow1.html: (1) Multi-Track Drawing System, (8) Scoring & Persistence, (9) Rescue System, (10) Mobile UX Suite. Items 2-7 excluded for this sprint. |
| 2026-10-01 | PIVOT | Owner rejected fixed button bar (clunky, real-estate waste). Requests: gesture-based controls, revert to snow-v1 simplicity (physics/background), new Style Score metric based on average track margin ahead of cart. Updated sprint scope below. |

# WSL — Master Plan (Active Target: snow1.html)

Single-file mobile-first HTML app. Baseline shifting to **snow1.html** using current wsl.html as the authoritative reference catalog.

## Sprint Pivot: "Gestures & Style" (Owner Direction)
**Date:** 2026-10-01

**Rejected:** Fixed 4-button bottom control bar (RESCUE/BACK/JUMP/FRONT) — removed from design.
**Mandated:** 
- **Gesture Surface:** Full-canvas touch gestures replace buttons (see scheme below).
- **Aesthetic Reversion:** Revert physics and background to snow-v1 simplicity (minimalist starfield, simple gravity, no obstacle ecology, no complex audio themes).
- **Style Scoring:** New tertiary metric "Flow" (average margin) rewarding players who build track ahead of the cart (loops create delay → high margin → style points).

## Selected Features for This Sprint (Revised)
1. **Multi-Track Drawing System** — Cumulative arc-length parameterization, nearest-point queries, multiple track support, rescue-branch coloring.
2. **Style Scoring (Flow)** — Continuous sampling of track-ahead distance (end_of_track - cart_position). Rolling average normalized to screen-widths; awards "Flow" points at run-end.
3. **Rescue System** — Charge-limited (3) emergency tracks; physics-freeze while drawing rescue line; gesture-triggered (long-press or two-finger tap).
4. **Mobile UX Suite (Gesture Edition)** — 
   - Remove `#ctrlRow` entirely.
   - Floating translucent hint pill (auto-fade).
   - Pinch-zoom preserved (0.35×–3.5×).
   - Safe-area insets preserved.
   - Optional: FAB (Floating Action Button) top-left for "Slow-Mo" or drawer access if gestures feel too hidden.

## Gesture Control Scheme (Proposed)
| Action | Gesture | Detail |
|--------|---------|--------|
| **Jump** | Quick Tap (canvas) | 150ms max contact time; respects jumpForce setting; double-tap chaining allowed. |
| **Flip Back** | Swipe Left | Velocity > 0.3px/ms horizontal, delta X < -40px; triggers back-flip momentum. |
| **Flip Front** | Swipe Right | Velocity > 0.3px/ms horizontal, delta X > +40px; triggers front-flip momentum. |
| **Rescue** | Long Press (800ms) OR Two-Finger Tap | Visual radial fill indicator appears under finger; release early cancels. |
| **Draw** | Drag (any press-and-hold that isn't a jump or rescue) | Standard track extension; nearest-point join at release if near cart. |

*Anti-collision:* Ignore swipe gestures if pointer travel < 10px (interpret as tap). Ignore tap if travel > 15px (interpret as draw).

## Style Score (Flow) Algorithm
```
every 0.5s during RUN state:
  margin = track[cart.track].totalLen - cart.s
  avgMarginAccumulator += margin
  sampleCount++

At game over:
  avgMargin = avgMarginAccumulator / sampleCount
  flowScore = (avgMargin / pageWidth) * 10   // scaled to "screens ahead"
  totalScore = baseScore + distancePoints + (flowScore * 100)
```
**UX:** Mini "Flow" bar appears under timer (teal color) filling as margin grows; turns gold when >1 screen ahead.

## Immediate Next Step
Write **snow1.html Chunk 1 (<90KB):**
- Skeleton HTML/CSS (no button bar, safe-area support).
- Canvas setup with gesture recognizer (tap/swipe/long-press discrimination).
- Multi-Track drawing core (arc-length, nearest-point).
- Basic snow-v1 style background (static stars, simple snow overlay).
- Minimal HUD: Score | Flow Bar | Timer (no buttons).

*Blocked until executed:* Chunk 2 will add Rescue long-press logic and Flow telemetry; Chunk 3 adds persistence and end-game stats.
</plan>