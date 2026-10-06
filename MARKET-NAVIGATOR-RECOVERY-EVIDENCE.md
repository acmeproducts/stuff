# Market Navigator recovery — owner qualification evidence

Status: owner feedback corrections implemented; local recovery/focused lab qualification PASS; updated exact-commit CI/publication pending; owner real-device acceptance PENDING. Publication creates a new owner candidate; no accepted production filename is replaced.

Candidate: https://acmeproducts.github.io/stuff/market-navigator-recovery-candidate.html

Immutable baseline: https://acmeproducts.github.io/stuff/market-navigator-turn28-post-ship.html

Baseline construction commit: 996e9a71b72db5bfbea3ba77750077daaa2fb7ab; blob: 9ce7f67451f9e1b7804927ce5c56adb667614724. Both public URLs returned HTTP 200; exact deployed bytes and commit/workflow links are verified below.

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
