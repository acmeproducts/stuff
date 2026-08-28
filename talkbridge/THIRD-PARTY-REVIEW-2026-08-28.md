# TalkBridge R10.3 / R10.4 — Red-Team Reviewed Contract

**Date:** 2026-08-28

**Status:** HISTORICAL — built as 4f574f2, failed the owner device matrix, and
rolled back whole at 0b5b230. This is not current build authority.

**Authority:** superseded by master-plan §4.8 and
`talkbridge/NOTIFICATION-FLIGHT-RECORDER-SPEC.md`. In particular, the fixed
one-second acknowledgement window and unproved cold-launch navigation handoff
are buried and must not be tuned or rebuilt.

---

## 1 · Product rule

The experience must be **simple and consistent**. Platform differences are
acceptable only when they are current, documented limitations of installed
web apps—not as a substitute for engineering a consistent product.

For a locked/backgrounded iPhone, an incoming call is one system notification
with the system sound. An installed web app cannot provide a native CallKit
screen or a sustained background ringtone. TalkBridge will not imitate one by
sending repeated pushes.

## 2 · Exact baseline

Everything is built as **baseline + named patch = release**. Release artifacts
are never hand-edited.

| Piece | Baseline |
|---|---|
| App | `bridge-turn24-ship.html`, device-validated 2026-08-15 and revalidated 2026-08-27; its protected interior is byte-preserved by the assembler |
| Parts | `talkbridge/parts/p2-install-gate.js`, `p3-subscription.js`, `p4-alert-hygiene.js`, `p4-sw.js`, `p6-threads.js` |
| Worker | `tb-sw.js` assembled from the governed worker part |
| Relay | `talkbridge/worker-talk.js` v4.2 at deployed pair commit `e74c7cb2` |
| Current deployed artifact | `bridge-turn24-post-ship.html` at the same paired commit |
| Plan | `talkbridge/TALKBRIDGE-PLAN-v9.md` v20.2.0 |

R10.2's ALWAYS-PUSH relay is the historical deployed baseline. It is not an
untouchable design decision for R10.3/R10.4. The next build replaces inference
from socket presence with proof tied to the exact event, as specified in §7.

## 3 · Scope lock

### 3.1 In scope

- Delivery and presentation of incoming chat/call notifications.
- Exact missed chat, voice-call, and video-call counters on the app home page.
- Per-room, per-device notification mute.
- Event identity, call outcome state, delivery ledger, diagnostics, and gates
  required to make those outcomes testable.

### 3.2 Frozen and out of scope

- Existing chat bubbles, transcript rendering, and the fact that a chat bubble
  appears in the open room without sound or animation.
- Existing message content, translations, call media, microphone/video mute,
  phrasebook, threads, room layout, and install journey except where a named
  notification hook is strictly required.
- Native-call imitation, custom background sounds, and repeated push cadence.

**Important distinction:** content already rendered in an open room is not a
notification surface. Muting a room suppresses attention-seeking behavior; it
does not hide or rewrite existing chat content.

## 4 · User-experience contract

"OS alert" means a system notification plus the platform's permitted system
sound. "Home count" means the exact unread/missed count on TalkBridge's own
home page. App-icon badges are best-effort mirrors only (§6).

### 4.1 Unmuted chat

| Receiver state | Existing bubble/content | OS alert | Home count |
|---|---:|---:|---:|
| App visible in that room | Yes, unchanged | None | None |
| App visible in another room or on app home | Existing behavior unchanged | None | +1 exact chat |
| App hidden, phone home, or locked | On next room open | One alert for the room burst, ≤5s | +1 per message, exact |

A **room burst** begins with the first message after at least 10 seconds with no
message in that room. The first message alerts immediately. Each later message
within 10 seconds of the preceding message extends the burst, increments the
home count, and does not generate another OS alert. A message after at least 10
seconds of quiet may start one new alert. Bursts are per room and per receiving
device.

### 4.2 Unmuted voice/video call

| Receiver state | Live presentation | OS alert | If unanswered |
|---|---|---:|---|
| App visible in any TalkBridge room or on app home | Existing in-app ring screen and ringtone | None | Existing transcript outcome; exact voice/video home count unless that room is already being viewed |
| App hidden, phone home, or locked | No native call screen | Exactly one incoming-call alert with system sound, ≤5s; no repeats | No second OS alert; exact voice/video home count on next open |

One `call-start` produces at most one OS alert. `answered`, `declined`, and
`canceled` do not create a missed count. Only a terminal `timed_out` outcome
creates the missed voice/video count. The existing transcript outcome remains
unchanged.

The incoming notification remains ordinary notification-center history. The
release does not depend on iOS replacing or programmatically clearing it after
delivery, because current WebKit does not make that behavior reliable enough
to be a correctness condition.

### 4.3 Room muted on this device

Mute is per room and per device. It does not mute the partner or another
device, and it is unrelated to call microphone/media controls.

