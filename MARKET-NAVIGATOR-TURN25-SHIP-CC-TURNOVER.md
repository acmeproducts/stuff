# Market Navigator Turn 25 Ship — Claude Code Execution Turnover

**Status:** EXECUTION HANDOFF — NOT OWNER ACCEPTED  
**Repository:** `acmeproducts/stuff`  
**Target artifact:** `market-navigator-turn25-ship.html`  
**Owner-authoritative construction ancestor:** `market-navigator-turn25-pre-ship.html` at `ddf275a8da943cfb8b0e9c5e610649b36424b886`  
**Rejected implementation evidence:** `c3cde56268303d8e2a222012d5a34aee9f26651e` and all descendants/variants that use its failed Index Explanation implementation as an application donor.

---

## 1. PURPOSE OF THIS TURNOVER

This document is the execution handoff to Claude Code (CC) for completing Market Navigator Turn 25 Ship. It is not a replacement for repository governance. The following three files remain authoritative and MUST be fetched from current `main` and read in full before application code is changed:

1. `MARKET-NAVIGATOR-MASTER-PLAN.md`
2. `MARKET-NAVIGATOR-GRAVEYARD.md`
3. `MARKET-NAVIGATOR-BUILD-PROTOCOL.md`

If this turnover conflicts with any of those documents, stop and reconcile the conflict against current repository history and the owner's explicit fixed-baseline instruction. Do not silently reinterpret requirements.

CC has execution authority for this task. Do not ask for approval between stages. Work continuously through recovery, implementation, qualification, publication and live verification. Do not stop at diagnosis, a local build, a commit, CI green, or Pages deployment.

The only successful completion is a fully qualified, deployed, cache-busted `market-navigator-turn25-ship.html` plus the exact candidate SHA and gate summary. A candidate is not owner-accepted until the owner tests it and explicitly says so.

---

## 2. NON-NEGOTIABLE BASELINE AND LINEAGE

The baseline question is closed.

The immutable application construction ancestor is:

- File: `market-navigator-turn25-pre-ship.html`
- Commit: `ddf275a8da943cfb8b0e9c5e610649b36424b886`

At Stage 0, CC MUST independently resolve and record:

- full commit SHA;
- exact Git blob SHA for that historical HTML file;
- exact byte size;
- cryptographic checksum if the build protocol requires one;
- clean baseline JavaScript parse/boot result.

The required lineage is:

`OWNER-ACCEPTED ddf275a BASELINE → DEFINED TURN 25 SHIP DELTA → CANDIDATE → COMPLETE QUALIFICATION → DEPLOYMENT → LIVE SMOKE → OWNER DISPOSITION`

Do not:

- search for or nominate another last-known-good;
- use current `main` application HTML as the construction baseline;
- patch forward from a rejected candidate;
- use the later failed `ⓘ` implementation as an application donor;
- use wrappers, iframes, runtime monkey patches, alternate state machines, or alternate chart/data engines;
- let CI, Pages, merge status or a prior assistant statement redefine owner acceptance.

Current `main` may contain newer data, registry, evidence, infrastructure or unrelated repository work. Integrate only what governance requires, without changing the immutable application ancestry.

---

## 3. RECOVERED FAILED-AUTOMATION STATE

Two known Turn 25 Ship automation commits were introduced during an earlier execution attempt:

- `a798542b256309c97204465afe012c64f5138033` — `Automate governed Turn 25 Ship candidate build`
- `e1c0a0358f4acaba00669571634c3058eaec4a2b` — `Make Turn 25 Ship baseline fetch targeted`

The `e1c0a035...` Actions run fetched the exact owner baseline successfully, then failed in **Build from owner-authoritative baseline** with:

`chart canvas: expected 1 anchor, found 0`

The run then skipped static qualification and candidate commit. It did not create a qualified `market-navigator-turn25-ship.html`.

The temporary workflow subsequently present on `main` attempted to mutate the builder at runtime to compensate for source-anchor mismatches. Treat that as failed execution machinery, not product architecture and not proof of a valid candidate.

A later recovery-trigger commit was created:

- `d647b238a3914664f093708aeda8f3b421f9fd14` — `Retry governed Turn 25 Ship build after anchor recovery`

Only the Pages build was observed for that commit; the custom Turn 25 Ship build did not provide a completed candidate. At the time of recovery inspection, `market-navigator-turn25-ship.html` remained absent from `main`.

