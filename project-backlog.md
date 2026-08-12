# SOT Project Governance, Release Plan, Backlog & Graveyard

**Repository:** `acmeproducts/stuff`  
**Canonical application artifact:** `project.html` — one self-contained HTML file with inline CSS/JS  
**Existing infrastructure:** production `session-server.js` on port 18080 provides stable SOT APIs; backend support is infrastructure, not an additional application artifact  
**Canonical planning/governance document:** `project-backlog.md`  
**Last governance update:** 2026-08-12  

This file is intentionally the single current control document for the SOT effort. It contains the current baseline, owner rulings, release plan, live backlog, acceptance gates, open items, GitHub/deployment problems, and graveyard. Do not create a competing SOT plan/backlog/graveyard unless the owner explicitly changes this rule.

---

# 0. GOVERNANCE — READ FIRST

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

- `project-backlog.md` is the one current SOT governance document: release plan + backlog + test gates + open items + GitHub/deployment problems + graveyard.
- **The deployable SOT application is exactly one self-contained file: `project.html`. No external application JS/CSS/module files may be required by the browser.**
- **There is one production report/application server: `/usr/bin/node session-server.js`, working directory `/home/support/.openclaw/workspace/https/report`, port `18080`. SOT APIs extend this existing process under `/api/sot/*`.**
- **Port 8081 / FastAPI / Uvicorn / `file_browser.py` is rejected and removed. Never reintroduce it.**
- **OpenClaw Gateway remains independently on 18789 and is unchanged by SOT releases.**
- **Tailscale `/report` continues to proxy the existing 18080 server. No SOT release may create another server, daemon, port, or proxy.**
- **Browser SOT API URLs must use the public `/report` mount when running on the OpenClaw-served UI.**
- **GitHub Pages is a static preview and cannot see WSL/server-mounted storage. It must not display or attempt to access WSL/server-only volumes.**
- **Every SOT installation has one configurable authoritative SQLite SOT database path plus a separately configurable database-backup path.**
- **The SOT DB is the durable authority for project definition, project/source metadata, notes, status flags, fingerprints, fingerprint timestamps, manifests, runs, checkpoints, dedup decisions, copy plans, verification evidence, promotion history, and lineage.**
- **Configuration is the first application step and first left-navigation item. Project Setup cannot become authoritative until the SOT DB is configured and validated.**
- Project identity is the immutable `project_token`; project name is mutable.
- **Project records track the who / where / what / when of the project: identity, name, status, active/inactive flag, creation/update timestamps, notes, sources, source metadata, and later fingerprints/run evidence.**
- **A promoted SOT may itself be a source in a later project. Lineage across SOT generations must never be lost.**
- **A final SOT data destination is NOT required during Project Setup. Required capacity is unknown until inventory/dedup/analysis establishes the surviving-size requirement.**
- **No fake lifecycle state. If a deterministic engine function does not exist, the corresponding Start/Pause/Resume/Stop/Restart/Promote control stays disabled and says why.**

## 0.3 Locked portal navigation and lifecycle

The left navigation must be, in this order:

1. **Configuration**
2. **Project Setup**
3. **Project Operations**
4. **Database Administration**
5. **Dedup & Analysis**
6. **SOT Build & Promotion**
7. **Reports / Audit**

### Fixed hamburger rule

- A hamburger button is permanently anchored in the top-left corner.
- It never moves, disappears, changes location, or changes meaning between desktop, tablet, portrait phone, or landscape phone.
- It expands/collapses the left navigation.
- Expanded state shows readable icon + text labels.
- Collapsed state shows a narrow icon rail with accessible titles/tooltips.
- Collapse state persists across refresh.
- Contrast must remain readable; the washed-out dark rail shown in the failed mobile gate is rejected.

## 0.4 Locked three-panel source-selector model

### Panel 1 — Locations

Navigation only.

- Clicking a volume/location sends that volume to Panel 2.
- Panel 1 does not itself add/select a source.

### Panel 2 — Contents / Select

- Initially shows the chosen volume as a selectable row.
- Check the volume row + **Add to project** = stage the whole volume.
- Click the volume row = browse its folders.
- Folder rows have checkboxes for one-or-many source selection.
- Click folder name = drill deeper.
- Add to project stages checked Panel-2 rows.
- Files may be displayed as context but are not selectable as source folders.
- Preserve the working `.4.5` folder-enumeration behavior unless deliberately replaced by a proven equivalent.

