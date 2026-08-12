# SOT Project — Governance, Product Design, Release Plan, Backlog & Graveyard

**Repository:** `acmeproducts/stuff`  
**Canonical application artifact (when implementation resumes):** `project.html`  
**Canonical planning/governance document:** `project-backlog.md`  
**Status:** **PLANNING / DESIGN ONLY — NO CODE**  
**Last governance update:** 2026-08-12

This document is the single current authority for the SOT project. The current implementation remains a **POC candidate, not a known-good baseline**. We are still establishing the first true accepted baseline.

The owner has explicitly authorized one narrow exception to the normal no-patch-forward rule: **for the next baseline-seeking release only, existing POC code may be reused and patched forward where it accelerates convergence.** This exception ends when the first owner-accepted baseline is established. After that, failed owner-gate releases revert to the normal rebuild-from-last-accepted-baseline discipline.

No implementation work resumes until the owner explicitly accepts the revised design below.

---

# 0. GOVERNANCE

## 0.1 Authority order

1. Current owner ruling.
2. Locked requirements in this document.
3. Graveyard vetoes in this document.
4. Release plan and gates in this document.
5. Older PRDs, prototypes, screenshots, and implementation history.

Implementation convenience is never a valid reason to remove required UX capability.

## 0.2 Current owner ruling — lessons from the v0.4.0 POC gate

The latest POC established that the product can now execute an end-to-end skeleton, but it is **not yet an accepted baseline**.

### What was useful

- The application now has a recognizable end-to-end path from project definition into fingerprint/inventory work.
- The three-panel source model is directionally correct.
- Browser/mobile execution is viable and does not require WSL migration.
- Fingerprinting/inventory is now represented as the substantive operation rather than generic stage progress.

### What failed

- Fingerprinting was effectively folder-level/manifest-level only; **the product must fingerprint the files inside each source folder, not merely identify the folder.**
- Source selection remains too difficult and requires too much poking/clicking.
- Previously authorized local roots are not treated as durable, reusable source roots strongly enough.
- Large folders do not clearly show when initial enumeration is still in progress.
- Previously-read roots/folders are rescanned too aggressively; the system should pay the expensive full-read cost once, then do a cheap stillness/change check and only update changes.
- Portrait and landscape currently behave too differently; changing the mental model by orientation increases friction.
- Critical actions are poorly placed: Add Selected and Create Project are too close in some layouts and too far from the selection context in others.
- Panel proportions waste space and should be directly adjustable by the operator.

## 0.3 Established plumbing — keep

### Browser/mobile mode

- Runs from GitHub Pages or another static HTTPS host.
- Browser/mobile project authority uses persistent IndexedDB or a later approved equivalent.
- `localStorage` is UI preferences only.
- Browser-granted directory/file handles are persistent source-authority references where the browser supports persisted handles/permissions.
- Browser/mobile projects may be created, fingerprinted, operated, administered, reported, completed, and eventually reconciled without WSL.
- Migration to WSL is optional.

### WSL mode

- Existing production application/report server remains `session-server.js` on port 18080.
- Browser reaches SOT APIs through the existing `/report/api/sot/*` mount.
- WSL provides broader filesystem access and higher-throughput processing for attached drives/shares.
- No extra SOT web service.
- No FastAPI/Uvicorn helper.
- No 8081/8082.
- No Tailscale topology changes.

### One product, two execution adapters

The UX, project model, source model, fingerprint model, run model, dedup model, lineage model, and reporting model are shared. Only filesystem authority, persistence adapter, and processing throughput differ.

---

# 1. PRODUCT PURPOSE

The product is a **Source of Truth reconciliation harness**.

