# SOT Turn 02 Pre-Base Plan

**Stage:** `pre-base`  
**Status:** ACTIVE GOVERNING PLAN — CLEAN LINEAGE — STREAMING OBSERVABLE ESTATE ANALYSIS  
**Date:** 2026-09-17

## 1. Product objective
SOT is a global persistent single source of truth for a storage estate. Turn 02 ends at an evidence-backed recommended consolidation plan:

`Discover → Fingerprint → Cross-reference → Infer → Plan`

Turn 02 never copies, moves, renames, quarantines, deletes, purges, or otherwise mutates owner files. `REMOVE` means recommended removal only. Execution is deferred.

## 2. Clean-lineage and failure rule
Historical failed code, databases, generated HTML, installers and runtime artifacts are research evidence only. A rejected candidate never becomes the ancestor of its correction.

Failed gate sequence: stop → preserve evidence → record rejected assumption in Graveyard → update this Plan when the contract changes → rebuild from the last governed clean baseline → rerun the complete gate.

Turn 02 clean-3 is rejected for incompatible SQLite reuse. Turn 02 v4/v4.1 are also rejected owner candidates: they demonstrated the picker and HTTPS reconnection approach, but their batch enumeration-before-hashing architecture and insufficient live worker observability made real scans operationally opaque. Their source may be consulted as evidence but is not a patch-forward ancestor.

## 3. Runtime architecture
- **WSL/private tailnet:** persistent engine, versioned SQLite evidence/job/event state, storage adapters, fingerprinting, cross-reference and inference.
- **GitHub Pages:** static presentation/control client only.
- **Browser:** never owns authoritative job state. Closing, refreshing or navigating does not interrupt backend work.
- **Transport:** owner browser connects to the private backend through a browser-safe HTTPS tailnet endpoint. The endpoint is persisted and automatically reconnected.
- **No filesystem mutation:** registered owner storage is read-only throughout Turn 02.

## 4. Frozen evidence schema contract
Every observed placement records stable placement identity, content identity after hashing, source/volume, failure domain, filename, extension, full path, created/birth time where exposed, modified time, exact size, scanned time, SHA-256, lifecycle, plan, disposition, evidence revision, last verified, availability/error state, duplicate group/cardinality, role and decision rationale.

Lifecycle is strictly:

`NONE → IN_PROCESS → HASHED → PLANNED → COMPLETED`

Availability/errors are orthogonal. Plan is exactly `KEEP | PROTECT | REMOVE | REVIEW`. Disposition remains `NONE` in Turn 02. Evidence is revisioned, not destructively overwritten.

## 5. Content and duplicate cross-reference
Content identity is immutable byte identity; filename/path are not identity. After hashes become available SOT derives a revisioned duplicate xref for every content object with cardinality >1. Each group exposes content/fingerprint, cardinality, content size, physical bytes, excess bytes, every placement ID/name/path/source/failure-domain/role and later plan/rationale. Duplicate path lists are not serialized redundantly into every placement row.

## 6. Canonical/protection inference
Discovery order, row order, filename and path ordering may never silently choose canonical content. Required independent protection copies are `PROTECT`, never waste. If policy/evidence cannot establish a safe recommendation, use `REVIEW`.

## 7. Controlled inference gate
Before owner-storage qualification, a predetermined synthetic estate of roughly 20–30 placements across at least three storage authorities must prove exact content identities, xrefs, lifecycle states, recommendations, protection semantics and byte arithmetic. Expected truth is declared independently. Repeat results are deterministic and owner files are never mutated.

## 8. Storage selector
The canonical selector remains:

**Available Volumes | Folders | Selected Folders**

Each pane scrolls independently. A folder transferred to Selected immediately disappears from Available/Folders; removing it makes it available again. Transfer controls are single-tap mobile targets. Inventory is shared/cached; selection does not trigger a rescan.

## 9. Streaming multi-queue scheduler architecture — binding
The batch model “enumerate an entire source, then begin fingerprinting” and a single opaque global FIFO are prohibited.

Each enabled source owns a producer and its own **bounded, independently observable queue**. Producers walk their source trees and durably emit file observations into their respective queues while fingerprinting is already underway. One backend scheduler/manager coordinates all source queues and a shared pool of multiple fingerprint workers.

