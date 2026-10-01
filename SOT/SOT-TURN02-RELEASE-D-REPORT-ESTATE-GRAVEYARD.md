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


## 2026-09-30 — REJECTED PRs #770 / #771

Owner: “a ton of regressions and also extremely poor design”; mobile first; nothing below the fold. Rollback is mandatory before redesign, and exact screens require approval before production implementation.

Buried: repeated report cards plus warning plus table; repeating the report above Estate; raw/root/scanned bytes used for retained-capacity cutoff; over-capacity bars clamped to 100%; negative OPEN contradictory to positive deficit; flat job ledger replacing grouped actionable job workflow; all-phase blocking placement-refresh overlay without real freshness status; horizontal clipping; phone tests that only look for labels instead of checking meaningful states/actions and viewport fit.

Do not forward-patch this rejected design. Restore the pre-#770 Complete bytes (qualified 59bca454 frontend) and the prior SOT workflow, remove the rejected qualifier, preserve unrelated project changes and runtime/data. Do not resurrect `sot-turn02-release-d-report-estate.html` as a delivery workaround. A disclaimer about shared roots is not a substitute for correct retained-byte accounting. A single RUNNING fixture is not proof of a complete job workflow. A successful page load is not a filesystem staleness check.
