# Market Navigator — NOW / EXPLORE Interaction Contract

Status: **AUTHORITATIVE SUPERSESSION — OWNER-APPROVED RECOVERY CONTRACT**
Date: 2026-09-03

This contract freezes the owner-defined analytical journey after specification drift was found in `MARKET-NAVIGATOR-MASTER-PLAN.md`, `MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md`, and later Gate 4 implementations.

Where those documents conflict with this contract on NOW/V1/V2/V3/EXPLORE geometry or transitions, **this contract governs** until its language is folded verbatim into the Master Plan.

This is a recovery specification, not permission to redesign the application.

## 1. Product modes

The permanent application modes remain:

**NOW · EXPLORE · LIBRARY · HEALTH**

with **CONFIG** separated at the bottom of the rail.

The two analytical entrances have different purposes:

- **NOW explains**: begin with market context and drill inward.
- **EXPLORE investigates**: begin with discovery/selection and build outward.

They may converge on the same V3 Analysis engine, but EXPLORE is not another numbered step in the NOW progression.

## 2. Canonical NOW progression

The complete NOW progression is:

**V1 Market → V2 selected Index replacement → V2 component info card → More info → V3 Analysis modal → close → exact prior V2 state**

There is no V4 product state.

EXPLORE is not V5 and must not be implemented as a continuation of NOW.

## 3. V1 — Market

V1 occupies the primary NOW analytical/chart surface.

Required:
- one primary chart surface;
- Risk / Growth / Macro derived trendlines together;
- legend identity `RSK / GRW / MAC`;
- direction-adjusted Indexed 100;
- selected horizon owns the X-domain;
- compact analytical ribbon and breadcrumbs above the chart;
- no stacked V2 below V1;
- no page scroll required to reach the primary V1 interaction on phone portrait.

Selecting Risk, Growth, or Macro does **not** add another chart below V1. It changes the same analytical surface into V2.

## 4. V2 — selected Index + governed components

V2 **replaces V1 in the same primary NOW chart footprint**.

Required display:
- selected derived index reference;
- every governed component of that index;
- all visible together as the V2 comparison object;
- direction-oriented Indexed 100 on Y1;
- no Y2 in canonical V2;
- same selected horizon/common X-domain;
- slow-frequency source series terminate at their real observations and never stretch the horizon;
- no fabricated daily observations or fake flat paths;
- missing, stale, sparse, failed, or cadence-incompatible governed components remain visibly represented as degraded evidence rather than silently disappearing;
- compact component/legend identities correspond to the actual visible series;
- one selected component/real point inspection at a time.

V2 is not a component-menu page and is not a single index line with component navigation pills. The index and governed components are the chart.

### Governed component definitions

The accepted product definitions remain authoritative; backend availability does not redefine them.

**Risk**
- SPY −1
- VIX +1
- credit spread +1
- high yield / HY −1
- DXY +1
- MOVE +1
- financial conditions +1

**Growth**
- Nasdaq +1
- copper +1
- small caps +1
- Federal Reserve Manufacturing Production / IPMAN +1
- WTI +1
- unemployment −1
- payrolls +1

Growth construction detail must state that ISM Manufacturing PMI is excluded because a permissible free historical/current source was not available and that IPMAN is the owner-approved replacement, not PMI.

**Macro**
- 10Y +1
- 2Y +1
- 10Y−2Y +1
- 10Y−3M +1
- CPI +1
- Core PCE +1
- Fed Funds +1

A missing required series is a visible backend/evidence gap. It is never permission for silent substitution.

## 5. V2 component selection — information card

Selecting a component in V2 does **not** immediately navigate away from V2 and does not immediately open V3.

It opens a compact **component information card while V2 remains the active analytical state**.

The card is contextual, not a new page/state.

Minimum card content:
- component identity / short identity;
- plain-language definition;
- role/direction in the selected index;
- source/provider;
- native unit;
- native cadence;
- latest real observation date/value;
- active-horizon evidence/health condition;
- construction disclosure where applicable;
- explicit **More info** action.

The information card must not displace the primary chart into a scrolling journey. It is part of the same phone-portrait decision surface.

Changing selected component replaces/updates the card. Changing index or returning to V1 clears it.

## 6. More info → V3 Analysis

Only the information card's **More info** action launches V3 from V2.

V3 opens as a modal over the current NOW context.

Required transition:
- root component is exactly the component selected in V2;
- single-series V3 begins in native units on native Y1;
- current horizon and Market/index lineage are preserved;
- additive series analysis remains inside V3;
- closing V3 restores the exact V2 chart, selected component, information card, horizon and inspection context that existed underneath it.

There is no intermediate page between the information card and V3.

## 7. V3 — Analysis

V3 is the common analytical workspace/modal.

Single series:
- native Y1;
- native units;
- exact real observations;
- selected horizon owns X-domain.

Additive automatic representation:
1. one series → native Y1;
2. 2+ compatible native-unit series → shared native Y1;
3. exactly two incompatible measurement families → native Y1 + Y2;
4. 3+ incompatible measurement families → Indexed-100 Y1, no Y2.

Former V4 multi-series capability belongs here. **No V4 page/state exists.**

