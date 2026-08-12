# SOT Project Governance, Release Plan, Backlog & Graveyard

**Repository:** `acmeproducts/stuff`  
**Canonical application artifact:** `project.html` — one self-contained HTML file with inline CSS/JS  
**Existing infrastructure:** production `session-server.js` on port 18080 provides stable SOT APIs; backend support is infrastructure, not an additional application artifact  
**Canonical planning/governance document:** `project-backlog.md`  
**Last governance update:** 2026-08-12  

This is the single current control document for the SOT effort. It contains the accepted product model, release plan, gates, open items, GitHub/deployment problems, backlog, and graveyard.

---

# 0. GOVERNANCE — READ FIRST

## 0.1 Authority order

1. Current owner ruling.
2. Graveyard vetoes in this file.
3. Locked release scope in this file.
4. Current product rules/backlog in this file.
5. Older PRDs/release history.

Owner rulings that change scope, architecture, or standing behavior are written here before the next candidate is handed off.

## 0.2 Architecture invariants

- `project.html` remains the one browser application artifact.
- Existing production application/report server is `session-server.js` on port 18080.
- SOT APIs remain additive under `/api/sot/*`; the browser reaches them through `/report/api/sot/*` on the OpenClaw-served UI.
- No FastAPI/Uvicorn/file_browser.py/8081/8082 parallel SOT service.
- No SOT release changes Tailscale routing, server topology, or OpenClaw Gateway 18789.
- GitHub Pages is a static preview only and never represents server-backed WSL storage as reachable.
- One configurable authoritative SQLite SOT database per installation plus a separately configurable DB backup location.
- The SOT DB is the durable authority for project identity, project/source metadata, notes, status flags, timestamps, fingerprints, manifests, runs, dedup/analysis, copy plans, verification, promotion history, and lineage.
- Browser `localStorage` may hold UI preferences only; it is never the authoritative project store.

## 0.3 Locked navigation

Left navigation order:

1. **Configuration**
2. **Project Setup**
3. **Project Operations**
4. **Database Administration**
5. **SOT Build & Promotion**
6. **Reporting**

**Dedup & Analysis is removed as a separate navigation section.** Dedup, analysis, recommendation, duplicate review, and project progress are part of **Project Operations**.

### Global hamburger rule

- A hamburger button remains permanently anchored top-left.
- It never moves or changes function across breakpoints.
- It expands/collapses the navigation.
- Expanded and collapsed states remain readable.
- State persists.

---

# 1. ACCEPTED PRODUCT MODEL

## 1.1 Configuration — first step

Configuration is the first application step because project data must have an authoritative home before projects are created.

Configuration owns:

- authoritative SOT DB location;
- database backup location;
- validate/open existing DB;
- initialize new DB;
- schema/integrity status;
- inline folder search/browse for choosing DB and backup locations;
- no modal for folder browsing;
- clean, compact inline browser using the same filesystem-browser interaction model as Project Setup.

For the DB path, the operator selects a directory and the application may compose the configured SQLite filename in that directory. Backup selection chooses a directory.

## 1.2 Project Setup — one flattened surface

**Project Setup / Project Definition / Add Locations are one surface. There is no Add Locations modal.**

Top row:

- Project Name
- Project Note / Description

No status selector. New projects are assumed **Active**.

Directly below is the inline source builder. There is no duplicated source summary below it and no explanatory destination paragraph.

### Inline source builder

The source builder is a fixed-height, viewport-responsive scrollable container with minimal chrome.

Panel names:

1. **Source Drives**
2. **Source(s)**
3. **Project Name** — dynamically displays the current project name; falls back to Project until a name is entered.

### Panel 1 — Source Drives

- Navigation only.
- Clicking a drive/location places that volume as a selectable row in Panel 2.
- A small hamburger in the Panel-1 header opens/closes the Source Drives panel.
- Panel-1 collapsed state persists.

### Panel 2 — Source(s)

- Column headings are sticky and always above rows.
- The chosen volume appears first as a selectable row.
- Check volume + Add = stage whole volume.
- Click volume = browse folders.
- Folder rows have checkboxes for one-or-many selection.
- Folder name is legible and never obscured by column headings.
- Click folder name = drill deeper.
- Add stages all checked rows into Panel 3.
- Files may be shown as non-selectable context.
- Add control remains reachable while scrolling.

### Panel 3 — Project Name

- Persistent staged-source review.
- Full canonical path/locator retained exactly.
- Long paths truncate visually but full value is inspectable.
- Source tile click edits optional source note/context, e.g. `July picnic`.
- × removes only that staged source.
- No duplicate source list elsewhere on Project Setup.

