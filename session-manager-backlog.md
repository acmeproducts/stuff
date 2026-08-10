<!-- SESSION-MANAGER-GOVERNANCE v1.0.0 -->
# Session Manager — Release Plan, Backlog, Graveyard, and Lessons

**File:** `session-manager-backlog.md`  
**Governance version:** 1.0.0  
**Started:** 2026-08-10  
**Application artifact:** `session-manager-v3.html`  
**Owner:** Confi — sole device gate and final scope authority.  
**Purpose:** one source of truth for what ships next, what waits, what is forbidden, and what we have learned.

This document deliberately combines the release plan, backlog, graveyard, decisions, and lessons learned so Session Manager does not fragment across chats or repeat failed approaches.

Derived from the operating discipline in:
- `talkbridge/TALKBRIDGE-PLAN-v9.md`
- `talkbridge/THE-METHOD.md`

---

## 0. Authority and governance

When sources disagree, use this order:

1. **Owner ruling in the current session.** It must be written into this file in the same session.
2. **Graveyard in this file.** A buried approach cannot be reused unless the owner explicitly reverses the ruling.
3. **Current release plan in this file.** Defines exact input, output, scope, and gate.
4. **Current gated artifact.** What is proven to work beats inference about what should work.
5. **Backlog.** Ideas only; backlog items are not authorization to change the current release.

### Hard rules

1. **Read this file before changing Session Manager.**
2. **Declare the release before building.** Input, output, exact items, and gate must already be written here.
3. **The current gated baseline is sacred.** A candidate does not become baseline until the owner passes it on the real environment.
4. **Fail means rollback, not patch-forward.** Restore the release input, write the failure into the graveyard, update this document, then rebuild the same release from the clean input.
5. **Prove the cause before designing the fix.** Unknown cause = instrument the whole path and read the evidence. Do not promote a hypothesis to root cause.
6. **Verify, do not infer.** Syntax checks, lint, and static inspection are necessary but are never proof that the UI is alive or that Gateway behavior works.
7. **Test reachability through the real control.** A feature with working internals but no functioning button/input/path is a failed feature.
8. **Hook/minimally extend working behavior; do not casually replace shared functions.** Preserve known-good call paths unless evidence proves they must change.
9. **One concern surface per release.** If two changes cannot be independently gated, combine them deliberately. Otherwise keep them separate.
10. **No scope creep while fixing a gate failure.** New ideas go to Backlog.
11. **Cosmetic work follows functional stability.** Do not mix layout redesign with transport/auth/session correctness unless the UI change is required to invoke the feature.
12. **Single-file invariant.** The deployable application is one readable, self-contained HTML file with inline CSS/JS. No installers, wrappers, decompression loaders, generated launchers, or secondary runtime assets.
13. **Repository artifact must remain literal HTML.** `session-manager-v3.html` must begin as normal HTML and remain human-readable source. Encoding used internally by an API transport is not application packaging and must never become the checked-in artifact.
14. **GitHub write discipline.** Fetch the fresh file SHA immediately before replacement, write plain UTF-8 source, then read the file back from GitHub and verify the expected version and critical controls/logic.
15. **Do not invent pairing work.** Never tell the owner to approve a device unless the Gateway actually reports a pending pairing/scope-upgrade request. Use the real request ID when one exists.
16. **Result discipline.** Report what is proven, what is not yet proven, and the next gate. Avoid speculative troubleshooting cycles.

---

## 1. Current state

### Gated baseline — v2.1.0

**Status:** KNOWN WORKING / rollback floor.  
**Artifact:** `session-manager-v3.html`  
**Known-good blob:** `27ee8fabe42a185d194b4af4d668e81b54a8b8c8`  
**Restore commit:** `9aaa686d930ff02e7720c024ec67890985ef9498`

Known working behavior before the current release:
- page starts and controls are live;
- browser reaches the OpenClaw Gateway;
- sessions load;
- chat round-trip works;
- session subscriptions/activity tracking work;
- inline rename UI exists;
- `sessions.patch` reaches the Gateway but rename is blocked when the browser lacks `operator.admin`.

