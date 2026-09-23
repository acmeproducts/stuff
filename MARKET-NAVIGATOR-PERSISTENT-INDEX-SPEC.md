# Market Navigator — Persistent Index Specification

Status: I1 APPROVED SHADOW SPECIFICATION — NOT YET PRODUCTION
Version: `MN-PERSISTENT-1.0.0`
Decision date: 2026-09-23

## 1. Canonical definition

RSK, GRW, and MAC each have one governed value for each calculation date. A selected chart horizon is only a viewport over those values; it never recalculates, reweights, or re-anchors the canonical index.

The common version-1 reference date is **2016-09-01**, the first date on which all 21 governed components have usable retained evidence. Each index is 100 on that date.

For component `i`:

`signal_i(t) = direction_i × economic_change(anchor_value_i, value_i(t)) / frozen_annualized_scale_i`

where `economic_change` is:

- natural-log movement for `log_return`;
- additive native-unit movement for `signed_price_change`, `signed_level_change`, and `rate_change`.

For each seven-component index:

`index(t) = 100 + (1/7) × Σ signal_i(t)`

One index point therefore has a stable model-version meaning. The scales and coefficients are frozen in `data/market-backend/component-registry-v1.json`.

## 2. Time and vintage rules

- State for date `t` uses only the latest governed component record available by `t`.
- Qualified FRED components use ALFRED real-time validity periods.
- CPI and Core PCE YoY are derived from the raw price-index vintage state available on that date, including the then-available prior-year denominator.
- Market-price histories and HY Spread before launch are retrospective evidence, not assertions about what the application published then.
- Every pre-effective-date value is labeled **RETROSPECTIVE BACKCAST**.
- HY Spread has no ALFRED history. Before launch it is allowed only in the explicitly labeled current-vintage backcast; after launch it requires prospective capture.
- No missing component may be silently dropped or renormalized. The index is unavailable unless all seven governed component states exist.

## 3. Version and continuity rules

- Version 1 uses the fixed 2016-09-01 reference value of 100.
- A changed component, direction, transform, scale, or coefficient requires a new model version.
- Published values of an earlier model version are immutable.
- A successor version must overlap the prior version on a declared link date. It is chain-linked additively: the prior version's final published level plus the successor version's movement from its own raw level on the link date. The link record, both raw levels, and both model versions must be persisted.
- Historical restatement is a separately labeled dataset; it may not silently replace the published-vintage series.

## 4. View and comparison rules

- `1D`, `5D`, `MTD`, `YTD`, `1YR`, `3YR`, and `5YR` slice the same canonical observations.
- Optional **Rebase 100** is a display transform: `100 × canonical(t) / canonical(view_start)`. It never changes stored values, component contributions, Health, Library evidence, or model version.
- Native-value and Rebase-100 series may share the existing two-axis architecture when their measurement families require separate axes.

## 5. Explanation and persistence

For any two canonical dates, each component contribution is:

`contribution_i = (signal_i(end) - signal_i(start)) / 7`

The sum of seven contributions must equal the index movement within floating-point tolerance. Index Explanation, AI POV, Print, downloads, Health, and frozen Library analyses consume this one result.

Saved analyses persist the model version, canonical values, component signals, source observation dates, calculation phase, evidence revision, and any Rebase-100 display setting.

## 6. Launch boundary

The generated version-1 history is a candidate until the application release passes qualification and owner acceptance. Candidate generation does not retroactively make the backcast a published historical index.
