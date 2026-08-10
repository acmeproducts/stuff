<!-- TALKBRIDGE-PLAN v10.7.0 -->
# TALKBRIDGE MASTER PLAN v10.7.0

**Location:** `talkbridge/TALKBRIDGE-PLAN-v9.md` in `acmeproducts/stuff`.
**Supersedes:** v8.5.0 (inside `TALKBRIDGE-MASTER-PLAN-v7.html`) and SOT v1's
Part 17 release chain. Both remain in the repo as history; where they conflict
with this document, **this document wins.**

**Owner:** Confi — sole decision-maker, runs every device gate.
**Builder:** Claude — builds, gates, pushes, maintains this plan and the graveyard.

---

## 0 · READ FIRST — the authority order

When sources disagree, resolve in this order and stop at the first that answers:

1. **The graveyard** (`TALKBRIDGE-GRAVEYARD.md`) — vetoes any approach buried there.
2. **This plan** — sequence, scope, naming, protocol.
3. **`TALKBRIDGE-SOT-v1.md`** — behaviour of surfaces, parts 1–14.
4. **`TALKBRIDGE-MASTER-PLAN-v7.html`** — Part 3 element inventory, Part 14 item
   list 1–83, Part 17 chrome/mic spec.
5. **`TalkBridge-Build-Specification.md`** — principles P1–P8.
6. **`AMPUTATION-INVENTORY.md`** — what was lost on 2026-07-09 and what has been
   recovered.

An owner ruling in session outranks all six, and must be written into this
document in the same session or it does not exist.

---

## 1 · OPERATING PARAMETERS — the things that keep this safe

These are not aspirations. Each is either mechanically enforced by the build, or
it is a hard stop.

### 1.1 Every session starts here
- Read this document. Read the graveyard.
- Ask for the PAT (it rotates; never cached, never policed).
- State the current baseline file and the next release's input and output before
  writing anything.

### 1.2 Scan the graveyard against the base — MECHANICAL FAILURE IF SKIPPED
Before building, check whether the approach being used is buried. A buried
approach carried forward has already happened once (the in-call subtitle
protocol) and cost a full release. **A graveyard entry written after an
amputation does not veto the pre-amputation original** — check the date and the
lineage before applying it.

### 1.3 Declare before building — ENFORCED BY `build/contract.mjs`
Every source part carries a contract naming exactly what it **replaces**,
**wraps**, and **adds**. The build extracts what the part actually did and fails
on any difference. It also fails on any call a replaced function no longer
makes, and says so by name when that behaviour has left the build entirely.
This is the projected-versus-actual diff. It runs ahead of the tests.

### 1.4 Hook, never replace
A part wraps a function and calls through to the original. Downstream effects
survive by construction rather than by anyone remembering them. **Replacing a
function that other behaviour depends on is forbidden** — that is what broke
read-aloud in turn 15. Leaf functions with nothing hanging off them may be
replaced, declared as such.

### 1.5 Assert what fires, not only what returns
Tests must check downstream effects. Return-value tests passed a real regression
straight through to a phone.

### 1.6 Instrument first when the cause is unknown — HARD STOP
Put debug statements on the whole path and read the log. **Do not declare a root
cause from reasoning.** That has been done repeatedly and been wrong every time.
Say plainly when something is undiagnosed.

### 1.7 Mutation-test every gate
Deliberately reintroduce the defect and confirm the tests fail. A suite that
catches nothing is worse than none. Twice already a test has passed while the
thing it claimed to test did nothing; both times the fix was to pull the logic
out of a handler so it could actually be called.

### 1.8 Verify, don't infer
State only what a log or a test proves.

### 1.9 The gate is two physical phones
"It lints", "it compiled", "all checks green" — none of these is done. Green
means **allowed to push**, never done.

### 1.10 On gate failure
Rollback → graveyard entry with version bump → plan version bump → rebuild from
the clean input. **In that order. Never patch forward.** Rebuild to the same
output filename from the same input; the chain never renumbers on failure.

### 1.11 One surface, one release
If two things cannot be tested independently, they are one release. If a release
would touch a surface a later release also touches, they are the same release.

### 1.12 No stubs, no fake data, no partial interfaces
Every release delivers real, cumulative, working value.

### 1.13 Mute is total
No transcription, no transmission, no bubbles. Not a comfort toggle.

### 1.14 The chat surface and the call transcript are ONE transcript
Calls are a live-media layer over it. The transcript, compose strip and
phrasebook move together and are never split across releases.

### 1.15 Phrasebook
Two direction-specific books per language pair. GitHub is the source of truth;
local storage is a disposable cache. The app never manages version numbers — it
overwrites in place.

### 1.16 Credentials are the only mechanism for capability
There is exactly one thing that makes a device initiator-capable: valid
credentials in its local storage. Never build permission flags, enforcement
paths, or read-only modes.

### 1.17 Cosmetic work goes last
Standing rule. Cosmetic-only work with no functional impact sits behind the
structural releases, not folded in as it is found.

### 1.18 Response discipline
Result only. No play-by-play, no narration of tool calls or diffs, no function
or variable names in prose, no self-congratulation about process.

---

## 2 · FIXED INFRASTRUCTURE — never modify

| Thing | Value |
|---|---|
| Relay | `wss://talk-signal.myacctfortracking.workers.dev/signal` |
| Relay app | `talk-say-v1` |
| TURN token id | `6ae776dc0b1df1b7ced8e6c4c6747e56` |
| Deepgram key | local storage `tb_dg_key` |
| Phrasebook store | `acmeproducts/stuff` under `/phrasebook/` |
| Language model | `/fastType/` — absolute paths, resolved against the app location |
| Pages | deploys from `main` root, live in ~1 minute |

GitHub: Contents API only, never the raw CDN for verification. Fresh file SHA
immediately before every write. Verify a push by reading the blob back at the
exact commit SHA returned. Large files need the two-step fetch.

---

## 3 · NAMING AND THE CHAIN

Stage names cycle within a turn family: `pre-base` → `base` → `pre-ship` →
`ship` → `post-ship`, then the next turn number begins again.

**Every stage name is a real, running, gated release output.** It is not a phase
inside a release, and not a reference-only donor file. One release produces one
output file. The names carry no meaning beyond position — they exist so the
chain reads in order and so any build can be reached by editing the address bar.

A release is built only from its named input, and only after that input has
passed its own gate.

---

## 4 · BASELINE AND VERIFIED STATE

**Baseline: `bridge-turn24-pre-base.html` — device-passed 2026-08-07. Rollback floor.**

Passed to date: room card and home screen · joiner shell · room lifecycle and
elevation · call and network robustness · room menu surface · read receipt
delivery.

Verified present in turn22 by direct inspection:
chat mic · strip states · room drawer · phrasebook surface · appearance ·
Ear / auto-read · call engine with staged recovery, glare handling, keepalive,
ICE restart · session-generation guard · multi-language transcription ·
dual English channel with pre-amputation arbitration · language detection via
the repo model · Northern Thai overlay · speech-sequence continuity across
reloads · source-language normalization law.

Verified absent in turn22:
room/thread name field · room card three-row layout and per-kind badge
tracking · elevation, grant link, expiry · per-room export.

The mic level meter **is present and working** — live analyser, clipped fill,
off state. An earlier draft of this plan listed it as missing; that was a failed
keyword search reported as a finding, not a verification.

Built but never proven on a phone (they ride the next gate):
Northern Thai overlay · dual English channel · source-language law.

Undiagnosed, instrument before fixing:
transcription disconnect roughly every 12 seconds during a call ·
approximately 30 second initial delivery lag when the recipient is on the home
screen.

---

## 5 · THE CHAIN

