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
- Sources presents **Current / Updating / Problem**, where **Problem** means SOT could not maintain the source without intervention;
- Queue remains execution machinery/history and only surfaces **Action Needed** for exceptional job failures/interruption.

This supersedes the 2026-09-29 Source Action / Clarity addendum requirement for manual **Analyze N**, per-source **Analyze**, and **Analyze again** controls.