Repository `main` subsequently advanced through unrelated work. Therefore CC MUST fetch current `main` afresh rather than assuming any SHA in this section is still HEAD.

### Required recovery actions

Before application implementation:

1. `git fetch --all --prune` and checkout current `main`.
2. Record current `main` SHA.
3. Inspect commits `a798542...`, `e1c0a035...`, `d647b238...` and all associated workflow runs/jobs/logs.
4. Diff each against its parent and identify every file modified.
5. Specifically determine whether any attempt modified:
   - `market-navigator-turn25-ship.html`;
   - `market-navigator-turn25-pre-ship.html`;
   - `market-navigator-build-turn25-ship.py`;
   - `.github/workflows/build-market-navigator-turn25-ship.yml`;
   - governance files;
   - any Market Navigator application/data artifact.
6. Confirm the historical `ddf275a` baseline itself is untouched.
7. Remove, repair or supersede temporary automation that is unsafe, misleading or no longer required. Do not preserve runtime source rewriting merely because it exists.
8. Establish a clean working tree and a deterministic local build path before Stage 1.
9. Do not delete unrelated current-main work.

Recovery is repository hygiene. It is not permission to reconsider the fixed baseline or Turn 25 Ship requirements.

---

## 4. PRODUCT OBJECTIVES — ALL THREE SHIP TOGETHER

Turn 25 Ship has three coordinated objectives. None is optional and none may be shipped as an isolated patch.

### A. Correct NOW Print

Correct Print for all applicable analytical contexts:

- ENV;
- governed index;
- component/raw-series context.

Print must freeze the exact NOW analytical state and build a dedicated, self-contained Market Navigator Chart Report. It must not print the interactive viewport.

The report must include, where applicable:

- report title;
- generated date/time;
- breadcrumb/context;
- selected horizon;
- actual visible date range;
- representation/axis mode;
- visible-series legend;
- exact frozen chart at useful print dimensions/aspect ratio;
- evidence/revision/model/source context;
- deterministic Index Explanation for each governed index genuinely in frozen scope;
- truthful degraded/unavailable notices.

Context truth rules:

- ENV Print: exact frozen ENV state and all applicable governed indices.
- Governed-index Print: exact frozen index state and applicable explanation.
- Component/raw Print: exact raw/component state; never fabricate a composite explanation. Include an explanation only if a governed index genuinely remains in frozen analytical scope.

Required architecture:

`freeze exact NOW state → construct dedicated report DOM → clone/render exact frozen chart → add metadata/explanation → print report only → invoke native print once → cleanup`

No refetch. No NOW mutation. No paper-size/orientation/printer/page-count assumptions.

Library Print is a separate operation and must not regress.

### B. HEALTH — Derived Models / Model Health

HEALTH must distinguish:

- Sources / Data Health
- Derived Models / Model Health

Do not collapse source health and model health into one status.

Add governed model-health/model-stability surfaces for RSK, GRW and MAC based on the actual production definitions.

Each composite requires a machine-readable Model Manifest containing the actual:

- model ID;
- immutable version/hash;
- purpose: DESCRIPTIVE / NOWCAST / FORECAST;
- components;
- weights/contribution rules;
- directions;
- transformations/normalization/inversion;
- cadence;
- missing/stale-data rules;
- methodology history;
- validation timestamp;
- model/catalog/evidence revisions.

Derived Models must expose:

- Components;
- Contribution;
- Sensitivity;
- Robustness;
- History.

Required deterministic measurements include:

- lifecycle status;
- model version;
- data-health status;
- formula replication PASS/FAIL;
- required/available components;
- weight/rule validation;
- stale/missing conditions;
- concentration;
- standardized sensitivity;
- leave-one-component-out impact;
- direction stability;
- specification robustness;
- attribution coverage by horizon;
- reconciliation status/residual;
- validation timestamp;
- evidence/model revisions.

Use actual governed arithmetic. Do not use universal ±10% raw shocks across heterogeneous components. Sensitivity must use governed standardized shocks such as ±1 historical standard deviation and, where appropriate, historical 95th-percentile movement. Leave-one-out must recompute under the governed renormalization rule. Nearby specifications may be used for robustness only when explicitly defined and may not silently replace the canonical model.

Backtesting must match declared model purpose. Do not evaluate a descriptive model as a forecasting model.

Lifecycle:

`DEFINED → VALIDATED → ACTIVE → WATCH → DEGRADED → SUSPENDED`

AI never assigns lifecycle status.

### C. Canonical `ⓘ` Index Explanation

Place exactly one circled information control in the upper-right NOW chart plotting region:

`ⓘ`

Required interaction:

- exactly one visible control;
- upper-right plot location;
- minimum 40×40 CSS-pixel touch target;
- `aria-label="Explain index movement"`;
- one tap/click/keyboard activation opens a populated `Index Explanation` modal;
- no focus-only pseudo-success;
- no persistent second concentric ring;
- chart canvas/gesture handling cannot swallow activation;
- open/close causes zero evidence refetches;
- open/close causes zero analytical-state mutations;
- repeated open/close works;
- close returns focus appropriately.

Modal top strip:

`selected horizon | Copy | Download MD | ×`

For every applicable governed composite, body order is:

`Index movement → Component contribution table → Plain-language explanation → Calculation status/provenance`

This is deterministic explainability/audit, not AI commentary.

Never:

- read chart pixels;
- estimate values;
- infer approximate arithmetic;
- invent components, weights, causes or observations;
- use illustrative/sample values as a production fallback;
- assume `weight × raw component % movement = contribution` unless that is demonstrably the production construction.

For the selected horizon, expose actual governed:

- index baseline/end values;
- actual baseline/end dates;
- component baseline/end values and observation dates;
- component movement;
- weights/contribution rules;
- direction;
- transformations;
- exact contribution to index movement;
- source/evidence revision;
- reconciliation residual/status.

Healthy attribution must satisfy:

`Σ governed component contributions = governed index movement ± explicit governed rounding residual`

If exact attribution cannot be reproduced, return `Attribution unavailable` or `Attribution degraded`, identify the missing prerequisite, and never estimate the missing contribution.

---

## 5. ONE CANONICAL EXPLANATION RECORD

A central architectural requirement is that explanation arithmetic is calculated once from governed evidence and then consumed everywhere.

Required flow:

`governed evidence + production model definition → canonical calculation record → deterministic Markdown`

That exact record/Markdown feeds:

1. `ⓘ` modal;
2. rendered Markdown;
3. Copy;
4. Download MD;
5. NOW Print;
6. AI POV evidence;
7. frozen Library analysis.

Do not independently recalculate attribution in those consumers.

The canonical record needs a stable identity/fingerprint sufficient to prove that modal, AI evidence, Print and Library persistence refer to the same frozen arithmetic.

---

## 6. MANDATORY AI POV + LIBRARY INTEGRATION

The user must never need to open `ⓘ` before AI POV.

Whenever one or more governed indices are inside the frozen AI POV scope:

`freeze exact NOW scope → identify governed indices → compute/freeze canonical explanation record(s) → generate deterministic Markdown → attach record + Markdown to AI evidence/context → persist Processing analysis → execute provider → persist frozen Library analysis`

ENV scope containing RSK, GRW and MAC requires all applicable explanations.

AI may interpret governed evidence. AI may not:

- replace the deterministic arithmetic;
- recompute it;
- contradict it;
- fill missing attribution;
- be asked to calculate missing contribution values.

Persist in the frozen Library analysis:

- exact explanation record(s);
- exact explanation Markdown supplied to AI;
- explanation identity/fingerprint;
- applicable model version(s);
- model-health snapshot(s);
- evidence/model revisions.

Later evidence refreshes must not rewrite historical explanation evidence. Continuation must not silently replace frozen evidence.

Provider failure must not create a falsely completed analysis.

---

## 7. EXECUTION SEQUENCE — DO NOT SKIP STAGES

### Stage 0 — Recovery, governance, provenance and baseline qualification

1. Fetch current `main` and record SHA.
2. Read Master Plan, Graveyard and Build Protocol in full.
3. Recover failed workflow/build state as specified above.
4. Resolve `ddf275a` to full SHA.
5. Resolve historical baseline file blob SHA and byte size.
6. Copy/extract that exact historical file as the immutable construction ancestor.
7. Verify no rejected Index Explanation implementation is present in it.
8. Run clean baseline syntax/boot qualification.
9. Record a provenance manifest/build log tying the candidate to this source.
10. Establish clean working tree.

**Exit gate:** provenance proven and baseline boots cleanly. Do not start UI implementation before this passes.

### Stage 1 — Discover and prove actual RSK/GRW/MAC arithmetic

