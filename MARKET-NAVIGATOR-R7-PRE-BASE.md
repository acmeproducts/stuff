# Market Navigator — Gate 4 R7 Pre-Base

Status: FROZEN PRE-BASE / NO IMPLEMENTATION DELTA
Date: 2026-08-31

## Authority
R7 starts only from:
1. `MARKET-NAVIGATOR-MASTER-PLAN.md`
2. `MARKET-NAVIGATOR-GRAVEYARD.md`
3. exact restored 3.9.7 baseline `market-view-gate4-r3.html` blob `99a2e5ebec8e31afeca4bfe4a75a3de21fb749f1`
4. approved Gate 3 P2 interaction donor `market-view-ux-gate3-p2.html` @ `cfba7320e42028f09f2967304cb0c0dd0cc2988d`
5. exact AI provider/config donor `devstream-test.html`
6. exact Analysis-conversation presentation donor `test.html`
7. canonical backend evidence after it is reconciled to the current Master Plan.

## Hard rule
**DO NOT PATCH FORWARD.** R4, R5 and R6 code, overlays, workflows, runtime assemblies, generated artifacts, shortcuts and validation logic are rejected evidence only and are not R7 implementation inputs.

Lifecycle: diagnose → Graveyard → Master Plan → restore baseline → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance.

## R6 rollback checkpoint
The rejected R6 HTML, JS, CSS, runtime JS and validation record have been removed from active `main`. R6-specific qualification/diagnostic/release workflows are being removed so no rejected lineage can republish itself.

## Required recovery before R7 UI implementation
1. Reconcile `data/market-backend/derived-index-definition.json` to the exact accepted Risk/Growth/Macro definitions in the Master Plan. Do not substitute available series for required series.
2. Audit the Data Catalog for every required component. Missing required components are backend gaps, not UI omissions.
3. Establish publication-aware health using latest publicly expected observation, actual canonical observation, collector result, persistence/cache result and horizon coverage/density.
4. Correct CPI and any other source where Health currently classifies stale canonical evidence as legitimate cadence lag.
5. Prove V1 → V2 → About → More info → Analysis using actual UI events before integrating later Gate 4 surfaces.
6. Reuse the donor provider/model state so CONFIG validation and POV/chat execution consume the same state.
7. Prove a real validated-provider → AI response round trip before release.

## First known backend gap
The currently active catalog/derived definition does not represent the accepted component contract. The rejected R6 definition used a different Risk/Growth/Macro composition. R7 must resolve catalog/source availability for the accepted components before any derived chart can be considered valid.

No R7 test URL may be issued until the current Master Plan release gate passes against the exact deployed candidate.
