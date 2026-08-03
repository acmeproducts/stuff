# TalkBridge — Consolidated Source of Truth (SOT) v1

**Purpose.** One document. It replaces the scattering of authority across the CC spec (`spec.md`), the v7 plan (`TALKBRIDGE-MASTER-PLAN-v7.html`), the graveyard, the lineage history, and the two live code sources. Where those five disagreed, this resolves it. If something is not in here, it is not in scope. If something here is missing from a build, that build is rejected. A builder handed only this document must not be able to produce the two failures that have recurred: cartoon/emoji icons, or a wrong-shaped room card.

**How to read this.** Part 0 is the foundation and the non-negotiable rules. Parts 1–13 are the product, surface by surface, each requirement carrying its own acceptance test inline. Part 14 is Look & Feel, hard-coded. Part 15 is the layer-cake plan: what is already true (foundation) and what each layer adds. Part 16 is the master open-item ledger, every item traced to its layer.

---

## PART 0 — FOUNDATION, AUTHORITY, AND THE RULES THAT HAVE BROKEN THIS PROJECT

### 0.1 The two baselines, and the ONE distinction that governs everything

There are two layers, and they are treated in opposite ways. Confusing them is the root of every past failure.

**THE VISIBLE LAYER — UI + phrasebook + behavior — is LIFT-AND-SHIFT. It is never dropped, never rebuilt, never redesigned.**
- **B1 = `bridge-turn09-ship.html`.** Its ribbon, compose strip, `/` and `..` search, search drawer, transcript surface, four-tab room drawer, the entire phrasebook surface, room-creation wiring, icon set, sizing, and color are carried forward intact and untouched. This layer is near-perfect. The default action on it is DO NOT TOUCH. It changes ONLY when a specific release explicitly names a specific visible change. A visible change appearing that no release named is a defect.

**THE INVISIBLE LAYER — the plumbing underneath — DOES get ripped out and replaced.**
- This is the real work. The plumbing behind B1's UI is thin and lost its reliability engineering in the 2026-07-09 amputation. It gets **surgically removed and replaced** with the robust plumbing from the donor:
- **Donor = pre-collapse `bridge-turn08-pre-ship.html` at its ~14,893-line peak (commit `f403d70`, 2026-07-04).** The surviving source of the mature call/video lifecycle: ICE restart, call recovery, perfect-negotiation glare handling (`makingOffer`), `replaceTrack`, reconnect logic.
- **The test of a correct plumbing change: it produces ZERO visible difference.** The user sees no UI change at all — they only *feel* it: calls survive a network blip, the fresh-room-vs-revisited-room transcription symptom is gone, and history from before they arrived is now visible. If a plumbing change alters anything visible, that is the signal it went wrong — stop.

**"Lift-and-shift the baseline" is therefore NOT "never change anything."** It means: the visible layer is lifted and shifted intact; the plumbing under it is surgically replaced from the donor and later extended. These happen to different layers and must never be conflated. Do not take "don't drop the baseline" as license to leave broken plumbing in place, and never take "replace the plumbing" as license to touch the UI.

### 0.1a The release chain — named input and output files (without this, diffs are meaningless)

Every release states its EXACT input file and its EXACT output file. The output of one release IS the input of the next. No release is defined without both named. Every intermediate output is a **fully functional release** — never a broken halfway file handed forward. Filenames below follow the established turn-family naming; they are the plan's skeleton, filled per release:

```
bridge-turn09-ship.html            ← B1, the visible-layer baseline (INPUT to Phase 0)
        │  Phase 0: surgical remove-and-replace of the plumbing —
        │  strip thin call/media plumbing, transplant donor's robust
        │  call/video engine (from f403d70) under single ownership.
        │  ZERO visible change. Functional release.
        ▼
[V3 output file]                   ← Foundation (B1 ∪ donor plumbing). INPUT to Layer 1.
        │  Layer 1: invisible plumbing fixes only (fresh-vs-existing
        │  room, PB version/no-data-loss/staleness, joiner history,
        │  receipts, reconnect, silent-cred, mute-honored, pill kinds,
        │  enter-in-source caret). ZERO visible change. Functional.
        ▼
[V4 output file]                   ← Defect-free foundation. INPUT to Layer 2.
        │  Layer 2: named visible additions ON TOP (room card, home
        │  screen + in-app waiting/badge/mute system, room-name-at-
        │  creation + ribbon popup, mic-centered [written approval],
        │  appearance tone/font-color). Each a functional release.
        ▼
[V5… output files]                 ← INPUT to Layer 3 (joiner shell, elevation,
                                      OS push, export/delete, IndexedDB) — each
                                      its own release, its own input→output.
```

Actual filenames for each Vn are assigned when that release is planned, following the turn-family cycle. The point is the STRUCTURE: named input, named output, output-becomes-next-input, every output functional. **The diff gate (0.8) diffs each release's actual result against its named input file. Without this chain there is no input to diff against, and the diff gate is meaningless.**

### 0.2 The rule that has broken this project (STANDING, absolute)

Every catastrophic failure in this project's history came from **combining working files rather than rebuilding from them** — dormant code waking on load, two owners of one concern, namespace collisions, a shell and an engine that never shared a room list. Therefore: **one owner per concern, no exceptions, no second copy left behind.** Read source files, re-implement deliberately under single ownership, never inject/merge/graft.

### 0.3 Item 66 — the no-unspecified-affordances rule (STANDING, absolute)

**Controls, icons, and affordances are built ONLY from explicit specification. Nothing not named in this document may appear in the UI.** This is the rule that a builder must obey to avoid inventing emoji, cartoon glyphs, extra buttons, or "helpful" affordances. When in doubt, leave it out and ask. An unspecified icon is a rejected build, not a judgment call.

### 0.4 The gate

The only acceptance gate that closes an item is a **physical two-device test on real phones with real credentials.** "It lints," "it compiled," "headless passed," "the code reads correctly" are never done. Browser/headless verification is a pre-check to avoid wasting a device test — it is not the gate.

### 0.5 On failure

Rollback → graveyard entry with version bump → plan version bump → rebuild from clean base. In that order, never reordered. Never patch forward on a gate failure.

### 0.6 One surface, one release

Any scope split that causes the same surface to be touched twice across releases is unacceptable. The chat surface and the call transcript are ONE transcript; calls are a live-media layer over it. The bridge organ (transcript + compose strip + phrasebook) moves together and is never split.

### 0.8 PROCESS GUARDRAILS (binding, mechanical — not promises)

Every past failure survived because "follow the baseline" was a promise, and promises don't measure themselves. These two guardrails are mechanical and enforced on every release.