### Resizing / persistence

- Inline source-builder height is resizable by the operator and persists.
- Desktop/wide layouts allow dragging the pane separators left/right.
- Pane proportions persist.
- Mobile layout does not require landscape orientation.
- When width is insufficient, panels stack vertically while preserving the same logical order and sticky panel headers/actions.

### Commit

The only final action below the builder is **Create Project**.

Create Project writes the project definition and sources to the authoritative SOT DB. Final SOT destination remains deferred until analysis determines surviving capacity.

## 1.3 Project Operations — mini portal

Project Operations is the primary operational workspace and includes dedup/analysis/reporting status for the selected project.

### Left project pane

- Lists all projects with project name and created date.
- Hover/focus project shows project notes plus source paths/source notes.
- Each active project has an `×` soft-delete action.
- First item in the pane is a chevron disclosure for **Deleted / Restore**.
- Deleted projects remain in the DB and may be restored.
- Soft deletion must not destroy sources, lineage, runs, or audit history.

### Selected-project status area

Display:

- Status: Pending / WIP / Closed
- Created Date
- Activity indicator
- `% complete` from real project/run evidence
- Start time
- ETC / estimated completion only when evidence exists
- Run
- Stop

Behavior:

- Run is unavailable while WIP.
- Stop is available only when a real run is active.
- If stopped, Run means continue/resume.
- Restart is **not currently required**; defer until evidence proves a separate restart control is necessary.
- No fake progress or fake execution. Before the deterministic engine exists, run controls are disabled with an explicit not-ready reason.

### Operations reporting chip

A **Reporting** chip opens a compact modal/popover for the selected project showing only evidence that exists:

- project/source basics;
- source list and notes;
- file count and byte size when inventory exists;
- duplicate counts/bytes when dedup exists;
- same/exact duplicate list vs different/conflict list when analysis exists.

Unknown values display Not inventoried / Not analyzed rather than fabricated values.

### Dedup & analysis integration

Dedup/analysis is not a separate portal section. As later engine stages ship, Project Operations owns:

- fingerprint/inventory progress;
- exact duplicate analysis;
- conflict/different list;
- surviving-size analysis;
- target-capacity recommendation;
- approved copy-set review.

## 1.4 Database Administration

Database Administration is an actual data-management surface, not only project cards.

Required direction:

- table selector for allowed SOT DB tables;
- paged row viewer;
- view columns;
- create rows where safe;
- edit mutable cells/columns;
- delete/soft-delete where safe;
- preserve immutable identity columns;
- project/source metadata CRUD;
- active/inactive changes;
- audit administrative mutations;
- no arbitrary SQL entry field in the MVP UI.

## 1.5 SOT Build & Promotion

After Project Operations has inventory/dedup evidence and an approved copy set:

- choose Target SOT and backup target;
- generate deterministic copy scripts/commands;
- preflight/dry run;
- execute copy-only plan;
- verify;
- promote verified target to a new SOT generation;
- update authoritative DB so lineage is never lost.

A promoted SOT can be a source for a later SOT project.

Example lineage:

```text
Source A + Source B
        ↓
      SOT 1
        ↓ later source
      SOT 2
        ↓ later source
      SOT 3
```

## 1.6 Reporting

Reporting begins now from the schema/evidence already available and expands as engine stages ship.

Current/basic reporting may include:

- project counts by Pending/WIP/Closed;
- active/inactive/deleted project counts;
- source counts;
- projects created over time;
- project/source metadata;
- event/audit timeline;
- inventory totals only where inventory exists;
- duplicate totals only where dedup exists;
- promoted SOT generations/lineage only where promotion exists.

No invented filesystem metrics.

---

# 2. AUTHORITATIVE DATA MODEL

## 2.1 Instance configuration

```text
instance_id
sot_database_path
sot_database_backup_path
schema_version
created_at
updated_at
```

## 2.2 Project

```text
project_token           immutable primary key
project_name            mutable
active                  boolean
created_at
updated_at
status                  Pending | WIP | Closed
current_stage
current_run_id          nullable
notes                    optional
deleted_at              nullable soft-delete timestamp
```

## 2.3 Source

```text
source_id
project_token
source_type
original_path_or_locator
normalized_path_or_locator
operator_label
operator_note
registered_at
last_seen_at
fingerprint             later engine evidence
fingerprinted_at        later engine evidence
source_status
parent_sot_generation_id nullable
```

