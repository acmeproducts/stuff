<plan>
# WSL — Master Plan

Single-file mobile-first HTML app (wsl.html). This plan is the sole authority and the only memory that persists between runs. Chat history may be partial or missing.

## Define

**Working title:** Snowman Coal-Cart Line Rider (from owner instructions + image v3.png)

**Purpose:** A mobile-first, single-file HTML arcade game where the player draws track, releases a snowman in a coal cart, and keeps it alive by drawing ahead or manually rescuing. No automatic “stuck/deadpool” detection exists—the player alone decides when a rescue is needed.

**Users:** Casual mobile players; short sessions; one-thumb/two-thumb play.

**Core loop:**
1. A track exists; tap it to release the cart.
2. Cart rolls on momentum (gravity, slope, drag).
3. Player may press **JUMP** at any time during a run to launch into the air. Repeated JUMP taps while airborne stack height (upward velocity) for bigger arcs.
4. If the cart leaves the track (end, gap, or jump), it enters FALL. In FALL, player may use **BACK FLIP** (short boost up/back) or **FRONT FLIP** (long forward reach) to try to catch another track.
5. **RESCUE** can be pressed at **any time** (RUN, FALL, even READY). It consumes one charge (3 total), freezes time, spawns a new colored track under the cart (orange → blue → red per use), and enters EDIT mode to draw a replacement line. Tap the cart to resume RUN on that new line.
6. Failure = cart falls into the black hole. Timer pauses during RESCUE_EDIT. Final score = base points (distance pages + trick bonuses) + (survival seconds × 10).

**Controls (bottom center row, always visible, always tappable):**
- **RESCUE** (left-most): Shows remaining charges “x3/x2/x1/x0”. Clicking anytime consumes one charge and opens the rescue draw-mode.
- **< BACK** (second): Only functional during FALL. Performs a back-flip (moderate height gain, short backward impulse).
- **JUMP** (third): During RUN → launch into FALL with upward velocity. During FALL → add upward boost (cumulative, capped) to extend airtime/climb.
- **FRONT >** (right-most): Only during FALL. Long forward flip covering more ground.

**Why:** Removing automatic detection puts skill entirely in player judgment—reading oscillation, deciding when a line is unrecoverable, and conserving 3 precious rescues for true emergencies.

**Success criteria:**
- One HTML file, no external assets.
- Touch-first, mobile-optimized, pinch/wheel zoom preserved.
- Jump stacking must be noticeable (visual feedback + sound pitch rise).
- Rescue freeze must pause timer and physics; resume snaps cart to new track start.
- No greyed/disabled buttons—always render full color; invalid presses simply no-op or harmless beep.

## Backlog
- DONE (2026-09-20): Defined four-button centered layout including JUMP.
- DONE (2026-09-20): Specified rescue works in any state (no deadpool detection).
- DONE (2026-09-20): Jump mechanics defined (initial launch + repeated tap boost).

## Turn/Stage Ledger
| Date | Stage | What happened |
|---|---|---|
| 2026-09-20 | DEFINE | Refined controls to four buttons (RESCUE/BACK/JUMP/FRONT); removed all automatic deadpool detection; rescue usable anytime; jump supports repeated taps for extra height; timer pauses in RESCUE_EDIT. |
</plan>