# TalkBridge Notification Flight Recorder — OBS1 Contract

**Version:** 1.0.1
**Date:** 2026-08-28  
**Authority:** TalkBridge master plan v20.4.1 §4.8
**Build:** R10.2-OBS1  
**Purpose:** explain notification and call-presentation behavior without
changing it

## 1 · Non-negotiable boundary

OBS1 is an observation build from the byte-verified R10.2 rollback. It may add
side-effect-free trace calls, bounded diagnostic storage, a read-only relay
trace endpoint, and one mobile diagnostics/export panel. It may not repair,
tune, suppress, resend, delay, reroute, or otherwise change product behavior.

OBS1 does not prove R10 acceptance. A green OBS1 gate means the recorder is
safe and truthful enough to diagnose one physical-device run.

## 2 · Questions one export must answer

For every message or call under test, the export must answer, without inference:

1. What did the sender create, with which correlation identifiers?
2. What did the relay receive, persist, send on a socket, suppress, or submit
   to the push service for each recipient?
3. Did this service worker receive a push event? What payload class did it see?
4. What app windows did the worker observe, and what did it ask the OS or a
   window to do?
5. What lifecycle and surface did the app itself observe at receipt time?
6. Was an in-app call surface requested and then confirmed mounted?
7. Was ringtone playback requested, started, blocked, stopped, or failed?
8. What did a notification tap request, and where did navigation actually end?
9. What terminal call action occurred, and was a transcript/home record
   requested and confirmed?
10. Which stages are absent, contradictory, or outside the web platform's
    ability to observe?

## 3 · Truth labels and platform boundary

Every state assertion has one of three provenance values:

| Provenance | Meaning | Example |
|---|---|---|
| `observed` | Code directly observed it in its own context | `document.visibilityState = hidden` |
| `test_supplied` | Tester selected the physical condition | device was locked |
| `unknown` | This web build cannot prove it | OS banner was visible to the user |

The following rules are mandatory:

- Page visibility and focus do not prove whether the phone is locked.
- A Web Push service response proves request acceptance/rejection only. A 2xx
  response is never labeled delivered, displayed, sounded, or seen.
- `showNotification()` resolving proves only that the browser accepted the
  request. It does not prove sound, vibration, banner visibility, or attention.
- Missing service-worker receipt does not prove that no declarative
  notification was displayed.
- A worker observing zero window clients does not prove that the app is
  uninstalled, terminated, or the device locked.
- Tester observation belongs only in the enumerated run condition/scenario,
  never in an `observed` field.

## 4 · Identifiers and correlation

| Field | Requirement |
|---|---|
| `schemaVersion` | Exact recorder schema, initially `tbfr/1.0` |
| `buildId` | Candidate commit SHA or immutable candidate identifier |
| `appVersion` | App observation-part version |
| `swVersion` | Service-worker observation version |
| `relayVersion` | Relay observation version |
| `installId` | Random per-install identifier, exported only as salted hash |
| `testRunId` | Random ID created when the tester starts a run |
| `traceId` | Stable per logical sender event; generated at the first observable stage |
| `eventId` | Existing stable product event ID when available; otherwise null with `idGap` |
| `callId` | Existing call ID for call events; otherwise null |
| `recordId` | Globally unique trace record ID |
| `seq` | Monotonic integer allocated per source/context |

OBS1 must not invent a product `eventId` and feed it back into behavior. When
the R10.2 event has no stable event ID, the recorder creates only a diagnostic
`traceId`, records `eventId: null`, and emits `id_gap`. The trace ID may travel
in an additive diagnostic field only where doing so does not affect routing,
deduplication, `Topic`, notification tags, or application decisions.

Raw room, device, subscription, and endpoint identifiers are normalized with
SHA-256 and a random salt: per-install in app storage and per-process in the
relay diagnostic ring. Exports use the first 16 hexadecimal characters with a
type prefix, for example `room:19af8b87b0c84be3`. Only the content-free event
trace hash uses the same domain across layers so a timeline can be joined.

## 5 · Canonical JSONL record

Each JSONL line is one JSON object with this shape. Nullable keys remain
present so missing evidence is machine-visible.