**GUARDRAIL 1 — the diff-projection gate.** Before writing any code for a release, I first write down the **expected diff**: which files, roughly how many lines added/removed, and which specific functions/surfaces are touched. This projection is recorded in the release's build log BEFORE any edit. After building, before any push, I run the **actual diff** against the release's input file and compare:
- **Variance ≤ 5%:** green. Proceed to verify + push.
- **Variance > 5% and ≤ 10%:** yellow flag. Stop and explain the variance in writing before proceeding. No push until the variance is explained and accepted.
- **Variance > 10%:** red. Stop entirely. Something went wrong — do not push, do not patch forward. Diagnose the divergence, and if it means the baseline was touched beyond plan, roll back.
Variance is measured against the projected changed-line count, and specifically flags **any touched surface not named in the projection** — an unplanned file or function in the actual diff is an automatic red regardless of line count, because that is exactly how the baseline gets silently altered.

**GUARDRAIL 2 — execute-to-plan only; never decide, never invent.** During any build I:
- Build ONLY what the release's plan names. Nothing added because it "seems needed," nothing "improved," no affordance/icon/control not explicitly specified (this is Item 66, 0.3, applied to process).
- NEVER make a decision on an open question. If the plan is ambiguous, or a requirement is unclear, or two rules seem to conflict, or something needed isn't specified — I STOP and record it as an **open question** and ask. I do not resolve it myself, do not pick a reasonable default, do not proceed on an assumption.
- Maintain a running **OPEN QUESTIONS / OPEN ITEMS** log for the release. Every assumption I would otherwise make becomes a logged question instead. The log is surfaced to the owner, not silently carried.
- Record the expected-vs-actual diff for every release in the build log (Guardrail 1), so the history of what was projected vs what happened is auditable.

**The baseline rule these enforce:** turn09-ship is the starting point and is near-perfect. Nothing in it changes unless a specific release explicitly names the change. The default action on the baseline is *do not touch*. The diff gate measures adherence; the no-deviation rule governs intent; together they make "follow the baseline" checkable instead of hoped-for.

### 0.9 Fixed infrastructure (never modify)

- Relay: `wss://talk-signal.myacctfortracking.workers.dev/signal`, params `?app=talk-say-v1&session={roomId}&client={deviceId}`. RELAY_APP `talk-say-v1`.
- Deepgram STT: `wss://api.deepgram.com/v1/listen?model=nova-3&language={lang}&encoding=linear16&sample_rate=16000&channels=1&interim_results=false&punctuate=false&endpointing=400`. **Auth is a WebSocket subprotocol** `new WebSocket(url,['token',key])`, never a header. Key in localStorage `tb_dg_key`. Capture socket at creation; gate every handler on socket identity.
- TURN: `POST https://rtc.live.cloudflare.com/v1/turn/keys/{tid}/credentials/generate`, `Authorization: Bearer {tok}`, body `{ttl}`. Token ID `6ae776dc0b1df1b7ced8e6c4c6747e56`.
- Translation: MyMemory, `https://api.mymemory.translated.net/get?q={q}&langpair={from}|{to}`. No key. Failure shows "⚠ not translated", never a silent blank or a silent copy of the source.
- GitHub phrasebook store: `acmeproducts/stuff`, files under `/phrasebook/`. Contents API only for verification (never raw CDN — cache lag). Fetch fresh SHA before every PUT; verify via blob SHA at the returned commit.

---

## PART 1 — START & HOME SCREEN

**1.1 Boot.** The app always boots to the start screen with the panel closed. It never auto-opens a room.
*Accept:* cold load lands on start screen, panel closed, no room open, survives reload.

**1.2 Start ribbon.** Hamburger (opens panel) · auto-read speaker toggle (plain when on, red slash when off). No other controls.
*Accept:* exactly these two controls present; no extra icons (Item 66).

**1.3 Names bar.** Own name (tap to edit, Enter commits) · ↔ · partner name, hidden until known.
*Accept:* partner side absent until a partner name exists; Enter commits own-name edit.

**1.4 Empty state.** Flag-motif background · "Welcome" · "Please select a conversation on the left or tap the + icon to start a new chat."
*Accept:* flag-motif visible (not plain), exact copy string present.

**1.5 Home summary line** (above the room list).
- Nothing waiting: "You have N active rooms, there are no waiting messages."
- Things waiting: "Of N active rooms there are M waiting messages, X chats and Y video calls."
- The counts equal the sum of the badges on the cards below.
*Accept:* summary numbers equal the summed badges (T2-8).

**1.6 Home cards are waiting-only.** The home screen shows cards **only** for rooms with waiting activity. No waiting activity → no home cards, but every room still lives in the panel.
*Accept:* no waiting activity → zero home cards, all rooms still in panel (T2-13).

**1.7 Home cards reuse the §4 component exactly** — the three-row, two-column room card. The panel is the persistent full list of all rooms.
*Accept:* home and panel render the identical card component (T2-16).

**1.8 Dismissal.** Tapping a home card opens its room and persistently dismisses only that summary card. A home card may also be dismissed without opening. Dismissal never clears the room's badges and never removes the room from the panel. A later, genuinely new waiting episode may create a fresh summary card for that room.
*Accept:* dismiss + cold reload → card stays dismissed, badges + panel intact (T2-14).

---

## PART 2 — SYSTEM MENU, CREDENTIALS, THE PROMISE

**2.1 App-info card.** An info icon, "TalkBridge", and "About & start screen" beneath. Tapping it leaves whatever room is open and returns to the start screen. It sits directly under the clock, above the room list, so the exit is always in the same place and never scrolls away.
*Accept:* tap from inside any room → start screen; position fixed above the scrolling list.

**2.2 Calling & sync keys (S13a).** One screen holds all three credentials: Deepgram key, GitHub PAT, TURN token. All three are live-verified on save together, modeled on the working verify-on-save pattern. Every credential failure is logged (failure-only, never per-success). The PAT-rejection toast stays on screen long enough to read.
*Accept:* each credential verified on save; a bad value surfaces a visible error, not silence; failure appears in debug log.

**2.3 Build identity.** The S13a modal displays the current release number and build datetime. Code comments carry the same release/description, bumped every release.
*Accept:* release number + build datetime visible in S13a.

**2.4 The invite / grant flag.** An invite link aimed at another person carries a grant flag = "Link a device aimed at another person" = elevation (see Part 13). Both link types already exist in code.

**2.5 Credential failures never silent.** An invalid Deepgram key during a call shows a persistent, dismissable indicator; the failure is in the debug log without logging every success.
*Accept:* invalid key mid-call → persistent visible indicator, not silent.

---

## PART 3 — THE RIBBON (room header)

**3.1 Layout.** Hamburger · own name ✎ ↔ partner name · presence · video-call icon · audio-call icon. The microphone icon sits **dead centre** in the ribbon (measured centre = ribbon measured centre). The audio-call icon is always active — a person may start a call alone.
*Accept:* mic measured centre equals ribbon measured centre (T3-7); audio-call icon always enabled (T?-alone-call).

