# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT DEFINITION
Updated: 2026-08-29

## 1. Product principle

Market Navigator is an evidence-backed market research environment.

Architecture:

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest → dumb visualization/API consumers + AI interpretation**

The backend owns objective, deterministic and reproducible evidence. AI interprets evidence; it does not create source facts or silently become the calculator/source of record.

The primary product promise is deliberately simple:

**Now explains. Explore investigates. Library remembers and continues. Health establishes trust.**

## 2. Permanent application navigation

The left rail contains exactly four primary destinations:

1. **NOW**
2. **EXPLORE**
3. **LIBRARY**
4. **HEALTH**

At the bottom, visually separated from those destinations:

**CONFIG**

Config is a utility/settings surface, not a fifth primary destination. Health remains separate from Config because they answer different questions: Health asks whether the evidence can be trusted; Config controls how the application is configured.

## 3. Canonical horizons

Locked horizons:

**1D · 5D · 1M · YTD · 1Y · 3Y · 5Y**

Default on Now: **5D**.

Now and each Explore/Analysis workspace own independent horizon state. An analysis launched from Now may inherit the current Now horizon initially, but subsequent changes never mutate the other surface.

## 4. One chart engine / one visual contract

There is exactly **one canonical chart engine and framework**.

Views 1–5 are configurations/states of that engine, not separate chart implementations. No reduced-function duplicate chart may be created for Now, Explore, Library, print, or sharing.

The following visual and behavioral grammar must remain common everywhere:
- series identity and color grammar
- typography and line treatment
- chart geometry and plot-area rules
- horizon/time-axis logic
- value and unit formatting
- crosshair grammar
- legend/chip grammar
- missing-data and discontinuity treatment
- normalization mathematics
- source/frequency/status metadata grammar
- responsive behavior
- evidence fidelity

The canonical Analysis chart is the uncompromised implementation. Now uses curated configurations of the same engine.

## 5. The five chart views

The five views are the visual acceptance set for the common engine.

### V1 — Market

Location: **Now, upper-left**.

Purpose: orient the user to the market through the three derived analytical indices **Risk, Growth and Macro**.

Contract:
- Risk, Growth and Macro appear together on one chart.
- They share the selected Now horizon.
- They are displayed from a common normalized starting point for visual comparison.
- Market is a container, **not a fourth synthetic index or score**.
- `[RISK] [GROWTH] [MACRO]` are substantial interactive chips. Selecting one drives V2.
- Market AI POV sits beside V1 and interprets the relationships visible in the chart.
- AI may not make unsupported causal claims.

Critical integrity rule: Risk/Growth/Macro are derived analytical products and therefore require explicit component membership, sign orientation, normalization and aggregation definitions. **No historical weighted Risk/Growth/Macro scoring scheme is canonical merely because it exists in an older build.** Until the derived-index contract is explicitly defined and persisted, V1 must fail closed rather than fabricate an index.

### V2 — Index

Location: **Now, lower-left**.

Purpose: show all components of the index selected in V1 together.

Contract:
- All components of the selected index are shown on one normalized chart.
- The same common engine is used.
- Component chips are interactive.
- Selecting a component launches V3 in Explore on that exact series.
- The selected-index AI POV sits beside V2 and interprets the components collectively.
- V2 does not become an inline drill-down workspace.

V2 uses the same explicit derived-index membership contract required by V1. It may not invent component membership from historical UI groupings.

### V3 — Component / single-series Analysis

Location: **Explore**.

Purpose: definitive large-format inspection of one canonical source series.

Contract:
- Opens on the exact component selected from V2, or a series selected directly in Explore.
- Native values and native units.
- Full horizon selector.
- Rich horizon-correct time axis.
- Crosshair with exact date and value.
- Source, frequency, latest-observation and data-status metadata.
- Data, Statistics, POV, Export and Save affordances.
- May evolve into V4 by adding series; this does not launch a different chart implementation.

### V4 — Multi-series Analysis

Location: **Explore**; it is V3 after additional series are added.

Purpose: remain on the paved analytical road while comparing an arbitrary selected set without asking the user to design the chart.

Contract:
- 2–N selected series; **7 simultaneous real series is a mandatory stress/acceptance case**.
- Fixed display treatment: **Indexed 100**. Every active series is rebased to 100 at the selected horizon start.
- No dual-axis configuration and no arbitrary transform selector in V4.
- Add/remove/show/hide series through chips.
- Active-series focus may visually emphasize one line while de-emphasizing the others.
- Crosshair organizes exact underlying values for every active series.
- Changing horizon recomputes the rebasing from that horizon's starting observation.
- The display transformation never silently changes the statistical transformation.

V4 answers one clear question: **How did these selected things move relative to their own common starting point?**

### V5 — Explore comparison

Location: **Explore**.

Purpose: intentional investigation after leaving the paved-road V4 treatment.

V5 has two clean comparison choices:

1. **Native dual-axis** — exactly two series, common time X-axis, separate left/right Y-axes, each in its real native units.
2. **Normalized multi-series** — multiple series compared from a common starting point.

The primary chart remains visual-first. More scientific/statistical transforms belong in Statistics rather than cluttering the primary chart.

