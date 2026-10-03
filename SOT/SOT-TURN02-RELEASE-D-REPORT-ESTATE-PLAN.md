# SOT Turn 02 Release D — Report / Estate refinement

**Decision date:** 2026-09-30  
**Status:** REJECTED / ROLLED BACK / REDESIGN AWAITING OWNER APPROVAL

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


## 2026-09-30 — Owner rejection and rollback

**Owner instruction:** “reject / rollback / update graveyard, plan” and “first returning back to the last known good”. New UI implementation is frozen pending approval of exact mobile screens.

**Rollback boundary:** restore the Complete page and SOT autosync workflow byte-for-byte from the pre-PR #770 main `7d70522890d08b2ba10965f255fa9166fac996f1`. Complete is identical to the previously qualified `59bca4547c7462e721d6ac878214fb22267b0bbb` frontend. Remove the new Report/Estate qualifier. Retain all newer unrelated repository work and all backend/source actions/runtime files. This removes changes from PRs #770 and #771; it is not a claim that the older frontend resolves every requested workflow issue.

### Screenshot findings and failed acceptance

- Repeated SCANNED/EXCESS/ESTATE/TARGET/DEFICIT cards, a duplicate warning, and a second table consume the viewport. Estate repeats the same report before the root table. Essential controls/data fall below the fold.
- Capacity clamps over-capacity Estate to 100%, calls TARGET 100%, and shows negative OPEN. This contradicts the positive DEFICIT displayed elsewhere.
- Red root rows accumulate raw synchronized bytes, including EXCESS/shared copies, while comparing to retained Estate capacity. A disclaimer does not repair the wrong measurement.
- Job Status replaces the grouped, controllable job workflow with a flat table. Tests used one RUNNING job and did not prove Action Needed / Running / Completed / Soft-deleted, content/log visibility, actions, or live job evolution.
- The global rebuilding overlay loads placement pages without visibly checking filesystem freshness. Catalog revision and successful paging are not evidence of a source staleness check. It gives no checked time, current work, phase-specific progress, or bounded failure/retry path.
- Phone emulation and visible-label tests were insufficient: they allowed clipping, horizontal root-table overflow, excessive vertical content, redundant totals and contradictory cross-tab meanings. Owner screenshots are the failed acceptance evidence.

### Formal redesign proposal — not approved, not production

One compact mobile header, primary icon row, and one local navigation row. Recommended Report has Overview / Estate / Jobs, replacing nested Report/Job Status and Analysis/Capacity/Operations navigation only if the owner approves these exact screens. Existing analysis/capacity/operations information must remain accessible without repeating totals. No document-level vertical or horizontal scrolling; a bounded inner list may scroll while navigation/actions remain visible. At minimum 360×640 CSS px and 412×915, including reduced viewport height from browser chrome and keyboard.

Overview: one compact reconciliation table (Scanned minus Excess equals Estate; Estate vs available Target), one shortage/space sentence, and one next-action row. Show each number once. No false 100% capacity bar and no negative OPEN. Offer Review excess / Inspect roots; explicitly no automatic deletion or movement.

Estate: compact five-column table Root / Files / Size / Synced / Status within a bounded panel. Long paths wrap in a selected-root detail view rather than hiding critical columns. Pagination or responsive row details keeps phone content within the viewport. Capacity fit uses governed retained UNIQUE/KEEP bytes assigned to the most-specific owning root; raw scanned bytes and EXCESS are available in root detail. Do not color raw source sizes as retained-fit evidence. If retained ownership is unavailable, state Fit unavailable, not a fabricated cutoff. Fit order must be explicit and reproducible; display sorting is not authorization to exclude roots.

Jobs: restore chevron groups in order Action Needed / Running / Completed / Soft-deleted. Running includes queued/running/paused/stopping with visible raw state; stalled is Action Needed. Maintain independent jobs, scope paths, counters, remaining work, timer, worker activity, persistent log/details, per-job Abort/Delete/Restart/Restore/Purge as applicable and global Pause/Resume. Do not expose Restart as routine SSOT upkeep. Historical interruption whose registered sources are current is history, not an action-needed source. Existing backend actions remain authoritative; no fictitious job states or destructive shortcuts.

