<!-- SESSION-MANAGER-GOVERNANCE v1.6.0 -->
# Session Manager — Release Plan, Backlog, Graveyard, Decisions, and Lessons

**Governance version:** 1.6.0  
**Updated:** 2026-08-10  
**Application artifact:** `session-manager-v3.html`  
**Owner:** Confi — sole device gate and final scope authority.

This file is the Session Manager source of truth. Owner/device evidence outranks builder inference.

---

# 0. HARD RULES

- Read this file before changing Session Manager.
- Owner/device FAIL means FAIL.
- Failed candidate → restore exact owner-proven input → rebuild; never patch-forward.
- Prove cause before fix; unknown cause means instrument first.
- Preserve working wiring and extend minimally.
- Deployable app remains one readable self-contained HTML file with inline CSS/JS.
- No encoded/self-decompressing app wrapper, extra daemon, service, worker, proxy, port, or duplicate deployment architecture.
- No direct `sessions.json` mutation or physical transcript deletion where a Gateway lifecycle RPC exists.
- Diagnostics are read-only unless a separately governed repair release explicitly permits mutation.
- Every GitHub publish is read back before owner handoff.
- The owner is the tester. Handoff identifies one filename/version/blob and does not offload architecture diagnosis.

---

# 1. AUTHORITATIVE FUNCTIONAL BASELINE

## Owner ruling — 2026-08-10

The owner supplied a file and explicitly reported: **“this works”** and then clarified that it is the **functional baseline** for the next changes.

That file is:

- visible version: **v2.1.0**
- GitHub blob: **`27ee8fabe42a185d194b4af4d668e81b54a8b8c8`**
- historical v2.1 commit: `56c91a6ff1da3b1e2049490ca51c40eecf7863f1`
- owner-baseline restore commit: `0d5ed4c19ce66c45e5ad6722e84f9ecf13c19875`

Owner-proven baseline behavior includes:

- Gateway connection works;
- sessions load;
- chat works;
- inline session rename works and persists through OpenClaw / official Control UI;
- activity-state tracking works.

**This supersedes the prior v1.5 assumption that v2.2 was the rebuild input.** v2.2 remains historical evidence, but the current SM-R2 rebuild input is exact blob `27ee8f...` because it is the file the owner most recently proved working.

---

# 2. ACTIVE RELEASE — SM-R2 / v2.3.0

**Input:** exact owner-proven v2.1 blob `27ee8fabe42a185d194b4af4d668e81b54a8b8c8`.  
**Output:** `session-manager-v3.html`, visibly **v2.3.0**.  
**Candidate commit:** `23e93bf1f3ac9f5777cc9a7a5faf6302be740d44`  
**Candidate blob:** `3f55b17975c7c10c27bf3ece87a28734ffeb3358`  
**Owner gate:** NOT YET RUN.

## 2.1 Protected connection subsystem

The following implementations were compared against the exact owner-proven baseline and passed the pre-publish no-drift guard:

- `identity()`;
- `deviceToken()`;
- `saveDeviceToken()`;
- `connectParams()`;
- `rpc()`;
- `rejectPending()`;
- `connect()`;
- `handleConnectError()`;
- `schedule()`;
- `reconnect()`.

The visible/client application version advances to v2.3.0. The signed-payload construction, identity storage/import/generation, Ed25519 handling, challenge timestamp/nonce, platform/device-family handling, token/device-token semantics, handshake sequencing, error handling, and reconnect logic remain the owner-proven baseline behavior.

Any future SM-R2 change that alters those protected functions requires a new explicit cause/evidence ruling before owner handoff.

## 2.2 Soft delete + Recycle bin

- Soft delete is Session Manager local state only.
- Tombstone is keyed by Gateway + session key.
- It does not mutate OpenClaw.
- Deleted sessions disappear from the active list.
- **Recycle bin is at the TOP of the session list.**
- Bin is collapsed by default.
- Restore removes the local tombstone and returns the exact session.
- Tombstones persist across reload.
- Delete Permanently exists only inside the bin.

## 2.3 Permanent delete

- Uses Gateway `sessions.delete` with `deleteTranscript:true`.
- No `rm`, `unlink`, direct transcript deletion, or `sessions.json` editing.
- OpenClaw owns archive/rename lifecycle.
- Tombstone is cleared only after Gateway success.
- Gateway failure preserves the tombstone and displays the error.
- Main/protected-session restrictions are not bypassed.

## 2.4 Appearance

Configuration → Appearance includes:

- Light / Medium / Dark presets;
- accent color;
- User bubble background/font/font size;
- Agent bubble background/font/font size;
- message width;
- list density compact/normal/comfortable;
- sidebar width;
- meta/header size and muted color.