The decisive rename failure observed on the working client was:

`missing scope: operator.admin`

That is evidence that transport, Gateway reachability, RPC, and the rename method itself were functioning at that point. The unresolved area is authorization/recovery, not a reason to redesign the entire client.

### Current candidate — v2.2.0

**Status:** BUILT / NOT GATED.  
**Artifact:** `session-manager-v3.html`  
**Current candidate commit:** `78a014b4f1168892c9d35c199b353fcff975d112`  
**Current candidate blob:** `1fe3f05477ab7544f3022e5def4e1f01a6065ff5`

This file is not a baseline until the WSL-hosted owner gate passes.

---

## 2. ACTIVE RELEASE — SM-R1 / app v2.2.0

### Intent

Take the known-working v2.1.0 client and add exactly one known bug fix plus four requested user-facing changes. Nothing else belongs in this release.

### Input

`session-manager-v3.html` v2.1.0, blob `27ee8fabe42a185d194b4af4d668e81b54a8b8c8`.

### Output

`session-manager-v3.html` showing app version `v2.2.0`.

### Exact release scope — five items only

1. **Known auth-recovery bug**
   - Handle the proven Gateway token-mismatch recovery case without an endless reconnect loop.
   - Follow the Gateway/OpenClaw-supported bounded cached-device-token recovery path.
   - Do not manufacture a pairing request.
   - Rename must still use the canonical `sessions.patch` path and must only be called successful when the server accepts it.

2. **Readable transcript + per-message Copy**
   - Render transcript Markdown into readable HTML.
   - Preserve the original message text/Markdown for Copy.
   - Every transcript message block gets a Copy control.
   - Raw untrusted HTML from messages is not executed.

3. **Download in selected-session header**
   - Header Download control appears only when a session is selected.
   - Export the selected transcript as readable Markdown.

4. **Stop in compose strip while agent is active**
   - Stop is hidden when no run is active.
   - Stop appears only for an active selected-session run.
   - Use the supported Gateway abort path; do not simulate completion in the UI without sending the abort.

5. **Share next to Download**
   - Share control appears next to Download for a selected session.
   - Use native share when available.
   - Provide a deterministic text-copy fallback where native sharing is unavailable.

### Explicit non-scope

Do not add or redesign any of the following in SM-R1:
- multi-instance support;
- GitHub Pages deployment behavior;
- platform abstraction;
- appearance redesign;
- session grouping/reordering;
- new persistence formats;
- new services, ports, workers, installers, wrappers, or helper apps;
- broad auth architecture changes beyond the proven mismatch/recovery defect;
- unrelated refactoring.

### Owner gate — WSL first

Run the exact candidate from the existing WSL-hosted test location before any GitHub Pages deployment experiment.

SM-R1 passes only when the owner verifies all of these:

- [ ] Page starts; hamburger, settings, refresh, session rows, compose controls respond.
- [ ] Sessions populate from the existing OpenClaw instance.
- [ ] Existing chat round-trip still works.
- [ ] No repeating token/auth reconnect loop.
- [ ] Rename can complete through the Gateway when the required authorization is actually available, and the new label is visible after refresh / in the official Control UI.
- [ ] Markdown is visibly rendered in transcript blocks.
- [ ] Copy copies the original message content.
- [ ] Download produces the selected transcript as Markdown.
- [ ] Share works through native share or the defined copy fallback.
- [ ] Stop appears only during an active run and actually stops that run.
- [ ] Existing attachment/send/session-selection behavior has not regressed.

### Failure rule

If any SM-R1 gate fails:

1. Restore exact v2.1.0 baseline.
2. Add a graveyard entry below with the failed candidate commit, symptom, evidence, and buried approach.
3. Bump this governance document version.
4. Rebuild SM-R1 from v2.1.0.
5. Do **not** patch the failed v2.2.0 candidate forward.

