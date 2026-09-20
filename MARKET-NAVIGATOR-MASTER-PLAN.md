# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT / BUILD / QUALIFICATION PLAN
Updated: 2026-09-16
Planning state: **PLAN ONLY — NO APPLICATION CODE AUTHORIZED BY THIS UPDATE**
Target artifact: **`market-navigator-turn25-ship.html`**

This file is the single positive specification for Market Navigator. `MARKET-NAVIGATOR-GRAVEYARD.md` remains the binding negative specification. `MARKET-NAVIGATOR-BUILD-PROTOCOL.md` governs stage advancement. Do not create a parallel plan.

---

## 1. Owner-authoritative baseline

The owner has explicitly established the authoritative application baseline:

- restore **`market-navigator-turn25-pre-ship.html`** from commit **`ddf275a`**;
- this owner instruction supersedes prior inferred, qualified, published, or guessed baseline declarations;
- no later application implementation is an implementation donor unless this plan explicitly names a narrowly accepted mechanism;
- in particular, do not patch forward from the later failed `ⓘ` implementation.

Before any future implementation stage begins, resolve `ddf275a` to its full commit SHA and record the exact blob SHA and byte size of `market-navigator-turn25-pre-ship.html`. That restored file is the immutable construction ancestor for `market-navigator-turn25-ship.html`.

**Protocol:**

`OWNER-ACCEPTED ddf275a baseline → defined Turn 25 Ship delta → candidate → full qualification → owner disposition`

A candidate does not become a new baseline because it was committed, merged, deployed, CI-green, mechanically qualified, or called “qualified.” It advances only under the acceptance rule in the Build Protocol.

This update authorizes planning/governance only. **Do not modify application code as part of this plan update.**

---

## 2. Product definition retained from baseline

Market Navigator remains an evidence-backed market research application with primary modes:

**NOW · LIBRARY · HEALTH**

with **CONFIG** fixed at the bottom of the rail.

The backend owns objective, deterministic, reproducible evidence. AI interprets governed evidence; it does not invent source facts, model arithmetic, component weights, transformations, contribution values, horizon endpoints, model-health measurements, or provenance.

The Turn 25 Ship delta is cumulative but narrow. Preserve baseline behavior unless this plan explicitly changes it.

---

## 3. Turn 25 Ship scope

`market-navigator-turn25-ship.html` adds exactly three coordinated product objectives to the restored `ddf275a` baseline:

1. **Correct Print for ENV, index, and component chart contexts.**
2. **Add model-stability/model-health surfaces under HEALTH.**
3. **Add the upper-right `ⓘ` Index Explanation surface and make its exact deterministic evidence mandatory AI POV context whenever governed index/indices are within analysis scope.**

These objectives share governed calculation/evidence infrastructure where appropriate, but they must not create a second analytical state, second chart engine, or AI-derived factual path.

---

# OBJECTIVE A — Correct Print for ENV / Index / Component contexts

## 4. Print product contract

The NOW context-menu **Print** action must generate a dedicated, self-contained **Market Navigator Chart Report** from the exact frozen NOW analytical state.

Print must work correctly for all three chart contexts:

### 4.1 ENV
Print the exact ENV chart and currently displayed series/indices, selected horizon, representation, date range, legend, evidence/revision context, and applicable Index Explanation sections.

### 4.2 Index
When the user is in an index context such as RSK, GRW, or MAC, print the exact index chart state, its visible comparisons/components, horizon, representation, date range, legend, evidence/revision context, and the governed Index Explanation for every governed index within scope.

### 4.3 Component
When the current analytical context is a component/raw-source view, print that exact chart and state/evidence context. Do not fabricate an index explanation for a raw series. If a governed index is also within the frozen analytical scope, include the explanation only for that governed index.

“Page” here means the applicable NOW analytical chart context/state; this requirement does not authorize a new parallel navigation architecture.

## 5. Report contents

Every Chart Report must contain, where applicable:

- `Market Navigator Chart Report` title;
- generated date/time;
- exact breadcrumb/context;
- selected horizon and actual visible date range;
- representation/axis mode;
- visible-series legend;
- the exact frozen current chart at useful print dimensions and aspect ratio;
- evidence revision, catalog/model version, source/provenance information already belonging to the frozen state;
- deterministic Index Explanation Markdown for each governed index within scope;
- truthful degraded/unavailable notices where governed evidence is insufficient.

Exclude rail navigation, menus, Add, Config, crosshair/tooltips, modal chrome, Library controls, and other interactive UI.

## 6. Print architecture

Future implementation must:

`freeze exact NOW state → construct dedicated report DOM → clone/render exact frozen chart → render report metadata + governed explanation → make report print-visible → invoke native print once → cleanup`

Do not print the interactive viewport. Do not refetch data. Do not change horizon, composition, active series, representation, evidence revision, breadcrumb, or chart state. Do not impose paper size, printer, orientation, page count, or destination.

Library Print remains a separate product operation: it prints the exact selected frozen Library analysis, chart, saved context, and complete transcript as normal document content. Turn 25 Ship must not regress it.

---

# OBJECTIVE B — HEALTH: Derived Models / Model Stability

## 7. Separate Data Health from Model Health

HEALTH must distinguish two questions:

- **Sources / Data Health:** “Can I trust the observations entering the model?”
- **Derived Models / Model Health:** “Given the available inputs, how stable, reproducible, concentrated, and sensitive is this governed composite?”

Do not collapse these into one green/red status. A source can be healthy while derived-model attribution/stability is degraded, and a WATCH/DEGRADED model need not automatically disappear from the chart.

The model-risk framework is deterministic and governance-based: the purpose is to show what the composite depends on and how fragile/stable its signal is, not to claim that a composite is objectively “correct.”

## 8. Model Manifest / Registry

RSK, GRW, MAC, and future governed composites require machine-readable manifests recording at minimum:

- model ID;
- immutable model version/hash;
- declared purpose: `DESCRIPTIVE | NOWCAST | FORECAST`;
- components;
- governed weight/contribution rule;
- direction;
- transformation/normalization/inversion rules;
- expected component frequency/cadence;
- missing/stale-data rule;
- methodology effective-date history;
- validation timestamp;
- model, catalog, and data/evidence revisions used.

We own these derived indices. Their construction must be governed and inspectable rather than treated as opaque/proprietary.

## 9. HEALTH surface

HEALTH navigation becomes conceptually:

**Sources | Derived Models**

Selecting RSK/GRW/MAC exposes a model-health surface with expandable sections:

**Components · Contribution · Sensitivity · Robustness · History**

The summary must expose at minimum:

- lifecycle status;
- model version;
- data-health status;
- formula replication PASS/FAIL;
- required/available component count;
- weight-total validation;
- missing/stale/unknown component conditions;
- largest component/contribution concentration;
- standardized sensitivity;
- maximum leave-one-out impact;
- direction stability;
- specification robustness;
- revision/parameter/regime stability where calculable;
- attribution coverage by horizon;
- reconciliation status/residual;
- last validation timestamp;
- derived/evidence revision.

The framework basis and proposed deterministic measures are captured in the owner-provided model-risk planning material: model health is distinct from data health, and the intended surface measures integrity, concentration, sensitivity, and stability rather than reducing everything to source availability.

## 10. Deterministic model-stability calculations

### 10.1 Formula replication
Independently reproduce the governed composite from its manifest/evidence and require exact or governed-tolerance agreement.

### 10.2 Component contribution
Compute contribution from the actual governed transformed component arithmetic. Do not equate nominal weight with contribution to current movement.

For every healthy decomposition:

`Composite movement = Σ governed component contributions ± explicit rounding residual`

### 10.3 Standardized sensitivity
Do not use a naïve ±10% raw shock across heterogeneous series. Use component-scaled shocks such as:

- ±1 historical standard deviation; and
- where meaningful, historical 95th-percentile movement.

Recompute the composite and report the resulting comparable influence/sensitivity measure.

### 10.4 Leave-one-component-out
Recalculate the composite with each component omitted under the governed renormalization rule. Report maximum leave-one-out impact and whether the index signal direction survives each exclusion.

### 10.5 Concentration
Measure weight and contribution concentration, including largest component/contribution, top-N concentration, effective component count where defined, and correlation concentration where supported.

### 10.6 Specification robustness
Test the canonical index against governed nearby specifications without replacing the canonical index: equal weights, relative weight perturbation, alternate governed normalization/smoothing windows, component omission, and stale-data handling alternatives where those alternatives are meaningful and explicitly defined.

Report uncertainty/robustness; do not apply an arbitrary model-risk haircut to the canonical signal.

### 10.7 Validation by purpose
Backtesting must match the manifest purpose. A descriptive index is not failed for lacking forecasting accuracy. Forecast-specific metrics are required only for models declared FORECAST.

### 10.8 Cross-model coherence
Where history supports it, calculate RSK/GRW/MAC rolling relationships, current divergence percentile, frequency of similar configurations, and subsequent convergence/divergence as deterministic evidence. AI may discuss those measurements but may not invent them.

## 11. Model lifecycle

Derived-model status follows governed rules:

**DEFINED → VALIDATED → ACTIVE → WATCH → DEGRADED → SUSPENDED**

- ACTIVE: mandatory inputs healthy enough for the model, replication passes, governed thresholds satisfied.
- WATCH: model computes correctly but sensitivity/concentration/stability/validation crosses a warning threshold.
- DEGRADED: model remains calculable but an important data/model-health condition is materially compromised.
- SUSPENDED: formula cannot be reproduced, mandatory evidence is unavailable beyond tolerance, manifest mismatch exists, or another hard validation condition fails.

AI does not assign lifecycle status.

## 12. Persistence into Library / AI evidence

Every frozen analysis involving a governed index must save the model version and model-health snapshot that existed when the analysis was generated, alongside its frozen evidence/revision information. Later data/model refreshes must not rewrite that historical snapshot.

---

# OBJECTIVE C — `ⓘ` Index Explanation / Explainability Audit Surface

## 13. Purpose and scope

Place one circled information control (`ⓘ`) in the upper-right of the NOW chart plotting area.

It opens **Index Explanation** for the currently selected horizon.

This surface does **not** read chart pixels, estimate values, or generate approximate commentary. It exposes the actual governed composite arithmetic and actual component behavior for the selected horizon.

Applicable scope:

- ENV: every governed index currently displayed/in scope;
- index context: the governed anchor index plus any other governed index currently within scope;
- component/raw context: no fabricated composite explanation; include an index only when that governed index is genuinely within the frozen analytical scope.

## 14. Interaction contract

The chart contains exactly one visible `ⓘ` control in the upper-right plot region, separate from the `…` context menu.

Requirements:

- minimum 40×40 CSS-pixel touch target;
- `aria-label="Explain index movement"`;
- one tap/click/keyboard activation opens the populated explanation surface in the same event path;
- no focus-only success condition;
- no second persistent concentric circle/ring;
- chart/canvas gesture handling may not swallow activation;
- opening/closing does not refetch or analytically rerender NOW;
- closing returns to the exact same analytical state.

Top strip:

**selected horizon | Copy | Download MD | ×**

Body, repeated for every applicable governed composite:

**Index movement → Component contribution table → Plain-language explanation → Calculation status/provenance**

## 15. Governed explanation record

The calculation layer produces one canonical explanation record per applicable index containing at minimum:

- index ID/name;
- model/definition version;
- evidence revision;
- selected horizon;
- actual baseline/end observation dates;
- baseline/end index values and movement;
- each component ID/name;
- governed weight/contribution rule and direction;
- transformation used;
- actual baseline/end component observation dates and values;
- component movement;
- exact governed contribution to index movement;
- component/source revision/status;
- summed contribution;
- index movement;
- reconciliation residual/tolerance;
- overall attribution status.

The modal, Markdown, Copy, Download MD, Print, AI POV, and Library persistence consume this same calculation result. They may not independently recalculate attribution.

## 16. Arithmetic truth

Every number displayed comes from the governed model calculation, never from AI reading the graph.

Do **not** assume `weight × raw percent movement` is necessarily the contribution formula. The implementation must use the actual production transformations, normalization, scaling, direction, alignment, and contribution rules.

For a healthy explanation:

`Σ component contributions = governed index movement ± explicit governed rounding residual`

If exact attribution cannot be reproduced from available governed evidence, show **Attribution unavailable** or **Attribution degraded**, identify the missing prerequisite, and state that no missing contribution has been estimated.

No illustrative/example values may be reachable as production fallback data.

## 17. Markdown contract

The deterministic Markdown format is conceptually:

```markdown
## RSK — 1 Year

**Index movement: [governed value]**

RSK moved from **[actual baseline] → [actual end]** over the selected horizon.

| Component | Weight/rule | Component movement | RSK impact |
|---|---:|---:|---:|
| [actual component] | [governed] | [actual baseline → end / movement] | [calculated contribution] |
| **RSK** | | | **[reconciled total]** |

**In simple terms:** [plain-language statement constrained to the supplied governed arithmetic]

Calculation status: [reconciled/degraded/unavailable] · evidence revision … · model definition …
```

The user's example values are specification illustrations only and are not production truth.

The final plain-language sentence may be generated deterministically. If AI is used for wording, it receives only the completed governed facts and may translate them into simple language. It cannot invent components, weights, values, transformations, causes, dates, or contribution numbers.

## 18. Mandatory AI POV inclusion

Whenever an AI POV analysis includes one or more governed indices within its frozen scope, the Index Explanation is **mandatory evidence**, whether or not the user manually opened `ⓘ` first.

AI POV flow:

`freeze exact NOW analytical scope → identify governed index/indices in scope → compute/freeze canonical explanation record(s) → generate exact Markdown → attach record + Markdown to evidence/context → persist processing analysis → execute provider → persist frozen Library analysis`

The AI prompt explicitly labels these records as governed deterministic evidence. AI may interpret the contribution pattern but may not replace, recompute, contradict, or fill missing arithmetic.

If multiple governed indices are in scope, include an explanation section for each one.

The exact explanation Markdown/evidence used by AI POV is persisted with the frozen Library analysis. Opening that analysis later does not recompute it against newer evidence.

This directly removes the prior analytical limitation in which component attribution could only be speculative without underlying component construction/breakdown.

---

# 19. Stage plan — no coding authorized yet

When implementation is separately authorized, execute these stages in order. Each stage starts from the accepted baseline/candidate defined by the Build Protocol; a failed candidate is discarded rather than patched forward.

### Stage 0 — Baseline restoration and provenance
1. Resolve `ddf275a` to full SHA.
2. Restore exact `market-navigator-turn25-pre-ship.html` from it.
3. Record application blob SHA and byte size.
4. Run baseline syntax/boot/semantic qualification without mutation.
5. Record the baseline as owner-authoritative for this ship sequence.

### Stage 1 — Governed model arithmetic / manifests
1. Inspect actual RSK/GRW/MAC production construction.
2. Define manifests from actual governed behavior; do not invent formulas.
3. Expose deterministic intermediate values needed for contribution/reconciliation.
4. Prove formula replication and contribution reconciliation before UI work.

### Stage 2 — Model Health computation
Implement deterministic integrity, contribution, standardized sensitivity, leave-one-out, concentration, robustness, lifecycle, and persistence calculations with governed thresholds/rules.

