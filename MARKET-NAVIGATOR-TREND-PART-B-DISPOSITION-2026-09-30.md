# Market Navigator — Trend Part B Disposition

Date: 2026-09-30
Status: **PART B COMPLETE — NO PREDICTIVE TREND APPROVED**

## Decision

The 10–30 day predictive Trend concept remains unqualified for production. `MN-TREND-1.0.0` failed its original production backtest. A fixed V2 diagnostic then compared that institutional ensemble with a simple 20-calendar-day recent-index-direction baseline and an agreement-only hybrid.

The V2 diagnostic is research-only because the same five-year outcome history had already been inspected during V1 qualification; it cannot serve as an untouched production qualification set.

## V2 diagnostic findings

### MAC

- 20-day naive recent-index direction: 45.58% / 56.81% / 54.46% hit rate at 10/20/30 days.
- Institutional V1: 29.21% / 32.95% / 39.77%.
- Agreement-only hybrid: 37.14% / 38.24% / 47.06% with much lower coverage.

Disposition: institutional Trend adds no demonstrated value. Do not publish MAC predictive Trend.

### GRW

- 20-day naive recent-index direction: 32.71% / 40.65% / 37.85%.
- Institutional V1: 48.25% / 54.39% / 54.39%.
- Agreement-only hybrid: 30.77% / 42.31% / 38.46% with lower coverage.

Disposition: institutional evidence improves on the weak naive baseline at 20/30 days, but ~54% is not strong enough to justify an investor-facing predictive label, and the history is not untouched. Do not publish GRW predictive Trend.

### RSK

- 20-day naive recent-index direction: 41.23% / 44.05% / 45.58%.
- Institutional V1: 51.37% / 50.27% / 52.75%.
- Agreement-only hybrid: 51.59% / 52.38% / 53.60% with reduced coverage.

Disposition: improvement is modest and remains near coin-flip territory. Do not publish RSK predictive Trend.

## Product consequence

Part B is closed with a negative production decision. The dashboard is therefore **not blocked on further Trend experimentation**. When dashboard design is discussed, it may use governed descriptive Current state and Health/Analysis evidence, but it must not imply a validated 10–30 day forecast.

No dashboard layout, placement, arrow/color semantics, or other UI design is approved by this disposition. Those remain subject to explicit owner design approval under Master Plan UI change-control.

## Research boundary

Future predictive Trend research is optional and separate from the current release. A successor may be reconsidered only with pre-specified methodology and genuinely untouched/prospective evidence demonstrating material improvement over a naive baseline at useful coverage. The failed V1 scheduled publisher remains disabled.

Evidence: `market-evidence/reports/trend-v2-research.json`.
