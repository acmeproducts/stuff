# Market Navigator — Graveyard

Status: REJECTED APPROACHES / DO NOT PATCH FORWARD
Updated: 2026-09-03

This file is a negative specification. A rejected implementation, workflow, validation technique, layout decision or analytical shortcut is historical evidence only. It is not a successor baseline.

## Permanent process rule
**DO NOT PATCH FORWARD FROM A REJECTED RELEASE.**

Required cycle:

**diagnose → record failure here → update Master Plan → restore approved baseline → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance**

A rejected ship is rolled back. It does not become the next pre-base.

## Current recovery authority
The owner-approved `MARKET-NAVIGATOR-NOW-EXPLORE-CONTRACT.md` dated 2026-09-03 supersedes older conflicting V1/V2/V3 geometry. Recovery starts from the last working pre-governance Market Navigator 3.9.7 lineage, not from any rejected Gate 4 release.

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
Do not patch R12. Recover the working pre-governance chart implementation and make only the governed navigation/V2 changes.

## G4-R13 — Rejected layered compatibility patch
**Rejected implementation:** `market-view-gate4-r13.html` + `market-view-gate4-r13-patch.js`; both removed from active main on 2026-09-03.

### Root cause
R13 violated the recovery process by loading the historical product and then stacking compatibility patches around it instead of modifying the known-good implementation directly.

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
**Recovery means direct descent from the exact last-good pre-spiral implementation. No wrapper, compatibility patch, iframe patch injection, or rejected-release code may sit between that baseline and the next candidate.**

The intended product delta is narrow:
1. preserve the known-good chart/data/horizon behavior;
2. breadcrumbs at top; no dedicated Back-to-Market button;
3. V1 Market occupies the primary chart footprint;
4. selecting RSK/GRW/MAC replaces that footprint with V2;
5. V2 uses the existing working multi-series comparison behavior and adds the selected governed index curve to the governed component curves;
6. component selection opens the compact V2 information card;
7. More info opens exact-component V3 and close restores exact V2 state.

## Permanent prohibited patterns
- patching any rejected release forward;
- wrapper/iframe/compatibility-patch recovery builds;
- arbitrary application-frame redesign;
- stacked V1 + V2 when the 2026-09-03 contract requires replacement;
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
