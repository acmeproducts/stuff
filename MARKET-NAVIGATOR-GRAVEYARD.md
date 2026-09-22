# Market Navigator — Graveyard

Status: BINDING NEGATIVE SPECIFICATION
Updated: 2026-09-16
Current execution authority: `MARKET-NAVIGATOR-MASTER-PLAN.md`

Historical rejected releases remain evidence only. Detailed historical implementation evidence remains in git history.

---

## 1. Permanent recovery rule

**DO NOT PATCH FORWARD FROM A REJECTED APPLICATION IMPLEMENTATION.**

For Turn 26, the approved application baseline is the qualified Turn 25 application at publication commit:

`43e30cd31c4c2d83b49cf2eb532041cf5778006d`

The implementer must pin and record the exact blob SHA of `market-navigator-turn25-pre-ship.html` at that commit before mutation.

The Index Explanation implementation merged in:

`c3cde56268303d8e2a222012d5a34aee9f26651e`

is rejected as an application donor. It may be inspected only as failure evidence. Its owner-visible failure was semantic: tapping the information control produced another circle/focus visual but did not open the required functional explanation surface.

Do not patch that failure. Reimplement the approved objective from the qualified Turn 25 baseline according to the Master Plan.

---

## 2. Permanent test-integrity rule

A test may not claim to cover a capability by asserting only adjacent UI state.

Permanently rejected examples:
- information-control test that checks the icon exists, receives focus, changes class, or gains a ring without proving a populated modal opened;
- Print test that checks only `window.print()` was invoked without proving the chart/report content exists;
- TTS test that stubs `speechSynthesis.speak()` as a no-op and checks only Play→Pause;
- source test that checks green Health without proving canonical evidence/chartability;
- AI test that checks navigation without proving frozen evidence/provider result persistence;
- resize test that checks width without proving analytical invariants;
- persistence test that checks a toast without re-reading durable state.

**Never weaken a retained semantic regression test.** A replacement must observe at least the same defining side effect/state transition.

---

## 3. Permanent Index Movement Explanation prohibitions

Market Navigator must never:
- derive index attribution, component values, dates, weights or contributions from chart pixels;
- allow AI to invent, infer or calculate factual index arithmetic;
- hardcode illustrative/example component numbers into production/fallback paths;
- assume `weight × raw percent move` is the production contribution formula without proving it matches the governed derived-index construction;
- publish a contribution table that does not reconcile to the governed index calculation within explicit rounding tolerance;
- hide a reconciliation residual;
- estimate or silently substitute a missing component contribution;
- forward-fill solely to complete an explanation;
- restamp an older component observation to a horizon boundary;
- fabricate same-date component observations where cadence differs;
- treat source-green as attribution-green when required component evidence or reconciliation is unavailable;
- refetch evidence merely because the explanation modal opens;
- analytically rerender NOW merely because the explanation modal opens/closes;
- mutate horizon, breadcrumb, composition, active series, representation or evidence revision on modal open/close;
- maintain a second independent arithmetic implementation in the modal, AI prompt, Print path or Library path;
- recompute a saved Library explanation from newer evidence;
- let AI POV replace the deterministic explanation with its own arithmetic;
- claim the feature works because the information icon is visible or focusable;
- render a second persistent concentric circle/ring as the apparent result of tapping the icon;
- allow the chart canvas/pointer handler to swallow the icon activation;
- ship an information icon whose tap/click does not open a populated modal or truthful degraded-state modal.

A truthful **Attribution unavailable/degraded** report is acceptable. A fabricated complete report is prohibited.

---

## 4. Permanent NOW Print prohibitions

