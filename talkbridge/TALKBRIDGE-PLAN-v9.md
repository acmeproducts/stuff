<!-- TALKBRIDGE-PLAN v20.59.0 -->
# TALKBRIDGE MASTER PLAN v20.59.0

**Location:** `talkbridge/TALKBRIDGE-PLAN-v9.md` in `acmeproducts/stuff`.
**Owner:** Confi — sole decision-maker, runs every device gate.
**Builder:** Claude — builds, gates, pushes, maintains this plan and the graveyard.

**v11.0.0 is a structural rewrite.** The previous plan had grown to 2305 lines
with §6a, §6c, §6d, §6e, §6f and the backlog each appearing two or three times,
because section inserts duplicated rather than replaced. Nothing could be told
apart. This version has one home for every item and no duplicated sections.

---

## 0c · STANDING RULE — ACCEPTED ARTIFACTS ARE IMMUTABLE (owner, 2026-09-01)

An accepted release's files are frozen the moment the owner accepts them.
No build, fix, migration, or cleanup may ever modify, replace, relocate, or
delete an accepted artifact — or any file an accepted artifact loads at its
shipped address (its manifest, worker, icons). All change ships as a NEW
named candidate at a NEW address and reaches users only after the owner's
device gate. The only permitted write to an accepted artifact is a rollback
that restores earlier accepted bytes. Before any push, every touched path is
checked against the accepted-baseline file list; a match aborts the push.
First application: commit fb7ed76 overwrote the accepted turn24-post-ship in
place, replaced the shared root manifest, and broke the live join flow (G25).
It was reverted byte-exact the same day.

## 0b · STANDING RULE — TESTING IS EXPENSIVE; CLAUDE OWNS PRE-FLIGHT (owner, 2026-08-24)

The owner does not test that Claude executed correctly. Testing is expensive
and reserved for what only devices can prove. Claude's obligations before
handing anything to the owner:
- Byte-verify every push against the exact commit SHA (never ref=main)
- Run the full harness and mutation gate and state the scores
- For relay changes: run the relay harness AND the deploy-pipeline WS probe
- For any rollback: confirm the file bytes match the target source exactly
- State what was proven and what remains for device testing — the owner tests
  only the latter

