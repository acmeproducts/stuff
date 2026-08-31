# TalkBridge R10 whole-release root cause

**Status:** Complete

**Cycle:** `r10-recovery-2026-08-30`

**Governance stage produced:** `root_cause_required` → `plan_required`

**Frozen baseline:** R10.2 app / `tb-sw.js` / relay v4.2

**Rejected evidence:** R10.5 product commit `13b3d9ae`; R10.6 candidate `95cd9593`, merge `b4fd0f51`, rollback PR #644

## 1. Verdict

R10.5 failed as a whole because it attempted to make notifications exact by
adding a second state system around the accepted app instead of establishing
one recipient-event authority for the entire lifecycle. The relay ledger,
relay presentation decisions, relay call state, browser-local counted set,
existing room counters, current UI route, and existing reconnect handlers could
each finalize a different part of the same event at different times.

That distributed authority made the phone failures structural, not isolated:
events could be delivered quickly yet appear late at home, replay could erase
unseen events, an unanswered call could become globally canceled instead of
missed for its receiver, a suppressed event could be recorded as OS-owned, and
two lifecycle signals could start competing reconnects. The green test suites
did not disprove those failures because they called the new code paths with
constructed states and words rather than driving the real lifecycle sequence
that produced the defects.

R10.6 then compounded the failure by treating an unclassified credential
observation as authority for an entirely new provider-token platform before
this whole-release analysis existed. It retired the accepted credential path,
introduced mandatory Deepgram and TURN services, and failed both services in
production. R10.6 was therefore a new unproven fork, not the next correction.

## 2. Scope and evidence boundary

This finding uses:

- the frozen R10.2/v4.2 hashes in `talkbridge/governance/r10-cycle.json`;
- the exact R10.5 diff from parent `49443e85` to `13b3d9ae`;
- the exact R10.6 diff from parent `47f77387` to `95cd9593`;
- the Android and iPhone logs supplied by the owner and already summarized in
  plan §4.9/§4.10 and graveyard G18–G20;
- the R10.5 app, relay, service worker, harnesses, and deployment workflow; and
- the R10.6 app, relay, provider services, harnesses, and failed live probe.

The analysis separates **proven cause**, **proven observation**, and
**unresolved observation**. No unresolved observation becomes replacement
scope without reproduction against the frozen baseline.

## 3. The causal architecture failure

### 3.1 No atomic recipient-event record governed the whole event

R10.5 introduced several partial authorities:

| Concern | R10.5 authority | Why it diverged |
|---|---|---|
| Event existence/order | Relay `ledger` and `lseq` | Stored an event but not its durable recipient seen state |
| Presentation choice | Relay `presentation[clientId|eventId]` | Named a selected branch, not necessarily a surface actually presented |
| Call outcome | Relay `calls[callId]` | One global state could not represent different caller and receiver outcomes |
| Replay dedupe | Browser `tb_counted_<roomId>` | Device-local and separate from the relay cursor and home counters |
| Missed counts | Existing room `waiting` state | Updated only when page reconciliation happened |
| Seen decision | Current browser route at replay time | Late UI state was treated as proof of earlier viewing |
| Recovery | Existing focus/visibility/online handlers | Reopened transport independently of ledger reconciliation |

These were coordinated by messages and wrappers rather than one durable
transition. A recipient event was therefore not atomically able to say:
created → presentation selected → push accepted or in-app rendered → unseen or
seen → recipient call outcome → home count applied.

### 3.2 R10.5 was a functional overlay, even though it was mechanically rebuilt

The assembler correctly regenerated the HTML from the frozen ship file plus
parts. The defect was not an accidental edit to the output file. The defect was
the functional boundary: `P4-presentation-owner` wrapped the existing
`handleRelay`, `LISTEN.handle`, `CALL`, `enterRoom`, `saveRooms`, and `p2Entry`
while the frozen call, waiting-counter, home-card, and network-recovery systems
remained active underneath it.

R10.5 added 2,758 lines and removed 415 across 15 files. In one release it
changed the app, relay, worker, subscription/mute behavior, presentation
ownership, ledger/cursors, call identity, navigation, counters,
instrumentation, harnesses, package scripts, and deployment probes. Those
changes described one user-facing concern, but they did not share one state
authority. The build was clean at the file level and split at the behavioral
level.

## 4. Failure-by-failure root cause

### 4.1 iPhone unseen events were erased during replay — proven

`p4LedgerSyncRoom` calculated `viewingNow` from `document.hidden`, `S.view`, and
`S.roomId` when synchronization eventually ran. It then marked every event in
the response counted and advanced the relay cursor to `maxL`, whether the event
had been visibly handled at arrival time or merely found the router naming that
room later.

