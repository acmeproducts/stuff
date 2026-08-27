# TALKBRIDGE R10 — INDEPENDENT REVIEW PACKAGE
## Purpose: adversarial audit of Claude's conclusions by a reviewer with NO shared context

**Instructions to the reviewer:** You are auditing an AI assistant's engineering
conclusions on behalf of the product owner, who has lost confidence after
repeated "one step remains" claims. Your job is to find where the assistant is
WRONG. Do not accept any claim without checking it against the evidence quoted
here. Every claim lists what would falsify it. Answer the numbered questions at
the end, in order, with "confirmed / refuted / insufficient evidence" plus
reasoning.

---

## 1 · THE REQUIREMENT (owner's words, unedited)
"Flawlessly deliver notifications to a locked iPhone consistently with no lag."
Acceptance matrix: locked iPhone: message → one notification promptly; call →
rings, missed call notifies. App open in the room: zero notifications. App
open, other room: one alert, no double. Android equivalents. Both directions.
No flurries.

## 2 · SYSTEM (minimum context)
Single-file web app (GitHub Pages) + Cloudflare Worker relay (WebSocket
signaling + Web Push wake). iPhone runs it as an installed PWA (iOS 16.4+
web push). Phones connect per-room over WSS; a phone absent-or-stale gets a
payload-free push that wakes its service worker, which shows a notification.
Relay: R7 body (device-validated era) + exactly 3 additions:
freshness guard (socket counts as listening only if heard-from < 105s),
`Urgency: high` + `Topic` headers on wakes, read-only `diag` action.

## 3 · CLAIM TABLE — each with verbatim evidence and its falsifier

| # | Claim | Evidence (verbatim) | Falsified if |
|---|---|---|---|
| C1 | Relay wake path works end-to-end | Deploy-pipeline live probe on the production relay: `ws-deliver=ok`, `wake-attempted=ok`, `wake-result=status-404` (real webpush POST left the relay; push service answered), `no-wake-for-live=ok` | Probe output absent/fabricated — check `talkbridge/DEPLOY-STATUS.txt` in repo history |
| C2 | Android end-to-end healthy | Android log 2026-08-27 03:31:37: `[r8_push_room_subscribed] {"room":"fzcx55"}` + `4wrko6` + `s209sj` within 1s of boot; heal found subscription alive | Any Android capture showing subscribe failures |
| C3 | iPhone CAN subscribe (chain works when permission cooperates) | iPhone log 2026-08-26 15:17:35: `vapid-answer ok st:200` → `subscribe-call ok` → `[r8_push_subscribed] {"endpointHost":"web.push.apple.com"}` → `[r8_push_room_subscribed]`; persisted at 15:20:50 and 15:22 checks | That sequence absent from the owner's capture |
| C4 | Current iPhone failure is pre-relay, on-device | iPhone log 2026-08-27 03:34:27: `push_selfheal {why:"granted-but-no-subscription"}` → `enable_branch proceed` → `[r8_perm_answer] {"perm":"denied","prop":"granted"}` → `enable_exit denied:denied`. No subscription ⇒ no push possible from ANY relay. Same phone rang twice earlier via socket while app open (03:33:38, 03:33:48) | A capture showing subscription present AND wake sent AND no arrival receipt |
| C5 | The denied/granted contradiction is a known WebKit bug; the ANSWER is the unreliable one | Apple dev forums thread 725619: user reports getting 'denied' from requestPermission yet can still subscribe and receive pushes — "the problem seems to be only with the wrong result from Notification.requestPermission". Thread 761692: granted response but subscribe fails until Settings→Notifications→app toggled Off/On, then works | Reviewer finds Apple documentation contradicting this, or finds the threads misquoted |
| C6 | Relay changes did not remove/alter any R7 subscribe/deliver behavior | Relay gate 9/9 incl. "R7 body otherwise intact"; the 3 additions are wake-decision-tightening + headers + read-only diag | Reviewer diffs `talkbridge/worker-talk.js` vs commit eb7f4cd6 and finds altered subscribe/broadcast paths |
| C7 | No doubles by design when live | Freshness guard: `connected.has(clientId) && fresh` → skip push; background listeners ping every 30s (N4) so held sockets stay fresh | Owner reports doubles while app foregrounded post-N4, with receipts showing push arrival during a live socket |

## 4 · THE OPEN DEFECT + PROPOSED FIX (not yet shipped)
Defect: enable flow trusts the requestPermission ANSWER; on this device the
answer lies ('denied') while the property says 'granted' → flow aborts before
attempting subscribe → phone stays unsubscribed → backgrounded/locked = silence.
Proposed fix (from C5's documented behavior): when property says granted,
proceed to subscribe regardless of the answer; treat subscribe's own
success/refusal as the verdict; on genuine refusal, surface UI pointing to the
documented Settings toggle escape hatch.

## 5 · ALTERNATIVE HYPOTHESES THE ASSISTANT REJECTED — reviewer should re-weigh
- H1 "The relay is busted; revert to pure R7" — rejected per C1/C2/C4/C6.
- H2 "A dedupe/receipt mechanism between socket-ring and push exists and is
  failing (`sw_receipt_none` proves it)" — rejected: no such mechanism exists
  in the code; `sw_receipt_none` is the service worker's delivery journal
  reporting zero pushes ever arrived. Reviewer: grep the app for sw_receipt.
- H3 "Notification.permission property is the liar; answer is true; device is
  genuinely denied" — partially plausible; distinguishable because C5's thread
  says subscribe-anyway WORKS when state is actually granted; the fix makes the
  subscribe attempt itself the test, which is correct under EITHER liar.
- H4 "Deleting/reinstalling the PWA fixes it" — reinstall is what DESTROYED the
  working 15:17 subscription (fresh install = fresh storage, permission state
  carried but subscription gone).

## 6 · VERIFY INDEPENDENTLY
- App (deployed): https://acmeproducts.github.io/stuff/bridge-turn24-post-ship.html
- Repo: github.com/acmeproducts/stuff — relay `talkbridge/worker-talk.js`;
  R7 baseline at commit eb7f4cd6; parts `talkbridge/parts/`; gates
  `talkbridge/build/harness-r10.mjs` (26 tests), `mutate-r10.mjs` (20 planted
  defects); probe results `talkbridge/DEPLOY-STATUS.txt`; plan
  `talkbridge/TALKBRIDGE-PLAN-v9.md` (v16.13.0 changelog = full history).
- Owner device logs: quoted verbatim above; full texts in the owner's chat.

## 7 · QUESTIONS FOR THE REVIEWER (answer each: confirmed / refuted / insufficient)
1. Is the requirement (§1) complete and testable as stated?
2. Does the quoted evidence support C1–C7, taken at face value?
3. Is H1 (relay at fault) consistent or inconsistent with C2 and C4?
4. Is the proposed fix (§4) the correct engineering response to C5's
   documented behavior? Propose a better one if not.
5. What is the single highest-risk unverified assumption remaining?
6. What ONE test would you run next, and what result would prove the
   requirement met?
