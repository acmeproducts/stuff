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


## 11. Preliminary C3 influence test — first candidate scaling does NOT pass

A first deterministic endpoint test was run against the canonical series histories using the provisional families in this audit:

- proportional ratio movement for the provisional price/index family;
- `signed_level_sd` for NFCI and the Treasury spreads;
- `signed_change_sd` for WTI;
- `rate_change_sd` for HY spread, Treasury yields, CPI/Core PCE, unemployment and Fed Funds;
- seven equal nominal component coefficients.

This test is diagnostic only. It does not change production arithmetic.

### 11.1 RSK concentration

The provisional RSK treatment remains materially concentrated in different components depending on horizon.

Examples of largest absolute-movement share:

- 5D: VIX ≈ **62%**;
- MTD: VIX ≈ **64%**;
- YTD: MOVE ≈ **59%**;
- 3YR: SPY ≈ **60%**.

The two largest components together account for roughly **76–88%** of absolute movement in several tested horizons.

Finding: merely repairing HY Spread/NFCI while leaving VIX/MOVE/SPY on raw proportional scales does not make equal nominal weights behave like balanced influence.

### 11.2 GRW concentration

The provisional GRW treatment is less extreme but still meaningfully concentrated.

Examples:
- MTD: WTI ≈ **43%** of absolute movement;
- 1YR: Copper ≈ **45%**;
- 5YR: QQQ ≈ **47%**;
- top two components reach roughly **64–79%** in several horizons.

Monthly manufacturing, unemployment and payroll components naturally contribute no new movement in short windows when no release occurs.

Finding: WTI's proposed `signed_change_sd` is mathematically viable, but the complete GRW scale still needs influence/frequency qualification before canonical adoption.

### 11.3 MAC exposes a specific scaling failure

The provisional `rate_change_sd` definition used the standard deviation of all one-observation changes.

That is not a safe universal scale.

Fed Funds is the clearest failure because the daily series contains many unchanged observations. The resulting all-day change SD is small, so an ordinary policy step becomes many standard deviations.

Under the first candidate:
- 5D Fed Funds accounts for about **82%** of absolute MAC movement;
- the 5YR transformed moves for 10Y, 2Y and Fed Funds become roughly **91**, **82** and **97** transform units respectively.

Finding: **C3 FAIL for the first candidate scaling rule.** Do not implement `rate_change_sd` as “divide by SD of all daily changes” across every rate series.

## 12. Revised scaling problem to solve

The next audit must distinguish **economic change definition** from **influence scale**.

The economic change definitions remain useful:

- prices/positive levels → proportional/log-style movement;
- signed indicators/spreads → additive movement;
- WTI → additive price movement;
- rates/percentages → basis-point/percentage-point movement.

But each family then needs a scale appropriate to its observation/event process.

At minimum compare:

### Candidate S1 — raw economically meaningful change
Preserve raw proportional / basis-point / additive units with equal nominal coefficients. This is maximally interpretable but may permit structural dominance.

### Candidate S2 — event-cadence normalization
Normalize changes using the distribution of actual information events rather than every stored row.

Examples:
- Fed Funds: non-zero policy-rate changes / policy events rather than thousands of zero daily changes;
- monthly macro: month-to-month release changes;
- weekly NFCI: weekly changes;
- trading-day prices/volatility: trading-day return/change distributions.

### Candidate S3 — common realized-influence normalization
Calibrate each transformed component to a common historical movement target so equal nominal weights approximate equal typical influence.

This is statistically cleaner but requires a strong governance explanation and stability test; it may not be selected merely because it produces visually balanced charts.

## 13. Mixed-frequency influence is now an explicit C3/C4 dependency

Even after event-cadence scaling, market series update hundreds of times per year while monthly macro series update roughly twelve times.

Therefore the persistent-index design must decide whether:

- a component contributes only when new information arrives;
- a release changes a persistent component state that then remains in force;
- or another governed time-normalization rule is necessary.