| Receiver state | Attention-seeking behavior | Existing content | Home count |
|---|---:|---|---:|
| App visible in the muted room | No sound, vibration, toast, ring screen, animation, or OS alert | Existing chat bubbles/transcript behavior remains unchanged | Exact missed chat/voice/video result when the user goes home |
| App visible elsewhere in TalkBridge | None | No forced navigation | Exact missed chat/voice/video count |
| App hidden, phone home, or locked | No OS alert or sound | Available when opened | Exact missed chat/voice/video count on next open |

A mute toggle is shown as active only after the relay acknowledges the
per-device room state. If that update cannot be confirmed, the app keeps the
previous state and shows a concise retry error; it must never claim the room is
muted while the relay may still send a declarative notification. The device
also stores the state for the legacy service-worker path.

## 5 · Red-team dispositions

| Proposed change | Disposition | Required replacement or condition |
|---|---|---|
| Declarative Web Push | **Accepted with redesign** | Use one versioned encrypted event envelope with stable IDs; supporting Apple systems display it declaratively and the worker parses the same envelope elsewhere. Do not claim the service worker is never involved. |
| Re-send `call-start` every 3.5s for 45s | **Rejected** | Send one call event and one OS alert. A push cadence is neither a ringtone nor reliably collapsed by iOS and creates the exact flurry/stacking failure the product forbids. |
| Build home counters from the service-worker journal, measure the gap later | **Rejected** | Use a durable, deduplicated event ledger with a per-device seen cursor. The service-worker journal remains delivery telemetry only. Exact counts are a launch gate, not a post-launch experiment. |
| Keep unconditional ALWAYS-PUSH as the permanent arbiter | **Re-engineered** | A visible app may suppress a push only by acknowledging presentation of the exact event. Absence of that exact acknowledgement falls back to push. Socket presence, heartbeat age, and unrelated traffic never suppress. |
| Depend on notification `tag` to replace/clear banners | **Rejected as a correctness dependency** | Tags may be used as cosmetic hints, but correctness permits one push in the first place and never requires delivered iOS banners to replace or disappear. |

## 6 · Platform contract

| Capability | iOS/iPadOS installed web app | Android installed web app |
|---|---|---|
| Hidden/locked call | One standard notification + system sound | One standard notification + system sound |
| Sustained background ringtone/native answer UI | Not promised; requires native platform APIs | Not promised by this web build |
| Declarative Web Push | Primary on iOS/iPadOS 18.4+ | Same envelope handled by the worker |
| Legacy delivery | Service-worker notification where declarative delivery is unavailable | Service-worker notification |
| App-icon badge | Best effort; may be affected by OS/user settings | Best effort; launcher-dependent |
| In-app home counters | Authoritative and exact | Authoritative and exact |

The app-icon badge may mirror the total but is never the only record. The
TalkBridge home page is the cross-platform source of truth.

## 7 · Engineering contract

### 7.1 One event envelope

Every push-worthy event has a stable `eventId`, `roomId`, `kind`, version,
timestamp, and navigation target. Calls additionally carry `callId`,
`voice|video`, and an explicit state (`started`, `answered`, `declined`,
`canceled`, `timed_out`). A retry preserves the same IDs.

The encrypted payload contains only generic notification text and routing/
dedupe metadata—never message or transcript content. `Topic` is derived from
the event or room policy; the global `tb-wake` topic is forbidden because it
can collapse unrelated outstanding events.

### 7.2 Exact presentation acknowledgement

1. Relay writes the event to the recipient's durable ledger and sends it on
   that recipient's socket, if any.
2. A **visible** app presents the applicable in-app experience and returns
   `presented(eventId)`. Merely having a socket, receiving the event while
   hidden, pinging, or sending unrelated traffic is not an acknowledgement.
3. Relay waits no more than one second for that exact acknowledgement. If it
   arrives, no push is sent for that event/device. If it does not, the relay
   sends one encrypted push.
4. App and worker deduplicate by `eventId`. A call-state transition cannot be
   mistaken for an earlier `call-start`.

This is explicit presentation proof, not the abandoned presence/freshness
heuristic. It preserves foreground silence while failing safe toward delivery.

### 7.3 Durable counter ledger

The relay keeps ordered event metadata long enough to reconcile every device,
with a monotonic per-room cursor and `eventId` deduplication. It is separate
from the current 12-minute session-history lifetime. On open/reconnect the app
requests events after its last durable cursor, applies call terminal states,
updates exact chat/voice/video counters, then advances the cursor atomically.

Unconsumed notification metadata is retained until that device acknowledges it
seen or the device's existing 90-day subscription lifetime expires. A device
absent beyond that lifetime is treated as a new/uninstalled device; the UI and
diagnostics must say so rather than presenting an old count as complete.
Consumed records may be compacted only behind the acknowledged cursor.

