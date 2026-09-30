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
