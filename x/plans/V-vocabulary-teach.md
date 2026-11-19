# Plan V — vocabulary and teaching

Version 1.1.0 · 2026-11-18 (evening) · Part of `x/X-ROADMAP.md` · Earlier record: `x/wrist/WRIST-PLAN.md` §13, §14.3

## 1. Purpose
This is where X becomes a learning system on the body's side. The person teaches signals from their own body and says what each one means. Two streams: **teach** and **vocabulary and registration**.

Owner, 2026-11-18:
> "there's going to be a finite number of commands that X is expecting, why not let the user register them so that they can do it to suit their particular needs. Maybe somebody is more comfortable only using wrist rolls with the forearm parallel to the floor, or it could be that the forearm is something that's excluded altogether depending on what gestures are registered."

> "we don't really need to measure for the motion … it's really just measuring the angle of the forearm, so this does sort of open up other potential gestures: a forearm at 90°, palm facing not necessarily open, a forearm flat on a table … this particular lab card should not be for the okay sign."

## 2. State
| | |
|---|---|
| Built (2026-11-18, evening; lab only) | Teach, Assign and Words, in the Lab (`lab-r7`), on the shared script `signals.lib.js`. One Teach card serves the right hand, the left hand, the head and the watch. No device has run it. |
| Before that | Nothing as a teach function. The forearm-pose card was tuned by hand from the owner's four holds (36°, 38°, 40°, 42°), and the next day's eleven firings read 47° to 54°. Fact: a range taken from the person's own body worked. Theory: the difference between the two days is drift in how the pose is made or how the watch sits. |
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

### V1 — Teach (crawl) · built 2026-11-18 (evening), lab only
*Added in `lab-r12`:* Voice is a fifth source. A word is taught by saying it three times after a tone; it is saved under what was heard, with no naming step, and is listened for in the Voice tab (D52).
Owner: "I want to teach and have it learn commands and gestures, basic then complex".

**What was built.** The card **Teach a signal**. Pick what you will use (right hand, left hand, head and face, watch). Press Teach. It says REST, then NOW three times with BACK TO REST between, on the screen and aloud. From the three showings it decides: held is a **pose**, out-and-back is a **move** (D24). It says what it saw in a sentence, warns if it looks like a signal already taught, listens for the name, and saves on one tap. Taught signals are listed and light each time one fires. They are kept on the device.

V2 (teach by camera) is folded into this release: the same card, the same list.

**Lab checks.** `signals-check.js` 42/42 (the engine alone). `signals-page-test.py`: a fist, a nod and a watch pose taught and fired; the same thing taught twice flagged; showing nothing refused; the name taken by voice.

**Owed against the first plan (stated, not hidden).**
- The recorded forearm trials were not replayed through it. They have no rest-and-show structure to learn from. The owner's first Teach run with the watch gives the same evidence.
- The OK card is still in the Lab. Nothing is removed on a lab-only result; it goes when Teach passes on a device.
- Each signal costs two taps (Teach, Save). No typing.

**Device gate:** the owner teaches three signals of his own choosing, at least one with a hand and one with his head, in under a minute each, with no help; each fires when he makes it; the card warns him if two collide.

**What the build reads afterwards:** each Teach trial in `x/wrist/out/trials/` (what was learned, which numbers, what fired); frames a second with the face finder running.

### V3 — Assign (crawl) · built in the Lab 2026-11-18 (evening), lab only
Owner: "I also want to assign actions to specific hand and head movement and poses".

**What was built.** The card **Assign and combine**: each taught signal has a list of actions; one signal has one action and one action has one signal (D26). "Buzz the watch" works there and then; the object actions work on the object card; the X actions wait for X.
**Not built:** contexts (a signal meaning different things in different places), saying a change aloud, and steering X.
**Device gate:** the owner gives actions to three of his signals and sees each fire its action; he gives one action to a second signal and sees it leave the first.

### V5 — Words (crawl) · built 2026-11-18 (evening), lab only
Owner: "by combining actions like letters make up words".

**What was built.** On the same card: pick two or three signals in the order they will be made, name the result, add. The word is a signal with its own action (D27). It fires when its letters are made in order, each within 2.5 seconds of the one before; not in the other order; not when too long passes.
**Known limit:** when a word fires, its last letter's own action has already happened. Deciding between them is the arbiter's job (plan S, S5).
**Device gate:** the owner makes one word from two of his signals and it fires when he means it, three times out of three, and not when he makes the two the other way round.

### V6 — Showing (walk) · next
Owner: "I think it's more of a monkey see monkey do with some AI assisted interpretation of outcomes. This opens up the range of things significantly".

**Question:** can X learn a whole run by watching it once?