```json
{
  "schemaVersion": "tbfr/1.0",
  "recordId": "rec_01J...",
  "testRunId": "run_01J...",
  "traceId": "tr_01J...",
  "eventId": null,
  "callId": "call:32f1c64f9d1ab340",
  "eventKind": "call_start",
  "source": "app",
  "action": "call_surface_mount",
  "outcome": "confirmed",
  "reason": "incoming_overlay_visible",
  "seq": 42,
  "time": {
    "wallIso": "2026-08-28T14:05:12.345Z",
    "epochMs": 1787925912345,
    "monotonicMs": 9123.4,
    "provenance": "observed"
  },
  "versions": {
    "buildId": "commit-or-candidate-id",
    "appVersion": "obs1-app/1",
    "swVersion": "obs1-sw/1",
    "relayVersion": "obs1-relay/1"
  },
  "subject": {
    "roomHash": "room:19af8b87b0c84be3",
    "deviceHash": "device:ab4271f64b07d123",
    "subscriptionHash": null
  },
  "state": {
    "surface": "event_room",
    "lifecycle": "visible_focused",
    "visibility": "visible",
    "focus": true,
    "currentRoomMatches": true,
    "socket": "open",
    "swController": "obs1-sw/1",
    "permission": "granted",
    "testCondition": "foreground_event_room",
    "testConditionProvenance": "test_supplied"
  },
  "detail": {
    "presentation": "call_screen",
    "elapsedFromTraceStartMs": 83
  },
  "redactions": [],
  "error": null
}
```

Additional `detail` keys must come from a documented allow-list. Unknown keys
are rejected by the recorder, not serialized opportunistically.

## 6 · State vocabulary

### 6.1 App surface

`home`, `event_room`, `other_room`, `call_screen`, `install_permission`,
`diagnostics`, `unknown`

Surface is derived from actual visible DOM/screen state. A requested surface is
logged separately and never substituted for a confirmed mount.

### 6.2 Lifecycle

`visible_focused`, `visible_unfocused`, `hidden_client`, `no_window_client`,
`unknown`

The worker may record `no_window_client`; the app cannot. The app may record
visible/focus states; the relay cannot. Reports must retain source ownership.

### 6.3 Tester condition

`foreground_home`, `foreground_event_room`, `foreground_other_room`,
`background`, `locked`, `muted_room`

The condition is selected before the event and is always `test_supplied`.

### 6.4 Delivery path

`socket`, `worker_push`, `declarative_possible`, `history_reconcile`, `unknown`

`declarative_possible` means only that the event could have followed a path not
observable by worker code. It never means declarative display was confirmed.

### 6.5 Presentation

`none`, `content_bubble`, `home_counter`, `call_screen`, `ringtone`,
`os_notification_request`, `navigation`, `unknown`

An existing quiet chat bubble is recorded as content, not as an alert.

## 7 · Required event taxonomy

### 7.1 App events

- `recorder_boot`, `run_started`, `run_label_changed`, `run_stopped`
- `lifecycle_changed`, `focus_changed`, `surface_changed`, `room_changed`
- `sender_event_created`, `socket_send_attempt`, `socket_send_result`
- `relay_event_received`, `history_event_applied`
- `content_render_requested`, `content_render_confirmed`, `content_render_failed`
- `call_surface_requested`, `call_surface_mount`, `call_surface_failed`
- `ringtone_requested`, `ringtone_started`, `ringtone_blocked`,
  `ringtone_stopped`, `ringtone_failed`
- `notification_open_received`, `navigation_requested`, `navigation_result`
- `call_answered`, `call_declined`, `call_canceled`, `call_timed_out`,
  `call_ended`
- `transcript_outcome_requested`, `transcript_outcome_confirmed`,
  `transcript_outcome_failed`
- `home_counter_before`, `home_counter_delta`, `home_counter_after`
- `subscription_snapshot`, `subscription_changed`, `permission_snapshot`
- `sw_registration_snapshot`, `sw_controller_changed`
- `credential_capability_snapshot`, `credential_validation_result`
- `trace_gap`, `id_gap`, `version_mismatch`, `invariant_violation`
- `recorder_error`, `export_created`, `records_pruned`

### 7.2 Service-worker events

- `sw_boot`, `push_arrived`, `push_payload_classified`, `push_payload_failed`
- `window_match_started`, `window_match_result`
- `client_message_attempt`, `client_message_result`
- `notification_request`, `notification_request_accepted`,
  `notification_request_failed`
- `notification_tap`, `notification_close_request`
- `focus_attempt`, `focus_result`, `open_window_attempt`, `open_window_result`
- `journal_write_result`, `subscription_change_received`
- `trace_gap`, `id_gap`, `version_mismatch`, `invariant_violation`,
  `recorder_error`

