# Market Navigator — Graveyard

Status: REJECTED APPROACHES / DO NOT PATCH FORWARD
Updated: 2026-09-10

This file is a negative specification. A rejected implementation, workflow, validation technique or analytical shortcut is historical evidence only. It is not a successor baseline.

## Permanent process rule
**DO NOT PATCH FORWARD FROM A REJECTED RELEASE.**

Required cycle:

**diagnose → record failure here → update Master Plan → restore approved baseline → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance**

A rejected ship is rolled back. It does not become the next pre-base.

## Current recovery authority
The authoritative baseline is the current product contract in `MARKET-NAVIGATOR-MASTER-PLAN.md`. Historical contracts that use numbered view labels are evidence only and cannot govern the active product surface. Historical implementations are capability-specific donors only. Market Navigator 3.9.7 is a chart/data donor; PRISM R25 is an application-shell/Library donor. Neither historical file is the application baseline by itself.

The next product candidate must be a clean coherent application assembled from qualified donor capabilities and canonical evidence. It must not descend from any rejected Gate 4 release, rejected Turn 01 shell, rejected Turn 04 release, failed Turn 05 candidate, or rejected Turn 11 release.

## G4-R1 through G4-R10 — rejected historical lineage
All Gate 4 R1 through R10 implementations are evidence only. Their previously documented failures remain binding, including standalone rewrites, arbitrary layout changes, misleading charts, synthetic/fallback evidence, incorrect V1/V2 geometry, component-menu V2 implementations, direct component→V3 transitions where superseded, and validation that proved structure rather than owner-visible behavior.

R7-R10 are explicitly prohibited as implementation ancestors by the 2026-09-03 NOW/EXPLORE recovery contract.

## G4-R11 — Rejected runtime/syntax lineage
R11 was rejected and rolled back. It is not an implementation ancestor. The release did not establish a trustworthy browser-booted, owner-visible implementation of the current V1→V2 replacement contract.

## G4-R12 — Rejected standalone rewrite
**Rejected implementation:** `market-view-gate4-r12.html` and companion JS.

### Owner-observed / diagnosed failures
- chart behavior and series completeness regressed from the previously working product;
- 5D, MTD and YTD were not comprehensively qualified;
- unwanted `Back to Market` control instead of the requested breadcrumb navigation;
- rewritten chart/data behavior instead of recovery of the known-good implementation;
- incomplete product capability and insufficient browser qualification.

### Recovery
Do not patch R12. Recover only independently qualified donor capabilities and apply them to the clean current product architecture.

## G4-R13 — Rejected layered compatibility patch
**Rejected implementation:** `market-view-gate4-r13.html` + `market-view-gate4-r13-patch.js`; both removed from active main on 2026-09-03.

### Root cause
R13 violated the recovery process by loading the historical product and then stacking compatibility patches around it instead of building the governed product directly.

### Specific failures
- per-series horizon endpoints instead of one common horizon clock/X-domain;
- derived index averaged whatever observations existed on a date, causing changing component population/weights;
- slow-frequency components with fewer than two in-window observations became false `GAP`s;
- seven horizons were cosmetically injected rather than reconciled through the chart engine;
- a new V2 canvas/composition path duplicated/replaced known-good comparison behavior;
- point inspection inherited incompatible legacy behavior;
- component metadata was hard-coded into another source of truth;
- failed/missing series fetches were silently swallowed;
- More info delegated to legacy detail behavior rather than proving exact V3 state/return;
- browser deployment success was incorrectly treated as sufficient readiness despite known product defects.

### Permanent lesson
**Use historical implementations as qualified donors, never as an excuse for wrapper recovery or rejected-release ancestry.** The clean application must implement the current contract directly with one shell, one state model, one chart engine and canonical evidence.

## Turn 01 shell-only release — rejected 2026-09-04
**Rejected implementation:** `market-navigator-turn01-base.html`, blob `60d5d3658ce2725cadd30fd18a1d1be0319a2e61`; removed from active `main` after owner review.

### Failure
The build satisfied a self-imposed structural shell gate but was not a meaningful product increment. It exposed empty placeholder surfaces for NOW, EXPLORE, LIBRARY, HEALTH and CONFIG and then was incorrectly handed to the owner as a test release.