### Stage 3 — HEALTH surface
Add `Sources | Derived Models` and the RSK/GRW/MAC model-stability surfaces. Preserve existing source-health semantics.

### Stage 4 — Index Explanation
Build the canonical explanation record/Markdown first, then the `ⓘ` interaction/modal. Prove one tap opens content and does not mutate analytical state.

### Stage 5 — AI POV / Library freeze
Make explanation mandatory for governed indices in AI scope; persist exact explanation + model-health snapshot with the frozen analysis.

### Stage 6 — ENV / Index / Component Print
Build the dedicated Chart Report for each chart context from exact frozen NOW state. Reuse safe report primitives where appropriate; do not print the viewport or route NOW Print through Library.

### Stage 7 — Cumulative qualification and publication
Run all new and retained baseline semantic gates on the exact candidate, integrate current repository/data movement without changing the application ancestry, rerun the complete suite on the exact merged artifact, then perform live Pages smoke testing. Publication does not equal acceptance.

---

# 20. Release-blocking qualification matrix

A Turn 25 Ship candidate cannot be presented as complete unless all applicable gates pass:

**Baseline/provenance:** exact `ddf275a` full SHA, baseline blob SHA/size, clean baseline boot, no later rejected implementation ancestry.

**Boot/runtime:** HTML/JS syntax clean, boot complete, no application-owned console errors, unhandled rejections, missing required resources, or null-DOM paths.

**Retained baseline behavior:** strongest existing baseline semantic tests remain unchanged or strengthened; no unrelated UI/data/navigation regression.

**Model manifests:** IDs/versions/components/weights/directions/transforms/cadence/missing-data rules/history/purpose/revisions validated against actual governed construction.

**Formula replication:** independently calculated composites reconcile to production values within explicit tolerance.

**Model Health:** source health remains separate; integrity/concentration/sensitivity/stability/robustness calculations use governed evidence; lifecycle is rule-derived; missing/stale/reconciliation failures produce truthful status.

**Index Explanation interaction:** exactly one `ⓘ`; real touch/click opens populated modal; no second-ring-only failure; repeated open/close works; state/fetch/render counters unchanged.

**Explanation arithmetic:** actual horizon endpoints/component dates/values/transforms/contributions; no pixel inference; no illustrative fallback; reconciliation proven; degraded evidence never estimated.

**Markdown/Copy/Download:** same canonical Markdown source; rendered safely; complete content; usable narrow-screen table behavior.

**AI POV:** every governed index within frozen scope automatically contributes its canonical explanation record + exact Markdown; provider is not asked to invent arithmetic; explanation identity matches frozen Library persistence.

**Library persistence:** explanation + model version + model-health snapshot survive durable reread and do not mutate after later evidence refresh.

**ENV Print:** exact frozen ENV chart/state/context/legend/evidence + all applicable governed explanations; no interactive chrome; no state mutation/refetch.

**Index Print:** exact frozen index chart/state/context and applicable governed explanation(s); no state mutation/refetch.

**Component Print:** exact frozen raw/component chart/state/context; no fabricated composite explanation; include governed explanation only when truly in scope.

**Library Print regression:** exact frozen chart and complete saved transcript print as document content; no viewport clipping or interactive chrome; selected analysis unchanged after print.

**Responsive/device:** phone/tablet/desktop; `ⓘ` tappable; modal controls accessible; HEALTH model surfaces usable; print report chart nonzero/readable; no new page-level overflow.

**Race/state integrity:** geometry-only repaint remains geometry-only; stale async work cannot overwrite newer analytical state; explanation/print/health reads do not silently change NOW state.

**Exact merged artifact:** rerun the entire matrix after final integration, not merely on a pre-merge candidate.

**Live smoke:** deployed exact artifact loads; `ⓘ` opens; AI POV includes explanation for in-scope indices; HEALTH Derived Models opens; ENV/index/component Print contains the correct chart/report; Library Print remains functional.

---

