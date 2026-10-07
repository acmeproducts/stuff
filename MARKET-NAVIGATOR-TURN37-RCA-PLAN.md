# Recovery override — owner authorized 2026-10-05

This section supersedes conflicting sequencing, Add, lifecycle and qualification claims below.
Turn 37 Stage 6 is REJECTED by owner real-device testing. Automated qualification run 37210928051 was insufficient; its PASS is historical lab evidence, not product acceptance. Do not repair Stage 6 forward or use it as a donor.

Construction baseline: market-navigator-turn28-post-ship.html, commit 996e9a71b72db5bfbea3ba77750077daaa2fb7ab, blob 9ce7f67451f9e1b7804927ce5c56adb667614724. Keep it immutable. Build new market-navigator-recovery-* candidates.

Execution: characterize Turn 28 independently; map the working NOW chart boundary; extract NOW incrementally without moving/replacing its DOM or changing accepted CSS/math/behavior; rerun NOW differential gates after each step. A failed extraction is discarded and retried smaller from the last passing checkpoint. Only after NOW runs through MNChart.mount(host, initialState, services) unchanged may Analyze instantiate that same module. Prove one existing NOW launch point first, reconnect every existing NOW launch point before owner testing. No rejected Turn 31–37 product paths are donors.

One module owns instance state, series/order/data resolution, horizon, Fixed/Horizon, representation/axes, legend selection/removal, picker, info/menu presentation, crosshair/tooltip, rendering/resize and event lifecycle. Consumers supply canonical data and existing action services; no consumer-specific chart implementation or write-through globals.

Add is temporarily single-series immediate-add: all eligible indices/components/market comparisons, duplicates excluded or disabled, select one, add once, close. No About in the picker; no orphan information card. Checkbox/batch Add is deferred until shared-module owner qualification.

Analyze lifecycle: creation only from normal NOW; selected anchor alone, inherit horizon/Fixed-Horizon/eligible representation. Full usable NOW content region. Library parks Analyze without active overlays; NOW restores the same session. Library cannot create/replace/retarget Analyze. Only Analyze X destroys the session, revealing preserved normal NOW. Existing info, AI, data and export behavior stays governed. ENV click-to-open-index navigation remains accepted; index legend normal click activates/emphasizes once, never opens info.

Release gates 0–17 from the owner handoff are mandatory: exact baseline; NOW behavior across ENV/RSK/GRW/MAC and every horizon; visual/geometry parity; legend semantics; full simple Add universe including components; repeated breadcrumb/Add/horizon/display sequences with values/window/axis assertions after every action; full-page Analyze; functional parity; actual visible entry points; adversarial bidirectional isolation; independent data/coordinate comparison; single event ownership; 25 lifecycle cycles with listener/node/state cleanup; Library mouse/touch/keyboard/scroll/interpretation behavior while parked; zero errors; one chart owner; no rejected donors; exact owner candidate/baseline URLs, commit and workflow evidence.

Fixed matrix: Windows 11 Chrome/Edge at 1440x900 and 1887x800; Android/Chrome at 800x1280 and 412x915. Browser emulation is lab evidence only. Use identical frozen canonical fixtures, fonts and environment in baseline/candidate pairs. No screenshot-only or candidate-self-oracle qualification; no chart-chrome masking. Owner real-device acceptance is mandatory before promotion.

No Library/Health/source/data/index mathematics/AI/configuration/Dashboard or unrelated styling/navigation changes. Shared repository: publish only explicitly named Market Navigator paths; preserve concurrent main updates and check the exact diff before publication.

## Recovery implementation record — 2026-10-05

Final qualification record: MARKET-NAVIGATOR-RECOVERY-EVIDENCE.md. Chrome/Edge each passed 320 independent NOW states and 82 repeated interaction comparisons. Analyze independent values/coordinates/raster passed all four layouts. Dialog invocation ownership is released on close; a fresh phone suite and independent baseline A/B passed after one concurrent-run click timeout. Exact-commit CI and published URL verification are required before the owner package; Windows 11/Android owner acceptance remains pending.

Documentation override was committed first as 38f15c57fc44ddce6dbd5ac962f9f3511431f28e. Construction reads only the verified Turn 28 blob; baseline bytes remain immutable. The reproducible builder extracts the accepted NOW functions into MNChart.mount without replacing NOW markup. Canonical read-only primitives and existing application actions remain services. Analyze uses a second mount of the same implementation and canonical structure; live NOW is never moved.

Characterization preceded extraction: four fixed viewports, ENV/three roots, all index horizons, ordered datasets, windows, raw/indexed values, geometry, canvas rasters and drawing coordinates. The first seam exposed a missing compatibility crumb binding; it was discarded and reduced to retain canonical primitives. An ENV publication ordering mismatch was discarded and rebuilt from the accepted source with publication after the neutral-state reset. Readiness instrumentation was corrected to await completed async renders, including the independent baseline, rather than treating a prior snapshot as current. No rejected product code was used.

The passing NOW-only checkpoint is market-navigator-recovery-now.html. The final owner candidate is market-navigator-recovery-candidate.html. Its shared instance owns event handlers, abortable legend listeners, resize observer, timers, async sequence guards, snapshot copies and destruction. Analyze lifecycle wrappers create only from normal NOW, park in Library, restore on NOW and destroy only through X. There is one existing NOW Analyze control constructor, reached through explicit legend context/long-press information and selected plot-point information. Picker About is deliberately removed under the reduced Add scope. The AI POV menu action remains AI, not a second standalone Analyze creation path.

Intended behavior changes: full-page Analyze with X; same NOW module and chart controls; immediate single-series Add without About; one modern pointer-event inspection instead of duplicate touch/pointer inspection; own-component Add/expand/remove no longer resurrects the removed comparison through the additions list. That removal correction is confined to requested Add/remove semantics. Native market/component anchors have index:null and use a private inherited index clock for date windows; ineligible single-series dual representation falls back to Indexed 100.

Qualification commands and assertions are committed with the candidate. Source gates prove pinned lineage, one chart owner, two mount sites, no consumer branches, no retired Analyze chart functions, no rejected donors and reproducible generation. Independent baseline comparisons protect values, ordered rendering input, coordinates, raster, geometry and unmasked chrome. Actual controls cover menus/info/data/export/print, repeated breadcrumb/Add/horizon/display sequences, unavailable/periodic series, resize, reverse isolation, throwing NOW-state accessors, Library saved analyses/interpretation modes/chat draft/scroll, touch events and 25 cycles per viewport. Pending-request navigation/destruction tests exercise stale async responses.

Lab platform is Windows 10 (10.0.19045), current installed Chrome/Edge; CI runs Windows Server runners. Tablet/phone are viewport/touch browser emulation. These are not Windows 11 or Android real-device acceptance. Owner Windows 11 Chrome/Edge at 1440x900 and 1887x800, plus Android Chrome at 800x1280 and 412x915, remain mandatory before promotion. No default production alias is changed. Final measured results, exact commit, workflow and owner URLs are recorded in MARKET-NAVIGATOR-RECOVERY-EVIDENCE.md after qualification.

