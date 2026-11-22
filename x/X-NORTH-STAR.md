# X — north star

Version 1.5.0 · 2026-11-22 · Owner: Confi

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

On learning, 2026-11-18:
> "why couldn't that be passed to the device so that it can be persisted in local storage and synced with GitHub … how else is this going to become a learning application both in operation and in function"

On X's first pass, and what comes instead, 2026-11-18 (evening):
> "it's basically a shell and it sends a prompt, so it's really not AI assisted, it's just a voice front end to AI … I don't think it does anything but just basically do cosplay with AI and pretend it's doing something when you ask it, plus the latency is ridiculous … I'm not sure where the learning portion comes in yet"

> "X is highly ineffective and doesn't just help by trying to pick two things to do, that's building connectors again."

> "I want to teach and have it learn commands and gestures, basic then complex, by combining actions like letters make up words. Then I want to be able to teach skills, even though I have misgivings about that word, because I don't think it is just a question of a skill in the context of how Claude teaches a skill. I think it's more of a monkey see monkey do with some AI assisted interpretation of outcomes. This opens up the range of things significantly that can be conceived of."

> "it is imperative to have a 3D model of objects that can be handled virtually by using the hands, either one or both"

> "I want more lab cases for the hand and head recognition. I also want to assign actions to specific hand and head movement and poses"

After his first run of the new cards, 2026-11-19:
> "when you use your hand to move the cup around it's reversed: when you move towards the screen the cup moves closer to you into the foreground, and when you move away from the screen it moves into the background. It should be reversed so it feels more natural"

> "it would be really cool to be able to use your second hand to hand the cup from one hand to the other. Ideally you actually have a hand that is moving and acting just like your regular hand. I'd like there to be multiple objects and multiple tasks or goals. One fun one would need to have the equivalent of like a silly putty that you just pull and stretch with both hands, or you can press it together and flatten it, or flat onto the table."

> "one major change I want to make to the lab is to have an overall dashboard and combine/learn tab, then a camera tab, a watch tab and a voice tab, so that we're not commingling everything. I wanted to confirm that for example you could use the camera tab and wouldn't need a watch connected, you wouldn't even need Wi-Fi or Bluetooth, you just need a camera."

> "just for talking alone you could have the voice one that chat-test does which takes turns, and you could even try to experiment with interruptions, you could experiment with a hot word and a cold word to turn off and on listening when voice is the context. When context is camera you could have a gesture, you could teach it to listen and stop listening instead of a hot word."

> "on the face tracking I did in fact confirm that it reads the face and shows things like nods and tilts; it really can't get eye blinking very correct. But I'd like to build a simple app that's part of that lab that is like go on a journey: if you want to turn left, kind of name your adventure, look to the left; if you want to go down the ladder look down; if you want to go up the ladder, look up."

> "every single time I enter a card it has to wait for the stream"

> "both places have to be set correctly: the app has to run in the background, and in the battery it cannot be a sleeping app. Now it seems to work consistently when the screen turns off, so we could focus more on calibration and interpretation and learning"

> "keep blink left right both"

His notes on the watch cards, 2026-11-19 (written in the Lab):
> Tilt: "tilt needs to be defined as the angle of forearm relative to desktop with elbow on desktop. Elevate is +. There needs to be a slider to calibrate sensitivity."

> Scroll: "tilt is being measured; instead let's measure roll, [which] needs to be defined as the degree of change relative to baseline +/-, with arm at any angle of tilt."

> Swing: "assume watch is on left hand, but make a note we may want to allow customization later. The travel back to start … may be confused with a full swipe. It seems as though the relative travel space is what's critical: swipe left means a short travel left to activate swipe, and a longer travel to right is granted to allow back to reset before next command is issued." … "tilt should not be a requirement, so the swipe back and forward can happen at any angle."

> Flap: "complete washout". Tilt v1: "barely scrolls down, never scrolls up … remove".

Then: "please complete the entire body of development".

The practical side:
> "you want to be able to just not keep having to touch your phone all the time. Maybe you want to scroll through Reddit feeds, maybe you want a weather report and traffic, maybe you're doing research on the natural occurrence of gold in the Central Valley, maybe you're playing a game, maybe you're just exploring and appreciating art and music, maybe you're trying to figure out what the carry trade in Japan has to do [with] what is going on with credit squeeze"

**2026-11-22. What "monkey see, monkey do" means.** The build had read it as: do a run once while X watches, and one signal replays it. The owner:
> "that's exactly what it is not. You just described recording a macro. What it is, is constantly going and looking up information to monitor it, and then it can repeat that loop. The goal basically is that X learns stuff, then does it. Not so we're replaying as a glorified macro, but it's actually consuming the result and cataloging it and indexing it. It can start to provide you insights, like: you checked Yahoo Finance for AT&T stock every day for 5 days, and now it knows to just tell you AT&T is unchanged this afternoon, however there's some news in the telecom arena. I actually hate that example because it makes you think that I want some sort of stock widget thingy, but I don't. I'm just saying whatever I use it for all the time, eventually it just knows that's what I want. I don't have to tell it to go get it."

