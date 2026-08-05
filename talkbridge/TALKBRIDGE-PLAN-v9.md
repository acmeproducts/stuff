<!-- TALKBRIDGE-PLAN v9.6.0 -->
# TALKBRIDGE MASTER PLAN v9.6.0

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

**Baseline: `bridge-turn23-base.html` — device-passed 2026-08-05 (room card, then joiner shell). Rollback floor.**

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
| **4** | `bridge-turn23-base.html` | `bridge-turn23-pre-ship.html` | **Room lifecycle, naming, elevation — NEXT.** The credential mechanism end to end, observed in the shell. Scope in §6c. | Yes |
| 5 | `bridge-turn23-pre-ship.html` | `bridge-turn23-ship.html` | **Call and network robustness.** Everything that keeps a live session alive, in one place. Scope in §6d. | No |
| 6 | `bridge-turn23-post-ship.html` | `bridge-turn24-pre-base.html` | **Per-room export and delete controls.** Two features sharing one surface; delete runs an export first unless skipped. | Yes |
| 7 | `bridge-turn24-pre-base.html` | `bridge-turn24-base.html` | **OS push and smart home screen.** Locked and backgrounded push only: service worker registered from the file, relay change, iOS home-screen install. Smart home screen: room-summary dashboard, tutorials on demand, FAQ, per-room activity rollup. Together, because rich notification content depends on the multi-room data. **The only release that modifies the relay.** Gate needs a locked phone and a second device. | Yes |
| 8 | `bridge-turn24-base.html` | `bridge-turn24-pre-ship.html` | **localStorage → IndexedDB.** Architectural and isolated, with a migration path for existing data. Last of the functional work because it touches every call site. | No |
| later | — | `bridge-turn24-pre-ship.html` onward | **Deferred cosmetics.** Icon-graphics rebuild and flag-motif polish. Camera and mic mute as two complete icon graphics rather than a composited slash, extended to bubble headers. Ear/TTS/Mute wording pass. | Yes |

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

## 6b · BACKLOG — not scheduled, not in the chain

Nothing here is a release. Nothing here is picked up as part of another release.
It moves into the chain only by owner ruling.

- **Phrasebook: editing the target rewrites the source.** Owner ruling
  2026-08-05: if the target column is editable it must be able to correct the
  source, or the two drift. Attempted as turn23-pre-base and rolled back with
  too many regressions to triage — see the graveyard. If rebuilt, the redraw
  must happen when the translation returns, not when the edit is submitted.
- **Phrasebook: back-translation.** Behaviour, verdict lifecycle, staleness.
- **Phrasebook: the clarify stream.**
- **Undiagnosed:** transcription disconnect roughly every 12 seconds during a
  call; approximately 30 second initial delivery lag when the recipient is on
  the home screen. Instrument before touching either.

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
