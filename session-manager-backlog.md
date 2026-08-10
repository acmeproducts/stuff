<!-- SESSION-MANAGER-GOVERNANCE v1.4.0 -->
# Session Manager — Release Plan, Backlog, Graveyard, Decisions, and Lessons

**Governance version:** 1.4.0  
**Updated:** 2026-08-10  
**Application artifact:** `session-manager-v3.html`  
**Owner:** Confi — sole device gate and final scope authority.

This file is the Session Manager source of truth for release scope, backlog, graveyard, decisions, and lessons. It follows the operating discipline established in `talkbridge/TALKBRIDGE-PLAN-v9.md` and `talkbridge/THE-METHOD.md`.

---

## 0. Authority and hard rules

Authority order:

1. Owner ruling in the current session, written here in the same session.
2. Graveyard vetoes.
3. Active release definition in this file.
4. Current owner-gated artifact and observed runtime evidence.
5. Backlog.

Hard rules:

- Read this file before changing Session Manager.
- Freeze input, output, scope, exclusions, and gate before a release is pushed.
- A failed release returns to its declared input and is rebuilt; do not patch-forward.
- Prove cause before fix. Unknown cause means instrument first.
- Verify the real user control, not only an internal function or lint result.
- Preserve working wiring; extend minimally.
- The deployable client remains one readable self-contained HTML file with inline CSS/JS.
- No encoded application wrappers, helper daemons, new service, or new port merely to make the client work.
- Do not directly edit OpenClaw `sessions.json` or delete transcript files when a supported Gateway RPC owns the lifecycle.
- Diagnostics are read-only unless a separately governed repair release explicitly authorizes mutation.
- GitHub writes use the fresh blob SHA and are read back after publish.

---

## 1. Current baseline and owner ruling

### Historical rollback floor — v2.1.0

Known-good blob: `27ee8fabe42a185d194b4af4d668e81b54a8b8c8`.

### Promoted build input — v2.2.0 / SM-R1

Commit: `78a014b4f1168892c9d35c199b353fcff975d112`  
Blob: `1fe3f05477ab7544f3022e5def4e1f01a6065ff5`

Owner evidence on 2026-08-10:

- Session Manager is connected and usable.
- Session editing/rename works.
- Renames flow through OpenClaw and appear back in the official Control UI/chat client.
- Owner explicitly authorized proceeding to the new governed version from this line.

This owner ruling authorizes v2.2.0 as the input for SM-R2 even though individual SM-R1 convenience-feature checks were not separately enumerated in chat.

---

# 2. ACTIVE RELEASE — SM-R2 / app v2.3.0

**Input:** exact current v2.2.0 blob `1fe3f05477ab7544f3022e5def4e1f01a6065ff5`.  
**Output:** `session-manager-v3.html`, visibly `v2.3.0`.  
**Theme:** session lifecycle + controlled appearance + useful diagnostics.

Reference behavior comes from `bridge-turn24-base.html`: reversible soft deletion, a recycle-bin management surface, restrained card hierarchy, and one persisted appearance/theme layer with presets plus granular controls.

## 2.1 Soft delete and Recycle bin

- A session row gets a local soft-delete control.
- Soft delete does **not** call OpenClaw mutation RPCs.
- It stores a Session Manager tombstone keyed by Gateway + session key.
- The session disappears from the active list but remains untouched in OpenClaw.
- A collapsible **Recycle bin (N)** contains the soft-deleted rows.
- Each deleted row has **Restore** and **Delete Permanently**.
- Restore removes only the local tombstone and returns the exact session.
- Tombstones survive browser reload.

### Owner layout ruling — 2026-08-10

**The Recycle-bin / soft-delete chevron is at the TOP of the session list, never at the bottom.**

When the bin exists it is rendered before all active session cards. It is collapsed by default and expands in place at the top.

## 2.2 Permanent delete uses OpenClaw archive semantics

