# Market Navigator — Current + Trend Production Qualification Outcome

Status: **TREND PRODUCTION GATE FAILED — DO NOT RELEASE TREND UI**
Date: 2026-09-29 / evidence generated 2026-09-30 UTC
Model tested: `MN-TREND-1.0.0`

This is release evidence under `MARKET-NAVIGATOR-MASTER-PLAN.md`, not a parallel plan.

## What was executed

A deterministic production-capable Trend evidence path was built using public FRED collection and institutional series, with historical weekly as-of signals and 10/20/30-calendar-day comparison against the governed persistent Current index.

Inputs tested:

- MAC: WEI, ANFCI, Initial Claims.
- GRW: WEI, Kansas City Fed LMCI Momentum, Initial Claims.
- RSK: Chicago Fed NFCI Risk, NFCI Nonfinancial Leverage, St. Louis Fed Financial Stress Index.

Publication rule tested: recent directional persistence at source level; Positive/Negative only when at least two independent families agree; otherwise Neutral; insufficient evidence Unavailable.

## Mechanical pipeline result

PASS:

- source collection;
- canonical Trend evidence generation;
- deterministic current classification;
- historical as-of signal generation;
- 10/20/30-day outcome comparison;
- scheduled GitHub Actions execution and evidence persistence.

Current evidence at test time:

- MAC Trend: POSITIVE;
- GRW Trend: NEUTRAL;
- RSK Trend: NEUTRAL.

These current classifications are **research evidence only** because predictive qualification failed.

## Backtest result — FAIL

Directional hit rate against subsequent governed Current-index movement:

| Index | 10 day | 20 day | 30 day |
|---|---:|---:|---:|
| MAC | 29.21% | 32.95% | 39.77% |
| GRW | 48.25% | 54.39% | 54.39% |
| RSK | 51.37% | 50.27% | 52.75% |

Sample sizes were approximately 254–260 weekly observations in the five-year governed persistent-index outcome window, with 88–183 directional signals depending on index.

## Disposition

**FAIL.** The proposed Trend formulation does not demonstrate enough 10–30-day directional information to justify publishing Positive / Neutral / Negative as a governed investor-facing indication.

MAC is materially worse than chance under the tested definition. GRW and RSK are near chance and do not clear a reasonable burden for adding a forward-looking dashboard signal.

Do not rescue the model by tuning thresholds/weights against this same history. That would convert a failed independent qualification into in-sample optimization and create an overfitting risk.

Do not wire these research classifications into NOW, narrative/AI, Library, Print, Download, or production Health as a validated Trend model.

The source evidence and backtest artifacts remain useful research evidence and should be retained.

## What remains valid

The product concept remains coherent: `CURRENT` describes governed present state, while a future `TREND` feature would represent approximately 10–30-day indicated direction using Positive / Neutral / Negative / Unavailable.

The institutional source collection path is also proven. What failed is the claim that this particular simple ensemble predicts the subsequent governed indices well enough to publish.

MAC four-family Current redesign is a separate methodology/workstream and is not invalidated by this Trend failure. It still requires its own production qualification before replacing current MAC.

## Required next research gate

Any successor Trend model must be pre-specified before testing and evaluated on untouched/out-of-sample periods or rolling-origin validation. Prefer institutionally published forward/nowcast constructs with horizons that actually match 10–30 days. The successor must materially exceed a naive recent-index-direction baseline and demonstrate stability across regimes, not merely exceed 50% in the same calibration sample.
