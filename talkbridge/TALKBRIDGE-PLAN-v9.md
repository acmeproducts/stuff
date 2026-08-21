<!-- TALKBRIDGE-PLAN v14.12.0 -->
# TALKBRIDGE MASTER PLAN v14.12.0

**Location:** `talkbridge/TALKBRIDGE-PLAN-v9.md` in `acmeproducts/stuff`.
**Owner:** Confi — sole decision-maker, runs every device gate.
**Builder:** Claude — builds, gates, pushes, maintains this plan and the graveyard.

**v11.0.0 is a structural rewrite.** The previous plan had grown to 2305 lines
with §6a, §6c, §6d, §6e, §6f and the backlog each appearing two or three times,
because section inserts duplicated rather than replaced. Nothing could be told
apart. This version has one home for every item and no duplicated sections.

---

## 0a · STANDING RULE — RULES PREVENT HARM, NOT PROGRESS (owner, 2026-08-21)

When one of our own rules blocks forward motion, the move is to read the
rule's INTENT. Rules exist to prevent harm, not to prevent progress. Surface
the conflict plainly, state the intent, recommend the resolution — never
silently violate the rule, and never sit blocked behind its letter. First
application: the A9 "don't repoint app.html until A8 passes" guard made A8
impossible (the installed icon launched the old build); intent was protecting
users from ungated code, the owner IS the gate, so app.html was repointed to
the 24·post-ship candidate on owner ruling to let the matrix run.

## 0 · TURN / STAGE LEDGER — THE CHAIN IS THE LAW

Every turn runs pre-base → base → pre-ship → ship → post-ship, in order.
A new turn begins only after post-ship completes. Every release declares its
turn+stage HERE before building; a build emitting any other filename fails
its gate on the name alone. Links are live GitHub Pages URLs; no link = not
built yet.

| Turn·Stage | Release | Status | Artifact |
|---|---|---|---|
| 24·pre-base | Approved 2026-08-07 baseline (R8 source) | Frozen | https://acmeproducts.github.io/stuff/bridge-turn24-pre-base.html |
| 24·base | R8a — chat surface & chrome | PASSED | https://acmeproducts.github.io/stuff/bridge-turn24-base.html |
| 24·pre-ship | R8b — call surface | PASSED | https://acmeproducts.github.io/stuff/bridge-turn24-pre-ship.html |
| 24·ship | R9 — phrasebook target mirror + "was" traceability | PASSED | https://acmeproducts.github.io/stuff/bridge-turn24-ship.html |
| 24·post-ship | R10 — PWA Migration Phase A (governed) | Candidate built; AWAITING owner device matrix (A8) | https://acmeproducts.github.io/stuff/bridge-turn24-post-ship.html |
| 25·pre-base | Snapshot of 24·post-ship once it passes | Not started | — |
| 25·base | R11 — responsive layout & collision safety (incl. 11.7 occluded video-mute icon) | Not started | — |
| 25·pre-ship | R12 — multi-party | Not started | — |
| 25·ship | R13 — secret migration Phase B (governed, owner go only) | Not started | — |
| 25·post-ship | Unassigned — reserved | — | — |

NAMING CORRECTION 2026-08-16: the R10 candidate was mis-emitted as
`bridge-turn25-base.html`. Canonical artifact is `bridge-turn24-post-ship.html`
(byte-identical). The turn25 file remains ONLY as a temporary alias in case
the owner installed from that URL; it is retired when A8 passes.

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
| 9 | — | Phrasebook | Built (candidate) |
| 10 | — | Notifications and PWA | Built (candidate) |
| 11 | — | Responsive layout and collision safety | Built (candidate) |
| 12 | — | Multi-party (3+) | Built (candidate) |

---

## 2 · RELEASE 8 — SPLIT IN TWO BY OWNER RULING 2026-08-13

The all-in-one R8 failed its device gate: the room-menu toggle graphics were
swapped when the owner had asked for wording only, destroying the toggles'
off-state slash. Rolled back. The owner has ruled the release is now two gates,
each small enough to test without exhaustion.

**Standing rules from the failures:**
- The room-menu toggle graphics (base glyphs, `.tog-slash` state line) are
  NEVER touched. Wording only.
- The ribbon media controls (mic, camera — icons, classes, handlers) are
  NEVER wrapped, restyled, or referenced by appended code. 8.4 is dead and
  buried (graveyard). When the owner says a working thing must not be
  touched, the base's version stands — not the build's version of it.

