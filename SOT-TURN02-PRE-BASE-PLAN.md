# SOT Turn 02 Pre-Base Plan

**Stage:** `pre-base`  
**Status:** ACTIVE GOVERNING PLAN — CLEAN LINEAGE — STREAMING OBSERVABLE ESTATE ANALYSIS  
**Date:** 2026-09-20

## 1. Product objective
SOT is a global persistent single source of truth for a storage estate. Turn 02 establishes an evidence-backed recommended consolidation plan and, beginning with the governed Grid release in §43, permits only the explicit owner-initiated filesystem actions defined there:

`Discover → Fingerprint → Cross-reference → Infer → Plan → explicit owner Grid action`

`REMOVE` remains a recommendation only and never authorizes execution. Filesystem mutation is prohibited except for placement-ID-scoped actions explicitly initiated by the owner through the governed Database viewer Trash action or Grid `Folder` / `Delete` flows. No query-only, automatic, inferred, background, AI-driven, or Plan-driven mutation is authorized. Every successful mutation must reconcile authoritative Database evidence, current placement/status evidence, duplicate/system classification, Plan arithmetic, browser caches, and durable Activity before the operation is reported complete.

## 2. Clean-lineage and failure rule
Historical failed code, databases, generated HTML, installers and runtime artifacts are research evidence only. A rejected candidate never becomes the ancestor of its correction.

Failed gate sequence: stop → preserve evidence → record rejected assumption in Graveyard → update this Plan when the contract changes → rebuild from the last governed clean baseline → rerun the complete gate.

Turn 02 clean-3 is rejected for incompatible SQLite reuse. Turn 02 v4/v4.1 are also rejected owner candidates: they demonstrated the picker and HTTPS reconnection approach, but their batch enumeration-before-hashing architecture and insufficient live worker observability made real scans operationally opaque. Their source may be consulted as evidence but is not a patch-forward ancestor.

## 3. Runtime architecture
- **WSL/private tailnet:** persistent engine, versioned SQLite evidence/job/event state, storage adapters, fingerprinting, cross-reference and inference.
- **GitHub Pages:** static presentation/control client only.
- **Browser:** never owns authoritative job state. Closing, refreshing or navigating does not interrupt backend work.
- **Transport:** owner browser connects to the private backend through a browser-safe HTTPS tailnet endpoint. The endpoint is persisted and automatically reconnected.
- **Filesystem mutation boundary:** analysis, inference, Plan, Ask AI, preview, search and ordinary evidence browsing remain read-only. Mutation authority exists only for explicit owner-initiated placement-ID-scoped Database viewer Trash and Grid `Folder` / `Delete` operations governed by §31 and §43. The backend owns execution, verification and authoritative evidence reconciliation.

## 4. Frozen evidence schema contract
Every observed placement records stable placement identity, content identity after hashing, source/volume, failure domain, filename, extension, full path, created/birth time where exposed, modified time, exact size, scanned time, SHA-256, lifecycle, plan, disposition, evidence revision, last verified, availability/error state, duplicate group/cardinality, role and decision rationale.

Lifecycle is strictly:

`NONE → IN_PROCESS → HASHED → PLANNED → COMPLETED`

Availability/errors are orthogonal. Plan is exactly `KEEP | PROTECT | REMOVE | REVIEW`. `REMOVE` is recommendation evidence, not execution authority. Disposition is not repurposed to represent Grid actions; explicit filesystem operations have separate durable operation/current-placement evidence. Evidence is revisioned, and mutation history is preserved rather than silently overwritten.

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
Deferred beyond the governed Grid release: automatic or Plan-driven execution; TARGET landing/copy orchestration; renaming; quarantine; autonomous disposition; semantic/near-duplicate detection; and any mutation not explicitly authorized by §31 or §43. Ask AI is intentionally split into the subsequent Turn 02 release governed by §44/§45 and remains read-only/advisory. Grid owner tags, notes and ratings are in scope under §43.

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


## 30. Control-plane isolation and DB-writer architecture — binding (2026-09-18)
- The schema-9 clean2 candidate is rejected after owner evidence showed transport RED during a real Estate scan despite passing the 360-file concurrency fixture.
- The replacement is a fresh clean rebuild from the governed pre-Estate baseline `09880afc339998408e293fcf341102c23b402773`; clean2 is evidence only and is not an implementation ancestor.
- Filesystem producers and fingerprint workers do not execute SQLite writes. They emit bounded result/update messages to one dedicated database-writer thread owning the sole write connection. The writer coalesces telemetry and commits placement/lifecycle/hash/counter/event updates in bounded batches.
- SQLite remains WAL. HTTP/API reads use independent read-only/read connections and never acquire the writer's application mutex. Database writer congestion may not block health, controls, or ordinary evidence reads.
- `/api/health` is control-plane health: HTTP/process responsiveness is returned immediately. Database status is a separately bounded probe and is reported as healthy/busy/failed without turning writer contention into transport RED.
- Browser polling is split by responsibility. Lightweight health is independent. Job/source/event polling is non-overlapping and preserves last-good state on failure. Placements are never fetched by ordinary Estate/Analyze/Activity polling; they load only when Database or Plan is active.
- Write amplification is bounded: per-file progress/queue telemetry is coalesced; database commits are batched by record count and/or short time interval rather than one transaction per telemetry mutation.
- Release qualification must include a deliberately sustained/throttled multi-source scan lasting long enough to exercise queue backpressure while concurrent clients continuously request health/job/sources/events. It must prove bounded health/control latency, continued progress on independent sources, exact final evidence/counter reconciliation, zero lost placements, and zero database errors.


## 31. Owner-authorized explicit filesystem actions — binding (2026-09-20)
The owner authorizes placement-ID-scoped filesystem actions only through the governed Database viewer Trash flow and Grid `Folder` / `Delete` flows in §43. Arbitrary paths remain prohibited. Database viewer Trash retains its trash-first behavior; permanent deletion is offered only when trash is unavailable and requires a second explicit in-app warning/confirmation. Grid bulk actions require explicit selected placement IDs and may never derive mutation scope from a query alone. Automatic, inferred, background, AI-driven, and Plan-driven mutation remain prohibited. A filesystem call is not sufficient completion: every successful or failed action must durably reconcile Database/current-placement evidence, authoritative status, duplicate/system classifications, Plan arithmetic where affected, cache/evidence revision, and Activity before the UI reports the final result.

Database Omnisearch is a local cached interaction after placement retrieval: wildcard/filter keystrokes must not round-trip to GitHub or the WSL backend. The Database tab and all subtabs must have unmistakable selected state. Omnisearch includes a visible × clear control and high-contrast white query text. File viewer uses × close, centered previous/next navigation, persistent draggable/resizable geometry, and the explicit Trash action above.


## 32. Database local evidence workbench and future tags contract — binding (2026-09-19)
- Database placement evidence is cached persistently in browser local storage after retrieval. Ordinary query, sort, column resize, viewer navigation and tab navigation do not fetch GitHub or round-trip to the WSL backend. Backend refresh is explicit/controlled; the cache survives reloads.
- Omnisearch has draft text distinct from the applied query. A query executes only with Go or Enter. The draft/applied term remains visible after execution. × clears both and restores the unfiltered cached result set immediately.
- A # helper beside Go opens a column selector. Each entry is prefixed # and inserts the corresponding field qualifier into Omnisearch, following the established search-helper interaction used in the referenced UI pattern.
- Every Database column header is both a persistent resize target and a primary sort toggle. Header click sorts ascending/descending and shows a caret. Resize interaction must not trigger sort.
- Filename text copies the filename to clipboard. Filename is not the viewer hyperlink. The separate diagonal-arrow control launches the SOT viewer.
- Viewer position and size persist across close/open and reload, constrained back into the current viewport when necessary.
- Placement evidence includes a JSON-array-compatible `tags` field initialized to `[]`. Tags are schema groundwork only in this release; tag editing/filter UX is deferred to the next governed release.
- Database table rows use persistent alternating row backgrounds for scanability. Tapping/clicking a row selects it and overrides the zebra striping for that row with a **white background and black text** across the full row so the active record is unmistakable and easier to read. Selection must survive ordinary cell interaction/sort/resize until another row is selected or selection is explicitly cleared; it is presentation state only and must not mutate evidence.


## 33. Authoritative current placement catalog — binding (2026-09-19)
Placement identity is no longer job/revision scoped. The durable physical placement identity is deterministic from source identity + full path. A subsequent scan of the same physical placement updates the same catalog row and preserves its immutable placement number. Job/revision remains scan-history evidence, not placement identity. Existing historical duplicate observations are collapsed in place to the newest observation per source/path during migration. If size and modified timestamp are unchanged and a valid fingerprint already exists, the fingerprint is reused and counted as verified evidence for the new scan; changed or incomplete evidence is rehashed. Database exposes the authoritative current placement catalog, not stacked historical revision rows.

This section supersedes the conflicting sentence in §19 that declared placement identity job/revision scoped.

## 34. SSOT landing-plan model — binding (2026-09-19)
The former row-by-row KEEP/REVIEW consolidation list is retired. Plan now represents readiness for the next phase: SOURCE → IN PLAY → LAND IN TARGET → VERIFY TARGET → SOURCE DISPOSITION. Until a content object has been physically landed in TARGET and independently fingerprint-verified there, every source placement remains IN PLAY and is ineligible for destructive disposition.

TARGET means the authoritative live Single Source of Truth repository. Once TARGET is independently verified byte-identical, each source placement may later receive one explicit disposition: KEEP, COLD STORAGE, ARCHIVE, or DELETE. ARCHIVE carries retention policy and may optionally allow auto-delete at expiry, but expiry alone can never authorize deletion: a currently verified TARGET placement remains a prerequisite. If TARGET later becomes missing or fingerprint-invalid, pending destructive source disposition becomes ineligible and the source returns to IN PLAY.

This Turn 02 candidate does not copy or land files and does not configure TARGET. Its Plan surface therefore shows current unique-content/byte totals, source placements grouped by Estate, all current source material as IN PLAY, TARGET as NOT CONFIGURED, and the next-phase lifecycle contract. It must not emit thousands of meaningless KEEP rows.

TARGET backup/replication is deliberately outside this landing contract for now. A future ancillary SSOT Backup Manager may consume the SSOT catalog to manage backup policy, replicas, failure domains and protection health without coupling those concerns to source→TARGET consolidation.


## 35. Configuration-owned TARGET and staged AI capability — binding (2026-09-19)
TARGET is infrastructure configuration, not a top-level workflow tab. TARGET configuration lives behind the gear with backend/connection settings. It identifies the intended authoritative SSOT repository root. Configuring TARGET does not authorize landing, movement, deletion, archival, or retention actions. Future TARGET browsing/creation must use the same governed storage-authority semantics as Estate selection and must reject overlap/unsafe roots where applicable.

The gear also owns AI provider configuration. Follow the established Devstream configuration pattern: provider credentials and model selection are configuration concerns, not Plan controls. Initial supported provider configuration is Venice.ai, OpenRouter, and optional Anthropic; model lists for Venice/OpenRouter are loaded from their provider APIs and the selected model is persisted with the credential configuration. No AI inference is activated merely by storing configuration.

### Future governed AI enhancement
AI is advisory and evidence-bound. It may consume read-only SOT catalog, duplicate/xref, Estate composition, TARGET landing/verification state, disposition policy, tags and Activity evidence to produce:
- a concise Plan analysis explaining what is currently in play, what is landed and verified, and what remains;
- current-vs-landed summaries by Estate, content type, size, age, duplicate group and disposition state;
- Estate composition insights, concentrations, anomalies and high-value review candidates;
- suggested tags and tag groupings for placements/content objects;
- explanations of proposed source dispositions and retention implications.

AI output never changes fingerprints, evidence, TARGET verification, placement identity, tags, retention, disposition, or files automatically. Suggested tags remain proposals until owner acceptance. AI may summarize and recommend, but deterministic evidence/policy gates remain authoritative for whether content is landed/verified and whether destructive action is eligible. Every AI analysis records provider/model, evidence revision/snapshot, prompt contract, timestamp and resulting Markdown so conclusions remain reproducible/auditable against the evidence used.


