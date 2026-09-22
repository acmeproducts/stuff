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
- IDEA (a) COMPELLING — **Shadow Racing (Ghost Lane).** Asynchronous translucent replay of the player’s previous-best run (or a selected friend’s ghost) races alongside the current cart. Requires zero UI or new controls—ghost is purely visual feedback that naturally motivates “beat yesterday’s me.” Low cognitive load because it operates on existing muscle memory and provides an implicit high-score target without explicit HUD clutter. Implementation: store last run’s position-array, replay as semi-transparent silhouette with depth-fade, clamped to current camera X to avoid spoilers ahead. Award “Personal Best” floater if current cart passes ghost.
- IDEA (a) COMPELLING — **Rhythm Rails.** Background music subdivides into beats; when the cart rolls over track segments that were drawn exactly on the beat (detected via timestamp delta to nearest beat), the rail briefly glows gold and applies a micro-boost (+15% vx). Turns ambient audio into tactile feedback without requiring a “rhythm game” skill ceiling—players intuit that “drawing to the groove feels good.” Low cognitive load because it’s an ambient reward layer, not a requirement. Implementation: BPM tap or fixed 110BPM; store draw-timestamp per segment; during physics step, if cart.s segment’s draw-time modulo beat-interval < threshold, apply boost and tint.
- IDEA (b) OK — **Momentum Multiplier (Streak).** Consecutive “clean” landings (touching track after FALL without using RESCUE and with |vy| < impact_threshold) build a combo stack (×2, ×3, ×4). Resets on RESCUE use or crash. Adds risk/reward tension to flips without new buttons. Low cognitive load because it’s passive feedback (flashing “×3” HUD) that reinforces the existing “land smoothly” skill. Implementation: counter on successful landOnTrack if no rescue used; multiply incoming baseScore additions by min(counter,4).
- IDEA (b) OK — **Ambient Weather Whimsy.** Occasional cosmetic overlays (Aurora Borealis, Gentle Snow, Starfall) that subtly tweak physics: Aurora exerts tiny magnetic attraction toward nearest track (reduces “stuck in space” anxiety), Snow adds light drag that encourages longer tracks, Starfall creates temporary glowing bridges that disappear after one crossing. Low cognitive load because they’re atmospheric variants of existing physics (just tweakers, not new rules) and can be disabled in Settings. Implementation: weather state machine, probability trigger every 30s of gameplay, lightweight shaders/particles for visual theme.
- IDEA (c) MUNDANE — **Flake Currency.** Golden snowflakes spawn along high-arcing jump trajectories or tight curves; collect 100 to earn +1 rescue charge. Standard mobile retention mechanic; adds completionist pressure but does not deepen the core fantasy or mechanic. Low cognitive load (passive collection) but low novelty. Implementation: array of collectibles with simple AABB collision vs cart, particle burst on collect, modulo counter for extra life.

## Turn/Stage Ledger
| Date | Stage | What happened |
|---|---|---|
| 2026-09-20 | DEFINE | Refined controls to four buttons (RESCUE/BACK/JUMP/FRONT); removed all automatic deadpool detection; rescue usable anytime; jump supports repeated taps for extra height; timer pauses in RESCUE_EDIT. |
| 2026-09-22 | DESIGN | Proposed five engagement concepts tiered a/b/c (Shadow Racing, Rhythm Rails, Momentum Multiplier, Weather Whimsy, Flake Currency) to increase session depth without heavy UI or tutorial burden; awaiting owner selection/ordering. |