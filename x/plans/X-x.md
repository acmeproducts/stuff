# Plan X — X itself

Version 1.0.0 · 2026-11-18 · Part of `x/X-ROADMAP.md` · Concept: `x/X-CONCEPT.md`

## 1. Purpose
Build the learning system. Three streams: **voice** (X listens and speaks), **the learning loop** (the nine steps, verdicts, words), and **lists and threads** (many items, many things at once).

Owner, 2026-11-18:
> "We also need to start a parallel track which is to start building X. No, I don't have a spec for it, I just have the vision that I gave you early on."

> "your version of X is born, and just like a child the first thing you do is develop a vocabulary that evolves."

## 2. State
| | |
|---|---|
| Built | Nothing of X. |
| Floor (facts, from the owner's pages) | chat-test: listening through Deepgram with strict turn-taking. prism, market-navigator, devstream: answers read aloud by the browser's voice. All four: model calls straight from the page, three providers, key test, fallback, web search as a switch. prism and market-navigator: evidence frozen with the answer, kept in a library. devstream: eight spoken commands matched before any model call; a first touch unlocks speech. |
| Not the floor | session-manager talks to the OpenClaw gateway. X does not (A7). |
| Unknown | TH1 to TH4 (`X-CONCEPT.md` §8). |

## 3. Serves
Stories US1, US2, US4, US5, US6, US11, US12. Requirements R01, R02, R06 to R09, R11 to R16, R24 to R28, R33, R34. Decisions D01 to D03, D09, D10, D12, D13, D15 to D18.

## 4. Design notes
- **One page, one thing in front.** No tiles, no menu. What is on screen is the thing being presented and, small, which sources are present and which one X last obeyed.
- **Saying a command in your own words.** "go on", "keep going" and "next" are all **more**. The spoken forms are matched without a model, the way devstream does it. Anything not matched is not an error: it goes on to step 4 (H4).
- **X's own abilities are reached by talking, not by phrases.** Asking what X knows, renaming or forgetting a word, asking what is registered, asking for hand time so far: the read step recognises these like any other request (R02, R09).
- **A known word and an unknown ask differ in one thing.** For an unknown ask, the model is asked to state its reading and then gather and answer. For a known word the reading is the stored one; the model only gathers and composes to the stored recipe. X says no reading aloud for a known word.
- **Evidence.** Every answer keeps its sources and the material it was made from, in the library (R26).
- **Setup is honest.** Keys for the model provider and for listening are entered once on X's address. Those touches are counted as setup and reported separately from session touches.

## 5. Releases

### X1 — Born (crawl, next)
The whole loop in its smallest form. A newborn already learns.

**Scope**
1. The X page at `/x`, on phone and desktop.
2. Session: one opening touch unlocks the microphone and the voice and starts the hand-time meter. Present sources are shown. On closing, or when the owner says he is done, X reports minutes and touches and tells the watch to sleep (W1).
3. Listening with turn-taking. When the owner speaks, X goes quiet (H1).
4. The loop, steps 1 to 9. Five commands by voice. Unknown asks answered through one model call with web search: reading, spoken answer, one card, sources.
5. Verdicts: **yes** keeps the ask as a word X names; saying how it should differ changes it; **no** drops it.
6. Memory on the device: words, library, journal of sessions.
7. X's log to the relay: timings, path taken, verdicts, touches. Never the words spoken (D16).

**Not in X1:** lists, threads, taught signals steering X (they join through the one event shape at V3), the camera.

**Build sequence**
| Step | What | Check |
|---|---|---|
| 0 | The Lab's file is renamed from `x.html` to `lab.html` (still served at `/`), so X owns its own name | Lab page checks unchanged |
| 1 | Write the device gate below as checks, driven by sentences injected as if heard and by a recorded model reply used only by the test | they fail: there is no X |
| 2 | Relay: serve `/x`; accept X's log lines | relay checks pass |
| 3 | Session, meter, setup with key test | touches counted; setup touches kept apart |
| 4 | Listening and speaking | a recorded sentence is heard; speaking stops when a new one starts |
| 5 | The loop: match, then read, gather, compose, present | a command makes no model call; an unknown ask makes one |
| 6 | Verdicts and memory | **yes** stores a word; the word is found after a reload; **no** removes it |
| 7 | Log | lines contain no spoken words |
| 8 | All lab checks; deploy; one link | — |
| 9 | Device gate | below |

**Device gate (the owner's definition of working)**
1. After the opening touch, the owner asks for the weather and traffic in his own words. X says its reading in a few words, answers aloud, and shows one card with its sources.
2. He says yes. X names the word and says the name. The next day he says that name and X answers with no reading step.
3. more, enough, no and again each do their one thing, however he phrases them.
4. He talks over X and X goes quiet.
5. X never asks him to repeat or rephrase.
6. A ten-minute session has no touch after the first. X reports minutes and touches at the end, and the watch sleeps.
7. The same checks pass in a desktop browser in the lab. (The owner has no desktop to test on; this item is lab-only and is reported that way.)

**Proves or kills:** TH1, TH2, TH3.

### X2 — Lists (walk)
**Scope:** a word can bring many items (title, text, picture or sound, link, source). One item is in front. **more** and **back** by voice or signal; **glide** by a held posture once V3 is in. **enough** stops. Saying "more like this" or "less of this" changes the word (a change verdict).

**Build sequence**
| Step | What | Check |
|---|---|---|
| 1 | **Feed probe (TH4).** Ask the model, with web search on, for three kinds of list the owner named: a subreddit's current posts, today's news on a subject, pictures of a kind of art. Record what comes back: how many, how fresh, whether pictures load in the page. | the result is written into this plan as fact, whichever way it falls |
| 2 | Failing checks for the item shape, one-in-front, more, back, enough | fail on X1 |
| 3 | Lists in the loop and the presenter | pass |
| 4 | Glide (needs V3) | a held synthetic posture moves the list at a steady rate and levelling out stops it |
| 5 | Device gate | below |

If the model's reach cannot bring a kind of list, that kind waits (P9) and the plan records it. No connector is built.

**Device gate:** the owner asks for a feed in his own words, keeps it, and moves through twenty items with no touch. The next day the word brings fresh items.

### X3 — Threads (walk)
**Scope:** an ask that will take long starts a thread. X says it has started and stays with the owner. Up to four threads (D17). When one is ready X says so in one sentence (and buzzes with W4). Saying its name brings it forward. The library keeps every finished answer with its evidence.

**Build sequence:** failing checks (a slow recorded reply does not block a second ask; the ready announcement comes once; a named thread comes forward; a fifth thread is queued); threads; library view by talking; device gate.

**Device gate:** the owner asks for research on the natural occurrence of gold in the Central Valley, then goes through a feed. X announces the research. He brings it forward by name. It has its sources. It is still in the library the next day.

### X 1.0
Gate 6: the six points in `X-ROADMAP.md` §2, with V3 and S5 in place.

### X4 — Sentences and contexts (run)
Words combine into one ("morning" is three words in order). A context the owner declares ("on the couch") carries its own registrations and its own arbiter rule. Later X offers its guess of the context from the time and the sources present; **no** corrects it. X eases off when the body says so: an arm still too long or arms overhead (the Lab's body card), and X carries on reading without waiting for **more**.

### X5 — Makes and analyses (run)
Analysis on frozen evidence, for questions like the carry trade and a credit squeeze (market-navigator is the floor). Building by voice (devstream is the floor). Objects and games with **take**, **turn** and **let go** from L3.

### X6 — Acts for you (run; needs hardened pairing, change C3)
Finding things to buy. Flights as an acquired content type. Each step that sends or spends states exactly what will happen and waits for **yes** (P18). Messaging is last. An administrative assistant is out of scope.

## 6. Risks
| Risk | Held by |
|---|---|
| Open listening answers speech not meant for X (TH1) | X1 measures it. If it fails, the Lab's raise-to-talk posture becomes the gate for speaking, as a registered signal. |
| X1 feels like a voice chat box | the verdict and the word are in X1 from the first build; by the second day known words answer with no reading step |
| Model spend | one call per unknown ask; a known word costs the same call without the reading; four threads at most |
| A feed the model cannot reach | it waits; nothing bespoke is built |
| Music has no playable source the page may use | recorded as open; pictures and text first |
