# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT / BUILD / QUALIFICATION PLAN
Updated: 2026-09-21
Planning state: **TURN 26 IMPLEMENTATION AUTHORIZED — 2026-09-21**
Target artifact: **`market-navigator-turn26-ship.html`**

Next cumulative application artifact: **`market-navigator-turn26-ship.html`**

This file is the single positive specification for Market Navigator. `MARKET-NAVIGATOR-GRAVEYARD.md` remains the binding negative specification. `MARKET-NAVIGATOR-BUILD-PROTOCOL.md` governs stage advancement. Do not create a parallel plan.

---

## 0A. Turn 26 cumulative construction baseline — owner execution authorization 2026-09-21

Turn 26 must preserve the complete accepted cumulative Turn 25 runtime, not reconstruct from the earlier Turn 25 pre-ship ancestor alone.

Authoritative Turn 26 construction baseline:

- commit: `7241de67db1558b9223fb608fa26443dcb98a3b2`;
- artifact: `market-navigator-turn25-ship.html`;
- blob SHA: `8ebd766774d6e70011cdac0e40c2759eba8f5fc5`;
- this artifact includes the accepted Turn 25 Ship runtime plus retained crosshair correction, Health Glossary/MAC signed-series self-healing, and first-class MAC Yield Curve factor work.

The historical `ddf275a` / `market-navigator-turn25-pre-ship.html` construction ancestor remains provenance for Turn 25 itself, but it is **not** the direct Turn 26 application baseline because using it alone would regress accepted cumulative Turn 25 capabilities.

Turn 26 protocol:

`ACCEPTED cumulative Turn 25 Ship → defined Turn 26 live-Library delta → candidate → full retained + Turn 26 qualification → owner disposition`

Do not drop any accepted Turn 25 runtime surface while adding Turn 26.

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

## MAC Yield Curve first-class factor — owner authorized 2026-09-20

The Treasury yield curve is a first-class MAC factor, not two visually anonymous rows. The governed factor consists of 10Y−2Y and 10Y−3M. Under the current seven-component equal-weight MAC arithmetic the pair already carries 2/7 = 28.5714% of canonical MAC weight when both are eligible; this weight is now explicitly named and surfaced rather than silently increasing it without evidence.

Health and Index Explanation must expose: factor name; canonical aggregate weight; each spread current level; state (INVERTED when either governed spread is below zero, POSITIVE when both are above zero, FLAT when a spread is exactly zero); inversion depth; latest inversion episode dates/duration from real observations; factor contribution to the selected-horizon MAC movement; and transform/provenance. The current state must never be called inverted merely because an earlier observation was inverted.

This change does not alter the canonical MAC arithmetic. Any future increase/decrease from the existing 28.5714% aggregate curve weight requires an explicit versioned model-weight study and owner disposition. Visibility and state diagnostics may not be used as an implicit adaptive weight.

---

# POST-SHIP CAPABILITY — Live Library Investigation, Context Evidence, and Indicator Timing
Owner authorized: 2026-09-21
Planning state: **PLAN / GOVERNANCE UPDATE ONLY — NO APPLICATION CODE AUTHORIZED BY THIS UPDATE**

This capability extends the accepted frozen-Library model without weakening reproducibility. The governing product principle is:

**Library analyses are immutable evidence; live AI queries are governed investigative extensions of that evidence.**

A Library analysis remains one durable analytical subject/card. Its original frozen state never changes. Live investigation may append additional explicitly saved frozen checkpoints inside that same analysis/thread; it must not create a second Library card unless the user deliberately creates a genuinely separate analysis.

## 23. One-card analytical lineage

A Library analysis card owns an ordered lineage of immutable states:

- original analysis state;
- zero or more explicitly saved live-query checkpoints;
- each checkpoint has its own timestamp, data/evidence revision, model/catalog versions, chart state, AI response/transcript segment, query specification, and contextual evidence;
- the original state remains addressable and reproducible after later checkpoints are added.

Required semantics:

