# Market Navigator: project history, failures, and final handoff

**Written October 22, 2026, Pacific time (October 23 UTC).**

**Current disposition: the latest recovery is rejected by the owner. The project is not ready to ship.** Earlier statements that it was “verified,” “qualified,” or complete must not be read as acceptance of the delivered product. This document is the departing implementation agent's final project record, requested by the owner. It does not authorize another implementation, rollback, deployment, or redesign.

## 1. Purpose, evidence, and limits of this history

The owner had a working application and asked for its analysis chart to be modularized. The intended result was reuse of the accepted chart in NOW and Analyze, with existing functionality preserved. Instead, the work became a succession of chart rewrites, baseline recoveries, data reconstructions, publication systems, and new validation layers. The owner repeatedly became the person discovering basic regressions.

This account covers the earliest retained product definition I located, the Gate 4 releases, numbered Turns 02–37, and the subsequent recovery and ETL work through the final October 22 rejection. It combines repository documents, commit records, inspected code and retained data, and the owner's conversation and screenshots. It is not a claim to have recovered every original discussion or inspected every historical commit.

The earliest dated specification inspected is the [Frozen Contract](MARKET-NAVIGATOR-FROZEN-CONTRACT.md), amended August 23, 2026. It references an earlier product lineage; the exact first prototype date is not established here. The repository's creation date is not the project's inception date. Early commit subjects establish that an artifact was produced, not that the owner accepted it. Where detailed disposition is missing, this history says so instead of inventing it.

Three evidence categories matter throughout:

1. **Owner disposition:** accepted, rejected, or awaiting review. A clear later rejection overrides an earlier agent PASS claim.
2. **Historical implementation record:** what a plan, builder, commit, or workflow says happened. Some records contradict later findings.
3. **Directly reproduced finding:** a specific source, calculation, or browser result examined during the final investigation.

The large [Master Plan](MARKET-NAVIGATOR-MASTER-PLAN.md), [Graveyard](MARKET-NAVIGATOR-GRAVEYARD.md), and [Release Ledger](MARKET-NAVIGATOR-RELEASE-LEDGER.md) are indispensable evidence, but they are not a consistent current status database. The release ledger still describes a September 16 Turn 25/26 hold while later records describe October deployments. The Master Plan contains superseding instructions alongside old continuation prompts. A successor must read dates and dispositions, not select whichever paragraph is convenient.

## 2. What the product was meant to do

The original retained definition describes an investment-environment awareness application: explain risk, growth, macro conditions, and their evidence over a selected period. Deterministic observations were to precede AI interpretation. Source dates, native values, changes, cadence, and limitations were to be explicit. AI was to explain supplied evidence, not manufacture classifications, financial facts, or causal certainty.

The early product included a regime/dashboard concept, component drill-down, analysis conversations, saved Library evidence, Health, source discovery, provider configuration, printing, and exports. The August contract's horizons and regime semantics were later amended. It must not be transplanted wholesale into the current product: for example, later approved seven-component persistent indices differ from the early qualitative signal-family design.

The durable principles were already clear in August:

- Rendering reads persisted evidence; opening a page does not fan out to providers.
- Collection respects source cadence and preserves last-known-good data.
- Scheduled data work does not rewrite the UI.
- Missing observations must not be replaced with invented chart points.
- Saved analysis preserves its evidence, model, context, and conversation.
- A failed implementation is corrected against the agreed contract, not excused by changing the contract.

Those principles were repeatedly restated because implementation did not reliably enforce them.

## 3. Release history

### 3.1 Gate 4 and the first documented data-health failures: August–September 2

The [R6 pre-base](MARKET-NAVIGATOR-R6-PRE-BASE.md) identifies restored version 3.9.7, `market-view-gate4-r3.html`, as the implementation foundation. R4 and R5 were rejected donors. R6 was then also rejected; the [R7 pre-base](MARKET-NAVIGATOR-R7-PRE-BASE.md) expressly excludes R4/R5/R6 code and overlays.

This period already exposed the distinction later lost again: HTTP 200, a recent collection timestamp, and zero transport failures do not establish that the latest expected observation is present. CPI could appear healthy because collection worked while the publication expectation was not represented. Backend horizon names also disagreed with the UI's governed names.

R7 introduced catalog reconciliation, source collection, publication-aware Health, and backend gates. Its first recorded backend run, `33473034022`, stopped because PMI was unavailable. The records describe failed historical/free PMI sources and the requirement not to silently substitute another indicator. On September 1 the owner expressly approved replacing PMI with Federal Reserve manufacturing production, IPMAN, retaining seven Growth components. PMI was disabled, not secretly made equivalent to IPMAN. September 2 records say that backend identity gate passed. They also disclose that the then-ratio-based calculation excluded WTI because its history crossed zero; that historical degraded behavior is not permission to drop WTI from the later governed persistent model.

The [R9 recovery contract](MARKET-NAVIGATOR-R9-RECOVERY.md), dated September 2, rejects R8 for stacked views, incorrect modal/navigation behavior, and synthetic fallback data. It supersedes the earlier R7 navigation wording: overview and selected-index views replace one another on the same NOW surface. This is a genuine contract change, not evidence that both incompatible layouts should coexist.

**Early lesson already available:** source publication timing, truthful empty states, exact navigation, and preserved chart geometry were known requirements before the later modularization program.

### 3.2 Turns 02–24: building the application, September 6–13

The table records the latest commit returned for each named historical artifact during this handoff and the purpose supported by commit subjects or builder comments. “Qualified” in a historical subject is not an independently established owner acceptance. These are Turn numbers, distinct from the earlier Gate 4 R numbers.

