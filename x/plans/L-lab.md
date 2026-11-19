# Plan L — the Lab

Version 1.0.0 · 2026-11-18 · Part of `x/X-ROADMAP.md` · History before this date: `x/wrist/WRIST-PLAN.md` §3b, §9, §12

## 1. Purpose
The Lab is the proving area. It answers one question for every signal from every source: **is it good enough to steer X?** It is a workshop for the interaction model, not app navigation and not the product (P19). Two streams: **Lab and evidence**, and **continuous control**.

Owner, 2026-11-17:
> "a proving area where multiple concepts are trialed and logged … a grid that once you tap it it becomes active and full screen … double tap it and the card flips over and you can add notes … keep or go back to the shop and refine or dump."

## 2. State
| | |
|---|---|
| Built | `lab-r7`, 21 cards (2026-11-18, evening): the 16 of `lab-r6` plus Hand numbers, Head and face, Teach a signal, Assign and combine, Object in your hands. Before that: `lab-r5`, 13 cards: keepers, see, poses, flap, dial, tilt1, tilt2, swing1, swing2, raise, link, body, ok. Each card records every raw row, every firing, every touch, the verdict and notes on one clock. Recognisers have no screen attached, so the same code runs in a card and in Keepers. |
| Measured | Connection runs (roadmap §1). Pose angles. 11 firings of the forearm pose at 47° to 54°. |
| Missing | No table of results. No score per signal. Every run so far was a deliberate gesture: nothing shows how a signal behaves while the owner talks, reads and moves as he would with X. |

## 3. Serves
Stories US3, US10. Requirements R03, R04, R32, R35, R36. Decisions D05, D06, D20.

## 4. Design notes
- A signal is scored two ways. **Hit rate:** when asked to make it, how often did it fire in time. **Wrong fires:** how often did it fire when not asked. Both are measured while the owner is doing what he does in X (talking, listening, shifting), because the watch is off outside a session.
- The Lab's verdicts (Keep, Back to shop, Dump) are the same three X uses to learn. The Lab is where that idea was first proven.
- The Lab hosts the camera cards of plan S and the teach card of plan V. They are Lab cards so that their trials are recorded the same way.

## 5. Releases

### L1 — Results table (crawl, next, with W1)
Owner, 2026-11-18:
> "the watch should be able to be used to look at a table of results, so this really goes back to what's being logged and how are we organizing it so that we can retrieve it."

**Scope**
1. The relay keeps, per watch, its panel snapshots and one summary per session (start, end, link, battery at each end, longest silence, sent and failed, how it ended). Retrievable by the page; codes stay masked in the shared log.
2. A **Results** card with two tables:
   - **Watch:** the sessions and snapshots above, newest first.
   - **Signals:** for each concept, trials, firings, firings the owner marked "I meant that", verdict, last used.
3. Each table can be read aloud a row at a time, so it can be checked without touching.

**Build sequence**
| Step | What | Check |
|---|---|---|
| 1 | Failing checks: relay returns a watch's sessions and snapshots; page renders both tables from recorded data | fail on `w4`, `lab-r6` |
| 2 | Relay: keep and return snapshots and session summaries | relay checks pass |
| 3 | Lab: Results card | page checks pass |
| 4 | Fill the Signals table from the trials already recorded in `out/trials/` | the 11 forearm firings and the connection runs appear |
| 5 | Device gate | below |

**Device gate:** after a W1 session, the owner opens Results and sees that session, how it ended, and its battery at both ends; and the Signals table shows his past trials.

**Built 2026-11-18 in `lab-r6`, lab only so far.** The Results card shows watch sessions (start, minutes, link, battery at both ends, percent an hour once a session passes ten minutes, longest silence, how it ended), the last panel snapshot, and the Signals table read from every saved trial. Read aloud speaks the newest rows. Sessions are recorded from relay `w4` on; earlier runs are in the trials only.

**Owner's trials, 2026-11-18 12:17 to 13:15 UTC (`lab-r6`):** tilt v2 rated Back to shop ("No action observed"); flap rated Back to shop ("Fail, no movement detected even though [I] roll +/- 90 degrees"; it fired once in each of two trials); raise to talk rated Back to shop. These go to teaching (V1), where the range comes from the owner's own arm, not to more hand-tuning.

### L2 — Scored session (walk)
**Question:** what are each signal's hit rate and wrong-fire rate during X-like use?

