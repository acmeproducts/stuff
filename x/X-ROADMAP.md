# X — development roadmap (top authority for everything under `x/`)

Version 1.2.0 · 2026-11-19 · Owner and device gate: Confi

This is the one place that says where we are, where we are going and how we get there. It points to five plans. Each plan has releases; each release has a build sequence, checks and a device gate. The picture of this file is `pipeline.html`.

## 1. Where we are (2026-11-18, evening)
**Changed this evening (facts)**
- X's first pass failed on the owner's devices and is parked. He set a new order: more hand and head cases, actions assigned to them, teaching "basic then complex … like letters make up words", then teaching by showing, and a 3D object handled by the hands (`X-NORTH-STAR.md` §2).
- Built the same evening, lab only until he runs it: Lab `lab-r7` with five new cards (Hand numbers, Head and face, Teach a signal, Assign and combine, Object in your hands), the shared signals script, relay `w6`.
- Proven on his devices earlier in the day: the hand finder runs on the tablet at 13 to 17 frames a second; the watch pairs by itself, buzzes on request and sleeps when X ends. Failed: the watch goes silent for one to two and a half minutes at a time with the screen off.

**What follows is the record as of the morning.**

**Built and proven on the owner's watch (facts)**
- Watch app `turn06-b6` reads wrist motion with the screen off and sends it out. Nothing is read on the watch. (`turn07-b8`, relay `w5`, Lab `lab-r6` and X `x-r2` were built on 2026-11-18 and are lab-only until the owner runs them.)
- Relay `w3` carries watch events to any browser page and keeps logs and trial recordings the build can read.
- Lab `lab-r5`: 13 concept cards, recordings, notes, Keep / Back to shop / Dump.
- Builds and installs need no IDE.

**Measured (facts, from `x/wrist/out/trials/` and the device log)**
- Wi-Fi: 35 to 49 readings a second, 50 to 57 ms round trip, few stalls. Bluetooth alone: 26 to 32 a second, 128 to 154 ms, many stalls. Nothing failed outright on Bluetooth.
- The owner's poses read cleanly (thumb up, thumb down, palm up). The forearm-angle pose fired 11 times at 47° to 54°.
- Three collisions: thumb up against dial choose; flap drags the dial; the forearm pose overlaps raise.
- With "Allow background activity" on: 13 minutes with no gap over 10 seconds. Battery 86% to 84% in those 13 minutes.
- Swing fired once in about 50 minutes.

**Known from the owner's other pages (facts, read from their code)**
- Model calls go straight from the page with his keys, three providers, a key test and a fallback. Web search is a switch on the same call.
- chat-test listens with turn-taking. prism, market-navigator and devstream read aloud. devstream matches eight spoken commands before any model is called.

**Not known**
- Battery cost of a session per hour. How each signal behaves while X is actually in use. Hand time. Whether a taught signal lasts a day. Whether the camera finders run well on the S23. Anything about X itself: none of it is built.

## 2. Where we are going
**X 1.0 is a learning system that walks.** In the owner's terms: born, with a vocabulary that has started to grow, doing the practical things with hands at rest.

X 1.0 is reached when gate 6 passes:
1. A whole 30-minute session on the phone with at most 5 touches after it starts. The same session scripted on a desktop browser in the lab (the owner has no desktop; that part is lab-only).
2. X learned at least five words from the owner in ordinary use and uses them without a reading step.
3. A list (a feed, pictures or music) is moved through by taught signals.
4. A long piece of research runs while something else is in front, and X announces it.
5. It works with the watch, and it works without it.
6. Opening X starts the watch; closing X stops it; the battery cost per hour is known.
7. What X learned on the S23 is there on the iPhone, and the build has read it.

After 1.0 comes the run stage: sentences and contexts, making and analysing, and last, acting for the owner.

## 3. How we get there
### 3.1 One pipe, six gates
| Gate | Name | Passes when | Stage |
|---|---|---|---|
| 1 | Foundation | wrist motion reaches a browser page and the logs come back to the build | **passed 2026-11-17/18** |
| 2 | Session | opening X starts the watch, closing X stops it, it cannot stop by accident | crawl |
| 3 | X is born | X does something it was taught or shown, by a signal or a word of the owner's, without asking a model; what it learned is kept and synced; hand time is reported. *(Reworded 2026-11-18, evening, after the voice page failed this gate as first written: "all nine steps work by voice". My rewording; the owner may strike it.)* | crawl ends |
| 4 | Proven signals | each candidate signal, from watch or camera, has a hit rate and a wrong-fire rate from scored use | walk |
| 5 | Your language | the owner's taught signals steer X through the arbiter, and still work the next day | walk |
| 6 | X walks | lists and threads work; the six points of X 1.0 hold | walk ends = **X 1.0** |

