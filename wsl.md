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

**UI/Control Scheme (REFINED 2026-09-20):**
- **Always-visible Controls**: Two distinct on-screen buttons persist at all times (never hidden, never dimmed to invisibility). Position: bottom-left (RESCUE) and bottom-right (360° FLIP) for two-thumb ergonomics, or centered if preferred by user.
- **Visual Affordance**: Buttons show clear text labels ("RESCUE", "360°") not just icons; bright opaque backgrounds (Rescue: cyan/teal; Flip: gold/orange) so they read as clickable immediately.
- **Contextual State**: If an action is unavailable (e.g., Flip already used, not in air), the button shows "ghosted" styling (lower opacity or grayscale) but remains visible so the player learns the layout.
- **Interaction**: Tap Rescue to trigger air-rescue boost and spawn cyan landing line. Tap Flip to trigger 360° spin for bonus points. No double-tap, no swipe gestures required.
- **Drawing Surface**: Canvas occupies full screen behind controls; drawing uses touch points that fall outside button bounding boxes (pointer-target detection excludes UI layer).

**Users:** Casual mobile players; short sessions; one-thumb/two-thumb play.

**Outcomes / success criteria:**
- Runs as one self-contained HTML file on a phone browser, no build step, no external dependencies.
- Touch-first controls (extend line, change angle, tap-to-release, draw ahead) feel immediate.
- Momentum is readable: steeper downhill = faster; speed loss on flat/uphill.
- Clear per-page score feedback (+100) and a satisfying black-hole game-over.
- All diagnostics surfaced in the app itself, never console-only.
- Controls are **always visible**; user never hunts for UI.

**Asset decision (owner directive 2026-09-19):** If any assets are missing, create them — do not block on missing material. Default visual style: emoji + simple canvas shapes (⛄ snowman, coal cart, 🕳️ black hole). v3.png visual specifics will be interpreted freely; owner can restyle later.

**Source material:** image attachment v3.png was provided but this engine is text-only — per the asset decision above, visuals are interpreted with emoji/simple canvas shapes without further confirmation.

## Backlog
- BUILD REQUEST (2026-09-20): implement always-visible Rescue and Flip buttons per refined UI spec; ensure pinch/wheel zoom remains functional; remove "keypad" opacity state management; keep camera, physics, and progress failsafe from previous iteration. Project is currently in DEFINE; build on owner's "build it".
- RESOLVED (2026-09-19): visual style — owner directive: create missing assets; default = emoji/simple canvas shapes (⛄🛒🕳️).
- RESOLVED (2026-09-19): "label.md" — non-blocking per owner directive.
- PENDING (2026-09-20): Control placement decision — bottom corners vs centered; awaiting owner preference or proceed with bottom-left/right split.

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