---

# Market Navigator Turn 37 — RCA and Controlled NOW Modularization Plan

Status: PLAN ONLY. No product implementation is authorized until owner review is complete.

## Ground truth baseline
The only construction baseline is the owner-accepted post-ship build:
- file: market-navigator-turn28-post-ship.html
- commit: 996e9a71b72db5bfbea3ba77750077daaa2fb7ab
- blob: 9ce7f67451f9e1b7804927ce5c56adb667614724

Turns 31–36 are evidence only and are not implementation donors.

## RCA
1. Turn 36 changed the product surface while trying to change architecture. It replaced accepted NOW markup, layout CSS, and rendering instead of extracting behind the accepted surface.
2. Earlier turns alternated between sharing too little and replacing too much. Turn 31/35 shared helpers but left duplicate consumer behavior; Turn 32/33/36 tried to cure that by moving or rebuilding the physical surface.
3. Qualification tested candidate architecture, not the accepted product contract. CI proved selected functions and interactions but did not prove NOW remained equivalent to the accepted build.
4. No release-blocking pixel/geometry gate protected NOW.
5. The accepted interaction state machine was not fully characterized before ownership changed.
6. Hidden global/DOM dependencies were rewritten wholesale instead of mapped and retired one at a time.
7. Turn 36 was forward-patched through syntax, boot, geometry and interaction failures. A final green harness did not prove the migration itself was safe.
8. The requested Library/Analyze independence and multi-select Add change were mixed with the architectural migration, making failures hard to isolate.

## Correct architecture
Implement one MNChartController that ATTACHES to an existing chart surface.

Public contract:
MNChartController.attach(surfaceRoot, chartSpec)

The controller owns:
- instance state
- horizon transitions
- active/focus series transitions
- Add/remove state
- Fixed/Horizon mathematics
- Indexed/Y1+Y2 resolution
- series resolution/order
- crosshair/tooltip interaction state
- action dispatch
- resize lifecycle
- create/update/getState/destroy

The controller does not initially regenerate accepted NOW markup, CSS, or canvas presentation. The accepted NOW subtree stays canonical. Analyze uses a cloned canonical chart subtree plus the same controller, with instance-local roles/IDs.

A shared controller is real only when NOW and Analyze execute the same controller methods and neither consumer has a parallel implementation of chart state transitions, series preparation, or axis mathematics.

## Execution sequence

### Stage 0 — Freeze and characterize accepted baseline
No product changes.
Create deterministic fixtures for:
- owner-class desktop approximately 1887x800
- desktop 1440x900
- tablet 800x1280
- phone 412x915

Capture:
- full NOW screenshot
- chart-card screenshot
- geometry/bounding boxes for header, horizon row, legend, canvas/plot, footer and overlays
- typography and overflow assertions
- DOM role/ID inventory
- initial state
- traces for ENV to RSK/GRW/MAC, component expansion, horizons, Add/remove, active series, Fixed/Horizon, Indexed/Y1+Y2, crosshair/tooltip, More, info/analyze, resize
- Library Plain/Standard/Technical
- Analyze open/close behavior

Gate 0: every fixture passes against the accepted blob before refactoring begins.

### Stage 1 — Dependency map and seam
No visible changes.
Inventory every chart-related function/global/DOM dependency: reads, writes, caller, event source, render target, and future owner.
Define the exact role map used by the controller.

Gate 1: every accepted chart interaction has one mapped owner and one future controller method. No unmapped global write may move.

### Stage 2 — Shadow controller
NOW stays on the accepted implementation. The controller runs in non-driving shadow mode and cannot mutate DOM/application state.
For every characterized action compare legacy vs shadow:
- ordered series
- active/focus series
- horizon
- Fixed/Horizon values
- axis mode/assignments
- resolved point arrays
- date window
- tooltip target
- Add eligibility

Gate 2: state-for-state and point-for-point parity. Mismatches are fixed only in shadow code.

### Stage 3 — Controller drives Analyze first
Analyze uses a clone of the canonical accepted NOW chart subtree plus MNChartController.attach().
NOW stays on accepted behavior.

Required:
- selected root initializes Analyze
- same controller methods as NOW shadow path
- instance-local state only
- no writes to NOW state
- Library opens unobstructed while Analyze is parked
- returning to NOW restores still-open Analyze state
- closing destroys only Analyze

Gate 3: Analyze passes parity and NOW remains baseline-identical.

### Stage 4 — Shared grouped batch Add
Only after Stage 3 passes.
Inside the controller:
- tabs: Risk | Growth | Macro | Other
- alphabetical by display label, ID tie-breaker
- checkbox multi-select
- selections persist across tabs/search
- OK applies atomically
- Cancel and X apply none
- existing series excluded
- removal remains on current series controls

Gate 4: one picker state machine/controller path is used by both consumers; closed-picker NOW is visually unchanged.

### Stage 5 — NOW cutover
Only after Analyze proves the controller.
Attach the same controller to the EXISTING accepted NOW DOM. Do not replace, clone, or regenerate the NOW subtree.

Gate 5A visual: accepted vs candidate screenshots and geometry at all four viewports; zero unexplained chrome movement.
Gate 5B behavior: every Stage 0 interaction trace matches.
Gate 5C analytical: resolved arrays, axis assignments and plotted values match point-for-point except separately approved fixes.
Gate 5D isolation: NOW and Analyze cannot mutate one another.

### Stage 6 — Retire duplicate legacy chart logic
Only after Stage 5 passes.
Remove legacy transition code one function at a time and rerun the full differential suite after each deletion.

Gate 6: code search proves one live owner per chart operation and no consumer-specific duplicate math/state path remains.

## Mandatory release gates
1. Accepted post-ship ancestry.
2. No Turn 31–36 donor implementation.
3. Accepted NOW markup/CSS is not replaced.
4. Baseline visual/geometry fixtures exist before migration.
5. Differential interaction traces pass across desktop/tablet/phone.
6. Analytical arrays match point-for-point.
7. NOW and Analyze are independent concurrent instances.
8. Library is unobstructed while Analyze is parked.
9. Plain/Standard/Technical remains correct.
10. Batch Add passes in NOW and Analyze.
11. Zero page/console errors.
12. Failed migration stages are discarded, not forward-patched.
13. Owner receives a candidate only after all automated gates pass.
14. Lab green is never reported as owner acceptance.

## Failure rule
On any stage failure:
1. stop
2. discard that stage candidate
3. return to last passed stage
4. identify exact differential failure
5. apply one minimal correction
6. rerun that stage and affected earlier gates

No rescue chains on a failing architectural candidate.


## Additional controls added after Review Round 1

### Source-control and stage isolation
- Each stage gets its own candidate file and its own qualification workflow.
- A failed stage candidate is never patched forward into the next attempt.
- Only Market Navigator paths may be changed.
- Before each commit, main must be refreshed fast-forward-only; any conflict stops work.
- Every stage commit must contain the stage evidence/plan record with the product delta.
- The owner-facing last-known-good file is never overwritten during development.