Scheduler requirements:
- fair queue selection prevents one busy/slow source from monopolizing the worker pool;
- at least two nonempty source queues can make forward fingerprint progress concurrently when worker capacity permits;
- spare worker capacity may be reassigned dynamically to queues that have work;
- blocking, backpressure, disconnect or slow I/O on one source cannot stop independent queues;
- queue depth/capacity, producer state and worker allocation are observable per source;
- the scheduler/manager owns durable job lifecycle, source scheduling, worker allocation, backpressure, pause/resume/stop, restart recovery and stall detection;
- browser code never schedules filesystem work.

Required processing behavior:
- a file is durably observed as `NONE`, transitions to `IN_PROCESS` when fingerprint work begins, then `HASHED` on success;
- unreadable/stat/hash failures remain durable observations with explicit evidence/error state rather than disappearing;
- enumeration completion for one source does not wait for other sources;
- hashing begins as soon as the first source queue contains work;
- inference begins only after all producers are finished and all source queues/workers are drained;
- database writes are transactional and must not serialize filesystem reading unnecessarily;
- Pause/Resume/Stop/Restart are durable backend control intent, not browser or memory-only control;
- Restart creates a new evidence revision and may not overlap mutation of the prior revision;
- backend startup explicitly resolves stale active jobs and records the recovery event.

## 10. Durable job/source/worker telemetry — binding
SQLite contains durable global job state plus per-source progress (`job_sources`) and sufficient scheduler/worker/heartbeat state to diagnose a running job after browser reconnect.

Analyze must continuously expose, without opening Activity:
- stage and substage;
- job ID/revision;
- elapsed time and last-progress age;
- discovered files/bytes;
- hashed files/bytes;
- remaining known queued work;
- files/sec and MB/sec;
- total queue depth/capacity plus **per-source queue depth/capacity**;
- active/idle worker count and worker/source allocation;
- unique content, duplicate groups/excess bytes, REVIEW and reclaimable bytes as available;
- warnings, errors, skipped/unreadable;
- current source, folder and file;
- **one row per source** with state, producer state, queue depth, active workers, current folder/file, discovered/hashed files and bytes, elapsed, rate, warnings/errors and last-progress age.

A running state with no progress must never look healthy indefinitely. If no progress event occurs for a defined threshold while work remains, Analyze shows **STALLED** with the age and last known operation. This is diagnostic state, not an invented lifecycle value.

## 11. Live Analyze event stream and durable Activity log
Every meaningful positive and negative backend operation creates a structured SQLite event with timestamp, severity, event type, job/source identity, message and structured detail. No swallowed exceptions or empty catches.

Analyze contains a compact **Live Activity** stream showing the most recent operational events while a job runs. Activity contains the complete searchable/filterable durable history.

Minimum event families:
- job created/started/stage/pause/resume/stop/complete/fail/recovered;
- source enumeration start/progress/complete/disconnect/reconnect/fail;
- scheduler allocation/fairness, queue/backpressure/stall/recovery;
- fingerprint worker start/progress/error/stop;
- placement observation/lifecycle failure summaries;
- database transaction/rollback failures;
- inference start/progress/complete/fail;
- connection/reconnect failures where backend evidence is available.

High-frequency file progress may be coalesced/throttled for event volume, but current file/folder/source telemetry must remain live. Coalescing may never create a silent interval that hides whether work is advancing.

## 12. Connection contract
Connection is automatic from persisted HTTPS backend configuration with continuously visible GREEN/YELLOW/RED health. GREEN requires recent successful heartbeat. YELLOW means connecting/reconnecting/stale heartbeat/degraded. RED means disconnected or backend error. The UI shows the actual failure/retry state; failures never disappear silently.

Opening another browser tab reconnects to the same backend, latest active job, per-source telemetry and recent events without restarting analysis.

## 13. Database/evidence browser
Database remains usable while analysis runs. Omnisearch and filters cover filename, extension, path, source, fingerprint/content ID, duplicate group/cardinality, lifecycle, plan, size, revision, availability and errors. Selecting content/group exposes all placements and rationale.

## 14. Owner-facing information architecture
1. **Estate** — registered storage and canonical three-panel selector.
2. **Analyze** — controls, global telemetry, per-source progress, scheduler/worker/queue state and Live Activity.
3. **Database** — searchable placement/content/evidence browser.
4. **Plan** — recommended KEEP/PROTECT/REMOVE/REVIEW proposal and rationale.
5. **Activity** — complete durable event log.

