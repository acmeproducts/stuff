# Market Navigator — Graveyard

Status: REJECTED APPROACHES / DO NOT PATCH FORWARD
Updated: 2026-08-30

## G3-R1 — Rejected post-baseline Gate 3 ribbon/help patch

**Rejected implementation lineage:** changes applied after Gate 3 baseline commit `5db1363447c70d5dd3bb5f1f6d03204af34b6eb7`, culminating in the deficient `market-view-ux-gate3.html` state.

**Restore authority:** `5db1363447c70d5dd3bb5f1f6d03204af34b6eb7` is the implementation baseline for the next Gate 3 POC. Do not patch the deficient descendant forward.

### Rejected behaviors
- Ribbon row 2 that does not keep breadcrumbs at the far left, horizons fixed/centered, and `…` at the far right.
- Breadcrumb lineage rooted at `Now`. Analytical breadcrumbs are `Market`, then `Market > Index`, then `Market > Index > Component`.
- Legend contextual-help cards without an explicit close/dismiss control.
- Legend `More` links that open the wrong analytical destination or lose the clicked series identity.
- Treating `Add to Analysis` and `Add/Save to Library` as equivalent actions.
- Reusing an incorrect descendant as the next implementation baseline merely because it contains some desired ribbon/footer features.

### Recovery rule
Rebuild from the restored baseline and apply only the governed Gate 3 corrective patch documented in `MARKET-NAVIGATOR-MASTER-PLAN.md`. Preserve the baseline chart/analysis interaction model unless that patch explicitly changes it.