Market Navigator must never:
- treat `… → Print` as a header-only printout;
- print the interactive NOW viewport directly as the Chart Report;
- omit the current frozen chart from a NOW Chart Report;
- create a Library analysis merely as an intermediate step to print NOW;
- refetch evidence for printing;
- alter horizon/composition/active series/representation/evidence revision for printing;
- substitute a newly reconstructed chart based on newer evidence;
- include rail navigation, context menus, Add picker, Config, tooltips, crosshair overlays or other interactive chrome in the report;
- leave report content clipped by application viewport/fixed-height/max-height/overflow constraints;
- impose application-owned paper size, page count, page range, orientation or print destination;
- count `window.print()` invocation alone as qualification;
- break the already-working Library Analysis Report while repairing NOW Print.

The accepted implementation pattern is the qualified Turn 25 Library/AI POV print-report architecture: dedicated temporary report surface, exact frozen chart, document-oriented content, print-media visibility, one native print invocation, and cleanup.

---

## 5. Permanent Library Print prohibitions

Market Navigator must never:
- print the interactive Library viewport as the Analysis Report;
- leave analysis/transcript clipped, scrollable, fixed-height, max-height or viewport-height constrained in printed output;
- include Library list/search, editing controls, Chat/Listen/TTS/player controls, attachments, composer/Send controls, sticky UI or tooltips;
- recompute, refetch, substitute or change the frozen saved chart/evidence for printing;
- treat merely invoking `window.print()` as sufficient implementation or qualification;
- alter ordinary Library screen behavior merely to make printing work.

Library Print must continue to render the exact frozen chart and complete saved transcript as normal printable document content.

---

## 6. Retired product patterns

Permanently retired:
- V1/V2/V3/V4/V5 terminology in the intended product;
- separate Explore analytical mode;
- separate Component analytical page/modal;
- duplicated-index breadcrumbs such as `ENV / GRW / GRW`;
- default-selected RSK on ENV load;
- breadcrumb wrapping/displacement of horizons/menu;
- raw-source direction inversion;
- synthetic/fallback chart evidence;
- duplicate chart/discovery/AI state engines;
- clipped mobile Listen controls;
- fake MP3 export from browser speech synthesis.

---

## 7. Retained analytical prohibitions

Never:
- fabricate intraday evidence for daily/NAV sources;
- forward-fill or horizon-end-restamp chart evidence;
- silently substitute a proxy or similarly named security;
- switch economic identity by horizon/provider;
- treat price, total return, index level and NAV as interchangeable;
- invert raw/source Indexed 100 because a component has negative derived-index direction;
- let a geometry event invoke a full analytical render or evidence fetch;
- let stale async work overwrite newer horizon/composition state.

Raw/source Indexed 100 remains plain relative rebasing. Derived-component direction affects composite construction only.

---

## 8. Retained architecture prohibitions

Never:
- create a second NOW analytical state for explanation or printing;
- create a second Component state machine;
- let one view manipulate another view's private DOM as navigation;
- retain live references to retired DOM IDs;
- repopulate saved provider secrets into ordinary editable password fields;
- create local-only custom ticker evidence that bypasses canonical evidence/Health/revisions/Library reproducibility;
- make browser static Pages own a repository write credential.

---

## 9. TTS permanent lesson

Turn 19 weakened the semantic TTS gate by replacing observable `speechSynthesis.speak()` handoff with a no-op mock and cosmetic playing-state assertion. That weakening propagated and allowed a broken capability to appear green.

Permanently prohibited:
- replacing a semantic capability assertion with a cosmetic assertion;
- treating a green CI run as proof of behavior the harness never observed;
- promoting a release to last-known-good for a capability not actually qualified.

For TTS, tests must observe a non-empty utterance handed to the speech engine and exercise response/row transport. Android-family playback state must remain truthful.

---

## 10. Turn 26 release discipline

Turn 26 is one cumulative successor from the pinned qualified Turn 25 baseline. Do not publish partial owner-facing rungs.