Hard rules:
- Time always remains the common X-axis.
- Native heterogeneous series may not be placed together on one raw Y-axis.
- Native dual-axis is capped at two series; that limitation is an intentional guardrail.
- Indexed comparison may scale to many series.
- A display transformation must never masquerade as a statistical conclusion.

Example: CPI (%) versus WTI ($/barrel) is appropriate as native dual-axis. CPI + WTI + VIX + HY Spread + 10Y belongs in normalized multi-series comparison.

## 6. NOW — curated report, not ad-hoc workspace

Now opens at 5D and has two analytical halves:

Top:
- V1 Market chart on the left
- Market AI POV on the right

Bottom:
- V2 selected-index component chart on the left
- selected-index AI POV on the right

Now is the **paved road**. It provides a tangible guided journey without exposing arbitrary chart configuration. Deeper investigation launches Explore rather than turning Now into a workbench.

## 7. EXPLORE — canonical Analysis workspace

Explore is a destination/workspace, **not a separate chart type**.

The canonical Analysis chart lives inside Explore before and whether it is saved. V3, V4 and V5 are states/configurations of the same chart object.

Canonical journey:

**Now → component chip → Explore/V3 → add series → V4 → deliberate comparison/V5 as needed → Data/Statistics/POV → Save**

Additional Analysis states, not additional chart views:

### Selected-range state
While viewing a larger horizon, the user may select a narrower interval. Statistics, correlation, export and AI can operate on that exact evidence interval.

### Evidence-inspection state
Invoking Data or Statistics keeps the chart contextually present. The user is not sent to a disconnected table product. Chart, observations, statistics/correlation and POV are different examinations of the same analytical state.

## 8. Chart geometry and axis contract

Charts must show the actual temporal shape of the evidence. They may not be reduced to a few artificial X-axis points.

The number of plotted observations and number of labeled ticks are separate concerns.

Horizon behavior:
- **1D:** use canonical intraday evidence only if it exists; otherwise use applicable native observations and state the limitation.
- **5D:** applicable daily/native observations with readable day labels.
- **1M:** applicable daily/native observations with legible date spacing.
- **YTD:** full applicable observations with sensible month landmarks.
- **1Y:** full applicable observations with roughly monthly landmarks where appropriate.
- **3Y:** full applicable observations with reduced landmark density appropriate to the available width.
- **5Y:** full applicable observations with year/quarter-scale landmarks appropriate to width; never fake a four-label time axis.

Tick density must be width-aware and horizon-aware. Underlying evidence may not be thinned merely to make rendering easier. Any rendering downsampling must preserve chart geometry and may not alter the canonical data used by crosshair, Statistics, AI or export.

Single-series V3 uses native Y units. V4 uses Indexed 100. V5 native dual-axis uses two explicitly labeled native Y axes.

## 9. Lines, crosshair, legends and interaction

- No arbitrary curve smoothing that changes the shape of evidence.
- Missing observations and true discontinuities must be represented honestly.
- Crosshair provides the nearest applicable observation date/time and exact values for visible series.
- Mixed-frequency series must not imply observations that were never published.
- Legend chips are first-class controls, not decorative labels.
- All essential interactions must work by tap on Android phone/tablet; hover is enhancement only.
- Responsive layouts may reflow controls and POV, but must not change analytical meaning or distort chart geometry.

## 10. Data fidelity and mixed frequency

For any displayed analysis, the following must reconcile:

**plotted observation ↔ crosshair value ↔ Data view ↔ Statistics input ↔ export**

No undisclosed transformation is permitted.

Mixed-frequency alignment must be explicit. Monthly CPI and daily VIX are not presented as if they share identical observation cadence. Correlation and other statistics must state the alignment/transformation used and the resulting observation count.

## 11. Statistics and correlation

Statistics are tied to the exact analytical state, not merely to series names.

Correlation is a first-class evidence artifact with at least:
- series pair
- coefficient
- analytical period/range
- observation frequency/alignment
- observation count
- transformation
- method
- correlation/scatter visualization where appropriate

Correlation is association, not causation.

Repeated correlation questions under different horizons become comparable structured evidence within the same investigation rather than disposable chat answers.

## 12. AI POV — interrogable argument

POV is an argument grounded in the exact evidence state, not a verdict.

AI receives the exact active series, horizon/range, transformations, aligned evidence and relevant deterministic statistics. Changing those inputs makes a prior POV stale until explicitly regenerated/re-evaluated.

The user may challenge a POV with evidence or a counter-hypothesis. The system evaluates the challenge rather than merely agreeing or regenerating prose. Useful result states include Supported, Partially supported, Not supported and Incomparable.

## 13. LIBRARY — living research

Library is persistent living research, not favorites or a static archive.

Entering Library shows:
- Omnisearch
- recent/saved Analysis cards
- New Analysis as an action rather than the default screen

Saving does not freeze or end an Analysis. Reopening restores the same analytical environment, evidence state and interrogation thread so research can continue.

