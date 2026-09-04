# Market Navigator — Graveyard

Status: REJECTED APPROACHES / DO NOT PATCH FORWARD
Updated: 2026-09-04

This file is a negative specification. A rejected implementation, workflow, validation technique, layout decision or analytical shortcut is historical evidence only. It is not a successor baseline.

## Permanent process rule
**DO NOT PATCH FORWARD FROM A REJECTED RELEASE.**

Required cycle:

**diagnose → record failure here → update Master Plan → restore approved baseline → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance**

A rejected ship is rolled back. It does not become the next pre-base.

## Current recovery authority
The authoritative baseline is the current product contract in `MARKET-NAVIGATOR-MASTER-PLAN.md` plus `MARKET-NAVIGATOR-NOW-EXPLORE-CONTRACT.md`. Historical implementations are capability-specific donors only. Market Navigator 3.9.7 is a chart/data donor; PRISM R25 is an application-shell/Library donor. Neither historical file is the application baseline by itself.

The next product candidate must be a clean coherent application assembled from qualified donor capabilities and canonical evidence. It must not descend from any rejected Gate 4 release or rejected Turn 01 shell.

## G4-R1 through G4-R10 — rejected historical lineage
All Gate 4 R1 through R10 implementations are evidence only. Their previously documented failures remain binding, including standalone rewrites, arbitrary layout changes, misleading charts, synthetic/fallback evidence, incorrect V1/V2 geometry, component-menu V2 implementations, direct component→V3 transitions where superseded, and validation that proved structure rather than owner-visible behavior.

R7-R10 are explicitly prohibited as implementation ancestors by the 2026-09-03 NOW/EXPLORE recovery contract.

## G4-R11 — Rejected runtime/syntax lineage
R11 was rejected and rolled back. It is not an implementation ancestor. The release did not establish a trustworthy browser-booted, owner-visible implementation of the current V1→V2 replacement contract.

## G4-R12 — Rejected standalone rewrite
**Rejected implementation:** `market-view-gate4-r12.html` and companion JS.

### Owner-observed / diagnosed failures
- chart behavior and series completeness regressed from the previously working product;
- 5D, MTD and YTD were not comprehensively qualified;
- unwanted `Back to Market` control instead of the requested breadcrumb navigation;
- rewritten chart/data behavior instead of recovery of the known-good implementation;
- incomplete product capability and insufficient browser qualification.

### Recovery
Do not patch R12. Recover only independently qualified donor capabilities and apply them to the clean current product architecture.

## G4-R13 — Rejected layered compatibility patch
**Rejected implementation:** `market-view-gate4-r13.html` + `market-view-gate4-r13-patch.js`; both removed from active main on 2026-09-03.

### Root cause
R13 violated the recovery process by loading the historical product and then stacking compatibility patches around it instead of building the governed product directly.

### Specific failures
- per-series horizon endpoints instead of one common horizon clock/X-domain;
- derived index averaged whatever observations existed on a date, causing changing component population/weights;
- slow-frequency components with fewer than two in-window observations became false `GAP`s;
- seven horizons were cosmetically injected rather than reconciled through the chart engine;
- a new V2 canvas/composition path duplicated/replaced known-good comparison behavior;
- point inspection inherited incompatible legacy behavior;
- component metadata was hard-coded into another source of truth;
- failed/missing series fetches were silently swallowed;
- More info delegated to legacy detail behavior rather than proving exact V3 state/return;
- browser deployment success was incorrectly treated as sufficient readiness despite known product defects.

### Permanent lesson
**Use historical implementations as qualified donors, never as an excuse for wrapper recovery or rejected-release ancestry.** The clean application must implement the current contract directly with one shell, one state model, one chart engine and canonical evidence.

## Turn 01 shell-only release — rejected 2026-09-04
**Rejected implementation:** `market-navigator-turn01-base.html`, blob `60d5d3658ce2725cadd30fd18a1d1be0319a2e61`; removed from active `main` after owner review.

### Failure
The build satisfied a self-imposed structural shell gate but was not a meaningful product increment. It exposed empty placeholder surfaces for NOW, EXPLORE, LIBRARY, HEALTH and CONFIG and then was incorrectly handed to the owner as a test release.

### Root cause
The stage was decomposed too narrowly. “Application frame” was interpreted as permission to ship empty navigation instead of constructing the first coherent usable vertical slice. Mechanical checks proved only that an empty shell routed correctly; they did not prove Market Navigator functionality.

### Permanent lesson
- A base presented for owner testing must contain a meaningful end-to-end product capability, not placeholders.
- Structural shell qualification is an internal pre-base gate, never sufficient for an owner test URL.
- The first owner-testable clean build must include at minimum the real NOW V1 three-index chart, real canonical evidence, all seven horizons, correct common X-domain, inspection, and enough permanent application navigation to prove the intended surface.
- Empty future-mode placeholders do not count as implemented product capability.
- Confidence claims must be against the owner-visible product requirement, not merely a narrow internal stage definition.

## Permanent prohibited patterns
- patching any rejected release forward;
- wrapper/iframe/compatibility-patch recovery builds;
- arbitrary application-frame redesign;
- empty-shell or placeholder-only owner test releases;
- stacked V1 + V2 when the contract requires replacement;
- fake fourth Market index;
- V2 as a single index line plus component-navigation pills;
- direct V2 component → V3 without the information-card bridge;
- recreating V4 or V5 as product states;
- silent derived-index component substitution;
- cadence-only Health classification;
- stretched/fabricated slow-frequency source observations;
- duplicate chart engines;
- missing/incorrect X/Y1/Y2 axes;
- all-series inspection popup;
- stale inspection surviving context change;
- browser-side canonical Yahoo/FRED reacquisition when persisted canonical evidence is authoritative;
- release gates that validate labels/DOM/syntax/deployment rather than actual owner-visible behavior;
- handing the owner any release with known data, chart, journey, AI or layout defects.