Permanently rejected:
- fixing the information icon by patching the rejected Codex implementation;
- introducing Objective A before proving the Turn 25 baseline;
- implementing modal UI before understanding/proving the production derived-index arithmetic;
- writing a UI-local attribution formula because it is easier than exposing governed calculation data;
- implementing NOW Print with a new unrelated print architecture when the qualified Library Print mechanism already supplies the accepted pattern;
- passing new gates while silently dropping retained Turn 25 gates;
- publishing before exact merged-main requalification and live Pages smoke testing.

If a Turn 26 gate fails, correct the same candidate. Do not redefine the gate to match the implementation.

## 11. Crosshair / chart-inspection permanent prohibitions

Never regress the accepted chart-inspection contract by: hiding the inspection on pointer leave; removing or disabling the explicit close control; applying `pointer-events:none` so the close control cannot operate; limiting inspection to display-density-reduced points instead of full real observations; fabricating/interpolating/restamping inspection observations; changing the active series merely because the pointer moved; using crosshair-specific arithmetic that diverges from canonical Data/export values; or qualifying the feature only through markup/dataset assertions rather than real pointer/touch interaction.

Owner authorization on 2026-09-18 permits a bounded patch-forward correction to the completed Turn 25 Ship for this inherited crosshair regression. It does not authorize use of the rejected `c3cde56268303d8e2a222012d5a34aee9f26651e` implementation as a donor.

## 12. MAC self-healing / Health Glossary prohibitions

Never ratio-rebase a governed zero-crossing Treasury spread; conditionally include a signed series merely because a selected horizon happens to have a positive baseline; invent a runtime transform, replacement component, or adaptive weight to make Health green; conceal automatic renormalization after omission; classify current FRED public-CSV acquisition as requiring an API key; or expose unexplained Model Health jargon without the governed Glossary/context path.

The only approved zero-crossing repair is the versioned governed `signed_level_sd` transform persisted with its historical scale. If that transform lacks sufficient canonical evidence, omit rather than estimate and expose the resulting lifecycle truthfully.

## 13. Yield Curve factor prohibitions

Never hide the two governed Treasury spreads as anonymous equal-weight rows in MAC Health/Explanation; describe a currently positive curve as inverted because of historical inversion; infer inversion from chart pixels; fabricate missing episode dates; dynamically increase MAC weight because the curve is inverted; or change the canonical 2/7 aggregate Yield Curve weight without a separately versioned weight study and owner disposition.

The accepted current MAC arithmetic remains seven equal eligible components. The Yield Curve factor therefore has an explicit aggregate canonical weight of 28.5714% when both spreads are eligible. Visibility is first-class; weighting remains governed rather than event-driven.


## 14. Turn 26 live-Library candidate failure — 2026-09-21

Candidate commit `efecde9596af7233b26ee8410f898cd9c8e44cda` is rejected and must not be used as an implementation donor. The generated `market-navigator-turn26-ship.html` lost the Turn 26 helper block during source replacement, leaving the intended live-query/checkpoint functions absent. Rebuild the candidate directly from the pinned qualified Turn 25 baseline blob `89095a52e02b06db2b26192099846a5f0015a42d`; do not patch this failed candidate forward.

## 15. Turn 26 baseline correction — 2026-09-21

For Turn 26, the direct application construction baseline is the complete accepted cumulative Turn 25 Ship artifact at commit `7241de67db1558b9223fb608fa26443dcb98a3b2`, file `market-navigator-turn25-ship.html`, blob `8ebd766774d6e70011cdac0e40c2759eba8f5fc5`.

The earlier rule naming `market-navigator-turn25-pre-ship.html` as the Turn 26 mutation source is superseded for Turn 26 because that pre-ship blob does not contain the accepted Index Explanation, Derived Model Health, NOW Print, crosshair, Health Glossary/MAC self-healing, and Yield Curve runtime. It remains historical Turn 25 provenance only.

Never ship Turn 26 from a source that omits accepted cumulative Turn 25 functionality.

## 16. Turn 26 wrong-baseline candidate — 2026-09-21