### 2a · R8a — chrome and text. No calls needed to test.

**Source:** `bridge-turn24-pre-ship.html` (approved). **Target:** `bridge-turn24-base.html`.

| # | Item | Status |
|---|---|---|
| 8.0 | Ribbon | IN BASELINE — device-passed |
| 8.1 | Home-card dismissal fix | IN BASELINE |
| 8.2 | Clock tap goes home; redundant info card removed | Built |
| 8.3 | Flag motif — home screen body + the two name-ask cards (S0, S10) only; flags-tall/contain on the body; all `.gif` layers gone incl. a cascade override of the base's dead layer | Built |
| 8.5 | Bubble-header origin icons — mic / phone / video | Built |
| 8.6 | Room menu WORDING ONLY: "Hear their voice" / "Hear translation" / "Ringer". Base glyphs and slash untouched | Built |
| 8.13 | iPhone typography (legibility pass) | Built |
| 8.14 | Password-manager silence | Built |

**Gate:** one pass, one phone is enough. Menu wording correct AND all three
toggles still flip with the red slash; clock tap; flags on home + name cards;
no password prompts; typography.

### 2b · R8b — the call surface. Needs a real two-phone call.

**Source:** `bridge-turn24-base.html` once R8a passes. **Target:** `bridge-turn24-pre-ship.html`.

| # | Item | Status |
|---|---|---|
| 8.7 | Mute on leaving a call (defocus), restore on return | Waiting on R8a |
| 8.8 | Tap video → PIP | Waiting on R8a |
| 8.9 | PIP draggable, clamped | Waiting on R8a |
| 8.10 | Call timer both sides | Waiting on R8a |
| 8.11 | Typing indicator, transient | Waiting on R8a |
| 8.12 | Short-phrase dedup by text | Waiting on R8a |

The code for all six exists, harness-proven in the rolled-back build; it is
re-applied to the R8a base, not rewritten.

### 2c · Build gates

G1 (`@supersedes`), G2 (no `NodeList.forEach`), and the harness at
`talkbridge/build/harness.mjs` with `talkbridge/build/mutate.mjs` — every gate
mutation-tested with fresh defects. Nothing ships red.

### 2d · Backlogged out of R8

`&debug=1` — owner ruling: high risk, no reward right now.

### 2e · Backlog — owner observations, recorded not scheduled