Freshness: Connected describes transport only. Separate evidence state Current / Checking / Stale / Syncing / Problem with last actual source-check time and checked-source coverage. Initial cached view may be read-only with a compact stale/checking strip; mutation controls remain disabled until authoritative evidence is ready. Check source freshness, let the existing runtime auto-queue stale work, then reconcile a complete consistent catalog. Never imply reload=poll=filesystem check. Before implementation, validate the existing source-check API and detection policy, including additions/deletions and changed files; if no sufficient endpoint exists, propose the minimal backend change explicitly for approval. No endless overlay: bounded timeout, persistent error, retry, phase-specific progress when backed by actual counters.

### New acceptance contract before implementation

1. Owner approves exact interactive screens and state/action matrix first. Update plan with that approval; no replacement UI before then.
2. Capture failing checks on the restored baseline; inventory all controls/features removed by the rejected release and preserve them.
3. Screens fit below mobile app chrome with no document overflow at 360×640 and 412×915; all essential nav/actions remain visible, selected details and logs scroll inside bounded surfaces. Test taps and refresh frame-by-frame.
4. Use screenshot amounts (5279.4 scanned, 2333.9 excess, 2945.5 retained, 2685.4 target, 260.1 shortage), duplicate roots, zero free capacity, missing target, pending/stale/problem sources, and all job states. Never substitute one happy-path job for workflow qualification.
5. Check arithmetic and scope consistency across every surface; root retained allocations sum to retained Estate without double-counting. Pagination/sort/detail survives polling.
6. Job actions, live progress, group classification and persistence are verified with multi-state fixtures and appropriate runtime contract tests; no manual source restart required for automatic SSOT maintenance.
7. Freshness check must be directly evidenced; file additions/deletions/changes update status and auto-sync as defined. Loading errors stop visibly and retry is bounded.
8. Preserve Search Table/Grid bulk parity, Add to Estate, AI parallel/history/download, Config Log/Activity and backend/schema/filesystem behavior unless a further explicitly approved requirement needs a scoped change.
9. Public served identity and owner mobile acceptance are separate from lab gates. A green lab check never closes the owner's release acceptance.


## 2026-10-01 — Release D forward: Report / Job Status / Estate in the qualified Complete surface

**Owner instruction:** forward-apply the Report/Estate requirements onto current `main`, directly inside `SOT/sot-turn02-release-d-complete.html` (qualified baseline `59bca4547c7462e721d6ac878214fb22267b0bbb` + the DB-refresh staleness checkpoint already on main). No new wrapper; the old tree is reference only. The 2026-09-30 redesign-approval freeze is superseded by this explicit instruction.

**Scope (exact):**
1. **Analyze becomes Job Status.** The Report/Analyze switch reads `Report | Job Status`. The existing job/source status surface is preserved unchanged; it is not the Estate catalog.
2. **Report → Analysis is top-down.** `SCANNED = UNIQUE + KEEP + EXCESS`; `ESTATE = UNIQUE + KEEP`; `OPEN = TARGET − ESTATE`; `TARGET = LANDED + OPEN`. Reads SCANNED, −EXCESS, = ESTATE, vs TARGET, = OPEN or DEFICIT.
3. **Over capacity (`ESTATE > TARGET`):** no negative OPEN. A positive DEFICIT (`ESTATE − TARGET`) is shown with "MUST BE REMOVED FROM ESTATE TO FIT TARGET". The capacity bar uses Target as the boundary and draws overflow beyond it in red. Underlying data/math unchanged.
4. **Report subtabs:** Analysis | Capacity | Operations | Estate. Capacity/Operations behavior preserved except OPEN/DEFICIT coherence.
5. **Report → Estate:** durable catalog, one row per registered (non-soft-deleted) Estate root from the existing `/api/sources` + placement data. Columns Root / Files / Size / Last Synced / Status, sortable like the Database table, mobile usable. Files/Size are the retained (UNIQUE + KEEP) placements owned by that root so root rows sum to ESTATE. Summary above: `ESTATE | TARGET | OPEN` or `DEFICIT`. No job controls.
6. **Fit/overflow:** cumulative retained size in the fixed canonical root order (Root A→Z); rows beyond Target are red/white. Means "beyond Target capacity in canonical order", not "delete". User sorts reorder display only; the red flag follows the root, computed from canonical order.

**Not changed:** schema, SSOT sync, placement paging, scanning, hashing, classification math, Search, Add to Estate, AI, logging, diagnostics, backend API contracts, other projects.