**3.2 Zone model** (from B2/pre-base look, single strip, no second control strip): left = hamburger + names + timer; centre = mic level-meter + reserved camera slot (empty in chat/phone, visible in video); right = call-start icons + hangup. During a call the call-start icons hide and hangup shows; camera/mic-mute controls become visible. Controls live in the ribbon, never duplicated onto the video surface.
*Accept:* start a call → call-start icons hidden, hangup shown, no duplicate controls on video; end → reverts exactly.

**3.3 Mic level-meter.** The centre mic is a live level meter: teal fill rising from the bottom of the capsule (log mapping, fast attack / ~200ms release); amber fill when transcription drops.
*Accept:* fill responds to input; amber on transcription failure.

**3.4 Timer.** Carries connection state as text (Connecting… / 0:07 / Reconnecting…) at the left during a call.
*Accept:* timer text reflects real connection state.

**3.5 No inherited debris.** No Share icon, no Diagnostics icon inherited from `test.html`. Red only ever means "end the call."
*Accept:* room card and ribbon contain no Share/Diagnostics icon (T3-8).

---

## PART 4 — THE ROOM CARD (three rows, two columns)

**4.1 Shape.** Three rows, two columns. Left column left-justified, right column right-justified.

| | Left | Right |
|---|---|---|
| Row 1 | Room name — **bold**, truncates with ellipsis | Delete |
| Row 2 | Me/Partner — not bold, truncates with ellipsis | Time since last contact |
| Row 3 | Chat, phone, video icons each with their own count badge | Language-pair flags |

*Accept (T3-1):* Row 1 = bold room name left, delete right. Row 2 = Me/Partner left, elapsed right. Row 3 = icons+badges left, flags right.

**4.2 Truncation is not interactive.** Tapping truncated text opens the room, exactly like tapping anywhere else on the card. (This supersedes any earlier "tap-to-reveal popover" wording — opening the room is the behavior.)
*Accept:* tapping ellipsised text opens the room.

**4.3 Elapsed time** is mixed-mode: minutes → hours → days (e.g. "5m", "3h", "2d").
*Accept:* renders m/h/d by magnitude.

**4.4 Flags** read own-language-first from each viewer's perspective — always "mine/theirs", never a fixed absolute order. Real flag glyphs matching `gL().flag`.
*Accept:* each viewer sees own flag first (T3-6).

**4.5 Three separate activity counts.** A missed chat, a missed voice call, and a missed video call are three distinct, separately tracked and displayed badges.
*Accept (T3-4):* 2 missed chats + 1 missed call + 0 video → badges read 2, 1, none.

**4.6 Delete is a soft delete,** recoverable.
*Accept:* deleted room recoverable; see 5.x room-deletion notice/lock.

---

## PART 5 — ROOM LIFECYCLE

**5.1 Create.** Your language · partner language · room name (the thread topic, a real field set at creation) · auto-read toggle default **off** · "Grant initiator status" toggle with a calendar picker defaulting to 30 days · Cancel · OK.
*Accept:* room-name field present at creation; auto-read defaults off; grant picker defaults 30 days.

**5.2 Enter.** Opens to full history, correctly translated, viewer's own language always on the same side. Clears only that room's badges. Re-entering shows exactly what was there plus anything that arrived — nothing lost, nothing duplicated. A room created in the app appears in the room list and survives a page reload.
*Accept:* create → reload → room persists with its transcript; re-enter loses/dupes nothing.

**5.3 Change.** Only the room's creator can rename it.
*Accept:* non-creator cannot rename.

**5.4 Delete / restore notices.** Deleting a room logs "left the chat" in the other party's transcript and refuses any new messages in that room from that point (send-lock). Restoring a soft-deleted room logs a "rejoined" entry, and that entry is what releases the send-lock — restoration alone does not.
*Accept:* delete → partner sees "left the chat" + send blocked; restore → "rejoined" + send unblocked.

**5.5 Long names truncate with ellipsis everywhere** they appear (card, drawer, ribbon popup), never wrap.
*Accept:* 40-char name ellipsised in every surface.

---

## PART 6 — TRANSCRIPT & BUBBLES

**6.1 One transcript.** Chat and call captions are the same transcript surface. Calls are a live-media layer over it; chat and compose stay fully usable during a call.
*Accept:* during a video call the transcript scrolls and compose sends.

**6.2 Bubble anatomy** (look/feel from B2 pre-base): header showing sender + timestamp per the meta-line placement (Top default / Bottom / Off); source text and, when translated and different, the translation; sent/received/read state; call-ended pill.
*Accept:* bubble carries header per placement, both texts when translated, receipt state.

**6.3 Attachments** appear inside the bubble: clip icon + filename, images preview inline, removable on own messages only. Up to 200 MB, video supported. Over-limit is rejected with a visible error before the read.
*Accept:* >200MB → visible rejection; image previews inline; own-message attachment removable.

**6.4 System pills.** "left the room"/"rejoined"/call-ended/name-change are real transcript rows, deduped by pillId. Name-change pill carries a single datetime stamp (not doubled) and reads "[Mon 28 Jul, 22:33] X is now Y". Call pills differentiate voice vs video across missed/declined/canceled/ended.
*Accept:* pills are transcript rows; no duplicate pillId; name-change stamped once; call kind shown.

**6.6 Presence & receipts must know when you leave and return (R1 plumbing fix).** The delivered/read model in turn09 has a hole: `sendReadReceipts()` only runs on a fresh incoming message or on `visibilitychange`. Navigating from a room to the home screen and back **never fires `visibilitychange`** (the tab was never hidden), so if no new message arrives, delivered messages never flip to read and presence goes stale — you look present but reads never register. Fix the whole model, not the one-line patch: the app must know when you leave a room view and when you return (in-app navigation, not just tab visibility), and reconcile presence + outstanding read receipts on both. This is invisible plumbing — no UI change, the receipt ticks and presence dot just behave correctly.
*Accept:* open room A, receive messages, go to home screen, return to A → messages flip to read and presence reflects your return, with no new message required to trigger it; partner sees the read state update.

---

## PART 7 — COMPOSE STRIP & INLINE SEARCH

**7.1 Trigger.** "/" as the very first character, or ".." as the first two characters, switches the compose strip into search mode on that keystroke. Nothing is submitted, nothing sent. "//" is an escape hatch — ordinary text, not search.
*Accept (T8-1):* "/" first char → search opens on the keystroke; "//x" stays literal text and can send.

**7.2 Inline search drawer** opens **up from the bottom** over the transcript. Its own ribbon carries the PB icon and the language-pair flags in the correct source→target order. It filters live on every keystroke, `-word` excludes. Turn09-ship owns scoring/ordering: relevance while querying, otherwise usage then creation time, capped at **30** inline results. Empty state "No matching phrases".
*Accept (T8-5):* drawer rises from the bottom; its ribbon shows PB icon + pair flags in source→target order; live filter; `-word` excludes; turn09 scoring; 30-cap; empty-state string.