## 36. Real TARGET registration behind Configuration — binding (2026-09-19)
TARGET configuration is authoritative backend state, not a browser-only text preference. The gear opens TARGET selection using backend-discovered available volumes and browsable folders. The owner selects an existing folder or creates a new folder from the picker. Registration resolves the path on the WSL host, requires the directory to exist and be readable/writable, verifies it resides on an available storage authority, records capacity/free-space evidence, rejects overlap in either direction with every registered SOURCE Estate root, persists the registration on the SOT host, and logs a durable target_configured event. Browser state is only a UI cache of that backend registration.

TARGET registration alone does not authorize copying, moving, deleting, archiving or retention execution. The subsequent SSOT landing phase consumes this registered TARGET and must independently fingerprint-verify landed content before source disposition becomes eligible.


## 37. Database field-query helper and compact Path presentation — binding (2026-09-19)
The Database # helper is a persistent user-controlled menu, not a timed/type-ahead suggestion. It remains open while the owner is interacting with it and closes only after an explicit field selection or a subsequent # toggle. Its entries use the visible field vocabulary and insert a pre-cooked field token in the form #filename:, #size:, #status:, #plan:, #path:, #created:, #modified:, #estate:, #extension:, or #fingerprint: into the Omnisearch draft, regardless of where focus was immediately before opening the helper. Selection places focus/caret after the inserted qualifier so the owner can type the value; it does not execute the query until Go/Enter.

Path remains stored canonically as the full filesystem path including filename for identity/efficiency, but the Database Path column and path-field search projection display/search the parent directory only. Filename is shown exclusively in Filename; repeating it in Path is redundant and wastes horizontal evidence-grid space. Export/storage may retain canonical full path unless a later export contract says otherwise.


## 38. TARGET registered-capacity evidence and future SSOT-fit delta — binding (2026-09-19)
At TARGET registration, SOT records the selected TARGET volume/filesystem's available bytes and total capacity as registration-time evidence (registered_free_bytes, registered_total_bytes) alongside path, label and configured timestamp. /api/target also reports current available/total bytes dynamically. Configuration displays registration-time free capacity and current free capacity so subsequent storage consumption is visible without rewriting the historical registration observation.

Future SSOT landing enhancement: after authoritative TARGET content has been inventoried/fingerprinted and reconciled against the SOT catalog, compute the additional unique bytes that still must be landed (the non-duplicate estate delta). Compare that required delta against current TARGET free bytes and report required bytes, available bytes, projected free bytes after landing, and surplus/shortfall. Do not use raw source-estate bytes for this fit calculation and do not count content already verified on TARGET twice.


## 39. Creation-time completion, human date search, compact Path, and visible TARGET capacity — binding (2026-09-19)
Creation time is evidence, not optional decoration. Analyze captures native birth time when directly exposed. For Windows-backed /mnt placements where WSL stat does not expose birth time, SOT provides a post-processing Backfill Created operation that resolves canonical Windows paths with wslpath and obtains Windows Get-Item CreationTime in a batched PowerShell pass, then writes the resulting timestamps to the existing placement rows without rehashing content. A durable creation_backfill event records eligible/updated/unavailable counts. The operation is safe to rerun and fills only missing Created values.

Database date/time Omnisearch must support both internal epoch values and human representations. Created/Modified queries accept displayed locale strings plus forms such as 5/23/2026, 5/23/26, 4:45pm, 4:45 pm, including quoted/wildcard query forms. Canonical timestamps remain numeric internally. Path presentation remains parent directory only; Filename must never be repeated in the visible Path cell.

When TARGET is registered, Plan must visibly identify the authoritative TARGET path/label and registration time and render capacity graphically. Show total GB, current used GB/percent, current available GB/percent, and a colored proportional used/free bar. Also show current unique Estate bytes against free capacity as an explicitly provisional capacity illustration. Until TARGET itself is fingerprint-inventoried and reconciled to SOT, do not label that illustration as the true landing delta or consumed-by-estate amount. The future authoritative delta is unique SOT content not already verified on TARGET.


## 40. Creation-time retrieval correctness and evidence-cache invalidation — binding (2026-09-20)
Windows-backed /mnt creation-time backfill must read redirected process stdin explicitly and correlate PowerShell results by stable request index, not by echoed/normalized path text or implicit $input pipeline semantics. Every unresolved lookup must be classified by stage (WSL-path conversion, Windows Get-Item lookup, parse/update, or missing result) with bounded diagnostic samples in durable activity evidence. A Windows CreationTime that exists is not Unavailable merely because SOT failed to retrieve it.

Successful Created updates advance a durable creation-evidence revision. Database persistent placement cache stores that revision and automatically reloads placement evidence when the backend revision changes. Manual browser cache clearing is never required after evidence backfill. Only after retrieval is proven genuinely unsupported may a Modified fallback be considered, and any such fallback must preserve explicit provenance rather than masquerade as actual Created evidence.


## 41. Plan visual compression — binding (2026-09-20)
Plan is a three-question operational surface with exactly three primary stacked bars: BASIC CAPACITY CHECK, ANALYSIS RESULTS, and OPERATIONS STATUS. Use the established blue family only; do not assign semantic rainbow colors to individual metrics. Each bar has a compact table immediately below it, and that table is the legend and exact-data surface. Do not add a separate legend, metric-card strip, duplicate detail button, or repeated numeric labels inside the bar.

Tapping a bar segment opens a small anchored statistics callout for that segment with an explicit × close control. The callout is transient detail, not another permanent copy of the dashboard.

Capacity: current free space at the registered TARGET is the 100% denominator. Show ESTATE unique requirement and OPEN remainder. Do not visualize underlying volume used/total because TARGET may share a volume with unrelated content.

Analysis table must show ESTATE, UNIQUE, DUP, EXCESS, and REVIEW. DUP includes the exact number of all placements participating in repeated-fingerprint groups. EXCESS is exactly the number and bytes of duplicate placements after retaining one copy for each distinct repeated fingerprint. DUP and EXCESS overlap and therefore must not both be additive stacked segments. The composition bar may use mutually exclusive UNIQUE / EXCESS / unresolved-other segments while the table reports all five exact metrics.

Operations: show IN PLAY and LANDED against the current unique SSOT workload. LANDED means physically present on TARGET and independently fingerprint verified. No source is removed from IN PLAY merely because an equivalent fingerprint exists somewhere else.


## 42. Plan arithmetic hierarchy and approved visual semantics — binding (2026-09-20)
This section supersedes §41 wherever §41 conflicts with the rules below. Do not add metrics, explanatory rows, notes, or visual elements beyond this approved structure without owner agreement.

Plan is mobile-first and uses three mutually exclusive subtabs in this order: (1) ANALYSIS RESULTS, (2) BASIC CAPACITY CHECK, (3) OPERATIONS STATUS. Each subtab contains exactly its governed bar plus related exact-data table. Switching subtabs changes presentation only; it never changes evidence or Plan state. Necessary overflow is confined to the active subtab rather than requiring page scrolling between the three Plan questions.

All displayed Plan arithmetic is additive and must read `X + Y = Z` (or `X + Y + … = Z`). Do not display subtraction as Plan arithmetic. The bottom row is always the total/result `Z`; it never receives a legend swatch and is never plotted as an additional bar segment.

ANALYSIS RESULTS is arithmetic. UNIQUE means fingerprint groups with exactly one placement. DUPLICATE is a parent reporting all placements in repeated-fingerprint groups and is not an additive stacked segment. Its child rows are KEEP = exactly one retained placement per distinct repeated fingerprint, and EXCESS = every additional placement beyond that retained copy. The total row is last and must satisfy UNIQUE + KEEP + EXCESS = ESTATE for both files and bytes. There is no REVIEW row in this Plan table. The stacked bar contains only the mutually exclusive UNIQUE (blue), KEEP (yellow), and EXCESS (red) segments. ESTATE is the uncolored/unplotted total row. DUPLICATE is represented as the parent row in the table, not as a fourth bar segment.

BASIC CAPACITY CHECK is displayed only as ESTATE + OPEN = TARGET. Table order is ESTATE, OPEN, TARGET, with TARGET last. The stacked bar contains only ESTATE (blue) + OPEN (grey/white). TARGET is the uncolored/unplotted total row. TARGET means current free capacity at the registered TARGET location and is the 100% denominator. Any internal computation needed to derive OPEN may use ordinary arithmetic, but the owner-facing Plan equation and visualization are additive only.

OPERATIONS STATUS is displayed only as IN PLAY + LANDED = ESTATE. Table order is IN PLAY, LANDED, ESTATE, with ESTATE last. The stacked bar contains only IN PLAY (blue) + LANDED (white/grey). ESTATE is the uncolored/unplotted total row. Until a landing engine supplies verified landing evidence, LANDED remains zero and IN PLAY equals ESTATE; do not fabricate progress.

The exact-data table is the legend. Only rows represented as colored bar components receive swatches. Tapping a bar segment opens its exact-value callout with × close. High-contrast approved palette is blue/white/grey generally, with yellow reserved for duplicate KEEP and red reserved for duplicate EXCESS.

## 43. Grid bulk-operations implementation plan — binding (2026-09-20)

### 43.1 Purpose and lineage
Grid is a new top-level SOT work surface between Database and Plan for visual review, search-driven selection, and explicit bulk operations against placement evidence. The accepted application baseline remains `sot-turn02-pre-base-v8.html`. The rejected v9 Grid is evidence only and must never be patched forward. Grid implementation begins from the accepted v8 baseline and ships only under a new bumped comparison filename; v8 remains byte-for-byte available for owner comparison.

The visual and interaction donor is `acmeproducts/perf/ui-v2.html`. Donor behavior is to be transplanted deliberately, not approximated from screenshots. SOT semantics remain authoritative where the products differ.

### 43.2 Donor elements that must be extracted before application coding
Read the current donor source and document the exact implementation of:
1. Grid shell/header geometry and responsive/mobile behavior.
2. Selected-count pill and selection state transitions.
3. Thumbnail-size slider: minimum, maximum, step, default, persisted value, and the formula/rules that translate slider value into column/tile geometry.
4. Search row and search-helper behavior.
5. Bulk-action row spacing, enabled/disabled states, and action ordering.
6. Grid container sizing, gap, square-card geometry, image `object-fit`, lazy loading, and scroll ownership.
7. Single selection, multi-selection, Select All/current-result behavior, selection clearing, and selection preservation when density changes.
8. Per-tile controls, including donor open/focus affordance. Drag/stack controls are not imported unless they directly support an approved SOT operation.
9. Edit Tags modal structure, assigned/recent tag chips, comma-separated entry, add/remove behavior, keyboard behavior, and persistence timing.
10. Edit Notes & Ratings modal structure, Notes field, five-star Quality Rating, five-star Content Rating, current-value hydration, Cancel, Save, and rating interaction.
11. Folder chooser and Delete confirmation flow.
12. Loading, unavailable-preview, non-image, empty-result, error, and stale-evidence states.

No Grid implementation candidate may be published until this extraction is reflected in the implementation checklist/gates below.

### 43.3 SOT Grid shell
The top-level order becomes:
`Estate | Analyze | Database | Grid | Plan | Ask AI | Activity`.

Grid uses the donor's compact workspace shape:
- compact Grid header;
- selected-count pill;
- thumbnail-density slider at upper right;
- one Omnisearch/filter row;
- one bulk-action row immediately below;
- thumbnail grid occupying the remaining viewport;
- internal Grid scrolling only.

Do not place UNIQUE/KEEP/EXCESS chips inline in the search row as the rejected v9 did. Classification filtering must be available without making the donor header busy. Use the existing SOT Omnisearch/filter semantics, including field-qualified terms, negatives, wildcarding, and explicit execution behavior.

### 43.4 Grid result set and selection model
Grid consumes the same placement evidence/cache as Database. It does not create a second evidence model.

Definitions:
- **returned set** = placements matching the currently applied SOT Omnisearch/filter expression;
- **selected set** = explicit placement IDs selected by the owner from the returned set;
- the selected-count pill always reports the actual selected placement count;
- bulk actions operate only on explicit selected placement IDs, never implicitly on the query.