The iPhone log shows the destructive result: away-period events were applied
with zero chat/voice/video increments and the cursor immediately advanced.
Once both the browser counted set and relay cursor moved, those events could
not appear as missed later.

**Root cause:** seen state was inferred at replay time instead of durably
recorded per recipient at event time.

### 4.2 Missed calls disappeared — proven

The relay call FSM mapped a `call-end` received while a call remained
`started` to `timed_out` only when the sender supplied
`reason === "missed"`; otherwise it became `canceled`. The ordinary product
hang-up path sends a bare `call-end`. The app's ledger reconciliation increments
a missed voice/video count only for `call-end` with `state === "timed_out"`.

The R10.5 relay harness hid this mismatch. Its timed-out test explicitly sent
`reason: "missed"`, while its bare-hangup test asserted that the call was
`canceled` and produced no missed typing. That validated the implementation's
assumption instead of the receiver's required outcome.

**Root cause:** one caller/global terminal state was used as the source of a
recipient-specific missed-call fact.

### 4.3 Home updates lagged behind working transport — proven

R10.5 reconciled ledgers on standalone boot, visibility return, and room open.
It did not reconcile on every active relay open or background room-listener
open. Thus a WebSocket could recover and deliver messages while durable home
state remained stale until another visibility action, room action, or peer
message caused work elsewhere.

Android showed fast foreground delivery but an other-room update beyond the
five-second contract. The iPhone home state appeared around later reconnect or
peer activity. Those observations are consistent with the missing
reconcile-on-open path and do not support a total relay outage.

**Root cause:** transport recovery and state reconciliation were separate
lifecycle systems.

### 4.4 Reconnects raced — proven

The accepted network layer independently registers `visibilitychange`,
`focus`, and `online`. Both visibility and focus commonly fire together when a
phone returns. `reconnectRelayNow` has no single-flight guard: the first event
can create a connecting socket; the second sees a non-open socket, closes it,
and creates another. The phone log shows this pattern as near-simultaneous
return/reconnect attempts.

R10.5 added ledger synchronization beside those handlers but did not make one
coordinator own transport reopening plus post-open reconciliation.

**Root cause:** lifecycle signals invoked reconnect imperatively without one
idempotent recovery transaction.

### 4.5 Presentation ownership was not truthful — proven

For a chat inside the burst window, the relay committed
`owner = "os", reason = "burst-suppressed"` while deliberately sending no
push. A suppressed event therefore claimed an OS owner even though no OS
presentation was requested. When an owner already existed, `_commitOwner`
resent the committed decision to a late or repeated readiness message, so the
page logged the owner again.

Android recorded both contradictions: `owner=os` with burst suppression and
duplicate owner/stale-close records.

**Root cause:** the state model conflated presentation selection, suppression,
push request, push-service acceptance, and actual OS display.

### 4.6 Deepgram and TURN were absent together — observed, not attributable

The iPhone log proves `dg_no_key` and `turn_unavailable {"hasCreds":false}` in
the rejected run. It does not prove where the bundle was lost or that the
frozen R10.2 baseline loses it.

The exact R10.5 change set did not modify `P2-install-gate`, `S.joinerKeys`,
`tb_dg_key`, `tb_cf_tid`, or `tb_cf_tok`. The shared invite/credential code was
unchanged between the R10.5 parent and candidate. Consequently the log cannot
be causally assigned to an R10.5 code change from the available evidence.

**Disposition:** exclude credential redesign from the replacement plan. A
credential change becomes eligible only if the exact frozen baseline is first
reproduced failing under a separately governed baseline test.

### 4.7 iOS notification display latency — unresolved by software logs

The records establish relay/push-service activity and later app activity. They
do not establish when iOS displayed a declarative notification. Absence of a
legacy service-worker receipt is not evidence that a declarative notification
was absent or late.

**Disposition:** preserve the OS-display interval as unknown unless a physical
tester supplies the display time. Do not tune software against an inferred
Apple interval.

## 5. Why the machine gates passed

The suites proved many code paths, but their model excluded the causal
sequences:

1. The app harness supplied ledger responses directly and asserted resulting
   counts. It never drove hidden-in-current-room → event arrival → socket loss
   → visibility and focus together → relay/listener reopen → replay.
2. The missed-call relay test manufactured `reason: "missed"`; the normal
   product hang-up words were tested as an intentionally non-missed cancel.
3. The reconnect layer had no lifecycle concurrency test. The harness contains
   no dispatch of the real visibility/focus/online combination.
4. Push tests proved request/encryption/worker behavior, not the physical time
   or surface on iOS.
