# claude-bridge.md — TalkBridge App-Specific Instructions

App-specific rules for the TalkBridge (`bridge`) project.
Process rules are in `CLAUDE.md`.

---

## Do-Not-Touch Constants

These values must never change. Modifying them breaks the relay
and all other apps sharing the same infrastructure.

```js
RELAY_BASE = 'talk-signal.myacctfortracking.workers.dev/signal'
RELAY_WS   = 'wss://'+RELAY_BASE
RELAY_APP  = 'talk-say-v1'
```

The Cloudflare relay Worker is strictly read-only. Never modify relay
behavior, relay message format, or relay connection logic.

---

## Storage Keys — Canonical Table

All stage files share the same localStorage origin and namespace.
Never rename a key. Never add version-specific prefixes or suffixes.

| Constant | Key string | Holds |
|---|---|---|
| `tb_dg_key` | `tb_dg_key` | Deepgram API key |
| `tb_cf_tid` | `tb_cf_tid` | Cloudflare TURN credential ID |
| `tb_cf_tok` | `tb_cf_tok` | Cloudflare TURN credential token |
| `RK` | `tb_recent_rooms` | Recent rooms list |
| `TP` | `tb_transcript_` | Per-room transcript prefix |
| `tb_dev` | `tb_dev` | Dev mode flag |
| `PB_CARDS` | `say_cards` | Phrasebook cards |
| `PB_CATS` | `say_catalogs` | Phrasebook catalogs |
| `PB_TAGS_K` | `say_tags` | Phrasebook tag registry |
| `PB_SEEDED` | `pb_bridge_v2` | One-time seed sentinel |
| `tb_gh_pat` | `tb_gh_pat` | GitHub PAT for PB Central write-back |
| `pwa_dismissed` | `pwa_dismissed` | PWA install banner dismissed flag |

Before committing any change that touches localStorage, confirm
every key is spelled identically across all stage files.

Note: `tb_pb_tel_ep` and `tb_pb_tel_tok` were removed in Turn 2.
Do not re-add them. PB write-back uses `tb_gh_pat` via `pbPushCardToRepo`.

---

## TTS Rules

- Never hardcode a lang string in any `speakText()` call
- Never read `room.myLang` or `room.theirLang` as TTS lang for
  phrasebook or transcript bubble buttons
- `pbSpeakCard` must always derive lang from `card.sourceLang` / `card.targetLang`
- All TTS playback routes through `speakText(text, lang)`
- No direct calls to `speechSynthesis.speak()` except inside `_doSpeak`
- CSS: `button svg, button svg *{pointer-events:none;}` must be present

---

## Icon Policy

- No emoji anywhere in the app — ever
- Every icon is a grey SVG using `stroke="currentColor"`
- The ICO object is the single source for all icons
- Adding a new icon: add it to ICO first, then reference `ICO.name` everywhere

---

## App Constraints

- Single HTML file — no split files, no separate JS files
- Joiner credentials are session-only — never write `inviteDgKey`,
  `inviteCfTid`, or `inviteCfTok` to localStorage as top-level keys
- No auto-mute on compose focus (`composeFocusMute` stays removed)
- New CSS always appended at end of style block — never injected mid-block

---

## PB Team Contract

PB Central is the live authoritative phrasebook store.
The client ingests, renders, searches, filters, and writes back.

### Write-back model
Every user CRUD action fires `pbPushCardToRepo(card, operation)` after
the local operation completes. Operations: `create`, `update`, `read`,
`softDelete`, `hardDelete`, `restore`. Fire-and-forget — never block UI.

### What the client must preserve on ingest
`catalogIds`, `backtranslate`, `confidence`, `tags`, `stableKey`,
`semanticRelationships` (pass-through, max 5 relatedIntents),
`intentId`, `primaryTag`, `parentCategory`

### What the client must not do
- Calculate semantic neighbors at runtime
- Generate tags
- Infer missing structure
- Modify `confidence` or `verdict` outside of explicit user action
- Expose a separate telemetry endpoint in the control panel (removed)

---

## Git Rules

### The only rule: commit and push to main

GitHub Pages serves only from `main`. Nothing is testable until
it is on `main`. There are no feature branches in this repo.

```bash
git add -A
git commit -m "describe what was done"
git push origin main
```

Verify after every push:
```bash
git log --oneline origin/main..main
# Must be empty. If not empty, push again.
```

### Session start

```bash
git fetch origin main
git rebase origin/main
```

### If the push is rejected

```bash
git fetch origin main
git rebase origin/main
git push origin main
```

Never force-push. Never push to a feature branch and expect it to deploy.

---

## Lessons Learned

These rules exist because they were violated and caused real problems.

**1. Always push to main — not a branch.**
GitHub Pages deploys from main only. Pushing to any other branch
produces zero visible result. If you cannot see your changes at the
live URL, check `git log --oneline origin/main..main` — if it is not
empty, you have not pushed to main.

**2. Never run parallel agents.**
Running two agents simultaneously on different files burns context
budget at double speed and causes the session to freeze mid-work with
files in an unknown partial state. Serial execution only.

