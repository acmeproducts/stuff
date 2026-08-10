<!-- SESSION-MANAGER-GOVERNANCE v1.5.0 -->
# Session Manager — Release Plan, Backlog, Graveyard, Decisions, and Lessons

**Governance version:** 1.5.0  
**Updated:** 2026-08-10  
**Application artifact:** `session-manager-v3.html`  
**Owner:** Confi — sole device gate and final scope authority.

This file is the Session Manager source of truth for release scope, current baseline, failed attempts, graveyard, decisions, lessons, and future work.

---

# 0. Authority and hard rules

Authority order:

1. Owner ruling and real-device result.
2. Graveyard vetoes.
3. Active release definition in this file.
4. Exact owner-gated baseline artifact.
5. Automated/static evidence.
6. Backlog.

Hard rules:

- Read this file before changing Session Manager.
- Freeze release input, output, scope, exclusions, and owner gate before coding.
- Owner/device FAIL means FAIL. Do not reinterpret it away.
- A failed release returns to its declared clean input and is rebuilt; never patch-forward.
- Prove cause before designing a fix. Unknown cause means instrument first.
- Preserve working wiring and extend minimally.
- The deployable application remains one readable self-contained HTML file with inline CSS/JS.
- No base64/gzip application wrapper.
- No helper daemon, service, worker, proxy, new port, or second deployment copy to make the browser client work.
- No direct editing of OpenClaw `sessions.json`.
- No direct physical transcript deletion when Gateway lifecycle RPCs own the operation.
- Diagnostics remain read-only unless a separately governed repair release explicitly authorizes mutation.
- Repo writes are read back from GitHub before handoff.
- The file actually deployed by the owner must match the governed repo artifact before a gate result is attributed to a release.

---

# 1. CURRENT VERIFIED STATE

## 1.1 Proven working baseline — v2.2.0 / SM-R1

**Artifact:** `session-manager-v3.html`  
**Original v2.2 commit:** `78a014b4f1168892c9d35c199b353fcff975d112`  
**Exact proven blob:** `1fe3f05477ab7544f3022e5def4e1f01a6065ff5`

Owner-proven behavior:

- browser connects to OpenClaw Gateway;
- sessions load;
- chat round-trip works;
- session editing/rename works;
- renamed session state flows through OpenClaw and appears in the official Control UI/chat client;
- v2.2 includes Markdown/copy, Download, Share, Stop, attachments/activity behavior from the SM-R1 line.

## 1.2 Current repo state — ROLLED BACK

After the failed v2.3 owner gate, `main/session-manager-v3.html` was restored to the **exact v2.2.0 blob**:

`1fe3f05477ab7544f3022e5def4e1f01a6065ff5`

Rollback commit landed on `main` as:

`8b64d28a2a6aa4c80c90b912911dc16f9d99f368`

Later unrelated commits may advance `main`; the authoritative Session Manager rollback test is the file blob above, not the repository head SHA.

**Current owner action:** test the exact rollback artifact. No new v2.3 candidate is authorized for owner testing until v2.2 connectivity is reconfirmed.

---

# 2. SM-R2 / v2.3.0 — STATUS: FAILED OWNER GATE, REBUILD PENDING

## 2.1 Locked functional scope remains unchanged

SM-R2 still contains these five bounded items:

1. reversible local soft delete + Recycle bin;
2. permanent delete through OpenClaw `sessions.delete` archive semantics;
3. TalkBridge-inspired Appearance controls;
4. Debug moved behind Configuration;
5. tabbed Debug with Session Files anomaly visibility and Environment.

### Owner layout ruling

**Recycle-bin / soft-delete chevron is at the TOP of the session list, never the bottom.**

The bin renders before active session cards and is collapsed by default.

## 2.2 Failed v2.3 attempts

### Attempt A — publish transcription failure

Commit: `04dcbbc9403ee8b94d3c27ea66d8ed6b96b4a955`  
Blob: `561b54b842e0053d3987de82924de96767cf8235`

Failure: published source lost a closing parenthesis in the Recycle-bin filter. GitHub read-back caught it before owner handoff.

Disposition: rejected; rebuilt from v2.2 input.

### Attempt B — owner connectivity/auth gate failure

Candidate commit: `b0d70c3f4eeed1a90ddc050b608fe8f4e1e4a8f2`  
Candidate blob: `134466f379e93492c0b7b5e4fe9ec80afe7b42cf`

Observed owner log:

- WebSocket opened successfully to `wss://oc-ref.fell-dojo.ts.net`;
- Gateway received `connect`;
- Gateway repeatedly rejected the device signature with `DEVICE_AUTH_SIGNATURE_INVALID` / `device signature invalid`;
- retrying shared/device auth did not recover.