### Canonical surface fingerprint
Before Stage 2, record a fingerprint of the accepted NOW surface:
- canonical subtree HTML structure;
- class list and relevant computed-style values;
- bounding boxes;
- z-index/stacking relationships;
- control order and text;
- canvas plot rectangle;
- selector/event inventory.

For NOW, any structural or style fingerprint change is release-blocking unless the owner explicitly approved that exact visible change.

### Deterministic visual comparison
Visual qualification uses fixed evidence data and fixed fonts/environment. Dynamic canvas/date areas may only be masked when the underlying resolved arrays and plot geometry are independently compared. No mask may cover chart chrome, controls, legend, footer, modal edges, or navigation.

### Adversarial state isolation
Tests must prove the controller does not secretly depend on shared globals:
- freeze or proxy NOW state while Analyze changes;
- mutate Analyze rapidly while asserting NOW state remains byte-for-byte unchanged;
- run both instances concurrently with different roots/horizons/display modes;
- destroy/recreate Analyze repeatedly and assert no listeners/state leak;
- rapid horizon changes, Add while data is resolving, and navigation to Library while Analyze is loading.

### Clone safety
Analyze may clone only the canonical chart subtree. The clone must:
- remap IDs or use root-scoped roles so there are no duplicate document IDs;
- use the same CSS rules, not Analyze-specific copies;
- use the same controller event binding;
- contain no consumer-name branches in chart mathematics/state transitions;
- prove that identical chartSpec inputs resolve to identical datasets in NOW and Analyze.

### Library independence proof
A class toggle is not enough. Qualification must prove:
- Library receives pointer/keyboard input while Analyze is parked;
- Analyze has no visible pixels or active hit targets over Library;
- Library scrolling, analysis selection, Plain/Standard/Technical and composer controls work;
- returning to NOW restores Analyze without reinitializing its chart state.

### Batch Add atomicity proof
Tests must stage selections in at least three tabs, change search text, cancel once, close with X once, then apply with OK once. Before OK, chart state must be unchanged. After OK, all and only staged eligible series appear once in deterministic order.

### Performance/lifecycle guard
Create/update/resize/destroy cycles are repeated at least 25 times in browser qualification. Listener counts, instance counts and DOM node counts must return to baseline after destroy. No release if the controller leaks instance state or event handlers.

## Additional controls added after Review Round 2

### True-module proof
Shadow parity cannot be achieved by simply calling legacy chart entrypoints.
- The controller may use shared canonical data-access primitives.
- It may not call legacy NOW/Analyze state-transition, series-preparation, axis-policy, picker-state, or render-orchestration functions.
- A dependency/code-search gate records every legacy function referenced by the controller. Any chart-behavior dependency blocks Stage 2.
- Consumer identity such as NOW or Analyze may not enter chart mathematics or state-transition code. Presentation capability flags are allowed only for visibility/density.

### Event ownership proof at NOW cutover
Stage 5 must prove exactly one live handler path per chart operation.
- legacy chart event handlers are detached or gated off before controller activation;
- listener instrumentation records one transition per user action;
- double-render, double-Add, duplicate horizon updates and duplicate tooltip events block release.

### Analytical coverage matrix
Parity must cover RSK, GRW and MAC; every supported horizon; Fixed and Horizon; index-only, component-only, market-comparison and mixed measurement-family cases; eligible Y1+Y2; unavailable-series cases; and at least one irregular/low-frequency series.
Compare series order, timestamps, native values, indexed values, axis assignments, domains and final plotted coordinates.

### Visual acceptance thresholds
At reference viewports:
- NOW chrome/control DOM structure is exact;
- target is exact geometry equality; any sub-pixel browser rounding difference must be documented and separately approved before release;
- text/control order and visibility are exact;
- no new overflow or clipping;
- no unmasked chrome raster differences;
- canvas is also validated by deterministic plotted-coordinate comparison.
No subjective "close enough" result clears a failed gate.

### Immutable accepted baseline
`market-navigator-turn28-post-ship.html` is read-only for this program. Development uses new stage candidates only.

### Immediate rejection rule
Any owner-visible NOW regression causes immediate rejection and rollback to the accepted baseline in the same session. Do not diagnose by forward-patching the rejected candidate.

## Non-goals
No chart redesign, index-math change, Dashboard work, Health/source change, Library redesign, AI change, or unrelated cleanup.

## Owner acceptance package
Provide:
- exact candidate URL
- exact baseline URL
- intended visible changes
- explicit expectation that NOW chrome/geometry is unchanged
- automated visual/behavior results
- owner qualification required before promotion

## Review log

### Round 1 — Manager review: NOT CLEARED
Findings:
1. The plan did not define stage-level source-control isolation or prevent another rescue-patch chain.
2. "Pixel/geometry" was not specific enough to prevent masking or screenshot-only false confidence.
3. Clone safety, duplicate IDs and simultaneous-instance lifecycle were not explicitly controlled.
4. Library independence was stated as behavior but not tested at input/hit-target level.
5. There was no stress/race/leak gate.

Required changes were added under Additional controls after Review Round 1.

### Round 1 — Red-team review: NOT CLEARED
Attack paths identified:
1. A candidate could pass screenshots while using the wrong data or masking meaningful regions.
2. A controller could still read/write globals and appear isolated under ordinary click tests.
3. Analyze could be a visually similar clone with duplicate IDs, divergent handlers or consumer-specific branches.
4. Batch Add could mutate state before OK yet still end with the expected final list.
5. Parking Analyze could hide pixels while leaving an invisible layer intercepting Library input.
6. Repeated create/destroy or rapid async actions could expose leaks and races missed by steady-state tests.

Countermeasures were added: deterministic visual fixtures, analytical-array comparison, global-state proxies, clone/ID rules, atomic Add assertions, hit-target checks, and lifecycle/race stress.

### Round 1 disposition
Plan revised. Proceed to Manager Review Round 2.



### Round 2 — Manager review: CLEARED
Review focus: scope control, sequencing, rollback, evidence, source-control safety, owner acceptance, and whether the plan can reach a true callable implementation without placing NOW at unnecessary risk.

Two final clarifications were required:
1. prove single event ownership at NOW cutover so legacy and controller handlers cannot both fire;
2. define visual acceptance as baseline equality rather than subjective similarity.

Both are now explicit. Manager disposition: CLEARED FOR OWNER PLAN REVIEW. This is not authorization to implement.

### Round 2 — Red-team review: CLEARED
Adversarial checks against the revised plan:
- wrapper masquerading as module: blocked by legacy-dependency gate;
- consumer-specific math hidden inside one class: blocked by no-consumer-identity rule;
- screenshots passing with wrong data: blocked by analytical matrix and plotted-coordinate checks;
- duplicate handlers after attach: blocked by event-ownership instrumentation;
- global-state leakage: blocked by frozen/proxied concurrent-instance tests;
- hidden Analyze overlay intercepting Library: blocked by pointer/keyboard hit-target tests;
- Add changing state before OK: blocked by staged-state atomicity test;
- async/race/leak failures: blocked by rapid-action and repeated lifecycle tests;
- accidental modification of accepted baseline: blocked by read-only baseline rule;
- rescue-patch chain after owner rejection: blocked by immediate rejection/rollback rule.

