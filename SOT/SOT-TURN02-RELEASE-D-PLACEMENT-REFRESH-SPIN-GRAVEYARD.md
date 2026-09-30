# SOT Graveyard Addendum — Refresh / Browser Spin

**Decision date:** 2026-09-30

Rejected and must not return:

- treating each page of one owner refresh as an independent live-database snapshot;
- requiring the live catalog revision to remain unchanged for the entire duration of a multi-page browser fetch;
- retrying a complete 30,000+ row refresh indefinitely while Continuous SSOT is legitimately changing the catalog;
- clearing the blocker early and exposing a mixed-revision partial estate;
- rebuilding or migrating SQLite to solve a client paging-consistency problem;
- observing a DOM subtree while unconditionally rewriting that same subtree on every observer callback;
- unconditional `innerHTML` replacement inside a repeatedly invoked owner-UI decorator;
- using optional chaining on an undeclared identifier such as `snap?.job` and treating the resulting `ReferenceError` as a retriable data failure;
- declaring owner UI behavior PASS solely because marker strings exist in the HTML;
- allowing the legacy Source/Picker surface to remain the painted first screen when Report-first initialization has not completed.

Required replacement:

- one immutable placement snapshot per multi-page traversal;
- one catalog revision and one authoritative row count for that traversal;
- monotonic `placement_no` paging over the captured snapshot;
- a new snapshot only when a new traversal begins at `after=0`;
- bounded snapshot lifetime;
- idempotent observed-DOM decorators with explicit state markers;
- safe handling of optional legacy globals using `typeof` before dereference;
- qualification gates for the actual runtime failure patterns, in addition to syntax and marker checks;
- SQLite and Continuous SSOT remain authoritative and unchanged.