This is the most important technical stage.

1. Trace the production path that creates RSK, GRW and MAC.
2. Identify canonical model definitions, components, transformations, directions, alignment rules, missing/stale rules, normalization, scaling and renormalization.
3. Trace where raw observations become aligned observations, transformed component values and final index values.
4. Identify evidence/catalog/model revision identifiers.
5. Create governed machine-readable manifests from actual definitions, not duplicated hand-entered approximations.
6. Create intermediate arithmetic records necessary to reproduce each index.
7. For 5D, 1YR and 5YR, independently reproduce actual baseline/end index values from eligible observations and actual dates.
8. Compute exact component contributions using the production construction.
9. Reconcile contribution sum to actual index movement within an explicit rounding tolerance.
10. Exercise missing/stale component cases without forward-filling/restamping solely to force attribution completeness.

**Exit gate:** formula replication and contribution reconciliation are proven before any explainability UI is built.

### Stage 2 — Deterministic Model Health engine

Build Model Health from the manifests and actual arithmetic.

Implement deterministic:

- formula replication;
- rule/weight validation;
- component availability/staleness;
- concentration;
- standardized sensitivity;
- historical 95th-percentile sensitivity where governed/appropriate;
- leave-one-out recomputation under canonical renormalization;
- direction stability;
- explicitly defined specification robustness;
- attribution coverage by horizon;
- reconciliation residual/status;
- deterministic lifecycle mapping.

Keep Data Health and Model Health separate.

**Exit gate:** known healthy, watch/degraded, missing/stale and formula-failure fixtures produce deterministic expected results.

### Stage 3 — HEALTH → Derived Models UI

Integrate the Model Health engine into existing HEALTH without creating a second application state model.

Provide RSK/GRW/MAC surfaces exposing Components, Contribution, Sensitivity, Robustness and History plus required revisions/timestamps/statuses.

Responsive behavior must work on phone, tablet and desktop.

**Exit gate:** UI displays actual engine results and source health remains visibly distinct from model health.

### Stage 4 — Canonical Index Explanation + `ⓘ`

1. Build the canonical calculation-record function from Stage 1 governed arithmetic.
2. Build deterministic Markdown from that record.
3. Add exactly one `ⓘ` to the existing NOW plot container.
4. Ensure its hit target sits above canvas gesture handling.
5. Implement modal render from canonical record only.
6. Implement Copy and Download MD from the same frozen Markdown.
7. Implement focus restoration and repeat open/close.
8. Instrument/verify zero evidence fetches and zero analytical mutation from modal operations.
9. Verify truthful degraded/unavailable rendering.

**Exit gate:** actual touch/click/keyboard semantic tests pass; DOM-presence tests alone are insufficient.

### Stage 5 — AI POV and frozen Library persistence

1. Hook explanation generation into frozen AI scope creation, not into modal-open state.
2. Include every governed index in frozen scope.
3. Attach exact records + Markdown + model-health snapshot to AI evidence.
4. Persist Processing state before provider execution according to existing contract.
5. Persist exact frozen explanation/model snapshots into completed Library analysis.
6. Verify durable reread from IndexedDB/persistence layer.
7. Refresh evidence and prove historical Library record is unchanged.
8. Continue an analysis and prove frozen evidence is not silently replaced.
9. Exercise provider failure and verify no false Completed state.

**Exit gate:** identity/fingerprint of AI evidence equals persisted Library explanation evidence.

### Stage 6 — Correct NOW Print

Implement dedicated report generation from a frozen NOW snapshot.

Test three distinct contexts:

1. ENV;
2. governed index;
3. raw/component.

For each, freeze state before building report. Clone/render the exact frozen chart. If chart image decoding is asynchronous, await successful decode/readiness and sufficient render frames before invoking native print. Verify nonzero natural dimensions/readable chart before print.

Include canonical explanation only where governed scope warrants it.

Call native print exactly once, then clean report DOM/classes/listeners without mutating NOW.

Do not touch Library Print implementation except where necessary to prevent shared-print infrastructure regression.

**Exit gate:** semantic print harness proves exact chart/context and once-only native print for all three NOW contexts.

### Stage 7 — Complete cumulative qualification, integration, deployment and live smoke

