# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT / BUILD / QUALIFICATION PLAN
Updated: 2026-09-16
Next release scope: **Turn 26 — objective index explanation + NOW Print repair**

This file is the single positive specification for Market Navigator. `MARKET-NAVIGATOR-GRAVEYARD.md` is the binding negative specification. Do not create a parallel plan.

---

## 1. Product definition

Market Navigator is an evidence-backed market research application with three permanent primary modes:

**NOW · LIBRARY · HEALTH**

with **CONFIG** fixed at the bottom of the left rail.

The application has one NOW analytical state:

**context index + component-basket-expanded flag + visible series set + active series + horizon + representation + frozen evidence revision**.

The backend owns objective, deterministic, reproducible evidence. AI interprets governed evidence; it does not invent source facts, index arithmetic, component weights, component contributions, or horizon endpoints.

Product pipeline:

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest / Source Health → governed derived-index calculation → chart/explanation/report consumers → AI interpretation → frozen Library analysis**

---

## 2. Source-of-truth hierarchy

When sources disagree, use this order:
1. this Master Plan;
2. owner-reviewed accepted behavior in `MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md`, where not superseded here;
3. canonical backend evidence under `data/market-backend/`, `market-data/`, and `market-evidence/` after schema/freshness validation;
4. the exact qualified Turn 25 baseline identified in Section 3;
5. historical implementations only as failure evidence or for an explicitly named accepted mechanism;
6. `MARKET-NAVIGATOR-GRAVEYARD.md` as the binding negative specification.

Historical V1/V2/V3/V4/V5 terminology is prohibited from the active product.

---

## 3. Turn 26 baseline authority

### 3.1 Last-known-good application baseline

For Turn 26, the approved executable baseline is the **qualified Turn 25 application immediately before the failed Index Explanation implementation**.

Pin this baseline to:
- qualified Turn 25 publication commit: `43e30cd31c4c2d83b49cf2eb532041cf5778006d`;
- publication description: **Publish qualified Market Navigator Turn 25 print and parallel chat**;
- application: `market-navigator-turn25-pre-ship.html` as it exists at that commit.

The next implementer MUST fetch that commit, obtain the exact blob SHA of `market-navigator-turn25-pre-ship.html`, record it in the Turn 26 qualification evidence, and construct `market-navigator-turn26-pre-ship.html` from that exact file.

### 3.2 Rejected implementation

The Index Explanation implementation merged by commit `c3cde56268303d8e2a222012d5a34aee9f26651e` is rejected as an application donor. Owner/device behavior showed that tapping the information icon merely added another visual circle/focus state and did not open a functional explanation surface.

Do not patch that implementation forward. Do not copy its HTML/JS/CSS implementation into Turn 26. It may be inspected only to understand failure modes and to ensure regression tests catch them.

The written objective of Index Explanation remains approved and is reimplemented cleanly from the qualified Turn 25 baseline.

### 3.3 Current-main rule

Current `main` remains the integration/data target. Repository-side data, evidence, Source Registry, Health, and unrelated project movement are preserved. Application construction is from the pinned Turn 25 baseline, then integrated with current main only after candidate qualification.

---

## 4. Retained product contract

Turn 26 is additive. It must preserve all qualified Turn 25 behavior, including:
- one NOW analytical workspace; no separate Explore route/view and no Component modal;
- neutral ENV with RSK · GRW · MAC and no default emphasis;
- anchored `ENV / RSK|GRW|MAC / COMPONENTS` lifecycle;
- Add discovery;
- source-relative Indexed 100 for raw/source series;
- seven horizons: 1D · 5D · MTD · YTD · 1YR · 3YR · 5YR;
- native density for 1D/5D/MTD, weekly for YTD/1YR, monthly for 3YR/5YR using real persisted observations only;
- WTI direct-series truth and cadence-aware GDP q/q/y/y truth;
- active-series emphasis, native + Indexed 100 inspection, Data/correlation;
- canonical NOW context menu;
- exact frozen NOW state into AI POV;
- Library frozen chart, Markdown transcript, continuation and durable persistence;
- Library Listen/Chat and semantic TTS behavior;
- geometry-only rail/ResizeObserver/orientation repaint;
- CONFIG tabs AI · Chart Config · Sources · About;
- credential-safe Replace Key behavior;
- canonical Sources control plane and repository-backed evidence;
- healthy registered sources discoverable through Add;
- unsupported horizons disabled rather than fabricated;
- Library Analysis Report printing from the frozen analysis;
- console/unhandled/required-resource failures as release blockers.

