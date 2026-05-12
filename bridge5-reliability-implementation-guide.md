# Bridge5 Reliability Implementation Guide

## Purpose
This document is a developer-facing, explicit implementation plan to make `bridge5.html` reliable across:
- Join / rejoin (creator + joiner)
- Hang-up role behavior
- Mute/unmute + keyboard chat mode
- Deepgram recovery after media changes
- Audio normalization consistency
- Text/chat normalization consistency
- Reconnect and teardown safety

> Scope is intentionally constrained to `bridge5.html` unless explicitly noted.

---

## Current required product behavior (must remain true)

1. **Role-based hang-up**
   - `creator` pressing hang-up returns to lobby.
   - `joiner` pressing hang-up goes to goodbye/thank-you screen.
   - `joiner` should never enter creator lobby flow.

2. **Mute-for-typing**
   - While muted, user can continue keyboard chat.
   - While muted, speech transcription is paused (or intentionally disabled).
   - When unmuted, transcription resumes automatically and reliably.

3. **Join/rejoin**
   - Joiner invite flow always lands on joiner landing, then call.
   - Joiner rejoin from thank-you should return to joiner landing.
   - Creator restart should return to lobby setup (not joiner landing).

4. **Normalization**
   - Audio capture constraints are consistent across creator join, joiner join, and mic re-enable.
   - Transcript/chat text normalization is consistent at all ingest points.

---

## File map and where to work

Primary file:
- `bridge5.html`

Key regions in the current file (line numbers approximate and should be confirmed before edit):
- Role assignment and join/create:
  - `createRoom()`
  - `handleHash(p)`
  - `joinerProceed()`
- Relay lifecycle:
  - `connectRelay()`
  - `handleRelay(d)`
- Call entry:
  - `enterCall()`
- WebRTC:
  - `setupPC()`
  - `handleSig(d)`
- Deepgram:
  - `startDeepgram()`
  - `stopDeepgram()`
  - `onDGFinal(...)`
- Mic/cam controls:
  - `toggleMic()`
  - `toggleCam()`
- End-call flows:
  - `hangUp()`
  - `cleanUp()`
  - `showThankYou()`
  - `showHostLeftCountdown()`
  - `rejoinCall()`
- Global events:
  - `popstate`
  - `visibilitychange`
  - `pagehide`

---

## Implementation phases (do in order)

## Phase 1 — Introduce explicit session state and transition guards

### Goal
Stop regressions from implicit state mutations by introducing one authoritative session state object.

### Add
In `bridge5.html` global state section, add:
- `sessionEpoch` (number, increment on every call start/end)
- `callPhase` enum-like values:
  - `idle`, `prejoin`, `joining_media`, `call_connecting`, `call_live`, `call_degraded`, `ending_local`, `ending_remote`, `postcall_joiner`, `postcall_creator`
- `lastSessionContext` object:
  - `{ role, myLang, theirLang, roomName, pendingJoinSnapshot }`
- `micMutedByUser` boolean (separate from raw `micOn` if needed)
- `dgDesired` boolean (whether DG *should* be running)

### Change
1. Add utility:
   - `setCallPhase(next, reason)`
   - `bumpSessionEpoch(reason)`
2. Replace direct phase-like assumptions in:
   - `enterCall()`, `hangUp()`, `cleanUp()`, `showThankYou()`, `showHostLeftCountdown()`, `joinerProceed()`.
3. In each async callback (relay, DG, media promises), capture local `epoch` and return early if stale.

### Remove
- Any implicit phase inference from only `lobbyState`, `room.id`, and overlay visibility.

### Acceptance checks
- No path can run media or relay actions when `callPhase` is `idle/postcall_*`.
- Stale async callbacks cannot mutate active session.

---

## Phase 2 — Normalize role-based end-call and rejoin routing

### Goal
Enforce exact role behavior and remove ambiguous re-entry states.

### Change
1. `hangUp()` logic must remain explicitly role-based:
   - `joiner` => `showThankYou('You ended the call.')`
   - `creator` => `cleanUp()`
2. In `handleRelay(d)` when `d.type==='hangup'`:
   - current behavior is directionally correct; preserve role split.
3. Refactor `rejoinCall()`:
   - if joiner context exists (`_pendingJoin` or `lastSessionContext.role==='joiner'`) => show joiner landing.
   - if creator context exists => return to lobby setup with prefilled language fields where safe.
4. Ensure joiner never invokes creator-lobby-only controls.

### Add
- `routePostCallByRole(sourceReason)` helper that centralizes post-call destination.

### Acceptance checks
- Creator local hangup always ends in lobby.
- Joiner local/remote end always ends in postcall/joiner flow.
- Browser back/popstate does not leak joiner into lobby.

