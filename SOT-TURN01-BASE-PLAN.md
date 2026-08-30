# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — BASE-24  
**Date:** 2026-08-30

## Recovery anchor

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Clean Base-22 UI integration source: `integrate-SOT-turn01-base22-ui.py` at commit `603e8a331b13b72a097e9ebb9640e33707279777`.
- Canonical target remains `SOT-turn01-base.html`.
- Base-23 failed before cutover and is evidence only; its generated HTML is prohibited as an implementation input.

## Base-23 qualification failure

Base-23 passed all newly added owner-gate checks but failed `BASE22_ARCHITECTURE_RETAINED — missing 2-copy groups` before installation.

Root cause: its full replacement of `renderIndex` fixed polling/flash behavior but deleted the clean Base-22 completed-state duplicate findings branch. This is recorded in:

- `SOT/archive/2026-08-30-1405-turn01-base23-qualification-failure/ARCHIVE-MANIFEST.md`
- `SOT/archive/2026-08-30-1405-turn01-base23-qualification-failure/GY-010.md`

## Base-24 contract

Base-24 is a clean regeneration from accepted pre-base -> clean Base-22 integration. It must merge, not overwrite, the Base-23 owner-gate corrections.

### Index

- `Queued` / `WIP` / `Paused`: refresh silently without replacing the surface with a Loading placeholder.
- `Closed`: periodic polling does not rerender the Index surface.
- `Closed`: render the protected duplicate outcome immediately:
  - 2-copy groups;
  - 3-copy groups;
  - 4+ copy groups;
  - direct expandable drill-down to groups and files.
- Re-index remains available after completion.

### Plan

- Clearly separate **Current Plan** from **Previous / Stale Plan**.
- Successful generation displays the Current Plan immediately on the Plan tab.
- `no current evidence is available` becomes a persistent inline state with a direct **Re-index now** action, not a transient toast.
- Valid current fingerprint evidence remains sufficient for planning even if Source storage is transiently offline.

### Canonical folder selector

One role-driven selector remains authoritative for Source, Target, Backup, Default Target and Default Backup.

- Available and Selected move semantics remain intact.
- Available Folders has client-side search over cached listing only.
- Available Folders scrolls independently.
- Selected scrolls independently.
- Save/Use action is in the outer modal footer next to Cancel, never inside panel 3.
- Selection/save does not rescan storage.

### Protected Base-22 architecture

Base-24 must retain:

- one shared storage authority and catalog/cache;
- Source/Target/Backup/default selector normalization;
- project creation with Source + Target and default Target/Backup inheritance;
- no manual Preflight UI;
- assignment-time validity;
- Windows-native inventory/capacity/browse with stdin PowerShell transport;
- schema 4 and all existing project data;
- duplicate cardinality endpoint and drill-down;
- rollback-before-cutover discipline.

## Mandatory Base-24 qualification

Named gates must include:

- `INDEX_ACTIVE_REFRESH_NO_LOADING_FLASH`
- `INDEX_COMPLETED_NO_POLL_RERENDER`
- `INDEX_COMPLETED_DUPLICATE_2`
- `INDEX_COMPLETED_DUPLICATE_3`
- `INDEX_COMPLETED_DUPLICATE_4PLUS`
- `INDEX_COMPLETED_DUPLICATE_DRILLDOWN`
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
- all Base-22 canonical selector/cache/default/project-create/storage gates;
- UI/backend syntax, schema 4, public page and rollback gates.

The qualifier must fail before cutover if any protected prior behavior is absent. No planned gate may collapse to generic `UNHANDLED` only.

## Owner gate

After mechanical qualification, owner verifies:

1. completed Index no longer flashes;
2. active Index updates without blank/loading flashes;
3. completed Index still presents expandable 2 / 3 / 4+ duplicate findings;
4. missing-current-evidence Plan state explains recovery and offers Re-index;
5. a generated Current Plan is immediately visible and stale history is clearly secondary;
6. Available and Selected both scroll independently;
7. Available search filters locally without storage rescans;
8. Save sits beside Cancel in the outer selector footer.

Base remains the current stage until all eight pass.
