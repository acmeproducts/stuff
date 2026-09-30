# SOT Turn 02 Release D — Complete Placement Delivery

**Decision date:** 2026-09-29  
**Status:** OWNER DIRECTED FIX

## Owner definition of working

> “the last three large jobs finished but the database and the reports did not update”

> “please fix this once and for all”

## Ground truth

The post-run diagnostic database contains 30,324 active placements and all 30,324 are fingerprinted with no writer error. The Release D `/api/placements` endpoint still returns only the first 10,000 active placements. Database/Grid/Plan browser state is therefore incomplete even though SQLite is current.

The existing health refresh can also lose a forced reload when a placement request is already in flight: the catalog revision is consumed before `loadPlacements(true)` can run, and the busy guard drops that refresh.

## Definition of working

1. The owner-facing Database, Grid and Plan receive every active placement, not an arbitrary first 10,000.
2. Retrieval is paged so estate growth does not require one unbounded JSON response.
3. A catalog revision that arrives during an in-flight placement load is retained and retried, never dropped.
4. A multi-page load is applied only when all pages belong to one catalog revision and the fetched row count equals the authoritative active-placement count.
5. Existing Continuous SSOT behavior, AI task behavior, schema 14, classification, filesystem semantics and accepted UI remain unchanged.
6. The existing server-side `/api/plan` remains authoritative backend evidence; the owner-facing Plan continues to render from the complete placement set.

## Baseline score

- jobs persist completed evidence to SQLite — PASS;
- SQLite contains the completed 30,324-placement estate — PASS;
- owner-facing placement delivery beyond 10,000 rows — FAIL;
- Plan/report input beyond 10,000 rows — FAIL;
- forced refresh while a placement load is busy — FAIL;
- Continuous SSOT automatic recovery/currentness behavior — PASS.

## Change

- add a bounded `/api/placements/page` endpoint in the already-approved Continuous SSOT runtime wrapper;
- add a final owner-test wrapper that consumes all placement pages and retries revision races without changing the accepted inner application;
- extend the Continuous SSOT qualifier with a 12,005-row paging proof and required refresh markers;
- cut the installer to the resulting governed commit.

## Mechanical acceptance

- 12,005 active fixture placements are returned across three pages with no 10,000-row truncation;
- page traversal advances monotonically and reports authoritative total/catalog revision;
- incomplete or mixed-revision loads are not applied;
- a forced refresh received while loading schedules another complete refresh;
- Continuous SSOT registration, stale-sync and interrupted-work recovery tests still pass;
- owner-facing SSOT UI remains Current / Syncing / Problem with System history absent;
- Python compiles;
- final wrapper JavaScript parses under Node 22.

## Protected

No schema migration. No database rebuild. No rehash. No classification change. No Estate, Grid, Plan visual redesign. No AI-task change. No source/job lifecycle change.

---

# Owner UI convergence — 2026-09-29

## Owner evidence / definition of working

> “there needs to be a ui toast blocker that says db is refreshing/rebuilding”

> “REPORT should be the first tab”

> “EACH ROW FOR EACH REPORT SHOULD BE CLICKABLE TO A #### CENTRAL SEARCH”

> “COMBINE DATABASE AND GRID AS THEY ARE JUST VIEWS OF EACH OTHER”

## Baseline scorecard

- complete 30,324-placement delivery — PASS;
- database refresh is visibly blocked while the complete estate is being assembled — FAIL;
- Report is first owner navigation tab — FAIL;
- Database and Grid are presented as one Search surface with two views — FAIL;
- Analysis report rows open the corresponding file set in Search — FAIL;
- Capacity/Operations report rows route to Search, including zero/non-file-backed rows — FAIL;
- existing Database and Grid renderers/search state remain reusable — PASS;
- existing Report Analysis/Capacity/Operations calculations remain unchanged — PASS.

## Implementation decision

The accepted Release D application remains the inner baseline. The complete-placement wrapper owns this owner-facing convergence so the change is narrow and reversible:

1. Add a blocking overlay/toast reading **Database refreshing / rebuilding** whenever a complete paged placement refresh is in flight. Cached/stale counts must not remain actionable while authoritative rows are loading. The blocker remains through catalog-revision retries and clears only after one complete same-revision estate is applied.
2. Move the existing Plan/Report navigation control to the first position and expose it to the owner as **Report**. Report becomes the initial owner surface.
3. Replace the two top-level Database and Grid choices with one **Search** navigation choice. The existing Database renderer becomes **Table** view and the existing Grid renderer becomes **Grid** view inside Search. Their already-shared query state is preserved.
4. Make every Report table row clickable. A click sets a governed `#report:` central-search scope and opens Search/Table. File-backed rows resolve to the exact placement subset represented by the report row. Rows representing capacity/target or currently zero landed state still route to Search and correctly return zero file records rather than inventing file membership.
5. Report mappings:
   - Analysis: UNIQUE → UNIQUE; DUPLICATE → KEEP + EXCESS; KEEP → KEEP; EXCESS → EXCESS; ESTATE → all active placements.
   - Capacity: ESTATE → retained UNIQUE + KEEP; OPEN → no placement rows; TARGET → no placement rows.
   - Operations: IN PLAY → retained UNIQUE + KEEP under the current Release D model; LANDED → current landed set (zero in the current model); ESTATE → retained UNIQUE + KEEP.
6. Do not change report mathematics, classification, database schema, source/job lifecycle, AI behavior, or the underlying Database/Grid renderers.

## Acceptance gates

- qualifier contains the owner-directed UI contract before production wrapper change;
- refresh blocker marker and exact owner text are present;
- Report-first and Search/Table/Grid convergence markers are present;
- all report row labels are routed through the central report-search function;
- the legacy Grid top-level button is hidden, not deleted from the underlying application;
- existing complete-placement paging and Continuous SSOT gates continue to pass;
- wrapper JavaScript parses under Node 22;
- no unrelated source file is modified.
