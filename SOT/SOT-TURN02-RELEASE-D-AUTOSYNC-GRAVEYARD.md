# SOT Graveyard Addendum — Manual SSOT Re-authorization

**Decision date:** 2026-09-29

Rejected and must not return:

- treating normal source staleness as an owner decision;
- requiring **Analyze**, **Analyze again**, **Kick off**, or Estate → Picker merely because an already registered SSOT source changed;
- using **Action Needed** on Sources for routine freshness drift;
- making Queue and Sources present unrelated meanings under the same **Action Needed** label;
- requiring the owner to reconcile scheduler/job state to decide whether SSOT should maintain itself.

Required replacement:

- source registration is the standing authorization for SOT to maintain that source;
- new registration automatically synchronizes;
- detected metadata drift automatically queues the existing deduplicated analysis path;
- duplicate triggers remain safe through source-level live-work dedupe;
- Sources presents **Current / Updating / Problem**, where **Problem** means SOT could not maintain the source without intervention.

This supersedes the 2026-09-29 Source Action / Clarity addendum requirement for manual **Analyze N**, per-source **Analyze**, and **Analyze again** controls.

---

## 2026-09-29 — CONTINUOUS SSOT / UNIFIED ANALYZE NEGATIVE RULES

Rejected and must not return:

- requiring the owner to press **Restart** merely because the SOT service/runtime was interrupted while registered-source synchronization was in progress;
- treating a recoverable service interruption with zero source errors as an owner decision;
- forcing the owner to reconcile separate **Queue** and **Sources** operational models to determine whether SSOT is correct;
- showing historical `INTERRUPTED` state as the primary source status while replacement live recovery already covers that source;
- exposing routine job lifecycle controls as the primary way to keep a registered source current;
- replaying every historical INTERRUPTED job on each service startup.

Required replacement:

- runtime startup automatically recovers work interrupted by that startup and automatically covers enabled stale/pending sources through the existing deduplicated analysis path; historical INTERRUPTED records whose sources are already current remain durable backend history;
- durable fingerprints/evidence are reused; interruption does not authorize deliberate rehash of already valid unchanged content;
- Analyze is one owner-facing **SSOT** surface: **Current / Syncing / Problem / Soft Deleted**;
- **Problem** is reserved for a condition SOT cannot continue automatically;
- job records, source snapshots and logs remain durable backend/diagnostic evidence, not a normal owner-facing workflow;
- Pause/Resume remains an explicit owner control;
- live recovery coverage overrides historical interruption when computing owner-facing source status.

This supersedes the prior Release D requirement that Queue and Sources remain parallel owner-facing status surfaces and that `INTERRUPTED` automatically belongs in owner-facing Action Needed. The durable scheduler/job ledger remains; only its owner-facing role is removed.

---

## 2026-09-29 — SYSTEM HISTORY ON PRIMARY SSOT SCREEN

Rejected and must not return:

- a **System history** section on the normal Analyze/SSOT screen;
- exposing the internal job ledger merely because the records are durable;
- spending owner-facing UI space on implementation history that is only needed for engineering diagnosis.

Required replacement:

- the primary Analyze surface contains only the SSOT states and controls needed for normal operation;
- durable job/event/history evidence remains stored and available to diagnostics/engineering without being rendered on the primary SSOT screen.

---

## 2026-09-29 — PRIMARY NAVIGATION / SEARCH / ACTIVITY NEGATIVE RULES

Rejected and must not return:

- separate Database and Grid primary buttons for two views of the same search result set;
- a database-cylinder icon for the unified Search surface;
- Grid-only bulk operations while Table exposes the same result set;
- separate primary Report and Analyze icons;
- Estate Catalog as a normal owner workflow under the Add to Estate action;
- Activity as a standalone primary navigation button;
- runtime logging that can only be inspected by leaving the application or manually manufacturing a diagnostic bundle;
- writing raw operational logs or SQLite diagnostics into the public application repository.

Required replacement:

- visible primary navigation is **Report / Search / Add to Estate / AI**;
- Report owns **Report / Analyze** subtabs;
- Search owns **Table / Grid** views and both expose Tag / Notes / Delete / Folder bulk operations;
- Search uses a magnifying-glass icon; Add to Estate uses a plus icon and opens Picker;
- Log / Activity lives in Configuration with Download / Copy / Clear;
- the structured runtime log remains local and automatically mirrors to the separately cloned private diagnostics Git repository when that checkout is configured;
- clearing the runtime JSONL does not delete SQLite durable event history.