### Panel 3 — Added to project

- Persistent staged-source review.
- Full underlying path retained exactly.
- Long paths truncate visually with ellipsis; full path is inspectable by title/tooltip/popover/detail.
- Clicking a source tile opens optional source-note editing, e.g. `July picnic`.
- × removes only that staged source.
- Save selections persists to the Project Setup draft; Create Project is the authoritative DB persistence event.

## 0.5 Responsive source-selector rule

Minimalism is mandatory.

- **Desktop / wide landscape:** three columns may be shown simultaneously.
- **Portrait phone / narrow tablet:** the same three logical panels stack vertically in one sheet/modal in the order Locations → Contents → Added to project. Panel 3 must be reachable without rotating the device.
- **Landscape phone / medium tablet:** use three proportional columns only if each remains usable; otherwise use stacked behavior.
- Add to project remains sticky/always reachable in Panel 2.
- Save selections remains sticky/always reachable in Panel 3.
- No horizontal body overflow.
- No panel/control overlap.
- Core text readable without zoom.
- No tutorial cards, decorative help panels, oversized toolbars, or redundant ornament inside this workflow.

## 0.6 Build/release rules

- Prove cause before fix.
- Verify; do not infer.
- Failed owner/device candidate is never an implementation baseline.
- Rebuild from the last accepted baseline and reapply only reviewed deltas.
- Owner/device gate is final.
- Never give a test URL while deployment is pending or while the exact served build has not been verified.
- Every handoff includes release/build, baseline, scope, automated gates, deployment result, verified test URL, owner/device gates, known limitations.
- Stop using temporary/self-triggering GitHub Actions workflows for routine SOT patch delivery. Failed workflows that create inbox alerts are release-process defects.
- GitHub Pages success proves the static artifact only; it never proves the private OpenClaw runtime is updated.

---

# 1. CURRENT VERIFIED / KNOWN STATE

## 1.1 Production topology

```text
OpenClaw Gateway
127.0.0.1:18789                         UNCHANGED

Production report/application server
127.0.0.1:18080  session-server.js
  ├── existing session APIs             UNCHANGED
  ├── existing static /report content   UNCHANGED
  └── /api/sot/*                        SOT API
      ├── fs
      ├── projects
      ├── reports
      └── config
```

Port 8081 and the standalone Python/FastAPI helper are graveyard architecture.

## 1.2 Last useful implementation baseline

The last source-browser behavior the owner reported as at least able to enumerate folders is:

- **Build:** `2026.08.11.4.5`
- **Commit baseline:** `970d56435a84192c74de4d3eb7978ee327d303c4`

Later `.4.x` candidates are not accepted implementation baselines.

## 1.3 Failed owner/device candidates

- `.4.6` — folder browser behavior broken; rolled back.
- `.4.7` — wrong Panel-1/Panel-2 selection semantics and portal regression.
- `.4.8` — rejected layout direction; too much decoration / interaction drift.
- `.4.9` — mobile screenshot proved unreadable navigation rail and panel/control overlap.
- `.4.10` — not accepted; deployment workflow itself produced a failed GitHub Actions notification.

## 1.4 GitHub/deployment problems

- temporary workflow files generated failed Actions runs and inbox alerts;
- multiple workflow-trigger commits created confusing sequencing;
- repository success has been presented before served-URL verification;
- GitHub Pages and private OpenClaw runtime have been conflated in handoffs.

Corrective rule:

- direct deterministic repo changes;
- established Pages deployment only for static preview;
- verify exact Pages build before static handoff;
- verify exact OpenClaw deployed build before runtime handoff;
- if runtime verification is unavailable, do not claim runtime is ready.

---

# 2. AUTHORITATIVE SOT DATA MODEL

## 2.1 Instance configuration

```text
instance_id
sot_database_path
sot_database_backup_path
schema_version
created_at
updated_at
```

Configuration belongs to the SOT installation, not an individual project.

## 2.2 Project

```text
project_token           immutable primary key
project_name            mutable display name
active                  boolean
created_at
updated_at
status
current_stage
current_run_id          nullable
notes                    optional
openclaw_session_key    optional/future
```

## 2.3 Project source