No retained semantic regression test may be weakened.

---

## 5. Governed indices

### Risk — RSK
SPY −1 · VIX +1 · HY spread +1 · HYG −1 · DXY +1 · MOVE +1 · NFCI +1

### Growth — GRW
QQQ +1 · copper +1 · small caps +1 · IPMAN +1 · WTI +1 · unemployment −1 · payrolls +1

### Macro — MAC
10Y +1 · 2Y +1 · 10Y−2Y +1 · 10Y−3M +1 · CPI +1 · Core PCE +1 · Fed Funds +1

Direction affects derived-composite construction only. It never reverses raw/source chart display, crosshair values, Data values, exports, or source-relative Indexed 100.

ISM Manufacturing PMI remains excluded unless a permissible free canonical source is established. GDP q/q and GDP y/y remain deterministic quarterly transforms of canonical Real GDP levels with no interpolation. WTI direct-analysis availability remains separate from Growth-composite eligibility.

---

## 6. Turn 26 Objective A — Index Movement Explanation

### 6.1 Purpose

The information control answers a narrow, objective question:

> **For the currently selected horizon, how did each displayed governed index move from its baseline to its current/end value, and how did the governed underlying components contribute to that movement?**

This is an explainability and audit surface, not a second AI opinion and not a visual reading of chart pixels.

### 6.2 Information control

Place one circled information control (`ⓘ`) inside the NOW chart plotting area at the upper-right, inset from the plot boundary so it does not overlap the `…` context menu or chart labels.

Required behavior:
- one visible circle only;
- normal, pressed, keyboard-focus and touch-focus states may change color/background but MUST NOT draw a second persistent concentric ring;
- minimum touch target 40×40 CSS px while the visible glyph may remain compact;
- `aria-label="Explain index movement"`;
- tapping/clicking/keyboard activation calls one explicit `openIndexExplanation()` path;
- activation MUST open the modal in the same event path; a focus-only visual response is a failure;
- the control must remain above the canvas hit surface and must not be swallowed by chart pointer handling.

### 6.3 Applicable indices

In neutral ENV, explain every displayed governed derived index: RSK, GRW and MAC.

In an anchored workspace, explain the anchor derived index. If another governed derived index has been added as a visible comparison, it may be included as an additional section. Raw/source series are not presented as if they were governed composites.

### 6.4 Horizon semantics

The explanation always uses the exact NOW horizon at the instant the modal opens.

For each applicable index:
- identify the canonical first eligible observation in the selected horizon as baseline;
- identify the canonical last eligible observation as end/current;
- report the actual observation dates;
- use the same evidence revision and governed index definition that produced the visible analytical state;
- never infer endpoints from chart geometry;
- never restamp an older observation to the horizon boundary;
- never forward-fill solely to make attribution possible.

If cadence differences mean a component does not have an observation on the index boundary date, use only the governed calculation's actual canonical alignment rule. The explanation must disclose the actual component observation date when it differs. It must not invent a same-date value.

### 6.5 Deterministic calculation contract

For each index and component, construct a typed explanation record before rendering Markdown:

```text
IndexExplanationRecord
  indexId
  indexName
  indexDefinitionVersion
  evidenceRevision
  horizon
  baselineDate
  endDate
  baselineIndexValue
  endIndexValue
  indexMovementAbsolute
  indexMovementPercent
  components[]
    componentId
    displayName
    weight
    direction
    baselineObservationDate
    baselineValue
    endObservationDate
    endValue
    componentMovementAbsolute
    componentMovementPercent
    indexContributionAbsolute
    indexContributionPercentPoints
    status
    sourceRevision
  reconciliation
    summedContribution
    indexMovement
    residual
    roundingPrecision
  status
```