Do not solve this by horizon-dependent weights or fabricated daily macro observations.

## 14. Current gate status

- **C1 provenance:** substantially complete for the 21 current components; WTI lineage resolved as Yahoo `CL=F`.
- **C2 transform family:** provisional; economic change families identified, with VIX/MOVE and Treasury-curve direction still open.
- **C3 influence/scaling:** **FAIL on first candidate**; revised scaling comparison required.
- **C4 information-time/vintage:** open.
- **C5 component registry approval:** blocked by C3 and C4.
- **Persistent-index anchor selection:** blocked by C5.

This failure is useful: it prevents a mathematically cleaner but still structurally misleading component registry from becoming the foundation of the persistent indices.


## 15. C1 provenance defect discovered — 10Y mixed lineage

The C1 audit found that `market-evidence/series/tenYear.json` contained:

- 5,072 observations;
- only 2,577 unique UTC calendar dates;
- 2,495 dates with two observations.

The duplicate dates contain a FRED-style midnight observation and a second legacy Yahoo-style timestamp/value from the former `^TNX` lineage. The current file metadata already declares FRED `DGS10`, so the file was internally inconsistent: one canonical series label but two historical source lineages.

The 2Y file does not show this duplicate-date condition.

This invalidates any scale statistic calculated from the mixed 10Y file until cleanup, because the extra same-day rows distort the change distribution.

Remediation:
- evidence pipeline commit `8188c139828bbf506b536b1de1c19b119a3a3a05` makes FRED evidence one canonical observation per UTC source date;
- full-bootstrap provider migrations no longer retain observations from a different historical provider lineage;
- the canonical evidence workflow must rebuild and republish 10Y before C1 is marked PASS.

C1 therefore remains open until the rebuilt evidence proves:
- provider = FRED;
- identifier = DGS10;
- one canonical observation per source date;
- no legacy Yahoo `^TNX` rows remain;
- dependent Health/derived evidence rebuild cleanly.


## 16. C1 provenance remediation PASS — canonical 10Y rebuilt

The canonical evidence pipeline was corrected and rerun.

Pipeline fixes:
- FRED evidence is canonicalized to one observation per UTC source date;
- a full-bootstrap provider migration no longer carries forward observations from a different provider/identifier lineage;
- legacy Yahoo `^TNX` rows therefore cannot remain mixed into canonical FRED `DGS10`.

The first workflow attempt rebuilt evidence correctly but was blocked by a pre-existing indentation error in `market-navigator-r7-index-audit.py`. That gate script was repaired at commit `925505bb3376031e0beef191dc703837f925ccde`.

The rerun passed:
- catalog reconciliation;
- canonical evidence build;
- Health build;
- source lifecycle;
- owned-backend truth validation;
- derived-index coherence;
- publication of canonical evidence.

Verified current 10Y evidence:
- provider: `FRED`;
- identifier: `DGS10`;
- observations: **2,577**;
- unique UTC source dates: **2,577**;
- duplicate source dates: **0**.

The former 5,072-row mixed FRED/Yahoo file is no longer canonical.

**C1 provenance status: PASS for this defect.**

## 17. Leading C3 shadow candidate — frequency-adjusted information scaling

After cleaning 10Y, the shadow influence test was rerun using a second candidate architecture.

The candidate separates:

1. **economic change definition**, from
2. **influence scale**.

Economic changes:
- positive price/index/level series: log/proportional movement;
- signed indicators/spreads: additive level movement;
- WTI: additive price movement;
- rates/inflation/unemployment/spreads: additive basis-point / percentage-point movement.

Influence scale:
- standardize by the historical volatility of one native information event;
- divide by the square root of the component's expected information-event frequency per year.

Conceptually:

`standardized information movement = economically meaningful change / event-change SD / sqrt(events per year)`

Provisional frequencies used only for the shadow test:
- trading-day/daily market/rate series: 252;
- weekly: 52;
- monthly: 12.

This is not yet the canonical formula. It is the leading C3 candidate because it addresses the otherwise severe mismatch between daily, weekly and monthly component opportunity to move.