**3. Version stamps must appear in two places.**
HTML comment on line 2 AND the footer span. Missing either means
the version is inconsistent and hard to audit.

**4. Update the progress tracker after every stage.**
The plan file is the record. If the tracker is not updated, the next
session cannot tell what was completed.

**5. grep is not verification.**
A function existing in the file does not mean it works. A feature
is not verified until a human has tested it on a real device.

**6. One file per response without exception.**
Editing two files in one response, even for a "trivial" change,
has historically led to partial application and hard-to-debug state.

**7. Read the plan before touching anything.**
Every session must read CLAUDE.md, claude-bridge.md, and the current
turn plan before making any edit. Skipping this leads to changes that
contradict the plan or violate constraints.

---

## The Rejoin Bug — What It Was and How It Was Fixed

*(Written in plain English for future reference. The technical fix lineage
is in `bridge-turn02-plan.md`.)*

### What the bug was

When two people finished a call and both landed on the "goodbye" screen,
there was a **Rejoin** button. It looked like it should work. It did not.
Clicking it would bring up the call screen but the two people would never
see each other. This had been broken for a long time.

### Why it was so hard to find

The code *looked* correct. There was a rejoin function. It ran without
crashing. But four separate things were wrong at the same time, each one
enough to break the reconnection on its own. You could fix one, test, and
still see failure — because another was waiting behind it.

### The core problem: the creator was walking into a new room

Every TalkBridge call lives in a "room" — think of it as a private meeting
space with a unique room number, like a hotel room. When you create a call,
you get room #12345. Your friend joins by following a link that says
"come to room #12345." Everything connects because you're both at the same
door.

When the call ended and the **creator** clicked Rejoin, the app was
treating it like starting a *brand new call from scratch*. It generated
a completely new room number — say, #67890. Meanwhile, the joiner's saved
link still said room #12345. Two people. Two different doors. Neither
could hear a knock from the other. The connection was impossible before
it started.

### The other problems underneath

Even once the room number was fixed, three more problems were hiding:

**The goodbye screen auto-closed before anyone could click Rejoin.**
The app had a 5-second countdown that closed the window automatically.
On some devices it fired instantly. You'd see the goodbye screen for
half a second and then it was gone. Nobody could click the button.
This was fixed first — the countdown was removed entirely.

**The video connection wasn't being properly cleaned up.**
After a call ends, the underlying WebRTC video pipeline needs to be
fully reset — like clearing a whiteboard before writing on it again.
The host's side was doing this correctly. The guest's side was not.
When the guest tried to rejoin, the new video stream was being added
on top of the old, half-dead one. The screen would stay black even
though the connection technically succeeded.

**Nobody was sending the first handshake when the joiner came back.**
WebRTC (the technology behind browser video calls) works like a
job interview: someone has to send a "here's what I can do" offer first,
and the other side sends back "here's what I can do" in reply. In
TalkBridge, the creator always sends the offer. But when the joiner
hung up mid-call, the creator's "offer" for that session was thrown
away. When the joiner came back, the creator was sitting in the room
with no offer prepared, waiting for something to happen. Nothing did.

### The five fixes, in plain English

**Fix A — Clean up properly on both sides.**
When the host ends a call, the video pipeline was already cleaned up.
When the *guest's* side of the goodbye screen appeared (host ended call),
it was not. Added the same cleanup call to both paths so they're
symmetric. Think of it as: both people push their chairs in when they
leave the room, not just one of them.

**Fix B — Belt and suspenders.**
Even after Fix A, added an extra safety check: just before starting a
new video connection, always explicitly wipe any leftover state. If the
whiteboard was already clean, wiping it again costs nothing. If somehow
something was left behind, this catches it.

**Fix C — Guest rejoining now follows the same path as the original invite link.**
When the guest first joined, they clicked a share link. That link triggered
a specific sequence: load credentials, reset state, show the joining screen.
The rejoin button was using a different, shorter path that skipped all that
setup. The fix was simple: make the Rejoin button do exactly what clicking
the original share link does.

**Fix D — Creator prepares a fresh offer the moment the guest leaves.**
The moment the guest hangs up, the creator now immediately prepares a new
connection offer and holds it ready. So when the guest comes back — whether
30 seconds or 5 minutes later — the offer is already waiting. The guest
sends "hello," the creator instantly replies with the offer, and the
connection handshake completes in seconds.

**Fix E — Creator remembers which room they were in.**
Instead of generating a new room number on rejoin, the creator now saves
their room number to memory when the call starts and re-uses that same
room number when they come back. One room. Both people's keys still fit.

### The mental model that unlocked the fix

> **One room. Two doors. Two keys.**

The room ID is the call. It never changes. The creator's key is their
saved room ID. The guest's key is the invite link. As long as both people
use their original key to open their respective door, they end up in
the same room — regardless of who arrives first.

All five fixes were required together. Any one missing and reconnection
fails. With all five in place, every case works: guest leaves first,
creator leaves first, both leave, either one rejoins first.

