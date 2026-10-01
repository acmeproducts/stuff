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

Frontend-only correction integrated directly into `SOT/sot-turn02-release-d-complete.html`, based on qualified `59bca4547c7462e721d6ac878214fb22267b0bbb`. No additional page or iframe layer is introduced; backend, schema 14, hashing, classification, source synchronization, job execution, Search, Add to Estate, AI, Config and filesystem behavior are unchanged.

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

Canonical test page: `SOT/sot-turn02-release-d-complete.html`. The separate Report/Estate experiment is superseded.


## 2026-09-30 — Integrate the approved specification into Complete

**Owner report:** “seven releases that have all failed”; the approved frontend never reached the normal Complete page.

**Cause:** the Report/Estate experiment was an extra iframe wrapper, separate from Complete. Its render functions were not installed in the normal render/poll path. Complete still exposed Analyze and three Report subtabs. Report row routing also selected a nonexistent `.subnav` rather than the actual `.subtabs` element.

**Change:** Complete now owns the Analysis/Estate renderers and Job Status renderer. Normal polling, placement refresh, report navigation and subtab changes use these renderers. Capacity/Operations reuse the existing implementations. Estate sorting persists across polling; all five columns sort. Zero free capacity remains zero rather than falling back to registered capacity. SCANNED opens all analyzed placements; ESTATE opens only UNIQUE/KEEP. Pause/Resume remains available in Job Status. Source/root sizes use the last successful synchronized snapshot; cumulative root capacity may include shared content, and the table explains this distinction.

**Before / after:** additional delivery iframe layers **1 → 0**; Report subtabs **3 → 4**; owner-facing Analyze label in Complete **1 → 0**; sortable Estate columns **0 → 5**. Fixture: SCANNED **900 GB**, EXCESS **200 GB**, ESTATE **700 GB**, TARGET **600 GB**, DEFICIT **100 GB**. Zero current free capacity with nonzero registered free capacity correctly stays **0 GB**.

**Qualification:** baseline failed the new Complete integration gate. Chromium browser checks pass at **1280 × 900** and **412 × 915**: arithmetic, sorting/cumulative red-white cutoff, polling, Job Status/progress/Pause/Resume, Report→Search, preserved Capacity/Operations, Search Table/Grid bulk actions and Add to Estate Picker. Existing Release D engine and Continuous SSOT qualifiers pass. These are local fixture/browser results; owner-device acceptance remains unverified until the owner tests the published page against the live WSL host.

**Protected:** no runtime, schema, classification, hashing, filesystem or backend files changed. Existing AI history/download and Config log functions remain in Complete unchanged.


### Published-page phone timing check

The first deployed phone run exposed Catalog briefly during Add to Estate rendering. The old Complete decorator hid Catalog only on a later animation frame and did not cover subsequent Estate renders. Complete now enforces Picker and suppresses Catalog synchronously on every Estate render, including volume refreshes. Acceptance explicitly rerenders Estate and checks that Catalog stays hidden. This preserves the previously approved Add to Estate behavior.
