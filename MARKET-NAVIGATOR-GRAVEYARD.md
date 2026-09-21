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
