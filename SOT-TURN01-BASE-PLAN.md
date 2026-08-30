# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE CLEAN REBUILD — BASE-21  
**Date:** 2026-08-30

## Source and target

- Frozen UI source: accepted `SOT-turn01-pre-base.html` at commit `7a377c27e1ac078510b9d1e4fe66da4f997f25f3`, blob `f28d864cdc1ef659f7d47b22958c684aae90e2f7`.
- Frozen backend source: accepted pre-base `sot-api.js` at commit `9422453c180f8fce4e7d5fe362867912dc8005d1`, schema 4.
- Accepted backend integration source: `integrate-SOT-turn01-base.py` at commit `1aebf2624621b08880a595ef9d1f58f2c8cde1b`.
- Target UI: `SOT-turn01-base.html`.
- Base-10 through Base-20 are rejected/static-audit evidence only and prohibited as generated runtime inputs.

## Base-20 owner-gate evidence

Base-20 mechanically qualified: Windows and SOT inventory matched exactly at `C,D,F,I,Q`; all five drives were Windows-readable; pre-cutover and post-cutover Windows-native browse passed; F: returned 9 folders; I: returned 11; folder creation/cleanup passed; copied-DB Target browse persistence passed; schema remained 4.

Owner testing nevertheless failed the Base stage:

1. Target/Backup showed F:/I: but reported zero available space.
2. Target/Backup visibly rescanned/re-probed storage on repeated browse/assignment operations.
3. Existing Sources on F: failed preflight.
4. Source selection omitted F: and I: entirely.

Root cause is architectural split authority: Target/Backup use the corrected `/turn01/volumes` + Windows-native `/turn01/fs` path, while Source still uses legacy `/fs`, whose `roots()` depends on WSL `fs.statSync()` + `mountInfo()` and whose preflight depends on WSL mount equality plus Node `fs.statSync/fs.accessSync`. Base-20 therefore did not actually satisfy the previously declared one-inventory contract.

Failure archive: `SOT/archive/2026-08-30-0248-turn01-base20-owner-failure/ARCHIVE-MANIFEST.md`. Rejected split authority is recorded as GY-007.

## Scoped Base-21 delta

1. **One storage authority for all roles.** Source, Target, Backup, Source preflight, planning validation, and execution validation consume the same Windows-discovered volume identity and the same Windows-native access helpers for Windows-backed paths.
2. **Source picker convergence.** Source selection uses `/turn01/volumes` and `/turn01/fs`; legacy `/fs` is not an authority for Windows source selection.
3. **Source preflight convergence.** A Windows Source under canonical `/mnt/<drive>/...` is validated with Windows-native existence/readability semantics. WSL mount equality must not falsely block a Windows-readable Source.
4. **Windows-native capacity.** Windows drive `free_bytes` and `total_bytes` come from Windows-native volume information, not WSL `statfs` fallback. A readable Windows drive must not show `0 B free` unless Windows itself reports zero.
5. **Stable inventory snapshot.** Dynamic drive discovery occurs at picker open / explicit refresh, not on every folder navigation. Within one picker session the available-volume list is reused while folder browsing changes independently.
6. **Durable browse position.** Target and Backup keep their persisted browse roots. Source picker also reopens at a valid current/assigned Source location rather than returning blindly to `/`.
7. **Direct clean generation.** Base-21 is generated from frozen accepted sources/clean Base-3 only; Base-20 generated runtime is not an implementation input.
8. **Deterministic stdin transport remains.** WSL→Windows dynamic values continue to use stdin; rejected `$args[]` and implicit `$env:SOT_*` transport stay absent.
9. Stable fully-indexed projects retain idle-refresh suppression.

## Protected behavior

- Schema remains migration version 4.
- Existing project/index/plan/execute behavior remains unchanged outside the storage/source convergence delta.
- Accepted pre-base remains the recovery anchor.
- Canonical Base filename remains `SOT-turn01-base.html`.
- No arbitrary typed Source/Target/Backup path is introduced.
- Target and Backup remain project-owned settings.
- Automatic runtime rollback remains mandatory after fatal post-cutover failure.
- No machine-level WSL/Windows configuration changes are required.

## Mandatory Base-21 qualification

Before owner testing, qualification must persist named PASS/FAIL evidence for all existing Base-20 mechanical gates plus the following new gates:

- `SOURCE_DESTINATION_INVENTORY_CONTRACT`: Source picker and destination picker both use `/turn01/volumes` + `/turn01/fs`.
- `LEGACY_SOURCE_WINDOWS_AUTHORITY_ABSENT`: Source picker does not use legacy `/fs` for Windows volume discovery/browse.
- `WINDOWS_CAPACITY_<drive>` for every discovered Windows drive: Windows-native total/free bytes are numeric and, for readable normal volumes, not fabricated from failed WSL statfs.
- `INVENTORY_SNAPSHOT_REUSE`: folder navigation in the generated UI does not call `/turn01/volumes` again on each browse; inventory is loaded once per picker session unless explicitly refreshed.
- `SOURCE_PREFLIGHT_F` and `SOURCE_PREFLIGHT_I` when those drives are Windows-readable: use a copied DB/test export or non-mutating helper proof to demonstrate a valid canonical Source path on each drive receives ready/nonblocking validation.
- `EXISTING_SOURCE_PREFLIGHT`: for existing active Sources whose Windows drive is currently readable, preflight may not fail solely because WSL mount metadata/stat access differs.
- `SOURCE_PICKER_F` / `SOURCE_PICKER_I`: mechanically prove those drives appear in the Source picker inventory when present in Windows inventory.
- Target/Backup capacity display contract must consume the corrected `free_bytes` values.
- Source initial browse behavior must restore/reuse an assigned Source location when valid.

Existing required gates remain: clean-source identity; schema 4; backend/UI syntax; stdin transport; direct browse of every Windows-readable drive; F:/I: browse; folder create/delete; copied-DB Target/Backup browse persistence; exact Windows/SOT inventory match; storage endpoint; public page; pre-cutover archive; automatic rollback.

No planned gate may fail only as generic `UNHANDLED`.

## Owner gate

Only after Base-21 mechanically qualifies does owner testing resume. Owner verifies:

1. Source, Target and Backup all expose the same live drive inventory including F:/I:.
2. Existing F:/I: Sources pass preflight when Windows can read them.
3. Selecting Source from F:/I: works and remains available when reopened.
4. Target/Backup show credible Windows free space rather than zero.
5. Navigating folders does not visibly rescan/remount the entire drive inventory on each action.
6. Target/Backup browse position persistence remains intact.

Base remains the current stage until all six pass.
