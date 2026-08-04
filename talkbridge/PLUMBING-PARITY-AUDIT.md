# TalkBridge — Plumbing Parity Audit (donor `f403d70` → current build)

**Purpose.** Kill "death by a thousand cuts." This is the systematic map of every reliability/plumbing capability from the robust pre-collapse engine (`bridge-turn08-pre-ship.html` @ `f403d70`, 14,893 lines) against the current build. So no lost capability is discovered one painful test at a time, and no source is forgotten. Updated whenever a plumbing release lands.

**Scope.** Reliability plumbing only — call/media engine, Deepgram/transcription, translate/detect, relay. NOT the donor's UI or session-management scaffolding (turn09 has its own; those are not to be ported).

**Method.** Capability-by-capability presence + fidelity check, not a raw function-name diff (the two files have different architectures, so a name diff produces false gaps). Verified by reading both implementations and, where possible, real-browser test.

**Current build audited:** `bridge-turn12c-base.html` (R1d output).

## Status legend
- ✅ PRESENT — in current build, fidelity equivalent to donor (verified)
- 🟡 THINNER — present but simpler than donor; works, watch for edge cases
- 🔧 FIXED — was a real gap, now restored in a named release
- ⏸ DEFERRED — intentionally not ported (visible UI, or out of plumbing scope)
- ❌ MISSING — real gap, not yet addressed

## Call / media reliability engine
| Capability | Status | Where / notes |
|---|---|---|
| Staged `runRecovery` (refresh→ICE-restart→rebuild) | ✅ PRESENT | Restored R1a. CALL object. |
| ICE restart (`createOffer({iceRestart:true})`) | ✅ PRESENT | R1a, recovery step 2. |
| Perfect-negotiation glare (`makingOffer`/polite) | ✅ PRESENT | R1a. Creator offer path + onSignal collision skip. |
| `replaceTrack` seamless mute/unmute | ✅ PRESENT | R1a. toggleMic, enabled-flag fallback. |
| Connect-timeout → recovery | 🔧 FIXED | R1a added it; R1b fixed arm point (mount→signaling). |
| Remote-video stall watchdog | ✅ PRESENT | R1a. startVideoWatchdog, 4-tick stall → recovery. |
| Keepalive datachannel | ✅ PRESENT | R1a. `ka` channel + startKeepalive. |
| Recovery-state cleanup on teardown | ✅ PRESENT | R1a. resetRecoveryState in teardown. |
| Partner-disconnected overlay | ⏸ DEFERRED | Visible UI — deferred to keep plumbing releases invisible. Restore in a visible release if wanted. |

## Deepgram / transcription pipeline
| Capability | Status | Where / notes |
|---|---|---|
| Socket-identity guard (stale-close ignore) | ✅ PRESENT | Baseline (turn09 "ROOT CAUSE FIX 2026-08-01"). `mySocket`. |
| Silence watchdog + restart (30s) | ✅ PRESENT | Baseline. _dgWatchdogTimer, DG_WATCHDOG_MS. |
| Dual socket: English secondary | 🔧 FIXED | Was gated Thai-only; R1d opens it for any non-English room. Fixes code-switch lag. |
| Cross-suppression (primary/secondary dedupe) | ✅ PRESENT | 250ms hold + _dgEnLastFiredAt window. |
| Credential-failure banner after N fails | ✅ PRESENT | Baseline. dgFailCount, DG_MAX_FAILS. |
| Reconnect after unexpected close | ✅ PRESENT | Baseline. 2s retry if call/mic still active. |

## Translate / detect
| Capability | Status | Where / notes |
|---|---|---|
| fastText WASM detection (176 langs) | 🔧 FIXED | Restored R1c. Was Thai-vs-EN char counter. 7 script-ranges + fastText detect() for Latin. Verified 12 langs. |
| Boot preload of model | ✅ PRESENT | R1c. _loadFastText() at boot. |
| Graceful fallback (WASM unavailable) | ✅ PRESENT | R1c. Falls to script-range then fb lang. |
| Translate retry w/ backoff | ✅ PRESENT | Baseline. translateWithRetry. |
| Translation cache (LRU) | ✅ PRESENT | Baseline. trCache, TR_CACHE_MAX 200. |
| MyMemory failure → "⚠ not translated" | ✅ PRESENT | Baseline. |

## Relay / presence / sync
| Capability | Status | Where / notes |
|---|---|---|
| Heartbeat ping/pong | ✅ PRESENT | Baseline. startHB, HEARTBEAT_MS. |
| Reconnect on close (2s backoff) | ✅ PRESENT | Baseline. wsReconnectTimer. |
| Force-reconnect on visibility return | ✅ PRESENT | Baseline. visibilitychange handler reconnects if socket not open. |
| Resend unacked/undelivered on reconnect | ✅ PRESENT | Baseline. resendUndelivered, chat_resend. |
| History-sync backfill for joining peer | ✅ PRESENT | Baseline "ported from test.html". mergeHistorySyncChunk. |
| Read-receipt reconcile on room entry | ✅ PRESENT | Baseline. renderTranscript→sendReadReceipts. |
| PB write-back-before-pull (no data loss) | ✅ PRESENT | Baseline. enterRoom flush-then-pull. |
| PB version mgmt (no bump on entry, highest wins) | ✅ PRESENT | Baseline "VERSION-MANAGEMENT RULING 2026-07-30". |
| PB writeback single-flight + 409 retry | 🔧 FIXED | R1b. Was dropping on 409. |

## Open real gaps (the only things left to decide)
1. **Partner-disconnected overlay** — ⏸ deferred as visible UI. Decision: restore in a visible release, or leave out. Not plumbing.

**Every other plumbing capability is accounted for.** The R1a–R1d chain restored the four real losses (call recovery, PB 409, fastText detection, dual-socket gate). Nothing else in the reliability plumbing is missing or unaccounted-for as of `bridge-turn12c-base.html`.