No unresolved release-blocking gap remains. Red-team disposition: CLEARED FOR OWNER PLAN REVIEW. This is not authorization to implement.

### Final review disposition
- MANAGER: CLEARED
- RED TEAM: CLEARED
- PRODUCT IMPLEMENTATION: OWNER APPROVED 2026-10-04 / STAGES 0–6 PASS / OWNER QUALIFICATION


### Execution record — Stage 0
- Baseline characterization workflow: PASS.
- Accepted blob verified exactly: `9ce7f67451f9e1b7804927ce5c56adb667614724`.
- Viewports characterized: 1887×800, 1440×900, 800×1280, 412×915.
- Screenshots and JSON characterization uploaded as workflow evidence.
- Initial harness failure on narrow viewports was caused by the accepted rail being intentionally collapsed; the harness was corrected to open the rail before testing Library. No product code was changed.
- Passing run: GitHub Actions run `37194989755`.


### Execution record — Stage 1
- Dependency/seam map: PASS.
- Accepted chart operations, chart-related state keys, DOM roles, consumer/application boundaries and future controller ownership are recorded in `market-navigator-turn37-stage1-map.json`.
- The initial map gate failure was a test-regex defect that matched `health` as if it were the horizon key `h`; only the gate matcher was corrected. No product code changed.
- Passing run: GitHub Actions run `37195154351`.


### Execution record — Stage 2
- Non-driving shadow controller: PASS.
- The controller resolves canonical series, windows, Fixed/Horizon math, active-series/Y1+Y2 policy and analytical arrays without touching DOM or NOW/Analyze chart state.
- Source isolation gate proves the controller does not call legacy NOW/Analyze renderers, picker renderers, series-preparation functions or chart-state globals.
- Accepted NOW DOM, geometry and raster output are identical to the accepted baseline at all four protected viewports.
- Shadow analytical output matches accepted NOW point-for-point for RSK/GRW/MAC across 5D/YTD/1YR/3YR/5YR and Fixed/Horizon, plus standalone Analyze root parity.
- The first Stage 2 harness run failed only because the test stayed inside RSK while attempting to click GRW; the harness was corrected to return to ENV between root tests. No product code changed.
- Passing run: GitHub Actions run `37195390457`.


### Execution record — Stage 3
- Analyze driven by the shared controller while NOW remains on the accepted path: PASS.
- NOW DOM/state/geometry and plotted canvas remained baseline-equivalent at 1887×800, 1440×900, 800×1280 and 412×915.
- Analyze horizon/display changes did not mutate NOW state.
- Library remained usable while Analyze was parked; returning to NOW restored the same Analyze state.
- Accepted Plain / Standard / Technical controls remained intact.
- The latest apparent Stage 3 failure was isolated to raw PNG file-byte nondeterminism at the 412px viewport; product DOM/state/geometry and canvas output matched. The flaky PNG-byte assertion was replaced with exact DOM/state/geometry plus exact canvas comparison. No product code changed.
- Passing run after harness correction: GitHub Actions run 37197667596.

### Execution record — Stage 4
- Shared grouped batch Add state machine: PASS.
- NOW and Analyze both use the same generic batch-picker state machine.
- Tabs are exactly Risk / Growth / Macro / Other.
- Rows are alphabetically ordered with deterministic ID tie-break.
- Multi-select staging survives tab changes and search.
- OK applies all and only staged eligible series once; Cancel and X mutate nothing.
- Already-present series are excluded.
- Stage 3 NOW differential/isolation regression remained green.
- NOW chart rendering/controller cutover was not performed.
- Passing workflow: GitHub Actions run 37202063237.
- Qualified candidate commit: 124e281f4d50b45449aa2dcea55db9301d599c33.
- Stage 5 remains blocked until explicit owner go.


### Execution record — Stage 5
- Controlled NOW cutover to the shared controller: PASS.
- Accepted NOW visual/geometry regression gates passed across protected viewports.
- Live controller analytical output matched the shadow resolver.
- Event ownership gate passed.
- Analyze isolation, Library independence and shared batch Add remained green.
- Passing workflow: GitHub Actions run 37205146976.
- Passing commit: 1e0cda8485ed5a7a88c0f1a34a3550ba274c43ec.

### Execution record — Stage 6
- Status: IN PROGRESS.
- Owner authorized removal of deprecated/duplicate chart code and end-to-end testing.
- Scope: retire the superseded NOW render/data/picker paths and superseded Analyze render/data/picker paths; retain the accepted DOM/CSS and shared low-level draw primitive.
- One unified controller attach path must own NOW and Analyze state transitions, horizon/series/display changes, batch Add, lifecycle and rendering inputs.
- Full Stage 3 differential/Library gates plus Stage 6 event/data/Add/lifecycle gates are mandatory before an owner test URL is produced.


#### Stage 6 gate note — initial build
- The first Stage 6 run stopped at the source-retirement gate before syntax/browser execution because a second legacy `renderV2` definition sat outside the first removal range.
- No Stage 6 product candidate was published or owner-facing.
- The builder was corrected only to remove that exact remaining deprecated range, then the stage restarts from the same passed Stage 5 source.


#### Stage 6 gate note — boot diagnostic
- The next Stage 6 attempt passed build, source-retirement and JavaScript syntax, then failed because the candidate never reached the established ready state.
- No candidate was published.
- A read-only browser diagnostic was added to capture the exact runtime exception before any Stage 6 product correction is attempted.


#### Stage 6 boot RCA — strict-scope compatibility names
- Diagnostic proved the first runtime failure was `openStandaloneAnalysis26 is not defined`.
- Cause: the accepted application executes inside a strict-mode IIFE. Stage 6 correctly removed the legacy Analyze implementation, but the later controller adapter assigns the compatibility name. In strict mode that assignment requires the name to have been declared first.
- Correction: declare only the three compatibility names (`openStandaloneAnalysis26`, `closeStandaloneAnalysis26`, `standaloneAnalysisState26`) at the application scope; the first two are assigned to the controller-backed Analyze adapter and the third is a thin read-only snapshot wrapper.
- No legacy Analyze renderer, series preparation, horizon renderer, or picker is restored.


#### Stage 6 baseline parity RCA — ENV snapshot semantics
- Boot, source retirement and syntax gates passed.
- The first differential browser comparison then stopped Stage 6 because ENV snapshot metadata differed from the accepted baseline in two exact fields: chart active series was `risk` instead of neutral `null`, and ENV index series axis labels were `Indexed 100` instead of `Index`.
- Cause: the retired legacy `renderV1` had two presentation-state special cases after generic snapshot creation. The unified controller had preserved the data and pixels but had not yet encoded those ENV-only snapshot semantics.
- Correction: encode those two accepted ENV rules in the unified controller. No legacy renderer is restored.


