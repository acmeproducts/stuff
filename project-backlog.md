# SOT Project Governance, Release Plan, Backlog & Graveyard

**Repository:** `acmeproducts/stuff`  
**Canonical UI:** `project.html`  
**Canonical helper/backend:** `file_browser.py`  
**Canonical planning/governance document:** `project-backlog.md`  
**Last governance update:** 2026-08-10  

This file is intentionally the single current control document for the SOT effort. It contains the current baseline, owner rulings, release plan, live backlog, acceptance gates, deferred work, and graveyard. Do not create a competing SOT plan/backlog/graveyard unless the owner explicitly changes this rule.

---

# 0. GOVERNANCE — READ FIRST

The SOT effort adopts the build discipline proven in TalkBridge, adapted to this product.

## 0.1 Authority order

When sources disagree, stop at the first source that answers the question:

1. **Current owner ruling** in the active session.
2. **Graveyard in this file** — a buried SOT approach is vetoed unless the owner explicitly resurrects it.
3. **Locked release scope in this file.**
4. **Current product rules / backlog in this file.**
5. **Rolling SOT PRD and approved review/feedback documents.**
6. Older implementation notes and historical release notes.

An owner ruling made in-session must be written into this file in the same session if it changes scope, architecture, or a standing rule.

## 0.2 Current owner rulings

- `project-backlog.md` is the one current SOT governance document: release plan + backlog + graveyard.
- The next release must contain **all five locked v0.3.1 items** listed below. Do not silently split, defer, or omit one.
- Do not add a new service, daemon, port, database, or proxy layer when the existing SOT helper can safely own the function.
- The SOT HTTP helper remains one process on `127.0.0.1:8081`.
- **Release deployment must use the existing report server, existing SOT helper, existing port 8081, and existing Tailscale routing. A release is not permission to restart, replace, or reconfigure infrastructure.**
- **`deploy-sot-project.sh` is release-file installation only: overwrite the canonical `project.html` and `file_browser.py` in their already-established locations. It must not create/start/stop/restart servers or alter ports/routes.**
- If an already-running Python helper requires a reload to pick up a changed `file_browser.py`, that is an operational reload of the existing helper, not a new service or architecture decision; do not perform it as part of a release unless the owner explicitly asks for that operational step.
- Project creation exists only in **Intake → Enter Project**.
- Project identity is the immutable `project_token`; project name is mutable.
- No fake lifecycle state. If the deterministic execution engine is not running, the UI must say so and must not simulate Start/Pause/Resume/Restart/Promote.
- GitHub `acmeproducts/stuff` is the development source. The deployed HTML target is `/home/support/.openclaw/workspace/https/report/<project>/<filename>`.
- Deployment convenience commands are `ghdeploy` (GitHub → OpenClaw) and `deploy` (Windows Download → OpenClaw); default report project is `tst`.

## 0.3 Build rules

These are hard rules, not suggestions.

### Prove the cause before designing the fix
If a defect is not already proven, instrument the whole path and read the evidence. Do not promote a theory into a root cause because it sounds plausible.

### Verify, do not infer
Claims about the current build must come from the current file, a test, a log, an API response, or the owner’s device gate. A failed keyword search is not evidence that a feature is absent.

### Roll back; do not patch a failed release forward
A failed owner/device gate returns to the release input baseline. Record the failed approach in the graveyard, rebuild the same planned version from the clean input, and gate again. Do not stack fixes onto a failed candidate.

### Hook/wrap where downstream behavior exists
Do not casually replace a function with downstream responsibilities. Preserve call-through behavior unless the replaced function is proven to be a leaf.

### Mutation-test meaningful gates
For every important automated gate, deliberately reintroduce or simulate the defect and confirm the gate fails. A test that cannot catch its target defect is not a gate.

### Exercise features through the control the user actually uses
A mechanism with no reachable UI/control path is not implemented. At least one test must invoke the feature through the operator-facing control.

### No stubs, fake data, or cosmetic success
A release must deliver real cumulative behavior at its declared layer. Disabled future controls are acceptable only when they accurately report that the future engine is not installed; they may not imitate completion.

### One surface, one release
Items that touch the same user surface and cannot be independently device-gated belong in the same release. This is why all five Intake/filesystem items below are locked together in v0.3.1.

