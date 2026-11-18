# Plan S — sources and the arbiter

Version 1.0.0 · 2026-11-18 · Part of `x/X-ROADMAP.md` · Earlier record: `x/wrist/WRIST-PLAN.md` §13

## 1. Purpose
X must not be wedded to the watch. This plan adds the camera as two more sources (the hand and the head) and builds the fourth node: the arbiter that decides whose word counts. Two streams: **camera hand and head**, and **the arbiter**.

Owner, 2026-11-18:
> "I don't want to be wedded to the watch … everybody's different and they're going to want to interact with X differently, and potentially even the same person interacting with X differently depending on context of time, activity or another differentiator."

The owner's four-node picture, 2026-11-18 (from his session on camera gestures):
> "I envision sort of a decision tree where [hand gestures read via camera] is the first node, and there's a parallel node to look at head gestures, nodding yes and no, flipping left and right. Then there's a third node that is all the things we're doing with the watch. But then they all point to, interconnected to, node number four, and this is where really the magic of X becomes apparent, because if you don't have your watch but you still want to use it, you can. You can decide or teach it that [in] certain context watch commands override anything else, head or hand, but in the absence of a watch command a hand command is accepted, or it could be that hand commands are exclusive. Again it has a lot to do with the context, and it could be available and fungible, so even though I did [a] task within context ABC as watch only, it could be made to be hybrid or hand exclusive."

## 2. The owner's contributed research (2026-11-18, recorded as given)
**The fourth node is the arbiter:** three sources read the body, and node four decides whose word counts in this context.

**Three rule types**
- **Override:** the watch wins whenever it speaks.
- **Fallback:** a hand command is accepted only when the watch is absent or silent.
- **Exclusive:** only one source is heard; the rest are ignored.

Making it fungible means the rule is stored as data per context, not built in. Changing context ABC from watch-only to hybrid is then an edit you teach, not a rebuild.

**What node four needs to work**
1. One event shape from every source: command, source, confidence, time.
2. Presence signals: watch connected, hand in view, face in view. Fallback only works if "absent" can be told apart from "silent".
3. A short decision window: when two sources fire together, the arbiter waits a beat before picking. The cost is a small delay.
4. Agreement versus conflict: two sources saying the same thing raises confidence; two saying different things goes to the rule.
5. A visible winner: X shows and logs which source was obeyed, or teaching becomes guesswork.

**Head node**
- Fact: Google's library has a face model that runs in the browser, and its output includes a matrix placing the detected face in space. Nod, shake and tilt can be read from how that changes.
- Advantage: the face is nearly always in frame when you look at the screen; the hand is not.
- Risk: people nod while listening. Head gestures need a hold or a context gate, and body signals are to be used sparingly.
- Theory (unproven): hand and face models run together on the S23 at a usable frame rate.

**Settled here by principle** (the research left it open; the owner asked for decisions, not questions):
- Where context comes from: **declared** by the person first; inferred at the run stage (D08).
- With no rule taught: the first source to fire wins, and agreement raises confidence (D07).