```text
Configure project authority
        ↓
Define project + sources
        ↓
Enumerate sources once / cache metadata
        ↓
Fingerprint every file + inventory content
        ↓
Change/stillness checks update only deltas
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

Every generation remains traceable backward through project, source, file fingerprints, manifest, dedup decision, approved copy plan, copy execution, verification, and promotion.

---

# 2. GLOBAL UX PRINCIPLES — LOCKED

## 2.1 Fewer clicks without reducing power

The source workflow must optimize for the common job:

**authorize a root once → reuse it indefinitely → inspect/select many folders quickly → create project.**

The operator must not repeatedly authorize or rediscover the same root during the same project or future projects unless the browser/OS has actually revoked access.

## 2.2 Three-panel model remains the reference interaction

The model remains:

1. **Source Drives** — available/persisted roots.
2. **Source(s)** — folders in the current root/scope, with high-efficiency selection tools.
3. **Project** — staged project sources and source notes.

The owner has indicated that a two-panel presentation may be acceptable **only if it preserves the same three logical capabilities with less friction**. This is not permission to remove persistent root reuse or staged-source review.

## 2.3 Orientation must not change the mental model

Portrait and landscape use the **same source-selection semantics and control locations**.

Responsive behavior may compress/collapse panels, but it may not replace the workflow with a different panel-switching mental model solely because orientation changed.

## 2.4 Minimalism = less chrome, not less capability

Required capabilities that may not be removed:

- durable/reusable roots;
- root collapse;
- multi-folder selection;
- Select All / deselect;
- search;
- sort by Name, Size, Last Updated ascending/descending;
- loading/read state;
- source notes;
- full canonical path retention;
- staged-source review;
- operator-resizable panel proportions;
- no redundant rescanning.

## 2.5 Contextual action placement

Primary actions must live adjacent to the thing they act on.

- **Add Selected** belongs in the Source(s) panel header/toolbar or a sticky local action bar immediately attached to that panel.
- **Create Project** belongs outside the source-selection component as the single final page action, visually separated from Add Selected.
- Add Selected and Create Project must never appear adjacent in a way that makes them easy to confuse.

---

# 3. GLOBAL APPLICATION SHELL

## 3.1 Left navigation — locked order

1. **Configuration**
2. **Project Setup**
3. **Fingerprinting**
4. **Database Administration**
5. **SOT Build & Promotion**
6. **Reporting**

## 3.2 Global hamburger — locked

- Permanently fixed top-left.
- Never moves between breakpoints.
- Expands/collapses left navigation.
- Expanded/collapsed state persists.
- Desktop collapsed state is a readable icon rail.
- Mobile uses a readable overlay/drawer.
- No washed-out dark sliver.

---

# 4. CONFIGURATION

Configuration answers: **where does the authoritative project/fingerprint database live and how is it protected?**

## 4.1 Browser/mobile

### Project database

Display:

**Project database**  
`On this device`  
Status: `Ready` / `Not initialized` / `Needs migration` / `Error`

Primary action:

**Initialize / Validate**

Behavior:

- creates IndexedDB automatically if missing;
- validates schema/version/read-write state;
- does not expose fake filesystem paths for IndexedDB.

### Backup / restore

Primary actions:

- **Export backup**
- **Import backup**

No browser directory-read/upload prompt may be used as a backup destination chooser.

## 4.2 WSL

Rows:

**Project database**  
`/path/to/sot.sqlite` `[Choose…]`

**Backup folder**  
`/path/to/backups` `[Choose…]`

Actions:

- **Save & validate** — create if missing, migrate safely, integrity check.
- **Backup now**
- **Restore…**

---

# 5. PROJECT SETUP — BASELINE-SEEKING UX

Project Setup, project definition, and source selection are one flat page.

## 5.1 Project header

Compact row on wide layouts; stacked only when necessary:

- **Project name** — required
- **Project note / description** — optional

Defaults:

- Active = true
- Status = Pending
- created_at = now

No status control during creation.

## 5.2 Source builder — required behavior

### Layout principle

The component must feel like a **compact file-manager workbench**, not a wizard.

Wide reference layout:

```text
┌ Source Drives ─────┬ Source(s) ───────────────────────────────┬ Project ───────────────┐
│ Root               │ /current/path                           │ selected source A      │
│  Local root A      │ [✓ Select all] [Search] [Add Selected]  │ /full/path/...         │
│  Local root B      │ Name  Size  Last Updated                │ note                   │
│  C:                │ ☑ folder A  14 GB  Aug 11               │                        │
│  D:                │ ☑ folder B   8 GB  Aug 09               │ selected source B      │
│  WSL Home          │ ☐ folder C   2 GB  Jul 30               │ /full/path/...         │
│  + Add root        │ ...                                     │                        │
└────────────────────┴──────────────────────────────────────────┴────────────────────────┘
                         [Create Project]  ← outside the builder