## 15. Schema/version boundary
Every database has explicit schema metadata/version. A new clean candidate uses a new versioned database and preserves incompatible predecessors. `CREATE TABLE IF NOT EXISTS` is not migration. Installer never destroys an older database.

## 16. Qualification sequence — release blocking
1. Create the new versioned schema from this contract.
2. Prove fresh startup and coexistence with historical databases without modifying them.
3. Prove controlled inference fixture and exact lifecycle/xref/arithmetic.
4. Prove streaming producer→per-source bounded queues→fingerprint processing: hashing starts before enumeration finishes.
5. Prove at least two source queues make simultaneous forward fingerprint progress under scheduler control.
6. Deliberately block/slow one source and prove another independent source continues to enumerate and fingerprint.
7. Prove scheduler fairness and dynamic spare-capacity allocation without corrupting evidence.
8. Prove durable pause/resume/stop/restart and non-overlapping revisions.
9. Prove backend restart recovery of stale active work with durable event evidence.
10. Prove every discovered file becomes a durable observation, including injected stat/read/hash failures.
11. Prove global/per-source counters, bytes, rates, per-source queue depths and worker allocations reconcile with fixture truth.
12. Inject a deliberately blocked/slow worker and prove STALLED/last-progress diagnostics become visible, then recovery is recorded.
13. Prove Analyze Live Activity and Activity log expose positive progress and injected failures; no silent catch paths.
14. Prove Database reads remain usable during active analysis.
15. Prove bounded real-storage read-only adapters and the three-panel selector.
16. Prove HTTPS automatic reconnect from a second browser tab restores the same active job and telemetry.
17. Only then hand the owner the application test URL.

Internal qualification surfaces are engineering evidence, not owner deliverables.

## 17. Deferred
Deferred beyond Turn 02: plan execution; copying; moving; renaming; quarantine; deletion/purge; disposition beyond `NONE`; AI/LLM recommendations; semantic/near-duplicate detection; unrelated tagging.

## 18. Governance
Stage chain remains `pre-base → base → pre-ship → ship → post-ship`. Before every repository write fetch current `main` and current target blob SHA. Preserve unrelated work. Plan is binding positive specification; Graveyard is binding negative specification. Failed artifacts remain evidence only and are never patched forward.


## 18. Owner-test corrections — binding (2026-09-18)
- Estate volume rows represent currently usable storage only. A stale/unavailable mount is not shown merely because a directory exists under /mnt or /media. Selected volume row is visibly highlighted.
- Evidence Database displays a stable placement key on every row plus Created, Modified, Size in MB, Filename, Extension and Path as separate columns, while retaining fingerprint/lifecycle/plan/group/availability evidence.
- Every Database cell is copyable by tap/click and confirms the copied value with a non-blocking toast.
- OMNISEARCH is operational on Database evidence and searches the displayed evidence fields, including placement key, filename, extension, path, timestamps, fingerprint, lifecycle, plan, group and availability.
- Browser/backend transport must survive backend process failure: the WSL service is supervised/restarted, health state distinguishes reconnecting from disconnected, and API responses retain CORS headers. Repeated failed polling must not create an opaque failure loop.


## 19. Estate identity and overlap prevention — binding (2026-09-18)
- WSL itself is a selectable storage authority: the Estate picker exposes the WSL root filesystem `/` and permits navigation through the complete readable WSL directory tree, while mounted Windows/external volumes remain separately visible.
- Evidence has a first-class `ESTATE` field. ESTATE identifies the registered estate/source root; PATH remains the complete placement path including all subfolders. Estate catalog/filtering is therefore independent of path depth.
- The Estate surface includes a catalog of registered estate roots.
- Registration overlap is prevented upstream. Any candidate folder equal to, inside, or containing an already registered estate root is marked as already/overlapping Estate and is non-selectable. The backend independently rejects an overlapping registration even if the client is bypassed.
- Placement identity is revision/job scoped. Re-analysis of the same source/path must create a distinct placement observation and may never raise a placement primary-key UNIQUE error.


