# Market Navigator — Graveyard

Status: REJECTED APPROACHES / DO NOT PATCH FORWARD
Updated: 2026-08-31

This file is a negative specification. A rejected implementation, workflow, validation technique, layout decision or analytical shortcut is historical evidence only. It is not a successor baseline.

## Permanent process rule
**DO NOT PATCH FORWARD FROM A REJECTED RELEASE.**

Required cycle:

**diagnose → record failure here → update Master Plan → restore approved baseline → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance**

A rejected ship is rolled back. It does not become the next pre-base.

---

## G3-R1 — Rejected post-baseline Gate 3 ribbon/help patch

**Rejected lineage:** deficient `market-view-ux-gate3.html` descendants after baseline commit `5db1363447c70d5dd3bb5f1f6d03204af34b6eb7`.

### Rejected
- ribbon geometry that loses fixed breadcrumb/horizon/more alignment;
- breadcrumbs rooted incorrectly at Now;
- contextual help without explicit close;
- legend More actions that lose clicked-series identity;
- treating Add to Analysis and Add/Save to Library as equivalent;
- reusing a deficient descendant because it contains some desired changes.

### Recovery
Restore the approved baseline and apply only governed changes. Preserve the accepted chart/analysis journey unless the current Master Plan explicitly supersedes it.

---

## G4-R1 — Rejected first Gate 4 slice

**Rejected implementation:** `market-view-gate4.html`, commit `38a35279f4aea9c99d6fcb70518e06c31371cf3e`.

### Rejected
- incomplete chart/navigation slice presented as Gate 4;
- two-row ribbon;
- weak mobile horizon targets;
- long legends/direct-new-tab behavior that loses context;
- incomplete V1/V2 lines/components;
- locked crosshair and split inspection;
- Library/AI/CONFIG deferred out of the release;
- flat Add Series list with hidden actions.

### Recovery
Build the complete governed application from the accepted lineage rather than extending this slice.

---

## G4-R2 — Rejected inert replacement

**Rejected implementation:** `market-view-gate4-r2.html`, commit `141739606b0e2fe61e22ab7fa9b51936c20c8009`.

### Failure
Published JavaScript did not pass syntax validation and the replacement was inert.

### Permanent lesson
No owner test URL before real syntax/parser and boot gates pass.

---

## G4-R3 — Rejected standalone rewrite masquerading as lineage preservation

**Rejected candidate:** `market-view-gate4-r3.html`, commit `2a5daaf19a68cad2dc8c04cab3deaf3ea1680dcb`.

### Failure
A compact replacement shell passed superficial parser/boot/string checks while discarding Market Navigator 3.9.7 behavior and product fidelity.

### Rejected
- replacing 3.9.7 with a rewrite and calling it preservation;
- DOM/string-count checks as parity proof;
- boot success as capability/visual proof;
- generic reimplementation of accepted runtime/data behavior;
- release without baseline visual/capability comparison.

### Recovery
The active `market-view-gate4-r3.html` was restored to exact 3.9.7 and is a baseline artifact only. The rejected candidate code is not a patch-forward source.

---

## G4-R4 — Rejected technically-passing but product-invalid release

**Rejected candidate:** `market-view-gate4-r4.html`, commit `12450364b8298b9f7d1d96837c61654197e793f7`.

### Owner-observed failures
- hamburger/rail collapse failed;
- provider/model behavior diverged from `devstream-test.html`;
- POV analyzed incomplete/stale evidence;
- AI could spin then disappear;
- Market/Risk/Growth/Macro charts were not analytically useful;
- Health did not diagnose evidence freshness/failure;
- CPI stopped at June when a newer observation was available;
- Explore and Add Series diverged.

### Root causes
Validation emphasized structural presence and scripted completion instead of product usefulness, data truth and exact donor behavior.

### Recovery
Do not reuse R4 HTML, generated code, workflows or validation. Health must surround chart/AI evidence; AI must preflight evidence; provider configuration must use the exact donor; discovery must be shared.

---

## G4-R5 — Rejected arbitrary-layout successor with non-diagnostic Health

**Rejected release:** `market-view-gate4-r5.html`, commit `4b1000e317375d9504fd14dcd5afae66f9654cdf`; qualification run `33386160380`; Pages run `33386297538`.

### Owner-observed failures
- approved application layout changed arbitrarily;
- Health did not explain why data was bad;
- Health did not explain why visible charts were bad;
- Market/Risk/Growth/Macro charts were visibly misleading/unusable.

### Root causes
Functional assembly was treated as permission to redesign. Geometry checks replaced visual redline review. Health was descriptive rather than causal. Chart tests proved existence rather than coherence.

### Recovery
R5 HTML/JS/CSS/workflow/validation/layout are forbidden successor inputs. Preserve the approved frame and make Health explain source → publication expectation → canonical observation → collector/persistence → coverage/density → chart impact.

---

## G4-R6-D1 — Rejected split-brain evidence-health model

