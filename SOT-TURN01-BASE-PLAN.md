# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — BASE-23  
**Date:** 2026-08-30

## Recovery anchor

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Accepted backend integration source: `integrate-SOT-turn01-base.py` at commit `1aebf2624621b08880a595ef9d1f58f2c8cde1b`.
- Base-10 through Base-22 are rejected/static-audit/owner-gate evidence only and must not be used as installed-runtime implementation ancestors.
- Canonical target remains `SOT-turn01-base.html`.

## Base-22 owner-gate evidence

Base-22 mechanically qualified but failed owner testing after installation.

Observed failures:

1. completed Index flashes because periodic polling invokes the full loading/render path even when no index work is active;
2. Plan generation can return `no current evidence is available` while stale plan rows remain visible, producing an ambiguous state with no persistent explanation or recovery path;
3. the Plan surface does not clearly identify where a successfully generated current plan lives versus historical/stale plan evidence;
4. Available Folders in the canonical selector cannot be scrolled reliably for long folder lists;
5. Available Folders needs a local search/filter field;
6. Selected needs independent scrolling;
7. the selector Save action belongs in the outer modal footer next to Cancel rather than inside the Selected pane.

Failure archive: `SOT/archive/2026-08-30-1337-turn01-base22-owner-rejection/ARCHIVE-MANIFEST.md`.
Rejected UX/state pattern: `SOT/archive/2026-08-30-1337-turn01-base22-owner-rejection/GY-009.md`.

## Base-23 contract

### 1. Stable completed Index

Index polling is activity-driven, not tab-driven.

- While the current fingerprint/index state is `Queued`, `WIP`, or `Paused`, refresh status without replacing the entire surface with a Loading placeholder.
- Once state is `Closed`, the Index surface is stable and periodic polling stops rerendering it.
- Explicit actions such as Start, Continue, Pause, Stop, Re-index, or project/source mutation may refresh it.
- Qualification must prove that the periodic timer cannot call the destructive full Index render for a completed project.

### 2. Plan state must be explicit

The Plan surface has two concepts and must label them separately:

- **Current Plan** — the plan whose evidence revision matches the project's current evidence revision and whose state is actionable (`draft`, `executing`, `complete` as appropriate).
- **Previous / Stale Plan** — retained historical plan evidence that is not executable for the current project evidence revision.

A stale plan must never visually masquerade as the current plan.

When `Generate current plan` succeeds:

- the returned plan becomes the clearly labeled Current Plan immediately on the same surface;
- its state, evidence revision, totals and items are visible there;
- no navigation hunt is required.

When generation fails because current fingerprint evidence is missing:

- render a persistent inline explanation: current fingerprint evidence is unavailable for the current scope;
- provide a direct **Re-index now** action;
- retain any previous/stale plan only under a clearly secondary Previous Plan section;
- do not rely on a short-lived toast as the only error communication.

### 3. Current evidence meaning

The UI must treat `no current evidence is available` as a data-state condition, not an opaque backend error.

It means the current project scope has no usable `current_observations` from a completed fingerprint run. Commonly this occurs after Source/scope changes invalidate the prior evidence. Recovery is a new fingerprint/index run for the current scope.

Plan generation from valid current fingerprint evidence remains independent of transient Source availability, as established in Base-22. Base-23 does not reintroduce Source preflight into planning.

### 4. Canonical selector scroll contract

The one canonical folder selector remains mandatory for Source, Target, Backup, Default Target and Default Backup.

For desktop layout:

- modal body and `.picker3` have bounded height;
- each pane is a min-height-zero flex column;
- Available Folders has a fixed header/search/path region plus an independently scrollable folder list;
- Selected has a fixed header plus an independently scrollable selected list;
- long content must never expand a pane beyond the modal and steal scrolling from adjacent panes.

Mobile may stack panes, but each long list still remains usable.

### 5. Available-folder search

Available Folders has a search field directly below its heading.

- filtering is client-side over the already cached current folder listing;
- typing does not call `/turn01/fs`, rediscover volumes, or refresh the storage catalog;
- clearing search restores the full cached Available list;
- selected folders remain excluded from Available regardless of filter.

### 6. Outer modal footer owns commit

The canonical selector modal footer contains, in order:

- Cancel
- role-specific commit button: `Save Sources`, `Save Target`, `Save Backup`, `Use Default Target`, or `Use Default Backup`.

The commit button is never embedded in panel 3. The Selected pane contains only selected items and role-relevant folder creation/removal controls.

### 7. Existing Base-22 architecture retained by clean regeneration

Base-23 must preserve, while regenerating from frozen accepted sources rather than installed Base-22 runtime:

- one canonical role-driven selector;
- Available ↔ Selected move semantics;
- central cached volume/folder catalog;
- save-without-rescan behavior;
- assignment-time validity and no manual Preflight;
- project creation with Source + Target and default Target/Backup inheritance;
- evidence-only planning independent of transient Source availability;
- duplicate 2 / 3 / 4+ summary and drill-down;
- Windows-native shared storage authority and capacity;
- stdin PowerShell transport;
- schema 4 and existing project data.

## Mandatory Base-23 qualification

Before owner testing, qualification must persist named PASS/FAIL evidence for:

- `INDEX_COMPLETED_NO_POLL_RERENDER`
- `INDEX_ACTIVE_REFRESH_NO_LOADING_FLASH`
- `PLAN_CURRENT_STALE_SEPARATION`
- `PLAN_GENERATE_SUCCESS_VISIBLE_CURRENT`
- `PLAN_NO_EVIDENCE_PERSISTENT_RECOVERY`
- `PLAN_REINDEX_ACTION`
- `AVAILABLE_PANEL_SCROLL`
- `SELECTED_PANEL_SCROLL`
- `AVAILABLE_SEARCH_PRESENT`
- `AVAILABLE_SEARCH_LOCAL_ONLY`
- `SELECTOR_COMMIT_IN_MODAL_FOOTER`
- `SELECTOR_COMMIT_NOT_IN_PANEL3`
- all Base-22 storage/cache/move/default/project-create/offline-plan/duplicate gates;
- backend/UI syntax, schema 4, Windows inventory/capacity, F:/I: browse, folder create, public page and rollback gates.

No planned gate may fail only as generic `UNHANDLED`.

## Owner gate

Only after Base-23 mechanically qualifies does owner testing resume. Owner verifies:

1. completed Index no longer flashes;
2. active Index updates without disruptive blank/loading flashes;
3. failed plan generation explains the missing-current-evidence condition and offers Re-index;
4. a successfully generated plan is obviously visible as Current Plan on the Plan tab;
5. stale plan evidence is visually secondary and clearly non-executable;
6. Available Folders and Selected both scroll independently;
7. Available Folders search filters immediately without storage rescans;
8. Save sits beside Cancel in the outer modal footer for Source/Target/Backup/default selection.

Base remains the current stage until all eight pass.