1. Run complete matrix on candidate.
2. Integrate required current-main/data changes without changing the fixed application ancestor.
3. Re-run the COMPLETE matrix on the exact final merged/published artifact. Earlier test results do not count after final integration.
4. Commit candidate.
5. Record exact candidate commit and artifact blob/checksum/size.
6. Deploy through governed Pages path.
7. Wait for deployment success.
8. Fetch exact cache-busted Pages URL and verify served artifact identity.
9. Perform live semantic smoke, not just HTTP 200.
10. Only then return candidate to owner for disposition.

---

## 8. RELEASE-BLOCKING QUALIFICATION MATRIX

All sections below are mandatory unless current Master Plan contains an even stronger requirement.

### 8.1 Provenance

PASS requires:

- full `ddf275a` SHA recorded;
- exact baseline blob SHA recorded;
- exact baseline byte size recorded;
- baseline checksum recorded if protocol uses one;
- baseline clean parse/boot;
- candidate construction demonstrably traceable to exact baseline;
- no rejected `c3cde...` application donor.

### 8.2 Runtime

PASS requires:

- JavaScript syntax/parse;
- application boot;
- zero application-owned console errors;
- zero unhandled rejections;
- zero missing required resources;
- zero null-DOM boot failures.

### 8.3 Baseline regression

Preserve the strongest semantic regression tests from the owner-authoritative baseline. Do not weaken assertions because candidate behavior differs.

Key principle: stateful journeys must still work, not merely elements exist.

### 8.4 Model arithmetic

For RSK, GRW and MAC:

- manifest corresponds to production definition;
- formula replication PASS;
- component contribution truth proven;
- reconciliation proven;
- actual dates/eligible observations used;
- missing/stale behavior truthful;
- no sample/illustrative fallback;
- no chart-pixel arithmetic;
- no AI-created arithmetic.

### 8.5 Model Health

Prove:

- source health and model health separate;
- lifecycle deterministic;
- concentration deterministic;
- standardized sensitivity deterministic;
- leave-one-out recomputation correct;
- robustness rules explicit;
- failure/degraded semantics truthful;
- model/evidence revisions visible and persisted as required.

### 8.6 `ⓘ` interaction

Prove:

- exactly one icon;
- correct plot position;
- ≥40×40 CSS-pixel target;
- exact aria-label;
- actual tap opens populated modal;
- actual click opens populated modal;
- keyboard activation works;
- no second-ring-only failure;
- repeat open/close works;
- close restores focus;
- phone/tablet/desktop behavior;
- zero analytical mutation;
- zero explanation-triggered evidence refetch.

### 8.7 Horizon truth

At minimum test:

- 5D;
- 1YR;
- 5YR.

Use actual eligible observations and observation dates. Do not forward-fill/restamp just to make attribution complete.

### 8.8 AI POV

Prove:

- every governed index in frozen scope is automatically included;
- opening `ⓘ` is not a prerequisite;
- provider is not asked to calculate missing arithmetic;
- exact explanation identity equals persisted Library evidence;
- model-health snapshot/version persisted;
- provider failure does not create false completion.

### 8.9 Library durability

Prove:

- explanation survives durable reread;
- model version/health snapshot survives reread;
- later evidence refresh cannot rewrite frozen analysis;
- continuation cannot silently replace frozen evidence.

### 8.10 NOW Print

For ENV, governed index and raw/component prove:

- dedicated report DOM;
- exact frozen chart;
- nonzero/readable chart;
- correct horizon/context/legend;
- correct actual visible date range;
- revisions/provenance;
- applicable explanation included;
- raw-only scope contains no fabricated composite explanation;
- no interactive chrome;
- zero refetch;
- zero analytical mutation;
- native print invoked once;
- cleanup succeeds.

### 8.11 Library Print regression

Prove exact selected frozen Library chart plus COMPLETE analysis/transcript prints as normal document content.

Exercise Markdown structures:

- headings;
- paragraphs;
- lists;
- tables;
- blockquotes;
- hyperlinks;
- images where present.

No scroll-container clipping. No viewport-only transcript. Chart must be decoded/rendered and nonzero before native print.

### 8.12 Responsive/device

At minimum qualify representative:

- phone viewport;
- tablet viewport;
- desktop viewport.

Test the actual `ⓘ`, modal, Derived Models, NOW Print preparation and existing baseline journeys.

### 8.13 Race/state integrity

Prove:

- geometry-only operations remain geometry-only;
- stale async work cannot overwrite newer analytical state;
- Print/Health/Explanation reads do not mutate NOW;
- repeated horizon/context changes cannot leak stale explanation/model-health data;
- modal operations cannot trigger data/evidence races.

