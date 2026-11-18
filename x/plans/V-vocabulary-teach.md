# Plan V — vocabulary and teaching

Version 1.0.0 · 2026-11-18 · Part of `x/X-ROADMAP.md` · Earlier record: `x/wrist/WRIST-PLAN.md` §13, §14.3

## 1. Purpose
This is where X becomes a learning system on the body's side. The person teaches signals from their own body and says what each one means. Two streams: **teach** and **vocabulary and registration**.

Owner, 2026-11-18:
> "there's going to be a finite number of commands that X is expecting, why not let the user register them so that they can do it to suit their particular needs. Maybe somebody is more comfortable only using wrist rolls with the forearm parallel to the floor, or it could be that the forearm is something that's excluded altogether depending on what gestures are registered."

> "we don't really need to measure for the motion … it's really just measuring the angle of the forearm, so this does sort of open up other potential gestures: a forearm at 90°, palm facing not necessarily open, a forearm flat on a table … this particular lab card should not be for the okay sign."

## 2. State
| | |
|---|---|
| Built | Nothing as a teach function. The forearm-pose card was tuned by hand from the owner's four holds (36°, 38°, 40°, 42°), and the next day's eleven firings read 47° to 54°. Fact: a range taken from the person's own body worked. Theory: the difference between the two days is drift in how the pose is made or how the watch sits. |
| Decided | Commands and words (`X-CONCEPT.md` §3). One signal, one meaning (owner). Templates, not trained models (D06). |
| Unknown | Whether three repetitions are enough. Whether a template holds after the watch is taken off and put back, or the next day (TH5). |

## 3. Serves
Stories US3, US4. Requirements R03, R06, R09, R10, R19. Decisions D02, D05, D06, D20.

## 4. Design notes
### 4.1 The commands X expects
| Age | Command | Meaning |
|---|---|---|
| Born | more | go on |
| | enough | stop this |
| | yes | keep it; go ahead |
| | no | not that; undo |
| | again | once more |
| Walks | back | the one before |
| | glide | keep moving while the posture is held |
| Runs | take, turn, let go | hold, rotate, release an object |

Every command can always be spoken. A signal is an addition the person chooses, never a requirement (P6). A person may register no signal at all for a command.

### 4.2 What a template is
A taught signal is a short list of numbers with the range the person's own body produced.
- **Held posture** (watch): forearm tilt, wrist roll, how still, how long held.
- **Motion** (watch): which number moves, how far, how fast, and that it returns.
- **Hand shape** (camera) and **head move** (camera): the numbers in plan S §5.

Teaching: do it or hold it three times. The card records about a second each time and keeps the average and the spread. Recognising: the body stays inside a template's range for a short hold (0.8 seconds, as the Lab's pose cards use), or a motion matches its profile.

### 4.3 Collisions
Before a template is saved it is compared with the person's others. If two overlap, the card says so and shows which number overlaps, so one can be changed. This is what Keepers does today for cards rated Keep; it becomes the check for a person's own set.

The three collisions already found (thumb up against dial choose, flap dragging the dial, the forearm pose against raise) are settled this way, by the person's own choice of which to keep, not by more hand-tuning.

### 4.4 Registration
A registration is a row: context, signal, command. The rules: one signal per command and one command per signal within a context. Different contexts may differ. Registrations and templates are kept on the device (D13) and can be said back, changed and removed by talking (R09).

## 5. Releases

### V1 — Teach on the watch (crawl)
**Scope:** a **Teach** card replaces the OK pose card. Hold or do something three times; the card shows the range it learned; the owner names it; the collision check runs; the signal joins Keepers and the Signals table. Works for held postures and for simple motions.

**Build sequence**
| Step | What | Check |
|---|---|---|
| 1 | Failing checks: three synthetic holds make a template with the right average and spread; a fourth hold inside the range fires; one outside does not; two overlapping templates are flagged | fail on the current Lab |
| 2 | Template maker and matcher as a recogniser with no screen attached | checks pass |
| 3 | Replay the owner's recorded forearm trials through it | it learns 36° to 42° from the first trial and reports that the next day's 47° to 54° readings fall outside that range |
| 4 | The Teach card | page checks pass |
| 5 | Device gate | below |

**Device gate:** the owner teaches three signals of his own choosing in under a minute each, with no help; each fires when he makes it; the card warns him if two collide.

### V2 — Teach by camera (walk)
**Scope:** the same card with the hand or the head as the source (needs S2, S3). A template taught by camera and one taught by watch sit in the same list.
**Gate:** the owner teaches one hand shape and one head move and each fires.

### V3 — Registration (walk)
**Scope:** the owner gives a taught signal a command, for a context he names. The one-to-one rule is enforced. In X, the registered signal now steers. He can ask X what is registered and change it by talking.
**Build sequence:** checks for the one-to-one rule and for context separation; the registration store; wiring through the arbiter into X.
**Gate:** the owner steers an X session (more, enough, yes, no, again) by his own signals with no spoken commands, then changes one registration by saying so.

### V4 — Next-day test (walk)
**Question:** TH5. Does a signal taught today work tomorrow?
**Scope:** a scored session (L2) the day after teaching, with the watch taken off and put back in between. If a template has drifted, the card offers to widen it from the new repetitions (keep, change, drop: the same verdicts).
**Gate:** each registered signal meets D20 on the second day, or is re-taught and meets it on the third.

## 6. Risks
| Risk | Held by |
|---|---|
| Templates stop matching from one day to the next, as the forearm readings suggest | V4 measures it; re-teaching is one verdict away |
| Teaching turns into a settings screen | the card has one job; everything else is said aloud |
| The command list grows without need | a command is added only when an age of X needs it, and is recorded in `X-CONCEPT.md` |