**Scope:** a card that runs a ten-minute session. At random moments it asks, aloud and on screen, for one of the owner's kept or taught signals; between asks the owner reads a passage aloud and moves normally. A firing within three seconds of its ask is a hit. A firing with no ask is a wrong fire. The card needs no touch once started.

**Build sequence:** scoring arithmetic checked against a synthetic session with known answers; the card; one run per source; results into the Signals table.

**Gate:** every kept signal has both numbers in the table. Fit for X at 9 in 10 hits and at most 1 wrong fire in 10 minutes (D20).

### L3 — 3D object (walk)
Owner, 2026-11-18:
> "have a 3D shape, maybe it's a cup or a bowl or maybe it's a toy car, but just with the gestures being able to manipulate it would open up a whole language of being able to select, drag, drop, rotate left to right, rotate up and down, rotate diagonally … If you look at the explore mode of ui-v2.html there are some hints of this type of functionality, but I don't want that to be donor code, I want it to be inspiration."

Owner, 2026-11-18 (evening): "it is imperative to have a 3D model of objects that can be handled virtually by using the hands, either one or both".

**Question:** can the hands handle a thing on the screen, and can signals act on it?

**Built 2026-11-18 (evening), lab only.** The card **Object in your hands**.
- A cup, a bowl and a toy car on a table, each with a marked side (handle, bead, headlights).
- The hand is shown as in a mirror; a dot follows the thumb and first finger.
- One hand: pinch on the object to take it; it goes where the hand goes, turns as the hand turns, comes nearer as the hand does. Open the fingers and it settles on the table, upright if it was near enough upright.
- Both hands: pinch it with the second hand too. The two move it, turn it like a steering wheel, and make it bigger or smaller by moving apart or together.
- Signals: take, let go, turn left, turn right, tip toward me, tip away, bigger, smaller, next object, put it back. They work while it is held.
- The task: set it on the ring, upright, marked side to the right. Timed, and touches of the screen counted.

**ui-v2 explore mode, read for ideas only (2026-11-18, evening). No code taken.** Three ideas kept: choosing is two acts (bring it to the centre, then go in), which became take, then act; two points moved apart set the size, which became two hands; a field of many things with one in front, which is for lists (X2).

**Differs from the first scope (stated; override me if wrong).** Turning by the forearm through the watch is not built: the hand itself turns the object. The watch acts on it through taught signals.

**Lab checks.** `signals-page-test.py`, with made-up hands: take, carry, nearer, turn, let go, two hands, each signal action, the task done with no touch, the trial in the log.

**Not known until a device runs it:** whether a real pinch reads cleanly at 13 to 17 frames a second; whether the turning feels right or reversed; whether the left hand, which the owner calls fine but not dexterous, can pinch and hold comfortably. A pinch held is a posture, not a repeated motion (P1), but only his hands can say.

**Gate:** the owner finishes the task with one hand and no touch, then resizes and turns it with both; he says what felt natural and what did not.

