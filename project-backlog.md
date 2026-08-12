# SOT Project — Governance, Product Design, Release Plan, Backlog & Graveyard

**Repository:** `acmeproducts/stuff`  
**Canonical application artifact (when implementation resumes):** `project.html`  
**Canonical planning/governance document:** `project-backlog.md`  
**Status:** **PLANNING / DESIGN ONLY — NO CODE**  
**Last governance update:** 2026-08-12

This document is the single current authority for the SOT project. The prior UI implementation attempts are rejected as product candidates. We are intentionally returning to planning/design with a clean UX slate while preserving the plumbing, data-safety rules, execution modes, and SOT lineage requirements that have already been established.

No implementation work resumes until the owner explicitly accepts this design plan.

---

# 0. GOVERNANCE

## 0.1 Authority order

1. Current owner ruling.
2. This document's locked product/design rules.
3. Graveyard vetoes in this document.
4. Current release plan and acceptance gates.
5. Older PRDs, prototypes, screenshots, and implementation history.

## 0.2 Current owner ruling — design reset

The current implementation is rejected.

Reasons proven in the latest owner review:

- Configuration backup selection invoked a browser **upload/read-directory** prompt. That is the wrong interaction for choosing a backup destination.
- The current release is a UI mock-up, not a useful SOT workflow.
- Fingerprinting is not implemented.
- Folder/source selection is too difficult and too indirect.
- Too much effort has gone into incremental UI patching instead of completing the product workflow.

**Effective immediately:**

- Planning and design only.
- No `project.html` changes.
- No backend/API changes.
- No release candidate builds.
- No GitHub Pages test handoffs.
- Update this document until the workflow, UX, data model, release scope, and gates are accepted.

## 0.3 Established plumbing — keep, do not redesign casually

There are two valid execution modes.

### Browser/mobile mode

- Runs from GitHub Pages or another static HTTPS host.
- A browser/mobile project may be created, operated, completed, administered, reported, and eventually reconciled without WSL.
- Browser/mobile project authority is persistent browser storage, currently planned as IndexedDB.
- `localStorage` is preferences only, never authoritative project data.
- Local source access comes from browser-granted file/folder access.
- WSL migration is optional.

### WSL mode

- Existing production application/report server is `session-server.js` on port 18080.
- Browser reaches SOT APIs through the existing `/report/api/sot/*` mount.
- WSL mode has broader filesystem access and is preferred for large attached drives / higher-throughput processing.
- No extra SOT web service, no FastAPI/Uvicorn helper, no 8081/8082, no Tailscale topology changes.

### Same product, two execution adapters

Browser/mobile and WSL use the same logical project/source/run/lineage model. The UI should not feel like two different applications. Only filesystem authority, storage adapter, and processing throughput differ.

---

# 1. PRODUCT PURPOSE

The product is a **Source of Truth (SOT) reconciliation harness**.

Its job is to take one or more physical/logical sources, identify and inventory them, fingerprint and reconcile content, determine the surviving authoritative set, plan a target SOT, perform verified copy-only promotion, and permanently preserve lineage so today's SOT can become tomorrow's source without losing ancestry.

The lifecycle is:

```text
Configure authority
    ↓
Define project + sources
    ↓
Fingerprint / inventory
    ↓
Dedup / analyze / recommend
    ↓
Approve surviving set
    ↓
Choose target SOT + backup target
    ↓
Generate copy plan / scripts
    ↓
Copy + verify
    ↓
Promote target to SOT generation
    ↓
Maintain / reuse promoted SOT as a future source
```

### Core lineage rule

```text
Source A + Source B
        ↓
      SOT 1
        ↓ source in later project
      SOT 2
        ↓ source in later project
      SOT 3
```

Every generation remains traceable backward through project, source, fingerprint, manifest, dedup decision, copy plan, verification, and promotion records.

---

# 2. UX PRINCIPLES — LOCKED DESIGN DIRECTION

## 2.1 The operator should never have to understand the plumbing

The application should present the job in human terms:

- Where should this project record live?
- What sources belong to this project?
- What has been measured?
- What is duplicated?
- What is unique?
- What should survive?
- Where should the new SOT go?
- Has it been copied and verified?

Ports, APIs, IndexedDB, SQLite, browser adapters, and WSL adapters belong in diagnostics/configuration details, not the normal workflow.

## 2.2 Every screen has one primary job

Avoid multi-purpose configuration cards, duplicate summaries, tutorial panels, and decorative chrome.

Primary actions must be obvious and few.

## 2.3 Native file/folder selection beats custom browsing when available

The application should use the platform's native folder picker whenever that is the simplest and most reliable source-selection method.

A custom filesystem browser is only justified where the platform exposes a real browsable filesystem, such as WSL/server mode.

## 2.4 Never pretend a read picker is a write destination picker

The browser prompt shown in build 5.2 — “Upload 2,013 files to this site?” — occurred because a directory **input/read** control was being used to simulate selecting a backup destination.

That behavior is prohibited.

Backup/export is a separate concept:

- **Browser/mobile:** default to **Export Project Database / Export Backup** which creates a downloadable backup package. If a browser has a proven writable-directory API, an optional “Save to folder” enhancement may be offered later, but it cannot be required.
- **WSL:** select/write a real server-visible backup directory.

## 2.5 Mobile-first means the entire workflow works in portrait

Landscape may improve density, but nothing essential may require rotation.

No three-column control should be forced onto a portrait screen merely to preserve desktop geometry.

## 2.6 Progressive disclosure

The user should see what is needed at the current stage, not every future control at once.

Examples:

- Target SOT selection does not appear before surviving capacity is known.
- Dedup details do not appear before inventory exists.
- Copy controls do not appear before a plan is approved.

---

# 3. GLOBAL APPLICATION SHELL

## 3.1 Persistent navigation

A fixed hamburger remains permanently anchored top-left.

Expanded navigation:

1. **Configuration**
2. **Projects**
3. **Operations**
4. **Database**
5. **Reports**

This is intentionally simpler than the previous menu.

### Why these five

- **Configuration** — define the authority and backup/export policy.
- **Projects** — create/edit the project definition and sources.
- **Operations** — all lifecycle execution: fingerprint, inventory, dedup, recommendation, build, verification, promotion.
- **Database** — inspect/administer the authoritative metadata store.
- **Reports** — evidence, lineage, audit, project summaries.

Dedup and SOT Build are not separate left-nav destinations; they are stages inside Operations for a selected project.

## 3.2 Navigation behavior

- Hamburger never moves.
- Desktop: expanded sidebar or compact icon rail.
- Mobile portrait: sidebar becomes an overlay/drawer.
- Selection persists only as UI preference.
- Contrast is light/neutral and readable.
- No dark low-contrast rail.

---

# 4. CONFIGURATION — DESIGNED FROM SCRATCH

Configuration should be simple because most users should configure it once and then rarely return.

## 4.1 Browser/mobile configuration

### Project database

Display:

**Project database**  
`On this device`  
Status: `Ready` / `Not initialized`

Primary action:

**Initialize / Validate**

Behavior:

- Creates the browser-authoritative DB automatically if it does not exist.
- Validates schema and writable state.
- No fake path field like `IndexedDB://...` is required in the normal UI.
- Advanced diagnostics may show the adapter/storage identity separately.

### Backup

Display:

**Project database backup**

Primary actions:

- **Export backup**
- **Import backup**

Export creates one portable project-database backup package containing schema version + project/source/run/lineage metadata available at that stage.

No folder-upload prompt.

A future browser capability may add **Save backup to folder**, but only if real writable-directory access is proven on the target browser/device.

## 4.2 WSL configuration

Display two rows:

**Project database**  
`/path/to/sot.sqlite`  `[Choose…]`

**Backup folder**  
`/path/to/backups`  `[Choose…]`

`Choose…` opens a compact inline/server filesystem browser because WSL exposes a real filesystem.

Actions:

- **Save & validate** — create DB if missing, migrate schema if safe, integrity check.
- **Backup now**
- **Restore…**

## 4.3 Configuration acceptance criteria

