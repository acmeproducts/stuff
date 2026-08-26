# Market Navigator — Data Catalog Baseline Reconciliation

Status: **CANONICAL BASELINE REVIEW — 2026-08-26**

This document reconciles the new authoritative `data-catalog.json` against the actual Market Navigator source code, persisted database, and historical Market Regime / Market Navigator implementations.

The governing principle is:

> **Smart data, dumb reports.** Anything objective, deterministic, reusable, or computationally expensive is prepared in the backend. Reports expose prepared evidence. The UI visualizes it and AI interprets it.

## 1. Canonical visualization / report horizons

The only canonical horizons are:

- `1D`
- `5D`
- `1M`
- `YTD`
- `1Y`
- `3Y`
- `5Y`

`3M`, `6M`, and `All/Max` are not part of the new canonical baseline.

Historical versions used other horizon sets, including `3M`, `6M`, and `All`. Those are historical UI behavior only and must not drive the new backend contract.

## 2. Numeric source inventory reconciliation

### Current market collector

The current collector defines eight market series:

| ID | Source identifier | Catalog status |
|---|---|---|
| `spy` | Yahoo `SPY` | Present |
| `qqq` | Yahoo `QQQ` | Present |
| `vix` | Yahoo `^VIX` | Present |
| `tenYear` | Yahoo `^TNX` | Present, source decision required |
| `wti` | Yahoo `CL=F` | Present |
| `brent` | Yahoo `BZ=F` | Present |
| `gold` | Yahoo `GLD` | Present |
| `dxy` | Yahoo `DX-Y.NYB` | Present |

### Current macro collector

The current collector defines seventeen FRED macro series:

| ID | FRED identifier | Catalog status |
|---|---|---|
| `cpi` | `CPIAUCSL`, transformed YoY | Present |
| `coreCpi` | `CPILFESL`, transformed YoY | Present |
| `pce` | `PCEPI`, transformed YoY | Present |
| `corePce` | `PCEPILFE`, transformed YoY | Present |
| `fedFunds` | `DFF` | Present |
| `twoYear` | `DGS2` | Present |
| `thirtyYear` | `DGS30` | Present |
| `curve10y2y` | `T10Y2Y` | Present |
| `realTenYear` | `DFII10` | Present |
| `breakeven10y` | `T10YIE` | Present |
| `hySpread` | `BAMLH0A0HYM2` | Present, history deficient |
| `nfci` | `NFCI` | Present |
| `initialClaims` | `ICSA` | Present |
| `payrolls` | `PAYEMS` | Present |
| `industrialProduction` | `INDPRO` | Present |
| `retailSales` | `RSAFS` | Present |
| `realGdp` | `GDPC1` | Present |

**Result:** all 25 numeric series currently implemented by the collector/database are represented in the new catalog.

## 3. Historical source inventory reconciliation

The original Market Regime Monitor instrument set contained:

- Brent
- WTI
- 10Y Treasury yield
- VIX
- DXY
- SPY
- QQQ

All seven are already represented in the new catalog.

The later 3.9.7 browser implementation exposed ten primary metadata entries:

- SPY
- 10Y
- WTI
- QQQ
- VIX
- DXY
- CPI
- Fed Funds
- 2Y
- 30Y

All ten are represented in the new catalog.

No additional numeric source series from those historical source universes is missing from the new catalog.

## 4. Context-feed inventory

The current collector defines ten RSS/context feeds. All ten are represented separately in `context_feeds` in the catalog:

- WSJ Markets
- BBC Business
- BBC World
- Financial Times Markets
- Financial Times World
- MarketWatch
- Morningstar
- CNBC World
- New York Times Business
- New York Times World

These feeds are **context**, not objective market observations. They do not participate in the canonical numeric database or horizon calculations.

## 5. Existing database coverage versus new bootstrap requirement

The new catalog requires a minimum of six years of usable history and prefers ten years where the provider permits it.

### Market-series deficiency

The existing Yahoo daily foundation was built with a five-year request. Current persisted market files therefore contain only about five years of daily history (roughly 1,250 trading observations per series).

This means the existing persisted market history is **not sufficient for the new baseline**, even though it can presently draw a nominal 5Y chart. A robust 5Y T0 requires margin before the requested window and should not force another bootstrap as time advances.

**Required bootstrap action:** rebuild each canonical Yahoo-derived market series with at least six years and preferably ten years of daily history.

Affected current market series:

- `spy`
- `qqq`
- `vix`
- `tenYear` if Yahoo remains canonical
- `wti`
- `brent`
- `gold`
- `dxy`

### FRED coverage

Most current FRED series begin in 2019 or earlier in the local canonical database and therefore satisfy the six-year minimum or are close enough to satisfy it after a clean bootstrap.

The YoY inflation transformations naturally lose the first twelve source observations because a year-over-year value requires a prior-year denominator. The bootstrap must therefore request at least one additional year of raw index history beyond the desired transformed-history boundary.

### High-yield spread deficiency

`hySpread` currently begins on 2023-08-28 in the persisted source cache/database and contains only about three years of observations. This fails the new minimum-history contract.

**Required bootstrap action:** force a clean historical rebuild of `BAMLH0A0HYM2` and verify that the provider returns sufficient pre-2023 history. If not, the catalog must record the actual source limitation and a source decision is required before the database can be accepted.

## 6. 10-Year Treasury source inconsistency

The current architecture obtains:

- 2Y Treasury from FRED `DGS2`
- 30Y Treasury from FRED `DGS30`
- 10Y Treasury from Yahoo `^TNX`

That is an avoidable source inconsistency in a daily canonical evidence store.

### Baseline decision for bootstrap design

The preferred canonical 10Y source should be **FRED `DGS10`**, because it is directly comparable in source family, cadence, units, revision behavior, and provenance with `DGS2` and `DGS30`.

Yahoo `^TNX` may remain available as a secondary market-session validation series if there is a demonstrated need, but it should not silently substitute for the canonical constant-maturity Treasury series.

**Catalog action required before bootstrap:** change canonical `tenYear` provenance from Yahoo `^TNX` to FRED `DGS10`, or explicitly reject that change with a documented reason.

## 7. Proxy clarity

Two existing market sources are proxies and must remain explicitly labeled as such:

- `gold` currently uses **GLD**, an ETF proxy; it is not spot gold.
- `wti` and `brent` currently use front futures symbols (`CL=F`, `BZ=F`); they are futures-market observations, not a physical spot-price series.

This is acceptable for the evidence layer provided the catalog remains explicit. AI must receive the provenance/description so it does not misstate the underlying measure.

## 8. Historical parent/index/component relationships

Historical versions used multiple incompatible semantic grouping schemes.

### Early 3.9 grouping

- Risk: SPY + WTI
- Growth: SPY + 10Y
- Macro: 10Y + WTI

### Current persisted weighted-model grouping

- Risk: VIX + HY Spread + NFCI + Initial Claims
- Growth: QQQ + Payrolls + Industrial Production + Retail Sales + Real GDP
- Macro: CPI + Core PCE + Fed Funds + 10Y + 10Y/2Y Curve + Real 10Y + 10Y Breakeven + WTI
- Regime: arithmetic mean of Risk, Growth, Macro

These are **historical interpretation models**, not source-data definitions. They are not authoritative for the new smart-data backend and must not be baked into the source catalog.

The data catalog preserves neutral taxonomy (`domain`, `category`, `role`) so future Market → Index → Component presentation can be designed without turning historical scoring rules into data facts.

## 9. Intraday data

The current collector also maintains five-day 15-minute market data during active sessions.

The newly agreed canonical evidence baseline is daily and supports `1D / 5D / 1M / YTD / 1Y / 3Y / 5Y` prepared reports. Intraday collection is therefore **not required to validate the canonical database**.

Status: `inventory-only-pending-retirement-decision`.

It must not complicate the bootstrap or database viewer.

## 10. Baseline completeness conclusion

The new catalog is **complete relative to the numeric source universe currently implemented and the identifiable historical Market Regime / Market Navigator source universe**.

It is **not yet bootstrap-ready** because three material data-quality/source issues remain:

1. Yahoo market history is only about five years and must be extended.
2. High-yield spread history currently begins in August 2023 and must be repaired or explicitly source-limited.
3. Canonical 10Y Treasury provenance must be resolved; FRED `DGS10` is the preferred baseline.

These are backend-data issues, not UI issues.

## 11. Next execution gate

Do not build the production visualization or AI layer yet.

The next implementation must produce:

1. a catalog-driven bootstrap collector;
2. canonical observations sufficient for all seven horizons;
3. deterministic precalculated horizon reports;
4. an operational manifest generated from actual catalog/database state;
5. a plain database viewer capable of drilling from catalog metadata → operational state → horizon report → raw observations.

Acceptance requires every derived value to be traceable back to its source observations and catalog definition.
