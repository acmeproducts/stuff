<plan>
# WSL — Master Plan

Single-file mobile-first HTML app (wsl.html). This plan is the sole authority and the only memory that persists between runs. Chat history may be partial or missing.

## Define

**Working title:** Snowman Coal-Cart Line Rider (from owner instructions + image v3.png)

**Purpose:** A mobile-first, single-file HTML arcade game. The player controls a track line: it can be extended and its angle changed. Tapping anywhere along the line releases a snowman riding in a coal cart from that point. The cart hurtles down the line with momentum while the player draws/extends new track ahead of it. The view auto-scrolls to the right as the cart advances. Score: 100 points for each complete page (screen-width) of rightward progress achieved before failing. Fail state: the cart reaches the end of the laid track with nothing to continue onto, flies off the end, spins, and is pulled into a black hole (game-over animation).

**Core mechanics (WHAT):**
1. Line editing: an existing line can be extended and its angle changed.
2. Release: tapping anywhere along the line releases the snowman-in-coal-cart at that point.
3. Momentum: the cart accelerates along the line's slope; speed carries onto connected/drawn segments.
4. Draw-as-you-go: the player draws new lines ahead of the moving cart to keep it alive.
5. Auto-scroll: the camera scrolls right, following the cart.
6. Scoring (per-page): +100 points per complete page to the right traversed before failing.

**Refined Rescue System (2026-09-20):**
- Player receives exactly 3 rescue charges per run (displayed on HUD).
- When the cart is falling (airborne), tapping RESCUE consumes one charge and immediately spawns a short rescue track segment directly underneath the cart's current position (cyan color, distinct from gold/brown standard tracks).
- The cart immediately lands on this rescue track and resumes RUN state; player can extend it by drawing.
- No automatic "deadpool" or stuck-detection timers — oscillation exploits are moot because the player must manually intervene with limited resources.

**Refined Flip System (2026-09-20):**
- While falling, the 360° button becomes active.
- Single tap performs a **Forward Flip** (boosts cart velocity along its facing direction, carries ~2× horizontal distance).
- Double-tap (or alternate button zone) performs a **Backward Flip** (shorter boost, opposite direction, useful for catching behind-track).
- Physics: forward flip adds horizontal impulse aligned with current angle; backward flip adds reversed impulse.
- Successful landing after any flip awards bonus points (forward = +1000, backward = +500).

**Timer & Composite Scoring (2026-09-20):**
- Survival timer starts counting on cart release (RUN state) and stops at death (SUCK/OVER).
- Final score formula: `total_points + (survival_seconds × 10)` — longer survival increases score, encouraging risk/reward on using rescues vs letting cart fall.
- HUD displays: score, best, rescue charges (battery icons), and elapsed time mm:ss.

**UI/Control Scheme:**
- **Always-visible Controls**: Two distinct on-screen buttons persist at all times (never hidden, never dimmed to invisibility). Position: bottom-left (RESCUE) and bottom-right (360° FLIP) for two-thumb ergonomics.
- **Rescue button**: shows remaining charges (e.g., "x3", "x2", "x1", "x0" disabled). Ghosted when charges exhausted or cart not falling.
- **Flip button**: shows "360°" label; differentiate forward (tap) vs backward (double-tap or hold).
- **Drawing Surface**: Canvas occupies full screen behind controls; drawing uses touch points outside button bounding boxes.

**Users:** Casual mobile players; short sessions; one-thumb/two-thumb play.

**Outcomes / success criteria:**
- Runs as one self-contained HTML file on a phone browser, no build step, no external dependencies.
- Touch-first controls (extend line, change angle, tap-to-release, draw ahead) feel immediate.
- Momentum is readable: steeper downhill = faster; speed loss on flat/uphill.
- Clear per-page score feedback (+100) and a satisfying black-hole game-over.
- All diagnostics surfaced in the app itself, never console-only.
- Controls are **always visible**; user never hunts for UI.
- Rescue charges are limited (3), forcing strategic use rather than infinite recovery.

**Asset decision (owner directive 2026-09-19):** If any assets are missing, create them — do not block on missing material. Default visual style: emoji + simple canvas shapes (⛄ snowman, coal cart, 🕳️ black hole).

## Backlog
- BUILD REQUEST (2026-09-20): implement 3-charge rescue system (spawns colored track under cart); remove deadpool detection; directional flips (forward/backward physics); survival timer; composite scoring; timer HUD display.
- DONE (2026-09-20): refined flip mechanics defined (forward = long, backward = short).
- DONE (2026-09-20): rescue limited to 3 charges, manual activation only.
- DONE (2026-09-20): timer + composite scoring formula documented.

## Turn/Stage Ledger
| Date | Stage | What happened |
|---|---|---|
| 2026-09-19 | DEFINE | Owner gave game instructions + v3.png (text-only): extendable/angle-adjustable line, tap-to-release snowman coal cart, momentum downhill, draw-ahead track, auto-scroll right, 100 pts per page, black-hole fail spin. Captured into Define; build request logged in backlog (held per Define phase). |
| 2026-09-19 | DEFINE | Owner re-sent the same instructions (context re-sync) and mentioned a "label.md" file exists. Supplied WSL command to locate all MD files from root (`sudo find / -type f -iname "*.md" 2>/dev/null`). Awaiting label.md contents to fold into Define; no code written (Define phase). |
| 2026-09-19 | DEFINE | Owner directive: "if you are missing any assets simply create them." Resolved visual-style question (default emoji/simple canvas shapes) and marked label.md non-blocking. Define section complete; no code written — awaiting explicit build go-ahead to write wsl.html. |
| 2026-09-19 | DEFINE | Owner re-sent plan + asset directive (re-sync); confirmed directive already captured and Define is complete. No code written — build remains held until owner says "build it". |
| 2026-09-19 | BUILD | Built wsl.html: multi-track engine, catch-air 360 flips (1000 pts), rollback line-switching, rescue boost with cyan track spawn, progress failsafe (deadpool detection), on-screen Rescue/Flip buttons. |
| 2026-09-19 | REFINE | User feedback: buttons flash/disappear too fast to use. Decision: replace ephemeral buttons with persistent central "opaque keypad" (outline-only when inactive, lights up when contextual actions available). Added UI/Control Scheme refinement to Define section. |
| 2026-09-19 | REFINE | User reported UI exploit: cart can oscillate in place avoiding deadpool trigger. Added no-forward-progress failsafe (4 seconds without 80px rightward gain triggers death). |
| 2026-09-20 | REFINE | User reported keypad feels "inert" and requested zoom control. Plan: make keypad tactile (scale-press feedback, immediate audio) and add pinch/wheel zoom for camera (0.5×–2.0×) while keeping mobile-first single-file constraints. |
| 2026-09-20 | DEFINE | User feedback: "there's no controls let's just show the controls" — interpreted as keypad not visible/accessible. Requirement refined in Define: controls must be **always visible**, never hidden via opacity; positioned for immediate thumb access (bottom-left/right split); clear text labels ("RESCUE", "360°"); ghosted state only dims interaction, not visibility. Build held pending explicit go-ahead. |
| 2026-09-20 | BUILD | Built wsl.html with always-visible buttons, pinch/wheel zoom, rescued track color, 360 flip. |
| 2026-09-20 | DEFINE | Owner feedback: velocity oscillation (-1,0,1) breaks deadpool timer; rescue should be limited (3 charges) rather than automatic; flip should be directional (forward/backward) with forward reaching much farther; add survival timer; composite scoring (points + time). Deadpool detection removed. Requirements updated in Define. |
</plan>