Appearance persists and must never reconnect or mutate Gateway/session state. Ready remains blue, Working green, Error yellow.

## 2.5 Diagnostics

Main-header Debug is removed.

Configuration tabs:

- Connection
- Appearance
- Diagnostics

Diagnostics opens a tabbed Debug surface:

- Log
- Session Files
- Environment

Session Files rules:

- `.jsonl.jsonl` → **ANOMALY**;
- `.jsonl` → normal;
- `.jsonl.deleted.*` → deleted archive;
- `.jsonl.reset.*` → reset archive;
- constructed `<sessionId>.jsonl` → **derived / not disk-verified**;
- browser must not claim a physical WSL disk scan it cannot perform;
- no repair/mutation in SM-R2.

Environment shows app version, Gateway, connection, protocol, scopes, device ID, session count, local soft-delete count, and subscription count without secrets.

## 2.6 Convenience behavior carried into candidate

The candidate also includes the previously developed convenience behavior expected by the governed gate:

- Markdown rendering;
- Copy message;
- Download transcript;
- Share transcript;
- Stop active run;
- attachments;
- activity state.

These additions were built around the owner-proven connection subsystem rather than replacing it.

---

# 3. OWNER GATE

## Gate 1 — regression gate FIRST

Before testing new features:

- [ ] page visibly says **v2.3.0**;
- [ ] Gateway connects;
- [ ] sessions load;
- [ ] opening a session loads chat/history;
- [ ] send/chat round-trip works;
- [ ] rename works and persists to official Control UI;
- [ ] no `DEVICE_AUTH_SIGNATURE_INVALID` regression.

**If any Gate 1 item fails: STOP and roll back to exact baseline blob `27ee8f...`. Do not continue feature testing.**

## Gate 2 — SM-R2 features

Only after Gate 1 passes:

- [ ] Recycle bin appears at TOP when a session is soft-deleted;
- [ ] soft delete hides only in Session Manager;
- [ ] official Control UI still contains the soft-deleted session;
- [ ] Restore returns exact session;
- [ ] tombstone survives reload;
- [ ] permanent delete uses OpenClaw archive lifecycle;
- [ ] rejected delete preserves local state;
- [ ] Light / Medium / Dark work;
- [ ] User and Agent appearance controls work independently;
- [ ] appearance persists;
- [ ] main-header Debug is absent;
- [ ] Configuration → Diagnostics → Open Debug works;
- [ ] Debug tabs are Log / Session Files / Environment;
- [ ] derived paths say not disk-verified;
- [ ] diagnostics remain read-only;
- [ ] Copy / Markdown / Download / Share / Stop / attachments / activity show no regression.

Only owner PASS promotes v2.3 to baseline.

---

# 4. EXPLICIT NON-SCOPE

Not in SM-R2:

- automatic `.jsonl.jsonl` repair;
- orphan transcript re-index;
- direct filesystem mutation;
- multi-instance support;
- GitHub Pages architecture changes;
- platform abstraction;
- new service/worker/daemon/port;
- bulk deletion;
- session merge;
- unrelated authentication redesign.

---

# 5. PLANNED RELEASES

## SM-R3 / v2.4.0 — instance profiles
Named Gateway profiles, explicit URL, isolated auth/device state, safe A → B → A switching.

## SM-R4 / v2.5.0 — simultaneous multi-instance desk
Multiple Gateways concurrently with isolated sessions/activity/reconnect state.

## SM-R5 / v2.6.0 — platform-neutral static deployment
Same unchanged client served statically with explicit Gateway endpoints and proven allowed-origin/Tailscale behavior.

## SM-R6 / v2.7.0 — unified operations workspace
Global search, pins/favorites, health/version summaries, per-instance diagnostics, safe profile import/export, dense desktop/tablet workspace.

---

# 6. BACKLOG

### Lifecycle
- bulk soft delete / restore;
- bulk archive/delete after single-session lifecycle is proven;
- archived-transcript browser;
- supported archive restoration/re-index.

### Session-file diagnostics
- determine root cause/population of `.jsonl.jsonl`;
- orphan detection if Gateway-native inventory becomes available;
- missing referenced transcripts;
- duplicate sessionId/file references;
- archive retention visibility;
- anomaly report export;
- repair only in a later mutation-governed release.

### Operations
- transcript search;
- jump to latest/unread;
- improved code-block controls;
- message metadata on demand;
- global multi-instance search later.

### Test infrastructure
- protected auth/connect source-diff guard;
- startup/control reachability harness;
- mock list/patch/delete/chat/abort/auth cases;
- two-client harness;
- multi-instance harness;
- mutation tests proving each critical gate can actually fail.