A failed candidate remains historical evidence, never the next build input.

---

## 3. Planned releases after SM-R1 passes

These are ordered releases, not permission to start them early.

### SM-R2 / v2.3.0 — explicit instance profiles

**Goal:** make one Session Manager able to target more than one OpenClaw instance without changing URLs, files, or browser windows manually.

Scope:
- named instance profiles;
- explicit Gateway URL per profile — never infer an OpenClaw Gateway from the page host;
- isolated device/auth state per instance so credentials cannot bleed across instances;
- connect/reconnect/test action per profile;
- visible connected/disconnected/error state per profile;
- simple instance selector;
- one selected instance active in the main session pane at a time.

Gate:
- two real OpenClaw instances;
- switch A → B → A without reload;
- correct sessions shown for each;
- chat round-trip works on both;
- no cross-instance labels, auth tokens, run states, or subscriptions.

### SM-R3 / v2.4.0 — simultaneous multi-instance session desk

**Goal:** remove instance-level window hopping.

Scope:
- keep multiple configured Gateways connected simultaneously;
- aggregate sessions in one left pane, grouped/labeled by instance;
- per-instance connection/activity indicator;
- select and chat with a session from any connected instance without changing browser tabs;
- preserve independent run/activity state for sessions on different instances;
- reconnect one instance without disturbing the others.

Gate:
- two instances connected at once;
- active runs on both at once;
- session status remains correct for both;
- disconnect/reconnect one while the other remains usable.

### SM-R4 / v2.5.0 — platform-neutral deployment

**Goal:** the same unchanged client works from a neutral static host and manages OpenClaw across supported platforms on the Tailnet.

Scope:
- GitHub Pages as the preferred static delivery path;
- explicit Gateway endpoints from SM-R2 profiles;
- validate OpenClaw allowed-origin requirements for the Pages origin;
- remove assumptions that the HTML must live beside the Gateway or in WSL;
- record platform metadata for an instance without changing Gateway protocol behavior;
- no platform-specific fork of the HTML.

Gate:
- exact same HTML served from GitHub Pages;
- connect over Tailscale to the WSL OpenClaw instance;
- connect to at least one second supported platform/instance;
- sessions/chat/rename/download/share/stop behave the same as the WSL-hosted gate.

### SM-R5 / v2.6.0 — unified operations workspace

**Goal:** reduce the remaining window hopping after multi-instance chat is proven.

Candidate scope, to be finalized before build:
- global session search across instances;
- favorites/pins and recency views;
- instance health/version summary;
- compact diagnostic access per instance;
- export/import instance-profile configuration without exporting secrets by default;
- deliberate desktop/tablet layout for many simultaneous sessions.

This release is intentionally not frozen yet. Its exact scope must be agreed after SM-R3/SM-R4 usage reveals what actually causes window hopping.

---

## 4. Backlog — not yet scheduled

Items live here until promoted into a numbered release with an input, output, and gate.

### Session management
- global search across all configured instances;
- pinned/favorite sessions;
- configurable session grouping;
- bulk transcript export;
- session metadata/details panel;
- explicit read-back verification after rename;
- safe session archive/delete controls only after Gateway semantics are proven.

### Instance management
- instance add/edit/remove UI;
- instance nickname, platform, Gateway version, agent count, connection health;
- connection-profile export/import;
- secret-safe export mode;
- per-instance diagnostics download;
- optional default instance and startup behavior.

### Multi-platform
- prove browser client against each intended OpenClaw platform one at a time;
- keep protocol adapter shared; platform differences belong in metadata/configuration unless evidence proves otherwise;
- document Tailnet and origin prerequisites per deployment surface.

### Transcript/chat UX
- better fenced-code rendering and copy-code controls;
- transcript search;
- jump to latest/unread;
- message timestamps/details on demand;
- share as file where browser support is reliable;
- optional transcript format choices after Markdown export is proven stable.

