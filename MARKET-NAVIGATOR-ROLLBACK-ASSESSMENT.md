# Market Navigator rollback assessment — October 7, 2026

Recommendation: begin a controlled replacement candidate from immutable Turn 28, qualify the data contract first, and reintroduce the requested behavior in separate, reviewable increments. Stop treating the current recovery candidate or its automated PASS as an accepted replacement. Preserve the existing candidate, data, Library records and Git history. A chart-file rollback alone will not repair the current index corpus. A repository-wide revert would also risk unrelated work and is not recommended.

## Crossed experiment

The diagnostic loads three chart implementations with each of two identical data corpora, using ENV / Fixed / 5D, Chrome, America/Los_Angeles and 1440×900. It does not edit product code or datasets. The frozen corpus is the existing independent qualification fixture; it is not presented as current market evidence.

| Chart | Frozen corpus: RSK / GRW / MAC points | Current repaired corpus: RSK / GRW / MAC points |
|---|---|---|
| Immutable Turn 28 | 5 / 5 / 4 | 2 / 3 / 2 |
| NOW-only module extraction | 5 / 5 / 4 | 2 / 3 / 2 |
| Current recovery candidate | 5 / 5 / 4 | 2 / 3 / 2 |

All three consume identical timestamps and numerical values for each corpus. Turn 28 and the NOW-only extraction produce identical drawing-coordinate hashes with both corpora. All three produce identical coordinate hashes with the frozen corpus. The final candidate's current-data coordinates differ because its gap notice changes available geometry; its input timestamps and values remain identical. This experiment supports the conclusion for the pictured ENV state; it is not proof of parity for every interaction.

With the current corpus, every implementation labels the requested 5D range October 6–7. RSK and MAC have only two samples; GRW has three, including a later same-day capture. The requested October 2–7 history is absent. The values change by approximately −0.03085, −0.00361 and +0.00929 index points respectively, so their near-flat appearance is consistent with the supplied values. Flatness alone does not establish a numerical error. The missing requested coverage does establish an incomplete analytical window.

## Confirmed faults and their origin

1. **The stopped persistent-index update path predates the extraction.** Turn 28 boots from `derived-indices-persistent-v1.json`. The canonical evidence workflow at baseline commit `996e9a71b72db5bfbea3ba77750077daaa2fb7ab` runs the R7 collector, Health and R7 index audit, but contains no persistent-index builder or compatibility-builder invocation. This demonstrates a missing integration in that workflow, not that no other manual or historical job ever built the model. The preserved pre-repair persistent rows end September 22/23.
2. **The later repair leaves a material history gap.** It preserves old rows and appends October 6/7 captures from current native inputs. It qualifies current inputs and reproducibility but does not restore the intervening historical index series. The corpus still declares `RETROSPECTIVE BACKCAST` while the new tail uses `Append-only real collection-time snapshots`. Those different time meanings need an explicit, consistent data contract before they are combined for charting or analysis.
3. **The pictured October 5 date is a presentation error inherited from Turn 28.** A stored October 6 midnight UTC index observation becomes October 5 in Los Angeles through `new Date(t).toLocaleDateString(...)`. The footer uses the October 6 calendar-date string. Baseline, extraction and current candidate reproduce the mismatch. A market/reference date must retain its date meaning; a collection instant needs a separate timezone-aware formatter. Same-day captures must not silently change that contract.
4. **The gates did not establish usable current history.** Frozen baseline parity correctly proved preservation, including preservation of the date defect. The actual-data test explicitly accepts the sparse stored samples and checks gap disclosure. It never requires independently justified coverage of the requested 5D window. A current latest row and unchanged historical rows are insufficient release criteria. The earlier claim that QQQ repair resolved application-wide reliability was too broad.

## Recommended replacement sequence

1. Preserve Turn 28 and the current candidate as separate checkpoints. Build a new candidate from Turn 28; do not roll back unrelated repository changes or rewrite Library history. Keep the existing diagnostic and all failing-owner evidence.
2. Establish data truth while running the original chart: canonical identity, native observation/reference date, actual availability/release date, collection instant, cadence, requested horizon coverage and index reproducibility. Restore missing history only from qualified canonical history and availability/vintage evidence. If an as-known history cannot be supported, use a separately identified reconstruction/version; never overwrite old snapshots or present reconstructed values as captured observations. Existing vintage audit reports are not substitutes for missing underlying vintage event files.
3. Add independent release gates for current dates and complete requested windows, publication calendars, legitimate low-frequency plateaus, timezone conversion, collection interruptions, recoverable missing history and recovery after restart. These gates must fail on the current pictured state. Automated recovery must repair the usable data product, not only its latest timestamp and freshness certificate.
4. Extract the working NOW chart in small increments against both frozen and newly qualified current data. The single-chart architecture remains a reasonable goal; this experiment does not identify it as the cause of the pictured defect. Then add the second Analyze instance and required lifecycle/Add behavior. Reintroduce raw Fixed/Horizon, information/export, AI relationships and corpus admission changes separately. Require owner-visible acceptance after each meaningful behavior change, with physical-device qualification before promotion.

Do not cherry-pick the accumulated patch stack wholesale into the replacement. Reuse useful tests and concepts, then independently verify each implementation against the corrected data contract. This is a redevelopment recommendation, not an executed rollback. No product or dataset was changed during this assessment.

Evidence: `market-navigator-rollback-evidence/comparison.json`, its six screenshots, and `market-navigator-rollback-diagnostic.cjs`. The immutable baseline blob remains `9ce7f67451f9e1b7804927ce5c56adb667614724`; assessed candidate is review commit `9089bb7faaf3b4880669acf343e2c6369796ffbb`.
