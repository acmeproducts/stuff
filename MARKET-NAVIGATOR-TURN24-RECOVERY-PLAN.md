# Market Navigator — Turn 24 Recovery Plan

Status: AUTHORITATIVE RECOVERY PLAN — EXECUTION REQUIRES OWNER GREEN LIGHT
Updated: 2026-09-12
Branch: `market-navigator-turn24-recovery`

## 1. Recovery baseline
Turn 24 will start from the last known good Market Navigator application release:

- release: **Turn 22**
- merge commit: `0d0681b74b55d35723ca8f2a220474a512175461`
- application source: `market-navigator-turn22-pre-ship.html`

Turn 23 is rejected as an application successor baseline. Its HTML/JS/CSS will not be patched forward and will not be used as the donor source for Turn 24.

Current `main` remains the integration target so unrelated repository/data movement is preserved. Turn 24 application construction, however, begins by copying the qualified Turn 22 application source into a new Turn 24 candidate and applying only explicitly governed changes.

## 2. What failed in Turn 23
Two release-blocking regressions escaped qualification:

1. **AI POV launch regression** — live `startAI()` still referenced a retired `settingsModal` DOM object. Provider preflight could therefore throw before navigation instead of opening the AI Config state cleanly.
2. **NOW geometry regression** — the new `ResizeObserver` called the full analytical renderer. After horizon changes, rail open/close could re-enter analytical rendering merely because the canvas container changed size, coupling geometry to state/data work and producing visible shifts.

The underlying process failure was insufficient qualification coverage: the AI suite exercised the registered-provider happy path but not incomplete/unregistered provider preflight, and the resize suite did not sufficiently combine horizon changes with repeated rail transitions while asserting analytical-state invariance.

## 3. Recovery rules
- No patch-forward from Turn 23 application code.
- No runtime monkey patch, overlay, wrapper, iframe, alternate state machine, or compatibility shim.
- No UI element may be removed while live code still references it.
- NOW, CONFIG, and LIBRARY communicate through explicit state/navigation functions; one view may not manipulate another view's DOM as a navigation mechanism.
- Resize/rail/orientation events are geometry events only. They may repaint the existing chart model but may not fetch evidence, rebuild analytical state, mutate horizon/composition/active series, or recapture AI evidence.
- Every owner-visible state transition changed by the release must have both normal-path and failure/edge-path browser coverage.

## 4. Turn 24 implementation sequence
Execution does not begin until owner approval.

### Phase A — restore and prove Turn 22 baseline
1. Copy `market-navigator-turn22-pre-ship.html` from the exact Turn 22 merge into `market-navigator-turn24-pre-ship.html`.
2. Run the full retained Turn 22 browser/product matrix before any new feature work.
3. If the copied baseline does not reproduce Turn 22 behavior, stop and diagnose; do not proceed.

### Phase B — responsive NOW geometry, cleanly reimplemented
1. Keep the chart card pinned to the available NOW workspace at all times.
2. Separate the current analytical chart model from pixel geometry/painting.
3. Horizon/composition changes may rebuild the chart model.
4. `ResizeObserver` may only schedule a `requestAnimationFrame()` repaint of that existing model.
5. Rail open/close, viewport resize, rotation and split-screen may not call the analytical renderer or trigger source fetches.
6. Preserve horizon, visible series, active series, breadcrumb state and frozen evidence across geometry changes.

### Phase C — AI POV launch/navigation contract
1. Preserve the working Turn 22 AI launch path as the donor behavior.
2. Define one provider-preflight function that returns a structured result; it does not manipulate unrelated DOM.
3. Registered provider: freeze exact visible NOW state, persist Analysis, navigate to LIBRARY, show processing state, complete or record provider failure.
4. Missing/unverified provider: navigate to CONFIG → AI through the normal navigation API, show an actionable status, create no Analysis record, and throw no console exception.
5. LIBRARY owns Library presentation; CONFIG owns Config presentation; `startAI()` owns neither view's DOM.