| # | Input | Output | Scope | Visible |
|---|---|---|---|---|
| 1 | `bridge-turn22.html` | `bridge-turn23-pre-base.html` | **Room card and home screen.** The card built to Part 4 — see §6a. Three separately-tracked activity counts. Home screen waiting-only cards, summary line, dismissal rules. **Nothing is lifted:** `bridge-turn10-pre-base.html` holds a seven-column grid with a tap-to-reveal popover that Part 4 supersedes, and `bridge-turn11-pre-base.html` has no card. Build to the spec. | Yes |
| ~~2~~ | — | — | **Relay stability — dropped.** Instrumented, then overtaken: the joiner shell passed its two-device gate with chat flowing both ways, so the drops seen earlier were not a blocker. Not scheduled. If they return, instrument first. | — |
| ~~3~~ | `bridge-turn23-pre-base.html` | `bridge-turn23-base.html` | **Joiner shell — PASSED 2026-08-05.** Full shell, no create control, credential-gated. The invite is authoritative for both languages and the room name, and is refused for a room this device created. | Yes |
| ~~4~~ | `bridge-turn23-base.html` | `bridge-turn23-pre-ship.html` | **Room lifecycle, naming, elevation — PASSED 2026-08-06.** Naming, grant link, granted credentials under their own keys, expiry, soft delete revoking and restore reinstating, notices and send-lock. | Yes |
| ~~5~~ | `bridge-turn23-pre-ship.html` | `bridge-turn23-ship.html` | **Call and network robustness — PASSED 2026-08-06.** Everything that keeps a live session alive, in one place. Scope in §6d. | No |
| **6** | `bridge-turn23-ship.html` | `bridge-turn23-post-ship.html` | **Room menu surface — NEXT.** Tab restructure, transcript lifecycle (export / import / clear), room-name parity, and two transcription-lifecycle fixes. Full scope in §6e. | Yes |
| 7 | `bridge-turn23-post-ship.html` | `bridge-turn24-pre-base.html` | **PWA, OS push, home screen, and the call surface.** Scope detail in §6d. | Yes |
| 8 | `bridge-turn24-pre-base.html` | `bridge-turn24-base.html` | **Multitasking during a call.** Losing focus mutes the microphone. The back button enters picture-in-picture and **keeps the connection**. This closes the open question directly: the call stays up so multitasking works, and the microphone closes so nothing is picked up by a call the person has stopped looking at. | Yes |
| 9 | `bridge-turn24-base.html` | `bridge-turn24-pre-ship.html` | **Appearance.** Real flag graphics and the flag motif on ask screens. Bubble header background colour in the customize tab. Icon-graphics rebuild; camera and mic mute as two complete icons rather than a composited slash, extended to bubble headers. Ear / TTS / Mute wording pass. | Yes |
| 10 | `bridge-turn24-pre-ship.html` | `bridge-turn24-ship.html` | **Compose, transcription, left panel and room menu.** Typing indicator on the compose strip. Short-phrase gate so a brief utterance is not transcribed twice in a dual-channel room. Diagnose the roughly thirty second delivery lag when the recipient is on the home screen. Clear-both-sides added to Manage as an initiator-only power. *(The left-panel navigation change moved to release 7, where the home screen is already being touched.)* | Yes |
| 11 | `bridge-turn24-ship.html` | `bridge-turn24-post-ship.html` | **Phrasebook, end to end.** Editing the target rewrites the source. Back-translation behaviour, verdict lifecycle and staleness. The clarify stream. Then reconcile `phrase-deck-v1` and `phrase-desk`, and build import once for both paths — phrases into the phrasebook, transcripts from the structured export. Merge-or-replace and language-mismatch are answered here. | Yes |
| 12 | `bridge-turn24-post-ship.html` | `bridge-turn25-pre-base.html` | **localStorage → IndexedDB.** Architectural and isolated, with a migration path for existing data. Last because it touches every call site. | No |

**After release 12 the backlog is empty.** Six releases remain after the one
currently built. Nothing is parked without a number.

*PWA is not a release of its own — it ships at the front of release 7 because
push has no meaning without it. If it should stand alone, say so and it becomes
release 7 with everything shifting by one.*

**Sequencing rationale.** The card is the surface everything else is displayed
on, so it is built first. Relay stability comes next and is not optional: two
sides that cannot stay connected cannot gate anything, and two attempts were
spent discovering that the hard way. Then lifecycle and joiner parity together,
as one mechanism. The remaining invisible releases sit behind them because the
call engine already passed a two-phone gate at turn22 — it is working, not
broken, and what remains in them are refinements.

---

## 6 · RELEASE SCOPE — turn23 base, pre-ship, ship, post-ship

### 6a · turn23-base — RELAY STABILITY · invisible

- Instrument the whole relay path before changing anything: connect, close code, close reason, retry interval and backoff, how many sockets are open at once and to which rooms, and whether a close belongs to the current room or a background subscription.
- Read the log from a two-device session. Do not reason about the cause first.
- Fix what the log shows. The observed behaviour is a close with code 1006 every ten to thirty seconds on both sides, on new and existing rooms, with messages sent, re-sent and never delivered.
- Known suspect, to be confirmed or ruled out by the log, not assumed: an initiator holds one live room socket plus one background socket per other room, so eight rooms means eight sockets against one relay from one client.
- Nothing else ships in this release. No UI, no features.
- **Gate:** two devices, one room, ten minutes with no drop, and a message delivered in both directions.

### 6b · turn23-pre-ship — JOINER SHELL · visible

The joiner gets the shell. Nothing about elevation is in this release.

- Remove the session lockout that refuses to open the room list when the app was opened from an invite link.
- Restore the room-switcher control in the ribbon for a joiner.
- The joiner reaches the full shell: room list, room cards, drawer, phrasebook, transcript.
- **No create control.** Gated on credentials being present in this device's own storage — not on role, not on a session flag. A joiner holds invite credentials in memory only, so nothing appears, and no code decides that.
- The gating function ships in this release. Nothing may reference it through a type check from another part.
- Book direction from the joiner's own perspective, new room or re-entered.
- Waiting counts and home cards work from the joiner side.
- Declare the relay subscription change explicitly: a joiner with N rooms now opens N background sockets where it previously opened one. Whether that is acceptable is answered by release 2's work, and if it is not, the joiner subscribes only to its active room.
- **Gate:** two devices. The joiner reaches its room list, opens the drawer and the phrasebook, sees all its rooms, and has no plus control. Chat flows both ways.

### 6c · turn23-ship — ROOM LIFECYCLE, NAMING AND ELEVATION · visible

The credential mechanism, end to end, now observable in the shell release 3 built.

**Naming**
- Room name as a real field in the create dialog, set by the initiator at creation.
- The name travels with the invite so both sides call the room the same thing.
- Only the creator may rename. Long names truncate with ellipsis everywhere and never wrap.
- Auto-read defaults off.

**Granting**
- Grant toggle in the create dialog with a date picker defaulting to 30 days.
- A granting room produces a third link type carrying a grant marker and the expiry. The credentials were always in the invite; a grant makes them persistent and gives them a lifetime.
- Whichever share control the owner actually uses must emit the granting link for a granting room.
- Opening a grant link writes the credentials into the receiving device's own storage with the expiry attached. That write is what confers capability. No flag is set, no role is rewritten.
- A device holding valid credentials can grant further.

**Losing it**
- Expiry deletes the credentials. Checked at boot and on room entry, so a device closed past the date finds out the moment it opens.
- The create control disappears, transcription stops and translation stops as consequences of the deletion — none of it separately coded.
- Soft delete revokes the grant issued from that room; restore reinstates it. A revocation is matched against the room that granted it.
- An initiator's own keys are never touched by any of this.

**Notices**
- Soft delete writes "left the chat" to the partner's transcript and locks sending.
- Restore writes "rejoined", and that entry — not the restoration — releases the lock.
- The compose strip shows the lock rather than failing silently.

**Where granted credentials live — owner ruling 2026-08-05**

Granted credentials are stored under their **own keys**, never over the device's
own. A device may already be an initiator with its own credentials; if a grant
were written over them, a later revoke or expiry would delete keys that were
never granted, and the device would silently lose capability it always had.

- Own credentials: the existing keys, written only by the keys screen.
- Granted credentials: separate keys, written only by opening a grant link.
- Reads fall back — own first, granted second — so a device with both keeps
  working on its own after a grant ends.
- Revoke and expiry delete **only** the granted keys.
- The create control is present if either set is valid.

**Forbidden here**
- Permission flags, role checks, read-only modes.
- Any new credential distribution.

- **Gate:** two devices. Named room with grant on; join from the second device; name matches on both sides; create control present after a grant and absent after a plain join. Then force an expiry, delete the room, and restore it.

### 6d · turn23-post-ship — CALL AND NETWORK ROBUSTNESS · invisible

Everything that keeps a live session alive, in one release rather than scattered.

- Mute by track replacement, so mute is total — the microphone track leaves the connection rather than being flagged silent.
- Force reconnect on visibility and focus return.
- Proactive relay reconnect on visibility return, rather than waiting for a suspended socket's close event to eventually arrive. **Moved here from the plumbing release** — it is network robustness, not plumbing.
- Diagnose the transcription disconnect that recurs roughly every twelve seconds during a call. Instrument first.
- Diagnose the roughly thirty second initial delivery lag when the recipient is on the home screen. Instrument first.
- **Gate:** two devices, a call surviving a network interruption on one side, and a backgrounded device receiving promptly on return.

### Verified, and therefore NOT in any release

Checked directly against `bridge-turn23-pre-base.html` rather than carried forward from an older list:

- **Phrasebook version is not bumped on entry.** The version is read from the cache and only written on write-back. A staleness check already skips the fetch entirely when the local copy is already at the highest version. Closed.
- **Enter in the source field keeps the caret.** The commit records which field it came from and restores focus with the caret collapsed to the end after the card redraws. Closed.
- **Write-back before pull** is present. Closed.

What remains for the plumbing release is therefore smaller than previously stated: it is now whatever release 2 and release 5 instrumentation turns up outside their own surfaces, and nothing else. If that is empty, the release is dropped rather than padded.

## 6a · RELEASE 1 — the room card, per SOT Part 4

**Three rows, two columns.** Left column left-justified, right column
right-justified.

| | Left | Right |
|---|---|---|
| Row 1 | Room name, **bold**, truncates with ellipsis | Delete |
| Row 2 | Me / Partner, not bold, truncates with ellipsis | Time since last contact |
| Row 3 | Chat, phone and video icons, each with its own count badge | Language-pair flags |

**Truncation is not interactive.** Tapping truncated text opens the room, exactly
like tapping anywhere else on the card. This supersedes every earlier
"tap-to-reveal popover" description, including the one in v8.5.0 and in this
plan before v9.0.1.

**Elapsed time** is mixed-mode by magnitude: minutes, then hours, then days.

**Flags** read own-language-first from each viewer's own perspective — always
mine then theirs, never a fixed absolute order. Real flag glyphs.

**Three separate activity counts.** A missed chat, a missed voice call and a
missed video call are three distinct, separately tracked and separately
displayed badges.

**Delete is a soft delete**, recoverable, and carries the notice and send-lock
behaviour built in release 3.

---

## 6e · RELEASE 6 IN FULL — the room menu surface

