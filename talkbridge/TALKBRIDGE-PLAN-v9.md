<!-- TALKBRIDGE-PLAN v13.3.0 -->
# TALKBRIDGE MASTER PLAN v13.3.0

**Location:** `talkbridge/TALKBRIDGE-PLAN-v9.md` in `acmeproducts/stuff`.
**Owner:** Confi — sole decision-maker, runs every device gate.
**Builder:** Claude — builds, gates, pushes, maintains this plan and the graveyard.

**v11.0.0 is a structural rewrite.** The previous plan had grown to 2305 lines
with §6a, §6c, §6d, §6e, §6f and the backlog each appearing two or three times,
because section inserts duplicated rather than replaced. Nothing could be told
apart. This version has one home for every item and no duplicated sections.

---

## 1 · RELEASES

**BASELINE: `bridge-turn24-pre-base.html`** — read receipts, device-passed
2026-08-07. The only build that has ever passed a gate and still works. Both
`bridge-turn24-base.html` and `bridge-turn24-pre-ship.html` have been
overwritten with it.

| # | Release | Feature | Status |
|---|---|---|---|
| 1 | turn23-pre-base | Room card and home screen | PASSED 2026-08-05 |
| 2 | turn23-base | Joiner shell parity | PASSED 2026-08-05 |
| 3 | turn23-pre-ship | Room lifecycle, naming, elevation | PASSED 2026-08-06 |
| 4 | turn23-ship | Call and network robustness | PASSED 2026-08-06 |
| 5 | turn23-post-ship | Room menu surface | PASSED 2026-08-06 |
| 6 | turn24-pre-base | Read receipt delivery | **PASSED 2026-08-07 — CURRENT BASELINE** |
| 7 | — | PWA, push, away-record | ROLLED BACK ×6. Folded into R10 |
| 8 | turn24-base | Ribbon recovery + fine touches | REBUILD — scope §2 |
| 9 | — | Phrasebook | Not started |
| 10 | — | Notifications and PWA | Not started |
| 11 | — | Responsive layout and collision safety | Not started |
| 12 | — | Multi-party (3+) | Not started |

---

## 2 · RELEASE 8 — ONE RELEASE, ONE GATE

**Source:** `bridge-turn24-pre-base.html` — device-passed 2026-08-07, the last
build the owner approved.
**Target:** `bridge-turn24-base.html` — the next stage in the chain
(`pre-base` → `base` → `pre-ship` → `ship`).
**Delivered:** one build, all fifteen items, gated once.

**Owner ruling 2026-08-13: R8 is not split into micro-releases.** Testing is
expensive and must be respected.

**Builder error corrected here.** R8 was previously built to `pre-ship` and
then to `ship`, skipping two stages of the chain and producing two artifacts
where one was authorised. The filenames are a sequence, not scratch space. The
extra builds have been removed and `base` is the only output.

### 2a · Scope

| # | Item | Status |
|---|---|---|
| 8.0 | Ribbon — mic on the transcript centre line, camera slot collapses when idle, 6px gaps, name capped in `vw`, ellipsis on the text, rules scoped to `#room-ribbon` | Built |
| 8.1 | Home-card dismissal threshold cleared with the count | Built |
| 8.2 | Clock tap goes home; the redundant info card is removed | Built |
| 8.3 | Flag motif — the `test.html` treatment, NOT a stripe band | Built |
| 8.4 | Two-graphic mute icons — complete graphics swapped, never a composited slash | Built |
| 8.5 | Bubble-header icon convention — mic for chat, phone for voice, video for video | Built |
| 8.6 | Room menu icon set — Ear, Headset, Mute. Notify waits for R10 | Built |
| 8.7 | Muting on leaving a call | Built |
| 8.8 | Tap video to swap to PIP | Built |
| 8.9 | PIP draggable, clamped to the viewport | Built |
| 8.10 | Call timer on both sides | Built |
| 8.11 | Typing indicator, transient only | Built |
| 8.12 | Short-phrase double transcription — text comparison, not a time window | Built |
| 8.13 | Ear / Auto-read / Mute wording pass | Built |
| 8.14 | `&debug=1` — diagnostics off by default, errors always kept | Built |

### 2b · The home-card delay, provenance settled

Reported as new. It is not. `homeCards`, `dismissHome` and `clearWaiting` are
**byte-identical from Release 1 (`turn23-pre-base`) to today**.

`dismissHome` records the waiting COUNT at dismissal; `homeCards` shows a card
only when the total exceeds it. Entering a room clears the count to zero but
left the threshold behind, so the next N events raised nothing.