#### Stage 6 ENV axis-label follow-up
- The differential gate confirmed the neutral ENV active-state correction worked.
- The remaining mismatch was only the ENV series `axisLabel`.
- RCA: the canonical resolver returns the root under `resolved.spec.root`, not `resolved.root`; the first correction checked the wrong property and therefore fell through to the indexed label.
- Correction: use the resolver's actual `resolved.spec.root` contract. No presentation or mathematics change.


#### Stage 6 Analyze painter bridge RCA
- NOW reached exact baseline parity and the browser gate advanced into Analyze.
- Analyze failed because retained canonical `draw('analysis')` resolves `analysisChart`, `analysisTip`, and `analysisWrap` by their accepted IDs, while the Stage 3 canonical-surface clone removed all IDs.
- Correction: after the original Analyze modal contents are cleared, the clone receives the accepted analysis-local IDs, so there are no duplicate document IDs. The same unified controller still owns data/state and the same shared `draw()` painter serves both consumers.
- Analyze inspection-active changes are routed back into the controller rather than restoring legacy Analyze state ownership.


### Execution record — Stage 6 PASS
- Deprecated duplicate chart paths retired: PASS.
- Exactly one live controller attach owner: PASS.
- Accepted NOW visual/geometry parity: PASS.
- NOW analytical/data parity: PASS.
- Single event ownership: PASS.
- Shared grouped batch Add atomicity: PASS.
- Analyze isolation: PASS.
- Library independence while Analyze is parked: PASS.
- Analyze create/destroy lifecycle repeated 25 times without state leakage: PASS.
- Plain / Standard / Technical Library interpretation controls retained: PASS.
- Qualification workflow: GitHub Actions run 37210928051.
- Qualified Stage 6 artifact commit: 6a98d356ce84c804c483b8a9af5198eda5c8113c.
- Qualified artifact: `market-navigator-turn37-stage6.html`.
- Evidence: `market-navigator-turn37-stage6-evidence.json`.
- Next gate: owner qualification only. No promotion is implied by lab PASS.


Resize qualification correction: an exact Chrome raster comparison caught the accepted rail width transition (.14s). Baseline last-painted coordinates used width 1681.0625 while its snapshot DOM had already reached 1681; candidate had painted final width 1681. Strict coordinates pinpointed a transient baseline oracle. Readiness now waits for the existing rail animation to finish and two repaint frames in both applications. No pixel tolerance/mask or product styling/math change was introduced. The comparison is rerun at exact equality.

Test fixture correction: the canonical definition identifies Payrolls as a GRW component. Final component-specific Add and unavailable-anchor cases use that actual membership; Retail Sales remains an eligible comparison series. No definitions, components or product code changed.

CI checkout correction: run 37425526917 failed the pinned baseline guard before executing browser tests. Windows checkout converted the accepted LF blob to CRLF (1768382aafe7080eef7066f5d5c2f5d6062eb10d instead of 9ce7f67451f9e1b7804927ce5c56adb667614724). Recovery CI now disables autocrlf and selects LF before checkout. No baseline/candidate product bytes, chart math or styling changed; the integrity guard remains exact.


Exact-commit CI qualification: candidate commit 301ff83c6c66be4e682eff2ebf9f8640b88f5431 passed Chrome and Edge run https://github.com/acmeproducts/stuff/actions/runs/37425781443. Each job passed 320 independent NOW states, 82 repeated interactions, 266 independent Analyze checks, 100 lifecycle cycles, source/lineage gates and zero-error assertions. Both browser artifacts are uploaded. Product blob fd07e6eba729c8b2e400b66fa8ddad3e7a1f25d2 / SHA-256 fe5a1883bfde62deb059bfc9567bff2e072d09a054e7b382d14e313cd0887730 is unchanged by the checkout-only CI correction. Records-first override was rebased onto fresh main as 7722d22996ff4921697420995859aa8712f89c7a before product commit d5bcf9094cab24f16d1a947da54f6a0fc72295ca. PR: https://github.com/acmeproducts/stuff/pull/843. Owner Windows 11/Android acceptance remains PENDING; publication verification follows below and does not promote an alias.

## Recovery publication verified — October 6, 2026

Owner candidate: https://acmeproducts.github.io/stuff/market-navigator-recovery-candidate.html

Independent immutable baseline: https://acmeproducts.github.io/stuff/market-navigator-turn28-post-ship.html

Qualified candidate commit: 301ff83c6c66be4e682eff2ebf9f8640b88f5431. Passing Chrome/Edge qualification with uploaded reports and screenshots: https://github.com/acmeproducts/stuff/actions/runs/37425781443. PR https://github.com/acmeproducts/stuff/pull/843 was merged at d58d69c7563546b31c76d1cb01dc7014b64a9437. Pages deployment succeeded: https://github.com/acmeproducts/stuff/actions/runs/37427138554.

Both public URLs returned HTTP 200. Deployed candidate SHA-256 is fe5a1883bfde62deb059bfc9567bff2e072d09a054e7b382d14e313cd0887730; baseline still has Git blob 9ce7f67451f9e1b7804927ce5c56adb667614724. Live published-browser checks passed visible NOW launch, anchor-only/full-page Analyze, immediate Add of actual Payrolls component, horizon changes, real Library input and creation guard, exact parked-session restoration, and X preserving normal NOW. No unexpected console or page errors occurred. The site's implicit https://acmeproducts.github.io/favicon.ico request returns 404 on both immutable baseline and candidate; that exact known site-icon error is recorded separately, not counted as an unexpected application error.

Merge-tree comparison against the immediate main parent proved exactly 15 Market Navigator paths changed, all unrelated blobs preserved, and Turn 28 unchanged. No production/default alias was promoted. Separate historical Turn 23 and Turn 25 workflows failed their existing static/governance/JavaScript and exact-baseline build steps, respectively; their target implementations/builders were untouched. This does not mean every repository workflow is green: the dedicated recovery qualification above is the passing evidence for this candidate.

Gate 17's public URL/commit/workflow package is now verified. Automated gates 0–16 and live publication checks do not substitute for owner acceptance. Windows 11 Chrome/Edge at 1440x900 and 1887x800, and Android Chrome at 800x1280 and 412x915 remain PENDING; recorded lab viewport/touch emulation is not real-device qualification. Stage 6 owner rejection remains authoritative; NOW-first extraction and single immediate Add replace the rejected path; batch Add stays deferred.

## Owner feedback corrections — October 6, 2026

This entry supersedes prior parity/qualification claims for the reported behaviors. The owner reported: “fixed v horizon doesn't change chart”; “crosshair opens info card this is wrong”; a verbose/off-topic Library report after one newspaper tap; and an index-only ⓘ card with unusable Copy/Download for QQQ. The attached Markdown has 44,421 characters, six “## Analysis” blocks and 12 “Date not supplied” labels. No real-device acceptance is inferred from “some progress.”

