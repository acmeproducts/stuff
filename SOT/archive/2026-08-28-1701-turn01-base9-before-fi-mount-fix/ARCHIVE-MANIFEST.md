# Turn 01 Base-9 — before F:/I: mount verification correction

Date: 2026-08-28 17:01 PT

## Accepted current runtime
Base-9 completed its clean governed rebuild and remained live:
- build `2026.08.28.sot-turn01-base-9`
- schema 4
- C:, D:, G:, Q: qualified as usable
- E: correctly classified no-media/unavailable without rollback
- F: and I: discovered by Windows but browse returned `visible in Windows but is not mounted in WSL`

## Evidence retained
Earlier WSL evidence showed F:/I: mount sources as `F:\\` / `I:\\` in direct `findmnt -T`, and escaped `F:\\x5c` / `I:\\x5c` in record-oriented `findmnt` output. Existing Base-9 verification normalizes only a literal trailing slash/backslash. This archive precedes correction of that mount-source normalization/verification boundary.

## Governance
Base-9 is the accepted source for this scoped correction. Do not rebuild from or patch a failed candidate. Correct only Windows mount-state interpretation/repair and associated qualification; preserve Base-9 UI and other behavior.