## 2.4 Run / progress

```text
run_id
project_token
started_at
ended_at
status
checkpoint_state
progress_percent
estimated_completion_at nullable
```

## 2.5 Inventory / dedup / lineage

The DB evolves without creating a second authority. Planned datasets include:

```text
inventory_runs
files
content_index
duplicate_clusters
conflicts
copy_plans
copy_jobs
verification
sot_generations
lineage
admin_events
```

---

# 3. CURRENT RELEASE — v0.3.1

## v0.3.1 build 2026.08.12.5.0 — OWNER GATE FAILED / SUPERSEDED

The owner accepted the broader DB-first plan but rejected the first UI realization. Proven issues from owner screenshots/review:

- source/folder row label was obscured by column headings rendered below/over the row;
- source selector was still a modal;
- source selector was not sufficiently responsive/minimal;
- no persisted pane resize/separator behavior;
- source panel naming did not match the operational model;
- Project Setup duplicated source information and unnecessary destination explanation;
- Configuration lacked the inline folder-browser interaction;
- Operations needed to be restructured as a project mini-portal;
- Dedup/Analysis should be merged into Operations;
- Database Administration needs row/column CRUD semantics;
- Reporting can begin now from existing schema/evidence.

`.5.0` is not an accepted implementation baseline.

## v0.3.1 build 2026.08.12.5.1 — LOCKED NEXT CANDIDATE

**Baseline:** use proven `.4.5` filesystem enumeration concepts where still needed, but rebuild the current UI from the accepted model above; do not patch `.5.0` layout forward.

### Scope — MUST SHIP

- navigation reduced to Configuration / Project Setup / Project Operations / Database Administration / SOT Build & Promotion / Reporting;
- fixed top-left global hamburger;
- inline Configuration folder browser for DB/backup paths;
- flattened Project Setup with project name + note on one row;
- inline source builder, no Add Locations modal;
- Source Drives / Source(s) / dynamic Project Name panel labels;
- Panel-1 local hamburger/collapse persisted;
- sticky headings above rows;
- resizable source-builder height persisted;
- draggable desktop pane separators persisted;
- mobile portrait/landscape responsive stacking;
- one final Create Project action;
- Project Operations mini-portal with project list, soft-delete/restore, status strip, Run/Stop final locations, Reporting chip;
- Dedup/Analysis removed as standalone navigation;
- Database Administration table/row CRUD foundation;
- basic Reporting from existing authoritative schema/evidence;
- backend schema support for deleted_at, project status, progress/run fields required by the UI;
- no fake execution/progress.

### Automated gates

- JS syntax/parse.
- Node API syntax/parse.
- no active 8081/8082/FastAPI dependency.
- fixed global hamburger present at all breakpoints.
- source builder is inline and no source-selection modal exists.
- sticky column headers precede folder rows structurally.
- Panel 1/2/3 headings match locked names.
- pane height preference persists.
- pane widths persist.
- portrait layout has no horizontal body overflow.
- GitHub Pages never exposes WSL drives.
- Project create/load/update identity round trip.
- soft-delete/restore round trip without destructive deletion.
- DB-admin allowlist prevents arbitrary table access.
- basic reports return only stored evidence.
- operations controls cannot mark a run active without a real backend engine action.

### Owner/device gates

**GitHub Pages first:**

1. exact `.5.1` build visibly served;
2. global hamburger works/readable;
3. Configuration browser appears inline, never modal;
4. Project Setup is one flattened page;
5. source builder is inline;
6. source row headings are above rows and folder names remain legible;
7. Panel 1 is Source Drives, Panel 2 Source(s), Panel 3 current project name;
8. source-builder resize persists;
9. pane separator positions persist on wide viewport;
10. Panel-1 local collapse persists;
11. portrait works without rotating device;
12. no WSL drives on Pages;
13. Operations mini-portal layout is present;
14. Database Administration grid/table UI is present;
15. Reporting page shows schema-backed basics only.

**WSL/OpenClaw second, only after GitHub Pages passes:**

- exact `.5.1` build verified before handoff;
- Configuration folder browser enumerates real server-visible folders;
- DB path/backup path save and integrity check work;
- source browser enumerates real WSL/Windows-mounted locations;
- Create Project persists project/source records;
- Operations reads same DB records;
- soft-delete/restore persists;
- DB-admin CRUD persists allowed metadata changes;
- Reporting reads same DB.

---

# 4. RELEASE PLAN AFTER v0.3.1

## v0.4.0 — Fingerprint + Inventory Engine

