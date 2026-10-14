# Brief: a curated translation corpus that sits in front of Google

Plain-language brief, 2026-10-10. No code. Builds on `TRANSLATION-OVERLAY-PROPOSAL.md`. Written after reading the TalkBridge Turn 29 phrasebook, the Turn 07 translation-memory spec, and chat-test's translation check.

## The idea in one paragraph

Today every sentence goes to Google and the answer is forgotten. Instead, keep a shelf of **approved translations**. Before asking Google, look on the shelf. If the sentence is there, use it: instant, free, and in the wording a native speaker approved. If not, ask Google as now, then run the back-translation check we already have. Good results become candidates; a person approves them; approved ones go on the shelf. Each approval means that sentence never needs Google again, and the system gets better with use.

## How it works for one message

1. **Fingerprint.** The sentence is cleaned (lower case, no punctuation, one space between words) and turned into a short code, for one language pair and one direction. Malay-to-English and Indonesian-to-English are separate shelves.
2. **Look on the shelf.** An exact fingerprint match is used at once and labelled "approved". A close match is used only for reviewed entries, only above a strict similarity, and only if numbers, names and "not" agree.
3. **Otherwise ask Google**, labelled "machine".
4. **Check.** Translate the answer back and compare, using the back-translation both apps already have.
5. **Candidate.** A good-looking result, or an AI-suggested fix, is saved as a candidate, never as approved.
6. **Review.** A person marks it "sounds good", edits it, or flags it. Only then is it approved.

## The life of a phrase in the corpus

- **Seed.** Start with 10 to 15 everyday phrases per language, checked once by a native speaker. Today's TalkBridge phrasebooks also seed it.
- **Capture.** Phrases arrive from real conversations, from phrasebook cards, and from accepted AI fixes.
- **Check.** The back-translation score screens out the obviously bad. It measures wording, not meaning (one real case scored 33% on a correct paraphrase), so it can never approve anything alone.
- **Review.** A person approves, edits or flags. Native-speaker corrections outrank AI fixes, which outrank plain Google.
- **Publish.** Approved entries go into one shared, versioned file per language pair, so both apps and every phone read the same shelf.
- **Use.** Every translation shows where it came from (approved, machine, AI), so a bad answer can be traced.
- **Watch.** Count how often each entry is used, how often people override it, and how often it is flagged.
- **Maintain.** Edit, retire, or merge duplicates and conflicts. Retire entries nobody uses or people keep overriding. Keep history of who changed what and when.
- **Retire or export.** Nothing is lost: removed entries go to a trash, and the whole shelf can be exported.

## What already exists

- **TalkBridge phrasebook:** cards per language pair with source, target, notes and tags; a back-translate check on each card; "Sounds good" / "Flagged" verdicts that add a Verified tag; a change history on each card; a trash; usage counts; sync through the repository with merging when two phones edit the same card.
- **Both apps:** the translation-check card (Said, Normalized, Translated, Back-translation, with a score).
- **chat-test:** an AI review that suggests a better translation, which today is used once and forgotten.

## What is missing

1. **The lookup itself.** Nothing consults the phrasebook before Google. It was specified in TalkBridge Turn 07 (similar phrase used three times gets the saved translation) but is not in the current build.
2. **One shared shelf.** chat-test has no phrasebook; TalkBridge's is per phone and per card format. They need one common format and location.
3. **A review queue.** A place where candidates wait for a person, plus roles: who may approve, and which reviewers count as native for which language.
4. **Trust levels recorded on each entry** (native, human-approved, AI-suggested, machine) and a rule for which wins.
5. **Capture from chat-test.** Accepting an AI fix should create a candidate on the shelf.
6. **Register and dialect tags.** Formal versus casual, and Malay versus Indonesian, so the right wording is chosen.
7. **Hygiene rules.** Duplicates, conflicting answers for one sentence, entries that age, and what happens when Google improves.
8. **Measurement.** Hit rate, review backlog, share verified, and how often approved entries are overridden.
9. **Privacy.** A rule for what must never be saved (names, numbers, personal details) and who can see the shelf.
10. **The seed lists.** They need native-speaker time, which only you can arrange.

## Honest limits