A saved Analysis preserves enough state to reproduce and resume:
- title/topic/hypothesis
- selected series
- chart state and horizon/range
- comparison/axis configuration
- evidence/provenance references
- statistics and structured correlation artifacts
- AI POV and interrogation history
- user notes/findings
- created/updated history and recoverable analytical states

Omnisearch searches the research corpus semantically, including series, horizons, title, hypotheses/questions, POVs, challenges, notes, tags and structured artifacts such as correlations. A search for `CPI VIX correlation` should locate the actual saved correlation investigation/point, not merely documents containing those words.

## 14. Share, download and print

Editable collaboration is not a V1 requirement.

**Share = publish a polished read-only point-in-time snapshot.**

**Download = take the analysis/evidence with you.** At minimum the product must support a polished report plus exact evidence export (CSV/JSON or equivalent finalized format).

**Print = a deliberately formatted human-readable report, not a browser printout of application chrome.**

A shared/downloaded/printed snapshot does not replace or freeze the living Library object.

## 15. HEALTH — evidence trust

Health exposes the objective state of the canonical evidence system:
- source/provider
- freshness
- collection state
- historical coverage
- observation counts
- provenance/revisions
- horizon readiness
- missing periods
- failures/errors
- pipeline status and appropriate operational controls

The existing Evidence Database Viewer/cockpit belongs in this trust/operations domain rather than defining the primary research UX.

## 16. CONFIG

Config is visually separated at the bottom of the navigation.

It contains application configuration such as:
- OpenRouter/Venice or other approved AI-provider credentials
- provider/model selection
- applicable app-level settings

Operational evidence health does not move into Config.

## 17. Canonical backend contract

- Data Catalog is the authoritative definition of canonical source series.
- Operational Manifest is runtime state/daily to-do, not series definition.
- Smart Evidence Store holds canonical observations and deterministic horizon records.
- UI is a dumb consumer of canonical evidence; it does not fetch Yahoo/FRED and reconstruct the database in the browser.
- Canonical horizons are 1D, 5D, 1M, YTD, 1Y, 3Y and 5Y.
- Minimum historical bootstrap is 6 years; preferred is approximately 10 years.
- One-time full bootstrap is followed by incremental maintenance.
- Low-frequency series are not fabricated into daily observations.
- All derived analytical products remain traceable to canonical observations.

## 18. Derived-index definition gate

The repository currently contains canonical **source-series evidence**, but the present product conversation has **not canonically enumerated the Risk/Growth/Macro component memberships, sign orientation and aggregation formula**. Historical builds contain incompatible weighted schemes and are not authoritative.

Therefore:
- Do not resurrect an old weighted score.
- Do not invent a Market score.
- Do not silently infer index membership from old dashboard groupings.
- V1/V2 acceptance is complete only when the derived-index definition is explicit, transparent, persisted and reproducible.
- The five-view chart artifact must visibly fail closed for V1/V2 if that definition is absent, while V3/V4/V5 may operate directly on real canonical source-series evidence.

This is an integrity requirement, not permission to postpone the common chart engine.

## 19. Five-view real-data chart acceptance artifact

Before the surrounding application is built, a standalone HTML artifact must exercise the common chart engine against real canonical Market Navigator evidence.

Acceptance sequence:

**V1 Market → V2 Index → V3 Component → V4 Multi-series → V5 Explore**

Required stress cases:
- all seven horizons
- one real source series in V3
- 2, 5 and **7 simultaneous real series** in V4
- add/remove/show/hide series without changing visual grammar
- horizon changes with correct rebase behavior
- native dual-axis V5 using two unlike-unit real series (for example CPI and WTI)
- normalized V5 multi-series
- crosshair exact values
- mixed-frequency evidence
- phone/tablet responsive behavior
- loading, partial, stale, missing, source-failure, insufficient-observation and healthy states

The artifact is an approval gate. The owner must be able to say: **“Yes. That's our chart.”**

## 20. Build gates

### Gate 1 — Plan
This canonical plan captures the product and chart contract.

### Gate 2 — Chart
The standalone five-view artifact uses the common engine and real canonical evidence. Plan and chart are reviewed/blessed together; there is no artificial approval stop between drafting the plan and producing the chart artifact.

### Gate 3 — Application
Only after Gate 1 + Gate 2 approval is the surrounding application assembled as:

**NOW · EXPLORE · LIBRARY · HEALTH**

with **CONFIG** separated at the bottom.

Gate 3 implements the approved product around the approved chart. Development does not reinterpret either contract while coding.

## 21. Rejected / non-canonical approaches

The following are explicitly rejected unless later changed by product decision:
- deep component drill-down inside Now
- separate simple-chart and Analysis-chart engines
- a synthetic fourth Market score/index
- arbitrary historical weighted scoring becoming canonical by inheritance
- browser-side Yahoo/FRED acquisition/calculation as product architecture
- raw heterogeneous multi-series on one Y-axis
- fixed four-label X-axis shortcuts
- allowing chart implementation decisions to be deferred to development
- treating Library as a static archive
- conflating Health with Config
- editable collaboration before read-only sharing/reporting is excellent

## 22. Next gate

The next review package is **this corrected plan plus the working five-view real-data chart artifact**. The application shell remains gated until both are approved.