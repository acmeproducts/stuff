# Market Navigator owner rejection RCA — October 14, 2026

**Release decision: FAIL. Owner rejection overrides all earlier automated PASS records.**

The isolated review release has been rolled back to the accepted Turn 28 post-ship **code and data together**. The review publisher is stopped. This report records diagnosis; it does not authorize another corrective product release.

## Restored checkpoint and preserved evidence

| Item | Exact identity |
|---|---|
| Accepted checkpoint | `996e9a71b72db5bfbea3ba77750077daaa2fb7ab` |
| Original post-ship HTML blob | `9ce7f67451f9e1b7804927ce5c56adb667614724` |
| Original persistent indices blob | `5dc07f7368efc0bd2e03e70af720c7d491611f75` |
| Original derived indices blob | `85528d72ce330a6fb5de5f43eefa5f6b52066da7` |
| Original registry blob | `e423bd96ec47b960ff4dbbb169e3be6a42165f4a` |
| Forward rollback commit on main | `a242d0c9a1ef81a3b9e429a9ea5b131065cc4740` |
| Rejected application source | `e795069f60e699754aeaaa88890fab85624c2256` |
| Frozen rejected deployment commit | `3f694fea9fe5f1f7eb2050738cbf43125cc1b772` |
| Exact rejected generation matching the screenshots | `generation-a177f9ee6dbe22379f5a` |

[Restored review URL](https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-candidate.html?rollback=996e9a7).

The restoration uses the September 27 accepted post-ship checkpoint, including its Library interpretation controls. It does not substitute the earlier rejected Turn 28 ship file. The original `market-evidence` and `data/market-backend` trees were restored inside the isolated review namespace using their original Git objects. Production aliases were not promoted or replaced. Small multiples are withdrawn and their review route redirects to the restored checkpoint.

This is a **historical, frozen checkpoint**, not a claim of current October data. All rejected code, generations, source receipts and Git ancestry remain recoverable. The prior healthy status is retained under `market-navigator-step-zero-review/rollback-evidence/2026-10-14-e795069-rejected-status.json`. Current review status records owner rejection and stopped publishing.