(B-8a) Timer values differ between sides by the time between call placed and
call answered.
(B-8b) A room-name change doesn't reach a partner sitting in the room menu
until they exit it.
(B-8c, 2026-08-16) The invite link/QR carries the name captured when the room
was created; renaming yourself later in the room menu does NOT update what the
invite says ("Bob is inviting you…" persists after Bob → Alice). Owner ruling
on the clean fix, when scheduled: room CREATION gets a name field that
SUGGESTS the standing name but can be overridden per room (e.g. "Mr Jones"
for formal invites); the invite carries that room's name.

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
| 9.1 | Extracted from the gated build's `pbCommitEdit` (recorded below) | Done |
| 9.2 | Editing target retranslates source and back-translates | Built |
| 9.3 | Bare enter in target retranslates and back-translates, same as source | Built |
| 9.4 | Editing target clears the verdict (only if set, per source's G8 rule) and removes the verified tag | Built |
| 9.5 | Target actions write the same clarify entries, `direction:'target'` field added | Built |

**9.1 — the source rules, extracted verbatim from the gated build:**
S-RULE-1 changed source → verdict reset ONLY if a verdict was set (chain-logged),
✓Verified stripped, card touched. S-RULE-2 empty source → rerender only.
S-RULE-3 Enter, changed or not → retranslate the other side (write only if the
result differs) and re-run back-translation. S-RULE-4 the edited side is never
overwritten by its own commit. Target now follows all four, direction flipped,
under D1 (one hop) and D2 (same clarify type + direction field).

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

## 4 · RELEASE 10 — PWA MIGRATION, PHASE A (GOVERNED)

The prior R10 (prototype-blocked notifications/PWA) is SUPERSEDED. The owner
has formally validated a working iPhone PWA + Web Push implementation and
issued a GOVERNING EXECUTION PROMPT that owns this release end to end:

    talkbridge/TALKBRIDGE-GOVERNING-PHASE-A-PHASE-B-EXECUTION-PROMPT.txt

That document is AUTHORITATIVE for R10. It is executed AS WRITTEN — no
redesign, no scope widening, no architecture substitution. Summary only (the
document governs, this table does not):

| # | Item | Status |
|---|---|---|
| 10.A0 | Baseline capture: app.html target, current bridge, manifest, tb-sw.js, worker SHA, invite/link formats, credential keys, relay identifiers — read mechanically from the CURRENT production source, never inferred | Built (candidate) |
| 10.A1–A2 | Production manifest + SW registration; distinguish Safari tab from standalone PWA | Built (candidate) |
| 10.A3 | Safari → installed-PWA handoff via the PROVEN short-lived-cookie bridge (NOT localStorage); Link Device uses the same handoff | Built (candidate) |
| 10.A4 | Credential architecture UNCHANGED in Phase A | Not started |
| 10.A5–A7 | Push subscription via the proven tb-sw.js + existing relay path; relay and room lifecycle untouched | Built (candidate) |
| 10.A8 | Phase A test matrix as specified, incl. both rooms waking the same PWA | AWAITING OWNER DEVICE MATRIX — candidate live at bridge-turn25-base.html, independently re-gated 17/17 + 11/11, byte-verified |
| 10.A9 | STOP GATE: app.html repoint only after A8 passes; then evidence report and halt. Phase B does not start until the owner explicitly says so | Blocked on A8 |

Standing constraints repeated because they bind every build here: relay
(`talkbridge/worker-talk.js`) is NOT modified in Phase A; `testpwa.html` is a
diagnostic harness, never production; no unrequested changes; smallest
possible diff; app.html is not repointed until the build passes.

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
| 11.7 | Mute VIDEO icon occluded (owner report 2026-08-14). Cause unknown — instrument and read the base's actual rendering before any fix; no theorised root cause. The ribbon media controls sit under the standing never-touch rule, so the fix needs an explicit owner-scoped exception and the smallest possible change. Owner directive on this item: DO NOT BREAK ANYTHING. | Not started |

---

## 6 · RELEASE 12 — MULTI-PARTY

| # | Item | Status |
|---|---|---|
| 12.1 | Group conversations, three or more. The relay already broadcasts to every socket in a session; everything above it assumes two people — language pairs, the two-column transcript, "Talking to X", call negotiation | Not started |

---

## 7 · RELEASE 13 — SECRET MIGRATION, PHASE B (GOVERNED, VERY LAST)

Placed at the BACK of the schedule by owner ruling 2026-08-15: runs only
after R9, Phase A (R10), R11, and R12 are done, and only on the owner's
explicit go. Governed by the same document as R10:

    talkbridge/TALKBRIDGE-GOVERNING-PHASE-A-PHASE-B-EXECUTION-PROMPT.txt

Scope as governed (summary; the document owns the detail): move the four
long-lived service secrets (tb_dg_key, tb_cf_tid, tb_cf_tok, tb_gh_pat)
behind the EXISTING relay; one opaque TalkBridge authorization value replaces
client-side service secrets; /service actions, client authorization
abstraction, invite/grant/link payload changes, secret-leak audit, and the
full Phase B test matrix — all exactly per the governing prompt, with its
rollback rules and required report format.

---

## 8 · FUTURE IDEAS — unscheduled, no release

| # | Idea | Status |
|---|---|---|
| F1 | Temporary messages — delete on timer, or one-time view | Idea |
| F2 | Clear transcript | Idea |
| F3 | Broadcasting — list, message, scheduled | Idea |
| F4 | Reminders | Idea |
| F5 | Invites | Idea |

---

## 8 · IMMUTABLE WORKING RULES

### The `.gif` layers are a SWAP SLOT — never "fix" the 404

Every flag layer asks for a `.gif` first and falls through to the `.png`
beneath it. **The `.gif` is deliberately absent.** Dropping one into the repo
replaces the artwork — animated or otherwise — with no code change at all.

The console 404 is that mechanism working as designed, not a defect. It has
been reported as a bug more than once and was nearly removed, which would have
silently deleted the feature. Both assets carry the slot:

    flags.gif      -> flags.png       landscape, for short wide surfaces
    flags-tall.gif -> flags-tall.png  portrait, for the full-height home body

Two assets, not one, because `background-size:cover` fills the LONGEST axis:
the landscape strip on a tall phone magnifies ~2.9x until two or three flags
fill the screen, and the portrait asset on a 72px strip crops to a sliver. Each
shape belongs to the surface it matches.


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

**v14.12.0 · 2026-08-21.** A8 first run failed structurally, not by owner
error: manifest start_url → app.html → OLD build with no handoff code, so the
installed icon launched an inert fresh app. Contradiction in the governing
prompt surfaced and resolved by owner ruling: app.html repointed to
bridge-turn24-post-ship.html so the matrix can run. New standing rule 0a:
rules prevent harm, not progress. Candidate itself untouched.

**v14.11.1 · 2026-08-16.** Backlog B-8c recorded: invite link/QR keeps the
creation-time name after a rename; owner's ruled design — override-able name
suggestion at room creation. Observation only; nothing built, A8 device
testing continues on 24·post-ship.

**v14.11.0 · 2026-08-16.** Owner correction: we are at TURN 24, and R10's
candidate belongs at its POST-SHIP stage, not at a new turn. Turn/stage ledger
added as section 0 with live links per artifact — the chain (pre-base → base →
pre-ship → ship → post-ship, new turn only after post-ship) is now law, every
release pinned to its turn+stage, and wrong-name builds fail on the name.
Canonical R10 artifact: bridge-turn24-post-ship.html; turn25-base retained
only as a byte-identical temporary alias. Forward mapping: 25·base=R11,
25·pre-ship=R12, 25·ship=R13. Graveyard entry added.

**v14.10.1 · 2026-08-15.** Status sync: A0–A7 all Built (candidate) in
`bridge-turn25-base.html`; A8 awaits the owner's device matrix; A9 blocked on
A8 — app.html still points at the prior build by design. Independently
re-gated on deployed bytes: harness-r10 17/17, mutations 11/11.

**v14.10.0 · 2026-08-15.** R10 Phase A candidate BUILT to
`bridge-turn25-base.html` from approved `bridge-turn24-ship.html`, exactly per
the governing prompt: manifest link + pre-bootstrap cookie handoff
(tb_install_handoff_v1, governed attributes, raw j untouched, oversize guarded,
failure keeps the cookie), SW registration of the existing tb-sw.js,
standalone/browser distinction, one Enable-notifications control (standalone
only; Safari tab gets the Home-Screen hint), governed per-room VAPID +
subscribe flow, room-specific unsubscribe on hard delete only, tb-context with
ids and cursors only. Relay untouched; all four credentials untouched;
app.html NOT repointed. Harness harness-r10.mjs 17/17 (three boot modes,
real invitation payload built by the app's own encoder); mutate-r10.mjs 11/11.
Awaiting the owner's device matrix A1–A12, then the A9 stop gate.

**v14.9.0 · 2026-08-15.** R9 gate FAILED: target edits carried no was-trace.
Rolled back; rebuilt. Owner ruling: EVERY target change writes a clarify entry
'Target edited (was "<prior>")', direction-tagged, before verdict logic —
S-RULES are the floor of a mirror, the owner's outcome is the spec. Harness
35/35 incl. the no-verdict case; mutations 33/33.

**v14.9.0 · 2026-08-15.** R9 PASSED the device gate ("Big Time"). Ship
snapshot preserved as `talkbridge/fixtures/bridge-turn24-approved-2026-08-15b.html`
— the new approved baseline. Next per plan order: R10 — PWA Migration Phase A,
executed exactly per the governing prompt, ending at its hard stop gate.

**v14.8.0 · 2026-08-15.** R9 built to `bridge-turn24-ship.html` on the gated
pre-ship. Source rules extracted from the real `pbCommitEdit` and recorded
(9.1); target branch superseded via wrap with every original effect preserved
and declared; source/notes pass through to the original untouched. Harness
+5 effect tests against a seeded card through the REAL wrapped commit path
(34/34 full-chain); +5 fresh mutations (31/31). Awaiting device gate.

**v14.7.0 · 2026-08-15.** R8 PASSED the device gate. Two owner observations
recorded to backlog, not defects blocking anything: (B-8a) the timer values
differ between sides by the time between call placed and call answered —
caller counts from placing, receiver from answering; (B-8b) a room-name
change does not reach the partner while they sit in the room menu, only on
exiting the room. Approved snapshot refreshed. R9 (phrasebook target mirrors
source) unblocked and building; source `bridge-turn24-pre-ship.html` as
gated, target `bridge-turn24-ship.html`.

**v14.6.0 · 2026-08-15.** Gate FAILED again: chat mark's inserter anchored on
markup the renderer never produces (test was vacuous — it tested a sample the
test invented); room names desynced with NO proven cause. Rolled back, chain
rebuilt: anchor read from the real renderer and tested THROUGH the real
renderer; timer fix unchanged; read-only name instrumentation added so the
desync produces evidence at the next gate. Desync is INSTRUMENTED, not fixed —
stated plainly.

**v14.5.0 · 2026-08-15.** (Rebuild shipped same day: chain rebuilt from the approved baseline — base and pre-ship both replaced, harness 28/28, mutations 25/25.) R8b device gate FAILED twice over: the call timer
flickers on the receiver because two writers fight over one slot every second
(graveyard: ONE SLOT, ONE WRITER), and 8.5's chat mark was never built despite
being in the item's name (graveyard: scope is every word of the item). Rolled
back pre-ship to the R8a base. Rebuild from the clean chain: 8.10 timer as the
slot's ONLY writer (base interval killed, relay stamp no-opped, purely local),
8.5 completed with a chat-bubble mark on typed entries from either input path.

**v14.4.0 · 2026-08-15.** Owner delivered a formally validated PWA/push
implementation with a governing execution prompt (stored in the repo).
Old R10 superseded: R10 is now PWA Migration Phase A, executed after R9
exactly as governed, ending at a hard stop gate. Phase B (secret migration)
is scheduled DEAD LAST as R13, after all other slated work, on explicit owner
go only. Plan-only change; no code touched.

**v14.3.0 · 2026-08-14.** Item 11.7 added by owner instruction: mute video
icon occluded. Plan-only change; no code touched.

**v13.4.0 · 2026-08-13.** Flag branding corrected with a second asset.
`flags-tall.png` (284x770) added for the full-height home screen body; the
landscape `flags.png` stays on the cards and drawer strip. `cover` fills the
longest axis, so one shape cannot serve both.

**The `.gif` swap slot is now documented as a rule** (§8). It is deliberately
absent so the artwork can be replaced without a code change; the console 404 is
the mechanism working, and the builder was one approval away from removing it
as a bug.

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

**v14.2.0 · 2026-08-14.** R8b built on the R8a base by owner instruction:
8.7 defocus mute (CALLS the base's own toggleMic as a user tap would — the
amended standing rule's one permitted use; no wrap, no reassignment, no icon
code, enforced by harness guards), 8.8 tap→PIP, 8.9 PIP drag, 8.10 call timer,
8.11 typing, 8.12 dedup. Target `bridge-turn24-pre-ship.html`; approved
2026-08-07 baseline preserved at `talkbridge/fixtures/bridge-turn24-approved-2026-08-07.html`.
Harness chain-checks approved→R8a→pre-ship; 26/26. Process rule added after an
environment death nearly lost the build: PUSH AFTER EVERY PROVEN STEP.

**v14.1.0 · 2026-08-13.** Second device-gate failure: the ribbon mic wrap
left the microphone completely disabled. Rolled back; 8.4 removed and buried;
standing rule bans any appended reference to the ribbon media controls;
harness gains mic-untouched regression guards (19/19, 14/14 mutations). R8a
rebuilt without any media-control code.

**v14.0.0 · 2026-08-13.** All-in-one R8 FAILED its device gate — the three
room-menu toggles stopped functioning and lost their red slash. Cause: the
icon swap replaced the base glyphs that carry the `.tog-slash` state line,
when the owner had asked for wording only. Rolled back to the approved
pre-ship. Owner ruling: R8 splits into R8a (chrome and text, no call needed to
test) and R8b (call surface, two-phone test), gated separately. The menu
toggle graphics are never touched again. The harness now asserts the base
glyphs and slash survive, and that exact regression class is mutation-tested.

**v13.5.0 · 2026-08-13.** Owner rescope. R8 source is now
`bridge-turn24-pre-ship.html` (carries device-passed 8.0 and 8.1); target is
`bridge-turn24-base.html`. 8.6 revised: three controls — Ear "Hear their
voice", Headset "Hear translation", Bell "Ringer". 8.13 is now iPhone
typography; 8.14 is now password-manager silence. `&debug=1` moved to backlog
by owner ruling — high risk, no reward right now. Graveyard entry added on why
the gate suite allowed the drift; harness to be rewritten before this build is
trusted.

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

