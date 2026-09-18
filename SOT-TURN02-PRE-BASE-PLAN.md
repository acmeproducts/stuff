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