The calculation layer owns this record. Markdown, modal rendering, Copy, Download MD, AI POV and Library consume the same record/result. None may independently recalculate attribution.

### 6.6 Contribution truth

Do not assume that `weight × raw percent movement` is necessarily the governed contribution formula. The implementation must inspect and use the actual canonical derived-index construction. The explanation contribution must be mathematically consistent with the production index calculation.

If the current derived-index evidence does not preserve enough information to reproduce exact component attribution for a horizon, the feature must report **Attribution unavailable** or **Attribution degraded** and identify the missing prerequisite. It must not reverse-engineer an answer from the plotted index line.

For every healthy explanation:

**sum(component contributions) = index movement ± explicit rounding residual**

The residual must be numerically tested against a governed tolerance. A failed reconciliation is a Health/model-governance failure, not a formatting issue.

### 6.7 Markdown report contract

The modal body is generated as Markdown and rendered with the application's existing Markdown renderer/sanitizer.

Required structure for each index:

```markdown
# RSK — 1 Year

**Index movement: −5.0%**  
Baseline: **100.00** on YYYY-MM-DD  
Current: **95.00** on YYYY-MM-DD

## Components

| Component | Weight | Baseline | Current | Component movement | RSK impact |
|---|---:|---:|---:|---:|---:|
| Component 1 | 50% | 100 | 90 | −10.0% | −2.5 pp |
| Component 2 | 50% | 100 | 90 | −10.0% | −2.5 pp |
| **Reconciliation** | **100%** | | | | **−5.0 pp** |

## What this means
Both components moved lower. Because they carry equal governed weight in this example, each contributed equally to the index decline.

## Calculation status
Reconciled · residual 0.00 · evidence revision … · index definition …
```

The numbers above are illustrative only. They MUST NOT appear in code as fallback data, fixtures reachable in production, or hardcoded UI values.

### 6.8 Plain-language explanation

The `What this means` paragraph must be simple and non-technical.

Preferred implementation: deterministic templates derived from the completed record, for example:
- identify whether the index rose, fell or was essentially unchanged;
- identify the largest positive and negative contributors when deterministically supported;
- identify whether contribution was broad or concentrated using an explicit deterministic rule;
- state missing/degraded component conditions plainly.

AI is not required for this paragraph. If AI is ever used for wording, it receives the completed deterministic record and may only restate those facts. It may not add causal market claims, new numbers, components, weights, dates or arithmetic.

### 6.9 Modal UI