An initial stale/deployed-copy hypothesis was considered because one observed payload fingerprint did not match the governed candidate. The owner then redeployed the specified repo artifact and reported the **same failure**. That invalidates stale-copy mismatch as a sufficient explanation for the release failure.

**Owner ruling:** roll back.  
**Disposition:** SM-R2 owner gate = **FAIL**. Repo restored to exact v2.2.0 baseline before any further v2.3 work.

---

# 3. SM-R2 REBUILD CONTRACT — NEXT v2.3 ATTEMPT

The next v2.3 attempt MUST be built from exact blob:

`1fe3f05477ab7544f3022e5def4e1f01a6065ff5`

## 3.1 AUTH / IDENTITY / CONNECT FREEZE

The working v2.2 authentication path is now a **protected subsystem** for SM-R2.

The next build must preserve the v2.2 implementations and behavior of:

- identity persistence/import/generation;
- device ID derivation;
- Ed25519 key handling;
- `deviceToken()`;
- `saveDeviceToken()`;
- signed connect-payload construction;
- challenge timestamp/nonce handling;
- platform/device-family values used in the signed payload;
- `connectParams()`;
- `connect()` handshake sequencing;
- connect response settlement;
- bounded device-token retry;
- pairing/token mismatch handling;
- reconnect scheduling;
- client role/scopes/auth semantics.

**SM-R2 features may not replace, refactor, normalize, simplify, or redesign this subsystem.**

Only the visible application version string may change where necessary; if any version value participates in a signed/authenticated payload, its effect must be proven before owner handoff.

### Required structural gate

Before publishing the rebuilt v2.3 candidate:

- compare the protected auth/connect subsystem against exact v2.2;
- every difference must be either zero or explicitly explained as a non-behavioral version marker;
- mutation test: deliberately alter one signed-payload field and prove the guard fails;
- no owner handoff if the protected-subsystem guard fails.

## 3.2 Session lifecycle

### Soft delete

- Session Manager view-state only.
- Store local tombstone keyed by Gateway identity/profile + session key.
- Do not call a Gateway mutation on soft delete.
- Hide session from active list.
- Recycle bin at TOP.
- Restore removes tombstone and returns exact OpenClaw session.
- Persist across reload.

### Permanent delete

- Available only inside Recycle bin.
- Call Gateway `sessions.delete` with `deleteTranscript: true` where supported.
- No `rm`, `unlink`, or direct session-store editing.
- OpenClaw owns archive/rename semantics.
- Clear local tombstone only after Gateway success.
- Gateway rejection leaves UI state intact and shows exact error.
- Main/protected-session restrictions are not bypassed.

## 3.3 Appearance

One persisted theme state and one application function.

Required controls behind Configuration → Appearance:

- Light / Medium / Dark presets;
- accent;
- User bubble/background/font color/font size;
- Agent bubble/background/font color/font size;
- message width;
- session-list density;
- sidebar width within safe bounds;
- metadata/header size and muted color.

Appearance changes must never reconnect or mutate Gateway/session state.

## 3.4 Debug placement

Main-header Debug button is removed.

Configuration tabs:

- Connection
- Appearance
- Diagnostics

Diagnostics contains debug enablement, message-text logging choice, and Open Debug.

## 3.5 Debug tabs

### Log
Redacted log with Copy/Clear.

### Session Files
Read-only visibility only.

Classification:

- `*.jsonl.jsonl` → ANOMALY;
- `*.jsonl` → normal;
- `*.jsonl.deleted.*` → deleted archive;
- `*.jsonl.reset.*` → reset archive;
- constructed `<sessionId>.jsonl` → derived / not disk-verified.

Evidence order:

1. explicit file/path metadata returned by Gateway;
2. raw entry metadata returned by supported mutation calls;
3. archive paths returned by `sessions.delete`;
4. derived expectation, clearly marked derived.

Do not claim a physical WSL filesystem scan unless the browser actually receives a supported enumeration source. No automatic `*.jsonl.jsonl` repair in SM-R2.

### Environment
Show app version, Gateway URL, connection state, protocol, scopes, device ID, Gateway session count, local soft-delete count, and subscriptions. No secrets.

---

# 4. SM-R2 OWNER GATE

The owner is a tester. Deployment instructions must specify exactly one repo filename and exact version/blob. Do not ask the owner to diagnose architecture.

### Gate 0 — baseline regression prerequisite

Before testing new SM-R2 behavior:

