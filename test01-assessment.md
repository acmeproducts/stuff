# Talk + Say Reliability Review (Force-Ranked)

## Force Ranking

1. **Entry #1 — Sequence Sync + Handshake + ACK direction (Best fit)**
2. **Entry #2 — WebRTC replacement/managed signaling direction (Useful, but mismatched to current architecture assumptions)**

## Why this ranking

### 1) Entry #1 (Rank #1)
Entry #1 is stronger because it is **directly prescriptive against the observed failures** (session setup race conditions, reconnect loss, missing offline recovery) and it appears aligned to the current app shape (single-file app with localStorage + relay events + websocket lifecycle).

**What it gets right**
- Targets root cause: **message durability and sync gaps**, not only transport reconnect.
- Uses an incremental migration path: sequence IDs, sync request/response, persistent outbox, ACK state.
- Gives concrete edits (remove hello loop, move sync to `ws.onopen`, add handlers).
- Includes maintainability cleanup (dispatcher pattern, event delegation, render strategy).

**Where to tighten it**
- Sequence allocation should be per-sender, per-session and monotonic even across app restarts (persist counter).
- Must include idempotency (`msgId`) + dedupe map to prevent duplicate replay side effects.
- Needs explicit replay bounds and retention policy for localStorage growth.

### 2) Entry #2 (Rank #2)
Entry #2 has good transport-level ideas, but it assumes a **raw WebRTC problem** and proposes platform shifts (PeerJS/Firebase) that may be heavier than needed for a 2-person, low-concurrency phrasebook app.

**What it gets right**
- Correctly identifies signaling/reconnect as critical in WebRTC systems.
- Persistent signaling (Firestore) can improve renegotiation reliability.
- Recommends state machine handling for disconnect/restart.

**Why it ranks lower**
- Higher migration cost and dependency footprint for modest scale.
- Less directly actionable if the app currently uses relay/WebSocket messaging semantics.
- “Switch stack” proposals can delay reliability fixes that are possible now with durable messaging and sync.

---

## Executive summary of current system (as inferred from feedback)

The app has good UX and local phrase persistence, but reliability is weak due to **transport/event timing and lack of durable delivery semantics**.

### Current strengths
- Good chat+phrasebook UX flow and low operational footprint.
- Local persistence exists for content (phrasebook/messages), which is the right foundation.
- Small scale (2 users/session, <=3 concurrent sessions) allows simple robust protocols.

### Current weaknesses
- **Race conditions at connection startup** (send attempts before socket open).
- **No guaranteed delivery contract** (no durable outbox+ACK+replay).
- **No deterministic catch-up** after offline periods.
- **Over-aggressive heartbeat/reconnect** causes flapping on mobile network transitions.
- Likely monolithic handler growth causes regressions and duplicate binding risks.

---

## Recommended implementation plan (prescriptive)

## Method A (Recommended): Durable Messaging Protocol on current relay

### Objective
Make the existing architecture bulletproof without platform replacement.

### Protocol contract
Add these required fields to every chat payload:
- `sessionId`
- `msgId` (UUID)
- `senderId`
- `senderSeq` (monotonic per sender/session)
- `sentAt` (client clock)
- `type` (`msg`, `ack`, `sync_req`, `sync_res`)

### Required changes

1. **Add persistent sender sequence counter**
   - Add `seqBySessionSender` to localStorage.
   - On send, increment and assign `senderSeq`.
   - Never derive sequence from array length.

2. **Implement persistent outbox**
   - Add key: `ts_pending_<sessionId>`.
   - On send click: write message as `status:'pending'` before network attempt.
   - On `ws.open`: flush pending in sequence order.

3. **Add ACK lifecycle**
   - Receiver sends `ack {msgId, sessionId}` immediately after persisting incoming message.
   - Sender marks message `delivered` only on ACK receipt.
   - Keep retry timer for unacked messages (e.g., 5s/10s/20s capped).

