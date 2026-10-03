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
Pending manager and red-team review.
