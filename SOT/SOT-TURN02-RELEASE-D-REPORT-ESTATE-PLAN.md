# SOT Turn 02 Release D — Report / Estate refinement

**Decision date:** 2026-09-30  
**Status:** OWNER APPROVED / TEST CANDIDATE

## Owner definition of working

- Report tells the capacity story top-down: `SCANNED = UNIQUE + KEEP + EXCESS`; remove `EXCESS`; `ESTATE = UNIQUE + KEEP`; compare ESTATE to TARGET; when ESTATE exceeds TARGET show a positive **DEFICIT** and explicitly state how much must be removed to fit.
- Report gains **Estate**: a sortable table of registered roots with Root, Files, Size, Last Synced and Status. In current sort order, rows beyond cumulative target capacity use red background / white text.
- **Analyze becomes Job Status.** It is no longer the source/Estate catalog.
- Existing Capacity and Operations report views remain available.

## Baseline

Current Release D complete runtime on main, with Continuous SSOT, converged navigation, Search Table/Grid parity, Add to Estate, AI task history/download, and Config Log/Activity preserved.

## Scope

Frontend-only candidate: `SOT/sot-turn02-release-d-report-estate.html`. It layers on the current qualified `sot-turn02-release-d-complete.html`; backend, schema 14, hashing, classification, source synchronization, job execution, Search, Add to Estate, AI, Config and filesystem behavior are unchanged.

## Mechanical acceptance

- Candidate JavaScript parses under Node 22.
- Report navigation labels are `Report` and `Job Status`; owner-facing `Analyze` label is absent from this candidate layer.
- Report subtabs are Analysis / Capacity / Operations / Estate.
- Analysis exposes SCANNED, EXCESS, ESTATE, TARGET and OPEN/DEFICIT.
- When `ESTATE > TARGET`, DEFICIT is positive and the UI states that amount must be removed from Estate to fit Target.
- Estate table has sortable Root / Files / Size / Last Synced columns plus Status.
- Estate rows whose cumulative size exceeds Target are red with white text.
- Job Status reads the durable job ledger and shows status, job, scope, progress and created time.
- No backend/runtime/database change.

## Delivery

Test candidate: `SOT/sot-turn02-release-d-report-estate.html`.