The user can understand, without technical explanation:

- where project metadata is stored;
- whether the DB exists and is healthy;
- how to back it up;
- how to restore/import it.

---

# 5. PROJECTS — PROJECT DEFINITION WORKFLOW

This replaces the rejected complicated three-panel source selector as the default experience.

## 5.1 Projects landing page

Shows project cards/rows:

- Project name
- Created date
- Status: Pending / WIP / Closed
- Active / Inactive
- Source count
- Last activity

Primary action: **New Project**

Secondary actions per project:

- Open
- Duplicate definition (future)
- Archive / Restore

## 5.2 New Project — one simple page

### Header fields

One compact row on desktop, stacked on mobile:

- **Project name** — required
- **Project note** — optional

New project defaults:

- Active = true
- Status = Pending
- created_at = now

### Sources section

Header:

**Sources**        `[+ Add source]`

Every selected source becomes one card/row containing:

- source name;
- full path/locator shown compactly;
- optional source note;
- source type badge: Device / WSL / Promoted SOT;
- permission/availability status;
- Remove.

There is no second or third staging panel.

### Add Source — browser/mobile

`+ Add source` invokes the platform-native folder chooser.

After the folder is chosen:

- it appears immediately as a **draft source card**;
- operator can add an optional note;
- operator can add another source by repeating `+ Add source`.

No custom in-app folder tree is shown unless the browser platform later provides a proven simpler mechanism.

Important: selecting a folder grants read access to the folder for source processing. It is not described as uploading the folder to GitHub Pages.

### Add Source — WSL

`+ Add source` opens a lightweight source chooser optimized for a real filesystem.

Proposed WSL chooser:

```text
┌ Add source ───────────────────────────────┐
│ Location:  [C:] [D:] [WSL Home] [...]   │
│ Path: /mnt/d/photos/2024                  │
│                                          │
│  ▱ Family                                │
│  ▱ July Picnic                           │
│  ▱ RAW                                   │
│                                          │
│ [Use current folder]            [Cancel] │
└──────────────────────────────────────────┘
```

Rules:

- One location/path at a time.
- Click folder to drill.
- Back/Up is always visible.
- **Use current folder** adds the currently displayed path.
- To add multiple source folders, repeat `+ Add source`.

This deliberately trades multi-select cleverness for simplicity and correctness.

### Why no three-panel picker

The three-panel concept created too much UI state and too many possible selection semantics, especially on mobile. Source selection is not the main job of the product; it should be a short setup step.

The accepted simplification is:

**choose one source folder → add it → repeat as needed.**

## 5.3 Save/Create semantics

Bottom action:

**Create Project**

Before creating, show a compact summary:

- project name;
- number of sources;
- source notes count;
- no target SOT yet.

Create Project persists the definition in the active authoritative DB.

No fingerprinting happens merely because a source was selected. Fingerprinting begins in Operations.

---

# 6. OPERATIONS — THE MAIN PRODUCT WORKSPACE

Operations is project-centric and stage-driven.

## 6.1 Layout

### Desktop

```text
┌ Projects ───────┬─────────────────────────────────────────────┐
│ Project A       │ Project A                                  │
│ Project B       │ Pending · created Aug 12 · 3 sources       │
│ Project C       │                                             │
│                 │ [1 Define] [2 Inventory] [3 Dedup] ...     │
│ Deleted ▸       │                                             │
│                 │ stage content                               │
└─────────────────┴─────────────────────────────────────────────┘
```

### Mobile portrait

Project selector becomes a compact top dropdown/sheet. The selected project's stage workspace fills the screen.

No narrow permanent left pane on portrait.

## 6.2 Project lifecycle stages

The Operations workspace uses one horizontal/scrollable stage ribbon:

1. **Sources**
2. **Fingerprint & Inventory**
3. **Dedup & Analysis**
4. **Recommendation**
5. **Build Plan**
6. **Copy & Verify**
7. **Promote**

Stages unlock progressively when prerequisite evidence exists.

## 6.3 Operations status header

Always visible for selected project:

- Status: Pending / WIP / Closed
- Created date
- Last activity
- Current stage
- Progress % when measurable
- Start time when running
- ETC only when evidence supports it
- `[Run / Continue]`
- `[Stop]`
- `[Close Project]` only when appropriate

No Restart control initially. Run means start or continue from checkpoint.

## 6.4 Stage 1 — Sources

Shows:

- every source;
- source note;
- availability;
- fingerprint status;
- last seen;
- file/byte totals when inventoried;
- reconnect/relink action when necessary.

## 6.5 Stage 2 — Fingerprint & Inventory

This is the first substantive processing stage and must not be skipped in the next real implementation release.

For each source, capture at minimum:

### Source fingerprint evidence

A source fingerprint is not merely a path. It should combine stable evidence sufficient to recognize/relink a previously registered source.

Planned fingerprint evidence includes:

- source type;
- volume/device identity where available;
- normalized root locator/path;
- total file count after inventory;
- total bytes after inventory;
- deterministic sample/content evidence defined by the engine;
- fingerprint_created_at;
- last_verified_at.

Exact fingerprint algorithm remains an open technical design item and must be resolved before coding the engine.

### Inventory manifest

For every file:

- source_id;
- relative path;
- normalized relative path;
- filename;
- extension/type where useful;
- size;
- modified timestamp;
- created timestamp where reliably available;
- inventory timestamp;
- later hash/content ID fields.

### Run telemetry

- run ID;
- source ID;
- started_at;
- last_progress_at;
- completed_at;
- files_seen;
- bytes_seen;
- files/sec;
- bytes/sec;
- estimated remaining time when statistically defensible;
- checkpoint state;
- error count.

## 6.6 Stage 3 — Dedup & Analysis

Evidence-driven views:

**Summary**

- Raw bytes
- Unique bytes
- Duplicate bytes
- Exact duplicate count
- Conflict count

**Duplicate groups**

Each group shows candidate copies and recommended survivor.

**Conflicts / different**

Same-name/different-content, path collisions, or ambiguous canonical choice.

No near-duplicate media analysis is required for MVP exact reconciliation.

## 6.7 Stage 4 — Recommendation

The system produces an operator-reviewable recommendation:

- canonical surviving set;
- duplicate removals from the copy plan (not source deletion);
- unresolved conflicts requiring owner choice;
- surviving byte total;
- recommended minimum primary SOT capacity;
- recommended backup capacity.

Owner approves the recommendation before target selection.

## 6.8 Stage 5 — Build Plan

Only now choose:

- Target SOT;
- backup target.

Generate:

- destination mapping;
- collision-safe path plan;
- deterministic copy script/command plan;
- required capacity / available capacity;
- dry-run results.

## 6.9 Stage 6 — Copy & Verify

Rules:

- copy-only;
- never move/delete sources;
- resumable checkpoints;
- content verification;
- failed verification blocks promotion;
- copy throughput is measured separately from inventory throughput.

## 6.10 Stage 7 — Promote

A verified target becomes a named SOT generation.

Persist:

- generation ID;
- originating project/run;
- target location;
- verification evidence;
- promotion timestamp;
- parent source/content lineage.

The promoted SOT can then be registered as a source in another project.

---

# 7. DATABASE ADMINISTRATION

Database Administration is for inspecting and correcting metadata, not running reconciliation.

## 7.1 Browser/mobile

Operate against the browser-authoritative database.

## 7.2 WSL

Operate against the configured SQLite SOT DB through allowlisted application APIs.

## 7.3 UX

Top controls:

- Table selector
- Search/filter
- Export current view
- Backup database

Table/grid supports:

- column headers;
- sorting;
- filtering;
- pagination/virtualization;
- editable mutable fields;
- immutable key fields visibly locked;
- soft-delete/restore where permitted.

### Minimum managed datasets

- Projects
- Sources
- Runs
- Inventory runs
- Events / audit
- Later: files/content index/duplicate groups/copy plans/verifications/SOT generations/lineage

### Bulk operations

Safe bulk actions:

- Active → Inactive
- Inactive → Active
- Add/change tags/classification when implemented

Never bulk-edit identity keys or lineage keys.

