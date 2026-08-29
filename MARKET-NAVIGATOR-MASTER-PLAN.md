# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT DEFINITION
Updated: 2026-08-29

## 1. Product principle

Market Navigator is an evidence-backed market research environment.

Architecture:

**Sources → Acquisition → Smart Data Store → Dumb Report API/JSON → Visualization + AI POV**

The backend owns objective, deterministic and reproducible facts. The AI interprets those facts. Semantic conclusions are not baked into canonical data.

**Library is living research, not storage.** Saving an analysis makes an investigation persistent. Its evidence, chart state, reasoning, notes and AI conversation can continue to evolve.

## 2. Permanent navigation

Left navigation contains four primary destinations:

1. **Now**
2. **Explore**
3. **Library**
4. **Health**

**Config** is separated at the bottom of the navigation.

## 3. Canonical horizons

The locked horizons are:

**1D · 5D · 1M · YTD · 1Y · 3Y · 5Y**

V3, V4 and V5 own independent analytical state. Changing their horizon, series selection, normalization, axes or other analytical configuration MUST NOT mutate V1 or V2 state.

## 4. NOW — four-panel orientation surface

Now is a 2×2 analytical surface.

| | Left | Right |
|---|---|---|
| Top | **V1 — Market chart** | **Market AI POV / conversation** |
| Bottom | **V2 — Selected Index Components chart** | **Selected-index AI POV / conversation** |

### V1 — Market

- Displays the three canonical indices together.
- Legend entries are interactive chips, not passive labels.
- Selecting an index makes it active and drives V2.
- Rich time-series presentation; charts are not restricted to a few x-axis data points.
- V1 remains stable when deeper Explore analyses change.

### V2 — Index Components

- Displays the components of the index selected in V1.
- Component legends are interactive chips.
- Selecting a component opens V3 for deeper investigation.
- V2 remains stable when V3/V4/V5 state changes.

### NOW AI POV

- AI POV is an ongoing contextual conversation, not a disposable summary.
- Top-right conversation is grounded in V1 market/index evidence.
- Bottom-right conversation is grounded in the active V2 index/component evidence.
- User can question, challenge and refine the POV and request supporting evidence.

## 5. EXPLORE — five-view analytical model

### V1 — Market

Market-level view of all three indices. See Now definition.

### V2 — Index

Component-level view of the V1-selected index. See Now definition.

### V3 — Same-index Component Compare

Purpose: investigate the component selected from V2 in a dedicated analytical window.

Requirements:
- Opens with the component selected from V2.
- May add one or more additional components **from the same index**.
- Supports normalized comparison so unlike absolute values can be compared meaningfully.
- Independent canonical horizon selection.
- Rich time-series chart.
- Interactive legend/chips.
- Crosshair/tooltips expose readable values for active series.
- Ongoing contextual AI conversation about this analysis.
- Correlation data available to the research context.
- Underlying analytical data can be copied/downloaded.
- Analysis can be committed to Library, including its AI conversation and research state.

### V4 — Cross-Index Custom Analysis

Purpose: construct an arbitrary comparison across the available component universe.

Requirements:
- Add/remove arbitrary index components, including components from different indices.
- Any useful subset is valid: 2 series, 5 series, all applicable series, etc.
- Interactive show/hide chips.
- Focus highlighting for an active series.
- Normalized comparison where appropriate.
- Crosshair/tooltips expose readable active-series values.
- Independent canonical horizon selection.
- Ongoing contextual AI conversation.
- Correlation data available to the research context.
- Underlying analytical data can be copied/downloaded.
- Complete analysis can be committed to Library.

### V5 — Dual-Y-Axis Analysis

Purpose: compare series whose native units cannot responsibly share a single Y scale.

