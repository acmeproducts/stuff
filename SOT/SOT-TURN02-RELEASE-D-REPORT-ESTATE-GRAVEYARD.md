# SOT Release D Graveyard Addendum — Analyze as Estate/source catalog

**Decision date:** 2026-09-30

## Buried owner-facing model

Do not use **Analyze** as the owner-facing source/Estate catalog.

The source cards remain useful synchronization evidence internally, but the owner-facing information architecture is now:

- **Job Status** = durable analysis/job execution status.
- **Report → Estate** = registered Estate/root catalog and capacity-fit table.
- **Add to Estate** = registration workflow.

Do not reintroduce a second owner-facing Estate catalog under Analyze/Job Status. Source synchronization behavior and durable source/job records are not removed by this UI decision.


## 2026-09-30 — Buried separate Report/Estate delivery wrapper

Do not deliver approved Report/Estate changes in a new page layered around Complete. The `fdd61e2` experiment is evidence, not the implementation baseline. Integrate directly into the qualified Complete page and hook normal render/poll paths. Do not retain Analyze as a second source catalog, mislabel scanned bytes as retained Estate, fall back from zero current target capacity to old registered free capacity, or lose Estate sort order on polling.


Do not hide Add to Estate's Catalog only in a deferred navigation callback. Every Estate render must remain Picker-only, including async volume refreshes; the forbidden Catalog workflow must never flash or reappear.
