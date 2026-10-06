# Market Navigator recovery — owner qualification evidence

Status: implementation complete; automated lab qualification; owner real-device acceptance PENDING. Publication creates a new owner candidate; no accepted production filename is replaced.

Candidate: https://acmeproducts.github.io/stuff/market-navigator-recovery-candidate.html

Immutable baseline: https://acmeproducts.github.io/stuff/market-navigator-turn28-post-ship.html

Baseline construction commit: 996e9a71b72db5bfbea3ba77750077daaa2fb7ab; blob: 9ce7f67451f9e1b7804927ce5c56adb667614724. Baseline URL returned HTTP 200. Candidate publication and exact commit/run links will be verified after CI passes.

Candidate SHA-256: fe5a1883bfde62deb059bfc9567bff2e072d09a054e7b382d14e313cd0887730. The deterministic builder reads only verified Turn 28. No Turn 31–37 implementation is a donor. Records-first commit: 38f15c57fc44ddce6dbd5ac962f9f3511431f28e.

## Local measured evidence

| Check | Result |
| --- | --- |
| Baseline/NOW-only characterization before Analyze | Four layouts; 292 original states and 82 interaction comparisons |
| Final NOW against independent Turn 28 | Chrome and Edge: 320 exact state/DOM/geometry/raster/coordinate comparisons each, including every ENV/index horizon |
| Repeated breadcrumb/Add/horizon/display | Chrome and Edge: 82 independent comparisons each; three rounds per root |
| Independent Analyze comparison | Four layouts; three index anchors; seven horizons; Fixed/Horizon; three Adds; native-active dual axes; resize; ordered raw/indexed/native values, rendering input, raster and coordinates |
| Add universe | Baseline/candidate eligibility parity across indices/components/market series, unavailable 1D and periodic GDP cases; no About/batch staging |
| Analyze interaction/lifecycle | Visible NOW controls; one transition/publication per action; menu/info/data/exports/print; bidirectional isolation; throwing accessors protecting NOW; 25 launch/X cycles per layout |
| Library while parked | Saved selection; Plain/Standard/Technical; real keyboard draft, scroll and hit testing; no launch/retarget; exact restoration |
| Tablet/phone touch emulation | Touch selects/inspects once; ordinary legend clicks open no information |
| Targeted checks | Nondefault NOW with extra series/dual/rebase preserved; native anchor alone has index:null and eligible representation; real component plot-point launch; pending-data/navigation/destruction races |
| Source and scope | One module, two mounts, no identity branches or retired Analyze chart owner; reproducible build; unchanged AI/Library/interpretation/configuration/Health/data/index primitives by function-body inspection |
| Console | Passing runs require zero page errors and zero unexpected console errors |

Lab host: Windows 10 10.0.19045, installed Chrome/Edge. Viewport/touch matrix: 1887x800, 1440x900, 800x1280 and 412x915. These are not Windows 11 or Android real-device results. CI Windows Server runners are also a lab.

Information-dialog cleanup releases its invoking instance button on close. A before-fix diagnostic proved the reference remained connected after close; the fresh phone suite verifies null after close. One heavily concurrent phone run timed out dispatching an info click; a fresh full phone rerun passed. Independent phone A/B with the same multi-series dual chart opened info in 122 ms (Turn 28) and 147 ms (candidate), with zero console errors. Timeout cause was not established; that run is not counted as a pass. Final CI must pass the complete matrix on the exact committed candidate.

Own-component removal is characterized against baseline: collapse RSK, Add VIX, expand, remove VIX. Turn 28 resurrects VIX from its additions list; recovery removes the addition and hides the component. This correction is confined to requested Add/remove semantics.

## Workflow and all 18 gates

`.github/workflows/market-navigator-recovery-qualification.yml` runs separate Chrome/Edge jobs with frozen fixtures at ebd3c8996db8d7b48f7bced37a960ff4c4feac6f and fixed test dependency versions. Source gates, independent NOW/Analyze comparisons, repeated interactions, Library/lifecycle suites and an 18-gate aggregator upload reports/screenshots. Baseline instrumentation exists only in HTTP responses; disk bytes remain immutable. Product changes require plan/Graveyard changes in the same commit.

Tests: `market-navigator-recovery-source-gates.cjs`, `market-navigator-recovery-qa.cjs`, `market-navigator-recovery-interactions.cjs`, `market-navigator-recovery-analyze-qa.cjs`, `market-navigator-recovery-parity.cjs`, `market-navigator-recovery-gate-report.cjs`. The aggregator requires every layout and full independent comparison; supplement-only results cannot satisfy it.

Gates 0–16 cover baseline, NOW, geometry/chrome, legend, Add, repeated sequencing, full-page Analyze, controls, entries, isolation, values/coordinates, event ownership, 25-cycle cleanup, Library, console, one implementation and no rejected donors. Gate 17 is the verified owner URL/commit/workflow package. Automated PASS never overrides owner failure.

## Intended visible differences

Analyze fills NOW's content region and adds X. Its selected NOW anchor starts alone. Library parks the session; NOW restores it; only X closes it. Add immediately adds one eligible series, closes, and has no About/batch controls. Every retained explicit NOW Analyze entry launches the shared module; ENV click-to-index stays accepted. Own-component removals stay removed; touch inspection fires once.

## Owner qualification before promotion

Required: Windows 11 current Chrome/Edge at 1440x900 and 1887x800; Android Chrome at 800x1280 and 412x915. Owner acceptance is mandatory. No baseline/default filename, canonical data, index mathematics, unrelated navigation or other project path is changed.


Resize qualification correction: an exact Chrome raster comparison caught the accepted rail width transition (.14s). Baseline last-painted coordinates used width 1681.0625 while its snapshot DOM had already reached 1681; candidate had painted final width 1681. Strict coordinates pinpointed a transient baseline oracle. Readiness now waits for the existing rail animation to finish and two repaint frames in both applications. No pixel tolerance/mask or product styling/math change was introduced. The comparison is rerun at exact equality.

Test fixture correction: the canonical definition identifies Payrolls as a GRW component. Final component-specific Add and unavailable-anchor cases use that actual membership; Retail Sales remains an eligible comparison series. No definitions, components or product code changed.