- [ ] exact v2.2 rollback connects;
- [ ] sessions load;
- [ ] chat round-trip works;
- [ ] rename round-trip works.

If Gate 0 fails, stop. Do not add SM-R2 features until the environment/baseline discrepancy is understood.

### Gate 1 — rebuilt v2.3 connectivity regression

Before testing any new feature:

- [ ] v2.3 connects using the frozen v2.2 auth subsystem;
- [ ] sessions load;
- [ ] chat works;
- [ ] rename works;
- [ ] no `DEVICE_AUTH_SIGNATURE_INVALID` regression.

If Gate 1 fails: immediate rollback to exact v2.2 input; no feature debugging on the failed candidate.

### Gate 2 — new SM-R2 behavior

- [ ] Recycle-bin chevron at TOP.
- [ ] Soft delete hides only in Session Manager.
- [ ] Control UI retains soft-deleted session.
- [ ] Restore returns exact session.
- [ ] tombstone survives reload.
- [ ] permanent delete uses Gateway archive lifecycle.
- [ ] rejected delete leaves state intact.
- [ ] appearance presets and per-role controls work and persist.
- [ ] Debug is behind Configuration.
- [ ] Debug tabs are Log / Session Files / Environment.
- [ ] exposed `.jsonl.jsonl` paths are highlighted.
- [ ] derived filenames are marked not disk-verified.
- [ ] diagnostics are read-only.
- [ ] Download, Share, Stop, Copy, Markdown, attachments, activity-state behavior show no regression.

Only owner PASS promotes v2.3 to baseline.

---

# 5. EXPLICIT SM-R2 NON-SCOPE

- automatic repair/rename of `*.jsonl.jsonl`;
- orphan transcript re-index;
- direct filesystem mutation;
- multi-instance;
- GitHub Pages deployment changes;
- platform abstraction;
- new server/worker/daemon/port;
- bulk deletion;
- merge/archive restoration;
- unrelated auth redesign.

---

# 6. PLANNED RELEASES AFTER SM-R2

## SM-R3 / v2.4.0 — instance profiles
Named Gateway profiles, explicit URL, isolated auth/device state, safe A→B→A switching.

## SM-R4 / v2.5.0 — simultaneous multi-instance desk
Multiple Gateways connected concurrently with independent session/run/reconnect state.

## SM-R5 / v2.6.0 — platform-neutral static deployment
Same self-contained client on GitHub Pages with explicit Gateway endpoints and proven allowed-origin/Tailscale behavior.

## SM-R6 / v2.7.0 — unified operations workspace
Global search, favorites, health/version summary, per-instance diagnostics, secret-safe profile import/export, dense desktop/tablet workspace.

---

# 7. BACKLOG

### Lifecycle
- bulk soft delete/restore;
- bulk archive/delete after single-session lifecycle is proven;
- archived-transcript browser;
- supported archive restoration/re-index.

### Session-file diagnostics
- determine root cause/population of `*.jsonl.jsonl`;
- orphan transcript detection if Gateway-native inventory becomes available;
- missing referenced transcript detection;
- duplicate sessionId/file references;
- archive-retention visibility;
- anomaly-report export;
- repair doubled extensions only in a later governed mutation release.

### Operations
- transcript search;
- jump to latest/unread;
- improved code-block controls;
- message metadata on demand;
- later global multi-instance search.

### Test infrastructure
- protected auth-subsystem diff/hash guard;
- startup/control reachability harness;
- mock list/patch/delete/chat/abort/auth cases;
- two-client harness;
- multi-instance harness;
- mutation tests for every critical gate.

---

# 8. GRAVEYARD — VETOED APPROACHES

### G-001 — Patch-forward after failed candidate
Buried. Restore declared input and rebuild.

### G-002 — Encoded/self-decompressing application wrapper
Buried. Literal readable HTML only.

### G-003 — Divergent standalone proof client
Buried when it does not exercise the real application bootstrap/auth path.

### G-004 — Infer Gateway from static page origin
Buried. Hosting origin and Gateway endpoint are separate.

### G-005 — Blind device approval
Buried. Approve only a real Gateway request.

### G-006 — Treat generic `INVALID_REQUEST` as root cause
Buried. Use structured error details.

### G-007 — Invented auth/token scheme
Buried. Follow proven Gateway contract.

### G-008 — Lint/static parse as runtime proof
Buried. Owner gate is authoritative.

### G-009 — Broad refactor for narrow feature work
Buried. Preserve working wiring.

### G-010 — Custom encoding/chunk/install publishing
Buried. Plain UTF-8 single-file publish/read-back.

### G-011 — Direct physical transcript deletion
Buried. Use Gateway lifecycle/archive semantics.