### Root cause
The stage was decomposed too narrowly. “Application frame” was interpreted as permission to ship empty navigation instead of constructing the first coherent usable vertical slice. Mechanical checks proved only that an empty shell routed correctly; they did not prove Market Navigator functionality.

### Permanent lesson
- A base presented for owner testing must contain a meaningful end-to-end product capability, not placeholders.
- Structural shell qualification is an internal pre-base gate, never sufficient for an owner test URL.
- The first owner-testable clean build must include at minimum the real NOW V1 three-index chart, real canonical evidence, all seven horizons, correct common X-domain, inspection, and enough permanent application navigation to prove the intended surface.
- Empty future-mode placeholders do not count as implemented product capability.
- Confidence claims must be against the owner-visible product requirement, not merely a narrow internal stage definition.

## Turn 04 pre-ship — rejected by owner 2026-09-06
**Rejected implementation:** `market-navigator-turn04-pre-ship.html`, commit `4020f0f63d34c8761959ea3e198469724157e135`.

### Owner-observed failures
- Crosshair/point inspection is not functionally usable on Market and is not reliable across the chart system.
- V1 chart header is overfilled: redundant index legend text and date-range text wrap/bleed into additional rows on phone.
- V2 Risk legend is unusable and the plotted component evidence appears incomplete/discontinuous enough to make the chart read as a mess rather than an analytical surface.
- V3/Analysis drill-down is materially incomplete: horizon controls are absent, chart margins/geometry are wrong, and the series-control treatment exposes placeholder-like add-series behavior instead of a deliberate analytical comparison workflow.
- The V3 implementation did not demonstrate the governed automatic axis contract for compatible native scales, incompatible dual Y1/Y2 scales, and 3+ incompatible Indexed100 comparison.
- The release contains explanatory/redundant UI copy instead of a disciplined sweep for only decision-useful text.

### Root cause
The qualification workflow proved browser boot and scripted state transitions but did not qualify the actual phone composition, gesture/inspection behavior, chart-header row budgets, complete component-series presentation, or every V3 axis/horizon combination. Passing automation was incorrectly treated as product readiness.

### Permanent lessons
- Every chart surface must be visually swept at phone width for header/legend/date collision and redundant text before owner test.
- Index legends use the shortest unambiguous label; do not repeat abbreviation + full index name in a chip when the surrounding surface already identifies the context.
- Date range must have a reserved non-overlapping location and must never compete with legend rows.
- Point inspection must be qualified with real touch/pointer gestures on V1, every V2 index, and representative V3 one-series/two-compatible/two-incompatible/three-incompatible states.
- V3 must expose the same seven horizons and preserve the selected horizon on entry unless the contract explicitly says otherwise.
- V3 is a complete analysis surface, not a modal chart placeholder: margins, axes, comparison controls, evidence, AI action, and exact close/restore behavior are all part of the gate.
- A component chart that is technically drawable but visually sparse/discontinuous must be reconciled against canonical observation cadence and the intended comparison representation before release.
- Automated QA must fail on owner-visible layout collisions and missing governed controls, not merely DOM presence and navigation.

## Turn 05 candidate — failed qualification 2026-09-06
**Failed implementation:** `market-navigator-turn05-pre-ship.html`; qualification workflow run `34039208570`.

### Qualification result
Static/syntax, compact V1 labels, phone header containment, V1/V2/V3 point inspection, V2 governed-series presence, V3 seven horizons and single-series native Y1 all passed. The candidate failed the mandatory **CPI + WTI → Y1 + Y2** gate.

### Root cause
The candidate inferred measurement family from Health-envelope fields that do not own native-unit metadata. That collapsed CPI and WTI into the same fallback family and selected one native Y axis. Canonical units actually live in `data/market-backend/data-catalog.json`: CPI/Core CPI = `percent`; WTI/Brent = `USD per barrel`.

### Permanent lesson
- Axis compatibility must be derived from authoritative catalog `native_unit` / measurement metadata, never guessed from Health fields.
- The release gate must prove all four automatic-axis cases: one native series; CPI + Core CPI shared native Y1; WTI + Brent shared native Y1; CPI + WTI native Y1+Y2; CPI + WTI + VIX Indexed100 Y1.
- A pre-ship candidate that fails any axis case is discarded and rebuilt from the clean contract/donors rather than patched forward.