Everything in this release lives on one surface: the room drawer. That is why
these items travel together — the tabs are being rearranged, so anything that
belongs on them is done now rather than touching the surface twice.

### Tab restructure

- **Share tab is removed.** Its two items — *Share room* and *Link a device* —
  move to the **bottom of General**, which then grows vertically to hold them.
- **Debug tab is renamed Manage.** "Debug" describes where the controls came
  from, not what they do.
- Three tabs remain: **General · Customize · Manage.**

### Manage tab — the full transcript lifecycle

Today Manage holds two exports and nothing else, which is half a lifecycle.

- **Export transcript** — existing.
- **Import transcript** — new. Restores an exported transcript into the room.
- **Clear transcript** — new. Empties this room's transcript.
- **Export debug log** — existing.
- **Clear debug log** — new.

Delete stays on the room card, where it already works, and is not duplicated
here. Export before delete is offered from the delete flow, not from Manage.

### Room name parity

Person names already propagate in both directions and are reflected
immediately. Room names do not — either side can change one and the other side
never sees it, which is the disconnect being fixed.

**Approach: parity.** Both sides may rename; the change propagates over the same
relay path the person-name change already uses; last write wins; a system pill
records who renamed it and to what. See §6f for why, and for the alternative.

### Two transcription-lifecycle fixes

Carried in because they are lifecycle, and the log from the last gate identified
both precisely.

- **Stop transcription on mute; start it on unmute.** Every `1011` close in the
  last session happened while muted, roughly every fourteen seconds, and none
  happened while the microphone was live. The service closes a socket that stops
  receiving audio; mute is now total, so the socket starves and the app reopens
  it forever. Holding an open socket fed nothing is the fault. Mute is total —
  transcription should stop with it.
- **Stop reporting network failures as credential failures.** Three
  `dg_credential_failure` entries in the last session were `1006` closes during
  a network interruption that had already dropped the call. Any socket that
  closes before opening is currently blamed on credentials, which is wrong
  whenever the network is down, and it puts a false diagnosis in the log.

### Gate

Two devices. Rename the room from each side and confirm both see it. Export a
transcript, clear it, import it back. Mute during a call and confirm the
transcription socket stops rather than churning.

---

## 6f · OPEN QUESTIONS — release 6

**These need answers before the release is built.**

1. **Room name: parity or initiator-only?**
   The owner's position is parity, and I agree. Two reasons beyond ease of
   explanation. First, the mechanism already exists and is proven — person names
   use it today, so parity is the smaller change and read-only is the larger
   one. Second, read-only would introduce a second capability model sitting
   beside the credential model, where a joiner is restricted by role rather than
   by what credentials they hold; that is the thing this project has
   deliberately avoided everywhere else. **Recommendation: parity.**

2. **Import — merge or replace?**
   Replacing loses anything said since the export. Merging needs a rule for
   entries that exist on both sides. **Recommendation: merge by entry
   identifier, keeping the existing entry on collision, so an import can only
   ever add.** Needs a ruling.

3. **Import — foreign transcripts?**
   Should a transcript exported from one room be importable into a different
   room, or is import restricted to the room it came from? **Recommendation:
   restrict to the same room**, with a clear message otherwise. Needs a ruling.

4. **Clear transcript — recoverable?**
   Is clearing final, or does it go somewhere recoverable the way room delete
   does? **Recommendation: offer an export first**, then clear finally. Needs a
   ruling.

5. **Does clearing a transcript affect the phrasebook?**
   They are separate stores and the phrasebook lives on GitHub.
   **Recommendation: no — clear touches the transcript only.** Confirm.

6. **What does an export contain?**
   Typed and spoken lines both, in both languages, is assumed. Open: whether
   attachments are included or referenced, and whether system pills are
   included.

---

## 6c · RELEASE 6 — ROOM MENU SURFACE · PASSED 2026-08-07 (attempt 5)

Attempts 1 and 2 are in the graveyard. Everything below carries forward except
the room name, which is redesigned, and localization, which is removed.

### The room name — ONE field

- **There is exactly one room name.** The base's "room title (your list)" and the
  shared room name are the same idea and collapse into a single field. Two
  fields holding one concept is what failed attempt 2, and no propagation logic
  fixes it.
- **Required at creation.** A room cannot be created without a name.
- **Cannot be empty afterwards.** Opening the room menu with a blank name is not
  a reachable state; clearing it is refused rather than accepted.
- **Either side may rename. Last write wins.**
- **Not localized in this release.** Ruled onto the backlog. The name shows as
  written, to both sides.

### A rename is an event in the conversation

The app already has a vocabulary for this — the system entry written when
someone leaves the chat, or when a call is missed. A rename is the same kind of
event and reads the same way, on both sides:

> Mike changed the room from *weekend planning* to *next weekend planning*

Whoever renamed it is named. Both the old and the new name appear, because "the
name changed" without saying from what is not information. If the partner is
Joe and Joe renames it, both sides read that Joe did.

Without this a name silently becomes something else and nobody knows who did it.

### QR codes

- Both QR codes — share room, and link a device — are **smaller**. They are
  currently far larger than a phone camera needs.
- The drawer **extends far enough to show a QR without scrolling.** The single
  moment a QR matters is when it is being held up to another phone, and having
  to scroll to keep it in frame defeats it. True for both.

### Carried forward unchanged from attempt 2

- Transcription stops on mute and resumes on unmute; network drops are no longer
  reported as credential failures.
- Share's two items at the bottom of General; Debug renamed Manage.
- Manage: export in two formats, clear transcript (local only), diagnostics with
  copy and download, clear debug log.
- Status detail popup on tapping a receipt — Sent, Received, Read, blank where
  not reached.
- Room name popup on tapping the ribbon name.
- Bubble header background colour in the customize tab.
- Enter commits and closes.

## 6a · RELEASE 1 — the room card, per SOT Part 4

**Three rows, two columns.** Left column left-justified, right column
right-justified.

| | Left | Right |
|---|---|---|
| Row 1 | Room name, **bold**, truncates with ellipsis | Delete |
| Row 2 | Me / Partner, not bold, truncates with ellipsis | Time since last contact |
| Row 3 | Chat, phone and video icons, each with its own count badge | Language-pair flags |

**Truncation is not interactive.** Tapping truncated text opens the room, exactly
like tapping anywhere else on the card. This supersedes every earlier
"tap-to-reveal popover" description, including the one in v8.5.0 and in this
plan before v9.0.1.

**Elapsed time** is mixed-mode by magnitude: minutes, then hours, then days.

**Flags** read own-language-first from each viewer's own perspective — always
mine then theirs, never a fixed absolute order. Real flag glyphs.

**Three separate activity counts.** A missed chat, a missed voice call and a
missed video call are three distinct, separately tracked and separately
displayed badges.

**Delete is a soft delete**, recoverable, and carries the notice and send-lock
behaviour built in release 3.

---

## 6e · RELEASE 6 IN FULL — the room menu surface

Everything in this release lives on one surface: the room drawer. That is why
these items travel together — the tabs are being rearranged, so anything that
belongs on them is done now rather than touching the surface twice.

### Tab restructure

- **Share tab is removed.** Its two items — *Share room* and *Link a device* —
  move to the **bottom of General**, which then grows vertically to hold them.
- **Debug tab is renamed Manage.** "Debug" describes where the controls came
  from, not what they do.
- Three tabs remain: **General · Customize · Manage.**

### Manage tab — the full transcript lifecycle

Today Manage holds two exports and nothing else, which is half a lifecycle.

- **Export transcript** — existing.
- **Import transcript** — new. Restores an exported transcript into the room.
- **Clear transcript** — new. Empties this room's transcript.
- **Export debug log** — existing.
- **Clear debug log** — new.

Delete stays on the room card, where it already works, and is not duplicated
here. Export before delete is offered from the delete flow, not from Manage.

### Room name parity

Person names already propagate in both directions and are reflected
immediately. Room names do not — either side can change one and the other side
never sees it, which is the disconnect being fixed.

**Approach: parity.** Both sides may rename; the change propagates over the same
relay path the person-name change already uses; last write wins; a system pill
records who renamed it and to what. See §6f for why, and for the alternative.

### Two transcription-lifecycle fixes

Carried in because they are lifecycle, and the log from the last gate identified
both precisely.

- **Stop transcription on mute; start it on unmute.** Every `1011` close in the
  last session happened while muted, roughly every fourteen seconds, and none
  happened while the microphone was live. The service closes a socket that stops
  receiving audio; mute is now total, so the socket starves and the app reopens
  it forever. Holding an open socket fed nothing is the fault. Mute is total —
  transcription should stop with it.
- **Stop reporting network failures as credential failures.** Three
  `dg_credential_failure` entries in the last session were `1006` closes during
  a network interruption that had already dropped the call. Any socket that
  closes before opening is currently blamed on credentials, which is wrong
  whenever the network is down, and it puts a false diagnosis in the log.

### Gate

Two devices. Rename the room from each side and confirm both see it. Export a
transcript, clear it, import it back. Mute during a call and confirm the
transcription socket stops rather than churning.

---

## 6f · OPEN QUESTIONS — release 6

**These need answers before the release is built.**

1. **Room name: parity or initiator-only?**
   The owner's position is parity, and I agree. Two reasons beyond ease of
   explanation. First, the mechanism already exists and is proven — person names
   use it today, so parity is the smaller change and read-only is the larger
   one. Second, read-only would introduce a second capability model sitting
   beside the credential model, where a joiner is restricted by role rather than
   by what credentials they hold; that is the thing this project has
   deliberately avoided everywhere else. **Recommendation: parity.**

