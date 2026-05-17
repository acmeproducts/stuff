# Bridge Recovery Baseline Audit

## 1) Executive recommendation

### Recommended product baseline (call-spine first)
- **Baseline file/commit:** `bridge-restore-plus-2.html` @ **`eb4ac223887a6d43dd05610afbc888f05f345484`** (2026-05-10, “Fix addTr subtitleSeq dedup race condition in bridge-restore-plus-2.html”).
- **Why:** This line sits on top of the “v4.0.0 baseline release from bridge-restore-plus-2.html” commit (`7399a6a8…`) and before the heaviest later layering. It shows mature call/video/mic + DG orchestration and avoids several later broad-scope edits tied to regressions.

### Recommended normalization reference
- `bridge-patched-v1.html` @ **`dcf1fea024938c811c898e6f91e3a8e6dfab430c`** (2026-05-11) for explicit detected→selected-source→target flow and normalization fixes.

### Recommended TTS reference
- `bridge-cc-v1.0.html` @ **`c6b44b19bd03d11b3de504691f61aa8dcd8c2491`** (2026-05-13) for centralized TTS routing/wrappers and cancellation handling patterns (reference-only; not baseline).

### Recommended phrasebook reference
- `bridge8-patched.html` @ **`6074eb1be207e02c35ef43fceda38081481019a2`** (2026-05-01) for scoped phrase drawer + command wiring before later over-expansion.

### Recommended startup health/logging reference
- `bridge-codex-v1-4.html` @ **`0a9dc3e69da703ec92b4e6488928d467159895e0`** (2026-05-13) for explicit health pill/dependency checks and modern logging instrumentation; cherry-pick patterns only.

### Files/commits to avoid as baseline
- `bridge-cgpt-v1-4.html` (`4023cf69…`) and `bridge-codex-v1-4.html` (`0a9dc3e…`) as full baselines: too many recent layered edits + known joiner TTS / interruption / health-noise risks.
- `bridge-baseline.html` (`575d4e28…`) as baseline: contains duplicate PiP overlay block remnants from lineage and is later than safer call-spine snapshot.

---

## 2) Candidate ranking table

| Rank | File/path | Commit | Version stamp | Weighted total | Call spine (x5) | Video/PiP (x5) | Mic (x4) | DG (x4) | Norm (x3) | TTS (x3) | Phrasebook (x2) | Recommendation |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | bridge-restore-plus-2.html | eb4ac223 | v4.0.0 | **108** | 4 | 4 | 4 | 4 | 4 | 3 | 2 | **Product baseline** |
| 2 | bridge-patched-v1.html | dcf1fea0 | v3.5.x | 104 | 4 | 4 | 4 | 4 | 5 | 3 | 3 | Reference (norm/mic/phrase) |
| 3 | bridge8.html | 9a517b66 | v3.1.0 lineage | 95 | 4 | 4 | 3 | 3 | 3 | 2 | 1 | Fallback baseline |
| 4 | bridge8-patched.html | babd6c51 | v3.3.0 lineage | 91 | 3 | 4 | 3 | 3 | 3 | 2 | 4 | Phrasebook reference |
| 5 | bridge-codex-v1-4.html | 0a9dc3e6 | v1.4 | 87 | 3 | 3 | 3 | 3 | 4 | 3 | 3 | Health/logging reference |
| 6 | bridge-cgpt-v1-4.html | 4023cf69 | v1.4 | 82 | 2 | 3 | 2 | 3 | 4 | 2 | 3 | Avoid as baseline |

---

## 3) Top 5 candidate deep dive

### #1 `bridge-restore-plus-2.html` @ eb4ac223
- **Why candidate:** explicit v4.0.0 “clean pre-regression source” lineage plus subtitle dedup correction.
- **Appears to work:** call lifecycle + DG reconcile/startup + normalization pipeline logs + translation retry path.
- **Appears broken/risky:** less advanced phrasebook and less modern health orchestration than newest variants.
- **Best use:** **Baseline**.

### #2 `bridge-patched-v1.html` @ dcf1fea0
- **Why candidate:** strongest normalization behavior and mic-restore fixes documented in commit message.
- **Works:** detected language handoff and source/target normalization path; phrasebook button class mismatch fixed.
- **Risks:** long patch train; later commits mention PiP duplicate-ID and fastText/wasm fragility, indicating churn.
- **Best use:** **Normalization reference**, selective phrasebook/mic patches.