```text
source_id
project_token
source_type             wsl_path | browser_local | promoted_sot | future typed source
original_path_or_locator
normalized_path_or_locator
operator_label
operator_note           optional
registered_at
last_seen_at
fingerprint             v0.4.0
fingerprinted_at        v0.4.0
source_status
parent_sot_generation_id nullable
```

## 2.4 Project run

```text
run_id
project_token
started_at
ended_at
status
restart_of_run_id
checkpoint_state
```

## 2.5 Inventory telemetry

```text
inventory_run_id
project_token
source_id
started_at
last_progress_at
completed_at
elapsed_seconds
files_seen
bytes_seen
files_per_second
bytes_per_second
estimated_remaining_seconds
status
checkpoint_state
error_count
```

Historical telemetry remains queryable. Scan speed is not copy speed.

## 2.6 Lineage/provenance

The authoritative DB must be able to trace:

```text
source → fingerprint/manifest/content → dedup decision → copy plan → target copy → verification → promoted SOT
```

A promoted SOT becomes a valid future source without losing ancestry.

Example:

```text
Source A + Source B
        ↓
      SOT 1
        ↓ source in later project
      SOT 2
        ↓ source in later project
      SOT 3
```

---

# 3. LOCKED NEXT RELEASE — v0.3.1

## v0.3.1 — Configuration + Project Setup + Project Operations Foundation

**Status:** LOCKED / rebuild required  
**Implementation reference baseline where useful:** build `.4.5`, commit `970d56435a84192c74de4d3eb7978ee327d303c4`  
**Architecture baseline:** existing production `session-server.js` on 18080; no extra server  
**Primary goal:** stop treating this release as only a folder-picker exercise. Establish the authoritative SOT DB, make Project Setup persist real project/source definitions, and build the Operations surface now so the application has a usable lifecycle shell tied to the DB.

### 3.1 Configuration — MUST SHIP THIS RELEASE

Configuration is the first left-navigation item and first application step.

Required:

- configure authoritative `sot_database_path`;
- configure `sot_database_backup_path`;
- validate/open existing SQLite DB;
- initialize a new DB;
- report schema/version/integrity state;
- persist configuration outside browser-local project state;
- Project Setup clearly indicates when DB configuration is missing/invalid;
- project definition data is stored in this authoritative DB, not `localStorage`.

### 3.2 Project Setup — MUST SHIP THIS RELEASE

Required:

- project name;
- project optional note;
- default active flag;
- created_at / updated_at;
- immutable project token;
- responsive three-panel source selector from §0.4/0.5;
- Panel 1 → Panel 2 → Panel 3 behavior exactly as governed;
- WSL/server-backed sources only when real server API is reachable;
- browser-local This Device only where browser capability exists;
- optional per-source operator note;
- full canonical path/locator preserved;
- Create Project writes authoritative project + source rows to the configured SOT DB;
- refresh/reopen returns the same project/token/source definitions;
- final SOT target is deferred;
- no fingerprinting claim yet unless real v0.4.0 fingerprint behavior is pulled forward and separately gated.

### 3.3 Project Operations — MUST SHIP THIS RELEASE

The Operations section is built now; it is not deferred to a later UI release.

Required now:

- list/select projects from the authoritative SOT DB;
- display project name, token, active/inactive state, created/updated timestamps, notes, source count, and current stage;
- display source records and source notes;
- display whether a deterministic execution engine is installed/ready;
- include Start / Pause / Resume / Stop / Restart controls in their final locations;
- controls are enabled only for real backend operations that exist;
- for operations not implemented yet, controls remain disabled with explicit `ENGINE_NOT_READY`/equivalent explanation rather than fake state;
- run/status area is connected to real project/run rows when available;
- no browser-only fake run state.

### 3.4 Database Administration — UI SHELL + BASIC METADATA ADMIN MUST SHIP THIS RELEASE

Because Configuration creates the authoritative DB and Operations consumes it, this release also includes the minimum Database Administration surface needed to manage the records being created.

Required now:

- project table/list from authoritative DB;
- edit project display metadata/notes;
- edit source labels/notes/metadata that are explicitly mutable;
- change active/inactive project flag;
- bulk active/inactive update;
- immutable fields (`project_token`, durable source identity fields when created) are read-only;
- DB integrity-check action/status;
- DB backup/restore controls may be present only when the backend operation is real; otherwise visibly not-ready rather than simulated.