2. **Import — merge or replace?**
   Replacing loses anything said since the export. Merging needs a rule for
   entries that exist on both sides. **Recommendation: merge by entry
   identifier, keeping the existing entry on collision, so an import can only
   ever add.** Needs a ruling.

3. **Import — foreign transcripts?**
   Should a transcript exported from one room be importable into a different
   room, or is import restricted to the room it came from? **Recommendation:
   restrict to the same room**, with a clear message otherwise. Needs a ruling.

4. **Clear transcript — recoverable?**
   Is clearing final, or does it go somewhere recoverable the way room delete
   does? **Recommendation: offer an export first**, then clear finally. Needs a
   ruling.

5. **Does clearing a transcript affect the phrasebook?**
   They are separate stores and the phrasebook lives on GitHub.
   **Recommendation: no — clear touches the transcript only.** Confirm.

6. **What does an export contain?**
   Typed and spoken lines both, in both languages, is assumed. Open: whether
   attachments are included or referenced, and whether system pills are
   included.

---

## 6c · RELEASE 6 — ROOM MENU SURFACE

One surface: the room drawer, plus the transcription lifecycle faults the last
gate exposed. Nothing outside the drawer changes visually.

### Transcription lifecycle — from the turn23-ship log

- **Stop transcription on mute; start it again on unmute.** Every `1011` close
  in the gate log happened while muted, roughly every fourteen seconds, and none
  while the microphone was live. The service closes a socket it is not being fed,
  and mute now genuinely stops the audio — so the app was holding an open socket
  starved of input and reopening it for the rest of the call. Mute is total, so
  transcription should stop, not idle.
- **Stop reporting network drops as credential failures.** Three
  `dg_credential_failure` entries during the gate were `1006` closes while the
  network was down. Any socket closing before it opens is currently blamed on
  credentials, which is wrong and makes the log lie during exactly the trouble
  it should describe.

### Drawer restructure

- The two items on the **Share** tab move to the bottom of **General**, so
  General has room to grow and the share controls stop occupying a tab of their
  own.
- The **Debug** tab is renamed **Manage**. It stops being a developer corner and
  becomes where a person manages what the room holds.

### Manage tab — the full transcript lifecycle

- Export transcript, in **two formats**: a readable one, and a structured one
  that a future import will read.
- Clear transcript — **local only**.
- Diagnostics overlay with copy and download, carried over unchanged from the
  Debug tab.
- Clear debug log.

### Room name parity

Both sides may rename the room, and the change propagates immediately, exactly
as person names already do. Parity carries the day: a communications product
where one party can rename a shared thing and the other cannot is harder to
explain than one where both can, and the person-name path already works this way
and is understood.

This closes the standing backlog item that renames do not propagate.

### Also in scope, because it is this surface

- Enter on the person name or the room name in the room config dialog commits
  and closes the dialog.

### Rulings — closed 2026-08-06

1. **Import is deferred.** Merge-or-replace and language-mismatch behaviour are
   unanswered, so import moves to the backlog. Export ships without it.
2. **Export is two formats** — a readable one and a structured one. The
   structured export is what a future import will read.
3. **Clear is local only.** Clearing both sides is an initiator-only power and
   is deferred to the backlog as its own decision.
4. **Last write wins** on a room rename, matching how the person name already
   behaves.
5. **Manage keeps the diagnostics overlay**, with copy and download, exactly as
   Debug had it. *Direction of travel, not this release:* diagnostics eventually
   move behind a `&debug=1` launch parameter and are off by default.

### Also in scope, by ruling 2026-08-06

**Status detail popup**, on tapping a receipt dot or check. It shows three
lines — Sent, Received, Read — and leaves the ones not yet reached blank rather
than hiding them, so the progression is visible at a glance. **It appears just
above the message it belongs to**, not pinned to the top of the screen: a popup
that opens somewhere other than what was tapped is not how anything modern
behaves, and it breaks the connection between the tap and the answer.

**Room name popup**, on a single tap of the name in the transcript's top ribbon.
The ribbon shows the person being spoken with; the popup shows the room name
currently assigned.

**The room name is localized, and this is not cosmetic.** The name carries the
context of the conversation — it is what tells someone which thread they are in
— so it has to be readable by each side in their own language, exactly like
every message. A name set in English must appear in Chinese to the Chinese
speaker. Without that it is decoration for one side and noise for the other.

- The name is stored with the language it was written in, and translated for
  display to a viewer whose language differs.
- **The popup shows both** — the name as it was written, and the translation —
  because both carry context. The original is what the other person actually
  called it, which is worth seeing; the translation is what it means. Showing
  only one throws away half the information the pair holds, which is the same
  reason every message shows both.
- When the viewer's language is the language it was written in, there is only
  one line to show.
- Translated on receipt and cached, not on every render — a rename is rare and a
  render is constant.
- Rename remains last-write-wins in both directions; the localization sits on
  top of that and does not change it.
- If the translation fails, the original shows rather than a blank. A name in
  the wrong language is still a handle; nothing is not.

---

## 6d · RELEASE 7 — PWA, PUSH, HOME SCREEN, CALL SURFACE

### PWA foundation
Manifest, service worker registered from the file, install on Android,
home-screen install on iOS. Ships at the front of this release because the
service worker is what receives a push — push cannot exist without it.

### OS push
Locked and backgrounded push only: relay change, push subscription, notification
tap routing into the right room. The only release that modifies the relay.

### The home screen becomes the *while you were away* summary

This is the organising idea of the release, not a feature within it. **The home
screen is the record of everything that happened in rooms you were not
watching** — and anything that qualifies for that record also qualifies as a
notification, because they answer the same question.

It already surfaces waiting chats and missed calls. A name change and a room
rename are the same kind of event and belong there too: something happened in a
room you were not looking at, you should see it, and you should be able to tap
straight into that room.

- *Mike is now Miguel* — with date and time, tappable, opens the room.
- *Mike changed the room from movies to camping* — with date and time, tappable,
  opens the room.
- Same card treatment and same dismissal rules as the existing waiting entries.

### The left panel loses its navigation card

The card that says TalkBridge / About / start screen is removed. **A single tap
on the clock in the panel's top ribbon does exactly what it did** — the clock is
already there and already unused, so the card is redundant weight.

*This absorbs the item previously scheduled for release 10; the two are the same
change and are done once, here, where the home screen is already being touched.*

### Update propagation — RESOLVED 2026-08-07, ahead of the rest of this release

Fixed and device-passed as `bridge-turn24-pre-base.html`. Renames, name changes
and read receipts are all prompt.

**The cause, proven in a two-instance harness before anything was written:** read
receipts were marked as sent *before* the send was attempted. Entering a room
renders the transcript, which is what triggers the receipt — and entering a room
happens before the relay socket is open. The send failed, the messages were
already flagged, and nothing retried them. The flag is saved with the
transcript, so those receipts were lost permanently, which is why re-entering
the room never settled them.

**The fix:** nothing is flagged until the send succeeds, and any inbound relay
traffic flushes whatever is still outstanding — inbound traffic being a more
reliable signal that the socket is live than the socket's own events.

*Note: messages flagged before this fix stay flagged, because the flag was
persisted. Those specific old messages will not settle.*

### What remains of update propagation

A rename arriving late is a symptom, and the owner has narrowed it: **the
notification does not appear on the receiving side when the room is entered, or
when focus returns to it.** Sometimes a rename lands instantly; otherwise it
appears to skip, and what it is actually doing is waiting for something that
never re-runs. Entering a room and returning focus to one are the two moments
that must reconcile whatever arrived while nobody was looking, and they do not.

Read receipts are the same fault seen from another angle:

- A message is sent and demonstrably read, and the dot in the bubble header does
  not turn from grey to green — or turns, and re-entering the room never
  registers the read.
- The lag is well over a minute, sometimes apparently indefinite.
- It is not a connectivity failure: in the same session a message crossed, a
  rename crossed, both transcripts updated correctly — and the receipt still did
  not settle.

**Instrument the whole path first** — when a read is detected, when it is sent,
when it arrives, when it is applied, and what runs on entering a room and on
focus returning. Do not reason about the cause. Fix what the log shows.

What remains here is only the **away** case, and it is push's job rather than a
replay's: an event that happens while the app is closed is delivered by the
service worker, which raises the notification and writes the home-screen entry.
Reconciliation on return is the fallback for when push genuinely could not
deliver — permission declined, iOS without a home-screen install, device offline
throughout. If that fallback is carrying the load, push is not working.

*Carry into this: the lifecycle signals from the elevation release —* left the
chat, rejoined, grant revoke, grant restore *— are new relay message types and,
on the evidence that a new type never crossed, are probably not arriving either.
They were only ever confirmed as local behaviour. Verify them across two devices
and move them onto the system-pill carrier if they are not crossing.*

### Call surface
Ribbon strip transformation — microphone fixed at centre, phone and video beside
it, hang-up fixed beside video. Voice shows microphone and hang-up only; video
shows microphone, camera and hang-up. Call timer visible to the receiver as well
as the caller.

---

## 6b · BACKLOG — none. Everything is scheduled.

Every item previously parked here now has a release number in §5. The backlog
exists as a concept only for things not yet raised.

**Scheduled — added 2026-08-08, awaiting a release number:**