- **Save in Analysis** appends the current live result as a new frozen checkpoint inside the existing analysis card/thread.
- **Discard** removes the temporary live analytical state and does not alter the original analysis or prior saved checkpoints.
- Saving a refresh/extension must **not** spawn a second Library analysis card.
- **Create New Analysis** is a distinct explicit action reserved for a genuinely separate analytical subject; it is not the default save behavior for live refreshes.
- Later checkpoints may reference their parent checkpoint, but lineage never rewrites or collapses prior states.
- A saved checkpoint may be reopened, printed, copied, exported, discussed, or compared with any other checkpoint in the same analysis without recomputing its frozen evidence.

Conceptual example:

```text
Growth Index — MTD        ← one Library card
  ├─ Original — Sep 1
  ├─ Refreshed through Sep 21
  ├─ Extended to 1YR — Sep 21
  └─ Refreshed — Oct 5
```

## 24. Governed live-query service

AI must not receive direct SQL/database access. Implement a narrow read-only Market Navigator query service over the governed catalog/evidence layer.

Conceptual architecture:

```text
Frozen Library state
      ↓
AI request / seeded question
      ↓
Market Navigator Query Service
      ├─ validates canonical series/model IDs
      ├─ resolves governed definitions/transforms
      ├─ queries canonical evidence
      ├─ applies existing governed calculation rules
      ├─ reports freshness/revisions/availability
      └─ returns structured observations + provenance
      ↓
AI interpretation / comparison
      ↓
Temporary live result
      ├─ Save in Analysis
      └─ Discard
```

The service is read-only and must:

- accept only canonical governed series/model identifiers and approved query operations;
- reject arbitrary SQL and arbitrary table/column access;
- reuse the same canonical evidence, transformations, direction rules, model manifests, index arithmetic, Health semantics, and provenance used elsewhere in Market Navigator;
- preserve source identity and economic identity across horizons;
- enforce bounded query windows/observation counts;
- report unavailable, stale, missing, or degraded evidence truthfully rather than synthesizing completion;
- return deterministic query metadata sufficient to reproduce the request;
- never mutate Library, NOW, Health, Config, provider credentials, model definitions, or source evidence.

Minimum conceptual request contract:

```text
analysis_id
parent_state_id
series_ids[]
index_ids[]
start_date
end_date
horizon
representation
transform
revision_mode
as_of
```

Minimum conceptual response contract:

```text
query_id
query_timestamp
parent_state_id
series/model definitions + versions
observations
actual first/last observation dates
latest observation date
source/provenance
data/evidence revision
model/catalog revision
freshness
availability/degraded status
revision information
governed calculated values/contributions where applicable
```

The API/HTTPS transport is an implementation detail; the contract and governance semantics are mandatory.

## 25. Supported investigative operations

The live-query layer must support at minimum:

1. **Bring current** — retrieve observations available after the saved checkpoint through the current governed evidence cut.
2. **Extend horizon** — keep the same analytical composition while expanding or changing the requested date range, e.g. MTD → 3M → 1Y.
3. **Compare checkpoints** — identify what materially changed between the frozen original/saved state and a later live or saved state.
4. **Component drill-through** — retrieve governed underlying observations/contributions for the existing analytical subject without silently changing composition.
5. **Freshness / revision check** — identify which series are current, stale, newly released, revised, unavailable, or degraded.
6. **Trend persistence** — use the same composition over a longer governed window to test whether the current direction persists.
7. **Leading/coincident/lagging interpretation** — use glossary timing metadata as explanatory context without changing model arithmetic.

The AI may request these operations through the service. It may not create a second arithmetic path, infer missing observations, or silently substitute different series.

## 26. Revision semantics are explicit

Economic releases may be revised. “Refresh” therefore has two analytically different meanings and Market Navigator must keep them separate:

### 26.1 Extend from frozen cut
Preserve the frozen checkpoint exactly for its historical interval and append subsequently available governed observations. This answers: **“What happened after this analysis?”**

### 26.2 Current-vintage restatement
Rebuild the requested interval using the current governed evidence revision, explicitly identifying historical observations that differ from the frozen checkpoint. This answers: **“What does the same period look like using what we know now?”**

Requirements:

- never mix the two modes without labeling the distinction;
- identify the revision mode in the live result and every saved checkpoint;
- where current data differ from the frozen state, expose the changed observations/revisions rather than silently replacing history;
- AI may discuss the analytical effect of revisions but may not imply that revised values were known at the earlier checkpoint.

