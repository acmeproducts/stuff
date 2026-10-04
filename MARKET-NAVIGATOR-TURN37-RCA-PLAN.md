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
- PRODUCT IMPLEMENTATION: OWNER APPROVED 2026-10-04 / STAGES 0–3 PASS / STAGE 4 IN PROGRESS


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
- Status: IN PROGRESS.
- Scope is limited to the shared grouped batch Add state machine and its NOW/Analyze adapters.
- NOW chart rendering/controller cutover remains explicitly out of scope until Stage 4 passes.