It fires on one path only — `dismissHome` is called only when a card is tapped
on the home screen, never when the same room is entered from the left panel.
The threshold is stored per room, so with several active rooms only the tapped
one goes quiet. A single-room test is what made it legible for the first time.

Reproduced by running Release 1's own code verbatim. Fixed by dropping the
threshold when the count is cleared; a deliberately dismissed card still stays
dismissed while its count stands.

### 2c · Build gates added this release

| # | Gate | Found on first run |
|---|---|---|
| G1 | A part may not `replace` a function another part owns; a deliberate supersession must declare `@supersedes X from Y` | 3 in shipped code |
| G2 | No `querySelectorAll(...).forEach` — throws on older WebKit inside a swallowing catch | 5 in shipped code |

### 2d · Gate

One pass, two devices, on `bridge-turn24-base.html`. Ribbon; a card raising
immediately after leaving a room; clock tap home; icons distinguishable; PIP
swap and drag under a real call; timer on both ends; typing indicator; password
manager silent.

---

## 3 · RELEASE 9 — PHRASEBOOK: TARGET MIRRORS SOURCE

**Not started.** Blocked only on R8 clearing its gate. The source-side rules
are read from the code rather than reconstructed from description (item 9.1).

**Source:** `bridge-turn24-pre-ship.html`, once gated.
**Target stage:** `bridge-turn24-ship.html`.

### 3a · The rule, as the owner stated it

The source field already has a crisp set of behaviours. **The target field must
behave identically.** It is one rule expressed as symmetry, not a list of
features:

| Action on SOURCE | Today | Required on TARGET |
|---|---|---|
| Edit the text, press enter | retranslate, back-translate, clear the verdict, remove the verified tag, log to clarify | identical |
| Press enter without changing anything | retranslate, back-translate, update clarify | identical |

Whatever source does on change versus on bare enter, target does the same, with
the same clarify entries and the same verdict and tag consequences.

### 3b · Scope

| # | Item | Status |
|---|---|---|
| 9.1 | Extract the ACTUAL source-side rules from the code and record them here before building | Not started |
| 9.2 | Editing target retranslates source and back-translates | Not started |
| 9.3 | Bare enter in target retranslates and back-translates, same as source | Not started |
| 9.4 | Editing target clears the verdict and removes the verified tag | Not started |
| 9.5 | Target actions write the same clarify entries as source actions, direction flipped | Not started |

### 3c · DECIDED — builder recommendation, owner may override on sight

| # | Decision | Reasoning |
|---|---|---|
| D1 | **One hop. The edited side is never overwritten.** Typing in target retranslates source and stops there; the new source does not fire its own translation back into target | Any other rule either destroys what the person just typed or loops forever |
| D2 | **Same clarify entry type, with a direction field.** Target-driven changes log exactly as source-driven ones, flipped | Clarify is the history of what changed and what it produced. Two entry types means reading two streams to follow one conversation, and every consumer has to learn both |

These are settled and built to. If either is wrong it will be obvious in the
build and cheaper to correct there than to litigate in the abstract now.

### 3d · Method note

The owner has said they may not recall every source-side specific exactly. The
source rules are already in the code and will be **extracted and shown before
anything is mirrored**. Reconstructing behaviour from prose is the single
failure that has cost this project the most; it is not repeated here.

---

## 4 · RELEASE 10 — NOTIFICATIONS AND PWA

Absorbs the paused release 7. Blocked until the isolated prototype at
`proto/push.html` proves the iOS push chain.

| # | Item | Status |
|---|---|---|
| 10.1 | Does iOS push work at all? Prototype resolves this; everything else here is blocked on the answer | Open question |
| 10.2 | Does TalkBridge's push differ from the prototype's? The prototype always shows a notification; TalkBridge returns early when a window is visible, and Apple revokes push from apps that stay silent | Open question |
| 10.3 | PWA install and home-screen path | Built, never gated |
| 10.4 | Push subscription and delivery | Built, never gated |
| 10.5 | Away-record home screen entries | Built, never gated |
| 10.6 | Notify on/off control in the room menu | Not started |
| 10.7 | Choosing the installed name and icon — must happen before install, since a manifest is read once | Not started |

---

## 5 · RELEASE 11 — RESPONSIVE LAYOUT AND COLLISION SAFETY

Technical debt. 727 hard-coded pixel values across 79 distinct values, zero
media queries, 102 globals with no collision check, 19 unmanaged z-index values.
Slices by surface, converted end to end — spacing and sizing are one job, since
a named scale of fixed pixels is still fixed pixels.