### 8.14 Exact-final-artifact requalification

After final integration, rerun everything above on the exact artifact to be published. Do not cite tests from an intermediate candidate.

### 8.15 Live Pages smoke

From the exact cache-busted deployed URL prove:

- artifact loads;
- correct Turn 25 Ship artifact served;
- artifact identity matches candidate;
- `ⓘ` opens populated explanation;
- degraded explanation is truthful;
- AI POV receives governed explanation automatically;
- HEALTH → Derived Models works;
- ENV Print works;
- index Print works;
- component Print works;
- Library Print remains functional.

Pages deployment green alone is not PASS.

---

## 9. REQUIRED TESTING STYLE

Use semantic tests that exercise real behavior.

Do not substitute assertions such as:

- string exists;
- element exists;
- function name exists;
- workflow green;
- HTTP 200;

for behavioral proof.

Examples of required semantic assertions:

- dispatch pointer/touch activation to the real info control and verify populated modal;
- snapshot analytical state before and after modal open/close and deep-compare;
- instrument evidence fetch count and prove unchanged;
- compare canonical explanation fingerprint across modal/AI/Library/Print consumers;
- intercept native `print()` and assert exactly one call after chart readiness;
- assert report chart natural width/height > 0;
- force missing/stale evidence and verify no fabricated contribution;
- change horizon rapidly and prove stale arithmetic cannot overwrite current horizon;
- reread Library record from durable persistence rather than trusting in-memory object.

Do not weaken existing semantic tests to make the candidate pass. Fix the implementation.

---

## 10. IMPLEMENTATION CONSTRAINTS / GRAVEYARD SUMMARY

The Graveyard is binding. At minimum, do not introduce:

- patch-forward from rejected `c3cde...`;
- guessed alternate baseline;
- wrappers;
- iframes;
- runtime monkey patches;
- duplicate analytical state machine;
- alternate chart/data engine;
- chart-pixel attribution;
- AI-created arithmetic;
- hard-coded illustrative contribution values;
- hidden reconciliation residual;
- estimated missing attribution;
- source-green = model-green equivalence;
- modal refetch;
- modal analytical rerender;
- header-only Print;
- viewport Print;
- missing/zero-size chart in Print;
- Library Print regression;
- cosmetic/static assertions replacing semantic tests.

Also do not redesign unrelated product areas or use this task to clean up unrelated code.

---

## 11. RECOMMENDED CC WORKING METHOD

CC should use a normal repository worktree and execute locally rather than relying on GitHub Contents API as a build environment.

Recommended discipline:

1. Start from current `main` in a clean worktree.
2. Create a dedicated Turn 25 Ship execution branch if repository protocol permits; otherwise follow the Build Protocol literally.
3. Save exact historical baseline separately and make it read-only for comparison.
4. Build candidate deterministically from that baseline plus explicit Turn 25 Ship delta.
5. Keep a machine-readable provenance record/build log.
6. Add/extend tests before or alongside each stage so failures identify the stage that broke.
7. Run fast local gates after each coherent change.
8. Run full cumulative suite at each stage exit.
9. Never patch generated output manually when the deterministic builder/source should be corrected.
10. Before publication, rebuild from a clean checkout to prove reproducibility.
11. After integrating latest required `main`, rebuild/retest the exact final artifact.

The build process must be deterministic enough that a clean checkout can reproduce the candidate without runtime workflow source rewriting.

---

## 12. ARTIFACTS CC MUST LEAVE BEHIND

At successful completion, repository/history should make the work auditable. Preserve, where consistent with Build Protocol:

- final `market-navigator-turn25-ship.html`;
- deterministic source/builder changes used to create it;
- model manifests or canonical manifest-generation logic;
- qualification tests/harness updates;
- provenance/build record with baseline commit/blob/size and candidate identity;
- concise qualification result record or commit message tying PASS evidence to candidate.

Do not leave failed temporary automation as an ambiguous alternate build path. Either remove it or make its role explicit and safe.

---

## 13. FAILURE HANDLING

A failed gate is not a reason to redefine the requirement.

On failure:

1. capture exact failing operation/assertion/log;
2. identify whether defect is implementation, test harness, evidence/data prerequisite, environment or deployment;
3. fix the smallest complete root cause without changing settled requirements;
4. rerun the failed gate;
5. rerun all affected cumulative gates;
6. after any final integration, rerun the complete matrix.

