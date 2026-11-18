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
| D09 | Model calls go straight from the page with the owner's own keys, using the same three providers, key test and fallback as his existing pages. Web search is a switch on that call. | P9, P12, A7 | Proven on his phone. Nothing new to run or maintain. |
| D10 | Listening uses the Deepgram pattern from chat-test, with the browser's own engine as fallback. Speaking uses the browser's own voice. | P2, P12 | Both already work in his pages. |
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
| Watch app | Java, Android SDK tools, package `com.acmeproducts.wrist` | Galaxy Watch 9, background service, screen off | built: `turn06-b6` |
| Relay | one Cloudflare worker, one SQLite-backed storage class | `wrist-relay.myacctfortracking.workers.dev` | built: `w3` |
| Lab | one HTML file served by the relay at `/` | any browser | built: `lab-r5` |
| X | one HTML file served by the relay at `/x` | any browser, phone and desktop | not built |
| Sources and arbiter module | plain script shared by the Lab and X | in the page | not built |
| Hand and face finders | Google's MediaPipe vision tasks, loaded by the page | in the page; frames stay on the device | not built |
| 3D card | three.js, loaded by the page | in the Lab | not built |
| Model calls | the provider's own endpoints, the owner's keys kept in the page's storage | from the page | pattern proven in the owner's pages |
| Listening and speaking | Deepgram socket with browser fallback; browser voice | in the page | pattern proven in the owner's pages |
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