```

### Panel 1 — Source Drives

Required:

- First entry is **Root**.
- Root expands/lists every currently known source root.
- Browser-authorized roots are persisted and reappear automatically in future sessions/projects when permission remains valid.
- WSL roots are enumerated from the real server filesystem.
- A root is not forgotten merely because the user leaves Project Setup.
- **+ Add root** is only for granting/adding a previously unknown root.
- Clicking a known root immediately loads its cached folder index into Panel 2.
- Panel 1 has its own collapse/hamburger control.
- Collapse state persists.
- Panel 1 width is compact by default and resizable on capable layouts.

### Persisted root registry

Every known root records at minimum:

```text
root_id
root_type              browser_handle | wsl_path | promoted_sot
label
canonical_locator
permission_state
first_authorized_at
last_opened_at
last_full_scan_at
last_change_check_at
folder_index_version
```

The root registry is part of the authoritative project system, not ephemeral page state.

### Panel 2 — Source(s) — primary work surface

#### Required toolbar

Sticky local toolbar, directly attached to the list:

- breadcrumb/current path;
- Up;
- **Select All** — ON by default when a scope loads;
- Search;
- selection count;
- **Add Selected**.

Add Selected stays near the selection controls, not at the far bottom-right of the overall three-panel component.

#### Required columns

Sticky sortable header:

- **Name** ▲/▼
- **Size** ▲/▼
- **Last Updated** ▲/▼

Search and all three sorts are baseline/table-stakes requirements.

#### Folder rows

Each row:

- checkbox;
- folder name;
- size;
- last updated;
- compact scan-state indicator only when useful.

Click folder name to drill in without changing checkbox state.

#### Select All semantics

- Select All defaults ON for the current folder scope.
- Search is a view filter only; it does not destroy off-filter selections.
- Count remains visible, e.g. `18 of 24 selected`.
- Operator may deselect individual folders.

#### Large-root/loading behavior

The UI must never appear empty while a root is still being read.

States:

- `Opening cached index…`
- `Reading folders…`
- `Calculating size/updated metadata…`
- `Ready`
- `Checking for changes…`
- `Updated — N changes`

Where metadata is still pending, rows may appear progressively with placeholders instead of blocking the whole panel.

### Panel 3 — Project / staged sources

Required:

- heading is current project name, or `Project` if blank;
- source/folder name;
- truncated display path;
- full canonical path retained and inspectable;
- optional source note;
- remove ×;
- duplicate canonical paths prevented.

No duplicate source list elsewhere on Project Setup.

## 5.3 Panel sizing — operator controlled

The default proportions should be materially tighter than the current POC.

Design target for wide layouts:

- Source Drives: **~14–18%** default width.
- Source(s): **~42–50%** default width.
- Project: **~28–34%** default width.

These are starting values, not fixed constraints.

Required:

- draggable separators between panels;
- widths persist;
- overall source-builder height resizable where platform supports it;
- height persists;
- collapsing Source Drives immediately gives its space to Source(s);
- minimum readable widths enforced so a drag cannot make controls unusable.

## 5.4 Portrait and landscape — same workflow

Do not switch to a different interaction model just because the device rotates.

Rules:

- same logical panel order;
- same toolbar locations;
- same Add Selected placement;
- same Create Project placement;
- same selection state;
- same root registry.

On narrow portrait screens:

- Source Drives may begin collapsed to a compact strip/rail;
- Source(s) gets the majority of width;
- Project may use a compact persistent right strip/drawer that can expand without resetting state;
- user can resize where pointer/touch interactions make that practical.

The key requirement is **continuity of the same mental model**, not identical pixel geometry.

## 5.5 Create Project

Single final page action, visually separated from the source-builder Add Selected action.

**Create Project** persists:

- project definition;
- staged sources;
- source notes;
- canonical source locators;
- creation timestamp;
- source registration timestamps;
- active/pending state.

Fingerprinting does not silently start during project creation.

---

# 6. SOURCE INDEXING / CACHE — PAY THE COST ONCE

This is a new locked requirement derived from the owner gate.

## 6.1 Initial root read

The first time a root is authorized/opened, the application may need an expensive enumeration.

During that work:

- show explicit progress/state;
- progressively populate folder rows when possible;
- persist the resulting folder index and metadata.

## 6.2 Subsequent opens

Subsequent Project Setup sessions use the cached root/folder index immediately.

The UI should open from cache first, then run a **stillness/change check** in the background.

Do not block source selection on a full rescan when a valid cached index exists.

## 6.3 Stillness/change check

Goal: determine whether the cached root/folder index is still valid without rereading every file unnecessarily.

The exact adapter-specific algorithm remains an implementation design item, but the required behavior is:

```text
open cached root index immediately
        ↓
