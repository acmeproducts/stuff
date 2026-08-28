# TalkBridge R10.3 / R10.4 — Third-Party Review Package
**Date:** 2026-08-28 · **Status:** DESIGN FOR VETTING — no code has been written against this document
**Audience:** external dev team. You are asked to attack the outcome contract (§3–§4), the baseline claims (§2), and the implementation approach (§5) before anything is built.

---

## 1 · What the product is

TalkBridge is a privacy-first, browser-based real-time bilingual translation app (chat + voice/video calls), installed as a web app from the browser (iOS 16.4+: Share → Add to Home Screen from any browser; Android: Install app). No app store, no accounts. Two people share a room; each sees the other's words in their own language. Infrastructure: a single Cloudflare Worker relay (WebSocket + Web Push sender), GitHub Pages static hosting. Push uses standard Web Push (VAPID → APNs/FCM), payloads end-to-end encrypted per RFC 8291 — push services never see content.

---

## 2 · Exact baseline

Everything below is built as **baseline + patch = release**. Nothing is ever hand-edited into a release artifact.

| Piece | Baseline | Where |
|---|---|---|
| App | `bridge-turn24-ship.html` — device-validated 2026-08-15, owner-revalidated 2026-08-27. Byte-preserved: the release is this file with part files appended before the final `</script>` by a mechanical assembler. A gate proves the ship bytes are verbatim in every build. | repo root |
| Parts (the patch) | `talkbridge/parts/p2-install-gate.js` (browser tabs show only an install screen; only the installed app runs), `p3-subscription.js` (push subscribe on open; the attempt itself is the authority, permission answers are recorded but never gate), `p4-alert-hygiene.js` + `p4-sw.js` (device-side presentation, per-room notification tags, durable receipt journal), `p6-threads.js` (derived rooms with explicit Accept/Decline consent) | `talkbridge/parts/` |
| Relay | `worker-talk.js` v4.2 — "ALWAYS-PUSH": every push-worthy event is pushed to every subscribed device except the sender, unconditionally. All server-side presence guessing (liveness stamps, freshness windows, ack timers) was deleted 2026-08-28 after log-proven failures. Crypto is gated byte-exact against RFC 8291 Appendix A. | `talkbridge/worker-talk.js` |
| Plan | `TALKBRIDGE-PLAN-v9.md` v20.0.0 — carries the decision record, the source index (S1–S5), and the abandoned index (A1–A6) | `talkbridge/` |
| Deployed pair | commit `e74c7cb` — app + worker + relay shipped in one commit; the pair always moves together | `main` |

**Design rule the reviewer should hold us to:** the server never decides whether a person is watching. The relay always sends; the device — the only place the truth exists — decides what is presented. This is the Firebase/web.dev/Apple-native model (sources in §6).

---

## 3 · The outcome contract (this is what gets built and device-tested)

✓ = happens, ✗ = does not happen. "Both platforms" unless a cell says otherwise.
"Home card" = the room card on the app's own home page carrying missed chat/voice/video counts.

### 3.1 Incoming call — room NOT muted

| Device state | Ring screen + looping in-app ringtone | OS notification + sound | Home card updates |
|---|---|---|---|
| In that room | ✓ | ✗ | ✗ (pill in transcript) |
| In another room | ✓ | ✗ | ✓ |
| On app home page | ✓ | ✗ | ✓ (behind the ring screen) |
| In another app | ✗ | ✓ repeating every 3–4s, ≤45s | ✓ on next open |
| Phone home screen | ✗ | ✓ repeating | ✓ on next open |
| Locked | ✗ | ✓ repeating, sound + vibration | ✓ on next open |

### 3.2 Missed call (any row above, unanswered)

| Device state was | One missed-call notification | Transcript pill | Home card count |
|---|---|---|---|
| App visible | ✗ | ✓ | ✓ (except in that room) |
| App not visible / locked | ✓ (ring banner replaced by it) | ✓ | ✓ |

