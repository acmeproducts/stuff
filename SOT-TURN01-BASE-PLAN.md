# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD  
**Date:** 2026-08-29

## Source and target

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`, blob `f28d864cdc1ef659f7d47b22958c684aae90e2f7`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Target UI: `SOT-turn01-base.html`.
- Base-10, Base-11 and Base-12 are rejected evidence only and are prohibited as generated build inputs.

## Owner evidence from Base-12

Base-12 mechanically proved that Windows and SOT discovered the same drive letters (`C,D,F,I,Q`) but failed owner testing:

1. `F:` and `I:` appeared as volumes but their folder/data contents were not visible in the picker.
2. The currently selected available volume/current folder was not durable; reopening/rerendering the picker lost that navigation context.

Base-12 is therefore not a baseline. The next Base is rebuilt from the frozen accepted sources above.

## Scoped Base delta

1. **One dynamic inventory.** Source, Target and Backup use the same Windows-discovered volume inventory.
2. **Windows-native folder enumeration.** For a discovered Windows drive, folder browsing must use Windows-native filesystem access when Node/WSL cannot enumerate `/mnt/<drive>`. A discovered drive must not become an empty/unusable picker merely because the WSL view is broken.
3. **Canonical logical paths.** The backend owns translation between the UI's canonical path and Windows-native paths. The UI does not implement drive translation.
4. **Durable picker position.** For each project and destination role, persist the current browsed volume/folder in the SOT database/settings. Reopening the picker restores that location when still available. Saved Target/Backup remains separate from browse position.
5. **Operation-boundary validation.** Actual read/write/index/execute work still validates access when the operation requires it and returns an explicit error if unavailable. Discovery and navigation are not silently suppressed by a secondary WSL heuristic.
6. Stable fully-indexed projects retain the existing idle-refresh suppression behavior.

## Protected behavior

- Schema remains migration version 4.
- Existing project/index/plan/execute behavior remains unchanged outside the scoped storage/picker delta.
- The accepted pre-base remains the recovery anchor.
- Canonical Base filename remains `SOT-turn01-base.html`.
- No typed arbitrary Target/Backup path.
- Automatic runtime rollback remains mandatory if any fatal live gate fails.

## Mechanical gates before owner testing

- Build directly from frozen accepted UI/backend sources; no Base-10/Base-11/Base-12 generated candidate is an input.
- `node --check` the final backend and extracted UI JavaScript.
- Temporary copied database/API preflight at schema 4.
- Verify every Windows-discovered drive is represented in `/turn01/volumes`.
- For every Windows-readable discovered drive, call the Base folder API and require HTTP 200; an empty drive may return zero folders but not an access/mount rejection.
- Verify picker browse-state PUT/GET round-trip in the temporary database, then restore the original value.
- Verify Target/Backup continue to use the same `/turn01/volumes` inventory.
- Archive current live state before cutover.
- On fatal post-cutover failure, restore exact prior API/HTML state automatically.

## Owner gate

Owner verifies the canonical Base URL on the actual device: F: and I: data/folders are visible when Windows can read them, and reopening the picker restores the last browsed volume/folder. Base remains the current stage until that passes.
