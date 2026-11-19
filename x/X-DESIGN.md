# X — design

Version 1.0.0 · 2026-11-18 · Answers to `X-NORTH-STAR.md` and `X-REQUIREMENTS.md`

Three parts: the decisions, the logical design (what the pieces are), and the physical design (what they are made of and where they run). Every decision cites the principle it rests on (P-numbers from the north star).

## 1. Standing architecture (authorised by the owner, built, not to be changed without him)
| # | Decision | Owner's word |
|---|---|---|
| A1 | X is browser-based on phone and desktop. No app on the phone. | 2026-11-17, WRIST-PLAN §11.6 |
| A2 | The watch is a sensor only. Nothing is read on it. Screen off. | 2026-11-16 |
| A3 | Watch → relay → browser. The relay (one Cloudflare worker with one storage object) is the only path that reaches a browser on any device. | 2026-11-17 |
| A4 | The watch app is built by GitHub with plain SDK tools. No IDE, no Gradle. Installed with Bugjaeger while development is active. | 2026-11-16, 2026-11-17 |
| A5 | Samsung's Universal gestures are not used. Raw sensor level. | 2026-11-17 |
| A6 | Rings are dropped. Doublepoint's kit is not adopted; the owner's own watch app stays. | 2026-11-18 |
| A7 | X is not a hub. It leverages AI the way the owner's own pages do. X is not OpenClaw. | 2026-11-18 |
| A8 | Camera signals come from a plain web page with nothing installed. Detect the hand, then teach; no trained gesture classifier. | 2026-11-18 |