## Turn 11 pre-ship — rejected by owner 2026-09-07
**Rejected implementation:** `market-navigator-turn11-pre-ship.html`, published commit `bc2fe75013356913cda217cee1fd4a74526becfc`.

### Owner-observed failure
- The application failed immediately with no usable chart display.

### Reproduced live Pages failure
A dedicated live Pages Chromium smoke test loaded the public HTML with HTTP 200 but found that the NOW chart container had been replaced by the boot error `renderAIConfig is not defined`; the canvas therefore did not exist.

### Root cause
The Turn 11 builder replaced the source range from `attachmentPayload()` through `responseText()` while adding spreadsheet attachment support. In Turn 10 that range also contained the complete AI configuration state machine, including `renderAIConfig()`, provider registry, model loading, validation, and event wiring. The range replacement therefore deleted required runtime functions even though JavaScript syntax remained valid. Local qualification did not assert a completed boot with the original canvas still present and did not inspect the boot error surface, so it falsely passed.

### Recovery rule
- Do not patch Turn 11 forward.
- Rebuild from the Turn 10 clean source.
- Apply the requested full-width V3 + persistent Markdown research + image/spreadsheet attachment changes as narrow independent replacements that preserve the complete AI configuration block.
- Release qualification must include a **public Pages smoke test** that fails if the boot catch replaces `#nowWrap`, if `#nowChart` disappears, if any page/console error occurs, or if canonical evidence requests fail.

## Turn 12 pre-ship — rejected by owner 2026-09-09
**Rejected implementation:** `market-navigator-turn12-pre-ship.html`, published commit `1ca70411`.

### Owner-observed failures
- Selecting a component at the index level produced an unsolicited right-side panel instead of a coherent compact component-card bridge into Analysis.
- Library retained analysis prose and evidence labels but did not render the saved analytical chart, breaking continuity between the chart being analyzed and the durable research record.
- Mechanical qualification again allowed chart geometry and Library behavior to be evaluated separately even though the product requires one analytical state across V3 and Library.

### Root cause
Turn 12 preserved the Turn 10 Library as a transcript-only surface. It stored series IDs, horizon and evidence metadata, but not an immutable chart snapshot containing the exact plotted observations, axis assignment, normalization, common X-domain and evidence revision. Reopening Library therefore could not render the chart that the AI had actually analyzed. The contextual component card also remained a generic right-edge overlay, repeating a presentation already rejected by the owner.

### Recovery rule
- Do not patch Turn 12 forward.
- Reconstruct the next candidate from the clean Turn 10 source and reapply only qualified capabilities as direct source changes.
- Persist the exact chart state before AI execution and render that snapshot in Library through the same canonical chart engine used by V3.
- A legacy Analysis lacking a chart snapshot may be migrated once from current canonical evidence, must be marked as migrated, and must then remain frozen.
- Replace the unsolicited right-edge component panel with the governed compact contextual card without changing the V1 → V2 → card → More info → V3 journey.
- Qualification must prove the exact saved chart before and after reload, including horizon, series, axes, native values, Indexed-100 values and evidence revision.

## Permanent prohibited patterns
- patching any rejected release forward;
- wrapper/iframe/compatibility-patch recovery builds;
- arbitrary application-frame redesign;
- empty-shell or placeholder-only owner test releases;
- stacked V1 + V2 when the contract requires replacement;
- fake fourth Market index;
- V2 as a single index line plus component-navigation pills;
- direct V2 component → V3 without the information-card bridge;
- recreating V4 or V5 as product states;
- silent derived-index component substitution;
- cadence-only Health classification;
- stretched/fabricated slow-frequency source observations;
- duplicate chart engines;
- missing/incorrect X/Y1/Y2 axes;
- all-series inspection popup;
- stale inspection surviving context change;
- Library Analysis without its visible saved chart;
- a second Library-only chart engine or a Library chart reconstructed silently from newer evidence;
- browser-side canonical Yahoo/FRED reacquisition when persisted canonical evidence is authoritative;
- release gates that validate labels/DOM/syntax/deployment rather than actual owner-visible behavior;
- handing the owner any release with known data, chart, journey, AI or layout defects.


