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
| Built | S1 camera probe: runs on the owner's tablet (fact, 2026-11-18). S2 hand numbers and S3 head and face: built in `lab-r7` (2026-11-18, evening), lab only. The arbiter: not built. |
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

### S2 — Hand numbers (crawl) · built 2026-11-18 (evening), lab only
Owner: "I want more lab cases for the hand and head recognition".

**What was built.** The card **Hand numbers**: a table for the right hand and the left, updated live: curl of each finger, thumb to index and to middle, which way the palm faces, roll, place in the picture, nearness; with frames a second. The numbers are made so that moving the hand about the picture does not change the shape numbers (lab check).
**Fact from Google's guide (read 2026-11-18):** Left and Right are the person's own hands when the picture is not mirrored; the page gives the finder the unmirrored picture. **Not yet seen on a device.**
**Device gate:** the owner holds five different hand shapes and tells them apart by the numbers; his left hand shows under Left.

**Measured on the owner's phone, 2026-11-20, `lab-r12`, finder asked for two hands (fact).** With no hand in view: 17 to 19 ms a picture. With one hand: 39 to 41 ms. With two: 35 to 44 ms. Pictures looked at each second: about 37 to 41 with no hand, 24 with one, 23 to 25 with two. Face alone (Journey): 25 ms, 36 a second. Reading: searching for a hand costs about 17 ms and reading one about 22; while fewer hands are in view than were asked for, both are paid on every picture.

### S3 — Head and face (crawl) · built 2026-11-18 (evening), lab only
**What was built.** The card **Head and face**: nod, turn and lean in degrees; blink of each eye, jaw, brows, smile, pucker from 0 to 1; a button that runs the hand finder at the same time and shows what that costs in frames a second.
**Never run on a device.** The face model could not be downloaded in the build's sandbox; the card was checked with a made-up head. Which way each number goes when the owner nods or turns is not known until he runs it; teaching does not depend on it, because a taught signal learns its direction from what is shown.
**Gate:** TH6 answered with a number (frames a second with both finders on the tablet and on the S23). The numbers move when he nods, turns, raises his brows.

**First device run of S2 and S3 (owner's phone, 2026-11-19).** Facts: the hand finder was ready in 1.3 s and ran at 21 to 45 frames a second; the face finder was ready in 1.6 s and ran at 32 to 35. Owner: "it reads the face and shows things like nods and tilts; it really can't get eye blinking very correct". Blink stays (his call) and goes to calibration (plan V, V7). Whether his left hand shows under Left is not yet reported.

### S6 — Voice as a source (walk) · built 2026-11-19 in `lab-r12`, lab only
Owner, 2026-11-19: turns "that chat-test does", interruptions, "a hot word and a cold word to turn off and on listening".
- Turns: tones mark whose turn it is; the mic is ignored while the page speaks. It answers by saying back what it heard. No AI.
- Interruptions: cut in by voice or by a taught signal; the card counts the times the page wrongly interrupts itself.
- Hot word and cold word are taught voice signals given the actions "start listening" and "stop listening" (D38); a gesture can be given the same actions.

**What was built: a Voice tab with three cards**
| Card | What it does | What it counts |
|---|---|---|
| Take turns | You speak; falling tone; it says back what it heard; rising tone; your turn. The microphone is ignored while it speaks. The cold word stops it listening, the hot word brings it back. | turns; phrases ignored while it spoke |
| Interrupt | It reads a ten-sentence passage. Speak over it, or make a signal given "start listening", and it stops at once and listens; then goes on from the sentence it was in. | cut in by voice; cut in by signal; stopped for nothing; own voice ignored |
| Hot word, cold word | Starts not listening. The hot word opens it and what you say is taken down on the screen; the cold word shuts it. Two buttons teach the two words: say each three times. | opened; shut; phrases taken down; phrases let pass |

- A word is taught by saying it three times; it is listened for as the recogniser heard it (D52). Voice is also a source in Learn → Teach.
- In the camera context: give a taught gesture "start listening" in Assign. The Voice card then turns the camera on, and the microphone stays off until that gesture (D53).
- One signal per action still holds, so the gesture takes "start listening" from the word (D56).
- The record keeps counts and lengths, never what was said.

**Proven in the lab (fact):** with a made-up recogniser and a made-up voice, all of the above. Engine 93/93; the Voice checks are part of the new-cards suite.
**Known about the phone (fact, from the browser's documentation):** Chrome's recogniser sends the audio to Google's servers while it listens; on Chrome for Android it does not stay open across a pause, so the page reopens it after each phrase.
**Not proven (unverified):** everything about a real voice on the phone: how much of its own speech it hears through the speaker, whether the gap while the recogniser reopens loses the start of a phrase, whether the phone sounds its own tone each time the recogniser opens, how well a short hot word is recognised. Those are the experiment.

**First runs on the owner's phone, 2026-11-20 and 21, `lab-r12` (fact, from his trials; read by the build on 22 Nov).**
| Card | What happened | His verdict |
|---|---|---|
| Interrupt | 20 Nov: 6 cut-ins, 4 of them "stopped for nothing", 3 times its own voice recognised and ignored. 21 Nov: 2 cut-ins, both "stopped for nothing" | **Back to shop**, twice. "it's imagining that I'm cutting over it because I'm not even saying anything" |
| Take turns | two short runs, two turns each | none given |
| Hot word, cold word | three tries at teaching a word: two saved, one failed. Listening opened once and shut once | none given |

So TH (the page can tell its own voice from his) is **failed as built**: through the phone's speaker it hears itself and stops. The own-voice test by matching words is not enough. Not yet reworked.

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
