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


### chat-test r11: stop duplicate English messages in open mode (2026-09-29)

**Owner report (field, r10).** "Inconsistent" results. The owner supplied a screenshot and the full diagnostics log.

**Findings from the log.**
1. *Duplicate English messages (bug).* At 11:49:46 South's English mic produced a final, which was routed south. At 11:49:48 the same sentence arrived from the Korean side's English side-channel (`pipe north, heardAs en`). That is 2 s later, outside the 700 ms grouping window, so it was routed south a second time. Two `trans_ok en→ko` calls of 35 characters followed. The same happened at 11:51:42–43.
2. *One bubble vs two for the same Korean audio (not a bug).*
   - At 11:52:15–16 the first half had no period: it was held and joined into one message.
   - At 11:53:08–10 Deepgram put a period after "하마터면 잠들 뻔했어요." That is a complete sentence, so it was sent alone, followed by "하지만 이제 출근할 시간이에요."
   - Both translations are faithful ("I almost fell asleep." / "But now it's time to go to work."). Deepgram's punctuation of the pause varies from run to run.

**Change.** In open mode, a side whose partner speaks English no longer opens the extra English side-channel, because the partner's own mic already hears English. Ask mode keeps the side-channel for code-switching. This also cuts one Deepgram stream.

**Evidence.** The new scenario fails on r10 (2 English sockets) and passes on r11 (1).

**Gates (lab).** 23/23 controller tests. Ask mode: 26/26. Open mode: 27/27. Keyboard: 32/32.


### chat-test r12: one message per spoken turn, from Deepgram's end-of-speech signal (2026-09-29)

**Owner correction.** The audio was played through Google Translate, so every run had identical timing and tone. My r11 note blamed the pause, which was wrong: the input did not vary.

**Cause.** Deepgram's streaming output splits identical audio at different points on different runs. The field log shows a first final of 22 chars with no period in one run, and 13 chars ending in "." in another. r8/r10 joined halves only when a final lacked ending punctuation, so the result followed Deepgram's variation.

**Change.**
- The primary Deepgram socket now uses `interim_results=true&utterance_end_ms=` (1500 ms for Korean, 1000 ms otherwise).
- Finals are collected and sent as one message when Deepgram sends `UtteranceEnd`, which it computes from word timings in the audio rather than from punctuation. A 4 s fallback covers a missing UtteranceEnd.
- Each flush is logged as `dg_utterance` (parts, reason).
- The r8/r10 punctuation join in the controller is removed.
- The English side-channel is unchanged.

**Evidence.** A new scenario plays both observed splits, one with a period mid-turn and one without. On r12 both give a single message; on r11 the with-period split gave two.

**Graveyard (r12).** The punctuation-based join (r8, window raised in r10) is removed and replaced by UtteranceEnd.

**Gates (lab).** 20/20 controller tests (3 join tests retired with the feature). Ask mode: 27/27. Open mode: 28/28. Keyboard: 32/32. **Not verified:** Deepgram's real UtteranceEnd timing for the owner's audio.


### chat-test r13: hide the end-of-turn wait (2026-09-29)

**Owner report.** The r12 wait for end of speech "breaks up the conversation considerably". The owner approved three changes.