cheap change/stillness check
        ↓
no change → keep cached index
        ↓
change detected → enumerate changed scope(s) only
        ↓
update cache + timestamps
```

### Browser/mobile candidate evidence

Where APIs expose it, use combinations of:

- persisted directory handles;
- directory entry names;
- file size;
- file lastModified;
- known counts;
- targeted traversal when a quick check indicates change.

### WSL candidate evidence

Use inexpensive filesystem metadata/change checks where reliable, then targeted rescans. Full rescans are fallback behavior, not the default every time.

## 6.4 Cache invalidation

A full rescan is appropriate when:

- root permission/identity changes;
- persisted handle/path is no longer valid;
- cache schema/version changes;
- stillness evidence is inconsistent;
- operator explicitly requests Full Rescan.

The operator should be able to see `Last indexed` and `Last checked` timestamps for a root.

---

# 7. FINGERPRINTING — FILE-LEVEL, NOT FOLDER-LEVEL

Fingerprinting is the first substantive operation.

## 7.1 Definition

A source folder registration/fingerprint is not sufficient.

The engine must produce **file-level fingerprints/content evidence for every inventoried file** in the selected source scope.

For every file, persist at minimum:

```text
project_token
source_id
relative_path
normalized_relative_path
filename
size
modified_at
created_at              where reliable
inventory_at
fingerprint_version
file_fingerprint
content_hash            when full content hash stage is performed
content_id
```

## 7.2 Fingerprint model v1

The baseline implementation must define a deterministic per-file fingerprint that is materially stronger than path alone.

Fingerprint v1 must include deterministic evidence derived from the file itself and stable metadata. The implementation design must document exactly which bytes/metadata contribute and how the version is encoded.

The fingerprint version is persisted so later algorithms can coexist with historical evidence.

### Required distinction

- **Source identity** answers: is this the same root/source registration?
- **File fingerprint** answers: is this likely/known to be the same file content/evidence?
- **Full content hash** answers exact byte identity for dedup confirmation when required.

These are separate concepts and must not be collapsed into one folder hash.

## 7.3 Source fingerprint summary

A source may also have an aggregate fingerprint/manifest identity derived from its file-level records, but that aggregate is **secondary evidence**. It never replaces per-file fingerprints.

## 7.4 Fingerprinting progress

Progress represents actual files processed in the current fingerprint/inventory run.

Required status data:

- files discovered;
- files fingerprinted;
- bytes observed;
- current source;
- current path/file where practical;
- percent complete when denominator is known;
- start time;
- ETC only when evidence supports it;
- errors;
- checkpoint.

## 7.5 Run semantics

- Pending + Run → start.
- WIP → Run disabled.
- WIP → Stop enabled.
- Stopped + checkpoint → Continue.
- No Restart in baseline unless a distinct destructive restart requirement is proven.

## 7.6 Incremental fingerprint maintenance

After an initial completed fingerprint/inventory run, later runs should reuse unchanged file records and fingerprint only changed/new files when reliable change evidence permits.

Deleted/missing files are recorded as state changes; they are not silently removed from historical evidence.

---

# 8. DEDUP / ANALYSIS / RECOMMENDATION — INSIDE FINGERPRINTING

Available only after prerequisite file-level evidence exists.

## 8.1 Summary

- Raw bytes
- Unique bytes
- Duplicate bytes
- Exact duplicate count
- Conflict count

## 8.2 Duplicate groups

Each group shows:

- exact content identity/hash;
- candidate copies;
- source/path;
- size;
- timestamps;
- recommended survivor;
- operator override when needed.

## 8.3 Different/conflict list

- same-name/different-content;
- path collisions;
- ambiguous canonical choice;
- relevant metadata conflicts.

## 8.4 Recommendation

- canonical surviving set;
- duplicate copies excluded from target copy plan, never deleted from sources;
- unresolved conflicts;
- surviving bytes;
- recommended Target SOT capacity;
- recommended backup capacity.

---

# 9. DATABASE ADMINISTRATION

A practical searchable/sortable CRUD metadata tool.

Required logical tables/views as they exist:

- projects;
- roots;
- sources;
- fingerprints;
- fingerprint_runs;
- inventory_files/manifests;
- duplicate_groups;
- dedup_decisions;
- copy_plans;
- verification;
- sot_generations;
- lineage;
- admin_events.

Required grid functions:

- sort asc/desc;
- search/filter;
- row selection;
- pagination/virtualization;
- mutable-cell editing;
- immutable identities locked;
- soft delete/restore where valid;
- bulk project active/inactive;
- audit events.

No arbitrary SQL console in MVP.

---

# 10. SOT BUILD & PROMOTION

Unchanged governing sequence:

1. Target planning after surviving capacity is known.
2. Generate deterministic copy plan/scripts.
3. Copy-only execution with checkpoints.
4. Verify.
5. Promote verified target.
6. Persist lineage so promoted SOT can become a future source.

---

# 11. REPORTING

Evidence-backed only.

## Project/fingerprint reporting

- project metadata;
- roots and source definitions;
- source notes;
- root cache/index state;
- file fingerprint state;
- run progress/history;
- file/byte totals;
- errors.

## Dedup reporting

- unique/duplicate bytes;
- duplicate groups;
- conflicts;
- recommendation;
- overrides.

## Promotion reporting

- target plan;
- copy plan;
- verification;
- promotion history;
- lineage.

---

# 12. LOGICAL DATA MODEL — ADDITIONS

## 12.1 Root registry

```text
root_id
root_type
label
canonical_locator
permission_state
first_authorized_at
last_opened_at
last_full_scan_at
last_change_check_at
folder_index_version
cache_state
```

## 12.2 Project

```text
project_token
project_name
active
created_at
updated_at
status
current_stage
current_run_id
notes
deleted_at
```

## 12.3 Source

```text
source_id
project_token
root_id
source_type
original_path_or_locator
normalized_path_or_locator
operator_label
operator_note
registered_at
last_seen_at
source_status
parent_sot_generation_id
```

## 12.4 Inventory file / file fingerprint

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
fingerprint_version
file_fingerprint
content_hash
content_id
state
```

