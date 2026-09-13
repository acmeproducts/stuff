# Market Navigator — Graveyard

Status: NEGATIVE SPECIFICATION
Updated: 2026-09-13

Historical rejected releases remain evidence only; detailed descriptions remain in git history.

## Permanent recovery rule
**DO NOT PATCH FORWARD FROM A REJECTED APPLICATION RELEASE.**

When owner testing exposes a material regression, the next recovery starts from the last artifact that actually proved the affected capability. Current `main` remains the integration/data target; rejected application source may be inspected for requirements and failure evidence but is not a successor baseline or donor implementation.

For the current recovery:
- approved rollback application release: **Turn 18**
- qualified release commit: `97b8c028778f36380de821591e3d6c8125fb14f9`
- approved application baseline: `market-navigator-turn18-pre-ship.html`
- approved application blob: `4a52c7e764513024176aea80cc13c56e05370c11`
- rejected as application recovery donors: **Turns 19, 20, 21, 22, 23 and 24**
- execution authority: **`MARKET-NAVIGATOR-MASTER-PLAN.md` only**

There is no separate recovery-plan document.

## Permanent test-integrity rule
A test may not claim to cover a capability by asserting only adjacent UI state.

Permanently rejected examples:
- TTS test that stubs `speechSynthesis.speak()` as a no-op and then checks only that Play changed to Pause;
- data-source test that checks a green Health label without proving chart/selectability/evidence behavior;
- AI test that checks navigation without proving provider request/result persistence;
- resize test that checks width without proving horizon/composition/evidence invariance;
- persistence test that checks a toast without re-reading durable state.

For Library Listen/TTS, qualification must observe a non-empty utterance handed to the speech engine mock and must exercise response/row transport. A cosmetic button-state assertion is insufficient.

**Never weaken a retained regression test when carrying a capability forward.** A replacement gate must be at least as semantically strong as the gate it supersedes.

## Current retired product patterns
- numbered V1/V2/V3/V4/V5 terminology in the intended product
- separate Explore analytical mode in the intended product
- separate Component analytical page/modal in the intended product
- duplicated-index breadcrumbs such as `ENV / GRW / GRW`
- default-selected RSK on ENV load
- breadcrumb wrapping/displacement of horizons/menu
- raw-source direction inversion
- synthetic/fallback chart evidence
- duplicate chart/discovery/AI state engines
- clipped mobile Listen controls
- fake MP3 export from browser speech synthesis

## Retained intended architecture
The intended reconstructed product remains one NOW chart workspace with neutral ENV and one anchored-index context. Anchored state may be collapsed (`ENV / GRW`) or expanded (`ENV / GRW / COMPONENTS`). `COMPONENTS` is a non-clickable state marker.

ENV has RSK, GRW and MAC visible with no default selected chip. In anchored context the anchor cannot be removed; component/comparison chips are removable; Add is available; Add discovery replaces Explore.

Library owns a frozen chart, transcript, continuation composer and Listen/Chat modes. The Listen strip contains centered progress plus exactly five transport controls and no duplicate analysis title.

Browser TTS remains playback-only. Downloadable MP3 remains backlog until a real file-producing TTS provider exists.

## Retained analytical rules
Raw/source Indexed 100 is plain relative rebasing. Derived-composite direction affects composite construction only and never source display.

Display density remains native for 1D/5D/MTD, weekly for YTD/1YR, and monthly for 3YR/5YR without altering canonical evidence or full-resolution inspection/Data/AI/export.

No fabricated intraday evidence, forward fill, horizon-end restamping, or proxy substitution.

## Turn 19 qualification regression — permanent lesson
Turn 18 qualification imported the complete Turn 17 regression matrix, including an observable TTS mock and the assertion that `window.__qaSpeech.last.text` contains spoken content after Play.

Turn 19 replaced that protection with a speech mock whose `speak()` performed no observable action. Subsequent tests could pass by seeing only the UI enter a playing state. That weakening propagated into later retained matrices and allowed Turn 24 to be declared green even though owner/device TTS was broken.

Permanently prohibited:
- replacing a semantic capability assertion with a cosmetic assertion;
- claiming a retained-product matrix when retained gates were silently weakened;
- treating a green CI run as evidence for behavior the harness never observed;
- promoting a release to last-known-good for a capability that was not actually qualified.

## Turn 23 implementation patterns permanently rejected
- rail handlers that guess canvas size or rely on fixed delays;
- NOW layouts that recenter vertically or leave dead top/bottom space during rail changes;
- ResizeObserver/rail/orientation/viewport events invoking full analytical render or evidence fetch;
- geometry changes mutating horizon, composition, active series, breadcrumb, representation or frozen evidence;
- one view manipulating another view's private DOM as navigation;
- live references to retired DOM IDs;
- AI provider preflight that throws because retired Config/modal DOM is missing;
- AI happy-path-only qualification;
- resize qualification without horizon changes, repeated transitions and analytical invariants;
- repopulating saved provider secrets into ordinary editable password fields;
- local-only custom tickers bypassing canonical evidence/Health/revisions/Library reproducibility;
- provider-per-horizon economic identity switching;
- silent symbol/proxy substitution, including ambiguous DOW;
- treating price, total return, index level and NAV as interchangeable;
- fabricated intraday points for daily/NAV-only sources;
- declaring qualification from static markers and successful paths while owner-visible failure paths remain untested.

## Turn 24 status
Turn 24 is rejected as the active application successor because owner testing found broken TTS after the release had passed its automated gates.

Turn 24's accepted written requirements remain requirements only: unified NOW, geometry-only resizing, AI transition recovery, credential-safe Config, canonical Sources, DOW→DJIA identity, and Config-created source handling. Those requirements may be reconstructed from the Master Plan after Turn 18 rollback qualification and owner/device confirmation.

Turn 24 application HTML/JS/CSS is not a donor for that reconstruction.

## Current recovery sequence
**exact Turn 18 artifact → exact blob proof → full Turn 17 + Turn 18 semantic qualification → Pages rollback URL → owner/device test → clean reconstruction from written requirements only**.

Do not begin successor application mutation before the rollback baseline is proved.

## Turn 25 permanent cumulative-release rule
Rollback changes the executable baseline; it does not roll back approved product requirements.

Permanently rejected:
- recovering one broken capability by publishing a baseline that silently drops other approved capabilities;
- reintroducing approved improvements over a sequence of owner-facing releases where each step can regress previously accepted behavior;
- using a rejected application release as a code donor merely because it contains a desired feature;
- declaring a retained capability green without carrying forward its strongest semantic regression gate;
- publishing an intermediate reconstruction candidate that is knowingly missing items from the cumulative acceptance ledger.

The next owner-facing successor after a rollback must be one cumulative candidate: proven baseline behavior plus every still-approved later requirement, qualified together. If one cumulative gate fails, correct the same candidate; do not create a new partial rung in the release ladder.

