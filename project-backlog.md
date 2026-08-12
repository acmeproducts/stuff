# SOT Project — Governance, Product Design, Release Plan, Backlog & Graveyard

**Repository:** `acmeproducts/stuff`  
**Canonical application artifact (when implementation resumes):** `project.html`  
**Canonical planning/governance document:** `project-backlog.md`  
**Status:** **PLANNING / DESIGN ONLY — NO CODE**  
**Last governance update:** 2026-08-12

This document is the single current authority for the SOT project. No implementation work resumes until the owner explicitly accepts the design.

The current implementation candidates are rejected. The planning reset does **not** authorize simplification by deleting required workflow capability. The three-panel source-selection model remains required and is redesigned here for fewer clicks, less friction, better information density, and mobile usability.

---

# 0. GOVERNANCE

## 0.1 Authority order

1. Current owner ruling.
2. Locked requirements in this document.
3. Graveyard vetoes in this document.
4. Release plan and gates in this document.
5. Older PRDs, prototypes, screenshots, and implementation history.

If a proposed design reduces capability or changes a locked interaction, it requires explicit owner approval. Implementation convenience is not a valid reason to descope UX or product requirements.

## 0.2 Current owner ruling — planning/design only

The current implementation is rejected because:

- source selection is too difficult and too indirect;
- the current Configuration backup picker incorrectly invokes a directory-read/upload flow;
- the three-panel picker was simplified in a way that increased clicks and removed required utility;
- fingerprinting is the substantive operation and must be treated as the primary Operations workflow;
- the UI has not yet delivered enough operational value.

Effective immediately:

- planning and design only;
- no `project.html` changes;
- no backend/API changes;
- no release candidate builds;
- no GitHub Pages test handoffs;
- this plan must be accepted before coding resumes.

## 0.3 Established plumbing — keep

There are two valid execution modes using the same logical product model.

### Browser/mobile mode

- Runs from GitHub Pages or another static HTTPS host.
- A browser/mobile project may be created, fingerprinted where browser capability permits, operated, administered, reported, and completed without WSL.
- Browser/mobile project authority uses persistent IndexedDB or a later approved equivalent.
- `localStorage` is UI preferences only.
- Local source access comes from browser-granted folder/file access.
- Migration to WSL is optional.

### WSL mode

- Existing production application/report server remains `session-server.js` on port 18080.
- Browser reaches SOT APIs through the existing `/report/api/sot/*` mount.
- WSL has broader filesystem access and is preferred for large attached drives and higher-throughput processing.
- No extra SOT web service.
- No FastAPI/Uvicorn helper.
- No 8081/8082.
- No Tailscale topology changes.

### One product, two execution adapters

The UX, project model, source model, fingerprint model, run model, dedup model, lineage model, and reporting model are the same. Only filesystem authority, storage adapter, and processing throughput differ.

---

# 1. PRODUCT PURPOSE

The product is a **Source of Truth reconciliation harness**.

Its job is to:

```text
Configure project authority
        ↓
Define project + sources
        ↓
Fingerprint sources + inventory content
        ↓
Dedup / analyze / recommend
        ↓
Approve surviving authoritative set
        ↓
Choose Target SOT + backup target
        ↓
Generate deterministic copy plan/scripts
        ↓
Copy + verify
        ↓
Promote verified target to SOT generation
        ↓
Reuse promoted SOT as a future source without losing lineage
```

### Lineage invariant

```text
Source A + Source B
        ↓
      SOT 1
        ↓ source in later project
      SOT 2
        ↓ source in later project
      SOT 3
```

Every generation must remain traceable backward through project, source, fingerprint, manifest, dedup decision, approved copy plan, copy execution, verification, and promotion.

---

# 2. GLOBAL UX PRINCIPLES — LOCKED

## 2.1 Improve the workflow; do not amputate it

The goal is fewer clicks, less friction, clearer hierarchy, and better information density **without removing required capability**.