Changing slider density must not change membership, order, filters, or selection. Applying/changing a search/filter recomputes the returned set. The exact donor rule for what happens to selection when a filter/search changes must be extracted and then used unless it would create an unsafe hidden bulk scope; hidden/non-returned placements may never be bulk-mutated without remaining visibly represented as selected.

### 43.5 System classifications: UNIQUE / KEEP / EXCESS
These are durable SOT system classifications, not ordinary owner tags:
- **UNIQUE** — fingerprint occurs once in current authoritative evidence.
- **KEEP** — exactly one deterministic retained placement for a repeated fingerprint.
- **EXCESS** — every additional placement of that repeated fingerprint.

For each fingerprint:
- cardinality 1 ⇒ one UNIQUE;
- cardinality N > 1 ⇒ exactly one KEEP + N−1 EXCESS.

KEEP selection must be deterministic from stable evidence, not DOM order or current Grid order. Use immutable placement sequence/order unless a later governed canonical-placement rule supersedes it.

System classifications are:
- queryable/filterable in Grid and Database;
- visible on tile/detail context without crowding the primary Grid controls;
- read-only in Tag editing;
- recalculated when authoritative fingerprint/placement evidence changes;
- never removed or overwritten by user tag operations.

### 43.6 Thumbnail/media contract
Image placements supported by the existing safe preview endpoint render real thumbnails. Do not render hundreds of empty skeleton lines/cards as in rejected v9.

For non-image files, use a compact type representation derived from extension/MIME while preserving the square donor card geometry. Failed/unavailable previews show a clear unavailable state without breaking layout.

Requirements:
- lazy-load media;
- do not fetch full file bytes unnecessarily when a bounded thumbnail representation can be supplied;
- maintain placement-ID-based path security;
- no arbitrary client-submitted filesystem paths;
- density changes reuse loaded media where practical;
- thumbnail failures do not affect transport health;
- tile count may scale to the estate without creating an unbounded DOM/main-thread freeze; use bounded rendering/virtualization or equivalent if required by qualification.

### 43.7 Thumbnail-density slider
The slider is a first-class donor behavior, not optional decoration. Extract and preserve the donor min/max/step/default and tile-size mapping. It changes only presentation density.

Persist the owner's density locally so reopening Grid restores it. Density state is presentation-only and never written into SOT evidence. Test at minimum, default, maximum, narrow mobile width, and desktop width.

### 43.8 Bulk action strip
Approved Grid actions are exactly:
`Tag | Notes | Delete | Folder`.

Do not import UI-V2 Move because SOT has no stacks. Do not add Export or other actions without separate owner approval. Actions are disabled with zero selection and become active with one or more explicit selections.

### 43.9 Tag implementation
Tag uses the donor Edit Tags interaction, not a generic prompt.

The modal must include:
- title **Edit Tags**;
- **ASSIGNED TAGS** section showing user-assigned tags for the current selection;
- donor-style chips/removal behavior;
- comma-separated tag input;
- donor keyboard/focus behavior;
- explicit completion control consistent with donor semantics.

SOT must maintain two namespaces:
1. immutable/recomputed system classification: UNIQUE/KEEP/EXCESS;
2. owner tags: arbitrary durable tags.

Bulk-tag behavior must be explicit:
- tags added by the owner are applied to every selected placement;
- removal must distinguish tags common to all selected placements from mixed tags and must never silently remove a tag from placements where the owner did not explicitly request removal;
- system classifications are displayed separately/read-only and cannot be edited from Tag;
- persistence is transactional enough that partial bulk success is reported, not hidden.

### 43.10 Notes + ratings implementation
Notes follows donor **Edit Notes & Ratings**, not a bare textarea.

Durable placement metadata must include:
- `notes`;
- `quality_rating` integer/null, allowed 1–5;
- `content_rating` integer/null, allowed 1–5.

The modal contains:
- selected-item/selection context;
- Notes textarea;
- five-star Quality Rating;
- five-star Content Rating;
- Cancel;
- Save.

Single-selection opens current values exactly. Multi-selection must show mixed state when values differ. Opening or cancelling may never modify evidence. Saving changes only fields the owner explicitly changed in a mixed bulk edit; unchanged mixed fields remain untouched. Ratings must be keyboard/touch accessible and durable after reload/reconnect.

### 43.11 Folder operation
Folder is the approved SOT physical grouping operation. It is not UI-V2 stack Move.

For explicit selected placements:
- open donor-shaped Folder chooser;
- browse only backend-discovered/registered Estate storage;
- choose a destination folder;
- destination must be legal for every selected placement under the governed Estate constraints;
- preflight all destination collisions, permissions, source availability and destination capacity before mutation;
- never overwrite an existing file;
- execute filesystem moves with per-file durable results;
- same-filesystem moves may use an atomic rename where supported; cross-filesystem moves must copy to destination, verify byte identity, and only then remove the source;
- after each successful move, update the authoritative current placement path/identity and relevant metadata while preserving immutable placement/history linkage;
- successful moved placements remain current/active at the destination; durable operation/status evidence records the move outcome and prior path;
- failed moves remain represented at their original placement and retain truthful failure status/result evidence;
- advance the authoritative evidence/cache revision for every committed result;
- recompute any duplicate group/system classification affected by the placement change;
- recompute Plan inputs/results affected by the placement change before reporting completion;
- log durable Activity evidence;
- invalidate/reload Grid, Database and Plan from backend-authoritative results, never optimistic fiction.

A mixed selection that cannot share a legal destination must be rejected before mutation with an intelligible reason. A move is not complete merely because filesystem I/O returned success; Database, status, classification, Plan and Activity reconciliation are part of the same governed operation outcome.

### 43.12 Bulk Delete
Bulk Delete is destructive and therefore stricter than ordinary metadata actions:
- scope is explicit selected placement IDs only;
- show count and enough context to make scope clear;
- attempt OS/device Trash/Recycle Bin first;
- successful trash or permanent deletion retires the placement from the authoritative current Database result set only after filesystem success is proven; historical operation/evidence linkage is preserved;
- files that cannot be trashed remain untouched and are returned as a failure subset with truthful status/result evidence;
- permanent deletion for that subset requires a second explicit in-app warning/confirmation;
- no query-only delete, inferred delete, Plan-driven delete, background delete, AI-driven delete, or automatic EXCESS delete;
- every success/failure result is durably logged and advances the authoritative evidence/cache revision;
- after each successful placement removal, duplicate groups and UNIQUE/KEEP/EXCESS are recomputed before completion;
- Plan counts/bytes and Operations/Analysis results are recomputed from the resulting authoritative placement population before completion;
- Grid, Database and Plan invalidate/reload from backend-authoritative state; deleted/trash-success placements may not remain visible as current active evidence.

Delete is not complete merely because filesystem I/O returned success; Database, status, classification, Plan and Activity reconciliation are part of the governed operation outcome.

### 43.13 Persistence/schema work
Implement additive governed schema support rather than browser-only state:
- owner tags;
- notes;
- quality_rating;
- content_rating;
- system classification if not already represented by a governed derived relation/field;
- authoritative current-placement/filesystem state needed to distinguish current active evidence from trashed/deleted/missing evidence without overloading lifecycle or Plan;
- durable operation records containing operation ID/type, placement ID, prior/new path where applicable, requested/result timestamps, success/failure, error detail, verification result and evidence revision;
- folder-operation evidence as needed;
- durable bulk-operation events.

Lifecycle, Plan, filesystem/current-placement state and operation outcome remain orthogonal; do not overload one field with all meanings. Schema migration must be explicit/version-aware and preserve existing evidence/history. Do not silently repurpose existing columns. Browser state is limited to presentation preferences such as Grid density and non-authoritative UI state.

### 43.14 Grid performance/concurrency
Grid must remain usable while Analyze is running. Metadata reads and thumbnail reads use bounded independent read paths and may not block fingerprint workers or the database writer.

Qualification must prove:
- scrolling remains responsive with the real 2,254-placement estate scale and a larger synthetic scale;
- density changes do not refetch/recompute authoritative evidence;
- thumbnail failures do not stall the grid;
- bulk metadata operations do not freeze Analyze;
- Folder/Delete serialize the affected placement mutations safely while unrelated sources/jobs remain observable;
- health polling remains independent.

### 43.15 Grid implementation sequence
1. Freeze v8 artifact and record its SHA.
2. Extract donor Grid behavior from `ui-v2.html`.
3. Add schema/migration for notes/ratings/system classification/user tags.
4. Add read APIs required for bounded Grid media/metadata.
5. Add transactional bulk metadata API.
6. Add Folder preflight + execution API.
7. Add guarded bulk Delete API.
8. Build Grid shell in a new bumped HTML artifact.
9. Transplant donor slider/tile geometry.
10. Wire SOT Omnisearch returned set.
11. Wire explicit selection and selected-count pill.
12. Implement real thumbnails/non-image states.
13. Implement Tag donor modal.
14. Implement Notes & Ratings donor modal.
15. Implement Folder donor flow.
16. Implement Delete two-stage flow.
17. Add system classification filtering/context without crowding donor geometry.
18. Run mechanical, synthetic, real-estate, mobile, and destructive disposable-file gates.
19. Only after all gates pass publish the bumped owner test URL.

### 43.16 Grid release-blocking gates
A candidate fails if any item below fails:
1. v8 baseline artifact unchanged.
2. New bumped filename only.
3. Grid appears between Database and Plan.
4. Donor slider min/default/max behavior matches extracted source.
5. Slider changes density only.
6. Real image thumbnails render; non-images/unavailable files have coherent cards.
7. Grid owns scrolling and does not expand into an unbounded page.
8. Omnisearch returns exactly the same matching placement population as Database for the same expression.
9. Selected count is exact.
10. Bulk actions disabled at zero selection.
11. No bulk action can affect an unselected/hidden placement.
12. UNIQUE/KEEP/EXCESS arithmetic is exact for controlled duplicate fixtures.
13. System classifications survive user-tag edits and recompute after placement changes.
14. Tag modal matches donor structure and persists after reload.
15. Mixed bulk tag semantics are explicit and tested.
16. Notes + both ratings hydrate and persist for single selection.
17. Mixed multi-selection does not overwrite unchanged values.
18. Folder collision/capacity/permission preflight prevents unsafe mutation or overwrite.
19. Folder move updates filesystem + authoritative Database/current-placement/status evidence coherently and preserves history linkage.
20. Cross-filesystem Folder move proves destination byte identity before source removal.
21. Folder success advances evidence revision and refreshes Grid/Database/Plan from backend truth.
22. Trash-first bulk Delete works on disposable fixtures.
23. Permanent fallback requires second confirmation and affects only the failed-trash subset.
24. Delete success retires the current placement only after filesystem success while preserving historical operation evidence.
25. Classification recomputes after move/delete wherever the authoritative placement population changes.
26. Plan arithmetic/counts/bytes recompute after every successful mutation and remain additive `X + Y = Z`.
27. Database, authoritative status, Grid and Plan show no stale pre-mutation current state after refresh/reconnect.
28. Partial bulk success is represented per placement; failures never masquerade as success or disappear.
29. Activity records every bulk operation/result.
30. Analyze remains responsive during Grid reads/metadata writes/mutations.
31. Mobile layout remains operable without horizontal-scroll fighting.
32. Reconnect/reload restores durable metadata, operation results and presentation density.
33. No browser alert/confirm/prompt is introduced.
34. Full existing SOT qualification suite remains green.


### 43.17 Release A owner correction — binding (2026-09-20)
Owner test of Release A establishes the following correction contract. These are scoped Release A presentation/interaction fixes and do not authorize Ask AI work or other product changes.