### Reliability and test infrastructure
- startup harness that proves `init()` completes and all required controls are bound;
- reachability test for every user-visible control;
- mock Gateway harness for auth challenge, token mismatch, pairing required, scope mismatch, chat send/final/abort, sessions list/patch;
- two-client harness for simultaneous-session and multi-instance work;
- mutation tests that deliberately break each gate to prove the test catches it;
- permanent runtime assertion/logging for previously silent startup/auth failures.

### Deployment
- GitHub Pages deployment after SM-R1 passes locally;
- exact origin/allowed-origin verification;
- cache/version visibility so the owner can prove which build the browser loaded;
- read-back/hash verification of every published artifact.

---

## 5. Graveyard — do not reuse these approaches

Every entry records a failed approach and its replacement. A graveyard entry is a veto, not a suggestion.

### G-001 — Patch-forward after a failed/inert candidate

**Buried:** continuing to modify an already failed Session Manager candidate until it appears to work.  
**Why:** the lineage becomes impossible to reason about and new defects are mixed with the original failure.  
**Replacement:** restore the gated baseline, record the failure, rebuild the release from the clean input.

### G-002 — Self-decompressing/base64 application wrapper

**Buried:** shipping the Session Manager as a base64/gzip payload with an `atob()`/decompression loader.  
**Observed failure:** `Failed to execute 'atob' ... string ... not correctly encoded.`  
**Why:** it violated the single readable HTML invariant and introduced a new failure layer unrelated to the app.  
**Replacement:** checked-in artifact is literal, readable HTML/CSS/JS only.

### G-003 — Standalone proof client with a divergent connection bootstrap

**Buried:** creating a separate rename/auth proof page that implements its own endpoint/auth bootstrap and then treating its behavior as evidence about the working Session Manager.  
**Observed result:** the proof page produced transport errors while the actual chat client still completed chat round-trips.  
**Replacement:** instrument and test the exact working client path, or use a harness that shares the same connection implementation.

### G-004 — Page-origin inference as proof of the OpenClaw Gateway endpoint

**Buried:** assuming the static page host is necessarily the Gateway host.  
**Why:** a report server or GitHub Pages host can serve the HTML while the browser should connect to a different Tailnet Gateway.  
**Replacement:** explicit Gateway URL/profile. Preserve the current known-working local configuration until the profile release deliberately changes this.

### G-005 — Blind `devices approve --latest`

**Buried:** instructing the owner to approve a device when the Gateway has not emitted a pairing/scope-upgrade request.  
**Observed result:** `No pending device pairing requests to approve.`  
**Replacement:** surface the actual Gateway error. Approval instructions appear only with a real pairing request/request ID.

### G-006 — Treating a top-level `INVALID_REQUEST` as the root cause

**Buried:** stopping at the generic error code.  
**Why:** the decisive auth evidence was nested in details: `AUTH_TOKEN_MISMATCH` with a recovery recommendation.  
**Replacement:** inspect structured Gateway error details before choosing recovery behavior.

### G-007 — Replacing the explicit Gateway token with the cached device token as an invented recovery scheme

**Buried:** broad auth redesign where the cached device token becomes the primary token because the shared token mismatched.  
**Why:** this diverged from the current OpenClaw browser-client recovery behavior and expanded the defect surface.  
**Replacement:** bounded recovery matching the supported Gateway/client contract; preserve the explicit token contract and use the cached device token only in the supported recovery field/path.

### G-008 — Syntax/lint as proof the browser app works

**Buried:** declaring a release safe because HTML parses and extracted JavaScript passes `node --check`.  
**Observed failure:** an artifact could pass static checks and still be completely inert.  
**Replacement:** structural checks plus runtime startup and reachability checks; final proof is the owner gate on the real browser/Gateway path.

### G-009 — Broad refactor bundled with a one-bug fix

**Buried:** redesigning auth, permissions, UI, persistence, or deployment while fixing one known defect and adding a few small controls.  
**Why:** regression surface becomes much larger than the requested change and makes failure attribution difficult.  
**Replacement:** start from the known-good baseline; make the smallest change set that satisfies the declared release.

