# Plan X — X itself

Version 1.1.0 · 2026-11-22 · Part of `x/X-ROADMAP.md` · Concept: `x/X-CONCEPT.md`

## 1. Purpose
Build the learning system. Three streams: **voice** (X listens and speaks), **learning** (the nine steps, verdicts, words), and **lists and threads** (many items, many things at once).

Owner, 2026-11-18:
> "We also need to start a parallel track which is to start building X. No, I don't have a spec for it, I just have the vision that I gave you early on."

> "your version of X is born, and just like a child the first thing you do is develop a vocabulary that evolves."

## 2. State
| | |
|---|---|
| Built | `x-r2`, a voice page. **Failed its device gate on 2026-11-18** (below) and is parked. |
| Parked until | taught signals, words and shown runs (plan V) give X something it can do without asking a model each time. *("Shown runs" was a wrong reading; see the note of 2026-11-22 at the end of this plan.)* The parts that passed their checks are kept: listening, speaking in short parts, memory on the device and in GitHub, the three AI services. |
| Floor (facts, from the owner's pages) | chat-test: listening through Deepgram with strict turn-taking. prism, market-navigator, devstream: answers read aloud by the browser's voice. All four: model calls straight from the page, three providers, key test, fallback, web search as a switch. prism and market-navigator: evidence frozen with the answer, kept in a library. devstream: eight spoken commands matched before any model call; a first touch unlocks speech. |
| Also floor | session-manager keeps its source-of-truth file on the device and in GitHub as a list of events with an outbox; devstream and chat-test read and write the repo from the page with a token. |
| Not the floor | session-manager's chat goes through the OpenClaw gateway. X's does not (A7). |
| Unknown | TH1 to TH4 (`X-CONCEPT.md` §8). |

## 3. Serves
Stories US1, US2, US4, US5, US6, US11, US12. Requirements R01, R02, R06 to R09, R11 to R16, R24 to R28, R33, R34. Requirement R37. Decisions D01 to D03, D09, D10, D12, D13, D15 to D18, D21.

## 4. Design notes
- **One page, one thing in front.** No tiles, no menu. What is on screen is the thing being presented and, small, which sources are present and which one X last obeyed.
- **Saying a command in your own words.** "go on", "keep going" and "next" are all **more**. The spoken forms are matched without a model, the way devstream does it. Anything not matched is not an error: it goes on to step 4 (H4).
- **X's own abilities are reached by talking, not by phrases.** Asking what X knows, renaming or forgetting a word, asking what is registered, asking for hand time so far: the read step recognises these like any other request (R02, R09).
- **A known word and an unknown ask differ in one thing.** For an unknown ask, the model is asked to state its reading and then gather and answer. For a known word the reading is the stored one; the model only gathers and composes to the stored recipe. X says no reading aloud for a known word.
- **Evidence.** Every answer keeps its sources and the material it was made from, in the library (R26).
- **Everything runs in the page.** The nine steps need no gateway and no server of ours. Steps 4 to 6 are one call from the page to the model.
- **Memory.** Kept on the device and synced to a private GitHub repository as events (D13). The build reads it before each release (D21).
- **Setup is honest.** A key for each AI service the owner uses, and the GitHub token, are entered once on X's address. Those touches are counted as setup and reported separately from session touches.

## 5. Releases

### X1 — Born (crawl, next)
All nine steps in their smallest form. A newborn already learns.

**Scope**
1. The X page at `/x`, on phone and desktop.
2. Session: one opening touch unlocks the microphone and the voice and starts the hand-time meter. Present sources are shown. On closing, or when the owner says he is done, X reports minutes and touches and tells the watch to sleep (W1).
3. Listening with the browser's own engine. X speaks in short parts and listens between them (H1).
4. The nine steps. Five commands by voice. Unknown asks answered through one model call with web search: reading, spoken answer, one card, sources.
5. Verdicts: **yes** keeps the ask as a word X names; saying how it should differ changes it; **no** drops it.
6. Memory on the device, synced to GitHub: words, library, journal of sessions.
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
| 5 | The steps: match, then read, gather, compose, present | a command makes no model call; an unknown ask makes one |
| 6 | Verdicts and memory | **yes** stores a word; the word is found after a reload; **no** removes it; a word kept in one browser appears in a second after a sync; a sync that fails is retried from the outbox |
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

8. A word kept on the S23 is known on the iPhone.

**Proves or kills:** TH1, TH2, TH3.

**Built 2026-11-18 at `/x`. Lab only. Now `x-r2`.**

`x-r2` is the owner's correction of `x-r1`, the same day:
> "Actually Venice is primary. You have three applications as part of our floor that show how to load the models available and then persist that model for that provider, and also then a switch to govern which provider is the default. We don't need Deepgram for transcription, we're not trying to go multi-language right now, whatever your browser is set to is fine."

What is there, all of it working end to end in the lab:
- **Setup once, laid out as in prism, market-navigator and devstream.** A default-service switch (Venice unless changed). A card each for Venice.ai, OpenRouter and Anthropic direct: key, Load models, and a model kept for that service. A pasted key loads its models by itself. Test and save checks every service that has a key with a one-token call. A default chosen by hand that does not work is refused, with the reason.
- **Fallback.** If the default service fails, the next one that is set up answers. If all fail, X says so and names each reason.
- **GitHub memory, optional.** Token and repository (found, or created private if the token allows; a public one is warned about). Setup closes itself and Begin appears.
- **One touch on Begin.** Then: the browser's own listening in the browser's language, the nine steps, the five commands in many phrasings, unknown asks through one model call with web search, a card with sources, words kept, changed, renamed, listed and forgotten by talking, a known word run with no reading step.
- **Memory as events** on the device, merged with `x-memory.json` in the repository. A memory file that cannot be read is never overwritten. Which service is the default and which model each uses are events too, so a second device needs only its keys. Keys are never in the memory.
- **Hand time.** Touches and touch seconds counted after the opening touch, shown at the top, spoken at the end, kept in the journal. Saying you are done ends the session and tells the watch to sleep.
- **A log line** in the relay for each thing that happened (including which service answered), never what was said.

| Check | Result |
|---|---|
| X checks, phone-sized browser and once at desktop size | 50 of 50 |
| Relay checks with `/x` and the X log line | 35 of 35 |
| On the owner's phone | **not yet run** |

**Stood in for by the test, so unproven until the owner's first session:** the three real services and their web search; real GitHub; the real microphone and the browser's listening and voice. The page has no test path of its own: the test intercepts the network and replaces the browser's speech functions.

**Changed while building, and why**
- H1 is rewritten (`X-CONCEPT.md` §5): X speaks in short parts and ignores what the microphone hears meanwhile. A browser hears itself.
- Citation marks that a service puts inside its text are removed before X speaks.
- Theory, to be seen in the first session on the S23: the browser's own listening restarts after each pause, and may chime each time it does.

**Device gate, 2026-11-18 13:19 to 13:22 UTC (`x-r2`, the owner's first session; from X's own log lines in `x/wrist/out/DEVICE-LOG.md`): FAILED.**

Owner:
> "x is just a starting point … it's basically a shell and it sends a prompt, so it's really not AI assisted, it's just a voice front end to AI. I'm not sure how to get it to change my voice to watch or what that really gives me. I'm also really unclear truly what it's supposed to do. I don't think it does anything but just basically do cosplay with AI and pretend it's doing something when you ask it. Plus the latency is ridiculous, and the number of steps, which I'm sure is directly impacting the latency. I'm not sure where the learning portion comes in yet."

| Fact | Evidence |
|---|---|
| Every ask took about half a minute | four unknown asks: 27.6 s, 26.9 s, 32.1 s, 30.3 s; one change: 11.7 s. All answered by Venice, no fallback. |
| No sources came back on any answer | `src:0` on all five turns. Cause not yet known. |
| Nothing was kept; no word was ever used | 0 words at the start and at the end; 5 exchanges in 2.4 minutes |
| The owner touched the "watch" light, expecting a switch | touch on `sWatch` 12 s into the session. It is an indicator and does nothing. |
| The session was ended with the Setup button, not by voice | touch on `setupBtn`; 2 touches in all |
| Ending X did put the watch to sleep | X ended 13:21:54.0; the watch logged `sleep`, why `page`, at 13:21:55 |
| The watch gave X nothing else | signals do not steer X (V3 is not built), and the watch was silent for most of the session (plan W) |

**Why he is right (my reading of my own build).** The nine steps are on paper. In the build, steps 4 to 6 are one long prompt whose whole reply X waits for before it speaks; that is the half minute. Keeping a word saves the sentence, and the next time the same slow call is made. Nothing X "learns" lets X do anything by itself. That is a voice front end to an AI, which is what the owner warned against on 2026-11-18 ("everything isn't just a question to an AI that does everything else").

**Proves or kills:** TH3 as built is empty: a kept word runs no faster and no surer than asking again. TH1 and TH2 were not reached.

### X2 — Lists (walk)
**Scope:** a word can bring many items (title, text, picture or sound, link, source). One item is in front. **more** and **back** by voice or signal; **glide** by a held posture once V3 is in. **enough** stops. Saying "more like this" or "less of this" changes the word (a change verdict).

**Build sequence**
| Step | What | Check |
|---|---|---|
| 1 | **Feed probe (TH4).** Ask the model, with web search on, for three kinds of list the owner named: a subreddit's current posts, today's news on a subject, pictures of a kind of art. Record what comes back: how many, how fresh, whether pictures load in the page. | the result is written into this plan as fact, whichever way it falls |
| 2 | Failing checks for the item shape, one-in-front, more, back, enough | fail on X1 |
| 3 | Lists in the steps and the presenter | pass |
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

### X6 — Acts for you (run; pairing is already hardened in W1)
Finding things to buy. Flights as an acquired content type. Each step that sends or spends states exactly what will happen and waits for **yes** (P18). Messaging is last. An administrative assistant is out of scope.

## 6. Risks
| Risk | Held by |
|---|---|
| Open listening answers speech not meant for X (TH1) | X1 measures it. If it fails, the Lab's raise-to-talk posture becomes the gate for speaking, as a registered signal. |
| X1 feels like a voice chat box | the verdict and the word are in X1 from the first build; by the second day known words answer with no reading step |
| Model spend | one call per unknown ask; a known word costs the same call without the reading; four threads at most |
| A feed the model cannot reach | it waits; nothing bespoke is built |
| Music has no playable source the page may use | recorded as open; pictures and text first |

## 7. Record, 2026-11-18 (evening)
**Owner:** "it's basically a shell and it sends a prompt … just a voice front end to AI … cosplay with AI … the latency is ridiculous … not sure where the learning portion comes in yet".
**Facts from the log:** four asks took 27.6, 26.9, 32.1 and 30.3 seconds; a change took 11.7; all on Venice; none came back with sources; nothing was kept.
**My next proposal**, that X be given two fixed things to fetch, was refused: "that's building connectors again" (G28).
**Open since 2026-11-22, for the owner:** this plan was parked until "showing" passed. The owner has since said what that learning is (R62): X learns from what it is used for. That cannot happen while X is not in use, so the order below no longer holds together: X has to be in daily use before V6 can exist. The new order is his to set.

**Answered 2026-11-22 by section 8 below**, planned on the owner's "go": X7 first, then V6.

**What happens to this plan (as written 2026-11-18):** X2 to X6 stand as written but none starts until V6 (showing) has passed on a device. X1's device gate stays failed; it is not re-run on this page.

## 8. X returns (planned 2026-11-22 on the owner's "go"; **on hold the same day; not built**)
**On hold, 2026-11-22 (later).** The owner read the summary of this section and said: "I still think there's something missing … the repetitive things is just a substitute for not having to look things up. But ultimately I'm trying to use Lab gestures to use a smartphone to exist in the modern world." This section is centred on asking and looking up, with his signals as an extra. That is off-centre (P28, P29): it is the old thing, asking an AI, reached by voice. It is not to be built as it stands. A1 to A4 are withdrawn until the centre is defined. What may survive as parts: streaming, the record, the speed probe.

The owner, 2026-11-22: X "learns stuff, then does it … consuming the result and cataloging it and indexing it … whatever I use it for all the time, eventually it just knows that's what I want" (R62). That needs X in daily use and a record of that use. This section is the plan for both. V6 (plan V) sits on top of it.

### 8.1 Words used here
| Word | Meaning |
|---|---|
| Ask | one thing he asks X |
| Result | what came back: the spoken answer, its sources, and up to five **points**: short lines stating what could be different next time |
| Subject | what an ask is about, as a short label. Subjects have no kinds and no code of their own |
| Record | every ask and result, by subject and by day |
| Standing subject | one he keeps coming back to, which X now checks by itself (V6) |
| Round | X checking its standing subjects without being asked (V6) |

### 8.2 What failed on 18 Nov, and what this plan does about each
| What failed (fact) | Cause | In this plan |
|---|---|---|
| About 30 s an answer | fact: `x-r2` waits for the whole reply (up to 1500 tokens) before it says a word | the reply is streamed; X speaks the first sentence when it arrives; short answer first, **more** for the rest. Whether that is fast enough is **theory** until step 1 below |
| No sources on any answer | fact: `x-r2` set Venice's web search to `auto`; Venice's documentation says `auto` leaves the search to the model's discretion. **Theory:** that is why none came back | search is switched on for every gather; the probe counts sources |
| "Not sure where the learning comes in" | fact: keeping a word saved a sentence and re-ran the same slow call | everything is kept without a "yes"; from the second ask on a subject X says what is different; from the third day X brings it unasked (V6) |
| "Just a voice front end to AI" | fact: nothing X had could act by itself | X answers questions about its own record with no model; taught signals steer it; rounds are X's own doing |
| The watch gave X nothing | fact: signals did not reach X | a taught signal with an X action works in X |

### X7 — X returns (crawl)
**Question:** can X answer fast enough to be used every day, and is the second ask about a thing better than the first?

**Scope**
1. The X page, `x-r3`, at `/x`. Kept from `x-r2` because it passed its checks: setup for the three services with the default switch and fallback; memory as events on the device, merged with the private GitHub repository; hand time; log lines with no words; the watch sleeping when X ends.
2. **The order of operations for an ask.** No model is called before step 3.
   | # | Step | Model? |
   |---|---|---|
   | 1 | Sense: his voice (the same ears and turn tones as the Lab's Voice tab) and any taught signal that has an X action | no |
   | 2 | Match on the device: a command; a question about X's own record; a subject already in the record | no |
   | 3 | One call, streamed, web search on. If the subject is known the call carries that subject's last points, and the answer begins with what is different since then | **yes** |
   | 4 | Present: spoken as it arrives; one card with its sources | no |
   | 5 | File: the ask, its subject, the points, the sources, the answer. Nothing has to be said to keep it. **no** drops it | no |
3. The subject and the points come back in the same call, after the spoken part, and are not spoken (D58).
4. **The record can be asked.** "What have I asked about this week?", "what did you tell me about that on Tuesday?": answered from the record, at once, with no model.
5. **Steering.** more, enough, again, back, yes, no by voice or by any signal he taught and gave that action (the file the Lab already uses). The camera or the watch runs in X only if such a signal exists.

**Cut, and why (override me if wrong)**
| Cut | Why |
|---|---|
| X saying its reading back before it answers (H2) | a step and a delay; the answer itself now starts at once |
| "Say yes to keep it; X names the word" | he should not have to tell it. X keeps everything; what he returns to is the word |
| Lists and threads on screen (X2, X3) | not needed to prove this; rounds (V6) use up to four calls at once behind the scenes |

**Build sequence**
| Step | What | Check |
|---|---|---|
| 1 | **Speed probe**, in X's setup, on the owner's phone: one tap runs one streamed ask with web search on each service that has a key. Shown and logged: seconds to the first words, seconds in all, how many sources | written into this plan as fact, whichever way it falls. If no service gives first words inside 8 s, X7 stops and this plan is revised |
| 2 | The device gate below, written as checks | they fail on `x-r2` |
| 3 | Streaming, speaking as it arrives, search on | the first sentence is spoken before the reply has ended |
| 4 | The record and its index | an ask is filed under a subject with points and sources; it is there after a reload; two browsers merge |
| 5 | "Different since last time" | the second ask on a subject carries the earlier points and no other subject's |
| 6 | Questions about the record | answered with no model call |
| 7 | Taught signals steer X | a made-up signal given "more" brings the next part |
| 8 | The log | no line holds a word that was said |
| 9 | All lab checks; deploy; one link | — |
| 10 | Device gate | below |

**Device gate (on the owner's phone)**
1. He asks something in his own words. X's first words come inside 5 seconds (my target; the probe sets the real number). The card has its sources.
2. The next day he asks about the same thing. X begins with what is different since yesterday, and it is right.
3. He asks what he has asked about this week. X says it from its record, at once.
4. more, enough and again each work by voice and by a signal he taught.
5. Ten minutes with no touch after the first. Hand time is reported.
6. What X kept on the S23 is there on the iPhone.

**Proves or kills:** TH9, TH10, TH1.
**Depends on:** the owner's run of the Voice tab (`lab-r12`), which is the first evidence of how the phone's recogniser behaves with turns. It does not block step 1.

### 8.3 Facts this plan rests on
| Fact | Consequence |
|---|---|
| A web page runs only while it is open | rounds happen when X is opened and while it stays open. Nothing happens while it is closed |
| Rounds on a server would need his AI keys off the phone | not proposed: the standing rule keeps keys in the browser only |
| A web page cannot see what he does in other apps or sites | X learns only from what he does through X |
| What was said may live only in X's memory (D13), never in the relay's log (D16) or the public repository | the record is in the memory: the phone, and his private repository if he has set one up |
| Web search on Venice is charged by use | unasked calls are capped and counted (V6) |
| ChatGPT Pulse (September 2025) makes proactive updates from a person's chats, inside ChatGPT's own app | the idea exists on the market. It is not a part X can use: it is another company's app and models, read by touch. X's are his own services, his own record and his own signals |

### 8.4 For the owner to authorise before anything is built
| # | What | Why it is his |
|---|---|---|
| A1 | X's memory holds every ask and what came back, words included, on the phone and in his private repository | it is what X keeps about him (extends D13) |
| A2 | X spends on his AI keys without being asked, inside a cap (V6) | his money |
| A3 | The two cuts above | they change the concept he approved (§3.3, H2) |
| A4 | Gate 3 and point 2 of X 1.0 reworded (roadmap §2, §3.1) | they are his definition of done |