1. **Tag commit timing:** the Grid Edit Tags input commits non-empty comma-separated tags on either Enter or input blur. Enter and blur share one idempotent commit path so one edit cannot be submitted twice. Successful commit refreshes Assigned Tags/Recently Used Tags from backend truth.
2. **Tag modal close affordance:** Edit Tags has no footer Close button. It uses a single × close affordance at the upper-right of the modal. Closing does not invent or discard an already-triggered tag commit.
3. **Plan mobile width:** each Plan subtab table must fit the available mobile content width without the old fixed/minimum-width expansion or unused whitespace. Item / Files / Size / Percent columns use compact fixed proportions and remain readable without horizontal page/table fighting.
4. **Database Path projection:** Database displays/copies/exports Path as the parent directory only; filename remains exclusively in Filename. The authoritative full physical path remains internal evidence.
5. **Database horizontal position:** Database rerenders caused by row selection, sorting, polling, or other local state changes preserve the current horizontal and vertical table scroll position. Rerender must not snap the evidence grid back to the left edge.
6. Publish this correction in a new bumped artifact; preserve Release A and the accepted v8 baseline byte-for-byte.
7. Qualification must prove browser JavaScript syntax plus static contract checks for Enter+blur tag commit, upper-right × without Tag footer Close, compact Plan table geometry, parent-directory Path projection, and Database scroll restoration.


### 43.18 Release A host cutover correction — binding (2026-09-20)
Owner host cutover exposed a rollback-safe installer sequencing defect after all application/runtime gates had passed. The installer captured the predecessor v11 SQLite file checksum **before** stopping the old supervised service. A clean service stop may checkpoint WAL state into the main SQLite file, legitimately changing that file hash without changing logical evidence. The post-start byte-hash assertion therefore rejected a valid cutover and rolled back.

The corrected cutover contract is:
1. Complete all download, compile, disposable-fixture and browser/static qualification before touching the running service.
2. Arm rollback, then stop the old service.
3. After the old service is fully stopped, validate the predecessor v11 database read-only and capture its preservation checksum. That post-stop/checkpoint state is the immutable migration source for this cutover attempt.
4. Any schema-12 database produced by a prior failed/rolled-back Release A attempt is **not authoritative**. Preserve it in a timestamped archive and remove it from the active schema-12 path before retry so the new service must migrate again from the latest stabilized v11 predecessor.
5. Start the new service and require health, placements and additive Plan checks.
6. Confirm the stabilized v11 predecessor checksum remains unchanged after the new service creates/opens schema-12.
7. Preserve existing Tailscale/OpenClaw/report routing and verify shared-origin `/sot` health.
8. On any failure after cutover begins, stop/disable the new service, archive the failed schema-12 attempt, and restore the previously active service. Never silently reuse the failed schema-12 database on a later retry.
9. The failed first Release A installer is evidence only. Publish the correction under a new installer filename and qualify its sequencing mechanically before owner rerun.


## 44. Ask AI surface — binding design and implementation plan (2026-09-20)

### 44.1 Purpose
Add a new top-level **Ask AI** surface between Plan and Activity. Ask AI is the conversational/research layer over the SOT evidence estate. It must answer questions about SOT evidence, duplicates, classifications, capacity, paths, tags/notes/ratings, Plan/landing state, and operational history without silently mutating owner files or SOT decisions.

Its shape is deliberately based on the Library surface in `prism/prism-turn01-ship-r27.html`, not on PRISM's Map or AI side drawer.

### 44.2 PRISM Library donor shape to transplant
The PRISM R27 Library donor uses a two-column full-height workspace:
- left rail approximately `min(276px,31vw)`, collapsible to 44px;
- rail header;
- rail Omnisearch;
- scrollable card list;
- right stage occupying remaining width;
- right detail header;
- independently scrollable transcript;
- sticky/bottom compose strip;
- empty state when nothing is selected.

SOT Ask AI must adopt this information architecture and interaction shape while using SOT styling and data semantics.

### 44.3 Ask AI left rail
Left rail contains:
- **Ask AI** heading and collapse control;
- Omnisearch for saved AI conversations/analyses;
- count;
- persistent conversation cards.

Each card contains:
- generated/default conversation title, inline editable;
- created/updated timestamp;
- concise status: processing / ready / failed;
- optional compact scope summary (Estate/all evidence/current selection/etc.);
- delete control with in-app confirmation.

Selecting a card opens its complete durable transcript. New conversation creates an empty selected conversation and focuses compose.

### 44.4 Ask AI right stage
Header contains:
- editable conversation title;
- saved scope/evidence context summary;
- transcript search/Omnisearch modeled on PRISM analysis Omnisearch where useful;
- no redundant provider/key controls.

Transcript is normal rendered document/chat content, not a viewport-inside-a-card. It must support Markdown rendering for headings, paragraphs, lists, tables, blockquotes, code, links, and evidence references. User turns and AI turns remain clearly distinguishable. The transcript scrolls independently; compose remains available at the bottom.

### 44.5 Compose strip
Sticky bottom compose follows PRISM Library shape:
- attachment/context control only where it maps to governed SOT evidence;
- expanding textarea;
- Send/Run control;
- visible running state;
- cancellation if the selected provider supports it.

The prompt can be scoped to:
- entire SOT;
- current Estate;
- current Database/Grid query/result set;
- explicit selected placements;
- Plan/operations state;
- Activity/time range.

Scope must be visible before sending and stored with the turn. The AI may not silently broaden an explicit selection into the whole estate.

### 44.6 Evidence grounding
Every Ask AI request builds a governed evidence packet from current SOT database state. It must not scrape the rendered UI.

Evidence retrieval may include:
- placement metadata/fingerprints;
- duplicate groups and UNIQUE/KEEP/EXCESS;
- tags, notes, ratings;
- Estate/source/path/size/date metadata;
- TARGET/capacity and landing verification state;
- Plan arithmetic;
- durable Activity events.

The packet records evidence revision/query/scope and enough placement/group identifiers to reproduce what the model saw. Large scopes require deterministic retrieval/aggregation rather than dumping the whole database into a prompt.

AI answers must distinguish database evidence from model interpretation. Where an answer refers to specific files/groups, the UI should provide navigable SOT evidence references rather than fabricated paths.

### 44.7 AI authority boundary
Ask AI is advisory/read-only unless a future separately governed action is explicitly approved. It may:
- explain;
- summarize;
- compare;
- identify patterns;
- propose searches/tags;
- explain duplicate groups;
- analyze capacity/landing state;
- answer questions from Activity/evidence.

It may not directly:
- delete;
- move;
- land;
- retag;
- edit notes/ratings;
- alter KEEP/EXCESS/UNIQUE;
- alter Plan decisions;
- execute filesystem operations.

If the model proposes an action, it is text only. Owner action remains through the governed SOT surfaces.

### 44.8 Provider/configuration boundary
Provider/model/API-key configuration remains Configuration/gear, not duplicated in Ask AI. Ask AI reads the active configured provider/model. Missing/invalid configuration produces a clear setup state with a route to Configuration, not an embedded second credential form.

Existing staged Venice.ai/OpenRouter/Anthropic configuration may be used only after its actual current contract is verified. Do not invent provider availability or model IDs.

### 44.9 Durable AI data model
Persist server-side:
- conversation ID;
- title;
- created/updated;
- status;
- turns in order;
- user prompt;
- rendered/raw assistant response;
- provider/model metadata;
- evidence revision;
- scope/query/selected placement IDs or durable scope descriptor;
- evidence-reference manifest;
- errors/cancellation;
- attachments/context references if later approved.

Browser localStorage is not the authoritative conversation store.

### 44.10 Concurrency and failure behavior
Multiple saved conversations may exist and a running analysis must not block SOT Analyze. AI calls are independent jobs with visible processing/ready/failed status. Navigating away does not lose a submitted request. Reopening Ask AI restores durable state.

Provider/network failure:
- preserves the user turn and evidence manifest;
- records failure visibly;
- does not fabricate an answer;
- allows explicit retry;
- does not change SOT connection health.

### 44.11 Ask AI implementation sequence
1. Freeze/record accepted SOT baseline.
2. Extract PRISM R27 Library DOM/CSS/state/persistence patterns relevant to rail/cards/detail/transcript/compose.
3. Define SOT AI conversation/turn/evidence-manifest schema.
4. Verify current configured AI provider contracts.
5. Implement server conversation CRUD.
6. Implement deterministic evidence-packet builder and scope limits.
7. Implement asynchronous AI job execution/status.
8. Build Ask AI donor-shaped shell.
9. Implement conversation rail/Omnisearch/cards.
10. Implement detail header/transcript Markdown renderer.
11. Implement sticky compose and visible scope selector.
12. Implement evidence references/navigation.
13. Implement title editing/delete/retry/cancel.
14. Prove persistence/reconnect/concurrency.
15. Security-test rendered Markdown/links and evidence references.
16. Publish only in a bumped candidate after all Ask AI and existing SOT gates pass.

### 44.12 Ask AI release-blocking gates
1. Surface appears between Plan and Activity.
2. Shape materially matches PRISM R27 Library: collapsible left conversation rail + right transcript stage + bottom compose.
3. Conversation cards persist server-side and survive browser reload.
4. Titles are editable and durable.
5. Rail Omnisearch filters saved conversations without altering transcripts.
6. Selecting a card restores exact ordered transcript.
7. Compose remains visible while transcript scrolls.
8. Scope is visible and stored per turn.
9. Explicit placement/query scope is not silently broadened.
10. Evidence packet is built from backend SOT evidence, not DOM text.
11. Evidence revision/scope manifest is durable.
12. Markdown renders safely; untrusted HTML/script cannot execute.
13. Specific evidence references resolve to real SOT records or are omitted.
14. Provider/model/key controls are not duplicated in Ask AI.
15. Missing provider configuration produces a clear non-destructive setup state.
16. Provider failure leaves durable failed turn and retry path.
17. AI work does not change SOT transport health.
18. AI work does not block Analyze/Grid/Database reads.
19. Ask AI has no direct filesystem or metadata mutation authority.
20. Reload/navigation during a running request does not lose the job.
21. Existing SOT gates remain green.


## 45. Split implementation and release boundary — binding (2026-09-20)
Grid and Ask AI are separate surfaces, separate state machines, and separate owner releases. Neither may be implemented as a modal inside the other. The Grid release must be fully qualified and owner-testable before Ask AI application work begins.

### Release A — Grid
1. Freeze/record the accepted SOT baseline and donor SHAs.
2. Implement Grid schema + backend contracts, including authoritative mutation reconciliation.
3. Implement donor-faithful Grid UI.
4. Qualify metadata behavior, filesystem Folder/Delete on disposable fixtures, Database/status/classification/Plan reconciliation, Database alternating-row readability + white/black selected-row behavior, cache revisioning, concurrency and the full existing SOT regression suite.
5. Publish one bumped Grid comparison artifact while preserving the accepted baseline byte-for-byte.
6. Release A contains no Ask AI implementation or provider execution.

### Release B — Ask AI
1. Begin only from the accepted/qualified Grid Release A baseline; a failed Grid candidate is not an Ask AI ancestor.
2. Implement Ask AI durable conversation/evidence schema.
3. Implement backend evidence retrieval/provider execution.
4. Implement PRISM-Library-shaped Ask AI UI.
5. Qualify Ask AI independently, including persistence, evidence grounding, provider failure, concurrency and security.
6. Rerun the full SOT regression suite, including all Grid mutation/reconciliation gates.
7. Publish a separately bumped Ask AI comparison artifact.

Do not combine unqualified Grid filesystem mutation with AI execution in one candidate or debugging step. Ask AI remains read-only/advisory even after Grid mutation is enabled.


## 2026-09-20 — RELEASE A DATABASE / TAG COMPACTION PATCH — BINDING

This patch is part of Release A and is explicitly mobile-first. It changes presentation and tag normalization only; it does not change Database result membership, sorting semantics, immutable placement identity, Grid selection safety, system classification ownership, or Plan arithmetic.

### Database surface

- Database rows must use clearly visible zebra striping.
- Pointer hover over any unselected Database row must render the entire row with a white background and black foreground text. Existing row focus/selection may remain white/black.
- Remove the redundant **Evidence Database** heading from inside the Database pane.
- Remove the Database-pane job-status strip such as **COMPLETED · Analysis complete**. Job state remains available on Analyze/Activity and in the global connection state.
- OMNISEARCH executes on **Enter** and on input **blur**. There is no dedicated **Go** button on the Database surface.
- Export occupies one compact icon button in the Database toolbar. Activating it opens a small menu/popover with exactly **CSV** and **JSON** choices rather than two permanent text buttons.
- Preserve the field helper and clear-search affordances while minimizing toolbar height and horizontal consumption on small screens.