Before candidate: SHA-256 fe5a1883bfde62deb059bfc9567bff2e072d09a054e7b382d14e313cd0887730, qualified source commit 301ff83c6c66be4e682eff2ebf9f8640b88f5431. Six focused checks failed on its unchanged bytes: identical raw Fixed/Horizon values; a plot tap opening metadata; empty raw explanation; three unrelated model records with zero scoped indices; exporting every interpretation; and newspaper refresh changing the chart and generating another analysis.

Causes and corrections:
- Fixed/Horizon previously applied only to governed index curves. Raw Fixed now uses each series' earliest real nonzero canonical observation as a persistent base; Horizon retains the real observation at/before the selected window start. Switching horizon preserves Fixed values for overlapping dates. Canonical values and governed index mathematics are unchanged. A subsequent failing check exposed Data still using the window baseline; Fixed Data now derives its base from the frozen chart and matches its indexed values.
- Plot-point inspection still invoked the legacy component card. Ordinary mouse/touch inspection now selects and shows the value tooltip only. Explicit plot context-menu and existing legend information gestures retain access to series information/Analyze. Empty charts are safe; destruction clears the new context-menu handler.
- Empty model scope incorrectly fell back to all three indices. Frozen raw-only evidence now contains zero index-health models. The AI boundary also filters older saved evidence to explicitly scoped indices. Membership of QQQ in GRW does not put GRW, RSK, MAC or their other components in a QQQ/Claims report.
- Newspaper refresh now retrieves scoped sources without another AI report or chart recalculation. It preserves the exact selected frozen chart, even while Analyze is parked. Reference data/methodology pages are separated from dated releases. Reporting must be specific, relevant, dated from supplied publication metadata and within the selected window; generic landing pages, unrelated releases, undated reporting and out-of-window stories are excluded. Missing dates are not fabricated or repeated as labels.
- Markdown download uses the active interpretation plus user/follow-up turns, omitting alternate interpretations and duplicate initial titles. The full saved record/JSON and prior report prose remain intact.
- ⓘ now opens Chart Explanation: selected raw series, units/cadences, actual observation dates and raw changes, display/rebasing rules, timing caveats and source links. Explicitly scoped governed indices retain their deterministic contribution records. Both Copy and Download MD export this frozen content; the file is named chart-explanation rather than index-explanation. Desktop/phone screenshot review led to readable theme-colored source links, separate per-series timing/source paragraphs, and a selected-series status instead of zero-index boilerplate on raw-only charts.
- Initial report prompts request about 350 words for Plain/Standard or 600 for Technical, selected-series scope, and no inferred causal drivers from price changes alone. Provider transport, configuration and analysis persistence are preserved.

Qualification: focused owner suite PASS in installed Chrome and Edge at 1887×800, 1440×900, 800×1280 and 412×915: 24 checks per browser, including touch, real clipboard-handler invocation and actual Markdown downloads. Newspaper/provider responses are mocked to validate scope, supplied dates, irrelevant/undated/out-of-window filtering and zero extra chat calls; no paid provider generation or AI prose quality is claimed. Local full recovery gates PASS: 320 NOW comparisons, 82 repeated interactions, 266 independent Analyze checks, 100 lifecycle cycles; no unexpected application errors in passing runs. Raw Fixed reference values are calculated independently from canonical observations while Turn 28 retains DOM/CSS/index mathematics/drawing as the oracle. Its immutable on-disk blob remains 9ce7f67451f9e1b7804927ce5c56adb667614724.

Failed/stopped lab runs are excluded: an early concurrent build exhausted local memory; repeated AST parsing was reduced to one parse and the rebuild passed. Three concurrent long browser runs were stopped and freshly rerun; the fresh full suites passed. Early harness corrections used the canonical initialClaims ID, real Markdown rendering and the existing collapsed-phone rail toggle; these did not change product behavior. The intermediate Fixed/Data mismatch was reproduced before its targeted correction and all focused cases passed afterward.

Current candidate SHA-256: ac96172ac31a38692e703fce401ba43428bda076f792c8d3aa65b479330892b5. Exact new commit/CI/deployment links and public-byte verification will be appended after qualification. Only named Market Navigator paths ship. No baseline/default alias, canonical data, index math, provider/configuration, Health or unrelated navigation is changed. Library source refresh/export and AI scope/prompt changes above are narrow exceptions explicitly authorized by this owner's feedback. Windows 11/Android real-device acceptance remains PENDING; batch Add remains deferred.


## Owner corrections qualification and publication hold — October 6, 2026

Qualified code commit: 9bc57e080c2f29dcef8c38d2ad942540a1a24d7e; candidate SHA-256 ac96172ac31a38692e703fce401ba43428bda076f792c8d3aa65b479330892b5. Exact-commit Chrome and Edge qualification passed: https://github.com/acmeproducts/stuff/actions/runs/37454355134. Both browser artifacts are uploaded (Chrome 11409047121; Edge 11409661369). Each job passed the full recovery suite and 24 focused owner-feedback checks across the four prescribed viewport layouts. CI browser/touch emulation and local Windows 10 tests do not constitute Windows 11 or Android owner acceptance; AI prose/provider results remain unverified.

Reviewable change: https://github.com/acmeproducts/stuff/pull/844. Automatic approval review rejected merging this PR into shared main because owner real-device acceptance remains pending. No new merge or Pages deployment occurred, and public candidate bytes have not been updated to this qualified commit. The earlier publication section describes the prior 301ff83 candidate only. An explicit request to publish the corrected recovery candidate for owner testing is pending; no workaround to the rejection is attempted. Local preview serves the exact qualified candidate and canonical JSON without changing its bytes. Turn 28 and default product aliases remain unchanged.


## AI POV recovery — October 6, 2026

Owner expectation: the attached QQQ/WTI Library entry should not cut off in September when daily canonical evidence is available in October; its POV should explain measured correlation, what it means or does not mean, and whether co-movement is typical rather than simply recite index values. Attachment: Market-Read-QQQ-vs-WTI-2025-09-22-2026-09-22-.md. The assessment rejected the report as a completed current analysis; no owner acceptance is inferred.

The previous correction PR 844 was subsequently merged by the owner at 9626978945a6757c60fe508b681d270c66b41b18. Pages run https://github.com/acmeproducts/stuff/actions/runs/37534160748 succeeded; the public ac96172ac31a38692e703fce401ba43428bda076f792c8d3aa65b479330892b5 bytes and existing controls were verified. The earlier publication-hold entry is historical. That verification did not test actual AI prose quality and did not grant Windows 11/Android acceptance.

Causes: horizonWindow read the 2026-09-22 persistent-derived anchor (generated September 23) for raw-only Analyze too, while native QQQ and WTI observations extended to October 5 and October 6. aiEvidenceState sent counts and endpoints, without interior observations or calculated pair statistics. The report inferred correlation from endpoint gains, called a 14-day gap a month, and invented an energy-earnings/risk-on/demand/supply narrative without qualifying dated reporting.