### 3.3 Chat message — room NOT muted

| Device state | OS notification + sound | Home card count |
|---|---|---|
| In that room | ✗ | ✗ |
| In another room / app home | ✗ (in-app surfaces only) | ✓ |
| Not visible / locked | ✓ | ✓ |

### 3.4 Room MUTED (per-room "ringer off" inside the app)

Mute is **total, per room, per device**. Mechanism: the muting device tells the relay to drop its push subscription for that room; the app additionally presents nothing for it. So a muted room is not "silenced" — nothing is ever sent to this device for it.

| Device state, room muted | Ring screen | OS notification / sound | Home card | What still happens |
|---|---|---|---|---|
| In that room | ✗ (call → missed pill, silently) | ✗ | ✗ | transcript updates live |
| In another room / app home | ✗ | ✗ | ✗ (muted rooms never surface a home card) | panel card shows bell-off badge + unread count |
| Not visible / locked | ✗ | ✗ (no push exists) | ✗ | messages/pills accumulate; visible on next open in the panel |

Documented edges the reviewer should sanity-check: (a) mute toggled while offline reaches the relay only on reconnect — a push can slip through in that window; (b) mute affects only this device; the partner and other devices are untouched; (c) phone-level layers (silent switch, Focus, DND) stack on top for unmuted rooms, exactly as with any messaging app. **Open design question for the owner:** should an incoming call present when the user is actively inside the muted room (current rule: no — mute is total)?

### 3.5 iOS vs Android — the complete list of differences

| | Android | iOS |
|---|---|---|
| Notification sound when not visible | ✓ system sound per push | ✓ fixed system tritone per push; custom/looped sounds impossible (§6) |
| One banner that re-alerts (replace, never stack) | ✓ | ✗ — may briefly stack 2–3; cleared on open/answer |
| Continuous ringtone while not visible | ✗ | ✗ |
| Native full-screen call UI while not visible | ✗ | ✗ (CallKit is native-app-only; even native ringing is capped at 60s by Apple) |
| Notification display path | our service worker | OS-native via Declarative Web Push (§5.1), service worker optional |
| Everything else in §3.1–§3.4 | identical | identical |

---

## 4 · Why the current release misses two cells

Both were found on-device 2026-08-28 and are log-proven:

1. **"✓ on next open" home-card cells fail today.** The waiting counter that produces home cards bumps only when app JavaScript receives the event on a live socket. A locked iPhone's events arrive as pushes (service worker) and later as history catch-up — neither bumps. This is a ship-era gap that was invisible before locked-phone delivery existed; the counter mechanism itself is untouched ship code.
2. **iOS banner stacking** (§3.5 row 2): device showed stacked banners for one room despite same-tag notifications; iOS tag/`getNotifications` support is unreliable (§6).

---

## 5 · Implementation approach (to be built only after this review)

### 5.1 R10.3a — Declarative Web Push payloads (relay v4.3 + worker simplification)
Adopt Apple's shipped standard (iOS/iPadOS 18.4+, Safari 18.5): the encrypted push payload becomes the standard declarative JSON — `{"web_push": 8030, "notification": {"title", "body", "tag", "navigate", "app_badge"}}` — which **the OS displays with no service worker involved** on supporting platforms, and which our existing worker parses and displays on Android/Chrome (Apple's own recommended backwards-compatible migration).

- The relay already knows the event type and the room (session) at send time; the tap-through `navigate` URL is supplied by each client at subscribe time. Notification text stays generic ("New message", "Incoming call", "Missed call") — content never rides a push, and RFC 8291 encryption is unchanged.
- Deletes: the worker's current relay-history lookup used to guess which room a bare wake belonged to; the iOS silent-push penalty problem (no penalties apply to declarative messages — Apple's words); a class of "sometimes nothing" failures caused by worker eviction/revocation, because display no longer requires our code to run.
- Keeps: subscription flow (unchanged), per-room tags, the receipt journal on the worker path.