### 17.1 Clean-data MAC result

With cleaned FRED DGS10 evidence, largest absolute-component shares were approximately:

- 5D: **46%** (Fed Funds);
- MTD: **28%** (2Y);
- YTD: **29%** (2Y);
- 1YR: **27%** (2Y);
- 3YR: **30%** (Fed Funds);
- 5YR: **30%** (Fed Funds).

This is materially less concentrated than the first `rate_change_sd` candidate, in which Fed Funds represented about 82% of 5D absolute movement.

### 17.2 RSK result

The same frequency-adjusted concept reduced—but did not eliminate—RSK concentration.

Indicative largest shares:
- MTD ≈ **24%**;
- YTD ≈ **34%**;
- 1YR ≈ **38%**;
- 3YR ≈ **43%**.

Very short windows can still be concentrated because only a few components may move materially in that exact interval. That is not automatically a model flaw.

### 17.3 GRW result

Indicative largest shares:
- 1D ≈ **40%**;
- MTD ≈ **52%** (WTI);
- YTD ≈ **33%**;
- 1YR ≈ **35%**;
- 3YR ≈ **36%**;
- 5YR ≈ **34%**.

The candidate substantially reduces the long-horizon domination created by mixing raw percentage moves with standardized macro changes.

### 17.4 What remains before C3 can pass

Do not adopt the candidate merely because the concentration numbers look better.

Required next tests:
- rolling-window contribution distributions rather than endpoint snapshots only;
- median / 90th / 95th percentile largest-component share;
- leave-one-out sign/magnitude stability;
- sensitivity to scale-estimation window;
- sensitivity to event-frequency assumptions;
- treatment of zero-change days versus actual information events, especially Fed Funds;
- VIX/MOVE ratio-vs-additive/log specification comparison;
- WTI behavior around April 2020 and normal periods;
- comparison of equal nominal coefficients under this normalization versus alternative governed scalings.

Current status:

**C3: OPEN — frequency-adjusted information scaling is the leading candidate, not yet approved.**


## 18. Reproducible rolling-window C3 audit

A non-production audit harness is now governed at:

- `market-navigator-component-shadow-audit.py`
- workflow: `Market Navigator component shadow audit`

The audit samples rolling historical windows and reports:
- median / P90 / P95 / maximum largest-component share;
- P95 top-two concentration;
- leave-one-component-out sign-flip rate;
- P95 leave-one-out magnitude effect;
- which component most often dominates.

The workflow produces an artifact only; it does not modify canonical index arithmetic.

### 18.1 S2A frequency-adjusted candidate

S2A uses:
- log/proportional movement for positive price/index/level series;
- additive movement for signed/rate/WTI series;
- historical native-event change volatility;
- `sqrt(events per year)` frequency adjustment;
- current component directions.

Selected P95 largest-component shares:

| Index / Horizon | P95 largest share |
|---|---:|
| RSK 5D | ~50% |
| RSK MTD | ~48% |
| RSK 1YR | ~47% |
| GRW 1YR | ~53% |
| GRW 3YR | ~48% |
| MAC YTD | ~44% |
| MAC 1YR | ~43% |
| MAC 3YR | ~36% |

Short windows remain more concentrated because only a subset of components may receive meaningful new information.

The result is not “equal influence,” but it is materially more stable than the first family-specific SD candidate and does not contain the Fed Funds explosion found earlier.

### 18.2 VIX/MOVE sensitivity

S2B changes VIX and MOVE from log/proportional movement to additive level movement while leaving the frequency normalization unchanged.

For RSK, S2B is modestly **more** concentrated than S2A across several horizons, for example:
- 5D P95 largest share: ~53% vs ~50%;
- MTD: ~50% vs ~48%;
- 3YR: ~61% vs ~58%.

Provisional implication:
- retain log/proportional movement as the leading VIX/MOVE candidate;
- do not call this decision final until regime-specific behavior and interpretability are reviewed.