V3 also owns the governed Analysis capabilities: Add Series, AI POV/conversation, statistics/latest/correlation overlay, Library save/resume, Print and Download.

## 8. EXPLORE — separate analytical entrance

EXPLORE is a principal application mode, not V4, V5, or a deeper NOW state.

Its flow is:

**EXPLORE discovery → select a series or set → V3 Analysis**

Required:
- full-page canonical discovery/selection presentation;
- taxonomy `Market | Risk | Growth | Macro | Other`;
- search and multi-select;
- same item identities, metadata and selection semantics as Add Series inside V3;
- Market contains selectable Risk/Growth/Macro; Market itself is not a selectable series;
- Risk/Growth/Macro contain their governed index + components;
- Other is catalog minus governed index constituents.

NOW and EXPLORE therefore converge on V3 but preserve different lineage:
- NOW lineage: `Market → Index → Component`;
- EXPLORE lineage: discovered/selected analytical object.

Do not force EXPLORE through V1 or V2 and do not label it V5.

## 9. Phone portrait / no-scroll geometry contract

The primary NOW decision surface must not require page scrolling to execute the core drill-down flow.

At V1, one viewport must contain the usable analytical ribbon/horizon controls, chart and compact series identities.

At V2, one viewport must contain the usable analytical ribbon/horizon controls, V2 chart and compact component identities. Opening the component information card must preserve access to the chart and More info without turning the primary flow into a vertical document.

Therefore:
- no stacked V1 + V2 charts;
- no acceptance/debug cards in the production analytical surface;
- no duplicated explanatory blocks between ribbon and chart;
- QA/redline material belongs behind a QA disclosure/badge;
- long provenance/diagnostic detail belongs behind disclosure or in HEALTH;
- legends/component controls must remain compact and mobile-usable;
- secondary metadata must not push the primary analytical action below the fold.

The accepted 3.9.7 application frame and Gate 3 interaction reference remain visual/interaction donors where they do not conflict with this contract.

## 10. Shared horizon and evidence rules

Exactly:

**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**

NOW defaults to 5D.

The selected horizon exclusively owns the X-domain. Source frequency, stale observations or missing evidence never expand it.

Only real source observations may be presented as source points. A slow-frequency series can end early or have no in-window observation. It cannot be visually extended as if new observations existed.

CPI + WTI remains a mandatory mixed-frequency acceptance case in V3.

## 11. Point inspection

One active series / one real point:
- select by line or compact series identity;
- nearest real observation only;
- one vertical guide;
- one marker;
- contextual date/value/unit;
- no all-series popup;
- context, horizon or series-set changes clear stale inspection.

The previous component's inspection popup/marker must never persist after component/context change.

## 12. Recovery prohibition

The following are explicitly rejected:
- patching R7, R8, R9 or R10 forward as the implementation ancestor;
- stacked V1 + V2 in NOW;
- V2 as a single index chart plus component-navigation pills;
- direct V2 component → V3 without the information-card bridge;
- information card and V3 conflated into one surface;
- V4 as a product state;
- EXPLORE represented as V5;
- principal ANALYSIS navigation invented for implementation convenience;
- scrolling required to discover the normal NOW drill-down action;
- arbitrary cards/anchors/intermediate pages;
- synthetic/random/fallback chart evidence;
- silent component substitution;
- implementation convenience overriding the specified interaction geometry.

## 13. Recovery implementation order

1. Treat R10 and prior rejected Gate 4 candidates as evidence only.
2. Restore the accepted 3.9.7/Gate 3 lineage as implementation donor.
3. Reconcile backend derived-index definitions to the governed component definitions above.
4. Prove persisted real observation schema before chart work.
5. Implement the single NOW chart footprint and V1 → V2 replacement.
6. Render V2 as index + every governed component, not as navigation pills around one line.
7. Implement V2 component information card without page-scroll dependency.
8. Implement More info → V3 modal and exact-state return.
9. Implement EXPLORE as the separate discovery entrance converging on V3.
10. Apply one chart/horizon/inspection engine across V1/V2/V3.
11. Integrate donor-faithful AI, conversation, Library, HEALTH, Print/Download without disturbing the primary geometry.
12. Run syntax/boot, data-truth, horizon/axis, mixed-frequency, phone-portrait and complete journey qualification before returning an owner test URL.

## 14. Release-blocking journey tests

A candidate cannot be handed to the owner unless all pass:

- NOW opens V1 in the primary chart footprint.
- Risk/Growth/Macro selection replaces V1 with V2 in that same footprint.
- V2 visibly contains the selected index plus every governed component or an explicit degraded/missing representation for the component.
- V2 uses direction-oriented Indexed 100 and the selected horizon.
- Component selection opens/updates the V2 information card; it does not open V3.
- Information card More info opens exact-component V3 modal.
- Closing V3 restores exact prior V2 state.
- There is no V4 state.
- EXPLORE is a separate principal mode and is never labeled/treated as V5.
- EXPLORE selection opens the common V3 Analysis engine.
- Core NOW drill-down is usable on phone portrait without a page-scroll hunt.
- No synthetic evidence is displayed.
- Point inspection clears correctly across every transition.

The owner is the acceptance reviewer, not the exploratory QA process.