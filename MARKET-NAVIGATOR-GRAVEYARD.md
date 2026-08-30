# Market Navigator — Graveyard

Status: REJECTED APPROACHES / DO NOT PATCH FORWARD
Updated: 2026-08-30

## G3-R1 — Rejected post-baseline Gate 3 ribbon/help patch

**Rejected implementation lineage:** changes applied after Gate 3 baseline commit `5db1363447c70d5dd3bb5f1f6d03204af34b6eb7`, culminating in the deficient `market-view-ux-gate3.html` state.

**Restore authority:** `5db1363447c70d5dd3bb5f1f6d03204af34b6eb7` is the implementation baseline for the next Gate 3 POC. Do not patch the deficient descendant forward.

### Rejected behaviors
- Ribbon row 2 that does not keep breadcrumbs at the far left, horizons fixed/centered, and `…` at the far right.
- Breadcrumb lineage rooted at `Now`.
- Legend contextual-help cards without an explicit close/dismiss control.
- Legend `More` links that open the wrong analytical destination or lose the clicked series identity.
- Treating `Add to Analysis` and `Add/Save to Library` as equivalent actions.
- Reusing an incorrect descendant as the next implementation baseline merely because it contains some desired ribbon/footer features.

### Recovery rule
Rebuild from the restored baseline and apply only the governed Gate 3 corrective patch documented in `MARKET-NAVIGATOR-MASTER-PLAN.md`. Preserve the baseline chart/analysis interaction model unless that patch explicitly changes it.

## G4-R1 — Rejected first Gate 4 application slice

**Rejected implementation:** `market-view-gate4.html` first slice, commit `38a35279f4aea9c99d6fcb70518e06c31371cf3e`.

### Why it was rejected
The slice continued treating core product behavior as gated chart/navigation work instead of assembling the complete application contract. It also exposed interaction and evidence defects that must be solved structurally rather than patched one-by-one.

### Rejected behaviors
- Two-row ribbon with breadcrumbs sharing the horizon/control row. This creates mobile overflow pressure and makes the analytical hierarchy less legible.
- Breadcrumb labels that consume unnecessary width. Canonical compact lineage is `Market / Growth / Payroll`; additive analysis becomes `Payroll + Custom` while preserving parent context internally.
- Small horizon targets/font that are harder to read and tap on mobile.
- Long legend labels and direct V2 component-to-new-tab behavior that sacrifice context and horizontal capacity.
- Market 5D rendering that can omit an index line such as Growth.
- Crosshair locked to one series rather than transferring to the line/observation tapped.
- Split crosshair annotation with date at the X axis and value at the point rather than one contextual observation popup.
- V2 chart showing components without the selected derived index trendline as the reference context.
- V2 failing to expose every defined component of the selected index.
- Treating Library, AI POV, AI chat, provider configuration, provider validation and model selection as later gated surfaces.
- Flat Add Series list with bottom actions that become undiscoverable in a long list.
- Add Series taxonomy that does not expose `Market | Risk | Growth | Macro | Other` navigation.

### Recovery / solve
Do not patch this rejected slice forward as the product baseline. Gate 4 must be assembled from the governed lineage: current Market Navigator 3 application foundation + approved Gate 3 interaction model + approved ribbon/footer decisions + canonical backend evidence.

The replacement must implement the complete active product contract in one governed release: three-row analytical ribbon; compact three-letter legends; contextual About cards; transferable real-observation inspection; V2 index + all component lines; Library; operational AI POV/chat; CONFIG provider/model validation; and categorized Add Series selection.