## 2.2 Three-panel source selection is required

The three-panel source model is not optional and must not be replaced by repeated one-folder-at-a-time selection.

It exists because an operator frequently needs to:

- choose one volume;
- inspect many folders from that same volume;
- select several folders in one pass;
- search and sort a large folder list;
- review selected sources before creating the project.

## 2.3 Minimalism means less chrome, not less function

Remove decoration, tutorial cards, redundant labels, oversized headers, duplicate summaries, and unnecessary transitions.

Do not remove:

- multi-folder selection;
- select-all/deselect behavior;
- search;
- sort;
- source notes;
- path visibility;
- persistent staged-source review;
- resize/collapse controls where required.

## 2.4 Mobile must be functional, not merely squeezed

Portrait and landscape must both work.

The same logical three panels are retained. On narrow viewports they may stack or use a panel-switcher pattern, but the operator must be able to move among all three without losing selection state or repeating source selection.

## 2.5 No fake capability

The UI displays only real evidence and real actions.

- No fake fingerprint completion.
- No fake progress percentage.
- No fake ETC.
- No fake dedup result.
- No fake copy/promotion state.

## 2.6 Configuration must not misuse read access as backup destination selection

A browser directory-read/upload prompt is not a valid backup-location chooser.

Browser backup/export and WSL backup-directory selection are separate designs.

---

# 3. GLOBAL APPLICATION SHELL

## 3.1 Left navigation — locked order

1. **Configuration**
2. **Project Setup**
3. **Fingerprinting**
4. **Database Administration**
5. **SOT Build & Promotion**
6. **Reporting**

### Why “Fingerprinting” replaces “Operations”

Fingerprinting is the first substantive operation. A project cannot be meaningfully analyzed, deduplicated, recommended, or promoted until its sources are fingerprinted/inventoried.

The Fingerprinting section therefore owns:

- source fingerprinting;
- inventory;
- progress;
- stop/continue;
- downstream dedup/analysis/recommendation for the selected project.

## 3.2 Global hamburger — locked

- Permanently fixed top-left.
- Never moves between breakpoints.
- Expands/collapses left navigation.
- Expanded/collapsed state persists.
- Desktop collapsed state is a readable icon rail.
- Mobile opens an overlay/drawer; no unreadable dark sliver.
- Contrast stays light/neutral/readable.

---

# 4. CONFIGURATION — FINAL DESIGN DIRECTION

Configuration answers one question: **where does the authoritative project/fingerprint database live and how is it protected?**

## 4.1 Browser/mobile

### Project database

Display:

**Project database**  
`On this device`  
Status: `Ready` / `Not initialized` / `Needs migration` / `Error`

Primary action:

**Initialize / Validate**

Behavior:

- automatically creates the browser-authoritative IndexedDB database if it does not exist;
- validates schema version;
- validates read/write access;
- does not show a fake filesystem path to IndexedDB in the normal UI.

### Backup / restore

Primary actions:

- **Export backup**
- **Import backup**

Export creates a portable backup package of the authoritative SOT metadata database.

Import validates schema/version before replacing or merging data.

No “choose backup folder” control is shown unless the browser supports a proven writable-directory API and we explicitly approve that flow later.

### Configuration acceptance gate

No browser prompt may say “Upload N files to this site?” as a result of selecting a backup destination.

## 4.2 WSL

Rows:

**Project database**  
`/path/to/sot.sqlite` `[Choose…]`

**Backup folder**  
`/path/to/backups` `[Choose…]`

`Choose…` uses the same efficient folder-browser component family described below, but in single-path selection mode.

Actions:

- **Save & validate** — create DB if missing, migrate schema if safe, integrity check.
- **Backup now**
- **Restore…**

---

# 5. PROJECT SETUP — FLAT ONE-SURFACE DESIGN

Project Setup, Project Definition, and source selection are one page.

There is no Add Locations modal.

## 5.1 Project header