**7.2a Jump to the full PB surface.** Tapping the PB icon in the search drawer's ribbon jumps to the full phrasebook surface. If nothing has been typed, the PB surface opens at zero state. If a query is in progress — typed in the compose strip and carried via Enter or the go action — the full PB surface opens with that search already in progress (query carried across, results shown). This is turn09 behavior; transplant, do not rebuild.
*Accept:* PB icon with empty query → PB zero state; PB icon (or Enter/go) with a query → full PB surface with the search in progress and the same query applied.

**7.2b Clear-X in every search field.** Every search field — the inline drawer and the full PB surface — always carries an X inside the field to clear the search.
*Accept:* both search fields show an in-field X; tapping it clears the query.

**7.3 Clear X** shows when the query is non-empty; clearing exits search and restores compose.
*Accept:* X visible with query; clearing exits search cleanly.

**7.4 Send button** is the airplane icon everywhere; disabled when compose is empty; the "/" search state never sends.
*Accept:* airplane icon; disabled on empty; search state cannot send.

---

## PART 8 — CALLS (voice & video) — the amputated layer, restored from B2

**8.1 Ring overlay.** Full-screen ring over the app (including the start screen): pulsing teal circle with a phone icon · caller name · sub-line · two round buttons — green Accept, red Decline (icon rotated to read as hang-up). Ring anywhere the app is open: tone + vibration.
*Accept:* incoming call rings over any screen with Accept/Decline.

**8.2 Solo start.** The audio-call icon is always active; a person may start a call alone (it rings the other side).
*Accept:* start a call with no partner present → outgoing ring, no error.

**8.3 Lifecycle robustness (restored from B2, the whole reason for the union):**
- ICE restart on connection failure.
- Call recovery / reconnect logic (not a single connect-once peer).
- Perfect-negotiation glare handling (`makingOffer`/polite-peer) so simultaneous offers don't deadlock.
- `replaceTrack` for seamless mic/camera/stream swaps without renegotiation churn.
*Accept:* a call survives a transient network drop on real devices and re-establishes without a full hang-up/redial; simultaneous call attempts resolve to one call.

**8.4 Media & controls.** Real `<video>` elements for local and remote, bound via `srcObject`. Controls live in the ribbon (Part 3.2): mic-mute, camera, hangup. Video call = band atop the transcript; Back → PiP (video only), tap expands, hang-up ends. No invented call UI — look/feel from B2 pre-base only.
*Accept:* remote video renders; PiP on back; controls only in ribbon.

**8.5 Mute is total.** Mute = no transcription, no transmission. Not a comfort toggle that leaves STT running.
*Accept:* muted → no STT, no audio sent.

**8.6 Missed/declined honesty.** Unanswered outgoing call stops showing "Call ended" and shows the correct missed/declined state. 30s missed pill. Call-kind (voice/video) on every such pill.
*Accept:* no-answer outgoing → labeled missed, not "ended"; kind shown.

**8.7 State restoration.** Chat mic → call → chat mic restores the exact prior state. Room exit always releases capture regardless of icon state.
*Accept:* after hangup, chat-mic state is exactly what it was pre-call; exiting a room releases the mic.

---

## PART 8B — THE WAITING / BADGE / SUMMARY / MUTE SYSTEM (one in-app system, NOT the OS-push release)

**Critical correction to the old plan:** OS notifications were historically treated as a single isolated last release. That is wrong. There are TWO separate things and only one of them is deferrable:

1. **The in-app waiting system (early — foundation/Layer 1–2, NOT deferred).** A room accrues waiting activity → its three-way badges increment (chat/voice/video, Part 4.5) → it surfaces on the home screen with a summary line (Part 1.5–1.7) → the mute control in the drawer (Part 10.1) suppresses its ring + message-waiting. This entire chain is in-app, needs no service worker and no relay change, and is **load-bearing for the home screen, the room card, and the mute control** — three surfaces that ship well before any OS-push work. It cannot be deferred without breaking those surfaces.

2. **OS device push (late — Layer 3, genuinely isolated).** Only the locked/backgrounded-device case needs (a) a service worker registered from the file and (b) a server-side push sender, which means modifying the Cloudflare relay (otherwise never-modify). It needs its own device gate (locked phone + second device) and, on iOS, a home-screen PWA install. This — and only this — is the standalone final release.

**8B.1** Waiting activity badges the room card per mode, separately (ties to 4.5).
*Accept:* a waiting chat and a waiting video on one room show as two distinct badges.

**8B.2** The home summary counts equal the sum of those badges (ties to 1.5).
*Accept:* summary "2 chats and 4 video calls" equals the badges below.

**8B.3** Mute in the drawer suppresses that room's ring and message-waiting surfacing (ties to 10.1), shown as a slashed bell on the card.
*Accept:* muted room does not ring and does not raise a waiting surface; card shows slashed bell.

**8B.4** Until OS push ships, behavior stays honest: an unanswered call drops a missed-call pill, unread messages badge the room card on next open. No silent pretense of a delivered notification.
*Accept:* backgrounded/locked case degrades to pill + badge, never a fake "notified" state.

---

## PART 9 — PHRASEBOOK (NO-TOUCH TRANSPLANT from B1 — do not rebuild)

**9.0 TRANSPLANT RULE (overrides everything below).** The phrasebook surface is **lifted from `bridge-turn09-ship.html` as working code and carried forward intact.** It is NOT reconstructed from this description. The description in 9.1–9.8 exists to define acceptance and to document the Layer-1 plumbing fixes — it is NOT a build spec to code against. Every past iteration that hammered the phrasebook did so by rebuilding it from a spec and losing hand-tuned behavior (clarify refocus, tag add-and-refocus, verdict reset timing, Enter-in-source caret, sync-dot states, save-without-dup). Those behaviors are not re-derivable from prose. **Acceptance for the PB surface is behavioral identity with turn09-ship, not conformance to this text.** The only permitted changes are the Layer-1 plumbing items explicitly listed in 9.6/9.7 (version management, no-data-loss) — and those touch the sync/storage layer *behind* the surface, never the surface's interaction code. If a change would touch the card/clarify/tag/verdict/search interaction code, stop: that is a rebuild, and rebuilds of this surface are forbidden.
*Accept:* every card/clarify/tag/verdict/search interaction behaves byte-for-byte as turn09-ship; a side-by-side against turn09 shows no behavioral difference on the surface.

**9.1 Scope.** Language-pair scoped, not room scoped — one curated set per pair, source of truth on GitHub. Two direction-specific books per pair. Every EN↔TH room reads/writes the same book.
*Accept:* two rooms of the same pair share one book; opposite direction is the other book.

