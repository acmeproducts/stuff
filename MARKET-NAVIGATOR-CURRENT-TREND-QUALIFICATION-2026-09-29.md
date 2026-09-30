# Market Navigator — Current + Trend Methodology Qualification

Status: **METHODOLOGY QUALIFIED / PRODUCTION IMPLEMENTATION NOT YET AUTHORIZED BY THIS EVIDENCE FILE**
Date: 2026-09-29
Scope: GRW / RSK / MAC Current + near-term Trend indication

This file is qualification evidence subordinate to `MARKET-NAVIGATOR-MASTER-PLAN.md`; it is not a parallel product plan. The Master Plan remains authoritative. The Build Protocol and Graveyard remain binding.

## 1. Product contract — PASS

Each governed index exposes two distinct deterministic outputs:

- **CURRENT** — governed assessment of present conditions from the index's production methodology.
- **TREND** — governed near-term directional indication over approximately **10–30 days**.

TREND has exactly four publication states:

- `POSITIVE` — ▲ — green
- `NEUTRAL` — ▶ — grey
- `NEGATIVE` — ▼ — red
- `UNAVAILABLE` — no directional arrow/color claim

TREND is not a forecast of the future numerical index level, GDP, security price, or investment return. `NEUTRAL` means genuinely stable/mixed evidence; it must never substitute for missing/stale/insufficient evidence.

AI may explain governed Current/Trend evidence but may not create, override, or independently calculate either output.

## 2. Institutional-methodology basis — PASS

The design deliberately reuses established institutional frameworks rather than inventing a proprietary forecasting model.

### Philadelphia Fed ADS

The Aruoba-Diebold-Scotti Business Conditions Index tracks real business conditions at high frequency using weekly initial claims, monthly payroll employment, industrial production, real personal income less transfers, real manufacturing/trade sales, and quarterly real GDP. It updates as new/revised information arrives.

Reference: https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/ads

### Dallas Fed WEI

The Weekly Economic Index extracts the common component of ten daily/weekly series covering consumer behavior, labor, and production. It is explicitly intended as a timely signal of real economic activity and is updated weekly.

Reference: https://www.dallasfed.org/research/wei/about

### Kansas City Fed LMCI

The Labor Market Conditions Indicators summarize 24 labor-market variables into level-of-activity and momentum measures. The momentum measure is explicitly intended to signal where labor-market conditions are headed.

Reference: https://www.kansascityfed.org/data-and-trends/labor-market-conditions-indicators/

### Chicago Fed NFCI / ANFCI and subindexes

The NFCI/ANFCI summarize broad financial conditions. Chicago Fed publishes risk, credit, leverage, and nonfinancial-leverage subindexes. Chicago Fed research identifies risk as coincident with financial stress and leverage/nonfinancial leverage as useful leading information for financial instability.

References:
- https://www.chicagofed.org/research/data/nfci/current-data
- https://fred.stlouisfed.org/series/NFCIRISK
- https://fred.stlouisfed.org/series/NFCILEVERAGE
- https://fred.stlouisfed.org/series/NFCINONFINLEVERAGE

### St. Louis Fed Financial Stress Index

STLFSI4 is a weekly financial-stress composite built from 18 weekly series spanning rates, spreads, and other stress measures. Zero represents normal historical stress; positive values represent above-average stress.

Reference: https://fred.stlouisfed.org/series/STLFSI4

### Federal Reserve FCI-G

The Federal Reserve Board's FCI-G explicitly translates financial conditions into estimated headwinds/tailwinds to subsequent GDP growth and incorporates transmission lags. It is useful contextual/validation evidence but its one-year growth horizon is too long to be a primary 10–30-day Trend vote.

Reference: https://www.federalreserve.gov/econres/notes/feds-notes/a-new-index-to-measure-us-financial-conditions-20230630.html

### Conference Board LEI / CEI

LEI combines independent leading indicators to reveal common turning points; CEI combines payrolls, real income less transfers, manufacturing/trade sales, and industrial production to represent current activity. LEI's typical business-cycle lead is materially longer than the Market Navigator 10–30-day Trend horizon, so LEI is validation/context rather than a primary Trend vote.

Reference: https://www.conference-board.org/topics/us-leading-indicators/index.cfm