### Tag editor

- **Edit Tags** has no bottom Close button. It closes with a top-right **×**.
- Owner tags are canonical lowercase. All newly entered or reused tags are forced to lowercase before persistence, including the leading `#`.
- Backend normalization is authoritative so mixed-case input cannot bypass lowercase storage.
- Existing selected-placement tags are normalized to lowercase whenever a tag mutation is persisted for that placement.
- UNIQUE / KEEP / EXCESS remain immutable system classifications and are never converted into owner tags.

### Qualification additions

Release A qualification must mechanically verify:
- Database zebra CSS;
- white-background / black-text hover behavior;
- absence of Database **Evidence Database**, live status strip, and **Go** button;
- Enter + blur execution for Database OMNISEARCH;
- one compact Export trigger with CSV/JSON choices;
- Edit Tags top-right × with no bottom Close action; and
- lowercase tag normalization at both UI input and backend persistence boundaries.


## 2026-09-21 — RELEASE A MOBILE ICON RIBBON PATCH — BINDING

This patch is part of Release A and changes top-ribbon presentation only. It does not activate Ask AI, alter pane state machines, change backend behavior, or modify the Release B Ask AI scope.

### Top ribbon

- Keep the release identity exactly once in the header brand: **SOT Turn 02 Release A**.
- Connection status shows only the connection state such as **Connected**, **Reconnecting**, or **Disconnected**. Do not repeat `turn02-release-a` or another release/version string beside it.
- Convert the six active top-level tabs to compact icon-only buttons: Estate, Analyze, Database, Grid, Plan, Activity.
- Add a seventh **AI** icon button in the top ribbon.
- Release A AI is intentionally inert: it has no pane, no provider execution, no navigation side effect, no state transition, and no backend request. It is visibly disabled and its accessible label/title states that AI is available in the next release.
- Every icon button must have an accessible name and tooltip/title identifying its surface.
- The active surface retains the existing high-contrast selected treatment.
- On mobile, all seven surface/AI icons must fit in the ribbon without horizontal scrolling. The settings gear remains in the compact header row.
- The icon ribbon must preserve the existing top-level order as: Estate, Analyze, Database, Grid, Plan, AI, Activity.

### Qualification additions

Release A qualification must verify:
- the health display no longer appends the backend version;
- active top-level buttons are icon-only while retaining title/ARIA labels;
- exactly one inert AI button exists between Plan and Activity;
- no `AI` pane is added to the Release A `names` state-machine array;
- the AI control cannot call `show()`, provider APIs, or another action; and
- mobile ribbon CSS does not depend on horizontal scrolling.


## 2026-09-21 — OMNISEARCH COLUMN AUTOCOMPLETE / REMOVE # BUTTON — BINDING

This patch replaces the permanent Database/Grid `#` helper button with in-field OMNISEARCH autocomplete. Database and Grid must share the same search language and autocomplete behavior.

### Permanent toolbar control

- Remove the permanent standalone `#` button from Database.
- Remove the permanent standalone `#` button from Grid.
- Do not replace it with another persistent field-picker button.
- Column discovery lives inside OMNISEARCH itself so mobile toolbar space is preserved.

### Column autocomplete trigger

- Typing `#` inside OMNISEARCH enters column-autocomplete mode.
- The first character typed after `#` immediately filters the available searchable Database columns.
- Additional characters continue narrowing the column list.
- Matching is case-insensitive.
- Suggestions are based on the governed searchable column set, not arbitrary object keys.
- Examples:
  - `#c` may suggest `created`, `class`, and `content_rating`.
  - `#cl` narrows to `class`.
  - `#l` suggests `lifecycle`.
  - `#f` may suggest `filename`, `folder`, and `fingerprint`.
- Tapping a suggested column inserts the canonical query token followed by a colon, e.g. `#created:`.

### Human-facing aliases

The search language may expose concise user-facing aliases while preserving the existing schema:

- `#class:` maps to `system_classification`.
- `#folder:` maps to the parent directory derived from the canonical full `path`.
- `#lifecycle:` remains the real ingestion/processing lifecycle field.
- `#filename:`, `#created:`, `#modified:`, `#extension:`, `#fingerprint:`, `#tags:`, `#quality_rating:`, `#content_rating:`, and other governed searchable fields remain available.

The underlying Database schema is not renamed merely to support a clearer query language.

### Distinct-value autocomplete

After a column is selected, OMNISEARCH enters value-autocomplete mode:

- Present the distinct existing values for that selected field from the current authoritative placement population.
- Values are sorted ascending using type-appropriate ordering.
- Tapping a value completes the field expression.
- For enum-like fields, examples include:
  - `#class:` → `EXCESS`, `KEEP`, `UNIQUE`.
  - `#lifecycle:` → the actual lifecycle values present in the Database.
  - `#extension:` → distinct extensions present.
- For Created and Modified, distinct suggestions are calendar dates rather than every full timestamp:
  - format `YYYY-MM-DD`;
  - sorted ascending;
  - the underlying timestamp remains unchanged in evidence.
- Distinct-value suggestions are assistance only and never restrict valid manual search input.

### Manual typing / wildcard override

- The user may continue typing instead of tapping a suggestion.
- Manual text overrides the current autocomplete suggestions.
- Wildcards remain first-class and bypass dependence on a finite distinct-value list.
- Examples that must remain valid:
  - `#filename:*DJI*`
  - `#folder:*archive*`
  - `#created:2024-*`
  - `#class:excess`
- Existing negative terms and `OR` semantics remain supported.
- Autocomplete must never silently rewrite or broaden a user-entered expression.

### Execution behavior

- Enter executes the OMNISEARCH expression.
- Blur executes when the expression has changed.
- Search remains non-destructive.
- Search result membership never implicitly selects files for mutation.
- Bulk mutation continues to require explicit owner selection after filtering.

### Database and Grid parity

- Database and Grid use the same parser, aliases, autocomplete rules, wildcard semantics, negative semantics, and `OR` behavior.
- Do not maintain separate query grammars for the two surfaces.
- Query execution may reuse one shared implementation with presentation-specific result rendering.

### Qualification additions

Release A qualification must verify:

1. no permanent `#` helper button exists in Database or Grid;
2. typing `#` enters field-autocomplete mode;
3. first-letter and subsequent-letter filtering of column suggestions works;
4. `class` resolves to `system_classification`;
5. `folder` resolves to parent-directory search without changing canonical stored `path`;
6. selecting a field produces distinct-value suggestions;
7. Created/Modified distinct suggestions are normalized to ascending `YYYY-MM-DD` values;
8. direct manual typing overrides autocomplete;
9. wildcard field expressions execute correctly;
10. Enter and blur execute;
11. Database and Grid produce the same result set for the same query against the same placement snapshot; and
12. filtered results never become an implicit bulk-selection scope.


## 2026-09-21 — RELEASE B TASK-CENTRIC AI + DATABASE PRESENTATION OVERRIDE — BINDING

This section supersedes any earlier Release B language in §44 that treats saved conversations as the primary left-rail object or makes all AI-originated actions permanently advisory-only. The approved product direction is task-centric: durable AI tasks may include conversation, evidence, proposed changes, review, and governed execution according to task authority.

### Database Path presentation

- The authoritative Database continues to store the canonical full file path.
- The visible Database **Path** presentation must never repeat the filename already shown in the Filename column.
- The visible column is therefore presented as **Folder** and displays only the parent directory.
- OMNISEARCH `#folder:` searches this derived parent-directory value.
- Canonical full path remains available to backend operations, evidence manifests, and file viewers where exact identity is required.
- Export may include canonical path under the governed export schema, but the on-screen Database column must not repeat the filename.

### Database zebra / hover treatment

Database rows use an intentionally high-contrast alternating pattern:
- zebra A: dark grey background + white text;
- zebra B: white background + dark grey text;
- hover or selected/focused row: white background + black **bold** text across the entire row.
This is a readability requirement, not a cosmetic preference. Subtle dark-on-dark zebra striping is rejected.

### Release B AI information architecture

The top-level AI surface uses the already approved PRISM-Library-shaped layout:
- collapsible left rail;
- scrollable persistent card list;
- right task workspace;
- independently scrollable task result/transcript area;
- sticky bottom compose strip.

The primary persistent object in the left rail is a **Task Card**, not a generic conversation card.

Each Task Card persists:
- task ID and task type;
- generated/default editable title;
- created/updated timestamps;
- scope and evidence revision;
- status: draft / analyzing / proposal-ready / awaiting-approval / applying / complete / failed / cancelled;
- concise task summary;
- durable transcript/conversation;
- evidence manifest;
- proposed changes/plan where applicable;
- approval record where execution is allowed;
- execution result manifest where execution is allowed.

A task may contain a free-form conversation, but the conversation is subordinate to the durable task.

### Release B initial task catalog

Release B initially exposes the following governed task types:

1. **Auto Tag**
   - analyzes selected/current-scope placements;
   - proposes owner-tag additions/removals;
   - presents a reviewable diff before mutation;
   - after explicit owner approval, may Apply through the existing governed metadata update machinery;
   - may not change UNIQUE / KEEP / EXCESS system classification.

2. **Analyze Estate**
   - read-only;
   - summarizes composition, concentrations, age/type/size patterns, anomalies, and other evidence-backed characteristics.

3. **Explain Duplicates**
   - read-only;
   - explains duplicate groups, KEEP / EXCESS classification, byte impact, paths/sources, and useful review patterns.

4. **Find Review Candidates**
   - read-only;
   - identifies evidence-backed files/groups that warrant owner attention and explains why.

5. **Propose TARGET Folder Structure**
   - creates a concrete proposed TARGET hierarchy and placement-to-destination mapping;
   - may reason from filenames, dates, media type, tags, Estate/source, existing folders, and other governed evidence;
   - proposal must be inspectable and revisable;
   - Release B does **not** execute these moves.

6. **Plan Landing to TARGET**
   - creates a concrete landing proposal for current IN PLAY content;
   - includes source placement, intended TARGET destination, capacity implications, collision considerations, verification requirements, and resulting Plan implications;
   - Release B does **not** execute landing unless a separately governed landing engine is later added and qualified.

### Release B authority boundary

AI does not receive arbitrary filesystem or Database authority.

Release B authority is task-specific:
- Auto Tag may execute owner-tag changes **only after explicit owner review and approval**, using the deterministic governed metadata API.
- Analyze Estate, Explain Duplicates, and Find Review Candidates are read-only.
- Propose TARGET Folder Structure and Plan Landing to TARGET are proposal/planning tasks only in Release B.
- Reorganizing TARGET, moving files into a proposed hierarchy, copying/landing IN PLAY content, deleting files, changing system classification, and changing Plan arithmetic remain outside Release B execution authority unless separately governed.

Every executable AI task must use the same deterministic backend path already used by the non-AI SOT surface. The model proposes; the governed SOT engine validates and executes. The model never directly edits SQLite or the filesystem.

### Right-side task workspace

The right side remains conversational and must support free-form follow-up beneath the active task.

It contains:
- task title and type;
- task status/progress;
- visible scope and evidence revision;
- evidence-backed result/proposal;
- review/diff UI where the task can apply changes;
- task-specific approval/apply controls only when authorized;
- complete durable transcript;
- sticky compose box for follow-up questions, refinements, exclusions, or reruns.

Examples:
- “Only tag videos.”
- “Exclude screenshots.”
- “Group this proposed structure by year before device.”
- “Why did you classify these as review candidates?”
- “Show me only EXCESS items above 1 GB.”

Follow-up instructions modify the task/proposal; they do not silently broaden scope or execute changes.

### Auto Tag approval contract

Before Apply, Auto Tag must display:
- exact placement count;
- current tags;
- proposed additions/removals per placement or deterministic grouped equivalent;
- evidence revision;
- any excluded/failed placements;
- total mutation scope.