## 12.5 Run

```text
run_id
project_token
run_type
started_at
stopped_at
completed_at
status
checkpoint_state
files_discovered
files_processed
bytes_seen
```

---

# 13. RELEASE PLAN — BASELINE-SEEKING EXCEPTION

## One-release exception

For the **next release only**, the existing v0.4.0 POC may be patched forward because there is no accepted baseline to roll back to.

Purpose of this exception:

- converge quickly on the first real baseline;
- reuse plumbing that already works;
- avoid throwing away usable work solely to satisfy a rollback rule that presumes a known-good baseline exists.

This exception expires automatically when the owner accepts the first baseline.

After acceptance, patch-forward from a failed owner gate returns to the graveyard.

## v0.4.1 — Baseline Candidate: Low-Friction Source Selection + File Fingerprinting

This is the next implementation release after design acceptance.

### Scope A — Source Drives / root registry

- persist browser-authorized roots;
- Root lists all currently known/available roots automatically;
- + Add root only for new authorization;
- known root loads from cache without requiring reauthorization;
- root collapse persists;
- compact default Panel 1 width;
- resizable panel separators persist.

### Scope B — Source(s) UX

- cached folders appear immediately when available;
- explicit reading/checking states;
- Select All default ON;
- individual deselect;
- search;
- Name/Size/Last Updated asc/desc sort;
- selection count;
- Add Selected moved adjacent to selection controls;
- second/third selection pass from same root requires no root reopen;
- Add Selected and Create Project are visually separated;
- panel proportions substantially tighter than v0.4.0 POC;
- portrait and landscape preserve the same mental model.