[Rollback deployment 38621608518](https://github.com/acmeproducts/stuff/actions/runs/38621608518) completed successfully. [Review publisher 38621608645](https://github.com/acmeproducts/stuff/actions/runs/38621608645) skipped its disabled recovery job. The existing relay run completed without replacing the restoration.

## What changed before and after extraction

The implementation did not preserve the accepted data contract while merely extracting NOW. It changed index-history construction five minutes before extraction, then changed date/window and inspection policies again.

| Change on the rejected source ancestry | Resulting difference from the accepted checkpoint |
|---|---|
| [a64216a8, October 8 12:08 UTC](https://github.com/acmeproducts/stuff/commit/a64216a8a88d3f51affcf92684042df4bee4d022) | Reconstructed captured-day index history from retained snapshots. The corpus was already different from the accepted checkpoint before module extraction. |
| [580623aa, October 8 12:13 UTC](https://github.com/acmeproducts/stuff/commit/580623aafb55e80cda250321a4c72b496a213264) | Extracted NOW into the module against that changed corpus. |
| [11065a86, October 9](https://github.com/acmeproducts/stuff/commit/11065a86) | Changed axes and observation-window policies. |
| [6f1cf009, October 10](https://github.com/acmeproducts/stuff/commit/6f1cf009) | Expanded native inspection and custom geometry. |
| [0b309e53, October 13](https://github.com/acmeproducts/stuff/commit/0b309e53) | Replaced captured-day continuation with native-period latest-vintage projection and lineage rules. |
| [fdbf3d31, October 14](https://github.com/acmeproducts/stuff/commit/fdbf3d31) | Changed mixed scopes and frozen attribution. |
| [40b79c28, October 14](https://github.com/acmeproducts/stuff/commit/40b79c28) | Changed native reference-date alignment. |

The accepted persistent model ends September 23 for RSK/GRW and September 22 for MAC. Its derived common anchor is September 22. Its native QQQ/WTI data ends September 25. The accepted chart therefore used a shared historical cutoff, even when a raw source had newer observations. The observed successful baseline is real; it does not prove that every source then had identical freshness. That distinction must remain explicit when replacing the data pipeline.

## Proven failure 1: the tooltip hides the 5D MAC and GRW lines

The [exact frozen derived data](https://raw.githubusercontent.com/acmeproducts/stuff/3f694fea9fe5f1f7eb2050738cbf43125cc1b772/market-navigator-step-zero-review/generations/generation-a177f9ee6dbe22379f5a/market-evidence/derived-indices-persistent-v1.json), bound to the [rejected delivery status](https://github.com/acmeproducts/stuff/blob/3f694fea9fe5f1f7eb2050738cbf43125cc1b772/market-navigator-step-zero-review/assurance-status.json), contains three MAC points on October 8, 9 and 13, with values 102.69258515415542, 102.71180415418844 and 102.72339901411493. Both MAC and GRW have valid strokes within the plot.

Using the screenshot's actual plot geometry, MAC falls around y=204–208 and GRW around y=200–203. The tooltip occupies x=142–893, y=131–252. It covers the entire upper traces. RSK is around y=644 and remains visible below it.

The rejected [inspection builder](https://github.com/acmeproducts/stuff/blob/e795069f60e699754aeaaa88890fab85624c2256/market-navigator-rebuild-chart-review.cjs#L21) adds cadence, observation/collection semantics, reference, held-point and sampling text. [Line 26](https://github.com/acmeproducts/stuff/blob/e795069f60e699754aeaaa88890fab85624c2256/market-navigator-rebuild-chart-review.cjs#L26) adds the long captured-vintage sentence matching the owner's screenshot. Width is `max-content`, capped only at the entire canvas width minus 12 pixels. Its placement clamps to the canvas, rather than preserving the approved compact footprint.

This was an introduced presentation change. A request for better inspection information did not authorize an overlay that obscures the chart. The original compact crosshair should have been preserved. Detailed provenance belongs in Health or an explicit information action.

## Proven failure 2: the rewritten clock drops MAC's October 12 state

The rejected 1D window is October 12–13. RSK and GRW each have two states. MAC has only October 13, so no MAC line segment can be drawn.

The [native-period projection clock](https://github.com/acmeproducts/stuff/blob/e795069f60e699754aeaaa88890fab85624c2256/market-navigator-rebuild-integrity.py#L96) forms its dates from selected daily component observations and explicitly excludes provider `DFF`. A weekday filter already excludes weekends. On this exact corpus:

- Treasury spread sources have October 9 and October 13, without October 12.
- DGS10 ends October 9.
- DFF has a real October 12 observation, value 3.88.
- The retained captured-state history has October 12, but the replacement native-period projection omits it.

Excluding DFF removes the available Monday date from MAC's clock. Cropping that projection to October 12–13 leaves one point. The new [singleton drawing branch](https://github.com/acmeproducts/stuff/blob/e795069f60e699754aeaaa88890fab85624c2256/market-navigator-rebuild-chart-review.cjs#L15) draws that point as a dot; it cannot repair the missing comparative state.

The [availability check](https://github.com/acmeproducts/stuff/blob/e795069f60e699754aeaaa88890fab85624c2256/market-navigator-rebuild-api-contract.js#L11) admits an index when its horizon bucket exists. It does not require a valid drawable comparison span. Consequently the chart and legend present an available 1D index despite the missing line.

The architectural error is conflating a governed index's evaluation calendar with the release/observation dates of selected components. Fixing it requires an explicit index evaluation contract and source-availability policy. Blindly removing the exclusion and publishing would be another unreviewed semantic change. Reusing valid held inputs for a governed evaluation must not fabricate new raw observations or claim historical availability that the receipts cannot establish.

## Controlled comparison: renderer versus data

The independent red-team replay executed the actual accepted Turn 28 painter and rejected painter with identical frozen a177 data and identical 838 × 590 geometry.

| Controlled case | Result |
|---|---|
| Original and rejected painters, same new data, 5D | All three stroked paths have identical coordinates. MAC is drawn in both. |
| Original and rejected painters, same new data, 1D | RSK/GRW stroked coordinates match. The single MAC point has no visible segment in the original painter; the rejected painter adds a dot. |
| Original accepted code + original accepted data, public restored URL | All three indices have at least two points in 1D and drawable paths in 5D. Original tooltip is approximately 143 × 41 CSS pixels. Zero unexpected page errors. |

Thus these screenshots do not establish a generic failure of the shared line painter. They establish a changed input/time contract plus an obscuring inspection overlay. Reusability can be retained only after accepted behavior and temporal contracts are restored independently.

The public rollback verification ran at 1020 × 778 in installed Chrome, America/Los_Angeles timezone. It confirms restoration, not the full Windows 11/Android qualification matrix. Original local-date formatting can show a preceding date for a UTC midnight observation; this preexisting behavior was retained during exact restoration, not silently repaired.

## Why assurance, manager review and red-team qualification missed this

1. The differential used the rewritten corpus for both the original painter and candidate. Two implementations agreeing on the same unsuitable inputs is not an independent comparison with the accepted code/data checkpoint.
2. The projection verifier reconstructed expected dates from the same excluded-source clock. Source consistency and mathematical reconstruction could pass while the comparison window lost October 12.
3. Source freshness, file integrity and index arithmetic were treated as sufficient release evidence. They do not establish per-horizon drawable coverage, comparable dates or an understandable displayed relationship.
4. Index availability checked existence of a horizon object. It did not inspect observation count, distinct valid evaluation dates, normalization anchors and visible series.
5. Tooltip tests checked content, containment, X and click-through. They did not check compact baseline footprint or whether upper curves remained visible. A click reaching a line beneath an overlay does not make that line readable.
6. The actual October 12/13 source-calendar combination was absent from owner-facing visual gates. The automated qualification was insufficient to establish owner-visible readiness. Presenting the candidate as ready overclaimed what those gates proved; the independent reviews themselves had retained hosted/owner-acceptance conditions.

The manager review independently verified the accepted checkpoint, code/data identities and change chronology. The red-team review independently verified the screenshot-matching generation, missing MAC date and same-data painter replay. Both now support rejection. These results do not claim a complete audit of every historical owner-reported anomaly.

## Required corrective sequence — proposal, not implemented here

1. Keep the publisher stopped and the rejected release marked FAIL. Retain exact accepted and rejected code/data pairs as immutable fixtures.
2. Restore the approved compact crosshair presentation. Move provenance detail to an explicit information surface. Lock its footprint, gestures and non-obscuring placement to owner-approved behavior.
3. Specify governed RSK/GRW/MAC evaluation dates separately from component observation dates, publication delays and capture timestamps. Establish the October 12 expectation with independent source/calendar evidence before changing projection.
4. Audit every enabled raw dataset and all three derived indices. Validate source sequences, gaps, units, revisions, native cadence, correct cutoff, evaluation coverage and dependencies. Repair raw deficiencies against providers, regenerate only affected governed outputs, then independently verify before publishing. Keep a prior coherent generation during recovery; do not label an unavailable current comparison healthy.
5. Add per-chart/horizon admission to source and derived assurance. Required index comparisons must have valid distinct states, eligible normalization anchors and visible paths. Genuine low-frequency limitations remain explicit rather than being disguised by synthetic observations.
6. Re-extract NOW from the accepted implementation in small checkpoints while preserving DOM, CSS, mathematics, dates and crosshair behavior. Qualify separately approved data changes on the original painter. Do not bundle new temporal policies into extraction.
7. Cross the full comparison matrix: original code/original data, original code/new data, module/original data and module/new data. The painter-only replay above is evidence for two cells; it is not a claim that every full-application cell already passed.
8. Require independent calendar fixtures, October 12/13 and non-trading-day cases, all roots/horizons, compact-tooltip occlusion tests, correct series visibility/legend state, axis labels, normalization, small-canvas geometry and lifecycle isolation. Run all handoff gates and the fixed viewport matrix. Identify emulation separately from real devices.
9. Publish a new isolated candidate only after those gates pass, with intended visible changes listed. Owner real-device acceptance remains mandatory before promotion or restoring recurring publication.

No smoothing, invented raw dates/values, deleted history or suppressed failures is part of this plan.

## Evidence files

The evidence directory is `market-navigator-review-evidence/2026-10-14-owner-rejection/`:

- `owner-fail-5D.png`, `owner-fail-1D.png`: unchanged copies of owner screenshots, preserved locally; not uploaded to the public repository.
- `restored-turn28-5D.png`, `restored-turn28-1D.png`: restored public checkpoint screenshots, preserved locally.
- [Public rollback proof](market-navigator-review-evidence/2026-10-14-owner-rejection/rollback-public-proof.json): public state, point counts, tooltip footprint and console result.
- [Independent painter proof](market-navigator-review-evidence/2026-10-14-owner-rejection/painter-replay-proof.json): exact same-data paths and screenshot occlusion measurements.
- [Browser diagnostic](market-navigator-review-evidence/rollback-public-check.cjs) and [painter diagnostic](market-navigator-review-evidence/2026-10-14-owner-rejection/painter-replay-diagnostic.js.txt): diagnostic verification only.

Historical status and generated artifacts remain linked to the fixed rejected deployment commit, rather than a mutable review URL.

Automatic approval review rejected public upload of an owner screenshot because specific permission to expose potentially sensitive image contents was not established. No image upload was retried through another mechanism. Diagnosis and numerical diagnostic records are published; screenshot originals remain local.