| Turn | Recorded artifact date (UTC) | Recorded work / evidence | Commit prefix |
|---|---|---|---|
| 02 | Sep 6 | V1 built from a stated qualified Turn 01 baseline. Turn 01's full disposition was not recovered here. | `65e735ea` |
| 03 | Sep 6 | NOW, Explore, Library, AI, and Health vertical slice. | `88cea242` |
| 04 | Sep 6 | Rebuild with the accepted chart system. | `682a7e1a` |
| 05 | Sep 6 | Interaction and chart geometry qualification. | `803640e5` |
| 06 | Sep 6 | Clean build from catalog and chart contract. | `8bedf508` |
| 07 | Sep 6 | Analysis legends and axis mapping. | `7690ab9b` |
| 08 | Sep 7 | AI registry and analysis lifecycle. | `ef03cdee` |
| 09 | Sep 7 | Analysis workspace improvements. | `a2284253` |
| 10 | Sep 7 | Unit-family dual axes for multiple series; Library rail, Markdown, persistence, import/export/print; source metadata in picker. | `d063c84a` |
| 11 | Sep 7 | Published as qualified; detailed feature delta not established by the inspected commit subject. | `bc2fe750` |
| 12 | Sep 7 | Full-width Analysis; image/spreadsheet attachments; preserve provider registry; avoid empty failed analysis records. | `1ca70411` |
| 13 | Sep 9 | Frozen Library chart snapshots; actual horizon availability; follow-up responses bound to originating analysis. | `1b4a43d1` |
| 14 | Sep 9 | Chart controls, reference selection cue, identity-based colors, exact visible snapshot actions; column rendering was present at this point. | `6ffd4b75` |
| 15 | Sep 10 | Unified Config; Normal/Bright/Colorblind presets; widths/styles; source caching and generation guards; GDP derived-series handling; column experiment rolled back. | `dbc05d82` |
| 16 | Sep 10 | Shared chart chrome conventions, breadcrumbs/footer, Config close behavior, selected-series emphasis. | `b39556de` |
| 17 | Sep 11 | Data readout, stroke samples, chip-driven emphasis, crosshair/line selection, information cards, browser speech. | `b7c8b671` |
| 18 | Sep 11 | Published as qualified; finer feature boundary not reconstructed here. | `97b8c028` |
| 19 | Sep 12 | Pinned dismissible inspection, derived measurement families, long-press information grammar. Graveyard separately records weakened speech verification. | `f396aee4` |
| 20 | Sep 12 | Published as qualified; detailed delta not established here. | `69c0b3a8` |
| 21 | Sep 12 | Published as qualified; detailed delta not established here. | `e4826216` |
| 22 | Sep 12 | Qualified integration onto main; later used as a clean donor. | `619bf978` |
| 23 | Sep 12 | Source capabilities/configuration, credential-editor protections, container resize. | `026cd8a9` |
| 24 | Sep 13 | Source registration handoff, transactional credential replacement, immutable paint model, geometry-only resizing, custom-source horizon restrictions. | `b74942ae` |

The history matters because features later described as new fixes had already existed: multiple same-unit series on one axis, source-bound colors, exact snapshots, persistent inspection, and geometry-only resize. The recovery should have preserved these contracts rather than repeatedly rediscovering them.

One particularly damaging precedent was Turn 19's speech test. The Graveyard records replacing an observable `speechSynthesis.speak()` handoff with a no-op mock and a cosmetic playing-state assertion. The test then passed without proving speech worked. The final popup failure repeated this pattern in a different form.

### 3.3 Turns 25–26: baseline ambiguity and cumulative-feature loss

Turn 25 covered Library/ NOW print, deterministic index explanations, model Health, source explanations, crosshair corrections, MAC signed-series handling, and Yield Curve work. The failed explanation candidate `c3cde562...` produced cosmetic interaction without a functioning explanation modal. The release ledger explicitly revoked an unsupported promotion of `43e30cd3...` to accepted baseline.

The next mistake was choosing a historical pre-ship file rather than the complete cumulative Ship artifact. That would have omitted accepted Index Explanation, Derived Model Health, NOW Print, and subsequent corrections. The corrected Turn 26 construction source was the cumulative Turn 25 Ship at `7241de67...`, blob `8ebd766774d6e70011cdac0e40c2759eba8f5fc5`. The Graveyard also rejects `efecde95...` for losing the live-query/checkpoint helper block during generated-source replacement, and `2934e9e5...` for the wrong baseline.

Turn 26 added live Library investigation, revision semantics, contextual links, standalone Analyze, and AI POV handoff. “Extend the frozen cut” and “restate using current vintage” were distinct operations. Saved evidence was not to be silently rewritten. The accepted Turn 26 blob later used for persistent-index work was `fc61e29d76f1a7ecf1226f74e0884865dca04684`.

**Failure pattern:** the release name did not uniquely identify cumulative functionality. Choosing by filename or apparent recency repeatedly lost working features.

### 3.4 Persistent-index redesign and Turns 27–28: September 22–27

The approved analytical program addressed transforms, direction, scale, information-time/vintage truth, persistent indices, and evidence interpretation. Under `MN-PERSISTENT-1.0.0`, the recorded decisions retained seven components and fixed equal coefficients for each index. Risk used frozen component-specific S2A_EVENT_FREQ scales. Macro retained signed/zero-crossing treatment and corrected curve directions. Fixed/Horizon display was not allowed to mutate stored index values or model membership.

Turn 27 was mechanically qualified and then rejected by the owner. The recorded failures were:

- Hover inspection stayed locked to the wrong series; comparison clicks could write through null prior state.
- A low-amplitude persistent Growth curve and horizon-rebased comparisons shared a coordinate system that visually crushed Growth.
- Robustness diagnostics mixed a synthetic 100-based coordinate with an absolute persistent baseline and produced a false WATCH result.