- **Group conversations — three or more.** Discovered by accident: a phone call
  and chat ran between three devices at once, because the relay broadcasts to
  every socket in a session rather than pairing two. The transport already
  supports it. What does not is everything built on the assumption of two
  people: language pairs, the two-column transcript, *Talking to X*, the room
  card's own-first flags, and call negotiation, which assumes one offer and one
  answer. A large piece of work, and a real product direction rather than a
  defect.
- **Chrome treats the room name as a credential.** Also observed asking to save
  the name entered during onboarding, so the fault is not limited to the create
  dialog. Creating a room offers the
  password autofill popup for the room name field, then offers to save it as a
  password. That means a password manager stores a room name as a credential,
  and may autofill a saved password into the field — naming a room after
  someone's password. The create dialog as a whole is being read as a sign-up
  form, so the fix is to mark the form and its fields with a real non-credential
  purpose; `autocomplete="off"` alone is widely ignored. The person-name field
  is likely read as a username for the same reason. *Observed in the create
  dialog; whether the drawer's room-name and person-name fields do the same is
  unconfirmed — different form, possibly different behaviour.*

- **Per-room notification alias.** A room may carry an alias used in its place on
  a lock screen — "haircut 3:30" for a room named *pickleball game*. Deliberate
  misdirection rather than omission, for screens other people can see. **Blank
  means silent**: a room with no alias raises no notification, which needs no
  separate toggle. Needs a field, a home for it, a ruling on whether it is
  private to the device that set it or shared, and its interaction with muting —
  a release's worth of surface, not a bolt-on.
- **Choosing the installed name and icon.** Both are read from the manifest at
  install and cannot be changed afterwards on either platform. A choice is
  therefore made *before* installing: ship a small set of prebuilt manifests and
  point the page at the chosen one before the install prompt fires. Note the
  browser tab's favicon is a different thing and can already change at runtime.

**Scheduled — added 2026-08-06, awaiting a release number:**

- **Localization, as a family.** The room name, the participant names, the room
  creation dialog and the room menu itself. Everything a person reads should
  reach them in their own language, which is the whole premise of the product
  and the reason the interface leans on icons wherever it can. Room name
  localization was attempted in release 6 and reached only one side; it is
  withdrawn and rejoins the family rather than being chased alone.
- **`&debug=1` launch parameter.** Diagnostics off by default, on only when
  asked for. Consistent with the privacy-forward promise: a person who never
  asks for a debug log should not be accumulating one.

**Out of scope by ruling — not scheduled, not coming back:**

- Goodbye screen. Ruled out 2026-08-06.
- Phrasebook import-phrases modal as a standalone surface. Ruled out
  2026-08-06; import itself is release 13, built once for both paths.

**Direction of travel, not a release:** diagnostics eventually move behind a
`&debug=1` launch parameter and are off by default.

---

## 6c · RELEASE 6 — ROOM MENU SURFACE

One surface: the room drawer, plus the transcription lifecycle faults the last
gate exposed. Nothing outside the drawer changes visually.

### Transcription lifecycle — from the turn23-ship log

- **Stop transcription on mute; start it again on unmute.** Every `1011` close
  in the gate log happened while muted, roughly every fourteen seconds, and none
  while the microphone was live. The service closes a socket it is not being fed,
  and mute now genuinely stops the audio — so the app was holding an open socket
  starved of input and reopening it for the rest of the call. Mute is total, so
  transcription should stop, not idle.
- **Stop reporting network drops as credential failures.** Three
  `dg_credential_failure` entries during the gate were `1006` closes while the
  network was down. Any socket closing before it opens is currently blamed on
  credentials, which is wrong and makes the log lie during exactly the trouble
  it should describe.

### Drawer restructure

- The two items on the **Share** tab move to the bottom of **General**, so
  General has room to grow and the share controls stop occupying a tab of their
  own.
- The **Debug** tab is renamed **Manage**. It stops being a developer corner and
  becomes where a person manages what the room holds.

### Manage tab — the full transcript lifecycle

- Export transcript, in **two formats**: a readable one, and a structured one
  that a future import will read.
- Clear transcript — **local only**.
- Diagnostics overlay with copy and download, carried over unchanged from the
  Debug tab.
- Clear debug log.

### Room name parity

Both sides may rename the room, and the change propagates immediately, exactly
as person names already do. Parity carries the day: a communications product
where one party can rename a shared thing and the other cannot is harder to
explain than one where both can, and the person-name path already works this way
and is understood.

This closes the standing backlog item that renames do not propagate.

### Also in scope, because it is this surface

- Enter on the person name or the room name in the room config dialog commits
  and closes the dialog.

### Rulings — closed 2026-08-06

1. **Import is deferred.** Merge-or-replace and language-mismatch behaviour are
   unanswered, so import moves to the backlog. Export ships without it.
2. **Export is two formats** — a readable one and a structured one. The
   structured export is what a future import will read.
3. **Clear is local only.** Clearing both sides is an initiator-only power and
   is deferred to the backlog as its own decision.
4. **Last write wins** on a room rename, matching how the person name already
   behaves.
5. **Manage keeps the diagnostics overlay**, with copy and download, exactly as
   Debug had it. *Direction of travel, not this release:* diagnostics eventually
   move behind a `&debug=1` launch parameter and are off by default.

### Also in scope, by ruling 2026-08-06

**Status detail popup**, on tapping a receipt dot or check. It shows three
lines — Sent, Received, Read — and leaves the ones not yet reached blank rather
than hiding them, so the progression is visible at a glance. **It appears just
above the message it belongs to**, not pinned to the top of the screen: a popup
that opens somewhere other than what was tapped is not how anything modern
behaves, and it breaks the connection between the tap and the answer.

**Room name popup**, on a single tap of the name in the transcript's top ribbon.
The ribbon shows the person being spoken with; the popup shows the room name
currently assigned.

**The room name is localized, and this is not cosmetic.** The name carries the
context of the conversation — it is what tells someone which thread they are in
— so it has to be readable by each side in their own language, exactly like
every message. A name set in English must appear in Chinese to the Chinese
speaker. Without that it is decoration for one side and noise for the other.

- The name is stored with the language it was written in, and translated for
  display to a viewer whose language differs.
- **The popup shows both** — the name as it was written, and the translation —
  because both carry context. The original is what the other person actually
  called it, which is worth seeing; the translation is what it means. Showing
  only one throws away half the information the pair holds, which is the same
  reason every message shows both.
- When the viewer's language is the language it was written in, there is only
  one line to show.
- Translated on receipt and cached, not on every render — a rename is rare and a
  render is constant.
- Rename remains last-write-wins in both directions; the localization sits on
  top of that and does not change it.
- If the translation fails, the original shows rather than a blank. A name in
  the wrong language is still a handle; nothing is not.

---

## 6d · RELEASE 7 — PWA, PUSH, HOME SCREEN, CALL SURFACE

### PWA foundation
Manifest, service worker registered from the file, install on Android,
home-screen install on iOS. Ships at the front of this release because the
service worker is what receives a push — push cannot exist without it.

### OS push
Locked and backgrounded push only: relay change, push subscription, notification
tap routing into the right room. The only release that modifies the relay.

### The home screen becomes the *while you were away* summary

This is the organising idea of the release, not a feature within it. **The home
screen is the record of everything that happened in rooms you were not
watching** — and anything that qualifies for that record also qualifies as a
notification, because they answer the same question.

It already surfaces waiting chats and missed calls. A name change and a room
rename are the same kind of event and belong there too: something happened in a
room you were not looking at, you should see it, and you should be able to tap
straight into that room.

- *Mike is now Miguel* — with date and time, tappable, opens the room.
- *Mike changed the room from movies to camping* — with date and time, tappable,
  opens the room.
- Same card treatment and same dismissal rules as the existing waiting entries.

### The left panel loses its navigation card

The card that says TalkBridge / About / start screen is removed. **A single tap
on the clock in the panel's top ribbon does exactly what it did** — the clock is
already there and already unused, so the card is redundant weight.

*This absorbs the item previously scheduled for release 10; the two are the same
change and are done once, here, where the home screen is already being touched.*

### Update propagation — RESOLVED 2026-08-07, ahead of the rest of this release

Fixed and device-passed as `bridge-turn24-pre-base.html`. Renames, name changes
and read receipts are all prompt.

**The cause, proven in a two-instance harness before anything was written:** read
receipts were marked as sent *before* the send was attempted. Entering a room
renders the transcript, which is what triggers the receipt — and entering a room
happens before the relay socket is open. The send failed, the messages were
already flagged, and nothing retried them. The flag is saved with the
transcript, so those receipts were lost permanently, which is why re-entering
the room never settled them.

**The fix:** nothing is flagged until the send succeeds, and any inbound relay
traffic flushes whatever is still outstanding — inbound traffic being a more
reliable signal that the socket is live than the socket's own events.

*Note: messages flagged before this fix stay flagged, because the flag was
persisted. Those specific old messages will not settle.*

### What remains of update propagation

A rename arriving late is a symptom, and the owner has narrowed it: **the
notification does not appear on the receiving side when the room is entered, or
when focus returns to it.** Sometimes a rename lands instantly; otherwise it
appears to skip, and what it is actually doing is waiting for something that
never re-runs. Entering a room and returning focus to one are the two moments
that must reconcile whatever arrived while nobody was looking, and they do not.

Read receipts are the same fault seen from another angle:

- A message is sent and demonstrably read, and the dot in the bubble header does
  not turn from grey to green — or turns, and re-entering the room never
  registers the read.
