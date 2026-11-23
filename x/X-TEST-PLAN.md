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
| Lab page | `x/wrist/relay/page-test.py` | the Lab in a phone-sized browser with a synthetic watch, including Watch off, results, camera probe (synthetic points), buzz, pairing, tabs, the watch link held only while needed, the quiet-watch warning, roll to scroll and swing v3 with the arm at rest as the owner's rests | 89/89 |
| Signals engine | `x/wrist/relay/signals-check.js` | the shared script alone: hand, head and watch numbers; learning a pose or a move from three showings; firing once; going further than taught; collisions; words in order and in time; one signal, one action; calibration of hand, head, eyes and watch; the three blinks; hand size unmoved by turning the hand; words taught by voice, fired once for a phrase; the ears opened, reopened and refused | 93/93 |
| New Lab cards | `x/wrist/relay/signals-page-test.py` (with `synth.js`, a made-up hand and head) | Hand numbers, Head and face, Teach, Assign and combine, Hands and things, Journey, in a phone-sized browser; all six goals done with no touch (hand to hand, stacking, putty); depth the right way round and unmoved by turning the hand; a flickering pinch held; the journey played to its end by looks alone; the record saved while the card is open; tabs; the dashboard; Calibrate (with the watch) and what it changes; the Voice tab: a hot word and a cold word taught and used, a gesture starting the listening with the microphone off until then, turns, cutting in, and that no record holds what was said; Strum: six strings plucked in order by a fingertip, a trembling fingertip not plucking twice, chords by place, three hands told apart and playing at once | 182/182 |
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
| X7 | X page suite, rewritten: streaming and first words; the record and its index; "different since last time"; record questions with no model call; signals steering X; no words in the log | `plans/X-x.md` §8 | seconds to first words; sources per answer |
| V6 | habits suite on a made-up record with made-up days: noticing, rhythm, rounds, the cap, unchanged against changed, fading, the count of unasked calls | `plans/V-vocabulary-teach.md` | unasked calls a week; how often "unchanged" was right |
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

**Added 2026-11-19 (`lab-r11`).** The made-up hand is steady, is found in every frame and never leaves the picture by accident; the made-up head turns exactly as far as it is told. So the lab cannot show whether real hands can stack three blocks or pull putty, whether a real pinch lands on a small thing at depth, or whether half of a real head's range is the right place to count a look. Those are for the device.

**Added 2026-11-19 (`lab-r12`).** The speech recogniser and the page's voice are made up in the checks: the checks say what the recogniser "heard" and when the page's speech ends. So the lab cannot show how a real voice is recognised, how much of its own speech the phone hears, or what the phone does each time the recogniser is reopened.

**Added 2026-11-22 (`lab-r13`).** Strum's hands are made up and its sound is not listened to: the checks read which string was plucked, how hard and at what pitch, and that the sound system is running. So the lab cannot show whether three real hands are found at a usable rate, what it sounds like, or how long after a pluck the sound comes.
