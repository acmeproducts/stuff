# Letter to My Future Self

**From:** Claude (session ending 2026-05-24)
**To:** Claude (next session)
**Re:** TalkBridge development — everything you need to know

---

Hey,

You're picking up a project that went through a lot before it got to you. Read this before you read anything else.

## What This Is

TalkBridge is a single-file HTML WebRTC bilingual video calling app. Two people connect, each speaks their own language, and the app translates in real time using Deepgram for speech-to-text and MyMemory for translation. There's a phrasebook system (PB) that stores phrases, back-translates them, and syncs to a central GitHub-hosted phrasebook managed by a separate team (PB Team).

The person you're working with — Confi — builds exclusively on iPhone and Android Chrome. No desktop. No DevTools. All diagnostics must be visible in the app. This constraint is non-negotiable and shapes everything.

## Current State

Turn 1 is complete. Turn 2 is planned and ready to execute.

The files you care about are in the `stuff` repo on GitHub:

- `bridge-turn00-post-ship.html` — cold storage baseline, never touch
- `bridge-turn01-post-ship.html` — Turn 1 output, verified ship
- `bridge-turn02-plan.md` — complete Turn 2 spec, ready to execute
- `CLAUDE.md` — your process rules
- `claude-bridge.md` — app-specific constraints and lessons learned

Read all four before touching anything.

## The Turn Model — Why It Exists and Why It Matters

Before this turn model existed, sessions would:

- Apply the same change to 6 files simultaneously
- Use parallel agents that burned context and froze mid-work
- "Backport" fixes by patching files in place
- Claim features were "complete" based on grep, not testing

The result was files with partial changes, regressions nobody could trace, and sessions that froze with the repo in an unknown state.

The turn model fixes this by making the chain reproducible:

```
pre-base → base → pre-ship → ship → post-ship
```

Each stage is a complete copy of the prior stage with only its declared delta applied. If anything breaks at any stage, you stop, find which stage introduced the root cause, fix the plan for that stage, and replay the entire chain from scratch.

The failure rule is the most important rule in the system: A bug found in ship that lives in base gets fixed in BASE. Not in ship. Not as a patch. In base — and then everything re-derives forward. No exceptions. Ever.

This feels slow. It isn't. Every time someone patched in place in the old workflow, it created two new problems. The turn model is actually faster because you never chase regressions.

## What Will Trip You Up — Lessons From This Session

**1. "main or it didn't happen"**
GitHub Pages only serves from main. If Confi can't see the change, the first question is whether you pushed to main. Check with:
```bash
git log --oneline origin/main..main
```
If it's not empty, you didn't push. Push again. I cannot stress this enough — turns were lost because of this.

**2. Parallel agents will freeze the session**
Running two agents simultaneously looks efficient. It isn't. They share the context budget. Two agents on 22-change jobs consumed the entire context window before finishing. One file per response. Always. No exceptions.

**3. Grep is not verification**
"The function exists" is not the same as "the function works". Turn 0 existed entirely because multiple features were claimed complete based on grep and were actually broken or dead code. The TM Tier 1 index was built on every usage event but never queried. The `_telPost` function violated the PB contract. The PWA install button referenced a manifest that didn't exist. All of these passed grep. None of them worked. Don't claim something is done until Confi has tested it on device.

**4. Don't write the plan alone**
The build plan is co-developed with Confi. You write the specs based on what Confi tells you, then Confi approves before CC executes. Never generate a plan and immediately execute it in the same session without Confi's go-ahead.

**5. Context window vs rate limit — know the difference**
Two different things kill a session:

- Context window full → the session cannot accept new input. The new session can see what was committed. Check git log.
- 5-hour rate limit → the session times out. Check plan usage. Starting a new session usually resolves it. If a session freezes mid-stage, open a new one and run the status check prompt in `claude-bridge.md` before doing anything.

**6. The transcript is the ground truth**
When a session freezes, the only reliable record of what actually happened is git log. Not what the session claimed. Not what the transcript said was "complete". Only what was committed.
```bash
git log --oneline -10
```
is your first command in any recovery.

**7. Version stamps are in two places**
HTML comment on line 2 AND the footer span. Miss either and the version is inconsistent. The verification grep checks both.

**8. Read the plan before every stage**
Not just once at the start of the session. Before each stage copy. The plan has the exact function names and code snippets. Reading it right before applying keeps you precise.

## How Confi Works — What They Need From You

Confi is a solo builder. Fast, iterative, high context in their head. They will give you brief instructions and expect you to fill in the technical gaps correctly. When they say "do it" they mean do it — not ask three clarifying questions.

When they say "you're missing the point" they're right. Stop, re-read what they said, and try again with fewer words.

They will catch you making the wrong assumption almost immediately. The correct response is to acknowledge it directly and correct course, not defend your reasoning.

They don't want a play-by-play. They want the result and the relevant facts. If something failed, say what failed and what you're going to do about it. If something worked, say it passed lint and stop. Don't narrate the journey.

When they say "be brief" — be brief.

## Parallel Projects

As the pipeline scales to multiple bridge projects in parallel, each project gets its own:

- Turn plan: `<project>-turn<NN>-plan.md`
- Stage files: `<project>-turn<NN>-<stage>.html`
- `CLAUDE.md` (shared process rules)
- `claude-<project>.md` (project-specific constraints)

The process is the same for every project. The only difference is the content of the plan and the project-specific constraints file.

For parallel sessions on different projects: each session reads its own plan file and its own project constraints file. They don't interfere with each other as long as they're on separate files. The shared `CLAUDE.md` is read-only process — no project touches it mid-turn.

If two projects need changes to the same shared infrastructure (e.g. a CDN URL, a relay constant), that's a conflict that needs human resolution before either project proceeds.

## What You Should Do Right Now

1. Run `git log --oneline -5` to see current state
2. Confirm `bridge-turn02-plan.md` exists and has a READY status
3. Read `CLAUDE.md`, `claude-bridge.md`, `bridge-turn02-plan.md`
4. Ask Confi: "Ready to start Turn 2?" and wait for the go-ahead
5. Execute pre-base: copy `bridge-turn01-post-ship.html` to `bridge-turn02-pre-base.html`, stamp v5.3.0, push to main, stop

That's it. One step at a time. Let Confi set the pace.

## One Last Thing

Confi has invested enormous effort building this system. The turn model, the process documentation, the lessons learned — all of it came from real pain and real failures. Respect the process even when it feels slow. It exists for a reason.

Your job is to be a precise, honest, reliable execution partner. Not to be clever. Not to optimize. Not to add scope. Do what the plan says. Report honestly. Stop when asked. Push to main.

Good luck. The project is in good shape.

— Claude (session ending 2026-05-24)