- The lag is well over a minute, sometimes apparently indefinite.
- It is not a connectivity failure: in the same session a message crossed, a
  rename crossed, both transcripts updated correctly — and the receipt still did
  not settle.

**Instrument the whole path first** — when a read is detected, when it is sent,
when it arrives, when it is applied, and what runs on entering a room and on
focus returning. Do not reason about the cause. Fix what the log shows.

What remains here is only the **away** case, and it is push's job rather than a
replay's: an event that happens while the app is closed is delivered by the
service worker, which raises the notification and writes the home-screen entry.
Reconciliation on return is the fallback for when push genuinely could not
deliver — permission declined, iOS without a home-screen install, device offline
throughout. If that fallback is carrying the load, push is not working.

*Carry into this: the lifecycle signals from the elevation release —* left the
chat, rejoined, grant revoke, grant restore *— are new relay message types and,
on the evidence that a new type never crossed, are probably not arriving either.
They were only ever confirmed as local behaviour. Verify them across two devices
and move them onto the system-pill carrier if they are not crossing.*

### Call surface
Ribbon strip transformation — microphone fixed at centre, phone and video beside
it, hang-up fixed beside video. Voice shows microphone and hang-up only; video
shows microphone, camera and hang-up. Call timer visible to the receiver as well
as the caller.

---

## 6b · BACKLOG — not scheduled, not in the chain

Nothing here is a release. Nothing here is picked up as part of another release.
It moves into the chain only by owner ruling.

### Ribbon strip transformation — the largest of these
The top strip is rearranged so the call controls cluster in the centre with
fixed positions rather than shifting with state.

- The microphone sits at a **fixed centre position** and never moves.
- Phone and video icons sit beside it; the hang-up sits beside the video icon
  and is also fixed.
- **Voice call:** microphone and hang-up only — no phone or video icon.
- **Video call:** microphone, camera toggle and hang-up.
- Three reasons, all of them the point: it moves the video icon away from the
  room-menu ellipsis, which are currently too easy to confuse; it gives every
  control one standard place to live; and it frees the left side for the name of
  the person being spoken to.
- Supersedes the older "centre the mic in the ribbon" item — that is this.

### Leaving the app during a call
Navigating away — to check an email, look up an address — currently drops the
connection and reconnects on return. Both halves of this are defensible and
neither is obviously right:

- A call should stay open while multitasking, as any phone call does.
- But with nothing on screen to indicate a live call, someone can forget they
  are on one and say something in front of an open microphone. That is a real
  harm, not an inconvenience.
- One option, not a decision: the back button during a call enters
  picture-in-picture, keeping the call visible and the fact of it unmistakable.
  WhatsApp does this.
- **Needs the use cases thought through before anything is built.**

### Call timer parity
The receiver of a call has no running timer and therefore no clear indication
they are on a call. The caller does. Communications state must read the same on
both sides — the parity principle applies to being on a call, not only to
surfaces.

### Typing indicator
The compose strip should show when the other side is typing, so a person knows
to wait rather than talking over them.

### Short-phrase double transcription
In a room using the second English channel, a short phrase can be transcribed
twice — once in the room language and once in English — and both land. The
arbitration already discards the phonetic duplicate when the English result is
substantial; short phrases fall below that threshold and both survive. Needs a
gate for short phrases specifically.

### Room renames do not propagate
Changing either person's name is reflected on the other side immediately;
renaming the room is not. The rename needs the same relay path the person-name
change already uses.

### Enter should close the room config dialog
In the create dialog Enter now commits the field rather than dismissing it,
which was the fix for a real fault. In the room config dialog the opposite is
wanted: Enter on the person name or the room name should commit and close.

### Phrasebook
- Editing the target rewrites the source. Owner ruling 2026-08-05; attempted as
  turn23-pre-base and rolled back with too many regressions to triage. If
  rebuilt, the redraw must happen when the translation returns, not when the
  edit is submitted.
- Back-translation behaviour, verdict lifecycle, staleness.
- The clarify stream.

### Flag motif under-delivered — long-standing
The flag band is a real image but rendered as a six-pixel strip with a
cover-crop, where the spec calls for it fully opaque and sized to show the
maximum number of flags. It is also absent from the room menu and drawer
entirely. Flagged in a planning session on 2026-08-01 and not built since.

### Bubble header background colour
The customize tab can change the bubble colour and the font colour. The owner
asked that the **bubble header** be able to change its background colour, not
only its font colour. Not built.

### Two-graphic mute icons and the bubble-header icon convention
Camera mute is still a slash composited over the base icon. It should be two
complete icon graphics swapped in and out. The bubble header should adopt the
same convention more broadly: a microphone icon for transcribed chat, a phone
icon for transcribed voice, a video icon for transcribed video. Long-standing.

### Ear / Auto-read / Mute wording pass
Owner flagged the current labels for rewording; the wording itself was never
specified. Long-standing.

### Installability
The app is not installable on Android or iOS today — there is no manifest and no
service worker. This is not an oversight in the sense of being lost: the plan
places both in the push release, because Apple delivers web push only to an
installed app, so installability and push were always one piece of work.
**Open question: should installability be pulled forward on its own?** It has
standalone value — a home-screen icon and a full-screen window — independent of
notifications.

### Never built, and long assumed present

- **PWA install.** There is no manifest and no service worker in the file. It was
  scheduled in an abandoned turn chain and lost with it. It has been treated as
  present in conversation since. It is a prerequisite for push on iOS, so it
  belongs with the notifications release rather than standing alone — recorded
  here so it stops being assumed.
- **Real flag graphics.** Flags are currently emoji glyphs. The spec calls for
  real flag glyphs and a flag motif on the ask screens. Cosmetic release.
- **Bubble header background colour.** The customize tab themes bubble
  background and font colour. The header strip inside the bubble has no
  background colour of its own and was asked for.

### Deferred by ruling

- **Transcript import.** Export ships now in both formats; import waits. It will
  be bolted on alongside the **import into phrase-desk**, when `phrase-deck-v1`
  and `phrase-desk` are reconciled — the two import paths share the same
  questions and should be answered once, not twice. The merge-or-replace and
  language-mismatch rulings are part of that work. Ruled 2026-08-06.
- **Clear on both sides, initiator only.** Clearing is local-only in release 6.
  A destructive clear that reaches the other side is an initiator-only power and
  is its own decision. Ruled 2026-08-06.

*Removed by ruling 2026-08-06: goodbye screen, phrasebook import-phrases modal.
Neither is wanted.*

### Undiagnosed
- Transcription disconnect roughly every twelve seconds during a call. Reopen
  gaps are now timestamped in the log, which is where the answer will come from.
- Roughly thirty second initial delivery lag when the recipient is on the home
  screen.

---

## 7 · BUILD SYSTEM

The deployed app is one HTML file. It is **never edited** — it is assembled from
separate parts, so a broken part is deleted and rebuilt rather than patched.

    npm run ship      assemble → contract gate → units → four checks
    npm run deploy    ship → push → read back from GitHub → byte compare

Four pre-push checks: syntax, HTML structure, wire (every referenced element and
handler resolves), and runtime execution against a DOM stub. Each has been
verified to catch its own failure by deliberate breakage.

Green means allowed to push. It never means done.

---

## 8 · DO-NOT-TOUCH — retested at every gate

- Boots to the start screen, panel closed, no room auto-opens.
- Side-by-side bubbles, viewer's language on the left, both languages always visible.
- One light theme everywhere; flag motif on ask screens only.
- One transcript: typed and spoken share it; call content is permanent and marked.
- Joiner room-locked; initiator rooms intact across updates, storage untouched.
- Phrasebook pair-scoped, GitHub the source of truth, "already saved" dedupe,
  Recently Deleted restore path.
- Go button always present; "/" search from compose everywhere, including in-call.

---

## 9 · CHANGE LOG

**v10.7.0 · 2026-08-10.** Install faults diagnosed. **Chrome on iOS is Safari
underneath** — Apple requires it — so it can never install a web app nor receive
web push, whatever is built. iOS testing must be Safari, added to the home
screen from the Share menu. On Android the cause was ours: the manifest link was
added by script after load, and install eligibility is decided during parse, so
the browser never saw it. Head tags are now injected at build time, along with
the iOS meta tags and touch icon. The ribbon's centre drifted because the first
attempt collapsed the right zone after moving its buttons into the middle;
equal growth on both sides centres it regardless of the name. Backlog gains
**group conversations of three or more** — found by accident, the relay already
broadcasts to every socket in a session, but everything above it assumes two
people.

**v10.6.1 · 2026-08-08.** Backlog gains an autofill fault: Chrome reads the room
creation dialog as a sign-up form, offers the password popup for the room name
and then offers to save it as a password — so a manager may store a room name as
a credential, or fill a password into the field.

**v10.6.0 · 2026-08-08.** Notification content decided: **a single aggregate
line on both platforms** — "12 chats, 4 calls and 7 videos across 6 rooms". It
names nobody, quotes nothing and reveals no room, so it is the privacy answer
and the useful answer at once, and it costs nothing because the counts already
exist. One line because iOS gives only one; Android's expanded view is a bonus,
not the design. Composed on the device from counts the worker fetches, so
nothing but a bare wake ever reaches a push service. Two items to the backlog:
the **per-room notification alias** (an alias shown in place of the room name,
blank meaning silent) and **choosing the installed name and icon**, which must
happen before install because a manifest is read once and cannot be changed
afterwards.