One compact row on desktop; stacked on narrow mobile:

- **Project name** — required
- **Project note / description** — optional

New project defaults:

- Active = true
- Status = Pending
- created_at = now

No status control during creation.

## 5.2 Inline source builder — required three-panel interaction

The source builder appears immediately under Project Name / Note.

It is a fixed-height, internally scrollable component.

Wide desktop/tablet:

```text
┌ Source Drives ───────┬ Source(s) ────────────────────────┬ <Project Name> ──────────────┐
│ Root                 │ [Select all ✓] [Search ________] │ selected source 1            │
│   C:                 │ Name ▲▼  Size ▲▼  Updated ▲▼     │ /full/path/...               │
│   D:                 │                                  │ note                          │
│   WSL Home           │ ☑ folder A     14 GB   Aug 11   │                              │
│   This device        │ ☑ folder B      8 GB   Aug 09   │ selected source 2            │
│                      │ ☐ folder C      2 GB   Jul 30   │ /full/path/...               │
│                      │ ...                              │                              │
│                      │ [Add selected]                   │                              │
└──────────────────────┴──────────────────────────────────┴──────────────────────────────┘
```

### Panel 1 — Source Drives

Required behavior:

- First entry is **Root**.
- Clicking Root lists **all currently available source volumes/roots**, including local/browser-authorized roots that are currently available.
- Browser/mobile shows only browser-visible sources.
- WSL shows server-visible drives/mounts plus browser-local source access where available.
- Clicking a volume/root loads that source into Panel 2.
- Panel 1 is navigation only; no volume checkbox is required.
- Panel 1 has its own hamburger/collapse control.
- Collapse state persists.
- On collapse, Panel 2 expands into the freed space without losing state.

### Panel 2 — Source(s) — primary working panel

This panel is the core source-selection surface and must be highly efficient.

#### Required list header

Sticky header contains:

- **Select all** checkbox — **checked by default** when a root/volume is opened.
- Search field.
- Sortable columns:
  - **Name** ascending/descending;
  - **Size** ascending/descending;
  - **Last Updated** ascending/descending.

Search and sort are table-stakes requirements and may not be deferred.

#### Select-all semantics

When a root is opened:

- Select All defaults ON.
- All visible/selectable top-level folders are selected.
- Operator may deselect individual folders.
- Search filters the visible rows without silently destroying selections outside the filter.
- Select All applies to the current logical folder scope; its exact filtered-vs-all semantics must be explicit in the UI and tested.

Recommended default rule for owner review:

- **Select All = all folders in the current folder scope, not merely the current search result.**
- Search is a view filter only.
- A small count such as `18 of 24 selected` remains visible.

This recommendation reduces accidental omission when search is used. It is a UX improvement suggestion, not a scope reduction.

#### Folder rows

Each folder row contains:

- checkbox;
- folder name;
- size;
- last updated;
- optional compact type/state indicator only if useful.

Clicking the **folder name** drills into that folder without altering its checkbox state.

A breadcrumb/path bar is always visible above the list.

Up/back navigation is always visible.

#### Add selected

- Sticky at bottom or in persistent toolbar.
- Adds all currently selected folder paths to Panel 3 in one action.
- Does not require reopening/reselecting the volume for additional folders.
- After Add, Panel 2 remains on the same root/path with current search/sort state intact so the operator can make another selection pass if desired.

### Panel 3 — Project Name / staged sources

The heading is the current project name; if blank, `Project`.

Each staged-source tile/row shows:

- source/folder name;
- truncated path;
- full path on hover/tap/details;
- optional source note;
- remove ×.

Clicking a source row opens the optional note editor.

Example note:

`July picnic`

No duplicate source list appears elsewhere on Project Setup.

### Builder resize / layout persistence

Required:

- overall source-builder height is resizable on capable desktop/tablet layouts;
- height persists;
- pane separators are draggable left/right on capable wide layouts;
- pane widths persist;
- Panel 1 collapsed state persists;
- selection/search/sort state persists while the operator remains on Project Setup.