### 5.2 R10.3b — Ring cadence (client part + relay v4.3)
Ship sends `call-start` once. New: while an outgoing call is ringing and unanswered, the caller's app re-sends the ring event every 3.5s for up to 45s; stops on answer/decline/cancel. Receiver de-duplicates (an already-ringing room ignores repeats). At the relay these repeats are **push-worthy but not persisted** (new transient-but-pushed class) so history doesn't bloat. Locked-phone result: repeated notification sound ≈ a ring pattern, within the same ceiling every web app on Earth has (§6).

### 5.3 R10.4 — Home cards from the journal
The worker journal already durably records every notification it shows, with room and kind; the app already drains it on every open. New: each drained "shown" receipt for a non-active room bumps that room's waiting counter (chat/voice/video), producing the §3 "✓ on next open" cells. Call receipts carry the call kind in the declarative payload so voice/video counts are exact.
- **Known gap for the reviewer to weigh:** on iOS, when the OS displays declaratively *without* running our worker (worker evicted), no journal receipt exists — the notification shows but the card bump is missed. Candidate fallback: on open, reconcile counts from relay history since the last seen sequence number (mechanism exists in ship). We propose shipping journal-bump first and measuring the gap on-device before adding reconcile.
- Stated imperfection: an event both journaled and re-delivered live can count twice on a card. The card is a summons, not a ledger.

### 5.4 Process guarantees
- One gated pair: app + worker + relay in a single commit; byte-verification at the exact commit SHA.
- Gates before any device test: ship-verbatim proof, full behavioral harness (headless boot of the real built artifact), relay harness with RFC 8291 byte-exact vector, and mutation testing (every planted defect must fail the suite; current suite: 43 tests, 42 mutations, all green).
- The device matrix in §3 is the only gate that counts. Any deviation = rollback of the whole pair, graveyard entry, plan bump before rebuild.
- Nothing in this document is built until the third-party review and the owner's written GO.

---

## 6 · Source index (the in-the-wild proof)

- S1 Firebase Cloud Messaging receive model (server always sends; device decides): https://firebase.google.com/docs/cloud-messaging/js/receive
- S2 Google's reference pattern for visible-app suppression: https://web.dev/articles/push-notifications-common-notification-patterns
- S3 Web Push Book, common notification patterns: https://web-push-book.gauntface.com/common-notification-patterns/
- S4 Apple, "Meet Declarative Web Push" (WebKit, shipped iOS 18.4 / Safari 18.5; no silent-push penalties; backwards-compatible migration): https://webkit.org/blog/16535/meet-declarative-web-push/ · WWDC25 session: https://developer.apple.com/videos/play/wwdc2025/235/
- S5 No custom/looped web notification sounds — Apple engineer: https://developer.apple.com/forums/thread/736399 · sound removed from the standard, never implemented: https://pushpad.xyz/blog/sound-on-web-push-notifications · vendor corroboration: https://intercom.help/progressier/en/articles/6753668 , https://help.izooto.com/docs/notification-sounds
- S6 Native call UI requires CallKit + PushKit (native-only), and native ringing is capped at 60s by design: https://primocys.com/blog/flutter-voip-incoming-call-callkit-connectionservice/ · https://getstream.io/video/docs/react-native/incoming-calls/overview/ · https://developer.apple.com/forums/thread/726015
- S7 iOS notification tag/`getNotifications` unreliability: https://github.com/mdn/browser-compat-data/issues/19318

## 7 · Questions we want the reviewer to answer

1. Does the §3 contract miss any state (multi-device same user, thread rooms, Do-Not-Disturb interactions)?
2. Is the §5.3 journal-gap fallback (history reconcile) needed at launch, or is measure-first sound?
3. Any known production evidence against the 3.5s/45s ring cadence (push-service throttling, APNs collapse behavior)?
4. Muted-room row: should "in that room, call arrives" stay fully silent (current) or present in-room only?
5. Anything in §5.1 that breaks non-Apple browsers we haven't named?
