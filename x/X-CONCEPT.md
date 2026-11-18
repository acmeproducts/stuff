# X — what it is and what it does (first pass)

Version 1.0.0 · 2026-11-18 · Answers to `X-NORTH-STAR.md`

This is the analysis: a first reading of the owner's vision as one working idea. It is the owner's to correct. Nothing here changes the built architecture.

## 1. In one paragraph
X is a learning system you raise. It is born knowing five things. You talk to it in your own words and steer it with a few signals you taught it. Whatever it already knows, it does at once. Whatever it does not know, it works out with an AI's help, shows you one thing, and takes your verdict. What you keep becomes part of its vocabulary, so the next time is instant. Session by session the edge of what it knows moves outward, and your hands stay at rest the whole time.

## 2. The loop
Every exchange with X runs the same nine steps. This is the "very specific order of operations where things become AI assisted".

| # | Step | What happens | AI? |
|---|---|---|---|
| 1 | Sense | Sources report: your voice, a watch signal, a hand or head signal | no |
| 2 | Arbitrate | The arbiter decides whose report counts in this context | no |
| 3 | Match | Is it a command or a word X already knows? Then act now and skip to step 7 | no |
| 4 | Read | X works out what you meant, using what is in front of you and what it knows about you | **yes** |
| 5 | Gather | The material is fetched and frozen as evidence | **yes** (the AI's own reach) |
| 6 | Compose | The answer is made from that evidence | **yes** |
| 7 | Present | One thing, spoken and shown | no |
| 8 | Verdict | You keep it, say how it should change, or drop it | no |
| 9 | Learn | A kept thing becomes a word. Next time step 3 catches it | no |

AI is used only at the edge of what X knows (steps 4 to 6). A known word skips step 4 entirely: X does not guess what you meant, it knows. This is the difference from a chat box, where every sentence starts from nothing.

**Fact:** the owner's own pages already follow this order in pieces. prism and market-navigator gather material first, freeze it as evidence, then ask the model, save the result to a library and read it aloud. devstream checks a spoken sentence against its fixed commands before any model is called.

## 3. Vocabulary
The owner's four ingredients, placed in the loop:

| Ingredient | In X |
|---|---|
| **Vocabulary** | everything X understands: **commands** (how you steer) and **words** (what X has learned to bring you or do for you) |
| **Intents** | step 4: X's reading of a sentence it has no word for, said back in a few words before the answer so a wrong reading is caught early |
| **Verdicts** | step 8: keep, change, drop. The only way X learns. The same three the Lab already uses (Keep, Back to shop, Dump) |
| **Heuristics** | X's standing habits, listed in section 5 |

### 3.1 Commands
Commands are the finite set X expects. Each has one meaning everywhere. Each can be spoken from the first day, and each can have a signal the person teaches (plan V). The set grows only when a new age of X needs it.

| Age | Commands added | Meaning | Why now |
|---|---|---|---|
| Born | **more** | go on: the next part, the next item, deeper | the least a person needs to steer one thing |
| | **enough** | stop this | |
| | **yes** | keep it; go ahead | the verdicts that teach |
| | **no** | not that; undo | |
| | **again** | give me that once more | |
| Walks | **back** | the one before | lists of items need a way back |
| | **glide** | keep moving while I hold this posture; level out to stop | moving through a list must not be a repeated motion (P1) |
| Runs | **take**, **turn**, **let go** | hold an object, rotate it, release it | objects and games, proven first on the Lab's 3D card |

Ten commands at full growth. The seed is the owner's own: devstream already obeys stop, continue, undo and repeat by voice.

### 3.2 Words
A word is something X learned from you: a name, what to gather, and how to present it. "Morning" might be weather and traffic. "Gold" might be a standing piece of research. A subreddit, a kind of art, a market question, a flight search are all words. X ships with none. Content types are acquired by use, never built in and never wired to a service of their own (P9).

### 3.3 How a word is born
1. You ask for something X has no word for.
2. X says its reading in a few words, then answers.
3. **yes** keeps it. X names it itself and says the name. You can rename it by saying so.
4. Saying how it should differ ("shorter", "skip traffic at weekends") changes the word.
5. **no** drops it.

## 4. What a session is
**Born.** The phone is on a stand. You open X; that is the last touch. If you wear the watch you open Wrist on it; X finds whatever sources are there. You say what you want. X answers aloud and shows one card with its sources. You say or sign more, enough, yes, no, again. When you close X the watch goes to sleep. X tells you the session's hand time: minutes, and how many touches.

**Walks.** A word can bring a list: a feed, a set of pictures, pieces of music. X shows one item at a time; you glide through them or say more and back. You can start something long ("look into gold in the Central Valley") and carry on with something else. X tells you when it is ready. Several threads run; one is in front.

**Runs.** Words combine ("morning" then "markets"). Contexts carry their own signals and their own arbiter rule. X notices the body (an arm still too long, arms stretched overhead) and eases off. X makes things and analyses with evidence, handles objects and games, and, last, does things that send or spend, each behind an explicit yes.

## 5. Heuristics X is born with
| # | Habit | Principle |
|---|---|---|
| H1 | When you speak, X goes quiet. Your voice always wins. | P11 |
| H2 | A known word acts at once. An unknown one gets X's best reading, said back in a few words before the answer. | P8, P11 |
| H3 | What can be undone happens without asking. What cannot waits for yes. | P11, P18 |
| H4 | X never asks you to repeat a phrase or say it another way. If unsure, it acts on its best reading and **no** undoes it. | P11 |
| H5 | One thing in front. Anything else waits its turn and is announced in one short sentence. | P10 |
| H6 | Every touch is counted and reported. A touch is never needed after the session starts; if one happens, X logs what forced it. | P1, P17 |

## 6. Floor, stairs, ceiling
What exists is the floor. The stairs are the releases in the plans. The ceiling is the owner's picture in `X-NORTH-STAR.md` §2.

| Floor (built and proven) | Stairs | Ceiling |
|---|---|---|
| Watch reads wrist motion with the screen off; relay carries it to any browser | W1 session, W2 battery truth, W3 recognition on the watch, W4 buzz | A source that lives and dies with X and costs little |
| Lab: 13 cards, recordings, verdicts | L1 results table, L2 scored session, L3 3D object | Every signal has a measured hit rate and wrong-fire rate |
| Hand-tuned OK pose from the owner's four holds | V1 teach on the watch, V2 teach by camera, V3 registration, V4 next-day test | Anyone teaches their own signals in a minute, per context |
| Camera research (other session): hand and face finders run in a browser | S1 to S3 probes, S4 one event shape, S5 arbiter | Any source or none; rules for whose word counts are taught |
| chat-test listens with turn-taking; three pages read aloud | X1 born | You talk, X answers, hands at rest |
| prism, market-navigator, devstream call models from the page with web search and saved evidence | X1 born, X2 feeds, X3 threads | **X 1.0: a learning system that walks** |
| devstream builds by voice; market-navigator analyses frozen evidence | X4 sentences and contexts, X5 makes and analyses, X6 acts for you | Shakespeare and quantum mechanics |

## 7. Why this is not something already out there
| Existing thing | What it does | Where X differs |
|---|---|---|
| Voice assistant | a vocabulary fixed by its maker; you learn its phrases | X's vocabulary is yours and grows from your own words |
| Chat box | every sentence starts from nothing; hands on a keyboard | what X knows acts at once; AI only at the edge of the known |
| Dashboard | everything on screen at once, chosen in advance | one thing in front; nothing chosen in advance |
| Agent | acts alone and fails often | X does what can be undone and asks before what cannot; you teach it by verdict |
| Gesture control | a fixed gesture set that drives an app's screen | signals are yours, taught, per context; they steer X, not an app |

## 8. Theories this rests on
None of these is proven. Each names the release that proves or kills it.

| # | Theory | Proven by |
|---|---|---|
| TH1 | Open listening with turn-taking works in an ordinary room without X answering things not meant for it | X1 |
| TH2 | Five commands are enough to get through a whole session at birth | X1 hand-time numbers |
| TH3 | A kept word gives a steady result when run again | X1 |
| TH4 | An AI's own web reach can return a usable list for a feed such as a subreddit | X2, first build step |
| TH5 | A signal taught from three repetitions still works the next day | V4 |
| TH6 | Hand and face finders run together on the S23 at a usable rate | S3 |
| TH7 | An X session costs the watch little enough battery to wear for two hours | W2 |
| TH8 | Recognition on the watch makes Bluetooth alone enough | W3 |
