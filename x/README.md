# X

> "the human talks and minimal taps or swipes X and X talks to everything else."

X is a learning system you raise, so that a phone can be used with hands at rest. This folder is its home: everything about where it is, where it is going and how it gets there.

## Read in this order
| File | What it is |
|---|---|
| `X-NORTH-STAR.md` | The owner's own words and the 26 principles drawn from them. Everything answers to it. |
| `X-CONCEPT.md` | What X is and does: the nine steps (the order of operations), the vocabulary, floor to ceiling. The analysis. |
| `X-REQUIREMENTS.md` | User stories, use cases, 72 requirements. |
| `X-DESIGN.md` | Standing architecture, design decisions, logical and physical design, and the changes that need the owner's yes. |
| `X-ROADMAP.md` | **Top authority.** Where we are, where we are going, six gates, five plans, every release in order. |
| `plans/W-watch.md` | The watch: session, battery, recognition on the watch, buzz. |
| `plans/L-lab.md` | The Lab: results table, scored session, the 3D object handled by the hands. |
| `plans/S-sources-arbiter.md` | Camera hand and head as numbers, and the arbiter. |
| `plans/V-vocabulary-teach.md` | Teaching: letters (signals), actions, words (combinations), then habits (learned from use; not yet planned). The next-day test. |
| `plans/X-x.md` | X itself. Its first pass failed on the owner's devices and is parked; the record is here. |
| `X-TEST-PLAN.md` | Kinds of proof, suites, measurements and targets. |
| `X-TRACE.md` | Every requirement traced to decision, release, proof and status. |
| `pipeline.html` | The picture: one pipe, six gates, eleven streams. |

History and code:
| Where | What |
|---|---|
| `x/wrist/WRIST-PLAN.md` | The record of turn01 to turn06 and every measurement so far. |
| `x/wrist/WRIST-GRAVEYARD.md` | The single graveyard for all of X. Nothing in it returns without the owner's approval. |
| `x/wrist/` | Watch app, relay and Lab. Moved here from the repository root on 2026-11-18 (W1 step 0). |

## Where things stand (2026-11-18)
- **Gate 1 of 6 passed.** Watch to relay to browser works on the owner's watch.
- **X's first pass is built and lab-only.** 2 of 37 requirements are met on the owner's devices, 7 in part. The watch change, the Lab update and X all await the owner's first run.
- **Next:** the owner's device gates for W1, L1, S1 and X1; then V1 (teach) and W2 (battery truth).

## Live
| Thing | Where |
|---|---|
| Watch file `turn07-b8` | `https://github.com/acmeproducts/stuff/raw/wrist-turn01/x/wrist/out/wrist.apk` |
| Lab `lab-r12` | `https://wrist-relay.myacctfortracking.workers.dev/` |
| X `x-r2` | `https://wrist-relay.myacctfortracking.workers.dev/x` |

## For any session working here
1. Read `claude-audit.md` at the repository root, then this folder's roadmap.
2. Branch `wrist-turn01`. Paths: `x/` and the three `wrist-*.yml` workflows. Nothing else.
3. No architecture change without the owner's explicit yes (`X-DESIGN.md` §1 and §3).
4. Every release follows `X-ROADMAP.md` §4, and its record ships in the same commit.

## The Lab's shared script (2026-11-18, evening)
| File in `x/wrist/relay/` | What |
|---|---|
| `signals.lib.js` | Served at `/signals.js`. Hand, head and watch as numbers; teaching a signal from three showings; recognising; words; actions. Shared by the Lab now and X later. |
| `synth.js` | Lab checks only: a made-up hand and head. Not served. |
| `signals-check.js` | Checks of the script alone (`node signals-check.js`). |
| `signals-page-test.py` | Checks of the five new Lab cards in a phone-sized browser. |
