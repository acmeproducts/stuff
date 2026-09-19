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
6. Scoring: +100 points per complete page to the right traversed before failing.
7. Fail animation: cart off track end → spins → disappears into a black hole; run ends, score shown.

**UI/Control Scheme (REFINED 2026-09-19):**
- **Persistent Central Keypad**: Instead of ephemeral buttons that appear/disappear, a single opaque circular keypad sits at the bottom-center (or center) of the screen. 
- **Outline State**: When no contextual action is available, the keypad shows only a subtle outline (low opacity).
- **Illuminated State**: When the cart is falling (ST.FALL), the keypad "lights up" (glow/outline brightens) and reveals two zones: **Rescue** (left side/boost) and **360° Flip** (right side). 
- **Contextual Availability**: If a flip has already been performed (or rescue is on cooldown), that side dims or shows as unavailable.
- **Interaction**: Tap the left half for Rescue, right half for Flip. The keypad is always present so the player knows where to reach, but only interactive when valid.

**Users:** casual mobile players; short sessions; one-thumb/touch play.

**Outcomes / success criteria:**
- Runs as one self-contained HTML file on a phone browser, no build step, no external dependencies.
- Touch-first controls (extend line, change angle, tap-to-release, draw ahead) feel immediate.
- Momentum is readable: steeper downhill = faster; speed loss on flat/uphill.
- Clear per-page score feedback (+100) and a satisfying black-hole game-over.
- All diagnostics surfaced in the app itself, never console-only.
- **NEW:** Controls are always visible (persistent keypad) so the player is never surprised by disappearing UI.

**Asset decision (owner directive 2026-09-19):** If any assets are missing, create them — do not block on missing material. Default visual style: emoji + simple canvas shapes (⛄ snowman, coal cart, 🕳️ black hole). v3.png visual specifics will be interpreted freely; owner can restyle later.

**Source material:** image attachment v3.png was provided but this engine is text-only — per the asset decision above, visuals are interpreted with emoji/simple canvas shapes without further confirmation.

## Backlog
- BUILD REQUEST (2026-09-19): implement the game above into wsl.html. HELD — project is in Define; build on owner's go-ahead ("build it" or equivalent).
- RESOLVED (2026-09-19): visual style — owner directive: create missing assets; default = emoji/simple canvas shapes (⛄🛒🕳️).
- RESOLVED (2026-09-19): "label.md" — non-blocking per owner directive. If owner later pastes its contents, fold any new requirements into Define then.
- **ACTIVE (2026-09-19):** Refactor UI from ephemeral buttons to persistent central keypad with contextual illumination.

## Turn/Stage Ledger
| Date | Stage | What happened |
|---|---|---|
| 2026-09-19 | DEFINE | Owner gave game instructions + v3.png (text-only): extendable/angle-adjustable line, tap-to-release snowman coal cart, momentum downhill, draw-ahead track, auto-scroll right, 100 pts per page, black-hole fail spin. Captured into Define; build request logged in backlog (held per Define phase). |
| 2026-09-19 | DEFINE | Owner re-sent the same instructions (context re-sync) and mentioned a "label.md" file exists. Supplied WSL command to locate all MD files from root (`sudo find / -type f -iname "*.md" 2>/dev/null`). Awaiting label.md contents to fold into Define; no code written (Define phase). |
| 2026-09-19 | DEFINE | Owner directive: "if you are missing any assets simply create them." Resolved visual-style question (default emoji/simple canvas shapes) and marked label.md non-blocking. Define section complete; no code written — awaiting explicit build go-ahead to write wsl.html. |
| 2026-09-19 | DEFINE | Owner re-sent plan + asset directive (re-sync); confirmed directive already captured and Define is complete. No code written — build remains held until owner says "build it". |
| 2026-09-19 | BUILD | Built wsl.html: multi-track engine, catch-air 360 flips (1000 pts), rollback line-switching, rescue boost with cyan track spawn, progress failsafe (deadpool detection), on-screen Rescue/Flip buttons. |
| 2026-09-19 | REFINE | User feedback: buttons flash/disappear too fast to use. Decision: replace ephemeral buttons with persistent central "opaque keypad" (outline-only when inactive, lights up when contextual actions available). Added UI/Control Scheme refinement to Define section. |
</plan>