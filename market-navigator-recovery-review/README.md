# Market Navigator recovery review — October 22, 2026

This is a bounded recovery candidate built from the owner-approved October 10 shared-chart baseline, retaining the existing data adapter and approved chart settings. It is not a new renderer or a replacement index model.

## Delivered corrections

- 5D uses the five evaluation sessions supplied by the verified batch, with equal session spacing. Weekend elapsed time consumes no chart width.
- Source lines contain actual observations only. Weekly/monthly/quarterly display holds cannot extend the axis or masquerade as source readings.
- Daily endpoints use the observation date at the right boundary. Real earlier readings remain earlier.
- A committed plot tap changes the selected series, its sole legend outline and its inspection together. Hover retains the selected series.
- Inspection appears left of the data point in three rows: series name, linked observation date, indexed comparison and native value.
- Existing axis ownership, reference choices, styles, Library and the shared NOW/Analyze implementation remain in the construction source.

## Evidence and limits

Application Git blob: c0d0285f5439071a07b47902d26ae47633fe70e9.
Data package: ae95cb793a68e282627ca158a72aa07c5db430be290ff438a1e5714dd5c593c3.
Retained complete closing-day batch: October 20, 2026. This pinned review does not claim October 21 completeness or live observations.

44 browser configurations passed in Chrome at 412×915 and 1440×915, across NOW and Analyze, all seven horizons, all enabled sources, and Fixed/Horizon plus indexed/dual representations. The focused checks cover adding/removing NFCI without changing the domain, sole selected legend ownership, and left-side three-row inspection. Both phone and desktop are emulation; physical Android/Windows acceptance and live AI prose remain pending.

The independent retained-data recomputation passed 39 Level 0 sources, 273 Level 1 source/horizons, 21 Level 3 index/horizons, 54,327 component checks and 7,577 horizon points. Existing historical HY prefix and current-vintage backcast limitations are retained in data-qualification.json; this is not new live provider verification.

The new check rejects the previous 03fac31e5cfc91f2351257e19e227ec98842f557 app because it has no batch-session projection. The former 14-suite acceptance package is not claimed rerun or passed for this candidate.

## Reproduce

From repository root with Node and Playwright available:
`node market-navigator-recovery-review/evidence/verify.cjs`

Rebuild from the source directory:
`cd market-navigator-recovery-review/source`
`python market-navigator-chart-correction-build.py`

The result must have the application Git blob above. The source includes the immutable approved HTML and all existing chart-construction dependencies.

## Original snapshot investigation

The September 27 pre-modularization app and its same-commit 136 assets were restored locally and hash checked. It boots, but its indices stop at September 22 and reproduce the old date mismatch. It was not presented as a working current release or deployed as a rollback.

The default product and existing synchronization workflow are unchanged. This isolated review has a pinned data tree so automated collection cannot replace its verified test inputs.