## 5.3 Responsive mobile behavior — three logical panels retained

### Portrait

Do **not** force three tiny columns.

Use a compact three-stage panel switcher inside the same inline source-builder surface:

`[Drives] [Source(s)] [Project]`

Rules:

- one panel is primary at a time;
- switching panels is one tap;
- state never resets;
- Add selected in Source(s) can optionally advance to Project panel after adding, but this should be tested against staying in Source(s) for rapid multi-selection;
- panel headers and actions remain sticky;
- no landscape requirement.

### Landscape / tablet

Use three columns if minimum usable widths are satisfied. Otherwise use the same panel-switcher design.

## 5.4 Create Project

Single final action:

**Create Project**

It persists:

- project definition;
- staged sources;
- source notes;
- source canonical path/locator;
- creation timestamp;
- source registration timestamps;
- active/pending state.

Fingerprinting does **not** silently start during project creation unless later explicitly approved. Project creation completes definition; Fingerprinting is the next primary stage.

---

# 6. FINGERPRINTING — PRIMARY OPERATIONS WORKSPACE

The left navigation item is **Fingerprinting**, not generic Operations.

This section is project-centric and owns the first real processing work plus downstream analysis/recommendation.

## 6.1 Layout

### Desktop/tablet

Left project rail + main fingerprint workspace.

Left rail:

- Deleted / Restore disclosure first;
- active projects sorted by latest activity by default;
- project name;
- created date;
- compact status indicator;
- soft-delete ×;
- hover/focus/tap details reveal project note + source paths/source notes.

Main workspace shows selected project.

### Mobile portrait

Project rail becomes a project selector/sheet. Main fingerprint workspace uses full width.

## 6.2 Project status header

Always visible:

- Status: Pending / WIP / Closed
- Created date
- Activity state
- **Fingerprint progress %** — this is the primary progress percentage
- Start time
- ETC only when statistically defensible
- `[Run / Continue]`
- `[Stop]`
- Reporting chip

### Run semantics

- Pending + Run → start fingerprint/inventory.
- WIP → Run is disabled.
- WIP → Stop is enabled.
- Stopped/Pending with checkpoint → Run means **Continue**.
- No Restart control in initial design. It may be added only if a distinct destructive restart use case is proven.

## 6.3 Fingerprint progress — definition

The progress bar represents real fingerprint/inventory work, not generic stage completion.

Suggested evidence model:

```text
progress = completed inventory/fingerprint work / known current run work
```

Progress calculation must be derived from actual discovered/processed files/bytes and checkpoint evidence. It must not be fabricated from UI stages.

## 6.4 Source fingerprinting

Fingerprinting answers: **is this the same source we registered before, even if its mount/path changes?**

Fingerprint record must contain sufficient durable evidence. Candidate evidence includes:

- source_id;
- source_type;
- volume/device identity where platform exposes it;
- normalized root/path locator;
- file count;
- byte count;
- deterministic inventory/sample signature;
- fingerprint version;
- fingerprint_created_at;
- last_verified_at;
- source availability/relink state.

The exact fingerprint algorithm remains a technical design item to resolve before engine coding.

## 6.5 Inventory manifest

Per-file evidence includes at minimum:

- project_token;
- source_id;
- relative path;
- normalized relative path;
- filename;
- extension/type where useful;
- size;
- modified timestamp;
- created timestamp where reliably available;
- inventory timestamp;
- later content hash/content ID fields.

## 6.6 Fingerprint/inventory run telemetry