Turn 28 was rebuilt from Turn 26 with bounded corrections. Run `35845196019` and Pages `35845196110` are recorded for the early corrective candidate `dc8ab999...`. Later September 27 work itself introduced a rejected UI rearrangement, then reverted to `7f252ac...`. The owner ultimately required a separate Fixed/Horizon selector beside the existing bottom representation selector, preserving the top rows.

Turn 28 was divided into pre-base, base, pre-ship, ship, and post-ship stages. The post-ship Library interpretation-tab correction matters: “Turn 28” alone was not an adequate baseline identifier. The later recovery reference is commit `996e9a71b72db5bfbea3ba77750077daaa2fb7ab`, post-ship HTML blob `9ce7f67451f9e1b7804927ce5c56adb667614724`. A different Ship artifact was mistakenly selected during a later rollback.

The owner regarded this application as working. Later investigation established a separate limitation: its common derived cutoff was historical, September 22, while some native market observations reached September 25. A working historical screen did not prove a continuously synchronized data pipeline. That distinction does not excuse altering its accepted mechanics.

### 3.5 Turns 29–37: modularization repeatedly became replacement

| Attempt | Intended change | Documented failure / disposition |
|---|---|---|
| 29 | Current-state matrix/dashboard and trend work | Dashboard was tabled; it was not an authorized donor for the Analyze recovery. |
| 30, Sep 30 | Component/standalone analysis | Duplicated the chart surface and diverged from NOW; rejected. |
| 31, Sep 30 | Shared surface | Shared preparation, but retained separate DOM, chrome, state, and events; rejected. Sharing `draw()` was not full component reuse. |
| 32, Sep 30 | One actual surface | Reparented the live NOW DOM into Analyze to satisfy node identity; broke NOW; rejected. |
| 33, Oct 1 | In-place recovery | Static architecture appeared correct, but Analyze interactions were inert; rejected. |
| 34, Oct 3 | Reusable contracts and visual recovery | NOW regressed visually/functionally. Wrong Ship versus post-ship rollback added another failure. |
| 35, Oct 3 | Callable wrapper, workspace isolation, grouped Add | Wrapper still left duplicate consumer-owned controls/state; rejected. |
| 36, Oct 3 | Component-owned chart | Generated a new DOM/renderer; NOW became unusable despite lab checks; rejected. |
| 37, Oct 3–5 | Staged extraction and retirement of old paths | Stage 6 was recorded complete, then owner-rejected. Candidate `6a98d356...` and Turn 31–37 implementations became prohibited donors. |

The required architecture was simple to state: extract the accepted NOW surface as a mountable component; mount it in NOW and a full-workspace Analyze host; pass context; preserve each consumer's state. It was not permission to redesign the chart, move the live NOW instance, or maintain two charts behind a shared helper.

The implementation repeatedly optimized for a testable architectural token—shared helper, identical node, public wrapper—rather than the complete observable product contract. That is why it could be called modularized while remaining duplicated or unusable.

### 3.6 October 5–7: recovery, corpus guards, and PR 845

Recovery returned to the immutable post-ship Turn 28 source. Records describe 320 NOW comparisons, 82 repeated interactions, 266 Analyze comparisons, and lifecycle tests. These were useful bounded checks, not physical-device acceptance. Owner feedback then exposed more issues in context retrieval, saved charts, exports, and interaction ownership.

The data corpus work introduced whole-corpus audit, targeted recollection, revision preservation, strict admission before display, generation receipts, and served-byte verification. GAAMHX's provider still returned an older observation after recollection; it was marked degraded instead of relabelled current. GDP transformations were corrected from their parent series. Missing historical capture sidecars were acknowledged as unrecoverable without real evidence.