**v10.5.0 · 2026-08-07.** Update propagation **resolved and device-passed** as
`bridge-turn24-pre-base.html`, ahead of the rest of release 7 — renames, name
changes and read receipts are all prompt. The cause was proven in a
two-instance harness before any code was written: receipts were flagged as sent
before the send was attempted, and since room entry precedes the socket opening,
they were lost permanently and never retried. What remains of update propagation
is only the away case, which is push's job rather than a replay's.

**v10.4.0 · 2026-08-07.** Release 6 **passed** at attempt 5;
`bridge-turn23-post-ship.html` is the new baseline. The one outstanding anomaly —
a rename that sometimes appears instantly and sometimes seems to skip — is
narrowed by the owner to a specific cause: the notification does not appear on
the receiving side **when the room is entered, or when focus returns to it**.
That is the same fault as the unsettled read receipts, seen from another angle,
and both are now scoped in release 7 with the shape of the fix stated —
**reconciliation on re-entry**, so nothing depends on having been present when a
message landed. The *while you were away* summary is promoted from a feature to
the organising idea of release 7: anything worth recording there is also worth a
notification, because they answer the same question.

**v10.3.0 · 2026-08-07.** Release 7 written out in full as §6d and given four
additions. Name changes and room renames become **home screen entries** — same
kind of event as a waiting chat or a missed call, with date, time and a tap
straight into the room. The **left panel's navigation card is removed** in favour
of a single tap on the clock, absorbed here from release 10 since the home
screen is already being touched. **Update propagation** is named as the real
problem beneath the late rename: read receipts do not settle, sometimes for
minutes, in sessions where messages and renames demonstrably crossed —
instrument the whole receipt path before changing anything. Carried in with it:
the elevation release's lifecycle signals use new relay message types and are
probably not crossing either, having only been confirmed as local behaviour.
Release 6 gains one correction: the **status popup opens just above the message
it belongs to**, not pinned to the top of the screen.

**v10.2.0 · 2026-08-06.** Release 6 rolled back a second time and rescoped as
attempt 3; graveyard 1.8. **The room name becomes one field, not two** — the
base's own room title and the shared name are the same idea, and holding both is
what failed. It is required at creation, cannot be emptied, and last write wins.
**A rename now writes a system entry into the transcript**, naming who renamed
it and both the old and new names, in the same vocabulary as leaving a chat or a
missed call. **Localization is removed from the release** and rejoins the
backlog as a family: room name, participant names, the creation dialog and the
room menu. QR codes shrink and the drawer extends far enough to show one without
scrolling. The `&debug=1` parameter is scheduled rather than noted as direction
of travel.

**v10.1.0 · 2026-08-06.** Chain resequenced to the owner's grouping: twelve
releases total, six remaining after the one now built. Multitasking during a call
becomes its own release and its open question is **closed by ruling** — losing
focus mutes the microphone, and the back button enters picture-in-picture while
keeping the connection, so the call survives multitasking and the microphone
does not. PWA ships at the front of the push release rather than standing alone,
since push cannot exist without the service worker.

**v10.0.0 · 2026-08-06.** The backlog is emptied into the chain. Every parked
item now has a release number and a home organised by separation of concerns:
PWA foundation (7), OS push and smart home screen (8), call surface (9), compose
and transcription (10), left panel and room menu (11), phrasebook behaviour (12),
phrase-desk reconciliation and import (13), appearance (14), IndexedDB (15).
**PWA is release 7, ahead of push**, because the service worker is what receives
a push — it was previously assumed present and had no place in the chain at all.
Deferred now means out of scope and gone; backlog now means scheduled with a
number. New item scheduled into release 11: home is reached by tapping the clock
in the left panel's ribbon, and the room card that currently does it is removed.
Nine releases remain after the one now built.

**Process note.** Release 6 was built from rulings without its scope being
confirmed back to the owner first. That is the drift this version corrects. No
release starts before its scope is agreed.

**v9.11.1 · 2026-08-06.** The room name popup shows both the name as written and
its translation, for the same reason every message shows both — the pair carries
more context than either half. One line only when the viewer's language is the
language it was written in.

**v9.11.0 · 2026-08-06.** Three rulings. The receipt popup shows Sent, Received
and Read, leaving unreached states blank rather than hidden. The room name popup
opens on a single tap of the ribbon name — and **the room name is localized**,
translated into each viewer's own language, because the name is what carries the
context of the conversation and is useless to the side that cannot read it.
Transcript import is deferred to be built alongside the phrase-desk import when
`phrase-deck-v1` and `phrase-desk` are reconciled, since both raise the same
questions.

**v9.10.0 · 2026-08-06.** All six release-6 questions closed by ruling. Import
deferred to the backlog; export ships in two formats, the structured one being
what a future import reads. Clear is local only, with clear-both-sides recorded
as an initiator-only power for later. Last write wins on renames. Manage keeps
the diagnostics overlay with copy and download, with a note that diagnostics
eventually move behind a launch parameter. Two items added to the release by
ruling: the status detail popup on tapping a receipt, and a room name popup on
tapping the name in the ribbon. Goodbye screen and the phrasebook import-phrases
modal removed from the backlog — neither is wanted.

**v9.9.0 · 2026-08-06.** Release 6 rescoped from "per-room export and delete" to
**the room menu surface** (§6e), with its open questions written down and
unanswered (§6f) so they are closed before anything is built. Share tab folds
into General, Debug becomes Manage, the transcript lifecycle gains import and
clear, room names get parity, and two transcription-lifecycle faults identified
from the last gate log are carried in — transcription must stop on mute rather
than starve an open socket, and network failures must stop being reported as
credential failures. Backlog gains five items found by scanning the historical
planning documents rather than the current session: the under-delivered flag
motif, bubble-header background colour, two-graphic mute icons with the
bubble-header icon convention, the Ear/TTS/Mute wording pass, and installability.

**v10.7.0 · 2026-08-10.** Install faults diagnosed. **Chrome on iOS is Safari
underneath** — Apple requires it — so it can never install a web app nor receive
web push, whatever is built. iOS testing must be Safari, added to the home
screen from the Share menu. On Android the cause was ours: the manifest link was
added by script after load, and install eligibility is decided during parse, so
the browser never saw it. Head tags are now injected at build time, along with
the iOS meta tags and touch icon. The ribbon's centre drifted because the first
attempt collapsed the right zone after moving its buttons into the middle;
equal growth on both sides centres it regardless of the name. Backlog gains
**group conversations of three or more** — found by accident, the relay already
broadcasts to every socket in a session, but everything above it assumes two
people.

**v10.6.1 · 2026-08-08.** Backlog gains an autofill fault: Chrome reads the room
creation dialog as a sign-up form, offers the password popup for the room name
and then offers to save it as a password — so a manager may store a room name as
a credential, or fill a password into the field.

**v10.6.0 · 2026-08-08.** Notification content decided: **a single aggregate
line on both platforms** — "12 chats, 4 calls and 7 videos across 6 rooms". It
names nobody, quotes nothing and reveals no room, so it is the privacy answer
and the useful answer at once, and it costs nothing because the counts already
exist. One line because iOS gives only one; Android's expanded view is a bonus,
not the design. Composed on the device from counts the worker fetches, so
nothing but a bare wake ever reaches a push service. Two items to the backlog:
the **per-room notification alias** (an alias shown in place of the room name,
blank meaning silent) and **choosing the installed name and icon**, which must
happen before install because a manifest is read once and cannot be changed
afterwards.

**v10.5.0 · 2026-08-07.** Update propagation **resolved and device-passed** as
`bridge-turn24-pre-base.html`, ahead of the rest of release 7 — renames, name
changes and read receipts are all prompt. The cause was proven in a
two-instance harness before any code was written: receipts were flagged as sent
before the send was attempted, and since room entry precedes the socket opening,
they were lost permanently and never retried. What remains of update propagation
is only the away case, which is push's job rather than a replay's.

**v10.4.0 · 2026-08-07.** Release 6 **passed** at attempt 5;
`bridge-turn23-post-ship.html` is the new baseline. The one outstanding anomaly —
a rename that sometimes appears instantly and sometimes seems to skip — is
narrowed by the owner to a specific cause: the notification does not appear on
the receiving side **when the room is entered, or when focus returns to it**.
That is the same fault as the unsettled read receipts, seen from another angle,
and both are now scoped in release 7 with the shape of the fix stated —
**reconciliation on re-entry**, so nothing depends on having been present when a
message landed. The *while you were away* summary is promoted from a feature to
the organising idea of release 7: anything worth recording there is also worth a
notification, because they answer the same question.

**v10.3.0 · 2026-08-07.** Release 7 written out in full as §6d and given four
additions. Name changes and room renames become **home screen entries** — same
kind of event as a waiting chat or a missed call, with date, time and a tap
straight into the room. The **left panel's navigation card is removed** in favour
of a single tap on the clock, absorbed here from release 10 since the home
screen is already being touched. **Update propagation** is named as the real
problem beneath the late rename: read receipts do not settle, sometimes for
minutes, in sessions where messages and renames demonstrably crossed —
instrument the whole receipt path before changing anything. Carried in with it:
the elevation release's lifecycle signals use new relay message types and are
probably not crossing either, having only been confirmed as local behaviour.
Release 6 gains one correction: the **status popup opens just above the message
it belongs to**, not pinned to the top of the screen.