### Cosmetic work goes after functional work
Do not fold unrelated visual polish into functional releases.

### Owner/device gate is final
Syntax, unit tests, structural checks, API checks, and local harnesses determine whether a candidate is allowed to be handed to the owner. They do not make the release accepted. The owner gate on the actual WSL/Windows/Android environment is the final acceptance gate.

### Byte/version verification
Every candidate must visibly report its UI/API version/build. Repo writes must be read back after write; deployment must verify that the deployed artifact is the intended build, not merely assume the copy succeeded.

### Release deployment is not infrastructure work
A release may replace application files at their established runtime/served paths. It must not introduce or change topology. Existing services, ports, and routes are presumed authoritative unless an independently proven defect requires an explicit owner-approved infrastructure change.

---

# 1. CURRENT VERIFIED / KNOWN STATE

## 1.1 Repository baseline

### `project.html`

- Version: **0.3.0**
- Build: **2026.08.09.1**
- Repo blob SHA at governance lock: `89920a073aae12dcebecb50a9ba9cf7e32f2bd14`
- Primary navigation: Intake / Operations / Reporting.
- Intake is the only project-creation surface.
- UI has live version/build display and API version comparison.
- Operations represents Source(s) → Target and Target(s) → SOT.
- Reporting surfaces Aggregate / Timeline / Project Detail.
- Execution controls do not fake a running `sotctl` engine.

### `file_browser.py`

- Version: **0.3.0**
- Build: **2026.08.09.1**
- Repo blob SHA at governance lock: `32c684163c8e7682d62370738d711400e013ab94`
- Intended architecture is one helper on `127.0.0.1:8081`.
- Repo code contains filesystem browsing plus project persistence/reporting APIs.
- Project database uses SQLite and enables WAL mode in the current helper implementation.

## 1.2 Live deployment state

The owner’s last observed `project.html` reported **Project API offline**. Therefore:

- the repository contains the unified project API implementation;
- the live WSL deployment of that unified API is **not yet verified**;
- do not claim `/api/projects` or `/api/reports` is live until a deployment/API response proves it.

## 1.3 Current architectural topology

```text
OpenClaw Gateway       existing port
Report/static server   existing port

ONE SOT helper
127.0.0.1:8081
  ├── /api/fs
  ├── /api/projects
  └── /api/reports
```

No supported SOT architecture includes a second project API service or port 8082.

### Deployment invariant

```text
GitHub release files
   ├── project.html
   └── file_browser.py
          ↓ overwrite only
Established served/runtime paths

Servers: unchanged
Ports: unchanged
Tailscale routing: unchanged
```

---

# 2. RELEASE CHAIN

A release is built only from its declared baseline. Scope is locked before implementation. If the owner gate fails, restore the baseline, write a graveyard entry, and rebuild the same version from the clean input.

## v0.3.0 — CURRENT BASELINE

**Status:** repository baseline; UI observed, unified API deployment not yet owner-verified.  
**Input:** prior portal.  
**Output:** `project.html` v0.3.0 + unified `file_browser.py` v0.3.0.  

Delivered in repo:

- Intake / Operations / Reporting information architecture.
- One project creation path.
- Immutable token / mutable name model in backend.
- Server-side project persistence schema.
- Idempotent project creation logic.
- WSL-visible multi-source browser.
- Operations and reporting shells backed by real project records when API is live.
- Unified same-port helper architecture in repository.
- Version evidence in UI/API.

Not accepted as complete infrastructure until the unified API is deployed and owner-verified.

---

# 3. LOCKED NEXT RELEASE — v0.3.1

**Status:** CANDIDATE BUILT — automated candidate gates PASS; repo readback verified; owner/device gate NOT YET RUN.  
**Planned version:** `0.3.1`  
**Planned first build:** `2026.08.10.1`  
**Input baseline:** exact v0.3.0 `project.html` and `file_browser.py` SHAs listed above.  
**Output:** same canonical filenames, versioned internally; no `project-v2.html` proliferation.  
**Candidate commit:** `17e00575ca8a56c8b69a4c7702fa4d369a0fda1f`  
**Candidate UI blob:** `9ed479e011e9b5275d1d6adb73d624fad7c09718`  
**Candidate helper blob:** `799345919451c2674d0a66215a7480fb1a441845`  
**Candidate automated gate:** PASS — `test_sot_v031.py` plus build checksum/compile checks.  
**Owner/device gate:** NOT YET RUN.  
**Surface:** Intake + filesystem/source/target definition.  