---

# 8. REPORTING

Reporting is evidence-only and grows with the schema.

## 8.1 Project summary

- project identity/name;
- status/current stage;
- created/updated timestamps;
- source list/notes;
- source availability;
- latest run summary.

## 8.2 Inventory report

- files / bytes by source;
- inventory duration;
- error count;
- throughput history.

## 8.3 Dedup report

- raw / unique / duplicate bytes;
- duplicate groups;
- conflicts;
- recommended surviving capacity.

## 8.4 Build/verification report

- approved copy plan;
- target;
- copy results;
- verification failures/success;
- promotion state.

## 8.5 Lineage report

For any promoted SOT:

```text
SOT generation
  ← promotion
  ← verified copy job
  ← approved copy plan
  ← dedup decisions
  ← content/file manifests
  ← source fingerprints
  ← original project sources
```

---

# 9. LOGICAL DATA MODEL

The browser/mobile and WSL adapters implement the same logical schema.

## 9.1 Instance / authority

```text
instance_id
storage_adapter            browser_indexeddb | sqlite
schema_version
created_at
updated_at
backup_policy
```

## 9.2 Project

```text
project_token              immutable
project_name
project_note
active                     boolean
status                     Pending | WIP | Closed
current_stage
created_at
updated_at
deleted_at                 nullable
current_run_id             nullable
```

## 9.3 Source

```text
source_id                  immutable
project_token
source_type                browser_folder | wsl_path | promoted_sot
original_locator
normalized_locator
operator_label
operator_note
registered_at
last_seen_at
source_status
fingerprint_id             nullable until fingerprinted
parent_sot_generation_id   nullable
```

## 9.4 Source fingerprint

```text
fingerprint_id
source_id
fingerprint_version
fingerprint_value/evidence
created_at
verified_at
```

## 9.5 Runs

```text
run_id
project_token
stage
status
started_at
last_progress_at
completed_at
checkpoint_state
progress_percent
estimated_completion_at
error_count
```

## 9.6 Inventory

```text
inventory_run_id
run_id
source_id
files_seen
bytes_seen
files_per_second
bytes_per_second
```

## 9.7 File manifest

```text
file_id
source_id
relative_path
normalized_relative_path
filename
size
modified_at
created_at
inventory_run_id
content_id/hash_id         nullable until hashed
```

## 9.8 Dedup / content

```text
content_id
hash_algorithm
hash_value
byte_size

duplicate_group_id
content_id
recommended_survivor_file_id
decision_status
```

## 9.9 Copy / verification / lineage

```text
copy_plan_id
project_token
approved_at

target_id
copy_job_id
verification_id

sot_generation_id
promoted_at
parent_project_token

lineage_id
from_entity_type
from_entity_id
to_entity_type
to_entity_id
relationship
```

---

# 10. BACKUP / EXPORT DESIGN

## 10.1 Browser/mobile authority backup

Primary UX:

- **Export backup** → one downloadable portable backup package.
- **Import backup** → validate version/schema then restore or import.

The backup package must contain enough metadata to recreate the authoritative project database and lineage available at that schema version.

The browser should never ask to “upload every file in a backup folder” merely to choose a destination.

## 10.2 WSL authority backup

- Choose writable backup directory.
- Create SQLite-safe snapshot/backup.
- Validate backup integrity.
- Restore only after validation.
- Preserve safety copy of current DB before replacement.

---

# 11. RELEASE PLAN — RESET

No code release is currently authorized. The next release sequence begins only after this plan is accepted.

## DESIGN GATE D0 — Product/UX plan

**Status:** CURRENT

Scope:

- approve navigation;
- approve Configuration behavior;
- approve simplified source-selection model;
- approve Operations stage model;
- approve DB Administration concept;
- approve Reporting concept;
- approve logical schema direction;
- resolve fingerprint algorithm and browser permission constraints that affect implementation.

**Exit:** owner explicitly accepts this document.

---

## v0.4.0 — Authority + Project Definition + Real Source Registration

This becomes the first new implementation release after design acceptance.

### Scope