Desktop/tablet modal mock:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Index Movement Explanation · 1YR          Copy   Download MD   × │
├──────────────────────────────────────────────────────────────────┤
│ # RSK — 1 Year                                                 │
│ Index movement: −5.0%                                          │
│ Baseline 100.00 → Current 95.00                                │
│                                                                │
│ Components                                                     │
│ ┌───────────┬────────┬──────────┬─────────┬──────────┬────────┐ │
│ │ Component │ Weight │ Baseline │ Current │ Movement │ Impact │ │
│ ├───────────┼────────┼──────────┼─────────┼──────────┼────────┤ │
│ │ ... governed rows ...                                        │ │
│ └───────────┴────────┴──────────┴─────────┴──────────┴────────┘ │
│                                                                │
│ What this means                                                │
│ Plain-language deterministic explanation.                      │
│                                                                │
│ Calculation status: Reconciled                                 │
│ Evidence revision … · Definition …                             │
│                                                                │
│ # GRW — 1 Year ...                                             │
└──────────────────────────────────────────────────────────────────┘
```

Phone modal mock:

```text
┌───────────────────────────────┐
│ Index Explanation · 1YR      │
│ Copy   Download MD        ×   │
├───────────────────────────────┤
│ RSK — 1 Year                  │
│ −5.0%                         │
│ 100.00 → 95.00                │
│                               │
│ Components                    │
│ [table scrolls horizontally   │
│  inside report if necessary]  │
│                               │
│ What this means               │
│ ...                           │
│                               │
│ Reconciled · revision …       │
└───────────────────────────────┘
```

Modal requirements:
- top strip remains visible while report body scrolls;
- Copy copies the complete Markdown source, not rendered text fragments;
- Download MD downloads byte-equivalent Markdown content apart from an optional terminal newline;
- `×` closes without analytical rerender;
- Escape closes on keyboard platforms;
- background chart state remains unchanged;
- modal itself may scroll; the underlying NOW page must not jump;
- focus returns to `ⓘ` after close where supported.

### 6.10 Failure/degraded-state mock

```text
┌──────────────────────────────────────────────────────────────┐
│ Index Movement Explanation · 1YR       Copy  Download MD  × │
├──────────────────────────────────────────────────────────────┤
│ RSK — 1 Year                                               │
│ Attribution status: DEGRADED                               │
│                                                            │
│ RSK movement is available, but exact component attribution │
│ cannot be reconciled for this horizon.                     │
│                                                            │
│ Missing prerequisite                                       │
│ • MOVE: required baseline observation unavailable          │
│                                                            │
│ No contribution values have been estimated.                │
└──────────────────────────────────────────────────────────────┘
```

A degraded report is a valid truthful product state. A fabricated complete report is not.

---

## 7. Objective A integration with AI POV and Library

### 7.1 One calculation, multiple consumers

At AI POV launch:

**freeze exact NOW analytical state → compute/freeze IndexExplanationRecord(s) from that frozen evidence → generate Markdown → attach record + Markdown to AI evidence packet → persist processing analysis → navigate to Library → run provider**

The AI prompt must explicitly identify the explanation block as deterministic governed evidence.

The model may interpret what the supplied contribution pattern means, but it may not recompute or replace the arithmetic.

### 7.2 Required AI evidence fields

Frozen analysis context includes:
- selected horizon;
- index definition/version;
- evidence revision;
- baseline/end dates and values;
- component values/dates;
- weights/directions;
- contributions;
- reconciliation result;
- attribution status;
- exact Markdown shown in the modal.

### 7.3 Library persistence

The selected analysis persists the exact explanation record and Markdown used at analysis creation. Opening the Library analysis later must not recompute it against newer evidence.

Continuation chat may reference the frozen explanation. If the user explicitly requests current/new data, that is a new evidence operation and must be identified as such rather than silently changing the saved explanation.

---

## 8. Objective A integration with HEALTH / model risk

HEALTH distinguishes **source/data health** from **derived-model attribution health**.

For RSK, GRW and MAC, expose at minimum:
- definition/version;
- evidence revision;
- component count required / available;
- stale/missing component count;
- attribution coverage by horizon;
- reconciliation PASS / DEGRADED / FAIL;
- maximum reconciliation residual;
- last calculation timestamp;
- reason when attribution is unavailable.

A green source status does not automatically make a derived index attribution-healthy.

Suggested Health row:

```text
RSK  ACTIVE   Data 7/7   Attribution 6/7 horizons   Reconcile PASS   Updated …
```

Selecting detail may show the horizon matrix:

```text
        1D   5D   MTD   YTD   1YR   3YR   5YR