5. Unit assertions treated an internal owner record as success even when the
   record said OS for a suppressed/no-push event.
6. Mutation tests showed that named assertions could detect planted edits.
   They did not show that the assertions represented the phone contract.

The suites were implementation-shaped: they asked whether the new machinery
did what its authors wrote, not whether one real recipient event survived all
transports and lifecycle transitions with one exact result.

## 6. R10.6 root cause and why none of it carries forward

R10.6 began before the release-level causes above had been banked. It converted
the paired credential observation into an opaque-authorization design with
one-time invite exchange, a Deepgram token endpoint, a TURN credential
endpoint, and three new production-secret dependencies. It also removed the
legacy browser credentials, so the two new services became mandatory rather
than optional.

R10.6 added 2,773 lines and removed 694 across 17 files. Its local harnesses
proved the internal authorization and event-state models with fake provider
responses. The production probe then passed seven relay/notification checks
and failed both real provider contracts. Existing evidence does not distinguish
missing Worker secrets from upstream refusal; it does prove that the mandatory
services were not operational before the candidate replaced the working path.

**R10.6 root cause:** an unresolved observation was promoted into a new
architecture and mandatory production dependency without baseline reproduction
or pre-cutover provider proof. The failure is the fork itself, not a single
secret that should now be added. G20 correctly buries the entire release.

## 7. Binding requirements for the replacement-plan stage

These are consequences of the root cause, not authorization to implement:

1. Start from the exact pinned R10.2/v4.2 files. No R10.5 or R10.6 source,
   service, token design, test assumption, or provider prerequisite is an
   input.
2. Replace the notification/event-state concern as one organ. Do not append a
   second ledger/counter/owner layer around the existing concern.
3. Establish one durable recipient-event record as the sole authority for
   presentation decision, push request result, seen state, recipient call
   outcome, and home count application.
4. Seen state changes only on exact visible handling of that event or explicit
   room open. Current route during replay is never historical evidence.
5. Model caller outcome and each receiver outcome separately. Exercise the
   product's ordinary bare hang-up words.
6. Use one single-flight recovery coordinator for visibility, focus, online,
   relay open, and listener open; every successful open reconciles before home
   state is declared current.
7. Keep `in_app`, `os_requested`, `suppressed`, `muted`, push acceptance, and
   OS display evidence distinct. Unknown remains unknown.
8. Derive tests from complete physical scenarios first. At minimum include the
   exact hidden-current-room replay, bare caller hang-up, simultaneous
   visibility/focus return, listener reopen without peer traffic, retry, and
   process restart sequences.
9. No credential-path work enters R10 without a separate frozen-baseline
   reproduction and explicit owner scope expansion.
10. The next candidate remains one whole release and one whole-pair rollback
    unit. Internal gates isolate invariants; they do not become patch releases.

## 8. Root-cause completion statement

The rejected cycle is now causally accounted for without borrowing an
unsupported credential diagnosis:

- R10.5's notification, missed-state, call-outcome, and reconnect failures came
  from distributed authority plus lifecycle-shaped gaps in its tests.
- Credential absence is a real observation from the rejected run but has no
  proven baseline or R10.5-diff cause.
- iOS display time is not observable from the available software records.
- R10.6 failed because it converted that unresolved observation into a new
  mandatory provider architecture before proving either the baseline defect or
  production prerequisites.

The only legal next action is to revise the master plan from these findings.
No product implementation or owner device test is authorized by this document.

## 9. R10-CR1 device-gate root cause (cycle `r10-recovery-2026-08-31`)

**Status:** Complete. **Rejected pair:** commit `339eb40` (app `bde6714e`,
worker `37f8027a`, relay v6.0 `8f787ae5`). Graveyard G21, G22.

### 9.1 What the device gate proved

- iPhone receiving: all four states (in room, home, hidden, locked) correct.
- Android receiving, visible: correct once a relay lane existed; the in-app
  Accept/Decline surface, missed pills and home counts were right (log
  06:25:20–06:25:34, 06:26:06–06:26:07).
- Android receiving, hidden/locked: the OS alert was requested, delivered and
  shown within ~300 ms (worker journal 06:26:43, 06:27:00; owner's shade
  screenshot 23:25–23:27). Delivery is not the defect.

### 9.2 Proven causes

**C1 — laneless interval after leaving a room (G21).** The recovery
coordinator opened lanes on visibility, focus, online, tap and open, but not
on room leave. Between 06:25:43 (leave) and 06:25:58 (60-second sync tick) the
relay held no connection for the device, so its record correctly said
`os_requested` for the 06:25:51 call: an OS banner appeared beside the visible
home and the in-app ring arrived 7 s late from the listener's first
reconciliation. Row 6 failed. The relay was right; the app lied by absence.

