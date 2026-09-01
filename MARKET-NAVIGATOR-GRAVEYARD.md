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

## G4-R4 — Rejected technically-passing but product-invalid release

**Rejected implementation:** `market-view-gate4-r4.html`, candidate commit `12450364b8298b9f7d1d96837c61654197e793f7`.

**Rollback action:** active R4 artifact and its validation record were removed from `main`. R4 is historical evidence only and is not a patch-forward baseline.

### Why it was rejected
R4 passed the automated release workflow but the workflow was still validating the wrong things. It proved that the artifact booted, contained expected navigation/state markers, could complete scripted journeys, and met coarse geometry rules. It did not prove that the application was analytically useful, that operational data was current, that AI/provider behavior matched the approved donor, or that the visible interaction contract actually worked for the owner.

### Owner-observed failures
- Hamburger/rail collapse did not work. This alone invalidates baseline parity.
- AI provider/model discovery diverged from the approved donor. Approximation of `devstream-test.html` is rejected; the donor behavior must be reused exactly.
- AI POV could be useless or misleading because it analyzed incomplete/stale evidence rather than diagnosing the evidence first.
- AI generation could spin and then disappear with no reply or deterministic failure state.
- Market chart was not acceptable as an analytical surface.
- Risk V2 was visually chaotic and analytically poor.
- Growth V2 was visually degraded; AI attempted to broaden the context beyond the governed index/component scope rather than first interpreting the active index evidence.
- Macro was unusable.
- Health was effectively absent as an operational diagnostic surface, leaving no way to distinguish source lag, collection failure, stale evidence or missing observations.
- CPI stopped at June even though July was available. This exposed the missing cadence/publication-lag/freshness contract in the canonical evidence path.
- Explore and Add Series used different discovery mechanisms for the same conceptual operation, increasing inconsistency and maintenance cost.

### Root causes
- Release validation emphasized structural presence and scripted path completion over product usefulness and data truth.
- Data health was treated as a UI surface rather than a prerequisite envelope around every analytical series.
- The canonical backend did not expose enough deterministic cadence/publication metadata to distinguish expected lag from stale/failed collection.
- The chart engine accepted sparse and mixed-frequency evidence into normalized comparisons without sufficient quality gating or degradation signaling.
- AI POV consumed chart evidence before validating its completeness/currentness.
- Provider/model configuration was reimplemented instead of using the exact approved donor behavior.
- Explore and Add Series were implemented separately instead of sharing one series-discovery component.

### Recovery / solve
- Do not patch R4, its generated HTML, its overlay code, or its workflows.
- Start R5 again from the exact restored 3.9.7 `market-view-gate4-r3.html` baseline.
- Use `devstream-test.html` as an exact provider/model configuration donor; no substitute UX or discovery logic.
- Make cadence/freshness metadata a backend contract before chart/AI interpretation: frequency, publication lag/expected availability, latest observation, last successful collection, expected next update, horizon coverage, and deterministic health classification.
- Make Health a first-class working diagnostic surface backed by that metadata.
- Make AI POV perform an evidence-health preflight and refuse/narrow unsupported inference instead of summarizing stale or incomplete input.
- Make AI request lifecycle visible and failure deterministic; no silent disappearance.
- Use one shared series-discovery mechanism for Explore and Add Series.
- Add release gates for real rail collapse behavior, exact donor parity, representative data currentness (including CPI), Health usability, degraded-evidence AI behavior, and visual/analytical usefulness of Market/Risk/Growth/Macro charts.
- Automated PASS is not acceptance if it does not test the actual owner-visible contract.

## G4-R5 — Rejected arbitrary-layout successor with non-diagnostic Health

**Rejected implementation:** `market-view-gate4-r5.html`, release commit `4b1000e317375d9504fd14dcd5afae66f9654cdf`; validation run `33386160380`; Pages deployment run `33386297538`.

**Rollback action:** R5 HTML, JS/CSS successor overlays and R5 workflow are removed from active `main`; the public R5 candidate is invalidated. R5 and descendants are not patch-forward baselines.

### Owner-observed failures
- The layout changed materially and arbitrarily from the approved/current product surface. This is rejected even if the implementation passes functional checks.
- The Health surface does not explain why the underlying data is bad.
- The Health surface does not explain why the visible charts are bad.
- The Market/Risk/Growth/Macro chart presentation is visibly poor/misleading and therefore analytically unusable.
- Arbitrary visual/product changes not explicitly authorized by the governed plan are forbidden.

### Root causes
- R5 treated functional contract assembly as permission to introduce a new application frame/layout instead of preserving approved visual structure.
- The release gate checked geometry and journey completion but did not perform exact visual parity/redline review against the approved layout before adding new functionality.
- Health reported status-like fields instead of performing root-cause diagnosis that connects source cadence, freshness, collector result, provenance, horizon coverage and missing/sparse observations to the actual chart degradation visible to the user.
- Chart validation proved that SVG/axes/series existed rather than proving that the resulting chart was coherent, comparable and trustworthy.

### Recovery / solve
- Do not patch or reuse R5 HTML, JS/CSS overlay, workflow, layout or validation as the successor baseline.
- Return to the exact restored Market Navigator 3.9.7 baseline plus approved Gate 3 P2 interaction model and governed Gate 4 contracts.
- Visual parity is now a hard precondition: before functional additions are accepted, the successor must demonstrate that the approved application frame/layout is unchanged except where a specific plan clause explicitly authorizes a change.
- Health must be diagnostic, not descriptive: for every degraded series/chart, identify the concrete cause and evidence path — source state, expected cadence/publication lag, latest publicly expected observation, actual latest observation, last collection attempt/result, coverage/density by horizon, provenance and the resulting chart impact.
- Chart quality must be evaluated as a user-visible analytical output. A technically populated chart that is distorted by sparse, stale, cadence-incompatible or otherwise incomparable evidence is a release failure, and Health must explain the failure.


## G4-R6-D1 — Rejected split-brain index and health inputs

**Rejected approach:** selecting whichever repository model or freshness field is easiest for the browser, or treating a collector status as sufficient proof that a chart is current.

### Why it is rejected
- market-data/model.json defines a different weighted 0–100 model and cannot be mixed with the canonical equal-weight rebased-100 Gate 4 definition.
- Catalog metadata, collector state, operational coverage and canonical observations answer different questions. Collapsing them produces false freshness claims and misleading chart readiness.
- Calendar age alone misclassifies low-frequency evidence. In particular, July CPI can be current or expected-lag before the next scheduled publication and must not be labeled stale merely because a daily threshold was applied.
- Browser reacquisition would create a second canonical store and make Health unable to explain the evidence actually drawn.

### Governed replacement
- Use the derived-index definition, data catalog, canonical series files, operational manifest and source-health collector record in their declared roles.
- Classify evidence as current, expected-lag, stale, missing, failed or sparse using native cadence and publication schedule.
- Preserve every component in V2 and Health even when degraded, explicitly show chart impact, and never invent observations.
