# SOT Turn 01 Base — failed Base-8 wrapper lineage retired

Date: 2026-08-28

## Accepted rollback state
The owner run of the Base-8 candidate automatically restored the live runtime to build `2026.08.27.sot-turn01-base-2`, schema 4. No failed Base-8 candidate was accepted.

## Failed evidence
- `531d4697b39c03ec4e17740092ff21b99645b283`: generated Base-8 but stopped on a brittle post-build grep before cutover.
- `36606aa8cdeae5a7db4ee70182e434aba39608f7`: reached live qualification, then incorrectly treated unavailable E: (`no medium found`) as fatal and rolled back.
- `06ebdccf925f52651bb967b8f48373283bd0f13e`: wrapper-on-wrapper attempt failed before cutover with `Base-8 browse failure gate changed unexpectedly: found 0`.

## Runtime evidence
Windows reports C,D,E,F,G,I,Q. WSL reported C,D,F,I as 9p mounts. F and I used mount source form `F:\\` / `I:\\` and were unreadable at the time (`Invalid argument`). E: was present in Windows inventory but had no medium.

## Governance decision
Retire wrapper-on-wrapper installer generation. The replacement installer is rebuilt directly from the frozen Base-3 installer/source lineage and applies the governed backend/UI deltas directly. Unavailable Windows volumes remain discoverable but are not fatal to qualification; usable volumes must browse successfully. Failed candidates are not runtime baselines.