RSK     —    ✓     ✓     ✓     ✓     ✓     ✓
GRW     —    ✓     ✓     ✓     ✓     ✓     ✓
MAC     —    ✓     ✓     ✓     ✓     ✓     ✓
```

`—` means unsupported/unavailable with an explicit reason, not failure masquerading as green.

---

## 9. Turn 26 Objective B — repair NOW context-menu Print

### 9.1 Problem statement

The NOW `… → Print` action currently produces an essentially empty/meaningless result containing little more than a header. This is rejected.

The existing **Library / AI POV Analysis Report print mechanism is the accepted donor mechanism** because it successfully renders the frozen chart and document content. Reuse its report-building approach and print CSS architecture rather than inventing a separate viewport-print mechanism.

This is the only explicit implementation-donor exception for Turn 26: use the qualified Turn 25 Library Print mechanism from the baseline as the pattern/helper source.

### 9.2 NOW Print product contract

NOW Print generates a dedicated, self-contained **Market Navigator Chart Report** from the exact current frozen NOW analytical state.

It must contain:
1. report title: `Market Navigator Chart Report`;
2. generated date/time;
3. exact current breadcrumb/context;
4. selected horizon and exact visible date range;
5. representation/axis mode;
6. visible-series legend;
7. the exact current chart, at useful print resolution and aspect ratio;
8. current evidence/revision/source context already available to NOW;
9. for applicable governed derived indices, the same deterministic Index Movement Explanation Markdown described in Objective A;
10. source/provenance notes already belonging to the frozen state where available.

It must not include navigation rail, `…` menu, chart interaction controls, crosshair tooltip, Add picker, Config, modal chrome, or other application controls.

### 9.3 NOW Print mock

```text
MARKET NAVIGATOR CHART REPORT
ENV · 1YR · Indexed 100
2025-09-14 → 2026-09-14
Evidence revision: …

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    EXACT FROZEN NOW CHART                    │
│             RSK ───   GRW ───   MAC ───                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

INDEX MOVEMENT EXPLANATION

RSK — 1 Year
Index movement: …
[component contribution table]
What this means: …

GRW — 1 Year
...

SOURCES / EVIDENCE
...
```

For an anchored raw-series view with no governed composite explanation, the report still prints the chart and state/evidence context; it does not invent an index-explanation section.

### 9.4 Print implementation architecture

Use a dedicated temporary print-report surface, following the working Library Print mechanism:

**freeze current NOW state → build report DOM from frozen state → clone/render exact chart into report → render Markdown/context → mark report print-visible → call native `window.print()` once → cleanup temporary report state after print**

Requirements:
- do not print the interactive NOW viewport directly;
- do not refetch evidence to print;
- do not analytically rerender the chart to a different state;
- if the chart must be rendered into a print canvas/image, use the frozen chart model and current styles, not a new evidence fetch;
- preserve aspect ratio and readable labels;
- use print media CSS to hide the app and show only the report;
- allow natural browser pagination;
- do not impose paper size, destination, page count or orientation;
- cleanup must restore the exact interactive state.

### 9.5 Relationship to Library Print

Library Print remains unchanged in product behavior: it prints the selected frozen analysis with frozen chart and full transcript.

NOW Print and Library Print should share report primitives where practical:
- report shell;
- chart cloning/rendering;
- print media visibility;
- Markdown print styles;
- cleanup lifecycle.

They differ in content source:
- NOW Print = current frozen NOW state + objective explanation;
- Library Print = selected frozen Library analysis + complete transcript.

Do not route NOW Print through Library or create a Library analysis merely to print.

---

## 10. Screen-level interaction map

### 10.1 NOW

```text
┌──────┬────────────────────────────────────────────────────────────┐
│ rail │ ENV        1D 5D MTD YTD 1YR 3YR 5YR               …    │
│      ├────────────────────────────────────────────────────────────┤
│      │ RSK ───   GRW ───   MAC ───                              │
│      ├────────────────────────────────────────────────────────────┤
│      │                                                     ⓘ      │
│      │                                                            │
│      │                         CHART                              │
│      │                                                            │
│      │                                                            │
│      ├────────────────────────────────────────────────────────────┤
│      │ build · date range                         Indexed 100      │
└──────┴────────────────────────────────────────────────────────────┘
```

`ⓘ` opens Objective A. `… → Print` invokes Objective B.

### 10.2 NOW context menu

```text
┌──────────────────────┐
│ AI POV               │
│ Data                 │
│ Print                │ ← dedicated Chart Report
│ Download Markdown    │
│ Download CSV         │
│ Download JSON        │
└──────────────────────┘
```

### 10.3 AI POV evidence flow

```text
NOW frozen state
      │
      ├── chart/evidence packet
      │
      └── deterministic IndexExplanationRecord + Markdown
                         │
                         ▼
                    AI POV prompt
                         │
                         ▼
                frozen Library analysis