---

## Phase 3 — Audio normalization and capture consistency

### Goal
Guarantee same audio profile across all capture points and prevent DG/WebRTC drift.

### Add
1. `getMicConstraints()` helper returning one canonical audio constraint object used everywhere.
2. Optional: `buildDGProcessingGraph(track)` for consistent mono + level handling.

### Change
Use `getMicConstraints()` in all three places:
- `createRoom()` initial `getUserMedia`
- `joinerProceed()` `getUserMedia`
- `toggleMic()` unmute `getUserMedia`

### Remove
- Divergent ad-hoc audio constraint objects.

### Acceptance checks
- All capture calls reference same helper.
- No role-specific differences in audio constraints unless explicitly documented.

---

## Phase 4 — Deepgram lifecycle reconciliation (critical reliability)

### Goal
DG must always resume on unmute and stop intentionally on mute.

### Add
1. `reconcileDeepgramState(reason)`:
   - desired ON iff: in call + mic live + not ending + user not intentionally muted.
2. `isLiveMicTrackPresent()` helper that excludes silent synthetic track.

### Change
1. In `toggleMic()`:
   - Mute path: stop/remove real mic track, insert silent sender track if needed for peer stability, set `micMutedByUser=true`, call `stopDeepgram()`, set `dgDesired=false`.
   - Unmute path: acquire real mic, replace sender track, clear muted flag, set `dgDesired=true`, call `reconcileDeepgramState('unmute')`.
2. In `startDeepgram()` / `onclose`:
   - respect `dgDesired` and current epoch before retries.
   - do not retry when intentionally muted.
3. In `enterCall()`, relay reconnect success, visibility restore:
   - call `reconcileDeepgramState(...)` instead of direct `startDeepgram()` scatter.

### Remove
- Retry loops that only check `micOn` and ignore intent/state.

### Acceptance checks
- Muting immediately pauses DG.
- Unmuting restores DG without page reload.
- DG does not flap/retry while user intentionally muted.

---

## Phase 5 — Text normalization (speech + chat + transcript)

### Goal
Prevent duplicate/missed transcript/chat behavior from inconsistent normalization.

### Add
1. `normalizeText(raw, mode)` helper with modes:
   - `speech`, `chat`, `compare`
2. Recommended normalization steps:
   - Unicode NFKC
   - trim
   - collapse internal whitespace
   - remove zero-width chars
   - canonicalize smart quotes/apostrophes for compare mode

### Change
Apply normalization before logic in:
- `onDGFinal(...)`
- `sendChat()`
- `handleChatMsg(d)`
- `addTr(...)`
- `patchTr(...)`

### Remove
- Multiple partially-overlapping normalization snippets.

### Acceptance checks
- Repeated speech partial/final updates do not create duplicate lines from punctuation/spacing changes.
- Chat dedupe logic (if present) uses normalized compare key.

---

## Phase 6 — Chat reliability under reconnect

### Goal
Avoid message loss/duplication when relay reconnects.

### Add
1. Outbox map keyed by `chatId` with statuses: `queued/sent/acked`.
2. Relay message type `chat-ack`.
3. Dedupe set on receive keyed by `chatId`.

### Change
1. `sendChat()` queues then sends.
2. On reconnect/hello, resend only unacked messages.
3. `handleChatMsg()` acknowledges and ignores duplicates.

### Remove
- Blind replay of all prior messages/attachments without ack state.

### Acceptance checks
- Simulated relay drop does not duplicate already-received chat.
- Unsent chat is delivered after reconnect.

---

## Phase 7 — Unified teardown contract

### Goal
Stop inconsistent cleanup across `cleanUp`, `showThankYou`, `showHostLeftCountdown`.

### Add
`teardownSession(mode, reason)` where mode is one of:
- `to_lobby`
- `to_thankyou`
- `to_host_left_countdown`

### Change
Move shared teardown steps into this function:
- stop DG
- stop/release tracks
- close pc/ws
- clear timers (HB, reconnect, keepalive)
- clear transient RTC caches (`savedCandidates`, etc.)
- bump epoch

Then make the three end flows call `teardownSession(...)` and only handle role/UI-specific rendering afterward.

### Remove
- Duplicate cleanup blocks.

### Acceptance checks
- No lingering relay reconnect timer after call end.
- No stale remote tracks/subtitles leak into next call.

---

## Phase 8 — Instrumentation for regression-proofing

### Goal
Make failures diagnosable and prevent “fix one break one.”

### Add
1. Structured logging wrapper:
   - event, phase, role, epoch, relay state, pc state, dg state, mic/cam state, reason.