Apply requires an explicit owner action. After approval:
1. backend validates that referenced placements still exist/current revision is valid;
2. changes execute through the governed metadata update API;
3. catalog revision advances;
4. Database/Grid/Plan/report surfaces refresh from backend truth;
5. Activity records the task application;
6. the Task Card stores the applied result and any partial failures.

A stale proposal may not be silently applied against a materially changed evidence revision.

### Future landing / reorganization boundary

The Release B UI may include task cards for proposed landing and proposed TARGET reorganization, but execution controls remain absent/disabled until a separately governed landing/migration engine exists.

That later engine must prove at minimum:
- capacity preflight;
- collision handling;
- copy/move semantics;
- destination byte-identity verification;
- source-retention policy;
- partial-failure recovery;
- Database/current-placement reconciliation;
- Plan/revision updates;
- Activity logging;
- restart/recovery behavior.

### Release B qualification additions

Release B is blocked unless all of the following pass:

1. AI top-ribbon control activates the task surface.
2. Left rail contains durable Task Cards, not conversation-only cards.
3. Rail collapses on mobile without losing the active task.
4. Initial task catalog contains exactly the governed initial task types unless the Plan is updated.
5. Right workspace contains task result/proposal + durable transcript + sticky compose.
6. Auto Tag proposal is reviewable before Apply.
7. Auto Tag cannot alter system classification.
8. Auto Tag Apply requires explicit owner approval.
9. Auto Tag Apply uses the existing governed backend metadata path and records results.
10. Stale Auto Tag proposals are rejected or revalidated before application.
11. Read-only tasks expose no mutation controls.
12. Folder-structure and landing tasks expose proposal/review only; no filesystem execution control exists.
13. Task/conversation state persists server-side across reload.
14. Evidence revision/scope is stored with every run.
15. Scope cannot silently expand.
16. AI provider failures preserve the task and user turn without fabricated output.
17. Running tasks do not block Analyze, Grid, Database, or normal filesystem operations.
18. Existing Release A gates remain green.
19. Database visible Folder column excludes filename.
20. Database zebra rows are dark-grey/white alternating with the governed text colors.
21. Hover/selected Database rows are white with black bold text.


## 2026-09-21 — RELEASE B MOBILE STABILITY / SHARED SEARCH / AI SCOPE SIMPLIFICATION — BINDING

This patch is a corrective refinement to the accepted Release B task surface and Database/Grid presentation.

### Database horizontal stability

- Background polling must not rebuild the active Database DOM merely because job/event/source state refreshed.
- Horizontal and vertical Database scroll positions remain owner-controlled and stable until the owner scrolls, changes query/sort, or navigates away.
- Selecting/deselecting a Database row must update row selection styling in place and must not rebuild the table or force horizontal scroll back to the left.
- Catalog-revision changes may refresh Database evidence, but the current scroll position must be preserved across that authoritative refresh.

### Database zebra adjustment

- Keep the approved alternating dark-row / white-row design.
- Dark zebra rows use a materially darker charcoal than the prior #343a40 treatment.
- Dark row: dark charcoal background + white text.
- White row: white background + dark grey text.
- Hover/selected remains white background + black bold text.

### Filename cell

- Viewer-launch control appears on the **left** side of the Filename cell.
- Visible filename text is truncated after 25 characters with an ellipsis when longer.
- Tapping/clicking the visible filename copies the **complete canonical filename**, not the truncated presentation.
- Full filename remains available to the viewer/evidence model.

### Shared Database/Grid OMNISEARCH

- Database and Grid use one shared OMNISEARCH expression and one shared executed query state.
- A query entered/executed on Database appears identically when switching to Grid.
- A query entered/executed on Grid appears identically when switching to Database.
- Clearing search on either surface clears the shared search on both.
- Result semantics remain identical because both surfaces already share the governed parser.

### AI scope simplification

The Release B AI surface no longer presents a scope selector.

- Every new/run task uses the current shared Database/Grid OMNISEARCH expression as its scope.
- If OMNISEARCH is non-empty, the task scope is the exact current query result set.
- If OMNISEARCH is empty, the task scope is **Entire SOT**.
- Explicit-selection and Plan/operations scope choices are removed from the Release B task UI.
- Task Cards persist and display:
  - task title;
  - task type;
  - search criteria used for the task (or **Entire SOT**);
  - status;
  - durable transcript/result.
- The task compose box is pre-populated with an appropriate default instruction for the chosen task and remains editable before Run.
- Scope/query is captured when the task is run and stored with the evidence manifest. It may not silently broaden after submission.

### AI flicker / polling

- Background SOT polling must not rebuild the active AI surface.
- AI polling occurs only when a task is actually running or when the owner explicitly refreshes/opens the AI surface.
- While a task is running, polling updates only task state that changed; it must not repeatedly replace the complete rail/stage DOM.
- Typing in the compose field, editing a card title, scrolling the transcript, or inspecting a proposal must not be disrupted by periodic rerenders.

### Qualification additions

Release B qualification must verify:
1. background data polling excludes active Database and AI DOM rerender;
2. Database row selection does not call full `renderDatabase()`;
3. dark zebra is darker than the superseded #343a40 treatment;
4. viewer-launch button precedes filename text;
5. visible filenames truncate at 25 characters while copy uses full filename;
6. Database/Grid share query draft and executed query state;
7. AI scope selector is absent;
8. blank shared query resolves to Entire SOT;
9. non-empty shared query resolves to exact current query results;
10. Task Card/task stage visibly records the query criteria;
11. compose receives a task-specific editable default prompt; and
12. AI polling does not replace the full active surface on every poll.


## 2026-09-21 — PLAN / REPORT COMPACT COLUMN LAYOUT — BINDING

The Plan/report tables must use content-sized columns rather than stretching columns across the available card width.

- Item / Files / Size / Percent columns collapse to the width required by their visible content.
- Do not force the Plan/report table to 100% width.
- Do not impose a mobile minimum table width.
- Do not insert artificial blank space between report columns.
- Keep normal compact cell padding so values remain readable/tappable.
- Horizontal scrolling is allowed only when the actual content width exceeds the viewport.
- This is presentation-only; Plan arithmetic, row order, labels, bars, totals, and subtab behavior remain unchanged.


## 2026-09-21 — WINDOWS-AWARE VOLUME DISCOVERY — BINDING

SOT volume discovery must distinguish **Windows-visible drives** from **WSL-mounted usable volumes**.

### Discovery contract

- On WSL, `/api/volumes` must query Windows for logical filesystem drives in addition to enumerating Linux mount points.
- Windows discovery must include fixed, removable, optical, and mapped/network logical drives that Windows reports.
- Windows drive letters are merged with the corresponding expected WSL DrvFs path, normally `/mnt/<letter>`.
- A Windows-visible drive must not silently disappear merely because it is not currently mounted in WSL.
- Each returned volume records whether it is:
  - visible to Windows;
  - mounted/usable in WSL;
  - Windows drive letter / Windows root;
  - WSL path when applicable;
  - drive type when Windows supplies it.
- Duplicate entries from Windows discovery and Linux mount discovery are coalesced.

### Usability boundary

- Existing SOT source/target/folder operations remain Linux-path based.
- A Windows-visible drive that is not mounted in WSL is shown in the picker but is explicitly marked **Not mounted in WSL** and is not selectable for source/target operations.
- SOT must not silently perform privileged mounts.
- Once the drive becomes mounted/readable in WSL, Refresh volumes must promote the same drive to a selectable volume.

### Picker presentation

- Available Volumes must show Windows-visible drives even when currently unavailable to WSL.
- Mounted drives show their WSL path.
- Windows-only entries show the Windows drive/root plus **Not mounted in WSL**.
- Tapping an unmounted entry produces a concise explanation rather than an empty Folder Tree or generic error.

### Qualification

Release B qualification must verify:
1. Windows logical-drive discovery is present on WSL;
2. Windows-only drives are returned rather than hidden;
3. mounted Windows drives coalesce with `/mnt/<letter>`;
4. unmounted Windows drives are marked unavailable and cannot become source/target roots;
5. Linux-only mounts continue to appear; and
6. no automatic privileged mount command is introduced.


## 2026-09-21 — LIVE WINDOWS VOLUME RECONCILIATION + PROVEN LAZY MOUNT RECOVERY — BINDING

This section supersedes the temporary Windows-aware discovery rule that merely displayed Windows-visible/WSL-unmounted drives. Repository history confirms that SOT Turn 01 already implemented and owner-tested the correct architecture: **dynamic Windows drive discovery + lazy WSL mount through a narrow `sot-mount-drive` helper**. Turn 02 must recover that proven behavior rather than leave mount repair to the owner.

### Recovered lineage

The implementation must recover the established Turn 01 storage pattern represented by:
- `integrate-SOT-turn01-base.py` — `windowsDriveLetters()`, `driveMounted()`, `ensureWindowsDriveMounted()`, `volumeRecord()`, `volumeFor()`;
- `patch-SOT-turn01-base-storage-final.py` — mount-table verification for both WSL2 `9p` and `drvfs`, exact source/target matching, and stale/unreadable mount rejection;
- the Turn 01 installer lineage that expected a root-owned `/usr/local/sbin/sot-mount-drive` helper callable by the SOT service through narrowly scoped passwordless sudo.

This is recovered product behavior, not a new speculative design.

### Authority and identity

- Windows is authoritative for whether a Windows filesystem volume currently exists.
- WSL mount state is the current access mechanism, not the durable identity.
- Windows discovery records current drive letter/root plus a stable identity when Windows exposes one (volume serial / volume GUID / provider identity).
- SOT does not assume that a letter or `/mnt/<letter>` path remains permanently attached to the same physical volume.
- Every reconciliation reads current Windows inventory again.

### Continuous reconciliation

SOT maintains live volume state rather than a startup snapshot.

- While SOT is running, Windows volume inventory is re-read periodically.
- Newly appearing Windows volumes are discovered without restarting SOT.
- A Windows-visible drive that is not currently usable in WSL triggers the governed lazy-mount path.
- A drive that disappears from Windows immediately becomes unavailable in SOT.
- A drive that reappears is reconciled and remounted as needed.
- Refresh Volumes remains an explicit immediate refresh control, but normal correctness must not depend on the user pressing it.

### Governed mount helper

The Release B installer installs a root-owned executable:

`/usr/local/sbin/sot-mount-drive`

Contract:
- accepts exactly one Windows drive letter;
- rejects all other arguments;
- mounts only to the canonical `/mnt/<lowercase-letter>` location;
- may establish only Windows-backed WSL mounts using the normal WSL Windows filesystem mechanism;
- recognizes both `9p` and `drvfs` as valid WSL2 Windows-backed mount types;
- verifies exact mount target and normalized Windows source after mounting;
- verifies the mounted root is readable;
- never accepts mere directory existence as proof of a mount;
- refuses to replace an unrelated/conflicting mount at the canonical target;
- may repair only a stale/unreadable Windows mount when the target/source correspond to the same requested drive;
- has no arbitrary command execution surface.

The installer grants the SOT service user passwordless sudo for **only this helper**. The SOT server itself does not receive unrestricted sudo.

### Lazy mount behavior

- `/api/volumes` reconciles current Windows inventory with current Linux mount-table state.
- When a Windows volume is currently visible but lacks a valid usable WSL mount, SOT attempts `sudo -n /usr/local/sbin/sot-mount-drive <LETTER>`.
- After the helper returns, SOT re-reads mount state and only marks the volume AVAILABLE if exact mount verification and readability pass.
- Mount failures are returned as truthful per-volume state and logged; they do not silently hide the Windows volume.
- Mount attempts use a short retry/cooldown so a persistently unavailable optical/network/removable drive cannot cause a tight privileged retry loop.

### Operation-boundary reconciliation

Before any operation that depends on a Windows-backed path, SOT revalidates/mounts the current drive as needed. This includes:
- Estate source registration;
- source analysis start;
- folder browsing;
- TARGET configuration;
- folder creation;
- Folder move preflight/execution;
- file preview/open/delete where the placement is Windows-backed.

A drive that was mounted five minutes ago is never assumed to remain usable merely because its former mount directory still exists.