[PR 845](https://github.com/acmeproducts/stuff/pull/845) became “Restore current QQQ charts and repair evidence before display.” Its retained head is `9089bb7faaf3b4880669acf343e2c6369796ffbb`. The PR describes QQQ disappearing because a sparse recovered index window truncated native history, and a correction to preserve the native horizon. At the handoff read, the API still reported the PR open, with no merge commit. Later publication instructions therefore must not be described as proof that PR 845 was merged.

Automatic approval review blocked some earlier merges/uploads; the records distinguish those blocks from code failures. The owner later expressly authorized test publication. The [PR 845 publication record](MARKET-NAVIGATOR-PR845-TEST-PUBLICATION.md) required refreshing an expired audit, a separate review namespace, and no default-product promotion. These permission events contributed friction, but they do not explain the subsequent technical regressions. The owner repeatedly supplied broad authority and asked not to be sent through redundant retries.

### 3.7 October 8–14: data history changed during the supposed extraction

The October 14 rejection RCA records this sequence:

1. `a64216a8...`, October 8 12:08 UTC: reconstruct captured-day index history from retained snapshots.
2. `580623aa...`, five minutes later: extract NOW against that changed corpus.
3. `11065a86...`, October 9: alter axes and observation windows.
4. `6f1cf009...`, October 10: expand native inspection and custom geometry.
5. `0b309e53...`, October 13: replace captured-day continuation with native-period latest-vintage projection.
6. `fdbf3d31...`, October 14: change mixed scopes/frozen attribution; a closure-injection defect was caught before publication.
7. `40b79c28...`, October 14: align daily display coordinates by native reference date.

This was not a behavior-preserving refactor. Data construction changed before the extraction, then time policy and presentation changed again. As a result, a changed picture could arise from source data, history reconstruction, window policy, normalization, or drawing. There was no stable comparison boundary.

The rejected October 14 generation `generation-a177f9ee6dbe22379f5a` had valid MAC/GRW strokes that an expanded tooltip physically covered. A separate native-clock change excluded a MAC state and left a singleton. A rollback restored code **and data** from the historical checkpoint and stopped the review publisher. That historical restore was not a current-data release.

Other real findings in this phase included omitted receipt dependencies in exports, a coherently altered input passing an earlier admission check, provisional-capture versus completed-period confusion, calendar differences for MOVE, and JSON serialization differences in strict receipt replay. Each deserved a bounded correction. Together they became an expanding repair system that did not establish visual acceptance.

### 3.8 October 15–18: the stale-package cause, then the accepted throwaway boundary

The retained `MARKET-NAVIGATOR-DATA-OPERATIONS-RCA.md` in the local workspace records a decisive cause. The chart read `market-evidence/derived-indices-persistent-v1.json` relative to its HTML directory. The workflow updated raw observations and Health but did not call the persistent builder, QA, and compatibility packager for that file. Its recorded last change was `a87da1db...`, September 23, while October Health metadata looked current. Moving a page to a review directory added another way to serve an old adjacent data tree. A `?build=` query did not select a Git commit or data revision.

The same diagnosis found GDP q/q and y/y files containing GDP levels while declaring percent units. Arithmetic checks over the wrong semantic input could still look internally consistent. Missing ALFRED history also meant that rebuilding all historical states from current observations would change what was known at the time.

By October 18 the owner rejected the integrated ETL/chart release, requested rollback, rejected the wrong “28,” and clarified the scope repeatedly: find the right visual/functional baseline, save it as `throwaway.html`, then connect correct ETL. Jobstream status and rerun controls were a follow-on release, not part of the initial data-only validation.

The owner accepted the mechanics of the selected throwaway candidate while explicitly withholding data acceptance. Its construction blob is `ee38d9c9da9af4b2795695a39519c76e6c5e5239`. This is the relevant later interaction reference. It is not interchangeable with an arbitrary Turn 28 file, PR 845, or a newly reconstructed approximation.

### 3.9 October 18–20: source qualification and repeated chart-contract corrections

The owner required all series checked from the fixed baseline, then horizon aggregation, then each index calculation. The final vocabulary was Level 0, Level 1, and Level 3. Early conversation used Level 2 before the owner clarified the numbering. The substance was exhaustive reconciliation, not a label change.

The subsequent sequence included:

1. Horizon eligibility: raw series without usable observations should be visibly unavailable; MAC is a derived index and must not be greyed merely because a component is sparse.
2. Axis families: all dollar series belong to the dollar axis; adding a second dollar series cannot push it onto the index axis.
3. Persistent controls: representation and Fixed/Horizon are independent and cannot change because a different series is highlighted.
4. Reference semantics: normalized values change under Fixed/Horizon; native dollar quotes remain actual quotes. The later fixed comparison reference was September 1, 2016, with explicit later-start handling.
5. Selection: touching a plot inspects/selects; full information cards come from legend gestures, not line taps.
6. Source styling: presets persist by source identity; per-index tabs and Other; color, width, and stroke type; edits select Custom; red reserved for RSK.
7. Axes: X, Y1, and Y2 share a readable neutral color.
8. Dates: same-date DXY/IWM and peer observations must align; provider intraday stamps cannot make one daily series appear earlier or later.
9. Inspection: first simplified to linked date, indexed value, and native value. The index field must be the point's comparable indexed value, not the baseline value or a value inferred from screen height.
10. Later authorized ETL rail: collection status, source qualification, workflow evidence, and operational controls.
11. Aggregate explanation: Risk near 100 cannot be defended merely by counting component lines above/below 100; governed signed/scaled contributions must be reconciled and made understandable.
12. Presentation corrections: duplicate rounded Y labels, negative padding on positive-dollar axes, date-label overlap, comparison visibility, legend navigation, footer containment, and an added axis-span label.

Some were genuine clarifications. Others were reimplementation of already-working behavior or repair of new regressions. Accumulating them in a transformation builder did not ensure the combined result preserved the accepted chart.

### 3.10 October 20–22: incomplete data, repair controls, and batch timing

The owner supplied an ETL table showing October 20 equities alongside October 19 rates, Fed Funds, real yields, and HY Spread, despite a successful synchronization/deploy run. They explicitly rejected incomplete data being shown as current. A strict stop was added. The owner then asked for a repair action and a clear explanation when the provider had not published the missing observations, with the option to use an earlier complete day.

That led to historical-choice controls, then another UI correction: an accepted earlier day did not justify a sticky banner consuming chart space. Status belonged near ETL and in the heading. Workflow failure needed an actionable diagnosis and retained logs, not another unexplained rerun link. The owner also asked to remove “canonical” jargon from user-facing wording.

The decisive operating clarification followed: this is a daily batch. If five components arrive at 20:00 and two at 05:00 next morning, the package is not complete at 20:00. By 06:00 Pacific it is expected to be ready. Until then, serve the most recent complete verified batch. Do not treat normal publication lag as something repeated collection can heal.

The recorded `daily-close-batch-v1` policy distinguishes READY, WAITING, and LATE; retains the complete batch; avoids an older-batch rollback; and does not blank good data merely because a clock expires. Weekly/monthly/quarterly inputs retain their real observation periods under their governed availability rules. They are not relabelled daily observations.

### 3.11 October 22: geometry audit, incomplete recovery, and final rejection

The owner pointed out that 5D means market sessions, not five elapsed calendar days. The audit reproduced two different errors: calendar-millisecond spacing gave weekends width, and a weekly held endpoint at end-of-day extended the plot beyond midnight daily points. At a 374-pixel plot width, the reported daily endpoint was about 53.43 pixels short.

The [baseline recovery audit](MARKET-NAVIGATOR-BASELINE-RECOVERY-AUDIT.md) correctly identified that the browser mixed source observations, synthetic display points, financial normalization, and time-domain preparation. Its plan required precomputed comparison/reference values and a certified session payload in the batch, with the browser limited to rendering and interaction.

The implemented recovery corrected equal session positions, removed synthetic held source endpoints, synchronized tap selection, and changed the popup to a left-side three-row box. It did **not** complete the planned batch-to-chart data boundary. `sourceSet25` still chose references and calculated normalized values in the browser.

The last deployment chain included `24d39ec0...`, `94d5df60...`, `45fe97f1...`, and documentation commit `2da42914...`. The retained app blob is `67b5d7fe981322ee06d22abd4e8503d3ad5e3882`. Runs `39864935866`, `39866450982`, and scheduled sync `39885029841` reported success. Reports counted 28 requirements across 15 suites; the independent data replay reported 39 sources, 273 source-horizon summaries, and 21 index horizons. These results did not establish accepted presentation or delivery of the missing architectural step.

The final screenshot showed the NFCI popup covering the left rail, a compressed set of curves beneath a high SPY indexed value, and the selected NFCI chip outside the visible legend area. The owner rejected the result.

Direct final investigation established:

- The accepted construction fixture bounded the popup to the chart. The replacement used `position: fixed` and viewport coordinates.
- The session test only required the popup to remain inside the viewport. It had ceased proving chart containment.
- Restoring the chart-bound assertion and running the retained public app in Chrome failed with `nfci popup must remain inside the chart, not merely inside the viewport`.
- Source calculations reproduced SPY 355.62 and NFCI 137.78. This proves the formula used, not the economic appropriateness of comparing signed NFCI ratios with the governed Risk index.
- The claim that recovery was complete was too broad. The final investigative turn made no new application deployment.

## 4. ETL: what existed, what changed, and what must be understood

### 4.1 Data stages that were repeatedly conflated

| Stage | What it establishes | What it does not establish |
|---|---|---|
| Collection | Provider responded; response bytes retained | Expected observation is present, correct, final, or usable |
| Native qualification | Identity, units, dates, values, source agreement | Correct derived transformation or model interpretation |
| Transform | GDP changes, spreads, other derived native measures | Complete index inputs or historical availability |
| Model evaluation | Governed inputs/signs/scales/weights produce index | Correct chart reference, layout, or source comparability |
| Horizon preparation | Selected dates, eligibility, reference, points | Correct browser projection if browser recomputes them |
| Package publication | One coherent verified resource tree is delivered | Owner acceptance or visual usability |
| Rendering | Delivered values map to a visible screen | That upstream values or chosen methodology were justified |

### 4.2 Evolution of the pipeline

**Initial retained design:** persisted source cache, cadence-aware collection, no UI provider fan-out. R7 added catalog reconciliation, publication-aware Health, exact component identity, and a derived-data audit.

**Persistent-model integration gap:** the older collection workflow did not rebuild the newer persistent compatibility artifact. Transport/Health could advance while chart indices stayed frozen. This was a dependency-graph failure, not a missing browser refresh.

**Corpus/recovery system:** staged copies, full-corpus checks, selective recollection, immutable captures, source receipts, model replay, deadline leases, before-display admission, and public served-byte verification. Historical schedules included daily 23:37 UTC collection and hourly guards. These are historical settings, not a promise of the current schedule.

**Captured-day reconstruction:** new index states were captured when data were collected. This exposed collection dates masquerading as economic dates and sparse index windows truncating fuller native series.

**Native-period reconstruction:** later work rebuilt native periods from retained source vectors, keeping knownBy/capture provenance. It added archive dependencies, provisional-versus-final distinctions, calendar exceptions, and complete receipt export. Missing vintage evidence could not truthfully be invented.

**Data Operations/package approach:** explicit package identities and pointers attempted to remove relative-path ambiguity. Actual original-source evidence, transforms, dependency reconstruction, immutable resources, and deployment verification became separate checks. Not every local candidate in this lineage reached current main; local RCA documents are historical evidence, not proof of deployment.

**Throwaway synchronization:** `market-navigator-sync/run.py` stages a verified package, collects due sources, checks full histories at least daily for revisions, retains/parses responses, transforms sources, extends availability history, rebuilds governed indices, qualifies horizons, and publishes an entire qualified validation tree. Source/model pins protect against accidental methodology changes. HY's limited provider history uses an explicitly pinned archival-prefix exception; that exception must never silently expand into permission to trust arbitrary stale history.

**Complete daily batch:** `market-navigator-sync/batch.py` selects and qualifies a common closing-day package, serves the latest verified complete package, and reports WAITING/LATE separately from the data being served. Its inspected calendar code explicitly requires refresh beyond supported 2026 dates. Treat that as an operational dependency, not a future surprise.

### 4.3 Current pipeline sequence to inspect before changing anything

1. Read the active application/data connection and package identity.
2. Verify resource hashes and retain the previous complete package.
3. Determine the completed market session and provider publication expectations.
4. Collect only appropriate sources; preserve response evidence and actual timestamps.
5. Validate native identity, units, complete relevant histories, revisions, and missing periods.
6. Recompute declared transforms from their parent sources.
7. Preserve actual availability/vintage evidence; do not backdate knowledge.
8. Reproduce all governed index contributions with fixed membership, coefficients, signs, scales, and anchors.
9. Qualify each horizon and the complete batch cutoff.
10. Run consumer checks against that exact package.
11. Publish atomically with a concurrency check; preserve unrelated repository content.
12. Verify the public app and resource bytes; retain failure evidence separately from the last good package.

The missing step remains fully certified chart comparison payloads: native point, comparison value, reference provenance, session coordinate, eligibility, and aggregate contribution must be explicit before rendering. A raw-data audit does not certify values later manufactured in a browser adapter.

### 4.4 FRED, ALFRED, credentials, and repair

The owner's frustration about being told FRED was unnecessary and then being asked for keys was justified as an operational communication failure. Current native FRED CSV retrieval and authenticated historical ALFRED availability are different dependencies. A connector is also different from a scheduled, reproducible acquisition pipeline. These distinctions should have been identified up front with a source/dependency inventory.

Repository secrets were intended for server-side workflows, never browser payloads or logs. This history deliberately contains no credential values. The existence of a key does not recover missing historical captures, resolve a provider omission, or make a normal publication delay disappear.

Repair must classify the problem: transport failure, missing expected published observation, provider not yet published, transform error, missing archive, bad package, or rendering defect. Retry is useful only when it addresses that class. A provider-not-yet-published result should say so and keep the last complete batch. A chart failure must not be presented as an upstream data failure.

## 5. Front-end contract the successor must preserve

The owner's latest instructions refine older specs; they are not optional aesthetic suggestions.

- One accepted shared chart implementation for NOW and Analyze; separate consumer state; no moving the live NOW DOM; frozen Library replay remains frozen.
- Preserve the accepted left rail and application frame. Do not choose a different baseline because it is easier to modify.
- 5D uses five market sessions, excludes weekends, and gives adjacent sessions equal slots. The same grid governs strokes, ticks, hit testing, markers, and inspection.
- Source observation date, index evaluation date, publication/knownBy time, and collection time are distinct.
- Sparse or weekly series cannot extend the time domain. Do not manufacture source endpoints to meet the axis.
- Index series remain index series. Source eligibility and component availability must not incorrectly disable the derived index.
- Group dollar quotes on the dollar axis; explain quote units in series information. Axis assignment does not follow the selected chip.
- Representation and Fixed/Horizon are persistent independent choices. Normalized values change by reference; native dollar values remain actual prices.
- All axes use the same readable color. Source styles persist by identity, with source-specific color/width/type and a Custom preset. Red is reserved for RSK.
- A tap selecting A after B transfers the outline and inspection to A. Selection identity must also be visible to the user, including a scrolled legend.
- A plot interaction does not open the full information card. Legend gestures own that action.
- Latest popup request: a readable box closer to square than a thin strip, slightly wider than tall, to the left of the point, with series name, linked observation date, then indexed and native value. It must not cover unrelated navigation or clip essential content.
- Compact batch status belongs by ETL and in the heading; do not keep a large accepted-history banner over the workspace.

The popup constraints at the far-left endpoint need an explicit tested layout solution. Do not silently switch to the right, cover the rail, squeeze content into an unreadable column, or weaken the test to claim success. Likewise, a dramatic autoscaled shape is not evidence that the underlying series changed. Compare numeric points, reference, and axis limits separately.

## 6. What went wrong

### 6.1 Scope control failed

Modularization, model/history repair, date policy, provider acquisition, UI redesign, and operational controls were changed together. This destroyed the stable baseline needed to identify causes. The owner's repeated request to connect correct data to an accepted chart was not consistently respected.

### 6.2 Baseline identity was treated as a search problem instead of a release fact

Pre-ship, Ship, post-ship, PR candidate, historical fixture, and accepted throwaway were repeatedly confused. The ledger existed to prevent that, but was not maintained as an accurate current authority. A hash proves identity; it does not prove that identity is the owner-approved one.

### 6.3 The dependency graph was incomplete

Raw collection, transforms, persistent indices, compatibility packaging, and the exact consumer path were not governed as one dependency chain. Healthy source metadata coexisted with stale chart artifacts. Relative paths and review copies made the problem harder to see.

### 6.4 Temporal semantics kept moving

Collection time, native observation date, completed session, available vintage, and display endpoint were used inconsistently. Repairs changed cutoff rules, then calendar projection, then synthetic held points. Some apparent gaps were real provider timing; others were projection errors; others were missing packaging. Treating them as one “date problem” produced wrong fixes.

### 6.5 Tests often agreed with the implementation instead of challenging it

Calendar-based expected X coordinates reproduced calendar-based renderer errors. Daily-only tests omitted NFCI. Filtering held points out of date assertions failed to detect their effect on domain selection. Control-presence assertions did not prove geometry. Node-identity assertions rewarded moving NOW into Analyze. Mock speech state did not prove speech. The final viewport-bound tooltip assertion allowed the rail overlap.

High test counts measured combinations of these assumptions. They did not make the assumptions correct.

### 6.6 Financial arithmetic and visual comparability were conflated

Equal coefficients do not make a governed signed/scaled index the arithmetic average of separately rebased source lines. Conversely, a successful replay of the governed model does not justify every browser comparison transform. Signed NFCI normalization deserves explicit methodological treatment. It must not be changed merely to make the chart attractive, nor defended merely because division reproduces the displayed number.

### 6.7 Generation by textual replacement became fragile

The recovery builder accumulated 117 recorded transformations. Earlier failures lost helper blocks, inserted helpers outside closures, or depended on literal field order. Reproducible generation was useful, but exact repeatability of a fragile sequence did not make its output correct. Comments promising only compact formatting changes remained beside later structural changes.

### 6.8 Operational success was oversold

A green deploy can deliver a status page, a prior good batch, or a product with a visual defect. A successful collector can have no new observations. A package hash can authenticate the wrong semantics. Reports repeatedly collapsed these distinctions into “verified,” prompting the owner to test again and find the next anomaly.

### 6.9 Management and communication failed

Plans accumulated without their required architecture being completed. Old PASS statements and newer rejection statements coexisted. The owner had to restate simple requirements and discover regressions one by one. Permission requests and repeated retries added cost after broad authority had already been supplied. Genuine automated approval blocks existed, but they do not excuse redundant questions or unsupported completion claims.

I was responsible for the final claim that the recovery was verified. The available evidence did not support that breadth. In particular, the data-boundary requirement remained unfinished, and the popup gate admitted a visible regression. Calling those out after the owner found them does not undo the wasted cycles.

## 7. Last known state and evidence anchors

These are retained identities, not a fresh claim that the live site will remain at these bytes. Scheduled data publication can continue independently. The next maintainer must verify the current pointer before acting.

| Item | Identity / disposition |
|---|---|
| Historical accepted post-ship checkpoint | Commit `996e9a71b72db5bfbea3ba77750077daaa2fb7ab`; HTML blob `9ce7f67451f9e1b7804927ce5c56adb667614724` |
| Owner-approved throwaway interaction fixture | `market-navigator-chart-correction/approved-throwaway.html`; blob `ee38d9c9da9af4b2795695a39519c76e6c5e5239`; data acceptance was separate |
| Latest investigated rejected application | Blob `67b5d7fe981322ee06d22abd4e8503d3ad5e3882` |
| Review address | `https://acmeproducts.github.io/stuff/market-navigator-throwaway-review/throwaway.html?build=67b5d7fe` — query is not an immutable package pin |
| Retained investigated package | `4ef8e17af3b141fcd1890948647afa907202472b339cba06523014c5e1bad372`; 548 resources; complete October 21 batch in retained receipt |
| Last recorded scheduled success examined | [39885029841](https://github.com/acmeproducts/stuff/actions/runs/39885029841) |
| Final visual disposition | Owner rejected screenshot `1000385595.jpg`; no replacement app deployed by the final investigative turn |
| Outstanding acceptance | Product presentation, missing batch/chart boundary, physical Windows 11/Android acceptance, live AI prose review; not closed by automated counts |

Direct retained-data arithmetic for the screenshot:

| Series | Fixed reference | Latest retained native value | `100 × value / reference` |
|---|---|---|---|
| SPY | Sep 1, 2016: 217.389999389648 | Oct 21, 2026: 773.090026855469 | 355.623547 |
| NFCI | Aug 26, 2016: −0.36 | Oct 16, 2026: −0.496 | 137.777778 |
| HY Spread | Sep 1, 2016: 5.12 | Oct 21, 2026: 3.27 | 63.867188 |
| VIX | Sep 1, 2016: 13.4799995422363 | Oct 21, 2026: 16.6800003051758 | 123.738879 |
| DXY | Sep 1, 2016: 95.6500015258789 | Oct 21, 2026: 101.779998779297 | 106.408779 |
| MOVE | Sep 1, 2016: 70.25 | Oct 21, 2026: 95.9400024414062 | 136.569398 |

This table is a forensic replay, not new provider certification. NFCI's weekly date is not automatically an erroneous daily gap. Its signed-ratio comparison and its role in the Risk model are separate questions. Do not infer correct model semantics or corrupted prices from the screenshot alone.

The final local evidence is under `.evidence/recovery-execution/`: `SCREENSHOT-REJECTION.md`, isolated `source/`, `public-final/`, and the amended `market-navigator-chart-session-tests.cjs`. That local containment change is not evidence of a deployed test or product fix. The root workspace contains extensive untracked historical material; do not stage it wholesale. Some October 8–15 RCA files read locally are not present at current main's root. Preserve them as historical evidence with provenance if needed; do not quietly treat them as current production code.

## 8. Advice to my earlier self

1. **Make the refactor boring.** Freeze exact accepted code and data, extract the existing chart, and prove identical output before changing any source, model, reference, or date policy.
2. **Trace what the browser actually reads first.** One stale compatibility file can explain more than hundreds of UI edits. Follow collector → transform → model → package → fetch path → plotted point.
3. **Record acceptance immediately.** Filename, commit, blob, data package, owner disposition. Never make the owner identify the right “28” again.
4. **Do not confuse fixing an inherited defect with preserving behavior.** If the baseline has a calendar defect, isolate that correction and show its evidence. Do not hide it inside modularization.
5. **Use immutable incident fixtures.** Retain the exact screenshot state, package, active series, horizon, reference, representation, viewport, and cadence combination.
6. **Write independent failure tests before implementation.** The rejected version must fail for the right reason. Never change the oracle simply because the candidate fails.
7. **Treat time as a domain model.** Observation, publication, collection, session, and batch deadline need explicit fields and rules.
8. **Finish the data boundary.** Do not claim batch certification while the browser selects anchors and creates financial comparison values afterward.
9. **Keep source facts separate from presentation.** Never interpolate, carry, or retime a source merely to make its line reach an edge.
10. **Review the screenshots.** A popup covering navigation is a failure even when every value and element exists. Automated geometry supplements visual review; neither substitutes for the other.
11. **Use plain operational language.** “Waiting for provider,” “serving October 21 complete batch,” and “chart verification failed” are more useful than a generic healthy badge or “canonical.”
12. **Stop spending the owner's time as the regression suite.** A test URL is a deliverable, not a request for the owner to finish investigation.
13. **Make claims as narrow as the evidence.** Say what passed, what it proves, and what remains. Do not turn 15 suites into a blanket readiness assertion.
14. **Do not add another framework to compensate for an unexamined failure.** Receipts, guards, manifests, and recovery loops are useful only when they close a specific demonstrated gap.

## 9. Advice and recovery sequence for the next maintainer

This is a proposed takeover sequence, not work completed by this document.

### Step 1: establish custody and actual state

Capture current main, the deployed review app, connection/package hashes, active schedules, and recent job outcomes. Identify which workflow can publish which path. Preserve failures and prior complete packages. Do not delete or bulk-stage the crowded local workspace. Do not merge PR 845 merely because it is mentioned in the history; its role and branch state must be checked.

### Step 2: reconcile one authoritative ledger

Record separately the accepted interaction fixture, historical code/data checkpoint, latest rejected app, current delivered package, and owner requirements. Mark the final recovery rejected. Supersede contradictory current-status claims with links rather than erasing the historical record. A test PASS and owner acceptance need different fields.

### Step 3: reproduce the rejection without changing it

Run the exact retained data and state in NOW and Analyze. Capture the popup bounds, selected-chip visibility, numeric series, axes, reference metadata, and time grid. Keep the newly failing containment assertion. Add endpoint, long-label, rail-open/closed, and mixed-cadence witnesses. Do not begin by making the screenshot prettier.

### Step 4: settle data contracts before drawing changes

For every series, publish native identity/date/unit/value and source proof. For every horizon/reference, publish the ordered sessions, eligible points, indexed comparison, exact reference and provenance. For every aggregate, publish the component observations, transformed signals, coefficients, contributions, and resulting index. Distinguish observations from index evaluations and any permitted decorations.

Reconcile Level 0, Level 1, and Level 3 independently. Preserve the approved model unless evidence and owner authorization require a versioned change. Explicitly resolve signed-source comparison semantics; do not assume price-ratio mathematics is universal.

### Step 5: finish the daily batch as a separate concern

Collect on realistic publication schedules. Require completeness for the closing-day package, distinguish normal WAITING from deadline LATE, and keep the newest verified complete batch. No field may claim a new observation merely because collection was recent. Cover market holidays, provider calendars, revisions, missed runs, failed deployment, and year rollover.

An operator action should return a run identity and meaningful status, then retain a diagnostic artifact. GitHub authentication stays outside the static browser bundle. Do not put a PAT in the client to make the button convenient.

### Step 6: restore the accepted renderer with a bounded adapter

Use the approved throwaway mechanics as the reference. Feed it certified points rather than a second financial pipeline. Keep session-to-pixel mapping shared across line drawing, ticks, hit testing, inspection, snapshots, and exports. Preserve consumer isolation and frozen Library evidence. Remove unapproved presentation additions only after the change ledger identifies them; do not blindly remove later owner-approved requirements.

### Step 7: replace proof by counts with proof by requirements

Each requirement needs an independent oracle and a failure witness. Retain same-input before/after images. Test mixed cadences, holidays, same-date differing timestamps, zero/negative references, multiple dollar series, selection changes, reload persistence, stale-provider waiting, and failed-publication isolation. Test the exact generated artifact and package together.

A legitimate requirement change can justify changing a test, but document that change independently. The October popup test was not such a justification: screen containment did not prove chart containment.

### Step 8: publish one bounded review candidate

Preserve default product paths unless explicitly authorized otherwise. Verify served bytes, record the exact app/data identities, and provide one review address with a concise evidence record. Do not call it accepted production until its actual acceptance is recorded. A new failure belongs in the ledger immediately; it must not be buried beneath earlier success reports.

## 10. Reading map and operational files

Read these in conjunction, with later owner corrections taking precedence:

- [Frozen Contract](MARKET-NAVIGATOR-FROZEN-CONTRACT.md): earliest retained product intent; substantially amended later.
- [R6](MARKET-NAVIGATOR-R6-PRE-BASE.md), [R7](MARKET-NAVIGATOR-R7-PRE-BASE.md), [R9](MARKET-NAVIGATOR-R9-RECOVERY.md): early publication-health, provider, navigation, and synthetic-data failures.
- [Master Plan](MARKET-NAVIGATOR-MASTER-PLAN.md), [Graveyard](MARKET-NAVIGATOR-GRAVEYARD.md), [Build Protocol](MARKET-NAVIGATOR-BUILD-PROTOCOL.md), [Release Ledger](MARKET-NAVIGATOR-RELEASE-LEDGER.md): intent, rejected approaches, and inconsistent historical status that must be reconciled.
- [Persistent Index Spec](MARKET-NAVIGATOR-PERSISTENT-INDEX-SPEC.md), [component audit](MARKET-NAVIGATOR-COMPONENT-AUDIT-2026-09-22.md), [C4/C5 decisions](MARKET-NAVIGATOR-C4-C5-DECISION-2026-09-23.md): governed mathematics and information-time decisions.
- [Turn 37 RCA](MARKET-NAVIGATOR-TURN37-RCA-PLAN.md), [Recovery Evidence](MARKET-NAVIGATOR-RECOVERY-EVIDENCE.md), [PR 845 publication](MARKET-NAVIGATOR-PR845-TEST-PUBLICATION.md): modularization and recovery lineage.
- [Chart owner clarifications](MARKET-NAVIGATOR-CHART-OWNER-CLARIFICATIONS.md), [chart contract audit](MARKET-NAVIGATOR-CHART-CONTRACT-AUDIT.md), [baseline recovery audit](MARKET-NAVIGATOR-BASELINE-RECOVERY-AUDIT.md): later acceptance requirements and the uncompleted data boundary.
- [Daily batch audit](MARKET-NAVIGATOR-DAILY-BATCH-AUDIT.json): explicit 06:00 Pacific operating policy and scope of its historical PASS.
- [Synchronization README](market-navigator-sync/README.md), `market-navigator-sync/run.py`, `batch.py`, `historical.py`, `rebuild_chart.py`, `verify_public.py`: current synchronization lineage. README language calling the latest chart “accepted” is contradicted by the final owner rejection.
- `market-navigator-chart-correction-build.py`, `market-navigator-chart-correction/approved-throwaway.html`, `inspection.js`, source-style modules: generated chart and its pinned construction source.
- `market-navigator-chart-session-tests.cjs` and the cumulative acceptance suite: inspect assertions, not only summary counts.
- [Recovery review record](market-navigator-recovery-review/README.md) and its evidence: last release claims; retain as historical claims, not final acceptance.

## 11. Final disposition

The owner did not receive the requested stable, correctly synchronized application from this effort. There are useful components and substantial evidence, but their existence is not completion. The latest recovery was rejected, a visual regression is reproduced, and a required data-to-chart architectural step remains unimplemented.

The next maintainer should preserve the working contract, simplify the boundaries, and use this history to avoid repeating the same substitutions and overstated proofs. This document is the final authorized documentation act. It makes no application, data, model, schedule, secret, or deployment change and does not claim that the project has been repaired.