```text
run_id
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

Scan throughput and copy throughput remain separate measurements.

## 6.7 Project source status inside Fingerprinting

For every source show:

- source name/path;
- note;
- available / missing / needs relink;
- fingerprinted yes/no;
- fingerprint timestamp;
- file count;
- bytes;
- last seen;
- current progress if running;
- relink/reconnect when needed.

---

# 7. DEDUP / ANALYSIS / RECOMMENDATION — INSIDE FINGERPRINTING

These are not separate left-nav items. They become available inside the selected project after fingerprint/inventory prerequisites are met.

## 7.1 Dedup summary

Show only evidence-backed values:

- Raw bytes
- Unique bytes
- Duplicate bytes
- Exact duplicate count
- Conflict count

## 7.2 Duplicate groups

Each group shows:

- content identity/hash;
- candidate copies;
- source/path;
- size;
- timestamps;
- recommended survivor;
- operator override if needed.

## 7.3 Different / conflicts list

Required separate view for:

- same-name/different-content;
- path collisions;
- ambiguous canonical choice;
- metadata conflicts where relevant.

## 7.4 Recommendation

System produces an operator-reviewable recommendation:

- canonical surviving set;
- duplicate copies excluded from target copy plan, not deleted from sources;
- unresolved conflicts;
- surviving byte total;
- minimum recommended Target SOT capacity;
- recommended backup capacity.

Owner approves recommendation before SOT Build & Promotion becomes executable.

---

# 8. DATABASE ADMINISTRATION

Database Administration is a practical metadata administration tool, not a decorative table.

## 8.1 Table navigation

Allowlisted logical tables/views include, as they exist by release stage:

- projects;
- sources;
- fingerprints;
- fingerprint_runs;
- inventory_files / manifests;
- duplicate_groups;
- dedup_decisions;
- copy_plans;
- verification;
- sot_generations;
- lineage;
- admin_events.

## 8.2 Grid capabilities

Required:

- column headers;
- sort ascending/descending;
- search/filter;
- row selection;
- pagination/virtualization for large tables;
- editable mutable cells;
- immutable identity cells locked/read-only;
- soft delete/restore where semantically valid;
- bulk active/inactive project flag update;
- source/project note and metadata edits;
- audit event for administrative changes.

No arbitrary SQL console in MVP.

---

# 9. SOT BUILD & PROMOTION

This section becomes actionable only after recommendation approval.

## 9.1 Target planning

Choose:

- Target SOT;
- backup target.

Display:

- surviving bytes required;
- free space;
- reserve/headroom;
- filesystem/path constraints;
- target suitability.

## 9.2 Build plan

Generate deterministic copy plan/scripts from the approved surviving set.

Plan contains:

- source_id;
- source relative path;
- destination relative path;
- expected size;
- expected content/hash evidence when available;
- collision behavior;
- copy order/batches;
- verification requirement.

## 9.3 Copy

- explicit Execute;
- copy-only;
- no source move/delete;
- checkpoint/resume;
- source disconnect handling;
- separate copy throughput/progress.

## 9.4 Verify

Verification must pass before promotion.

## 9.5 Promote

Promotion writes a new SOT generation record and full provenance chain.

A promoted SOT may then appear as a source candidate in Project Setup for a later project.

---

# 10. REPORTING

Reporting is schema/evidence-backed only.

## 10.1 Project reporting

- project metadata;
- source definitions/notes;
- fingerprint state;
- fingerprint progress/history;
- file/byte inventory totals;
- errors;
- current status.

## 10.2 Dedup reporting

- unique/duplicate bytes;
- duplicate groups;
- different/conflict list;
- recommendation;
- operator overrides.

## 10.3 Build/promotion reporting

- target plan;
- generated copy plan;
- copied bytes/files;
- verification status;
- promotion history;
- lineage.

## 10.4 Aggregate reporting

- Pending / WIP / Closed project counts;
- active/inactive/deleted counts;
- fingerprinted/unfingerprinted sources;
- total indexed bytes/files;
- historical throughput where evidence exists.

---

# 11. LOGICAL DATA MODEL

Browser authority and WSL authority share the same logical schema.

## 11.1 Project

```text
project_token           immutable
project_name
active
created_at
updated_at
status                  Pending | WIP | Closed
current_stage
current_run_id
notes
deleted_at
```

## 11.2 Source

```text
source_id
project_token
source_type             browser_local | wsl_path | promoted_sot
original_path_or_locator
normalized_path_or_locator
operator_label
operator_note
registered_at
last_seen_at
source_status
parent_sot_generation_id
```

## 11.3 Fingerprint

```text
fingerprint_id
source_id
fingerprint_version
fingerprint_value/evidence
file_count
byte_count
fingerprint_created_at
last_verified_at
```

## 11.4 Run

```text
run_id
project_token
run_type                fingerprint_inventory | hash | copy | verify | future
started_at
stopped_at
completed_at
status
checkpoint_state
```

## 11.5 Inventory file

```text
inventory_file_id
run_id
source_id
relative_path
normalized_relative_path
filename
extension
size
modified_at
created_at
inventory_at
content_hash
content_id
```

## 11.6 Planned downstream datasets

```text
duplicate_groups
dedup_decisions
conflicts
recommendations
copy_plans
copy_jobs
verification
sot_generations
lineage
admin_events
```

---

# 12. RELEASE PLAN — DESIGN BASELINE RESET

No code is authorized until this design is accepted.

## Design Gate D0 — UX / workflow acceptance

Must be explicitly accepted before implementation.

D0 covers:

- left navigation and Fingerprinting naming;
- Configuration model;
- required three-panel source builder;
- Root → volumes behavior;
- Panel 1 collapse;
- Panel 2 Select All default ON;
- Panel 2 search;
- Panel 2 Name / Size / Last Updated asc/desc sort;
- multi-folder selection without reopening the same volume;
- Panel 3 staged-source review + notes;
- mobile portrait panel-switcher behavior;
- Fingerprinting progress semantics;
- Dedup/Analysis/Recommendation integrated into Fingerprinting;
- Database Administration CRUD direction;
- SOT Build/Promotion stage;
- Reporting.

## v0.4.0 — Project Definition + Real Fingerprinting Foundation

This is the first implementation release after D0 acceptance.

### Scope

**Configuration**

- browser Initialize/Validate;
- browser Export/Import backup metadata DB;
- WSL DB path + backup folder + create-if-missing + integrity.

**Project Setup**

- inline required three-panel builder;
- Root lists available roots/volumes;
- collapsible Source Drives panel;
- Select All default ON;
- search;
- Name/Size/Last Updated sort asc/desc;
- multi-folder checkbox selection;
- Add selected;
- staged sources + notes;
- responsive portrait switcher;
- persisted height/pane widths/collapse state where applicable;
- Create Project.

**Fingerprinting**

- project rail;
- Pending/WIP/Closed status;
- real Run/Continue + Stop;
- source inventory;
- fingerprint evidence v1;
- fingerprint timestamps;
- manifest persistence;
- real progress %;
- checkpoint/restart continuation;
- file/byte telemetry.

**Database Administration**

- projects/sources/fingerprints/runs/manifests views;
- sort/search/filter;
- mutable metadata editing;
- bulk project active/inactive;
- soft delete/restore;
- immutable ID protection.

**Reporting**

- project/source/fingerprint/inventory basics from real DB evidence.

### v0.4.0 automated gates

- source-builder Root enumerates only actually available roots;
- Panel 1 collapse does not reset Panel 2 or Panel 3;
- Select All defaults ON when a folder scope loads;
- individual deselect works;
- search does not destroy off-filter selection state;
- Name asc/desc works;
- Size asc/desc works;
- Last Updated asc/desc works;
- multiple selected folders add to Panel 3 in one action;
- second selection pass from same root does not require reopening/re-authorizing root;
- long paths remain intact while visually truncated;
- source note round trip;
- portrait switcher preserves selection state;
- project create survives refresh;
- fingerprint run produces real progress;
- Stop preserves checkpoint;
- Continue resumes same project/run lineage;
- fingerprint timestamp/source link persists;
- manifest file/byte totals reconcile to displayed totals;
- no fake dedup/copy evidence;
- browser backup export does not trigger directory upload prompt;
- WSL mode uses existing server only; no 8081/8082/FastAPI.

### v0.4.0 owner/device gates

**Desktop**

- resize source-builder height and refresh → persists;
- drag pane separators and refresh → persists;
- collapse Source Drives and restore → state works;
- select one root, search/sort/deselect/add many folders without reopening root;
- source list remains readable.

**Mobile portrait**

- Drives / Source(s) / Project switcher works one-handed;
- no landscape requirement;
- search/sort/select-all available in Source(s);
- add selected and staged-source review require no repeated root authorization;
- Create Project works;
- Fingerprinting Run/Stop/Continue works with actual evidence available to the browser.

**WSL**

- same UX model;
- server-visible roots load from real API;
- large folder metadata loads without blocking UI;
- fingerprint progress tied to real WSL scan.

## v0.5.0 — Dedup / Analysis / Recommendation

Inside Fingerprinting for selected project:

- content hashing;
- exact duplicate confirmation;
- duplicate groups;
- different/conflict list;
- unique/duplicate byte accounting;
- canonical recommendation;
- surviving-size estimate;
- target/backup capacity recommendation;
- operator approval/override.

## v0.6.0 — SOT Build Plan + Generated Scripts

- choose Target SOT + backup target;
- generated deterministic copy plan/scripts;
- collision-safe destination mapping;
- free-space/preflight;
- dry run;
- approved plan persistence.

## v0.7.0 — Copy + Verify

- copy-only execution;
- checkpoint/resume;
- separate copy progress/throughput;
- verification;
- corruption/failure handling.

## v0.8.0 — Promote + Lineage

- verified target → promoted SOT generation;
- promoted SOT can become later source;
- lineage across generations retained and reportable.

## v0.9.0 — Reporting / OpenClaw orchestration expansion

- exports;
- lineage visualization;
- aggregate audit reporting;
- OpenClaw orchestration through same deterministic contracts.

## v1.0.0 — MVP hardening

- multi-TB corpus testing;
- millions-of-files scenarios;
- browser persistence/reconnect testing;
- WSL throughput/locking tests;
- crash/restart fault injection;
- source-removal/relink testing;
- verification corruption mutation;
- owner end-to-end reconciliation.

---

# 13. OPEN TECHNICAL DESIGN ITEMS

These require resolution before their implementation stage begins:

- exact source fingerprint algorithm and versioning;
- how folder size is obtained efficiently before full inventory in browser/mobile mode;
- how folder size and last-updated metadata are cached/refreshed in WSL mode;
- Select All semantics under an active search filter — recommended rule is current folder scope, not only visible search matches;
- browser folder-handle persistence/reconnect behavior across Chrome/Android versions;
- browser DB backup package format;
- exact hash strategy and worker concurrency;
- exact copy-script technology by execution adapter;
- audit-event granularity for metadata changes.

---

# 14. OPTIONAL UX IMPROVEMENTS — SUGGESTIONS ONLY

These are not authorized scope changes; they are candidate improvements for owner review.

1. **Selection count in Panel 2:** `18 of 24 selected`, always visible beside Select All.
2. **Quick filters:** `All | Selected | Unselected` in Panel 2 to reduce friction when pruning a large root.
3. **Remember search/sort per root during the current project-definition session.**
4. **Keyboard/desktop affordances:** Shift-click range selection when available, without changing mobile behavior.
5. **Panel 3 duplicate prevention:** if the same canonical path is added twice, focus/highlight the existing staged row rather than silently duplicating it.
6. **Source summary badge in Panel 3:** folder count and, once available, estimated bytes—informational only.

None of these replaces or weakens the locked requirements above.

---

# 15. LIVE BACKLOG

- schema/version migration tooling for IndexedDB and SQLite;
- browser DB export/import backup;
- source relink/reconnect workflow;
- tags/sidecar metadata;
- encrypted/sensitive classification;
- historical fingerprint/scan throughput;
- network-share reconnect handling;
- Android background/sleep interruption handling;
- near-duplicate image/video analysis after exact dedup;
- lineage visualization;
- cold/warm/hot tier reporting;
- multi-instance SOT support — future only.

---

# 16. SAFETY / DATA INVARIANTS

1. Sources are read-only inputs.
2. Copy-only; no automatic source move/delete.
3. Human validation before physical source retirement.
4. `project_token` immutable; project name mutable.
5. Soft delete preserves lineage/history.
6. Project completion never implies unperformed dedup/copy work.
7. UI never invents fingerprint/inventory/dedup/hash/copy evidence.
8. Verification failure blocks SOT promotion.
9. Scan and copy throughput are separate measurements.
10. Promoted SOT lineage survives future use as a source.
11. Browser/mobile and WSL use the same logical project/source/fingerprint/run model.
12. Failed owner/device candidates are never patch-forward baselines.

---

# 17. GRAVEYARD — DO NOT REINTRODUCE

- **G-001:** separate FastAPI/Uvicorn/file_browser.py SOT server.
- **G-002:** ports 8081/8082 SOT service.
- **G-003:** release-driven Tailscale/server topology changes.
- **G-004:** `localStorage` as authoritative project database.
- **G-005:** fake lifecycle/progress/status.
- **G-006:** final SOT target required during Project Setup.
- **G-007:** source-selection modal.
- **G-008:** separate Dedup/Analysis left-nav section.
- **G-009:** Panel 1 volume checkbox/direct add semantics.
- **G-010:** landscape-required source selection.
- **G-011:** decorative/tutorial-heavy source browser.
- **G-012:** moving/disappearing global hamburger.
- **G-013:** GitHub Pages showing WSL/server-only drives.
- **G-014:** test URL before exact served-build verification.
- **G-015:** ephemeral/self-triggering workflows as routine patch mechanism.
- **G-016:** destructive project delete instead of soft-delete/restore.
- **G-017:** patch-forward from failed owner candidate.
- **G-018:** losing lineage when promoted SOT becomes a later source.
- **G-019:** requiring browser/mobile project migration to WSL before it can be authoritative.
- **G-020:** disabling browser/mobile project DB initialization because the app is on GitHub Pages.
- **G-021:** using a directory-read/upload picker as a backup destination selector.
- **G-022:** replacing the required three-panel source builder with repeated one-folder-at-a-time native selection.
- **G-023:** removing multi-folder selection from one root in order to simplify implementation.
- **G-024:** deferring Panel 2 search.
- **G-025:** deferring Panel 2 Name/Size/Last Updated sort.
- **G-026:** generic stage-completion percentage masquerading as Fingerprinting progress.

---

# 18. DESIGN / RELEASE HANDOFF TEMPLATE

Before coding resumes:

**Design gate:** D0  
**Owner decision:** ACCEPT / REVISE / REJECT  
**Locked UX:** explicit  
**Open design items:** explicit  
**Optional suggestions accepted:** explicit

After coding resumes, every release handoff must include:

**Release:**  
**Baseline:**  
**Scope:**  
**Automated gates:** PASS/FAIL  
**Deployment:** exact commit + result  
**Verified test URL:** only after exact served build is verified  
**Owner/device gates:** ordered sequence  
**Known limitations:** explicit  
**Owner result:** PASS / FAIL

---

# 19. DEFINITION OF DONE

A release is DONE only when:

- locked scope is implemented without silent descope;
- automated gates pass;
- mutation tests prove critical gates catch regressions;
- repository artifact is read back and verified;
- exact served build is verified before test handoff;
- owner/device gate passes;
- this governance document is updated to mark the accepted baseline;
- no infrastructure topology change occurred without explicit approval;
- owner result is explicitly PASS.
