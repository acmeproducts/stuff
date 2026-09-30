# SOT Graveyard Addendum — Truncated Placement Delivery

**Decision date:** 2026-09-29

Rejected and must not return:

- a fixed `LIMIT 10000` as the owner-facing database boundary;
- deriving owner-facing Plan/report totals from a knowingly truncated placement subset;
- consuming a new catalog revision before a busy placement loader has accepted the forced refresh;
- silently dropping a refresh because another placement request is in flight;
- replacing the persisted database merely to make the UI match an incomplete client snapshot.

Required replacement:

- bounded paging over the complete active-placement set;
- page traversal keyed by monotonic `placement_no`;
- catalog revision and authoritative active-row count returned with the page contract;
- client application only after a complete, same-revision fetch;
- retained/retried forced refresh when a load is already active;
- SQLite remains authoritative and existing evidence is preserved.

## Owner UI convergence — rejected regressions

Rejected and must not return:

- showing stale/cached Database, Grid or Report counts as actionable while the complete placement estate is refreshing;
- separate top-level Database and Grid destinations when both are views of the same shared search state;
- burying Report behind data-view navigation instead of making it the first owner tab;
- dead Report rows that summarize a population but cannot open that population in Search;
- inventing file membership for capacity-only rows such as OPEN or TARGET merely to make a click return records;
- changing report mathematics or classification to implement navigation.

Required replacement:

- one blocking **Database refreshing / rebuilding** owner state until complete same-revision placement delivery is applied;
- Report first;
- one Search destination with Table and Grid views;
- every Report row routes to central Search using an explicit governed report scope;
- zero/non-file-backed report rows route honestly to zero matching files;
- existing Database/Grid renderers and shared query semantics remain intact underneath the unified Search surface.