2. Counter metrics in-memory:
   - DG restarts, relay reconnect attempts, PC recreate count, chat retries.

### Change
Replace ad-hoc `log(...)` payloads in critical transition points with structured schema.

### Acceptance checks
- Timeline clearly shows: join → call live → mute → unmute → DG recovered.
- End-call path has unambiguous reason and destination.

---

## Explicit function-by-function edit checklist

### `createRoom()`
- [ ] Replace inline audio constraints with `getMicConstraints()`.
- [ ] Save `lastSessionContext` as creator.
- [ ] Set `callPhase` transition to joining/call_connecting.

### `handleHash(p)`
- [ ] Set `callPhase='prejoin'`.
- [ ] Snapshot `_pendingJoin` into `lastSessionContext.pendingJoinSnapshot`.

### `joinerProceed()`
- [ ] Use `getMicConstraints()`.
- [ ] Set role and `lastSessionContext` before `enterCall()`.
- [ ] Guard with epoch to ignore stale media promise resolutions.

### `enterCall()`
- [ ] Replace direct `startDeepgram()` call with `dgDesired=true; reconcileDeepgramState('enter_call')`.
- [ ] Set phase `call_connecting` then `call_live` when appropriate.

### `connectRelay()`
- [ ] Add epoch guard in handlers.
- [ ] Route reconnect behavior through `reconcileConnectivity()`.

### `handleRelay(d)`
- [ ] Keep role-based `hangup` branch.
- [ ] Ensure no UI transition if not current epoch/phase.

### `toggleMic()`
- [ ] On mute: intentional DG stop, set muted intent.
- [ ] On unmute: acquire real track, replace sender, reconcile DG.
- [ ] Ensure silent track is never treated as DG mic source.

### `startDeepgram()` / `stopDeepgram()`
- [ ] Respect `dgDesired`, `micMutedByUser`, and epoch.
- [ ] Retry only when desired ON.

### `sendChat()` / `handleChatMsg()`
- [ ] Normalize text via shared helper.
- [ ] Add outbox/ack/dedupe handling.

### `hangUp()`
- [ ] Preserve role split exactly.

### `cleanUp()` / `showThankYou()` / `showHostLeftCountdown()`
- [ ] Refactor common teardown into `teardownSession(...)`.

### `rejoinCall()`
- [ ] Branch using role-aware context.
- [ ] Joiner path => joiner landing only.
- [ ] Creator path => lobby setup only.

---

## Regression test matrix (manual + scripted)

## A. Role hang-up behavior
1. Creator starts call, presses hang-up.
   - Expect lobby visible, no thank-you.
2. Joiner in call, presses hang-up.
   - Expect thank-you.
3. Creator hangs up while joiner connected.
   - Joiner gets host-ended countdown/thank-you path.

## B. Mute/unmute + DG recovery
1. In active call, verify DG finals arriving.
2. Mute mic.
   - DG stops (or pauses) intentionally.
3. Unmute mic.
   - DG resumes within retry window without reload.
4. Repeat 5 times to catch flapping regressions.

## C. Keyboard chat while muted
1. Mute mic.
2. Send chat messages both directions.
3. Unmute and verify DG still resumes.

## D. Join/rejoin flow
1. Joiner invite -> joiner landing -> call.
2. Joiner ends call -> thank-you -> rejoin button -> joiner landing.
3. Creator ends call -> lobby -> can create a fresh room.

## E. Reconnect behavior
1. Simulate relay disconnect mid-call.
2. Ensure banner behavior and eventual reconnect.
3. Verify no duplicate chat insertions after reconnect.

## F. Normalization consistency
1. Send near-duplicate phrases with spacing/punctuation variants.
2. Verify dedupe/patch behavior is stable.

---

## Suggested delivery strategy (to avoid destabilization)
1. Implement Phases 1, 2, 4 first (state/role/DG reliability).
2. Ship behind temporary debug flags if needed.
3. Implement Phase 3 and 5 normalization next.
4. Implement Phase 6 chat ack last (protocol touching).
5. Finish with Phase 7 teardown unification and Phase 8 instrumentation.

---

## Definition of done
All items below must pass before merge:
- [ ] Role hang-up behavior exactly enforced.
- [ ] Joiner cannot access creator lobby path.
- [ ] DG always resumes after unmute in active call.
- [ ] Audio constraints unified through one helper.
- [ ] Text normalization centralized and applied consistently.
- [ ] Reconnect does not duplicate/loss chat.
- [ ] Teardown leaves no stale timers/tracks/connections.
- [ ] Structured logs clearly show lifecycle transitions.