### 18.3 Treasury-curve direction sensitivity

S2C reverses the two Treasury-spread directions so deeper inversion increases MAC pressure.

Concentration is unchanged because only signs change, but leave-one-out sign stability changes materially.

This proves that direction is not a cosmetic metadata choice. It changes the semantic meaning and robustness of MAC.

Do **not** select the direction that merely produces the better statistical stability score. Resolve it from the declared meaning of MAC:
- whether MAC is an inflation/rate-pressure index;
- a restrictive-policy/financial-pressure index;
- or a broader macro-state index.

A direction change requires a versioned model-definition decision.

### 18.4 C3 status

**C3 remains OPEN, but S2A is the leading scaling architecture.**

Remaining release-blocking work:
- regime splits, especially 2020 and tightening/easing cycles;
- WTI stress behavior around the negative-price episode;
- full component dominance-frequency review;
- scale-window sensitivity;
- C4 information-time correction, because current rolling windows still use observation dates rather than historical release/vintage availability.

## 19. C4 architecture — availability/vintage sidecar

The existing canonical value files remain useful for current/latest data, but they do not by themselves prove when historical macro information became public.

C4 will therefore use a separate availability/vintage layer rather than rewriting source observation dates.

Required conceptual record:

```text
series_id
observation_date
value
available_from
available_until
vintage_date
is_initial_release
is_revision
source
source_revision
```

For an as-known-at-the-time persistent index, the calculation date may use only records whose `available_from` is on or before that date.

For revised series, a later vintage becomes available on its later availability date; history is not silently rewritten backward.

### 19.1 FRED / ALFRED capability

The public FRED graph CSV currently used for latest canonical evidence does not carry the required historical real-time/vintage contract.

The official FRED/ALFRED API supports:
- real-time periods;
- series vintage dates;
- observations by vintage;
- “new and revised observations only”;
- “initial release only.”

Those web-service endpoints require a FRED API key.

Therefore:
- keep the current no-key public CSV path for latest/current canonical values;
- add a backend-only FRED/ALFRED credential path for the C4 vintage sidecar;
- do not add a user-facing FRED-key requirement to normal Market Navigator operation;
- do not block C3 work while that credential is being provisioned.

C4 cannot be marked PASS until the sidecar is built and historical no-look-ahead tests pass.


## 20. WTI zero-crossing stress result

The leading frequency-adjusted WTI candidate was stress-tested on the canonical Yahoo `CL=F` history.

Using additive daily price change divided by annualized historical daily-change scale:

- 2020-04-20: $18.27 → −$37.63, raw change −$55.90, approximately **−1.51 normalized annualized units**;
- 2020-04-21: −$37.63 → $10.01, raw change +$47.64, approximately **+1.29 units**.

The transform therefore:
- remains defined through zero;
- preserves the real negative-price event;
- treats the episode as exceptionally large;
- does not become infinite merely because price crosses zero.

This is a **PASS for mathematical stress behavior**, not final C3 approval. Scale-window/calibration-time sensitivity still applies.

## 21. Scale calibration itself must be time-governed

The current shadow audit estimates event volatility from the full available canonical history. That is acceptable for diagnosing candidate behavior in C3, but it cannot automatically become historical production methodology.

If a 2026-calibrated scale is applied to 2018 history, the result is a retrospective backcast because the scale uses information unavailable in 2018.

Before C3/I1 approval, compare:

1. **Frozen launch calibration** — calibrate from a governed pre-launch history and keep scale parameters fixed for a model version. Pre-launch history, if shown using those parameters, is explicitly labeled BACKCAST.
2. **Expanding no-look-ahead calibration** — scale at each date uses only earlier information, with minimum-history requirements and archived parameter history.
3. **Rolling no-look-ahead calibration** — scale uses a fixed trailing historical window, again using only prior information.

Do not choose among these based solely on which chart looks smoothest. Evaluate:
- interpretability;
- stability;
- sensitivity to shocks/regime shifts;
- comparability through time;
- sufficient-history behavior for monthly/weekly components;
- ability to reproduce a historical published value exactly.


