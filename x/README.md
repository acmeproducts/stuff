# X

> "the human talks and minimal taps or swipes X and X talks to everything else."

X is a learning system you raise, so that a phone can be used with hands at rest. This folder is its home: everything about where it is, where it is going and how it gets there.

## Read in this order
| File | What it is |
|---|---|
| `X-NORTH-STAR.md` | The owner's own words and the 19 principles drawn from them. Everything answers to it. |
| `X-CONCEPT.md` | What X is and does: the nine-step loop, the vocabulary, floor to ceiling. The analysis. |
| `X-REQUIREMENTS.md` | User stories, use cases, 36 requirements. |
| `X-DESIGN.md` | Standing architecture, design decisions, logical and physical design, and the changes that need the owner's yes. |
| `X-ROADMAP.md` | **Top authority.** Where we are, where we are going, six gates, five plans, every release in order. |
| `plans/W-watch.md` | The watch: session, battery, recognition on the watch, buzz. |
| `plans/L-lab.md` | The Lab: results table, scored session, 3D object. |
| `plans/S-sources-arbiter.md` | Camera hand and head, and the arbiter. |
| `plans/V-vocabulary-teach.md` | Commands, teaching signals, registration, the next-day test. |
| `plans/X-x.md` | X itself: born, lists, threads, and the run stage. |
| `X-TEST-PLAN.md` | Kinds of proof, suites, measurements and targets. |
| `X-TRACE.md` | Every requirement traced to decision, release, proof and status. |
| `pipeline.html` | The picture: one pipe, six gates, eleven streams. |

History and code:
| Where | What |
|---|---|
| `wrist/WRIST-PLAN.md` | The record of turn01 to turn06 and every measurement so far. |
| `wrist/WRIST-GRAVEYARD.md` | The single graveyard for all of X. Nothing in it returns without the owner's approval. |
| `wrist/` | Watch app, relay and Lab. Moves to `x/wrist/` as step 0 of release W1. |

## Where things stand (2026-11-18)
- **Gate 1 of 6 passed.** Watch to relay to browser works on the owner's watch.
- **Nothing of X is built.** 3 of 36 requirements are met, 6 in part.
- **Next, side by side:** W1 (the watch sleeps from X), X1 (X is born), S1 (camera probe), with L1 and V1 behind them.

## Live
| Thing | Where |
|---|---|
| Watch file `turn06-b6` | `https://github.com/acmeproducts/stuff/raw/wrist-turn01/wrist/out/wrist.apk` |
| Lab `lab-r5` | `https://wrist-relay.myacctfortracking.workers.dev/` |
| X | not built |

## For any session working here
1. Read `claude-audit.md` at the repository root, then this folder's roadmap.
2. Branch `wrist-turn01`. Paths: `x/`, `wrist/` and the three `wrist-*.yml` workflows. Nothing else.
3. No architecture change without the owner's explicit yes (`X-DESIGN.md` §1 and §3).
4. Every release follows `X-ROADMAP.md` §4, and its record ships in the same commit.
