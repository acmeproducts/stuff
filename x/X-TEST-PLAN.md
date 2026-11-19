# X — test plan

Version 1.0.0 · 2026-11-18 · Answers to `X-REQUIREMENTS.md` · Rules from `claude-audit.md` B4, C5, C6, D2, A6, E2

## 1. Three kinds of proof
| Kind | What it is | Who | Counts as |
|---|---|---|---|
| **Lab check** | automated, run on every build; synthetic or recorded input | the build | lab-only. Never "done" by itself. |
| **Device gate** | the owner's definition of working for a release, used on his own devices | the owner; the build reads the logs itself | passed or failed |
| **Measurement run** | a timed session that produces numbers | the owner wears and uses; the build computes | a fact with its date and sample size |

## 2. Devices
| Device | Used for | Proof possible |
|---|---|---|
| Galaxy Watch 9 (SM-L355U), left wrist | watch source | device gate |
| Galaxy S23 Ultra, Chrome | X and the Lab on the phone | device gate |
| Tablet (used for installs and the Lab) | Lab, camera probe | device gate |
| iPhone, its browser | X, camera probe | device gate |
| Desktop browser | X on a desktop | **lab only**: the owner has no desktop. Run in a desktop-sized browser by the build and reported as lab-only. |

## 3. Suites
| Suite | File | Covers | Today |
|---|---|---|---|
| Detector | `x/wrist/test/DetectorTest.java` | tilt and swing on synthetic traces | 16/16 |
| Relay, live | `x/wrist/relay/e2e.mjs` | every relay route against the deployed worker, including sleep, buzz, pairing, reports, `/x`, `/signals.js` and the X log line | 37/37 |
| Lab page | `x/wrist/relay/page-test.py` | the Lab in a phone-sized browser with a synthetic watch, including Watch off, results, camera probe (synthetic points), buzz, pairing, the stream staying on between cards, the quiet-watch warning | 77/77 |
| Signals engine | `x/wrist/relay/signals-check.js` | the shared script alone: hand, head and watch numbers; learning a pose or a move from three showings; firing once; going further than taught; collisions; words in order and in time; one signal, one action | 42/42 |
| New Lab cards | `x/wrist/relay/signals-page-test.py` (with `synth.js`, a made-up hand and head) | Hand numbers, Head and face, Teach, Assign and combine, Object in your hands, in a phone-sized browser; the object task done with no touch; depth the right way round; a flickering pinch held; the record saved while the card is open | 72/72 |
| Arbiter | new with S5 | every rule type, no rule, absent against silent | — |
| X page | `x/wrist/relay/x-test.py` | the nine steps driven by spoken sentences, with the model, GitHub and the browser's speech stood in for by the test | 50/50 |
| Scoring | new with L2 | hit and wrong-fire arithmetic on a synthetic session with known answers | — |

Paths moved to `x/wrist/` at W1 step 0 (2026-11-18).

## 4. Rules
1. **The owner's definition of working is written as checks before the work starts.** Each plan's release carries it.
2. **Failing first.** A new check is seen to fail on the current build before the change is made.
3. **The whole suite runs before every push**, not only the new checks. Results are reported truthfully, including failures.
4. **Recorded trials are test material.** `out/trials/` holds the owner's real raw rows; new recognisers are replayed against them.
5. **A recorded model reply exists only in tests.** The product path always calls the real model. No test double ships.
6. **A suspicious failure is run against the previous build** before it is called a regression or noise.
7. **A log channel counts only after data has arrived through it.**
8. **Lab-only results are labelled lab-only.** Desktop results always are.

## 5. Measurements and their targets
Targets are mine (D20) and are corrected by evidence.

| Measurement | How | Target | Release |
|---|---|---|---|
| Hand time | X's meter: minutes, touches, touch seconds per session | at most 5 touches in 30 minutes, none forced by X | X1 on |
| Hit rate | scored session: fired within 3 s of an ask | 9 in 10 | L2 |
| Wrong fires | scored session: fired with no ask | at most 1 in 10 minutes | L2 |
| Next-day hit rate | scored session a day after teaching, watch re-worn | 9 in 10 | V4 |
| Watch battery | percent an hour, by link, from session summaries | at most 10% an hour | W2 |
| Longest silence | longest gap between delivered messages in a 30-minute screen-off session | under 10 s | W2 |
| Sleep delay | from Watch off to the watch's last message | under 5 s | W1 |
| Camera frame rate | frames a second with the hand finder; with both finders | 15 or more on the S23 | S1, S3 |
| Reading delay | from end of speech to first spoken word, known word and unknown ask | recorded first; target set from X1's numbers | X1 |
| Sync | a word kept on one device is known on another | within a minute | X1 |
| Arbiter delay | added wait when two sources fire | 250 ms | S5 |

## 6. What each release must show
The device gate for each release is written in its plan. In short:

| Release | Lab checks added | Device gate in | Measurement |
|---|---|---|---|
| W1 | relay sleep word; page Watch off; last-logged; pairing (code works once, guesses limited, a secret is required after) | `plans/W-watch.md` | sleep delay |
| L1 | relay sessions and snapshots; both tables | `plans/L-lab.md` | — |
| X1 | X page suite | `plans/X-x.md` | hand time; reading delay |
| S1 | probe card on a recorded clip | `plans/S-sources-arbiter.md` | camera frame rate |
| S2, S3, V1, V3, V5, L3 (built together, 2026-11-18 evening) | signals engine; new Lab cards | their plans | frames a second with both finders; task time; touches |
| V6 | recorder, reader (stood in for), replayer | `plans/V-vocabulary-teach.md` | time for the reading to come back |
| W2 | summary arithmetic | `plans/W-watch.md` | battery; longest silence |
| L2 | scoring suite | `plans/L-lab.md` | hit rate; wrong fires |
| V4 | context separation; next-day scoring | `plans/V-vocabulary-teach.md` | next-day hit rate |
| S4, S5 | one event shape; arbiter suite | `plans/S-sources-arbiter.md` | arbiter delay |
| X2, X3 | lists; threads | `plans/X-x.md` | hand time over 30 minutes |
| W3, W4 | page against watch on the same recordings; buzz word | `plans/W-watch.md` | battery again |

## 7. Reporting
Every release report says, in this order: what passed on the device, what failed, what is lab-only, what is unverified. The numbers go into the plan and into `X-TRACE.md` in the same commit as the change.

## 8. What the lab cannot show (2026-11-18, evening)
The hand and face models cannot be downloaded where the build runs. Every check of the new cards uses a made-up hand and head (`synth.js`) fed in where the finders' results would arrive. So the lab proves the arithmetic, the teaching, the recognising and the cards. It does not prove that a real hand or face produces numbers like the made-up ones. That is the owner's run, and it is the first thing the build reads afterwards.