### 3.5 Navigation/UX — MUST SHIP THIS RELEASE

- permanent top-left hamburger;
- expandable/collapsible readable left nav;
- navigation items in the locked order from §0.3;
- source selector responsive in portrait and landscape;
- no unreadable dark rail;
- no source-selector overlap;
- no landscape-only requirement.

### 3.6 v0.3.1 automated gates

Before owner handoff:

- JavaScript parse/syntax.
- No active FastAPI/Uvicorn/8081/8082 dependency.
- API health against existing production SOT API contract.
- Config read/write contract for DB path and backup path.
- DB initialize/open/integrity test.
- Create/list/get/update project.
- Immutable project token across rename/update.
- active/inactive field round trip.
- bulk active/inactive update preserves project identity.
- source metadata + source note round trip.
- Project Operations reads projects from DB rather than browser-local fake state.
- Operations buttons cannot claim success without a real backend operation.
- GitHub Pages static-preview gate: no server-only volumes.
- Portrait/landscape responsive structural gate: no horizontal body overflow.
- Fixed hamburger gate at representative breakpoints.
- Source-selector behavioral harness:
  - Panel 1 click → volume row in Panel 2;
  - check volume + Add → whole-volume source in Panel 3;
  - click volume → folders;
  - check multiple folders + Add → multiple full-path Panel-3 rows;
  - source note persists;
  - × removes only selected staged source.

### 3.7 Required mutation checks

- remove hamburger at mobile breakpoint → gate fails;
- force source-selector horizontal overflow → gate fails;
- make Panel 1 add a source directly → source-flow gate fails;
- truncate/destroy underlying full path → path-integrity gate fails;
- expose WSL drives on GitHub Pages → static-preview gate fails;
- rename project and accidentally change token → identity gate fails;
- implement Start as UI-only status change → no-fake-operation gate fails;
- bulk active/inactive mutation changes immutable token → DB-admin gate fails.

### 3.8 v0.3.1 owner/device gates

#### Portrait phone

1. Exact intended build visible.
2. Hamburger remains fixed top-left.
3. Navigation expands/collapses readably and persists.
4. Configuration is first section and DB path/backup path are understandable.
5. Project Setup works without rotation.
6. Locations → Contents → Added to project all reachable.
7. Whole-volume and multiple-folder selection work.
8. Long source path truncates visually but full path is inspectable.
9. Source note can be added/edited.
10. Created project appears in Project Operations after refresh.
11. Operations shows real project metadata and source records.
12. Unsupported run controls are visibly disabled, not fake.

#### Landscape phone / tablet

- same functional gates;
- no clipping or hidden third source panel;
- three-column layout only if usable.

#### GitHub Pages

- exact intended build verified before URL handoff;
- no WSL/server-only drives;
- This Device only if browser capability exists;
- no production filesystem API call.

#### OpenClaw runtime

- exact intended build verified before URL handoff;
- Configuration reaches real API/DB;
- DB can be initialized/opened;
- server-visible volumes enumerate;
- Create Project persists and survives refresh;
- Project Operations reads that same project from the DB;
- basic Database Administration edits/active flag changes persist.

### 3.9 Acceptance condition

Only after all applicable automated and owner/device gates pass does v0.3.1 become the accepted baseline.

---

# 4. RELEASE PLAN AFTER v0.3.1

## v0.4.0 — Source Fingerprint + Inventory + Manifest

**Goal:** begin deterministic project execution by fingerprinting and inventorying registered sources.

### Scope

- fingerprint evidence model;
- fingerprint timestamp/history;
- deterministic source register/fingerprint/scan engine contract (`sotctl` or equivalent);
- recursive inventory;
- manifest persistence in authoritative DB;
- original + normalized paths;
- inventory timestamps and telemetry;
- checkpoint/restart safety;
- source relink flow for changed path/mount;
- WAL/batched writes;
- Operations Start/Pause/Resume/Stop/Restart wired to real inventory engine where supported;
- no copy/move/delete.

### Gates

- source disappears/reappears;
- same source at new path/mount;
- resume after interruption;
- representative large-file-count harness;
- historical telemetry retained;
- fingerprint/manifest traceability to project/source IDs;
- real Operations controls preserve run/project linkage.

---

## v0.5.0 — Dedup + Analysis + Recommendation

**Goal:** determine what survives and how much target/backup capacity is required.