Corrections:
- Raw-only chart windows now resolve actual canonical dates through a shared service. Daily series use their latest shared UTC observation date; periodic companions retain their actual source dates. Calendar 1D/5D/MTD/YTD and clipped calendar-year horizons derive from that anchor. An absent shared date is explicitly identified, without synthetic fills. QQQ/WTI at the assessed revision ends October 5, not an invented October 6 closing quote. The clock follows the loaded native data revision rather than the computer's calendar date.
- Any included governed composite uses its existing coherent derived window and mathematics. Its older date is not relabelled current or mixed with invented index observations. The canonical collection/persistent-index pipeline, frozen scales, weights, data and definitions are preserved; this change corrects the raw-comparison clock, not composite production governance.
- Deterministic relationship evidence calculates Pearson coefficients on native levels and on changes separately. Positive prices use simple percentage changes; rates/quantities/governed index series use native-unit changes. Matching uses actual UTC source dates, latest observation per date, without filling/interpolation. Consecutive shared-date intervals may span closures and do not synchronize intraday closes. Native quotes are not total returns or roll-adjusted futures returns. Mixed/unknown/intraday cadences, fewer than 20 changes, constant inputs and nonpositive price endpoints retain explicit unavailable/excluded results.
- New AI creation freezes the selected-window metrics, last-60-change statistics and a bounded three-year reference before persistence or provider work. Outside-window reference history is captured from the already loaded canonical revision, while visible frozen points retain precedence. Partial three-year coverage is marked unavailable; the reference overlaps the selected window and is not a significance test. Fingerprints include chart identity, measured results and available canonical source revision provenance.
- AI creation and follow-up/live-query prompts ask for a relationship judgment, recent/longer comparison, practical meaning, competing hypotheses and evidence that would distinguish them. Endpoint gains alone cannot establish correlation, current drivers require dated sources, and lead/lag/causation/prediction must not be invented. Methodology/catalog pages do not establish contemporary events. The application appends an authoritative Measured relationship section to the initial report and exposes these measurements through the existing Chart Explanation card.
- Historical Library charts and prose are preserved. Legacy evidence derives metrics from its frozen chart only; it does not acquire current outside-window reference history. Explicit Library live queries can build a new measured checkpoint, preserving the original and the NOW-only Analyze lifecycle. Newspaper refresh remains sources-only and keeps its frozen chart.

Independent diagnostic at the assessed canonical revision: reported year levels r=+0.4455 versus change r=-0.2763 (251 shared-date changes). Latest shared year change r=-0.2732 (250); last 60 changes r=-0.4857; three-year change r=-0.0515 (751). These are descriptive results, not significance or causal findings. Daily co-movement cannot be inferred from both annual endpoints rising.

Regression baseline: exact previous candidate ac96172ac31a38692e703fce401ba43428bda076f792c8d3aa65b479330892b5. Five focused cases failed (stale clock, absent metrics, absent edge handling, legacy relationship payload, AI payload/measured report); unchanged Library restoration passed. The initial desktop correction passed all six cases. Qualification now requires six cases on each of four viewports (24/browser), independent canonical arithmetic, display-mode invariance, frozen history, mocked provider requests and actual saved reports, plus all existing 18 recovery gates. Phone testing caught a harness assumption: the existing Library detail view hides its list search, so the test uses the actual Back control before typing. No product layout change or force-click bypass was needed. A stale generated HTML failed the exact rebuild guard after helper edits; it was regenerated, and the unchanged exact guard passed.

Current candidate SHA-256: 3f2a24ad2191d148f0b2a73d40dbe07c8b7ede578c5841d344c97ec45f9df8c9. Local full/targeted completion and exact-commit CI links will follow. All provider calls in automated POV checks are mocked; actual AI prose and real Windows 11/Android acceptance remain PENDING. Keep Turn 28 blob 9ce7f67451f9e1b7804927ce5c56adb667614724 immutable, preserve default aliases and unrelated project paths, and defer batch Add.


Local AI POV recovery qualification completed: 320 independent NOW comparisons, 82 repeated interactions, 266 independent Analyze data/geometry/coordinate/raster checks, 100 actual open/X lifecycle cycles, 24 prior owner-feedback checks and 24 new POV checks in Chrome; 24 focused POV checks in installed Edge. Source ownership, protected behavior, immutable baseline and reproducible-build guards passed. Raw AI evidence now identifies native source revisions and omits the unrelated composite-generation timestamp; this distinction is checked in the mocked provider payload. All canonical files, governed index mathematics and production aliases are unchanged. Exact-commit Chrome/Edge CI is required before candidate publication; actual provider prose and owner Windows 11/Android qualification remain PENDING.


## AI POV exact-commit qualification and publication hold — October 6, 2026

Qualified code commit 46b57e130450c3e0cfed1a17fd9a38c7019a2b49 passed both complete Chrome and Edge jobs: https://github.com/acmeproducts/stuff/actions/runs/37557416676. Uploaded browser artifacts include the 18-gate reports, independent comparisons, 100 lifecycle cycles, 24 prior owner checks and 24 new POV checks per browser. Candidate SHA-256 is 3f2a24ad2191d148f0b2a73d40dbe07c8b7ede578c5841d344c97ec45f9df8c9; product Git blob c44536ddef98fc75fff3628ba492f56030569f15. PR https://github.com/acmeproducts/stuff/pull/845 changes exactly 11 named Market Navigator paths; Turn 28 remains blob 9ce7f67451f9e1b7804927ce5c56adb667614724. Desktop/phone screenshots of Chart Explanation were inspected, with current native dates and measured coefficients; no layout/style redesign was introduced.

Automatic approval review rejected merging PR 845 into shared main: owner Windows 11/Android acceptance and actual AI prose review remain pending, and lab CI does not satisfy that release condition. An explicit request to publish this recovery candidate for owner testing is pending. No retry/workaround or new public deployment is attempted. The corrected exact-byte local preview is http://127.0.0.1:8784/market-navigator-recovery-candidate.html?ai-pov=46b57e1 . The public candidate still contains the preceding owner-merged correction, not this AI POV update. A prepared public test will verify bytes, latest shared native window, measured evidence, Data, Copy/download, crosshair and Library restoration after authorized publication. Actual AI prose must be evaluated on a newly generated entry; historical saved entries stay frozen.

## Entire-corpus recovery record — October 6, 2026

Owner scope supersedes a two-example freshness fix: vet every persisted Market Navigator file and add guardrails, recurring checks and bounded self-repair. The pinned main corpus 0729abc0c8fc2e7bd4ef52c4bfdf98d3d9f4b575 contains 146 JSON files, 40 catalog entries and three models. Seven blockers were reproduced: three stale persistent captures and both GDP percentage series containing levels plus missing parent provenance. Repaired data have zero blockers, 39 current enabled series and disabled PMI. Legacy/research files remain inventoried and unchanged, not promoted as current sources.