## 20. Owner interaction, preview, and durable continuation — binding (2026-09-18)
- Estate folder-list scroll position is user-owned UI state. Background health/job/source polling may not rebuild the picker or reset its scroll. Navigation may change it; returning to a previously visited folder restores its remembered scroll position.
- Database Filename includes a read-only preview action. Supported inline preview types are PDF, HTML, Markdown, MP4, PNG, JPG/JPEG and TXT. HTML preview is sandboxed; source content is never executed with SOT privileges. Preview modal includes Open externally, which streams the exact registered placement read-only and lets the browser/OS choose its native viewer. Unsupported types retain Open externally.
- File-serving is placement-ID based. The backend resolves the path from evidence; clients may not submit arbitrary filesystem paths to the file endpoint. Only a placement belonging to registered Estate evidence may be served.
- Analyze exposes authoritative backend job state continuously and independently of elapsed-time decoration. RUNNING remains RUNNING across page refresh/tab changes; transport loss reports connection loss without implying the backend job stopped.
- Analyze controls are Start | Pause/Continue | Stop. The control corresponding to authoritative state is visibly active. Start creates a new evidence revision only when no resumable interrupted revision is being continued.
- Pause/Continue and interrupted-job recovery are same-revision continuation. Durable HASHED/COMPLETED placements are skipped. Enumeration may revisit paths to reconstruct unfinished work, but existing observations are reused rather than duplicated, counters are not double-counted, and only unfinished/unhashed observations are requeued.
- Backend restart may mark an interrupted job recoverable, but must retain sufficient durable evidence for explicit Continue. Continue reconstructs queues/workers from that revision without creating a new revision.
- Client request timeouts are endpoint-appropriate and must not surface self-induced AbortController failures as backend disconnects during healthy but slower evidence queries.


## 21. Transport health isolation and retry policy — binding (2026-09-18)
- Connection GREEN/YELLOW/RED is determined only by the lightweight /api/health channel. Database, event, source, or snapshot latency may not declare the backend disconnected.
- Health probes use a short endpoint-specific timeout and bounded retry with backoff. Three consecutive health polling failures are required for RED; recovery to GREEN is automatic on the first successful health cycle.
- Job/sources/events use a separate data channel with bounded retries. Failure leaves last-good UI state visible and marks data retrying; it does not change connection health.
- Placements use a separate heavy Database channel, lower cadence, longer timeout and bounded retry. Failure reports Database retrying/stale while preserving last-good rows.
- Poll loops are non-overlapping per channel. Slow work may not accumulate concurrent duplicate requests.


## 22. V9 connection recovery correction — binding (2026-09-18)
- The rejected V8 retry patch is not an ancestor. V9 is rebuilt from the last owner-observed initially connecting V8 client at commit 0f633de218406aa78e7f599f0f98dbf259c5efba.
- There is exactly one non-overlapping browser poll cycle. It establishes lightweight health first. A successful health response immediately establishes GREEN even if a later operational-data request fails.
- Job/events/sources failures preserve last-good state and report data retrying without changing transport health.
- Placements are not part of ordinary Estate/Analyze/Activity polling. Heavy placement retrieval occurs only while Database or Plan is active, with a longer timeout, and failure preserves last-good rows.
- Retry is cadence-based and bounded by the single poll lock; no nested retry storm or overlapping health probes is permitted.


## 23. Turn 02 V8 redeployment lineage correction — binding (2026-09-18)
- Owner correction: V7 is the last accepted implementation baseline. V8 and V9 are rejected/defunct and may not be implementation ancestors.
- The next owner candidate retains the V8 product name but is a clean redeployment built directly from V7 source commit 3d614c258b9352c7a907acb43ac0ab20ce0fb441.
- This redeployment first restores the V7 connection/scan behavior without importing V8/V9 polling, continuation, preview, or retry implementation code. Those requirements remain product requirements for later governed implementation only after the V7-derived candidate is stable.
- Use a fresh schema-7 database path so rejected V8 runtime state cannot contaminate qualification. Preserve all predecessor databases as evidence.