### 7.3 Relay events

- `relay_event_received`, `relay_event_rejected`, `recipient_evaluated`
- `socket_delivery_attempt`, `socket_delivery_result`
- `wake_scheduled`, `wake_suppressed`, `push_request_attempt`
- `push_service_response`, `push_request_failed`
- `subscription_registered`, `subscription_removed`, `subscription_expired`
- `diag_query`, `trace_gap`, `id_gap`, `version_mismatch`,
  `invariant_violation`, `recorder_error`

Every attempt has exactly one terminal result or a generated `trace_gap`.
Exceptions are recorded with allow-listed error name, phase, and normalized
message category; stack traces and raw payloads are not exported.

## 8 · Instrumentation points

Hooks wrap and call through to existing behavior. They never replace a product
function or change its arguments/return value. An asynchronous trace write is
fire-and-forget from the product path; recorder failure cannot stop product
work and must surface later as `recorder_error`.

Required app hooks surround, not rewrite:

- relay send and relay receive dispatch;
- `handleRelay` and incoming call entry;
- call overlay visibility/mount observation;
- ringtone media `play()`/pause outcomes;
- room entry and screen/surface switching;
- call answer/decline/timeout/cancel handlers;
- transcript outcome insertion and home-card/counter update;
- notification-open messages from the worker;
- service-worker registration/controller/subscription snapshots; and
- Deepgram/translation capability resolution, presence only.

Required worker hooks surround push, client matching, `postMessage`,
`showNotification`, `notificationclick`, `focus`, and `openWindow`.

Required relay hooks surround inbound event classification, recipient loop,
socket delivery, wake decision, push request and response. The read-only
diagnostic query is keyed by test-run/trace identifiers and cannot mutate
subscriptions, rooms, connections, history, or wake decisions.

## 9 · Storage, retention, and transfer

### 9.1 Device

- IndexedDB database `tb-flight-recorder`, schema version 1.
- Stores: `records`, `runs`, and `meta`.
- Maximum 5,000 records across all completed/current runs.
- Maximum age seven days.
- Prune oldest-first after writes in batches no larger than 100.
- App and worker write to the shared `records` store using globally unique
  `recordId` keys. Reconciliation/export reads that store directly, so there is
  no drain window that can lose or duplicate a worker record.
- If IndexedDB is unavailable, keep a bounded in-memory buffer of 200 records,
  mark the run `durability_degraded`, and make that visible in the panel/export.

### 9.2 Relay

- Bounded diagnostic ring: maximum 2,000 redacted records and maximum age 24h.
- Read-only query requires an already valid device/room relationship and
  returns only records matching the requesting hashed device and supplied run
  or trace ID.
- No new durable user profile or content store is introduced.

### 9.3 Clock handling

Records retain each source's own wall and monotonic clocks. Merge order uses
causal identifiers and per-source sequence first, wall time second. The report
calculates observed clock offsets when request/response pairs allow it and
prints `clock_uncertain` when ordering cannot be established. It must not fake
millisecond precision across phones, worker, and relay.

## 10 · Mobile diagnostics panel

The **Diagnostics** control is reachable from home and from a room. The panel:

- shows build/app/worker/relay versions and blocks a valid-run badge on mismatch;
- starts a run with a generated ID and requires enumerated receiving condition,
  event scenario, and receiving platform selections; there is no free-text
  note/name field;
- requires one condition selection: foreground home, foreground event room,
  foreground other room, background, locked, or muted room;
- shows record count, last event, durability status, trace gaps, invariant
  violations, and whether the relay slice was retrieved;
- exports **JSONL** and **Human report** from one snapshot;
- copies the human report where browser sharing/download is unavailable; and
- clears diagnostic records only after a confirmation. Clear never touches
  rooms, messages, calls, subscriptions, credentials, or app settings.

No control requires console access, desktop developer tools, a connected Mac,
or knowledge of internal IDs.

## 11 · Human report

The human report is generated solely from the exported JSONL snapshot. It
contains:

1. run label, tester condition/provenance, export time, and version manifest;
2. recorder health: persistence, dropped/rejected records, clock uncertainty,
   redaction count, relay availability, and mixed-version status;
3. one timeline per trace in causal order with elapsed times;
4. state at receipt: home/event room/other room, visibility, focus, socket,
   worker controller, permission, and tester condition;
