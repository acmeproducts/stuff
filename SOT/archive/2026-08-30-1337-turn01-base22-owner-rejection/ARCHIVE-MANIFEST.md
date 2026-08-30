# Turn 01 Base-22 Owner Rejection

**Stage:** `base`
**Status:** REJECTED — OWNER GATE
**Date:** 2026-08-30

Base-22 mechanically qualified at 2026-08-30 13:13 PDT, then failed owner testing. It is evidence only and must not become the implementation baseline.

## Owner observations

1. The Index surface flashes even though indexing/fingerprinting is already complete.
2. Plan generation reports `no current evidence is available` while the Plan surface simultaneously displays a stale plan, leaving the operator without an explanation or recovery path.
3. The Plan surface does not clearly distinguish the current executable plan from historical/stale plan evidence or explain where a newly generated plan appears.
4. In the canonical folder selector, the center Available Folders panel cannot be scrolled reliably.
5. Available Folders requires a search/filter field at the top.
6. The Selected third panel must scroll independently.
7. Save Sources / Save Target / Save Backup belongs in the outer modal footer next to Cancel, not embedded inside the Selected pane.

## Screenshot evidence

Owner screenshot shows project `fulltime`, Plan tab, `State: stale · evidence revision 1`, stale `establish_target_backup` rows, and toast `no current evidence is available` after attempting Generate current plan.

## Recovery decision

Base-22 is rejected. Base-23 must be rebuilt from the frozen accepted pre-base lineage / clean generated integration, not from the installed Base-22 runtime. Base-23 must address refresh behavior, plan-state clarity/recovery, and selector ergonomics as governed contract changes before owner testing resumes.
