# Market Navigator — Component Transformation Audit

Date: 2026-09-22  
Status: CURRENT-STATE AUDIT / INPUT TO MASTER PLAN GATES C1–C5  
Authority: Supporting evidence only. `MARKET-NAVIGATOR-MASTER-PLAN.md` remains the single positive specification.

## 1. Purpose

This audit records the current 21-component RSK / GRW / MAC construction, the canonical source identity presently used by the repository, the current transform, the proposed transform family for qualification, and the unresolved gates that must be closed before persistent fixed-base indices may be defined.

No canonical index arithmetic is changed by this document.

## 2. Current model state

Current repository evidence shows:

- RSK defines 7 components but NFCI is omitted under current ratio eligibility.
- GRW defines 7 components but WTI is omitted under current ratio eligibility.
- MAC defines 7 components and both Treasury-curve components already use `signed_level_sd`.
- Current derived-index construction is horizon-relative: each horizon establishes its own T0/base 100.
- Current weighting is equal among eligible/participating components; omitted components cause the active set to be renormalized.
- Current low-frequency behavior carries the most recent real observation at or before the horizon anchor and exposes `noNewReleaseInHorizon`.

## 3. Source/provenance finding that closes the WTI ambiguity

The canonical Market Navigator WTI component is:

- catalog ID: `wti`
- provider: Yahoo Finance
- provider identifier: `CL=F`
- description: U.S. benchmark crude-oil futures price
- cadence: trading day
- unit: USD per barrel

Therefore the current component is a futures lineage, not the EIA Cushing spot series. The historical negative observation is valid evidence for this chosen lineage and must not be deleted or silently replaced by spot history.

## 4. Component registry audit

| Index | Component | Current transform | Proposed qualification family | Direction | Current status | Required decision/gate |
|---|---|---|---|---:|---|---|
| RSK | SPY | ratio | proportional price/return | -1 | participating | Retain provisionally; quantify realized influence. |
| RSK | VIX | ratio | **review: ratio vs normalized volatility-level/change** | +1 | participating | Do not change mechanically; quantify contribution concentration across regimes. |
| RSK | HY Spread | ratio | **rate/spread change SD** | +1 | participating | Treat widening in percentage/basis points, not merely percent-of-level; qualify scale. |
| RSK | HYG | ratio | proportional price/return | -1 | participating | Retain provisionally; quantify realized influence. |
| RSK | DXY | ratio | proportional index/return | +1 | participating | Retain provisionally; quantify realized influence. |
| RSK | MOVE | ratio | **review: ratio vs normalized volatility-level/change** | +1 | participating | Quantify whether ratio treatment structurally dominates. |
| RSK | NFCI | ratio / ineligible | **signed_level_sd** | +1 | omitted | Validate historical scale/direction; restore only after replication/sensitivity gates. |
| GRW | QQQ | ratio | proportional price/return | +1 | participating | Retain provisionally. |
| GRW | Copper | ratio | proportional price/return | +1 | participating | Retain provisionally. |
| GRW | IWM | ratio | proportional price/return | +1 | participating | Retain provisionally. |
| GRW | Manufacturing Production | ratio | proportional positive level | +1 | participating | Retain provisionally; release-time semantics required. |
| GRW | WTI `CL=F` | ratio / ineligible | **signed_change_sd** | +1 | omitted | Use futures lineage; validate change scale through 2020 zero crossing and normal periods. |
| GRW | Unemployment | ratio | **rate_change_sd** | -1 | participating | Use percentage-point change semantics; release/vintage timing required. |
| GRW | Payrolls | ratio | proportional positive level | +1 | participating | Retain provisionally; release/vintage timing required. |
| MAC | 10Y Treasury | ratio | **rate_change_sd** | +1 | participating | Use basis-point change semantics; qualify scale. |
| MAC | 2Y Treasury | ratio | **rate_change_sd** | +1 | participating | Use basis-point change semantics; qualify scale. |
| MAC | 10Y–2Y | signed_level_sd | signed_level_sd | +1* | participating | Arithmetic family retained; **direction semantics require explicit review**. |
| MAC | 10Y–3M | signed_level_sd | signed_level_sd | +1* | participating | Arithmetic family retained; **direction semantics require explicit review**. |
| MAC | CPI YoY | ratio | **rate_change_sd** | +1 | participating | Use percentage-point acceleration/deceleration semantics; release/vintage timing required. |
| MAC | Core PCE YoY | ratio | **rate_change_sd** | +1 | participating | Use percentage-point acceleration/deceleration semantics; release/vintage timing required. |
| MAC | Fed Funds | ratio | **rate_change_sd** | +1 | participating | Use basis-point/percentage-point change semantics; qualify scale. |