**Gates:** all existing Release D gates retained plus deterministic runtime gates for labels, subtabs, relationships, DEFICIT, Estate data/columns/sort/overflow (`SOT/qualify-release-d-report-estate.py`, headless Chromium).


## 2026-10-01 — Database stuck on the blocker (owner report)

**Reported:** Database never loads; the "Database refreshing / rebuilding" blocker stays up forever.
**Cause (reproduced):** a forced refresh calls `/api/ssot/refresh-staleness` first. A backend without that endpoint (older installed runtime) returns an error, which was treated as a load failure and retried every 100 ms with no limit, so the blocker never cleared.
**Change:** the staleness check is now non-fatal (toast, then load continues); load failures retry at most 3 times, then stop with a visible error and release the blocker; a render error after apply no longer counts as a load failure.
**Qualification:** new runtime gate with the staleness endpoint missing: fails on the previous page, passes now. Run the installer to get the backend that has the endpoint.


## 2026-10-02 — DB refresh visibility + Chrome Local Network Access (owner report)

**Reported:** DB refresh appears to hang with no sign of life; Chrome DevTools lists every API request (health/jobs/events/sources/target) as Blocked by Local Network Access.
**Cause:** the API host (`oc-ref.fell-dojo.ts.net`, a Tailscale name) resolves to a private address, so Chrome (LNA) blocks the HTTPS page's requests until the user grants "Local network access"; the page then only showed a generic reconnect state and the blocker.
**Change:** (1) blocker shows phase, count and elapsed time with a progress bar and a Hide button after 15 s; (2) a persistent status pill shows refreshing / current with last-updated time / STALE (older than 10 min, never loaded, or registered sources pending) / load failed / OFFLINE, and tapping it refreshes; (3) an unreachable or browser-blocked API is reported as OFFLINE with the exact fix (allow Local network access for this site), and the blocker releases; (4) the page iframes declare `allow="local-network-access"`.
**Owner action required:** in Chrome, address-bar lock → Site settings → Local network access → Allow for `acmeproducts.github.io`, then reload. Code cannot grant this permission.
**Qualification:** runtime gates for progress text, last-updated, both stale rules, and OFFLINE hint + blocker release.


## 2026-10-02 — Source-freshness check blocked the DB load for 50 s+ (owner report)

**Reported:** blocker sat on "Checking sources for changes · 51s".
**Cause:** the forced refresh awaited `/api/ssot/refresh-staleness`, which walks every source before any placement page loaded.
**Change:** the freshness check now runs in the background (its result still auto-queues changed sources through the existing SSOT path); the database loads immediately; the status pill shows "checking sources Ns".
**Qualification:** runtime gate with a 60 s freshness check: database loads and blocker clears immediately.


## 2026-10-02 — Local cache + delta sync (owner: "seems like a full rebuild every time")

**Finding:** every page load/refresh re-downloaded all ~30k placement rows. The existing localStorage copy (full JSON, tens of MB) could not persist and blocked the UI thread when attempted; the server could only send full pages.
**Owner decision:** all three — IndexedDB cache, revision check on open, server-side delta.
**Change:**
- Backend (`sot-turn02-release-d-autosync.py`, no schema change): `GET /api/placements/delta?since=<catalog_revision>` returns only added/edited rows and removed ids, computed against retained per-revision row digests (last 4 revisions, recorded whenever a full snapshot is served). Unknown/expired revision or a mostly-changed catalog returns `full:true`.
- Browser (Complete): rows cached in IndexedDB; startup renders cached rows immediately (no blocker), then syncs by delta (unchanged revision downloads nothing); full paged load only when there is no cache, the server says full, the creation revision changed, the delta endpoint is missing (older backend) or merge counts do not match. localStorage JSON dump removed. Source-freshness scan now runs only at startup and on manual refresh (pill tap), not on every revision-change reload. Pill shows "from local cache / no changes / +N / −M changed / full load".
**Qualification:** `SOT/qualify-release-d-placement-delta.py` (backend contract) and runtime gates for cache save, instant cached render, no-download on unchanged revision, 1-add/1-remove delta merge, server-full fallback, missing-endpoint fallback. All earlier gates retained.
**Deploy order:** the backend endpoint needs the installer re-run (installer pin follows the merged commit). Without it the page falls back to full loads exactly as before.


