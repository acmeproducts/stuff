# SOT Turn 02 Release D — AI Task Instances / Result Download

**Decision date:** 2026-09-28  
**Status:** OWNER APPROVED / FRONTEND CANDIDATE

## Scope

Canned AI task types are permanent launchers, not one-use task records. A selected, running, or completed task instance must not make the canned task catalog unavailable.

- **New AI task (+)** always returns to the complete canned catalog.
- Every canned-task launch continues to use the existing `/api/ai/task/create` contract, producing a distinct durable task ID and snapshotting the launch's current search/scope.
- Multiple instances may coexist and run independently, including multiple instances of the same canned task type with different inputs/scopes.
- Historical task cards remain available; opening the catalog does not delete or mutate them.
- Every task detail surface exposes **Download** with **Markdown** and **JSON**.
- Markdown contains readable task metadata, transcript, provider/model metadata where present, scope, and evidence revision context.
- JSON is the complete persisted public task record returned by `/api/ai/task`. API keys are not persisted in that record.

## Implementation boundary

Frontend-only candidate. Existing Release D backend AI execution, comparison jobs, Auto Tag governance, Analyze scheduler, Database, Grid, Plan, source/job lifecycle, and filesystem behavior are unchanged. The accepted `sot-turn02-release-d.html` baseline remains byte-for-byte unchanged for rollback/comparison.

The candidate loads that same-origin accepted baseline and adds only the approved New Task and Download controls. This is a comparison artifact, not a backend/runtime migration.

## Mechanical evidence

Baseline approved UI checks: **0/4** (no persistent New Task launcher, Markdown download, JSON download, or task-detail Download control).

Candidate static checks: **6/6** — accepted baseline reference preserved; New Task control present; Markdown export present; JSON export present; task-detail Download present; controls are re-applied after AI DOM rerenders. Candidate JavaScript parses successfully under Node.

Backend concurrency was not changed: current Release D `AI.run()` rejects only when that specific task record is already `analyzing/applying`, stores active runs by `task_id`, and starts a separate daemon thread per task ID. Existing `create()` generates a new task ID per launch.