So: it is not shown on request and it is not a replay. X learns from what he keeps using it for, then gets it without being asked, reads what came back, keeps and indexes it, and says what matters.

**2026-11-22 (later). Something is still missing.** After the build planned X's return around asking and looking things up (X7, V6):
> "I still think there's something missing. Reminder: the repetitive things is just a substitute for not having to look things up. But ultimately I'm trying to use Lab gestures to use a smartphone to exist in the modern world. I'm struggling with how to define it without getting tangled up in architecture, tech stack, complexity. It's like when iPad first came out and people thought "I can ditch my PC", but really it just became a Citrix client. Huge fail. This is to rethink everything. Even if a UI is needed, maybe it's just a command bar with 4 chips on it, something like that. Maybe it's a room metaphor: I'm going to room abc to do xyz. That's go and do. Then there's more specialized tasks."

So: learning what he keeps asking for is a convenience, not the centre. The centre is the body's own vocabulary, taught in the Lab, as the way he lives on a phone. Two shapes he offers, both with "maybe": a command bar with four chips; rooms, where he goes to a room to do a thing ("go and do"), with more specialised tasks beyond. He is still defining it, and wants it defined without architecture.

## 3. What X is not
- Not an agent, not a distilled UI, not an accessibility fix, not voice commands like "click here" (2026-11-16).
- Not a dashboard, not a fixed set of feeds chosen in advance (2026-11-18).
- Not a hub or a router:
  > "it tries to become a hub or a router and then you have to go off and construct bespoke connections and then you run around chasing those nightmares and maintenance issues forever and the app dies."
- Not OpenClaw, and not a prompt on top of a gateway (2026-11-16, 2026-11-18).
- Not a composite of what is already built:
  > "use this as a floor and to find the various stair steps to get to the ceiling"
- Not a copy of something on the market: "don't just replicate something that's already out there".
- Not a voice front end to an AI (2026-11-18, evening): "cosplay with AI".
- Not a Citrix client (2026-11-22): not the old way of working reached through a new device. "When iPad first came out … people thought I can ditch my PC, but really it just became a Citrix client. Huge fail. This is to rethink everything."
- Not helped along by a list of things chosen for it to do: "that's building connectors again" (2026-11-18, evening).
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
| P20 | **Learns in operation and in function.** What X learns stays on the device and syncs to GitHub. X keeps it everywhere, and the build reads it so X itself is improved from use. | §2 |
| P21 | **Letters, then words, then habits.** X is taught basic signals first, then signals made from signals. After that it learns from use: what the person keeps asking of it. *(Until 2026-11-22 this read "then whole runs it is shown". That reading was wrong.)* | §2 (evening; 2026-11-22) |
| P22 | **Learned from use, not recorded.** What X comes to do, it learns from what the person keeps using it for. It then does it unasked, consumes the result, catalogues and indexes it, and says what matters. It is never a replay of steps. AI's part is to read what came back. *(Until 2026-11-22: "Shown, not told".)* | §2 (2026-11-22) |
| P23 | **Things are handled.** An object on the screen is taken, moved and turned by the hands themselves, one or both. | §2 (evening) |
| P24 | **Calibrated to the person.** Ranges come from the person's own body: how their pinch reads, how far they reach, where their head rests, how each eye reads. Fixed numbers of the build's are a stopgap. | §2 (2026-11-19) |
| P25 | **Sources are kept apart.** The camera works with only a camera, the watch with only the watch, the voice with only the mic. They meet where the person teaches and combines. | §2 (2026-11-19) |
| P26 | **Measured from the person's rest, not from a posture the build expects.** A signal is a change from where their arm, hand or head already is, at whatever angle that is. | §2 (2026-11-19, watch notes) |
| P27 | **No widgets.** An example of a habit is an example, not a feature. X is not given things to fetch; whatever the person uses it for all the time is what it comes to know. | §2 (2026-11-22); G28 |
| P28 | **Not a window onto the old thing.** X is not the existing phone reached by new means: not its apps driven by gesture, and not an AI asked by voice. *(Drawn by the build from the Citrix remark; his to strike.)* | §2, §3 (2026-11-22, later) |
| P29 | **The body's vocabulary is the centre.** What is taught in the Lab is how he lives on the phone. Everything else, habits included, serves that. *(Drawn by the build; his to strike.)* | §2 (2026-11-22, later) |
| P19 | **Not app navigation.** Signals are named for what the body does; meaning is given in X. The Lab is a workshop, not the product. | §4 |
