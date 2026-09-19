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

**Users:** casual mobile players; short sessions; one-thumb/touch play.

**Outcomes / success criteria:**
- Runs as one self-contained HTML file on a phone browser, no build step, no external dependencies.
- Touch-first controls (extend line, change angle, tap-to-release, draw ahead) feel immediate.
- Momentum is readable: steeper downhill = faster; speed loss on flat/uphill.
- Clear per-page score feedback (+100) and a satisfying black-hole game-over.
- All diagnostics surfaced in the app itself, never console-only.

**Source material:** image attachment v3.png was provided but this engine is text-only — visual specifics (exact snowman/cart/black-hole look) need owner confirmation or will be interpreted with emoji/simple canvas shapes.

## Backlog
- BUILD REQUEST (2026-09-19): implement the game above into wsl.html. HELD — project is in Define; build on owner's go-ahead.
- Confirm visual style with owner (v3.png was text-only here): emoji (⛄🛒🕳️) vs drawn canvas art.
- Owner earlier referenced "label.md" — unresolved; check if it contains requirements to fold in.

## Turn/Stage Ledger
| Date | Stage | What happened |
|---|---|---|
| 2026-09-19 | DEFINE | Owner gave game instructions + v3.png (text-only): extendable/angle-adjustable line, tap-to-release snowman coal cart, momentum downhill, draw-ahead track, auto-scroll right, 100 pts per page, black-hole fail spin. Captured into Define; build request logged in backlog (held per Define phase). |