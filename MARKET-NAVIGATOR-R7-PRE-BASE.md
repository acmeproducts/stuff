# Market Navigator — Gate 4 R7 Pre-Base

Status: SUPERSEDED BY CLEAN R7 BASE CANDIDATE
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

## R7 backend work completed before UI implementation
Clean R7 backend code has been added from the governed baseline/process rather than from R6:
- `market-navigator-r7-catalog-reconcile.py` reconciles the accepted component identities and canonical horizon vocabulary.
- `market-navigator-r7-data-pipeline.py` builds canonical source observations/reports/operational manifest without browser Yahoo/FRED reacquisition.
- `market-navigator-r7-health.py` builds a publication-aware health envelope using latest-publicly-expected observation, actual canonical observation, collection result and horizon readiness.
- `.github/workflows/market-evidence-pipeline.yml` now hard-gates the exact accepted component identities, CPI currentness and mixed-frequency truth before committing canonical evidence.

The first clean R7 backend qualification run was `33473034022`. Catalog reconciliation passed. The canonical evidence collector completed for every accepted component except PMI. Health generation completed. Publication/backend truth correctly blocked commit because PMI was unavailable. No partial reconciled backend was published as canonical.

## Historical PMI source blocker — resolved by owner contract change
The accepted Growth definition requires **PMI +1** and the Master Plan explicitly forbids silent component substitution.

The following candidate public sources were actually tested:
- FRED historical `NAPM` / ISM Manufacturing PMI: current fetch returns HTTP 404 / unavailable.
- FXMacroData documented USD PMI endpoint: HTTP 404 with `Unsupported currency (USD) or indicator (pmi)`.
- Trading Economics historical ISM Manufacturing PMI API using the former guest credential: HTTP 410; guest access has been discontinued and now requires a subscription/API credential.
- Repository search found no existing sanctioned PMI provider credential/integration that can be reused.

DBnomics exposes an ISM PMI dataset, but its published series is stale/invalid for this release path: it was retrieved in January 2026, ends in 2025, and contains anomalous late-2025 values. It cannot satisfy currentness/data-quality acceptance.

Therefore the exact accepted Growth index cannot yet be built truthfully from the available unauthenticated canonical sources. R7 must not substitute Industrial Production, another PMI, or an ETF proxy merely to obtain a green workflow.

### What unblocks this
One sanctioned source capable of supplying historical and current U.S. manufacturing PMI is required. Examples include a licensed Trading Economics/API source, another owner-approved provider with adequate historical coverage, or an approved change to the Growth component contract. Until one of those exists, Growth V1/V2 cannot pass the exact-component/data-truth gate.

## Required recovery after PMI is unblocked
1. Wire the approved PMI source into the catalog and R7 data pipeline.
2. Rerun the canonical backend workflow until the exact accepted component identity/currentness gates pass and commit the reconciled evidence.
3. Verify CPI and all other publication-aware Health classifications against the committed evidence.
4. Implement/prove V1 + V2 simultaneous NOW composition and direct V2 component → exact V3 using actual UI events.
5. Implement former V4 automatic native/Y1-Y2/Indexed behavior inside additive V3; do not create V4/V5 product pages.
6. Reuse the donor provider/model state so CONFIG validation and POV/chat execution consume the same authoritative state.
7. Prove a real validated-provider → AI request → persistent AI response round trip before release.

No R7 test URL may be issued until the current Master Plan release gate passes against the exact deployed candidate.

## Historical PMI licensing/source retry — 2026-09-01
The owner-directed rollback and retry rechecked the remaining PMI blocker before any new R7 UI implementation.

- The official ISM Manufacturing PMI report is publicly viewable, but ISM's published terms prohibit creating, recreating, distributing or incorporating the PMI index/content into another work without prior written authorization. Public-page scraping is therefore not a sanctioned canonical source.
- FRED is not a fallback: the Federal Reserve Bank of St. Louis removed all ISM Manufacturing and Non-Manufacturing series from FRED, its APIs and related services in June 2016. The missing historical NAPM endpoint is expected, not a transient collector defect.
- Trading Economics guest API access has been discontinued; the tested endpoint requires a licensed credential.
- S&P Global Manufacturing PMI is a different product and cannot silently replace the owner-approved ISM Manufacturing PMI component.

Authoritative references:
- https://www.ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/
- https://news.research.stlouisfed.org/2016/06/institute-for-supply-management-data-to-be-removed-from-fred/

**Historical result before owner decision:** R7 was blocked pending either a sanctioned source or an explicit Growth-contract change. The owner subsequently authorized the contract change recorded below.

## Owner-approved Growth definition change — 2026-09-01
The owner rejected a paid PMI subscription and explicitly authorized changing the Growth definition when no suitable open source replacement existed.

R7 therefore:
- excludes **ISM Manufacturing PMI** from Growth;
- replaces it with the Federal Reserve Board's open **Industrial Production: Manufacturing (NAICS)** series, canonical id `manufacturingProduction`, FRED identifier `IPMAN`;
- preserves the seven-component equal-weight Growth definition by replacing one governed component, not by reducing the denominator silently;
- records in derived-index metadata that IPMAN is a manufacturing-output measure and is **not** PMI;
- requires Growth V2/About/Analysis construction detail to state that PMI was explicitly excluded because a permissible free historical/current source was unavailable and that IPMAN is the owner-approved replacement.

This decision removes the PMI source blocker. Backend qualification must now collect IPMAN, prove its publication-aware Health state, regenerate the Growth index, and pass the full exact-component gate before R7 UI candidate work advances to ship.

## Backend qualification completed — 2026-09-02

The reconciled R7 backend now publishes canonical IPMAN evidence, the seven-component Growth definition, operational manifest, publication-aware Health envelope, and derived indices. The exact Growth identity gate passes. PMI remains disabled and explicitly excluded.

WTI remains part of the accepted Growth definition and is visible in the UI, but the ratio-rebased derived calculation omits it with the canonical reason that its history spans zero and ratio rebasing is structurally unstable. This is a disclosed degraded state, not a silent component removal.

## Clean R7 base candidate — 2026-09-02

`market-view-gate4-r7.html` is the new single-file candidate. It was rebuilt from the exact preserved 3.9.7 baseline and current governed inputs without patch-forward from rejected R4/R5/R6 application code.

Local deterministic qualification passes, including the common canonical boot, exact Growth/IPMAN contract, one chart engine, download integrity, and the 105-state axis audit. See `MARKET-NAVIGATOR-R7-VALIDATION.md`.

The candidate is ready for the deployed owner-visible UI and real saved-provider AI gates. It is not post-ship accepted until those gates pass and the owner accepts it.