## 27. Live-result interaction and persistence

A live query produces a temporary analytical state in the current Library thread.

After the answer is rendered, provide:

**Save in Analysis | Discard**

Semantics:

- **Save in Analysis** freezes the exact live result into the existing Library card as a new checkpoint.
- **Discard** removes only the temporary live analytical state.
- Do not label the post-result action “Cancel”; the query has already completed.
- Ordinary follow-up questions do not automatically create checkpoints.
- Multiple exploratory live questions may occur before anything is saved.
- Saving freezes the exact chart/data cut, query specification, model/evidence revisions, AI answer/transcript, contextual evidence, and retrieval timestamps used for that result.
- Saving must be durable and survive reread/reload before qualification can pass.

## 28. Context-aware seeded questions (`?`)

Library/AI analysis surfaces include a `?` control that exposes seeded questions generated from the actual frozen/live analytical context.

Seed generation must be context-aware, not a fixed prompt list. Inputs include at minimum:

- current horizon/date range;
- original checkpoint date;
- latest available observation date;
- current series/index composition;
- whether a live refresh has occurred;
- model/Health state;
- data freshness/revision state;
- leading/coincident/lagging metadata;
- available component contribution evidence.

Examples of eligible contextual questions:

- What has changed since this analysis was created?
- Which components are driving the current move?
- Is the direction broad-based or concentrated?
- Extend this to 3 months. Does the trend persist?
- Extend this to 1 year. Is the current move unusual?
- Which indicators are leading the change and which are merely confirming it?
- Have any underlying observations been revised since this checkpoint?
- What contemporaneous releases or reporting help explain the period?

Requirements:

- changing the horizon/context must change the relevant seeds;
- a seed is an ordinary governed query/AI request, not a privileged alternate data path;
- seeds may not imply data capability that the service cannot truthfully satisfy.

## 29. Context & Further Reading evidence enrichment

AI POV and live analytical answers should include contextual external evidence so numerical interpretation is not isolated from relevant current events and releases.

This is an evidence-enrichment layer, not a causal-inference shortcut.

### 29.1 Presentation

Include a visually subordinate, collapsed-by-default section:

**Context & Further Reading ▸**
`N relevant sources`

Each item includes at minimum:

- publication/release date;
- source/publisher;
- headline/title;
- working URL;
- short explanation of why it is relevant to the observed analysis;
- retrieval timestamp;
- source category.

A newspaper-style action may be provided as **Refresh Context**. Its purpose is to rerun contextual evidence retrieval against the current live state. It does not replace the automatically available Context & Further Reading section.

### 29.2 Source classes

Maintain two distinct evidence classes even if presented under one UI heading:

**Data & Releases**
- FRED/Federal Reserve;
- BLS;
- BEA;
- EIA;
- U.S. Treasury;
- SEC/company filings;
- other authoritative primary sources appropriate to the governed series.

**Related Reporting**
- Reuters;
- AP;
- Bloomberg;
- Financial Times;
- WSJ;
- other established high-quality reporting sources where relevant.

Primary data/release sources are evidence, not “news,” and should be labeled accordingly.

### 29.3 Relevance and causality discipline

The system must distinguish:

- **Observed:** what the governed Market Navigator data actually did.
- **Contemporaneous context:** releases/events/reporting that occurred during or near the movement.
- **Possible relationship:** a clearly qualified interpretation where evidence supports discussing a relationship.

Never convert temporal coincidence into an unsupported causal claim.

For example, acceptable structure is:

```text
Observed: RSK increased over the selected period.
Contemporaneous context: [source] reported/released X during the same interval.
Interpretation: X is consistent with higher risk sensitivity, but the evidence does not establish that X caused the index move.
```

Requirements:

- do not invent headlines, dates, quotations, URLs, or source claims;
- links must be functional when persisted/rendered;
- prefer direct source material for releases and high-quality reporting for current events;
- context search must be bounded to the analysis subject and time window, with reasonable adjacent-time allowance;
- do not treat source popularity/ranking as analytical evidence;
- where no credible relevant context exists, say so rather than padding the section.

### 29.4 Frozen contextual evidence

When a live result is saved in the existing analysis:

- freeze the contextual source set used by that checkpoint;
- persist headline/title, publisher/source, date, URL, retrieval timestamp, category, and relevance note;
- later **Refresh Context** may discover newer/different sources but must not rewrite prior saved checkpoints;
- reopening an old checkpoint shows the exact contextual evidence that belonged to that saved state.

## 30. Glossary timing classification

Extend the governed HEALTH Glossary for every economic/market indicator and RSK/GRW/MAC component with explicit timing metadata.

Required fields:

- **Indicator timing:** `LEADING | COINCIDENT | LAGGING | MIXED/CONTEXT-DEPENDENT`
- **Why:** concise plain-language reason for the classification.
- **Leads/lags what:** the economic/market phenomenon the indicator tends to precede, coincide with, or confirm.
- **Typical relationship / timing:** qualitative timing description where defensible.
- **Caveat:** circumstances in which the classification may weaken, vary, or reverse.

Do not force every indicator into leading or lagging when coincident or mixed is more truthful.

The metadata is explanatory evidence only. It does not alter canonical index weights, transformations, arithmetic, Health lifecycle, or source status.

AI may use these governed glossary fields to explain patterns such as leading indicators weakening while lagging indicators remain strong, but it must not invent timing classifications or present variable lead times as deterministic forecasts.

## 31. Implementation sequence for this capability

When separately authorized for application implementation, execute in this order:

### Stage L1 — Current-state/library schema audit
Map the exact existing Library card/state/transcript persistence model, frozen evidence identity, chart serialization, Print behavior, and AI POV context path. Prove how one card can own multiple immutable checkpoints without breaking existing Library reread/Print/TTS/export behavior.

### Stage L2 — Query contract and read-only service
Define and implement the bounded canonical query contract over existing governed evidence/catalog/model arithmetic. Prove no arbitrary SQL or write path exists.

### Stage L3 — Revision semantics
Implement and qualify `extend from frozen cut` versus `current-vintage restatement`, including explicit revision reporting.

### Stage L4 — Temporary live analytical state
Add live query execution inside the current Library thread. Prove original and prior checkpoints remain byte/logically unchanged while live state is temporary.

### Stage L5 — In-card checkpoint save/discard
Implement **Save in Analysis | Discard**. Prove Save appends a durable checkpoint to the same analysis card and Discard leaves no durable mutation.

### Stage L6 — Context-aware `?` seeds
Generate prompts from actual analytical context/horizon/freshness/timing metadata and route them through the same governed query/AI path.

### Stage L7 — Context & Further Reading
Implement primary-release and reputable-reporting retrieval, relevance filtering, link persistence, causality-safe AI presentation, collapsed section, and explicit **Refresh Context** action.

### Stage L8 — Glossary timing metadata
Populate and validate leading/coincident/lagging/mixed classification fields and integrate them into Health Glossary and AI context.

### Stage L9 — Cumulative qualification
Run retained Market Navigator gates plus the new live-query, lineage, revision, context, seeded-question, glossary, persistence, responsive, Print, TTS, export, race/state, and live deployment gates on the exact merged artifact.

## 32. Release-blocking qualification additions

A candidate implementing this capability must additionally pass:

**Single-card lineage:** saving a refreshed/extended result produces no second Library card; exactly one new immutable checkpoint appears under the existing card.

**Original immutability:** original chart/evidence/transcript/context hashes or equivalent frozen identities remain unchanged after any number of live queries and saved checkpoints.

**Temporary-state truth:** an unsaved live result disappears on Discard/reload as designed and cannot masquerade as a frozen Library checkpoint.

**Durable save:** Save in Analysis survives durable reread/reload with exact query specification, chart/data state, transcript, revisions, and contextual evidence.

**Read-only query boundary:** live AI queries cannot execute arbitrary SQL, write source/model/Library state, mutate provider credentials, or bypass canonical series/model resolution.

**Canonical arithmetic:** indices/components returned through live query reconcile to the same governed arithmetic/evidence path used by NOW/Health/Index Explanation.

**Revision modes:** extend-from-frozen and current-vintage-restatement produce correctly labeled, reproducible, different behavior where revisions exist.

**Horizon extension:** MTD → 3M/1Y retains intended analytical composition and does not silently substitute series or economic identity.

