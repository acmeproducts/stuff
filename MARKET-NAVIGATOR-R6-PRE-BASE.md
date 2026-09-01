# Market Navigator — Gate 4 R6 Pre-Base

Status: FROZEN PRE-BASE / NO IMPLEMENTATION DELTA
Date: 2026-08-31

## Purpose
R6 begins from a clean governed lineage after rejection and rollback of R5. This checkpoint is intentionally documentation-only. It freezes what R6 may use before any application implementation is changed.

## Authorities
1. `MARKET-NAVIGATOR-MASTER-PLAN.md` — current authoritative product definition.
2. `MARKET-NAVIGATOR-GRAVEYARD.md` — rejected approaches; DO NOT PATCH FORWARD.
3. `MARKET-NAVIGATOR-FROZEN-CONTRACT.md` — historical/frozen product semantics that remain useful where not superseded by the current Master Plan.
4. `market-view-gate4-r3.html` and `market-view.html` — restored 3.9.7 implementation baseline; preserve application frame/runtime unless the Master Plan explicitly supersedes it.
5. `market-view-ux-gate3-p2.html` — approved Gate 3 interaction donor.
6. `devstream-test.html` — exact AI provider/model configuration donor.
7. `test.html` — exact Analysis conversation presentation donor.
8. Canonical evidence under `data/market-backend/`.

## No-patch-forward rule
R6 MUST NOT descend from R4 or R5 HTML, JS/CSS overlays, workflows, generated artifacts, layout decisions, or validation records. A rejected release is evidence for diagnosis only. It is never the next baseline.

Lifecycle: diagnose → update Graveyard where a failed approach is learned → update Master Plan before changing the contract → return to approved baseline → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance. A rejected ship is rolled back and does not become the next pre-base.

## R6 pre-base invariants
- No arbitrary application-frame/layout changes.
- One canonical chart engine; preserve 3.9.7 chart/runtime foundations unless explicitly superseded.
- V1 = RSK/GRW/MAC; V2 = selected index + every governed component; V3 = additive Analysis.
- Seven governed horizons are `1D, 5D, MTD, YTD, 1YR, 3YR, 5YR` per current Master Plan. Backend catalog naming discrepancies are defects to reconcile, not permission to change UI semantics.
- Direct series terminate at their latest real observation; no slow-frequency stretching.
- Health is root-cause diagnosis, not a status table.
- AI POV performs evidence-health preflight before interpretation and preserves the earlier evidence-bounded POV principle: observations and interpretation remain distinct; unsupported certainty is prohibited.
- AI provider/model behavior is copied from the exact donor rather than approximated.
- Everything below the Analysis chart is the timestamped ongoing conversation + persistent composer; POV is its opening AI turn.
- Explore and Add Series are two presentations of one discovery implementation.
- Library restores exact analytical/evidence/conversation state.

## Backend diagnosis captured before implementation
Current canonical files already expose a concrete architectural gap that explains why R5 Health could say `healthy` while the product could still display bad/stale evidence:

- `source-health.json` classifies collector transport/execution health. Example: `macro:cpi` is `healthy`, HTTP 200, failureCount 0, lastSuccess `2026-08-31T13:44:32Z`, cadence monthly.
- That collector status does NOT prove the latest expected economic observation is present. It lacks a publication expectation / latest-publicly-expected observation comparison and does not itself report the latest canonical observation date.
- `data-catalog.json` declares cadence and source identity but currently does not encode a deterministic publication-lag/expected-release rule for CPI sufficient to distinguish `expected-lag` from `stale`.
- `market-manifest.json` is file-level and does not currently carry the series-level runtime fields promised by the catalog contract.

Therefore R6 must not infer analytical health from collector HTTP success. The health envelope must reconcile catalog definition + canonical observations + collector attempt/success + expected publication availability + horizon coverage/density. Only that reconciled state may feed chart degradation and AI POV.

## Additional contract discrepancy requiring deliberate reconciliation
The current `data-catalog.json` still declares horizons `1D, 5D, 1M, YTD, 1Y, 3Y, 5Y`, while the current Master Plan governs `1D, 5D, MTD, YTD, 1YR, 3YR, 5YR`. R6 must reconcile backend horizon semantics to the Master Plan before release. Do not silently map labels in the UI while leaving conflicting backend semantics undocumented.

## Historical AI POV recovery
The turnover identified prior substantive POV work in a historical `market-view-v32.html`. That exact path is not present on current `main` and repository code search did not locate it under that name. Do not invent its code. Preserve the governed concepts already captured in the Master Plan/turnover: bounded supplied evidence, observed facts separated from interpretation, current-regime explanation, tailwinds/headwinds, uncertainty, what-to-watch-next, evidence/model persistence, and evidence-health preflight. If the historical artifact is recovered from Git history, it is a donor only, never a baseline.

## First implementation gate
Before creating `market-view-gate4-r6-*` implementation files:
1. capture baseline visual/application-frame geometry from 3.9.7 and approved Gate 3 P2;
2. define the reconciled series-health envelope and publication-expectation fields;
3. reconcile horizon vocabulary/semantics;
4. inspect exact AI/config and conversation donors;
5. map each intended UI delta to a specific Master Plan clause.

No R6 candidate may be handed to the owner until the complete release validation matrix in the Master Plan passes against the exact deployed candidate.