## 3. State
| | |
|---|---|
| Built | Nothing in this plan. The watch source exists (plan W). |
| Known (facts from Google's documentation, read 2026-11-18) | The hand finder is available on its own, returns 21 points per hand in picture form and in real-world form, and reuses the last position between frames. A page loads it from a script and one model file. On a Pixel 6 it takes 12 to 17 ms a frame. The stock gesture classifier knows seven gestures and a new one must be trained offline. |
| Decided by the owner | Rings are dropped. Doublepoint's kit is not adopted. No trained classifier: detect the hand, then teach. A plain web page, nothing installed. |
| Theory | It runs smoothly on the S23 and on an iPhone's browser. Taught hand templates hold across a day's changes in light, distance and angle. The camera is a good workshop and registration source and a tiring all-day one, because a raised hand tires and the camera costs battery. |

## 4. Serves
Stories US7, US8. Requirements R17, R18, R20, R21, R22, R23. Decisions A6, A8, D04, D07, D08, D11.

## 5. Design notes
- **Hand numbers** (chosen so they do not change when the hand moves around the frame or nearer the camera): how curled each finger is; how far the thumb tip is from each fingertip relative to palm size; which way the palm faces; how far the hand is rolled and where the fingers point; left or right hand.
- **Head numbers:** nod, shake and tilt angles from the face matrix, and how fast each is changing.
- **Frames never leave the device.** Only numbers and fired signals are logged.
- **The arbiter is one small module** used by the Lab and by X (D12). Its rules are rows of data: context, kind, source order.
- **Presence:** the watch is present while the relay has heard from it in the last 10 seconds; a hand or face is present while its finder reports one.
- Parked, not buried: earbuds with motion sensors; the phone's own tilt. Neither is planned.

## 6. Releases
The owner's five-stage camera outline from the other session maps onto S1, S2, V2 and S4.

### S1 — Camera probe (crawl, next)
**Question:** does the hand finder run on the owner's devices, and how do light and distance affect it?

**Scope:** a Lab card that opens the camera, draws the 21 points over the hand, and shows frames a second and "hand found / hand lost". Trials record frame rate, found-and-lost times, and the device. The camera asks permission once.

**Build sequence:** checks with a recorded clip fed to the card (points appear, found/lost changes); the card; runs by the owner on the S23, the tablet and the iPhone, in day and evening light.

**Gate:** a frame rate and a found-rate for each device in the results table. Below 15 frames a second on the S23, the camera source stops here and the plan says so.

**Built 2026-11-18 in `lab-r6` as the card "Camera: hand probe".**
- Fact (lab): the card opens the camera, loads Google's hand finder (version 1.2.0, pinned), draws 21 points and the links between them, shows found or lost, frames a second, percent of time found and milliseconds a frame, and records found and lost times and the rate in its trial. The picture is never recorded or sent.
- Fact (lab): the page's calls match the real library; this was run against a local copy of it.
- **Unverified:** the finder itself has not run here. The build machine cannot reach the address the model is downloaded from, so the first real run is on the owner's phone. If it fails the card says which part failed: the camera, the program, or the model.

**First real run, 2026-11-18 13:06 UTC, owner's tablet (trial `camera-8291`): the hand finder works.** Ready 4.5 s after the camera opened, on the graphics chip. 13 to 17 frames a second, 64 to 71 ms a frame. Hand found 94% of the time over 104 s, lost and found again four times. Owner rated it Keep, thumbs up. Fact: this is just under the 15 frames a second target, on the tablet. Not yet measured on the S23 or the iPhone.

### S2 — Hand numbers (walk)
**Scope:** a live strip of curl, facing and roll, like the Lab's tilt, roll and turn strip. Recorded with each trial.
**Gate:** the owner holds five different hand shapes and the strip tells them apart by eye.

### S3 — Head probe (walk)
**Scope:** face found or lost; nod, shake and tilt as live numbers; frame rate with the hand finder running at the same time.
**Gate:** TH6 answered with a number. A nod while listening and a deliberate held nod are recorded so the difference can be measured.

### S4 — One event shape (walk)
**Scope:** watch, hand, head and voice all report the same event (time, source, signal, command, confidence) and their presence. The Lab's See card shows all sources on one timeline.
**Build sequence:** checks that recorded events from each source parse to the one shape; adapters; timeline.
**Gate:** one recorded session shows events from at least three sources on one clock.

### S5 — The arbiter (walk)
**Scope:** the three rule types as data per context; the 250 ms window; agreement and conflict; the winner shown on screen and logged. An **Arbiter** card in the Lab where the owner sets a rule by saying it or picking it, fires two sources, and sees who won. The same module then runs in X.

**Build sequence**
| Step | What | Check |
|---|---|---|
| 1 | Failing checks: for each rule type and for no rule, a scripted pair of events yields the right winner; absent and silent are told apart | fail |
| 2 | The module | pass |
| 3 | The Arbiter card | page checks pass |
| 4 | Wire into X | X's checks pass with two synthetic sources |

**Gate (the owner's picture, as checks):**
1. With the watch on and a rule "watch overrides", a hand signal fired together with a watch signal loses.
2. With the watch off, the same hand signal is accepted.
3. Changing the context's rule to "hand only" takes one sentence and holds.
4. X shows which source it obeyed each time, and the log agrees.

## 7. Risks
| Risk | Held by |
|---|---|
| The camera makes the phone hot or drains it | S1 records battery and frame rate; a plain number decides |
| A nod while listening fires a command | S3 measures it; head signals need a hold; registration can leave the head out |
| Being watched feels wrong | the camera is never required (P6); frames stay on the device |

## 8. Sources (read in the owner's other session, 2026-11-18)
- [Hand Landmarker overview](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)
- [Hand Landmarker web guide](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)
- [Gesture Recognizer overview](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer)
- [Face Landmarker overview](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)
