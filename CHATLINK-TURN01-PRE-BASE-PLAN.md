# Chatlink Turn 01 pre-base: standalone owner portal migration plan

Status: focused Turn 01 candidate implemented following the user's approval to proceed. The accepted chat-lab remains the behavioral baseline. See tests/chatlink/README.md for delivered scope, storage decisions, and test coverage.

Implementation scope update (2026-09-22): owner rail, room settings, durable conversations/drafts, safe switching, legacy import, trash/restore, and export are included. Advanced backup restore/conflicts and multi-tab takeover are deferred as agreed. Storage v1 uses transactional per-room IndexedDB records rather than separate message/draft stores; a Web Lock prevents competing writers. The detailed original plan below remains the design reference; the implementation README records these explicit refinements.
Target application: **`chatlink-turn01-pre-base.html`**.
Plan owner: implementation agent, responsible for engineering, interim testing, and release verification.
Repository source review pinned to **70258f801f0b37b7409eec2795bb97e9633ece18**.

## 1. Product decision and scope

Create one standalone tabletop conversation application: the passed chat-lab conversation experience, a chat-admin-like room manager, and the visual structure of test.html. The device owner is South; the partner is North. The owner opens a left rail through a hamburger at the **bottom-left of the South-facing screen**. A **+ inside the open rail** creates a conversation. Multiple conversations, their individual languages, drafts, settings, and histories are retained in the same browser on the device.

The owner's management surface must never be duplicated on North, rotated with North, or moved to the top ribbon copied from test.html. The room list is collapsed during conversation. The existing opposed North/South conversation panes and their input behavior remain the main workspace.

Turn 01 includes room creation, selection, renaming, per-room settings, retention, trash/restore, import from existing donor data, backup/export, and owner-only management UI. It does not introduce accounts, cross-device synchronization, invitations, remote participants, a new speech provider, a new translation engine, or a redesigned swipe recognizer.

English next-word prediction and the passed keyboard improvements remain. Retain all currently available donor language behavior without claiming every language's keyboard is complete. The wider language rollout remains a subsequent workstream; Chinese enhancements remain last. Existing Chinese histories must still import and display without loss.

## 2. Verified donor inventory

