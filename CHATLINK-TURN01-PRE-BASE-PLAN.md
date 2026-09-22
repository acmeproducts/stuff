# Chatlink Turn 01 pre-base: standalone owner portal migration plan

Status: planning approved by the user's request of 2026-09-21. This document changes no application code. The user has accepted chat-lab; it is the behavioral baseline, not an unfinished keyboard experiment.
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