- The final action calls Gateway `sessions.delete` with `deleteTranscript: true`.
- Session Manager does not use `rm`, `unlink`, or direct `sessions.json` editing.
- On OpenClaw v2026.5.19, `sessions.delete` removes the store entry and archives/renames the transcript using OpenClaw's lifecycle, returning archived paths.
- Session Manager removes the local tombstone only after Gateway success.
- Gateway rejection leaves the bin row intact and displays the actual error.
- Main/protected-session restrictions are not bypassed.
- Archive paths returned by OpenClaw are retained in the Debug → Session Files view for the current browser session.

Gate:

- soft-delete a disposable session;
- prove official Control UI still has it;
- restore it;
- soft-delete again and permanently delete;
- prove it disappears from OpenClaw session listing;
- prove OpenClaw returns/creates an archived renamed transcript rather than Session Manager erasing it directly;
- prove a rejected delete leaves UI/source state intact.

## 2.3 TalkBridge-inspired appearance control

Preserve the working application wiring. Appearance is isolated in one persisted theme object and one application function.

Minimum controls behind Configuration → Appearance:

- Preset: Light / Medium / Dark.
- Accent color.
- User bubble background, font color, font size.
- Agent bubble background, font color, font size.
- Message width.
- Session list density: compact / normal / comfortable.
- Sidebar width within safe bounds.
- Header/meta text size and muted color.

Rules:

- Presets establish coherent values.
- Granular controls override preset values.
- Appearance changes never reconnect and never alter Gateway/session data.
- Ready stays blue, Working green, Error yellow regardless of visual preset.
- The list/chat surfaces use restrained TalkBridge-style cards, spacing, borders, and hierarchy without copying TalkBridge application semantics.

## 2.4 Debug moves behind the configuration gear

The main chat header no longer contains Debug.

Configuration is organized as:

- Connection
- Appearance
- Diagnostics

Diagnostics contains debug-log enablement, message-text logging toggle, and **Open Debug**.

## 2.5 Tabbed Debug window

Required tabs:

### Log
Existing redacted runtime log with Copy and Clear.

### Session Files
Read-only session/transcript-path visibility.

Classification:

- `*.jsonl.jsonl` → **ANOMALY**.
- normal `*.jsonl` → normal transcript.
- `*.jsonl.deleted.*` → deleted archive.
- `*.jsonl.reset.*` → reset archive.
- `<sessionId>.jsonl` constructed only from sessionId → **derived / not disk-verified**.

Path evidence sources, in strength order:

1. explicit file/path metadata returned by the installed Gateway;
2. raw session-entry metadata returned by successful session mutations such as `sessions.patch` on OpenClaw v2026.5.19;
3. archive paths returned by `sessions.delete`;
4. derived `<sessionId>.jsonl` expectation, clearly labeled as derived.

Critical honesty rule: current OpenClaw session-list/describe projections do not guarantee physical `sessionFile` exposure. If the Gateway does not expose the physical path, Session Manager must say the scan is visibility-limited. It must **not** claim that unindexed disk files under the WSL session directory were scanned.

No automatic rename/repair of `*.jsonl.jsonl` in SM-R2.

### Environment
Show, without secrets:

- app version;
- Gateway URL;
- connection state;
- protocol;
- scopes;
- device ID;
- Gateway session count;
- local soft-delete count;
- active subscription count.

## 2.6 Explicit non-scope

Not in v2.3.0:

- automatic repair/rename of `*.jsonl.jsonl`;
- orphan transcript re-indexing;
- direct filesystem mutation;
- multi-instance support;
- GitHub Pages deployment changes;
- platform abstraction;
- new service/worker/daemon/port;
- bulk deletion;
- session merge;
- unrelated auth redesign.

## 2.7 SM-R2 owner gate

- [ ] Recycle-bin chevron appears at the **top** of the list.
- [ ] Soft delete hides only in Session Manager.
- [ ] Official Control UI retains the soft-deleted session.
- [ ] Restore returns the exact session.
- [ ] Tombstone survives reload.
- [ ] Permanent delete calls OpenClaw and archives/renames rather than direct-erasing the transcript.
- [ ] Rejected delete leaves the tombstone/session intact.
- [ ] Light / Medium / Dark presets work.
- [ ] User and Agent visual controls work independently.
- [ ] Appearance survives reload.
- [ ] Main-header Debug button is gone.
- [ ] Debug opens from Configuration → Diagnostics.
- [ ] Debug tabs are Log / Session Files / Environment.
- [ ] Any real `*.jsonl.jsonl` path exposed by Gateway metadata is highlighted as ANOMALY.
- [ ] Derived paths are explicitly marked not disk-verified.
- [ ] Diagnostics do not mutate OpenClaw/session files.
- [ ] Existing chat, rename, Copy, Download, Share, Stop, attachment, and activity-state behavior remains functional.

