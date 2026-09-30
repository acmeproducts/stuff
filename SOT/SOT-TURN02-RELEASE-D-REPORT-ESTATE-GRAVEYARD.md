# SOT Release D Graveyard Addendum — Analyze as Estate/source catalog

**Decision date:** 2026-09-30

## Buried owner-facing model

Do not use **Analyze** as the owner-facing source/Estate catalog.

The source cards remain useful synchronization evidence internally, but the owner-facing information architecture is now:

- **Job Status** = durable analysis/job execution status.
- **Report → Estate** = registered Estate/root catalog and capacity-fit table.
- **Add to Estate** = registration workflow.

Do not reintroduce a second owner-facing Estate catalog under Analyze/Job Status. Source synchronization behavior and durable source/job records are not removed by this UI decision.
