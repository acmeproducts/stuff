# SOT Graveyard Addendum — Source Action / Clarity

**Decision date:** 2026-09-29

Rejected and must not return:

- a Sources surface that says **Action Needed** but provides no direct way to perform that action;
- forcing the owner back through Estate → Picker to reselect an already registered source merely to analyze it again;
- making the owner manually reconcile Registered / Action Needed / Running / Completed counts to understand estate state;
- showing an Analyze control on a source already covered by live Queue work;
- using Sources for job-lifecycle mechanics such as Restart, Abort/Delete, or job logs;
- a dead Estate Catalog that lists roots without their current analysis status;
- source detail dominated by worker/job mechanics instead of source outcome/currentness.

Required replacement:

- Analyze → Sources has a compact summary of **Need analysis / Running / Current / Registered**;
- one **Analyze N** action queues all uncovered Action Needed sources;
- Action Needed cards expose **Analyze** and Completed cards expose deliberate **Analyze again**;
- Running cards do not expose another Analyze action;
- source Analyze actions use the existing source-ID `/api/job/enqueue` path and its live-work dedupe, so accidental repeated taps remain safe;
- Queue remains the only surface for Restart, Abort/Delete, job logs, and job-level execution lifecycle;
- Estate Catalog shows canonical source status and points execution to Analyze → Sources.

This specifically supersedes the older blanket rule “Restart or other job execution controls on the Sources surface.” The retained prohibition applies to **job lifecycle controls**; direct source-level Analyze is now owner-approved.
