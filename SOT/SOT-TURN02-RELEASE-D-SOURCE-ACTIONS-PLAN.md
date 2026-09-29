# SOT Turn 02 Release D — Source Action / Clarity Addendum

**Decision date:** 2026-09-29  
**Status:** OWNER REQUESTED / TEST CANDIDATE

## Owner report

The Sources surface correctly identifies four stale sources, but the application gives no direct way to re-run those sources. The Estate Catalog is also a dead list, and the Queue/Sources presentation makes the owner interpret internal state instead of presenting the simple operational answer.

Owner requirement: **“its not possible to rekickoff from the app also I need this to be MUCH CLEANER AND MUCH MORE CLEAR.”**

## Working definition

1. Analyze → Sources immediately answers four questions: how many sources need analysis, how many are running, how many are current, and how many are registered.
2. When N sources genuinely need action and are not already covered by live Queue work, one **Analyze N** control queues exactly those source IDs.
3. Each Action Needed source has a direct **Analyze** control.
4. A Completed source has **Analyze again** for deliberate owner re-analysis.
5. A Running source does not offer another Analyze control.
6. Existing backend source-level live-work dedupe remains authoritative, so repeated taps or accidental duplicate launches do not create duplicate queued/running work.
7. Source detail is outcome-first: currentness, last analyzed, processed files/bytes, errors, root, last path. Job mechanics stay on Queue.
8. Estate → Catalog shows each registered root with its current canonical analysis status and explicitly routes execution to Analyze → Sources.
9. Preserve the previously shipped AI task-instance controls: permanent New AI task access and Markdown/JSON task download.
10. No backend, database, scheduler, filesystem, source-registration, or analysis semantics change.

## Governance note

This owner request explicitly supersedes the 2026-09-25 negative rule that prohibited all job-execution controls on Sources. The narrower replacement is: **job lifecycle controls (Restart, Abort/Delete, job logs) remain Queue-only; source-level Analyze / Analyze again may live on Sources because it creates a new source-scoped analysis job through the existing deduplicating `/api/job/enqueue` contract.**

## Candidate implementation

Frontend-only candidate `SOT/sot-turn02-release-d-source-actions.html` loads the accepted Release D UI and adds only the approved source-action/clarity controls while retaining the AI task-instance additions. The canonical Release D HTML is not overwritten.

## Mechanical checks

Candidate static contract: **8/8 PASS** — accepted baseline reference; AI New Task retained; AI Markdown/JSON download retained; per-source Analyze uses `/api/job/enqueue`; batch Analyze uses only uncovered pending source IDs; duplicate-work response remains explicit; four-state summary present; Estate Catalog status routing present.

Candidate JavaScript parse under Node 22: **PASS**.

Real browser/backend behavior remains owner-device verification until the candidate is exercised against the live Release D API.