## 24. V7 latent schema/write failure recovery — binding (2026-09-18)
### Root cause established from source and owner runtime evidence
- V7 added `placements.estate TEXT NOT NULL` to the schema but did not add `estate` to either placement INSERT path in `_produce()`: the normal observation INSERT and the error-observation INSERT both retained the pre-Estate V6 column/value contract.
- Therefore every enumerated file reaches SQLite with no value for a required column and fails with `NOT NULL constraint failed: placements.estate`. The producer catches that first failure, attempts the second INSERT which has the same omission, and records repeated `source_file_error` events. No placement can enter the fingerprint queues, so Discovered/Scanned remain zero while the job misleadingly remains RUNNING/ENUMERATING.
- The V7 source was transport/startup qualified but not qualified through a real placement-write/fingerprint path after the Estate schema change. Treating V7 as a fully accepted engine baseline was incorrect.

### Rollback boundary
- V8/V9/recovery-V8 are rejected and not ancestors.
- For the scan engine, roll back to the last pre-Estate write contract: V6 engine source at commit 09880afc339998408e293fcf341102c23b402773. Reapply the governed V7 Estate requirements as a complete schema+write+read delta, not by copying the defective V7 engine.
- V7 presentation/server behavior may be used only as requirement/reference evidence; defective V7 engine code is not an implementation ancestor.

### Required clean V8 rebuild
- Fresh V8 database; preserve all rejected databases.
- `sources.estate` and `placements.estate` remain required first-class evidence.
- Every placement INSERT, including error evidence, explicitly supplies `src['estate']`.
- Placement identity is job scoped: SHA-256(job_id + NUL + source_id + NUL + path).
- Source snapshot/API includes Estate explicitly.
- Before deployment, qualification must create a temporary registered Estate containing at least one readable file, start analysis, and prove: placement row inserted; Estate non-null and correct; fingerprint non-null; lifecycle advances; discovered/hashed counters advance; no `source_file_error` caused by schema/write mismatch.
- Qualification must also exercise an error-placement write path or an equivalent direct schema-contract test proving Estate is supplied there.
- Startup/health/HTTPS checks alone are never sufficient after an evidence-schema change.


## 25. Mobile-first interaction shell, Database grid, and Omnisearch — binding (2026-09-18)
- The application shell is viewport-bound and does not page-scroll. Header, primary navigation, and active workspace remain above the fold. Long content scrolls only inside explicitly bounded workspace components such as the Database grid or Activity ledger.
- Estate and Analyze each have sub-tabs. Estate separates at minimum Picker and Catalog. Analyze separates at minimum Overview, Sources/Queues, and Live Activity. Switching sub-tabs never changes backend job state or rebuilds unrelated picker state.
- Browser-native `alert()`, `confirm()`, and `prompt()` are prohibited in shipped SOT UI. Routine status/success/error feedback uses SOT toasts. User decisions, configuration, and detailed failures use an application modal. Durable operational errors remain in Activity.
- Database is a viewport-contained full-record evidence grid. The complete governed placement record is represented by columns rather than silently dropping evidence to fit the viewport. Horizontal/vertical movement belongs to the grid, not the page.
- Database columns are user-resizable. Widths persist locally across reloads and are restored by stable field/column identity. Resizing one column may not destroy neighboring widths or evidence.
- OMNISEARCH is a Database query composer with type-ahead/autocomplete for governed column names and available values/operators. Field syntax includes e.g. `created:<query>`, `modified:<query>`, `estate:<query>`, `path:<query>`, `filename:<query>`, `plan:<query>`, `status:<query>` and all displayed evidence columns.
- Bare terms search all searchable evidence fields. A leading minus excludes: `-Beach` means records containing Beach anywhere are excluded; field-qualified negatives such as `-modified:<query>` exclude matches in that field. Whitespace composes AND; explicit uppercase/lowercase `OR` composes alternatives. Query parsing is deterministic and never mutates evidence.
- Type-ahead must help populate valid field prefixes and, after a field prefix, matching values from loaded evidence. Selecting a suggestion updates the query without immediately destroying the rest of the expression.
- Release gates statically reject `alert(`, `confirm(`, and `prompt(` in shipped client JavaScript; verify no page-level overflow at target mobile viewports; verify Estate/Analyze sub-tabs; verify persistent column resize; verify positive, negative, field-qualified and OR Omnisearch behavior.