**C2 — tap focused a browser tab instead of the installed app (G22).** On
Android the install step leaves a Chrome tab open at the app URL; that tab
shares the service-worker registration with the installed app. The worker's
tap handler focused the first window whose URL contained the app file name,
which was that tab (showing the install gate), and posted the open message to
it, where nothing listens. Rows 7 and 8 failed on destination. This is a known
platform behaviour (w3c/ServiceWorker #720: a browser tab and the installed
app both match; the worker cannot tell them apart from the URL). iOS is not
affected: the browser tab and the installed app do not share a registration.

### 9.3 Open observations (not causes until reproduced)

- The 06:26:16 video call produced no push receipt on Android while the calls
  around it did; the relay-side push result for that record was not read
  (the diagnostic dispatch is blocked by the locked deploy workflow's
  version probe). To be read in the CR2 live gate.
- Whether the Android heads-up pop-up appeared on the lock screen is
  unverified; the shade entries prove display, not pop-up.

### 9.4 Why the machine gates passed

- No scenario left a room and measured the lane within the next 60 seconds.
- No scenario ran two window clients for the same URL (an installed window and
  a browser tab); the tap scenario had exactly one.
- The live probe reads the relay's own records, but the diagnostic path for a
  real room depends on a workflow input the governance lock made unusable at
  `candidate_ready`. Operational, not causal; fixed in the CR2 plan.

### 9.5 Binding requirements for the CR2 plan

1. Leaving a room opens that room's listener lane at once; no visible device
   is laneless for any interval. Machine gate: leave → call within 2 s → in-app
   surface, no OS request.
2. The installed app announces its window to the worker; a tap focuses only an
   announced window, never a browser tab; with no announced window the worker
   opens the app URL with the event hash. Machine gate: a gate tab and an app
   window coexist → tap reaches the app window only.
3. The relay's per-room diagnostic must be readable without a deploy.
4. Everything else in §4.11 stands: it passed on iPhone in all four states and
   on Android wherever a lane existed.

## 10. R10-CR2 device-gate root cause (cycle `r10-recovery-2026-08-31b`)

**Status:** Complete. **Rejected pair:** commit `0422654` (app `94bc9b6a`,
worker `a8a49dbf`, relay v6.1 `158b34a3`). Graveyard G23.

### 10.1 What this run proved

- G21 fixed and proven live on both phones: leave → listener lane open in
  ~0.4 s (Android 18:36:37.5→18:36:38.06; iPhone 18:33:44.7→18:33:44.97);
  the very next calls rang in-app instantly with no OS banner.
- G22 machinery armed (announcements logged); tap rows not reached before the
  run stopped on the new failure.
- Android in-room voice and video calls: correct surfaces, one missed pill
  per bare hang-up, counts from the relay only.

### 10.2 Proven cause

**C3 — attendance read from document visibility alone (G23).** After the
owner blurred or locked the iPhone, iOS kept the installed page RUNNING with
the DOM visibility flag still "visible": the log renders every 20 s through
the whole away window and `net_returned why:focus awayMs:52548/114458` proves
the app was unfocused, yet no hidden announcement ever fired. The heartbeat
therefore kept refreshing a "visible, in room" state at the relay; the relay —
correctly, by its record — decided `in_app` for the chats at 18:35:26 and
18:36:06, pushed nothing, and the app, believing itself watched, sent read
receipts and seen acknowledgements for messages nobody saw. Blur and focus
DID fire reliably on the same device. The defect is the app's definition of
"watching", not the relay's decision, the push path, or iOS delivery (all
proven on the CR1 run).

### 10.3 Binding requirements for the CR3 plan

1. A device is "watching" only while visible AND focused (attended). Window
   blur flips attendance off and is announced to the relay at once; focus or
   visibility return flips it on and recovers. The heartbeat carries the
   attended truth, so an unattended page goes to `os_requested` immediately,
   not after staleness.
2. Nothing is acknowledged as seen, and no seen word is sent, while
   unattended — even if the page is running in the event's room.
3. Machine gates: blur without any visibility change → chat → OS request
   raised, record `os_requested`, no seen word; focus return in the routed
   room → one explicit open. Planted defects: ignore blur; acknowledge while
   unattended.
4. Everything else in §4.12 stands, including the proven G21/G22 corrections.

### 10.4 Out of scope, reconfirmed on this run

`dg_no_key` on every Deepgram open on the iPhone (no voice transcription
there). Ship-era credential issue, separate work item, not an R10 cause.