### Phase D — credential UX
Reapply the approved credential behavior from requirements, not from Turn 23 implementation:

- saved provider keys are not repopulated into normal editable credential fields;
- registered provider/model status remains visible;
- explicit **Replace key** enters temporary replacement mode;
- cancelling replacement leaves the registered credential untouched;
- validation is required before replacement becomes authoritative.

### Phase E — Sources, only after recovery gates are green
The approved Sources product contract remains valid, but the Turn 23 implementation is not a donor.

Reimplement from the documented contract only:

`entered symbol/name → canonical identity resolution → instrument class → compatible provider cascade → canonical evidence → Health/provenance → horizon capability → Add`

V1 supported classes remain market indices, equities, ETFs, and fund/CIT/NAV vehicles. Examples remain Dow/DJIA, GAAMHX, V, NVDA, VRT, VOO and T. No silent proxy substitution, provider-per-horizon identity switching, local-only evidence, or fabricated intraday data.

Sources work must not begin until Phases A–D and their release-blocking gates are passing.

## 5. Mandatory Turn 24 qualification
The candidate is not publishable unless all of the following pass against the exact committed artifact.

### Baseline regression matrix
Retain the complete Turn 22 matrix: neutral ENV, all three anchored-index lifecycles, Add, all seven horizons, source-relative Indexed 100, WTI/GDP truthfulness, Data/correlation, exact visible-state AI evidence, Library frozen chart/transcript/composer/TTS, Config chart controls, canonical six-command menu, and stale-render protection.

### AI POV matrix
- registered and verified provider → AI POV launches, Analysis is created, LIBRARY opens, processing resolves;
- provider missing key → CONFIG → AI opens with status, no Analysis artifact, no exception;
- provider unverified → same clean Config path;
- provider call failure after launch → persisted Analysis becomes failed with visible error, application remains usable;
- no live selector/reference to retired DOM nodes;
- no uncaught application exception in console.

### Geometry/state matrix
At desktop, tablet and phone widths, and in ENV plus RSK/GRW/MAC anchored states:

1. set each representative horizon, including 5D, 1YR and 5YR;
2. open/close/open the left rail repeatedly;
3. verify chart-card top and bottom stay fixed to the available workspace;
4. verify canvas dimensions equal the current container after transition;
5. verify horizon, breadcrumb, visible series, active series and representation are unchanged by resize;
6. verify resize does not increase canonical evidence fetch count or create a new analytical render generation;
7. repeat after switching horizons immediately before rail transitions.

### Credential matrix
- registered provider renders no populated reusable secret field;
- Replace key is explicit, reversible and non-destructive until validation;
- password-manager/autofill suppression attributes are present on temporary replacement input;
- AI execution continues to use the registered credential when replacement mode is not active.

### Sources matrix
Only after recovery gates pass: resolver identity, provider cascade, persisted evidence/Health, horizon capability and Add discoverability are tested using deterministic fixtures plus one real registration path where available.

## 6. Publication sequence
1. Fetch current `main` immediately before integration.
2. Preserve unrelated current-main movement.
3. Merge only the qualified Turn 24 delta.
4. Run the same release-blocking browser matrix against the exact merged-main artifact.
5. Verify GitHub Pages deployment for the exact current main containing Turn 24.
6. Return the cache-busted public URL and exact merge SHA only after all gates pass.

## 7. Stop conditions
Do not publish if any of these occur:

- any uncaught Market Navigator console exception;
- any AI path references a retired/missing DOM element;
- geometry events call analytical/data-fetch code;
- rail transition changes analytical state;
- Turn 22 retained behavior regresses;
- Sources work requires weakening canonical evidence/provenance rules;
- exact merged-main qualification differs from branch qualification.

## 8. Scope control
Turn 24 is a recovery release first. No unrelated feature work or visual redesign is allowed. The purpose is to recover from Turn 22, reintroduce the approved Turn 23 requirements with clean boundaries, prove them comprehensively, and only then publish.