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

## 6. Risks
| Risk | Held by |
|---|---|
| The Lab grows into a product of its own | every card must name the gate it feeds; a card that feeds none is dumped |
| Scores flatter the signals because asks are predictable | asks come at random times in random order |