### Scope

- candidate selection by size/metadata;
- fast candidate hash where safe;
- SHA-256 exact duplicate confirmation;
- content index;
- duplicate clusters;
- collisions/path conflicts;
- canonical-source preference/review;
- unique/duplicate byte accounting;
- surviving-size estimate;
- recommendation for primary SOT capacity;
- recommendation for backup capacity;
- operator review queue for ambiguous decisions.

### Gates

- known duplicate corpus;
- same-size/different-content mutation;
- collision cases;
- interrupted hashing + resume;
- accounting reconciles to manifest/content index.

---

## v0.6.0 — SOT Build Plan + Generated Copy Scripts

**Goal:** turn approved dedup decisions into an explicit, reviewable copy plan and scripts.

### Scope

- target selection only after surviving capacity is known;
- primary SOT target + backup target planning;
- generated copy plan;
- generated operator-readable copy scripts/commands;
- collision-safe destination mapping;
- preflight;
- dry run;
- plan persistence in authoritative DB;
- no source move/delete.

### Gates

- target free-space preflight;
- path/collision mutation tests;
- generated plan reproduces approved analysis exactly;
- dry run changes no files;
- plan remains tied to immutable project/run/source identities.

---

## v0.7.0 — Verified Copy Execution

**Goal:** execute the approved plan safely and resumably.

### Scope

- explicit execute action;
- copy-only behavior;
- durable copy checkpoints;
- interruption/restart recovery;
- size/content verification;
- verification failures never silently accepted;
- copy throughput telemetry separate from scan telemetry.

### Gates

- forced interruption mid-copy;
- destination corruption mutation;
- source disconnect/reconnect;
- repeated resume does not duplicate completed verified work;
- no source move/delete operations exist.

---

## v0.8.0 — SOT Promotion + Lineage

**Goal:** promote verified output into the next SOT generation while preserving complete ancestry.

### Scope

- verified target → promoted SOT action;
- unique SOT generation/source identity;
- provenance links source content → analysis → copy plan → target → verification → promoted SOT;
- promoted SOT available as a future source;
- lineage chain report/visualization;
- backup verification state;
- authoritative SOT DB updated at promotion so lineage is never lost.

### Gates

- Source A/B → SOT1 → SOT2 → SOT3 lineage fixture;
- every promoted generation traceable backward;
- rename/path change does not break lineage;
- promotion blocked until verification passes.

---

## v0.9.0 — Reporting + OpenClaw Orchestration

**Goal:** complete audit/reporting and let OpenClaw orchestrate without owning deterministic filesystem logic.

### Scope

- aggregate/timeline/project audit reports from real DB evidence;
- Markdown/CSV export;
- OpenClaw session association by immutable project token;
- OpenClaw-triggered actions call the same backend contracts as UI;
- deterministic scan/hash/copy/verify stays in the harness.

---

## v1.0.0 — MVP hardening / acceptance

**Goal:** declare supported MVP only after measured reliability evidence.

Validation envelope, not promise:

- approximately 5 TB corpus;
- up to roughly 8 registered source candidates;
- conservative worker concurrency;
- large-corpus benchmark;
- SQLite/WAL throughput measurements;
- crash/restart fault injection;
- source removal/replacement;
- Windows/WSL path normalization;
- verification corruption mutation;
- owner end-to-end real-storage reconciliation.

---

# 5. OPEN ITEMS

- Exact schema migration from current `sot-api.js` schema to the authoritative model above.
- Exact fingerprint evidence algorithm and threshold.
- Exact browser-local Android data-plane strategy after source registration.
- Exact source-note audit/versioning model.
- Exact deterministic copy-script technology for v0.6.0 after target-platform evidence.
- Backup retention policy/UI.
- Canonical-source preference rules for metadata conflicts.
- Run-cancel cleanup semantics.
- Near-duplicate image/video analysis remains optional and cannot delay exact dedup.

---

# 6. LIVE BACKLOG

## Database / identity

- schema migration/version table;
- administrative audit log;
- source fingerprint history;
- source relink review UI;
- project/source tags and sidecar metadata;
- encrypted/sensitive classification;
- configurable DB backup retention;
- multi-instance SOT support — future only.

## Operations

- historical scan-rate comparison;
- separate copy-rate history;
- network-share reconnect handling;
- stage/source/file error drilldown;
- run cancellation/cleanup policy.