Do not claim PASS based on inspection when executable proof is required.

A terminal blocker may be declared only after direct recovery paths are exhausted. The blocker report must include exact operation/error, what was tried, repository state, and the precise next action required by a successor.

---

## 14. SUCCESS DEFINITION

CC is finished only when all of the following are true simultaneously:

- candidate is constructed from exact `ddf275a8da943cfb8b0e9c5e610649b36424b886` historical HTML;
- provenance/blob/byte size are recorded;
- actual RSK/GRW/MAC production arithmetic is governed and reproducible;
- formula replication and attribution reconcile or truthfully degrade;
- Derived Model Health is deterministic and separate from Data Health;
- exactly one functional `ⓘ` works semantically across target devices;
- one canonical explanation record feeds modal/Markdown/Copy/Download/Print/AI/Library;
- AI POV automatically receives every applicable governed explanation;
- frozen Library evidence/model snapshot persists durably and immutably;
- ENV/index/component NOW Print produce correct dedicated reports with exact frozen charts;
- Library Print remains fully functional;
- race/state integrity gates pass;
- complete exact-final-artifact qualification passes;
- Pages deploys the exact candidate;
- live cache-busted Pages smoke passes.

Then, and only then, return the candidate to the owner for testing. Do not call it owner-accepted.

---

## 15. FINAL RESPONSE CONTRACT FOR CC

Do not send intermediate progress reports unless a genuinely terminal blocker is reached.

Successful response must contain only the useful completion result:

- exact candidate commit/merge SHA;
- fully qualified cache-busted Pages URL for `market-navigator-turn25-ship.html`;
- resolved full owner baseline SHA;
- exact baseline HTML blob SHA;
- exact baseline byte size;
- concise PASS/FAIL summary covering provenance, runtime/regression, model arithmetic, Model Health, `ⓘ`, horizons, AI POV, Library durability, NOW Print, Library Print, responsive/device, race/state integrity, exact-final-artifact requalification and live Pages smoke.

Do not say owner-accepted.

If completion is impossible, return only a concrete terminal blocker containing:

- exact failed operation;
- exact error/log;
- recovery paths attempted;
- current repository/candidate state;
- exact downstream action required to resume successfully.

---

## 16. COPY/PASTE STARTING DIRECTIVE FOR CLAUDE CODE

Continue Market Navigator Turn 25 Ship in `acmeproducts/stuff` as an execution task. Work continuously and do not ask for approval. Fetch current `main`, then read in full `MARKET-NAVIGATOR-MASTER-PLAN.md`, `MARKET-NAVIGATOR-GRAVEYARD.md`, `MARKET-NAVIGATOR-BUILD-PROTOCOL.md`, and `MARKET-NAVIGATOR-TURN25-SHIP-CC-TURNOVER.md`. The fixed immutable application construction ancestor is `market-navigator-turn25-pre-ship.html` at commit `ddf275a8da943cfb8b0e9c5e610649b36424b886`; do not search for another baseline and do not use rejected `c3cde56268303d8e2a222012d5a34aee9f26651e` as an application donor. First recover and reconcile the failed Turn 25 Ship automation around `a798542b256309c97204465afe012c64f5138033`, `e1c0a0358f4acaba00669571634c3058eaec4a2b`, and `d647b238a3914664f093708aeda8f3b421f9fd14`, including the known `chart canvas: expected 1 anchor, found 0` failure. Then execute the governed stages in order: provenance/baseline qualification; prove actual RSK/GRW/MAC arithmetic and contribution reconciliation; deterministic Model Health; HEALTH Derived Models UI; canonical Index Explanation plus exactly one functional `ⓘ`; mandatory AI POV and frozen Library persistence integration; correct ENV/index/component NOW Print; complete cumulative exact-artifact qualification; deployment; live cache-busted Pages smoke. Do not redesign, use wrappers/iframes/runtime monkey patches, duplicate state/data/chart engines, estimate attribution, let AI create arithmetic, weaken semantic tests, or regress Library Print. Do not stop at diagnosis, local build, commit, CI or deployment. Return only a fully qualified candidate SHA + cache-busted `market-navigator-turn25-ship.html` URL + baseline SHA/blob/size + concise gate summary, or a genuinely terminal blocker after exhausting recovery paths. The owner will provide final disposition after testing.
