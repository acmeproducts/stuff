# Market Navigator — Next Session Handoff

Status: SESSION HANDOFF / EXECUTION ORIENTATION  
Updated: 2026-09-26  
Repository: `acmeproducts/stuff`

> This file is a handoff aid, not a competing specification. The authoritative positive specification remains `MARKET-NAVIGATOR-MASTER-PLAN.md`; the binding negative specification is `MARKET-NAVIGATOR-GRAVEYARD.md`; build advancement is governed by `MARKET-NAVIGATOR-BUILD-PROTOCOL.md`.

## 1. Read this first in the next session

Before changing Market Navigator:

1. Fetch current `main`.
2. Read in full:
   - `MARKET-NAVIGATOR-MASTER-PLAN.md`
   - `MARKET-NAVIGATOR-GRAVEYARD.md`
   - `MARKET-NAVIGATOR-BUILD-PROTOCOL.md`
3. Use this handoff only as the operational map of the current program state.
4. Do not ask the owner to reconstruct prior decisions already recorded in governance.
5. Do not create a parallel redesign plan.

## 2. Current application/candidate state

### Retained working baseline
- File: `market-navigator-turn26-ship.html`
- Current main blob: `fc61e29d76f1a7ecf1226f74e0884865dca04684`
- Current main byte size: `231392`
- Role: retained working baseline while the analytical redesign successor is under owner disposition.

### Rejected lineage
- Turn 27 was rejected after owner qualification exposed:
  - crosshair/nearest-series interaction defects;
  - incorrect persistent-index versus comparison overlay scaling;
  - robustness diagnostics mixing incompatible coordinate systems.
- Do not patch Turn 27 forward or use it as a construction donor.

### Current successor candidate
- File: `market-navigator-turn28-pre-ship.html`
- Current main blob: `1517423f75d9244580ad8ccea5f22c988e72a04f`
- Current main byte size: `237027`
- State: mechanically qualified corrective candidate, awaiting owner disposition.
- Model version carried by the redesign: `MN-PERSISTENT-1.0.0`.

The next session must begin with the **Turn 28 owner disposition**. Do not start unrelated feature work first.

## 3. End goal

Market Navigator is being evolved from a horizon-rebased charting tool into a durable evidence-backed market/economic research system in which:

- every component has an economically defensible governed transform;
- RSK / GRW / MAC are persistent, versioned indices;
- one model-version anchor establishes index level 100;
- changing 1D / 5D / MTD / YTD / 1YR / 3YR / 5YR changes only the viewport;
- the canonical index value for a calendar date does not change when the horizon changes;
- optional **Rebase 100** remains a display/comparison transformation only;
- canonical RSK / GRW / MAC can be overlaid meaningfully against SPY/S&P 500, Nasdaq/QQQ, Dow, Gold, WTI, and other governed market series on the existing two-axis architecture;
- AI explains one governed analysis at different levels without changing facts, calculations, conclusions, evidence, or links;
- navigation becomes simpler after analytical-state contracts are stable;
- Context & Further Reading, live links, Library, Analyze, live refresh, Print, Markdown, TTS, checkpoints, revisions, Health, Glossary, and deterministic index explanations remain intact.

Core analytical rule:

**Horizon controls viewport. It must not define the canonical index value.**

## 4. Six coordinated workstreams

### Track 1 — Components

Purpose: make every RSK/GRW/MAC component economically and mathematically defensible.

Governed concerns:
- source identity/provenance;
- transform family;
- direction semantics;
- transformation scale;
- nominal coefficient versus realized influence;
- missing/degraded behavior;
- cadence/information age;
- observation date versus public-release/vintage date;
- component participation/completeness;
- exact replication/reconciliation.

Closed/qualified component program:
- C1 provenance: PASS.
- C2 transform registry: PASS.
- C3 influence/scaling: PASS.
- C4 information-time/vintage: PASS WITH PROSPECTIVE-ONLY SOURCE.
- C5 component registry: PASS.

Important closed findings:
- WTI canonical lineage is Yahoo `CL=F`, not EIA Cushing spot.
- The April 2020 negative WTI observation is valid evidence and must not be removed.
- NFCI is signed/zero-centered; ratio rebasing is invalid.
- Treasury spreads require signed treatment.
- 10Y, 2Y, Fed Funds, CPI YoY, Core PCE YoY, unemployment, and HY spread require additive rate/spread treatment rather than percent-of-level reasoning.
- VIX/MOVE remain proportional/log under the qualified evidence; do not change them merely for uniformity.
- No universal ratio transform is permitted.
- Mixed-frequency macro observations are not interpolated simply to make a short-horizon chart move.
- A slow component with no new release remains part of the model; “no new information” is not “component absent.”
- Seven fixed nominal coefficients are retained; there is no reduced-set renormalization.

