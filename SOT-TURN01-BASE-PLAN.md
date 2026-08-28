# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** IMPLEMENTATION AUTHORIZED  
**Date:** 2026-08-28

## Source and target

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`.
- Backend integration source: `integrate-SOT-turn01-base.py` from the accepted Base-3 lineage.
- Target UI: `SOT-turn01-base.html`.
- Target runtime build: `2026.08.28.sot-turn01-base-9`.

## Recovery rule

The Base-4 through Base-8 owner-rejected candidates are evidence only. They are not build inputs. The installer must build directly from the frozen accepted sources above. Wrapper-on-wrapper installer generation is prohibited for this Base.

## Scoped Base delta

1. Project Target and Backup remain constrained to discovered storage volumes/folders; typed arbitrary paths remain prohibited.
2. Windows volume discovery uses absolute Windows PowerShell and is additive with real WSL Windows mounts.
3. Windows-backed WSL mounts are valid only when target, filesystem (`9p` or `drvfs`), and normalized drive source agree. Both `F:` and `F:\\` source forms are equivalent.
4. A mount must be readable before it is reported usable. A stale/broken mount may be remounted through the governed helper.
5. Windows may report removable/offline volumes such as a drive with no medium. Such a volume remains discoverable but is unavailable; its unavailability must not fail the whole Base qualification or suppress later usable drives.
6. Stable fully-indexed projects do not participate in unnecessary three-second project-list/index repaint churn; active jobs still refresh.

## Protected behavior

- Schema remains migration version 4.
- Existing project/index/plan/execute behavior remains unchanged outside the scoped storage and idle-refresh deltas.
- The accepted pre-base remains the recovery anchor.
- The canonical Base filename remains `SOT-turn01-base.html`.
- Automatic runtime rollback remains mandatory if any fatal live gate fails.

## Mechanical gates before owner testing

- Build directly from frozen accepted sources; no rejected candidate or prior generated installer is an input.
- `node --check` final backend and extracted UI JavaScript.
- Temporary copied database/API preflight at schema 4.
- Verify exact runtime build `2026.08.28.sot-turn01-base-9`.
- Verify PowerShell inventory is represented in `/turn01/volumes` even when a volume is unavailable.
- Browse every currently usable discovered drive; unavailable/offline drives are reported and skipped, not release-fatal.
- Verify mount-source normalization and `9p|drvfs` handling.
- Verify idle-refresh suppression markers.
- Archive current live state before cutover.
- On fatal post-cutover failure, restore exact prior API/HTML/helper/sudoers state automatically.

## Owner gate

Owner verifies the canonical Base URL on the actual device: Target/Backup picker exposes the expected usable volumes (especially F: and I: when readable), folder navigation is correct, and completed projects no longer visibly churn. Only after that owner gate passes does Turn 01 advance to `pre-ship`.
