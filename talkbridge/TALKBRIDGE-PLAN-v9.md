<!-- TALKBRIDGE-PLAN v9.4.0 -->
# TALKBRIDGE MASTER PLAN v9.4.0

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

**Baseline: `bridge-turn22.html` — device-passed 2026-08-05. Rollback floor.**

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
| 2 | `bridge-turn23-pre-base.html` | `bridge-turn23-base.html` | **Relay stability.** The relay drops with code 1006 every ten to thirty seconds on both sides, reconnecting and dropping again, on new and existing rooms alike. Messages are sent, re-sent and never arrive. **No two-sided release can be gated until this stops.** Instrument the whole relay path first — connect, close code, retry timing, how many sockets are open and to which rooms — read the log, then fix. Invisible. | No |
| 3 | `bridge-turn23-base.html` | `bridge-turn23-pre-ship.html` | **Room lifecycle and joiner parity — one release.** Full scope in §6. Attempted twice, split in both directions, rolled back both times: parity first has no room name to identify a shared room by, lifecycle first has no shell in which its credential half can be observed. There is no intermediate state of the application where one is meaningful without the other. | Yes |
| 4 | `bridge-turn23-pre-ship.html` | `bridge-turn23-ship.html` | **Call engine completion.** Mute by track replacement so mute is total. Force reconnect on visibility and focus return. Instrument and then fix the ~12s transcription disconnect and the ~30s delivery lag if the cause is inside the call engine. Blast radius: the call object and its signal handlers only. | No |
| 5 | `bridge-turn23-ship.html` | `bridge-turn23-post-ship.html` | **Remaining invisible plumbing.** Phrasebook version rulings verified against the ruling text — no bump on entry, ingest highest, staleness check before pull, write-back before pull. Proactive relay reconnect on visibility return. Enter-in-source caret. Anything release 4 found outside the call engine. | No |
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

## 6 · RELEASE 3 IN FULL — room lifecycle and joiner parity

**One release, because it is one mechanism seen from two ends.** Credentials in a
device's own storage are the only thing that makes it initiator-capable. The
initiator end writes and revokes them; the joiner end receives, holds, loses and
acts on them. Neither end can be gated alone: that has now been attempted in both
orders and rolled back both times.

### Surfaces this release touches, and why

| Surface | Change | Why it is in this release |
|---|---|---|
| **Create dialog** | Room name field; auto-read defaulting off; grant toggle with a date picker defaulting to 30 days | The room name is the handle by which the two sides agree they are in the same conversation. The grant decision is made once, here, and the link cannot drift from it afterwards. |
| **Invite link builder** | A third link type carrying a grant marker and an expiry | The credentials were always in the invite; a grant is that payload made persistent with a lifetime. Nothing new is distributed. |
| **Share control in the room drawer** | Must emit the granting link for a granting room | Attempt 2 produced a granting room whose joiner reported a plain join. Whichever control the owner actually uses must be the one that carries the grant. |
| **Join path** | Writes credentials to storage with the expiry when the link is a grant; still memory-only otherwise | This write, and nothing else, is what confers capability. |
| **Panel / room list** | Opens for a joiner; create control gated on stored credentials | The joiner cannot observe or act on any of the above without a shell. The create control is not role-gated — it follows the credentials, so it needs no change when a grant arrives or expires. |
| **Room switcher in the ribbon** | Shown for a joiner | Same reason. |
| **Relay subscriptions** | A joiner with N rooms opens N background sockets where it previously opened one | A real load change, declared deliberately rather than inherited from unhiding the room list. Depends on release 2 having made the relay stable. |
| **Room card** | Shows the room name; delete carries lifecycle meaning | Built in release 1; this is what puts a real name in it. |
| **Delete / restore** | Soft delete sends "left the chat" and locks sending, and revokes the grant issued from that room; restore sends "rejoined", which releases the lock, and reinstates the grant | Revocation and reinstatement are the same credential mechanism, and the notices are what make them visible. |
| **Expiry check** | At boot and on room entry, delete credentials past their date | A device closed past the expiry must find out the moment it opens. |
| **Compose strip** | Disabled while the send-lock is on | The lock has to be visible or it looks like a failure. |
| **Rename** | Creator only; ellipsis everywhere, never wraps | Only the initiator owns the name. |

### What this release must not do

- No permission flags, no role checks, no read-only modes. Capability is the
  presence or absence of credentials and nothing else.
- No `typeof` guard around a function another part provides. If a part needs it,
  it ships in that part. Attempt 2 silently did nothing because a dependency had
  been rolled back and the guard swallowed it.
- No new credential distribution. The invite already carries them.

### Gate

Two physical devices, not two browsers. Create a named room with the grant on;
join from the second device; confirm the name matches on both sides, the joiner
reaches its room list and drawer, and the create control is present there and
absent on a plain join. Then force an expiry, delete the room, and restore it.

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