### 3.2 Five plans, eleven streams
| Plan | File | Streams it carries | Feeds gates |
|---|---|---|---|
| **W** Watch | `plans/W-watch.md` | watch input; watch session | 1, 2, 4 |
| **L** Lab | `plans/L-lab.md` | Lab and evidence; continuous control | 4, 6 |
| **S** Sources and arbiter | `plans/S-sources-arbiter.md` | camera hand and head; the arbiter | 4, 5 |
| **V** Vocabulary and teaching | `plans/V-vocabulary-teach.md` | teach; vocabulary and registration | 4, 5 |
| **X** X itself | `plans/X-x.md` | voice; learning (the nine steps); lists and threads | 3, 6 |

### 3.3 Releases
A release is the smallest whole thing that can be used and judged. Status: built / in build / next / later.

| Release | Delivers | Needs first | Gate | Stage | Status |
|---|---|---|---|---|---|
| **W1** Session | still panel; sleep from the page; sleep by itself; "logged at"; hardened pairing; buzz from the page; code moved to `x/wrist/` | — | 2 | crawl | **on the watch 2026-11-18: off-from-X, pairing and buzz passed; silent for one to two and a half minutes at a time with the screen off (failed)** |
| **L1** Results table | what the watch reported and each signal's record, in a table | W1 (shares the relay change) | 4 | crawl | **built, lab only; awaiting the owner** |
| **X1** Born | the X page: listen, the nine steps, five commands by voice, words kept on the device and synced to GitHub, hand time | W1 for the watch's session; works without it | 3 | crawl | **device gate FAILED 2026-11-18**: about 30 s an ask, nothing learned that X can do by itself; see `plans/X-x.md` |
| **S1** Camera probe | camera opens, hand found or lost, frames a second, on each device | — | 4 | crawl | **works on the owner's tablet (13 to 17 frames a second, found 94%); S23 and iPhone not yet measured** |
| **S2** Hand numbers | each hand as live numbers: curl, thumb to fingertip, palm facing, roll, place, nearness | S1 | 4 | crawl | **built in `lab-r7`, lab only; awaiting the owner** |
| **S3** Head and face | nod, turn, lean, blink, jaw, brows, smile as live numbers; both finders together | S1 | 4 | crawl | **built, lab only; the face finder has never run on a device** |
| **V1** Teach | show it three times, say its name, collision warning; one card for the right hand, left hand, head and watch (V2 folded in) | S2, S3 | 4 | crawl | **built, lab only** |
| **V3** Assign | one action for each signal, one signal for each action; kept on the device | V1 | 5 | crawl | **built in the Lab, lab only; contexts and X not yet** |
| **V5** Words | signals made one after another become a signal with its own action | V1 | 5 | crawl | **built, lab only** |
| **L3** 3D object | a cup, a bowl and a toy car taken, carried, turned and resized by one hand or both; a timed task; actions from signals | S2 | 6 | crawl | **built, lab only** |
| **V6** Habits (was "Showing") | X learns from what it is used for, then does it unasked, keeps and indexes what came back, and says what matters. Not a replay (R62) | X7 passed on the owner's phone | 3 | walk | **on hold 2026-11-22**, not built |
| **X7** X returns | streamed answers; the record of every ask and result; "different since last time"; the record can be asked; taught signals steer X | A1, A3; the speed probe | 3 | crawl | **on hold 2026-11-22**, not built |
| W2 Battery truth | percent an hour by link, from real sessions; 30-minute freeze check; Wi-Fi-only run | W1, L1 | 2 | walk | later |
| L2 Scored session | prompted and unprompted scoring: hit rate and wrong fires per signal | V1 | 4 | walk | later |
| S4 One event shape | every source reports the same shape, with presence | V1, V2 | 5 | walk | later |
| S5 Arbiter | rules as data per context; winner shown and logged | S4, V3 | 5 | walk | later |
| V4 Next-day test | taught yesterday, scored today | V3, L2 | 5 | walk | later |
| X2 Lists | a word brings many items; more, back, glide | X1, V3 | 6 | walk | later |
| X3 Threads | several at once; announce the ready; library | X1 | 6 | walk | later |
| W3 Recognition on the watch | the watch sends results, not raw rows (**needs the owner's yes: C1**) | W2, V1 | 6 | walk | later |
| W4 Buzz language | which buzzes the owner can tell apart and what each means (carrier and Lab card built in W1) | W1 | 6 | walk | later |
| X4 Sentences and contexts | words combine; contexts with their own signals and rules; context inferred | X 1.0 | — | run | later |
| X5 Makes and analyses | analysis on frozen evidence; building by voice; objects and games | X 1.0, L3 | — | run | later |
| X6 Acts for you | finding and buying, with an explicit yes | X5 | — | run | later |

### 3.4 Order of work
**Round 3 is on hold (2026-11-22, later).** The owner: "something missing … ultimately I'm trying to use Lab gestures to use a smartphone to exist in the modern world". The round below is centred on asking and looking up. Nothing in it is built or to be built until the centre is defined with him. No next build is scheduled.

*As planned earlier the same day:* Round 3, planned on the owner's "go" to plan.
| Stage | Release | What | Requirements | State |
|---|---|---|---|---|
| 1 | **X7** step 1: speed probe | on his phone: seconds to X's first words, and how many sources, for each of his AI services | R66 | planned |
| 2 | **X7** X returns | streamed answers; every ask and result kept, catalogued and indexed; "different since last time"; the record can be asked; taught signals steer X | R63 to R66, R70, R72 | planned; stops if the probe fails |
| 3 | **V6** Habits | what he keeps coming back to becomes standing by itself; X checks it unasked and says what matters; what he drops fades | R67 to R69, R71 | planned; after X7 passes on his phone |

**Proposed rewording (A4), his to strike:** gate 3, *X is born*: "X tells the owner something he did not ask for in that session, because he keeps coming back to it, and says what changed. What X kept is on both phones. Hand time is reported." X 1.0, point 2: "X has picked up at least five things the owner keeps coming back to, with nothing set up, and brings them unasked."

**Round 2, agreed with the owner 2026-11-19 ("go"). Each stage goes live for him to try before the next.**
| Stage | Release | What | Requirements | State |
|---|---|---|---|---|
| 1 | **L4** Fixes from the first real run | depth the right way round and gentler; a pinch that flickers is still a pinch; records saved as you go; the watch's stream stays on between cards; a warning naming both watch settings when the watch goes quiet | R44, R51, R56 | **built in `lab-r8`, lab only** |
| 2 | **L5** Tabs, **V7** Calibrate | dashboard, learn, camera, watch (voice arrives with stage 5); calibration of each hand, the head and the eyes to the person; blink left, right, both | R49, R50, R54, R55 | **built in `lab-r9`, lab only** |
| 2b | **L8** Watch cards from his notes | roll to scroll; swing at any angle; sensitivity; the watch in Calibrate | R57 to R61 | **built in `lab-r10`, lab only** |
| 3 | **L6** Hands and things | hands in the scene; hand to hand; several objects and goals; putty | R45 to R48 | **built in `lab-r11`, lab only** |
| 4 | **L7** Journey | a spoken choose-your-path story steered by the head | R53 | **built in `lab-r11`, lab only** |
| 5 | **S6** Voice | turns, interruptions, hot word and cold word; "start listening" and "stop listening" as actions | R52 | **built in `lab-r12`, lab only** |

V6 was to follow this round as "showing" on the object card. Withdrawn 2026-11-22: that was a macro recorder, which is not what the owner meant (R62). What comes next is to be agreed with him. No watch build is in this round.

*What follows is the order as of 2026-11-18, evening, kept as the record.*
**From 2026-11-18, evening (the owner's order):**
1. The owner runs the five new Lab cards. The build reads his trials and fixes what the real hand and head show that the made-up ones did not.
2. ~~**V6 Showing**, on the object card.~~ Withdrawn 2026-11-22 (wrong reading; see R62).
3. Then S4 and S5 (one event shape, the arbiter), because words and shown runs make more than one thing fire at once.
4. The X page comes back when there is something taught for it to do. W2 (battery, the silent watch) runs alongside whenever the watch is on.

*The order below is the morning's, kept as the record.*

**Crawl, now, three tracks side by side** (the owner's call, 2026-11-18: the watch change first, Lab use cases and a first pass at X in parallel):
1. **W1**, then L1 on the same relay change.
2. **X1**, starting with its checks and its page, joined to W1's session when W1 passes.
3. **S1**, then V1: the next Lab use cases.

Walk and run follow the table. One release is in build per plan at a time.

## 4. How a release is built (the same sequence every time)
1. **Write the owner's definition of working** for the release, in his words, as checks. (`claude-audit.md` B4)
2. **Write the failing checks first** and see them fail on the current build. (C5)
3. **One change at a time**, smallest that passes, in the existing code's style. (C7)
4. **Run every lab check** for the whole project, not only the new ones. (D2)
5. **Deploy where the owner tests** and give one link. (D3)
6. **Device gate:** the owner uses it. The build reads the logs itself. (A5, E1)
7. **Record in the same commit:** plan ledger, numbers before and after, graveyard entries for anything removed. (D1)
8. **Honest status:** passed, failed, unverified, lab-only. Never done because a lab check is green. (A6)

A release is done when its device gate passes and its rows in `X-TRACE.md` show the evidence.

## 5. Change control
- **Requirements** change only by the owner's word; the change is quoted in `X-NORTH-STAR.md` or `X-REQUIREMENTS.md` with its date.
- **Design decisions** (D-numbers) are mine; the owner may strike any. A struck decision goes to the graveyard.
- **Architecture** (A-numbers, and the C-list in `X-DESIGN.md` §3) changes only with the owner's explicit yes after vetting: what, why, the principle, the evidence, what it replaces, how to undo it.
- **Graveyard:** `x/wrist/WRIST-GRAVEYARD.md` stays the single graveyard for all of `x/`. Nothing in it returns without the owner's approval.

## 6. Ledger
| Date | Entry | Status |
|---|---|---|
| 2026-11-16 to 2026-11-18 | Watch, relay and Lab, turn01 to turn06 | recorded in `x/wrist/WRIST-PLAN.md` §0 |
| 2026-11-18 | Five-thread roadmap (WRIST-PLAN §14) | rejected by the owner as "incredibly light"; replaced by this file |
| 2026-11-18 | Roadmap built around one talk-to-gateway loop | rejected by the owner (graveyard G18) |
| 2026-11-18 | Single pipeline page | drafted; owner corrected the reach (X is not a hub; AI) and the frame (a learning system, floor not blueprint) |
| 2026-11-18 | Owner's research from another session: camera hand and head sources, the arbiter | recorded in `plans/S-sources-arbiter.md` |
| 2026-11-18 | This roadmap, the five plans and their artifacts | written; nothing built from it yet |
| 2026-11-18 | Owner's correction to X's first pass | Venice is the primary service; setup follows the three floor pages (a key and a kept model per service, a default switch); no Deepgram, the browser's own listening. Built as `x-r2`. Buried: G26, G27. |
| 2026-11-18 | Owner's corrections the same day | "The loop" renamed the order of operations and stated to run wholly in the page (no gateway, not OpenClaw). Memory: on the device and synced with GitHub, so X learns "both in operation and in function" (D13, D21, R37); memory on the relay withdrawn. Pairing hardened in W1 (D22): "why wouldn't we just do that". Recognition on the watch explained; still awaits his yes (C1). |
| 2026-11-18 (evening) | Owner's verdict on X's first pass: "a voice front end to AI … cosplay with AI … latency is ridiculous". My next proposal (X fetches two fixed things) refused: "that's building connectors again". | X1 parked as failed. G28. |
| 2026-11-18 (evening) | Owner's new order: more hand and head cases; actions assigned to poses and movements; teach basic then complex "like letters make up words"; then "monkey see monkey do with some AI assisted interpretation of outcomes"; a 3D object handled by one hand or both. | Recorded: north star §2, requirements R38 to R43, decisions D23 to D30. |
| 2026-11-18 (evening) | Built: `signals.lib.js`, Lab `lab-r7` (five new cards), relay `w6`. Lab checks: engine 42/42, new cards 70/70, older Lab 73/73, relay 37/37, X page 50/50. | **Lab only.** The made-up hand and head stand in for the finders; the models cannot run in the build's sandbox. No device has run any of it. |
| 2026-11-19 | Owner's first run of the new cards (phone). Facts: hand finder 21 to 45 frames a second, face finder 32 to 35; object card 59 pinch takes, 14 dropped within 0.4 s, 32 against the walls, no two-handed hold, task never finished; nods and tilts read, blink "can't get … very correct". | Recorded in plans L and S. Gates for S2, S3, L3 not passed; V1, V3, V5 not yet run. |
| 2026-11-19 | Watch silence: my theory (the background switch was reset) was **wrong**. The switch was on; Wrist was on the watch's Sleeping apps list. After he removed it: three minutes with the screen off, largest gap 3.3 s. | Both settings required (R56). Plan W. |
| 2026-11-19 | Owner set Round 2: tabs; camera with only a camera; depth reversed; hand to hand; hands in the scene; several objects and goals; putty; a journey by head; voice turns, interruptions, hot and cold word; "focus more on calibration and interpretation and learning"; "keep blink left right both". He said "don't code yet", read the scope, overrode one call, then "go". | R44 to R56, D31 to D38, §3.4. |
| 2026-11-19 | Stage 1 built: Lab `lab-r8`. Lab checks: engine 42, new cards 72, older Lab 77, relay 37, X page 50. | **Lab only.** |
| 2026-11-19 | Stage 2 built: Lab `lab-r9`: four tabs and Calibrate. Lab checks: engine 65, new cards 90, older Lab 84, relay 37, X page 50. | **Lab only.** Two calls put to the owner: the Voice tab is not shown until it has something in it; the watch is left out of Calibrate until a card uses a rest position. |
| 2026-11-19 | Owner ran `lab-r9`: calibrated his right hand and head; rated and wrote notes on the watch cards; then "please complete the entire body of development". | R57 to R61, P26, D42 to D46, G29. Plan L (L8). |
| 2026-11-19 | Stages 3 and 4 built: Lab `lab-r11`, relay `w10`. Hands and things (hands in the scene, hand to hand, six goals, putty) replaces the object card; Journey added. Lab checks: engine 74, new cards 120, older Lab 89, relay 37, X page 50. | **Lab only.** No real hand or head has run them. D47 to D51. |
| 2026-11-19 | Stage 5 built: Lab `lab-r12`, relay `w11`. A fifth tab, Voice: Take turns, Interrupt, Hot word and cold word. Voice is a source in Teach; "start listening" and "stop listening" are actions. Lab checks: engine 93, new cards 163, older Lab 89, relay 37, X page 50. Round 2 is built. | **Lab only.** The recogniser in the checks is made up; no real voice has run it. D52 to D56. One call put to the owner: D56. |
| 2026-11-22 | The owner corrected what "monkey see, monkey do" means: not a run recorded and replayed ("a glorified macro"), but X learning from what he keeps using it for, then doing it unasked, consuming, cataloguing and indexing the result and giving the insight. | V6 as planned is withdrawn; D29 withdrawn; G30. P21 and P22 reworded, P27 and R62 added. Nothing had been built. V6 is to be planned with him. |
| 2026-11-22 | Owner: "go" (to plan X's return with the record built in). Planned: X7 (plan X, section 8) and V6 Habits (plan V). Vetted against the 18 Nov failure, the standing rules and what is on the market. | **Planned, not built.** R63 to R72, D57 to D63 (proposed), TH9 to TH12. Four things are put to him to authorise (A1 to A4). The first build step is a speed probe on his phone. |
| 2026-11-22 (later) | Owner, on that plan: "I still think there's something missing … the repetitive things is just a substitute for not having to look things up … I'm trying to use Lab gestures to use a smartphone to exist in the modern world … like when iPad first came out … it just became a Citrix client … maybe it's just a command bar with 4 chips … maybe it's a room metaphor … go and do". | X7 and V6 on hold; A1 to A4 withdrawn. North star 1.5.0: his words, "not a Citrix client", P28 and P29 (the build's, his to strike). The definition is open and is his; no build is scheduled. |
| 2026-11-22 (evening) | Owner asked for a Lab card: strum virtual strings by camera with the left, the right and a third hand; a larger camera picture; first in the Camera tab. Built as L9 in Lab `lab-r13`, relay `w12`. Lab checks: engine 93, new cards 182, older Lab 89, relay 37, X page 50. | **Lab only.** R73, D64, D65 (four chords and a sound for each hand are the build's additions, his to strike). No real hand has played it. |
