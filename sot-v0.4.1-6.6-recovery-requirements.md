# SOT v0.4.1 — Build 6.6 Recovery Requirements

Status: LOCKED implementation requirements derived from owner review on 2026-08-17.

This build must recover from the failed 6.5 backend attempt without putting the shared `openclaw-report-server.service` at risk. No candidate backend may replace the live `sot-api.js` until the candidate passes `node --check`, can be required by Node in isolation, and the current live backend has been backed up. Deployment must be atomic and automatically roll back if the service does not become healthy.

## 1. Configuration — troubleshooting log

Configuration must expose a comprehensive operational log. It is not optional diagnostic boilerplate.

Required log fields:
- timestamp
- level: debug/info/warn/error
- component: UI/API/filesystem/database/fingerprint/project-setup/report-server
- UI build and backend build
- project token and project name where applicable
- run id where applicable
- source id/source path where applicable
- current filename/path where applicable
- operation/action
- phase/state
- files/folders/bytes counters when applicable
- percent complete when mathematically valid
- elapsed time, rate and ETA when applicable
- error code/message/stack where applicable

Persistence:
- authoritative WSL log records persisted in SQLite in an allowlisted `app_log` table
- optional rotating text mirror under `~/.openclaw/sot/logs/` is permitted but SQLite remains queryable authority
- log survives browser refresh and report-server restart

Configuration UI:
- live status summary
- actual SQLite database path and backup path
- database size, schema version and integrity result
- searchable log table
- filters for level, component, project and run
- newest-first/oldest-first sort
- clear display of current UI build and backend build
- Copy/Export log action
- no arbitrary SQL

## 2. Fingerprinting — durable state machine

Fingerprinting must be checkpoint-backed and robust.

Required states:
- Ready
- Discovering
- Fingerprinting
- Paused
- Stopped
- Complete
- Complete with warnings
- Error

Required controls:
- Start — new run from a project with no active checkpoint
- Pause — stop after the current atomic file operation while preserving exact run position
- Continue — resume the SAME run and SAME persisted inventory/checkpoint; never rediscover from zero when a usable checkpoint exists
- Stop — terminate the run while preserving the checkpoint and current evidence
- Restart — explicitly discard the current run checkpoint/work queue and begin a new discovery run; this is the only control allowed to intentionally restart from zero

The controls must reflect state. Invalid controls are disabled rather than silently mapped to another action.

## 3. Discovery and denominator

A real percentage is not shown until discovery establishes an exact denominator.

Discovery must persist its work queue/inventory to SQLite progressively, not only at the end. Directory traversal state must also be durable so Pause/Stop/Continue during discovery resumes from the remaining directories rather than rescanning completed scopes.

During discovery show:
- current folder/path
- folders scanned count
- folders remaining when known
- files discovered count
- bytes discovered accumulator
- elapsed discovery time
- visibly active indeterminate progress indicator

At discovery completion persist and lock for that run:
- folder count
- file count
- total bytes
- durable file work queue

Then switch to determinate fingerprint progress.

## 4. Fingerprinting telemetry

During hashing show continuously:
- current filename and full path (truncated visually with full path inspectable)
- current source/folder
- files complete / files total
- bytes complete / bytes total
- actual percent complete
- progress bar
- elapsed time
- throughput (files/sec and bytes/sec where useful)
- ETA after enough observations exist; no fake ETA before then
- unchanged hashes reused
- warnings/errors/skipped count

Progress must be written to SQLite frequently enough that browser refresh, service restart, Pause, Stop and Continue recover meaningful state.

## 5. File-level evidence and errors

Every readable selected file receives a full-file cryptographic SHA-256 fingerprint.

Unreadable files must NOT abort the entire project. Examples include `EIO`, permission failures, disconnected media and cloud placeholders.

For each failed file persist:
- path
- source id
- attempted timestamp
- error code/message
- status `error`
- retry count

The run continues with subsequent files. Final state is `Complete with warnings` when fingerprintable files complete but one or more files remain unreadable. The UI must expose the failed-file count and allow the operator to inspect the failures.

## 6. Continue semantics

Continue is never an alias for Start.

Continue must load:
- existing run id
- durable directory discovery queue if discovery incomplete
- durable file inventory/work queue
- already-completed file hashes
- files/bytes counters
- elapsed time

It resumes the next unfinished operation. Previously completed hashes are not recalculated unless file stillness evidence changed or the operator explicitly used Restart.

## 7. Inline project rename in Fingerprinting

The project name shown at the top of the Fingerprinting workspace is directly editable inline.

Required interaction:
- click/tap project name to edit
- Enter commits
- blur commits
- Escape cancels current edit
- empty names are rejected and original value restored
- WSL persists through `PATCH /api/sot/projects/:project_token`
- browser adapter persists to IndexedDB
- project rail updates immediately after successful save
- rename does not change project token or fingerprint/run evidence

## 8. Project Setup — simple progressive counting

Restore progressive feedback while reading folders, but keep representation simple.

Per folder row while metadata is being read:
- running file count
- running byte accumulator
- final file count
- final byte size
- last updated when known

Project-level source builder summary while reading:
- folders completed / folders total
- cumulative files discovered
- cumulative bytes discovered

For the staged Project panel show cumulative:
- staged folder count
- known file count
- known byte count

No complex charts or verbose status text are required. A compact running counter is preferred.

Cached metadata remains preferred on subsequent opens; counters may begin from cached values and update only changed scopes.

## 9. Database visibility

WSL Configuration must explicitly display the actual authoritative database path:

`/home/support/.openclaw/sot/sot.sqlite`

and configured backup folder, with copy-path controls. The operator must never have to infer where the database lives.

## 10. Deployment safety — mandatory

Because `session-server.js` serves all reports, SOT backend deployment may not make the shared report site unavailable.

Deployment sequence:
1. Build candidate backend at a separate temporary path.
2. `node --check` candidate.
3. Load/require candidate in an isolated Node process.
4. Back up current live `sot-api.js`.
5. Atomically replace live backend.
6. Restart `openclaw-report-server.service`.
7. Poll local `/api/sot/health` for a bounded interval.
8. If health fails, automatically restore backup, restart service, and verify prior health.
9. Only after local health passes verify public health.
10. UI deployment occurs only after backend health is established.

No future installer may write syntactically invalid JavaScript to the live backend before validation.

## Owner gate for build 6.6

A build is not acceptable until all of these are demonstrated:
- Configuration shows DB path, DB integrity and searchable persistent logs.
- Project Setup shows simple progressive folder/file/byte counters.
- Project name can be renamed inline in Fingerprinting and survives refresh.
- Start discovers and persists inventory.
- Fingerprinting visibly processes filenames after discovery.
- Percent/progress bar only appears once denominator is known.
- Pause preserves position.
- Continue resumes without recounting from zero.
- Stop preserves checkpoint.
- Restart explicitly starts over.
- A deliberately unreadable file is logged as an error without aborting the rest of the run.
- Browser refresh during a run does not lose durable progress state.
- Report-server restart does not lose durable progress state.
- No additional service/port is introduced.
- All non-SOT `/report/` pages remain available throughout deployment and rollback testing.
