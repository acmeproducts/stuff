# Market Navigator — Graveyard

Status: REJECTED APPROACHES / DO NOT PATCH FORWARD
Updated: 2026-08-31

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

## G4-R2 — Rejected inert replacement release

**Rejected implementation:** `market-view-gate4-r2.html`, commit `141739606b0e2fe61e22ab7fa9b51936c20c8009`.

### Why it was rejected
The published replacement was inert because its JavaScript did not pass syntax validation before release. This is a release-process failure in addition to an implementation failure: an executable HTML/JavaScript artifact must never be handed to the tester without at least parser/static validation.

### Recovery / solve
- Do not patch the inert R2 artifact forward as an accepted baseline.
- Correct from the governed Gate 4 contract and publish a successor release.
- Before publishing any successor test URL, extract/validate the JavaScript with a parser/runtime syntax check and perform structural checks for required Gate 4 surfaces.
- A failed syntax check blocks publication.

## G4-R3 — Rejected standalone rewrite masquerading as governed lineage

**Rejected implementation:** `market-view-gate4-r3.html`, candidate commit `2a5daaf19a68cad2dc8c04cab3deaf3ea1680dcb`. Owner rejected the release immediately as materially worse than the prior failure; no defect-by-defect catalog is authoritative or required.

### Why it was rejected
R3 satisfied parser, boot and superficial structural checks but violated the governing lineage requirement in substance. Instead of preserving the full Market Navigator 3.9.7 runtime/application and reconciling Gate 4 into it, the candidate was effectively a compact standalone replacement whose release checks proved only that a smaller app booted and contained expected labels. This allowed severe capability and presentation regression to pass the gate.

### Rejected approach
- Replacing the 3.9.7 application with a newly authored compact shell and calling it lineage preservation.
- Treating string-presence/DOM-count checks as proof of feature parity.
- Treating boot success as proof that existing navigation, data, charting, responsive behavior, accessibility, export, interaction and application capabilities survived.
- Reconstructing canonical data ingestion generically when the accepted runtime already provides a known application/data model that should be adapted deliberately.
- Publishing a release without a baseline-parity gate against the preserved 3.9.7 application and approved Gate 3 P2 interaction model.

### Recovery / solve
- Roll back `market-view-gate4-r3.html` to the exact pre-R3 3.9.7 runtime artifact before any successor work.
- The successor must start from that restored file, not from R3 code.
- Preserve the 3.9.7 runtime/application code by default; make explicit governed changes only where Gate 4 requires a different contract.
- Reconcile approved Gate 3 P2 interaction patterns into the preserved runtime rather than replacing the runtime with a POC shell.
- Add release gates for baseline capability parity, visual/application-frame integrity and state-transition behavior in addition to syntax/boot/structural checks.
- No R3 code is a patch-forward baseline.