**9.2 Manager (S7).** Header: pair flags · + (prepends a new empty card) · save-now · sync dot (grey pending / green synced / amber failed) · ×. Search field with `-exclusion` and clear ×. "Recently Deleted (n)" chevron section appears only when trash holds cards — Restore / Delete Forever per card. No category strip, no footer status line.
*Accept:* sync dot reflects state; recently-deleted section only when trash non-empty.

**9.3 Card (S6) anatomy.** Header "Created {by} · {date time} — Modified {by} · {date time}" + usage count. Two-column body: viewer's own language left, 1px divider, partner language right — both always shown. Text tap-to-edit, Enter commits. Per column: Use (loads into compose, counts a use) + speaker (TTS). Footer: tags (#), clarify (💬), trash (×). Panels: tags (chips with ×, add-input suggesting from tags used anywhere in this book, Enter adds+refocuses), clarify note (Enter commits+refocuses), back-translation always visible (italic result · ✓ Sounds Good / ⚑ Flag). Verdict resets only when the source changes. Long-press = quick-ring of actions. Duplicate save → "Already saved" toast, does not navigate away.
*Accept:* Enter-in-source keeps focus in the field, caret at end, re-translates target + re-runs back-translation (does NOT jump focus to the bubble header); verdict resets only on source-text change; duplicate save shows "Already saved" and stays.

**9.4 Save-from-transcript without duplication.** Saving a phrase already saved shows "Already saved" and does not create a second card.
*Accept:* save same phrase twice → one card, "Already saved".

**9.5 Force-retranslate without editing.** On the PB surface, Enter in source (changed or not) re-runs translation + back-translation.
*Accept:* Enter with unchanged source still re-translates.

**9.6 Version management (RULING, 2026-07-30).** Bridge NEVER manages phrasebook filenames or version numbers. On any change — content edit OR routine usage — bridge overwrites the file it already loaded, at the version it already has. It never invents a higher version. On every pull (entry, reconnect, reload) bridge selects whichever file has the **highest version number present in the repo** — so an external release process bumping a version is picked up automatically. Entering a room is not a change and must not bump anything. Usage counts may be captured freely on save since saving no longer bumps a version.
*Accept:* enter a room repeatedly → version does not change; external higher version → picked up on next pull.

**9.7 No data loss (KNOWN DEFECT fix).** A pull must never discard unwritten local changes — write back first, then pull. A dirty local copy blocks/defers a pull until its own write-back completes. Writes back on call end, dirty close, save-now; retries on reconnect.
*Accept:* edit offline, pull triggers → local change written back before overwrite, nothing lost.

