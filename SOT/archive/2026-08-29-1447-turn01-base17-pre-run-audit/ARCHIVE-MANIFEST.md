# Turn 01 Base-17 Pre-Run Audit Archive

**Stage:** Turn 01 -> Base rebuild  
**Date:** 2026-08-29  
**Installer blob before final audit correction:** `356fe0c81275711d94c8ad7d7e8a2adea43a219f`

Base-17 had not been run. Final static review found two remaining qualification-harness gaps:

1. Windows inventory accepted a successful but empty `Get-PSDrive` result. Because the PowerShell executable itself is on C:, qualification must reject an empty Windows filesystem inventory and require C: to be represented.
2. The inventory comparison only rejected Windows drives missing from SOT. It did not reject extra stale SOT drive entries. The governed dynamic-inventory contract requires the Windows filesystem drive set and SOT drive set to match exactly at qualification time.

These are qualification-harness corrections only. The product candidate remains generated from the same frozen accepted pre-base/Base-3 lineage and no Base-17 generated runtime artifact exists or is used as an input.
