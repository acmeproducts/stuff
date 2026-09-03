# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT DEFINITION
Updated: 2026-09-03

## 1. Product principle
Market Navigator is an evidence-backed market research environment.

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest → visualization/API consumers + AI interpretation**

The backend owns objective, deterministic and reproducible evidence. AI interprets evidence; it does not create source facts.

**Now explains. Explore investigates. Library remembers and continues. Health establishes trust.**

## 2. Recovery authority and implementation ancestor
`MARKET-NAVIGATOR-NOW-EXPLORE-CONTRACT.md` dated 2026-09-03 is folded into this plan and governs NOW/V1/V2/V3/EXPLORE geometry and transitions.

The next implementation must descend **directly from the exact last-good pre-governance Market Navigator 3.9.7 implementation**. Rejected Gate 4 releases are evidence only. No wrapper, iframe injection, compatibility patch, or rejected-release code may sit between the last-good implementation and the next candidate.

Preserve the known-good chart/data/range behavior. The principal chart change is deliberately narrow: **V2 adds the selected governed index curve to the existing working governed-component comparison chart.**

## 3. Permanent application frame
- Left collapsible rail: **NOW · EXPLORE · LIBRARY · HEALTH**.
- **CONFIG** separated at bottom.
- Preserve accepted 3.9.7 frame/layout except explicit governed changes.
- No arbitrary redesign.
- Analytical breadcrumbs at top. **No dedicated Back-to-Market button.**

## 4. Canonical horizons and chart clock
Exactly **1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**. NOW defaults to **5D**.

One common horizon clock owns every visible series' X-domain. The horizon is not derived independently from each series' latest observation. Monthly/weekly/stale components terminate at real observations or have no in-window point; they never stretch or redefine the horizon.

Before owner test, all seven horizons must be mechanically exercised for V1, Risk V2, Growth V2 and Macro V2, with explicit short-horizon qualification of **5D, MTD and YTD**.

## 5. Canonical NOW progression
**V1 Market → V2 selected Index replacement → V2 component information card → More info → V3 Analysis modal → close → exact prior V2 state**.

There is no V4. EXPLORE is separate and is not V5.

### V1 — Market
- One primary chart footprint.
- RSK / GRW / MAC together, direction-adjusted Indexed 100.
- Same selected horizon/common X-domain.
- Selecting Risk/Growth/Macro replaces V1 with V2 in the same footprint.

### V2 — selected Index + governed components
- Replaces V1; no stacked V1+V2.
- Uses the recovered working multi-series comparison implementation rather than a second chart engine.
- Adds exactly one selected governed index reference curve to every governed component curve.
- Direction-oriented Indexed 100 Y1; no canonical V2 Y2.
- Missing/stale/sparse/failed/cadence-incompatible governed components remain visibly represented as degraded evidence; never silently disappear.
- Slow-frequency lines contain only real source observations and terminate at their real dates.
- One selected series/one real-point inspection at a time; context changes clear inspection.

### V2 component information card
Selecting a component stays in V2 and opens/updates a compact contextual card containing identity, definition, index role/direction, provider, native unit, cadence, latest real observation, active-horizon evidence/health, applicable construction disclosure, and **More info**. It must not turn phone portrait into a scrolling document.

### V3 — Analysis
Only More info opens V3 from V2. It opens on the exact selected component, single-series native Y1, preserving horizon and Market/index lineage. Additive multi-series analysis stays inside V3. Closing restores the exact V2 chart, selected component/card, horizon and inspection context.

## 6. Governed derived indices
Equal-weight, direction-adjusted, rebased 100.

**Risk:** SPY −1; VIX +1; credit spread +1; HY −1; DXY +1; MOVE +1; financial conditions +1.

**Growth:** Nasdaq +1; copper +1; small caps +1; Federal Reserve Manufacturing Production/IPMAN +1; WTI +1; unemployment −1; payrolls +1. ISM Manufacturing PMI is excluded because no permissible free historical/current source is available; IPMAN is the owner-approved replacement and must never be described as PMI.

**Macro:** 10Y +1; 2Y +1; 10Y−2Y +1; 10Y−3M +1; CPI +1; Core PCE +1; Fed Funds +1.

A missing governed series is a visible backend gap, never permission for substitution.

The index calculation must not change component population or weights merely because observations occur at different cadences. Composite timing/alignment rules must be deterministic, documented and mechanically tested; source series themselves remain real observations only.

## 7. V3 automatic axis rules
1. one series → native Y1;
2. 2+ compatible native-unit series → shared native Y1;
3. exactly two incompatible measurement families → native Y1 + Y2;
4. 3+ incompatible measurement families → Indexed-100 Y1, no Y2.

CPI + WTI is mandatory mixed-frequency acceptance.

## 8. EXPLORE
Separate principal mode: **EXPLORE discovery → selected series/set → V3 Analysis**. Taxonomy: Market | Risk | Growth | Macro | Other. Search and multi-select. Same canonical discovery component as Add Series. Never force EXPLORE through V1/V2 and never label it V5.

## 9. Evidence / Health
Only real canonical observations may be presented as source points. Health distinguishes source-not-published, collector failure/miss, persistence/cache failure, sparse coverage, stale evidence and cadence incompatibility. Collector success is not proof of current evidence. Browser-side reacquisition must not create a second canonical evidence store.

## 10. AI / conversation / Library
Preserve exact `devstream-test.html` provider/model configuration donor and `test.html` conversation presentation donor. CONFIG validation and AI execution share one state. V3 owns AI POV/conversation, Add Series, statistics/latest/correlation overlay, Library save/resume, Print and Download. These capabilities must not disturb the primary NOW geometry.

## 11. Mandatory process
**diagnose → Graveyard → Master Plan → restore approved baseline → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance**.

Rejected ship is rolled back immediately and never becomes the next implementation ancestor.

## 12. Mandatory pre-base proof
Before implementation work on the next candidate:
- identify/freeze exact last-good pre-spiral 3.9.7 commit/blob;
- prove its V1/V2/V3 chart/data/horizon behavior against historical acceptance evidence;
- inventory the smallest direct source edits required for current contract;
- prove canonical persisted schemas for every governed component;
- define one common horizon clock and deterministic index-alignment rule;
- no owner URL at pre-base/base.

## 13. Mandatory pre-ship qualification
Against the exact candidate artifact, not a surrogate:
- JavaScript syntax and browser boot;
- desktop and phone portrait geometry;
- all seven horizons × V1/Risk/Growth/Macro;
- complete governed component presence/degraded representation;
- common X-domain;
- V2 selected index + all components;
- 5D/MTD/YTD short-horizon slow-frequency behavior;
- one-series/one-real-point inspection and stale-inspection clearing;
- component→info card→More info→exact V3;
- V3 close→exact V2 restoration;
- CPI + WTI mixed-frequency acceptance;
- no synthetic/fallback source evidence;
- breadcrumbs present and no dedicated Back-to-Market button;
- phone portrait core NOW flow without page-scroll hunt.

Only after every release-blocking gate passes may a Pages owner-test URL be returned.

## 14. Graveyard
`MARKET-NAVIGATOR-GRAVEYARD.md` is the binding negative specification. R11, R12 and R13 are rejected. R13's wrapper/compatibility-patch recovery technique is explicitly prohibited.