Asking the owner to "verify" a file copy, a byte match, or a deploy result
is a violation of this rule.

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
| 24·post-ship | R10 — ONE PATH: PWA + notifications + journey + lane telemetry | **ACCEPTED 2026-08-31 (owner): R10-CR3 pair `ac541c1`** — app `6abc47d77ed2` + worker + relay v6.2 | https://acmeproducts.github.io/stuff/bridge-turn24-post-ship.html |
| 25·pre-base | = accepted 24·post-ship, byte-identical snapshot | **Frozen 2026-08-31** sha256 `6abc47d77ed2` | https://acmeproducts.github.io/stuff/bridge-turn25-pre-base.html |
| 25·base | Notifications + caller call round trip | **ABANDONED (owner ruling 2026-09-04)** — entire turn-25 body of work discarded; address rolled back byte-exact to accepted `ac541c1` (rollback commit `a45efc3`). All turn-25 candidate content is graveyard G44. | https://acmeproducts.github.io/stuff/bridge-turn25-base.html (now serves accepted bytes) |
| 25·pre-ship | Calls & video surface | **ABANDONED (owner ruling 2026-09-04)** — same ruling; address rolled back byte-exact to accepted `ac541c1`. | https://acmeproducts.github.io/stuff/bridge-turn25-pre-ship.html (now serves accepted bytes) |
| 25·ship | **Multi-user** | CANCELLED — turn 25 closed by owner ruling 2026-09-04 | — |
| 25·post-ship | **Technical debt — the full cleanup pass** | CANCELLED — turn 25 closed by owner ruling 2026-09-04 | — |
| 26·pre-base | = accepted 24·post-ship (turn 25 produced no accepted work), byte-identical snapshot | **ACCEPTED 2026-09-04 (owner)** — device gate: Android call audio confirmed working (earlier "no audio" report was disconnected earbuds in another room, not the app). sha256 `6abc47d77ed2` · paired relay v6.2 byte-verified, deployed, health green | https://acmeproducts.github.io/stuff/bridge-turn26-pre-base.html |
| 26·base | Calls package re-landed clean (N10 caller screen + ring-back, N18 timers anchored at answer, N16 shared device log, P1 relay-fed presence) · relay v6.3 additive pair | **ACCEPTED 2026-09-04 (owner: "persistence is slow but it works") — presence damping reservation carried to backlog.** Declared/actual contract: wraps CALL/RING/handleRelay/log, replaces nothing, no scope/manifest/subdirectory change, no mute (G42), timer fed not silenced (G43), attachment not visibility (G23). Mutation gates 2/2. | https://acmeproducts.github.io/stuff/bridge-turn26-base.html |
| 26·pre-ship | D-2 un-hijack WITHOUT file moves (narrow prefix scope `/stuff/bridge-` on a new manifest `tb-manifest-turn26.webmanifest` + narrowed worker registration + exact-match legacy-worker retirement, push migrated first) + B-8c (creation name field, invite/QR carries the room's name, stamped at generation) | **ACCEPTED 2026-09-04 (owner device gate: PRISM opens plain, iPhone QR install lands in room, room-name invites, single push).** D-2 CLOSED. B-8c CLOSED. Spec deviation from §5.2 declared: the folder move is replaced by scope VALUES — W3C manifest scope is prefix-based by design ("consistency with Service Workers"), and a worker may register a scope deeper than its directory with no header. No start_url anywhere (fb7ed76/G25). Accepted manifest untouched. Contract+mutation gates 3/3. | https://acmeproducts.github.io/stuff/bridge-turn26-pre-ship.html |
| 26·ship (candidate 1) | video experience | **FAILED DEVICE GATE 2026-09-05 → buried G45** (symptoms only, diagnosis deferred by owner ruling). Video wants → backlog BL-V1/V2/V3. | https://acmeproducts.github.io/stuff/bridge-turn26-ship.html (dead candidate, stays hosted) |
| 26·ship (candidate 2) | Arrival & identity per §7.1 (W1 welcome pill + invite carries room title, R2 live rename to open drawer, J3 join-by-link) | **BUILT 2026-09-05 to spec §7.1 on owner GO — device gate pending.** Machine gates M1–M5 PASS; mutations 3/3 caught. **REJECTED by owner 2026-09-05 → buried G46: J3 built on the home surface against its own spec line (panel = create-control container).** | https://acmeproducts.github.io/stuff/bridge-turn26-ship2.html (dead) |
| 26·ship (candidate 3) | Same §7.1 scope; J3 relocated to the rooms panel per spec; every candidate now logs a build-identity boot line | **REJECTED and REMOVED FROM THE REPOSITORY at owner order 2026-09-05** — Join button rendered under the + control (G47). File deleted; no candidate is entertained at this address. | (deleted) |
| 26·ship (candidate 4) | Owner-scoped rebuild on accepted 26·pre-ship: #653 "Join thread" as the FOURTH clock long-press option (paste/QR via BarcodeDetector, hidden everywhere else, joins via the untouched #j= boot path — per the 2026-09-01 written direction) + welcome pill "name is inviting you to title (Yours ↔ Theirs)" + build identity (boot log line + clock-menu footer with build date/time) | **REJECTED 2026-09-05 (owner: onboarding broken) → buried G48; address rolled back byte-exact to accepted 26·pre-ship.** | https://acmeproducts.github.io/stuff/bridge-turn26-ship.html (now serves accepted pre-ship bytes) |
| 26·post-ship | Notifications & steadiness per §7.2 (K1 worker icon/alert + old-worker retirement, P2 presence damping, C3 render coalescing) | Spec complete §7.2 — builds only after §7.1 accepted | — |
| 27·pre-base + 27·base | IndexedDB mirror per §7.3 (DB1 kv store, DB2 dual-write + evict-restore, DB3 parity surface); cutover and multi-user are turn 28+ | Spec complete §7.3 — builds only after §7.2 accepted | — |

NAMING CORRECTION 2026-08-16: the R10 candidate was mis-emitted as
`bridge-turn25-base.html`. Canonical artifact is `bridge-turn24-post-ship.html`
(byte-identical). The turn25 file remains ONLY as a temporary alias in case
the owner installed from that URL; it is retired when A8 passes.

---

## 0d · OPEN DEFECTS — NOT ROADMAP ITEMS (owner, 2026-09-03)

The roadmap is exactly three releases: **multi-user, technical-debt cleanup,
IndexedDB.** Nothing else is a release. Everything below is a defect — a thing
that was working, or was promised working, and is not. Defects are fixed
against the release they belong to; they never become roadmap entries, and
they are never counted as progress.

| # | Defect | State |
|---|---|---|
| D-1 | Android does not ring on the lock screen. Two real causes found and fixed (G30 relay withheld the push on the handset's stale self-report; G34 push subscription reused under an old signing key). Both are live. **Neither changed the device behaviour.** The remaining cause is UNKNOWN — it has not been narrowed to relay-not-sending, push-service-rejecting, or Android-not-alerting, because nothing reports the relay's push result to the owner. | OPEN — cause unknown. The always-push change and the liveness ack gate are BURIED (G36): they did not change device behaviour and they broke a passing contract check. Relay is back on the accepted pair. |
| D-2 | **CLOSED 2026-09-04 (26·pre-ship accepted)** — was: — PRISM is captured by TalkBridge's PWA scope. The app's manifest declares no folder of its own and its worker is registered at the root of `/stuff/`, so TalkBridge claims the whole path. Built once (N2), rolled back with the reset, **never rebuilt — it is in no live artifact.** | FIXED — rebuilt, gated, live at /stuff/talkbridge/ |
| D-3 | iPhone behaviour on returning to a call after leaving the app is unknown. Never tested on device; no claim should be made about it. | UNKNOWN, untested |
| D-4 | Presence indicator does not work. Owner traced it back through turn 23 and found no working version — it PREDATES this cycle and was never caught. | ATTEMPTED (N17) — presence now comes from the relay, which is the only party that knows who is attached |
| D-5 | Call timers do not match between the two sides. | ATTEMPTED (N18) — the anchor moved but the on-screen clock was never restarted, so the display kept its original start; both sides now anchor AND restart at the answer |
| D-6 | Call screen reported not working by the owner on the base address — which does not contain the video build (G38). Needs re-testing on the single address before any cause is claimed. | UNVERIFIED |

**Why these exist:** D-1 is a regression introduced in the R10 candidate work
and not caught. D-2 is a fix that was built, broken, rolled back and then not
rebuilt. D-3 is an untested claim that was stated as fact and should not have
been. All three are builder failures, recorded here so they are never mistaken
for planned work.


---

## 1 · RELEASES

The §0 TURN/STAGE LEDGER is the single authority for release status and
artifacts. The duplicate status table that lived here was stale (it still
showed R9 as a candidate and R10 awaiting GO after both had passed) and
caused drift — removed 2026-09-01 per owner. Historical turn23 results live
in the graveyard and acceptance records.

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

(B-8a) Timer values differ between sides — OPEN, verified in code
2026-09-01: the caller anchors its clock at call placement (mount before
call-start is sent), the callee at accept; the skew equals ring/answer time.
Fix when scheduled: both sides anchor to one shared event (the accept).
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

### 3b · R9 — RESOLVED: passed at 24·ship (ledger, owner). Incompleteness note below is historical only.

#### (historical) R9 INCOMPLETE — target-edit full behaviour not shipped

R9 shipped the "Target updated (was X)" clarify entry. The following behaviour
was specified but NOT built — it must ship as R9.1 before R10:

| # | Item | Status |
|---|---|---|
| 9.1.1 | On target commit (Enter or blur): translate target INTO sourceLang to update source | Not built |
| 9.1.2 | Clarify entry "Source updated (was X)" — even when source was blank (new card) | Not built |
| 9.1.3 | Verdict cleared; ✓Verified tag removed if the card was previously verified | Not built |
| 9.1.4 | Applies identically for new cards and existing cards | Not built |

BT direction (PB-1) is confirmed correct — target→source is standard and the
ML anomaly on simple phrases is not a code defect.

**Source stage:** `bridge-turn24-ship.html`
**Target stage:** `bridge-turn24-post-ship.html` (currently the R10.2 rollback; R9.1 remains unbuilt)
**Gate:** new-card target edit → source updates to translated text, clarify shows both entries, verdict clear, Verified removed; same for existing-card edit.

---

## 5 · RELEASE 11.0 — LOG FIDELITY (25·base prelude; OWNER GO REQUIRED)

**Status: BUILT 2026-08-31 on owner GO ("Go"); live at bridge-turn25-base.html;
owner light check pending.** Baseline: the accepted 24·post-ship bytes
(25·pre-base). One change, nothing else.

### 5a · The problem, as the device showed it

The debug log keeps 400 lines and drops the oldest. Every ~20 s the periodic
refresh writes `rc_panel_rendered`, `rc_home_rendered` and
`joiner_create_control` — three to five lines per refresh, more per open
room. With five rooms the Android wrote ~15 lines every 20 s and the whole
buffer turned over in ~9 minutes: the CR3 device run's Android export held
nothing but idle refreshes (evidence: `governance/evidence/r10-cr3-owner-
acceptance.md`, finding 1). The log is the only instrument the owner and the
builder share; it must survive an hour of testing.

### 5b · The change (hook, never replace)

1. **Refresh lines fold.** A declared set of refresh events
   (`rc_panel_rendered`, `rc_home_rendered`, `joiner_create_control`,
   `r8_menu_labels`, `r8_flag_bands`) is folded: a repeat with the same
   event and identical data updates the existing line's count and last-seen
   time instead of adding a line. A refresh whose data CHANGED (a card
   appeared, a count moved) is a new line, as today. No other event is
   touched — every call, chat, lane, attendance, push receipt and error line
   is recorded exactly as now, one line per occurrence.
2. **Buffer raised** from 400 to 1200 lines.
3. **Export unchanged in shape**; folded lines carry `n` and `last` in their
   data so a reader sees "this refresh repeated 180 times until 04:19:54".

Implemented as an appended part over the frozen bytes (the logging function
is wrapped and calls through; the refresh set is declared in the part).
Declare-before-build contract: wraps `log`; adds the refresh set and the fold;
replaces nothing.

### 5c · Gates

- **Machine (jsdom):** 60 minutes of refresh ticks (5 rooms, every 20 s) plus
  20 real events spread through the hour → the export holds all 20 real
  events in order, each with its own timestamp, and the refresh lines are
  folded with correct counts; a refresh whose data changed appears as its
  own line. Planted defects: fold removed → the 20 do not all survive; fold
  too greedy (folds a non-refresh event) → a repeated real event loses a
  line; count not incremented → wrong `n`.
- **Parity:** frozen bytes carried verbatim; exactly one appended part.
- **Relay, worker:** untouched.
- **Device (owner, light):** run for ~30 minutes with several rooms open,
  export both logs — the exports must show the session's events, not only
  refreshes. No matrix re-run.

### 5d · Outputs and wall

Output: `bridge-turn25-base.html` (the stale R10-A alias of that name is
overwritten; it was retired by the R10 acceptance). The live 24·post-ship URL
stays as accepted until the owner moves to the 25·base URL. Same tb-sw.js and
relay. Build support: `talkbridge/parts/r11-0-log-fidelity.js`,
`talkbridge/build/assemble-r11-0.mjs`, `talkbridge/build/harness-r11-0.mjs`,
`talkbridge/build/mutate-r11-0.mjs`, `package.json` scripts.

## 5.1 · 25·BASE — NOTIFICATIONS, COMPLETE (OWNER LOCK 2026-09-01; GO REQUIRED)

**Problem (r10-cr3 acceptance, finding 2):** Android alerts arrive as a
generic bell icon and a dot in the shade — no heads-up banner.

**Root cause, split honestly:**
1. **Bell icon — proven, ours to fix.** The worker's `showNotification` calls
   supply no `icon`/`badge`, so Chrome renders its generic bell.
2. **No heads-up banner — platform-constrained.** On Android 8+, banner
   behavior is decided by the notification channel's importance, fixed at the
   moment the channel is created; later notifications cannot change it
   (Pushwoosh KB 31878525893789; Android channel docs). Chrome creates one
   channel per site at permission grant. Code cannot raise it afterward.
   The device gate therefore tests two states: as-is, and after elevating
   TalkBridge's notification category once in Android settings (or
   re-granting permission so the channel is recreated).

**Change (hook, never replace; new SW part over the frozen r10-cr3 worker):**
- Add `icon` (icon-192.png) and monochrome `badge` (new icon-badge-96.png,
  white-on-transparent) to every `showNotification` options object — call
  alerts and room bursts alike. Nothing else in the worker changes.
- App and worker move together as always; relay untouched (urgency headers
  do not affect Android display — not in scope).

**Gates:**
- Machine: harness asserts every `showNotification` call carries `icon` and
  `badge`; mutation (strip icon) must fail; parity gate proves frozen worker
  bytes carried verbatim plus exactly one declared part.
- Device (owner): Android alert shows the TalkBridge icon, not the bell;
  banner behavior recorded in both channel states; the five unproven sheet
  rows (2/3/7/8 Android, 13 Android→iPhone) read from the now-foldable log.

**Also in this release (owner lock 2026-09-01):**
- R11.0 log fidelity formally closes here — already device-confirmed
  (Android export: folded lines with n/last, session fits buffer); it is
  gated together with this release in ONE device session, never separately.
- iPhone silence (no sound on arrival) — instrument and resolve.
- Declarative web push (iOS 18.4+): the push payload carries the alert so
  the OS shows it without waking the worker.
- #653 — rejoin a declined room: fourth option on the left-rail clock
  long-press, "Join thread" — camera (QR) or paste-a-URL.

**Sequencing:** builds on the R11.0 turn25-base bytes. Output:
`bridge-turn25-base.html` (this stage's artifact) + versioned worker;
accepted files untouched (rule 0c).

## 5.2 · 25·PRE-SHIP — PRISM SCOPE UN-HIJACK (OWNER GO REQUIRED)

**Part 2 — PRISM scope un-hijack (owner directive 2026-09-01):**
- Root cause (proven, G25): root-hosted app + manifest with no explicit scope
  claims all of `/stuff/`; every sibling app (PRISM) opens inside TalkBridge.
- Fix: candidate app, worker, manifest and icons under `/stuff/talkbridge/`;
  manifest declares `scope` explicitly and **carries NO start address** — an
  install must keep the grant-carrying invite URL (the fb7ed76 lesson).
- Old address becomes a forwarder (hash/query intact); push migrates on the
  new page AFTER its own subscription exists; legacy workers retired only on
  EXACT scope + script match; legacy worker files stay hosted; no storage
  cleared; PRISM untouched.
- Gates add: QR join → install on iPhone AND Android lands in the room;
  PRISM opens from Chrome in a plain tab; no duplicate alerts; rooms and
  device data intact.

**Part 3 — owner-selected backlog (2026-09-01):**
- **#653 — rejoin a declined thread.** Fourth option on the left-rail clock
  long-press: "Join thread" — camera (QR) or paste-a-URL (acceptance
  finding 3).
- **#650 — video call layout.** Tap-to-swap, 9:16 layout, floating PiP.
- **B-8c — invite name.** Room creation gets a name field that suggests the
  standing name but can be overridden per room; the invite/QR carries that
  room's name (owner ruling of 2026-08-16 as written in §2e).


## 5.3 · 25·SHIP — CALL & VIDEO EXPERIENCE (OWNER SPEC 2026-09-01, verbatim intent)

**Placing a call (voice AND video):**
- The microphone is MUTED while placing the call.
- A call screen appears and a ringing (ring-back) sound plays for the caller
  — you are making a call and it must feel like one.
- Timers sync as part of this work: both sides anchor the clock to the
  accept (B-8a folds in here).
- B-8b folds in: a room rename reaches a partner sitting in the open room
  menu live, without exiting it.
- B-8c folds in: room creation gets a name field that suggests the standing
  name but can be overridden per room; the invite/QR carries that room's
  name (owner ruling 2026-08-16).

**Video — behave like WhatsApp (#650 expanded by owner):**
- Back button → 9:16 full-size view collapses to PiP: a very small inlay,
  call stays ACTIVE — the user can check email or browse while the video
  stays visible. No transcript in PiP, video only.
- Full-size mode: tapping the large OR the small video swaps them.
- The small video is draggable across the ENTIRE screen surface, not
  confined to the video pane — and may sit partially off-screen with only a
  sliver visible, draggable back (WhatsApp behavior).
- Full-size mode must offer camera swap (front/back).
- PiP mode offers exactly two controls: a diagonal double-arrow to expand
  back to full size, and an X that ends the video call.

**Screen share (builder recommendation, owner asked):**
- Implemented as a swap of the outgoing video track behind a "Share screen"
  control; control shown ONLY where the browser supports display capture.
- Platform fact (sourced 2026-09-01): screen capture is desktop-only on the
  web — iOS Safari and Android Chrome do not support it. Phones never see
  the control; laptop/desktop users get it. Re-verify support at build time
  (platform knowledge is stale by default).

**Backlog: NONE.** Every item is assigned in the §0 ledger (owner lock
2026-09-01). 11.7 rides here (video surface, DO-NOT-BREAK rule attached);
R11 layout items 11.1–11.6/11.8/11.9 are 25·post-ship.

## 4 · RELEASE 10 — POST-SHIP

**ACTIVE AUTHORITY (v20.13.0): R10 IS CLOSED — R10-CR3 (pair `ac541c1`) IS
THE ACCEPTED 24·POST-SHIP. 25·PRE-BASE IS ITS BYTE-IDENTICAL SNAPSHOT.
§5 (R11.0, LOG FIDELITY) IS THE SOLE OPEN PROPOSAL; OWNER GO IS REQUIRED
BEFORE BUILD.**

**Live rollback pair:** R10.2 app/worker blobs `a5bcd189` / `953f99de` ⟷ relay
v4.2 source `94c391e4`, restored again by PR #644 / merge `a82ddb63` after the
R10.6 rejection. Live app and worker bytes were verified against those exact
blobs; the relay deployment and v4.2 live probes passed. This is the baseline,
not a patch target. There is no active deliverable, recovery candidate, secret
configuration step, test URL, or owner device test. The plan is complete, but
there is still **no corrective build authorized** until a new explicit owner
GO advances the repository gate.

### 4.11 · R10-CR1 — CLEAN REPLACEMENT PLAN (OWNER GO REQUIRED)

**Status: PLAN COMPLETE; IMPLEMENTATION BLOCKED PENDING EXPLICIT OWNER GO.**
R10-CR1 is a new clean replacement from the exact accepted R10.2/v4.2 bytes.
It is not R10.5, R10.6, R10.7, a patch-forward, an instrumentation release, or
a retry of any buried candidate. No line, service, test assumption, credential
design, or deployment prerequisite from R10.5/R10.6 is an input. PR #647 and
the pinned whole-release root-cause document are the causal authority for this
contract.

#### 4.11.1 · FROZEN INPUT, EXACT OUTPUT, AND SCOPE WALL

The build must begin by proving these exact SHA-256 inputs from
`talkbridge/governance/r10-cycle.json`:

| Frozen input | SHA-256 |
|---|---|
| `bridge-turn24-post-ship.html` | `66f969d9302ec327ee596a8cc97d0f4918675816092014605b5550a68607c2fb` |
| `tb-sw.js` | `c2af8db7614ad5480581574bf58929c52a9c3de52a7cf4fa73b7fcbadb994dc2` |
| `talkbridge/worker-talk.js` | `18659b87ddfc832d51c9c655d7dfc59f05aa80504bd9d3e8da780f48ee4566d1` |
| `talkbridge/wrangler.jsonc` | `2b3f1410052aaaf4678e2a1f93d2e08d079e6304ae7785742a70612769a523f9` |

After owner GO, the only product outputs that may change are
`bridge-turn24-post-ship.html`, `tb-sw.js`, and
`talkbridge/worker-talk.js`. `talkbridge/wrangler.jsonc` remains byte-frozen.
There is no alternate app filename, temporary wrapper, provider endpoint,
external database, new secret, or new hosted service.

The complete build-support allowance is also fixed before authorization:

- `package.json`;
- `talkbridge/build/assemble-r10-cr1.mjs`;
- `talkbridge/build/harness-r10-cr1.mjs`;
- `talkbridge/build/harness-relay-r10-cr1.mjs`;
- `talkbridge/build/mutate-r10-cr1.mjs`;
- `talkbridge/parts/r10-cr1-event-state.js`;
- `talkbridge/parts/r10-cr1-sw.js`;
- `.github/workflows/deploy-relay.yml`; and
- `.github/workflows/talkbridge-r10-cr1.yml`.

Those clean R10-CR1 source, assembly, scenario, mutation, and deployment gates
must be created from this plan after GO. The buried R10.5/R10.6 assembler,
parts, harnesses, mutations, and package scripts are not modified, invoked, or
copied. No other repository path is authorized by this plan.

The clean replacement preserves the baseline's room/install/QR path,
Deepgram, TURN, media, transcription, phrasebook, threads, storage, identity,
and UI behavior. Credential absence from the rejected run is excluded because
it was not reproduced against this frozen baseline. Credential-path work may
enter only a separate future cycle after frozen-baseline reproduction and
explicit owner scope expansion.

#### 4.11.2 · ONE RECIPIENT-EVENT AUTHORITY, NOT AN OVERLAY

The existing relay Durable Object owns one durable record per event and
recipient device. That record is the sole authority for presentation choice,
push request result, seen state, recipient call outcome, and the TalkBridge
home projection. The app may cache the projection for display; it may not keep
a second counted set, replay-derived seen state, or independent missed-event
truth.

Each applicable record contains one stable `eventId`, recipient device, room,
kind, created time, optional stable `callId`, presentation state, push state,
seen state, and recipient outcome. Retry reuses the identifiers. The allowed
facts remain distinct:

- presentation: `pending`, `in_app`, `os_requested`, `suppressed`, or `muted`;
- push: `not_requested`, `accepted`, `failed`, or `unknown`;
- seen: `unseen` or `seen`, with the exact event transition recorded; and
- recipient call outcome: `offered`, `accepted`, `declined`, `missed`, or
  `ended` where applicable.

`os_requested` means that TalkBridge requested the OS path. Push acceptance is
not OS display, and OS display remains unknown unless the physical tester
records it. `suppressed` and `muted` can never be logged as OS-owned.

Seen changes only when the exact event is visibly handled while the receiver
is in that room or the receiver explicitly opens that room. A route that still
names the room when replay eventually occurs is never evidence that an event
was seen earlier. A cursor is transport position only: it cannot mark an event
seen or erase an unseen home record. Opening a room acknowledges only the exact
set durably applied to that recipient.

Home chat/voice/video counts and badges are an idempotent projection of unseen
recipient records, not browser-side increments. Socket delivery, push,
notification navigation, history replay, retry, process restart, and repeated
reconciliation of the same event must produce the same single projection.

#### 4.11.3 · RECIPIENT CALL OUTCOME AND ONE RECOVERY COORDINATOR

Caller/global termination and receiver outcome are separate facts. For every
incoming receiver, the record begins `offered`; Accept and Decline are explicit
recipient transitions. If that receiver has neither accepted nor declined when
the ordinary product's bare caller hang-up or expiry arrives, the receiver
becomes `missed` exactly once even if the caller's own outcome is canceled or
ended. No harness-only `reason:"missed"` word is permitted.

One idempotent single-flight recovery coordinator owns visibility, focus,
online, notification navigation, relay open, and room-listener open. Concurrent
signals coalesce into one attempt, stale attempts cannot replace a newer
socket, and each successful relay or listener open performs reconciliation
before the home view is declared current. A read-only HTTPS reconciliation may
be used against the same Durable Object authority when a socket is unavailable;
it cannot create a second state model. Home recovery never waits for unrelated
peer traffic.

#### 4.11.4 · PRESENTATION CONTRACT

| Receiver state | Chat | Voice/video call | Durable home result |
|---|---|---|---|
| Visible in the event room | Existing bubble only; no added attention or OS alert | One existing in-app Accept/Decline surface; no OS alert | Seen; no missed increment |
| Visible on home or in another room | One existing in-app waiting card/badge; no OS alert | One in-app Accept/Decline surface; no OS alert | Exact unseen count until room open |
| Hidden, closed, phone home, or locked | One OS alert for the defined room burst within five seconds | One OS call alert within five seconds; no background call screen | Exact unseen count and recipient outcome |
| Muted on this device | No attention surface or OS alert | No incoming attention surface | Exact unseen chat/voice/video projection remains |

A notification tap opens the exact event: an active incoming call opens the
existing Accept/Decline surface; an ended call opens its room and durable
recipient outcome. A stable event may never create a delayed second surface or
flurry. The first chat after ten quiet seconds starts a room burst and may
alert; later messages in that burst remain individually countable but are
`suppressed`, not OS-owned.

#### 4.11.5 · SCENARIO-FIRST MACHINE AND LIVE GATES

Before any deployment, tests must drive the product's real event words and
browser lifecycle rather than invoke internal helpers with manufactured state.
Every row must have a paired planted defect proving the assertion can fail:

1. hidden while still routed to the event room → event arrives → socket loss →
   simultaneous visibility and focus → relay/listener reopen → replay; the
   event remains unseen exactly once until explicit room open;
2. ordinary bare caller hang-up before receiver answer; the receiver becomes
   missed exactly once while caller termination remains separate;
3. simultaneous visibility/focus/online signals and repeated open callbacks;
   only one current socket per lane and one reconciliation transaction exist;
4. room-listener reopen without relay traffic or peer hello; home becomes
   current immediately;
5. foreground grant, hidden OS request, mute, burst suppression, late readiness,
   retry, socket-plus-push replay, and process restart; each leaves one truthful
   presentation path and one exact home projection;
6. warm and cold notification taps for active and ended calls; both reach the
   exact existing product surface without a duplicate; and
7. full baseline parity: QR/install, restart, Deepgram transcription, direct
   and TURN media, phrasebook, threads, deletion/restore, and existing storage
   all work without a new secret or credential path.

The pre-deployment gate also rejects any changed frozen input, any R10.5/R10.6
source or provider mechanism, any second event ledger/counted set, any
replay-time route inference, any harness-invented missed reason, and any output
outside the three declared files. Live probes must use only the baseline's
existing services and prove relay connect, real encrypted push POST, retry
dedupe, bare-hang-up recipient outcome, listener/relay reopen reconciliation,
and deployed-byte identity. Machine or live results never claim physical OS
display time.

Read-only diagnostics are fields and transitions from the same recipient-event
record. They may explain sender creation, relay write, presentation choice,
push request result, lifecycle, exact surface acknowledgement, outcome, and
home projection, with secrets redacted. They cannot hold independent state,
change eligibility/timing/routing, or become a separate instrumentation
release.

#### 4.11.6 · OWNER DEVICE GATE — UNCHANGED CANDIDATE, BOTH DIRECTIONS

Only after every machine and live gate passes does the owner receive one URL
for one unchanged candidate. Run the matrix with iPhone receiving from Android
and Android receiving from iPhone. Each row records event ID, sender time,
tester-observed receiver time, expected/actual surface, tap destination,
recipient outcome, counter before/after, and any second surface within 60
seconds.

| # | Case | Required result |
|---:|---|---|
| 1 | Unmuted chat, visible same room | Existing bubble only; no added attention, OS alert, or home increment |
| 2 | Unmuted chat, visible home/other room | One in-app waiting card/badge; no OS alert; exact +1 chat |
| 3 | Unmuted chat, locked | One OS alert ≤5s; exact +1 chat until room open |
| 4 | Three locked chats inside one burst | One OS alert total; exact +3 chat |
| 5 | Muted chat, locked | No attention or OS alert; exact +1 chat and badge on open |
| 6 | Unmuted call, app visible | One in-app Accept/Decline surface; no OS alert |
| 7 | Locked call tapped while active, accepted | One OS alert ≤5s; tap opens active call; no missed count or second surface |
| 8 | Locked call ends before notification tap | One OS alert total; tap opens the room and durable missed voice/video outcome |
| 9 | Caller hangs up before receiver answers | Receiver gets exactly one missed voice/video home record; no replayed ring |
| 10 | Receiver declines | Durable declined outcome opens in the correct room; no missed increment |
| 11 | Muted call ends unanswered | No attention or OS alert; exact +1 voice/video missed count and badge |
| 12 | Return after socket loss/lock while app remains routed to that room | Home immediately shows every unseen chat/call once; no peer traffic required |

Across call rows, test both voice and video and reverse their assignment in the
opposite direction. Pass requires all 12 rows in both directions: correct
surface, destination, outcome, and count; OS alert within five seconds where
required; transcription/media/credential parity; and no double, flurry, or
late second surface for 60 seconds. The first failure rejects and rolls back
the entire app/worker/relay pair. The diagnostic record is used by development;
the owner is not sent a diagnostic-only retry.

#### 4.11.7 · ORDERED EXECUTION AND STOP CONDITIONS

The repository gate enforces: completed root cause → this pinned plan → new
explicit owner GO → clean build → candidate gates → owner device gate →
acceptance. Until owner GO is banked, no product file may change. After GO,
implementation is one clean replacement of the failed concern from the frozen
baseline, not a series of symptom patches. Internal failing invariants are
corrected before a candidate exists; they do not become releases.

Before handoff, the app, worker, and relay deploy as one candidate and are
verified byte-for-byte. Any machine, live, or device failure rejects the whole
pair and restores all three frozen R10.2/v4.2 product files. The failed
candidate is preserved as evidence, the graveyard and whole-release root cause
are completed, and a new plan/GO cycle is required. There is no patch-forward,
partial acceptance, secret-configuration detour, or same-candidate retry.

### 4.13 · R10-CR3 — CLEAN REPLACEMENT, THIRD ATTEMPT (OWNER GO REQUIRED)

**Status: PLAN COMPLETE; IMPLEMENTATION BLOCKED PENDING EXPLICIT OWNER GO.**
R10-CR3 is a new clean assembly from the exact frozen R10.2/v4.2 bytes. It
inherits §4.12 whole — which itself inherits §4.11 — including the two
corrections proven live at the last device gate (lane on room leave; the
announced-window tap). It adds exactly the one correction the §10 root cause
binds. Graveyard G21, G22, G23 are mandatory vetoes.

#### 4.13.1 · Frozen input, exact output, scope wall

Identical to §4.12.1 with `r10-cr2` renamed `r10-cr3` in every build path.

#### 4.13.2 · Attendance, not visibility (G23)

A device is "watching" only while visible AND focused. The truth the app
tells the relay — on every lane open, every heartbeat, every state word — is
this attended truth. Window blur flips it off and announces at once; window
focus or a visibility return flips it on and runs the one recovery. While
unattended: no seen word is sent for anything, the ring stays deferred, and
the projection is applied silently. The relay is unchanged: it already
decides `os_requested` for a device that is not watching; the app simply
stops lying to it. Machine gates (each with a planted defect): blur with the
visibility flag stuck "visible" → chat → push raised, record `os_requested`,
no seen word, no read acknowledgement of the projection; focus return in the
routed room → exactly one explicit open; blur then focus within two seconds →
no push storm, one state word each way.

#### 4.13.3 · Voice transcription on both phones (G24; root cause §11)

Root cause §11 (complete): the joiner's granted key survives on disk for 30
days but the frozen bytes' call/transcription key resolver never reads the
granted set — only the current session's join payload or the device's own
key — so the first relaunch loses transcription. Correction: the resolver
falls back to the unexpired granted set when memory and own key are empty
(hook, never replace; own key wins; expired or cleared grant yields nothing).
Machine gates: relaunch the joiner with a grant on disk → the resolver
returns the grant key; expired grant → empty; own key present → own key.
Planted defect: remove the fallback → red. Device row 13 proves it on both
phones, in-call and chat-mic.

#### 4.13.4 · Gates and device matrix

All §4.12.4 machine and live gates plus §4.13.2. Owner device gate: the
§4.11.6 twelve rows, both directions, with the §4.12.4 Android additions,
plus one iPhone addition recorded on the sheet: rows 2/3 are run by leaving
the app with the screen ON (app switcher / another app) as well as by
locking, since the failed state was a running, blurred page. **Row 13 (both
directions): a voice or video call transcribes speech live on BOTH phones —
the `dg_no_key` / `dg_credential_failure` lines must be absent on both.**

### 4.12 · R10-CR2 — CLEAN REPLACEMENT, SECOND ATTEMPT (OWNER GO REQUIRED)

**Status: PLAN COMPLETE; IMPLEMENTATION BLOCKED PENDING EXPLICIT OWNER GO.**
R10-CR2 is a new clean assembly from the exact frozen R10.2/v4.2 bytes
(§4.11.1 hashes, unchanged). It inherits §4.11.2–§4.11.7 whole — the one
recipient-event authority, recipient call outcomes, the recovery coordinator,
the presentation contract, the scenario-first gates and the device gate —
because the device run proved that design on iPhone in all four states and on
Android wherever the app held a relay lane. It adds exactly the two contract
corrections the root cause (§9) binds, and nothing else. No line from the
rejected pair is an input; the parts are re-derived from this plan and
re-gated. Graveyard G21 and G22 are mandatory vetoes.

#### 4.12.1 · Frozen input, exact output, scope wall

Identical to §4.11.1. The only product outputs are
`bridge-turn24-post-ship.html`, `tb-sw.js`, `talkbridge/worker-talk.js`;
`talkbridge/wrangler.jsonc` stays byte-frozen. Build-support allowance is the
§4.11.1 list with `r10-cr1` renamed `r10-cr2` in every path, plus
`.github/workflows/talkbridge-governance.yml` is NOT touched. The relay
diagnostic for a real room must be readable from `talkbridge-r10-cr2.yml`
on `workflow_dispatch` without a deploy (§9.5-3).

#### 4.12.2 · Lane continuity (G21)

A visible device is never laneless. Leaving a room opens that room's listener
lane in the same action; the coordinator treats room leave as a recovery
signal. Machine gate: enter → leave → call within 2 s → in-app Accept/Decline
surface, no OS request, record `in_app`. Planted defect: remove the leave
signal → gate red.

#### 4.12.3 · Tap reaches only the installed app (G22)

The installed app, on every standalone boot and every return to visible,
announces its window to the worker; the worker keeps that client identity
durably (same on-device store, no independent state). A notification tap
focuses only an announced window and posts the exact event to it. A window
that has not announced — a browser tab showing the install gate — is never
focused and never messaged. With no announced window alive the worker opens
the app URL carrying the event hash, and the app routes it (§4.11.4 cold
path). Machine gate: an install-gate tab and an announced app window coexist
→ tap focuses the app window, the gate tab receives nothing; the app window
alone → same; neither → open with hash. Planted defects: focus-first-match;
message-every-window → gate red. Search-before-build note: this is the
documented platform limitation (w3c/ServiceWorker #720); the announcement is
the replacement, not a URL heuristic.

#### 4.12.4 · Gates and device matrix

All §4.11.5 machine and live gates, plus §4.12.2 and §4.12.3 rows, each with
a planted defect. The live gate reads the real test room's relay record after
the owner run (§9.3 open observation: the 06:26:16 call with no push receipt)
and files it as evidence. Owner device gate: §4.11.6 matrix, 12 rows, both
directions, with two additions to the Android procedure recorded on the
sheet: (a) row 6 is run immediately after leaving the room; (b) rows 7/8 are
run with the install-step Chrome tab still open — the tab must never come to
front. Pass/fail and rollback exactly as §4.11.6–§4.11.7.

### 4.1 · HISTORICAL v19 SPECIFICATION — retained for lineage only

**P1 · Relay v4 (one worker file, from ship's R7 body):**
- Wakes carry an ENCRYPTED payload (RFC 8291; correctness gated by the
  RFC's own Appendix-A test vector, byte-exact) at Urgency high, Topic
  newest-wins, TTL 60 — the delivery class the owner's locked iPhone
  received 4/4 from the reference. Empty unmarked wakes are dead.
- ACK-GATED PUSH: on a push-worthy event the relay delivers on the socket
  and waits ~1s for that device's ack ("presenting"). Ack → no push to that
  device. No ack → push, and it is that device's only alert. One event, one
  arbiter, exactly one alert in every state. (~1s added before a locked
  phone's banner: the professional cost.)
- `call-end` is wake-worthy → a locked phone gets its missed-call alert.
- Liveness: connection acceptance and every inbound message stamp the
  device as alive; provably-live devices are never pushed.
- Read-only `diag` (connected, sub count, last wake + result) so the wake
  path is machine-observable forever.

**P2 · App: install gate (the onboarding inversion):**
- An invite opened in ANY browser shows ONE screen: the room's name and
  install instructions for that platform (iOS 16.4+: Share → Add to Home
  Screen, any browser; Android: its install flow). No name field. No room.
  No chat. Nothing usable. The illusion of a working uninstalled app is
  abolished — it is never an option not to be notified.
- Standalone launch (self-detected) runs the real app. First run: ask the
  name ONCE, join the invite's room (the icon carries the invite URL),
  then P3. Identity never crosses from a browser; that idea is graveyarded.

**P3 · App: subscription, attempt-as-authority:**
- On standalone open with rooms: register the worker, then attempt the
  subscription. Permission answers and properties are recorded verbatim but
  NEVER gate — the subscribe attempt itself is the only truth.
  NotAllowedError is the one real denial → the app shows the owner's F1
  device recipe (Settings → Apps → [app] → Notifications: Allow ON, Lock
  Screen/Notification Center/Banners, Sounds ON, banner style Temporary)
  as the instructions screen. Every room registers with the relay; every
  outcome logs by name; silence is structurally impossible.
- Background room listeners heartbeat every 30s so the relay's liveness
  view is true for every socket the phone holds.

**P4 · App + worker: exactly-one-alert hygiene:**
- The worker shows a notification for every push (Apple revokes silent
  handlers — non-negotiable) with a per-room tag: successive pushes
  REPLACE, never stack.
- The app acks presentations to the relay (P1's gate), so a shown ring
  screen means no banner ever existed for that device.
- Housekeeping only: call answered elsewhere / room read → matching
  notifications are closed as stale; a notification tap closes itself and
  focuses the running app rather than opening a second copy.
- The worker journals every push terminal (arrived / shown / failed) to a
  durable on-device store the app drains into the debug log: proof of
  delivery on the phone, forever.

**P5 · Ship behavior, untouched by construction:**
Chat, calls, phrasebook, homepage missed-call/missed-chat cards — all of
ship's interior is byte-preserved by the assembler; the gate proves the ship
segments verbatim inside the build. The homepage cards update on open from
room history exactly as ship does today.

**P6 · THREADS with consent (owner design, final):**
- Every room card carries + ("add a thread"). Bob taps +, names the thread.
- Alice receives an INVITE on her panel: thread name, from Bob, Accept /
  Decline. Her choice — either way — is TIMESTAMPED INTO THE PARENT ROOM'S
  TRANSCRIPT ("Alice accepted 'Trip planning' · 3:41 PM" / declined).
- Accept: the thread card appears for her, subscribed, notified normally.
  Decline: Bob sees it in the transcript; nothing appears for Alice.
- The invite itself is push-worthy: a locked phone learns a thread was
  offered.
- QR + install gate remain for genuinely new people; paste-link stays as the
  both-installed-never-connected edge.

**Ecosystem map (why this design meets or beats the field on friction):**
WhatsApp/iMessage get zero-tap adds only because your phone number and
contact graph ARE the identity system — the exact surveillance surface
TalkBridge exists to refuse. Signal, the privacy benchmark, requires
consent to join groups — one tap, like ours. Telegram rides links — our QR
IS that link, minus the account. Net: TalkBridge matches the privacy
leader's tap count (1: Accept), beats the mainstream on privacy, and the
decorum record (timestamped accept/decline in transcript) is something none
of them surface — an auditable courtesy trail that fits a translation app
used between strangers-becoming-partners.

### 4.9 · R10.5 — REJECTED BEHAVIORAL BUILD (HISTORICAL; NOT AUTHORITY)

**Status: REJECTED 2026-08-29; WHOLE PAIR ROLLED BACK.** Product commit
`13b3d9ae` and relay v5.1 passed their machine gates but failed the two-phone
run. The Android log showed a greater-than-five-second other-room update,
duplicated owner/stale-close records, and `owner=os` attached to suppressed
events. The iPhone log showed away-period events consumed as zero and its
cursor advanced, reconnect races, and the whole inherited Deepgram/TURN bundle
absent (`dg_no_key`, `turn_unavailable {"hasCreds":false}`). The build also
made missed-call state depend on a caller-supplied `reason:"missed"` that the
ordinary call-end path does not guarantee. Graveyard G18/G19 contains the
binding burial. Everything in §4.9.1–§4.9.5 below is retained only to explain
what failed; it may not be patched, tuned, or used as the R10.6 baseline.

#### 4.9.1 · USER CONTRACT — SIMPLE AND CONSISTENT

1. **App already visible when the event arrives:** the app owns presentation.
   In the event room, chat remains ordinary content with no extra attention;
   elsewhere in TalkBridge, the existing in-app chat/call surface is used.
   There is no OS notification.
2. **App hidden, closed, phone home, or locked:** the OS owns presentation.
   One chat-burst notification or one call notification with system sound
   appears within five seconds. The app may record state in the background but
   must not also auto-open or auto-ring a call screen.
3. **Notification tap:** the user reaches the event, never an unexplained home
   page. If the call is still active, show its Accept/Decline screen. If it has
   ended, open the room and show the durable answered/declined/canceled/missed
   outcome. Decline writes the outcome before navigation.
4. **Muted room on this device:** no sound, vibration, toast, ring screen,
   animation, or OS alert. Existing chat content remains unchanged. Exact
   missed chat/voice/video counts remain on TalkBridge home. App-icon badge is
   a best-effort mirror, never the only record.
5. **No flurries:** one stable event ID is one decision. Retries reuse the ID.
   A call produces at most one OS notification; a chat burst produces at most
   one. No delayed second surface may appear after the first decision.

On iOS/iPadOS a hidden or locked web app gets a standard system notification,
not CallKit, a sustained ringtone, or custom answer buttons. That limitation is
accepted. Inconsistency is not. The hidden-state call screen appears only after
the user activates the notification. WebKit's declarative `navigate` field is
the primary path on iOS/iPadOS 18.4+; the service-worker path implements the
same event URL elsewhere.

Primary platform evidence:
- WebKit Declarative Web Push (2025): required `navigate`, automatic visible
  fallback, iOS/iPadOS 18.4+ — https://webkit.org/blog/16535/meet-declarative-web-push/
- Apple Web Push documentation — https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
- Service-worker focus/open behavior and its SPA warning — https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow

#### 4.9.2 · ONE PRESENTATION OWNER — RELAY STATE MACHINE

Every push-worthy event is first committed to a durable per-device ledger with
stable `eventId`; calls also have stable `callId` and terminal state. The relay
then makes exactly one irreversible presentation decision for that device:

1. Send `presentation-offer(eventId)` on any existing socket.
2. The page may answer `foreground-ready(eventId)` only if it was visible and
   focused at receipt of that exact offer. A socket, heartbeat, reconnect,
   page becoming visible later, or receipt of replayed history is not proof.
3. On a valid answer, the relay commits `owner=in_app`, returns
   `presentation-grant(eventId)`, and sends no push. The app presents only
   after that grant.
4. Without a valid answer inside the bounded delivery budget, the relay commits
   `owner=os` and sends exactly one push. Any late app/reconnect path receives
   `owner=os` and is forbidden to auto-ring or mount an incoming-call screen.
5. A retry reads the committed owner and never makes a second decision.

This repairs the failed one-second design rather than tuning it. Candidate
`4f574f2` allowed a waking/reconnecting app to ring after the push path had
already won. R10.5 requires a grant before in-app attention and permanently
closes the losing path. The exact bounded wait is chosen from relay/device
preflight measurements, is included in the five-second budget, and is not a
presence heuristic.

#### 4.9.3 · PAYLOAD, TAP, CALL OUTCOME, COUNTERS

- One encrypted versioned envelope carries generic notification text,
  `eventId`, `roomId` routing token, kind, timestamp, and canonical same-origin
  event URL. Calls add `callId`, voice/video, and state. No message/transcript
  content or credentials ride the push service.
- Apple declarative push uses that event URL as `notification.navigate`.
  Legacy/Android worker notifications store the identical URL and event ID.
  The global `Topic: tb-wake` is forbidden; a topic may collapse only retries
  of the same event or the explicitly defined chat burst.
- Cold launch is a boot input, not a transient postMessage: the event URL is
  parsed before initial routing and retained until the app confirms the event
  screen mounted. For an existing client the worker focuses/navigates or
  messages it, then requires the same mount confirmation. A test must cover
  both paths. An absent confirmation is a named failure, not a homepage pass.
- The ledger owns exact home counts and call terminal outcomes. Worker receipts
  and display journals are diagnostic evidence only. Replay, socket+push,
  reconnect, retry, restart, or tapping an old notification cannot double a
  count. Opening the event room advances an acknowledged per-device cursor.
- Per-room/per-device mute is acknowledged by the relay before the UI changes.
  A muted device remains in the ledger but is ineligible for both presentation
  owners.

#### 4.9.4 · INTEGRATED INSTRUMENTATION

The corrected candidate implements the redacted, bounded schema and export in
`NOTIFICATION-FLIGHT-RECORDER-SPEC.md` across sender, relay, push service,
worker, app lifecycle, presentation-owner decision, surface mount, tap route,
terminal call state, counter delta, subscription, and credential capability.
It records `accepted` from a push service—not `delivered` or `displayed`—and
marks locked state as tester-supplied. The recorder may not alter timing or
eligibility. The owner-facing diagnostics control is hidden from normal use
and exported only when a matrix cell fails.

#### 4.9.5 · PRE-FLIGHT AND ONE OWNER TEST

The dev team, not the owner, first proves at the exact candidate SHA:

1. clean assembly, dependency install, inherited gates, and mutations;
2. state-machine races: foreground grant, hidden push commit, late reconnect,
   retry, process restart, and socket+push replay each leave one owner/surface;
3. declarative and legacy payload parity; no global topic; a real push-service
   POST; fail-closed deployment manifest and per-event live probe;
4. cold-start and warm-start tap both mount the event screen; active/ended call
   branches and decline persistence; Android hidden call has an OS surface;
5. exact counters/mute across restart and beyond the old 12-minute history;
6. a three-cycle dev-device smoke run on iOS and Android with no delayed second
   surface for 60 seconds; and
7. recorder parity/redaction/retention/gap tests, attached to the handover but
   not used as a substitute for behavior.

Only then does the owner receive one URL and one 12-cell two-way matrix. Every
cell records event ID, sender time, receiver time, expected/actual surface,
tap destination, terminal outcome, counter delta, and whether any second
surface appeared within 60 seconds. Pass requires all cells: correct surface,
no double/flurry, correct destination/outcome/count, and alert latency ≤5s
where an OS alert is required. One failure rejects and rolls back the pair;
the attached trace is used by the dev team without asking the owner to rerun a
diagnostic-only build.

### 4.10 · R10.6 — REJECTED AND BURIED WHOLE (HISTORICAL; NOT BUILD AUTHORITY)

This plan records permanently that R10.6 rejected and buried whole is the
standing verdict: the release is buried in full and is never a base.

**Status: R10.6 PRODUCTION ATTEMPT REJECTED 2026-08-30; WHOLE APP/WORKER/RELAY
PAIR RESTORED TO R10.2/v4.2. R10.6 IS NOT REPAIRABLE.**
The former “please proceed” authorization was consumed by the rejected build
and does not authorize a retry. The last accepted whole pair is the
byte-verified R10.2/v4.2 rollback. The owner established that credential loss
was a regression of the rejected release, not permission to redesign the
credential-working baseline. Rejection therefore means whole-release rollback,
not a patch to the QR path and not a new credential architecture.

**Production gate evidence:** PR #643 merged the preserved R10.6 candidate
(`95cd9593`). The static deployment succeeded and the relay deployed. The live
probe then passed WebSocket connect, foreground ownership, an encrypted push
POST, ordinary caller hang-up → missed, retry dedupe, one-time invite, and
wrong-device refusal, but failed both `deepgram-token` and `turn-credentials`.
The deployment therefore failed before any owner/device URL was authorized.
The result proves that production did not have usable server-side Deepgram and
TURN credential issuance; the existing probe output does not distinguish a
missing Worker secret from an upstream provider refusal, so the next dev-team
run must record only the HTTP status and safe error code for each refusal. It
must never print a credential value.

**Historical machine evidence:** clean assembly generated the app and
worker from frozen ship plus six named parts. The gates pass 21/21 app,
18/18 relay, 12/12 deployment contract, and 26/26 planted defects caught. The
relay gate includes ordinary bare caller hang-up → recipient `missed`, exact
presentation ownership, mute/burst truth, process restart, stable retry
dedupe, one-time invite replay rejection, and service authorization bound to
the issuing device identifier. These scores prove the code paths under test;
they do not prove Apple/Android display latency or physical TURN media.

**Rejected architecture:** one durable recipient ledger; stable event/call
IDs; exact `in_app`/`os`/`muted`/`suppressed` decisions; direct encrypted
declarative-compatible push envelope; exact warm/cold event routing;
transport-independent HTTPS reconciliation; single-flight relay/listener and
subscription recovery; one-time install handoff; opaque `tb_auth_v1`; fresh
Deepgram tokens and expiring TURN ICE credentials held only in memory; and one
redacted human+machine flight snapshot. All of these R10.6 mechanisms and their
tests are historical evidence only. No provider secret may be added and no
failed live probe may be rerun to revive this candidate.

**No remaining acceptance exists for R10.6.** It failed and is buried. Any
future R10 proposal requires a new plan based on the exact rollback baseline
and a new explicit owner authorization before code. It may not assume that an
R10.5/R10.6 symptom exists in the baseline without reproducing it there first.

#### 4.10.1 · WHAT THE DEVICE EVIDENCE ESTABLISHED

1. **Android transport works but the product contract did not.** Foreground
   chats/calls arrived promptly and at least two worker push receipts recorded
   `arrived` and `shown`, disproving a total relay outage. One other-room update
   took about 6.7 seconds, exceeding the five-second contract. Duplicate owner
   commits/stale closes and `owner=os, reason=burst-suppressed` prove that the
   ownership record did not truthfully name the surface used.
2. **iPhone missed state was destroyed during replay.** After an away period,
   two ledger events were applied as chat/voice/video all zero and the cursor
   advanced. The router still naming a room at replay time was incorrectly used
   as proof that away-period events had been seen.
3. **Call outcome was modeled globally instead of per recipient.** The missed
   path required `call-end.reason === "missed"`, while ordinary teardown sends
   a bare call end. A caller can cancel while the receiver still has a missed
   incoming attempt; those are different facts.
4. **Recovery depended on transport accidents.** The iPhone showed concurrent
   reconnect attempts and home state appeared around later relay/peer activity.
   Durable home state must not wait for a WebSocket or unrelated message.
5. **The rejected build observed an absent calling-credential bundle.** The
   iPhone connected a WebRTC call but logged `dg_no_key` and no TURN credentials.
   That proves paired absence in the rejected release only. It does not prove
   that the rollback baseline drops credentials, and the former page-memory/QR
   diagnosis was not reproduced against that baseline. G19/G20 forbid carrying
   that diagnosis or its replacement architecture forward.
6. **iOS OS-display time remains a declared trace gap.** Push-service acceptance
   and later app launch do not prove when Apple displayed a declarative
   notification. The hardware observer supplies that timestamp.

#### 4.10.2 · USER CONTRACT — THE TWO RULES ARE SIMPLE AND CONSISTENT

| Receiver state | Chat | Voice/video call | Home record |
|---|---|---|---|
| Visible in the event room | Existing bubble only; no added sound, animation, toast, or OS notification | One existing in-app ring/Accept/Decline surface; no OS notification | Event handled in view; no missed increment |
| Visible on home or in another room | One existing in-app waiting card/badge; no OS notification and no double | One in-app ring/Accept/Decline surface; no OS notification | Exact chat or missed-call count until that room is opened |
| Hidden, closed, phone home, or locked | One system alert for the defined room burst within five seconds | One system call alert with permitted system sound within five seconds; no background call screen and no repeats | Exact unseen chat count; exact recipient call outcome |
| Room muted on this device | No sound, vibration, toast, ring screen, animation, or OS notification; existing bubble/content behavior is unchanged | No incoming attention surface | Exact chat/voice/video count and TalkBridge home badge remain |

Notification tap always opens the event, never an unexplained home page. An
active call opens Accept/Decline. An ended call opens its room and durable
recipient outcome. App-icon badge is a best-effort mirror; TalkBridge home is
authoritative. A hidden iPhone/iPad receives a standard system notification,
not CallKit, a sustained background ringtone, or custom notification buttons.
One stable event is never allowed to create a delayed second surface or flurry.

A chat burst starts with the first message after at least ten quiet seconds in
that room. The first message alerts; later messages inside the burst add exact
home counts but no additional OS alert. Burst suppression is recorded as
`suppressed`, never falsely as `os`.

#### 4.10.3 · DURABLE RECIPIENT STATE — HOME DOES NOT GUESS

- The relay creates one durable record per event and recipient device before
  delivery. It includes stable `eventId`, room, kind, created time, presentation
  decision, recipient seen state, and—for calls—stable `callId` plus recipient
  outcome. Retry preserves the identifiers.
- Every record begins `unseen`. For an unmuted event it becomes seen only after
  confirmation that the exact chat/call surface rendered while visible, or
  after the user explicitly opens that room. A muted room's ordinary content
  render is not an attention acknowledgement: its event remains in the home
  record until the user explicitly opens/clears that post-event record. The
  room currently named by the router during a later replay is never evidence
  of earlier viewing.
- Reconciliation is idempotent. Replaying socket history, push delivery,
  notification navigation, worker receipts, process restart, or the same event
  twice cannot double a count. A cursor never advances across an event that was
  not durably applied.
- The app reconciles on boot, focus, visibility return, notification navigation,
  every room-listener open, and every relay open. A read-only HTTPS ledger path
  performs the same operation when WebSocket recovery is unavailable, so the
  home page never waits for unrelated peer traffic.
- A room-open acknowledgement clears only events through the exact applied
  cursor for that recipient. Muted events follow the same ledger and therefore
  remain countable even though they have no attention surface.
- Call outcome is recipient-specific. `accepted` and `declined` are explicit.
  If an incoming attempt was created for a recipient and that recipient did not
  accept or decline before the caller ended or the call expired, the recipient
  outcome is `missed` even when the caller's global outcome is `canceled`.

#### 4.10.4 · ONE PRESENTATION PATH, TRUTHFUL STATES, CONTROLLED RECONNECT

1. Socket presence, freshness, heartbeat, current route, or a later reconnect
   never suppresses a push. Only an exact visible-page readiness response for
   that `eventId` may win the in-app path.
2. The page presents attention only after the relay grants `in_app`. Without a
   timely valid response, the relay selects `os` and requests one push. A late
   page is forbidden to ring or mount a second incoming screen for that event.
3. Presentation decisions are exactly `in_app`, `os`, `muted`, or `suppressed`.
   `os` names the selected/requested path; separate fields record push-service
   acceptance/failure, and neither field claims that the OS displayed it.
4. Muting is effective only after relay acknowledgement. Every underlying
   muted or burst-suppressed event still enters the unseen ledger.
5. App, worker, and relay deduplicate with the same event/call IDs. A Topic may
   collapse only a retry of that exact notification or its defined chat burst;
   the global `tb-wake` topic is forbidden.
6. Relay/listener reconnect is single-flight: one attempt at a time, bounded
   backoff, stale attempts canceled, one synchronization after success. A
   successful reopen always triggers ledger reconciliation before UI success is
   reported.

#### 4.10.5 · REJECTED INVITE/TOKEN FORK — HISTORICAL ONLY; DO NOT BUILD

The following was the rejected R10.6 design. It is retained only to identify
what G20 forbids and may not be implemented or used as a future baseline:

1. A QR/link contains a one-time, expiring, non-provider invite code. It never
   contains Deepgram keys, TURN token IDs/API tokens, GitHub credentials, or
   reusable room service credentials.
2. The installed PWA exchanges the one-time code for one opaque TalkBridge
   device authorization (`tb_auth_v1`) scoped to the relationship, device, and
   allowed rooms. Replay is rejected. Delete/revoke disables descendants;
   restore follows the already-proven grant rules.
3. `/service deepgram-token`, authenticated with `X-TalkBridge-Auth` and the
   issuing device identifier, returns a Deepgram temporary token. Deepgram
   currently supports client tokens with a
   default 30-second TTL and configurable 1–3600-second TTL. The long-lived API
   key remains server-side. Every new or reconnected Deepgram session obtains
   a fresh unexpired token; an established session is not torn down merely to
   rotate a still-valid connection credential.
4. `/service turn-credentials`, under the same authorization, uses the
   server-held Cloudflare TURN key/API token to generate expiring ICE-server
   credentials. The browser receives only those temporary credentials. Their
   TTL covers the expected call and is refreshed with WebRTC configuration when
   necessary; the long-lived TURN key is never exposed.
5. Restart, cold launch, and network recovery retain/recover only the opaque
   TalkBridge authorization and request fresh provider credentials as needed.
   Text translation, voice transcription, voice/video media, and TURN fallback
   must all work after restart without reopening the QR.
6. Logs record authorization presence, scope class, expiry, request result, and
   provider-token expiry only. They never record invite codes, authorization
   values, provider tokens, API keys, or TURN passwords.

Historical references used by the rejected design:
- Deepgram token authentication — https://developers.deepgram.com/guides/fundamentals/token-based-authentication
- Deepgram grant-token API — https://developers.deepgram.com/reference/auth/tokens/grant
- Cloudflare expiring TURN credentials — https://developers.cloudflare.com/realtime/turn/generate-credentials/

This scope was incorrectly characterized as a minimum. It was a new credential
architecture and new production dependency. G20 rejects the entire fork;
Release 13 may not reuse it.

In every R10.6 gate, “provider secret” means the long-lived Deepgram API key and
Cloudflare TURN key ID/API token. It does not silently expand R10.6 into the
GitHub/PAT migration: the existing GitHub phrasebook path remains unchanged and
R13 owns that separate migration.

#### 4.10.6 · INSTRUMENTATION MUST EXPLAIN, NOT CHANGE, THE RESULT

The existing flight-recorder privacy/schema remains binding. For each event it
correlates sender creation, relay ledger write, presentation decision, push
request/acceptance, worker/declarative evidence where observable, app lifecycle,
surface mount, tap route, recipient call outcome, counter change, and credential
capability/token result. It records one human-readable summary and the same
machine-readable records from one snapshot.

The recorder never calls push acceptance “delivery” or “display,” never infers
locked state, and never says an absent legacy worker receipt proves no iOS
declarative display. The iOS display interval is explicitly `unknown` unless
the tester supplies the observed display time. Instrumentation cannot alter
eligibility, timing, routing, or counters.

#### 4.10.7 · REJECTED CANDIDATE'S FORMER DEV-TEAM GATES (HISTORICAL)

At the exact candidate SHA, the dev team must prove:

1. clean assembly and install; protected ship segments preserved; inherited,
   R10.6, credential, recorder, deployment, and mutation gates all green;
2. the actual normal call teardown words—not a harness-invented `missed`
   reason—produce correct recipient outcomes for answer, decline, caller end,
   timeout, and replay;
3. hidden events while the router still names that room remain unseen; old
   events replay idempotently; cursor restart and socket loss/reopen produce
   immediate exact home state without peer hello traffic;
4. foreground grant, hidden OS selection, mute, chat-burst suppression, late
   reconnect, retry, process restart, and socket+push replay each leave one
   truthful presentation path and exact counters;
5. cold and warm notification taps mount the active-call or ended-room target;
   Android hidden calls have an OS surface; no late second surface appears for
   60 seconds;
6. on fresh scoped iOS and Android installs: scan QR in the browser → install →
   standalone launch → cold restart → voice and video calls → transcription and
   TURN credentials available, with no long-lived Deepgram/TURN secret in the
   QR, URL, client storage, logs, built artifact, or browser-to-TalkBridge
   request; this statement does not move GitHub/PAT work out of R13;
7. Deepgram token expiry/renewal, TURN expiry/refresh, authorization revoke,
   delete/restore, offline recovery, and service refusal fail clearly without
   destroying the saved room or silently disabling transcription;
8. the dev team completes every non-device pre-flight and live production probe
   before owner handoff. Per standing rule §0b, the owner runs the physical iOS
   and Android acceptance matrix; machine/live gates never substitute for it.

#### 4.10.8 · REJECTED CANDIDATE'S FORMER OWNER MATRIX (HISTORICAL)

Run the same unchanged candidate with iPhone receiving from Android, then
Android receiving from iPhone. Every row records event ID, sender time,
tester-observed receiver time, expected/actual surface, tap destination,
recipient outcome, counter before/after, and any second surface within 60
seconds.

| # | Case | Required result |
|---:|---|---|
| 1 | Unmuted chat, visible same room | Existing bubble only; no added attention, OS alert, or home increment |
| 2 | Unmuted chat, visible home/other room | One in-app waiting card/badge; no OS alert; exact +1 chat |
| 3 | Unmuted chat, locked | One OS alert ≤5s; exact +1 chat until room open |
| 4 | Three locked chats inside one burst | One OS alert total; exact +3 chat |
| 5 | Muted chat, locked | No attention or OS alert; exact +1 chat and badge on open |
| 6 | Unmuted call, app visible | One in-app ring/Accept/Decline; no OS alert |
| 7 | Locked call, notification tapped while active, accepted | One OS alert ≤5s; tap opens active call; no missed count or second surface |
| 8 | Locked call ends before notification tap | One OS alert total; tap opens the room and durable missed voice/video outcome |
| 9 | Caller hangs up before receiver answers | Receiver gets exactly one missed voice/video home record; no replayed incoming ring |
| 10 | Receiver declines | Durable declined outcome opens in the correct room; no missed increment |
| 11 | Muted call ends unanswered | No attention or OS alert; exact +1 voice/video missed count and badge |
| 12 | Return after socket loss/phone lock with app still routed to that room | Home immediately shows every unseen chat/call exactly once; no peer traffic required |

Across call rows, test both voice and video and reverse their assignment in the
opposite direction. All 12 rows must pass on both receiving platforms. Any
wrong surface, delay, double, flurry, wrong destination/outcome/count, missing
transcription, or credential loss rejects and rolls back the whole pair. The
trace diagnoses that failure; the owner is not given a diagnostic-only retry.

### 4.8 · R10.2-OBS1 — REJECTED INSTRUMENTATION-ONLY BUILD (v20.4.2)

**Status: REJECTED 2026-08-28; WHOLE PAIR ROLLED BACK.** OBS1 was built and
machine-gated, but publishing known-failing R10.2 behavior with instrumentation
as the only product change did not satisfy the owner's authorization. The
section is retained for lineage only. Its privacy/schema work does not
authorize instrumentation in a future build; its standalone release
architecture may not return.

#### 4.8.1 · WHY OBSERVATION PRECEDES ANOTHER BEHAVIOR DESIGN

The failed candidate was machine-green yet its first device session produced
four mutually confusing presentations: notification only, ring only, both,
and neither useful surface. Its logs could not correlate relay decisions,
worker arrival, lifecycle state, surface mount, ringtone, navigation, and
terminal call state. Patching any one symptom now would be a guess and would
repeat the buried 38-version cycle.

OBS1 answers that evidence gap. It does not implement declarative push,
ack-gated suppression, a new missed-call ledger, mute, counters, notification
replacement, or a new call surface. Those product mechanisms return to design
only after an OBS1 trace proves the failed branch and a new review addendum
names the replacement.

#### 4.8.2 · EXACT BASELINE AND PAIR

- App, assembled worker, and relay are the whole-pair R10.2 rollback at commit
  `0b5b230bc670e3bf9cfcc71f685d358c23249fd2`, byte-identical for those three
  artifacts to paired baseline `e74c7cb2`.
- The production relay is v4.2 and its post-rollback live probe is recorded at
  `edaf98ad`: socket connect/delivery/type green, a real push-service request
  returned 404 for the deliberately invalid probe subscription, and a live
  client was not wake-targeted.
- Source changes are limited to a named app observation part, observation hooks
  in the existing worker and relay sources, their assembler declarations, and
  their dedicated gates. The generated app and worker remain output-only.
- OBS1 ships as one app + worker + relay version set. A mixed version makes a
  trace invalid and is shown in the export as `version_mismatch`.

#### 4.8.3 · HARD SCOPE LOCKS

OBS1 may observe and export. It may not change alert eligibility, relay wake
eligibility, notification text/tag/topic, ringtone timing, call state,
navigation targets, counter math, transcript/bubbles, translations,
credentials, mute, layout, onboarding, or subscription decisions. Existing
content bubbles are not notification surfaces and must not be modified.

The one allowed visible addition is a small **OBS1** diagnostics control
accessible from both the home screen and room. It opens a panel that starts a
generated run after the tester selects only enumerated condition, event, and
receiving platform values; no free-text name/note can leak user content. The
panel shows version/trace health and exports/clears only diagnostic data. It
may not cover existing controls or become part of the product acceptance
design.

OBS1 never records message/transcript text, names, secrets, keys, full push
endpoints, raw room IDs, raw device IDs, IP addresses, SDP, or media. Device
records use a per-install random salt; relay identifiers use a per-process
random salt; only the content-free event trace hash is stable across layers.
Credential diagnostics record only capability name, presence, source class,
and validation result.

#### 4.8.4 · REQUIRED EVIDENCE

Every record follows the schema and event taxonomy in the flight-recorder
spec. Correlation IDs include `testRunId`, `traceId`, `eventId`, and `callId`
where available. Every record includes app/worker/relay versions, sequence,
wall and monotonic time, source, action, outcome, reason, lifecycle/surface
snapshot, and explicitly observed versus tester-supplied fields.

The trace must cover:

1. sender event creation and socket send;
2. relay receive, recipient decision, socket send, wake suppression/attempt,
   push-service response, and exception;
3. worker push arrival, payload classification, client match, display attempt,
   display result/failure, notification tap, focus/open request and result;
4. app relay receipt, visibility/focus/current surface/current room, call
   presentation request and confirmed mount, ringtone request/result,
   notification-open message, navigation request/result, decline/answer/
   timeout/cancel, transcript outcome, and home-counter delta;
5. subscription and service-worker/controller state changes; and
6. credential capability presence/source/validation without credential values.

Web code cannot directly prove that a device is locked, that the OS displayed
or sounded a notification, that the user saw it, or that a declarative push
bypassed worker code. Those are never inferred. The tester selects one of the
enumerated foreground-home/event-room/other-room, background, locked, or
muted-room conditions; the record marks that label `test_supplied`.
Push-service acceptance is logged as `accepted`, never
as `delivered` or `displayed`.

#### 4.8.5 · DURABILITY AND OUTPUT

- Device records use IndexedDB, survive app/worker restarts, are capped at
  5,000 records and seven days, and prune oldest-first in batches no larger
  than 100. App and worker write idempotent `recordId` entries to the same
  `records` store; there is no lossy drain step.
- Relay records use a bounded per-event diagnostic ring with no message
  content. The export requests the matching relay slice when reachable and
  states a visible gap when it is not.
- One export action creates raw JSONL plus a plain-language report from the
  same records. The report contains version manifest, test label, event
  timelines, presentation summaries, invariant violations, trace gaps, and a
  matrix-ready roll-up. No console or desktop developer tools are required.
- Missing stages are evidence: the report emits `trace_gap`; contradictory
  stages emit `invariant_violation`. Silence is never rendered as success.

#### 4.8.6 · BUILD AND HANDOVER GATES

1. Protected ship segments remain byte-identical; only named OBS1 sources
   contribute new code.
2. Existing app, worker, relay, clean-checkout, and mutation gates remain green.
3. Recorder schema validation, redaction, bounded retention, restart survival,
   sequence ordering, cross-context ingestion, JSONL export, human-report
   parity, and version-mismatch blocking are gated.
4. Plant-and-catch mutations cover each source layer, each prohibited secret/
   content field, lost correlation, false OS-delivery claim, swallowed error,
   trace gap, and invariant violation.
5. A synthetic event proves one merged timeline across app, worker, and relay;
   deliberately remove one stage and require a named gap rather than a pass.
6. Publish and byte-verify one paired OBS1 candidate. Before owner handover,
   the dev team runs a minimal device smoke trace on its own hardware or names
   the exact hardware limitation. The owner is not asked to repeat the
   24-direction acceptance matrix for an observation build.

This was OBS1's former pass definition. It is void as a release gate: the owner
is not asked for an OBS1 capture. Its recorder requirements do not travel
forward automatically.

### 4.7 · HISTORICAL FAILED RED-TEAM CONTRACT (v20.2.0; not build authority)

**Status: BUILT AS 4f574f2; FAILED OWNER DEVICE MATRIX; WHOLE PAIR ROLLED BACK.** The
normative outcome, architecture, evidence limits, machine gates, and 12-case
device matrix live in `talkbridge/THIRD-PARTY-REVIEW-2026-08-28.md`. That
document is retained for lineage but is superseded by the v20.8.2 rollback ruling. Its fixed one-
second acknowledgement window and unproved cold-open handoff are buried and
must not be tuned or rebuilt.

#### 4.7.1 · RED-TEAM FEEDBACK INCORPORATED

The review did not reject Apple's Declarative Web Push work. It found that the
proposal combined one sound platform direction with two unacceptable product
mechanisms and several unproven assumptions:

1. Declarative Web Push is the right primary delivery path on supporting Apple
   systems, but the payload needs stable event identity, the same envelope must
   work through the legacy worker path, and the design cannot say a registered
   service worker is categorically uninvolved.
2. Repeating `call-start` every 3.5 seconds is rejected. It is push spam, not a
   web-app ringtone, and depends on notification replacement that current
   WebKit does not guarantee.
3. Exact homepage counters are required, but the service-worker receipt
   journal cannot be their source of truth. Declarative display may produce no
   worker receipt and replay could double-count. A durable event ledger and
   cursor replace that mechanism.
4. The existing chat bubble/transcript behavior was never in dispute and is
   frozen. A bubble rendered in an open room without sound or animation is
   content, not a notification. No notification work may alter it.
5. Room mute is per device. It suppresses attention surfaces, not history.
   Exact chat/voice/video counts still appear on the TalkBridge home page.
6. iOS notification tag replacement/clearing may be used cosmetically but is
   not a release invariant. The design prevents extra pushes rather than
   promising that iOS will clean up banners after delivery.
7. The old global `Topic: tb-wake`, history `since=0` wake inference, and
   single-slot live-probe diagnostic can collapse, misattribute, or hide
   events. They are forbidden in the next build.
8. A socket, freshness timestamp, heartbeat, or unrelated inbound word is not
   proof of presentation. Only `presented(eventId)` from a visible app may
   suppress that exact event's push.
9. The current 12-minute relay history cannot support exact next-open counts;
   counter metadata must have an independent durable lifetime.
10. The same-tag harness check and the prior `no-wake-for-live` probe are not
    proof of their labels. The replacement gates in review §8 must be able to
    fail on the exact planted defects.

#### 4.7.2 · DISPOSITION LOG

| Proposed R10.3/R10.4 decision | Disposition | Active decision |
|---|---|---|
| Declarative Web Push | ACCEPTED WITH CORRECTIONS | One versioned encrypted event envelope; declarative on supported Apple systems, same envelope parsed by the legacy/Android worker |
| 3.5s/45s incoming-call cadence | REJECTED | One `call-start`, at most one OS alert with system sound; no pseudo-ringtone |
| Exact homepage chat/voice/video counters | ACCEPTED | Required in every matrix row, including muted rooms |
| Counters sourced from worker journal; measure gaps later | REJECTED AND RE-ENGINEERED | Durable per-device event ledger, stable IDs, atomic cursor; journal is telemetry only |
| R10.2 unconditional ALWAYS-PUSH as permanent arbiter | RE-ENGINEERED | Exact visible presentation ack suppresses only its own event; no ack means one push |
| iOS tag replacement/clear as correctness | REJECTED | Cosmetic hint only; never required for pass |

#### 4.7.3 · HISTORICAL BUILD SCOPE AND LOCKS

Build only the contract in the review package:

- stable `eventId`; calls also use stable `callId`, voice/video kind, and
  explicit terminal state;
- generic encrypted declarative/legacy payload with event routing metadata;
- exact-event presentation ack with ≤1-second push fallback;
- one alert per call and one alert per defined 10-second quiet-separated chat
  burst;
- per-room/per-device mute confirmed by the relay before the UI claims it;
- durable deduplicated ledger and cursor for exact home counts, retaining
  unconsumed metadata until seen or the existing 90-day device-subscription
  lifetime expires;
- repaired clean-checkout, mutation, live-probe, call-state, counter, mute,
  declarative/legacy, and adversarial gates from review §8.

Frozen: existing bubbles, transcript, translations, media/microphone/video
mute, phrasebook, threads, layout, and install UX beyond a named notification
hook. No 3.5-second timer, no custom background ringtone, no global wake topic,
no history-guessing wake, and no journal-derived counter may enter the build.

#### 4.7.4 · AUTHORITY AND GATE ORDER

1. **Owner written GO:** PENDING until the owner sends the dev team this exact
   v20.2.0 commit with an instruction to proceed. The instruction to update the
   plan authorized documentation only. The forwarding/proceed message is the
   build GO; no second plan-edit cycle is required.
2. After GO, dev team builds one app + worker + relay pair from the exact
   baseline in review §2. No other scope rides.
3. Run every machine gate in review §8 at the exact commit SHA. Any failure
   stops before device testing.
4. Owner runs review §8.1: 12 cases with iOS receiving from Android and 12 with
   Android receiving from iOS, once against the unchanged candidate. Zero
   failures, doubles, or flurries.
5. Any deviation fails and rolls back the pair. A platform caveat cannot be
   invented after the test; it must already be supported by current evidence
   in review §9 and represented in the contract.

Current owner direction is one red-team-reviewed build, not another chain of
device-visible micro-iterations. This does not revive unreviewed bundling: the
event envelope, exact presentation decision, mute state, and durable counter
ledger are one inseparable notification-correctness system, and every component
is machine-gated before the single owner matrix candidate exists.

### 4.6 · HISTORICAL R10.2 — ALWAYS-PUSH (deployed baseline; superseded by §4.7 for the next build)

**THE DECISION.** The relay stops deciding whether a device needs an alert.
It cannot know; every attempt to know (socket presence, 75s/105s freshness,
1-second ack timers) produced silence in one test and doubles in the next.
The production-proven architecture is the opposite: THE SERVER ALWAYS SENDS
THE PUSH FOR EVERY PUSH-WORTHY EVENT, and THE DEVICE — the only place the
truth exists — decides what the person sees.

**SOURCES (indexed; this is the in-the-wild proof the design is copied from):**
- S1 Firebase Cloud Messaging web receive model — server always delivers;
  foreground = the page presents, background = the service worker shows.
  https://firebase.google.com/docs/cloud-messaging/js/receive
- S2 Google reference pattern for exactly this case — service worker checks
  for a visible/focused window client before showing.
  https://web.dev/articles/push-notifications-common-notification-patterns
- S3 Web Push Book, "Common Notification Patterns" (same pattern, canonical).
  https://web-push-book.gauntface.com/common-notification-patterns/
- S4 Apple/native model — the foreground app's delegate decides presentation;
  the server never suppresses (OneSignal SDKs implement the same rule).
  https://documentation.onesignal.com/docs/en/web-push-for-ios
- S5 iOS constraint — a push handled without a shown notification risks
  subscription revocation, so on iOS the visible-app branch shows-then-the-
  app-closes instead of skipping.
  https://github.com/mdn/browser-compat-data/issues/19318 (tag/getNotifications
  iOS caveats) · S4 (revocation rule)

**ABANDONED (indexed; buried as a class, relay and client alike):**
- A1 Relay ack-gated push: the pendingWakes map, the 1-second fallback timer,
  cancellation on any inbound word. Deleted.
- A2 Relay liveness stamping (lastSeen) and the 105-second freshness
  exemption ("provably presenting"). Deleted — this is the inferred-presence
  class buried 2026-08-23, rebuilt in v4 by mistake.
- A3 Relay connected-socket suppression (skip-push-because-a-socket-exists).
  Deleted. A socket is not a person.
- A4 Client ack-on-presentation machinery (p4Ack and its wraps). Deleted —
  nothing gates on it anymore.
- A5 The 30-second background-listener heartbeat. Deleted — it existed only
  to feed the relay's liveness view, which no longer exists.
- A6 The rejected 2026-08-28 same-session F-B patch AS AN ACT. Its content
  (close a room's stale notifications the moment the ring screen presents)
  re-enters here as declared item P4v2-c, through the plan, with approval.

**BASELINE → PATCH → RESULT (traceability):**
- Baseline app: bridge-turn24-ship.html, byte-preserved (device-passed
  2026-08-15, owner-revalidated 2026-08-27).
- Baseline relay: worker-talk.js v4 lineage (R7 body + RFC 8291 delivery
  class, commit e416a70) minus A1-A3 → v4.2. The RFC Appendix-A vector gate
  still applies byte-exact.
- Patch (part sources, talkbridge/parts/): p2-install-gate.js (unchanged),
  p3-subscription.js (minus A5), p4-alert-hygiene.js v2 (minus A4, plus
  P4v2 below), p4-sw.js v2 (plus the S2 visible-client branch), p6-threads.js
  (unchanged).
- Result (one assembly command, artifacts are output only):
  bridge-turn24-post-ship.html + tb-sw.js, shipped in the SAME commit as
  relay v4.2 — the pair moves together.

**P4v2 — device-side presentation rule (replaces every ack behavior):**
- a. Relay v4.2 pushes every push-worthy event to every subscribed device
  except the sender. No other condition exists.
- b. Worker on push: if a VISIBLE window client exists — non-iOS: do not show
  (S1/S2 pattern; journaled 'skipped_visible'); iOS: show with the room tag
  (S5) and the app closes it. No visible client: show with the room tag.
- c. App: any push-worthy event it presents while visible (active-room
  message, ring screen, panel badge/toast) closes that room's notifications
  immediately and once more ~2.5s later (a banner can land after the event).
  Ring-present, answer, and room-open all close (A6 re-entry).
- d. Registration still mirrors mute (a muted room is unsubscribed) — that is
  declared state, not presence inference, and stays.

**Gate additions:** relay harness v4.2 — every subscribed non-sender is pushed
regardless of socket state; no pendingWakes, no lastSeen, RFC vector intact.
App harness — visible-branch both ways, presented-close paths, plus the full
existing R10 suite minus the abandoned ack tests. Fresh mutations for every
new behavior. Owner device matrix per §4.4 is unchanged and remains the only
gate that counts.

### 4.2 · HISTORICAL v19 SCOPE — superseded by §4.7
Journey polish beyond the gate screen, in-band invites (J8) — note: P6 room
codes supersede paste-invite J7 if approved — transcription-lag work, rtc glare, R11+ items. Nothing else rides.

### 4.3 · HISTORICAL v19 MACHINE PROOF — superseded by §4.7
Relay: RFC vector byte-exact; ack-gate logic tests + mutations (ack
suppresses, no-ack pushes, liveness stamps, constructor-anchored state);
live deploy probe: delivered-on-socket, wake for the absent, no wake for
the acked, missed-call wake, Apple-shape POST leaves.
App: assembled-from-ship verification (ship segments verbatim); gate-screen
behavior in browser context vs full app in standalone context; name asked
once; subscribe attempted under the recorded device contradiction
(prop granted / answer denied) and under fresh-default; every room
registered; heartbeat present; tag replacement; ack sent on ring-present;
stale-close on answer; zero UI outside declared surfaces. Fresh mutation
set; every planted defect must fail. Byte-verify at the exact commit SHA.
Handover states: scores, pair, and the one thing only devices can prove.

### 4.4 · HISTORICAL v19 OWNER ACCEPTANCE — superseded by review §8.1
Requirement v2 matrix: locked/backgrounded ≥120s — message → exactly one
notification ≤5s; call → exactly one alert with sound ≤5s; unanswered →
exactly one missed-call alert. Foreground same-room: zero alerts.
Foreground other-room: exactly one, no double. Both directions. iOS
constraint stated honestly: a locked web app's "ring" is a notification
with sound; sustained ringtone exists only with the app open (Apple's
floor, all vendors).

### 4.5 · RELEASE LAW
Plan approved → build → gates → deploy → byte-verify → handover. Any
regression to baseline behavior = full stop and rollback of the pair. No R10
scope exists until a new owner-approved contract is written from the exact
rollback baseline. No repo artifacts beyond the declared build outputs and part
sources. The graveyard is scanned before building; buried ideas stay
buried (browser name-carry, patch-forward, flash-then-close as primary).

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
| 11.8 | iPhone type renders smaller than nominal across surfaces (room-menu you/partner labels, transcript dates, sys pills — "a 12 showing as a 9"). Suspected page-level scale/overflow, NOT per-element sizes; instrument actual layout vs visual viewport before any fix | Not started |
| 11.9 | Onboarding name field sits awkwardly above the fold at mid-screen on iPhone; reposition within S0 | Not started |
| 11.7 | Mute VIDEO icon occluded (owner report 2026-08-14). Cause unknown — instrument and read the base's actual rendering before any fix; no theorised root cause. The ribbon media controls sit under the standing never-touch rule, so the fix needs an explicit owner-scoped exception and the smallest possible change. Owner directive on this item: DO NOT BREAK ANYTHING. | Not started |

---

## 6 · RELEASE 12 — MULTI-PARTY

| # | Item | Status |
|---|---|---|
| 12.1 | Group conversations, three or more. The relay already broadcasts to every socket in a session; everything above it assumes two people — language pairs, the two-column transcript, "Talking to X", call negotiation | Not started |

---

## 7 · RELEASE 12b — INDEXEDDB STORAGE MIGRATION

Replace localStorage with IndexedDB as the backing store for phrasebook and
room data. Required before pilot — localStorage limits will surface under
real usage. Zero visible behaviour change; the same data, the same API
surface, different storage backend. Must include a migration path from any
existing localStorage data. Gate: phrasebook roundtrip, room persistence,
and a localStorage-to-IndexedDB migration on a device with real data.

| # | Item | Status |
|---|---|---|
| 12b.1 | IndexedDB wrapper with the same get/set/save interface the app currently uses against localStorage | Not started |
| 12b.2 | One-time migration on first open: copy existing localStorage phrasebook and room data into IndexedDB, then clear the localStorage keys | Not started |
| 12b.3 | Fallback: if IndexedDB is unavailable (private browsing), stay on localStorage silently | Not started |

---

## 7 · RELEASE 13 — REMAINING SECRET MIGRATION, PHASE B (GOVERNED, VERY LAST)

Placed at the BACK of the schedule by owner ruling 2026-08-15: runs only
after R9, a passed R10, R11, and R12 are done, and only on the owner's
explicit go. R10.5 and R10.6 do not supersede that sequence. No R10.6
authorization or provider-token mechanism carries into Release 13. Release 13
remains governed by:

    talkbridge/TALKBRIDGE-GOVERNING-PHASE-A-PHASE-B-EXECUTION-PROMPT.txt

Remaining scope is governed by that document and must be redesigned from the
then-current accepted baseline when the owner explicitly authorizes Release 13.
The rejected R10.6 `tb_auth_v1`, Deepgram-token, and TURN-credential services
are not a starting point.

---

## 8 · FUTURE IDEAS — unscheduled, no release

| # | Idea | Status |
|---|---|---|

| # | Idea | Status |
|---|---|---|
| F1 | Temporary messages — delete on timer, or one-time view | Idea |
| F2 | Clear transcript | Idea |
| F3 | Broadcasting — list, message, scheduled | Idea |
| F4 | Reminders | Idea |
| F5 | Invites | Idea |
| F6 | Room-scoped phrasebook pairs — a phrasebook that belongs to a room, not only the device | Idea (post-pilot) |
| F7 | Phrasebook-informed translation — staged: exact-match bypass first (no new dependencies), then LLM-assisted for curated terms in novel sentences; pre-substitution and post-correction REJECTED by owner (broken-grammar risk) | Idea (post-pilot) |

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

### 1.13 Mute terms are distinct
Room notification mute (§4.7) is a per-device attention control: no alerting
surface, but existing content/history and exact home counts remain. It never
touches chat bubbles or the transcript. Call microphone/media mute is the
pre-existing content rule—no transcription, transmission, or generated voice
bubbles from that muted input—and is out of R10 notification scope. Neither
control may silently change the other.

### 1.14 The chat surface and the call transcript are ONE transcript
Calls are a live-media layer over it. The transcript, compose strip and
phrasebook move together and are never split across releases.

### 1.15 Phrasebook
Two direction-specific books per language pair. GitHub is the source of truth;
local storage is a disposable cache. The app never manages version numbers — it
overwrites in place.

### 1.16 Credential architecture is frozen at the accepted baseline
R10.6's server-validated authorization and temporary-provider-token design is
rejected. No credential transport, storage, QR, provider, or relay capability
change is active. Any future change belongs to a separately approved release
and starts by proving a defect against the then-current accepted baseline.

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
| TalkBridge authorization | Exact R10.2 baseline contract; no R10.6 `tb_auth_v1` service |
| TURN credentials | Exact R10.2 baseline path; no `/service turn-credentials` endpoint |
| Deepgram credentials | Exact R10.2 baseline path; no `/service/deepgram-token` endpoint |
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

**v20.46.0 · 2026-09-03.** Two faults, both mine, both removed at the source.
**G42 — Android microphone dead.** The caller mute disabled the outgoing audio
tracks at call start, before the connection held them, and its restore ran on a
path that does not always fire — so the microphone stayed off for the whole
call and the level meter never moved. The mute is buried whole rather than
repaired; the call screen and ring-back remain. This build also re-enables any
track an earlier version left disabled, so a phone that ran that code is not
left silent.
**G43 — presence still dark.** The peer signal set the dot true but never
refreshed the app's own partner-seen clock, whose 75-second timer then blanked
it while the partner was still attached. Two owners, and the stricter one won.
The peer signal now refreshes that clock.

**v20.45.0 · 2026-09-03.** The owner's report of "PiP flip does not work" and
"regression on audio" traced to ONE function by reading the code, not by asking
for another test pass (G41). The stream swap: never called `play()`, so the
picture never changed and the tap read as dead; set `muted` from its own toggle
state, overriding the room's Ear setting, which could silence the far side or
put our own microphone through the speaker; and left a swap in place at
hang-up, carrying our camera in the large frame and the far side muted into the
NEXT call — an audio fault that survives the call that caused it. All three
fixed: mute follows which stream an element holds, both elements are played,
and teardown hands the elements back exactly as the app expects them.
Gates: N13 24/24 with 10 replanted defects caught, including all three of these.

**v20.44.0 · 2026-09-03.** First release diagnosed from the shared device log
rather than from reasoning. Two defects read straight out of it:
**G39 — audio.** The caller's mute ran through the app's own mic switch, which
also stops transcription and signals the far side, and it fired at `call_start`
when the connection had no senders yet — the audio pipeline was torn down
before it existed. Now only the outgoing track is disabled, restored on answer,
and never left disabled after a call.
**G40 — presence.** The dot was driven straight off the relay's connected
count, but a device holds several sockets and re-attaches them on focus, so the
log shows 0→1→0→1 within seconds and the dot blinks. Lighting is immediate;
going dark now waits out a grace, so a reconnect is not read as a departure.
Also confirmed from the log: the folder move is in effect on device
(`n15_scope_ok` at `/stuff/talkbridge/`), iPhone push subscribes cleanly
against Apple, and the browser reports native picture-in-picture as available
on iPhone. Tap-to-swap could not be judged — every call in the log was voice,
so there was no video to swap.
Still open: D-1 Android lock-screen ringing, D-3 iPhone return-to-call.
Gates: N9/N10 24/24, N17/N18 15/15, app contract 16/16, release-law PASS.

**v20.43.0 · 2026-09-03.** Owner: attempt every open item before testing —
nothing left in the backlog.
**N17 — presence (D-4).** Found by reading the code: the dot was lit by
`touchPresence()`, which only ran when a message happened to ARRIVE from the
partner on the room socket. A connected but quiet partner went dark after the
timeout, and a partner who had left stayed lit until it expired. Presence was
inferred from traffic and never actually told to anyone. The relay is the only
party that knows who is attached; it now announces the count on every join and
every leave, and the dot follows that. Traffic still refreshes it, so a missed
announcement loses nothing. This is why no version back through turn 23 worked
— it was never built to work.
**N18 — call timers (D-5).** The caller's clock mounts when the call is PLACED,
the answerer's when it is ANSWERED. N10 re-anchored the caller on answer but
the on-screen clock is driven by a timer started at mount and never restarted,
so the display kept its original start — which is why the owner still saw a
mismatch. Both sides now anchor AND restart the display at the answer.
Still open and honestly named: D-1 Android lock-screen ringing (cause unknown),
D-3 iPhone return-to-call (untested). Everything else has an attempt in the
build awaiting the owner's pass.
Gates: N17/N18 12/12 with 7 replanted defects all caught; N16 11/11; relay
contract 10/10; app contract 16/16; release-law PASS.

**v20.42.0 · 2026-09-03.** Owner: hand the diagnosis over — one shared log,
one address, then a test URL and nothing else.
**N16 — shared device log.** Every log line each handset writes is also sent to
one shared file, in arrival order, tagged with which device wrote it and
stamped with its own time. The relay holds it in one fixed place so both
phones land in the same file; a scheduled repository workflow drains it to
`talkbridge/DEVICE-LOG.md` every five minutes (and on demand), which is
readable directly. Two sides of the same call can now be read together instead
of correlated by hand from two exports. The local log is untouched; failures
to send are silent and never reach the app.
**G38 — one release, one address.** `bridge-turn25-base.html` was still serving
an older build than the folder artifact. The owner tested it and reported
tap-to-swap, camera swap, PiP and the PRISM fix as broken; none of them exist
in that build. Both root addresses now forward to the single folder artifact.
**Defects recorded from the owner's pass:** D-4 presence indicator (predates
this cycle, traced back through turn 23 — backlog), D-5 call timers still
mismatched despite both clocks anchoring to the answer, D-6 call screen
reported broken on the wrong address and needs re-testing before any cause is
claimed.
Gates: N16 11/11; relay contract 10/10; app contract 16/16; D-2 11/11; N13
20/20; release-law PASS.

**v20.41.0 · 2026-09-03.** The extra "Turn on notifications" step is REMOVED
(G37). It should never have been added: the original design asks silently on
the person's next tap, and that listener never blocked the tap — it runs in
capture and lets it through. The menu did open; the denial card covered it. So
the card was the whole defect, and a working invisible flow was traded for a
visible extra step nobody asked for. Restored: nothing extra is shown, nothing
is tapped twice, and the denial card now appears at most ONCE per install and
names the settings of the device in front of the person (Android: App info →
Notifications → Allow, category set to Alert; iPhone: Settings →
Notifications → TalkBridge).
Gates: N9/N10 22/22 with 7 replanted defects caught (including the bar being
added back and the card smothering the app again); app contract 16/16; D-2
11/11; N13 20/20; release-law PASS. Relay unchanged — accepted pair.

**v20.40.0 · 2026-09-03.** ROLLBACK on owner order. The relay is restored to
the accepted pair (`6609b141e7da`, ac541c1) and the app-side parts that
depended on it — the liveness ack answer and the push-outcome log line — are
removed with it. Buried as G36: the always-push change never changed device
behaviour and it broke a contract check that had been passing (app VISIBLE in
the room expects zero OS alerts, got one). That check was red at push time and
was not read. The rule now stands in the graveyard: the full contract suite is
read BEFORE a push; a red check is a stop.
**What survives, and it is gated:** D-2, the PRISM un-hijack. The app lives at
`/stuff/talkbridge/`, its manifest claims that folder only and carries no start
address, the worker registered from that folder gets that scope, the old
address forwards with hash and query intact, and old root-scoped workers are
retired by exact scope AND script match with push released first.
**D-1 Android lock-screen ringing: cause still UNKNOWN**, and nothing in this
build claims otherwise. **D-3 iPhone return-to-call: still untested.**
Gates on the restored state: app contract 16/16 (the check that was red is
green again), relay contract 10/10 with every planted defect caught, D-2 11/11
with 4 replanted defects caught, N13 20/20, release-law PASS.

**v20.39.0 · 2026-09-03.** Owner: fix all three defects.
**D-2 PRISM capture — FIXED.** The app now lives at `/stuff/talkbridge/`, so
its manifest and worker claim that folder and nothing else under `/stuff/` is
captured. Relative paths do the work: the manifest beside the app declares
`scope: /stuff/talkbridge/` and carries NO start address (G25), and the worker
registered from that folder gets that folder as its scope. The old address
forwards every launch with its hash and query intact, so invites, notification
taps and old bookmarks still land. Devices installed before the move have their
old root-scoped workers retired by EXACT scope AND script match, push released
before unregister — PRISM's worker and any other app's are provably untouched,
and no storage is cleared.
**D-1 Android lock-screen ringing — STILL UNKNOWN, now diagnosable in one
test.** No cause is claimed. The relay always knew what the push service
answered and never told the device, which is why three different links could
not be told apart. It now reports the outcome and the app writes it to the log:
`n14_push_out status=2xx` means the push was ACCEPTED and the handset was
reached (anything still wrong is on the phone); `403/404/410` means it was
REJECTED (subscription or key); NO LINE AT ALL means the relay never sent. One
locked-phone test now names the failing link instead of another guess.
**D-3 iPhone return-to-call — still UNKNOWN.** It cannot be fixed by building;
only a device test settles it, and no claim is made until then.
Artifact: `/stuff/talkbridge/bridge-turn25-pre-ship.html` = 25·pre-ship bytes +
two appended parts, zero changed lines; worker byte-identical to the accepted
one; accepted release untouched.
Gates: D1/D2 18/18 with 6 replanted defects all caught (manifest claiming
/stuff/ again, a start address added back, prefix-matching that would retire
PRISM, unregister without releasing push, outcome never reported, rejection
reported as success); N13 20/20; relay contract 12/12; release-law PASS.

**v20.38.0 · 2026-09-03.** Roadmap cut to the owner's three releases —
multi-user, technical-debt cleanup, IndexedDB — and nothing else. Everything
that was sitting on the roadmap because a build failed is moved to §0d OPEN
DEFECTS and named as a builder failure: D-1 Android lock-screen ringing (two
real causes found and fixed, neither changed device behaviour, remaining cause
UNKNOWN and not narrowed); D-2 PRISM scope capture (fix built, rolled back,
never rebuilt — in no live artifact); D-3 iPhone return-to-call behaviour
(never tested, previously stated as if known). The 25·base and 25·pre-ship
rows are corrected to say plainly what is built, what the owner confirmed on
device, and what is not fixed — the 25·base row had carried a claim that the
PRISM un-hijack shipped, and a link to an artifact that no longer exists.

**v20.37.0 · 2026-09-03.** N12 rolled back and rebuilt as N13 after the owner's
device gate (G35).
**What was wrong.** (1) Tap-to-swap moved CSS between the two video elements,
so the big frame shrank and the small one grew — on device that read as the
call collapsing into the small 9:16 view, which is exactly what the owner
reported. (2) The PiP was a CSS overlay inside our own page; it cannot survive
another app coming forward, which is the whole point.
**N13.** A tap now exchanges the STREAMS between the two elements and touches
nothing else — no class, no size, no mode, never PiP; the element carrying our
own camera stays muted. The back button asks the BROWSER for its own
Picture-in-Picture window, which is what floats over other apps; if the browser
refuses or lacks it, the frozen in-page view still runs, and the log says which
path was taken (`n13_native_pip` or `n13_inpage_pip`) so the cause is never
guessed. The owner is right that a permission is involved: on Android this
needs Chrome's own Picture-in-picture permission (Settings > Apps > Chrome >
Picture-in-picture).
Camera swap, desktop-only screen share, and the drag-anywhere inset carry over
unchanged and re-gated.
Artifact: `bridge-turn25-pre-ship.html` = 25·base bytes + one appended part,
zero changed lines; worker, manifest, install gate untouched; relay unchanged.
Gates: N13 20/20 with 9 replanted defects caught (including the exact G35
defect); N9/N10 22/22; relay contract 12/12; release-law PASS.
Live: https://acmeproducts.github.io/stuff/bridge-turn25-pre-ship.html

**v20.36.0 · 2026-09-03.** OWNER LADDER, locked 2026-09-03: 25·pre-ship =
calls and video complete; 25·ship = multi-user; 25·post-ship = technical debt
cleanup; 26·base = IndexedDB, the last build before pilot. EVERYTHING else is
post-pilot, including **Android not ringing on the lock screen, which the owner
has moved to backlog** after N8/N11 — the app-side and relay-side causes found
so far (G30 belief-based suppression, G34 stale signing key) are fixed and
shipped; the remaining device behaviour is not blocking any release.
**N12 — the video surface (§5.4), built to the owner's spec as written:**
tapping either video swaps which stream is large; the inset is draggable across
the WHOLE screen and may hang off an edge with a sliver left to drag it back; a
drag is never mistaken for a tap; the back button drops to a 9:16 PiP with the
call still LIVE and exactly two controls — a diagonal expand and an X to end;
camera swap is offered only where a second camera exists and actually reaches
the far side; screen share swaps the outgoing video track and is offered ONLY
where a screen can be captured — desktop; phones never see it (verified
2026-09-01: display capture is unsupported on iOS Safari and Android Chrome).
Ending a call resets the whole surface. Built by reading the live markup and
CSS, never reconstructed.
Artifact: `bridge-turn25-pre-ship.html` = 25·base bytes + one appended part,
zero changed lines. Worker registration, manifest and install gate untouched
(G32). Relay unchanged — pair verified: deployed source `10cdff488553ebbf`
matches the repository byte for byte.
Gates: N12 19/19 with 9 replanted defects all caught; N9/N10 22/22; N11 9/9;
relay contract 12/12; release-law PASS.

**v20.35.0 · 2026-09-03.** Owner: permissions have ALWAYS been on and Android
still does not ring when locked. That rules out permission and points at the
subscription itself — root cause G34, found in the app's own code: the app
reuses whatever push subscription the browser holds without ever checking it
was minted with the current signing key. Such a subscription looks healthy from
every angle the app can see (permission granted, object present, endpoint
accepted by the relay) while the push service silently rejects every message
the relay signs. Nothing arrives, nothing is reported. iPhone escaped it
whenever its subscription happened to be recreated.
**N11:** on every standalone boot the app compares its subscription's key with
the live one; on a mismatch it discards the dead subscription, mints a fresh
one and re-registers every room. A healthy subscription is left untouched — no
churn, no duplicate endpoints. The log now says plainly which of the two
happened (`n11_key_ok` or `n11_key_stale` → `n11_resubscribed`).
Gates: N11 9/9 with 4 replanted defects caught (stale key accepted, dead
subscription kept, rooms not re-registered, healthy subscription churned);
N9/N10 22/22; relay contract 12/12; release-law PASS. Still zero changed lines
against the accepted app and no worker, registration or manifest surface
touched.
Live: https://acmeproducts.github.io/stuff/bridge-turn25-base.html

**v20.34.0 · 2026-09-03.** 25·base completes the round trip, on owner order.
**N9 — notification permission (G33).** The failed silent subscribe used to arm
a listener that ate the next tap anywhere; on the owner's Android the hamburger
was that tap, so the menu never opened and the denial card appeared instead.
Replaced by a visible bar the person taps on purpose. The denial card gave
iPhone settings on every platform; it now branches — Android gets App info →
Notifications → Allow, and the category set to Alert/Pop-up (a silent category
never makes a sound), iPhone keeps its own steps. This is why the handset could
not ring when locked: notifications were never actually granted on the device.
**N10 — the outbound half of the call.** Caller's microphone is muted while it
rings, the caller sees a call screen naming who is being called, and hears a
ring-back through the phone; on answer the mic goes live, the screen clears,
and BOTH clocks start at the answer, so the two sides agree (B-8a closed).
Cancel ends the call on both sides. Wrapped around the frozen call logic.
Together with N8 (liveness ack gate) 25·base now carries the whole device-to-
device cycle: reachable when locked, alerted correctly, dialled and answered
with matching timers.
Scope note: no service worker, registration, manifest or install-gate surface
is touched (G32); the app has ZERO changed lines against the accepted bytes —
only appended parts.
Gates: N9/N10 22/22 with 8 replanted defects all caught (tap thief, wrong
platform steps, mute, ring-back, call screen, both clock anchors, mic on
answer); relay contract 12/12; N8 app passthrough 9/9; release-law PASS.
Live: https://acmeproducts.github.io/stuff/bridge-turn25-base.html

**v20.33.0 · 2026-09-02.** Second-pass line-by-line audit of 25·base against
the accepted baseline `ac541c1`, at owner instruction. Confirmed identical:
`tb-sw.js`, `tb-manifest.webmanifest`, `bridge-turn24-post-ship.html`, and the
25·pre-base snapshot (sha `6abc47d77ed2`); the candidate still registers
`./tb-sw.js`, so no worker, registration, manifest or install-gate surface is
touched (G32). The app differs from the accepted bytes by ONE appended block;
the relay by ONE constant, ONE method, ONE branch and ONE message line.
**One real defect found and fixed by the audit:** the new in_app push path did
not apply the stale-subscription rule the os_requested path applies, so an
expired subscription could have been pushed instead of dropped. Now gated by
its own scenario. Two cosmetic defects fixed as well (an orphaned trailing
comment on STATE_FRESH_MS and a line placed under the wrong comment).
Gates: relay contract 12/12 (adds the locked-handset scenario and the stale-
subscription scenario), 5 replanted N8 defects all caught (gate removed, gate
always-awake, gate always-asleep, stale rule dropped, ack not settling),
CR3 app mutations 17/17, app part audit 9/9 proving every accepted message
still reaches the original handler unchanged and only the liveness challenge
is intercepted, release-law gate PASS.
Live: https://acmeproducts.github.io/stuff/bridge-turn25-base.html

**v20.32.0 · 2026-09-02.** 25·base, rebuilt from the accepted pair after the
install-gate/flicker regression (G32: changing the registered worker filename
under a live install). This build touches NO service worker, no registration,
no manifest, no install gate. The app differs from the accepted bytes by one
appended part.
**Cause of the Android silence (G30), unchanged and now fixed properly:** the
relay withheld the push from any recipient it believed was `in_app`, and that
belief is the handset's own last self-report — a phone that locks or is
backgrounded keeps its socket open while the report still reads `visible` for
up to STATE_FRESH_MS, so nothing was sent and nothing could ring. iOS was
never affected because it suspends the page and drops the socket.
**N8 — liveness ack gate:** before withholding a push the relay asks that
socket to prove it is awake and waits ALIVE_MS (1200ms; tests shorten it). A
live on-screen app answers immediately and is not pushed, so there are still
no duplicate alerts; a locked or frozen page cannot answer and is pushed.
Muted and burst suppression are untouched, as are presentation words,
counters, projections and the ledger.
Gates: relay contract 11/11 including a new scenario reproducing the exact
device failure (reported visible, then locked → pushed; live app → not
pushed), CR3 app mutations 17/17, release-law PASS.
Live: https://acmeproducts.github.io/stuff/bridge-turn25-base.html

**v20.31.0 · 2026-09-02.** 25·base built from the ACCEPTED pair, one
behavioural change: make the phone ring again, by restoring the R10.2 alert
recipe verbatim rather than inventing one.
**Cause (G30, from the repo):** R10-CR3 pushes only a recipient the relay has
decided is `os_requested`; a recipient it believes is `in_app` gets no push at
all. A phone that locks or is backgrounded keeps its socket alive and its last
self-report still reads `visible` for up to STATE_FRESH_MS (45s), so the relay
withheld the push and the handset had nothing to ring. iPhone was never
affected because iOS suspends the page and drops the socket, so the relay
falls through to pushing. That asymmetry is exactly what the owner reported.
renotify:false (G29) is a real regression too — the second message in a room
replaced the first silently — but it could never be the whole cause: an alert
that is never sent cannot re-alert, which is why fixing it alone changed
nothing on device.
**N7 = R10.2 §4.6 ALWAYS-PUSH, restored:** the relay always pushes (words,
counters, projections, ledger unchanged; muted and burst still block it) and
the DEVICE decides presentation — a visible window means skip on Android
(the app is the alert) and show-then-close on iOS (Apple revokes
subscriptions that receive silent pushes); no visible window means show, with
renotify, icon and badge (#652). Written as parts over the accepted worker;
the accepted artifacts are byte-untouched.
Gates: N7 16/16 across both platforms and both halves; relay contract 11/11
including a new scenario that reproduces the exact failure (a phone that
reported visible, then locked, is still pushed); 7 replanted defects all
caught, including the relay withholding the push, renotify:false, and
swallowing an iPhone push; CR3 app mutations 17/17; release-law PASS.
Live: https://acmeproducts.github.io/stuff/bridge-turn25-base.html

**v20.30.0 · 2026-09-02.** ROLLBACK TO THE ACCEPTED PAIR, on owner order.
Live everywhere is now `ac541c1`: app `6abc47d77ed2`, worker `tb-sw.js`
`610718a6c39a`, relay v6.2 `6609b141e7da`. `bridge-turn25-base.html` serves
the accepted bytes; every part, candidate worker and candidate harness from
this turn is deleted (G31). The accepted contract tests are restored
unmodified — the two CR3 assertions changed for always-push are reverted.
Gates on the restored pair: CR3 relay 10/10, CR3 mutations all caught,
release-law PASS.
Everything built this turn is buried, including work that may have been
correct, because it was stacked without device gates and cannot be
attributed. Rebuilding is one behavioural change per candidate, device-gated
before the next is written, rolling back to the ACCEPTED pair — never to a
previous candidate.
Live: https://acmeproducts.github.io/stuff/bridge-turn25-base.html

**v20.29.0 · 2026-09-01.** The owner was right that the working behaviour was
already in the repo and had not been carried into this release. Diffing R10.2
(`e74c7cb2`, named ALWAYS-PUSH) against R10-CR3 (`339eb402`) shows the real
cause (G30): CR3 pushes only recipients the relay has decided are
`os_requested`. A recipient it believes is `in_app` gets NO push. A
backgrounded or locked Android page keeps its socket alive and its last
reported state can still read `visible`, so the relay withheld the push
entirely — the handset had nothing to ring. iPhone kept working because iOS
suspends the page on lock, the socket drops, and the relay falls through to
pushing. That is the whole asymmetry the owner has been reporting.
renotify:false (G29) was a genuine regression and is fixed, but it was never
the reason Android was silent: an alert that is never sent cannot re-alert.
Fixing it alone changed nothing on device, exactly as observed.
**N6:** the relay returns to always-push — presentation words, counters,
ledger and projections all unchanged, muted and burst suppression still block
the push — and the DEVICE decides display as it did in R10.2: the worker
shows nothing while a window is genuinely visible. The two CR3 contract
assertions that asserted "no push when in_app" are updated to assert "push
sent, display suppressed on device", with the reason recorded inline.
Gates: N5/N6 17/17 with 7 mutations caught (including the relay withholding
the push again and the device alerting while in front), CR3 relay 10/10, CR3
app mutations 17/17, R11.0 4/4 + 4/4, release-law PASS.
Live: https://acmeproducts.github.io/stuff/bridge-turn25-base.html

**v20.28.0 · 2026-09-01.** ANDROID RING REGRESSION — ROOT CAUSE FOUND IN THE
REPO, as the owner instructed, by comparing versions instead of instrumenting.
Every worker from the first PWA build (`a7983a12`, 2026-08-09) through R10.2
(`e74c7cb2`) showed push notifications with **renotify: true**. Commit
`339eb402` (R10-CR1) changed it to **renotify: false**. Notifications carry a
stable per-room tag, so each push after the first REPLACES the notification
already in the shade, and Android re-alerts on a replacement only when
renotify is true — with it false the replacement is silent. That is exactly
the reported behaviour: rings while the app is open (the page's own ringer
plays) and silent when unfocused or locked (only the OS can alert, and it had
been told not to). The app's foreground path still passes renotify:true and
never regressed, which is why only the background case broke. No
instrumentation build was needed and none was spent.
**N5 candidate (worker-only, one change):** the assembled worker forces
renotify back on for every tagged notification and supplies the icon and
badge (#652). It wraps `showNotification`, which resolves at call time — the
G28 lesson that an appended `addEventListener` wrapper can never see
listeners the frozen worker already registered. App changes by exactly one
declared line (registers the new worker). No scope move, no relay change, no
call-surface change in this candidate.
**Presence/delivered-indicator regression (previous candidate):** attributed
to the buried scope migration, which unsubscribed and unregistered the
root-scoped worker that was still controlling the open page, cutting the
acknowledgement path the indicators ride on. Recorded so the PRISM release
proves the indicators before and after migration on the same device.
Gates: N5 12/12 with 4 mutations caught (including the exact `339eb402`
regression replanted), R11.0 4/4 + 4/4 mutations, CR3 relay 10/10,
release-law PASS. Live: https://acmeproducts.github.io/stuff/bridge-turn25-base.html

**v20.27.0 · 2026-09-01.** FULL ROLLBACK to the last known-good state
(commit `2b58bbf`): app `bridge-turn25-base.html` at the root with R11.0
only, accepted `tb-sw.js`, relay v6.2 source, accepted 24·post-ship pair
untouched. Restored byte-exact and re-gated (R11.0 4/4, CR3 relay 10/10,
release-law PASS). Every artifact of the buried work — candidate app, worker,
manifest, folder icons, parts and their harnesses — removed so none can be
reused by accident.
**Root cause of this turn's failures (G28), stated plainly:** four unproven
changes were stacked into one candidate — scope move, push format, worker
wrappers, caller call surface — and each was piled on before the previous had
passed a device gate, so when the delivered/read indicators regressed there
was no way to attribute it. Method failure, not a coding one.
**Second, concrete defect found in the rollback review:** the worker part
wrapped `self.addEventListener` in code appended BELOW the frozen worker,
which had already registered its push listener — the wrapper could never see
it, so the "guaranteed visible notification" was dead code and the Android
symptom was never actually addressed. Appended code may only hook what is
resolved at call time (a prototype method, an object property), never an
event registration that already happened.
**Android ringing is UNKNOWN and stays unknown until instrumented.** Two
builds asserted a cause without ever reading a device log of the push path;
both were wrong. Build order rule 5 (instrument first when the cause is
unknown) was skipped twice and is now mandatory for this item.
**Rebuild rule for 25·base, effective now:** one behavioural change per
candidate, each device-gated before the next begins. Order: (1)
instrumentation-only notification build — no behaviour change — to find why
Android does not ring unfocused or locked; (2) the fix that log points to;
(3) PRISM un-hijack alone, with every URL derived from the scope re-proven
(G27); (4) caller call round trip (mic muted, call screen, ring-back, synced
timers). Known-good rollback point for all four:
https://acmeproducts.github.io/stuff/bridge-turn25-base.html

**v20.26.0 · 2026-09-01.** Second device-gate failure and the owner's scope
call, both handled.
**Root cause (G27), found not guessed:** the frozen worker computes its
notification tap target as its own scope plus the hardcoded file name
`bridge-turn24-post-ship.html` (tb-sw.js line 92, `data.url ||
(self.registration.scope + APP_FILE)`). At /stuff/ that resolved to a real
file; after the un-hijack it resolves to
`/stuff/talkbridge/bridge-turn24-post-ship.html`, which does not exist, so a
tap opened a browser tab on a missing page — with the original install tab
closed the owner landed in Chrome's tab list. The owner's read that this came
from the un-hijack was correct. Fix N4: the worker rewrites any stale
destination to its real app file in the current scope, on every notification,
without touching the frozen handler. Live artifact:
https://acmeproducts.github.io/stuff/talkbridge/bridge-turn25-base.html
**Android ringing:** the earlier G26 defect (declarative envelope sent to
Chrome) is what stopped Android alerts from being ours at all; with the
Apple/Chrome split plus the guaranteed-visible notification, Android receives
the accepted R10-CR3 push exactly as it did when it last worked. Sound and
heads-up presentation on Android remain governed by the per-site channel
importance, which only the device owner can raise
(pushpad.xyz/blog/this-site-has-been-updated-in-the-background;
w3c/push-api#359).
**Owner scope directive, now built (N4):** caller's microphone is muted while
placing a call, the caller gets a call screen with an audible ring-back, the
mic goes live on answer, and BOTH clocks re-anchor to the accept (B-8a
closed). Wrapped around the frozen call logic; nothing replaced.
Gates: N4 10/10 + 4 mutations, worker 12/12 + 4, relay 9/9 + 3, N2 14/14 + 3,
app 8/8 + 3, R11.0 4/4, CR3 relay 10/10, byte parity 3/3, release-law PASS.

**v20.25.0 · 2026-09-01.** Device gate FAILED on Android (owner): iPhone
rang correctly; Android did not ring out of focus or locked and Chrome showed
its own unsubscribe/spam notification instead. Root cause G26 — the
declarative envelope and Content-Type were sent to every endpoint, so the
Chrome path stopped producing our notification and Chrome substituted its
own. Protocol executed: rollback of the Chrome push path to the accepted
R10-CR3 bytes, graveyard G26, plan bump, rebuild as N3 — relay branches on
endpoint (Apple declarative, everything else classic, mode logged per send)
and the worker now guarantees a visible notification after every push
settles. Gates: relay 9/9 + 3 mutations (incl. the replanted defect), worker
9/9 + 4 mutations, N2 14/14 + 3, app 8/8 + 3, R11.0 4/4, CR3 relay 10/10,
release-law gate PASS. Owner spec note: caller mute + call screen + ring-back
remain 25·ship (§5.3) and were never part of this build.

**v20.24.0 · 2026-09-01.** Governance self-test repaired, 16/16 green.
Two real defects, neither in the app: (1) the guard looks for the R10.6
burial as a literal lowercase sentence and the plan only stated it as a
heading — the sentence is now written plainly in §4.10, the burial itself
never changed; (2) the guard pinned the plan file's hash from the R10 cycle
and kept enforcing it after that cycle closed, so every later plan edit read
as tampering — the pin stays recorded but is only a veto while a cycle is
open (assert kept verbatim for open cycles). The remaining two failures were
an artifact of a shallow clone, not the gate.

**v20.23.0 · 2026-09-01.** Retired the three R10 candidate-gate workflows
(CR1/CR2/CR3) — R10 is accepted and closed, but they still ran on every push
to main and failed 25·base work as "outside the R10 scope wall." The live
gates are unchanged: the release-law gate still runs on every relay deploy
and pull request, and the 25·base suites (N1/N2/R11.0/CR3 relay contract)
run at build time. Deleting them touches no app, worker, or relay file.

**v20.22.0 · 2026-09-01.** N2 (PRISM un-hijack, §5.2) absorbed into the
25·base candidate on owner GO ("go"): canonical home `/stuff/talkbridge/`
(app + worker + manifest + icons); manifest declares scope, NO start
address (G25), stable id `/stuff/tb`; worker registered at explicit
canonical scope; root 25·base URL forwards with query+hash intact; the
migration part retires legacy root-scoped workers (`tb-sw.js`, `sw.js`,
`tb-sw-25b.js`) by exact scope+script only, unsubscribe before unregister,
after the new subscription exists; declarative taps now land on the
canonical URL (relay redeployed, same source version). Accepted pair and the
root manifest the accepted app links are byte-untouched (rule 0c, gated).
Gates: N2 14/14 + 3 mutations caught (incl. the exact G25 defect replanted);
N1 suites re-green on the canonical artifact; R11.0 4/4 with byte-parity
ownership moved to harness-n1-parity; CR3 relay 10/10.

**v20.21.0 · 2026-09-01.** N1 built on owner GO ("go"): (1) #652 — worker
`tb-sw-25b.js` (frozen r10-cr3 bytes + wrapper part) injects icon/badge and
explicit sound on every banner; `tb-sw.js` untouched per rule 0c, candidate
registers the new worker (one declared line). (2) Declarative Web Push —
relay v6.3 wraps the unchanged tb-ev identity in the web_push:8030 envelope
with Content-Type application/notification+json; iOS 18.4+ displays without
waking the worker, Chrome path byte-identical in behavior. Tap destination
is the 25·base stage URL (stage-bound constant; canonicalized at the PRISM
release). (3) #653 — "Join thread" fourth clock-menu option: paste an
invite link, or scan QR where BarcodeDetector exists; joins via the app's
own #j= boot path, nothing in it touched. (4) iPhone silence instrumented:
n1_notif_cfg logged at boot; silent:false explicit on both paths. Gates:
harness-n1-sw/app/relay/parity + mutate-n1-sw/app + CR3 relay 10/10; 9
planted defects all caught. Device gate: the five unproven rows
(2/3/7/8 Android, 13 Android→iPhone) + banner icon/sound on Android + iPhone
sound + a declined-thread rejoin — one session, log fidelity closes with it.

**v20.20.0 · 2026-09-01.** OWNER LOCK — final ladder, zero backlog:
25·base notifications-complete (log fidelity closes here, one gate; #652,
iPhone silence, five rows, declarative push, #653); 25·pre-ship PRISM;
25·ship call & video (owner spec + B-8a/B-8b/B-8c + #650 + 11.7 + desktop
screen share); 25·post-ship layout (R11 minus 11.7); 26 = multi-user →
IndexedDB → refactor (last build) → R13 then PILOT. Phrasebook enhancements
recorded as F6/F7 (post-pilot). &debug=1 stays cut by owner ruling.

**v20.19.0 · 2026-09-01.** Owner release ladder restructure: 25·pre-ship =
notifications close-out ONLY; 25·ship = PRISM un-hijack (§5.2); 25·post-ship
= call & video experience (§5.3: caller mute + call screen + ring-back,
synced timers/B-8a, WhatsApp-grade video, desktop-gated screen share);
turn26 = multi-user → IndexedDB → code refactor (last before pilot).
#653/B-8c pulled back out of the near release into unassigned backlog.

**v20.18.0 · 2026-09-01.** Correction: B-8a is NOT addressed — verified in
the live build (caller clock at placement, callee at accept). Reopened in
backlog with the code-proven cause; v20.17.0's closure was premature.

**v20.17.0 · 2026-09-01.** Owner: B-8a closed as addressed; #653, #650 and
B-8c pulled into 25·pre-ship (§5.1 parts 3). Declarative web push stays
backlog as the future iOS notification path.

**v20.16.0 · 2026-09-01.** Owner plan cleanup: §1 stale duplicate status
table removed — §0 ledger is the single authority; R9 marked passed (24·ship)
and its stale incompleteness note demoted to historical; 25·pre-ship set to
Android alert presentation + PRISM scope un-hijack per owner directive, with
R12 multi-party and R13 shifted one stage down the ledger.

**v20.15.0 · 2026-09-01.** turn25 pre-ship planned: Android alert
presentation (§5.1) — icon/badge fix is ours; heads-up banner is
channel-importance, fixed at channel creation, code cannot raise it —
device-gated in both channel states. Owner GO required before build.

**v20.14.0 · 2026-09-01.** Commit `fb7ed76` (scope migration) reverted
byte-exact; standing rule 0c added: accepted artifacts are immutable. Failure
recorded as G25. The PRISM scope-capture root cause stands (root-hosted app,
manifest with no explicit scope claims all of `/stuff/`) and will be rebuilt
as a proper gated candidate; the reverted commit's second defect — a
hardcoded manifest start address — is what broke the live QR join flow on
iPhone by launching installs at a bare, different build instead of the
grant-carrying invite URL. Live device build observed generating invites:
`bridge-turn25-base.html` — canonical-file assumption must be re-verified
with the owner before the next build.

**v20.13.0 · 2026-08-31.** R10 closed: R10-CR3 pair `ac541c1` accepted by the
owner as 24·post-ship (acceptance record in governance/evidence; gaps
recorded). 25·pre-base frozen as its byte-identical snapshot. §5 defines
R11.0 log fidelity (refresh lines fold, buffer 1200) as the 25·base prelude;
owner GO required. Backlog captured: Android alert presentation (#652), Join
thread via clock long-press (#653).

**v20.12.0 · 2026-08-31.** Owner correction: the iPhone's missing Deepgram key
was never proven ship-era (G24). Retracted; root cause §11 opened with an
evidence plan; §4.13.3 binds a correction once §11 is read; device row 13
(voice transcription on both phones) added. No GO requested until §11 closes.

**v20.11.0 · 2026-08-31.** R10-CR2 pair `0422654` rejected at the owner device
gate: iPhone kept running after blur/lock with the visibility flag stuck
"visible", so the relay was told "watching" and unfocused/locked chats were
never pushed and were acknowledged unseen (G23, root cause §10). G21/G22
proven live on the same run. Pair rolled back; cycle
`r10-recovery-2026-08-31b`; §4.13 defines R10-CR3: attendance = visible AND
focused, announced on blur, with no seen words while unattended.

**v20.10.0 · 2026-08-31.** R10-CR1 pair `339eb40` rejected at the owner device
gate: Android row 6 (laneless interval after room leave, G21) and rows 7/8
(tap focused the install-step browser tab, G22); iPhone passed all four
states; Android OS display proven by the shade. Whole pair rolled back to the
frozen bytes; cycle `r10-recovery-2026-08-31` opened; root cause §9 complete.
§4.12 defines R10-CR2: §4.11 inherited whole plus lane continuity on room
leave and app-announced tap targeting, each with machine gates and planted
defects. Owner GO required before build.

**v20.9.0 · 2026-08-30.** PR #647 banked the whole-release root cause and
advanced the fail-closed repository state to `plan_required`. §4.11 now defines
R10-CR1 as the sole clean-replacement proposal: exact R10.2/v4.2 inputs, one
durable recipient-event authority, recipient-specific call outcomes, one
single-flight recovery transaction, truthful presentation/push/seen facts,
scenario-first lifecycle gates, the unchanged 12-row two-device acceptance
matrix, and whole-pair rollback on the first failure. The R10.5/R10.6 source,
tests, instrumentation layer, opaque authorization, provider-token services,
new secrets, and credential diagnosis remain buried. No product file, service,
secret, URL, or deployment changed. This plan advances governance only to
`owner_go_required`; no corrective build authorized until a new explicit owner
GO is recorded.

**v20.8.2 · 2026-08-30.** Owner correction applied: rejecting R10.6 means
restoring the credential-working R10.2/v4.2 baseline, not repairing R10.6,
patching its credential symptom, or configuring its new services. Graveyard
G19 is corrected because the rejected release's paired Deepgram/TURN loss was
not reproduced against the rollback baseline. G20 buries the entire R10.6
opaque-authorization/server-token fork, including its three new production
secret dependencies, provider endpoints, client parts, relay changes, tests,
and deployment assumptions. PR #644 / merge `a82ddb63` already restored and
verified the exact baseline app/worker/relay bytes. No R10 build, credential
change, test URL, provider-secret action, or device test is authorized.

**v20.8.1 · 2026-08-30.** R10.6 was deployed by PR #643 and rejected by its own
fail-closed production gate before owner handoff. Seven live behaviors passed:
WebSocket connect, foreground ownership, encrypted push POST, bare caller
hang-up → missed, retry dedupe, one-time invite replay protection, and
device-scoped authorization. Both provider-contract checks failed:
`deepgram-token` and `turn-credentials`. This version restores the whole
app/worker/relay product to R10.2/v4.2 while preserving the exact R10.6
candidate at commit `95cd9593`. Its former prescription to configure
server-side Deepgram and Cloudflare TURN services is explicitly withdrawn and
void under v20.8.2.

**v20.8.0 · 2026-08-30.** R10.6 is built as a machine-gated candidate from the
frozen `bridge-turn24-ship.html` plus explicitly named P2 install handoff,
opaque authorization/temporary provider services, P3 subscription, inherited
P6 threads, recipient-event state, and flight-recorder parts. The app/worker,
relay, deployment-contract, and mutation scores are 21/21, 18/18, 12/12, and
26/26. Adversarial review added stable retry dedupe before history persistence,
enforced the authorization's device identifier at each protected service,
prevented a false “TURN missing” message when temporary ICE servers are active,
and made push subscription self-heal single-flight on lifecycle return. The
deployment workflow now fails closed on foreground ownership, a real encrypted
push POST, ordinary hang-up → missed, retry dedupe, one-time invite replay,
wrong-device refusal, and live Deepgram/TURN credential contracts without
printing credential values. R10.6's secret scope is explicitly Deepgram/TURN;
GitHub/PAT remains unchanged and assigned to R13. Production probes and the
owner's unchanged physical two-way matrix remain required; no device pass is
claimed by these machine results.

**v20.7.0 · 2026-08-29.** R10.5 is rejected after the paired Android/iPhone
device logs. The whole app/worker/relay pair was restored by PR #639 / merge
`922378dd`; the live baseline is R10.2 app/worker blobs `a5bcd189` / `953f99de`
with relay v4.2 source `94c391e4`. Graveyard v2.10 records G18 (replay-time
inference erased missed state) and G19 (plain QR retained a room while losing
the inherited Deepgram/TURN bundle across the installed-PWA lifecycle). §4.10
is now sole R10 build authority: recipient-specific unseen/outcome state,
transport-independent reconciliation on every lifecycle/reopen path, truthful
presentation states, single-flight reconnect, exact mute/burst counts, and
the integrated recorder. The August 15 opaque-authorization POC is promoted
into R10.6 only for the minimum invite/Deepgram/TURN path: one-time QR invite,
scoped `tb_auth_v1`, Deepgram temporary tokens, and expiring Cloudflare TURN
credentials; remaining GitHub/PAT migration stays in R13. The active 12-row
two-way matrix now includes caller-hang-up-as-recipient-missed and away events
while the app remains routed to that room. The plan, not product code, is the
only artifact changed. The owner's “please proceed” authorizes the dev team to
build exactly §4.10 without another plan edit or GO request; R10.6 remains
unbuilt at this plan commit.

**v20.6.1 · 2026-08-29.** R10.5 product commit `13b3d9ae` deployed
successfully. Pages run `33257913179` serves the exact gated app and worker
bytes; HTTP SHA-256 is app `06c3d8ae…e4fd` and worker `c2684e42…dc69`. Relay
run `33257913219` deployed v5.1 and its fail-closed live probe passed socket
delivery, `owner=in_app` with no push, `owner=os` committed before a real push
POST, push-service response status 404 for the deliberate invalid endpoint,
retry dedupe, durable timed-out video-call state, and authorized recorder
access. Relay status commit `f2f4fe21` preserves the complete output. This is
the corrected behavioral build with integrated instrumentation. It is ready
for the single owner hardware matrix; machine gates do not claim OS display or
device latency.

**v20.6.0 · 2026-08-29.** R10.5 executed as one corrected app/worker/relay
candidate with the flight recorder integrated, not as a diagnostic-only
release. The protected ship source is unchanged. The app attempts subscription
regardless of contradictory permission answers; the relay commits one durable
presentation owner per event/device before any attention surface; late pages
cannot ring after `owner=os`; mute is relay-acknowledged; the event URL drives
cold and warm notification taps; active calls mount Accept/Decline and ended
calls mount their room plus durable outcome; the ledger owns exact chat,
voice, and video counts beyond chat-history expiry. App-generated OS
notifications and the global push topic remain forbidden. The integrated
recorder is redacted, bounded, access-controlled, read-only, and absent from
normal UI unless `tbDiagnostics=1` is explicit. Reproducible gates pass 49 app
and worker checks, 25 relay/RFC/state/deploy checks, 22 recorder checks, and 34/34
fresh planted defects. The relay deployment workflow now rejects any manifest
other than v5.1 and live-probes foreground owner, OS owner-before-push, one
real push-service POST, retry dedupe, missed-call ledger state, and recorder
access. It also gates the prior Cloudflare failure class: randomness may not be
generated at module scope. Candidate blob IDs: app `23bcc483`, worker
`c00246fd`, relay `11d000c5`; live run IDs and final byte verification are
recorded only after publication succeeds. OS display and latency remain
hardware facts and are not claimed by machine gates.

**v20.5.1 · 2026-08-29.** R10.2 rollback merged to `main` at product commit
`4bdc8cf4` and is live. Public app blob `a5bcd189`, worker blob `953f99de`, and
relay source blob `94c391e4` match the governed rollback exactly. Pages run
`33246874798` and relay run `33246874675` completed successfully; live relay
diagnostics report v4.2 with no OBS1 marker. Relay status commit `07e67e37`
preserves those product blobs. The stage ledger and §4.9 now report deployment
as complete. No behavioral-fix candidate has been built or handed over.

**v20.5.0 · 2026-08-29.** Owner rejected OBS1 as a standalone release: the
agreement was rollback → corrected behavioral build with instrumentation, not
another owner test of known-failing R10.2 with logs added. OBS1 product code is
removed and the exact R10.2 app/worker/relay bytes restored. The fail-closed
relay workflow repair is retained and retargeted to prove the rollback
manifest. §4.9 is active authority: one irreversible presentation owner per
event/device (`in_app` only after an exact foreground grant; otherwise `os`),
late reconnects forbidden from auto-ringing, canonical event-URL navigation,
durable call outcomes and exact counters, acknowledged per-device mute, and
the redacted flight recorder integrated as supporting infrastructure. WebKit's
2025 declarative `navigate` contract and the standard worker open/focus path
are cited. Dev-team preflight includes three iOS/Android smoke cycles; the
owner receives one corrected URL and one matrix, never a diagnostic-only URL.

**v20.4.2 · 2026-08-28.** The first OBS1 relay upload was correctly rejected
by Cloudflare because a diagnostic salt was generated in module-global scope,
but the repository workflow masked Wrangler's nonzero exit and then probed the
still-running old relay. No owner handover occurred. The salt now initializes
lazily inside an event handler. The deploy job now fails on Wrangler failure,
requires the live `v4.2 / obs1-relay/1` manifest, and installs its WebSocket
probe dependency without modifying the checkout. This changeset retries only
the OBS1 relay and its formerly blind deploy gate; public app/worker bytes from
v20.4.1 remain unchanged.

**v20.4.1 · 2026-08-28.** R10.2-OBS1 built from the byte-verified rollback
with one additive app part plus observation hooks in the existing worker and
relay. The panel is reachable from home and room, uses enumerated test labels
only, and exports one same-snapshot JSONL + human-report package. App and
worker share bounded IndexedDB records; the relay exposes a relationship-
scoped, read-only, redacted 2,000-record/24-hour ring. Machine gates: existing
app/worker 43/43, relay 8/8, recorder 21/21; inherited mutations 42/42 and
recorder mutations 31/31; clean `npm ci` green. These scores prove the
instrumentation contract, not iOS/Android notification acceptance. Handover is
blocked until the public app, service worker, and relay manifests all report
OBS1 from the paired publish.

**v20.4.0 · 2026-08-28.** Owner GO received to update the plan and execute
after 38 failed versions. R10.2 whole-pair rollback is byte-verified and stays
the baseline. §4.8 authorizes exactly one instrumentation-only candidate,
R10.2-OBS1, governed by `NOTIFICATION-FLIGHT-RECORDER-SPEC.md`. The former
§4.7 contract is historical: its fixed one-second acknowledgement race and
cold-open assumptions may not be tuned or revived. OBS1 adds correlated,
redacted, bounded app/worker/relay tracing plus mobile JSONL and human report
export; it does not claim notification behavior is fixed and does not send the
owner through the acceptance matrix. After one conclusive failure capture:
root cause → review addendum → owner GO → clean behavioral rebuild.

**v20.3.0 · 2026-08-28.** Candidate 4f574f2 FAILED the owner §8.1 matrix
(cold-launch tap → homepage; second-call banner+ring double via the 1s
ack wake-race; delayed-then-burst; Android call without surface). Pair
rolled back whole at 0b5b230, deploy verified. Graveyard entry written.
R10.3/R10.4 return to DESIGN state: the failures F1-F4 require root-cause
from device logs (owner to export both), and F5-F6 (decline leaves no room
record; banner-vs-fullscreen inconsistency) are CONTRACT revisions for the
dev team, not bugs. The §8.9 lesson is now standing law: presentation-flow
candidates are not handed over on machine gates alone — the gates make the
device run cheap; they do not replace it. Deepgram credential-grant finding
(F7) is a separate ship-era work item, out of R10 scope. No rebuild before:
logs → root cause → review-package addendum → dev team pass → owner GO.


**v20.2.1 · 2026-08-28.** §4.7 EXECUTED on owner GO. Candidate pair at commit
`4f574f2` (app + tb-sw + relay v5, one commit, byte-verified at the SHA;
"Deploy relay" workflow success). Machine gates at that SHA: relay 23/23
(RFC 8291 byte-exact; exact-ack E1-E5; burst B1-B2; call FSM F1-F5; mute
M1-M3; ledger/cursor L1-L4 incl. survival across the 12-min reset; per-event
diag D1; envelope V1), app 44/44, adversarial mutations 48/48 planted defects
caught (two equivalent-mutants were eliminated by design change, one by test
strengthening — recorded here per §8.9's spirit), clean-checkout `npm ci`
gate green, artifacts byte-reproducible from a clean tree. §8.8 live probe:
not runnable from the build sandbox (relay host unreachable from it); its
evidence is the deploy workflow success plus the §8.1 device run. Awaiting
the owner's §8.1 twelve-case two-way matrix against this unchanged candidate.


**v20.2.0 · 2026-08-28.** Independent red-team review completed and
incorporated. The v20.1 proposal is replaced by the active contract in §4.7
and `THIRD-PARTY-REVIEW-2026-08-28.md`. Of its three principal changes:
Declarative Web Push is accepted with a stable cross-platform event envelope;
the 3.5s/45s call cadence is rejected; exact home counters are accepted but
the journal-based mechanism is replaced by a durable deduplicated ledger.
R10.2 ALWAYS-PUSH is the deployed baseline, not the next-build arbiter:
only exact visible `presented(eventId)` proof suppresses that event's push.
Mute is per room/per device, suppresses attention rather than content, and
retains exact homepage counts. Existing bubbles/transcript are explicitly
frozen. Global `tb-wake`, history guessing, notification replacement as a
correctness condition, and the two blind/mislabeled probe assertions are
forbidden. Review §8 defines repaired machine gates and one 12-case two-way
owner device matrix. Plan-only change; owner GO remains pending; no app,
worker, relay, workflow, or build file changed.

**v20.1.0 · 2026-08-28.** R10.3/R10.4 design frozen into the third-party
review package (`THIRD-PARTY-REVIEW-2026-08-28.md`, commit 5424411): outcome
matrices become the release contract, muted-room behavior specified, iOS/
Android differences enumerated with sources. §4.7 added: build is FORBIDDEN
until (1) the dev team's written feedback is pasted into §4.7.1, (2) findings
are dispositioned in §4.7.2, (3) owner writes GO. Driving events: the home-
card gap (waiting counters bump only on live-socket events; locked-phone
events never bump — ship-era hole exposed by working push delivery) and iOS
banner stacking, both device-found 2026-08-28.


**v20.0.0 · 2026-08-28.** OWNER RULING after the first device session on the
P2-P6 build: no more server-side guessing, no patching the failed build, and
nothing ships that cannot be shown working in the wild. §4.6 R10.2 written:
ALWAYS-PUSH — relay v4.2 deletes ack-gating, liveness, and freshness (A1-A3);
the device presents (P4v2) per the FCM/web.dev/Web-Push-Book pattern (S1-S3)
with the iOS show-then-close variant (S4-S5). Baseline = ship + relay v4
lineage; patch = named part sources; result = one assembled pair. The
2026-08-28 same-session F-B patch stands rejected and reverted; its content
re-enters only as declared item P4v2-c. Device-session findings F-A/F-B/F-C
(silence via 105s freshness · double via stale banner beside the ring ·
reconnect flurry) are recorded here as the driving evidence, log-proven.


**v19.5.0 · 2026-08-27.** P6 finalized with consent decorum per owner:
Accept/Decline on thread invites, both outcomes timestamped into the parent
transcript; invite is push-worthy. Ecosystem map added: matches Signal's
consent friction (1 tap), beats contact-graph apps on privacy, and the
transcript courtesy trail is a differentiator none of the field surfaces.

**v19.4.0 · 2026-08-27.** P6 corrected to the owner's actual design:
THREADS — + icon on each room card creates a derived room that auto-appears
on the partner's panel, subscribed and notified. Invite/accept ceremony
between known parties abolished.

**v19.3.0 · 2026-08-27.** Owner corrected P6 again, decisively: connected
people need no QR — the invite rides the existing room as an Accept card on
the panel (this is J8, promoted from R11 to the primary multi-room
mechanism). Scan/paste demoted to the both-installed-never-connected edge.

**v19.2.0 · 2026-08-27.** Owner killed the typed code on principle —
correctly. P6 rewritten: IN-APP QR SCAN (the same QR, scanned by the
installed app itself; camera permission already held) + paste-the-link
fallback for link-shaped invites. Zero typing, zero browser for room #2.

**v19.1.0 · 2026-08-27.** Owner stress-tested the foundation with the
room-#2-via-external-QR scenario; spec found incomplete (gate dead-end,
second-icon storage isolation). P6 room codes proposed as the completion —
invite payload stored at relay under a short code; gate gains the
"already installed" branch; app gains "Join with code." Awaiting owner
approval of P6 alongside the GO.

**v19.0.0 · 2026-08-27.** The complete, coherent R10 specification written
as one document (§4): one build from ship, relay v4 + install gate +
attempt-as-authority subscription + exactly-one-alert hygiene + ship
preserved, with the full machine-proof list and the owner acceptance
matrix. Supersedes the incremental road. Builds on owner GO.

**v18.5.0 · 2026-08-27.** Owner ruling: professional is not optional. Piece 3
replaced — reconciliation-as-primary is out; ACK-GATED PUSH is the spec
(socket delivery acked within ~1s suppresses the push entirely; no ack →
push is the sole alert). Cost accepted: ~1s added before a locked phone's
banner. Graveyard delivery-confirmation entry annotated as superseded-by-
design, not un-buried by stealth.

**v18.4.0 · 2026-08-27.** Owner ruling: ONE release, rebuilt FROM SHIP —
never sequential patches. R10 = a single post-ship built fresh from ship
bytes containing exactly four declared pieces, shipped as one gated unit
with the relay as its matched pair:
1. RELAY (v3 recipe): encrypted payload per RFC 8291 (gate = the RFC's own
   test vector), Urgency high, Topic newest-wins, TTL 60, plus the
   freshness/acceptance liveness rule so provably-connected phones are not
   pushed (narrows the double-alert window at the sender).
2. ONBOARDING: install gate. Invite in a browser shows install instructions
   ONLY — no name, no room, no usable app. First standalone open: name once,
   join invite room, Allow, subscribe (subscribe-attempt is the authority).
3. ACK-GATED PUSH (the professional pattern — push is a fallback, never a
   parallel channel): on a push-worthy event the relay delivers over the
   socket and waits ~1s for the device's ack ("presenting it"). Ack received
   → NO push is sent to that device, ever. No ack → the push goes and is that
   device's ONLY alert. One event, one arbiter, exactly one alert in every
   state. Housekeeping only: an already-shown notification is closed when
   the call is answered elsewhere or the room is read (stale removal, not a
   flash); notification tap closes itself and focuses the app; tags replace.
   NOTE: this properly supersedes the buried delivery-confirmation design —
   buried for HOW it was built (patch-forward era), revived here as a
   declared, gated, from-ship piece. Graveyard annotated.
4. DEVICE RECIPE (F1): the owner's iOS settings block, shipped as the
   instructions screen content; not code-settable.
Gates before handover: RFC vector, client harness incl. install-gate
behavior (browser context shows gate only; standalone runs onboarding),
reconciliation effect tests, mutations, live relay probe, byte-verify, pair
stated. Owner device test only after ALL green. Awaiting owner GO.

**v18.3.0 · 2026-08-27.** OWNER CORRECTION, accepted: the "wedge" is
demoted from root cause to symptom. Owner's evidence: unique PWA name on
every install; after deletion the app has no entry in Settings→Apps — no
surface for a collision. The permission ghosts (granted-without-prompt,
granted/denied contradictions) are downstream of the true structural killer:
the browser-room-first onboarding, which put users in a context where push
cannot exist, split storage between tab and app, and produced junk permission
state on the installs that followed. FINAL ROOT-CAUSE COUNT: TWO. (1) Wrong
push delivery class — empty, unmarked wakes Apple defers; proven by the
reference 4/4 on the locked screen. (2) Browser-room-first onboarding —
the fatal flaw; fix is the install gate (F4). F2/F3 notification
reconciliation remains downstream cleanup. No code until owner approves.

**v18.2.0 · 2026-08-27.** OWNER FINDINGS RECORDED + ROOT CAUSES RESEARCHED
IN THE WILD (no code written; nothing builds until owner approves each).

**F1 · Device config that made the locked iPhone notify (owner-discovered,
owner-managed):** Settings → Apps → [the PWA] → Notifications: Allow ON;
Lock Screen + Notification Center + Banners all checked; Sounds ON; Badges
ON; Show Previews Always; grouping Automatic. Owner notes banner style
should be TEMPORARY, not Persistent. Research: banner style and all of the
above are USER-side iOS settings — no web API can set, read, or default
them; industry ships an instructions screen. This block is the documented
device recipe.

**F2 · Double alert (in-app call screen + system notification together).**
Root cause per platform docs: two independent presenters with no
reconciliation — the socket draws the ring screen while the push shows a
banner, and on iOS the service worker MUST show a notification for every
push or Apple revokes the subscription after a few suppressed ones, so
"don't show when foreground" (the standard practice everywhere else) cannot
be applied raw on iOS. The reference solution in the wild is receiver-side
reconciliation: the app, upon presenting the event itself (ring screen
drawn, call answered, message read), closes the now-redundant system
notification via the registration's notification list; notification tags
make successive pushes replace instead of stack; the notification click
handler closes its notification and focuses the existing window instead of
opening a new one. MDN explicitly blesses exactly this: close() is for
removing a notification made irrelevant because the user already saw the
content in the app.

**F3 · Notification lingers after the call is answered.** Same mechanism as
F2: nothing ever closes it. The wild's pattern: on answer/read, enumerate
and close matching notifications; on tap, close before focusing. The
Persistent banner style (device setting, F1) amplifies the lingering but the
root cause is the app never closing what it has superseded.

**F4 · Onboarding is PWA-first, mandatory (owner ruling, industry-backed).**
Confirmed in the wild: iOS shares NO storage between browser tabs and the
installed app (name-carry is structurally impossible — see graveyard); push
exists ONLY for the installed app; install cannot be triggered
programmatically on iOS; installed-state cannot be detected from the browser
side; standalone CAN be self-detected from inside (navigator.standalone /
display-mode). The wild's pattern is the INSTALL GATE ("install this PWA to
continue"): the invite page in a browser shows install instructions and
nothing else — no name field, no room, no illusion of a working app. First
standalone open: ask the name once, join the invite's room, subscribe.
Documented as the R10 onboarding spec awaiting owner approval; no code.

**v18.1.0 · 2026-08-27.** Owner rejected the fresh-path deviation: /stuff/tb/
REMOVED, relay restored to ship R7. Pair = app ship / relay ship, verified.
The wedged iOS state gets cleared ON THE PHONE per owner's process, not by
serving tricks. Repo rule reaffirmed: no artifacts without permission.

**v18.0.0 · 2026-08-27.** EXECUTING (owner: stalled, act): TalkBridge moves
to a fresh serving path /stuff/tb/ — iOS scopes web-app notification state
per path, the old path's state is wedged (fresh installs inherit granted
without a prompt), the reference at a fresh path delivered 4/4 locked.
Same origin → phrasebook/API keys in localStorage carry over. Old app stays
untouched at the old path. SHIPPING AS ONE UNIT (pair law): relay v3
restored (RFC-vector-gated encrypted push, urgency high, diag) + app at
/stuff/tb/ = ship + one SILENT subscribe part (no UI whatsoever, log-only)
+ its own manifest and SW. Gates before handover. Handover = one URL.

**v17.2.0 · 2026-08-27.** Step 1 live and machine-proven (gate 5/5, mutations
5/5, live wake probe green). STEP 2 DECLARED AND EXECUTING: post-ship = ship
+ ONE part (n1-step2-subscribe): SW registration, subscribe-as-authority
(permission answers recorded, never trusted; NotAllowedError = the one real
denial → banner names the exact Settings switch), per-room registration with
the relay, load-time attempt + one visible enable button when needed. Assembler
+ client gate + mutations. Pair: app step2 / relay v3 — matched (client uses
only v3 endpoints that R7 also had: vapid, subscribe). Device test: open app
→ log shows Apple subscription + Apple's own acceptance status on first wake.

**v17.1.0 · 2026-08-27.** Step 0 satisfied by math (owner ruling): post-ship
== ship bytes and relay == ship R7, both cmp-verified; ship's Aug 15 device
pass stands. STEP 1 DECLARED AND EXECUTING — relay v3 = ship R7 body + the
wake path sends what the reference sender provably sends:
(1) encrypted payload per RFC 8291 (aes128gcm, WebCrypto), correctness gated
by the RFC's own Appendix-A test vector byte-exact — a mutation breaking the
crypto fails the gate mathematically;
(2) Urgency: high, Topic: tb-wake, TTL 60 — the reference's delivery class;
(3) machine proof against the owner's REAL Apple endpoint (the pushref
subscription): workflow subscribes it in a scratch session, triggers a wake,
and requires Apple's 201 acceptance via diag. Owner's locked phone showing
the TalkBridge push is the visible bonus, not the gate.
Pair law: ship client never subscribes, so relay v3's wake path is inert for
the app until Step 2 — pair stays matched (app ship / relay v3-compatible).

**v17.0.0 · 2026-08-27.** FULL RESET per owner. Relay byte-restored to the
ship-approved R7 and deploy-verified live; post-ship byte-reset to ship and
verified at the commit SHA; probe returned to the ship-era contract. Release
10 rewritten as the four-step rebuild road above, plain English, one
device-validated step at a time. Awaiting Step 0: owner revalidates ship.

**v16.17.0 · 2026-08-27.** Owner directive: no known issues enter device
testing — this approves the proposed RV2.4 for build, in order. DECLARED
SCOPE, exactly two changes, nothing else:
1. RV2.4 (relay, one line): connection acceptance stamps liveness, closing
   C7. Gate re-adds the accept-stamp test + deletion mutation.
2. Probe de-blinding (CI only): subscribe the live client LAST so its wake,
   if wrongly attempted, is the one the single-slot lastWake records — the
   no-wake-for-live check becomes able to fail.
Execution: build → gates → deploy → live probe green → THEN owner handover.

**v16.16.0 · 2026-08-27.** Owner ordered rollback of the unapproved RV2.4;
executed — relay is byte-restored to approved v2 (R7 + RV2.1/2.2/2.3), gate
10/10. C7 recorded as a KNOWN RISK with a proposed-item entry below; it is
NOT built and will not be unless approved.

**PROPOSED (awaiting owner decision, not built): RV2.4 — accept-stamp.**
One line: connection acceptance stamps liveness, so a connected-but-silent
client is not wake-targeted after a worker restart. Evidence: upgraded probe
demonstrated the wake live. Without it: possible one extra notification per
worker restart per silent client, self-healing within ≤30s (heartbeat).
Approve = it ships alone as its own gated commit; reject = risk stays
documented.

**v16.15.0 · 2026-08-27.** Process correction (owner-caught): the C7 fix
below shipped BEFORE this entry and without pausing for owner approval on a
relay change — recorded here after the fact, which is the wrong order.
The change itself: the reviewer refuted C7 (silent-but-connected clients get
pushed after a worker restart); the upgraded probe then CONFIRMED it live
(subscribed, connected, silent client ciB was wake-targeted). Fix: RV2.4 —
connection acceptance stamps liveness (one line). Relay gate 11/11 including
a mutation deleting the stamp; live probe green on all six checks after
redeploy. Owner offered explicit revert option; standing decision recorded
when given.

**v16.14.0 · 2026-08-27.** Third-party review adopted wholesale. SHIPPED:
(1) subscribe() is the sole permission authority — the requestPermission
answer and the permission property are both recorded but neither gates;
NotAllowedError is the one authoritative denial and raises the banner with
the documented Settings-toggle escape hatch; other errors keep their own
names (reviewer step 6). (2) call-end is wake-worthy — locked missed-call
wake now exists (reviewer gap). (3) Probe subscribes the LIVE client so
no-wake-for-live can actually fail (reviewer gap). (4) Root package.json
declares jsdom+ws so a clean checkout runs the gates (reviewer gap).
(5) Harness contradiction test now REQUIRES a subscribe attempt (reviewer's
required change). (6) §4d replaced with measurable Requirement v2 + 12-cell
acceptance matrix. Client 27/27 + 23/23; relay 10/10.

**v16.13.0 · 2026-08-26.** Owner bet $1 on ≥2 uninstrumented + ≥1 swallow;
owner wins. Closed: (I1) notificationclick — tap + focus/openWindow outcomes
now receipted (tap_focus_ok/failed, tap_open_ok/failed, tap_no_path); (I2)
pushsubscriptionchange — the browser's own announcement of subscription
rotation/death was DISCARDED unlistened; now a durable receipt
(subscription_changed) with old/new presence — the spontaneous-death witness;
(S1) the receipt DRAIN itself could no-op silently when the worker wasn't
active — now sw_drain_skipped with reason; (S2) relay _pushOne network-throw
left diag frozen at 'attempting' — now stamps fetch-error, and the
no-endpoint exit stamps too. BONUS defect found during the read: the earlier
SW edit stamped 'push_arrived' inside notificationclick — taps were logged
as arrivals; fixed and gated (single-occurrence check). Relay gate 10/10 +
2/2; client 27/27 + 21/21. Relay auto-deploys; SW reaches phones next open.

**v16.13.0 · 2026-08-27.** Session state at owner checkpoint. ANDROID
(03:31–03:36 log, receipt build running): all three rooms subscribed within
1s of boot, subscription alive, lane clean; placed NINE calls (voice+video,
most ending in seconds — consistent with unanswered rings toward the
iPhone); zero sw_receipts on Android as expected (in-app delivery rides the
socket, not push). IPHONE: log for the same window NOT YET RECEIVED — repeated
file attachments arrive empty; inline paste is the working path. The verdict
on those nine calls is exactly the iPhone's receipt trail (push_arrived /
notification_shown) against the relay's sent wakes. AWAITING: iPhone log.
Chain instrumentation as of this build: perm_answer verbatim + property,
enable_src/enable_exit on every terminal, heal steps with deadlines,
per-room subscribe results, relay diag with lastWake, SW durable receipts
drained on open. Both phones held live subscriptions simultaneously as of
Aug 26 15:17 (iPhone, Apple endpoint) / continuously (Android).

**v16.12.0 · 2026-08-26.** Owner forced a re-audit of "nothing can be
silent" — and was right. Three silent paths found and closed: (1) THE BIG
ONE — the service worker was completely dark: push arrival, banner shown,
banner failed all invisible to the debug log. tb-sw.js now writes every push
terminal to a durable on-device store (IndexedDB), and N8 drains it into the
debug log on every open: proof-of-delivery ON DEVICE. (2) the no-rooms exit
resolved silently — now logs enable_exit. (3) per-room subscribe failures —
audit confirmed already logged (push_room_subscribe_failed); no change
needed, recorded for honesty. Gates 26/26 + 20/20. SW update reaches phones
on next app open.

**v16.11.0 · 2026-08-26.** Both-logs milestone: for the first time BOTH
phones hold live subscriptions simultaneously (iPhone: Apple endpoint since
15:17:35, persisting; Android: all three rooms at boot). The iPhone's two
7ms no-op enables are explained structurally, with a self-correction on
record: the existing-subscription shortcut does NOT skip room sync (earlier
claim wrong — code read deeper); the true hole was the flow's final catch
swallowing a non-granted permission ANSWER silently while the permission
PROPERTY read granted — a contradiction iOS produced twice. Fix: every
terminal is loud — perm_answer logged verbatim with the property beside it,
existing-subscription branch names its endpoint, enable_exit logs every
swallow. Harness reproduces the exact contradiction (prop granted, answer
denied) and requires both logs. 23/23 + 18/18. Owner test unchanged: locked
iPhone, both directions; any post-subscription failure now localizes to a
side.

**v16.10.0 · 2026-08-26.** Owner pushed for research; research won. MDN: iOS
16.4+ installs PWAs from the Share menu of Safari, Chrome, Edge, Firefox
alike. The Safari detour was built to a pre-16.4 assumption — DELETED, not
improved: J2 bar gone (name-gated in the harness), install nudge serves
every iOS browser, manifest start_url REMOVED so the home-screen icon opens
the invite URL itself — room and typed name ride the live hash
(history.replaceState on typing), which retires the cookie handoff as the
transfer mechanism. Fresh-user path is now identical for any default
browser: scan → name → OK → Share → Add to Home Screen → Add → open icon →
Allow. Everything after OK is Apple's floor. Honest unknown for the device:
push parity for a Chrome-side install (installed app is WebKit regardless —
expected identical, claimed only after the phone says so). 21/21 + 16/16.

**v16.9.0 · 2026-08-26.** BOTH device logs read; the iPhone notification hell
is root-caused FROM THE OWNER'S CAPTURE and fixed at source: the enable
flow's first line declared 'unsupported' when window.PushManager was absent —
but iOS exposes push on the service worker REGISTRATION (the heal's own
get-subscription succeeded every time), so the flow resolved 'ok' in 8ms
doing nothing, six boots straight; the SAME wrong question gated the banner,
which is why it never appeared. Capability is now judged on the reg, each
branch logs itself (enable_branch), and the harness reproduces the exact iOS
condition (window.PushManager deleted) end-to-end into a completed subscribe.
NAME CARRY fixed: typing the name live-boards it into the Safari link, the
copy text, and the handoff cookie (n7NameSync) — Chrome→Safari→PWA in any
order, onboard once. Android log confirms: both rooms subscribed, heal
correctly idle. 20/20 + 17/17, assembled from parts. Noted for R11: one rtc
glare error (setRemoteDescription in stable state) with recovery engaging.

**v16.8.0 · 2026-08-26.** Owner test case redefined the gate: a FRESH iPhone
user via QR into the DEFAULT browser (often Chrome). Three journey pieces are
load-bearing for the ring and pulled into R10 as N7: J2 Chrome-on-iOS bar
with ONE-TAP "Open in Safari" (x-safari-https scheme; copy fallback), J3
Add-to-Home-Screen nudge with ringing as the pitch, J5 typed-name-rides-the-
handoff (blank-room path dead). With the load-time ask already in, the fresh
path is: scan → chat in Chrome → one tap to Safari → Add to Home Screen →
open icon (app asks permission itself). Apple's floor remains. 19/19 + 15/15,
assembled from parts.

**v16.7.0 · 2026-08-26.** Owner corrected v16.6.0's Safari-default
assumption. J7 (paste-invite in app) and J8 (in-band cross-room invites)
recorded as the default-browser-proof mechanisms for R11.

**v16.6.0 · 2026-08-26.** Owner design concern recorded — multi-room invites
vs the single installed app. Ruling of the architecture as built: ONE
installed TalkBridge handles EVERY room forever; an invite's only job is to
hand the room over. The cookie handoff is room-agnostic: any invite opened in
Safari arms it, and the person's EXISTING home-screen app consumes it on next
open — new room appears, same identity, no second install, no second icon,
ever. CORRECTED same day by the owner: that note assumed Safari is the default
browser. When it is not (owner's own case), a new-room link opens in Chrome,
which shares nothing with Safari or the PWA — the handoff never arms and
there is NO path to hand a second room to the installed app. Ruled fixes,
both PWA-side and default-browser-proof, recorded for R11:
J6 — guidance line in the Safari tab (kept, but only a slice of the answer).
J7 — "Join with invite link" INSIDE the installed app: paste a link or short
room code, the app parses and joins directly. Any browser politics, zero
Safari after first install.
J8 — in-band invites: a new-room invite to someone you already share a room
with travels through that room; their app shows "X invited you to Y — Join?"
One tap, no browser at all. Covers the dominant multi-room case. 

**v16.5.0 · 2026-08-26.** Owner ruling folded in: the app asks for
notification permission ON LOAD — no tap where the platform allows a
promptless ask, the outcome logged (auto_prompt) so the iOS claim is tested
on device rather than argued; the footer enable row is retired (hidden), the
top-of-panel surface is the single tap where a platform insists on one.
Same build carries the step-instrumented heal: sw-ready → get-subscription →
enable-flow → vapid-answer → subscribe-call each log name+outcome with
deadlines, so the iPhone's silent subscription death names its line in the
next 30-second capture. Device-log findings recorded: Android subscription
COMPLETE (vapid fix proven); message transit measured 67–120ms (fast); the
felt lag is Deepgram multi-language finalization (~5s vs ~2s single-lang) —
scheduling decision owner's. Gates 16/16 + 12/12; assembled from part
sources.

**v16.4.0 · 2026-08-26.** The owner's suspicion of a client↔relay mismatch
was CORRECT, and the Android log named it: push_selfheal →
push_enable_failed "vapid". The relay answers the key request with field
'vapid'; the validated part read field 'key' — every subscription attempt on
every phone failed at that exact step, which is why both lanes showed
granted-but-no-subscription and nothing could reach a locked phone. Fixed at
the part source (accepts both names), rebuilt through the assembler,
effect-tested against the relay's REAL response shape (V1), mutation for the
exact mismatch caught. 14/14 + 10/10. Both device logs otherwise clean:
lanes correct, permissions granted on both, N6 prompt worked, in-app rings
worked, self-heal fired exactly as designed.

**v16.3.0 · 2026-08-24.** Owner caught a process violation: label fix and N6
were in-place edits to the built artifact. Answer to the question asked:
application only, relay untouched since v2 — and yes, it was patching in
method. Fixed structurally: part sources persisted (talkbridge/parts/),
mechanical assembler added (build/assemble-r10.mjs), clean assembly proven
equivalent (one newline in 404k chars) and adopted as canonical. Regated:
13/13 + 9/9. The artifact is output only, forever.

**v16.2.0 · 2026-08-24.** Two fixes from owner device evidence, both gated:
(1) stale turn25 labels in the reused validated part corrected to
turn24-post-ship; permanent NAME GATE added — any stale turn/stage label
fails the build. Base proven intact (ship segments verified verbatim around
the two declared insertion points). (2) N6 gesture-first permission: iOS
never showed the notification prompt because the ask sat behind two awaits;
it now fires synchronously inside the tap. Harness 13/13 (incl. same-tick
ask), mutations 9/9. Byte-verified. Owner retest: force-refresh, tap enable,
the iOS permission prompt must now actually appear.

**v16.1.0 · 2026-08-24.** R10 built and machine-tested per §4c, all green:
RELAY v2 live — gate 9/9, mutations 7/7 (incl. constructor-init defect that
500'd the first deploy, caught and gated), and the wake path PROVEN
end-to-end on the live relay by the deploy pipeline: disconnected subscribed
phone wake-targeted, webpush POST actually fired (push service answered
status-404 to the fake endpoint), fresh connected phone NOT pushed. CLIENT —
ship + exactly N1..N5, harness 11/11 (boot clean, banner placement+removal,
self-heal on corpse and never ungated, listener heartbeat, lane routing,
phase-a core live), mutations 8/8, byte-verified at commit f035df64.
Remaining: owner device matrix §4d only.

**v16.0.0 · 2026-08-24.** MAJOR, owner-directed reset of R10: notifications
perfect, nothing else; all other post-ship work → R11. Relay reverted to pure
R7 (byte-verified, deployed, probes green). Relay v2 = three declared changes
on the R7 body. Client = ship + five declared notification parts (N1–N5).
Claude tests everything per §4c before handover (rule 0b). Awaiting owner
approval of this plan before any build.

**v15.11.0 · 2026-08-24.** Owner correctly identified that R9 target-edit
behaviour was never fully built. §3b rewritten as R9.1 (four incomplete
items) — required before R10. The "was" clarify entry shipped in R9; source
reverse-translation, "source updated" entry, verdict clear, and Verified-tag
removal were specified but not built.

**v15.10.0 · 2026-08-24.** Owner correction: IndexedDB is not a future item —
moved into the release sequence as R12b between R12 (multi-party) and R13
(Phase B). PB-1 closed: BT direction is confirmed correct (target→source);
the English result on a simple Spanish phrase is ML inconsistency, not a
code defect. PB-2 spec stands; no code until scheduled.

**v15.9.0 · 2026-08-24.** Owner items recorded in plan: IndexedDB migration added
as F2 (future, unscheduled); PB-1 (BT direction design clarification needed —
awaiting owner ruling before any code) and PB-2 (full target-edit behaviour
spec for new and existing cards) added as §3b pending items.

**v15.8.0 · 2026-08-24.** Standing rule 0b added (owner ruling): testing is
expensive; Claude byte-verifies, gates, and probes before any handover; the
owner tests only what devices must prove. R10 rebuild scope to be declared
and approved before any code is written.

**v15.7.0 · 2026-08-24.** R10 post-ship abandoned as a single failure (seven
unbounded patches, mismatched relay, owner could not send a message).
bridge-turn24-post-ship.html reset to bridge-turn24-ship.html bytes. Relay
on R7. Clean baseline established. R10 rebuild gated on a declared item list
approved by the owner BEFORE any code is written.

**v15.6.0 · 2026-08-24.** Relay rolled back to R7 (device-verified) then
re-fixed correctly by READING the code first. The surgical fix is 4 points on
top of R7's unchanged body: lastSeen stamp on every inbound WS message;
freshness guard in _wakeOthers (socket + heard-from within 105s); Urgency:
high; Topic merge header. Client unchanged. Gate: 8/8 + 4/4 mutations;
graveyard entry: read the code before changing it.

**v15.5.0 · 2026-08-23.** Pre-flight + industry research (owner-directed).
PRE-FLIGHT: the deployed relay class was integration-tested in-process with
real timers — live delivery carries the id; no-socket pushes immediately;
confirmation cancels the push; silence fires it at +4.0s; the sender is never
pushed. 5/5. (Live-wire test impossible from the sandbox; noted.)
RESEARCH: iOS throttling of service-worker push handling is a documented,
ecosystem-wide cause of multi-minute delays; Apple's answer is DECLARATIVE
WEB PUSH (iOS 18.4+): JSON notification displayed by the OS with no service
worker execution, more reliable by design, battery-friendly, silent-push
penalty lifted, backward compatible (falls back to the SW path). Also
documented: Web Push payloads are ENCRYPTED end-to-end (RFC 8291) — the
payload-free privacy rationale bought less than assumed while costing
reliability. Also: iOS subscriptions die silently after inactivity across
the ecosystem — pros re-verify subscription health on every open.
RECOMMENDED (owner go required): adopt declarative payloads with minimal
generic content + navigate, and re-verify subscription on every open.

**v15.4.1 · 2026-08-23.** Pre-device verification: the EXACT deployed relay
class was driven with two simulated phones — instant delivery with ids,
confirmation cancels the push, zombie silence fires exactly one push,
socketless pushes immediately, transients never push: 7/7. Industry research
(Apple docs, WebKit, Progressier, OneSignal, Apple dev forums): our SW
already follows the canonical iOS pattern (waitUntil-wrapped, notification
shown before any network, visible case shows-then-closes, tag-merged) — the
silent-push 3-strike revocation is the documented killer and we're immune by
construction. OUT OF OUR CONTROL, documented across current Apple forum
threads: iOS can hold pushes to a locked, deep-idle (10+ min) phone until
wake — open Apple bug reports on iOS 18.7/26; Focus/DND and Low Power Mode
also silently delay/drop. Pros' answer: high urgency (we send it), long TTL
(we send it), and in-app catch-up on open (our history sync). Device test
pre-checklist: Focus/DND OFF, Low Power OFF, TalkBridge notifications allowed
with Lock Screen + Banners.

**v15.4.1 · 2026-08-23.** PRE-FLIGHT: the real worker code ran locally with
real sockets and a stand-in push service — 8/8: confirm cancels the push,
silence fires it at ~4s, a disconnected phone is pushed <1.5s, topic+urgency
on the wire, confirmed call screen produced zero notifications. INDUSTRY
RESEARCH on the Apple side, recorded: (1) iOS kills subscriptions that
receive pushes without showing a notification — our SW already shows
instantly, requirement met; (2) a DOCUMENTED Apple bug on iOS 18.7/26 holds
pushes while a locked phone is idle 10+ minutes and dumps them on unlock —
multiple FB reports, hits WhatsApp/Telegram natives too; matches the owner's
lag+flurry exactly and is outside anyone's code; (3) Focus/Do-Not-Disturb is
the most common real-world silent-push cause; (4) iOS delivers to
Notification Center, sometimes not the lock screen banner. Test protocol:
check Focus OFF and note iOS version before burning a cycle; unlock-triggered
floods = Apple's idle bug, not ours.

**v15.5.0 · 2026-08-23.** Researched how the industry actually survives iOS
web push (Apple dev forums, documented field reports), then verified or
implemented each finding: (1) silent-looking pushes get subscriptions
revoked — our SW already shows instantly inside waitUntil ✓; (2) dead
endpoints must be pruned — relay already drops on 404/410 ✓; (3) iOS kills
subscriptions SPONTANEOUSLY — new: phSelfHeal re-validates on every open and
silently resubscribes when permission is granted but the subscription is
gone (no tap needed once granted; never runs ungated); (4) Focus/DND
swallows banners with zero errors — recorded as a test-protocol check, not a
code problem. Client gate 37/37 (incl. an async-test vacuousness the
mutation gate itself caught and forced fixed); self-heal mutations 2/2.
Sandbox cannot reach the relay wire (egress), so preflight.html ships: one
desktop click runs two simulated phones against the LIVE relay and proves
the confirm-or-push contract before any phone cycle is spent.

**v15.4.0 · 2026-08-23.** PERMANENT DELIVERY DESIGN, owner-directed: the
relay never guesses presence. Every push-worthy message carries a delivery
id; connected clients confirm on whichever path delivered it (active room or
background listener — listeners also heartbeat now); no confirmation within
4s fires the push; no socket at all pushes immediately. Screen-and-
notification can never coexist: the confirmed screen IS the confirmation.
The 75s heuristic is removed — presence guessing buried as a class
(graveyard). Old clients degrade safely (push after grace). Relay gate 8/8 +
4/4 mutations; client gate 35/35 + 3/3. Relay auto-deploys on push. Remaining
owner tests: full matrix BOTH directions, iPhone log with lane line for the
lag question.

**v15.3.0 · 2026-08-22.** Owner ruling: the Android mic failure is accepted
as the accidental android-pwa lane's permission state; the chase ends. ONE
PATH rebuild shipped: everything from the journey rebuild plus lane telemetry
— every boot and every return logs one line (lane + microphone permission +
notification permission), with the accidental lanes (android-pwa) named
explicitly, so no future log leaves the lane in question. 31/31 harness,
27/27 mutations incl. lane misrouting and silent-telemetry defects.

**v15.3.0 · 2026-08-22.** Owner ruling: one path forward, stop chasing the
mic evidence, rebuild. 24·post-ship rebuilt = Phase A + F1–F4 + journey
J1–J5 + LANE TELEMETRY: every boot logs one line naming its lane (including
the accidental android-pwa lane that ate the mic) plus live mic and
notification permission state — no capture ever again leaves us guessing
which experience the person was having. Upgrade surfaces only ever offer
from a healthy lane. Harness 31/31; fresh mutations incl. unnamed-lane and
silent-mic-state caught.

**v15.2.0 · 2026-08-22.** Device gate FAILED: Android microphone dead on the
journey rebuild. Rolled back to 24·ship. Cause NOT established — no appended
code touches audio; this was also Android's first run of ANY Phase A build,
so the defect may be candidate-lineage, not journey parts. Failed build
preserved at fixtures/buried-2026-08-22-postship-journey.html. Next step is
evidence, not a rebuild: one Android debug log from that URL during a mic
attempt.

**v15.1.0 · 2026-08-22.** The §4c rebuild is DONE in one build: Phase A parts
as validated + F1–F4 + the journey. J2 routes by real user agent (Chrome-on-
iOS gets the hand-to-Safari bar with copy-link; chatting in that tab keeps
working). J3 install nudge, dismissible, iOS Safari only, ringing as the
pitch. J4 the enable surface also lives in the room view on the installed
app. J5 the typed name rides the handoff cookie (jn) and is adopted exactly
once by the PWA — never overwriting an existing identity; the blank-room
path is dead. Harness 29/29 with journey tests through the real functions;
25/25 mutations incl. name-loss, identity-overwrite, and misrouting defects.
Gate is the owner device matrix in §4c.

**v15.0.0 · 2026-08-22.** MAJOR: R10 rescoped around the customer journey
after both device logs and the owner's field experience. Findings 4a,
agreed journey 4b (Android rings from the tab; iPhone Safari = chat first,
install nudge, immediate Allow on first PWA open; iPhone non-Safari = one
clear hand-to-Safari action; joining never gated; identity always survives).
Post-ship rolled back to 24·ship; one tight rebuild per 4c re-implements the
proven fixes alongside J1–J5. Relay and SW fixes already live and stand.

**v14.18.0 · 2026-08-22.** Both device logs read. iPhone: candidate runs,
standalone, SW registered — and notification permission was NEVER granted;
zero subscription events. Every silent case on that phone (locked, unfocused,
in-app other-room via osNotify) shares that one cause. Android: log contains
NO candidate events at all — that phone is on a pre-Phase-A build; nothing
can notify it until it loads the candidate. 24·post-ship v5 ships the fix
that matters: an unmissable enable banner at the top of the home panel
whenever rooms exist, push is supported, and permission isn't granted; tap
runs the existing enable flow (the tap is iOS's required gesture);
capability-gated so an Android tab gets it too; self-removes once on.
Harness 25/25 (placement asserted), mutations 20/20.

**v14.17.0 · 2026-08-22.** 24·post-ship v4 (supersedes v3's PA3, graveyard):
create window wears the card flag band; the name prompt is its own labelled
field between the language selects and auto-read, prefilled and overridable,
placement now ASSERTED not assumed; invite carries the room's name; first-run
name cards (S0 and joiner S10) recenter in the keyboard-shrunk visual
viewport and return to rest on blur. Harness 23/23, mutations 18/18 incl. the
exact shipped anchor defect. Relay + SW fixes from the parallel session stand;
locked-phone and re-enable tests remain owner's to run.

**v14.16.0 · 2026-08-22.** Relay wake fix built on owner go, exactly the
proposed mechanism: a client counts as listening only with a live socket AND
a ping in the last 75s (zombie iOS sockets stop pinging within a minute), and
wakes now carry Urgency:high so the push service delivers immediately instead
of battery-batching — the observed sporadic pile-ups. Client untouched; wakes
stay payload-free; missing timestamps fail toward waking. Gate:
build/harness-relay.mjs 8/8, mutations 3/3. DEPLOY IS OWNER'S: paste
talkbridge/worker-talk.js into the Cloudflare dashboard (same as R7) — repo
source = deployed source.

**v14.15.0 · 2026-08-22.** 24·post-ship v3 = v1 + exactly the four owner
items, built to their words: (B-8c) room creation shows a name field prefilled
with the standing name, overridable; the invite/QR is post-processed to carry
the ROOM's name, so menu renames now reach new invites too. (11.9) the
first-run name card sits in the upper screen instead of centered. (11.8)
measured, not guessed: .talking-to was 12px and never raised — now 15px; date
and "is now" pills 15px; field labels 13px. (4) the relay wake lag is NOT in
this build — owner-gated proposal pending. Harness 21/21, mutations 15/15.

**v14.14.0 · 2026-08-21.** v2 FAILED the device gate with major regressions
and carried unrequested scope — rolled back to the v1 candidate (graveyard).
A8 wake problem re-opened: diagnosis (relay wakes only socket-absent clients;
iOS zombie sockets) stands; any solution is a PROPOSAL to the owner first,
built only on explicit go. Rule reaffirmed: nothing unrequested ships.

**v14.13.0 · 2026-08-21.** A8 first evidence round. HANDOFF PASSED — owner
installed via cookie bridge and ran rooms, speech, calls. PUSH FAILED with
cause read from relay source: wakes go only to clients absent from the live
socket set, and iOS keeps a backgrounded PWA's socket half-alive, so the
locked phone was still counted as listening — nothing sent, then a pile-up
once iOS reaped the socket. Fix shipped in 24·post-ship v2, client-only, relay
untouched: on leaving the foreground with no live call, presence is released
via the base's own relayDisconnect (base's existing return handler already
reconnects); logs pwa_bg_release / pwa_fg_return. Harness-r10 19/19,
mutations 13/13. New R11 items 11.8 (small type — instrument first) and 11.9
(name-field position) from owner observation.

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


## Log-bank (diagnosed, banked, not blocking)

- L-1 (2026-09-04) iPhone wake logs relay_err + close 1006 after background: iOS froze the page, socket was already dead; CR3 recovers in ~300ms, history replays, receipts flow. Cosmetic; optionally reorder announce-after-verified-socket.
- L-2 (2026-09-04) Presence flicker = iOS background socket lifecycle, not a P1 defect. Cure: damping grace (see backlog).
- L-3 (2026-09-04) Render churn: rc_panel/rc_home/joiner_create_control fire 3–6× per event burst. Coalesce in refactor pass.
- L-4 (2026-09-04) Cross-device log ordering skew: clock offset + 30s batch drains. Cosmetic.

---

# §7 BUILDER SPECS — THE NEXT THREE RELEASES (spec-first rule in force)

Written 2026-09-05. Each spec is complete: a builder executes it top to bottom
with no guesswork, no blanks, no assumptions. Common law for all three:
every part WRAPS a named frozen function and calls through — nothing frozen is
edited or replaced; each candidate is a NEW file built as {base bytes} + one
appended script block inserted immediately before the final `</script>`; the
frozen body must remain byte-identical (machine gate 1 in every release);
line-1 header comment states name, base sha, parts, and relay pair; byte-verify
every pushed file via GitHub API at the exact commit SHA, never CDN; on device
gate failure: candidate dies, graveyard entry, plan bump, rebuild from the same
base — never patch the failed candidate.

────────────────────────────────────────────────────────────────────────
## §7.1 RELEASE A — 26·ship, second candidate: "Arrival & identity"
────────────────────────────────────────────────────────────────────────

FILE: `bridge-turn26-ship2.html` = bytes of `bridge-turn26-pre-ship.html`
(sha256 e6d3d8c7a57d…) + one appended block. RELAY: v6.3, UNTOUCHED — state
this in the commit message (Iron Rule). `tb-sw.js`, both manifests: untouched.

### Part W1 — Joiner welcome: "«name» is inviting you to «room»"
1. The basic invite builder is `invUrl(room)` (frozen, line ~782; already
   wrapped once by B-8c `stamp()`). Payload today: `{r,ml,tl,n,k,tid,tok}`
   (+ B-8c rewrites `n`). ADD a second wrapper over the CURRENT `invUrl`
   (which is B-8c's wrapper — wrap what exists, order matters): after calling
   through, decode with `decInv`, set `p.t = (room && room.title) || ''`,
   re-encode with `encInv`. Same for `_lcInvUrl` and `linkDeviceUrl`
   (link-device payload already carries `t` — setting it again is harmless
   and keeps one code path).
2. `joinRoom(p)` (frozen, line ~2112) creates the joiner's room with
   `title:p.n` and calls `enterRoom(room.id)`. WRAP `joinRoom`: before
   calling through, stash `p` in a closure var. After calling through, if a
   room for `p.r` now exists and this was its FIRST join (the wrapper saw
   `roomById(p.r)` null before the call): (a) if `p.t` is a non-empty string,
   set `room.title = p.t; saveRooms();` (b) call
   `addSysPill((p.n||'Someone') + ' is inviting you to ' + (p.t || 'their chat'))`
   — `addSysPill(text,id)` is frozen at line ~1117 and renders the same pill
   as "Voice call ended". Log `w1_welcome {n,t}`.
3. Pill is LOCAL only — never sent on the relay (addSysPill alone does not
   send; do not call the sys-pill relay path).

### Part R2 — B-8b: rename reaches a partner's OPEN drawer
1. Partner-name updates land in four frozen spots (lines ~1007, ~1016,
   ~1048, ~1096); each already calls `renderRoomHead()`. The drawer populate
   function is `renderDrawerValues()` (frozen, line ~1610); the drawer is
   open iff `document.getElementById('drawer-s4b').classList.contains('open')`.
2. WRAP `renderRoomHead`: call through; then if the drawer is open, call
   `renderDrawerValues()` and log `b8b_drawer_refreshed {}`. That single hook
   covers all four update paths with zero new message types.
3. Guard: `renderDrawerValues` calls `activeRoom()` and returns if null — no
   extra guard needed; still wrap the refresh in try/catch.

### Part J3 — #653: join by pasted link
1. `renderHome()` (frozen, line ~4536) draws the home cards; the joiner
   create control logs `joiner_create_control`. WRAP `renderHome`: after
   calling through, if `document.getElementById('j3-row')` is absent, append
   to the SAME parent container that holds the create control a row:
   `<div id="j3-row"><input id="j3-url" class="field-select" placeholder="Paste an invite link"><button id="j3-go" class="btn">Join</button></div>`
   styled with existing classes only — no new CSS.
2. `#j3-go` click handler: read `#j3-url`, extract the part after `#j=`
   (accept a full URL or a bare token), run `decInv`; invalid → set the
   input's placeholder to "That link didn't work" and clear it, log
   `j3_bad_link {}`; valid → call `joinRoom(p)` (frozen — it handles both
   the new-room and the room-already-exists/rejoin case) and log
   `j3_join {r:p.r}`.
3. Keys note: `joinRoom` already stores joiner keys in memory only — J3 adds
   no storage.

### Machine gates (all must PASS before push)
M1 frozen pre-ship body byte-identical inside candidate. M2 appended block
passes `node --check` (extract block to temp file). M3 exactly three new log
markers present (`w1_welcome`, `b8b_drawer_refreshed`, `j3_join`).
M4 candidate never calls `lsSet` with any NEW key (grep the block: only
`saveRooms()` allowed). M5 no `"start_url"`, no `location.replace`, no
`unregister` in the block.
MUTATIONS (plant, expect gate FAIL, then remove): (a) delete the
`room.title = p.t` line → gate asserting `p.t` adoption text must fail;
(b) make J3 call a fabricated join function name → M2 fails at runtime-check
gate (grep the block for `joinRoom(` exactly); (c) add `lsSet('tba_x'` → M4
fails.

### Device gate (owner, both phones) — URL in the handoff, always
G1 Android creates a room titled "Gate A", changes the create-sheet name,
sends invite; iPhone opens it fresh: the FIRST thing seen after joining is
the pill "«name» is inviting you to Gate A". G2 With iPhone's room drawer
OPEN, Android renames self in its drawer → iPhone's open drawer shows the new
name within 2 s, no reopen. G3 iPhone deletes the room, then pastes the same
invite URL into the home "Paste an invite link" row → lands back in the room
with history replayed. PASS = all three; any miss = candidate dies (G-entry).

────────────────────────────────────────────────────────────────────────
## §7.2 RELEASE B — 26·post-ship: "Notifications & steadiness"
────────────────────────────────────────────────────────────────────────

FILE: `bridge-turn26-post-ship.html` = bytes of ACCEPTED §7.1 candidate + one
appended block. NEW WORKER FILE: `tb-sw2.js` (tb-sw.js is accepted and
immutable). RELAY: v6.3 untouched. Accepted manifest untouched;
`tb-manifest-turn26.webmanifest` untouched.

### Part K1 — #652: the alert wears the app's face (new worker file)
1. Create `tb-sw2.js` = byte copy of `tb-sw.js` with exactly ONE addition:
   inside the push handler where `opts` is assembled before
   `showNotification(d.title, opts)` (line ~82), add
   `opts.icon = self.registration.scope.replace(/bridge-$/, '') + 'icon-192.png';`
   `opts.badge = opts.icon;` — the icons exist (manifest lists icon-192.png
   at repo root). The call branch (`isCall`) additionally sets
   `opts.renotify = true; opts.tag = 'tb-call';` alongside the existing
   `requireInteraction` + `vibrate`. Nothing else changes; run a full diff —
   it must show ONLY those lines.
2. App block: WRAP `navigator.serviceWorker.register` (this wrapper stacks on
   U1's — wrap what exists): if the URL string contains `tb-sw.js`, rewrite
   it to `tb-sw2.js` before calling through (U1 then adds the narrow scope).
   Log `k1_sw2_register {}`.
3. Retirement: extend the U1 pattern — after `p3State.sub` exists on the
   tb-sw2 registration (poll exactly as U1 does, 8 s + 30 s), enumerate
   registrations; for each with scope `location.origin + '/stuff/'` OR
   `location.origin + '/stuff/bridge-'` whose active script ends
   `/tb-sw.js` (the OLD file only — never tb-sw2.js): release its push
   subscription, then unregister; log `k1_old_sw_retired {scope}`. Exact
   string matches only; PRISM can never match.
4. D-1 attempt lives entirely in K1's option set above (strongest legal web
   alert). The remaining half is a DEVICE SETTING: gate step G2 below flips
   Chrome › Notifications › site › Alert/pop-up. No further code — if G2
   still shows no heads-up after the flip, record the observation in the
   log-bank and move on (owner ruling 2026-09-05: no speculative workarounds).

### Part P2 — presence damping (root cause in log-bank L-2)
1. P1's `apply(d)` is in the frozen 26·base block. WRAP the CURRENT
   `handleRelay` (P1's wrapper — stack on it): intercept `type:'peer'`
   BEFORE P1 sees it. New rule: `others>0` → cancel any pending dark-timer,
   pass through to P1 (lights + refreshes clock); `others===0` → do NOT pass
   through; start a 60 s timer (store handle on a closure var); when it
   fires, synthesize `{type:'peer',others:0}` through to P1 (goes dark) and
   log `p2_dark_after_grace {}`. A fresh `others>0` within the window logs
   `p2_flap_absorbed {}`.
2. No relay change, no P1 change — P1 still owns the dot; P2 only meters
   what it hears.

### Part C3 — render coalescing (log-bank L-3)
1. WRAP `renderPanel` and `renderHome` each with the same rAF latch: if a
   flush is already scheduled, mark dirty and return; else schedule
   `requestAnimationFrame` → call through once. Log nothing per call; log
   `c3_coalesced {n}` once per flush with the number of calls absorbed
   (only when n>1). Behavior-identical output, fewer runs.

### Machine gates
M1 frozen body identical; M2 block `node --check`; M3 `tb-sw2.js` diff vs
`tb-sw.js` contains ONLY the icon/badge/renotify/tag lines; M4 retirement
matches OLD script name only (grep `tb-sw\.js$` guard present AND
`tb-sw2` excluded from retirement); M5 P2 contains exactly one setTimeout(…
60000) and P1's text untouched.
MUTATIONS: (a) widen retirement to any script → M4 fails; (b) remove the
grace timer cancel on others>0 → gate grepping the cancel call fails;
(c) let tb-sw2 diff carry any extra line → M3 fails.

### Device gate
G1 Android, app closed: partner sends a message → notification shows the
TalkBridge icon (not the bell). G2 Owner flips Chrome's site notification to
Alert/pop-up (one-time), partner CALLS → phone locked: strongest observed
presentation recorded in log-bank (pass = icon + vibration + tap opens call;
heads-up/lock-screen presence is recorded, not required). G3 Presence: lock
the iPhone mid-chat → Android dot survives the ~10 s socket churn (no
flicker), goes dark ~60 s after true departure. G4 One push per message —
no duplicates after the worker swap (old subscription retired). PASS = all.

────────────────────────────────────────────────────────────────────────
## §7.3 RELEASE C — 27·pre-base + 27·base: "IndexedDB storage migration"
────────────────────────────────────────────────────────────────────────

STEP 0 — 27·pre-base: `bridge-turn27-pre-base.html` = byte copy of the
accepted 26·post-ship; frozen snapshot row in §0; no other change.

FILE: `bridge-turn27-base.html` = 27·pre-base bytes + one appended block.
RELAY v6.3 untouched. Workers/manifests untouched.

### The complete storage inventory being migrated (nothing else exists)
Via `lsGet/lsSet` (line ~620): `tba_user` (object), `tba_rooms` (array),
`tba_tr_<roomId>` (array per room, written by `saveTr`, read by `loadTr`),
`pbCacheKey(pk)` per-PAT phrasebook cache (written by `PB.save`, line ~1168),
`tb_cr3_pilled`. Raw `localStorage.*Item`: `tb_cf_tid`, `tb_cf_tok`,
`tb_dev`, `tb_dg_key`, `tb_gh_pat`, `tba_notif_asked`. Joiner keys are
memory-only by design — they MUST NOT be persisted by this migration.

### Part DB1 — the database
`indexedDB.open('talkbridge', 1)`; on upgradeneeded create ONE object store
`kv` with keyPath `k`. Records are `{k, v, at}` where `k` is EXACTLY the
localStorage key string and `v` the same JSON value — a 1:1 mirror, no
schema invention. Open once at boot inside the block; keep the handle in a
closure; every IDB op wrapped in try/catch; any failure logs
`db1_idb_fail {op,e}` and the app continues on localStorage alone
(localStorage remains the synchronous read path all through this release).

### Part DB2 — dual-write
WRAP `lsSet(k,v)`: call through FIRST (localStorage stays the source of
truth), then queue an async IDB put of `{k,v,at:Date.now()}`. WRAP
`localStorage.setItem` calls' six raw keys the same way via a tiny shim
`rawSet(k,v)`? NO — do not touch frozen call sites. Instead, on boot and
then every 30 s, sweep the six raw keys plus `tba_user`/`tba_rooms` and put
any changed values (compare by string) into IDB; per-room transcripts are
caught by the `lsSet` wrap (saveTr uses lsSet). Log `db2_swept {n}` when
n>0.
On boot, after the DB opens: for every record in IDB missing from
localStorage (a device where localStorage was evicted), write it BACK to
localStorage and log `db2_restored {k}` — this is the entire point of the
release: IDB survives eviction that wipes localStorage.

### Part DB3 — verification surface
Add to the existing debug log view a single computed line (rendered where
the debug modal renders, wrapped, additive): `idb: <n> keys · <bytes> ·
last sweep <s>s ago` and log `db3_parity {ls:<n>,idb:<n>}` on each sweep.
Parity mismatch is INFORMATION, not a failure — localStorage governs.

### Explicit non-scope (turn 28 material, do not build)
No read-path cutover to IDB, no localStorage retirement, no schema beyond
the kv mirror, no transcript chunking, no quota management beyond try/catch.

### Machine gates
M1 frozen body identical; M2 block `node --check`; M3 the block contains
`lsSet` wrapper calling the original FIRST (order asserted by regex: original
apply precedes any `put(`); M4 the block never writes joiner keys (grep: no
`joinerKeys` reference); M5 store name/keyPath literals exactly
`'talkbridge'`, `'kv'`, `'k'`.
MUTATIONS: (a) reorder IDB put before the original lsSet → M3 fails;
(b) persist `S.joinerKeys` → M4 fails; (c) rename the store → M5 fails.

### Device gate
G1 Both phones run a normal chat; debug view shows `idb: N keys` with N ≥
(2 + open rooms). G2 Android: DevTools/site-settings → clear SITE DATA is
too blunt for this gate (it clears IDB too); instead the gate is: kill and
relaunch the app 3× — `db2_restored` MUST NOT appear (localStorage intact,
mirror quiet), parity line steady. G3 Send 20 messages, confirm
`db3_parity` ls==idb for the room's transcript key. PASS = all three;
survival-after-eviction is proven in turn 28's cutover gate, not here.

---


## Backlog — video experience (owner ruling 2026-09-05: needs improvement, no diagnosis on file)
- BL-V1 PiP / swap experience (see G45 symptoms)
- BL-V2 default/change to forward-facing camera
- BL-V3 device home button keeps the call running

## Principle added 2026-09-05 — SPEC-FIRST
No build starts without a §7-grade builder spec in this plan: exact files, exact frozen hooks by name and line, payload keys, log markers, machine gates with named mutations, and a numbered device gate with pass criteria. Off-the-cuff assembly is forbidden.


## Principle added 2026-09-05 — BUILD IDENTITY
Every candidate logs one boot line naming its build; a device gate without a build line in the log proves nothing.