# 21. Permanent prohibitions for this ship

Do not:

- deviate from the `ddf275a` owner-authoritative application baseline;
- substitute a later “qualified” or published commit;
- patch forward from the rejected `ⓘ` implementation;
- treat commit/merge/CI/deploy as owner acceptance;
- create wrappers, iframes, runtime monkey patches, overlays, duplicate state engines, or alternate chart/data paths to preserve a failed candidate;
- read arithmetic from chart pixels;
- let AI invent or calculate missing factual model arithmetic;
- assume weight equals contribution;
- hide reconciliation residuals;
- estimate missing contributions;
- forward-fill/restamp observations merely to complete explanation;
- collapse source/data health and model health into one status;
- use arbitrary model-risk haircuts to modify canonical signals;
- evaluate a descriptive model as though it were a forecast model;
- print the interactive viewport;
- refetch/reconstruct newer evidence for Print or frozen Library content;
- fabricate index explanations for raw component-only scope;
- weaken semantic tests to cosmetic assertions.

`MARKET-NAVIGATOR-GRAVEYARD.md` remains binding for all additional negative requirements not superseded by the explicit owner-authoritative baseline declaration above.

---

# 22. Publication / acceptance contract

When implementation is later authorized and fully qualified, return:

1. exact candidate commit/merge SHA;
2. exact cache-busted Pages test URL;
3. full owner-authoritative baseline commit SHA resolved from `ddf275a`;
4. exact baseline application blob SHA;
5. concise gate results for retained behavior, model arithmetic/health, `ⓘ` explainability, AI/Library freeze, ENV/index/component Print, Library Print regression, responsive/device, race/state integrity, and live smoke.

The candidate remains a candidate until owner disposition. If rejected, record the failure and return to the accepted baseline/stage under `MARKET-NAVIGATOR-BUILD-PROTOCOL.md`; do not patch the rejected candidate forward.
## Turn 25 post-ship crosshair regression correction — owner authorized 2026-09-18

The completed Turn 25 Ship remains the implementation baseline for this bounded correction. This authorization does not permit patch-forward from the rejected `c3cde56268303d8e2a222012d5a34aee9f26651e` donor.

Retained chart-inspection contract: pointer movement immediately inspects the active series; inspection resolves against the full real observation set rather than display-density representatives; the vertical guide, point marker and readout remain pinned when the pointer leaves the plot; the pinned readout has an operable explicit × close control; dismissal removes the inspection and restores the ordinary chart; raw/source Indexed 100 remains plain relative rebasing; inspection must not introduce a second arithmetic/data path. These inherited semantics must be qualified with real browser interaction and retained in future cumulative release gates.

## MAC signed-series self-healing and Health Glossary — owner authorized 2026-09-20

MAC retains all seven governed components when truthful evidence exists. Treasury curve spreads that structurally cross zero must not use ratio rebasing. Their governed transform is `signed_level_sd`: baseline 100 plus direction × (current level − horizon baseline level) / sample standard deviation of finite canonical historical levels. The scale is computed from and persisted with the same canonical evidence snapshot; one historical level SD equals one index point. This is a versioned model-definition change, not an ad-hoc UI repair.

Fallback remains deterministic: if a component's governed transform cannot be computed from canonical evidence, omit it without estimation, renormalize the remaining eligible equal weights, reconcile contributions, and expose WATCH/DEGRADED/SUSPENDED lifecycle according to governed thresholds. The system may self-heal through predefined transforms/fallbacks but may never invent weights or transformations at runtime.

HEALTH navigation is `Sources | Derived Models | Glossary`. Glossary defines every Model Health metric and every RSK/GRW/MAC component in plain language, including role/relevance, direction, cadence, governed transform, current implication of exclusion, and acquisition method. FRED sources disclose `public CSV · authentication none`; no FRED API-key UI is required while this acquisition path remains in use. Components-available status is directly actionable and explains current omissions, renormalization and lifecycle.