Requirements:
- Supports two independent Y axes.
- Enables combinations such as Treasury yield (%) versus Brent crude ($).
- Series-to-axis assignment must be explicit and visible.
- Independent canonical horizon selection.
- Rich time-series chart.
- Interactive legends/chips and readable crosshair values.
- Ongoing contextual AI conversation.
- Correlation data available to the research context.
- Underlying analytical data can be copied/downloaded.
- Complete analysis can be committed to Library.

## 6. Chart density and time-axis contract

Charts MUST show enough observations and temporal structure to support actual research. They are not summary graphics limited to four or similarly sparse x-axis points.

The plotted data and the number of labeled axis ticks are separate concerns: the chart may plot all appropriate observations while labeling only a readable subset of dates.

Initial display guidance:
- **1D:** intraday only if canonical intraday evidence exists; otherwise applicable native observations. **TBD pending canonical intraday policy.**
- **5D:** daily/applicable observations; readable day labels.
- **1M:** daily/applicable observations; label density chosen for legibility.
- **YTD:** full available applicable observations; label monthly or otherwise readable intervals.
- **1Y:** full applicable observations; approximately 12 monthly x-axis labels is reasonable.
- **3Y:** full applicable observations; label density reduced appropriately (for example quarterly/semiannual landmarks). Final tick policy **TBD**.
- **5Y:** full applicable observations; do not attempt 60 monthly labels. Use a readable lower-density time scale while retaining richer underlying observations. Final tick policy **TBD**.

No UI implementation may thin the underlying analytical evidence merely to simplify rendering. Rendering/downsampling policy for very dense series is **TBD**, but exported research data must retain the canonical observations used for analysis.

## 7. AI POV and research conversation contract

AI is a persistent contextual analyst.

Context follows the analytical level:

**Market → Index → Component comparison → Cross-index/custom analysis → Dual-axis analysis → Saved Library research**

Requirements:
- Conversation persists with a saved analysis.
- Reopening a Library analysis restores the conversation and allows it to continue.
- AI can be challenged with user-supplied findings and external analysis.
- A single research analysis may discuss different horizons and relationships without forcing separate saved objects.
- Example: user can compare a 5-day correlation with a 5-year correlation in the same research thread.
- AI must distinguish deterministic backend facts/calculations from interpretive conclusions.
- Exact LLM/provider/context-window implementation: **TBD**.

## 8. Data extraction / research portability

V3, V4 and V5 MUST provide access to the data behind the analysis.

At minimum an export/data modal supports:
- **Copy**
- **Download**

Export should include, as applicable:
- series/component identifiers and descriptions
- timestamps and aligned observations used by the analysis
- units
- selected horizon/configuration
- normalization configuration/results
- correlation data/results
- source/provenance references
- analysis metadata sufficient to understand the export

Exact downloadable formats (CSV/JSON/XLSX/etc.): **TBD**.

Research portability is deliberate: a user can export the evidence, perform independent analysis elsewhere, return to the same Library research object, present findings, and challenge/refine the AI POV.

## 9. LIBRARY — living research workspace

Library is NOT a file cabinet, bookmark collection or static chart archive.

A saved item is an **Analysis Card / persistent research object**.

### Analysis Card required state

Each card stores or references enough information to restore:
- analysis title/name
- analysis type (V3/V4/V5 or other supported research object)
- selected series/components
- chart configuration
- horizon and normalization state
- axis assignments where applicable
- evidence/revisions/provenance required for reproducibility
- correlation calculations/references
- AI POV and complete continuing conversation
- user comments/notes/findings
- **created date**
- **last updated date**
- lifecycle/deletion state

### Analysis Card actions

Every Analysis Card must support:
- Open / resume research
- Continue AI conversation
- View/add research notes/findings
- Access/copy/download underlying analysis data
- **Share a snapshot of the analysis**
- **Print a snapshot/report of the analysis**
- **Download a snapshot/report of the analysis**
- **Soft delete**
- **Hard delete**

Soft delete should be reversible through a Trash/deleted state. Hard delete is destructive and requires an explicit confirmation interaction. Retention period and exact confirmation language: **TBD**.

