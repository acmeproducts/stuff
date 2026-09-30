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