**First device run (owner's phone, 2026-11-19 UTC, trial `20261119T072604-object-lyqp`; about 7 minutes of use). Gate not passed.**
| Fact | Evidence |
|---|---|
| A real pinch takes the object | 59 takes, all by pinch: 31 right hand, 28 left. 17 to 33 frames a second with a hand in view |
| The pinch reading flickers | 14 of 59 holds ended within 0.4 s, 23 within 1 s |
| Depth is wrong twice over | Owner: toward the screen brings it nearer, "it should be reversed". And 32 of 59 let-gos ended against the back wall (26) or the front (6): the scale is too strong for his reach |
| Two hands never held it | no two-handed take in the run; owner asks to pass it from hand to hand |
| The task was never finished | 1 of 59 let-gos landed near the ring; 17 ended lying on its side |
| The record arrived late | the card stayed open for 2 h 8 min; a trial is only sent when the card is closed |

Owner's requests from this run are in `X-NORTH-STAR.md` §2 (2026-11-19) and requirements R44 to R56.

### L4 — Fixes from the first real run (crawl) · built 2026-11-19 in `lab-r8`, lab only
| Change | Why (fact from his run) | Lab check |
|---|---|---|
| Hand toward the screen sends the object away; pulling back brings it nearer. Follows the ratio of how big the hand looks, strength 3 | "it should be reversed"; 32 of 59 let-gos jammed against a wall | object depth check |
| A pinch that reads open for less than 0.18 s is still a pinch | 14 of 59 holds dropped within 0.4 s | flicker check |
| The second hand can join whenever it pinches on the object | no two-handed hold in 59 takes | two-hand checks |
| Each take and let-go records how big the hand looked and how closed the pinch read | numbers for calibration (V7) | in the trial |
| A card's record is sent every 15 s, on hide, and at close; no watch code needed | his object record arrived two hours late | record-while-open check |
| The watch's stream stays on between cards and for two minutes after | "every single time I enter a card it has to wait for the stream" | stream checks |
| When the watch is silent 15 s after reporting its screen off, the status line names both settings | the Sleeping apps finding (plan W) | quiet-watch checks |

**Gate:** the owner carries the cup to the ring and sets it down, pushing and pulling in depth the way he expects; moving between watch cards does not wait; his record is in the repo without his closing the card.

### L8 — Watch cards reworked from the owner's notes (crawl) · built 2026-11-19 in `lab-r10`, lab only
**Facts from his run of `lab-r9` (2026-11-19, 11:46 to 12:14 UTC).**
| Card | His rating and words | What his recording shows |
|---|---|---|
| Tilt to scroll v1 | Dump, three times: "barely scrolls down never scrolls up … remove". Then Back to shop: "instead let's measure roll" | — |
| Tilt to scroll v2 | Back to shop: tilt "relative to desktop with elbow on desktop. Elevate is +"; "a slider to calibrate sensitivity" | His arm rested with the watch rolled to about −122°. v2 only worked within 35° of palm-down, so it was switched off for most of the run |
| Swing v1, v2 | Back to shop: "decent"; v2 "a bit better"; "tilt should not be a requirement"; the way back "may be confused with a full swipe" | v2 fired three times in 71 s |
| Flap | Back to shop: "complete washout" | — |
| Twist to pick; Buzz | Keep | — |

**What was built.** Roll to scroll (D42) and Swing to switch v3 (D43) replace the four cards. Each has a sensitivity slider (D44); Roll has Flip for the direction; Raise to talk has the slider too and measures from the desk once the watch is calibrated. The watch joins Calibrate (D45). The record no longer mislabels an event whose detail was also called "src".
**Left as it is, stated:** Flap. He gave no direction beyond "washout"; its rework is to teach it as a move in Learn. Override me if it should simply go.
**Gate:** with his arm resting as it does, the owner scrolls a list down and up by roll, stops it at will, and changes thread by swing with no false change on the way back.

### L5 — Tabs (walk) · built 2026-11-19 in `lab-r9`, lab only
Owner: "an overall dashboard and combine/learn tab, then a camera tab, a watch tab and a voice tab, so that we're not commingling everything".

**What was built.** One page, four tabs.
| Tab | Holds | Starts |
|---|---|---|
| Dashboard | what is on (camera, watch); what is calibrated to the owner, with his numbers; what has been taught, with its action; how the cards have been judged | nothing |
| Learn | Calibrate, Teach a signal, Assign and combine | the camera when a card needs it; the watch only when the watch is chosen or a taught watch signal exists |
| Camera | hand probe, Hand numbers, Head and face, Object in your hands | the camera only. No watch code is asked for; records are filed without one |
| Watch | link, results, the pose and motion cards, buzz, Keepers | the watch link and its stream, as soon as the tab opens |

- The watch code is asked for only in the Watch tab, with a "Not now".
- The page links to the relay the first time something needs the watch, and keeps that link for the visit, so the watch does not fall asleep while the owner is in another tab. A visit that only uses the camera never links; the dashboard then says the watch is not in use. The stream itself is on while the Watch tab is open and for two minutes after.
- **Not shown: the Voice tab.** It has nothing in it until stage 5, and an empty tab would be a stub. Override me if you want the tab visible now.

**Stated limit (told to the owner):** a connection, Wi-Fi or mobile data, is needed to open the page and to fetch the hand and face finders. After that the camera work runs on the device.

**Gate:** on a device that has never had the watch code, the owner opens the Camera tab and runs Hand numbers with nothing else connected; in the Watch tab he moves between cards with no wait.

### L6 — Hands and things (walk) · after L5
Hands in the scene as joints, bones and a palm; hand to hand; several objects with goals (cup on the ring, pass it, stack blocks, ball in the bowl, park the car); putty that stretches, squashes, flattens and reforms. No physics engine.

### L7 — Journey (walk) · after L6
A spoken choose-your-path story of about 15 places. Look left or right to turn, up or down for ladders; hold the look about a second. Hand-written, no AI.

## 6. Risks
| Risk | Held by |
|---|---|
| The Lab grows into a product of its own | every card must name the gate it feeds; a card that feeds none is dumped |
| Scores flatter the signals because asks are predictable | asks come at random times in random order |