- It only helps for sentences people repeat. Exact matches will be a modest share of traffic at first; it grows with use and with the seed lists.
- The back-translation check is a screen, not a judge. Human review is the quality gate.
- A reviewer's taste becomes the corpus's taste, so keep reviewer names on entries and expect disagreement.
- Nothing here has been built or tested.

## Decisions I would make (change any)

- **Where it lives:** one file per language pair and direction in the repository, in the same card format TalkBridge already syncs.
- **Who approves:** you, plus named native reviewers per language; accepting in the app is the approval.
- **Matching:** exact only to start; add close matching after real use shows what repeats.
- **Order of work:** shared format and lookup (read-only, switchable) first; review queue and capture second; seed lists third.

## Beyond repeated sentences: handling colloquial and informal speech

The shelf only helps for sentences people repeat. Informal speech needs other tools, and most work with or without the shelf. Brainstorm, 2026-10-14; nothing built or tested.

**A. Fix the input before translating (cheap, small lists).**
1. **Text-speak and slang expander.** Short native-curated lists per language that turn "gonna", "u", "ko" (Vietnamese for không), "gak" or "udah" (Indonesian), "x" (Malay for tak), "555" (Thai for lol) into plain words before translation. We already do this once: the Northern Thai map. Generalize it into packs for Isaan, Taglish, Jakarta slang, Manglish and so on.
2. **Clean up spoken mess.** Drop fillers, repeats and false starts ("um, I mean, like, I'm gonna...") before translating; keep the original beside it.
3. **Mining our own cases.** Where the back-translation score is low but a person or the AI says the meaning matched (the 33% paraphrase), that is exactly a colloquialism or idiom. Collect those as candidates automatically.

**B. Give the translator context it lacks today.**
4. **Recent turns.** Send the last two or three messages with the sentence, so "it", dropped subjects and replies like "me too" resolve correctly.
5. **Register setting per conversation.** Casual or polite, and who is speaking to whom. This decides Thai particles, Korean and Japanese politeness, Vietnamese pronouns and Indonesian informal pronouns. Google tends to produce formal, textbook wording; a tone instruction is the single biggest lever for informal speech.
6. **Situation packs.** Market, taxi, restaurant, clinic: choose one in room settings so slang and wording fit the setting.

**C. Use an AI for the hard cases, sparingly.**
7. **Casual-style retranslation.** Ask an AI for a spoken, friendly version only when the sentence looks informal or the check score is low. Paid, so it stays a field-trial item (already on the backlog).
8. **Engines compared.** Ask two engines; if they disagree sharply, flag it as low confidence and show both. Agreement raises confidence.

**D. Let people steer, with one tap.**
9. **"Say it another way."** Offer two or three variants (casual, neutral, polite). The one chosen is saved as a candidate and teaches the preference.
10. **"That sounded off" and "what?"** A partner tapping clarify is a free quality signal. TalkBridge already has a clarify chain on its cards; use it as a negative signal on that translation.
11. **Meaning notes.** Tap a bubble to see "literal" versus "meant" for an idiom, so a human understands the joke rather than only reading a translation.

**E. Grow the shelf past exact repeats.**
12. **Templates with blanks.** "Where is the [place]?", "How much is [item]?", "I'm [verb]ing". One approved pattern covers thousands of variations; numbers, names and places fill the blanks.
13. **Seed from public conversational sentence pairs.** Tatoeba (short everyday pairs) and subtitle collections (very informal, noisy) can fill the shelf for review. Needs a licence check, and subtitle pairs need a human screen before anything is approved.

**F. Measure it.**
14. **A small colloquial test set.** About 50 informal sentences per language pair, rated once by a native speaker. Run every change against it, so "better" means better on informal speech, not a guess.

**What I would do first, in order:** the slang and text-speak packs (A1, A2); the register setting plus recent-turn context (B4, B5); the one-tap variants and "sounded off" signals (D9, D10); then the test set (F14) so each later idea is measured. The AI retranslation (C7) and public seeding (E13) follow once the free signals show where the gaps are.

**Limits.** Slang changes fast and differs by region, age and group, so every pack needs owners and a refresh date. Expanding slang can flatten tone. Register guessing can be wrong, which is why it is a visible setting, not a hidden rule.