`* Direction review:` the current MAC definition says higher MAC means greater inflation / monetary-policy pressure. A more positive Treasury curve is not automatically synonymous with more pressure, while inversion can itself reflect restrictive policy. Do not preserve the current +1 direction merely because the transform now reconciles.

## 5. Transformation families to qualify

### A. Proportional price / positive-level movement

Use where proportional movement is economically meaningful and the series is structurally compatible.

Provisional members:
- SPY
- HYG
- DXY
- QQQ
- Copper
- IWM
- Manufacturing Production
- Payrolls

VIX and MOVE are not automatically approved here; both require realized-influence review.

### B. Signed / zero-centered level movement

Candidate rule:

`oriented component = anchor + direction × (level_t - level_anchor) / governed historical level scale`

Members:
- NFCI
- 10Y–2Y
- 10Y–3M

The two Treasury spreads already use this family. NFCI is the unfinished member.

### C. Signed price-change movement

Candidate WTI rule:

`oriented component = anchor + direction × (price_t - price_anchor) / governed historical price-change scale`

Member:
- WTI `CL=F`

The historical scale must come from the same canonical WTI futures lineage. The 2020 negative-price episode remains valid evidence and must be included in qualification.

### D. Rate / percentage-point / basis-point movement

Candidate rule:

`oriented component = anchor + direction × (rate_t - rate_anchor) / governed historical rate-change scale`

Members:
- HY Spread
- 10Y Treasury
- 2Y Treasury
- Fed Funds
- CPI YoY
- Core PCE YoY
- Unemployment

The important semantic change is that 25 bp is treated as 25 bp, not as a potentially enormous percentage change merely because the starting rate was low.

## 6. Cross-cutting issue: equal nominal weight versus realized influence

The existing seven-component definitions use equal nominal weights.

That does **not** prove equal practical influence once components use different transform families and scales.

Before any proposed registry becomes canonical, compute:

- historical standard deviation of each transformed component movement;
- median and 95th-percentile absolute contribution;
- share of absolute composite movement by component;
- largest-component and top-2/top-3 concentration;
- leave-one-out change in index direction and magnitude;
- contribution concentration by regime/horizon;
- sensitivity to the proposed historical scale window.

Decision gate:

**Either**
1. preserve equal nominal coefficients and explicitly accept the observed realized-influence profile,

**or**
2. introduce a governed scaling rule with an economic/statistical rationale.

Do not silently tune scales until contributions “look balanced.”

## 7. Cross-cutting issue: information time and revision vintage

Low-frequency macro series create a separate historical-truth problem.

The persistent-index design must distinguish:

- observation/economic period;
- public release time;
- later revision/vintage time.

High-priority series:
- NFCI (weekly)
- Manufacturing Production
- Unemployment
- Payrolls
- CPI YoY
- Core PCE YoY

A historical persistent index may not place a new macro reading into the chart before the market could actually have known it.

Until the repository has a governed availability-time rule for a component, its historical backfill is not qualified as an “as-known-at-the-time” signal.

## 8. Mixed-frequency rule

Do not fabricate daily macro observations.

When a slow component has no new release:
- it remains part of the model;
- its last known information state persists;
- its canonical weight does not disappear merely because the selected view is short;
- explanation must distinguish **no new information** from **measured and unchanged**.

This becomes simpler once horizon is only a viewport rather than a model-construction input.

## 9. Persistent-index implication

Track 2 may not select the permanent index anchor until this audit advances through:

- C1 provenance PASS;
- C2 transform/direction/scale registry PASS;
- C3 realized-influence/sensitivity PASS;
- C4 information-time/vintage PASS;
- C5 component-registry approval.

After that, RSK / GRW / MAC can be generated once as versioned persistent time series. Horizon changes then reveal different windows of the same canonical history.

## 10. Immediate technical sequence

1. Build a deterministic audit calculation that can apply the candidate transform families to canonical evidence without changing production arithmetic.
2. Compute influence/concentration/sensitivity for current versus candidate component registry.
3. Add information-age/release-time inventory for all weekly/monthly components.
4. Review Treasury-curve direction semantics against the declared meaning of MAC.
5. Only then produce the proposed canonical component-registry revision.

This audit is intentionally conservative: it prevents the index redesign from locking in mathematically correct but economically misleading component behavior.