**9.8 Ingestion.** The book is ingested on room creation and on room entry, refreshed on re-entry, cache-first (load cache instantly, don't force-download, staleness check before pull). There is no import/export path.
*Accept:* cache loads instantly; pull only on init or detected change (9.6/9.7).

---

## PART 10 — ROOM DRAWER (four tabs)

Slides down from the top of the room. ··· opens, ✕ closes. **No tables, no gridlines, no native input chrome — every control drawn flat; sections separated by spacing and small-caps labels only** (owner ruling, re-affirmed). Enter or blur on name/title saves and closes the drawer.

**10.1 General.** Your name (what the partner sees; changes apply forward only, old bubbles keep the old name, a system pill lands: "Mike is now Bob") · room title (creator-only editable) · Ear (hear partner's raw voice — binary, default ON in a call, with info icon "Hear their voice during a call or video call.") · TTS/Auto-read (read incoming aloud — binary, default OFF, info icon "Reads the other person's messages aloud in your language.") · Mute notifications (kills ring + message-waiting; slashed bell on the room card).
*Accept:* name change → forward-only + system pill; Ear/TTS carry info icons; mute reflected as slashed bell on card.

**10.2 Customize.** Go-button show/hide · "Chat bubble header" placement (Top default / Bottom / Off) · Appearance table (Part 12).
*Accept:* go-button toggles send visibility; header placement changes bubble header position.

**10.3 Share.** Share room (native OS share sheet + clipboard fallback) with QR · Link a device (QR + link) — hands off THIS ROOM to your other phone, both synced, a call active on only one.
*Accept:* Share opens native share/copy; Link-a-device QR resolves to a working room handoff link.

**10.4 Debug.** Copy log **and** download/export. Export transcript also here (real openable file).
*Accept:* both copy and download present (not copy-only); export produces a real file.

---

## PART 11 — JOINER

**11.1 Full shell (Layer 3).** The joiner gets the full app shell, not a stripped shell — same room list, cards, drawer, phrasebook, transcript.
*Accept:* joiner sees the same surfaces as the initiator.

**11.2 Correct book direction.** The joiner loads the correct-direction phrasebook for the pair from their own perspective, regardless of room age (new vs. re-entered).
*Accept:* joiner's own language is the left/source book direction; re-entering doesn't flip it.

**11.3 History on join.** A newly connected/rejoining joiner receives history-sync backfill (Layer 1) so their transcript is complete.
*Accept:* joiner entering an existing room sees prior history, nothing missing.

**11.4 Badges for joiner.** Missed-call/waiting-message badge logic works from the joiner side (data/logic; the joiner shell itself is Layer 3).
*Accept:* joiner's cards badge correctly for waiting activity.

---

## PART 12 — APPEARANCE (per room, Me / Partner)

Per room, no reset button, persists across a cold reload and across linked devices (carried in the link-device payload + local storage). Me and Partner columns, drawn as flat rows (no grid/borders).

Per side: Preset (Light/Medium/Dark) · Tone select · Bubble color · **Font color** · Font size (range **10–32**) · Column width. Plus room-wide header text size and color.
*Accept:* own-font-size 32 vs partner-font-size 10 with no cross-effect; tone and font-color present per side; survives cold reload; no Reset control anywhere.

---

## PART 13 — INITIATOR ELEVATION & GRANT MODEL (Layer 3)

**CORE DESIGN — credentials are the mechanism; everything else is a consequence.** Elevation is not a set of separate permission flags. There is exactly ONE thing that makes a device initiator-capable: **whether valid credentials are present in its local storage.** Grant = write credentials (with an expiry) into storage. Expiry/revoke = blow those credentials away. Every capability difference between an initiator and a joiner already flows from this single fact through existing credential-gated code — do NOT build separate enforcement paths, flags, or read-only modes. Build the credential presence/absence, and let the existing checks do the rest. This is simpler than a flag model AND it is what the app already does.

**13.1 Grant happens at room creation.** The "Grant initiator status" toggle in the new-room dialog (5.1), together with its calendar picker (default 30 days), is what turns an ordinary invite into a grant link. Flipping it ON changes what the link carries: the granter's working credentials plus the chosen expiration date.
*Accept:* toggle ON at creation → the room's invite link carries credentials + expiry; toggle OFF → an ordinary invite with no credentials.

**13.2 Opening a grant link writes credentials to storage.** The receiving device, on opening the link, writes those credentials into its own local storage with the expiration date attached. That write — and nothing else — is what makes the device initiator-capable. No separate "you are now an initiator" flag is set or needed.
*Accept:* open a grant link → credentials present in storage with expiry; device now behaves as initiator purely because credentials exist.

**13.3 Global, peer-to-peer, no central store.** Granted by whoever currently holds valid credentials — no root authority, no registry. Granting IS sharing your own working credentials; that is the built-in incentive to be circumspect. Matches the stateless, no-account design. A sub-initiator (someone who received credentials) can grant further — the rule is simply "whoever currently has valid credentials."
*Accept:* an elevated device can itself produce a working grant link.

**13.4 Expiry = credential removal, and everything falls out of that.** No manual revoke — expiration only. When the expiry date passes, the device **deletes the credentials from storage.** Because capabilities are credential-gated, all of the following happen automatically as consequences of that single deletion, NOT as separately-coded behaviors:
- The **+ (new-room) control disappears** from the panel — it is already gated on credential presence, so no credentials → no +. The former initiator can no longer create rooms.
- **Existing rooms lose transcription** — Deepgram STT needs the key that is now gone, so it simply cannot run.
- **Existing rooms lose translation** — the translation path needs credentials that are now gone.
- Every room that person created while elevated is therefore effectively frozen for both parties: history stays visible, but no new transcription, translation, or calls are possible because the machinery those depend on has no credentials.
*Accept:* force expiry → credentials gone from storage → + is absent, STT does not start, translation does not run, in existing rooms — with no new flag or enforcement code responsible for any of it, only the absence of credentials.

**13.5 Third link type distinct from the other two.** The grant link is distinct from the plain room-invite link and from Link-a-device (which links YOUR own second phone to a single room). The distinguishing payload is: credentials + expiry.
*Accept:* three link types resolve to three behaviors; only the grant link carries credentials + expiry.

**13.6 Pilot-scale note.** No revoke/rotation/backend. Mitigation for a rogue grantee is disabling the key on the credential side (Deepgram/TURN/GitHub) + scoping the shared GitHub PAT to only the phrasebook repo. A real backend past ~20 users is future work, not actionable now.

---

## PART 14 — LOOK & FEEL (hard-coded, so it can never be missed again)

**14.1 The Item-66 rule restated for visuals.** No icon, control, or affordance appears unless named in this document. This is what prevents cartoon/emoji icons. A builder that needs an icon not specified here stops and asks. Emoji are NOT icons.

**14.2 Icon style.** All functional icons are **flat single-weight SVG line icons**: `fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke`. Never emoji. Never filled/cartoon glyphs. Never multicolor. The mic, camera, phone, video, hamburger, send (airplane), attach (paperclip), settings, share (3-node), speaker/TTS, trash, tags, clarify icons all follow this. Send is the airplane icon everywhere.

**14.3 Color tokens (authoritative, from B1 `:root`).**
```
--teal:#2E8B8B  --teal-mid:#3A9E9E  --teal-light:#E6F4F4
--ink:#1A1714   --ink-mid:#5A5552   --ink-dim:#9A9592
--border:#E2DDD8 --paper:#F5F1EC    --cream:#FDFAF7
--green:#2E7D4F  --green-light:#E8F5EE
--amber:#C07830  --amber-light:#FBF0E4
--red:#C0392B    --red-light:#FDEDEC
--shadow:0 1px 4px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)
```
App background `#EFEAE4`; app column max-width 480px, centered, cream. Red is reserved to mean "end the call" / destructive only.

**14.4 Typography.** `"DM Sans", -apple-system, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif`. Field labels: 11px, 700, uppercase, letter-spacing .4px, `--ink-dim`. Inputs 16px. No new fonts.

**14.5 Control states.** On/off controls render as a plain icon when on and the **same icon with a red slash built in** when off (not a slash composited on top). Ear, TTS, Mute (bell), mic, camera all follow this. Mute = slashed bell, also shown on the room card.

**14.6 Flat drawer.** The room drawer has no tables, gridlines, or native input chrome — flat controls, spacing + small-caps section labels only.

**14.7 Flag motif** appears on the start/welcome/create surfaces (cream wash `rgba(253,250,247,.58)`) and the joiner landing (dark wash `rgba(10,10,10,.82)`), bigger and opaque enough to read, and extended to the drawer. Real flag art, not CSS-stripe substitutes.

---

## PART 15 — THE LAYER CAKE (scope, approach, sequence)

### FOUNDATION = (B1 ∪ B2)
turn09-ship's UI/PB/ribbon/drawer/search/transcript, hosting B2's restored call/video engine as one owned module. Deliverable: the exact look/feel and PB behavior of B1, plus the call robustness of B2. **No visible change from B1's look.** This is Phase 0 and it is gated on its own two-device test (a call surviving a network blip) before any layer goes on.

### LAYER 1 — make the foundation provably defect-free (INVISIBLE plumbing + confirmed bugs)
No UI surface changes here — that is the point; when it passes device test you have, for the first time, a foundation you can call defect-free and know it, because nothing in this layer could alter what you see.
- L1.1 "Fresh vs. existing room" defect family: voice/video transcription dying after leaving and re-entering a room (one suspected root cause across the symptom family). *Investigate by comparing a fresh room's stored record/state to an existing room's before touching code.*
- L1.2 PB version-management ruling enforced (9.6): no bump on entry; ingest highest; staleness check before pull.
- L1.3 PB no-data-loss (9.7): write-back-before-pull; dirty blocks pull.
- L1.4 localStorage safety: write-through before network; quota-wall handling (the "storage full" toast defeating PB cache).
- L1.5 Joiner wrong-direction book (11.2).
- L1.6 History-sync backfill on join/reconnect (11.3) — `mergeHistory` actually called.
- L1.7 Read-receipt catch-up on in-app room re-entry (B6): call `sendReadReceipts()` from `enterRoom()`, not only from `visibilitychange`.
- L1.8 Proactive relay reconnect on tab-visibility-return (fixes presence/checkmark lag).
- L1.9 Credential failures never silent (2.5).
- L1.10 Notification mute honored (10.1) — the toggle actually gates notifications.
- L1.11 Call-kind on every missed/declined/canceled/ended pill (6.4/8.6); name-change pill single timestamp (6.4).
- L1.12 Enter-in-source caret/focus bug (9.3) — stays in field, caret at end, re-translates; never jumps to the bubble header.
- L1.13 ~30s initial delivery lag when recipient is on the home screen (diagnosis: LISTEN heartbeat timing) — verify/fix.

### LAYER 2 — the already-designed visible surfaces (each gated, per-item written approval where it changes an existing surface)
- L2.1 Room card, full §4 (three rows, two columns, three separate badges, own-first flags, ellipsis truncation).
- L2.2 Home screen §1 (waiting-only cards, summary line, dismissal rules) — driven by L2.1.
- L2.3 Room-creation thread-name field (5.1); tap-partner-name-in-ribbon popup showing the thread name (ribbon default layout otherwise untouched).
- L2.4 Mic-centered-in-ribbon (3.1) — the one change to the existing ribbon; **requires written approval before build.**
- L2.5 Appearance completeness (Part 12): add Tone + Font-color per side if not already present.

### LAYER 3 — higher-order capability (biggest, most isolated, each its own release)
- L3.1 Joiner full shell / parity (Part 11).
- L3.2 Initiator elevation + grant/expiry model (Part 13) — highest trust/security surface, isolated release.
- L3.3 OS device push for locked/backgrounded (needs the relay change + service worker; its own release; iOS = home-screen PWA only). **Note:** this is ONLY the locked/backgrounded push. The in-app waiting/badge/summary/mute system (Part 8B) is NOT here — it ships early with the home screen and room card (L2.1/L2.2), because those surfaces depend on it.
- L3.4 Per-room export/delete (OI-8) + room delete/restore "left the chat"/"rejoined" send-lock (5.4).
- L3.5 localStorage → IndexedDB migration (OI-7) — architectural, isolated release, needs a migration path for existing data.

### DEFERRED (behind the four critical structural releases — cosmetic only, standing rule)
- D.1 Icon-graphics rebuild / flag-motif follow-up polish (bigger/opaque, into the drawer).
- D.2 Camera/mic mute as two complete separate icon graphics (on-state, off-state-with-slash-built-in) rather than composited slash; extend the icon convention to bubble headers (mic=chat, phone=voice, video=video-call transcription).
- D.3 Ear/TTS/Mute wording pass.

### SEQUENCE
Phase 0 (foundation union) → device gate. Then Layer 1 in full, one module per stage, plumbing being invisible so the baseline keeps working on your phones the whole way → device gate on the whole layer → **first defect-free foundation.** Then Layer 2 items, each gated, mic-in-ribbon on written approval. Then Layer 3, each its own release. Deferred cosmetics last. Every stage: build → I byte-verify + browser-verify → you device-test when you choose. No stage starts until the prior one is verified on main.

---

## PART 16 — MASTER OPEN-ITEM LEDGER (every item → its layer)

| Item (source) | Layer | Note |
|---|---|---|
| Call robustness lost 2026-07-09 (lineage) | Foundation | Restore from B2 `f403d70` |
| Fresh-vs-existing transcription death (B1/OI-4) | L1.1 | Root-cause investigation first |
| PB version bump on entry (B3/OI-4/OI-5) | L1.2 | Ruling 9.6 |
| PB data-loss on pull (KNOWN DEFECT R3) | L1.3 | Write-back before pull |
| localStorage quota wall (OI-7 symptom) | L1.4 | Safety now; full IndexedDB is L3.5 |
| Joiner wrong-direction book (OI-4) | L1.5 | |
| Joiner missing history (R4 item) | L1.6 | mergeHistory wired |
| Read-receipt on in-app re-entry (B6) | L1.7 | enterRoom() calls sendReadReceipts |
| Presence/checkmark lag (R4 fix) | L1.8 | Proactive reconnect on visibility |
| Silent credential failures (S13 audit) | L1.9 | Persistent indicator |
| Mute notifications not honored | L1.10 | |
| Call-kind on pills / double name-stamp (R4) | L1.11 | |
| Enter-in-source caret bug (G5/R4) | L1.12 | |
| ~30s home-screen delivery lag (B5) | L1.13 | Diagnosis → fix |
| PB surface (turn09) | Foundation | **No-touch transplant, not rebuild (9.0)** |
| In-app waiting/badge/summary/mute system (Part 8B) | L2.1/L2.2 | Load-bearing for home + card + mute; NOT deferred |
| Room card layout (OI-1) | L2.1 | §4 three-row/two-col |
| Home screen smart summary (OI-3) | L2.2 | §1 |
| Room-name-at-creation + ribbon popup (OI-3) | L2.3 | |
| Mic centered in ribbon (B4) | L2.4 | Written approval |
| Appearance tone + font-color (OI-6) | L2.5 | |
| Joiner full shell (spec §5/OI-3) | L3.1 | Parity — the reason they'll install the app |
| Initiator elevation (OI-2) | L3.2 | Credential-removal mechanism (Part 13) |
| OS device push, locked/background (G5) | L3.3 | Relay change + SW; ONLY the push, not the in-app system |
| Per-room export/delete + delete/restore locks (OI-8/OI-3) | L3.4 | |
| localStorage → IndexedDB (OI-7) | L3.5 | Architectural |
| Icon-graphics / flag-motif polish (OI-4) | Deferred | Cosmetic |
| Two-graphic mute icons + bubble-header icon convention (OI-4) | Deferred | Cosmetic |
| Ear/TTS/Mute wording (B7) | Deferred | Cosmetic |

## PART 17 — RELEASE CHAIN (named files, in order)

Each row: exact input → exact output, scope, visible/invisible, and WHY it is one release (combined by shared surface, separated by risk). Output of each row is the input of the next. Every output is a fully functional release worth a two-phone test. Releases are combined where they share a surface or gate, separated only where risk genuinely warrants an isolated gate.

| # | Input → Output | Scope | Visible? | Why one release |
|---|---|---|---|---|
| **R1a** | `bridge-turn09-ship.html` → `bridge-turn11a-base.html` | **Call-engine transplant ONLY, invisible.** Rip out turn09's thin ~290-line CALL object (2484–2774) and rebuild the donor `f403d70`'s robust call/video engine under turn09's single ownership: staged ICE-restart recovery (`runRecovery`), perfect-negotiation glare handling (`makingOffer`/polite peer), `replaceTrack` mute/unmute, force-reconnect on visibility/focus return, heartbeat-timeout reconnect. **Blast radius is the CALL object and its webrtc-signal handlers ONLY.** | **No** | One concern: restore call robustness. Diff confined to the call engine so the variance guardrail actually works. Any touched line outside the CALL object + its signal handlers = automatic red. |
| **R1b** | `bridge-turn11a-base.html` → `bridge-turn12-base.html` | **Layer-1 plumbing fixes, invisible.** Fresh-vs-existing-room transcription death; presence/delivered/read leave-return reliability (6.6); PB version-mgmt + no-data-loss + staleness; joiner history backfill; proactive relay reconnect; silent-cred surfacing; mute honored; pill call-kinds + single name-stamp; enter-in-source caret. | **No** | Plumbing fixes, each contained. Separate gate from the call transplant so a failure rolls back a contained change, not a 500-line tangle. |
| **R2** | `bridge-turn12-base.html` → `bridge-turn12-ship.html` | **The room card + everything on it — LIFTED FROM `bridge-turn10-pre-base.html`, NOT rebuilt.** turn10 already contains the finished §4 card (7-col × 2-row CSS grid, bold name + delete Row 1, elapsed + Me/Partner, three separately-tracked chat/voice/video badges greyed when zero, own/theirs flags, flat SVG icons, tap-to-reveal `rc-pop` popover) AND its badge tracking (`unreadChat/unreadCall/unreadVideo`). Transplant the card component + tracking + home summary + waiting-only home cards + dismissal rules. Rides along: room-name field at creation (net-new); appearance tone + font-color per side. **CAUTION: turn10 as a whole was a bust — lift only the card component and its tracking, do NOT adopt turn10 as a base.** | **Yes** | Card, badges, summary, name field are one surface. The card is a transplant of finished work, not a rebuild — same discipline as the phrasebook. |
| **R3** | `bridge-turn12-ship.html` → `bridge-turn13-base.html` | **Joiner parity — the full shell.** The joiner gets the complete app shell (room list, cards, drawer, phrasebook, transcript) at parity with the initiator. This is the release that makes them install the app. **Mic-centered-in-ribbon rides here** (one-line ribbon change, on written approval) since this release already touches the shell. | **Yes** | Isolated because parity is a large, real surface and deserves its own gate. Mic move folds in rather than being its own release. |
| **R4** | `bridge-turn13-base.html` → `bridge-turn13-ship.html` | **Initiator elevation, full (Part 13).** The grant toggle at room creation (net-new, rides here because it's meaningless without elevation) + credential-carrying grant link + expiry picker + credential-removal-drives-everything mechanism (+ disappears, STT/translation stop as consequences). Plus per-room export/delete + delete/restore send-lock ("left the chat"/"rejoined"), which shares the room-control surface. | **Yes** | Highest-trust/security surface — deliberately isolated for its own hard gate. Grant toggle and room delete/restore share this surface. |
| **R5** | `bridge-turn13-ship.html` → `bridge-turn14-base.html` | **OS device push — the standalone finale.** Locked/backgrounded push: service worker registered from the file + relay change + iOS home-screen PWA install. | **Yes** | The only release needing the relay modification and a locked-phone gate. Always was the last, standalone release. |
| **later, if wanted** | — | localStorage → IndexedDB (invisible architectural, its own release when scale demands); deferred cosmetics (icon-graphics/flag-motif polish, two-graphic mute icons, Ear/TTS/Mute wording). | mixed | Not in the critical path; sequenced only if/when needed, not part of the 5 you test. |

**Five releases you test, not ten.** Two invisible plumbing gates folded into one (R1); card + badges + summary + name-field + appearance as one surface (R2); joiner parity with the mic move folded in (R3); elevation with its grant toggle and room delete/restore (R4); OS push alone (R5).

**Rule:** these filenames are fixed. A failed device gate rolls back and rebuilds to the SAME output filename from the SAME input — the chain does not renumber on failure, and that release's open-items list (Part 18) is the rebuild checklist.

**Rule:** these filenames are fixed. If a release fails its device gate, it rolls back and rebuilds to the SAME output filename from the SAME input — the chain does not renumber on failure, and the open-items list for that release (Part 18) is the rebuild checklist.

---

## PART 18 — BUILD LOG (filled during build; the diff-guardrail audit trail)

One block per release. The projected diff is written and timestamped BEFORE any code is written. The actual diff is written and timestamped AFTER building, BEFORE push. Both timestamps must show the projection preceding the actual, with development in between — this ordering is the proof the gate wasn't pencil-whipped. Open items carry a status column (OPEN/CLOSED) and become the checklist if the release is rebuilt.

### R1a — `bridge-turn09-ship.html` → `bridge-turn11a-base.html` (call-engine transplant, invisible)
- **Status:** PROJECTED (pre-build)
- **Projected diff** _(2026-08-03 22:52 UTC — written before any code):_
  - **File:** `bridge-turn09-ship.html` → new `bridge-turn11a-base.html`. Single file.
  - **Replaced:** the `CALL` object, turn09 lines 2484–2774 (~290 lines), swapped for the donor's robust engine re-implemented under turn09 ownership.
  - **Added in/around CALL:** `resetRecoveryState()` + `runRecovery(reason)` staged ICE-restart (~55); perfect-negotiation `makingOffer`/polite guard in offer/answer/signal paths (~15); `replaceTrack` mute/unmute (~30); `onconnectionstatechange`/`oniceconnectionstatechange` recovery wiring (~15); force-reconnect on visibility/focus return that reconciles the call (~15).
  - **Touched signal handlers (call dispatch only):** `call-start`/`call-accept`/`call-decline`/`call-end`/`webrtc-signal`/`mic-state`/`cam-state` branches in `handleRelay` (~1011–1019) may gain fields the new engine expects (~10).
  - **Projected magnitude:** ~290 removed, ~430 added ≈ **~720 changed lines**, net +140. Base 3158 → ~3298 lines.
  - **Named blast radius — ONLY these may change:** the `CALL` object; the call-*/webrtc-signal branches of `handleRelay`; call-button/hangup/ring listeners if a signature changed. **Automatic RED if the diff touches:** ribbon markup/CSS, room card, phrasebook, compose strip, search, transcript rendering, drawer, home/panel, room creation, appearance — any surface outside the call engine.
- **Actual diff** _(timestamp on entry):_ _(pending — after build, before push)_
- **Delta / Delta% / Verdict:** _(pending — green ≤5% / yellow ≤10% explain / red >10% or any out-of-blast-radius surface)_
- **Next step:** _(pending — proceed / explain variance / stop)_
- **Open items / questions (this release):**

  | # | Item / question | Status |
  |---|---|---|
  | 1 | Donor `partner-disconnected-overlay` (donor line 711) is arguably visible UI — include in R1a or defer to keep R1a invisible? Leaning DEFER. | OPEN |
  | 2 | Donor recovery uses `addDiagLog` not in turn09 — reroute to turn09 `log()`? Leaning yes. | OPEN |

### R1b — `bridge-turn11a-base.html` → `bridge-turn12-base.html` (Layer-1 plumbing fixes, invisible)
- **Status:** NOT STARTED (blocked on R1a device gate)
- **Projected diff:** _(written before R1b coding begins)_
- **Actual diff / Delta / Verdict / Next step:** _(pending)_
- **Open items / questions:**

  | # | Item / question | Status |
  |---|---|---|
  | _(none logged yet)_ | | |

### R2–R5
- **Status:** NOT STARTED. Build-log blocks created at the start of each release, same structure. Not pre-stubbed.

**End of SOT v1.**