### Picker behavior

- Estate Available Volumes is a live inventory.
- Mounted/reconciled Windows drives are immediately selectable.
- A drive currently visible in Windows but failing mount is shown with the actual failure state, not a generic “mount it yourself” instruction.
- Volume list refreshes automatically while Estate is open, but must preserve picker scroll, expanded folder state, and current selection.
- TARGET uses the same reconciled volume inventory and mount authority as Estate.

### Job behavior

- A source root is reconciled before analysis begins.
- If a required Windows source is no longer present, analysis start refuses truthfully before creating a running job.
- If a source disappears during an active analysis, file errors must not convert the missing volume into destructive evidence or silently reclassify missing placements. The condition is an availability failure and is logged for recovery.
- A subsequent analysis after the same volume returns/remounts reuses the authoritative placement history.

### Qualification additions

Release B qualification must prove:
1. the recovered lazy-mount helper exists and is installer-managed;
2. helper accepts only one drive letter and mounts only `/mnt/<letter>`;
3. helper accepts verified `9p` or `drvfs`, not placeholder directories;
4. conflicting unrelated mounts are refused;
5. server invokes only the fixed helper through `sudo -n`;
6. Windows inventory is re-read dynamically rather than cached as startup truth;
7. `/api/volumes` attempts governed lazy mount for Windows-visible unmounted drives;
8. mount failure remains visible with truthful state;
9. operation-boundary path reconciliation is present;
10. Estate performs periodic live volume reconciliation without losing picker state;
11. no unrestricted sudo rule is installed; and
12. all existing Release B Database / Grid / Plan / AI gates remain green.


## 2026-09-21 — RELEASE B AI COMPARE PATHS / CONVERSION VERIFICATION — BINDING

Release B AI gains a governed **Compare Paths / Folders** task that may analyze two arbitrary currently-accessible filesystem paths, including content that is not yet part of the SOT Database.

### Purpose

This task is for evidence-backed comparison of two files or folder trees. A primary use case is conversion verification, for example:
- Folder A contains legacy AVI files.
- Folder B contains MP4 files believed to be conversions of those AVI files.
- The owner wants SOT to determine which MP4s have credible corresponding AVI sources, whether the converted media appears structurally valid, which legacy originals are plausible candidates for cold storage or later soft-delete review, and which pairs require manual attention.

### Task catalog

Add task type:

**Compare Paths / Folders**

This task is read-only in Release B. It may recommend review/cold-storage/soft-delete candidates, but it may not move, archive, trash, or delete either side.

### Inputs

The task workspace provides two independent governed filesystem selectors:
- **Path A**
- **Path B**

Each selector uses the same live reconciled Windows/WSL volume inventory and folder browser as Estate/TARGET. Either side may be:
- a folder root;
- a specific file;
- inside or outside registered Estate;
- on different volumes.

The Task Card persists both selected paths and their current stable-volume identity evidence where available.

### Comparison evidence

SOT builds deterministic evidence before AI interpretation.

For folder comparisons:
- recursively enumerate regular files on each side;
- capture full filename, extension, relative path, size, modified/created timestamps when available;
- normalize a comparison key from filename stem without discarding the exact original names;
- pair obvious stem/name matches first;
- retain unmatched files on both sides;
- do not assume same-name files are equivalent merely because names match.

For media files, when `ffprobe` is installed:
- run `ffprobe` read-only;
- collect container format, duration, stream count, video/audio codec names, width/height, frame-rate metadata where available, bitrate where available, and probe success/failure;
- treat probe failure as evidence requiring review;
- do not decode/transcode or alter the file.

For AVI → MP4 conversion review, the deterministic comparison should expose at minimum:
- normalized stem/name match;
- source/converted extensions;
- source and converted byte sizes;
- source and converted durations;
- absolute and percentage duration difference;
- source/converted video dimensions;
- source/converted audio/video stream presence;
- container/codec metadata;
- probe success;
- exact names and paths.

### Legitimacy / recommendation boundary

SOT must not label an MP4 “legitimate” solely from filename matching.

A strong conversion-match candidate requires evidence such as:
- credible filename/stem correspondence;
- successful media probe on both sides;
- materially similar duration within a governed tolerance;
- compatible stream structure;
- no obvious zero-byte/truncated/probe-error condition.

Resolution, codec, and byte size may legitimately change during conversion and are not by themselves evidence of corruption.

The AI result must classify each pair into evidence-oriented buckets such as:
- **Verified conversion candidate**
- **Likely match — review**
- **Unmatched converted file**
- **Unmatched legacy file**
- **Probe/error — manual review**

A legacy AVI may be recommended as:
- **Cold-storage candidate**
- **Soft-delete review candidate**
only when the converted counterpart has sufficient deterministic evidence. The recommendation is advisory only in Release B.

### Name-aware comparison

The AI receives both exact filenames and normalized pairing keys. It may reason about naming patterns across the two trees, including:
- extension-only conversion;
- renamed prefixes/suffixes;
- numbering sequences;
- date/device tokens;
- systematic conversion-tool suffixes.

It must clearly distinguish deterministic pairing evidence from inferred naming-pattern matches.

### Scale / persistence

- Comparison runs in a background task and does not block Database/Grid/Analyze.
- Task progress records files enumerated/probed on each side.
- Evidence manifest stores both path roots, counts, paired/unmatched counts, and probe availability.
- The durable transcript/result remains available from the Task Card.
- Large comparisons may summarize evidence for the model while preserving deterministic pair results server-side.

### Qualification

Release B qualification must verify:
1. Compare Paths / Folders exists in the task catalog;
2. task accepts two independent paths outside the SOT placement table;
3. it is read-only and exposes no Apply/delete/move action;
4. deterministic name/stem pairing precedes AI interpretation;
5. exact filenames remain in evidence;
6. optional `ffprobe` evidence is collected read-only when available;
7. duration difference and probe failures are surfaced;
8. unmatched A/B files remain visible;
9. task result may recommend cold-storage/soft-delete review but never executes it; and
10. existing Auto Tag authority boundaries remain unchanged.


## 2026-09-22 — ESTATE PANEL 2 FOLDER SEARCH / BULK PATH SELECTION — BINDING

The Estate Picker middle column (Panel 2 / Folder Tree) gains a **FOLDER SEARCH** surface above the tree. It searches the currently selected live volume/path space directly; it is not limited to paths already indexed in the SOT Database.

### Search syntax

The Folder Search field uses a compact OMNISEARCH grammar specific to filesystem discovery:

- `#folder:<pattern>` — match folder names and/or full folder paths.
- `#file:<pattern>` — match filenames; each hit returns the containing folder path as the selectable result.
- Unqualified terms match either folder path or filename.
- Prefix any term with `-` to exclude matching results.
- `*` and `?` wildcards are supported.
- Multiple positive terms are ANDed; multiple negative terms exclude from the positive result set.
- Search is case-insensitive.
- Enter executes search.
- Search always runs beneath the currently selected Panel 1 volume/root and must use the same live Windows/WSL reconciliation before enumeration.

Examples:
- `#folder:*video*`
- `#file:*.mp4`
- `#file:*.mp4 -#folder:*archive*`
- `#folder:*camera* -#file:*.tmp`

### Results

- Search results appear in Panel 2 above the normal Folder Tree.
- Results are **unique folder paths**.
- Every returned result is checked by default.
- Each result row shows:
  - checkbox;
  - full path;
  - a large touch-safe `>` control to move that one path into Panel 3.
- Controls above the results:
  - **Select all**
  - **Deselect all**
  - **Move checked >**
- `Move checked >` moves all currently checked paths into Panel 3 in one action.
- Deselecting rows does not remove the result; it only changes the next bulk transfer.
- The normal expandable Folder Tree remains available beneath search results.

### Panel 3 / overlap behavior

Moving a search result means adding that path to **Selected Estate Roots**; it does not move filesystem content.

Existing Estate overlap rules remain authoritative:
- already registered/selected coverage is not duplicated;
- if a selected parent covers a checked child, the child is not separately added;
- if a newly added parent covers already-selected descendants, the parent replaces those descendants so Panel 3 remains a valid non-overlapping source-root set;
- bulk transfer reports how many paths were added and how many were skipped/reduced by overlap rules.

### Search backend

Add a read-only filesystem search endpoint.

- Search operates only beneath a currently accessible/reconciled volume root.
- It recursively enumerates folders and regular files without following symlinked directories.
- File matches contribute their parent folder as the result path.
- Folder matches contribute the folder itself.
- Results are deduplicated and path-sorted.
- A bounded result limit prevents an unbounded browser payload; truncation is explicit.
- Search does not register sources, mutate files, alter Database rows, or authorize analysis.

### Mobile / interaction

- Search controls are touch-safe.
- The per-row `>` is materially larger than the old tiny transfer affordance.
- Search results have their own scroll region and do not cause Panel 1 or Panel 3 to scroll.
- The three picker panels remain independently scrollable.
- Refreshing live volumes must not clear an active Folder Search expression or checkbox state unless the selected volume itself disappears.

### Qualification

Release B qualification must prove:
1. Folder Search exists above Panel 2;
2. `#folder:`, `#file:`, negative terms, `*` and `?` are accepted;
3. search is filesystem-based and not dependent on SOT placement rows;
4. file hits return containing folder paths;
5. results are unique and checked by default;
6. Select all / Deselect all / Move checked > are present;
7. each result has its own large `>` transfer control;
8. bulk transfer preserves the non-overlapping Estate-root invariant;
9. search is read-only; and
10. existing live-volume reconciliation and Estate registration gates remain green.


## 2026-09-22 — CORRECTIVE EXECUTION PLAN: ROLLBACK FOLDER SEARCH, REBUILD SOURCE SEARCH, REPLACE AI CONVERSION COMPARISON — BINDING

This section supersedes the earlier 2026-09-22 **Estate Panel 2 Folder Search / Bulk Path Selection** design and the earlier **Compare Paths / Folders** AI design.

No implementation work under this section begins until the owner approves this updated Plan.

### Execution baseline and sequencing

The next execution must proceed in this exact order:

1. **Rollback application code to the last qualified runtime before Folder Search was introduced.**
   - Baseline runtime: `e74482f24cc74f49241da41095a2a77e5e11b9fb`.
   - Preserve all governance documents and unrelated accepted work added after that runtime.
   - Do not roll back the database schema, qualified Release B AI task persistence, live Windows volume reconciliation, mount helper, Plan arithmetic, Database/Grid work, or other accepted Release B behavior.
   - The rollback is code-selective: restore the Estate picker/UI/backend surfaces that existed immediately before Folder Search was added.

2. **Implement the corrected Folder/File Search described below.**
   - Qualify it independently before changing AI comparison behavior.

3. **Remove the current A/B Compare Paths / Folders functionality.**
   - Remove the temporary Path A / Path B task UI and its A-versus-B comparison semantics.
   - Preserve task persistence infrastructure and unrelated AI task types.

4. **Implement the replacement persistent converted-file comparison task described below.**
   - Reuse the same governed three-panel source selection model as Estate.
   - Qualify refresh/re-scan behavior and deterministic FFmpeg evidence before release.

5. Run the full Release B mechanical gate and publish only after all existing and new gates are green.

---

# A. CORRECTED ESTATE FOLDER / FILE SEARCH

## A1. Placement and interaction model

The search input remains directly above **Panel 2 — Folder Tree** in the Estate Picker.

Submitting the search does **not** expand results inline inside Panel 2.

Instead, pressing Enter or Search opens a dedicated **Search Results modal**.

The modal must:

- have a fixed **X in the upper-right corner**;
- remain open while the owner moves one or more results into Panel 3;
- close only when the owner taps X or explicitly dismisses it;
- preserve the original search expression while open;
- use its own scroll region;
- not move or resize Panels 1, 2, or 3.

## A2. Search grammar

Folder/File Search is filesystem-based beneath the currently selected live/reconciled Panel 1 volume.

Supported syntax:

- `#folder:<pattern>` — match folder names or full folder paths.
- `#file:<pattern>` — match filenames; the selectable result is the containing folder path.
- unqualified terms — match folder names/paths or filenames.
- `-<term>` — negative exclusion.
- `*` — multi-character wildcard.
- `?` — single-character wildcard.
- search is case-insensitive.
- multiple positive terms are ANDed.
- multiple negative terms exclude from the positive result set.

Examples:

- `#folder:*video*`
- `#file:*.mp4`
- `#file:*.mp4 -#folder:*archive*`
- `#folder:*camera* -#file:*.tmp`

## A3. Search result semantics

Search returns **unique folder paths** only.

For `#file:` matches, the file itself is not transferred to Panel 3; its containing folder is the result.

A result is excluded only when that **exact folder path** is already:

- a registered Estate root; or
- already present in Panel 3 as a pending selected Estate root.

Parent/child/sibling relationships do **not** suppress otherwise valid results.

Example:

Existing Estate registration:

`A/B/E`

Search may still return and allow selection of:

`A/B/C`
`A/B/D`
`A/B`

Only the exact already-registered path `A/B/E` is excluded.

## A4. Explicit Estate roots are preserved

Estate roots represent explicit owner selections.

Adding a parent, child, or sibling must **never** silently delete, collapse, replace, or normalize another registered Estate root.

Example:

Before:

`A/B/E`

After owner selects C and D:

`A/B/E`
`A/B/C`
`A/B/D`

All three remain explicit Estate registrations.

If the owner later explicitly adds `A/B`, then all four registrations may exist:

`A/B/E`
`A/B/C`
`A/B/D`
`A/B`

SOT must not silently remove any of them.

## A5. No double counting despite overlapping registrations

Overlapping explicit registrations are permitted, but duplicate traversal/accounting is not.

The backend scan planner must ensure that a physical file is not double-counted merely because it is reachable through more than one registered Estate root.

The implementation must preserve both concepts simultaneously:

- **registration truth** — every explicit owner-selected Estate root remains registered;
- **content accounting truth** — each physical placement is indexed/accounted consistently without duplicate estate totals caused only by overlapping source roots.

Any overlap-deduplication rule belongs in scan/evidence planning, not by deleting owner registrations.

## A6. Search result selection model

All modal results are selected by default.

Selection UI is based around a single live chip:

**`14 selected ×`**

Behavior:

- the number updates immediately as individual checkboxes are checked/unchecked;
- clicking the **chip body** transfers all currently selected result paths into Panel 3;
- clicking the chip's **×** deselects all results without transferring anything;
- after deselect-all, selecting individual checkboxes rebuilds the chip count;
- when zero are selected, the chip displays `0 selected` and cannot transfer.

Each result row also includes:

- checkbox;
- full folder path;
- a large touch-safe **`>`** button.

Tapping a row's **`>`** transfers only that one path into Panel 3.

Once a path is transferred into Panel 3, it disappears from the active search results because its exact path is now already selected.

The modal may remain open so the owner can continue transferring additional results.

## A7. Search backend contract

Folder/File Search remains read-only.

The backend must:

- reconcile the active Windows/WSL volume before searching;
- recursively enumerate beneath the selected root;
- not follow symlinked directories;
- match folder/file grammar deterministically;
- map file matches to containing folder paths;
- deduplicate returned folder paths;
- exclude only exact paths already registered or pending in Panel 3;
- return path-sorted results;
- bound response size and surface explicit truncation;
- not register sources, mutate files, change Database rows, or start analysis.

## A8. Folder Search qualification

Qualification must prove:

1. results open in a modal, not inline Panel 2;
2. modal has a fixed top-right X;
3. `#folder:`, `#file:`, negative terms, `*`, and `?` work;
4. search operates on filesystem state, not only indexed SOT placements;
5. file matches return containing folder paths;
6. exact already-registered/pending paths are excluded;
7. parent/child/sibling candidates remain selectable when only a related path is registered;
8. all results start selected;
9. the live `# selected ×` chip updates correctly;
10. chip body moves selected results;
11. chip × deselects all without moving anything;
12. each row has a large touch-safe `>`;
13. moving a result removes that exact path from the result list;
14. explicit overlapping Estate registrations remain preserved;
15. scan/accounting does not double-count content solely due to overlapping registrations;
16. the three picker panels remain independently scrollable.

---

# B. REMOVE CURRENT A/B AI COMPARISON

The current **Compare Paths / Folders** task is rejected.

The following behavior must be removed:

- temporary Path A and Path B controls;
- A-versus-B task semantics;
- one-time arbitrary path pairing as the primary task model;
- task cards that describe comparison as `Path A ↔ Path B`;
- task configuration that must be rebuilt for each subsequent comparison run.

The underlying AI task persistence framework remains.

---

# C. REPLACEMENT AI TASK — CONVERTED FILE VERIFICATION

## C1. Product model

Replace the rejected task with a persistent AI task:

**Compare Converted Files**

This task verifies alternate media representations **within a persistent owner-selected source set**.

It is not “A versus B.”

The task owns a durable list of **Comparison Sources**.

## C2. Source selection UI

Comparison Sources use the same governed three-panel source-selection interaction as Estate:

- **Panel 1 — Available Volumes**
- **Panel 2 — Folder Tree + corrected Folder/File Search**
- **Panel 3 — Comparison Sources**

The comparison picker must reuse the same live Windows volume reconciliation and the same corrected Search Results modal behavior.

Panel 3 is task-specific and persists with the AI task.

Comparison Sources do not automatically become Estate roots unless separately registered through Estate.

The owner may add/remove comparison source roots explicitly.

No source is silently collapsed because another selected source is its parent or child.

## C3. Persistent task configuration

Each Compare Converted Files task stores:

- task ID/title;
- registered Comparison Source roots;
- stable-volume identity evidence where available;
- comparison matching rules/version;
- last refresh/scan timestamp;
- evidence revision;
- discovered media inventory;
- deterministic candidate groups;
- last verification state/result;
- transcript/history.

Closing and reopening the task restores the same Comparison Sources.

## C4. Comparison scope

The engine compares media **within the union of all registered Comparison Sources**.

It does not divide them into A and B sides.

Primary grouping is by logical basename across extensions.

Example group:

`clip001.avi`
`clip001.mp4`
`clip001.mkv`

The first authoritative pairing pass uses exact basename equality after extension removal.

A later secondary naming pass may consider deterministic rename conventions such as:

- `clip001_converted.mp4`
- `clip001-final.mp4`

but these are explicitly marked inferred-name candidates and cannot be promoted to verified status based on naming alone.

## C5. Deterministic FFmpeg-suite evidence

AI interpretation occurs only after deterministic media inspection.

The implementation uses the locally available FFmpeg suite, at minimum:

### ffprobe

Collect, when available:

- container format;
- duration;
- stream count;
- video codec;
- audio codec(s);
- dimensions;
- aspect-related metadata where available;
- frame-rate metadata;
- bitrate;
- probe success/failure.

### ffmpeg validation

Run read-only decode/validation appropriate for the file, for example decode-to-null, to surface:

- truncated/broken stream errors;
- unreadable packets;
- decode failures;
- obvious corruption conditions.

No transcode or file rewrite is performed.

Additional deterministic fingerprint/sampling methods may be added later, but are not required to establish this release.

## C6. Conversion verification logic

Filename equality alone is never sufficient.

A strong converted-file replacement candidate requires deterministic evidence such as:

- exact or explicitly identified inferred basename relationship;
- successful probe of both representations;
- successful/acceptable decode validation of the converted representation;
- duration within governed tolerance;
- compatible expected stream structure;
- plausible dimensions/aspect;
- absence of obvious truncation/corruption evidence.

Expected changes such as:

- AVI → MP4 container;
- codec changes;
- bitrate changes;
- substantially different file size;

are informational and are not by themselves failures.

## C7. Result states

Each logical media group receives one deterministic result category:

- **Verified replacement**
- **Probable replacement — review**
- **Conversion failed / suspect**
- **Legacy only**
- **Converted only**
- **Multiple candidates / ambiguous**

AI then explains the deterministic evidence and may recommend actions.

For a verified legacy → converted relationship, the legacy file may be recommended as:

- **Cold-storage candidate**
- **Soft-delete review candidate**

These remain recommendations only.

The task may not move, archive, trash, or delete files in this release.

## C8. Refresh behavior

The task is designed to be reused over time.

A prominent **Refresh** action must:

1. re-read the same persisted Comparison Sources;
2. reconcile/mount their current volumes;
3. enumerate current files;
4. identify files that are new, changed, or missing since the last evidence revision;
5. preserve unchanged deterministic results where still valid;
6. run probe/decode verification only where evidence is new or changed when practical;
7. update candidate groups and result states;
8. produce a new evidence revision and retain prior task history.

Example:

If 200 new MP4 conversions are added to a registered Comparison Source next week, the owner opens the same task and taps **Refresh**. No source re-selection is required.

## C9. Relationship to SOT Database

Comparison Sources may be inside or outside the registered Estate.

The task does not require files to already exist in SOT Database rows.

Where a compared file already has an SOT placement, the task may reference that placement as additional evidence, but filesystem/media evidence remains authoritative for the conversion comparison.

## C10. AI authority boundary

The deterministic engine:

- enumerates;
- groups;
- probes;
- validates;
- calculates tolerances;
- records evidence/result state.

AI:

- explains;
- summarizes;
- identifies review priorities;
- recommends cold-storage/soft-delete review candidates.

AI must not fabricate probe/decode results and must clearly distinguish deterministic results from inferred naming relationships.

No destructive action is exposed by this task.

## C11. Qualification for Compare Converted Files

Qualification must prove:

1. rejected A/B UI and semantics are absent;
2. persistent three-panel Comparison Sources configuration exists;
3. corrected Folder/File Search is reused by comparison source selection;
4. task sources persist across close/reopen/service restart;
5. comparison runs across the union of all registered task sources;
6. exact basename + different extension grouping works;
7. same-name evidence alone cannot produce Verified replacement;
8. ffprobe evidence is captured when available;
9. read-only ffmpeg validation is performed when available;
10. probe/decode failures produce review/suspect states;
11. duration tolerance is explicitly calculated;
12. unmatched legacy and converted files remain visible;
13. Refresh reuses saved source roots without requiring re-selection;
14. newly added files appear on subsequent Refresh;
15. unchanged evidence can remain stable across refresh;
16. comparison is usable for files outside the SOT Database;
17. recommendations remain advisory only;
18. no move/archive/trash/delete route is exposed by the task;
19. all other Release B AI task authority rules remain green.

---

# D. RELEASE GATE

The corrected work is not releasable until all of the following are true:

- application code is selectively restored to the pre-Folder-Search runtime baseline before rebuilding;
- corrected Folder/File Search passes its qualification;
- rejected inline Folder Search behavior is absent;
- rejected A/B Compare Paths behavior is absent;
- Compare Converted Files passes persistence, refresh, FFmpeg evidence, and authority gates;
- explicit overlapping Estate registrations are preserved;
- overlapping roots do not corrupt Estate accounting;
- live Windows volume reconciliation remains green;
- Release A ancestor hash remains untouched;
- all existing Release B Database, Grid, Plan, Activity, AI, installer, rollback, and shared-origin gates remain green.


## 2026-09-22 — RELEASE C ARTIFACT IDENTITY / ROLLBACK COMPARISON — BINDING

The approved corrective implementation is published as a new, uniquely named Release C artifact set. Release B files remain intact for rollback and side-by-side comparison.

Canonical Release C public UI:

`SOT/sot-turn02-release-c.html`

Release C runtime files:

- `SOT/sot-turn02-release-c-engine.py`
- `SOT/sot-turn02-release-c-ai.py`
- `SOT/sot-turn02-release-c-server.py`
- `SOT/sot-turn02-release-c.service`
- `SOT/qualify-release-c.py`
- `install-SOT-turn02-release-c.sh`

Release C must not overwrite or rename `sot-turn02-release-b.html` or the Release B runtime directory. The installer deploys Release C under `~/.sot-turn02/release-c`, snapshots the shared schema-13 database before cutover, preserves the Release B runtime and unit, and restarts Release B on failed Release C cutover when Release B was the previously active runtime.