**All five items below are mandatory in this release. No silent deferral.**

## 3.1 Item 1 — Target parent + traceable project folder

Replace the current “pick the final target folder” interaction with:

```text
Project name: DJI #1

Choose target parent:
/mnt/f/SOT

Target folder name:
DJI #1          <- defaults from project name, editable

Result:
/mnt/f/SOT/DJI #1
```

Requirements:

- User selects the **parent** directory.
- Proposed child folder name defaults to current project name.
- Folder name is editable before creation.
- Resulting full target path is shown before Enter Project.
- The project record stores the resulting full target path.
- Folder creation failure leaves Intake intact and reports the real error.
- Do not create the folder merely by browsing into a parent; creation occurs only on the explicit target action / project intake path.

## 3.2 Item 2 — File browser navigation, rescan, and visibility fix

The current calculated-parent approach is replaced with real browser navigation state/history.

Requirements:

- Maintain navigation history from root/volume into child folders.
- Up returns to the actual previous browser location rather than calculating an invalid `/mnt` parent.
- Every navigation and explicit Rescan performs a fresh `/api/fs` read.
- Display both folders **and files** so a directory containing files is never misrepresented as empty.
- Files are visible context but are not selectable when the control requires a folder.
- Root/volume transitions remain stable when moving back upward.
- Preserve the current browser location while a rescan occurs.
- Empty state must distinguish “no child folders” from “directory contains files only” and from a real API/read error.

## 3.3 Item 3 — Android / local-device source intake

Intake must support two real source classes:

```text
+ WSL / mounted source
+ This device
```

Requirements:

- WSL/mounted continues to use `/api/fs` and produces a canonical WSL path source.
- “This device” uses a browser-supported local directory selection path on the actual Android browser.
- Capability must be detected; do not show a control that cannot be invoked.
- If the preferred directory-handle API is unavailable, use a proven browser-supported directory-selection fallback rather than pretending Android is a WSL mount.
- Persist enough local source identity/metadata to reopen or reauthorize the source on the same device.
- Permission denial/cancel is handled as a normal, non-destructive outcome.
- A local-device source is explicitly typed differently from a WSL path source in the project model.
- At this release layer, the feature must perform real selection + enumeration/identity capture + authoritative project registration. The later reconciliation engine will consume that registered source type; do not fabricate execution status now.

## 3.4 Item 4 — Real target-directory creation in the existing 8081 helper

Add target folder creation to the same helper. No new process/port.

Planned contract:

```text
POST /api/fs/mkdir
```

Requirements:

- Accept parent path + requested child folder name.
- Normalize/validate the WSL parent path.
- Reject traversal and invalid names.
- Never overwrite a regular file.
- If the directory already exists, return an explicit, non-ambiguous result rather than silently pretending it was newly created.
- Return the canonical created/existing directory path.
- Record enough information for Intake to show exactly what target will be used.
- Failure is surfaced to the operator; project creation cannot silently continue with a different target.

## 3.5 Item 5 — Prove the unified project API on the existing 8081 helper

The repo implementation is not enough; v0.3.1 must prove the live environment **without changing infrastructure topology**.

Requirements:

- `/api/fs`, `/api/projects`, and `/api/reports` all resolve through the already-established SOT helper on `127.0.0.1:8081`.
- Do not create, start, stop, restart, or configure any additional SOT service/port as part of release deployment.
- Do not modify Tailscale Serve routing as part of release deployment.
- No SOT listener/service on 8082.
- `project.html` health indicator shows API live only after a real health response.
- UI/API versions/builds match and are visible.
- Project creation returns one immutable token.
- Repeated submission with the same idempotency key returns the same project rather than a duplicate.
- Project rename does not change the token.
- Project list survives browser refresh because the server-side DB is authoritative.

## 3.6 v0.3.1 automated gates

Before owner handoff:

- JavaScript syntax/parse gate for `project.html`.
- Python compile/import gate for `file_browser.py`.
- API contract tests for health, fs browse, mkdir, create/list/get/rename project, aggregate/timeline.
- Idempotency/duplicate-create test.
- Browser history test that specifically covers `/ → drive → folder → child → Up → Up → root`.
- Directory rendering test with: folders only, files only, mixed files/folders, empty directory, permission/API error.
- Target mkdir tests: new folder, already exists, invalid name, path traversal, unwritable parent.
- Local-device source reachability test through the actual Intake control.
- Version/build match test.
- Topology guard test proving all SOT helper behavior is designed for existing 8081 and that release scripts do not create/reconfigure infrastructure.

### Required mutation checks

At least these defects must be deliberately reintroduced/simulated and caught:

- restore calculated-parent navigation and confirm navigation gate fails;
- discard returned file entries and confirm files-only-directory gate fails;
- make mkdir return success without creating/verifying a directory and confirm gate fails;
- reuse an idempotency key for a different request and confirm conflict gate fires;
- introduce an 8082 dependency or route-changing deployment behavior and confirm topology gate fails;
- make the local-device source control unreachable and confirm reachability gate fails.

## 3.7 v0.3.1 owner/device gate

### WSL / Windows

- Open the deployed `project.html`.
- Version/build visible and matches API.
- Add multiple WSL/Windows sources.
- Navigate deep into a volume, go Up repeatedly, and return to the same logical locations without losing place.
- Confirm a files-only directory visibly shows its files.
- Select target parent, accept default project-name folder, and create project.
- Repeat with an edited target folder name.
- Confirm the created physical target folder exists in the chosen parent.
- Confirm project creation returns one project token and survives refresh.

### Android

- Open the same deployed portal in the actual intended Android browser.
- Add a “This device” source such as a DCIM directory.
- Confirm selection is real and directory contents/identity can be enumerated/captured.
- Cancel/deny once and confirm the UI remains usable.
- Reopen/reauthorize the source as required by the browser and confirm the same registered source can be recognized at the project layer.

### Infrastructure

- Confirm the release used the existing report server and existing SOT helper only.
- Confirm no extra SOT project API service/port was introduced.
- Confirm release deployment did not alter Tailscale routing.

**Only after this gate passes does v0.3.1 become the new baseline.**

---

# 4. RELEASE PLAN AFTER v0.3.1

Scope below is planned but not locked until the preceding release passes. Before each release begins, verify the current baseline and rewrite/confirm exact input/output and gate criteria here.

## v0.4.0 — Engine foundation: source identity + scan + manifest

**Goal:** create the deterministic `sotctl` foundation and generate authoritative source manifests without copying data.

Planned items:

- `sotctl init`.
- `sotctl register-source`.
- `sotctl scan-source`.
- Durable source IDs and project/source associations.
- Deterministic recursive scan with stable relative paths.
- Manifest persistence.
- Store both `original_path` and `normalized_path` to prevent Windows/WSL path ambiguity.
- Source fingerprint evidence model.
- `fingerprint_match_threshold` config, default `0.80` pending gate results.
- Manual `sotctl relink-source` workflow for removable media whose path/UUID changes.
- Engine SQLite in WAL mode.
- Batched bulk writes/transactions for scan ingestion.
- Error table/event capture.
- Stage-level concise `stage_error_report.md` generation.
- Default scan concurrency capped conservatively; MVP target is no more than two scan workers until measured evidence supports more.
- No copy/move/delete behavior in this release.

Gate focus:

- source disappears/reappears;
- same source at a different path;
- original/normalized path consistency;
- scan resume/restart safety;
- multi-million-file simulation or representative large-tree harness before multi-TB claims.

## v0.5.0 — Hash + crunch + duplicate/collision analysis

**Goal:** turn manifests into content identity and reconciliation decisions without copying.

Planned items:

- Candidate selection by size/metadata.
- Fast candidate hash path before full SHA-256 where safe.
- Full SHA-256 confirmation for exact duplicate identity.
- `sotctl hash-source --mode candidates` / equivalent final command contract.
- Content index.
- Exact duplicate clusters.
- Collision/path-conflict detection.
- Primary-source preference rule.
- Unique-vs-duplicate byte accounting.
- Hash checkpoints and resumability.
- Hash/error stage report.
- Performance instrumentation; do not claim multi-TB throughput without measured results.

## v0.6.0 — Copy plan + dry run + verified execution