Failure: return to exact v2.2.0 input, record evidence below, rebuild v2.3.0. No patch-forward.

---

# 3. Planned releases after SM-R2

## SM-R3 / v2.4.0 — instance profiles

- named OpenClaw instance profiles;
- explicit Gateway URL per profile;
- isolated auth/device state;
- switch A → B → A without reload;
- correct session/chat state remains isolated.

## SM-R4 / v2.5.0 — simultaneous multi-instance desk

- multiple Gateways connected concurrently;
- sessions grouped by instance;
- independent activity/run state;
- reconnect one instance without disturbing another.

## SM-R5 / v2.6.0 — platform-neutral static deployment

- same unchanged client served from GitHub Pages;
- explicit Gateway endpoints;
- verified allowed-origin setup;
- Tailscale access to WSL and later other OpenClaw platforms;
- no platform-specific HTML fork.

## SM-R6 / v2.7.0 — unified operations workspace

Candidate scope after real multi-instance use:

- global session search;
- pins/favorites/recency;
- instance health/version summary;
- per-instance diagnostics;
- secret-safe profile import/export;
- dense desktop/tablet operations layout.

---

# 4. Backlog

### Session lifecycle
- bulk soft delete / restore;
- bulk archive/delete only after single-session semantics are fully gated;
- archived-transcript browser;
- archive restoration/re-index only through a proven supported mechanism.

### Session-file diagnostics
- prove the root cause and exact population of `*.jsonl.jsonl`;
- detect orphan transcripts if a Gateway-native inventory becomes available;
- repair doubled extension only in a separately governed mutation release;
- missing referenced transcript detection;
- duplicate sessionId/file reference detection;
- archive retention visibility;
- anomaly-report export.

### Chat/operations
- transcript search;
- jump to latest/unread;
- improved code-block controls;
- message metadata on demand;
- later global multi-instance search.

### Test infrastructure
- startup/control reachability harness;
- mock Gateway list/patch/delete/chat/abort/auth cases;
- two-client harness;
- multi-instance harness;
- mutation tests that prove each gate actually fails when its defect is reintroduced.

---

# 5. Graveyard — vetoed approaches

### G-001 — Patch-forward after a failed candidate
Buried. Restore declared input and rebuild.

### G-002 — Encoded/self-decompressing application wrapper
Buried. Checked-in app remains literal readable HTML.

### G-003 — Divergent standalone proof client
Buried when it does not share the actual client bootstrap/auth path.

### G-004 — Inferring Gateway from static page origin
Buried. Hosting origin and Gateway endpoint are separate concerns.

### G-005 — Blind device approval
Buried. Only approve a real Gateway pairing/scope request.

### G-006 — Treating generic `INVALID_REQUEST` as root cause
Buried. Read structured Gateway details.

### G-007 — Invented token/device-token auth replacement
Buried. Use the supported bounded recovery contract.

### G-008 — Lint/static parse as proof of runtime success
Buried. Static checks permit publishing; owner runtime gate proves behavior.

### G-009 — Broad refactor while fixing a narrow defect
Buried. Keep release scope bounded.

### G-010 — Custom encoding/chunk/install publishing for one HTML file
Buried. Plain UTF-8 Contents API replacement and read-back.

### G-011 — Direct physical transcript deletion
Buried. Final Session Manager deletion uses OpenClaw `sessions.delete` and OpenClaw owns transcript archival/rename.

### G-012 — Automatic `*.jsonl.jsonl` repair before visibility/root cause
Buried for SM-R2. Detect first; repair only after evidence.

