# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** R7 IN IMPLEMENTATION — SSOT ACTION SURFACE + IN-PICKER DESTINATION CREATION  
**Date:** 2026-09-05

## Recovery anchors

- Frozen pre-base UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`.
- Qualified coordination/backend foundation: `b58920f014960c9b18b705a0fdcf0406c621fd5f`, backend build `2026.09.03.sot-turn01-coordination-2`, schema 5.
- Accepted R6 SSOT/action UI: `7dc9bc7b3402633bb82601b5123280dca74b57bd/SOT-turn01-base-r6.html`.
- R6 live owner qualification: installer RC=0 on 2026-09-05; public SHA256 `1975ca5d97dc84733d0c239d1ea74ccf17764abada31b0df9e2c22a13cd23006`.
- GY-024 records the R6 destination-picker limitation: Target/Backup could select only existing folders.
- Canonical host target remains `SOT/SOT-turn01-base.html`; `install-SOT-turn01-base.sh` remains the only active Base installer.

## Governance

1. Failed/rejected generated HTML is evidence only and never an implementation ancestor.
2. R6 is an accepted owner-test baseline. R7 is a direct source revision of R6 for the explicitly requested destination-creation capability.
3. Preserve the qualified backend coordination foundation; do not redesign or patch unrelated backend lifecycle behavior for this change.
4. Before every governed write, fetch current `main` and the current target-file blob SHA. Preserve unrelated repository work.
5. Host cutover must archive the previous SOT UI and roll back automatically if live/public qualification fails.
6. Owner testing begins only after the installer passes live backend/schema/database/UI/public-byte gates.

## Product hierarchy

### SSOT — installation-wide truth

The SSOT overview reconciles all project SOTs and answers: what storage exists, what has been indexed, what is protected, what needs attention, and what direct action is next.

### Project SOT — durable project truth

Each project has one continuous operational surface and visible lifecycle:

`Setup → Index → Review → Plan → Protect → Verify`

Completed durable state remains visible while temporary operations run. A transient error never replaces committed evidence truth.

### Action model

Every actionable problem must state:

`what is true → what is missing/wrong → what happens next → direct corrective action`

Raw machine errors belong in Activity / diagnostics.

## R7 destination-definition contract

Target and Backup are managed destinations, not pre-existing-folder references. Their picker must therefore support creation directly:

1. Browse discovered Windows/WSL volumes and folders using the existing shared storage authority.
2. For `Target` and `Backup`, show **New folder** in the currently browsed directory.
3. Prompt for one folder name; reject empty names, `.` / `..`, path separators, and invalid backend names.
4. Create through the already-qualified backend endpoint `POST /turn01/fs/folder` with `{parent,name}`. Do not add a second filesystem implementation.
5. On success, refresh/enter the returned folder and automatically make it the selected Target/Backup candidate.
6. Operator then saves the destination normally.
7. Failure remains inside the picker with a plain corrective message; the picker stays open and retains the current browse location.
8. Source picker remains selection-only; do not create empty Source folders.
9. Background polling must not close the picker, clear the new-folder input, reset browse location, or change selected destination.

## Base product contract retained

- Stable completed Index and committed evidence revision.
- 2-copy / 3-copy / 4+ duplicate findings.
- Current versus stale Plan truth bound to exact committed evidence revision.
- Shared Source/Target/Backup storage inventory and picker semantics.
- Dynamic Windows volume inventory.
- Target/Backup destination creation from within the picker.
- Responsive UI during work; operator-owned selection, disclosure, modal, search, focus and scroll state.
- Cross-project concurrency with one state-mutating operation owner per project.
- Atomic replacement-index cutover; failed/cancelled re-index cannot destroy current evidence.
- Durable Activity / diagnostics.
- Installation-wide SSOT management view plus independent project SOT surfaces.

## R7 qualification gates

Before owner handoff the exact R7 candidate must pass:

1. JavaScript parse.
2. R6 SSOT/action/product markers remain present.
3. Target picker contains `New folder`; Backup picker contains the same capability; Source picker does not offer destination creation.
4. UI calls only `POST /turn01/fs/folder` for folder creation.
5. Created-folder response is entered and selected immediately.
6. Picker remains open on folder-create failure and displays an actionable error.
7. Existing 3-second polling path does not rebuild/close the modal or mutate picker-owned state.
8. Live backend remains build `2026.09.03.sot-turn01-coordination-2`, schema 5, with qualified coordination capabilities.
9. Database integrity passes before and after cutover.
10. Public served UI is byte-identical to the qualified R7 UI.
11. Installer rollback restores prior R6 UI if any post-cutover gate fails.

## Handoff

After gates 1–11 pass, the canonical installer prints the cache-busted owner-test URL. No alternate preview host is used.