| Donor | Pin and source | Adopt | Do not transplant |
| --- | --- | --- | --- |
| chat-lab.html | [source](https://github.com/acmeproducts/stuff/blob/70258f801f0b37b7409eec2795bb97e9633ece18/chat-lab.html), blob `dc6d75eaa53990663c6ebc081f23b2f49a41e95c` | Passed tabletop layout, North/South ownership, STT and audio graph, normalization including Northern Thai, translation, TTS, keyboard/composition/correction/prediction | Automatic anonymous lab fallback as the permanent room manager; global-room persistence assumptions; 300-message retention cap |
| chat-admin.html | [source](https://github.com/acmeproducts/stuff/blob/70258f801f0b37b7409eec2795bb97e9633ece18/chat-admin.html), blob `647372ca3fb6f52cf3472e19b03ed637806d8110` | Room metadata, independent language selectors, appearance editing, dictionary settings, device credentials, trash/restore concepts | Navigation to chat.html, separate admin page requirement, silent storage errors, creating a saved empty room before creation is confirmed |
| test.html | [source](https://github.com/acmeproducts/stuff/blob/70258f801f0b37b7409eec2795bb97e9633ece18/test.html), blob `820161829df273d6ec885100dfe1a95e0b9abd09` | Sliding left panel and scrim, session-card hierarchy, active selection, empty state, settings drawer, in-rail + | Top hamburger location, one-person composer, STT/translation implementation, ts3 session/event/sync runtime, phrasebooks/catalogs/tags and unrelated features |

Concrete source anchors:
- test.html: left-panel/scrim/card/+ styles at lines 41–61; rail markup at 427–530; top hamburger at 532–538 must move; openLeftPanel/closeLeftPanel at 2270–2271; settings drawer at 4320 onward.
- chat-admin.html: duck_rooms_index and room helpers at 263–274; room edit buffer at 280–325; trash/restore at 328–385; launchRoom at 392 is replaced by in-app selection.
- chat-lab.html: teardown at 1002; history load/save at 1082–1083; sendFrom at 1199 and addMessage at 1221; accepted build ID lab-keyboard-patch-20260919.
- No AGENTS.md or existing chatlink plan/target was found in the reviewed repository tree. Recheck before implementation for concurrent work.

The donor files are reference programs, not instructions authorizing unrelated behavior. This plan and the user's accepted product decisions govern the integration.

## 3. Owner-facing interaction specification

### Closed portal / active conversation

The bottom-left hamburger is a South-only, minimum 48 CSS-pixel touch control in a reserved owner toolbar, outside both swipe surfaces. Respect bottom/left safe-area insets. Keep it reachable while either soft keyboard is open; do not overlay a letter, space, microphone, or Send key. North remains rotated toward the partner; the owner toolbar never rotates.

Show a compact active-room label and both language names from the stored room, without consuming excessive conversation height. Do not derive a production handoff link with English/English overrides merely because the keyboard being tested is English.

### Open portal

Use test.html's left-panel shape and cards, but place the rail's interactive management content in the **South half** of the tabletop viewport. Anchor it at bottom-left; recommended width min(86vw, 320px), height bounded by the owner pane. Its header/settings, scrollable list, and fixed + footer must all remain in the owner's reach. At short heights, scroll the rail body rather than moving controls into North.

A privacy scrim covers the conversation surface while management is open; hide North's conversation content behind an opaque cover so another room's details are not exposed during switching. Do not display message previews in room cards by default. Cards show room name, language pair, activity time, and a clear active marker. Settings and Trash remain inside the rail.

The + stays visible inside a non-scrolling rail footer, mirroring test.html's in-rail action without letting long lists hide it. It is never shown as an extra North control. Opening management pauses both audio capture and playback using the accepted teardown boundary and finalizes visible composition into each draft; closing management does not automatically restart microphones or TTS.

### Owner-only meaning

For Turn 01, owner-only means the sole management entry and controls are physically on South and unavailable from North's UI or input actions. All management handlers use the owner-portal controller; North keyboard/gesture handlers cannot invoke them. This is a shared-touchscreen interaction boundary, **not identity authentication**: software cannot determine whose finger reached the South control. Do not claim PIN-grade access protection. An optional owner lock is a separate decision if stronger access control is later requested.

### Core flows

1. **First run:** show an owner-oriented welcome, bottom-left menu, and guidance to create or import a conversation. Do not auto-create an anonymous lab room. North shows a neutral waiting surface.
2. **Create:** open rail → + → name (optional), Owner/South language, Partner/North language → Create. Defaults: English/Thai on a clean device; thereafter use the owner's chosen default language and last partner language with both explicitly shown. Persist only after Create succeeds. Cancel leaves no room or draft record.
3. **Select:** click a room card → complete the switch transaction → show that room → close rail. No separate page launch and no tab multiplication.
4. **Rename/appearance:** edit through the owner rail; Save commits, Cancel leaves the room unchanged.
5. **Language changes:** allow direct editing on an empty room. If messages exist, offer a new conversation with the chosen pair, preserving the existing conversation. Do not retroactively relabel messages or rerun historical normalization.
6. **Trash:** moving a room to Trash retains all messages, drafts, and settings. Trashing the active room returns to the welcome state rather than automatically showing another private conversation. Restore reuses the same ID and history.
7. **Permanent deletion:** available only in Trash with the room name and explicit confirmation; transactionally delete that room's data only. No bulk destructive reset in the primary flow.
8. **Reopen:** restore the last valid active room with both drafts and scroll positions; audio starts off. If the room was trashed/deleted, show welcome.
9. **Backup:** owner can export/import a versioned JSON backup with room/message counts and conflict preview. Exclude credentials and raw audio. File data is validated and rendered as text, never evaluated.

## 4. Composition architecture

Start by copying the **accepted chat-lab**, preserving its working engine. Add selected shell markup/styles from test.html and room-management behaviors from chat-admin. Never start from test.html and replace its composer with a keyboard while leaving its unrelated engine running.

The new HTML is the single entry point. It may keep established dictionary, fastText, and service dependencies already used by chat-lab; standalone means no prior visit to chat-admin is required, not that cloud STT/translation work offline. No runtime iframe or fetch/eval of any donor HTML.

Logical boundaries inside the target:
- **PortalShell:** owner toolbar, rail, scrim, focus, welcome and navigation state.
- **RoomRepository:** validated durable reads/writes, migration, backup and trash.
- **ConversationSession:** immutable room ID/language snapshot, drafts, scroll state, pending work and lifecycle generation.
- **LabEngineAdapter:** explicit lifecycle/persistence hooks around the accepted engine.
- **RoomSettings:** administration forms and validation adopted from chat-admin.
- **Diagnostics:** build ID, active room ID and operation outcomes; no keys, draft text, transcript payloads or raw gesture trails in remote diagnostics.

Keep selectors/CSS under a portal namespace. Preserve the lab keyboard's geometry, North rotation, pointer capture and suggestion behavior. Avoid global test.html CSS overriding .key, inputs, pane dimensions or bubble orientation.

## 5. Protect the accepted engine

Record source hashes and section boundaries before editing. Freeze recognition, normalization, translation retry/cache behavior, speech language selection, native/English arbitration, audio processing and TTS semantics. No STT/TTS feature work in this turn.

Changes required for multi-room support are permitted only at named boundaries: boot/room resolution, persistence, room selection, pending-message routing, and teardown. Document each changed boundary and compare behavior against the accepted donor. Byte identity is required for untouched engine sections; adapter changes require end-to-end behavior tests, not blanket claims that the entire file stayed identical.

Each submitted message captures roomId, originating side, source/target languages, messageId and session generation **before** asynchronous normalization or translation. All subsequent writes use that immutable context, not the global currently selected ROOM. Translation completion may update its originating room in storage, but must not render into or speak in another active room. A result arriving after trash/purge cannot recreate the deleted room. Existing speech keepMic behavior remains within the current active conversation; navigation intentionally releases it.

## 6. Durable storage and compatibility

Use a versioned **chatlink IndexedDB database** for new room/history data so rooms and messages can commit transactionally without localStorage's whole-history rewrite. Do not overwrite the donors' data during Turn 01.

| Store | Key | Minimum fields |
| --- | --- | --- |
| rooms | roomId | schemaVersion, label, southLang, northLang, appearance, createdAt, updatedAt, lastActivityAt, trashedAt, revision |
| messages | [roomId, messageId] | side, original/normalized text as currently available, src, tgt, translatedText, createdAt, status, revision |
| drafts | [roomId, side] | visible text, selection, updatedAt; no live IME internals |
| viewState | roomId | per-side scroll anchor/offset |
| appState | name | activeRoomId, owner defaults, migration journal/version |
| migrationMap | legacy source + ID | destination ID, source fingerprint, completedAt |

Message status distinguishes pending, complete and failed translation. Counts/activity derive from actual committed messages, not stale admin count values. Render a paginated window for performance; **never use rendering limits as deletion limits**. Remove the lab's silent HIST.slice(-300) retention truncation at the repository adapter. Histories persist until the owner deletes them, subject to browser storage availability.

Handle quota/storage failure explicitly: retain unsaved content in memory, show a recoverable saving error, offer export/retry, and never show Saved before commit. Do not silently replace a corrupt database with empty data. Browser data clearing/private-mode expiry can remove local storage; describe this accurately in backup/settings copy. Do not claim device-wide storage across unrelated browsers or origins.

For multiple tabs, acquire a single writer lease per application and make another tab read-only with an explicit takeover action. Lease ownership and write revision checks must be enforced transactionally; BroadcastChannel is notification only. Lost ownership closes microphones and disables mutations. Do not copy test.html's entire synchronization runtime.

### Legacy migration

1. Inventory only documented donor keys: duck_rooms_index, duck_room_<id>, and a possible duck_room_lab orphan. Read device preferences/credentials through their existing names.
2. Validate room records/history independently. Present counts and malformed records before import; leave unreadable raw source data untouched and exportable.
3. Import once into IndexedDB using stable mappings and a migration journal; commit data before marking completion. Re-running after failure must not duplicate messages or rooms.
4. Preserve trashed state, timestamps, side, source/target language, translated text, and appearance. Existing legacy lab history with no index gets an explicit proposed import entry; do not guess ambiguous language pairs silently.
5. Never delete or rewrite legacy keys as part of import. Donor applications remain usable for rollback. Subsequent new-chatlink changes do not silently sync back to donor histories.
6. Do not import ts3_* histories from test.html: its data model is unrelated to this tabletop migration.
7. Keep tb_dg_key, duck_gh_pat and duck_haptic compatibility at the device-settings boundary; dictionary caches remain compatible. Show whether required STT configuration exists without exposing its value. Empty settings fields must not accidentally erase saved keys.
8. No credential in a shareable room URL, exported conversation or diagnostics. Existing keys remain in the same origin/browser; the migration does not copy them to another browser.

## 7. Room-switch transaction and race policy

Selected sequence:
1. Open owner management; finalize visible composition and save both drafts.
2. Teardown both microphones, sockets, timers, gesture capture and TTS. Clear candidate/undo/prediction transactions.
3. Flush committed message/draft writes. If persistence fails, keep the current room selected and show Retry/Cancel.
4. Advance the session generation and detach the active view. Pending translations retain their originating room context; navigation does not wait indefinitely on a remote service.
5. Load the target room and its own history/drafts/settings, then commit activeRoomId.
6. Bind the lab engine once, render the two sides and close management. Never restart audio automatically.

Test rapid A→B→A, switch during recognition/translation/composition, deleted targets, stale selected cards, reload while saving, and stale network results. Browser back/forward must use the same switch controller. A ?room= ID selects only a locally existing active room; missing IDs show a recoverable selection state rather than fabricating an anonymous room. Do not let s/n parameters override stored room languages.

## 8. Settings and visual behavior

Scope settings explicitly:
- Device: STT credential, optional diagnostic configuration, haptics and owner default language.
- Room: name, owner/partner language pair, existing donor appearance controls.
- Session: microphone ownership and TTS enablement; reset off on room change/reload.

Adopt test.html's cream/teal rail/card hierarchy while retaining lab pane readability and keyboard contrast. Keep independent North/South input languages and role labels. Owner forms follow the owner UI language; partner-facing controls follow the partner's language where donor labels exist. Do not swap language roles on rotation or room selection.

The rail uses a focus trap while open, Escape/backdrop dismissal, aria-expanded on the hamburger, and focus return to its trigger. Background conversation controls are inert while management is open. Under reduced motion, remove sliding animation. Verify 360×640, 390×844, 412×915 and tablet layouts, safe areas, large text, landscape and the North transform.

## 9. Implementation sequence and release gates

| Stage | Work and output | Gate before next stage |
| --- | --- | --- |
| P0: freeze | Pin accepted donor files, store baseline fixtures/hashes, inventory donor APIs and keys | Baseline integration/keyboard tests reproducible; no donor edited |
| P1: shell | New target file based on lab; owner bottom-left trigger; test-like rail/cards/+; inert background | Both keyboard surfaces still pass; all management controls stay South in viewport matrix |
| P2: repository | IndexedDB schema, transactional CRUD, drafts, backup, quota/corruption handling, writer lease | Retention, crash/reload, migration idempotence and two-tab tests pass |
| P3: portal | Create/cancel/select/rename/settings/trash/restore flows using repository | Multiple rooms independently persist; no admin navigation; no empty room on Cancel |
| P4: lifecycle | Session adapter, immutable pending-message context, switch teardown and stale-result handling | A/B race suite passes with zero cross-room writes, speech or candidate edits |
| P5: regression | Full lab parity plus responsive and owner-rail end-to-end suite | All automated gates pass; known limitations recorded; evidence attached |
| P6: candidate | Publish only chatlink-turn01-pre-base.html and required scoped tests/assets | Hosted exact build verified; chat-lab/chat-admin/test donor hashes unchanged |

Implement and test each stage internally. The user evaluates the completed candidate; they are not the interim test harness. No stage ends with an unsupported “please test everything” handoff. If a paid/external service cannot be exercised, state the precise coverage limit and retain the automatic transport/response tests.

Commit by boundary so the storage, shell and lifecycle changes can be reviewed and reverted independently. Refresh main and compare donor hashes before implementation and publication; reconcile concurrent edits instead of overwriting them.

## 10. Mandatory automated acceptance suite

Extend the existing tests/chat-keyboard suite with a tests/chatlink suite. Use isolated browser profiles, synthetic microphone audio, controlled translation/STT responses, real pointer events and the actual dictionaries. Also run available browser engines; never label unexecuted Safari/iOS or physical-device checks as passed.

Required scenarios:
- First run opens without admin data; + creates a configured room; Cancel creates nothing.
- Two same-language rooms remain separate; English/Thai is never silently replaced by English/English.
- North has no menu/+ controls. Opening the owner rail suppresses background input and audio and returns focus correctly.
- Create three rooms, send messages on both sides, retain both drafts, switch/reload and verify exact history/settings isolation.
- Import normal, trashed, orphaned, malformed and partially migrated legacy fixtures; repeat import without duplicates and prove legacy data unchanged.
- Retain and reload at least 1,000 messages in one room and at least 20 rooms without truncation; paginate without changing stored counts.
- Rename, trash, restore, purge and import ID conflicts; purge cannot be undone by a late callback.
- Quota failure and interrupted transaction do not lose the previous committed state or claim unsaved data is saved.
- Two-tab writes cannot overwrite each other; takeover stops the prior tab's microphones.
- Swipe/completion/prediction/Undo on both sides; composition Send/Clear; stale candidates after navigation; geometry after drawer close.
- Synthetic PCM reaches the expected STT sockets; final transcripts normalize and translate; mic ownership persists within the conversation.
- Thai native plus English arbitration, Northern Thai normalization, code-switch normalization, translation retries, TTS routing and no autoplay after navigation.
- Delayed A translation while B is active saves only to A; delayed speech after teardown is ignored; A→B→A never duplicates handlers or messages.
- Backup/restore round-trip preserves data and excludes credentials. Imported HTML/script strings render as text.
- Invalid/missing room IDs and back/forward navigation cannot start anonymous rooms or leak an unrelated history.
- Compare functional outputs against the accepted lab, with explicit adapters excluded from source-identity assertions.

Performance targets, measured on the same reference browser/device profile: no more than 20% regression against lab swipe-release latency; owner rail interaction under 100 ms excluding animation; room first paint under 300 ms for a paginated history. Report p50/p95 with fixture size and hardware, not one favorable timing. A failing target gets investigated before candidate publication.

## 11. Candidate delivery and rollback

Application implementation is a future step; this request publishes the plan only. The target name is reserved and must be exact. Do not redirect or replace chat-lab.html, chat-admin.html, test.html or chat.html when building the new target.

At candidate delivery provide the hosted target URL, build ID/commit, test report, donor-preservation report, migration counts and known limitations. Verify the live target after Pages completes, rather than linking an undeployed branch or a language-forcing demo URL. Account-backed STT availability is distinct from synthetic pipeline coverage.

Rollback means reopening the accepted chat-lab donor and disabling the candidate; legacy data remains untouched. New IndexedDB conversations must remain exportable even if the portal is rolled back. Do not promise that donor apps will automatically display conversations created only in Chatlink.

## 12. Decision record

Confirmed by the user:
- chat-lab has passed.
- Build a chat-admin-like portal in the shape of test.html.
- Hamburger at bottom-left, accessible from the device-owner side only.
- + inside the open left rail creates rooms.
- Multiple conversations retained and managed on a given device.
- Target chatlink-turn01-pre-base.html; publish a comprehensive repository plan.

Chosen for implementation planning:
- South-bounded management rail and privacy cover, keeping all management actions in the owner region.
- One application entry point; lab engine is the donor of record.
- IndexedDB for transactional retention; non-destructive import of legacy localStorage.
- Explicit session isolation for pending work; one active writer per browser profile.
- No new room-language mutation over existing history; create another room for a changed pair.
- Owner-only is a positional UI boundary; stronger authentication remains separately scoped.

These choices are concrete defaults, not requests for the user to design the implementation. Revisit only if implementation evidence exposes a conflict with the confirmed requirements.


## 13. Browser-only audio turn-control update (2026-09-23)

This is a controlled future update to **chat-test.html only**. It does not authorize changes to chat-lab.html, chatlink-turn01-pre-base.html, chat-admin.html, test.html, translation, normalization, keyboard behavior, room storage, or accepted STT/TTS transport outside the named audio boundary.

### Product behavior

Both South and North microphones remain available by default. Each side has an independent user mute control. When a side’s TTS begins, that side enters 'tts-playing'; its microphone hardware may remain open, but captured frames are not sent to Deepgram. A subtle pause cue may play; it is short, low-volume, optional, configurable, and never submitted as speech. While TTS is playing, captured audio is discarded. No local microphone buffer is retained, replayed, or translated later. When TTS ends, wait only for a small configurable speaker-decay interval, emit an optional subtle resume cue, then return that side to 'stt-listening'. The translation itself is the primary turn signal. If a side is muted, its STT submission remains disabled regardless of TTS state.

### Ownership and existing pipeline

When both sides are unmuted and neither side is playing TTS, ownership may be determined from the configured North/South language pair and active conversation state. Configured languages are authoritative; language detection is confirmation/fallback, not the sole router. Add a short ownership lock to prevent rapid side switching within one utterance. Same-language ambiguity remains an explicit limitation and must not be hidden by normalization.

Capture ownership metadata before normalization: side, room/session generation, source language, target language, timestamp, confidence, and TTS state. Normalization, translation, and TTS remain downstream and unchanged. The normalizer must not decide transcript ownership.

### Diagnostics

The existing debug log under configuration must record mic-open, user-mute, tts-start, stt-submit-blocked, tts-end, resume-delay, stt-submit-resumed, cue-played, transcript-routed, and low-confidence-owner. Log timestamps, side, session generation, and reason; never log API keys or raw audio.

### Scope fence and regression policy

The first implementation may edit only the controlled audio/state code and existing diagnostics in chat-test.html. No donor file, accepted portal, keyboard, prediction, normalization, translation, room model, or layout may change. Do not add buffering, PTT, acoustic AEC, a new TTS provider, new language support, or a new external dependency. Do not deploy until all gates pass.

### Acceptance gates

1. Existing chat-test English STT, translation, normalization, TTS, keyboard, prediction, mute, room, and debug-log tests pass unchanged.
2. TTS start blocks only that side’s Deepgram submission; the opposite side remains available.
3. TTS end resumes submission exactly once after the decay interval; repeated callbacks create no duplicate sockets, cues, or handlers.
4. No captured frame from a TTS window is submitted or replayed afterward.
5. User mute overrides automatic resume and survives TTS start/end.
6. Cues are optional, subtle, and absent from the submitted STT stream.
7. A/B/A room and reload lifecycle tests show no stale audio state crossing sessions.
8. Existing normalization and translation fixtures remain behavior-equivalent.
9. Diff is limited to chat-test.html and scoped tests/fixtures; donor hashes and chatlink-turn01-pre-base.html remain unchanged.
10. Hosted candidate is checked only after automated gates pass; failed candidates remain unpublished.

Implementation is paused at this plan-review checkpoint. The next code change is a test-first patch to chat-test.html against these gates.


### Logging amendment: positive and error outcomes (2026-09-23)

Every controlled audio action must produce an explicit result record. An event that only says an action was attempted is insufficient. The debug log must distinguish successful completion, expected blocking, and failure.

For each event, record: timestamp, side, room/session generation, event name, outcome (`ok`, `blocked`, or `error`), reason/code, and relevant state before/after. Never record API keys, raw audio, or full credential values.

Required positive records include: mic opened, mic muted by user, TTS started, STT submission blocked for TTS, pause cue played, TTS ended, decay interval completed, resume cue played, STT submission resumed, transcript accepted, transcript routed to North or South, normalization completed, translation completed, and TTS completed.

Required error or blocked records include: microphone permission denied, microphone open failed, socket unavailable, socket send failed, STT blocked because TTS is active, user mute blocked resume, TTS start failed, TTS playback failed, TTS cancelled, cue playback unavailable, resume timer cancelled or duplicated, transcript rejected, owner confidence below threshold, normalization failed, translation failed, and stale session result discarded. Expected blocking must be visibly different from an unexpected error.

Acceptance additions: automated tests must assert at least one successful and one blocked/error log for every state transition; force microphone, socket, TTS, cue, routing, normalization, translation, and stale-session failures; verify log ordering and side/session attribution; verify a failed transition cannot silently leave the opposite state active. The debug panel must show outcome and reason, and copy/download must preserve them.


### Design amendment: turn tones, echo filter and speaker routing (2026-09-23)

This amendment supersedes conflicting lines above. Target remains **chat-test.html only** (lineage: chat-lab → chatlink-turn01-pre-base → chat-test). Goal: zero-friction conversation; anything the user must do to hold a normal conversation is a defect.

**Input modes (device setting, "Microphone mode").**
- `open` (default): both sides listen continuously. Each side's existing mic button is that side's mute. No asking, no tapping to talk. Typing does not close the microphones.
- `ask`: the current behavior, kept intact: one owner, ask/allow permission, mic open until closed. Turn gating and the echo filter below apply in both modes.
- A room whose North and South languages are the same cannot be routed by language, so it runs in `ask` mode automatically, with one visible note and a log record.

**Turn gate (one device, one speaker).** The phone has one microphone and one speaker, so any read-aloud playback pauses STT submission for both sides. Microphones stay physically open. Captured frames during playback are replaced with silence on the socket (keeps the Deepgram connection alive) and are never kept, buffered or replayed. On playback end: wait the resume delay (default 300 ms), play the "speak" tone, and resume submission only after the tone finishes, so the tone never reaches STT. Duplicate or stale end callbacks are ignored.

**Tones.** Played only when read-aloud is on for either side. They are soft, short (about 0.4 s), and distinct by pitch, not loudness. "Wait" is a descending two-note tone at TTS start; "speak" is an ascending two-note tone at resume. A low single "bong" means the app was unsure who spoke and put the text in a compose box. Settings: tones on/off, volume. Web Audio only, with no new dependency.

**Speaker routing: all before normalization.** In `open` mode each side's socket listens in its own configured language on the same microphone. Finals arriving within a short window are grouped as one utterance and decided in this order:
1. Echo filter: text matching something read aloud in the last 20 s is dropped (`transcript-rejected`, reason `echo`). Applies in both modes.
2. Script: characters unique to one side's language (Thai, CJK, kana, Hangul, Arabic, Devanagari, Cyrillic) decide the owner.
3. Language match and Deepgram confidence: a candidate is owned by the side whose language it was heard in; highest confidence wins.
4. Ownership lock (1.5 s) keeps one utterance on one side; after it expires, turn order leans toward the other person.
5. Still unsure (score below threshold or too close): the raw text goes into the likelier side's compose box unsent, and the "bong" plays (`low-confidence-owner`).

Ownership metadata (side, generation, source/target language, time, confidence, TTS state, reason) is captured before `portal.submit`. Normalization, translation and storage stay unchanged downstream.

**Logging.** Every event above records `ok`, `blocked` or `error` with side, generation, reason and before/after state, in the existing debug log. The debug panel gets Download next to Copy. No keys or audio are logged.

**Removed.** The earlier "Queue until gap / Hold" playback experiment in chat-test.html is replaced by this design.

**Status (2026-09-23).** Implemented directly in chat-test.html (single file, no build step). Automated gates pass: 18 controller tests; 13/13 Chatlink scenarios in ask mode; 11 unchanged + 3 new scenarios in open mode; 32/32 keyboard scenarios. The two ask-only mic scenarios are replaced in open mode by the new scenarios. chatlink-turn01-pre-base.html and donor files are unchanged. A device trial is pending.

**Out of scope, recorded.** Voice fingerprinting (needs enrollment), mic-direction detection (browsers expose one channel), Deepgram auto-detect as the sole router (no Thai), buffering, PTT, new providers.


### chat-test r3: translation quality and owner field-test fixes (2026-09-29)

**Owner report (field test).** Speaker detection passed. English→Korean is understood, but Korean→English comes out flat and basic: a rich sentence becomes two or three words. Owner also asked for UI, tone and diagnostics changes (items 1–10 below). Owner decided on Google only for now; paid AI translation is backlogged for field testing of utility vs cost.

**Causes and changes**
- *Flat Korean translations.* Cause: MyMemory returns the closest stored translation-memory entry, which for Korean is often a short fragment. Change: Google Translate (free, no key) is tried first, with MyMemory as a logged fallback. Evidence: automated test shows Google used first and MyMemory used when Google fails (HTTP 429).
- *Korean sentences cut up.* Cause: Deepgram ended a sentence after 0.4 s of silence. Change: 1.0 s for Korean; punctuation on for all languages.
- *Unclear whether STT or translation is wrong.* Change: the speaker's own bubble shows "Heard: …" when normalization changed their words.
- *Item 3, South mic meter dead.* Cause: one shared meter; North attaching detached South's. Change: one meter per side. A/B check on phone viewport: r2 South=0 / North=0.056; r3 South=0.064 / North=0.064.
- *Items 1–2.* The hamburger footer is removed. A right swipe from the left edge of the South transcript (within 56 px) opens the rail, which closes with its × button. With no room open, the same swipe works on the lower half of the screen.
- *Item 4.* A circled ↓ shows on a transcript scrolled more than 160 px above the latest message. Tapping it scrolls to the latest.
- *Item 5.* Tone output gain ×1.5.
- *Items 6–7.* Import and Export are removed from Device settings, and so is the "deferred" note. The build ID stays.
- *Item 8.* "Export conversation" in each room's ⋯ settings downloads that room as JSON.
- *Item 9.* Deepgram connect/open/close (code and reason)/error/final and every translation (provider, ms, sizes, fallback, failure) are logged. Device settings → "Diagnostics log" opens a modal with Export, Copy, Clear and ×.
- *Item 10.* Start Speaking and Done Speaking tones are chosen from presets (Rising, Falling, Soft chime, Bell, Pop, Three-note up, No tone) or a custom uploaded audio file (≤ 400 KB, saved in browser storage, with a Play preview). A custom file that won't play falls back to the default tone, and listening still resumes.

**Gates (lab, Chromium, phone viewport).** 20/20 controller tests. Ask mode: 18/18, including 6 r3 scenarios. Open mode: 19/19. Keyboard: 32/32. Base chatlink-turn01-pre-base: 13/13, unchanged. **Not yet verified on the real phone:** Google translation quality for Korean, the edge swipe versus Android's back gesture (the swipe zone is 56 px so it can start inside the screen edge), and tone loudness.

**Graveyard (r3)**
- Hamburger ☰ and the sticky footer (room title, language pair, save state) are removed at the owner's request; the swipe replaces them. Save-state text is no longer shown; errors still appear in the rail.
- "Import from chat-admin / lab" is removed from settings. Its regression scenario is retired in the chat-test run and still runs against chatlink-turn01-pre-base.
- "Export conversations" (all rooms) is replaced by per-room export.
- MyMemory as the primary translator is buried for Korean quality; it remains the fallback only.
- Backlog: paid AI translation (Claude or Gemini) for field testing of utility vs cost; reining in the English side-channel on the Korean side (not approved in this round).


### chat-test r4: double-tap rail, cleaner jump button, back-translation check (2026-09-29)

**Owner request.**
1. Open the left rail with a double tap anywhere on the South transcript outside a chat bubble.
2. The jump arrow looked amateurish: it should be a blue filled circle with a white glyph and no border, matching the send button.
3. Double-tapping a bubble header back-translates the target into the source language and shows a modal with the source, target, back-translation and a match/partial/miss indication, plus Copy and ✕. This is critical for catching translation problems as they happen.

**Changes**
- Rail: a double tap (two taps within 350 ms and 30 px) on the South transcript outside a bubble opens it; with no conversation open, the lower half of the screen works. The North surface and bubbles don't open it. The second tap only has to be near the first, because the first tap can close the keyboard and shift the layout. The r3 edge swipe is removed.
- Jump button: 40 px circle with the send button's blue gradient, a white arrow icon, and no border.
- Translation check: a double tap on a bubble header opens the modal inside the reader's own pane, so the North reader sees it the right way up. It shows Source, Heard (if normalization changed it), Target, Back-translation, and a verdict: Match ≥ 80%, Partial ≥ 50%, Miss below that. The score is character-pair similarity between the source and the back-translation. Copy puts all fields and the verdict on the clipboard. Each check is logged as `bt_check` in the diagnostics log.

**Gates (lab, Chromium, phone viewport).** 20/20 controller tests. Ask mode: 21/21, including 3 r4 scenarios. Open mode: 22/22. Keyboard: 32/32. Base chatlink-turn01-pre-base: 13/13, unchanged. **Not verified on the phone:** the double tap versus the browser's own double-tap handling, and back-translation quality for Korean.

**Graveyard (r4)**
- The r3 left-edge swipe to open the rail is replaced by the double tap at the owner's request. The swipe also risked clashing with Android's back gesture.
- The r3 outlined teal jump button is replaced by the blue filled button.


### chat-test r5: translation-check layout (2026-09-29)

**Owner report.** A check scored "Partial · 75%" although the back-translation has the same meaning. The owner asked for the back-translation to sit under the source so the two can be compared by eye.

**Cause.** The score measures wording overlap (character pairs), not meaning. Source ดูว่า**เป็นการ**หยุดทดสอบหรือไม่ vs back-translation ดูว่า**มัน**หยุด**การ**ทดสอบหรือไม่: the same meaning in different words scores 75%.

**Change.**
- Order is now Source, Back-translation, Target, Heard. Copy uses the same order.
- The "Heard" label no longer claims a language, because in the owner's example the heard text was English on the Thai side.
- A one-line note says the score compares wording, not meaning.
- Thresholds are unchanged pending more field samples.

**Gates (lab).** 20/20 controller tests. Ask mode: 21/21. Open mode and keyboard were re-run before push.


### chat-test r6: translation check starts from the spoken words; matrix layout (2026-09-29)

**Owner report.** The check showed Source (Thai) "โอเคตอนนี้เรามาลองกับช่องว่าง", Back-translation (Thai), Target (English) "Okay, now let's try with the gap.", Heard "okay now let's try with the gap", and scored Partial 53%. The owner said: "SOURCE IS ENGLISH therefore backtranslate should also be ENGLISH", and asked for a matrix with zebra stripes.

**Cause.** When English is spoken on the Thai side, normalization rewrites it into Thai before translating. The r4/r5 check treated that Thai rewrite as the source and back-translated into Thai, so it compared a machine rewrite with a machine rewrite.

**Change.**
- The check now starts from the spoken words. If normalization rewrote them, the spoken language is detected (script first, then the language model with a 2 s cap; Latin-script speech falls back to the other side's language, or English). The back-translation goes into that language.
- When the spoken language equals the target language, no back-translation is needed and the target is compared directly ("same as target").
- The modal is a zebra-striped matrix: Spoken, Back-translation, Target, then Normalized (only when a rewrite happened). Each row shows its language, and Copy uses the same rows.
- The owner's example now scores Match 100%.

**Gates (lab).** 20/20 controller tests. Ask mode: 22/22, including a scenario built from the owner's example. Open mode: 23/23. Keyboard: 32/32.

**Open question for field data.** Why English speech lands on the Thai side (the owner speaking English there, or routing). Diagnostics `audio:transcript-routed` records which side and why.


### chat-test r7: route recorded on every message (2026-09-29)

**Owner request.** Trace why English speech ends up on the Thai side.

**Evidence available.**
- No device log has reached a place I can read: the relay behind talkbridge/DEVICE-LOG.md returns "Not found", and chat-test keeps its log on the phone only.
- Uploading chat-test logs to the repo automatically was blocked by the session's safety check, so it has not been built.
- From the owner's examples:
  - the first was dated Sep 22 (before r3);
  - the spoken text was lowercase with no punctuation, and Deepgram punctuation was off before r3;
  - older builds were ask-mode only, and in ask mode a Thai-side mic (th is in DG_DUAL_LANGS) runs an English side-channel whose results are posted as that side's message.

  Most likely path: North held the mic, English speech was caught by North's English side-channel, it was posted as North, then normalized into Thai. In open mode (r2+), English side-channel results route to the English side instead. **Not confirmed on the device.**

**Change.** Every new message stores its route: voice or keyboard, mic channel, heard language, confidence, mode, and deciding rule with scores. The translation check shows it as a "Route" row, and Copy includes it. `route` is also logged in the diagnostics log.

**Gates (lab).** 20/20 controller tests. Ask mode: 23/23, including an r7 route scenario. Open mode: 24/24. Keyboard: 32/32.


### chat-test r8: join a sentence split mid-way (2026-09-29)

**Owner report (field).** "Sometimes I feel like I could probably fall asleep but/however I have to go to work now" was played in Korean to the phone and arrived as two messages. The first was "가끔은 … 기분이 들기도 하지만" ("… but"), translated as "Sometimes I feel like I can fall asleep", with the contrast lost. The second was "지금은 출근해야 해요." Route rows show voice, north (Korean), confidence 1 and correct routing.

**Cause.** Deepgram ended the utterance at the pause after "하지만". Each half was then translated alone.

**Change.** After the speaker is decided, a final with no sentence-ending punctuation is held for up to 1.5 s (joinMs) and joined with that speaker's next final. Thai is never held because it has no sentence punctuation. Any held fragment is released when read-aloud starts and discarded on room switch or other lifecycle teardown. Route shows `joined` when parts were combined.
- A first version joined before the speaker decision. It sent English to the wrong side in open mode, because one mic's text was held and the other's was not. The join was moved after the decision.

**Evidence.** A new scenario built from the owner's example fails on r7 (2 messages) and passes on r8 (1 message).

**Note on the verdicts.** "지금은 출근해야 해요" vs "나는 지금 일하러 가야 해요" scored Miss 33% though the meaning is the same. The score measures wording, and Korean paraphrase changes most of the characters. Meaning-level checking needs an AI judge, which is backlogged under paid AI (owner decision).

**Gates (lab).** 23/23 controller tests (existing tests now use punctuated text, as Deepgram produces since r3). Ask mode: 24/24. Open mode: 25/25. Keyboard: 32/32 (r8 code before the final test was added).


### chat-test r9: AI keys tab (2026-09-29)

**Owner request.** Add Venice and OpenRouter API keys as their own tab in the settings, following devstream-test.html. Don't change translation-check grading yet: that comes in a later release, after the r8 fix has been field-tested.

**Change.**
- Device settings has two tabs: **Device** (unchanged) and **AI keys**.
- Each provider works as in devstream-test: key field, "Load … models", model picker, "Validate & save …" (1-token ping). The same 401/402 messages and key cleaning are used.
- Keys are saved only after a successful validation, to `chat_ai_cfg` on this device. They are prefilled from devstream's saved keys (`ds_cfg_v2`, same site), which are read but never modified.
- Keys are never logged (only provider, model and outcome).
- Nothing uses the keys yet.

**Gates (lab).** 23/23 controller tests. Ask mode: 25/25, including the r9 scenario with mocked providers. Open mode: 26/26. Keyboard: 32/32. The real Venice/OpenRouter endpoints were not called from the lab.


### chat-test r10: join window 1.5 s → 4 s (2026-09-29)

**Owner field log (r9).** `dg_final` for the first half (30 chars, no ending punctuation) arrived at 11:31:46. `fragment-held` fired at 11:31:47 and `fragment-released reason=timeout` at 11:31:48. The second half's `dg_final` came at 11:31:50, about 4 s after the first, so the two halves were sent separately.

**Cause.** The 1.5 s join window was shorter than the real gap. The gap is the speaking time of the second half plus Korean's 1 s end-of-speech wait plus Deepgram latency.

**Change.** Join window (joinMs) is now 4000 ms. Only finals without ending punctuation wait; complete sentences are still sent immediately.

**Evidence.** The r8 scenario now uses a 3.5 s gap. It fails on r9 (2 messages) and passes on r10 (1 message).

**Gates (lab).** 23/23 controller tests. Ask mode: 25/25. Open mode: 26/26. Keyboard: 32/32.
