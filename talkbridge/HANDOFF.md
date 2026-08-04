# TalkBridge — Session Handoff (2026-08-04)

Read this fully before doing anything. Do NOT re-derive, re-decide, or "get up to speed" by re-reading everything and re-explaining it back. The scope below is settled.

## Prime directives (from the owner, non-negotiable)
- **Do the work silently.** No narrating tool calls, file reads, diffs, or reasoning in chat. It burns the owner's paid tokens and they are furious about it. Give only the result, in as few words as possible.
- **No patching forward.** On any gate failure: roll back to the last owner-approved build, then rebuild. Never stack fixes on a broken build.
- **The owner decides.** Bring findings, not a stream of consciousness. Do not re-open settled decisions.
- **Physical two-phone device test is the only gate.** "It passed my harness" is not "it works." Say so honestly; the sandbox cannot run real Deepgram / MyMemory / WebRTC.
- **Do not claim something is fixed unless it was proven.** Distinguish "proven in harness" from "reasoned but unproven (real WebRTC/device timing)."

## Where things actually stand
Current live file: `bridge-turn14-pre-base.html` (source = `turn09-post-ship`).

### What is CONFIRMED WORKING on the owner's real device (from their logs):
- **Chat normalization** — English spoken/typed in a Spanish room is normalized to Spanish and sent. Solid.
- **Call normalization LOGIC** — on a call, spoken English is detected (`fastText`), normalized to the room language, and shown on the speaker's own caption. The owner's own device log (debug at 15:07) showed: `call_detect en → call_normed "me perdí la videollamada" → call_showsub`. Normalization on calls is NOT the bug.
- **Deepgram `multi` mode** — opens `lang:multi` for multi-capable rooms; transcribes mixed EN/ES correctly. Working.
- **fastText WASM** — `ft_ready` fires, detection correct across es/fr/de/en/th/ko.

### The 6 amputation gaps (from `talkbridge/AMPUTATION-INVENTORY.md`) — all folded into turn14:
G1 normalization state machine, G2 DG multi-mode, G3 fastText, G4 Thai script, G5 epoch/phase, G6 call recovery. **Read `talkbridge/AMPUTATION-INVENTORY.md` — the 746→6 reconciliation is the real plan.** Do not re-inventory.

## THE OPEN BUG (what to work next)
**Calls do not stay connected / voice-call captions were not visible.** Two distinct things got tangled in the logs:

1. **Voice-call caption invisibility (believed fixed in the latest push, UNVERIFIED on device).**
   Root cause found by reading the code: the caption overlay lives inside `#call-band`, which only got the `.on` class when `kind==='video'`. On a **voice** call the band stayed `display:none`, so captions rendered into a hidden container. Latest commit `85e55ef1e1` turns the band on for voice too. **Not yet device-verified.**

2. **The peer connection may not be establishing at all.** In the latest logs, calls `call_end` after ~10-14s and there is **no `rtc_conn {s:'connected'}` ever logged** — i.e., the WebRTC media connection is not reaching "connected." This CANNOT be reproduced or proven in the sandbox (no real two-device network). This is the likely real remaining problem and needs on-device diagnosis. The connect-timeout was already fixed (was firing at a flat 12s from mount, killing healthy calls — commit `0d2a64265b`), and an epoch/phase guard was added so a stale/ended call's async callbacks can't tear down a live one (commit `d24a74fc13`).

## IMPORTANT: possible rollback target
The owner said "it was working like two turns ago and then you made more changes and now it's broken." The most likely last-good build is commit **`d96c51bb45`** ("all 6 amputation gaps") — BEFORE the connect-timeout / epoch / caption tail (`0d2a64265b`, `d24a74fc13`, `85e55ef1e1`). **First action next session: ask the owner whether to roll back to `d96c51bb45` and re-test from there, or keep the caption fix.** Do not decide this unilaterally.

To roll back: fetch the file at that commit and re-PUT as `bridge-turn14-pre-base.html`:
`https://raw.githubusercontent.com/acmeproducts/stuff/d96c51bb45/bridge-turn14-pre-base.html`

## Commit trail for turn14-pre-base (newest first)
- `85e55ef1e1` voice-call caption visibility fix (UNVERIFIED)
- `d24a74fc13` epoch+phase state machine on CALL
- `0d2a64265b` connect-timeout arm-point fix (was killing every call)
- `d96c51bb45` all 6 amputation gaps in one build ← **likely last-good**
- `ca433131b4` normalization added to restored-engine build
- `ad023f67a5` post-ship + restored call engine (engine only)

## Key facts / environment
- Repo `acmeproducts/stuff`, branch `main`, GitHub Pages deploys in ~1 min. Verify pushes via blob SHA (Contents API, not raw CDN).
- PAT rotates per session; owner provides it. Do not cache/police it.
- fastText assets live in repo at `fastType/` (model `fastType/model/lid.176.ftz`, wrapper `fastType/fasttext-wrapper.umd.js`, wasm `fastType/core/fasttext.wasm`). Wrapper API is `.detect()` returning an ISO string (NOT the old `predict()` array).
- Two-device headless harness in the sandbox at `/home/claude/harness/` (fake relay on 8790, http server on 8791) can test transcript/caption/normalization LOGIC with controlled translators, but CANNOT test real Deepgram/MyMemory/WebRTC.
- Deepgram key: localStorage `tb_dg_key`. Some failures in owner logs were `dg_credential_failure` — the owner's key dropping mid-session (environmental), recovered on re-save. Not an app bug.
- Docs in `talkbridge/`: `TALKBRIDGE-SOT-v1.md`, `AMPUTATION-INVENTORY.md`, `PLUMBING-PARITY-AUDIT.md`, `TALKBRIDGE-GRAVEYARD.md`.

## Graveyard (do not resurrect)
- Dual-socket English secondary (`dgWsEn`) opened for all non-en rooms — caused a race, spotty calls (old R1d). `multi` mode replaced the need for it. Do not re-enable the dual-socket.
- turn numbers 10–13 are burned/contaminated. turn14 is the clean lineage.

## Tone reminder
The owner is exhausted, out of patience, and paying real money per turn on top of subscription. They have been through ~a dozen failed cycles today. Be brief, be honest about what is and isn't proven, do not flatter, do not narrate, do not re-litigate. Solve the connection problem on-device or roll back — those are the two live options.