```

There is no AI-generated arithmetic branch.

---

## 11. Explicit Turn 26 development plan

### Phase 0 — establish baseline and protect it
1. Fetch current `main`.
2. Read this Master Plan and Graveyard in full.
3. Fetch commit `43e30cd31c4c2d83b49cf2eb532041cf5778006d`.
4. Extract `market-navigator-turn25-pre-ship.html` from that commit.
5. Record its blob SHA and byte size.
6. Prove the baseline boots and run the strongest existing Turn 25 cumulative QA available at that commit.
7. Manually/browser-verify the baseline NOW, AI POV, Library, TTS and working Library Print before mutation.
8. Create `market-navigator-turn26-pre-ship.html` as a byte copy plus build identity only.
9. Run baseline gates again. If they fail, diagnose before feature work.

### Phase 1 — inspect the actual index calculation
1. Locate the canonical RSK/GRW/MAC construction path and evidence schema.
2. Document in code comments/test fixtures exactly how weights, directions, normalization/alignment and index values are calculated.
3. Determine whether exact horizon contribution can be reproduced from existing canonical evidence.
4. If additional deterministic intermediate values are required, add them to the governed calculation/evidence layer—not to UI-local guesses.
5. Build a pure calculation function returning `IndexExplanationRecord`.
6. Unit-test reconciliation before any modal UI exists.

Exit gate: deterministic records reconcile for healthy fixtures and explicitly degrade for missing/stale fixtures.

### Phase 2 — build Markdown generator
1. Implement one pure `buildIndexExplanationMarkdown(record[])` function.
2. Ensure stable ordering of indices/components.
3. Ensure formatting/rounding occurs only at presentation boundaries; calculations retain full precision.
4. Add deterministic plain-language templates.
5. Test positive, negative, flat, concentrated, mixed and degraded cases.

Exit gate: Markdown snapshots match calculated records; no illustrative values exist in production paths.

### Phase 3 — build the modal interaction
1. Add the `ⓘ` control to the chart overlay layer, not inside the canvas drawing code.
2. Give it a dedicated touch/click handler that stops chart gesture handling as needed.
3. Add one modal shell with top strip, scrollable Markdown body, Copy, Download MD and `×`.
4. On open, snapshot the current already-loaded analytical state and compute explanation without evidence fetch.
5. Render Markdown with existing marked/DOMPurify path.
6. Copy/download from the same stored Markdown string.
7. Close and restore focus without analytical render.

Exit gate: real click/tap opens modal; no second-ring-only failure; state/fetch counters unchanged.

### Phase 4 — feed explanation into AI POV and Library
1. Extend the frozen AI evidence packet schema with explanation record + Markdown.
2. Generate/freeze it before provider execution.
3. Add prompt instructions that arithmetic is governed evidence and must not be recalculated.
4. Persist the same explanation with the Analysis object.
5. Re-read persisted analysis and prove byte/semantic equality.
6. Prove later evidence refresh does not mutate the saved explanation.

Exit gate: modal, AI packet and Library record all contain the same deterministic explanation identity/hash.

### Phase 5 — Health/model-governance reporting
1. Compute attribution health from component availability + reconciliation.
2. Add derived-model health rows/details without changing source-health semantics.
3. Expose per-horizon availability/reconciliation.
4. Explicitly distinguish unsupported from failed.

Exit gate: a source-green but unreconciled derived index cannot report attribution green.

### Phase 6 — repair NOW Print using working Library Print architecture
1. Locate the qualified Turn 25 Library Print report builder and print CSS.
2. Extract/share safe report primitives rather than duplicating print lifecycle logic.
3. Implement NOW Chart Report builder from frozen NOW state.
4. Reuse frozen chart rendering/cloning approach that works for Library Print.
5. Add state/context/evidence metadata.
6. Include Objective A Markdown for applicable derived indices.
7. Call native print once and cleanup.
8. Verify Library Print remains unchanged.

Exit gate: NOW Print produces a meaningful chart report and Library Print still produces the complete Analysis Report.

### Phase 7 — cumulative integration
1. Run all new Turn 26 gates.
2. Run the strongest complete Turn 25 regression matrix unchanged or strengthened.
3. Test desktop viewport, tablet viewport and phone viewport.
4. Test touch activation specifically for `ⓘ`.
5. Fetch latest `main`.
6. Integrate without overwriting unrelated repository/data movement.
7. Rerun the entire suite on the exact merged artifact.
8. Verify Pages deployment.
9. Open the exact cache-busted Pages URL and perform live smoke checks for `ⓘ`, NOW Print, AI POV and Library Print.

No owner-facing Turn 26 URL is returned until all release-blocking gates pass.

---

## 12. Turn 26 release-blocking test gates

### Gate A — baseline provenance
- Turn 26 source is proven to descend from the exact Turn 25 baseline at `43e30cd…`, not from rejected `c3cde562…` application code.
- exact baseline application blob SHA recorded;
- baseline cumulative tests pass before feature mutation.

### Gate B — JavaScript/boot
- HTML parses;
- JavaScript syntax clean;
- boot completes;
- no application-owned console error;
- no unhandled promise rejection;
- no missing required resource;
- no null-DOM execution path.

### Gate C — information-control semantics
- exactly one `ⓘ` control exists in NOW chart plot overlay;
- its bounding box is in the upper-right plot region;
- touch/click target ≥40×40 CSS px;
- one tap/click opens the modal;
- activation test asserts modal visibility/content, not merely focus/class change;
- no persistent second concentric ring appears after activation;
- chart pointer handler does not consume activation;
- repeated open/close works.

### Gate D — state invariance
Capture before open: horizon, breadcrumb, visible series, active series, representation, evidence revision, analytical render generation and evidence-fetch count.

After open and after close, assert all are identical. Fetch count delta = 0. Analytical-render generation delta = 0.

Run for ENV and anchored RSK/GRW/MAC states and at least 5D, 1YR and 5YR.

### Gate E — arithmetic truth
For controlled governed fixtures:
- index baseline/end values match canonical calculation;
- component baseline/end values match canonical evidence;
- weights/directions match governed definitions;
- contribution values match production derived-index arithmetic;
- summed contributions reconcile within tolerance;
- displayed rounding residual is correct;
- positive/negative signs are correct;
- no production fallback contains illustrative example numbers.

### Gate F — horizon truth
- explanation horizon equals current NOW horizon;
- changing horizon changes baseline/end dates and calculations deterministically;
- actual observation dates are reported;
- no endpoint restamping;
- no forward-fill introduced for explanation;
- sparse/cadence-limited data reports truthful dates/status.

### Gate G — degraded evidence
Fixtures for missing baseline component, stale component, missing end observation and reconciliation mismatch must produce explicit degraded/unavailable output and no invented contribution.

### Gate H — Markdown / Copy / Download
- rendered modal contains headings, paragraphs and contribution tables;
- Copy equals stored complete Markdown source;
- Download MD equals the same source apart from optional terminal newline;
- Markdown sanitization remains active;
- long reports scroll within modal without clipping actions.

### Gate I — AI POV integration
- frozen AI packet contains exact explanation record + Markdown;
- provider prompt labels it governed deterministic evidence;
- no provider is asked to calculate missing attribution;
- provider failure path remains coherent;
- invalid provider creates no invalid Analysis artifact;
- explanation hash/identity matches modal result for the same frozen state.

### Gate J — Library persistence
- persisted analysis contains exact frozen explanation;
- durable re-read matches;
- later canonical evidence refresh does not rewrite it;
- continuation does not silently replace frozen evidence.

### Gate K — Health/model governance
- derived attribution health is separate from source health;
- healthy reconciled fixture = PASS;
- missing/stale component = DEGRADED/unsupported as appropriate;
- reconciliation outside tolerance = FAIL;
- source-green alone cannot force attribution-green.

### Gate L — NOW Print report
Using a populated ENV 1YR state:
- `… → Print` builds a dedicated report;
- native print invoked exactly once;
- report title/context/horizon/date range/representation present;
- exact frozen chart visibly present at nonzero dimensions;
- visible-series legend present;
- evidence/revision context present;
- deterministic Index Explanation present;
- app chrome absent;
- report has no viewport/fixed-height clipping;
- print cancellation/return leaves NOW state unchanged;
- no evidence fetch or analytical-state mutation occurs for print.

### Gate M — anchored/raw NOW Print
- anchored derived view prints correct anchor/context;
- raw-only view prints chart/context without fabricating an index explanation;
- mixed view prints only applicable governed-index explanation sections.

### Gate N — Library Print regression
- selected Library analysis still prints exact frozen chart;
- full long/multiple-response transcript prints;
- Markdown tables/links/images retain print formatting;
- interactive Library chrome absent;
- print cleanup leaves selected Library analysis unchanged.

### Gate O — retained Turn 25 product matrix
Run all strongest retained semantic gates for NOW navigation, horizons, indexing, Add, Data/correlation, AI preflight/failure, Library persistence, TTS speech handoff and transport, geometry invariance, credentials, Sources lifecycle, Health/provenance, WTI/GDP truth and race protection.

### Gate P — device/responsive
On phone/tablet/desktop dimensions:
- `ⓘ` visible and tappable;
- modal actions accessible without clipping;
- contribution table usable on narrow width;
- chart remains unchanged after modal;
- NOW Print preview/report contains chart;
- Library Print remains usable;
- no horizontal page-level overflow caused by new UI.

### Gate Q — exact merged artifact
After integration with latest main, rerun Gates B–P against the exact merge artifact. A pre-merge pass is insufficient.

### Gate R — Pages/live smoke
- Pages deployment successful;
- cache-busted Turn 26 URL loads exact merged artifact;
- live `ⓘ` tap opens modal;
- live modal contains nonempty objective explanation or truthful degraded state;
- live NOW Print report contains chart;
- AI POV launch still works;
- Library Print still contains frozen chart.

---

## 13. Publication contract

Publish only after every release-blocking gate passes.

Return to owner:
1. exact Turn 26 commit/merge SHA;
2. exact cache-busted GitHub Pages test URL;
3. baseline blob SHA used;
4. concise gate summary, including arithmetic reconciliation, AI/Library freeze, NOW Print, Library Print regression and device/touch results.

A Pages deployment or green static test alone is never qualification.

---

## 14. Permanent architectural rules retained

### Analytical render versus geometry repaint
Geometry events may repaint the already-current frozen chart model only. They may not fetch evidence, rebuild composition, change horizon/active series/representation, or recapture AI state.

### Raw/source Indexed 100
`Indexed 100 = 100 × value / baseline`. Component direction/weight applies only to derived-index construction.

### Evidence integrity
No synthetic chart evidence, proxy substitution, fabricated intraday data, forward-fill solely for visual continuity, or horizon-end restamping.

### View ownership
NOW, CONFIG, LIBRARY and HEALTH communicate through explicit state/navigation functions. One view does not manipulate another view's private DOM as navigation.

### Semantic testing
A test observes the capability's defining side effect/state transition. Cosmetic state is not proof. TTS must observe nonempty utterance handoff; Print must observe report content/chart; Index Explanation must observe modal content and reconciled arithmetic.

---

## 15. Explicit prohibited regressions

Do not introduce:
- V1/V2/V3/V4/V5 product terminology;
- separate Explore analytical mode;
- separate Component analytical page/modal;
- duplicated-index breadcrumbs;
- default-selected RSK on ENV load;
- raw-source direction inversion;
- synthetic/fallback chart evidence;
- duplicate chart/discovery/AI state engines;
- clipped mobile Listen controls;
- fake MP3 export from browser speech synthesis;
- saved API secrets repopulated into ordinary editable password fields;
- local-only custom ticker evidence bypassing canonical Health/revisions;
- provider-per-horizon economic identity switching;
- silent symbol/proxy substitution;
- geometry events invoking full analytical render;
- AI qualification covering only a verified happy path;
- tests that assert only an icon class/focus ring instead of the opened explanation;
- printing the interactive NOW or Library viewport as the report;
- AI-generated or chart-pixel-derived index arithmetic.

`MARKET-NAVIGATOR-GRAVEYARD.md` contains the binding negative specification in greater detail.