### G-010 — Encoding/packaging detours during repository publishing

**Buried:** turning a straightforward plain-text file replacement into custom blob/base64/chunk/installer machinery.  
**Why:** publishing mechanics became a new source of corruption and distracted from the application gate.  
**Replacement:** ordinary plain UTF-8 Contents API replacement with a fresh SHA and immediate read-back verification.

---

## 6. Lessons learned — Session Manager specific

### L-001 — A working chat round-trip is high-value evidence

If the selected session can send to the agent and receive the response, then browser → WebSocket → Tailscale/TLS → Gateway → session RPC/event flow is substantially proven for that run. Do not restart troubleshooting at DNS/Tailscale/WebSocket merely because rename fails.

### L-002 — The original rename failure was narrow

The working client reached `sessions.patch`; the Gateway rejected it specifically for missing `operator.admin`. That evidence should have constrained the fix to authorization/recovery. The subsequent broad experiments created more problems than the original defect.

### L-003 — Owner history beats builder inference

The owner supplied a working version with one known bug. That fact should have made the working version the immutable input. Reconstructing or broadly rewriting it was lower-quality evidence than the owner's demonstrated working state.

### L-004 — Completely inert means inspect startup before protocol

When every control is dead, first prove whether the page script initialized and handlers were bound. Do not immediately investigate Gateway protocol. A protocol defect does not normally make the hamburger/settings/search controls inert.

### L-005 — Publishing is part of the product path

A correct local file can still become a bad release if the repository write path corrupts, truncates, wraps, or transforms it. Therefore the published file must be read back and checked as an artifact, not assumed correct because the source file was correct.

### L-006 — Exact-path testing beats parallel proof apps

The most useful test is the one that exercises the same HTML, same bootstrap, same stored browser identity, same Gateway URL, and same controls the owner will use. Parallel mini-apps are only useful when they share those exact primitives; otherwise they can create unrelated failures.

### L-007 — Recovery loops need a budget

An auth recovery path that retries the same failed credentials indefinitely is not recovery. It is a loop. Every automatic auth recovery must be bounded and must stop with actionable evidence when the bounded retry fails.

### L-008 — A mechanism is not a feature until it is reachable

Buttons and state transitions must be exercised through the actual control. Internal functions, static presence, or successful unit calls are insufficient.

### L-009 — Keep the deployment model simple

The browser client is a static application. Long term, it should not require a duplicate WSL deployment merely to talk to an OpenClaw Gateway reachable over Tailscale. But deployment-path changes come only after the functional client passes its current WSL gate.

### L-010 — Separate functional stabilization from expansion

First make one client against one known instance boring and reliable. Then add instance profiles. Then simultaneous instances. Then platform-neutral hosting. This order minimizes the number of variables in each failure.

---

## 7. Decision log

### D-001 — 2026-08-10 — Session Manager goes under governance

Owner ruling: Session Manager work will use a written release plan, backlog, graveyard, and lessons learned, maintained in this single file.

### D-002 — 2026-08-10 — WSL gate precedes GitHub Pages

Owner ruling: test the current client from the known WSL-hosted environment first. GitHub Pages is a later deployment-path test, not part of SM-R1.

### D-003 — 2026-08-10 — Expansion direction

After the single-instance client is stable, evolve toward multiple OpenClaw instances and multiple platforms so the owner can manage sessions from one workspace instead of hopping among windows.

---

## 8. Maintenance rule

This file is part of the release, not documentation cleanup.

For every future Session Manager change:

- before code: promote exact backlog items into a numbered release and freeze scope;
- after new evidence: update Lessons or Graveyard immediately;
- after owner ruling: update Decision Log in the same session;
- after failure: graveyard first, rollback second build input, then rebuild — never patch-forward;
- after owner pass: mark the candidate as the new gated baseline and record its commit/blob;
- keep unscheduled ideas in Backlog rather than sneaking them into the active release.