- global shell/navigation;
- browser IndexedDB authority initialization + export/import backup;
- WSL SQLite authority configuration + backup path;
- Projects list/new/edit/archive/restore;
- simplified `+ Add source` flow;
- browser native folder selection;
- WSL compact folder chooser;
- project/source metadata persistence;
- Operations shell with stage ribbon;
- Source stage showing real registered sources and availability;
- **real source fingerprint foundation**, not a mock placeholder.

### Test gates

- browser DB create/validate/persist/export/import;
- WSL DB create/validate/backup;
- project create/reopen;
- source registration survives project reopen;
- browser folder picker does not generate a fake backup-upload workflow;
- WSL folder selection adds exact canonical path;
- source note persists;
- source fingerprint record is produced according to the approved algorithm;
- portrait phone complete workflow;
- no fake inventory/dedup/copy states.

---

## v0.4.1 — Inventory / Manifest / Checkpoints

Scope:

- recursive inventory;
- file manifest;
- run telemetry;
- pause/stop/continue checkpoints;
- reconnect/relink;
- source fingerprint verification/refinement;
- Operations progress with real evidence.

Gates:

- interruption/resume;
- source disconnect/reconnect;
- file/byte totals reconcile;
- path normalization;
- historical run telemetry retained.

---

## v0.5.0 — Exact Dedup + Analysis + Recommendation

Scope:

- content hashing;
- exact duplicate groups;
- conflict detection;
- canonical survivor recommendation;
- raw/unique/duplicate bytes;
- surviving capacity;
- target + backup capacity recommendation;
- operator approval workflow.

Gates:

- known duplicate corpus;
- same-size/different-content mutation;
- collision fixtures;
- interrupted hash/resume;
- accounting reconciliation.

---

## v0.6.0 — Build Plan + Generated Copy Scripts

Scope:

- select targets;
- generate copy plan/scripts/commands;
- collision-safe mapping;
- dry run/preflight;
- plan approval;
- persist plan to SOT DB.

---

## v0.7.0 — Copy + Verify

Scope:

- copy-only execution;
- checkpoints/resume;
- verification;
- separate copy performance telemetry;
- failure handling.

---

## v0.8.0 — Promote + Lineage

Scope:

- promote verified target;
- create SOT generation identity;
- write complete lineage;
- allow promoted SOT as future source;
- lineage reporting.

---

## v0.9.0 — Maintenance + OpenClaw orchestration

Scope:

- recurring maintenance/change sets;
- additions/changes/deletions review;
- OpenClaw orchestration through the same deterministic contracts;
- reporting/export expansion.

---

## v1.0.0 — MVP hardening

- multi-TB corpus;
- crash/restart fault injection;
- source removal/replacement;
- browser/mobile persistence/reconnect tests;
- SQLite/WAL throughput/locking tests;
- corruption/verification mutation;
- full SOT1 → SOT2 → SOT3 lineage test.

---

# 12. DESIGN DECISIONS STILL OPEN

These must be resolved before implementation where they affect architecture or gates.

## O-001 — Source fingerprint algorithm

Need a deterministic definition of the source-level fingerprint that is strong enough to recognize a known source even when path/mount changes, without requiring full-file hashing just to identify the source.

Candidate evidence to evaluate:

- filesystem/device identity where available;
- root metadata;
- inventory count/bytes;
- deterministic sampled paths/sizes/timestamps;
- sampled content hashes;
- versioned fingerprint schema.

## O-002 — Browser folder permission persistence

Need exact target-device behavior defined for:

- Android Chrome;
- Samsung Internet if supported;
- desktop Chrome/Edge;
- refresh/reopen;
- device reboot;
- PWA-installed vs normal tab.

UX must assume reauthorization can be required unless proven otherwise.

## O-003 — Browser database backup package format

Need choose portable format:

- JSON package;
- structured ZIP bundle;
- SQLite-compatible export generated client-side;
- other versioned package.

Primary requirement is reliable restore/migration, not human readability.

## O-004 — Browser content hashing implementation

Need choose a chunked/streaming exact hash implementation appropriate for large files without loading entire files into memory.