Candidate commit `2934e9e5335ef9a362efa96407e68f52a311bcef` is rejected and must not be used as an implementation donor. It was built from the historical Turn 25 pre-ship blob rather than the complete accepted cumulative Turn 25 Ship runtime and therefore would have regressed accepted Index Explanation, Derived Model Health, NOW Print and subsequent Turn 25 corrections. The direct Turn 26 baseline remains commit `7241de67db1558b9223fb608fa26443dcb98a3b2`, artifact `market-navigator-turn25-ship.html`, blob `8ebd766774d6e70011cdac0e40c2759eba8f5fc5`.


## 17. Standalone Analyze / ribbon permanent prohibitions

Never let an expanded-components breadcrumb consume enough ribbon width to hide a horizon or the `…` menu; use the compact `*` token with an accessible “Components” label. Never make the long-press Source action land on a generic HEALTH page when an exact source/model entry can be addressed. Never implement the Analyze action by mutating NOW breadcrumb/drill-down state. Never dismiss the standalone Analyze modal by outside click. Never create a second chart, evidence, AI, or Library engine merely to support the standalone modal; reuse the governed chart/evidence and existing AI/Library persistence paths.


### 17.1 Additional permanent prohibitions — standalone analysis and context evidence

Never let the standalone Analyze modal reuse or mutate NOW's horizon state. Never show ENV / index drill-down ancestry as the modal root; the selected series itself is the root. Never wait for AI completion before showing the Library card: the modal AI POV handoff must show the card as processing immediately. Never default Context & Further Reading closed in Library. Never omit its linked source body from print or Markdown download while showing only the source count.


### 17.2 Seeded-question overflow prohibition

Never size or position the Library seeded-question menu from the full viewport when that causes it to extend behind the navigation rail or outside the Library detail card. Never clip the first words of a seeded question or require horizontal scrolling to read it.


### 17.3 Context citation-marker prohibition

Never accept footnote markers, citation numbers, or source names without URLs as satisfying Context & Further Reading link requirements. Never make the user press the newspaper refresh merely to obtain the live links that the seeded context question itself requested.


### 17.4 Context-path divergence prohibition

Never implement `?` context retrieval and `📰` refresh as separate prompt-only behaviors. Never rely on the model to manufacture or remember URLs when a provider returns structured search results. Never accept a richer newspaper result than the equivalent seeded context result because the two controls used different retrieval paths.


## 18. Analytical-redesign permanent prohibitions — 2026-09-22

Do not:

- redefine RSK/GRW/MAC directly from a selected chart horizon;
- let changing 5D/MTD/YTD/1YR/etc. alter the canonical index value for the same calendar date;
- treat Rebase 100 as the canonical index definition;
- choose a permanent fixed-base anchor before component transforms, influence/scaling, and information-time treatment pass their gates;
- assume equal nominal weight means equal realized influence;
- silently rescale components to equalize influence without a governed, interpretable rule;
- accept a ratio transform merely because a series is positive;
- ratio-rebase signed/zero-centered measures or legitimate zero-crossing price series;
- describe percentage-point/basis-point measures solely through percent-of-level arithmetic when that distorts economic meaning;
- treat a stale monthly/weekly observation as “new information = zero” without exposing its information age;
- fabricate interpolated macro releases merely to create daily movement;
- place an economic observation into historical index time before the information was publicly available;
- overwrite historical index values with later revisions without explicit vintage semantics;
- change component membership or weights simply because a short horizon contains no new release;
- allow reconciliation of a reduced component set to masquerade as full model completeness;
- generate Plain, Standard, and Technical as three independently reasoned analyses that can disagree on facts or conclusions;
- implement the navigation/tab redesign before the analytical state contracts are stable;
- mutate the accepted Turn 26 application merely to accelerate the redesign before the applicable analytical gates pass.

The redesign must advance through the Master Plan program-control gates rather than through ad hoc patch accumulation.
