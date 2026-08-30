# Turn 01 Base-21 Owner Rejection Archive

**Stage:** `base`  
**Candidate:** `2026.08.30.sot-turn01-base-21`  
**Decision:** REJECTED at owner gate  
**Date:** 2026-08-30 03:52 PDT

## Mechanical state before rejection

Base-21 mechanically qualified and proved the unified Windows inventory/access layer: `C,D,F,I,Q`; Windows-native capacity; Source/Target/Backup common volume discovery; F:/I: Source preflight; existing Windows-backed Source preflight; all-drive browse; folder create/delete; schema 4; canonical page health.

Mechanical qualification did **not** establish that the interaction model was acceptable.

## Owner-gate failures

1. **Source save is unacceptably slow.** Adding a folder from F: and saving Sources to a project sits waiting instead of behaving as a metadata update. The product is repeatedly reaching back to live storage where it should consume cached inventory/folder metadata and only refresh on additions/deletions or explicit refresh.
2. **Folder selection semantics are wrong.** In a 3-panel selector, choosing a folder from the available-folder pane must move it to the selected pane and remove it from available; removing it from selected must immediately restore it to available. This must be identical for Source and destination selection.
3. **Separate Source and Target/Backup picker implementations are rejected.** There must be one canonical folder-selection/creation component with role configuration, not parallel surfaces that drift.
4. **Project creation is incomplete.** A project is not valid until Source and Target are defined during creation. Target Backup should also be resolved from defaults/override policy rather than deferred to a later manual Scope step.
5. **Global defaults are missing.** Configuration must support default Target and default Backup. New projects inherit those defaults and may override them during creation or later project editing.
6. **Manual preflight UX is rejected.** Bad path assignments should be prevented at selection/save time. A separate operator-facing `Run preflight` motion is unnecessary. Runtime availability matters when fingerprinting/indexing reads Sources or when execution reads/writes storage; plan generation from already-fingerprinted evidence must not be blocked by a transient dropped volume unless the planned operation actually requires live storage at that moment.
7. **Post-scan insight hierarchy is weak.** Fingerprinting/indexing should immediately summarize duplicate-group cardinality: groups with exactly 2 copies, exactly 3 copies, and 4+ copies. Each summary is directly expandable/drillable to the underlying groups/files.
8. **Overall UI hierarchy adds friction.** Analysis/state should be progressive-disclosure: expose only what the operator needs for the immediate task; remove redundant ceremony and separate configuration motions.

## Governance consequence

Base-21 is failed owner-gate evidence and is not an implementation baseline. Do not patch its generated runtime forward.

The next candidate must return to the frozen accepted pre-base / clean Base-3 lineage, update the graveyard and Base plan first, then build a clean Base candidate implementing the normalized storage-selection and project-creation contract.