### Scope C — Cache / stillness

- persist root/folder index;
- initial full enumeration once;
- subsequent open uses cache first;
- cheap stillness/change check;
- targeted delta scan when change detected;
- explicit Full Rescan fallback/action;
- Last indexed / Last checked timestamps.

### Scope D — Real file fingerprinting

- enumerate every selected file;
- persist a per-file fingerprint record;
- persist fingerprint algorithm version;
- aggregate source fingerprint may exist only as a secondary summary;
- progress counts actual file fingerprint work;
- Stop preserves checkpoint;
- Continue resumes;
- incremental rerun reuses unchanged file evidence when reliable change data permits.

### Scope E — Database Administration / Reporting

- roots visible in DB admin;
- file fingerprints/manifests visible;
- real file/byte totals;
- fingerprint run history;
- no fake dedup/copy values.

## v0.4.1 automated gates

### Source-selection gates

- previously authorized root survives refresh and reappears under Root without reauthorization;
- clicking known root displays cached folder index before background change check completes;
- explicit loading indicator appears when no cache exists and initial enumeration is running;
- Panel 1 collapse does not reset Panel 2 or Panel 3;
- panel widths persist after reload;
- Select All defaults ON;
- deselect works;
- search preserves off-filter selection state;
- Name sort asc/desc;
- Size sort asc/desc;
- Last Updated sort asc/desc;
- multiple selected folders add in one action;
- repeat selection from same root requires no new authorization;
- Add Selected cannot be confused with Create Project by position/style hierarchy;
- long canonical paths remain intact while visually truncated.

### Cache/stillness gates

- first open with no cache performs full enumeration and persists index;
- second open uses persisted index immediately;
- unchanged root does not trigger full traversal;
- changed root updates only affected scope(s) when supported;
- explicit Full Rescan invalidates/rebuilds cache;
- cache timestamps update correctly.

### File fingerprint gates

- a source containing N files produces N per-file inventory/fingerprint rows unless explicit unreadable/error rows explain exceptions;
- changing one file changes that file's fingerprint evidence without changing unrelated unchanged file fingerprints;
- renaming/moving a file is distinguishable from unchanged path evidence according to documented algorithm semantics;
- file fingerprint version is persisted;
- aggregate source fingerprint cannot pass the gate if per-file fingerprints are absent;
- progress is tied to files actually processed;
- Stop + Continue preserves run/project/source linkage;
- rerun after no changes reuses unchanged file records rather than recomputing every fingerprint where evidence permits.