## Dedup / analysis

- large-file quick-hash thresholds;
- parallel hashing only after correctness evidence;
- ambiguous collision review queue;
- raw vs represented vs duplicate byte visualization.

## Android / browser-local

- permission reauthorization/resume;
- sleep/background interruption behavior;
- large DCIM transfer backpressure;
- Secure Folder/inaccessible storage remains evidence-driven.

## Reporting

- date/status/source/project filters;
- downloadable audit bundles;
- SOT-generation lineage visualization;
- cold/warm/hot tier reporting after promotion works.

---

# 7. SAFETY AND DATA INVARIANTS

1. Sources are read-only inputs to reconciliation.
2. Copy-only: never move or delete source files automatically.
3. Human validation is required before physical source retirement.
4. A project is identified by immutable `project_token`, never mutable name.
5. A project may have multiple runs; restart is not a new project.
6. Retry/double-click/browser refresh cannot duplicate a project.
7. Source identity must survive path/drive-letter changes through fingerprint/relink evidence once fingerprinting exists.
8. Target construction must be collision-safe.
9. Verification failure blocks SOT promotion.
10. Browser `localStorage` is never the authoritative project database.
11. No extra SOT service/port without proven technical boundary and explicit owner ruling.
12. A feature that cannot be invoked through the operator control is not implemented.
13. Failed owner gate is rebuilt from clean accepted input, never patched forward.
14. Authoritative SOT DB path and backup path are configurable instance settings.
15. DB restore validates backup and preserves a safety copy of current DB.
16. Scan and copy throughput are measured separately.
17. Every promoted SOT preserves lineage back to project/run/sources/content/plan/verification.

---

# 8. GRAVEYARD — VETOED APPROACHES

- **G-001:** separate project API service / port 8082.
- **G-002:** browser-local project DB as authority.
- **G-003:** fake lifecycle controls/status.
- **G-004:** calculated browser Up based only on pathname strings.
- **G-005:** hiding returned files in folder browser.
- **G-006:** final SOT target required during Project Setup.
- **G-007:** immediately committing each source click instead of staged review.
- **G-008:** patching failed candidates forward.
- **G-009:** standalone FastAPI/Uvicorn SOT server on 8081.
- **G-010:** public OpenClaw UI calling absolute `/api/sot/*` and bypassing `/report` mount.
- **G-011:** requiring UI/API build IDs to be identical rather than API contract compatible.
- **G-012:** Panel 1 selecting a source directly.
- **G-013:** mobile source picker requiring landscape to reach Panel 3.
- **G-014:** decorative tutorial/help cards inside source selection.
- **G-015:** unreadable permanently collapsed dark navigation rail.
- **G-016:** hamburger/menu control moving/disappearing/changing location at breakpoints.
- **G-017:** GitHub Pages displaying/attempting server-only WSL volumes.
- **G-018:** presenting test URL before exact deployed-build verification.
- **G-019:** temporary/self-triggering GitHub Actions workflows as routine patch/deployment mechanism.
- **G-020:** treating GitHub commit/Pages success as proof private OpenClaw runtime updated.
- **G-021:** automatic source move/delete/retirement.
- **G-022:** losing lineage when a promoted SOT becomes a later source.

---

# 9. RELEASE HANDOFF TEMPLATE — REQUIRED

**Release:** `vX.Y.Z / build ...`  
**Baseline:** exact accepted commit/build  
**Scope:** what changed and what did not  
**Automated gates:** PASS/FAIL with meaningful gates named  
**Deployment:** exact commit + deployment result  
**Verified test URL:** only after that URL is proven to serve the intended build  
**Owner/device gates:** ordered test sequence  
**Known limitations:** explicit  
**Owner result:** PASS / FAIL; failed candidate is never patched forward

---

# 10. DEFINITION OF DONE

A release is DONE only when all are true:

- locked scope in this file is satisfied;
- automated gates pass;
- mutation checks prove gates catch intended defects;
- repo artifact is read back/verified;
- served/deployed build is verified;
- required owner/device gate passes;
- this file marks the new accepted baseline;
- release did not silently alter infrastructure topology;
- owner result is explicitly PASS.

“Code written”, “committed”, “workflow green”, “Pages deployed”, or “API returned 200 once” are not equivalent to DONE.