## O-005 — Copy execution in browser/mobile mode

Need determine exact supported target-writing mechanism and browser/device limits before claiming browser-mode SOT promotion can write an arbitrary target filesystem.

Until proven, browser/mobile can fully own project definition, inventory, analysis, and DB authority; physical target copy capability is a separately gated feature.

## O-006 — Project completion semantics

Clarify difference between:

- administrative Close Project;
- operational Promote SOT / complete reconciliation.

A Closed project must never imply copy/verification/promotion occurred if those stages were not executed.

---

# 13. LIVE BACKLOG

- schema migration/version tooling for browser and SQLite adapters;
- browser backup export/import;
- audit event history;
- tags / sidecar metadata;
- encrypted/sensitive classification;
- source relink/reconnect review;
- network-share reconnect handling;
- scan/copy performance history;
- Android background/sleep interruption handling;
- lineage visualization;
- cold/warm/hot tier reporting;
- near-duplicate media analysis after exact dedup;
- multi-instance SOT support — future only.

---

# 14. SAFETY / DATA INVARIANTS

1. Sources are read-only inputs.
2. SOT construction is copy-only; never automatically move/delete source files.
3. Human validation is required before physical source retirement.
4. Project token is immutable; project name is mutable.
5. Source identity is durable and can be relinked when location changes.
6. Every run/checkpoint belongs to the same immutable project identity.
7. No fake progress, ETC, inventory, duplicate, copy, or verification evidence.
8. Target selection occurs only after surviving capacity is known.
9. Verification failure blocks promotion.
10. Scan throughput and copy throughput are distinct measurements.
11. Soft-delete/archive never destroys lineage/history.
12. Promoted SOT lineage survives future use as a source.
13. Browser/mobile and WSL adapters implement the same logical identity model.
14. Backup destination selection must never be implemented using a source/upload directory picker.

---

# 15. GRAVEYARD — DO NOT REINTRODUCE

- **G-001** Separate FastAPI/Uvicorn/file_browser.py SOT server.
- **G-002** SOT ports 8081/8082.
- **G-003** Release-driven Tailscale/server topology changes.
- **G-004** `localStorage` as authoritative project DB.
- **G-005** Fake lifecycle controls/status/progress.
- **G-006** Final SOT target required during initial Project Setup.
- **G-007** Source-selection modal as the default project setup workflow.
- **G-008** Dedicated Dedup/Analysis top-level navigation.
- **G-009** Complex three-panel source selector as a mandatory source-add workflow.
- **G-010** Mobile workflow requiring landscape orientation.
- **G-011** Decorative/tutorial-heavy source browser.
- **G-012** Moving/disappearing global hamburger.
- **G-013** GitHub Pages showing WSL/server-only drives.
- **G-014** Test URL before exact served-build verification.
- **G-015** Ephemeral/self-triggering workflow files as routine patch mechanism.
- **G-016** Destructive project delete instead of archive/restore.
- **G-017** Patch-forward from failed owner candidate.
- **G-018** Losing lineage when promoted SOT becomes a later source.
- **G-019** Requiring browser/mobile project migration to WSL before it can be authoritative.
- **G-020** Disabling browser/mobile Configuration simply because no WSL server exists.
- **G-021** Using `<input type=file webkitdirectory>` or equivalent read/upload chooser to represent a backup/write destination.
- **G-022** Treating selected source folders as “uploaded to GitHub Pages”; they are browser-authorized local sources.
- **G-023** Coding before the current design gate is explicitly accepted.

---

# 16. DEFINITION OF DONE FOR DESIGN GATE D0

Planning is accepted only when the owner agrees that this document correctly defines:

- application navigation;
- Configuration UX;
- source-selection UX for browser and WSL;
- Project definition workflow;
- Operations stages;
- fingerprint/inventory purpose;
- dedup/recommendation workflow;
- target/copy/verify/promotion workflow;
- Database Administration scope;
- Reporting scope;
- logical data model;
- browser backup/export behavior;
- release sequence;
- test gates;
- graveyard constraints;
- remaining open decisions.

Until then: **no code.**