**Goal:** build a collision-safe target from deterministic plans while preserving copy-only safety.

Planned items:

- `sotctl plan --target ...`.
- Copy plan persistence.
- Collision-safe target naming.
- Preflight showing planned files/bytes/conflicts.
- Dry-run is the default/safety gate.
- Actual copy requires explicit execute action.
- Copy-only: never move/delete source data.
- Temporary destination + verified finalization pattern.
- Size verification and content-hash verification.
- Copy checkpoints.
- Verification failures recorded, summarized, and never silently accepted.
- No source retirement/deletion automation.

## v0.7.0 — Pause/resume/restart + reconnect resilience

**Goal:** make long-running reconciliation survive real interruptions.

Planned items:

- Real Start/Pause/Resume/Restart wired to the deterministic engine.
- Run identity separate from project identity.
- Durable job/checkpoint state.
- Pause between safe work units.
- Resume after browser close, WSL restart, OpenClaw restart, system reboot, worker failure, and source disconnect.
- Source fingerprint/relink check on resume.
- Resume skips completed verified work.
- Restart creates a new run under the same project token, not a duplicate project.
- Status/checkpoint UI backed by real engine state.

## v0.8.0 — SOT promotion + provenance + reporting completion

**Goal:** explicitly promote a verified candidate into the next rolling SOT and produce an audit record.

Planned items:

- Verified target → SOT promotion action.
- Promotion requires verification gate.
- Provenance links source → content → target → promoted SOT.
- Aggregate metrics populated from real engine data.
- Timeline populated with real engine events.
- Project Detail includes runs, checkpoints, manifests, duplicate stats, collisions, copy plan, verification results, errors, provenance, promotion history.
- Export Markdown/CSV reports.
- Project rename never breaks historical reporting.

## v0.9.0 — OpenClaw orchestration

**Goal:** let OpenClaw orchestrate without owning deterministic filesystem logic.

Planned items:

- Optional OpenClaw session association by immutable project token.
- Store `openclaw_session_key`.
- Project rename updates OpenClaw session label without changing project/session identity.
- OpenClaw-triggered project actions use the same backend contracts as UI-triggered actions.
- OpenClaw-triggered events appear in the same timeline.
- Deterministic scan/hash/copy/verify remains in the harness, not in prompts.

## v1.0.0 — MVP hardening / acceptance

**Goal:** declare the first supported Rolling SOT MVP only after measured reliability gates.

Working design envelope to validate rather than assume:

- up to approximately 5 TB per MVP corpus;
- up to 8 registered/concurrent source candidates, with conservative worker concurrency;
- no more than two scan workers by default until measurements justify raising it;
- exact duplicate detection and collision-safe target construction;
- full pause/resume/restart recovery;
- copy-only safety;
- verified SOT promotion;
- complete audit/report output.

Required hardening:

- representative large-corpus benchmark;
- SQLite lock/throughput measurements;
- crash/restart fault injection;
- source removal/replacement tests;
- path normalization tests across Windows/WSL sources;
- dry-run/execute safety mutation tests;
- verification corruption mutation test;
- owner end-to-end reconciliation on real storage.

---

# 5. LIVE BACKLOG — NOT YET ASSIGNED TO A LOCKED RELEASE

Items here are real backlog, but may move when evidence changes. They are not promises until assigned to a locked release.

## Source identity / storage

- Improve fingerprint evidence beyond top-level samples if false-positive/false-negative testing requires it.
- Evaluate filesystem UUID/serial evidence by source type.
- Manual source identity review UI for ambiguous relink cases.
- Source priority editing UI after the primary-source preference rule is operational.
- Network-share-specific disconnect/reconnect handling.
- Encrypted/decrypted staging source classification.
- Normal vs encrypted/sensitive data classification and sidecar metadata support.

## Engine performance

- Benchmark SQLite WAL + batched writes under realistic file counts.
- Consider per-source sharding only if measurements prove a single DB is the bottleneck; do not pre-architect it.
- Evaluate parallel hash workers after single/limited worker correctness is proven.
- Evaluate parallel copy workers only after copy/verify correctness is proven.
- Large-file quick-hash strategy and thresholds.

## Reporting / operator UX