Qualified scaling rule:
- S2A event-change volatility × sqrt(observed native-event frequency);
- scale is frozen from pre-effective evidence for each model version;
- retain seven equal nominal coefficients;
- expose realized concentration/sensitivity instead of adaptively reweighting;
- pre-effective history using launch scales is explicitly BACKCAST.

Information-time rule:
- eleven FRED components passed ALFRED initial/revision timing and no-look-ahead qualification;
- HY spread `BAMLH0A0HYM2` is not available in ALFRED;
- HY prelaunch history is current-vintage retrospective backcast;
- post-launch historical truth for that source requires prospective capture.

Do not reopen C1–C5 absent contrary evidence from qualification.

### Track 2 — Persistent indices

Gate I1: PASS.

Qualified index definition:
- RSK / GRW / MAC are persistent versioned time series under `MN-PERSISTENT-1.0.0`;
- common anchor: **2016-09-01 = 100**;
- horizons are viewport-only;
- Rebase 100 is display-only;
- pre-effective history is explicitly labeled `RETROSPECTIVE BACKCAST`;
- model changes require explicit new versioning and additive chain-linking at the effective date;
- qualified FRED components use then-available vintage state;
- HY spread uses labeled current-vintage backcast until prospective capture exists;
- formula and contribution reconciliation passed;
- canonical indices retain absolute values on overlays;
- contribution explanations use native values for provenance and governed signal deltas for exact index-point reconciliation.

Do not redefine the index from the selected chart horizon.

### Track 3 — AI interpretation level

Product vocabulary:
- **Plain**
- **Standard**
- **Technical**

Rules:
- one governed analysis/evidence set;
- levels change only vocabulary, assumed knowledge, mechanism explanation, and technical depth;
- evidence, calculations, conclusions, source links, limitations, and Context & Further Reading remain identical;
- Config may hold a default;
- a Library analysis may be reinterpreted at another level;
- optional tabs may expose all three;
- never run three independent analyses that can disagree.

Intent:
- Plain: everyday-language meaning, e.g. what an inversion/rise/fall means.
- Standard: normal market/economic terminology with concise mechanism.
- Technical: transformations, basis-point/percentage-point interpretation, model mechanics, caveats, and provenance.

Current state: Turn 28 candidate qualified for this behavior; owner disposition is still required.

### Track 4 — Tabbed navigation/layout

Design direction:
- primary top row: **NOW | LIBRARY | HEALTH**;
- Config remains separately accessible;
- contextual second row by area where useful;
- operational chart controls stay with the chart;
- prefer using limited vertical space over permanently sacrificing mobile chart width.

Do not implement navigation changes independently of the governed analytical state contracts.

Current state: Turn 28 candidate qualified on desktop/mobile; owner disposition is still required.

### Track 5 — Evidence & Context

Must preserve:
- deterministic Context & Further Reading source links;
- distinct **Data & Releases** and **Related Reporting**;
- parity between seeded `?` context retrieval and newspaper refresh;
- actual working external URLs, not citation markers;
- causality discipline: contemporaneous context is not automatically causal;
- external-source availability/content caveat;
- frozen contextual evidence with saved checkpoints;
- refreshed context must not rewrite prior frozen evidence.

### Track 6 — Analysis / Library

Must preserve:
- standalone Analyze modal;
- selected series as analysis root;
- modal-local horizons;
- `+ Add`;
- selectable primary / Indexed-100 comparison reference;
- AI POV closes Analyze and immediately opens a processing Library card;
- immutable original analysis state;
- saved checkpoints within one Library card/thread;
- live refresh/extend;
- explicit revision semantics;
- Library Print;
- expanded Context & Further Reading in Library and print;
- Markdown/CSV/JSON exports;
- TTS/Listen;
- source/model Health and Glossary;
- deterministic Index Explanation evidence.

## 5. Program dependency order

Primary dependency:

**Components → Persistent Indices → AI interpretation contract → Navigation implementation**

Tracks 5 and 6 are retained cross-cutting capabilities and must be requalified against every analytical redesign candidate.

The component and persistent-index gates are already qualified. Do not restart them absent contrary evidence.

## 6. Decisions that are closed unless new evidence overturns them

Do not casually reopen:

- WTI = Yahoo `CL=F`.
- Negative WTI history is valid.
- Ratio rebasing is invalid for NFCI, WTI, Treasury spreads, and governed rate/percentage measures identified by C2.
- VIX/MOVE additive-level treatment was not preferred over proportional/log movement.
- Counting only non-zero stored changes as event frequency is rejected as a general normalization rule.
- 3YR/5YR retrospective calibration windows are rejected as the default normalization window.
- redesigned Treasury-curve components use direction −1 under the MAC pressure interpretation.
- horizon cannot define the canonical index value.
- equal nominal coefficients do not justify hiding realized influence; concentration/sensitivity must remain visible.
- macro history cannot use information before it was publicly available without an explicit retrospective/backcast label.
- Plain/Standard/Technical are renderings of one governed analysis, not separate analytical conclusions.
- Context `?` and newspaper refresh must use the same source-retrieval quality and link rules.