GDP transforms honor canonical parent math/revisions. Persistent recovery is append-only with actual source collection dates and frozen parameters. The September–October uncaptured gap remains explicit; short index windows disclose insufficient history with a fully visible phone notice. Health consumes canonical collection facts. Daily collection and three guard runs use strict corpus qualification, one targeted collection pass and transactional publication. Failure retains the previous payload and publishes HELD status; served asset hashes are checked after Pages with a single deployment rerun. Current AI checks audit age, selected scope and source/byte lineage before persistence/provider calls. Historical Library evidence and NOW-only Analyze lifecycle remain preserved.

Local checks: 14 Python fault/invariance tests, 32 browser guard checks, four actual repaired-data layouts, YAML/publication boundaries and reproducible shared-source guards. The full lab run passed 320 NOW comparisons, 82 interactions, 266 Analyze comparisons, 100 open/X cycles and 24 owner plus 24 POV checks. Exact delivered-commit CI remains required. Candidate SHA-256 f4eae1a50009eb00176999f97c43f6fb717768e04b5a6d6c37e51471df014fa5. MARKET-NAVIGATOR-CORPUS-AUDIT.md and the independent before/after audit JSON describe scope, policies, limits and repair evidence.

Stage 6 owner rejection remains authoritative; NOW-first extraction remains the foundation and batch Add is deferred. Turn 28 blob 9ce7f67451f9e1b7804927ce5c56adb667614724 and default aliases remain immutable. Real Windows 11/Android and actual provider prose acceptance remain pending. Automatic approval review rejected PR 845 promotion for those pending conditions; this review-branch update does not bypass that publication hold.

## Before-display reliability requirement — October 6, 2026

The owner explicitly requires timing shortfalls to be detected and repaired before chart/report consumption, without asking the owner to discover or fix them. This overrides the earlier AI-only admission scope. Backend guard checks now run hourly (00:37–22:37 UTC guard runs plus the existing 23:37 daily collection), with one targeted recovery pass and strict transactional publication. Production scheduling/deployment remains gated by the outstanding publication authorization.

The audit publishes a validUntil deadline for every enabled source and each dependent index, using the same native publication rules and the 48-hour collection heartbeat. Deadlines stop a stale cached audit from admitting data across a release/heartbeat boundary. The shared chart module awaits source/model admission before its first draw or any new render, guards redraws, and owns an expiry/background-check timer cleaned up on destruction. Unqualified data produce zero chart paints. Normal NOW retries and resumes automatically on a qualified coherent publication; Library stays usable. Parked Analyze snapshots are preserved and are never silently refreshed or retargeted by the background timer. A persistent upstream failure produces one concise availability status, without a request for the owner to diagnose or correct data.

Qualification adds two independent backend deadline tests (16 Python tests total) and 24 pre-display fault cases per browser across four layouts: zero first paint while HELD, automatic publication recovery without a click, native deadline expiry independent of AI, rejection of expired evidence despite a fresh audit timestamp, Library availability and automatic NOW restoration. Chrome and Edge admission tests pass; source/reproducibility, actual repaired data and existing corpus guard checks pass. The complete chart lab rerun is in progress and exact-commit CI is pending upload. Automatic approval review still holds uploading repaired historical observations to the public review branch pending explicit owner publication authorization; no workaround is attempted.


Before-display local qualification completed: 16 backend fault/invariance tests; 32 admission/startup-recovery cases and 32 corpus/AI cases in each of Chrome and Edge; four actual repaired-data layouts; all 147 served local assets verified; complete chart lab rerun (320 NOW, 82 interactions, 266 Analyze, 100 cycles, 24 owner and 24 POV checks) passed. Candidate SHA-256 e3fb03fccb296491183e13f65a2e7fcc730e8d010283d16705f5d57df5b2d442. Bootstrap mismatches preserve DOM and Library and retry automatically without a reload. Audit hashes are regenerated after the publication rebase, before commit, to avoid publishing an out-of-date manifest. Gate 17 public verification and exact-commit CI remain pending; physical devices and actual AI prose remain pending. The repaired-data upload authorization is still outstanding, so this updated corpus candidate remains local and is not on PR 845 or public Pages.


## Review-branch publication authorization — October 7, 2026

The owner explicitly approved uploading the completed corpus repair and historical datasets to public PR #845 after the publication question identified the data disclosure and distinguished review upload from merge/deployment. This supersedes the earlier missing-upload-authorization hold; it does not authorize merging main or production promotion. The prepared 41-file transaction includes the whole-corpus repair, before-display admission, repaired data, independent audit evidence, and plan/Graveyard records. Candidate SHA-256 remains e3fb03fccb296491183e13f65a2e7fcc730e8d010283d16705f5d57df5b2d442; qualified native observations and original historical rows are unchanged by this authorization. A fresh strict audit verifies the actual snapshot before upload. Exact delivered-commit corpus and Chrome/Edge qualification are required after the branch update. Gates 0–16 have local lab evidence; public served-byte verification, owner Windows 11/physical Android acceptance and actual provider prose review remain pending. The review branch is not a live production release.

### Fresh pre-upload audit — October 7, 2026, 07:22 UTC

The fresh check caught optional registered GAAMHX crossing its five-day native observation allowance. One bounded recollection succeeded against its governed Yahoo Finance provider, but the provider still returned October 1 as its latest observation. Those observations were retained unchanged; only the actual collection/report/registration evidence was updated. The registration is degraded, and selected-scope chart/AI admission blocks this stale series. The current assessed snapshot has 38 current enabled series, one stale optional series, one disabled series, and zero publication blockers. Zero blockers does not certify that stale optional series as current. The three required governed models remain reproducible/current; no missing historical index captures were fabricated. This honest upstream-staleness condition supersedes the earlier 39-current assessed snapshot for the delivered data. Public upload to PR #845 is owner-authorized; production merge remains held.

## Preserve newer main data while resolving PR conflicts — October 7, 2026

Owner blanket authorization permits recoverable repository work while preserving history. The review branch incorporates main aa498ae43bf125766f6a47c804fc57b1a79fafea through a merge with both parents retained. Eighty-two incoming Market Navigator JSON blobs were verified before use; unrelated main changes remain intact. Every non-GDP native series preserves the exact incoming-main blob. The repair recomputes GDP from that revision's canonical parent and appends a real October 7 capture to each governed model, retaining every prior date, value, component signal/value/source date and prospective-capture record from review commit 20f3b0661a3ba30c6091ff5ebace9645efd0a2f6. Required current models remain reproducible; missing historical captures remain explicit. The fresh assessed corpus has 38 current enabled sources, one stale optional GAAMHX and one disabled source, with zero publication blockers. Four actual-data layouts pass against this merged corpus. The data qualification now checks chart timestamps against actual persisted captures instead of assuming the first recovery's one-point window remains permanent. Candidate HTML SHA-256 remains e3fb03fccb296491183e13f65a2e7fcc730e8d010283d16705f5d57df5b2d442. Exact merged-commit qualification remains required. Production device/prose/served-byte acceptance is not claimed.
