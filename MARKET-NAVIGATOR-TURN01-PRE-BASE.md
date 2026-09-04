# Market Navigator — Turn 01 Pre-Base Qualification

Status: QUALIFIED PRE-BASE
Date: 2026-09-04

## Purpose
Turn 01 establishes the clean application shell from the current Master Plan before any chart logic is added.

This stage does **not** descend from rejected Gate 4 code and does not use a wrapper, overlay, iframe, runtime compatibility patch, or patch-forward technique.

## Authorities
1. `MARKET-NAVIGATOR-MASTER-PLAN.md`
2. `MARKET-NAVIGATOR-BUILD-PROTOCOL.md`
3. `MARKET-NAVIGATOR-GRAVEYARD.md`
4. `MARKET-NAVIGATOR-NOW-EXPLORE-CONTRACT.md`

## Donor qualification
### PRISM R25 — shell donor only
Reference: `prism/prism-turn01-pre-ship-r25.html` at `da6442f2702a5e681367884d403a5d14251f2da8`.

Qualified capabilities:
- collapsible left rail;
- full-height application shell;
- compact top surface;
- persistent mode switching;
- no-page-scroll primary workspace geometry;
- Library/transcript/drawer patterns for later stages.

Explicitly excluded:
- PRISM event/news domain model;
- sphere/treemap behavior;
- PRISM filters and ribbon semantics;
- PRISM content taxonomy.

### Market Navigator 3.9.7 — chart/data donor only
Reference: `market-view.html` at `c7bf516af9a3ed43233f5aeb5c63b6c2d53c7180`.

Not used as Turn 01 application ancestry. Its chart/data mechanics are reserved for later direct source extraction and qualification.

## Canonical data finding before UI work
The current persisted `market-data/model.json` is **not** the current governed index authority. It still contains an older relative-score model with different component sets and weights.

The current governed definition is `data/market-backend/derived-index-definition.json`, which defines the owner-approved seven-component Risk/Growth/Macro sets and equal weighting.

The persisted `market-data/indexes/` directory contains Risk/Growth/Macro generated artifacts, but those artifacts must be verified against the current governed definition before V1 consumes them.

The newer `market-evidence/` chain contains reconciled governed series such as `manufacturingProduction` and is the preferred evidence line to qualify before chart binding.

## Known contract inconsistency to resolve before V1
The current governed definition still contains legacy display language saying V2 is displayed “below V1.” The Master Plan supersedes this: **V2 replaces V1 in the same chart footprint.**

This wording mismatch is a contract/documentation defect, not permission to implement stacked V1+V2.

## Turn 01 product delta
Create only the clean permanent application frame:
- NOW;
- EXPLORE;
- LIBRARY;
- HEALTH;
- CONFIG separated at rail bottom;
- compact top breadcrumb surface;
- full-height responsive workspace;
- core mode routing;
- no chart engine yet;
- no AI execution yet;
- no Library data model yet;
- no Health implementation yet.

## Explicit non-goals
Turn 01 must not add:
- fake Market index;
- V1/V2/V3 chart logic;
- historical 3.9.7 page/card layout;
- wrappers or compatibility layers;
- speculative secondary UI;
- rejected-release code.

## Mechanical qualification required
- HTML has one permanent shell and five view surfaces;
- NOW is initial state;
- rail collapse state does not create another layout engine;
- mode routing is direct and deterministic;
- JavaScript syntax passes `node --check` after extraction;
- root document uses `overflow:hidden` and the workspace is height-constrained;
- no external runtime dependency is required for the Turn 01 base shell.

## Advancement rule
If Turn 01 base passes these gates, its exact blob becomes the clean baseline for Turn 02.

Turn 02 may advance only by a defined diff from Turn 01. If Turn 02 fails, discard Turn 02 and recreate its corrected diff from the qualified Turn 01 baseline. Do not patch forward without explicit owner approval.