## 22. C3 sensitivity expansion — branch decisions

The shadow audit was expanded at commit `dcb5804db5c1e9270afe81f4b8b998411ec5922d` and passed workflow run `35792148449`.

The new scenarios compare the leading S2A architecture with:
- non-zero-change-only event frequency for additive/rate families;
- five-year retrospective scale estimation;
- three-year retrospective scale estimation;
- the existing VIX/MOVE additive-level and Treasury-curve-direction sensitivities.

### 22.1 Reject non-zero-event frequency as the general rate scaling rule

`S2D_NONZERO_EVENT_FREQ` materially worsens MAC concentration.

Representative P95 largest-component shares:
- MAC 5D: approximately **71%**;
- MAC MTD: approximately **74%**;
- MAC 1YR: approximately **63%**;
- MAC 3YR: approximately **61%**.

This happens because counting only non-zero rate changes reduces effective event frequency sharply for step-like series such as Fed Funds, increasing the normalized impact of those events.

Decision:
- **reject S2D as the general scaling rule**;
- do not equate “information event” with “non-zero stored change” mechanically;
- keep S2A's observed native-cadence frequency treatment as the leading branch while C4 later supplies true release/availability timing.

### 22.2 Reject short retrospective calibration windows as the default model scale

Five-year and three-year retrospective scales are materially less stable for GRW than the leading full-history diagnostic scale.

Under the five-year scale sensitivity, GRW P95 largest-component share rises to roughly:
- 1YR: **64%**;
- 3YR: **76%**;
- 5YR: **66%**.

Under the three-year scale sensitivity it rises further:
- YTD: **71%**;
- 1YR: **79%**;
- 3YR: **87%**;
- 5YR: **80%**.

Risk and Macro are less dramatically affected, but the GRW instability is sufficient to reject a short fixed retrospective calibration window as the default architecture.

Decision:
- **reject 3Y and 5Y retrospective calibration windows as the default scale definition**;
- retain them as sensitivity diagnostics only;
- do not confuse this result with the final no-look-ahead calibration decision. Full-history S2A is still a diagnostic benchmark, not yet a production historical methodology.

### 22.3 Leading C3 branch after sensitivity expansion

The current leading branch remains:

**S2A_EVENT_FREQ**
- economically meaningful change by component family;
- event-change volatility scale;
- observed canonical native-event frequency;
- VIX/MOVE retained as log/proportional movement provisionally;
- current Treasury-curve directions remain unresolved semantically.

This is the leading branch because the alternatives tested so far either increase concentration materially or solve no identified defect.

### 22.4 C3 is still not approved

C3 remains OPEN because:
- regime-specific behavior must still be interpreted, not merely calculated;
- Treasury-curve direction semantics remain unresolved;
- calibration must become time-governed for production/as-known history;
- C4 availability/vintage truth is still required before persistent historical indices can be approved.

No production index arithmetic changes as a result of this section.



## 23. Treasury-curve direction decision for the redesign

For the redesigned MAC model, the Treasury-curve components are provisionally assigned **direction −1**:

- `curve10y2y`: deeper/more-negative inversion raises MAC pressure;
- `curve10y3m`: deeper/more-negative inversion raises MAC pressure.

Rationale:

- MAC's declared meaning is greater inflation and monetary-policy pressure.
- The 10Y, 2Y and Fed Funds level components already carry the direct nominal-rate-pressure channel.
- The curve components therefore serve a distinct policy-restriction / inversion channel rather than duplicating the rate-level channel.
- Under that role, a more negative spread represents greater restrictive/inversion pressure; a normalization/steepening reduces that pressure.
- The direction is selected from model semantics, not because one sign produces a prettier chart or better leave-one-out statistic.

This is a **versioned redesign decision**, not a mutation of current Turn 26 arithmetic. It becomes canonical only when C2–C5 and the persistent-index redesign are approved together.