**Scope.** On the object card first (D29).
1. Two new actions: **watch me** and **that's it**. Given to signals like any other.
2. Between them X keeps the run: each signal that fired and what it did, each take and let go, and the object's state at the start and at the end (which object, where, which way it faces, upright or lying, how big).
3. On "that's it", one model call (the owner's default AI service; no web search) is given the start, the end and the ordered list, and returns one sentence saying what the run achieved, a short name, and the end state as conditions the page can check.
4. X says the sentence. The owner says yes, or says what it was instead. He names it, or takes X's name.
5. The run is saved as a signal of a new kind, **run**. It can be given a signal or a word.
6. Making that signal does the run on whatever object is there, then checks the end conditions and says whether it got there.

**Build sequence**
| Step | What | Check |
|---|---|---|
| 1 | Failing checks: a made-up run is recorded with the right steps and states; the reader's reply (stood in for by the test) becomes a saved run; replay reaches the same end state on a different object; a replay that misses says so | fail on `lab-r7` |
| 2 | Recorder in `signals.lib.js` | checks pass |
| 3 | Reader: one call, the three services X's setup already holds | reply time logged |
| 4 | Replayer and the end-state check | checks pass |
| 5 | Card additions | page checks pass |
| 6 | Device gate | below |

**Device gate:** the owner shows X one run on the cup. X says back what it was for in a sentence he accepts. One signal then does it on the bowl. No touch. The reading comes back in under 5 seconds (my target; measured, to be corrected by evidence).

**After the object card:** the same recorder on other things X can see the outcome of. Which thing comes next is decided when this gate has passed, from what the owner then asks for.

### V7 — Calibrate (crawl) · built 2026-11-19 in `lab-r9`, lab only
Owner, 2026-11-19: "we could focus more on calibration and interpretation and learning".

**Scope.** In the Learn tab, ahead of Teach. About a minute per source; the person shows their own range and everything that reads that source uses it.
| Source | What is learned |
|---|---|
| Hand | how the pinch reads open and closed; how big the hand looks near and far |
| Head | where it rests; how far it turns, nods and leans in comfort |
| Eyes | how each eye reads open and closed; blink left, right and both become three signals, each needing a hold longer than a natural blink |
| Watch | the rest position |

**What was built.** The card **Calibrate**, first in the Learn tab. Each flow asks for a few positions on the screen and aloud, two or three seconds each, then says what it learned in the person's own numbers.
- **Each hand** (about 17 s): open, pinch, open, pinch, push toward the screen, pull back. The object card then uses their pinch (closed below a third of the way from their closed reading to their open one, open above six tenths) and their reach (their whole comfortable reach carries an object across the whole table).
- **Head** (about 19 s): rest, left, right, up, down. Head numbers and taught head signals are then measured from where the head rests, and "looking left, right, up, down" is told by their own range. Which way the numbers run is learned, not assumed.
- **Eyes** (about 16 s; a tone says when to open): open, both closed, left closed, right closed. Each eye then reads 0 (their open) to 1 (their closed), named for their own left and right whichever way the camera names them. Three signals are made, **blink left, blink right, blink both**, each needing 0.4 s, longer than a natural blink. Someone who cannot close one eye alone gets blink both only.
- The numbers learned go into the record (numbers only), so the build can read them.

**The watch** (added in `lab-r10`, about 15 s): forearm on the desk, raised, rolled one way, rolled the other. See D45.

**First device run (owner's phone, 2026-11-19, 11:20 UTC).** Right hand: pinch reads 0.435 closed and 1.041 open; near 0.262, far 0.173 (reach ×1.5). The build's fixed "closed below 0.30" was below his closed reading, which is why his grip dropped in the first object run. Head: rests at nod −17°, turn −5°; turns 27° left and 31° right; up reads −16, down +15. Eyes, left hand and watch: not yet calibrated. He has not yet run the object card with the calibration.

**Lab checks.** `signals-check.js` 65 (23 of them calibration). `signals-page-test.py`: a made-up person whose pinch never quite closes cannot take the cup before calibrating and can after; reach, head rest, eye naming the other way round, the three blinks, a natural blink firing nothing.

**Theory, to be shown by the card:** the person's own eye values plus the longer hold make blink reliable. His first run found blink "can't get … very correct" with the build's fixed scale.

**Gate:** after calibrating, the owner takes and holds the cup ten times with no drop he did not mean; a deliberate blink of each eye fires, and two minutes of ordinary blinking fires nothing.

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
| Showing becomes another prompt to an AI | the AI is called once, to read an outcome; the doing is the person's own run, replayed |
| A real hand does not look like the made-up hand the lab checks use | the owner's first run; every trial keeps the numbers that were learned |