**v10.2.0 · 2026-08-06.** Release 6 rolled back a second time and rescoped as
attempt 3; graveyard 1.8. **The room name becomes one field, not two** — the
base's own room title and the shared name are the same idea, and holding both is
what failed. It is required at creation, cannot be emptied, and last write wins.
**A rename now writes a system entry into the transcript**, naming who renamed
it and both the old and new names, in the same vocabulary as leaving a chat or a
missed call. **Localization is removed from the release** and rejoins the
backlog as a family: room name, participant names, the creation dialog and the
room menu. QR codes shrink and the drawer extends far enough to show one without
scrolling. The `&debug=1` parameter is scheduled rather than noted as direction
of travel.

**v10.1.0 · 2026-08-06.** Chain resequenced to the owner's grouping: twelve
releases total, six remaining after the one now built. Multitasking during a call
becomes its own release and its open question is **closed by ruling** — losing
focus mutes the microphone, and the back button enters picture-in-picture while
keeping the connection, so the call survives multitasking and the microphone
does not. PWA ships at the front of the push release rather than standing alone,
since push cannot exist without the service worker.

**v10.0.0 · 2026-08-06.** The backlog is emptied into the chain. Every parked
item now has a release number and a home organised by separation of concerns:
PWA foundation (7), OS push and smart home screen (8), call surface (9), compose
and transcription (10), left panel and room menu (11), phrasebook behaviour (12),
phrase-desk reconciliation and import (13), appearance (14), IndexedDB (15).
**PWA is release 7, ahead of push**, because the service worker is what receives
a push — it was previously assumed present and had no place in the chain at all.
Deferred now means out of scope and gone; backlog now means scheduled with a
number. New item scheduled into release 11: home is reached by tapping the clock
in the left panel's ribbon, and the room card that currently does it is removed.
Nine releases remain after the one now built.

**Process note.** Release 6 was built from rulings without its scope being
confirmed back to the owner first. That is the drift this version corrects. No
release starts before its scope is agreed.

**v9.11.1 · 2026-08-06.** The room name popup shows both the name as written and
its translation, for the same reason every message shows both — the pair carries
more context than either half. One line only when the viewer's language is the
language it was written in.

**v9.11.0 · 2026-08-06.** Three rulings. The receipt popup shows Sent, Received
and Read, leaving unreached states blank rather than hidden. The room name popup
opens on a single tap of the ribbon name — and **the room name is localized**,
translated into each viewer's own language, because the name is what carries the
context of the conversation and is useless to the side that cannot read it.
Transcript import is deferred to be built alongside the phrase-desk import when
`phrase-deck-v1` and `phrase-desk` are reconciled, since both raise the same
questions.

**v9.10.0 · 2026-08-06.** All six release-6 questions closed by ruling. Import
deferred to the backlog; export ships in two formats, the structured one being
what a future import reads. Clear is local only, with clear-both-sides recorded
as an initiator-only power for later. Last write wins on renames. Manage keeps
the diagnostics overlay with copy and download, with a note that diagnostics
eventually move behind a launch parameter. Two items added to the release by
ruling: the status detail popup on tapping a receipt, and a room name popup on
tapping the name in the ribbon. Goodbye screen and the phrasebook import-phrases
modal removed from the backlog — neither is wanted.

**v9.9.0 · 2026-08-06.** Release 6 rescoped from "per-room export and delete" to
the **room menu surface** and written out in full in §6c with six open questions
to close before the build. It now carries the two transcription-lifecycle faults
the last gate exposed — transcription starving itself while muted, and network
drops being reported as credential failures — plus the drawer restructure,
Manage tab with the full export/import/clear lifecycle, and room name parity in
both directions. Backlog gains three long-assumed-present items found by
inspection: **there is no PWA** (no manifest, no service worker — it was lost
with an abandoned turn chain), flags are emoji rather than real glyphs, and the
bubble header has no themeable background. Three further inventoried surfaces
were found absent and need a ruling.

**v9.8.0 · 2026-08-06.** Call and network robustness **passed** its two-device
gate. `bridge-turn23-ship.html` is the new baseline. Backlog rewritten and
expanded with five new owner observations: the ribbon strip transformation
(fixed centre positions for the call controls, which supersedes the older
mic-centring item), leaving the app during a call, call timer parity for the
receiver, a typing indicator, and short-phrase double transcription in
dual-channel rooms.

**v9.7.0 · 2026-08-06.** Room lifecycle, naming and elevation **passed** its
two-device gate — soft delete and restore confirmed working end to end.
`bridge-turn23-pre-ship.html` is the new baseline. One fault found and fixed
inside the release: the invite link was built before the room knew its name or
that it granted, so the link carried neither; fields are now captured ahead of
room creation and applied before entry. Two items added to the backlog: room
renames do not propagate to the other side, and Enter should close the room
config dialog.

**v9.6.0 · 2026-08-05.** Joiner shell **passed** its two-device gate: full shell,
no create control, chat both ways, Spanish/English with normalization working on
a new room. `bridge-turn23-base.html` is the new baseline. Relay stability is
**dropped** from the chain — it was instrumented and then overtaken by a passing
two-device gate, so the earlier drops were not the blocker they appeared to be.
One regression found and fixed inside the release: the invite payload was applied
to rooms this device created, swapping the creator's own two languages and
translating every message backwards on both sides; it is now refused for
creator-owned rooms. New owner ruling recorded in §6c: **granted credentials get
their own storage keys**, so a grant never overwrites and a revoke never deletes
a device's own credentials.

**v9.5.0 · 2026-08-05.** Every turn23 stage now has an explicit bulleted scope
(§6a–§6d) instead of a pointer to one shared section. Owner ruling: **the joiner
shell ships on its own, before elevation** — the shell is a surface and can be
gated once the relay is stable; elevation is a mechanism and needs the shell to
be observed in. The earlier merge was a reaction to two failures that are now
attributed to the relay, not to the split. Proactive relay reconnect moved out of
the plumbing release into call and network robustness, where it belongs. Three
items verified directly against the current build and removed from scope: the
phrasebook does not bump its version on entry, Enter in the source field already
keeps the caret, and write-back before pull is present. The plumbing release is
now whatever instrumentation turns up and nothing else — dropped if empty.

**v9.4.0 · 2026-08-05.** `bridge-turn23-base.html` (room lifecycle) failed its
device gate and was rolled back; graveyard 1.6. Owner ruling: **room lifecycle
and joiner parity are one release** — attempted in both orders, rolled back both
times, and there is no intermediate state of the application in which one is
meaningful without the other. §6 is rewritten as a real scope: every surface the
release touches, why it is there, what it must not do, and the gate. A new
release is inserted ahead of it for **relay stability** — the relay drops every
ten to thirty seconds on both sides, which makes any two-sided gate meaningless,
and it is undiagnosed. Also recorded: a `typeof` guard around a rolled-back
dependency turned a missing credential check into a silent no-op; that pattern is
now forbidden. Nine releases.

**v9.3.0 · 2026-08-05.** `bridge-turn23-base.html` (joiner shell parity) failed
its device gate — chat did not flow between the two sides, root cause not found —
and was rolled back; graveyard bumped to 1.5. Room lifecycle and joiner parity
swap places: **room name is the key negotiation between initiator and joiner**
(owner ruling), so the joiner has nothing stable to identify a shared room by
until that field exists. Also recorded: unhiding the joiner's room list makes it
open one background relay socket per room instead of one in total — a real load
change that was inherited rather than declared, and must be a deliberate decision
when parity is retried.

**v9.2.0 · 2026-08-05.** `bridge-turn23-pre-ship.html` (phrasebook symmetry)
failed its device gate with too many regressions to triage and was rolled back;
graveyard bumped to 1.4. Owner ruling: the whole phrasebook concern — target-edit
rewriting source, back-translation, and the clarify stream — moves to a new
BACKLOG (§6b) and is not in the active chain. The chain restarts from
`bridge-turn22.html` with the room card as release 1. Eight releases.

**v9.1.1 · 2026-08-05.** Joiner shell moved ahead of the credential release. The
credential mechanism is mostly joiner-side — receiving a grant, writing it to
storage, losing it on revocation, and the create control being absent — so it
cannot be gated before the joiner shell exists. Ordering was wrong in v9.1.0.

**v9.1.0 · 2026-08-05.** Resequenced: visible work first — card, room lifecycle,
joiner — with the two invisible releases behind them, because the engine passed a
two-phone gate at turn22 and its remaining items are refinements, not blockers.
The invented mic-level-meter release is removed: the meter is present and working
in turn22, and was reported missing on the strength of a keyword search that used
terms this codebase does not use. Ten releases became nine.

**v9.0.1 · 2026-08-05.** Room card corrected to SOT Part 4 — three rows, two
columns — after the owner flagged the spec in use as stale. Verified directly:
`bridge-turn10-pre-base.html` carries a seven-column two-row grid with a
tap-to-reveal popover, which Part 4 supersedes, and `bridge-turn11-pre-base.html`
has no card. The lift-from-turn10 instruction is removed; release 6 builds to the
spec. Part 4 added in full as §6a so this cannot go stale again.

**v9.0.0 · 2026-08-05.** Written after turn22 passed. Consolidates the operating
parameters that had lived only in session memory. Restores the turn-family
naming cycle and the input→output table. Merges room naming, elevation, expiry,
joiner credential storage, and soft-delete revoke/restore into one release per
owner ruling — v8.5.0 had these split across three. Adds the mic level meter as
its own release, having verified it absent from turn22. Records the graveyard
date/lineage caveat after a post-amputation entry was wrongly applied to a
pre-amputation original.