| # | Item | Status |
|---|---|---|
| 11.1 | Collision gate — fail any build where two parts declare the same global | Not started |
| 11.2 | Ribbon, converted end to end | Not started |
| 11.3 | Transcript and bubbles | Not started |
| 11.4 | Drawer and modals — includes the Customize tab density redesign | Not started |
| 11.5 | Room cards and home screen | Not started |
| 11.6 | Stacking order — 19 z-index values to a named scale | Not started |

---

## 6 · RELEASE 12 — MULTI-PARTY

| # | Item | Status |
|---|---|---|
| 12.1 | Group conversations, three or more. The relay already broadcasts to every socket in a session; everything above it assumes two people — language pairs, the two-column transcript, "Talking to X", call negotiation | Not started |

---

## 7 · FUTURE IDEAS — unscheduled, no release

| # | Idea | Status |
|---|---|---|
| F1 | Temporary messages — delete on timer, or one-time view | Idea |
| F2 | Clear transcript | Idea |
| F3 | Broadcasting — list, message, scheduled | Idea |
| F4 | Reminders | Idea |
| F5 | Invites | Idea |

---

## 8 · IMMUTABLE WORKING RULES


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


---

## 9 · APPENDIX

### 6.1 Authority order


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


### 6.2 Fixed infrastructure — never modify


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

#### Naming and the chain (detail)

Stage names cycle within a turn family: `pre-base` → `base` → `pre-ship` →
`ship` → `post-ship`, then the next turn number begins again.

**Every stage name is a real, running, gated release output.** It is not a phase
inside a release, and not a reference-only donor file. One release produces one
output file. The names carry no meaning beyond position — they exist so the
chain reads in order and so any build can be reached by editing the address bar.

A release is built only from its named input, and only after that input has
passed its own gate.

---


### 6.3 Naming and the chain


Stage names cycle within a turn family: `pre-base` → `base` → `pre-ship` →
`ship` → `post-ship`, then the next turn number begins again.

**Every stage name is a real, running, gated release output.** It is not a phase
inside a release, and not a reference-only donor file. One release produces one
output file. The names carry no meaning beyond position — they exist so the
chain reads in order and so any build can be reached by editing the address bar.

A release is built only from its named input, and only after that input has
passed its own gate.

---


### 6.4 Build system


The deployed app is one HTML file. It is **never edited** — it is assembled from
separate parts, so a broken part is deleted and rebuilt rather than patched.

    npm run ship      assemble → contract gate → units → four checks
    npm run deploy    ship → push → read back from GitHub → byte compare

Four pre-push checks: syntax, HTML structure, wire (every referenced element and
handler resolves), and runtime execution against a DOM stub. Each has been
verified to catch its own failure by deliberate breakage.

Green means allowed to push. It never means done.

---


### 6.5 Do-not-touch — retested at every gate


- Boots to the start screen, panel closed, no room auto-opens.
- Side-by-side bubbles, viewer's language on the left, both languages always visible.
- One light theme everywhere; flag motif on ask screens only.
- One transcript: typed and spoken share it; call content is permanent and marked.
- Joiner room-locked; initiator rooms intact across updates, storage untouched.
- Phrasebook pair-scoped, GitHub the source of truth, "already saved" dedupe,
  Recently Deleted restore path.
- Go button always present; "/" search from compose everywhere, including in-call.

---


---

## 10 · CHANGE LOG

**v13.3.0 · 2026-08-13.** R9's two open questions closed as builder decisions
rather than left as questions: one hop with the edited side never overwritten,
and one clarify entry type with a direction field. R9 is no longer blocked on
anything but R8 clearing its gate.

**v13.2.0 · 2026-08-13.** R9 scoped from the owner's specification: the
phrasebook's TARGET field must mirror the SOURCE field exactly — same
retranslation, same back-translation, same verdict and tag consequences, same
clarify entries, both on edit and on bare enter. Five items, two open questions
that block building (loop termination, clarify direction). Source-side rules
will be extracted from the code and recorded before anything is mirrored.

Terminology restated, having been muddled: a RELEASE is a numbered unit of work
(R8, R9); a STAGE is a filename in the chain (`pre-base` → `base` →
`pre-ship` → `ship`). The chain runs continuously and does not reset per
release — R8 consumed two stages, which is why they blurred.

**v13.1.0 · 2026-08-13.** Source and target corrected. R8 takes
`bridge-turn24-pre-base.html` as input and delivers `bridge-turn24-base.html` —
the next stage in the chain. The builder had been writing to `pre-ship` and
then `ship`, skipping two stages and creating two artifacts where one was
authorised; those have been removed. The stage names are a sequence, not
scratch space.