5. presentation summary: content, call surface request/mount, ringtone result,
   OS-notification request acceptance, tap and final navigation;
6. terminal summary: answer/decline/cancel/timeout, transcript outcome, and
   home-counter before/delta/after where the baseline exposes them;
7. every `trace_gap`, `id_gap`, `version_mismatch`, `clock_uncertain`, and
   `invariant_violation` in plain language; and
8. matrix-ready row with sender time, first receiver-observed time, elapsed,
   requested/confirmed surfaces, terminal outcome, and evidence limitations.

The report uses these words precisely:

- **observed** — the named source directly saw it;
- **requested** — code asked another layer to do it;
- **accepted** — the called API/service accepted the request;
- **confirmed** — the same layer could verify the resulting app state;
- **test reported** — the tester supplied it; and
- **unknown** — the web build cannot verify it.

## 12 · Invariants and named gaps

The reporter evaluates, at minimum:

- every attempt has one terminal result;
- a call-surface request without confirmed mount/failure is a gap;
- ringtone start without later stop/terminal state is a gap;
- notification tap without focus/open result is a gap;
- navigation request without final observed surface is a gap;
- decline/answer/cancel/timeout without a terminal transcript outcome is a gap;
- counter delta without before/after snapshots is a gap;
- push-service acceptance labeled delivered/displayed is an invariant violation;
- locked state labeled observed is an invariant violation;
- a secret/content/raw identifier field is a schema and redaction failure;
- mismatched non-null build/app/worker/relay versions invalidate the run;
- duplicate `recordId` with different content is an invariant violation; and
- identical `eventId`/stage repeated without retry labeling is flagged, not
  silently deduplicated from the evidence report.

## 13 · Security and redaction allow-list

Permitted detail classes: enums, booleans, counts, durations, HTTP status,
WebSocket ready state, normalized error name/category, payload byte count,
generic event kind, hashed identifiers, version, and causal IDs.

Forbidden everywhere: message/transcript/translation text, display name,
room title, invite URL/token, raw room/session/device/client IDs, full endpoint,
subscription keys, VAPID material, Deepgram key, any credential value, IP,
user agent string, SDP/ICE content, audio/video, arbitrary exception objects,
cookies, localStorage/sessionStorage dumps, and DOM/HTML snapshots.

The writer is allow-list based. Tests inject canary values into every forbidden
class and require zero canary bytes in IndexedDB, relay diagnostics, JSONL,
human report, and build/test output.

## 14 · Machine gates

OBS1 cannot be published unless all are green:

1. Baseline assembly and protected-segment byte gates.
2. Existing R10 app/worker/relay harnesses and mutations.
3. JSON schema: required/nullable fields, enums, allow-list rejection.
4. Correlation: app + worker + relay synthetic records merge into one trace.
5. Missing-stage detection: one planted omission produces the named gap.
6. False-proof detection: accepted→delivered and visibility→locked mutations
   fail.
7. Redaction canaries fail every forbidden-field mutation.
8. Retention: 5,001st record and eighth-day record prune correctly; batching is
   bounded.
9. Restart: worker and app records survive in the shared store without
   duplication.
10. Ordering: per-source sequence survives skewed wall clocks; uncertain cross-
    source order is labeled.
11. Export parity: every human timeline/summary item maps to a JSONL record;
    the same frozen snapshot drives both outputs.
12. Version mismatch blocks valid-run status and appears in both exports.
13. Failure containment: rejected/failed trace storage cannot change wrapped
    product return values, timing decisions, or thrown errors.
14. Relay diagnostic endpoint is read-only, bounded, scoped, redacted, and
    cannot affect wake decisions.
15. UI access: diagnostics opens from home and room; export and clear operate
    on mobile; clear leaves all product stores byte-equivalent.
16. Mutation gate plants and catches at least one defect for every item 3–15.

## 15 · Handover and next decision

Publish one immutable paired OBS1 candidate and byte-verify its app, worker,
relay, plan, and spec at the same commit. The handover states machine-gate
scores and clearly says notification behavior is not yet an acceptance claim.

The owner performs one short run that reproduces any one of the observed
failure classes and exports both outputs. No 12×2 acceptance matrix is run on
OBS1. The export then determines which behavior contract changes. That change
requires a written review addendum and one clean candidate from the governed
baseline; OBS1 is never patched forward into a product fix.