- Filter Aggregate by date/status/source/target/project.
- Download/export links from the portal.
- Human-readable review queue for collisions and ambiguous source relinks.
- Better error drill-down from stage summary to affected files.
- Visualization of represented bytes vs raw bytes vs duplicate bytes.
- Cold/warm/hot SOT tier reporting after core SOT promotion works.

## Android/local-device execution

- Define the efficient data-transfer/execution path for browser-local Android sources once source registration is proven in v0.3.1.
- Resume semantics when Android browser permission is lost or device sleeps.
- Large DCIM transfer behavior and backpressure.
- Secure Folder / inaccessible Android storage remains evidence-driven; do not promise access that Android does not grant.

## OpenClaw

- Session discovery and relink if an associated session is deleted/recreated.
- Project summary injected into OpenClaw context without duplicating authoritative state.
- OpenClaw recommended-next-action based on backend state.

## Future / optional

- Near-duplicate/vision analysis extension point.
- Actual AI image/video similarity model is **not MVP** and must not delay exact reconciliation.
- Rich HTML dashboard beyond the operational portal.
- GUI wrappers for preflight tooling.

---

# 6. SAFETY AND DATA INVARIANTS

These survive every release unless the owner explicitly changes them.

1. Sources are read-only inputs to reconciliation.
2. Copy-only: never move or delete source files automatically.
3. Human validation is required before physical source retirement.
4. A project is identified by immutable `project_token`, never mutable name.
5. A project may have multiple runs; restart is not a new project.
6. Retry/double-click/browser refresh cannot duplicate a project.
7. Source identity must be capable of surviving path/drive-letter changes through fingerprint/relink evidence.
8. Target construction must be collision-safe.
9. Verification failure blocks SOT promotion.
10. Reporting resolves by project token so rename does not break history.
11. Browser `localStorage` is never the authoritative project database.
12. Secrets/config stay environment-side and are not committed to GitHub.
13. No extra SOT service/port without a proven technical boundary and explicit owner ruling.
14. A feature that cannot be invoked through the operator control is not implemented.
15. A failed owner gate is rolled back, recorded, and rebuilt from the clean input rather than patched forward.
16. Release deployment may overwrite application files in established locations but must not create/start/stop/restart infrastructure or alter ports/routes without explicit owner approval.

---

# 7. GRAVEYARD — VETOED SOT APPROACHES

The graveyard records approaches that were tried, proposed, or materially pursued and then rejected based on owner ruling/evidence. Scan this section before every build. Do not silently reintroduce a buried approach.

## G-001 — Separate project API service on port 8082

**Date buried:** 2026-08-10  
**Status:** VETOED  
**Approach:** run filesystem browsing on 8081 and create a second FastAPI/systemd project-control service on 8082.  
**Why buried:** project persistence/reporting are part of the same SOT helper boundary; the extra daemon/port increased architecture and deployment surface without a demonstrated technical need.  
**Replacement:** one `file_browser.py` helper on 8081 owns `/api/fs`, `/api/projects`, and `/api/reports`.

## G-002 — Multiple independent project-creation entry points

**Status:** VETOED  
**Approach:** Dashboard / Projects / New Project / other surfaces each able to create a project.  
**Why buried:** duplicate identity risk and unnecessary UI complexity.  
**Replacement:** only **Intake → Enter Project** creates a project.

## G-003 — Browser-local project database as authority

**Status:** VETOED  
**Approach:** `localStorage` or browser state as the durable project source of truth.  
**Why buried:** browser/device refresh or switching devices can fork identity/history and cannot safely coordinate long-running execution.  
**Replacement:** server-side SQLite authoritative project records; browser state is presentation/cache only.

## G-004 — Fake lifecycle controls/status

**Status:** VETOED  
**Approach:** let Start/Pause/Resume/Restart/Promote update UI status before a real deterministic engine exists.  
**Why buried:** cosmetic success would hide that no filesystem operation occurred.  
**Replacement:** controls remain disabled/rejected with explicit `ENGINE_NOT_READY` until wired to real `sotctl` operations.

## G-005 — Calculating browser “Up” solely from pathname strings

**Date buried:** 2026-08-10  
**Status:** VETOED for v0.3.1+  
**Approach:** compute parent from `/mnt/...` string and assume it matches the logical browser root/volume hierarchy.  
**Why buried:** can walk to invalid logical locations such as `/mnt`, lose the browser’s actual navigation context, and create misleading empty states.  
**Replacement:** browser navigation history + fresh API read at each navigation step.

