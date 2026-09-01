# Market Navigator — Gate 4 R7 Pre-Base

Status: FROZEN PRE-BASE / NO IMPLEMENTATION DELTA
Date: 2026-08-31

## Authority
R7 starts only from:
1. `MARKET-NAVIGATOR-MASTER-PLAN.md`
2. `MARKET-NAVIGATOR-GRAVEYARD.md`
3. `MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md` where not superseded by the current Master Plan
4. exact restored 3.9.7 baseline `market-view-gate4-r3.html` blob `99a2e5ebec8e31afeca4bfe4a75a3de21fb749f1`
5. approved Gate 3 P2 interaction reference `market-view-ux-gate3-p2.html` @ `cfba7320e42028f09f2967304cb0c0dd0cc2988d`
6. exact AI provider/config donor `devstream-test.html`
7. exact Analysis-conversation presentation donor `test.html`
8. canonical backend evidence only after it is reconciled to the current Master Plan.

## Hard rule
**DO NOT PATCH FORWARD.** R4, R5 and R6 code, overlays, workflows, runtime assemblies, generated artifacts, shortcuts and validation logic are rejected evidence only and are not R7 implementation inputs.

Lifecycle: diagnose → Graveyard → Master Plan → restore baseline → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance.

## R6 rollback checkpoint
Rejected R6 HTML, JS, CSS, generated runtime JS, validation record and R6 qualification/diagnostic/release workflows have been removed from active `main`. R6 cannot republish itself.

## Accepted analytical lineage
The owner-confirmed lineage is:

**V1 Market + V2 selected Index simultaneously in NOW → direct V2 component → exact V3 Component Analysis → additive/multi-series V3 Analysis.**

- V1 remains visible while V2 changes below it.
- V2 is not a peer top-level page.
- Direct V2 component → exact V3 is accepted.
- Historical V4 automatic multi-series capability is collapsed into V3.
- Historical V5 is abandoned and must not return as a separate state.

## Required recovery before R7 UI implementation
1. Reconcile `data/market-backend/derived-index-definition.json` to the exact accepted Risk/Growth/Macro definitions in the Master Plan. Do not substitute available series for required series.
2. Audit/reconcile the Data Catalog for every required component. Missing required components are backend gaps, not UI omissions.
3. Establish publication-aware health using latest publicly expected observation, actual canonical observation, collector result, persistence/cache/manifest result and horizon coverage/density.
4. Correct CPI and any other source where Health currently classifies stale canonical evidence as legitimate cadence lag.
5. Prove V1 + V2 simultaneous NOW composition and direct V2 component → exact V3 using actual UI events before integrating later Gate 4 surfaces.
6. Implement former V4 automatic native/Y1-Y2/Indexed behavior inside additive V3; do not create V4/V5 product pages.
7. Reuse the donor provider/model state so CONFIG validation and POV/chat execution consume the same authoritative state.
8. Prove a real validated-provider → AI request → persistent AI response round trip before release.

## Known backend gap
The currently deployed catalog/derived definition does not represent the accepted component contract and uses legacy horizon vocabulary. R7 backend work must repair those definitions and acquire the missing accepted source series before any derived chart can be considered valid.

No R7 test URL may be issued until the current Master Plan release gate passes against the exact deployed candidate.