## 26. Estate friction-free hierarchical picker — binding (2026-09-18)
- Available Volumes populates automatically when Estate first opens and after backend reconnection. Refresh Volumes remains a manual recovery control only; it is never required for normal initialization.
- Volume discovery exposes actual storage authorities only. WSL itself is represented once by root `/`. WSL infrastructure pseudo-mounts such as `/mnt/wsl`, `/mnt/wslg` and equivalent implementation plumbing are excluded. Readable mounted Windows/external volumes remain separate authorities.
- Estate Picker remains three panes: **Available Volumes | Folder Tree | Selected Estate Roots**.
- Folder Tree is hierarchical and expands/collapses in place. Left disclosure control is `▸` collapsed / `▾` expanded. Folder-name tap may also toggle disclosure. Expansion never selects the folder.
- Right-side membership control is independent of navigation: `>` means this exact folder can be selected as an Estate root; `<>` means this row is covered by an explicitly selected or already-registered ancestor (including itself); `<` means this folder contains an explicitly selected/registered descendant but the parent itself is not selected.
- Selecting a nested folder requires no destructive navigation and no selection of its parent. The right pane contains only explicitly selected roots, never inherited descendants.
- Selecting a parent makes descendants inherited/covered, not additional registrations. Existing backend overlap prevention remains authoritative and rejects equal/ancestor/descendant overlap if client state is bypassed.
- Expansion and scroll state persist independently per volume/root while the page remains open. Switching volumes and returning restores the prior tree state. Background polling/re-rendering may not collapse, reposition, or clear the user's tree.
- Folder enumeration is lazy per expanded node. The client does not recursively enumerate an entire volume merely to draw the tree.
- Qualification proves automatic volume load; exclusion of WSL pseudo-mounts; exact nested-only selection; parent-selected inherited child state; descendant-selected parent indicator; independent expand/select controls; overlap rejection; and per-volume expansion/scroll restoration.


## 27. SQLite availability and failure isolation — binding (2026-09-18)
- Runtime evidence showed the backend process stayed alive while localhost/HTTPS health timed out and scheduler/worker database access raised SQLite unable-to-open errors against the existing configured DB. Transport failure was downstream of evidence-store failure.
- Store owns one startup-opened long-lived SQLite connection instead of opening a connection per operation. Store serializes access and commits/rolls back before releasing its lock.
- Startup validates the DB parent and performs a DB write/read probe before accepting work.
- Database failure is never handled by an unguarded attempt to log through the same failed database. Logging has a non-throwing stderr fallback.
- Producer, worker, supervisor, and API paths contain database failures so a dead worker cannot leave a job indefinitely RUNNING.
- Health proves Store responsiveness.
- Qualification includes sustained concurrent hashing/writes plus health, snapshot, source, event, and placement reads; any DB-open error, dead worker, timeout, counter mismatch, or stuck RUNNING state fails the candidate.


## 28. Shared OpenClaw/Tailscale access plane — binding (2026-09-18)
- Preserve the established single-origin HTTPS access plane on `https://oc-ref.fell-dojo.ts.net`.
- Existing routes are protected: `/` → OpenClaw Gateway `127.0.0.1:18789`; `/report` → Python report server `127.0.0.1:18080`. Existing report/file-service routes must remain intact.
- SOT joins the existing HTTPS origin at `/sot` → `127.0.0.1:8765`. Do not create a separate `:8443` SOT listener.
- The SOT browser API origin is `https://oc-ref.fell-dojo.ts.net/sot`.
- Installer/upgrade must snapshot Serve state, add only the SOT path, and verify protected routes remain present. It must not reset or replace the Serve configuration.
- Qualification must prove OpenClaw root, report route, and SOT health after the route addition.



## 29. Sustained-runtime correction — binding (2026-09-18)
- The deployed schema-8 V8 candidate is rejected after owner evidence showed a job remaining at startup/enumeration events for hours while transport health stayed GREEN.
- Network health and analysis forward progress are separate gates. A healthy /api/health response may not qualify scheduler/database execution.
- The replacement engine is rebuilt from the governed pre-Estate engine baseline `09880afc339998408e293fcf341102c23b402773`, not from the rejected schema-8 engine.
- Reapply Estate as a complete schema/write/read contract, use a fresh schema/database, serialize SQLite access through one startup-validated long-lived Store connection, and protect shared scheduler round-robin/done state from worker races.
- Before owner deployment, a sustained multi-source fixture must prove hundreds of placement writes and hashes, progress on every source, multiple workers, repeated concurrent snapshot/database reads, final counter reconciliation, zero ERROR events, and responsive Store health.