## Turn 14 chart-type / availability correction — rejected decisions 2026-09-10

Turn 14 remains useful as a capability donor for Library chart persistence, active-reference highlighting, series identity colors, AI/provider continuity and other independently qualified behavior. The following Turn 14 decisions are rejected and must not be patched forward as product requirements:

- **Derived-index column/bar rendering is rejected.** The owner explicitly rolled it back. V1 and V2 return to the line-chart comparison model.
- **Composite eligibility must not control direct-series visibility.** WTI was suppressed in Growth V2 because the derived-index evidence listed WTI as ratio-ineligible after its historical zero crossing. That is a composite-construction fact, not permission to hide valid WTI source evidence from direct chart analysis.
- **`seriesAvailable()` may not swallow every exception and return `false`.** Fetch, parse, missing-file and revision failures are evidence errors and must be distinguishable from a legitimate no-new-release condition.
- **Raw GDP-level selection is rejected.** User-facing GDP is q/q and y/y derived deterministically from canonical quarterly Real GDP levels.
- **Color-only chart configuration is incomplete.** The accepted Chart Config contract also requires 1–12pt thickness and five governed line styles for ten persistent identity slots.
- **Partial More menus are incomplete.** V1, V2, V3 and EXPLORE require AI POV, Print, Markdown, CSV and JSON actions against the exact current analytical state.
- **Qualification that proves WTI only at 5YR is insufficient.** WTI 5D direct-analysis availability is a mandatory regression gate.

### Recovery
Turn 15 is a narrow correction from the clean current architecture. Preserve independently qualified Turn 14 capabilities, but replace the rejected decisions above directly in source. Do not reintroduce bars/columns through Library migration, derived-index defaults or later chart refactors.

## Turn 15 owner-visible UX regressions — rejected for Turn 16

Turn 15 remains the qualified data/availability/style capability donor for GDP q/q/y/y, WTI direct availability, line rendering, evidence loading, immutable Library charts, AI/provider state and stale-render guards. The following owner-visible Turn 15 UX behavior is rejected and must not survive Turn 16:

- **Numbered view terminology is not product terminology.** The user-facing analytical hierarchy is only `ENVIRONMENT → <INDEX> → <COMPONENT>`. Numbered labels may not appear in rendered UI, breadcrumbs, reports or owner-facing QA language.
- **Split/inconsistent chart chrome is rejected.** Breadcrumbs, horizons, More menu, legend and footer may not move between different rows/locations depending on analytical depth. ENVIRONMENT, INDEX and COMPONENT use the same Section A / B / C contract.
- **Wrapping the primary chart chrome is rejected.** Section A remains one physical row. Breadcrumb text yields space and truncates; centered horizon controls do not move to a second row.
- **The Turn 15 white plotted-line outline is rejected.** Crosshair inspection instead keeps the intended series opaque/on top while other plotted series recede translucently. This is automatic inspection feedback, not a persistent focus mode and not a second-click interaction.
- **CONFIG without a persistent close control is rejected.** AI, Chart Config and About share one top-right close control that returns to the exact prior application view.
- **Inoperable/clipped Chart Config controls are rejected.** Desktop and mobile must expose all ten series rows, 1–12pt thickness and the five line styles without clipping or unreachable selects.
- **Save-only visual feedback is rejected.** Chart-style edits preview immediately; Save persists. Closing CONFIG before Save restores the persisted style state.
- **Different context menus by analytical view are rejected.** Every governed chart context menu uses exactly: AI POV, Print, Download Markdown, Download CSV, Download JSON.
- **Header build labels and low-value footer text are rejected.** Version/build moves to the centered chart footer beside exact date range and the valid representation selector.

### Recovery rule
Turn 16 is a bounded UX correction over the independently qualified Turn 15 data/analysis capabilities. Do not broaden scope or rewrite the backend. Qualification must prove owner-visible desktop and phone geometry, not just DOM presence.

## Turn 16 interaction/readout regressions — rejected for Turn 17

Turn 16 remains the qualified donor for canonical chart chrome, GDP periodic treatment, WTI direct availability, evidence loading/race guards, representation switching, Chart Config, immutable Library snapshots, and the unified export surface. The following owner-visible Turn 16 behavior is rejected for Turn 17:

- **Generic solid legend swatches are rejected.** A legend key must render the actual configured stroke style and thickness for its series.
- **The bottom-centered dark component card is rejected.** The contextual card is compact, white with black text, top-right, and non-blocking for chart hover except for its explicit controls.
- **Crosshair-gated emphasis is rejected.** Explicit chip selection itself activates series isolation; the user does not click the chart again merely to see the series already selected.
- **Click-only desktop crosshair inspection is rejected.** Pointer hover inspects the selected series immediately.
- **Hover-driven silent series switching is rejected.** Hover examines the active series; clicking another plotted series is the deliberate bidirectional selection action that updates chip/card/emphasis.
- **A context menu without full-series Data is rejected.** Data is canonical and exposes complete canonical raw-series history, native/index values, and same-date correlation versus the active series; it is not limited to the current horizon when a healthy periodic series has no new release inside that horizon.

### Recovery rule
Turn 17 is a bounded interaction/readout correction over the qualified Turn 16 analytical/data architecture. Do not rewrite collectors, evidence storage, GDP/WTI rules, Library architecture, AI/provider behavior, or canonical chart chrome to deliver these changes.

### Turn 17 deferred audio-export boundary
- Browser TTS playback is in scope and uses the PRISM Library interaction donor.
- Downloadable/generated MP3 audio is **backlog only**. Do not fake an MP3 export from `speechSynthesis`; add it only with a future file-producing TTS implementation.



## Turn 17 long-horizon overplotting — rejected for Turn 18
Rejected behavior: drawing every high-frequency real observation at YTD/1YR/3YR/5YR simply because the evidence exists. On phone and dense multi-series charts this creates avoidable visual noise and reduces analytical readability.

Do not fix this by mutating/downsampling persisted evidence, monthly averaging, interpolation, forward-fill, synthetic timestamps, or by weakening full-resolution Data/crosshair behavior. Turn 18 uses presentation-only real-observation display reduction: weekly for YTD/1YR and monthly for 3YR/5YR, while 1D/5D/MTD remain native.

## Turn 18 top-strip and hierarchy friction — rejected for Turn 19 (2026-09-11)
Turn 18 remains the qualified donor for horizon-aware display density and the previously accepted data/Library/configuration capabilities. The following owner-visible interaction behavior is rejected:

- visible root breadcrumb text `ENVIRONMENT`; the canonical visible token is now **ENV**;
- equal/flexible top-row geometry that allows breadcrumb length to displace or hide the fixed horizons or right-side `…` menu;
- whole-breadcrumb truncation that can consume protected ENV/INDEX ancestry; only the COMPONENT leaf may ellipsize;
- automatically opening the large series-information card during ordinary chip or plotted-series selection;
- requiring `More info` as the mandatory bridge from INDEX to COMPONENT;
- using an INDEX legend-chip tap merely as selection when a deeper standalone analytical chart exists;
- clearing the selected inspection readout merely because the pointer leaves the plot;
- introducing any extra click/toggle to make a selected series ready for inspection.

### Recovery rule
Turn 19 uses one explicit interaction grammar: **breadcrumb drills up; legend chips drill down where a child exists; plotted series select/inspect; long press opens information.** At COMPONENT depth legend taps change active/reference series because there is no deeper hierarchy. The compact long-press popover is reference UI, not a navigation gate. Turn 18 display-density and data truth behavior must not change.

## Turn 20 lifecycle / AI snapshot regressions — rejected
- Reconstructing a visible COMPONENT chart for AI by calling raw-series fetches again is rejected. It drops derived RSK/GRW/MAC evidence because derived indices do not live at raw-series file paths. AI and Library persistence must consume the already-rendered frozen chart snapshot.
- Breadcrumbs such as `ENV / GRW / GRW + 3 Components` are rejected when the visible comparison set is `GRW + PCE + Payrolls + UNE`. The derived parent index is context, not a duplicated component leaf; the correct leaf is `PCE + 2 Components`.
- A COMPONENT breadcrumb that does not survive the full drill-up/drill-down lifecycle is rejected. ENV → INDEX → COMPONENT must be reversible through the breadcrumb ancestors, while bottom-level legend taps remain selection only.

