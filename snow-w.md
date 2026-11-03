# Snow-W — plan and record

Owner request (2026-11-03): "This needs to be optimized for a watch and have a new name snow-w.html. I want it designed from the ground up to work on a Galaxy 9 watch." Earlier: "In order for this to run on a watch it cannot scroll up and down while you're playing."

`snow-w.html` is a separate, single-file game (28 KB, no network, no libraries). `wsl.html` is unchanged by it.

## Assumptions (please correct)
- "Galaxy 9 watch" = a Galaxy Watch with a **round** touch display of about 1.3–1.5 inches, roughly 200–240 CSS px across (432–480 physical pixels at 2×). The game adapts to anything from 160 to 480 px, so a different size still works.
- It is opened as a web page in a Wear OS web view or browser. No bezel, crown, microphone or second finger is relied on.
- I had no real watch. Everything below was tested on emulated 192, 216, 240, 260×300, 288 and 450 px touch screens.

## Design decisions (from the ground up)
| Watch constraint | What Snow-W does |
|---|---|
| Round screen clips corners | One round dial (diameter = the short side of the screen). All text, dots, dialogs and buttons sit inside the circle. |
| Must not scroll while playing | Page is locked (fixed, no overflow, no overscroll, no zoom). The view never scrolls up or down; it only follows the cart sideways. Only the menu scrolls, and only while paused. |
| Tiny screen, fat finger | One finger only (a second finger is ignored). Every button is at least 36 px. Cart is about 9.5% of the dial. Catch and tap tolerances are sized to the dial. |
| Almost no room for HUD | Score at the top (tap it for the menu), three dots for rescues, a big ×N while flipping. Nothing else. |
| Battery | 30 frames a second at most; nothing is redrawn while paused; sound is **off** by default; auto-pause when the screen turns off or the app loses focus; a few stars and flakes only. |
| No keyboard, little attention | Menu is the only settings screen: Mode (Regular/Zen), Feel (Slow/Std/Fast), Sound, Buzz, Rider (6), New run, Best. Settings are kept on the watch. |
| Wrist feedback | Short vibration for ride start, jump, each flip (longer with the multiplier), explosion and restart (on by default, switchable). |

## Game rules (same family as wsl.html, simplified)
- Draw with one finger; tap the track to ride; tap to jump (it flips); hold still to draw a rescue line.
- Flips: every full flip in one flight scores +100 × a rising multiplier (×1 … ×5), shown on screen; resets on landing.
- An uncaught cart explodes in the last 10% of the dial (faint red band), and so does a cart that rides a track off the bottom (the view cannot follow it). An explosion pauses with a message, costs one rescue (3 at the start) and **OK** puts the cart back on its track. With none left the run ends.
- Score = pages (+100 per screen travelled) + flips + distance in inches + survival seconds × 10. Best is kept.
- Zen: no explosions, unlimited rescue, gentle return to the track.
- Pausing is free here (no score penalty, unlike wsl.html) because a wrist-down auto-pause would otherwise punish the player. Menu = pause.
- Left out on purpose: replay and sharing, pinch zoom, custom sounds, character grid, tuning slider, flow score (all too heavy for a watch screen).

## Tests (`wsl-tests/snow-w.mjs`, all passing)
Six screen sizes: round dial fits the short side; the page cannot scroll; no network requests; HUD inside the circle; view never scrolls (ride, jump, fall); cart 7–14% of the dial; flips and ×N multiplier scoring; one finger draws, a second finger is ignored; tap-to-ride; explosion message fits the circle, rescue 3→2, OK restarts, no rescues → run over → game over → New run; menu (pause) freezes the game and its buttons are ≥ 34 px and reachable; settings persist across reload; auto-pause when the page is hidden; Zen never explodes; frame rate 20–35 fps; nothing drawn while the menu is open; buzz on a jump and none when switched off; sound engine not even started while sound is off; same pace (dial-widths per second) on 192, 240 and 450 px dials; resizing keeps the cart on the dial; best score saved and kept.

## Not verified / next
- A real Galaxy Watch (touch feel, emoji fonts in the rider choices, vibration support, how the page is launched). If emoji riders do not render, the snowman (drawn in code, no font needed) is the default.
- Round-screen corner clipping was checked by geometry, not by eye on a real display.
- No sound has been listened to (sound is off by default).