### Rejected
- treating whichever repository model is easiest to consume as product authority;
- treating collector HTTP success as proof of evidence currentness;
- calendar age alone as low-frequency freshness logic;
- browser-side Yahoo/FRED reacquisition creating a second canonical store.

### Permanent lesson
Catalog definition, canonical observations, operational manifest and collector health answer different questions. Health must reconcile them rather than collapse them.

---

## G4-R6 — Rejected mechanically-qualified but contract-invalid release

**Rejected implementation:** `market-view-gate4-r6.html`, release commit `6ca2f390f4b217f905bd74484756a8d2cc07fdac`; qualification run `33467031960`; Pages deployment `33467069423`.

**Rollback:** R6 HTML, source JS, CSS, generated runtime JS, validation record and R6 qualification/diagnostic/release workflows were removed from active `main`. R6 and descendants are forbidden patch-forward baselines.

### Owner-observed failures
- **Data/Health contradiction:** CPI/Core CPI/PCE/Core PCE ended June 30 while Health called the condition `expected-lag`, despite newer publicly expected/available evidence requirements.
- **Bad V1 output:** Macro was massively distorted relative to Risk/Growth while the UI presented all three as normal comparable indices.
- **Accepted analytical lineage abandoned:** the accepted product relationship is V1 Market + V2 selected Index simultaneously in NOW; selecting a V2 component launches exact V3 Component Analysis; former V4 multi-series behavior is collapsed into V3; V5 is abandoned. R6 instead reshaped this into implementation-driven modal behavior and lost the accepted V1+V2 composition.
- **Derived-index definition drift:** R6 consumed a Risk/Growth/Macro component definition that no longer matched the accepted product definitions.
- **Duplicate/incorrect analytical controls:** implementation-shaped controls, including duplicate AI POV entry points, appeared.
- **AI split brain:** CONFIG showed Venice.ai/model validated while Analysis returned `Configure and validate an AI provider/model first.`
- **AI POV inert:** provider/model validation did not produce an operational AI request path.

### Root causes
- Validation encoded R6's implementation shape instead of independently testing the accepted product contract.
- Health tests used collector success and simple age/cadence checks rather than latest-publicly-expected observation versus actual canonical evidence.
- A drifted backend definition became self-validating because release tests checked presence, not identity against the accepted product definition.
- CONFIG validation state and Analysis execution state were separate systems instead of one donor-derived state path.
- Mechanical PASS was treated as proof of product conformance.

### Correct analytical journey after owner clarification
The accepted lineage is:

**V1 Market + V2 selected Index together in NOW → direct V2 component → exact V3 Component Analysis → additive/multi-series V3 Analysis.**

- V1 remains visible while V2 changes below it.
- V2 is not a peer top-level page.
- Direct V2 component → exact V3 is accepted.
- Former V4 automatic multi-series capability belongs inside V3.
- Historical V5 is abandoned and must not return as a separate state.

Any earlier recovery wording proposing an About → More info step between V2 and V3 is superseded by this owner clarification and the current Master Plan.

### R7 recovery
- Start only from exact restored 3.9.7 plus the accepted chart lineage in `MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md` as superseded by the current Master Plan.
- Reconcile `data/market-backend/derived-index-definition.json` to the accepted Risk/Growth/Macro component definitions before chart implementation.
- Missing accepted components are backend gaps; do not silently substitute different series.
- Repair canonical freshness before derived-index rendering, beginning with CPI and all stale/expected-lag contradictions.
- Health must distinguish source-not-published, collector miss/failure, persistence/cache failure, sparse coverage and cadence incompatibility.
- Bad evidence must visibly degrade/block the affected analytical output rather than produce a normal-looking index.
- Reuse exact `devstream-test.html` provider/model state so validation and execution are one state machine.
- Require a real validated-provider → AI request → persistent AI response round trip before release.
- Do not reuse R6 code or its validation shortcuts.

---

## Permanent prohibited patterns
- patching rejected releases forward;
- arbitrary application-frame redesign;
- V1 disappearing when V2 is selected;
- V1/V2 as unrelated peer product pages;
- recreating V4 or V5 as separate states;
- silent derived-index component substitution;
- accepting a backend file as product authority solely because it is labeled canonical;
- cadence-only Health classification;
- collector-success-as-currentness;
- stretched/fabricated slow-frequency source observations;
- separate Explore/Add-Series discovery implementations;
- duplicate chart engines;
- missing/incorrect X/Y1/Y2 axes;
- all-series inspection popup;
- provider validation separated from AI execution;
- CONFIG validated while Analysis reports unconfigured;
- AI POV without evidence-health preflight;
- spin-and-disappear AI execution;
- duplicate AI POV controls;
- Tag/Clarify/composer-Save in approved conversation surface;
- persistent below-chart statistics/correlation blocks that displace conversation;
- browser-side canonical Yahoo/FRED reacquisition;
- release gates that validate internal function calls, labels or DOM presence instead of actual owner-visible behavior;
- handing the owner any release with known data, chart, AI or journey defects.