## v0.4.1 owner/device gates

### Desktop / landscape

- select three folders from one authorized root in a fast, obvious sequence without reopening/reauthorizing the root;
- Add Selected is adjacent to the selection context;
- Create Project is clearly separate;
- resize panel separators and refresh → widths persist;
- collapse Source Drives and refresh → state persists;
- large root shows read/check state rather than looking empty;
- reopening same root is visibly faster and uses cached data.

### Mobile portrait

- same root/source/project mental model as landscape;
- known roots remain available;
- no repeated authorization for the same valid root;
- Source(s) remains the dominant working area;
- search/sort/select-all remain immediately reachable;
- adding sources and creating project are not visually confusable.

### Fingerprinting

- create project from several folders;
- run fingerprinting;
- verify file-level fingerprints exist for files inside those folders;
- observe real progress;
- stop;
- continue;
- rerun unchanged source and confirm reuse/stillness behavior.

---

# 14. DOWNSTREAM RELEASES

## v0.5.0 — Dedup / Analysis / Recommendation

- exact content hashing/confirmation;
- duplicate groups;
- conflicts/different list;
- unique/duplicate byte accounting;
- recommendation;
- capacity planning.

## v0.6.0 — SOT Build Plan + Generated Scripts

- Target SOT + backup target;
- deterministic copy plan/scripts;
- collision-safe destination mapping;
- preflight;
- dry run;
- approved plan persistence.

## v0.7.0 — Copy + Verify

- copy-only execution;
- checkpoint/resume;
- separate copy progress;
- verification;
- corruption/failure handling.

## v0.8.0 — Promote + Lineage

- verified target → promoted SOT generation;
- promoted SOT becomes later source;
- lineage retained/reportable.

## v0.9.0 — Reporting / OpenClaw orchestration expansion

- exports;
- lineage visualization;
- aggregate audit;
- OpenClaw orchestration through deterministic contracts.

## v1.0.0 — MVP hardening

- multi-TB corpus;
- millions-of-files;
- browser persistence/reconnect;
- WSL throughput/locking;
- crash/restart fault injection;
- source-removal/relink;
- corruption mutation;
- owner end-to-end reconciliation.

---

# 15. OPEN TECHNICAL DESIGN ITEMS

These must be resolved during v0.4.1 implementation design, not silently guessed:

- exact per-file fingerprint v1 algorithm and version encoding;
- which browser handle/permission persistence behavior is reliable on target Android Chrome;
- efficient root stillness/change-check strategy in browser mode;
- efficient stillness/change-check strategy in WSL mode;
- folder-size calculation/caching strategy before a complete inventory exists;
- Last Updated definition for folder rows: folder entry mtime vs max descendant mtime vs cached inventory-derived value;
- Select All semantics under search; current recommendation remains all folders in current scope, search as view filter only;
- background metadata loading policy for very large roots;
- browser DB backup package format;
- later exact content-hash strategy/concurrency.

---

# 16. HISTORICAL UX LESSONS FROM EARLIER POCs

The earlier `.4.5` source browser demonstrated several useful interaction qualities that should be preserved even though `.4.5` is not an accepted product baseline:

- a persistent location list beside a persistent browsing area;
- browsing the current root without closing/reopening the selector;
- independently scrollable location/content/review areas;
- a visible current path;
- an Up action that stays available in the browsing context;
- staged selections staying visible while the user continues browsing.

The next baseline candidate should retain those strengths while removing the older modal-heavy/chrome-heavy presentation and adding the required search/sort/cache/file-fingerprint behavior.

---

# 17. OPTIONAL UX IMPROVEMENTS — SUGGESTIONS ONLY

These improve efficiency but do not replace locked requirements:

1. **All | Selected | Unselected** quick filter beside Search.
2. **Recently used roots** remain ordered near the top under Root.
3. **Cache status icon** per root: Cached / Checking / Changed / Permission needed.
4. **Highlight newly changed folders** after a delta refresh.
5. **Double-click/tap behavior:** folder name drills in; checkbox remains explicit selection control.
6. **Panel 3 source count + cached byte estimate** when evidence exists.

---

# 18. LIVE BACKLOG

- schema/version migration tooling for IndexedDB and SQLite;
- browser DB export/import;
- source relink/reconnect;
- tags/sidecar metadata;
- encrypted/sensitive classification;
- historical fingerprint/scan throughput;
- network-share reconnect;
- Android background/sleep interruption handling;
- near-duplicate media analysis after exact dedup;
- lineage visualization;
- cold/warm/hot tier reporting;
- multi-instance SOT support — future only.

---

# 19. SAFETY / DATA INVARIANTS

1. Sources are read-only inputs.
2. Copy-only; no automatic source move/delete.
3. Human validation before physical source retirement.
4. `project_token` immutable; project name mutable.
5. Soft delete preserves lineage/history.
6. UI never invents fingerprint/inventory/dedup/hash/copy evidence.
7. Verification failure blocks promotion.
8. Scan and copy throughput are separate measurements.
9. Promoted SOT lineage survives future reuse as a source.
10. Browser/mobile and WSL share the same logical model.
11. Cached root/folder metadata is optimization evidence, not authority over actual file contents.
12. File-level fingerprints are required; aggregate folder/source fingerprints never substitute for them.

---

# 20. GRAVEYARD — DO NOT REINTRODUCE

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
- **G-017:** patch-forward from a failed owner candidate **after the first accepted baseline exists**.
- **G-018:** losing lineage when promoted SOT becomes a later source.
- **G-019:** requiring browser/mobile migration to WSL before authority.
- **G-020:** disabling browser/mobile DB initialization on GitHub Pages.
- **G-021:** directory-read/upload picker as backup destination selector.
- **G-022:** repeated one-folder-at-a-time native selection replacing reusable root workflow.
- **G-023:** removing multi-folder selection.
- **G-024:** deferring Panel 2 search.
- **G-025:** deferring Name/Size/Last Updated sort.
- **G-026:** generic stage percentage masquerading as fingerprint progress.
- **G-027:** full rescan of an unchanged previously-indexed root on every open.
- **G-028:** treating a folder/source aggregate fingerprint as a substitute for per-file fingerprints.
- **G-029:** portrait-specific workflow that changes the source-selection mental model.
- **G-030:** placing Add Selected and Create Project adjacent or in visually confusable positions.

---

# 21. DESIGN / RELEASE HANDOFF TEMPLATE

Before implementation:

**Design gate:** D0.1  
**Owner decision:** ACCEPT / REVISE / REJECT  
**Locked UX:** explicit  
**File fingerprint algorithm:** documented  
**Cache/stillness strategy:** documented  
**Open design items:** explicit

After coding resumes:

**Release:**  
**Baseline:** POC or accepted baseline explicitly identified  
**One-release exception used:** YES/NO  
**Scope:**  
**Automated gates:** PASS/FAIL  
**Deployment:** exact commit + result  
**Verified test URL:** only after exact served build is verified  
**Owner/device gates:** ordered sequence  
**Known limitations:** explicit  
**Owner result:** PASS / FAIL

---

# 22. DEFINITION OF DONE

The first baseline is DONE only when:

- low-friction source selection passes owner gate;
- known roots persist/reopen without needless reauthorization;
- cached index opens immediately and stillness checking replaces unnecessary full rescans;
- search, all three sorts, Select All/deselect, and multi-folder add are usable and obvious;
- Add Selected and Create Project are clearly separated;
- file-level fingerprints exist for files, not merely folders;
- real fingerprint progress/stop/continue works;
- automated gates pass;
- repository artifact and exact served build are verified;
- owner/device gate passes;
- this document marks that release as the **first accepted baseline**;
- the temporary one-release patch-forward exception is closed.