**Change.**
1. *Live bubble.* Deepgram interim results show the speaker's words at once, in a faded dashed bubble on both panes. The listener's pane shows the rough translation as its main line. The side is picked by the same confidence and script test as routing, and the bubble disappears when the real message lands.
2. *Background translation.* Each time a part of the turn is settled (a Deepgram final), the text so far is translated in the background. When the turn ends, the message's translation is usually a cache hit. The lab scenario shows the full turn translated exactly once, before the message was created.
3. *Korean end-of-speech wait* is 1000 ms (Deepgram's minimum), down from 1500 ms. All languages now use 1000 ms.

One message per spoken turn is unchanged.

**Gates (lab).** 20/20 controller tests. Ask mode: 28/28, including the r13 scenario. Open mode: 29/29. Keyboard: 32/32. **Not verified on the phone:** real interim-result timing and how the live bubble feels in conversation.


### chat-test r14: double-tap rail works on phones (2026-10-02)

**Owner report.** Double-tapping does nothing on the phone.

**Cause (reproduced on emulated Pixel 7 and iPhone 13 touchscreens).** The second tap's `pointerup` opens the rail. The browser's follow-up `click` for that same tap then arrives at the same spot, which by now is the rail's cover (`#cl-cover`), and a cover click closes the rail, so the rail opens and shuts instantly. Mouse tests in the lab never showed this, because a mouse click targets the element under the press.

**Change.** For 600 ms after a double-tap opens the rail, one click on the cover is ignored (logged `rail_ghost_click_ignored`). Later taps on the cover still close the rail.

**Evidence.** Emulated phones: r13 open=false on both; r14 open=true on both. A new touch scenario (touchscreen.tap ×2) asserts the rail stays open and that a later cover tap still closes it.

**Gates (lab).** 20/20 controller tests. Ask mode: 29/29. Open mode: 30/30. Keyboard: 32/32. **Not verified on the owner's real phone.**


### chat-test r15: AI meaning check and suggested fix in the translation check (2026-10-02)

**Owner request.** Use AI to judge back-translation accuracy and help correct it. Approved design: AI runs only when the owner opens a check, using the saved Venice key with OpenRouter as backup.

**Change.**
- When a translation check opens and an AI key is saved, the app asks the model (chat completions, temperature 0) for `{verdict, reason, suggestion}` on meaning, given the spoken text and the translation. Venice is tried first; OpenRouter is used if Venice fails (e.g. 402).
- The AI verdict (Match/Partial/Miss) and its one-line reason lead the check. The character score stays as a secondary "Wording" line.
- If the AI suggests a different translation, "Use this translation" replaces the message's translation. The original is kept in `trOriginal`, the source in `trBy` (`ai:<provider>`), and the new text is read aloud if read-aloud is on.
- Copy includes the AI verdict, reason and suggestion.
- Logged as `ai_review` and `ai_fix_applied` with provider, model, verdict and ms. Keys and text are never logged.
- Without a key, the check says "AI review: add a key in Settings → AI keys" and makes no call.

**Gates (lab, mocked providers).** 20/20 controller tests. Ask mode: 31/31, including 2 r15 scenarios (Venice 402 → OpenRouter, apply fix; no key → no call). Open mode: 32/32. Keyboard: 32/32. **Not verified:** real model output quality and cost on the owner's keys.


### chat-test backlog (owner, 2026-10-02)

The owner confirmed that TTS and STT work on r15.

1. **Changing languages on a saved conversation differs by phone.** Android allows it; iPhone does not. The code disables both language pickers once a conversation has messages (by design, so history keeps its languages). To check: whether Android Chrome lets a disabled picker be changed, or whether that Android room had no messages yet. Decide one behaviour for both.
2. **Venice validation differs by phone.** iPhone says "not enough credits" (402); Android validates the same key. To check: the selected model (each phone defaults to the first loaded model, so they may differ) and the key actually used (Android may be prefilled from devstream). Show the model and the masked key in the result.
3. **Password-manager pollution.** Key fields are `type=password`, so Chrome offers to save them as passwords, which leaves junk in the password manager. Needed:
   - A standard review and remediation of every field that triggers a save prompt. Only real passwords should be password fields.
   - Owner direction: don't build our own key store in localStorage. Use the browser's own credential storage and sync across devices (e.g. the Credential Management API, `PasswordCredential`, stored deliberately under a clear name per service). Check first whether it is supported on iPhone Safari/Chrome, which may need a fallback.


### chat-test r16: backlog items 1–3 (2026-10-03)

**Owner decisions.**
1. Changing languages on a saved conversation is allowed, because some people are tri-lingual.
2. Validation must show which model and key were checked.
3. Remove password-field prompts, and use the browser's password manager and sync instead of a home-grown store.

**Changes.**
1. The language pickers stay enabled for conversations with messages. Earlier messages keep the languages they were spoken in (each message stores src/tgt), and a note says so. The base-suite assertion "Partner disabled" is flipped in the chat-test wrapper per this decision.
2. Venice/OpenRouter validation results now read "✓ verified & saved: <model> · key abcd…wxyz" or "✗ <error> — checked model <m> with key abcd…wxyz". Keys are masked to their first and last 4 characters.
3. *No password fields remain.* The Deepgram, Venice and OpenRouter key fields are masked text fields (`-webkit-text-security: disc`, autocomplete off, password-manager ignore hints), so Chrome no longer offers to save them.
4. *Deliberate sync.* AI keys tab → "Save keys to password manager" stores ONE named entry, "Chatlink API keys", through the Credential Management API (`PasswordCredential`). Chrome syncs it across signed-in devices. "Restore keys from password manager" asks the browser for it and refills this device. On browsers without the API (iPhone), a note says keys stay on this device. The app still keeps a working copy locally, because it needs the keys to run. Keys are never logged.

**Not done.** The junk password entries Chrome already saved from the old password fields must be deleted by the owner in Chrome's password manager (Settings → Passwords). I cannot remove them.

**Gates (lab).** 20/20 controller tests. Ask mode: 33/33, including 2 r16 scenarios. Open mode: 34/34. Keyboard: 32/32. The password-manager scenario uses a mocked `navigator.credentials`. **Not verified:** the real Chrome prompt and sync on the owner's devices.


### chat-test backlog (owner, 2026-10-03)

Recorded, not scheduled.

1. **Chinese keyboard (Track B, originated in `duck.md`).** Simplified pinyin input like Gboard, with next-word prediction and learning. Per the plan's scope note, Chinese enhancements come last, after the wider language rollout (items 2–3). Scope and source decision: see "Track B scope" at the end of this file.
2. **Malay is treated as Indonesian.** Make Malay a separate, distinct language. Both languages are needed.
3. **Keyboard coverage review.** Audit every supported language and make coverage full and complete. Start with Vietnamese, Indonesian and Khmer (Cambodian).
4. **TTS turns off when the keyboard is extended for North.** When both sides are talking, TTS switches off even though it was on beforehand. It must stay on.

### chat-test: backlog item 4, TTS cut when the keyboard opens (2026-10-03)

**Owner report.** With the keyboard open on North and both sides talking, read-aloud turns off though it was on.

**Cause (reproduced in the lab).** Opening a keyboard runs the input teardown, which cancelled any speech still playing. In open mode that cut the read-aloud mid-sentence. The speaker button state was never the problem.

**Change.** In open mode, a keyboard or mic handover no longer cancels speech. Room switch, closing the portal and the other lifecycle events still do. Ask mode behaves as before.

**Check added first.** "open mode: opening the North keyboard does not cut read-aloud that is playing" failed before the change (phase `idle` instead of `playing`) and passes after. A second check confirms the speaker buttons stay on across keyboard opens and messages from both sides.

**Gates (lab).** Open mode 36/36. Ask mode 33/33. Controller 20/20. Keyboard 32/32. **Not verified:** a real phone with the real speech engine.

### chat-test: backlog item 2, Malay treated as Indonesian (2026-10-03)

**Owner report.** Malay is being treated as Indonesian.

**Finding.** Not reproduced in `chat-test.html`. Malay (`ms`) and Indonesian (`id`) are separate in the language list, speech recognition (`ms` and `id`), read-aloud (`ms-MY` and `id-ID`), translation codes, keyboard layout and dictionary files (`dict/ms.json`, `dict/id.json`, about 60% shared words). Deepgram Nova-3 lists both languages. No code changed.

**Still open.** The owner's symptom is not yet pinned to a place. Next step is an on-device trial with Malay speech and typing, with the debug log copied from the app, to see where it becomes Indonesian. Not verified on a real phone.

### chat-test: backlog item 2 update, Indonesian rewritten into Malay (2026-10-03)

**Owner evidence (device log).** Indonesian speech "Ini sistem yang simple" in a Malay room was logged as Normalized (Malay): "Ini adalah sistem yang mudah". The words were changed.

**Cause.** The text is checked by a language detector, which reported Indonesian. The room said Malay, so the app "normalized" by translating Indonesian into Malay. A detector cannot reliably tell the two apart, and the rewrite replaced what the speaker said.

**Change.** Malay and Indonesian are treated as sibling languages at that one step: the room's chosen language decides, and the speaker's words are kept unchanged, in both directions. Everything else already kept them distinct (list, speech recognition, read-aloud, keyboard, dictionary).

**Check added first.** "Malay and Indonesian are sibling languages…" failed before the change (the Indonesian sentence came back rewritten) and passes after. Open mode 37/37, ask mode 33/33, controller 20/20. **Not verified:** a real phone.

**Separate finding, not fixed.** English to Malay "I'm saying something simple" gave "Saya mengatakan sesuatu yang mudah"; a Malay speaker called it a terrible translation. Cause not verified. It may be the provider's output (the progressive "sedang" is missing) or something in our path. Not language handling as far as the Malay/Indonesian fix goes. See `TRANSLATION-OVERLAY-PROPOSAL.md` for the proposed overlay of approved translations and a per-language check.

### chat-test: language check, step 1 of the overlay proposal (2026-10-03)

**What.** `tests/language-check/check.cjs` lists every selectable language (23) with its flag, speech-recognition code, read-aloud voice, keyboard and dictionary, and fails on any gap that is not on a written known-gaps list. A small read-only hook, `window.langCheck()`, exposes the table from the app. No behavior change.

**Run.** `NODE_PATH=$(npm root -g) CHAT_BROWSER_CHANNEL=chromium node tests/language-check/check.cjs`

**Result.** 20 of 23 languages are complete. Known gaps:
- **Khmer and Lao:** selectable, and have keyboards, but no speech-recognition code, no read-aloud voice entry and no dictionary. A room set to either will likely fail on the microphone; typing works. Not verified on a phone; whether Deepgram supports them is not confirmed.
- **Chinese (Simplified):** no dictionary, so no word prediction. This is the pinyin keyboard backlog item.

Malay and Indonesian are confirmed to have different speech, voice and translation codes.

**Not done yet.** Look-alike pair tests beyond Malay/Indonesian, the in-app "language check" button, the overlay itself, and the native-speaker phrase lists. Open mode 37/37, keyboard 32/32.

### chat-test: language check, fixes (2026-10-03)

**Owner direction.** Fix the gaps the language check found.

**Evidence.** Deepgram does not support Khmer or Lao (a published benchmark shows 100% word error on both for Nova-2; Nova-3's list does not include them). A room set to either sent a bogus language code to Deepgram.

**Changes.**
1. Khmer and Lao now have read-aloud voice codes (`km-KH`, `lo-LA`). Whether a phone has those voices installed is not verified.
2. A side whose language has no speech engine is no longer opened for listening, and pressing its mic shows "speech is not available yet, type instead". The other side keeps listening. Typing works as before.

**Check added first.** "a language with no speech engine (Khmer)…" failed before (a Khmer speech connection was opened) and passes after. Open mode 38/38, ask mode 33/33, keyboard 32/32, controller 20/20, language check OK.

**Still open, not fixable by a small change.**
- **Khmer and Lao speech and dictionaries.** Needs a different speech engine, for example the browser's own speech recognition (Chrome lists Khmer and Lao; not verified), and a word list per language. That is a new engine, so it needs the owner's go.
- **Chinese dictionary.** Part of the pinyin keyboard item.

### chat-test: ROLLED BACK to r16 (2026-10-03)

**Owner direction.** None of the changes made after r16 had been tested on a device. Go back to the last known good.

**Done.** `chat-test.html` and the audio-turn tests are restored byte-for-byte to commit `a568a3b` (r16). The language-check test is removed. Reverted, all untested on a device: TTS kept playing when a keyboard opens (#791), Malay/Indonesian words kept (#794), language coverage check hook (#796), Khmer/Lao voices and no-speech-connection (#797).

**What stays true.** The findings in the entries above are still valid as analysis, but their fixes are not in the app. They go back on the backlog, to be re-applied one at a time, each tested on a device before the next:
1. TTS cut when the keyboard opens (cause reproduced in the lab).
2. Indonesian rewritten into Malay in a Malay room (cause found).
3. Khmer and Lao: no speech engine (Deepgram does not support them).
4. Language coverage check.

### Language probe: which languages does Deepgram accept (2026-10-03)

**Owner direction.** Find out whether Khmer and Lao are the only transcription gaps. Do not change the app.

**What.** `langprobe.html` is a separate page; `chat-test.html` is untouched. For each of the 23 languages it opens a Deepgram connection on Nova-3, then Nova-2 if Nova-3 refuses, and closes it. No audio is sent and nothing is stored. It uses the key already saved in the browser (or one pasted for that run). Verdict per language: OK, Nova-2 only, NOT SUPPORTED, or UNCLEAR (retry).

**Verified.** The page logic only, in the lab against a stand-in connection whose accept list I made up for the test. **Not verified:** any real Deepgram result. The real answer comes from running it once on the owner's device: https://acmeproducts.github.io/stuff/langprobe.html

**Next.** The owner's results decide what is a real gap. Nothing else is queued; the rolled-back fixes return one at a time, each tested on a device first.

### Language probe: real Deepgram result (2026-10-03, owner's device)

20 of 23 languages are accepted on Nova-3. **Not supported on either model: Filipino (`fil`), Khmer (`km`), Lao (`lo`).** Everything else, including Thai, Korean, Chinese, Arabic, Vietnamese, Malay and Indonesian, is fine. The probe now also tries alternate codes (`tl`, `fil-PH`, `km-KH`, `lo-LA`) in case Deepgram lists them differently.

### chat-test: Filipino speech code (2026-10-03)

**Owner report.** The app used `fil` for Filipino speech; Deepgram wants `tl`.

**Evidence.** Probe on the owner's device: `fil` and `fil-PH` rejected on Nova-3 and Nova-2; `tl` accepted on Nova-3. Deepgram's changelog lists Tagalog as `tl`.

**Change.** Filipino speech now connects with `tl`. Nothing else changed (translation already used `tl`; read-aloud stays `fil-PH`).

**Check added first.** "Filipino listens with the code Deepgram accepts (tl), never fil" fails without the change and passes with it. Open mode 35/35, ask mode 33/33, keyboard 32/32, controller 20/20. **Not verified:** speaking Filipino on a phone.

**Still unsupported by Deepgram:** Khmer and Lao.

### Track B scope: Simplified Chinese pinyin input (2026-10-04)

**Origin.** `duck.md` Track B: pinyin to ranked candidate selection is an input engine, not a bigger word list, sequenced after Track A (dictionaries, shipped for 20 of 23 languages). Engine choice was left open. **Owner delegated the choice (2026-10-04).** Nothing is built.

**Decision: a small in-browser engine built from open data, not a native engine.**
- Word list with readings, ranked by frequency: the jieba word list (MIT) with each word's pinyin generated once at build time by pinyin-pro (MIT). Published as `dict/zh.json`, the same pattern as every other dictionary.
- Segmenting typed pinyin into syllables, and looking up ranked candidates, runs in plain JavaScript in the page. Works offline, no native build, no server.
- Next-word prediction and learning reuse the app's existing learned-word-pair mechanism (`dict/bigram-<lang>.json` pattern), so the keyboard improves with use, as asked.
- Why not the alternatives. libgooglepinyin (Apache-2.0) is a native C++ engine that would need compiling to WebAssembly. Rime is also native, and I found no evidence of a ready browser build. Both add a build toolchain and a large asset for a single language.
- **Fallback if lab quality is poor on full sentences:** compile libgooglepinyin to WebAssembly. Revisit only on evidence.

**Scope.**
1. Build `dict/zh.json` with readings (data only).
2. Pinyin input on the Chinese side's keyboard: type pinyin, see ranked candidates, tap to commit; learning from commits.
3. Next-word prediction after a committed word.
4. Existing Chinese histories must keep importing and displaying (already required by the plan).

**Gates before any build.** Each step lab-tested with a check written first, tested on a device by the owner before the next step. Not touched until the language rollout (backlog items 2 and 3) is done, per the owner's sequencing.

**Not verified.** Candidate quality, data size and phone performance. All unmeasured.

### chat-test: TTS cut when the keyboard opens, re-applied alone (2026-10-04)

**Why.** This fix was rolled back with the rest of the untested changes on 2026-10-03, which brought the owner's bug back. Owner asked for it to be re-applied by itself.

**Cause (reproduced in the lab).** Opening a keyboard ran the input teardown, which cancelled speech still playing, so read-aloud stopped mid-sentence in open mode.

**Change.** One line: in open mode a keyboard or mic handover no longer cancels speech. Room switch, closing the portal and the other lifecycle events still do. Ask mode is unchanged.

**Check added first.** "opening the North keyboard does not cut read-aloud that is playing, and the speaker button stays on" failed before the change (phase `idle` instead of `playing`) and passes after. Open mode 36/36, ask mode 33/33, keyboard 32/32, controller 20/20. **Not verified:** a real phone. **Owner to test:** turn read-aloud on for North, have South speak, and open North's keyboard while it is reading; the reading should continue.

**Still rolled back, one at a time later:** Indonesian/Malay word rewrite, language coverage check, Khmer and Lao handling.

### chat-test: who spoke, when both channels hear the same speech (2026-10-04)

**Owner report.** After the Filipino fix, speaking English sometimes landed in South's compose box with the low tone instead of being sent. It worked some times and not others. TTS fix confirmed passed on the device.

**Cause (from the device log).** One phone, two open microphones. The Filipino speech model also transcribes English with high confidence, because Filipino speech mixes English constantly. Both channels returned the same words (49 chars at 0.99 and 0.97, 31 chars at 0.96 and 0.81). The app picks the speaker by confidence plus a margin of 0.12; the scores were within it, so it gave up. When only one channel responded it routed correctly, which is why it was intermittent. English and Filipino share the Latin alphabet, so the script check cannot help.

**Change.** When both channels return nearly identical text and both scored above the threshold, the words decide: words found only in one side's word list count for that side. A clear winner is sent to that side. Words that fit neither or both languages change nothing and take the old path. The same logic covers Malay/Indonesian.

**Check added first.** Three cases: an English sentence returned by both channels goes to South; a Filipino sentence goes to North; "Okay thank you", which fits both lists, still goes to compose. The English case failed before the change. The test serves the real English and Filipino word lists, because the lab otherwise serves English for every language. Open mode 37/37, ask mode 33/33, keyboard 32/32, controller 20/20.

**Not verified.** A real phone. Owner to test: with English on South and Filipino on North, say several English sentences and several Filipino sentences; each should land on the right side. Short phrases that exist in both languages ("okay thank you") may still go to compose.

### chat-test: Malay/Indonesian rewrite fixed at the cause (2026-10-04)

**Owner direction.** Fix all remaining items; required, not optional.

**Cause.** After a message was routed, the app guessed its language again with a detector, even though the microphone channel it came from was already set to a known language. For Malay and Indonesian the guess was wrong, so the speaker's words were translated into the other language. TalkBridge passes the channel's language instead of guessing.

**Change.** (1) Voice messages now use the language of the channel they were heard on, as TalkBridge does. Code-switching still works: the English side-channel in ask mode reports English, which is still normalized into the room language. (2) Typed text, which has no channel, keeps the detector but never rewrites Malay into Indonesian or the reverse; the room's language decides.

**Check added first.** A Malay-room scenario failed before (the spoken words came back rewritten) and passes after. It also covers the typed case in both directions. Open mode 38/38, ask mode 33/33, keyboard 32/32, controller 20/20. **Not verified:** a real phone. Owner to test: speak Indonesian into a Malay room and check the Normalized row is gone.

### Khmer and Lao word lists (2026-10-04)

`dict/km.json` (32,369 words) and `dict/lo.json` (30,549 words) added so typing suggestions work for both languages, the same way as the other 20. Sources and licences (MIT for Khmer, LGPL for Lao) are in `dict/NOTICE-km-lo-zh.md`. Data only; no app code changed. **Not verified:** suggestion quality on a phone. Not yet word-pair (next-word) data; only English has that today.

### chat-test: Khmer and Lao speech, voices and language check (2026-10-04)

**Owner direction.** Fix all remaining items; required.

**Evidence.** Deepgram rejects Khmer and Lao (owner's probe run, 2026-10-03). Both need another engine at no cost.

**Changes.**
1. **Speech.** A room side set to Khmer or Lao now listens with the browser's own speech engine (`km-KH`, `lo-LA`) instead of Deepgram. Final phrases go through the same routing as every other language. The engine restarts itself after pauses, ignores speech while read-aloud is playing, and stops cleanly with a message ("speech is not supported in this browser, type instead") if the browser lacks the language. Works on Android Chrome where the engine exists; on iPhone the browser engine does not list these languages, so those users type. **Not verified on any phone.**
2. **Voices.** Khmer and Lao read-aloud codes (`km-KH`, `lo-LA`). Whether a phone has the voices installed is not verified.
3. **Language check.** `window.langCheck()` plus `tests/language-check/check.cjs` list all 23 languages with flag, speech, voice, keyboard and dictionary, and fail on any gap not on the known list. Known gap now: Chinese has no dictionary (Track B).

**Checks added first.** Both Khmer and Lao scenarios failed before. Open mode 40/40, ask mode 33/33, keyboard 32/32, controller 20/20, language check OK.

**Owner to test (Android Chrome).** Set North to Khmer, allow the microphone, speak Khmer: the text should appear on North and translate for South. If Chrome does not support Khmer on that phone, a toast says so. Whisper in the browser remains the later option if the browser engine is not good enough.

### chat-test: keyboard coverage review and fixes (2026-10-04)

**Owner direction.** Review keyboards for Vietnamese, Indonesian and Cambodian, and make coverage full and complete across all languages. Required.

**Method.** For every language with a dictionary, count the letters its words use (`dict/<lang>.json`) and list the ones the keyboard cannot type, keeping only letters native to the language (loanword noise left out). Everything below was a real gap; each was invisible until now.

**Findings.**
- **Vietnamese:** only 3 of 5 tone marks, on three vowels. Most Vietnamese letters (ế ố ì ệ ớ and about 60 more) could not be typed.
- **Khmer:** 13 vowels and letters missing (ើ ួ ឹ ៀ ឺ ៈ ឧ ឯ ឥ ឱ ឿ ឰ ឦ), including some of the most common.
- **Thai:** 10 missing, including บ (the most common missing letter), ถ, ุ ู ึ and the tone mark ๊.
- **Arabic:** د. **Hindi:** ष ः ॅ. **Russian:** ё ъ. **Lao:** ຽ.
- **French:** â ï ë. **Portuguese:** à. **Dutch:** ë é ï è ö ü á ó í. **Turkish:** â î û.
- **Indonesian:** nothing missing for Indonesian words. Only foreign names such as é appear and are left out.
- Japanese and Korean compose from romaji and jamo and are not affected. Chinese is Track B.

**Changes.** Each missing letter is on an extra key row at the bottom of its keyboard (the shifted layer shows capitals). Vietnamese gets a row of the five tone marks: tapping one puts the tone on the vowel just typed, replaces an existing tone, and is ignored after a consonant. The keyboard already caps at 55% of the screen height and scrolls inside, so taller layouts fit.

**Checks added first.** `tests/language-check/check.cjs` now fails if any listed letter cannot be typed, and checks every Vietnamese letter is reachable. A tone-typing scenario covers á, à, ạ, ệ and the consonant case. Both failed before. Open mode 41/41, ask mode 33/33, keyboard 32/32, controller 20/20, language check OK. **Not verified:** a real phone. Owner to test: type Vietnamese with the tone row, Khmer vowels, Thai บ.

### chat-test: Simplified Chinese pinyin input, Track B (2026-10-04)

**Owner direction.** Fix everything remaining; source decision delegated earlier (in-browser engine from open data).

**Data.** `dict/zh.json` (64,911 words) and `dict/zh-pinyin.json` (42,659 tone-less pinyin strings mapping to ranked words), from the jieba frequency list and pypinyin readings (both MIT; notice in `dict/NOTICE-km-lo-zh.md`). Single characters keep all common readings, ranked below the main one. Chinese now has a dictionary, so the language check has no known gaps left.

**Behaviour.** On a Chinese side the Latin keys build a pinyin buffer shown in the field. The candidate bar shows words for the whole buffer, then for its longest prefixes (so "nihaoma" offers 你好 first and keeps "ma" composing). Tapping a word, Space or Enter commits it; Enter commits the first word and does not send. Backspace edits the buffer. Punctuation commits the first word. Every pick is learned on the device: word counts re-rank later candidates, and word pairs drive next-word suggestions in the bar after a word is committed. Before the pinyin data loads, or if it fails, typing is plain letters as before.

**Check added first.** "Chinese pinyin: ranked candidates, partial picks, space/enter commit, backspace, learning and next-word suggestions" failed before (no pinyin support) and passes after. Open mode 42/42; ask mode, keyboard, controller and language check results in the commit.

**Limits, stated plainly.** (1) Candidate quality is word-level ranking, not a sentence engine: long sentences need several picks. (2) Next-word suggestions start empty and come only from the user's own picks; there is no seeded word-pair data. (3) No abbreviations (nh for 你好), no traditional characters, no tone input. (4) About 1.8 MB of Chinese data downloads when a room uses Chinese. (5) Not verified on a phone. If quality proves too low on full sentences, the documented fallback is libgooglepinyin compiled to WebAssembly.

**Owner to test.** Set a side to Chinese, type "nihao" then Space; type "women"; check suggestions after repeating a phrase; check Backspace and Enter.

### Planned, not started: guest links and a usage log (2026-10-17)

Design brief written: `CHATLINK-SHARING-AND-USAGE-BRIEF.md`. Single-use guest link (credentials delivered once, then locked server-side; guest mode has no config section), plus a separate structured usage log with its own storage and viewer. Owner decisions pending are in the brief.

### chat-test: guest link, built (2026-10-17)

**Owner direction.** Build the guest link from `CHATLINK-SHARING-AND-USAGE-BRIEF.md`: no caps, no monitoring of key use; a guest has no config section; the link cannot be passed on.

**Server (new, separate from DevStream): `chatlink/runner/`.** A Cloudflare Worker with a Vault object. The owner stores the speech key once; the owner (proved by a GitHub token that can push to the repo, the same check DevStream uses) creates a named link. A link is a 40-character code that expires after 7 days if never opened.
- Looking at a link (the info call) never uses it and never returns a key.
- **Redeem** hands the key over once with a claim token. A retry before confirming is allowed and replaces the claim. An unconfirmed redeem frees the link again after 10 minutes.
- **Confirm** (sent by the phone after it has saved the key) locks the code for good. After that the server never serves the key for it again, to any device.
- The owner list shows unopened, opening, opened (with a time), expired or stopped. Stopping a link that was already opened does not take the key back from that phone; to cut that phone off, change the Deepgram key.
- Tests: `chatlink/runner/test/runner.test.mjs`, 39 checks; three deliberate breakages of the server were each caught.
- Deploy: `.github/workflows/deploy-chatlink-runner.yml`, the same pattern as DevStream's; it needs no new secrets if the existing Cloudflare ones are already set. **The first deploy has not run.** The live address assumes the account's `workers.dev` name used by DevStream.

**App (`chat-test.html`).**
- **Guest landing.** A link with `?invite=` shows a welcome; only the Start tap redeems it. A link opened inside another app (Line, Facebook, Instagram and similar) first says "Open in Chrome". A device that already has its own key is warned and left alone unless the owner insists. If the phone cannot save the setup, the link is not used up and the guest can retry. If the link was opened elsewhere first, this phone is told and keeps no key.
- **Guest mode.** After setup there is no settings gear or any key, share or token screen; the rail shows conversations. A guest keeps conversation features (create, rename, languages, per-room export of their own conversations).
- **Owner Share tab** (Settings → Share): the owner's GitHub token (kept on that device), a name, Create link (copies it and shows it in a box), a list with Copy link and Stop, and Update shared key.
- **Not built yet:** the usage log and viewer (next, separate).

**Checks.** `tests/guest-link/guest.cjs`: the real page against the real server logic, 15 scenarios (create, preview does not consume, Start, guest has no settings, reopen, second phone gets nothing, guest cannot make links, built-in browser, owner device warning, Stop, storage blocked, opened-elsewhere race). Three deliberate breakages of the app were each caught.

**Not verified.** A real deploy, a real phone, a real Deepgram key. Owner to do before first use: let the deploy workflow run on merge (check its Live check step passes), open Settings → Share on your phone, paste a GitHub token that can push to the repo, create a link, and open it on a second phone.

**Existing suites with the guest link in:** open mode 42/42, ask mode 33/33, keyboard 32/32, controller 20/20, language check OK.

### 2026-10-19 — Share tab reuses the saved GitHub token
Owner reported: Share asked for the GitHub token again although it was already pasted. Cause: chat-test already saves that token (for the device log) under a different name; Share looked only under its own name. Change: Share now also reads the existing saved token, so nothing is asked twice. Guest-link suite 15/15. Not tried on a real phone.

### 2026-10-19 — Vietnamese tone keys showed as empty boxes
Owner reported (screenshot, Android Chrome): the Vietnamese keyboard appears on North, but the five tone keys were empty boxes. Cause: the keys were labelled with a bare accent mark plus a dotted-circle placeholder, which the phone's font cannot draw. Change: each tone key is now labelled with a letter carrying the mark (á à ả ã ạ); what the key types is unchanged. Checks: open mode 43/43, keyboard 32/32. Not yet confirmed on the phone.

### 2026-10-19 — page title
Owner reported the browser title read "Chatlink · Audio test". Changed to "Tabletop Xlate" (owner's suggestion). Title text only; no code path reads it.


### chat-test r17: "Listener reads it as" (2026-10-26)

**Owner question.** What did the listener understand, at face value, from what was sent to them? Example: "whenever you get tired" → 피곤할 때마다. Google's back-translation guessed "I", which misrepresented what the listener understood.

**Change.** When an AI key is saved, the AI also returns `reading`: what a native speaker of the target language understands from the translation at face value. Implied words go in [brackets], with a note when the text is vague or a fragment. It is written in the language of the person who opened the check, and shown as a "Listener reads it as" row directly under Target. Copy includes it. This is one instruction for every language, with no per-language rules. Google's target and back-translation are shown unchanged.

**Gates (lab).** 20/20 controller tests. Ask mode: 34/34, including the r17 scenario. Open mode: 44/44, which includes newer language scenarios from another session's work on main. Keyboard: 32/32.

### 2026-10-26 — Khmer, Lao, Thai and Hindi mark keys
Owner asked for the same check on the Khmer and Lao extra keys after the Vietnamese tone keys showed as empty boxes. Checks added first: no key on the km, lo, th, hi or vi keyboard may be labelled with a bare combining mark. km, lo, th and hi failed. Change: a mark key is now drawn on a base letter of its own script (the typed character is unchanged). Open mode 49/49, keyboard 32/32. Lab only; not confirmed on the phone.

### 2026-10-26 — usage log and viewer for chat-test (backlog item, built)
Owner asked for logging and a dashboard like TalkBridge's (`talkbridge/dash.html`), kept separate (see `CHATLINK-SHARING-AND-USAGE-BRIEF.md`).
**What it records.** One small row per event: when, who (owner or the guest's name), a device id, room name, language pair, side, typed or spoken, whether translation worked, the speech engine, the app build. Kinds: message, room created, app opened, and guest link opened (written by the server when a guest's phone confirms, so it is the first row of that guest's log). Never the words: the server keeps only a fixed list of fields and drops anything else, and a test sends the words on purpose to prove they are not stored.
**Where.** The same Worker as the guest links, but its own storage (a second Durable Object); the vault and the usage log never touch each other. Raw rows are kept 90 days; daily totals are kept for good. The log can never block a guest: if it is down, the guest link still opens (tested).
**In the app.** Rows are queued on the phone and sent in the background in batches; offline rows wait and are sent once when the phone is back online. Guests see one line on the welcome card saying usage is counted and never their words.
**Viewer.** `chat-usage.html`: tiles (messages, spoken share, translation failures, rooms, app opens, guest links opened), by hour, language pairs, rooms, people, by day, recent events, CSV download. Owner only: reads with the same GitHub token as the Share tab (reuses the saved one). Room names are shown as text only.
**Checks.** Server 55/55 (a deliberate break of the no-text rule and of the totals was caught); app: 3 new scenarios in open mode (typed, spoken, offline) failed before and pass after; viewer 7/7; guest link 15/15. Server version is now c2; the deploy workflow expects it.
**Not verified.** Nothing has run against the real Cloudflare Worker or on a phone. First real check after the deploy: open `chat-usage.html`, send a message in chat-test, refresh. Guest names appear in rows (my recommendation; the owner has not answered).

### 2026-11-11 — side-by-side layout (SBS), per chat card
Owner asked: each chat card gets a toggle, H2H (head to head, as before) or SBS (side by side: one transcript, one keyboard with an EN⇄KO style language switch that starts on the language last spoken or typed), and no permission step before the keyboard opens.
**What changed.** Each card in the conversation list has an H2H / SBS button; the choice is saved with the conversation and survives a reload. In SBS the North half and its transcript are hidden; the single transcript shows both languages (each person's side keeps its colour). The composer is the South or the North strip and keyboard, one at a time. It starts on the side that spoke or typed last and follows new messages while the keyboard is closed. The keyboard has a language switch (for example EN ⇄ TH) that moves the composer to the other language. Tapping the compose box opens the keyboard at once: the "the other person would like to type" permission card is skipped in SBS because one person is at the screen. The read-aloud button is one switch in SBS. H2H is unchanged.
**Checks.** Four new scenarios failed before and pass after: card toggle and reload; open-and-switch with no permission card; message typed in the other language is recorded for that language and shown as the other speaker; composer follows the language last spoken. Open mode 56/56, keyboard 32/32, guest link 15/15, language check OK.
**Not verified.** Not seen on a real phone. In particular the layout (the North composer docking under the transcript, keyboard height) and what the language switch feels like. Voice in SBS uses the existing both-microphones behaviour. Typed drafts stay with their language and do not move when you switch.

### 2026-11-11 — SBS language chip: centred and bigger
Owner (screenshot): the EN ⇄ TH chip sat at the far right and was small. Change: it is now centred on the keyboard, up to 320 px wide (62% of the keyboard on a phone) and 42 px tall. Check added first: chip centred within 3 px and at least 300 px or 55% of the keyboard wide, 36 px tall; it failed before and passes now. Open mode 56/56, keyboard 32/32. Not seen on a real phone.

### 2026-11-11 — SBS: one look for both languages, compose line stays put
Owner (two screenshots): switching EN ⇄ TH gave two different experiences. The Thai side was a separate rounded card, and the compose line jumped up compared with English. Wanted: line does not jump, and the rounded card look.
Cause: the English composer lived inside the transcript's card, the Thai one in its own card, and the Thai keyboard is taller than the English one, so the line moved.
Change: in SBS the transcript and the composer are always two rounded cards (blue for South, green for North), and the keyboard is the same height for every language (up to 372 px, 55% of the screen at most; very tall layouts scroll inside it). H2H unchanged (a wrapper with no visual effect). Check added first: compose line within 2 px after the switch and rounded corners on both; failed before, passes now. Open mode 56/56, keyboard 32/32, guest link 15/15. Not seen on a real phone. Side effect to look at: English now has some blank space under its last key row, because it is shorter than Thai.

### 2026-11-11 — suggestions after the X, and bigger keys in SBS
Owner (screenshot): clearing a composed message with the X removed the word-suggestion row, and the freed room was left blank; asked to use it and enlarge the keys.
**Cause.** The X cleared the box but did not refresh the keyboard's suggestions (typing does). Fix: clearing now refreshes them, so "I / You / What" is back on an empty box. This applies to H2H as well as SBS.
**Keys.** In SBS the keys now share all the room in the composer card: with the suggestion row hidden they grow taller instead of leaving a blank band (a keyboard with the row showing is a little shorter-keyed). Checks added first: suggestions back after the X (0 of 3 before), no blank band under the last row (60 px before), keys at least 50 px tall; all pass. Open mode 58/58, keyboard 32/32, guest link 15/15. Not seen on a real phone.

### REMINDER — how side by side (SBS) paints (kept for later changes, 2026-11-18)
Owner asked for a standing note on how SBS looks. This is the current, merged behaviour (PRs #986 to #989). H2H is the untouched original.
**Switch.** Each chat card in the list has an H2H / SBS button. The choice is saved on the conversation (`layout`), survives a reload, and drives two classes on the page: `sbs`, and `sbs-n` when the North language is the one being typed.
**Two rounded cards, stacked.** Top: the single transcript (blue border), showing both languages; South-language messages sit on the right in blue, North-language ones on the left in green. Bottom: the composer card, which holds the compose line and the keyboard. Its border is blue for the South language and green for the North language. The two cards have a small gap and the page behind them shows through (the shells go transparent).
**One composer at a time.** The composer is the South strip and keyboard, or the North strip and keyboard, never both. The North half is un-rotated and docked under the transcript when it is the composer. It starts on the language last spoken or typed and follows new messages while the keyboard is closed; once the keyboard or mic is in use it stays put.
**Keyboard.** A wide EN ⇄ TH chip sits centred at the top of the keyboard (up to 320 px, 42 px tall). The keyboard is a fixed height for every language (up to 372 px, never more than 55% of the screen), so the compose line does not move when you switch. The keys share the room in the card (rows stretch, 44 px minimum), so a hidden suggestion row makes the keys taller rather than leaving a blank band. Tall layouts (Khmer, Vietnamese) scroll inside the keyboard. Suggestions ("I / You / What") return after the ✕.
**Behaviour that goes with it.** Tapping the compose box opens the keyboard at once, with no "the other person would like to type" card. Read-aloud is one switch for the whole screen and speaks the translation (the target language). A typed draft stays with its language and does not move when you switch.
**How it is built (for the next change).** A wrapper around each side's strip and keyboard (`cmp-south`, `cmp-north`) is invisible in H2H and becomes the rounded card in SBS. The rules live in the stylesheet under "side by side". Checks: the four SBS scenarios and the two keyboard-fill scenarios in `tests/audio-turn/open-mode.cjs`.
**Not yet seen on a phone.** Everything above is lab-tested only. Open question: English has a little empty space when the suggestion row is showing; the owner has not said whether that matters.

### 2026-11-19 — SBS: the bubble builds itself while you speak
Owner reported (side by side, speaking English with Korean as the other language): the app showed the English words as a separate temporary box with a small Korean line underneath, then redrew everything as the normal bubble when done. Wanted: the bubble exists from the start and fills in on the fly.
**Cause.** While you speak the app draws a temporary dashed "live" box (words on top, a rough translation as a small line below) and swaps it for the real two-column bubble when the turn ends.
**Change (SBS only; H2H unchanged).** The live bubble is now drawn with the same two-column bubble as the finished one: your words in one column from the first word, the rough translation filling the other column as it arrives, no dashed box and no small line underneath. When the turn ends the finished bubble keeps the translation already on screen until its own arrives, so the column does not drop back to "…".
**Checks.** Two scenarios failed first and pass now (live bubble form; translation kept at hand-over). Open mode 60/60, keyboard 32/32, guest link 15/15.
**Limits.** The translation shown while speaking is a rough one of the settled words only, and may be shorter than the final. Words are not streamed word-by-word into the translation column. The bubble is still replaced by a new element at the end (same look and place, no visible jump in the lab); not seen on a phone. On a phone the other language's recogniser also hears you, and its guesses are still used to decide who is speaking; the owner has not asked to change that.

### 2026-11-19 — SBS: the bubble no longer disappears while translating; chat width; flush bubbles
Owner clarified the sequence on a phone: the bubble frame appears, the source fills in, then **the bubble disappears while it translates and reappears with the translation**; the translation takes perceptible time, so that blank time is wasted. Also asked for bubbles flush left and right depending on who is speaking, with font size and chat column width configurable per conversation (reference: TalkBridge's per-room Appearance, which has size and width per side).
**Measured cause (lab timeline).** When speech ends the live bubble is removed at once, but the finished message's own bubble is drawn about 0.7 s later (it waits for the message to be saved first). In between there is no bubble at all. Every later update also rebuilt the bubble (invisible, same pass).
**Change, side by side only.** When speech ends the live bubble stays on screen (frozen) until the finished message's bubble is drawn in its place in the same pass, so a bubble is on screen the whole time. If nothing comes of the speech it is dropped after 12 s.
**Chat width (new, per conversation, both layouts).** The Appearance section of a conversation has "Chat width (%)", 50 to 100, default 82 (what it was). Text size now allows 10 to 32 (was 12 to 24). In SBS the transcript has no side padding, so the speaking side's bubbles sit flush right and the other language's flush left, and every bubble is exactly the chosen width, so the frame does not change size as it fills in. In H2H the width is the bubble's maximum.
**Mistake caught by the suite.** The first try gave the width box a step of 5, so the default 82 was refused by the browser's form check and no conversation could be saved. The suite caught it (nearly every scenario failed); step is now 1.
**Checks.** Two scenarios failed first and pass: a bubble is on screen the whole time from first word to finished translation (translation held 1.2 s) and ends as one bubble; chat width saved with the conversation, bubbles flush left/right and 70% wide. Open mode 62/62, keyboard 32/32, guest link 15/15.
**Not covered.** TalkBridge has separate size and width for each side and colours per side; here size and width are one value for the conversation (colours per side already existed). Not seen on a phone. H2H still redraws the live bubble the old way.

### 2026-11-19 — ROLLBACK of side by side (SBS), at the owner's request
Owner (phone screenshot and log): a bubble for Korean appeared out of nowhere while only English was spoken, then disappeared; the SBS work (card toggle, shared transcript, composer switch, live bubble, flush/width) kept producing rendering surprises, while head to head (H2H) renders fine. Instruction: roll all the way back to before SBS, then re-implement it paying attention to how and in what order things are painted, keeping size and colour controls, with the initiator's bubble flush left and the other participant's flush right.
**Done.** `chat-test.html` and `tests/audio-turn/open-mode.cjs` are restored byte for byte to the last version before SBS (the state after the usage log, PR #976, the commit before #986). Everything SBS added is gone: the H2H/SBS card button, the one-transcript layout, the composer language switch, the changed live bubble, "Chat width", and the 10–32 text size. Also gone with it: the unrelated fix that brought the word suggestions back after the X (#989); it comes back with the re-implementation as its own small change.
**Kept.** Everything before SBS: usage log and viewer, guest links, the Khmer/Lao/Thai/Hindi/Vietnamese key labels, Tabletop Xlate title, H2H as it was.
**The "REMINDER — how side by side paints" entry above describes the rolled-back version.** Treat it as history, not as current behaviour.
**Finding for the re-implementation (not changed in the rollback).** The surprise Korean bubble is the app's live preview: while you speak it shows the best-scoring of the two listening channels, and a Hangul guess on the Korean channel gets a bonus for being Korean script even when English was spoken. H2H has the same preview rule, so the preview rule is not specific to SBS; SBS just made it more visible in the one shared panel.

### 2026-11-19 — SBS re-applied, layout only (step 1 of 2)
After the rollback (PR #1004) the layout half of side by side is back, exactly as it was after PR #989, which the owner had already tried on a phone and commented on: the H2H / SBS button on each conversation card; one transcript; one composer (South or North strip and keyboard) that follows the language last spoken or typed; the centred EN ⇄ TH chip; two rounded cards (transcript, composer) with a fixed-height keyboard whose keys fill the room; no permission card for the keyboard; one read-aloud switch; and the fix that brings the word suggestions back after the X (this one also applies to H2H).
**Deliberately NOT brought back:** everything that changed how bubbles are drawn: the live-bubble rewrite for SBS (#1002), the frozen live bubble and translation carry-over (#1003), and the per-conversation width and flush changes (#1003; these return in step 2 as styling only).
**Rule for step 2 and later.** SBS must use the same renderer as H2H. The single transcript is the South panel exactly as H2H already draws it (every message, the writer's side as "own"); live preview, bubble building and the order of painting (clear the panel, draw all bubbles in order, then the live preview last) are not touched. SBS-only differences are CSS: which half is shown, padding, flush side, width.
**Checks.** Open mode 58/58, keyboard 32/32, guest link 15/15 on this state.

### 2026-11-19 — SBS re-applied, step 2: width, size and flush placement (styling only)
Owner: keep configurable size and colour, the initiator's bubble flush left and the other participant's flush right.
**Change.** Each conversation's Appearance section has "Chat width (%)", 50 to 100, default 82 (what it was), and "Text size" now allows 10 to 32 (was 12 to 24); bubble colours and text colour already existed. In SBS the transcript has no side padding, the initiator's bubbles (South) sit flush left, the other participant's (North) flush right, and every bubble is exactly the chosen width, so the frame cannot change size as it fills in. In H2H the width is only a maximum, defaulting to what it was, so H2H looks the same unless you change it.
**What was NOT touched.** How and in what order the transcript is painted (clear the panel, draw every bubble in order, the live preview last), the live preview itself, and the bubble builder. All of step 2 is CSS plus the settings fields.
**Checks.** Added first: chat width and text size saved per conversation and applied; in SBS the initiator is flush left, the other flush right, both the chosen width (failed before, passes); H2H keeps the writer on the right with the usual margin (guard, passed before and after). Open mode 60/60, keyboard 32/32, guest link 15/15. Not seen on a phone.
**Known open items (unchanged by this step).** The live preview can show a bubble for the other language while only your language is spoken (the preview gives a Korean-script guess a bonus); this exists in H2H too and has not been root-caused because no log of that moment exists. The preview is also removed when speech ends, before the finished bubble is drawn, which leaves a short gap while it saves; both are left alone on purpose until the owner decides.

### 2026-11-20 — live preview: no more errant Korean bubble
Owner: the flow is right (the words on their own line, the translation under them, then the chat bubble), but sometimes a Korean bubble appears while only English is spoken and then erases before the English-to-Korean bubble shows.
**Cause (reasoned, not seen on a device; no device log of that moment exists).** Both listeners hear the same audio. While you speak English the Korean listener makes a Hangul guess at the sounds, and the preview showed whichever listener was ahead at that instant. When the Korean guess landed before the English listener had anything, it was shown as a bubble, then replaced. The same rule exists in H2H.
**Change.** A preview now appears, or moves to the other side, only after that side has been in the lead for 350 ms. A guess that is overtaken within that time is never drawn. Updates to a preview that is already showing are still immediate. Nothing else in the flow changed.
**Checks.** Added first: Korean guess 150 ms ahead of English, no Hangul is ever on screen and the English preview shows (failed before, passes); real Korean speech still shows, and an update to a shown preview takes under 400 ms (guard). Open mode 62/62, keyboard 32/32, guest link 15/15.
**Costs and limits.** The first words of every preview appear up to 350 ms later than before. If a Korean guess lasts longer than 350 ms while English is being spoken it would still show; the settle time is the one number to tune. Lab simulation only; not heard with real speech on a phone.

### 2026-11-20 — one bubble per turn (no two-pass paint)
Owner: no two-pass paint. The bubble should go up as a placeholder, the transcript fills in, then the translation fills in. (The device log they pasted held no speech events, only start-up lines, so it told us nothing about this.)
**What the old paint did.** While you spoke a temporary dashed box showed the words with a small translation line under them. When speech ended that box was removed at once and the real bubble was drawn about 0.7 s later (it waits for the message to be saved), then the real bubble was redrawn again when its translation arrived.
**Change (both layouts).** The live bubble is now drawn by the very same builder as a finished message: the words fill the first column and the translation fills the second (shown as "…" until it arrives). When speech ends the bubble stays on screen and is dropped in the same pass that draws the finished message's bubble, so there is never a gap or a second look. The finished bubble keeps the translation already shown until its own arrives (when the finished text starts with the words already translated). The bubble is kept at most 4 s if no message follows (noise, echo, or text sent to the compose box).
**Placeholder timing.** The bubble first appears when a listener first reports words, after the 250 ms settle wait that keeps a wrong-language guess from flashing up (shortened from 350 ms). There is no earlier "empty frame": the app is not told when speech starts, only when words arrive.
**Test updated.** The older "live bubble while speaking" scenario expected the one-line preview; it now expects the two-column bubble (the speaker's words in the speaker's own panel first column).
**Checks.** Three scenarios added first and failing, now passing: two-column bubble from the first words with the translation filling in, no gap with the translation held 1.2 s, translation carried to the finished bubble. Open mode 65/65, keyboard 32/32, guest link 15/15.
**Limits.** Lab only. The translation shown while speaking covers only the words already settled; it can be shorter than the final one.

### 2026-11-20 — device log switched on (speech and preview events, read from the repo)
Owner asked to switch on logging so the live moment can be read without copying anything (the log they pasted had only start-up lines).
**What is on.** The log code that already existed in the app but was stubbed out is now live. On the owner's device (a GitHub token is saved; the token reused from the Share tab counts) the app records the engine's events (microphones, routing, who-spoke decisions, normalization and translation outcomes) plus new preview events: each listener's report (side, length, script such as hangul or latin, confidence), the scores that chose the preview side, and when a held bubble ended and whether the finished bubble replaced it. A guest device and a device with no token write nothing.
**No words.** Text-like fields (text, transcript, original, translation, said, words) are stripped, long strings are cut, and a test sends real words through and checks none reach the file.
**Where.** `logs/chat-test/<UTC hour>-<device id>.jsonl` in this repository, one file per hour per device (a second and third file if one ever grows large), written every 15 s while events flow and when the page is hidden. Commits say `chat-test log N events [skip ci]` so a log write never starts a site build.
**Side effect to know about.** Each flush is a commit on main, so the history will show many small "chat-test log" commits during use. If that is too noisy, the clean alternative is to send the log to the Chatlink server instead; reading it from here would then need a route I do not have yet.
**Checks.** Two scenarios failed first and pass: speech events reach a repo file with the right name, token, message and rows and no words; a guest device or a device with no token writes nothing. Open mode 67/67, keyboard 32/32, guest link 15/15.
**Not verified.** No log has arrived from a real phone yet. Until a file appears under `logs/chat-test/` after a real session, treat the channel as unproven.

### 2026-11-20 — the Korean ghost was a real message; now deferred. Log token fixed.
Owner pasted the in-app log from a session (English spoken, Korean as the other language).
**What the log shows (evidence, not a guess).** At 17:01:03 the Korean listener finished first with a 5-character result at confidence 0.68; the app routed it at once as a Korean message (`transcript-routed side north, reason scored, runnerUp null`) and translated it to English. About a second later the English listener finished the real 15-character sentence at 0.97, which became the English message. So the "errant Korean bubble" is a real message made from the Korean listener's weak guess at English sounds, finishing before the English listener and outside the 0.7 s window in which the two listeners are compared (hence "runnerUp null"). The same log shows ordinary English turns routing correctly, and one Korean listener timeout (Deepgram closed an idle Korean connection, code 1011; the app reopened it on tap, as designed).
**Change.** When a lone result arrives from one listener with confidence under 0.85 while the other listener has reported words in the last 1.5 s, the decision waits another 0.7 s, up to twice, so the other listener's result can join and the two are compared. Strong results (0.85 and above) and results from a listener whose partner is silent are decided at once, as before. A new engine event `decision-deferred` is recorded.
**Device log token.** The log was only looking for the older saved token; it now accepts the Share tab's token too. No file had reached `logs/chat-test/` in the repository when checked, so the log channel is still unproven. Likely causes: the phone had not loaded the build with the log yet, or the token was saved only on the Share tab.
**Checks.** Two scenarios failed first and pass: a weak Korean guess finishing 1 s before the English result no longer becomes a message (only the English message exists); the Share-tab token writes the log. Open mode 69/69, keyboard 32/32, guest link 15/15.
**Cost.** A genuine weak-confidence reply from a listener whose partner is also hearing sounds can take up to 1.4 s longer to appear. Lab-simulated; not yet heard on a phone.

### 2026-11-20 — DIAGNOSIS of the phantom Korean bubble, proven on the owner's own log
Owner: not comfortable with how this performs; wants it diagnosed and the diagnosis proven, then a rollback and a clean re-implementation of side by side and the improvements.
**Evidence.** The device log reached the repository (`logs/chat-test/2026-11-20T07-8hbcgfavc1nx.jsonl`, 341 events, one phone, English spoken with Korean as the other language, 07:27 to 07:31). That also proves the log channel works. In it all 9 voice messages were routed to the English side: **no Korean message was ever created; the phantom is only the live preview.** Every "Korean bubble" lines up with a `live_pick` showing `shown: "north"` while the speaker was English.
**Cause (three things that combine).**
1. *Early guess.* The Korean listener reports a 1 to 3 character Hangul guess at the English sounds before (or alongside) the English listener. The preview shows whoever is alone. Waiting 250 ms (my earlier fix) is too short: the English listener was 430 to 480 ms behind in the log.
2. *Script bonus.* The preview adds +0.3 to a result whose script matches its own language, so a weak Korean guess scores 0.95 and a 0.95 guess scores 1.25, beating English readings of 0.72 to 0.94 (1.24 for the English 0.94).
3. *Stale entries never expire on their own.* A Korean guess that is never finished stays in the table; it is only judged "stale" (3 s) when some other event arrives, and the preview is only recomputed on events. So once English finishes and clears, the leftover Korean entry is the only one left and is drawn, and it can stay on screen until the next speech (27 s in the replay).
**Proof.** `tests/audio-turn/ghost-proof.cjs` replays four episodes taken from that log (fixture `tests/audio-turn/fixtures/ghost-log-2026-11-20.json`: sides, lengths, scripts, confidences, no words) through the real app on a controlled clock and records what is drawn. Run: `GHOST_PROOF=1 CASE='GHOST PROOF' AUDIO_MODE=open node tests/audio-turn/regression.cjs`.
- A, a healthy turn from the same log: English only. Passes (the replay itself is sound).
- B (07:29:05): none, then **Korean 300 to 730 ms**, then English.
- C (07:29:54): English 300 to 583 ms, then **Korean from 633 ms to the end of the replay (27 s)**; the English preview is gone and the Korean one never leaves.
- D (07:30:47): **Korean 300 to 684 ms**, English 734 to 2487 ms, then **Korean again from 2537 ms**, right after the English finished and before the English bubble exists (the owner's description of the bug).
The proof test is not in the normal suite (it fails on the current build by design). It becomes an acceptance test for the re-implementation.
**What this changes about earlier fixes.** The 250/350 ms settle wait and the "defer a weak lone result" change did not address this and should not be carried forward as the answer. The deferral addressed a different problem seen in the first pasted log (a weak Korean final routed as a message); that case was not present in this log.
**Plan the owner described (not started).** Roll back, then re-implement side by side and the improvements on top of the diagnosis, with the proof episodes as acceptance tests.

### 2026-11-20 — ROLLBACK to before side by side, keeping the device log (step 0 of the re-implementation)
Owner: "Go" on the plan: roll back, then re-implement side by side and the improvements on top of the proven diagnosis.
**Done.** `chat-test.html` and the tests are back to the version before side by side (before PR #986), with only the device log kept: the repo log (hourly file per device, no words, Share-tab token accepted, `[skip ci]`), the engine event hook, the per-listener `live` events and the `live_pick` decisions. Everything else added since is out for now: the H2H/SBS layout, the composer switch and chip, the rounded cards, keys filling the keyboard, suggestions after the X, chat width and text size 10–32, flush placement, the one-bubble paint and hold, the 250 ms settle, and the weak-final deferral.
**Re-implementation order, one pull request per step, each tested before the next.**
1. Layout (card toggle, composer, language chip, rounded cards, keys fill the keyboard, suggestions after the X).
2. Width, text size and flush left/right (initiator left, other participant right), as styling only.
3. The preview fix built on the diagnosis. Its acceptance test is the replay proof (episodes B, C and D must draw no Korean; A must still draw English), plus new tests for the three causes.
4. The one-bubble paint (the bubble is the real two-column bubble from the first words and stays until the finished bubble replaces it, no gap).
5. The weak-final deferral (a separate real defect seen in the first pasted log), only if the owner still wants it.
**Checks on this base.** Open mode 55/55, keyboard 32/32, guest link 15/15. The proof episodes B, C and D fail on this base by design.

### 2026-11-20 — re-implementation step 1: the side by side layout
On the rolled-back base (pre-SBS plus the device log): the H2H / SBS button on each conversation card (saved with the conversation, survives a reload); one transcript (the South panel, drawn exactly as H2H draws it); one composer (South or North strip and keyboard) that follows the language last spoken or typed; the centred EN ⇄ TH chip; transcript and composer as two rounded cards with a fixed-height keyboard whose keys share the room; no permission card for the keyboard; one read-aloud switch; suggestions return after the X (also in H2H). Same code the owner already tried on a phone after PR #989; nothing here touches how bubbles or the preview are drawn.
**Checks.** Open mode 61/61, keyboard 32/32, guest link 15/15. (A merge slip dropped one closing line in the test file; caught by a syntax check and fixed before the run.)
**Next.** Step 2: width, text size and flush left/right as styling only.

### 2026-11-20 — re-implementation step 2: chat width, text size, flush placement (styling only)
Each conversation's Appearance section has "Chat width (%)" (50 to 100, default 82, as before) and "Text size" now 10 to 32; bubble and text colours already existed. In SBS the transcript has no side padding, the initiator's bubbles (South) sit flush left, the other participant's (North) flush right, each exactly the chosen width. In H2H the width is only a maximum, so H2H looks the same unless it is changed. Styling and settings only: how the transcript is painted, the preview and the bubble builder are untouched.
**Checks.** Open mode 63/63 (width, size and flush scenario plus an H2H placement guard), keyboard 32/32, guest link 15/15.
**Next.** Step 3: the preview fix built on the diagnosis, accepted by the replay proof.

### 2026-11-20 — re-implementation step 3: the preview fix (proven on the owner's log)
Fixes the three causes found in the diagnosis; the replay proof is now part of the normal suite and passes.
**New rules for which listener's words the preview shows.**
1. *Evidence, not a bonus.* A listener's evidence is its confidence times the number of characters; text in the wrong script for that listener counts a quarter. Nothing is shown until the evidence reaches 3, so a 1 to 3 character guess (the Korean listener hearing English) is never drawn. Real Korean speech reaches 3 within a word or two.
2. *A clear leader.* If two listeners both have fresh words, the leader must beat the other by 1.5 times; otherwise nothing new is decided and whatever is on screen stays. This replaces the old +0.3 script bonus that let a 0.95 guess beat an English reading by 0.01.
3. *Entries expire on their own.* Words not updated for 1.5 s stop counting (was 3 s, checked only when another event happened), and a sweep runs at that moment, so a preview whose speech just stopped clears itself instead of lingering until the next speech.
4. *Clean-up at the end of a turn.* When one listener ends its turn, the other listener's unfinished guess (never finalised) is dropped, so it cannot become the only entry left and be drawn after the English finishes.
**Acceptance.** The four episodes from the owner's log: B, C and D draw no Korean, A (a healthy turn) still draws English. Four new scenarios pass: real Korean alone is shown; a stopped preview clears itself; the other listener's guess is dropped at turn end; a weak 2 to 3 character guess is never shown. Open mode 71/71, keyboard 32/32, guest link 15/15.
**Cost and limits.** Preview start is a touch later for very short openings (English now needs about 4 characters at normal confidence; Korean about 3). The real messages are unchanged: this only changes the live preview. Replay and lab only; not yet heard on a phone, where the device log will show the new `live_pick` decisions (evidence per listener) for the next check.
**Next.** Step 4: the one-bubble paint (the bubble is the real two-column bubble from the first words and stays until the finished bubble replaces it, no gap). The settle wait and the weak-final deferral from before are not part of this and have not been re-applied.

### 2026-11-20 — re-implementation step 4: one bubble per turn (no two-pass paint)
The live bubble is drawn by the very same builder as a finished message: the words fill the first column and the translation the second ("…" until it arrives). When the turn ends it stays on screen and is dropped in the same pass that draws the finished message's bubble, so there is never a blank gap or a second look; the finished bubble keeps the translation already shown until its own arrives (when the finished text starts with the words already translated). If no message follows (noise, echo, text sent to the compose box) the bubble clears after 4 s. Both layouts.
**Built on the step 3 preview rules** (so the bubble that is held is the right listener's); the 250 ms settle wait is gone, replaced by the evidence rules.
**Checks.** Three scenarios failed first and pass: two-column bubble from the first words with the translation filling in; a bubble on screen the whole time with the translation held 1.2 s; translation carried to the finished bubble. The older "live bubble while speaking" scenario now expects the two-column form. Two step 3 scenarios were reworded because they assumed the preview vanishes at once; they now check what they were guarding (no Korean left behind; a stopped preview eventually clears). The replay proof episodes B, C, D and the control A still pass. Open mode 74/74, keyboard 32/32, guest link 15/15.
**Left out on purpose.** The weak-final deferral (a weak Korean final routed as a message, seen in the first pasted log) is not re-applied; the second log did not show it. It can come back as its own change if it recurs.
**Not verified.** Lab and replay only; nothing has been heard on a phone yet. The device log will record the new per-listener evidence for the next check.

### 2026-11-20 — second device log: another phantom Korean bubble, and where the time goes after the words are final
Owner: another phantom Korean bubble; and after the source is transcribed and the target translated there is a further wait before the speaker and "use" icons appear, which they consider excessive (the icons could be painted at once, pointing at variables filled in later).
**Evidence.** `logs/chat-test/2026-11-20T08-8hbcgfavc1nx.jsonl` (the build with the preview fix; 228 events, 08:14 to 08:16). The preview rules worked in the cases they were built for: at 08:15:22 and 08:16:01 and 08:16:19 the Korean listener's early guess (ev 4.0, 4.5, 5.8) lost to English (ev 5 to 15) and no Korean was shown.
**Phantom Korean, cause (proven by replay, episode E).** At 08:16:02.976 the Korean listener FINISHED its 7-character guess (confidence 0.54) while English was still being spoken. The turn-end clean-up only drops guesses that are not finished, so it survived; when English ended (08:16:03.962) it was the only entry left (evidence 3.77, just over the minimum of 3), so the preview switched to it (`live_pick best north, shown south` then `shown north`), the app translated it Korean to English (a wasted 863 ms call at 08:16:04.825), and the one-bubble hold then froze that bubble and kept it up to 4 s because no message of that side ever arrives to replace it. In the replay: Korean on screen 4.45 s. The real message routed correctly (south, 1.30 against 0.89). Replay proof: `GHOST_PROOF_E=1 CASE='GHOST PROOF' AUDIO_MODE=open node tests/audio-turn/regression.cjs`; it fails on the current build (off by default until it is fixed). Fix, not yet made: when one listener ends its turn, drop the other listener's entry whenever it was updated during that turn and is no stronger, finished or not; the held bubble then can no longer be a ghost.
**The wait before icons, measured.** 17 English turns across both logs, from the last final words to a complete bubble: median 1.87 s (range 1.57 to 3.26). It is not a back-end call. It is: 1.03 s waiting for the speech service's utterance-end signal (0.74 to 1.49 s); 0.71 s fixed window for comparing the two listeners (0.49 to 0.72 s; 14 of 15 routes in the first log had no competing listener at all: `runnerUp null`); 0.13 s to normalise and fetch the translation, which is a cache hit because the translation call (median 785 ms) was already started when the final words arrived and ran in parallel. The icons themselves are plain buttons that are created with the bubble and do not wait for the translation; the live bubble, however, deliberately has none, so they first appear when the finished bubble is drawn, i.e. at the end of those two waits.
**Real excess in calls.** 28 translation calls for 17 turns plus the ghost. When a turn arrives in two parts the whole accumulated text is translated again (31 then 63 characters; 22 then 79), and a ghost guess is translated for nothing.
**Recommended (not done).** (1) Draw the icons with the first paint of the bubble, bound to the text and translation variables, inactive until they hold text. (2) Create the finished message at the final words, not at utterance-end, and let later parts extend the same bubble; keep utterance-end only to close the turn. (3) Skip the 0.7 s comparison window when the other listener has nothing finished or its evidence is under a third of the leader's (the normal case), and keep it only for real contests. (4) Translate only the new part of a growing turn, and never a side that is not being shown. (5) Log paint events (first paint, icons, translation arrival) so the next session measures this directly. Together (2) and (3) remove about 1.7 s of the 1.87 s.

### 2026-11-20 — go, part A: the held phantom Korean bubble is fixed, and paint timings are logged
**Phantom (episode E).** When one listener ends its turn, the other listener's entry is now dropped if it is unfinished, or if it was updated during that turn and is no stronger (confidence times characters), finished or not. The Korean listener's finished 7-character guess (evidence 3.77) against English (19.7) is dropped, so it cannot become the only entry left, cannot be translated for nothing, and cannot be held. Replay episodes A to E all pass (E is now in the normal suite).
**Timings in the device log.** `paint_live` (first paint of the live bubble of a turn, in ms since its first words), `live_end` now also gives the time since the first words and whether the finished bubble adopted the held one, and `msg_complete` (how long the message was pending before its translation arrived, and whether it worked). Next session these show where the time goes without guessing.
**Checks.** One scenario failed first (paint timings) and passes; episode E passes. Open mode 76/76, keyboard 32/32, guest link 15/15.
**Next, in this order.** B: icons painted with the first paint of the bubble (inactive until they hold text). C: translate only the new part of a growing turn and never a side that is not shown. D: skip the 0.7 s comparison window when the other listener has nothing in play, with a rule that drops a weak straggler arriving right after a delivery (so skipping the window cannot create a ghost message), and bring back the weak-lone-result deferral for the contested case.

### 2026-11-20 — go, part B: the icons are painted with the first paint of the bubble
Owner: the speaker and "use" icons are only buttons pointing at text, so they should be drawn at once and filled in later, not wait.
**Change.** The live bubble now has both icons in both columns from its first frame. They read the text when clicked, so they follow the words as they fill in. The speaker is active as soon as its column holds words (greyed while the column shows "…"); "use" (send this text) stays inactive until the message exists, so a half-spoken sentence cannot be sent. When the finished bubble replaces the live one the icons are the same, all active. The extra wait before the icons was the wait for the finished bubble (utterance-end plus the comparison window, about 1.7 s); with the icons on the live bubble the speaker is usable about as soon as the source words are, and the translation's speaker as soon as the translation arrives.
**Checks.** One scenario failed first and passes: both columns have both icons at the first paint; source speaker active, "use" inactive; translation icons inactive while it shows "…". Open mode 77/77, keyboard 32/32, guest link 15/15.
**Not changed.** The finished message is still created at the end of the turn (utterance-end), so a sentence the speaker pauses in is not split into two messages; this is part D's territory.

### 2026-11-20 — go, part C: only the new part of a growing turn is translated
Owner: the translation calls are excessive. The log showed a two-part turn translating its first part, then the whole text again (31 then 63 characters; 22 then 79).
**Change.** While a turn grows, the background translation now sends only the part that is new and joins it to what was already translated. The joined result is stored in the translation cache under the whole text, so the finished message finds it ready and makes no call of its own. If the text is revised rather than extended, it falls back to translating the whole text. The per-turn memory is cleared when the turn ends. (A ghost side is no longer translated either: part A stops it ever being shown, and only the shown side is translated.)
**Trade-off, stated plainly.** The finished translation is now the parts translated separately and joined, not one translation of the whole turn, so the second part is translated without seeing the first. For ordinary spoken sentences that is the usual way speech is translated; if a case shows a context error (a pronoun that needs the earlier sentence), the fix is to translate the whole text once at the end of the turn, at the price of one more call.
**Checks.** One scenario failed first and passes (only the new part is sent, the whole text never, and the finished message makes no further call). The older "translation is ready (cached) when the turn ends" scenario expected one call for the whole turn; it now expects each part once, joined, with the whole text never sent. Open mode 78/78, keyboard 32/32, guest link 15/15.
**Next.** Part D: skip the 0.7 s comparison window when the other listener has nothing in play (with a rule that drops a weak straggler right after a delivery) and bring back the weak-lone-result deferral for the contested case.

### 2026-11-20 — go, part D: a shorter wait before a turn is committed, with guards
Owner's list item 3 (and the weak-final deferral brought back for the contested case).
**What was measured.** Median 0.71 s of every turn was a fixed window for comparing the two listeners; in most turns the other listener had heard nothing at all.
**Changes.**
1. *Adaptive window.* The comparison window is 0.7 s only when the other listener has reported words within the last 2.5 s (a real contest). When it has been silent the window is 0.4 s (was 0.7 s), the time its late result would need to arrive and still be compared. Measured in the lab: the message exists about 0.4 s after the turn ends instead of 0.7 s or more. (Not 0 s: a straggler arriving a few hundred ms later is exactly the Korean case.)
2. *Straggler rule.* After a delivery, a result from the other side that is no stronger AND whose first words came before the delivered turn ended is that listener's guess at the same sounds, not a message; it is dropped (`transcript-rejected`, reason `straggler`). A real reply starts after the turn ended, so its first words are later and it is kept even if it is weaker. (My first version compared only times and confidences and dropped a quick real reply; the suite caught it and it was reworked.)
3. *Weak lone result deferral (brought back from before).* A lone result under 0.85 confidence while the other listener has been hearing words in the last 1.5 s waits another 0.7 s, up to twice, so both can be compared (the first log's case: a weak Korean final 1 s before the English one).
**Checks.** Three scenarios failed or were added first and pass: quick path (message exists under 550 ms after the turn ends, was 721 ms); late weak guess dropped; weak-first deferral. A guard for a real quick reply passes. The look-alike-language test (English and Filipino) and the composer-follows-language test, which broke on the first version, pass. Open mode 82/82, keyboard 32/32, guest link 15/15.
**Not changed.** The speech service's utterance-end wait (about 1 s) is untouched: shortening it splits one sentence into two messages. It is now the biggest remaining wait; the paint events in the device log will show it directly.
**Not verified.** Lab only. Look-alike language pairs (English and Filipino, Malay and Indonesian) are the place to watch on a phone: the shorter window relies on both listeners producing interim words, which they do in real use but not in a test that sends only finals.

### 2026-11-20 — the microphone icon stopped showing that it was listening once a keyboard was open
Owner (after trying the last round on a phone): the smoother experience is confirmed; but in side by side the South microphone icon does not show that it is listening, while the North one does.
**Cause (measured in the lab).** The "listening" signal is a small level meter drawn inside the microphone icon, moving with the sound. Opening a keyboard tears both meters down (a clean-up step detaches them) while open mode keeps both microphones listening; the icon was then repainted as "listening" but only as a fixed 3 px bar and the meter was never put back. In the lab both meters moved normally at rest (0 to 6.4) and went flat at exactly 3.00 as soon as a keyboard opened, in head to head as well as side by side. Which side looks alive on a phone depends on which fixed bar is more visible; the fault is not specific to South.
**Change.** When the app repaints a side's microphone as listening and its microphone is still running, the level meter is attached again to that running stream (only if it is not already attached, so nothing doubles up).
**Checks.** Failed first and passes: both level meters keep moving after a keyboard opens, in head to head, in side by side with South as the composer, and with North as the composer. Open mode 83/83, ask mode 34/34, keyboard 32/32, guest link 15/15.
**Not verified.** Lab fake audio only; the phone's microphone level is the thing to look at next.

### 2026-11-20 — the tablet could not listen: it had no speech key, and said nothing on screen
Owner: it works on the phone but not on the tablet; rebooted, looked for other browser sessions using the microphone, out of ideas.
**Evidence (the tablet's own device log, `logs/chat-test/2026-11-20T09-kezf4jsrj7zv.jsonl`).** Both microphones opened fine (`mic-open ok` for South and North), so the microphone permission is not the problem; then for each side: "Deepgram key missing". The speech key is stored in the browser on each device and this tablet has none. Nothing on screen said so: the app only wrote a line into the hidden diagnostics panel, and that line named a settings page that does not exist in this app ("Calling & Sync Keys"; the old text from the other apps).
**Change.** When a listening side starts without a key the app now shows a message on screen for 9 s (once per 15 s): "No speech key on this device, so it cannot listen. Open ⚙ Settings → Device and paste the Deepgram key, or restore your keys under AI keys." The diagnostics lines now name the right places. No key is read, sent or stored by this change.
**How to fix the tablet (already given to the owner).** Settings → Device tab → paste the Deepgram key → Save; or on the phone Settings → AI keys → "Save keys to password manager", then on the tablet Settings → AI keys → "Restore keys from password manager" (same browser account with sync on).
**Checks.** Failed first, passes: a device with no key shows the message, which names Settings and the Deepgram key / AI keys, and the old wrong place name is gone from the log. Open mode 84/84, ask mode 34/34, keyboard 32/32, guest link 15/15.

### 2026-11-20 — no tone before read-aloud
Owner: there should not be a tone before TTS plays.
**Cause.** Read-aloud used to play a short descending tone ("wait", the Done Speaking tone) first and start the speech when that tone finished, to tell people the microphones were paused. It also delayed the speech by the length of the tone.
**Change.** Read-aloud now starts at once, with no tone before it. The ascending tone that follows read-aloud (after the 300 ms pause, when listening resumes) is unchanged, and so is the low "bong" for text that goes to the compose box. The microphones are still paused for the duration of the speech.
**Left as it was, on purpose.** The "Done Speaking tone" row in Settings → Device is still there and still saved, but it no longer plays before speech, so it now has no effect; removing the row would change another scenario that picks a tone there, so it waits for the owner's say (recommendation: remove it).
**Checks.** Failed first, pass: the controller test (the only cue is the one after speech), the browser scenario that lists the cues (only "speak"), and a no-audio-device case (speech starts at once with no cue; the cue after it reports no device). Controller 20/20 (this file was not in my earlier runs; it passed before this change), open mode 84/84, ask mode 34/34, keyboard 32/32, guest link 15/15.