- durable source fingerprint evidence/history;
- recursive inventory/manifests;
- file counts/bytes;
- run/checkpoint progress;
- Start/Stop/continue behavior becomes real in Operations;
- telemetry/ETC only from observed evidence;
- no copying.

## v0.5.0 — Dedup / Analysis inside Project Operations

- exact duplicate confirmation;
- duplicate clusters;
- different/conflict list;
- surviving-size estimate;
- target + backup capacity recommendation;
- approved canonical copy set.

## v0.6.0 — SOT Build Plan + Generated Scripts

- target selection after capacity is known;
- copy-plan persistence;
- generated scripts/commands;
- collision-safe mapping;
- preflight/dry run;
- no source move/delete.

## v0.7.0 — Verified Copy Execution

- explicit copy execution;
- checkpoints;
- interruption/recovery;
- size/content verification;
- copy throughput telemetry.

## v0.8.0 — Promotion + Lineage

- verified target → promoted SOT generation;
- promoted SOT becomes future source candidate;
- complete ancestry retained in DB;
- lineage reporting.

## v0.9.0 — OpenClaw Orchestration / Reporting Expansion

- OpenClaw orchestration via same deterministic backend contracts;
- expanded evidence-backed reporting and exports.

## v1.0.0 — MVP Hardening

- multi-TB real corpus tests;
- crash/restart/source-removal fault injection;
- SQLite throughput/locking validation;
- owner end-to-end reconciliation.

---

# 5. OPEN ITEMS

- Exact fingerprint evidence algorithm/threshold.
- Exact copy-script technology after target-platform evidence.
- Whether operator notes retain version history or current value + audit event.
- Restart remains deferred unless Run/Stop/continue semantics prove insufficient.
- Near-duplicate media analysis is optional after exact dedup.

---

# 6. LIVE BACKLOG

- schema migration/version table;
- richer admin audit history;
- source relink review;
- tags/sidecar metadata;
- encrypted/sensitive classification;
- DB backup retention;
- network-share reconnect handling;
- error drilldown;
- scan/copy performance history;
- Android permission reauthorization/resume;
- lineage visualization;
- cold/warm/hot tier reporting;
- multi-instance SOT support — future only.

---

# 7. SAFETY / DATA INVARIANTS

1. Sources are read-only inputs.
2. Copy-only; no automatic source move/delete.
3. Human validation before physical source retirement.
4. `project_token` immutable; project name mutable.
5. Project restart/continue never creates a duplicate project.
6. Soft-delete does not destroy project/source lineage/history.
7. Verification failure blocks SOT promotion.
8. Scan throughput and copy throughput are distinct measurements.
9. Promoted SOT lineage must survive future use as a source.
10. UI never invents progress, ETC, inventory, dedup, or copy evidence.

---

# 8. GRAVEYARD — DO NOT REINTRODUCE

- G-001 separate FastAPI/Uvicorn/file_browser.py SOT server.
- G-002 SOT ports 8081/8082.
- G-003 release-driven Tailscale/server topology changes.
- G-004 browser-local authoritative project DB.
- G-005 fake lifecycle controls/status.
- G-006 final SOT target required during Project Setup.
- G-007 source-selection modal; Project Setup source builder is inline.
- G-008 separate Dedup/Analysis navigation section.
- G-009 Panel 1 directly selecting a source; selection occurs in Panel 2.
- G-010 landscape-required source selection.
- G-011 decorative/tutorial-heavy source browser.
- G-012 moving/disappearing global hamburger.
- G-013 GitHub Pages showing WSL/server-only drives.
- G-014 test URL handoff before exact served-build verification.
- G-015 ephemeral/self-triggering workflow files as routine patch mechanism.
- G-016 destructive project delete as the ordinary Operations delete action; use soft-delete/restore.
- G-017 patch-forward from a failed owner candidate.
- G-018 losing lineage when a promoted SOT becomes a source later.

---

# 9. RELEASE HANDOFF TEMPLATE — REQUIRED

**Release:**  
**Baseline:**  
**Scope:**  
**Automated gates:** PASS/FAIL  
**Deployment:** exact commit + result  
**Verified test URL:** only after exact served build is verified  
**Owner/device gates:** ordered test sequence  
**Known limitations:** explicit  
**Owner result:** PASS / FAIL

---

# 10. DEFINITION OF DONE

A release is DONE only when automated gates pass, the exact served artifact is verified, required owner/device gates pass, and the accepted baseline is recorded here. A commit, green Pages job, or one successful API request is not equivalent to DONE.
