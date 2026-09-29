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
- exposing routine job lifecycle controls as the primary way to keep a registered source current.

Required replacement:

- runtime startup automatically recovers unfinished interrupted registered-source work through the existing deduplicated analysis path;
- durable fingerprints/evidence are reused; interruption does not authorize deliberate rehash of already valid unchanged content;
- Analyze is one owner-facing **SSOT** surface: **Current / Syncing / Problem / Soft Deleted**;
- **Problem** is reserved for a condition SOT cannot continue automatically;
- job records, source snapshots and logs remain durable under collapsed **System history**;
- Pause/Resume remains an explicit owner control;
- live recovery coverage overrides historical interruption when computing owner-facing source status.

This supersedes the prior Release D requirement that Queue and Sources remain parallel owner-facing status surfaces and that `INTERRUPTED` automatically belongs in owner-facing Action Needed. The durable scheduler/job ledger remains; only its owner-facing role is demoted beneath SSOT.