### #3 `bridge8.html` @ 9a517b66
- **Why candidate:** earlier stable call/video era with autoplay hardening and inbound subtitle normalization.
- **Works:** clean call spine and video handling with fewer later overlays.
- **Risks:** weaker advanced normalization and less explicit DG/TTS controls.
- **Best use:** fallback call-spine baseline if v4 lineage shows hidden instability.

### #4 `bridge8-patched.html` @ babd6c51 / 6074eb1b
- **Why candidate:** strong phrasebook command UX evolution.
- **Works:** phrase drawer, command triggers, compose integration.
- **Risks:** added recovery controller and compose flow churn can cross-couple call/mic.
- **Best use:** **Phrasebook reference only**.

### #5 `bridge-codex-v1-4.html` @ 0a9dc3e6
- **Why candidate:** modern health UI and runtime dependency checks.
- **Works:** startup health pill/checks, richer logging.
- **Risks:** part of latest wave with known regression exposure; not safest call-spine foundation.
- **Best use:** **Health/logging reference only**.

---

## 4) Regression timeline (likely inflection points)

- **Call/video instability introduced/exposed:** post-`bridge-restore-plus-2` mass edits in `bridge-patched-v1` and later codex/cgpt v1.x branches (May 11–13).
- **TTS centralization/interruption storm risk:** `bridge-cc-v1.0.html` creation + completion (`a96f51d3`, `c6b44b19`) and descendants.
- **Normalization behavior changes:** `a31e6cb5` and follow-on rollback/fixes (`93446bda`, `22846552`, `dcf1fea0`).
- **Startup health indicator appeared:** `36b211ed` (ft-status-pill), then expanded in codex/cgpt v1.4 files.
- **Auto-mute behavior surfaced:** `36b211ed` focus/blur mic handling and follow-on compose mute restore fixes (`dcf1fea0`).
- **WebRTC offer/answer handling churn:** recovery-controller period around `bridge8-patched` (`babd6c51`) and subsequent patched lineage merges.
- **PiP behavior changed:** duplicate-ID issue documented/fixed in `196aa944`.

---

## 5) Recommended lane-based recovery plan

1. **Lane 1 (call/video/join/rejoin only):** start from `bridge-restore-plus-2@eb4ac223`; freeze normalization/TTS/phrasebook edits. Verify create/join/rejoin/leave + ontrack remote render + PiP main-video non-break.
2. **Lane 2 (mic/DG only):** import DG reconcile/watchdog + compose mute-restore guards from `dcf1fea0`/`36b211ed` with strict diff isolation.
3. **Lane 3 (TTS only):** borrow minimal speak/cancel queue discipline from `bridge-cc-v1.0` without importing health UI or phrasebook rewrites.
4. **Lane 4 (normalization only):** port detected→selected-source→target path from `dcf1fea0`; preserve existing call/video code untouched.
5. **Lane 5 (phrasebook/use only):** port narrow handler fixes (`tr-use` selector, scoped drawer commands) from `dcf1fea0` + `6074eb1b`.
6. **Lane 6 (health UI only):** add simple dependency pill from `bridge-codex-v1-4`; avoid intrusive startup gating.

---

## 6) Do-not-touch list for Lane 1
- `RTCPeerConnection` creation/teardown blocks.
- offer/answer `setLocalDescription`/`setRemoteDescription` sequencing.
- ICE queueing + flush logic.
- `ontrack` and primary `remote-video.srcObject` assignment paths.
- PiP root DOM IDs and toggling behavior.

---

## 7) Open questions (material)
- Which exact commit first introduced `InvalidStateError` in offer/answer handling in field logs?
- Is joiner-side wrong-language TTS tied to speaker lang resolution or queue cancellation race?
- Which PiP version preserved main remote render under repeated rejoin on both peers?

---

## Printed summary
- **Recommended baseline:** `bridge-restore-plus-2.html @ eb4ac223887a6d43dd05610afbc888f05f345484`.
- **Top 3 references:** normalization `dcf1fea0`; TTS `c6b44b19`; phrasebook `6074eb1b`.
- **Biggest regression source:** post-baseline multi-feature layering in May 11–13 branch variants (patched→cc/codex/cgpt lines).
- **Rationale:** The safest recovery path is to anchor on the least-coupled, proven call/video spine and reintroduce language/UX subsystems in isolated lanes. `bridge-restore-plus-2@eb4ac223` best matches that criterion while preserving enough normalization and DG structure for targeted backports.
