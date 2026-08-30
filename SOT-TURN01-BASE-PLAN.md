# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — BASE-22  
**Date:** 2026-08-30

## Source and recovery anchor

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`, blob `f28d864cdc1ef659f7d47b22958c684aae90e2f7`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Accepted backend integration source: `integrate-SOT-turn01-base.py` at commit `1aebf2624621b08880a595ef9d1f58f2c8cde1b`.
- Canonical target UI remains `SOT-turn01-base.html`.
- Base-10 through Base-21 are rejected/static-audit/owner-gate evidence only and are prohibited as generated runtime inputs.

## Base-21 owner-gate evidence

Base-21 mechanically proved the unified Windows storage authority, F:/I: Source visibility/preflight, Windows-native capacity, all-drive browse, folder creation and schema integrity. Owner testing nevertheless rejected the product interaction model.

Observed owner failures:

1. saving a Source selection is unacceptably slow because selection/save still causes unnecessary live-storage work instead of behaving as a metadata operation against cached inventory/folder state;
2. the 3-panel selector does not implement move semantics — selecting a folder should remove it from Available and place it in Selected; removing it from Selected should restore it to Available;
3. Source and Target/Backup still have separate picker implementations instead of one canonical role-driven component;
4. project creation does not define Source and Target as part of creating the project;
5. global default Target and Backup are not first-class configuration inherited by new projects with project-level override;
6. manual operator `Run preflight` is rejected; invalid assignments should be blocked at assignment time and live-storage availability should be checked only when the operation actually requires storage;
7. plan generation from already-fingerprinted evidence must not be blocked merely because a Source volume is currently offline;
8. fingerprint results do not immediately expose useful duplicate cardinality summaries and drill-down;
9. the Scope/analysis layout exposes too much ceremony rather than progressively disclosing only the controls/data required for the immediate task.

Failure archive: `SOT/archive/2026-08-30-0352-turn01-base21-owner-rejection/ARCHIVE-MANIFEST.md`.

## Base-22 architectural contract

### 1. One canonical folder selector

There is exactly one folder-selection/creation component used for:

- project Source selection;
- project Target selection;
- project Backup selection;
- default Target configuration;
- default Backup configuration.

The component is role-configured rather than forked. It consumes the same inventory/cache and the same folder metadata model for every role.

Canonical 3-panel behavior:

- **Volumes** — cached discovered volume list and Windows-native free/total capacity;
- **Available folders** — folders at the current browsed location that are not already selected for the current role;
- **Selected** — current assignment set/choice.

Selection uses move semantics: selecting a folder immediately removes it from Available and adds it to Selected. Removing it from Selected immediately restores it to Available when it belongs to the current browsed location. Source allows multiple selected folders. Target and Backup allow exactly one selected folder each. Folder creation uses the same component and immediately exposes/selects the created folder according to role.

### 2. Storage catalog/cache

Storage discovery and folder enumeration are treated as a catalog, not repeated ad-hoc probes.

- Volume inventory is cached centrally in the SOT runtime and shared by all projects and all picker roles.
- Folder listings are cached by canonical path.
- Opening another Source/Target/Backup picker reuses cached inventory/listings.
- Selecting/removing a folder never triggers a storage rescan.
- Saving assignments never triggers a storage rescan.
- Cache invalidation occurs only for an explicit refresh, a known folder create/delete, or an operation-boundary access failure that proves cached state stale.
- Folder creation updates the relevant cached parent listing immediately.
- The UI may show a compact Refresh control; refresh is operator-directed, not implicit navigation behavior.

### 3. Assignment-time validity, not manual preflight

The operator-facing `Run preflight` control is removed.

A Source/Target/Backup assignment may be saved only when the canonical selector/backend has already proven that selected path exists and is valid for the requested role at that moment. Bad data does not enter project configuration.

After assignment:

- Source availability is checked when fingerprint/index actually reads the Source;
- Target/Backup availability is checked when an execution operation actually needs to read/write them;
- plan generation from existing fingerprinted evidence does **not** require Source volumes to remain online merely to reason over stored evidence;
- plan generation may require Target/Backup configuration metadata, but does not perform redundant live-storage validation unless the plan step itself needs current filesystem facts;
- execution revalidates every live path it will use immediately before mutation.

### 4. Project creation is a complete setup transaction

`+ Project` opens one setup flow containing:

1. project name;
2. Source selection using the canonical selector;
3. Target selection, prefilled from global default Target when configured;
4. Backup selection, prefilled from global default Backup when configured;
5. Create Project.

Create is disabled until project name, at least one Source, and one Target are valid. Backup follows global policy: inherit default when configured; otherwise project creation may leave Backup unset only if the governing execution contract explicitly permits it. Existing target/backup non-nesting constraints remain.

The backend creation workflow must commit project + Source assignments + project storage settings as one logical operation: on failure, do not leave a half-configured project visible to the operator.

### 5. Global default Target / Backup

Configuration contains **Default Target** and **Default Backup**, each selected through the canonical folder selector. They use the same dynamically discovered storage catalog as project assignments.

Defaults are templates for new projects, not shared mutable project state. A project receives concrete project-owned Target/Backup values at creation. Later changes to defaults do not silently rewrite existing projects.

### 6. Project Scope surface

Scope becomes a compact configuration summary rather than a workflow step full of ceremony:

- Sources — concise selected-folder list + Edit;
- Target — selected destination + Edit;
- Backup — selected destination + Edit;
- no manual Preflight button;
- no redundant storage analysis text.

Edits reopen the same canonical selector component.

### 7. Fingerprint/index outcome leads directly to useful findings

When a scan/fingerprint run has completed, the primary result surface immediately presents duplicate cardinality:

- **2 copies** — number of duplicate groups containing exactly two files;
- **3 copies** — number of duplicate groups containing exactly three files;
- **4+ copies** — number of duplicate groups containing four or more files.

Each metric is directly expandable/drillable to the duplicate groups in that bucket, and each group expands to the underlying file paths/records. The first useful post-scan result must be visible without navigating through a generic analysis dashboard.

### 8. Progressive disclosure

The Base UI favors task completion over exposing architecture. Only data/actions needed for the current task are primary. Diagnostics, implementation metadata and deeper analysis remain available behind secondary/detail surfaces rather than occupying the main project workflow.

## Protected behavior

- Schema remains migration version 4 unless a schema change is absolutely required; prefer existing `settings`, source and evidence tables for Base-22.
- Existing project/index/fingerprint/plan/execute semantics remain unchanged except where explicitly superseded above.
- Windows-native stdin transport remains the cross-boundary mechanism; rejected `$args[]` and implicit `$env:SOT_*` transports stay absent.
- One Windows-discovered storage authority remains mandatory.
- No arbitrary typed filesystem paths.
- Target/Backup remain project-owned concrete settings.
- Existing project data is preserved.
- Failed Base-21 generated runtime is not an implementation input.
- Automatic rollback after fatal post-cutover qualification failure remains mandatory.

## Mandatory Base-22 qualification

Qualification must produce named evidence for the prior unified-storage gates plus:

- `CANONICAL_SELECTOR_SINGLE_IMPL`: Source, Target, Backup and defaults invoke the same selector implementation.
- `SELECTOR_MOVE_SOURCE`: Source add removes item from Available; Source remove restores it.
- `SELECTOR_MOVE_TARGET`: Target selection uses the same move semantics with single-select constraint.
- `SELECTOR_MOVE_BACKUP`: Backup selection uses the same move semantics with single-select constraint.
- `CATALOG_CACHE_REUSE`: repeated picker opens and folder navigation do not rediscover volumes or re-enumerate an already-cached unchanged folder.
- `SAVE_NO_RESCAN`: saving Source/Target/Backup assignments does not invoke drive discovery/folder enumeration.
- `ASSIGNMENT_VALIDATION`: invalid/nonexistent paths cannot be committed.
- `MANUAL_PREFLIGHT_ABSENT`: no operator-facing Run preflight control remains.
- `PLAN_OFFLINE_SOURCE_INDEPENDENCE`: with current fingerprinted evidence, plan generation does not fail solely because an assigned Source volume is unavailable.
- `PROJECT_CREATE_COMPLETE`: create flow requires name + Source + Target and commits a complete configured project.
- `DEFAULT_TARGET_INHERITANCE`: new project receives the configured default Target unless explicitly overridden.
- `DEFAULT_BACKUP_INHERITANCE`: new project receives configured default Backup unless explicitly overridden/allowed unset by policy.
- `DEFAULT_CHANGE_NON_RETROACTIVE`: changing defaults does not mutate existing project assignments.
- `DUPLICATE_CARDINALITY_2`, `DUPLICATE_CARDINALITY_3`, `DUPLICATE_CARDINALITY_4PLUS`: counts reconcile to stored fingerprint/evidence data.
- `DUPLICATE_DRILLDOWN`: each bucket exposes underlying groups and group files.
- backend/UI syntax, schema 4, Windows inventory/capacity, F:/I: browse, folder create, existing Source compatibility, public page and rollback gates remain required.

No planned gate may fail only as generic `UNHANDLED`.

## Owner gate

Only after Base-22 mechanically qualifies does owner testing resume. Owner verifies:

1. one visibly consistent selector behavior for Source/Target/Backup;
2. move-between-Available-and-Selected semantics in both directions;
3. near-immediate Source save with no repeated volume/folder rescans;
4. project creation includes Source + Target and sensibly inherits default Target/Backup;
5. no manual preflight ceremony;
6. completed fingerprinting immediately yields expandable 2-copy / 3-copy / 4+-copy duplicate summaries;
7. the project surface is materially simpler and progressively disclosed.

Base remains the current stage until all seven pass.