4. **Add sync handshake on reconnect (replace hello loop)**
   - Remove periodic hello spam.
   - On `ws.open`, send `sync_req {lastSeenBySender: {<peerId>: <maxSeq>}}`.
   - Peer responds with `sync_res` containing missing messages only.

5. **Add idempotent dedupe**
   - Maintain `seenMsgIds_<sessionId>` (LRU capped, e.g., 2k IDs).
   - Ignore already-seen `msgId` payloads while still ACKing.

6. **Stabilize heartbeat and reconnect**
   - Heartbeat every 15s, timeout 60s.
   - Exponential backoff reconnect with jitter (1s → 2s → 4s → 8s → 15s max).
   - On reconnect attempt, close+null stale socket references before new connect.

7. **UI delivery indicators**
   - Pending: subtle “Sending…” badge.
   - Delivered: checkmark.
   - Failed after max retries: warning icon + tap to retry.

### Pros
- Highest reliability gain per unit effort.
- Minimal dependency changes.
- Works even with temporary asynchronous presence (one side reconnects later).

### Cons
- Requires careful protocol/versioning discipline.
- More local state and migration logic.

---

## Method B: Managed signaling / transport upgrade path

### Objective
Further reduce custom networking complexity by adopting managed signaling or managed P2P stack.

### Option B1: Keep WebSocket relay, add server-side mailbox
- Add lightweight server persistence for undelivered messages by `sessionId+recipientId`.
- Deliver backlog on reconnect before live stream.

### Option B2: WebRTC + persistent signaling (Firestore) for data channel
- Use Firestore room docs for offer/answer/candidate persistence.
- Add ICE restart flows on disconnection.

### Required changes (common)
- Define explicit connection state machine (`idle`, `connecting`, `connected`, `degraded`, `reconnecting`, `failed`).
- Isolate transport adapter from UI/store.
- Keep same durable message model (`msgId`, ACK, dedupe) regardless of transport.

### Pros
- Strong reconnect behavior with managed infra.
- Better long-term extensibility if transport needs grow.

### Cons
- Higher implementation/ops complexity.
- Additional external dependency and failure modes.
- Overkill risk for small personal app scale.

---

## What to do now (phased order)

### Phase 1 (must do)
1. Implement Method A steps 1–6.
2. Remove hello loop and duplicate listener bindings.
3. Add deterministic message reducer and dispatcher-based event handling.

### Phase 2 (should do)
1. Split data store vs UI state.
2. Convert full-history rerender to incremental append rendering.
3. Convert inline `onclick` handlers to delegated listeners.

### Phase 3 (optional)
1. Add relay mailbox persistence or managed signaling if still needed after Phase 1 metrics.

---

## Addendum: code quality and maintainability risks to address

1. **Identity model fragmentation**
   - Consolidate participant identity to one schema:
     ```js
     session.participants = {
       local: { id, name, lang },
       remote: { id, name, lang }
     }
     ```
   - Remove duplicate alias/name fields and fallback churn.

2. **God-function event handler**
   - Replace single large `handleRelayEvent` with typed handler map.

3. **Duplicate/unused logic**
   - Normalize data on write, not repeatedly on read.
   - Remove unused engine flags and duplicate icon/style constants.

4. **Rendering performance**
   - Only append/update affected message row.
   - Full rerender only on session switch or hard refresh.

5. **LocalStorage durability hygiene**
   - Version keys (`ts_v4_*`) and include migration guard.
   - Add compaction policy (e.g., keep latest 1,000 msgs/session unless pinned).

6. **Observability for reliability**
   - Add lightweight counters in debug mode:
     - reconnect attempts
     - pending queue depth
     - ack latency p50/p95
     - duplicate drops
   - This gives objective evidence that flakiness is resolved.

---

## Decision
For this app’s constraints, **implement Method A first**. It directly addresses message loss and reconnect flakiness with the least platform risk. Evaluate Method B only if Phase 1 reliability metrics remain below target.