---

# 7. GRAVEYARD

### G-001 — Patch-forward after failed candidate
Buried. Restore declared input and rebuild.

### G-002 — Encoded/self-decompressing application wrapper
Buried. Literal readable HTML only.

### G-003 — Divergent standalone proof client
Buried when it does not exercise the real app bootstrap/auth path.

### G-004 — Infer Gateway from page origin
Buried. Hosting origin and Gateway endpoint are separate.

### G-005 — Blind device approval
Buried. Approve only a real Gateway request.

### G-006 — Generic `INVALID_REQUEST` as root cause
Buried. Read structured error details.

### G-007 — Invented auth/token replacement
Buried. Preserve proven Gateway contract.

### G-008 — Static parse as runtime proof
Buried. Static checks qualify a candidate; owner hardware gate proves it.

### G-009 — Broad refactor for narrow feature work
Buried. Preserve working wiring.

### G-010 — Custom encoding/chunk/install publishing
Buried. Plain literal HTML and exact source read-back.

### G-011 — Direct physical transcript deletion
Buried. Use OpenClaw lifecycle semantics.

### G-012 — Automatic `.jsonl.jsonl` repair before evidence
Buried for SM-R2. Detection only.

### G-013 — Claim derived path list is a disk scan
Buried. Derived means not disk-verified.

### G-014 — Handoff without exact source read-back
Buried after first v2.3 transfer lost syntax before handoff.

### G-015 — Modify proven auth/connect code for unrelated UI features
Buried after v2.3 auth regression. Build UI/lifecycle changes around the proven connection subsystem.

### G-016 — Explain away repeated owner failure as deployment mismatch
Buried. If owner redeploys and the same failure remains, record FAIL and rollback.

### G-017 — Publishing compressed/binary bytes as the HTML artifact
**Observed 2026-08-10:** an intermediate v2.3 GitHub commit accidentally pointed `session-manager-v3.html` at compressed bytes. Required UTF-8 GitHub read-back immediately failed and the artifact was corrected before owner handoff.

**Buried:** treating blob creation success as sufficient when the requested artifact is literal HTML.

**Replacement:** publish literal UTF-8 source and require `fetch_file` read-back showing valid HTML, visible version, and expected blob before telling the owner to test.

---

# 8. LESSONS

- The owner’s most recent demonstrated working artifact is the functional baseline, even if a numerically later historical build existed.
- A working baseline is an asset; protect unrelated subsystems byte-for-byte where possible.
- UI/lifecycle work does not justify auth redesign.
- Connectivity/chat/rename is the first gate and blocks feature testing if broken.
- Source publishing correctness is part of release correctness.
- A successful GitHub API write is not enough; read back the actual file.
- Reversible local view state and destructive server lifecycle are different layers.
- OpenClaw archive history should be preserved.
- `.jsonl.jsonl` is evidence to expose before repair.
- Derived browser paths are not a disk inventory.

---

# 9. DECISION LOG

- **D-001 · 2026-08-10:** this file governs Session Manager work.
- **D-002:** WSL owner gate precedes later neutral-hosting work.
- **D-003:** expansion order is stable single instance → profiles → simultaneous instances → neutral hosting → unified workspace.
- **D-004:** session rename round-trip into official Control UI is a required regression gate.
- **D-005:** Recycle bin belongs at TOP of session list.
- **D-006:** permanent delete uses OpenClaw lifecycle/archive semantics.
- **D-007:** `.jsonl.jsonl` is diagnostic-only in SM-R2.
- **D-008:** Debug moves behind Configuration and is tabbed.
- **D-009:** prior v2.3 candidates failed and were not promoted.
- **D-010:** owner supplied v2.1 blob `27ee8f...` and declared it functional; it is now the authoritative SM-R2 rebuild baseline.
- **D-011:** new v2.3 candidate is commit `23e93bf1f3ac9f5777cc9a7a5faf6302be740d44`, blob `3f55b17975c7c10c27bf3ece87a28734ffeb3358`.
- **D-012:** protected auth/connect source guard passed against the owner-proven baseline before candidate publish.
- **D-013:** owner gate for this new v2.3 candidate is NOT YET RUN.

---

# 10. MAINTENANCE RULE

Before code: freeze scope here.  
After new evidence: update Lessons/Graveyard.  
After owner ruling: update Decision Log in the same session.  
After FAIL: restore exact proven baseline and rebuild.  
After PASS: record exact commit/blob as new baseline.  
Unscheduled ideas remain backlog until deliberately promoted.