A shared/printed/downloaded snapshot is a point-in-time representation. It does not replace the living Library research object.

### Library Omnisearch

Omnisearch is at the top of Library and searches the research corpus, not merely card titles.

Searchable content includes:
- analysis/card metadata
- instruments, indices and components
- analysis configuration
- AI conversation
- user comments and notes
- research findings
- correlation-related analysis content
- underlying analytical data where practical/indexable

Result behavior/ranking/highlighting: **TBD**, but a result should return the user to the relevant research object and, where practical, the matching context.

## 10. Research lifecycle

Canonical user journey:

**Observe → Explore → Analyze → Discuss → Save → Research externally → Return → Challenge → Refine → Continue**

Typical path:

1. User opens Now and sees V1 plus Market AI POV.
2. User selects an index chip; V2 shows its components and index AI POV.
3. User selects a component; V3 opens a same-index comparison workspace.
4. User may expand into V4 for cross-index comparison or V5 for unlike-unit dual-axis comparison.
5. User discusses evidence with AI and can inspect/export underlying data and correlations.
6. User commits the investigation to Library.
7. Library preserves the analysis and conversation as living research.
8. User can export evidence, conduct independent work, return, provide findings and continue/challenge the AI discussion.
9. User can share, print or download a point-in-time snapshot without ending the research object's lifecycle.

## 11. HEALTH — evidence trust and operations

Health exposes the objective state of the canonical evidence system:
- source/provider
- collection state
- freshness
- historical coverage
- observation counts
- provenance/revisions
- horizon readiness
- missing periods
- errors/failures
- operational controls where appropriate

Existing database viewer/cockpit functionality belongs to this operational/trust domain rather than defining the primary research UX.

## 12. CONFIG

Config is accessible separately at the bottom of the left navigation.

Configuration responsibilities: **TBD**. Candidate responsibilities include data-source controls, AI/provider settings, export preferences and operational credentials, but these are not yet canonical requirements.

## 13. Canonical backend contract

- Minimum historical bootstrap: 6 years.
- Preferred historical bootstrap: 10 years.
- One-time full bootstrap followed by incremental maintenance.
- Shared persisted canonical evidence plus device-local cache.
- Raw observations and deterministic derived calculations remain traceable and reproducible.
- AI does not become the calculator/source of record.
- Low-frequency series are not fabricated into daily observations.

Current canonical evidence pipeline and operational manifest remain the data foundation for this UX.

## 14. Definition gaps / TBD register

The product definition is substantially complete. Remaining decisions should not block the five-view UX approval artifact unless directly required by it.

1. Exact names/definitions of the three V1 indices, if not already fixed by the data/index model — **TBD / verify existing definition**.
2. Exact chart library/rendering implementation — **TBD**.
3. Intraday behavior for 1D given current canonical evidence policy — **TBD**.
4. Exact 3Y/5Y x-axis tick algorithm — **TBD**; must preserve rich underlying data.
5. Dense-series rendering/downsampling implementation — **TBD**; must not alter exported canonical analytical data.
6. Exact export file formats beyond required Copy + Download — **TBD**.
7. Library soft-delete retention period and Trash UX — **TBD**.
8. Hard-delete confirmation wording and any recovery window — **TBD**.
9. Share mechanism/permissions/link lifetime — **TBD**.
10. Snapshot print/download report composition — **TBD**.
11. Omnisearch ranking, indexing and result highlighting — **TBD**.
12. AI provider/model, context packaging and token-management implementation — **TBD**.
13. Exact Config surface — **TBD**.

## 15. Governance / next gate

This document is the canonical product-definition plan.

Next deliverable is the **five-view chart/UI approval artifact**, built against the canonical evidence model and this plan. It must demonstrate the agreed interaction model and rich chart behavior. Product implementation beyond that artifact remains gated on owner approval of the plan/artifact.