### G-012 — Automatic `.jsonl.jsonl` repair before evidence
Buried for SM-R2. Detection only.

### G-013 — Claim derived path list is disk scan
Buried. Derived means not disk-verified.

### G-014 — Handoff without exact GitHub source read-back
Buried after `04dcbbc…` publish transcription failure.

### G-015 — Modifying proven auth/identity/signature/connect code while adding unrelated SM-R2 features
**Date buried:** 2026-08-10  
**Evidence:** v2.3 owner gate repeatedly hit `DEVICE_AUTH_SIGNATURE_INVALID`; v2.2 was the previously proven working connection/rename line.  
**Buried:** refactoring, replacing, normalizing, or redesigning the v2.2 authentication subsystem as part of soft-delete, appearance, or diagnostics work.  
**Replacement:** copy the exact v2.2 auth subsystem unchanged into the rebuild and add SM-R2 functionality around it. Structural/mutation guards must detect any unintended auth-path drift before owner handoff.

### G-016 — Explaining away a repeated owner failure as deployment mismatch without a successful control test
**Date buried:** 2026-08-10  
**Evidence:** an initial payload mismatch suggested a stale served copy, but the owner redeployed the specified artifact and reported the same failure.  
**Buried:** treating fingerprint mismatch as sufficient resolution when the owner rerun still fails.  
**Replacement:** record the gate as failed, rollback, and require an explicit baseline control followed by a minimally changed candidate.

---

# 9. LESSONS

- Owner real-device evidence outranks builder inference.
- A working baseline is an asset; preserve it byte-for-byte where the new feature does not require change.
- New UI/lifecycle features do not justify touching auth.
- Connectivity/chat/rename regression is Gate 1 and blocks all later feature testing.
- A repeated owner failure after redeployment must be recorded as a release failure, not rationalized away.
- Reversible local view state and server deletion are separate layers.
- OpenClaw archive history should be preserved rather than silently erased.
- `.jsonl.jsonl` anomalies should be surfaced before repair.
- TalkBridge's transferable appearance lesson is coherent persisted theme state, not wholesale code replacement.
- Read back published bytes before handoff.
- Deployment fingerprinting is useful, but a successful baseline/candidate A-B control is stronger evidence.

---

# 10. DECISION LOG

- **D-001 · 2026-08-10:** this file governs Session Manager work.
- **D-002 · 2026-08-10:** WSL owner gate precedes GitHub Pages work.
- **D-003 · 2026-08-10:** expansion order is stable single instance → profiles → simultaneous instances → neutral hosting → unified workspace.
- **D-004 · 2026-08-10:** v2.2 session edit/rename round-trip into official Control UI is confirmed.
- **D-005 · 2026-08-10:** exact v2.2 blob is the SM-R2 build input.
- **D-006 · 2026-08-10:** `bridge-turn24-base.html` is the lifecycle/appearance reference pattern.
- **D-007 · 2026-08-10:** Recycle-bin chevron belongs at TOP of list.
- **D-008 · 2026-08-10:** permanent delete uses OpenClaw deletion/archive semantics.
- **D-009 · 2026-08-10:** `.jsonl.jsonl` is diagnostic/anomaly-only in SM-R2.
- **D-010 · 2026-08-10:** Debug moves behind Configuration and is tabbed Log / Session Files / Environment.
- **D-011 · 2026-08-10:** first v2.3 publish was rejected before owner handoff due to source-transfer syntax defect.
- **D-012 · 2026-08-10:** the subsequent v2.3 owner test produced repeated `DEVICE_AUTH_SIGNATURE_INVALID`; after owner redeployment reported the same failure, SM-R2 gate is formally FAIL.
- **D-013 · 2026-08-10:** owner ordered rollback; repo Session Manager artifact restored to exact v2.2 blob `1fe3f05477ab7544f3022e5def4e1f01a6065ff5`.
- **D-014 · 2026-08-10:** next v2.3 rebuild must freeze the entire proven v2.2 auth/identity/signature/connect subsystem and prove no behavioral drift before handoff.
- **D-015 · 2026-08-10:** owner is the tester; deployment handoff must identify exactly what single file/version/blob to deploy and must not transfer architecture diagnosis to the owner.

---

# 11. MAINTENANCE RULE

Before code: freeze scope here.  
After new evidence: update Lessons/Graveyard immediately.  
After owner ruling: update Decision Log in the same session.  
After FAIL: restore baseline, record failure, rebuild from baseline.  
After owner PASS: record exact commit/blob as new baseline.  
Unscheduled ideas remain backlog until deliberately promoted.