## 2. Design decisions (mine, by principle; the owner may strike any)
| # | Decision | Rests on | Why |
|---|---|---|---|
| D01 | Every exchange follows one order of nine steps (`X-CONCEPT.md` §2), all inside the page. AI appears only at read, gather and compose. | P3, P8 | The order of operations is the product. It is what makes a known word instant and keeps AI at the edge. |
| D02 | Vocabulary is two things: commands (finite, steer) and words (learned, grow). Five commands at birth, ten at full growth. | P3, P4, P5 | The smallest set that can steer one thing and teach. Each later command is added only when an age needs it. |
| D03 | Learning happens only through the three verdicts: keep, change, drop. X names what is kept. | P3, P11 | One way to learn is one thing to understand. Naming is X's burden. |
| D04 | Every source reports one event shape: time, source, signal, command, confidence. | P6, P12 | One shape lets any source be added or removed without touching the rest. From the owner's research. |
| D05 | Signals are named for what the body does. The person's registration maps a signal to a command, per context. | P5, P19 | Keeps sensing separate from meaning, as the owner directed on 2026-11-17. |
| D06 | A taught signal is a template: the average and the spread of a few measured numbers across three repetitions. No model is trained. | P5, P12 | Instant, personal, explainable. The same method on the watch and the camera. |
| D07 | The arbiter runs in the page. Its rules are data per context: override, fallback, exclusive. With no rule: the first source to fire wins and agreement raises confidence. It waits 250 ms when two sources fire together. | P6, P7 | The owner's four-node picture. In the page because that is where all sources meet. |
| D08 | Context is declared by the person (said aloud, attached to a thread). Inferring it from time or activity comes at the run stage. | P4, P7 | Declared context can be tested now. Inference before there is history would be a guess. |
| D09 | Model calls go straight from the page with the owner's own keys, exactly as prism, market-navigator and devstream set it up: three services (Venice.ai, OpenRouter, Anthropic direct), each with its own key, a Load models button and a model that is kept for that service; one switch for which service is the default, Venice unless changed. If the default fails, the next service that is set up answers. Web search is on for the call. Which service is the default and which model each uses travel with X's memory; keys never leave the browser. | P9, P12, A7 | Owner, 2026-11-18: "Venice is primary … three applications as part of our floor show how to load the models available and then persist that model for that provider, and also then a switch to govern which provider is the default." My first pass left Venice out; that was wrong and is buried (G27). |
| D10 | Listening uses the browser's own engine, in whatever language the browser is set to, restarted after each pause the way chat-test's browser listening is. Speaking uses the browser's own voice, in short parts, with what the microphone hears ignored while X speaks. | P2, P12 | Owner, 2026-11-18: "We don't need Deepgram for transcription, we're not trying to go multi-language right now, whatever your browser is set to is fine." Deepgram is buried (G26). |
| D11 | The camera sources use Google's hand finder and face finder in the page. Frames never leave the device. | A8, P12 | Off the shelf, no install, private. |
| D12 | X is one page served by the relay at `/x`. The Lab stays at `/`. Both share one sources-and-arbiter module. | A3, P12 | Same origin as the watch feed. The Lab and X then test and use the very same code. |
| D13 | X's memory (words, library, journal, signals, rules) lives on the device and syncs to GitHub from the page with the owner's own token: a list of events, each with a device id and a time, and an outbox for when the phone is offline. No secrets are written. It goes to a **private** repository, because `stuff` is public. | P20, P12 | The owner's direction, 2026-11-18. **Fact:** session-manager already keeps its source-of-truth file this way, and devstream and chat-test read and write the repo from the page. No new store, no new service. |
| D14 | The watch wakes by opening Wrist on the watch (one touch). It sleeps on a word from X, or by itself after three minutes with no page listening. A brush on its face never stops it; a one-second hold does. | P16, P1 | A sleeping watch cannot listen for X without spending battery. One touch at the start of a session is the cheaper cost. |
| D15 | Hand time is a first-class reading: every session records minutes, touches and seconds of touching, and X says them at the end. | P1, P17 | The reason X exists has to be visible in every session. |
| D16 | The relay's log holds what happened, never what was said: step timings, which path was taken, verdicts, touches, the source obeyed. What was said lives only in the memory (D13). | P17 | The relay's log is shared and lightly protected; the memory repository is private. |
| D17 | X runs at most four threads at once. | P10, P12 | Enough for the owner's examples; keeps model spend and the announcements bounded. My number, to be tuned from use. |
| D18 | X 1.0 is the end of the walk stage: the nine steps with learning, lists and threads, with taught signals and the arbiter, hand time measured. Run-stage work comes after 1.0. | P4 | Replaces my earlier cut of "one use case". The learning itself is the product. |
| D19 | All work lives under `x/`. The watch, relay and Lab code moved from `wrist/` at the repository root to `x/wrist/` as the first step of release W1 (done 2026-11-18). | P12 | One self-contained home. Moving it alone would only spend build runs. |
| D21 | The build learns from use. Each release starts by reading the synced memory and journal, and its plan says what was found. | P20, P17 | Learning in function. Otherwise only X's contents grow and X itself does not. |
| D22 | Pairing is hardened in release W1. The watch sends a long key of its own with every message, and the relay then refuses its code from anyone else. A browser needs a secret to listen; the relay hands one out only in the two minutes after Wrist is started, to one browser per start that already knows the six digits. Wrong tries are limited. | P18 | Owner, 2026-11-18: "why wouldn't we just do that". **Fact:** today nothing limits guesses at the code. W1 already changes watch, relay and page together, so it costs no extra watch build and no extra touch. |
| D20 | Targets: a signal is fit for X at 9 hits in 10 and at most 1 wrong fire in 10 minutes of use; a 30-minute session has at most 5 touches; the watch costs at most 10% an hour. | P17 | Numbers to argue with. Mine, to be corrected by evidence. |
| D23 | One shared script, `signals.lib.js`, turns what the camera finds into numbers that do not change when the hand moves about the picture: finger curl, thumb to fingertip, which way the palm faces, roll; and for the head: nod, turn, lean, blink, jaw, brows, smile. The watch gives tilt, roll and turn the same way. The Lab uses it now; X will use the same file. It is the "sources module" this design already named. | P6, P12, P17 | One place for the numbers means a signal taught in the Lab is the same signal in X. |
| D24 | A signal is taught by three showings after a rest. If the body ends each showing away from rest and stays, it is a **pose**; if it goes out and comes back, a **move**. A pose keeps the numbers that always describe that source plus any other number that left rest; a move keeps the one number that moved most, its direction and its size. No trained classifier (A8). | P5, P21, A8 | The person shows; nothing is tuned by hand. Leaving out numbers that did not change means a fist is a fist wherever the hand is and however it is turned. |
| D25 | Recognition: a pose fires once after 0.5 s inside its range, and counts when the body goes further than taught on the far side from rest. A move fires when its number goes out by the taught amount and comes back. A source that drops out of view starts afresh. | P11, P1 | Going a little further than taught must not be a miss. One fire for one act. |
| D26 | One signal, one action; one action, one signal. Giving an action to a second signal takes it from the first. | P5 | The owner: "I don't think in any way we should have two gestures that mean the same thing". |
| D27 | A word is two or three taught signals made in order, each within 2.5 s of the one before. It is a signal like any other and takes its own action. Removing a letter removes the words made with it. The last letter's own action still happens: settling that belongs to the arbiter (S5). | P21 | Letters make words with no new machinery. The limit is stated, not hidden. |
| D28 | The 3D object is drawn with three.js, loaded by the page from the same public host as the hand finder. The hand is shown as in a mirror. A pinch on the object takes it; it follows the hand, turns as the hand turns, comes nearer as the hand does; opening lets it go and it settles on the table. Two pinching hands move, turn and resize it. Actions given to signals work on it too, including while it is held. | P23, P12, P1 | three.js is off the shelf and was already named in this design. A pinch held is a posture, not a repeated motion. |
| D29 | Showing (V6) is built first on the object card: the run is kept as the person's own signals and what each did, with the state before and after; one model call reads before and after and says what the run was for. | P22, P8, P9 | The outcome on the object card can be checked by the page with no connection to anything. AI is used at one named step. |
| D30 | Naming a taught signal is by voice (the browser's own listening), with a box to correct it. Two taps and no typing for each signal. | P1, P2 | Teaching must not cost the hands it is meant to save. |
| D31 | Object depth follows how big the hand looks, as a ratio, with the sign the owner asked for: hand toward the screen, object away. Strength 3 until calibration gives the person's own reach. | R44, P24 | A ratio behaves the same near and far. His first run jammed the cup against the walls 32 times in 59. |
| D32 | A held object is let go only after the fingers have read open for 0.18 s. | P11, R55 | His run: 14 of 59 holds dropped within 0.4 s. A flicker is not a decision. |
| D33 | A card's record is sent every 15 s while the card is open, when the page is hidden, and at close. The head is sent again each time; sensor rows go in parts, the last part re-sent as it grows. The drain re-fetches any part whose size changed. Records with no watch code are filed under 000000. | P17 | His object run reached the build two hours late because it was only sent on close. |
| D34 | Once a card asks for the watch's stream it stays on between cards and for two minutes after the last card that needed it; it stops when the page is hidden. (With tabs: on while the Watch tab is open.) | R51 | The watch hears a request only at its next check-in, every 3 s; measured waits were 0.2 to 10 s per card. |
| D35 | The quiet-watch warning is driven by the symptom: 15 s of silence after a report with the screen off. It names both settings. | R56 | The watch can read neither setting (`exempt`, `restricted` and `bucket` never changed). |
| D36 | Calibrate (next): about a minute per source, the person shows their own range; everything that reads that source then uses it. Hand: pinch open and closed, near and far. Head: centre and comfortable turn. Eyes: each open and closed. Watch: rest. | P24, R55 | Fixed numbers failed on the first real hand. |
| D37 | Tabs are one page; each tab starts only what it needs. The camera tab never asks for a watch code. | R49, R50, P25, P12 | One page keeps one set of taught signals. |
| D39 | Calibration is kept on the device (`x_cal`) and applied in one place, where the camera's results are read: every card and every taught signal sees the person's own numbers. The finder's raw numbers stay available to the Calibrate card alone. | P24, P12 | One place to apply it means no card can forget to. |
| D40 | Blink left, right and both are made from the eye calibration as ordinary signals (0.4 s hold), so they are assigned, combined and removed like any other. Left and right are told apart by the difference between the two eyes; both by the less closed of the two. | R54, P5 | The owner: "keep blink left right both". No special case in the recogniser. |
| D41 | The page links to the relay the first time something needs the watch (the Watch tab, or a card that uses the watch) and then keeps the link for that visit. The stream follows the tab and the two-minute linger. | P25, P1 | A visit that only uses the camera never touches the watch. Once the watch is in use it must not fall asleep while its owner teaches a hand signal: starting it again takes a touch. |
| D42 | **Roll to scroll.** Roll is read as change from a baseline that starts where the arm is and follows it whenever it lies still inside the quiet zone. Past the start angle the list moves, faster the further; back inside half of it, it stops. The start angle is a third of the person's own comfortable roll once the watch is calibrated (16° until then), divided by the sensitivity. Off when the forearm is near upright, where roll cannot be told from gravity. | R58, P26 | The owner's arm rests with the watch rolled to about −125°; the cards it replaces only worked near 0°. |
| D43 | **Swing v3.** Travel is the turn about the vertical, so the arm's angle does not matter. 15° (divided by the sensitivity) within 0.7 s fires. Then the way back is expected: it never fires, however far it goes up to two and a half times the swing, and whether or not the hand pauses first. Armed again when the hand has come most of the way back and settled, or after 2.5 s. | R60, P26 | His words: "a short travel … to activate … a longer travel [back] is granted". |
| D44 | **Sensitivity** is one slider per watch card, 0.5× to 2.5×, kept on the device per card and written into the record when changed. | R59, P24 | A one-time setting, not a repeated touch. |
| D45 | **The watch joins Calibrate**: forearm on the desk, raised, rolled each way. Tilt is then the angle from the desk, raising as plus; roll is the change from that rest; taught watch signals use both. | R57, P24 | I had left the watch out "until a card uses a rest position". His notes are that use. |
| D46 | The cards Tilt to scroll v1 and v2 and Swing v1 and v2 are removed; their records stay. Flap is left as it is ("complete washout", rated Back to shop): its rework is to teach it as a move in Learn, from the watch. | R58, R60 | Rated Dump and Back to shop; the new cards are the rework. |
| D47 | **Hands in the scene.** Each hand is drawn from the finder's 21 points as joints, bones and a palm. Left and right come from where the hand is in the picture; depth from how big it looks, over the person's calibrated reach; its shape from the finder's own 3D points. Things are taken at the point where thumb and finger meet. | R46, R44 | The owner: "a hand that is moving and acting just like your regular hand". One mapping for every thing in the scene. |
| D48 | **Hand size** is the middle value, over the edges of the palm, of length in the picture ÷ true length, with the picture's shape corrected. | R44, P24 | The old measure (wrist to knuckle in the picture) shrank when the hand turned or tipped, so turning the hand moved it in depth. |
| D49 | **Things and goals are data.** Six goals, each a list of things, a place to put them and a rule checked by plain geometry. Set-down is helped: a ball over the bowl goes in, a block over a block sits on it, a thing let go stands upright. No physics engine. | R47, P8 | A physics engine is a large dependency for six small rules. Off-the-shelf was considered and not needed. |
| D50 | **Putty** is one shape with one number, its stretch along one line, and its volume is kept. Two hands: its ends follow the hands. An open palm pressing down flattens it. A fist rolls it back to a ball. Moulding runs by the clock, not by the frame. | R48 | The simplest thing that pulls, squashes, flattens and reforms. |
| D51 | **Journey** is a story as data: places, ways out, things to carry, one ending. A look counts past half of the person's own range, held 0.9 s, and the head must return to the middle between choices. | R53, P24 | Half the range keeps a glance from counting; the return to the middle makes one look one move. |
| D38 | A hot word and a cold word are taught voice signals given the actions "start listening" and "stop listening". Any taught signal can be given those actions, so a gesture does the same job in the camera context. | R52, P5 | One mechanism, no special case. |

**Calls made by the build and put to the owner on 2026-11-19 (he overrode one: blink stays).** Hands drawn as joints, bones and a palm, not lifelike skin. No physics engine. Putty does not tear or rejoin in its first pass. The journey is a small hand-written world with four built-in looks and no AI. The voice tab has no AI. No start without any connection. No new watch build this round. Showing (V6) waits behind this round.

## 3. Changes that would be architecture, not made, each needing the owner's explicit yes
| # | Change | When it would come up | What vetting it needs |
|---|---|---|---|
| C1 | Recognition moves onto the watch; the watch sends results, not raw rows | W3 | W2's battery and link numbers; page-side and watch-side results compared on the same recordings |
| C2 | withdrawn: memory on the relay | replaced by D13 on the owner's direction (device plus GitHub) | — |
| C3 | decided: hardened pairing | D22, in release W1 | — |
| C4 | The watch talks straight to the browser over Bluetooth, no relay | only if the relay proves to be the limit | parked in WRIST-PLAN §11.6 |
| C5 | Any new server, service or store beyond the relay | not planned | would need a reason no existing piece can meet |
| C6 | Keys or model calls leaving the device for a server | not planned | same |

## 4. Logical design
### 4.1 Pieces
```
 Sources            Meaning                 The nine steps                Memory
 ───────            ───────                 ────────                      ──────
 Watch  ─┐                                  3 Match ── known ─────────┐   Words
 Hand   ─┼─ event ─► Registration ─► Arbiter ─► command                │   Library
 Head   ─┤           (signal → command)     4 Read ┐                  ▼   Journal
 Voice  ─┘                                  5 Gather├─ AI ─► 7 Present ─► 8 Verdict ─► 9 Learn
 Presence ─────────────────────────► Arbiter 6 Compose┘                    Signals, Rules
                                            Threads (one in front)         Hand-time meter
                                                                           Memory <──> GitHub (private)
```

| Piece | Does | Holds |
|---|---|---|
| Source | turns the body or the voice into events; reports whether it is present | nothing |
| Registration | maps this person's signal to a command in this context | signal templates; the mapping |
| Arbiter | picks whose command counts; shows and logs the winner | rules per context |
| Exchange | runs the nine steps once | the exchange in hand |
| Threads | keeps up to four exchanges alive; one in front; announces the ready | thread list |
| Presenter | one thing: speaks it, shows it with its sources | nothing |
| Memory | words, library (answers with their evidence), journal (sessions), signals, rules | on the device, synced to GitHub |
| Session | starts and stops sources; runs the hand-time meter | the session record |

### 4.2 Data shapes
| Shape | Fields |
|---|---|
| Event | time, source (watch, hand, head, voice, touch), signal, command (filled by registration), confidence |
| Presence | source, present or absent, since when |
| Template | name, source, the measured numbers with average and spread, hold time, taught on |
| Registration | context, signal name, command |
| Rule | context, kind (override, fallback, exclusive), source order |
| Word | name, the ask behind it, what to gather, how to present, times used, last verdict |
| Library entry | word or ask, answer, frozen evidence with sources, made on |
| Thread | name, state (working, ready, in front, done), started on |
| Memory event | id, device id, time, type, payload (the unit that is synced) |
| Session record | start, end, minutes, touches, touch seconds, exchanges, sources present, battery at start and end |

### 4.3 Rules the pieces obey
1. A command never comes from two sources at once: the arbiter emits one.
2. Registration refuses a second signal for a command in the same context, and a second command for a signal.
3. X never calls a model for a command or for a known word's reading.
4. Nothing that cannot be undone runs before **yes**.
5. Every touch goes through the meter.

## 5. Physical design
| Part | Made of | Runs | State |
|---|---|---|---|
| Watch app | Java, Android SDK tools, package `com.acmeproducts.wrist` | Galaxy Watch 9, background service, screen off | built: `turn07-b8` |
| Relay | one Cloudflare worker, one SQLite-backed storage class | `wrist-relay.myacctfortracking.workers.dev` | built: `w10` (same routes as `w6`; the number moves with every deploy so the check knows the new page is being served) |
| Lab | one HTML file (`x/wrist/relay/lab.html`) served by the relay at `/` | any browser | built: `lab-r11`, 21 cards in four tabs |
| X | one HTML file (`x/wrist/relay/x.html`) served by the relay at `/x` | any browser, phone and desktop | built: `x-r2`, lab only |
| Sources module | `x/wrist/relay/signals.lib.js`, a plain script served by the relay at `/signals.js`, shared by the Lab and X: numbers, teaching, recognition, words, actions | in the page | built in `lab-r7`, lab only. The arbiter is not built |
| Hand and face finders | Google's MediaPipe vision tasks (`@mediapipe/tasks-vision@1.2.0`), loaded by the page | in the page; frames stay on the device | hand finder proven on the owner's tablet (S1); face finder built, not yet run on a device |
| 3D card | three.js 0.160, loaded by the page | in the Lab | built in `lab-r7`, lab only |
| Model calls | the provider's own endpoints, the owner's keys kept in the page's storage | from the page | pattern proven in the owner's pages |
| Listening and speaking | the browser's own listening and voice | in the page | built in `x-r2`, lab only |
| Memory | the browser's own database on the device, synced to a private GitHub repository through GitHub's own API with the owner's token | in the page | not built; pattern proven in session-manager |
| Builds and logs | three GitHub workflows; outputs committed to the branch | GitHub | built |

Additions inside the standing architecture, by release (no new component in any of them):

| Release | Relay | Watch | Pages |
|---|---|---|---|
| W1 | carries "sleep" and buzz patterns in its reply; reports when the watch last logged; issues secrets and limits guesses | still panel; sleeps on the word or after 3 minutes alone; "logged at" line; sends its key; plays buzz patterns | Lab: Watch off control, last-logged line; keeps its secret; Buzz card |
| L1 | keeps each watch's snapshots and session summaries, retrievable | none | Lab: results table |
| X1 | serves `/x`; accepts X's event log | none | X page |
| W3 (needs C1) | passes templates to the watch | recognises on the watch | none |
| W4 | carries "buzz" in its reply | one short vibration | X announces a ready thread |

## 6. Constraints checked before designing
| Constraint | Finding |
|---|---|
| Camera and microphone in a browser need a secure page and the person's permission | the relay serves over https; permission is asked once per site |
| Speech from the browser needs one touch to unlock on phones | the session's opening touch does it (fact: devstream does this) |
| The watch has no low-power sensor | a running reader keeps the processor awake; hence P16 and D14 |
| Wear OS has no in-app battery exemption | "Allow background activity" in the Galaxy Wearable app is the switch (WRIST-PLAN §10) |
| A page cannot read another site's storage | keys are entered once on X's own address; counted as setup touches |
| A page can read and write a GitHub repository with a token | fact: session-manager, devstream and chat-test do this today |
| Model providers accept calls from a page | fact: the owner's pages do this today with three providers |