**Freshness/degradation:** stale/unavailable/degraded series are reported truthfully and never filled merely to complete a live answer.

**Seeded questions:** `?` seeds demonstrably change with relevant horizon/context and execute through the ordinary governed path.

**Context evidence:** persisted links resolve to the intended source; dates/source classes/relevance are present; primary releases and related reporting remain distinguishable.

**Causality discipline:** test cases containing strong temporal coincidence do not yield unsupported factual causal claims.

**Context freeze:** Refresh Context on a later state does not mutate contextual evidence saved with earlier checkpoints.

**Glossary timing:** every governed component/indicator has a validated timing classification or truthful mixed/context-dependent status plus Why / Leads-lags-what / Caveat fields.

**No arithmetic contamination:** leading/lagging metadata and external context cannot change canonical index arithmetic, weights, transforms, model lifecycle, or source Health.

**Library regressions:** existing Library Print, TTS/Listen, Markdown rendering, links, export/import, title editing, navigation, and transcript persistence remain functional.

**Responsive/mobile:** live-result actions, seeded-question surface, Context & Further Reading, and checkpoint navigation are usable on Android/mobile layouts without page-level overflow.

**Race/state integrity:** stale live-query/context responses cannot overwrite a newer checkpoint/horizon/question state.

## 33. Permanent prohibitions for live investigation

Do not:

- turn a saved Library analysis into a moving target;
- overwrite the original frozen analysis when refreshing;
- create a new Library card merely because a live result was saved;
- save every AI follow-up automatically;
- give AI raw/unbounded SQL access;
- expose arbitrary database tables/columns through the AI query surface;
- create a second model/index arithmetic engine for live queries;
- silently use current revised history when the requested semantics are “what happened after the saved cut”;
- silently preserve stale historical values when the requested semantics are current-vintage restatement;
- mix frozen and current-vintage observations without explicit labeling;
- fabricate or interpolate unavailable evidence to satisfy a query;
- infer causation from contemporaneous news/release timing;
- invent or persist unsupported headlines, source claims, dates, or links;
- let external reporting override deterministic Market Navigator evidence;
- mutate an older checkpoint when contextual evidence is refreshed;
- force all indicators into leading/lagging when coincident or mixed is more accurate;
- use timing classification as a deterministic forecast;
- let glossary timing metadata change model weights/arithmetic;
- weaken existing Library reproducibility, Print, TTS, Markdown, export, Health, Index Explanation, or retained semantic gates.

This capability remains planning-only until separately authorized for implementation.



## 34. Turn 26 correction — compact ribbon, direct Health-source links, standalone Analyze modal

Owner clarification: 2026-09-21.

### 34.1 Compact components breadcrumb
When the NOW index view is expanded to components, the visible breadcrumb token must be `*` rather than the word `COMPONENTS`. Its accessible label/title remains “Components.” The purpose is to preserve horizontal space for all horizon controls and the `…` menu on mobile. The breadcrumb may not wrap or push horizon/menu controls out of view.

### 34.2 Direct source links from the long-press information card
The long-press information card must expose a **Source** link for both raw series and governed indices.

- The link opens in a **new browser tab**.
- It must deep-link to the exact matching HEALTH entry, not merely navigate to the generic HEALTH page.
- Raw series link to their exact Sources/Data Health row.
- Governed indices link to their exact Derived Model Health entry.
- The target HEALTH entry must have a stable addressable anchor and be scrolled/highlighted when opened directly.

### 34.3 Standalone Analyze modal
The long-press information card must also expose a chart-style **Analyze** icon.

Interaction contract:

- hover/title: `Analyze`;
- tap opens a **fresh standalone modal analysis surface**;
- this modal is not a breadcrumb/drill-down route and must not mutate NOW breadcrumb/navigation state;
- the modal can be exited only by its explicit upper-right `×`, except AI POV handoff described below;
- clicking/tapping outside the modal must not dismiss it;
- Escape is not a substitute for the explicit `×`.

The selected component/index becomes the modal’s **primary series** and initial rebasing reference at Indexed 100. The modal contains:

- full horizon selector;
- primary-series identity;
- Indexed 100 chart;
- series chips;
- `+ Add` capability using the governed catalog and availability rules;
- remove capability for comparison series, but never for the primary series;
- ability to make an added series the primary/rebase reference;
- normal crosshair/inspection behavior;
- Data;
- Print;
- Download Markdown;
- CSV/JSON chart-data download;
- AI POV.

The modal is independent of the NOW drill-down path. A user may therefore launch a fresh comparison rooted in crude oil, gold, QQQ, or any other available governed series without engineering a NOW breadcrumb route.

### 34.4 AI POV handoff
AI POV from the standalone Analyze modal freezes the exact modal chart state and passes that state to the existing governed AI/Library path. Starting AI POV:

1. freezes the modal state;
2. closes the standalone modal;
3. creates the Library analysis from that exact frozen state;
4. opens Library to the new analysis.

No parallel Library or AI engine is authorized.

### 34.5 Qualification
Release blocking:

- `*` breadcrumb does not hide any horizon or the `…` control at 412px mobile width;
- source link opens a new tab at the exact raw-series or derived-model HEALTH entry;
- Analyze opens a modal without changing NOW breadcrumb/horizon/composition;
- outside click does not close modal;
- explicit `×` closes modal and restores the unchanged NOW state;
- selected series is the primary Indexed-100 reference;
- `+ Add` adds an available governed series;
- selecting another modal series as primary changes the comparison/rebase reference without changing NOW;
- modal AI POV closes modal, opens Library, and persists the exact modal state;
- retained Turn 26 QA remains green.


### 34.6 Clarified Turn 26 baseline and Library context export contract — 2026-09-21

The implementation baseline for this correction is the deployed `market-navigator-turn26-ship.html` surface at `https://acmeproducts.github.io/stuff/market-navigator-turn26-ship.html`.

The standalone Analyze modal is a fresh analysis page rooted at the series chosen from the long-press information card. Its root/breadcrumb label is that selected series. Its horizon selection is modal-local and must not change the underlying NOW horizon. It exposes all seven governed horizons, `+ Add`, and the `…` action menu. AI POV freezes the exact modal state, closes the modal, immediately opens Library with the new analysis card visibly in `processing` state, and then completes that same card when the AI response returns.

Library `Context & Further Reading · N sources` is evidence, not optional decoration. It must:

- default **expanded/open** in the Library transcript;
- retain every live source hyperlink returned in the frozen analysis;
- render expanded in Library Print, including all source links and the external-source boilerplate footnote;
- remain present in full in Download Markdown, including the Markdown hyperlinks;
- never be dropped, collapsed-away, or replaced by a source count alone in print/download outputs.

Release qualification must prove modal-local horizon independence, selected-series root identity, processing-card handoff, expanded Library context, expanded print context, and linked Markdown download.


### 34.7 Seeded-question mobile readability — 2026-09-21

The Library `?` seeded-question menu must remain fully contained inside the Library detail card on mobile. It may not extend underneath the left rail or clip the beginning of any question. Every question must:

- start from a consistent visible left inset;
- wrap naturally within the available Library width;
- use readable line-height and spacing between questions;
- remain left-aligned;
- avoid horizontal scrolling or clipped first words.

At 412px mobile width, the menu bounds and every question row must remain within the Library detail card.


### 34.8 Seeded context questions must return live links — 2026-09-22

The Library `?` seeded question **“What reputable data releases and reporting are contemporaneous with the move?”** is a governed live-context query, not a generic conversational follow-up.

Requirements:

- route that question, and equivalent natural-language context/news/reporting requests, through the same live context retrieval path used by the newspaper Refresh Context action;
- require actual clickable Markdown hyperlinks in both Data & Releases and Related Reporting when qualifying sources exist;
- citation markers, footnote numbers, source names without URLs, or claims that links are active are not substitutes for hyperlinks;
- validate the generated Context & Further Reading body before rendering;
- if a response contains external-source claims but no working hyperlink syntax/URL, retry the context request once with an explicit link-repair instruction;
- if the retry still produces no links, render a truthful no-links warning rather than presenting citation markers as linked evidence.

Release qualification must prove the seeded context question resolves to `refresh-context` and produces rendered anchor elements without requiring the newspaper refresh as a second step.