## G-006 — Hiding returned files in the folder browser

**Date buried:** 2026-08-10  
**Status:** VETOED for v0.3.1+  
**Approach:** render only `folders` from `/api/fs` and ignore `files`.  
**Why buried:** a files-only directory appears empty, creating false evidence about source contents.  
**Replacement:** display both files and folders; selection rules still determine what may be chosen.

## G-007 — Target selection as an arbitrary final existing folder with no project-named container

**Date buried:** 2026-08-10  
**Status:** VETOED for new Intake flow  
**Approach:** choose the final target directory directly with no project-specific child folder convention.  
**Why buried:** weaker traceability and greater risk of mixing one reconciliation turn with unrelated files.  
**Replacement:** select target parent, propose project name as editable child folder, explicitly create/use that folder.

## G-008 — Requiring a second WSL copy/clone merely to deploy `project.html`

**Date buried:** 2026-08-10  
**Status:** VETOED as the default operator workflow  
**Approach:** maintain a local repo clone plus a separate report-server copy/symlink only to move one HTML artifact into service.  
**Why buried:** unnecessary operator steps and duplicate-file confusion.  
**Replacement:** `ghdeploy` copies the requested GitHub HTML directly to the report project; `deploy` does the same from Windows Download. A repo clone may still be used intentionally for development, but is not required for routine deployment.

## G-009 — Treating an application release as permission to reconfigure infrastructure

**Date buried:** 2026-08-10  
**Status:** VETOED  
**Approach:** release script restarts/replaces the existing SOT helper, changes Tailscale child routes, or manages old ports/services while installing application files.  
**Why buried:** scope violation; infrastructure had already been established and the requested work was an application release, not an architecture migration.  
**Replacement:** release installer overwrites only canonical application files. Infrastructure remains untouched unless a separately proven defect leads to an explicit owner-approved operational/infrastructure change.

---

# 8. DONE / CURRENT IMPLEMENTATION LEDGER

This section prevents already-implemented work from being repeatedly rescheduled.

## Done in repository as of v0.3.0

- [x] Primary navigation reduced to Intake / Operations / Reporting.
- [x] One visible project-creation path.
- [x] `project.html` version/build visible.
- [x] Settings/Diagnostics contain API version/build evidence.
- [x] Immutable project-token model implemented in backend code.
- [x] Project rename independent of token implemented in backend code.
- [x] Idempotency-key handling implemented in backend code.
- [x] Semantic duplicate-project check implemented in backend code.
- [x] Server-side project SQLite schema implemented.
- [x] Source associations implemented in backend schema/API.
- [x] Run identity separated from project identity in schema.
- [x] Event/timeline schema implemented.
- [x] Aggregate/timeline/project-detail API surfaces implemented in repo.
- [x] Source(s) → Target representation implemented in UI.
- [x] Target(s) → SOT representation implemented in UI.
- [x] Debug/log surface moved behind Settings.
- [x] Unified 8081 helper architecture implemented in repo.
- [x] Project DB opens SQLite in WAL mode in current helper code.

## v0.3.1 candidate implemented in repository

- [x] Target parent + editable project-folder convention implemented in candidate.
- [x] File browser history/rescan/files-visible behavior implemented in candidate.
- [x] Android/local-device source intake implemented in candidate.
- [x] `/api/fs/mkdir` implemented in the existing helper code.
- [x] Unified `/api/projects` + `/api/reports` remain in the same helper code intended for existing 8081.
- [x] Release installer corrected to file-installation-only; no server/port/Tailscale reconfiguration.

## Not yet owner-verified live

- [ ] Unified `/api/projects` behavior through the already-running WSL helper.
- [ ] Unified `/api/reports` behavior through the already-running WSL helper.
- [ ] UI/API live version match in deployed environment.
- [ ] Android local-device gate on the actual intended device/browser.

These remain owner/device gate items; they are not grounds for introducing new infrastructure.

---

# 9. FEEDBACK INCORPORATION LEDGER

This section records external review items so they do not disappear between sessions.

## Incorporated into release plan