## 3. Trend publication method — QUALIFIED

Trend uses **institutional composite direction and persistence**, not bespoke optimized weights.

### 3.1 Common directional rule

For weekly or weekly-sampled inputs:

1. Evaluate the latest four weekly changes available as-of the calculation timestamp.
2. `POSITIVE` component vote requires at least 3 of the last 4 weekly changes to move in the favorable direction for that index.
3. `NEGATIVE` component vote requires at least 3 of the last 4 weekly changes to move in the unfavorable direction.
4. Otherwise the component vote is `NEUTRAL`.

For monthly momentum inputs, use the provider's published momentum direction/change from the latest available release; never interpolate a monthly release into fake weekly observations.

The index Trend publishes `POSITIVE` or `NEGATIVE` only when at least two independent institutional families agree and no required family is stale beyond its governed publication allowance. Split or weak evidence publishes `NEUTRAL`. Insufficient current evidence publishes `UNAVAILABLE`.

This rule is intentionally simple, auditable, scale-free, and resistant to a single noisy observation. It does not optimize thresholds against known historical outcomes.

## 4. MAC — QUALIFIED DESIGN

### 4.1 MAC Current challenger

The existing production MAC remains the control until a versioned challenger passes full historical and production qualification.

The qualified challenger architecture is four equal conceptual families:

1. **Inflation — 25%**
2. **Rates & Policy — 25%**
3. **Curve & Credit — 25%**
4. **Real Economy — 25%**

The purpose is to prevent the number of measurements selected inside one concept from accidentally determining that concept's weight. The Real Economy family closes the documented gap in the current MAC, whose existing governed components are concentrated in rates/curves/inflation.

Exact Current-family source membership, transforms, frozen scales, information-time/vintage treatment, and internal family weighting must be qualified before any production cutover. This evidence does **not** authorize silently replacing the current MAC.

### 4.2 MAC Trend — qualified source families

Primary institutional evidence:

- **Dallas Fed WEI** — high-frequency real-activity direction.
- **Philadelphia Fed ADS** — mixed-frequency real-business-condition direction.
- **Chicago Fed ANFCI** — financial conditions adjusted for prevailing economic conditions.

Context/validation, not primary 10–30-day votes:

- Fed FCI-G because its economic-effect horizon is principally one year.
- Conference Board LEI because its typical business-cycle lead is substantially longer than 10–30 days.

MAC Trend interpretation:

- favorable/improving real activity and easing/improving adjusted financial conditions -> positive votes;
- deteriorating real activity and tightening/worsening adjusted financial conditions -> negative votes.

Result: **PASS** for methodology qualification.

## 5. GRW — QUALIFIED DESIGN

GRW Current retains its governed production methodology pending its already-required production validation. Trend does not alter canonical GRW arithmetic.

Primary institutional Trend evidence:

- **Dallas Fed WEI** — timely common real-activity factor.
- **Philadelphia Fed ADS** — high-frequency business-condition factor.
- **Kansas City Fed LMCI Momentum** — broad labor-market momentum factor built from 24 labor variables.

The LMCI momentum factor is preferred over inventing a payroll/unemployment rule because the Kansas City Fed already aggregates broad labor information specifically into a momentum measure.

Conference Board LEI remains useful longer-horizon context/validation but is not a primary 10–30-day vote.

Result: **PASS** for methodology qualification.

## 6. RSK — QUALIFIED DESIGN

RSK Current retains the approved governed persistent methodology. Trend does not alter canonical RSK arithmetic or its seven production components.

Primary institutional Trend evidence:

- **Chicago Fed NFCI Risk subindex (`NFCIRISK`)** — volatility/funding-risk conditions; Chicago Fed characterizes risk measures as coincident with financial stress.
- **Chicago Fed NFCI Nonfinancial Leverage / Leverage evidence (`NFCINONFINLEVERAGE`, `NFCILEVERAGE`)** — leading financial-instability information.
- **St. Louis Fed Financial Stress Index (`STLFSI4`)** — independent weekly broad stress composite.

ANFCI/NFCI headline and the NFCI credit subindex remain contextual/diagnostic evidence. Raw VIX/MOVE/HY-spread evidence already present in RSK remains useful for explanation and cross-checking but is not required to create a second proprietary stress model when the Fed-system composites already synthesize broad evidence.

