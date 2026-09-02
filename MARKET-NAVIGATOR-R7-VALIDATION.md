# Market Navigator — Gate 4 R7 Validation

Status: PRE-SHIP CANDIDATE QUALIFIED / OWNER UI + LIVE AI GATES PENDING
Date: 2026-09-02

## Candidate

- UI artifact: `market-view-gate4-r7.html`
- Build marker: `2026.09.02-g4-r7-base`
- Architecture: existing single-file GitHub Pages application
- Clean lineage: exact restored 3.9.7 baseline plus current Master Plan, accepted chart matrix, approved Gate 3 interaction reference, canonical R7 evidence, `devstream-test.html` CONFIG behavior, and `test.html` conversation presentation
- Rejected R4/R5/R6 application code is not imported, linked, or executed

## Preserved baseline

`market-view-gate4-r3.html` remains byte-identical at blob:

`99a2e5ebec8e31afeca4bfe4a75a3de21fb749f1`

## Automated qualification

| Gate | Result | Evidence |
| --- | --- | --- |
| JavaScript parse | PASS | Extracted inline script passes `node --check` |
| Repository diff hygiene | PASS | `git diff --check` |
| One chart engine | PASS | Exactly one `drawChart` implementation serves V1, V2, and V3 |
| Canonical boot | PASS | VM DOM/canvas harness loads catalog, definition, manifest, Health, derived indices, and canonical series without an unhandled rejection |
| Horizon vocabulary | PASS | Exact `1D, 5D, MTD, YTD, 1YR, 3YR, 5YR` |
| Systematic axis audit | PASS | 105 checks: five analytical states × seven horizons × X/Y1/Y2 |
| V3 automatic representation | PASS | One native series; CPI + WTI native Y1/Y2; CPI + WTI + VIX Indexed 100 with no Y2 |
| Growth identity | PASS | Exact ordered components: `qqq, copper, smallCaps, manufacturingProduction, wti, unemployment, payrolls` |
| PMI exclusion | PASS | Catalog PMI entry is disabled; visible Growth construction detail links IPMAN and explicitly states that it is not PMI |
| WTI degradation truth | PASS | WTI remains visible in Growth and the canonical zero-spanning ratio omission is surfaced instead of hidden |
| Browser reacquisition | PASS | No browser Yahoo/FRED canonical-data fetch path |
| Latest observation truth | PASS | Ending values use the latest actual canonical source date/value and label values outside the selected horizon |
| Download integrity | PASS | Export includes every exact active-horizon observation; no report-data truncation |
| CONFIG execution identity | PASS | Active engine validation is bound to the exact provider, model, and key fingerprint consumed by execution |
| Analysis persistence | PASS | Root, series, active series, horizon, automatic representation, overlay, AI POV, and conversation persist in the same analysis object |

## Owner-visible gates still required

These cannot be honestly claimed by a credential-free static harness:

1. Desktop and mobile owner interaction review against the deployed artifact.
2. A real saved-key CONFIG validation followed by a successful provider → AI POV → persistent response round trip.
3. Owner acceptance before post-ship qualification or canonical-page promotion.

The supervised preview service cannot launch this intentionally static repository because it has no `package.json`; adding a new build stack solely for preview would violate the preserved architecture. The candidate therefore advances to the existing GitHub Pages path for the owner-visible gates above.