Opening a room marks the applicable items seen using an acknowledged cursor.
Replaying the same event, draining a worker receipt, reconnecting, or receiving
both socket and push paths cannot increment twice. The service-worker journal
records `arrived`, `shown`, `failed`, and tap results for diagnostics only.

### 7.4 Declarative and legacy presentation

The relay emits Apple's versioned declarative JSON on supported systems. The
same decrypted envelope is understood by the service worker on older iOS and
Android. Declarative fallback behavior must be tested; the design does not say
that a registered worker is categorically uninvolved. Notification text stays
generic and one push always produces at most one display attempt per device.

## 8 · Verification gates

No device URL is handed to the owner until all machine gates are green at the
exact commit SHA.

1. Clean checkout: `npm ci`, complete app/worker/relay harness, then mutation
   suite; all declared dependencies must be present in the lockfile.
2. Assembly proof: protected ship segments are byte-identical and only named
   part sources contribute to the artifact.
3. Event proof: stable-ID retry dedupe; call-state transition table; no stale
   `call-start` after cancel/answer; exact voice/video typing.
4. Foreground proof: only `presented(theExactEventId)` suppresses that event's
   push. Hidden clients, stale/live sockets, pings, and unrelated messages do
   not suppress it.
5. Alert proof: one call push only; one chat push per defined room burst; no
   global wake topic; mute acknowledged before UI confirmation.
6. Counter proof: reconnect, socket+push delivery, journal replay, and process
   restart each leave exact counters with no double increment. Counter tests
   cross the old 12-minute history boundary.
7. Declarative/legacy proof: supporting Apple payload shape and fallback,
   Android/legacy worker parsing, generic content, tap navigation, and failure
   telemetry.
8. Live probe: subscribe both a visible-ack client and an absent client. The
   same traceable event must produce socket delivery/no push for the exact
   acknowledged device and one real push attempt for the absent device. The
   assertion uses per-event diagnostics, not a single overwriteable
   `lastWake` slot.
9. Adversarial gate: every planted defect corresponding to items 2–8 must fail
   the suite. A same-tag mock alone is not evidence that iOS replaced a banner.

### 8.1 Owner device matrix

Run the following 12 cases with iOS receiving from Android, then Android
receiving from iOS. A result is recorded per cell with sender timestamp,
receiver presentation time, count before/after, and event ID.

| # | Case | Required result |
|---:|---|---|
| 1 | Unmuted chat, visible same room | Bubble unchanged; no OS alert; no home increment |
| 2 | Unmuted chat, visible another room/home | No OS alert; exact +1 chat |
| 3 | Unmuted chat, locked | One OS alert ≤5s; exact +1 chat on open |
| 4 | Three chats in one defined burst, locked | One OS alert total; exact +3 chat |
| 5 | Next chat after ≥10s quiet, locked | One new OS alert; exact +1 chat |
| 6 | Muted chat, visible same room | Existing bubble unchanged; no attention signal; exact home result |
| 7 | Muted chat, locked | No OS alert; exact +1 chat on open |
| 8 | Unmuted call, app visible | In-app ring/ringtone; no OS alert |
| 9 | Unmuted call, locked, then answered | One OS alert ≤5s; no missed count |
| 10 | Unmuted call, locked, timed out | One OS alert total; exact +1 voice/video missed count; no second OS alert |
| 11 | Call canceled after start | No missed count and no new/replayed incoming alert after the terminal state; an OS notification already delivered may remain in notification history |
| 12 | Muted call, locked, timed out | No OS alert; exact +1 voice/video missed count on open |

Each receiving platform must pass all 12 cases. Across the call rows, include
at least one voice and one video call and reverse their assignment in the
opposite direction. The owner runs this two-way matrix once against the same
unchanged candidate; the dev team owns all machine-testable repetition before
handover. Any failure, double, or flurry is a failed release—not a pass with a
caveat or an invitation to patch the candidate in place.

## 9 · Evidence standard and current sources

Platform assertions must be rechecked against current primary documentation at
build time. Vendor/blog examples may corroborate behavior but cannot overrule
the platform source or device evidence.

- Apple WebKit, Declarative Web Push: https://webkit.org/blog/16535/meet-declarative-web-push/
- Apple WWDC25 Declarative Web Push session: https://developer.apple.com/videos/play/wwdc2025/235/
- Firebase, receive messages in web apps: https://firebase.google.com/docs/cloud-messaging/web/receive-messages
- RFC 8030, Web Push `Topic` replacement semantics: https://www.rfc-editor.org/rfc/rfc8030
- WebKit bug 258922, notification tag/replacement status: https://bugs.webkit.org/show_bug.cgi?id=258922

## 10 · Release authority

The red-team review is complete and its dispositions are incorporated. This
document authorizes planning only. Code remains forbidden until the owner sends
the dev team the exact published v20.2.0 commit with a written instruction to
proceed; that message is the **GO**, and no second plan edit is required. After
GO, the dev team builds only this contract, runs §8, and hands the owner one
paired candidate for §8.1.
