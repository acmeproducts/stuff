# SOT Turn 01 — Project Service Surface Redesign

**Stage:** base redesign  
**Branch:** `sot-turn01-service-surface-redesign`  
**Status:** ACTIVE

## Product decision

Project cards are informational only. All project work happens inside one persistent Project Service surface. The prior per-project tab model is removed.

## Information architecture

### Left rail — Projects

Each project card shows only compact status information:

- Project name
- committed evidence revision
- durable workflow state
- current operation, if any
- files / bytes / source count
- last successful index time
- warning/error badge

Cards do not contain Play, Pause, Stop, Plan, Execute, menu, or other work controls. Clicking a card only selects that project and opens its Project Service.

### Main surface — Project Service

A selected project renders one vertically scrollable service workspace with these always-present regions:

1. **Project header**
   - editable project name
   - committed state: Sources / Indexed rN / Planned rN / Executed rN
   - separate live operation badge: Indexing / Planning / Executing / Paused / Failed
   - last successful index timestamp

2. **Storage & Scope**
   - Sources summary
   - Target
   - Backup
   - one Edit Setup action using the shared storage selector

3. **Index & Evidence**
   - committed evidence revision and counts always visible
   - duplicate findings (2-copy / 3-copy / 4+)
   - Start Index / Re-index
   - progress panel for active index: phase, files, bytes, current item, elapsed activity
   - Pause / Resume / Stop only here
   - replacement indexing never hides committed evidence

4. **Plan**
   - current plan revision and status
   - stale-plan history collapsed below
   - Generate Plan / Approve as appropriate
   - current plan remains visible during replacement indexing until a newer evidence revision commits

5. **Execution**
   - execution readiness and item counts
   - Execute / Pause / Stop controls for execution
   - target and backup verification state

6. **Activity**
   - durable chronological operation/event ledger
   - queued/start/progress/pause/resume/stop/fail/complete/stale-discard/restart events
   - no modal required to understand whether work is progressing

## Interaction contract

- Selecting a project must switch the main surface synchronously. No network request may block selection.
- The service surface skeleton renders immediately from cached/project-summary state.
- Data regions hydrate independently; a slow region shows its own contained loading state.
- No global loading overlay after initial HTML parse.
- No timer may call `renderCards`, `renderWorkspace`, or rebuild the whole Project Service.
- Polling/event refresh may only update keyed status/progress/activity nodes.
- Search, scroll, open picker, focused input, and selected project are operator-owned and cannot be reset by background refresh.
- A committed evidence revision is authoritative until a newer revision successfully commits.
- `processing_state` is an operation overlay only; it cannot demote the committed project state.

## Responsiveness target

For browser qualification, project selection and service-section controls must produce visible UI feedback in the same event turn, independent of backend latency. Tests will inject multi-second API delays and continuous progress updates while asserting that project selection, scrolling, setup editing, and other non-conflicting UI actions remain responsive.

## Backend/UI data model

Project summaries must expose two separate state channels:

- **Committed state:** `evidence_revision`, current-plan revision/state, execution/certification state, last successful index time.
- **Active operation:** operation id, kind, lifecycle state, progress, current item, timestamps.

The UI must never infer committed workflow state from latest-run state.

## Release gate

No owner test handoff until an automated browser harness proves:

1. project-card click switches service instantly under artificial API delay;
2. service surface remains usable during active indexing in another project;
3. committed Index remains present during failed/cancelled replacement index;
4. no periodic full-surface DOM rebuild occurs during progress updates;
5. active-operation progress visibly advances without navigation flashing;
6. one project can index while another project is navigated/configured/planned independently;
7. reload restores committed indexed state and selected project without requiring re-index.
