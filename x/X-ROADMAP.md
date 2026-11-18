# X — development roadmap (top authority for everything under `x/`)

Version 1.0.0 · 2026-11-18 · Owner and device gate: Confi

This is the one place that says where we are, where we are going and how we get there. It points to five plans. Each plan has releases; each release has a build sequence, checks and a device gate. The picture of this file is `pipeline.html`.

## 1. Where we are (2026-11-18)
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
| 3 | X is born | all nine steps work by voice: ask, answer, verdict, learn; what it learns is kept and synced; hand time is reported | crawl ends |
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
| **V1** Teach on the watch | do it three times, name it, collision check; replaces the OK card | L1 | 4 | crawl | later |
| W2 Battery truth | percent an hour by link, from real sessions; 30-minute freeze check; Wi-Fi-only run | W1, L1 | 2 | walk | later |
| L2 Scored session | prompted and unprompted scoring: hit rate and wrong fires per signal | V1 | 4 | walk | later |
| S2 Hand numbers | live curl, facing and roll from the hand finder | S1 | 4 | walk | later |
| S3 Head probe | face found, nod, shake, tilt numbers; both finders together | S1 | 4 | walk | later |
| V2 Teach by camera | hand and head templates, same teach card | S2, S3, V1 | 4 | walk | later |
| S4 One event shape | every source reports the same shape, with presence | V1, V2 | 5 | walk | later |
| V3 Registration | signal to command, per context, one-to-one | S4, X1 | 5 | walk | later |
| S5 Arbiter | rules as data per context; winner shown and logged | S4, V3 | 5 | walk | later |
| V4 Next-day test | taught yesterday, scored today | V3, L2 | 5 | walk | later |
| L3 3D object | take, turn, let go of one object by signal; a timed task | V3 | 6 | walk | later |
| X2 Lists | a word brings many items; more, back, glide | X1, V3 | 6 | walk | later |
| X3 Threads | several at once; announce the ready; library | X1 | 6 | walk | later |
| W3 Recognition on the watch | the watch sends results, not raw rows (**needs the owner's yes: C1**) | W2, V1 | 6 | walk | later |
| W4 Buzz language | which buzzes the owner can tell apart and what each means (carrier and Lab card built in W1) | W1 | 6 | walk | later |
| X4 Sentences and contexts | words combine; contexts with their own signals and rules; context inferred | X 1.0 | — | run | later |
| X5 Makes and analyses | analysis on frozen evidence; building by voice; objects and games | X 1.0, L3 | — | run | later |
| X6 Acts for you | finding and buying, with an explicit yes | X5 | — | run | later |

### 3.4 Order of work
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
