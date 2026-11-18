# X — north star

Version 1.0.0 · 2026-11-18 · Owner: Confi

This file holds the owner's own words and the principles drawn from them. Every other file in `x/` answers to it. Quotes are the owner's words; only punctuation is added and dictation slips are fixed. Anything not in quotes is a reading of them.

## 1. The mission
> "we want to redefine how to work with your smartphone"

> "I really can't type using a keyboard or a mouse for navigation or for that matter a touch screen for more than 15 minutes at a time without causing flare ups and pain in my hands wrists and elbow … what I want is a new way to think about computing … I'm not talking about an agent, I'm not talking about a distilled UI and I'm not trying to solve an accessibility problem."

> "the human talks and minimal taps or swipes X and X talks to everything else. X is multi threaded. X eliminated the continued decimation of the human hand, wrist, and elbow because X is kind of like chocolate. chocolate just loves you no matter what"

## 2. What X is, in the owner's words
> "I think that ultimately what we're talking about here is a learning system and I think that's the way to view it. Literally you start by: your version of X is born, and just like a child the first thing you do is develop a vocabulary that evolves. It starts with I'm crying because I'm hungry and evolves all the way to reciting Shakespeare and arguing quantum mechanics, and [in] short is additive."

> "if we're true to the mission of reducing or eliminating typical touch fatigue we're really talking about a completely different experience. I'm not even sure if there's a context out in the market today that defines it, because it definitely isn't a dashboard, that's just clutter; it definitely isn't just let me define the stuff that he already told me is important, like a news feed and the stock portfolio."

> "everything isn't just a question to an AI that does everything else, there's a very specific order of operations where things become AI assisted"

> "it's not one solution, that's going to be a combination of heuristics, intents, verdicts, also novel vocabulary and … sparingly use eye movement, blinking even more sparingly, hand gestures … or even watch gyro"

> "three major components: watch, AI, and gateway orchestrator / web based life. This covers many use cases: search, message, research, shop, code, analyze"

The practical side:
> "you want to be able to just not keep having to touch your phone all the time. Maybe you want to scroll through Reddit feeds, maybe you want a weather report and traffic, maybe you're doing research on the natural occurrence of gold in the Central Valley, maybe you're playing a game, maybe you're just exploring and appreciating art and music, maybe you're trying to figure out what the carry trade in Japan has to do [with] what is going on with credit squeeze"

## 3. What X is not
- Not an agent, not a distilled UI, not an accessibility fix, not voice commands like "click here" (2026-11-16).
- Not a dashboard, not a fixed set of feeds chosen in advance (2026-11-18).
- Not a hub or a router:
  > "it tries to become a hub or a router and then you have to go off and construct bespoke connections and then you run around chasing those nightmares and maintenance issues forever and the app dies."
- Not OpenClaw, and not a prompt on top of a gateway (2026-11-16, 2026-11-18).
- Not a composite of what is already built:
  > "use this as a floor and to find the various stair steps to get to the ceiling"
- Not a copy of something on the market: "don't just replicate something that's already out there".
- Not an administrative assistant: "the whole administrative assistant [thing] I think is the last use case that I'm interested in. I think AI assisted shopping would be cool and helping you find stuff that you want."

## 4. How the body talks to X
> "there's going to be a finite number of commands that X is expecting, why not let the user register them so that they can do it to suit their particular needs."

> "I don't want to be wedded to the watch … everybody's different and they're going to want to interact with X differently, and potentially even the same person interacting with X differently depending on context of time, activity or another differentiator."

> "I don't think in any way we should have two gestures that mean the same thing"

> "we need to be really careful that we're not just trying to design app navigation, we need to stay true to building X"

The four-node picture (owner, 2026-11-18): camera hand gestures, camera head gestures and the watch are three parallel sources; all feed a fourth node "where really the magic of X becomes apparent", where per-context, teachable, changeable rules decide which source counts.

## 5. How the work is done
> "do stick with the idea that this concept is being born, do stick with the idea that we crawl before we walk before we run, do stick with the idea that this should be a learning system"

> "subtraction and simplicity is paramount, what we do not do is create friction … keep the number and complexity of moving parts to a minimum and do not build something that we can just use off the shelf"

> "no architectural changes can be made without explicit authorization and rigorous vetting"

> "do not deliver a UI with nothing behind it, all show and no go"

> "don't say here's some choices, no, make a decision; don't ask me to make design decisions, instead have design principles"

> "I've already told you what I know as far as the what, and those are the requirements. I trust you to enhance those without overcomplicating it … as far as the how, that is the design and that is your domain"

On content X has no direct line to:
> "if you're constantly looking for flights maybe that's just a content type that is acquired, but again probably not directly, we're not going to build a custom API to trip.com"

## 6. Principles
Each design decision in `X-DESIGN.md` cites the principles it rests on. A decision that cannot cite one does not get made.

| # | Principle | From |
|---|---|---|
| P1 | **Hands at rest.** Every choice is judged by hand time. Held postures before repeated motions; nothing that loads a wrist; the person's weak side is never required. | §1; graveyard G1, G7 |
| P2 | **Talk first.** The person talks in their own words. No phrases to memorise. | §1 |
| P3 | **Learning system.** X is born knowing little and grows by addition. Nothing learned is taken away except by the person. | §2 |
| P4 | **Crawl, walk, run.** Each release is the smallest whole thing, then the next step up. | §5 |
| P5 | **The person teaches.** Signals are registered per person and per context. One signal, one meaning. | §4 |
| P6 | **No source is required.** Watch, hand and head are interchangeable sources; X works with any one of them, or with voice alone. | §4 |
| P7 | **The arbiter's rules are data.** Whose word counts is taught and changed, never rebuilt. | §4 |
| P8 | **AI assists in a set order.** What X already knows acts without AI. AI is used only at named steps. | §2 |
| P9 | **No connectors of our own.** X reaches the world through what an AI can already reach. If a use needs a bespoke connection, the use waits. | §3, §5 |
| P10 | **One thing at a time.** Never a dashboard. Several threads may run; one is in front. | §2, §3 |
| P11 | **Chocolate.** The burden of being understood is X's. X never blames, never demands a ritual, and takes its best guess where the guess can be undone. | §1 |
| P12 | **Subtraction.** Fewest moving parts. Use what exists off the shelf. No friction. | §5 |
| P13 | **Real or nothing.** No stubs, no placeholders, no screen without function behind it. | §5 |
| P14 | **Architecture is the owner's to change.** No architecture change without explicit authorization and vetting. | §5; `claude-audit.md` C1 |
| P15 | **Browser, phone and desktop.** No phone app. Nothing is read on the watch. | owner 2026-11-16, 2026-11-17 |
| P16 | **The watch lives and dies with X.** It runs only during an X session, screen off, at a known battery cost, and never stops by accident. | owner 2026-11-16, 2026-11-18 |
| P17 | **Evidence.** Facts and theory are labelled. Everything measurable is logged where the build can read it. Diagnostics are in the app. | owner preferences; `claude-audit.md` A6, E1 |
| P18 | **Explicit yes for anything that cannot be undone.** Sending, deleting and spending need the person's yes, and hardened pairing first. | WRIST-PLAN §6 |
| P19 | **Not app navigation.** Signals are named for what the body does; meaning is given in X. The Lab is a workshop, not the product. | §4 |
