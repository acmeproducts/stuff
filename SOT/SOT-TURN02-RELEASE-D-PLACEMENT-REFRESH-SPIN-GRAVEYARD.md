# SOT Graveyard Addendum — Live-Revision Paging Spin

**Decision date:** 2026-09-30

Rejected and must not return:

- treating each page of one owner refresh as an independent live-database snapshot;
- requiring the live catalog revision to remain unchanged for the entire duration of a multi-page browser fetch;
- retrying a complete 30,000+ row refresh indefinitely while Continuous SSOT is legitimately changing the catalog;
- clearing the blocker early and exposing a mixed-revision partial estate;
- rebuilding or migrating SQLite to solve a client paging-consistency problem.

Required replacement:

- one immutable placement snapshot per multi-page traversal;
- one catalog revision and one authoritative row count for that traversal;
- monotonic `placement_no` paging over the captured snapshot;
- a new snapshot only when a new traversal begins at `after=0`;
- bounded snapshot lifetime;
- SQLite and Continuous SSOT remain authoritative and unchanged.