### G-013 — Claiming a browser-only derived path list is a disk scan
Buried. Derived paths must be labeled derived. Physical/unindexed files are only claimed when a supported source actually exposes them.

### G-014 — Handing off a published artifact before source read-back
**Observed 2026-08-10:** commit `04dcbbc9403ee8b94d3c27ea66d8ed6b96b4a955`, blob `561b54b842e0053d3987de82924de96767cf8235`, lost one closing parenthesis in the published Recycle-bin filter even though the local rebuilt source had passed syntax/runtime checks. The defect was caught by GitHub read-back before owner handoff.

**Buried:** treating a successful Contents API response as proof that a manually transferred large source file is runnable.

**Replacement:** read the critical source back from the exact returned blob before handoff. A publish transcription failure is rejected as a failed candidate; rebuild/re-publish from the declared input rather than asking the owner to discover it.

---

# 6. Lessons learned

- Working chat round-trip is strong evidence; do not restart diagnosis at networking for an unrelated mutation failure.
- Owner-demonstrated working history outranks builder inference.
- A completely inert UI means startup/control binding first, not Gateway protocol first.
- Publishing correctness is part of release correctness; read back the exact artifact.
- A mechanism is not a feature until the real control invokes it.
- Reversible local view state and destructive server lifecycle are different layers and should remain separate.
- OpenClaw's transcript archive behavior is useful history and should not be replaced with silent physical erasure.
- `*.jsonl.jsonl` is evidence to surface, not something to silently normalize.
- TalkBridge's most transferable appearance lesson is one persisted theme state with coherent presets plus granular overrides.
- Stabilize one OpenClaw instance before multiplying instances.
- Before interpreting a runtime failure as an application regression, fingerprint the **served artifact**, not merely the repository artifact. The 2026-08-10 WSL test log identified itself as v2.3.0 but its connect payload/log strings did not match the governed GitHub v2.3 candidate; stale or divergent deployed copies can create false failures.

---

# 7. Decision log

- **D-001 · 2026-08-10:** Session Manager work is governed by this file.
- **D-002 · 2026-08-10:** WSL functional gate precedes GitHub Pages deployment-path testing.
- **D-003 · 2026-08-10:** Expansion order is stable single instance → instance profiles → simultaneous instances → neutral hosting → unified workspace.
- **D-004 · 2026-08-10:** Session edit/rename round-trip into official OpenClaw Control UI is confirmed.
- **D-005 · 2026-08-10:** Owner authorizes v2.2.0 as the SM-R2 build input.
- **D-006 · 2026-08-10:** `bridge-turn24-base.html` is the lifecycle/appearance reference pattern.
- **D-007 · 2026-08-10:** Recycle-bin chevron is at the **top** of the session list.
- **D-008 · 2026-08-10:** Permanent delete uses OpenClaw session deletion/archive semantics, never direct source erasure by Session Manager.
- **D-009 · 2026-08-10:** `*.jsonl.jsonl` is a first-class diagnostic anomaly; SM-R2 detects but does not repair.
- **D-010 · 2026-08-10:** Debug moves behind Configuration and becomes tabbed Log / Session Files / Environment.
- **D-011 · 2026-08-10:** First v2.3 publish `04dcbbc…` rejected during read-back before owner handoff due to a transferred syntax defect. Rebuilt/re-published candidate is commit `b0d70c3f4eeed1a90ddc050b608fe8f4e1e4a8f2`, blob `134466f379e93492c0b7b5e4fe9ec80afe7b42cf`.
- **D-012 · 2026-08-10:** A WSL test producing `DEVICE_AUTH_SIGNATURE_INVALID` was not accepted as an SM-R2 code failure because the running payload did not fingerprint to the governed GitHub candidate (different platform/deviceFamily fields and a log string absent from the candidate). Deployment fingerprint verification is now required before diagnosing a release regression.

---

# 8. Maintenance rule

Before code: freeze scope here.  
After new evidence: update Lessons or Graveyard immediately.  
After owner ruling: update Decision Log in the same session.  
After failure: restore declared input and rebuild.  
After owner pass: record the new commit/blob as baseline.  
Unscheduled ideas remain backlog items until promoted deliberately.