For RSK, `POSITIVE` means risk conditions are improving/easing; `NEGATIVE` means risk conditions are deteriorating/tightening.

Result: **PASS** for methodology qualification.

## 7. Source and backend qualification requirements — RELEASE BLOCKING

Every new production source must pass all of the following before Trend can publish from it:

- canonical provider identity and exact series/endpoint recorded;
- provider terms/access method verified;
- collection path proven without browser-only scraping;
- historical observations sufficient for validation;
- observation timestamp and public-availability timestamp retained where available;
- cadence and deterministic freshness allowance defined;
- revision/vintage behavior documented;
- no forward fill, interpolation, horizon-end restamping, or fabricated release dates;
- source added to catalog/registry;
- source added to canonical evidence/cache path;
- source appears in HEALTH Sources with current/stale/degraded/unavailable truth;
- Trend model appears in HEALTH Derived Models with model version, source coverage, last calculation, and publication state;
- glossary/About metadata includes provider, measure, cadence, interpretation, Trend role, and source link;
- source failure cannot silently become a neutral vote;
- saved Library evidence freezes the exact Trend state, model version, source observations, freshness, and calculation timestamp.

## 8. UI / narrative qualification contract — PASS

NOW remains the primary entry point. No new top-level navigation mode is created.

Each GRW / RSK / MAC dashboard entry displays:

`CURRENT <value/state>   TREND <▲ Positive | ▶ Neutral | ▼ Negative | Unavailable>`

Color is redundant with text/icon, never the only semantic carrier:

- Positive: green + ▲ + `Positive`
- Neutral: grey + ▶ + `Neutral`
- Negative: red + ▼ + `Negative`
- Unavailable: no directional color claim + `Unavailable`

The detailed narrative begins with Current and Trend, then explains the governed evidence. AI receives the deterministic Trend result and contributing evidence; AI does not calculate the result.

Print, Markdown/download, Library persistence, Index Explanation, and AI POV must preserve the same frozen Current/Trend evidence.

## 9. Qualification gates

Methodology gates:

- PASS — Current and Trend have distinct purposes.
- PASS — Trend horizon is explicitly approximately 10–30 days.
- PASS — output vocabulary is limited to Positive / Neutral / Negative / Unavailable.
- PASS — Neutral cannot represent missing evidence.
- PASS — institutional composites are preferred to a novel proprietary forecasting model.
- PASS — no single release can flip Trend without persistence/ensemble confirmation.
- PASS — Trend does not mutate canonical Current mathematics.
- PASS — GRW/RSK Current remain unchanged by this Trend qualification.
- PASS — MAC four-family Current is a challenger requiring separate production qualification, not an implicit cutover.
- PASS — data-source, Health, glossary, AI, Library, print/download, and evidence-freeze requirements are explicit.

Production gates still required before release:

- PENDING — collectors for each newly selected institutional source proven in repository runtime.
- PENDING — historical as-of/vintage backtest regenerated from canonical source evidence where vintages are available.
- PENDING — Trend calculation implementation independently replicated.
- PENDING — freshness/degraded/unavailable behavior mechanically tested.
- PENDING — Health Sources + Derived Models mechanically tested.
- PENDING — NOW Current/Trend visual semantics and accessibility tested.
- PENDING — Library/Print/Download frozen evidence tested.
- PENDING — AI prompt/context proven to consume but not invent Trend.
- PENDING — MAC four-family Current challenger independently qualified before any production replacement.

## 10. Disposition

**METHODOLOGY QUALIFIED.**

The approved implementation direction is:

- MAC: current production model remains control; qualify four-family Current challenger; add qualified institutional Trend.
- GRW: retain governed Current; add qualified institutional Trend.
- RSK: retain governed Current; add qualified institutional Trend.
- NOW: expose Current + Trend with simple arrow/text/color dashboard semantics.
- HEALTH: govern both source health and Trend-model publication health.
- Library/Print/Download/AI: freeze and reuse the same deterministic Trend evidence.

No production cutover is authorized solely by this evidence file. Implementation must advance from the clean accepted baseline under the Master Plan, Build Protocol, and Graveyard and must satisfy all pending production gates above.