- Fingerprint tolerance + manual relink → **v0.4.0**.
- SQLite WAL + batched bulk writes → WAL already present for project DB; engine batching/WAL → **v0.4.0**.
- Windows/WSL original + normalized path storage → **v0.4.0**.
- User-facing stage error summary → **v0.4.0** and continued thereafter.
- Candidate/fast hashing before full SHA-256 → **v0.5.0**.
- Dry-run before execution → **v0.6.0**.
- Collision-safe target naming → **v0.6.0**.
- Verification size + hash → **v0.6.0**.
- Pause/Resume checkpoints → **v0.7.0**.
- Conservative concurrency / measure before scaling → **v0.4.0 through v1.0.0**.
- MVP scale target of roughly 5 TB and ≤8 source candidates → **v1.0.0 validation target, not an unproven guarantee**.

## Deliberately deferred

- Actual vision/AI near-duplicate analysis — after exact reconciliation MVP; keep an extension point, do not spend MVP reliability budget on the model.
- High parallel worker counts — only after lock/throughput measurements.

---

# 10. SESSION START / SESSION END CHECKLIST

## Start every SOT build session

1. Read this file, especially Current State, Locked Release, and Graveyard.
2. Verify the current `project.html` and `file_browser.py` versions/SHAs rather than assuming them.
3. State the exact release input and output.
4. Confirm the locked scope with the owner before implementation if it has changed.
5. Scan every planned mechanism against the graveyard.
6. If a defect cause is unknown, instrument first.
7. Treat existing ports/services/routes as constants unless a proven defect and explicit owner ruling says otherwise.

## End every SOT build session

1. Update this file with any owner ruling, completed item, changed release scope, or buried approach.
2. Record exact candidate version/build and repo commit/SHA.
3. Record automated gate result.
4. Record owner/device gate as PASS / FAIL / NOT YET RUN — never infer it.
5. On FAIL: restore baseline, add graveyard entry, then rebuild from baseline in the next attempt.
6. Record whether infrastructure changed. Normal answer for application releases is `NONE`.

---

# 11. PRODUCT MODEL REFERENCE

## Project

```text
project_token        immutable primary key
project_name         mutable display label
created_at
updated_at
status
current_stage
current_run_id
current_target_id / target_path
openclaw_session_key
notes
```

## Project source association

```text
project_token
source_id
source_type          wsl_path | browser_local | future typed source
source_fingerprint
original_path / original locator
normalized_path / canonical locator where applicable
operator_label
status
added_at
last_seen_at
```

## Project run

```text
run_id
project_token
started_at
ended_at
status
restart_of_run_id
checkpoint_state
```

## Project event

```text
event_id
project_token
run_id
timestamp
event_type
actor
message
details_json
```

## Engine datasets planned

```text
sources
files
content_index
duplicate_clusters
collisions
copy_jobs
job_checkpoints
provenance
errors
```

---

# 12. CORE API REFERENCE

One helper, one port.

```text
GET    /api/fs?path=/
POST   /api/fs/mkdir                         <- v0.3.1

POST   /api/projects
GET    /api/projects
GET    /api/projects/:project_token
PATCH  /api/projects/:project_token
DELETE /api/projects/:project_token
GET    /api/projects/:project_token/status
POST   /api/projects/:project_token/sources
DELETE /api/projects/:project_token/sources/:source_id
POST   /api/projects/:project_token/targets

GET    /api/reports/aggregate
GET    /api/reports/timeline
GET    /api/projects/:project_token/report
```

All of these are application routes of the **existing** SOT helper. The release plan does not allocate another server or port for them.

Engine actions remain unavailable until their planned releases implement real deterministic behavior:

```text
POST /api/projects/:project_token/start
POST /api/projects/:project_token/pause
POST /api/projects/:project_token/resume
POST /api/projects/:project_token/restart
POST /api/projects/:project_token/promote
```

---

# 13. DEFINITION OF DONE

A release is DONE only when all are true:

- scope in this file is satisfied;
- automated gates pass;
- required mutation checks demonstrate the gates actually catch their defects;
- repo artifacts are read back/verified;
- deployed version/build is verified;
- required real-device/real-storage owner gate passes;
- this file is updated to mark the release baseline and move completed items out of future backlog;
- application release did not silently alter infrastructure topology.

“Code written”, “committed”, “linted”, “API returned 200 once”, or “looks right” are not equivalent to DONE.
