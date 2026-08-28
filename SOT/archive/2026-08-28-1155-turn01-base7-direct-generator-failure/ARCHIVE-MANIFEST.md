# SOT Turn 01 Base-7 direct generator failure archive

Timestamp: 2026-08-28 11:55 PT

Failure occurred before live cutover while generating the Base-7 installer from the frozen Base-3 installer.

Observed owner output:

`live API build gate changed unexpectedly: found 2`

Frozen failed installer commit: `f11703da767d3dfab3d0a8c80353478beec11f83`

Root cause: the frozen Base-3 installer contains the same live/volume build assertion twice. The direct generator incorrectly treated the first occurrence as unique and attempted sequential one-at-a-time replacement.

No failed candidate is promoted as a baseline. Rebuild remains anchored to the accepted pre-base/Base-3 lineage.