## 7. Immediate next decision and execution rule

### First action in the next session
Determine owner disposition of the exact current Turn 28 candidate.

If owner **accepts** Turn 28:
1. record acceptance in the Master Plan;
2. promote the exact accepted artifact/commit/blob as the next baseline according to the Build Protocol;
3. update this handoff in place;
4. continue only with the next open gate explicitly recorded by the Master Plan.

If owner **rejects** Turn 28:
1. record the rejection and exact defects in the Graveyard;
2. do not patch the rejected candidate forward;
3. return to the clean baseline required by the Master Plan/Build Protocol;
4. recreate the corrected Turn 28 delta;
5. rerun all retained and Turn 28 qualification gates;
6. return for owner disposition.

No new feature branch or redesign phase should leapfrog this disposition.

## 8. Minimum qualification that must remain cumulative

Every successor must retain and mechanically/browser qualify, as applicable:

- exact component/model arithmetic;
- seven-component completeness and fixed coefficients;
- persistent-index horizon invariance;
- fixed-anchor identity;
- Rebase 100 isolation;
- persistent-index versus comparison dual-axis behavior;
- nearest-series crosshair/inspection and safe click state;
- robustness diagnostics in the correct coordinate system;
- Plain/Standard/Technical factual parity;
- desktop/mobile top-navigation geometry;
- source links and Health deep-links;
- Context & Further Reading source-link parity;
- seeded-question behavior;
- standalone Analyze;
- AI POV processing-card handoff;
- Library checkpoints and revision behavior;
- Library Print;
- Markdown/CSV/JSON export;
- TTS/Listen;
- Pages deployment;
- exact deployed artifact identity;
- live smoke.

Green CI does not substitute for an assertion that was never tested.

## 9. Permanent implementation discipline

Always follow:

**clean accepted baseline → defined delta → candidate → mechanical qualification → owner disposition**

Do not:
- patch forward from a rejected candidate without explicit owner approval;
- create duplicate chart/data/AI/Library engines;
- create wrappers/compatibility overlays to preserve a failed candidate;
- silently change component identity, transform, scale, direction, weight, release timing, or index anchor;
- let UI work drive analytical model changes;
- let geometry changes refetch or alter analytical state;
- let stale asynchronous work overwrite newer state;
- call a mechanically qualified candidate “accepted” before owner disposition.

## 10. Successor-session startup prompt

Use this prompt in a fresh session:

> Continue Market Navigator in `acmeproducts/stuff` from current `main`. This is a continuation of the governed analytical-redesign program. First read in full `MARKET-NAVIGATOR-MASTER-PLAN.md`, `MARKET-NAVIGATOR-GRAVEYARD.md`, `MARKET-NAVIGATOR-BUILD-PROTOCOL.md`, and `MARKET-NAVIGATOR-NEXT-SESSION-HANDOFF.md`. The Master Plan is authoritative; the handoff is operational orientation only. Do not ask me to reconstruct prior decisions. C1–C5 and I1 are complete under `MN-PERSISTENT-1.0.0` and must not be reopened absent contrary qualification evidence. Turn 27 is rejected. The retained working baseline is `market-navigator-turn26-ship.html` blob `fc61e29d76f1a7ecf1226f74e0884865dca04684`. The current successor candidate is `market-navigator-turn28-pre-ship.html` blob `1517423f75d9244580ad8ccea5f22c988e72a04f`, mechanically qualified and awaiting owner disposition. Begin with that disposition. If accepted, promote the exact artifact according to the Build Protocol and update governance/handoff. If rejected, record the defects, return to the required clean baseline, rebuild the Turn 28 delta, and requalify. Preserve the six coordinated tracks: Components, Persistent Indices, AI Interpretation Level, Tabbed Navigation/Layout, Evidence & Context, and Analysis/Library. Preserve all retained Turn 26 evidence, Analyze, Library, source-link, Print, Markdown, checkpoint, revision, TTS, Health, Glossary, and Index Explanation behavior.

## 11. Maintenance rule for this handoff

At the end of every substantial redesign session:

- update the authoritative Master Plan first;
- update Graveyard for rejected approaches/failures;
- then update this handoff with:
  - current accepted baseline;
  - current candidate;
  - gate status;
  - closed decisions;
  - immediate next action.

Do not let this handoff become a stale second plan.