## 2026-10-02 — Sources stuck "Syncing" at 100% with the current file changing (owner report)

**Reported:** five sources show Syncing, progress 100% / remaining 0, but "Now" keeps changing; pill showed "checking sources 2m".
**Finding:** the page triggered a full source-metadata scan (a complete walk of every file on all enabled sources, slow on /mnt drives) on every load, and any source found "changed" was queued for another full sync job. Opening the page repeatedly therefore re-walked the drives repeatedly, and the check also ran against sources already syncing. The server already performs the same check at its own startup. Whether the five sources are flagged changed because files really changed or because the stored baseline and live signatures disagree on those drives is not yet known; the server's `source_stale` event holds both signatures.
**Change:** (1) opening the page no longer triggers any source scan; only the status-pill tap does (forced); (2) the refresh endpoint skips sources that have live sync work and sources checked in the last 5 minutes unless forced; (3) the response reports per-source baseline vs live file/byte counts and the page shows them ("DJI: 1,194 → 1,196 files — syncing") so a real change can be told from a baseline mismatch.
**Open:** if a source is re-flagged changed with equal file counts after a completed sync, the baseline comparison itself is at fault (not the page); the toast/`source_stale` event will show it.


## 2026-10-02 — ROOT CAUSE of perpetual re-sync: order-dependent staleness signature (evidence: owner's runtime log)

**Evidence:** every `source_stale` event for the five sources (DJI, DJI Archive, S20 SD BACKUP, backup 2-27, consolidate SD Cad) shows baseline and live with identical files, bytes and newest_mtime but different digests, every time, across restarts (`startup`) and page refreshes (`database_refresh`), each followed by a full re-sync that completes and is flagged stale again. Sources without nested folders never appear.
**Cause:** the stored (placement-based) signature hashed files in SQL path order; the live signature hashed them in directory-walk order. For any tree with sub-folders the two orders differ, so the digests never match and the source is "changed" forever.
**Change (engine, no schema change):** both signatures now sort their lines before hashing and carry `v:2`. A legacy baseline (no `v`) with equal files/bytes/newest_mtime is upgraded silently instead of triggering a sync; any real difference still marks the source stale.
**Qualification:** `SOT/qualify-release-d-signature.py` (real engine + real scan, nested folders): failed on the old engine (same counts, different digest), passes now; adds/removes/edits still detected.

## 2026-10-02 — CI: retire stale one-time apply step from the DB Refresh Staleness workflow

**Evidence:** that workflow has failed on every run since #779 at its first step (the one-time apply script asserts a pattern that no longer exists because the change is already in the repo). The gates themselves pass.
**Change:** the workflow now only runs the gates (no apply, no auto-commit, read-only permissions).

## 2026-10-03 — Owner review: Estate truncation/copy, Search speed + copy + automatic count chip, one Waterfall report, Excess vs Deficit colors

**Evidence (owner screenshots, mobile):** Estate root names overflowed into the next column; tapping Estate fields copied nothing; switching to Search lagged (36k rows re-filtered and re-sorted on every switch, ~0.45 s on desktop); the Search count chip showed a stale selection (3171) after the search changed to 327 results; Excess and Deficit shared one red.
**Change (Complete surface only):**
- Estate cells truncate with an ellipsis, show the full value on hover, copy on tap; one shared copy path (Search cells, filenames, Estate) that never copies blank and flashes the cell.
- Search: filter and sort results cached per loaded database, table reused when nothing changed (switch back ≈ instant, repeat search instant, warmed after each load).
- Count chip is automatic: "N results" follows the search; × clears the search. Tapping the # cell selects specific rows ("N selected", × clears them); selections outside the new result set are dropped. "Select all results" removed. Tapping any other cell copies instead of selecting.
- Analysis + Capacity + Operations merged into one Waterfall (SCAN → ESTATE → ESTATE VS TARGET → OPERATIONS) with a shared TARGET line; subtabs are now Waterfall / Estate; rows still open their Search scope.
- EXCESS is purple, DEFICIT stays red (bars and legend).
- Nested frames allow clipboard-write.
**Qualification:** `qualify-release-d-report-estate.mjs` rewritten for the Waterfall and extended (geometry, colors, chip behavior, copy, cache reuse, long-name truncation on mobile).