**v13.0.0 · 2026-08-13.** R8 consolidated into ONE release by owner ruling —
no micro-releases, one gate, output `bridge-turn24-ship.html`.

Home-card delay provenance settled with proof rather than inference: the logic
is byte-identical since Release 1 and only triggers when a card is tapped from
the home screen, per room. Not a regression, not unknown provenance — a latent
Release 1 defect that a single-room test finally made legible. Reproduced by
running Release 1's own code verbatim.

Added to scope: 8.2, clock tap goes home and the redundant info card that
currently does that job is removed.

**v12.2.0 · 2026-08-11.** `bridge-turn24-pre-ship.html` shipped — all twelve
fine touches rebuilt on the ribbon base. 254 tests, 0 failed; contract,
ownership, NodeList and CSS blast-radius gates all green; every item verified
present in the built artifact rather than assumed from a passing suite.
Both builds now await the device gate.

**v12.1.0 · 2026-08-11.** Release 8 split by owner ruling: **base is the
ribbon alone, pre-ship carries the twelve fine touches.**

Restoring the previously-approved ribbon geometry verbatim FAILED on device —
the partner name was occluded. Root cause measured, not guessed: the camera
slot was `visibility:hidden`, hiding the control while still holding 34px plus
a 14px gap, so at 360px the name got 39px and at 390px it got 54px against ~55
needed. The approval had been of the icon spacing, not the name; the geometry
was always marginal and only looked right on a large phone. So the ribbon is
fixed rather than recovered, and verified at every width and call state before
building.

Gates G1 and G2 are live and found 3 and 5 violations respectively in
already-shipped code on their first run.

**v12.0.0 · 2026-08-11.** Baseline corrected and release 8 rescoped.

The owner found that `bridge-turn24-base.html` does not update the home page
while `bridge-turn24-pre-base.html` does. Root cause: `P-pwa` declared
`replaces: homeCards, renderHome` and replaced rather than wrapped, discarding
the room-card home page entirely; the replacement also called
`NodeList.forEach`, which throws on older WebKit inside a swallowing catch.
Graveyard 2.7. Everything was rolled back to `bridge-turn24-pre-base.html`,
including all of release 8.

**Consequence for release 8: the ribbon spacing is not in the baseline.** It
lived in a release-7 part, not in the CSS, and was lost with the rollback. It
is recoverable verbatim from commit `5d46f5a0ba` and is now item 8.0 — the
first thing rebuilt, copied not rewritten.

Two build gates added (G1, G2) so both defects fail the build rather than the
device.

**v11.1.0 · 2026-08-11.** Owner triage. Every list now carries a numbered
column and a status column. Backlog dissolved — every item assigned to a
release (8–12) or to Future Ideas, nothing parked without a home. Closed and
removed: room-rename propagation (reported against an unapproved release),
Enter closing the room config dialog (completed), per-room notification alias
(speculation), clear-both-sides, transcript/phrase import, bubble header
background colour, Chrome credential autofill (closed), the 12-second
transcription disconnect and the 30-second delivery lag (both already fixed —
mute starvation and read-receipt flagging respectively). Duplicate Ear/Auto-read
wording entry removed.

**v11.0.0 · 2026-08-11.** Structural rewrite. The plan had reached 2305
lines with six sections duplicated two or three times, because inserts
duplicated rather than replaced — nothing could be told apart. Restructured
to releases / backlog / open items / rules / appendix, one home per item.
Release 7 paused pending the iOS push prototype. Release 8 (fine touches)
proposed as next, chosen because none of it depends on push or install.
R8 responsive layout deferred to backlog by owner ruling.


**v10.18.0 · 2026-08-11.** R8 **deferred to backlog by owner ruling** — the
layout work is too risky to run while notifications are unproven, and touching
727 values across live surfaces during an unresolved release is exactly the
setup that produced this session's rollbacks. Revisited only once iOS push and
install are working.

**v10.17.0 · 2026-08-11.** **Release 7 PAUSED** — blocked on iOS push and
install, which are being resolved separately via an isolated prototype at
`proto/push.html`. `bridge-turn24-base.html` is deployed but has never passed a
device gate; the last owner-approved build remains
`bridge-turn24-pre-base.html`.

**R8 proposed and awaiting approval** (§ above): responsive layout and collision
safety, prompted by an independent assessment finding 727 hard-coded pixels
across 79 distinct values with zero media queries, 102 globals with no
collision check, and 19 unmanaged z-index values. Owner ruling recorded: spacing
and sizing are one job, not two — slices are by surface, converted end to end,
because a named scale of fixed pixels is still fixed pixels.

