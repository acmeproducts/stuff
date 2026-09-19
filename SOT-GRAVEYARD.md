# SOT Graveyard

**Status:** AUTHORITATIVE REJECTED-APPROACH RECORD  
**Updated:** 2026-09-17
**Repository:** `acmeproducts/stuff`

This document records architectural and implementation approaches that have been rejected so they are not silently reintroduced in later SOT work.

## GY-001 — Strict WSL mount/readability gate as volume authority

**Status:** REJECTED  
**Evidence:** Turn 01 Base-10 and Base-11  
**Decision date:** 2026-08-29

### Rejected approach
Treat a Windows volume as available to SOT only when a new WSL-side validator independently approves mount/readability heuristics and allow that secondary validator to override proven Windows volume discovery.

### Required replacement
Use one shared storage inventory authority. Validate actual filesystem access explicitly at the operation boundary and surface failures rather than silently hiding discovered volumes.

---

## GY-002 — Patch-forward recovery from a failed candidate

**Status:** REJECTED / GOVERNANCE PROHIBITION

A failed candidate is not a new baseline. Recovery is: return to the declared accepted source stage → preserve evidence → update Graveyard → update Plan when contract changes → rebuild governed delta → qualify before owner/device testing.

---

## GY-003 — Inventory-only repair with WSL-dependent folder browsing

**Status:** REJECTED  
**Evidence:** Turn 01 Base-12 owner test

A visible Windows volume whose folders remain inaccessible through the selected backend path is not a working storage surface. Picker navigation context must not be ephemeral.

---

## GY-004 — Brittle exact-text function-boundary surgery

**Status:** REJECTED  
**Evidence:** Turn 01 Base-13 generator failure

Do not repair generated candidates with brittle declaration/token surgery. Correct governed source and rebuild.

---

## GY-005 — PowerShell `-Command` trailing-argument transport

**Status:** REJECTED  
**Evidence:** Turn 01 Base-17 mechanical qualification

Do not assume trailing process arguments reliably populate PowerShell `$args` across WSL/Windows boundaries.

---

## GY-006 — Implicit Linux environment propagation into Windows PowerShell

**Status:** REJECTED  
**Evidence:** Turn 01 Base-19 pre-cutover qualification

Do not rely on implicit arbitrary environment propagation across WSL → Windows process launch. Use an explicit transport such as stdin/JSON.

---

## GY-007 — Split Source versus Target/Backup storage authority

**Status:** REJECTED  
**Evidence:** Turn 01 Base-20 owner test

Do not maintain contradictory definitions of storage availability for different roles. One shared inventory/access authority is required.

---

## GY-008 — Fragmented picker UX, repeated storage probing, deferred validity and manual preflight

**Status:** REJECTED  
**Evidence:** Turn 01 Base-21 owner test

Do not implement separate competing picker models, rescan on metadata selection, keep selected items simultaneously in Available, or use manual preflight as compensation for accepting invalid configuration. Duplicate cardinality/xref must be promoted as a primary post-fingerprint result.

---

## Later failure ledger

| ID | Rejected approach | Evidence |
|---|---|---|
| GY-009 | Poll-driven completed-state rerender, ambiguous stale Plan, and non-operable selector panes | `SOT/archive/2026-08-30-1337-turn01-base22-owner-rejection/GY-009.md` |
| GY-010 | Whole-function correction that erased protected completed-state behavior | `SOT/archive/2026-08-30-1405-turn01-base23-qualification-failure/GY-010.md` |
| GY-011 | Passive AI key fields without operational validation and supervisor priming | `SOT/archive/2026-08-30-1418-turn01-base24-owner-rejection-ai/GY-011.md` |
| GY-012 | Pre-cutover-only JavaScript qualification | `SOT/archive/2026-08-30-2348-turn01-base25-owner-rejection-js-syntax/GY-012.md` |
| GY-013 | Whole-document token lint overriding parser/browser gates | `SOT/archive/2026-08-31-0017-turn01-base26-qualification-failure/GY-013.md` |
| GY-014A | AI Configuration replacement deleted protected storage defaults | `SOT/archive/2026-08-31-0038-turn01-base27-qualification-failure/GY-014.md` |
| GY-014B | Same-command dependent Bash locals under `set -u` | `SOT/archive/2026-08-31-0212-turn01-base28-qualification-failure/GY-014.md` |
| GY-015 | Partial nounset correction without structural whole-installer audit | `SOT/archive/2026-08-31-0220-turn01-base29-qualification-failure/GY-015.md` |
| GY-016 | Syntax-only checking that missed a runtime `async` line-terminator failure | `SOT/archive/2026-08-31-0224-turn01-runtime-async-failure/GY-016.md` |
| GY-017 | Windows browser harness using a WSL-backed profile | `SOT/archive/2026-08-31-0248-turn01-base31-browser-harness-failure/GY-017.md` |

The two historical `GY-014` files are preserved unchanged; A/B removes numbering ambiguity without rewriting evidence.

---

## GY-018 — Numbered meta-installer patch chains and token-specific post-generation repair

**Status:** REJECTED
**Evidence:** Turn 01 Base-28 through Base-32 audit

Do not create numbered wrapper chains that mutate prior failed qualifiers or normalize failed generated output into a new ancestor. Maintain governed canonical source, rebuild, and qualify the actual candidate.

---

## GY-044 — Repeated partial-recovery loop: working subsystems without a working product

**Status:** REJECTED ARCHITECTURAL / DELIVERY PATTERN  
**Decision date:** 2026-09-14  
**Evidence:** `SOT/archive/2026-09-14-turn02-recovery-design/GY-044.md`

Mechanically qualified components are not releases. The product must be qualified as complete owner-operable vertical slices rather than accumulating individually working but contradictory subsystems.

---

## GY-045 — Internal qualification surface presented as the owner application

**Status:** REJECTED DELIVERY PATTERN  
**Decision date:** 2026-09-15

Synthetic fixtures, qualification pages, harnesses and PASS dashboards are internal engineering evidence. They are never the owner test deliverable. A `test URL` means the qualified SOT application.

---

## GY-046 — Replacing the governed three-panel storage picker with raw path entry

**Status:** REJECTED UI REGRESSION  
**Decision date:** 2026-09-15

Do not substitute raw WSL path typing for the required **Available Volumes | Folders | Selected Folders** storage selector.

---

## GY-047 — Page-owned or memory-only analysis coordination

**Status:** REJECTED ARCHITECTURE  
**Decision date:** 2026-09-15

Analysis state, evidence revision, job state and logs may not depend on the browser lifecycle or an in-memory-only job dictionary. Refresh/navigation/disconnect must not terminate or erase authoritative work. Persistent SQLite job/evidence/event state is required.

---

## GY-048 — Blocking analysis UI and opaque scan activity

**Status:** REJECTED UX / OPERATIONS MODEL  
**Decision date:** 2026-09-15

Do not make scanning monopolize the UI or hide what is being processed. Database inspection and navigation remain usable during analysis; Start/Pause/Resume/Stop/Restart and explicit per-source/global activity are required.

---

## GY-049 — Giant metric-card mobile layout

**Status:** REJECTED UI PATTERN  
**Decision date:** 2026-09-15

Do not consume the mobile viewport with disconnected oversized metric cards. Use compact proportional Total/Scanned/Unique/Duplicate/Review/Reclaimable telemetry with visible activity.

---

## GY-050 — Manual Connect as normal workflow and silent connection failure

**Status:** REJECTED UX  
**Decision date:** 2026-09-15

Backend connection is automatic from persisted configuration. Health is continuously visible as GREEN/YELLOW/RED and reconnect/failure is explicit.

---

## GY-051 — Silent failures and ephemeral logs

**Status:** REJECTED OBSERVABILITY MODEL  
**Decision date:** 2026-09-15

Do not swallow filesystem, hashing, database, inference, storage or coordination exceptions. Positive and negative operational events are durable, searchable evidence. In-memory console output alone is not sufficient logging.

---

## GY-052 — Role label alone as proof of independent protection

**Status:** REJECTED SAFETY INFERENCE  
**Decision date:** 2026-09-15

A `backup` label does not itself prove an independent protection copy. Protection reasoning requires explicit failure-domain/evidence semantics. Uncertainty becomes REVIEW.

---

## GY-053 — Self-referential inference qualification

**Status:** REJECTED QUALIFICATION MODEL  
**Decision date:** 2026-09-15

Do not generate expected decisions with the same implementation being tested and call agreement a pass. Fixture truth and policy invariants are declared independently before engine execution.

---

## GY-054 — Advancing real-storage UI before inference/operations qualification

**Status:** REJECTED SEQUENCING  
**Decision date:** 2026-09-15

Do not use owner storage as the proving ground for unsettled schema, lifecycle, inference or coordination semantics. Qualify controlled truth and durable operations first, then bounded real-storage read-only adapters, then owner application handoff.

---

## GY-055 — Opening an incompatible historical SQLite database with `CREATE TABLE IF NOT EXISTS`

**Status:** REJECTED SCHEMA / LINEAGE FAILURE  
**Evidence:** Turn 02 clean-3 startup failure: `sqlite3.OperationalError: no such column: job_id`  
**Decision date:** 2026-09-15

`CREATE TABLE IF NOT EXISTS` does not migrate an existing table and is not a schema-version strategy. A clean-lineage backend may not silently reuse an incompatible predecessor database. Every database requires explicit schema metadata/version. An unsupported predecessor is preserved as evidence while a new versioned database is created; installers never destroy old evidence to force startup.

---

## GY-056 — Conflating lifecycle status, evidence health, plan and disposition

**Status:** REJECTED DATA MODEL  
**Decision date:** 2026-09-15

Do not overload one field with processing state, read/error state, recommendation and eventual action. Lifecycle is `NONE → IN_PROCESS → HASHED → PLANNED → COMPLETED`; availability/error evidence is orthogonal; Plan is `KEEP/PROTECT/REMOVE/REVIEW`; Disposition is separate and remains `NONE` in Turn 02.

---

## GY-057 — Treating a REMOVE recommendation as filesystem deletion authorization

**Status:** REJECTED PRODUCT SCOPE  
**Decision date:** 2026-09-15

Turn 02 ends at the evidence-backed recommended plan. It does not copy, move, rename, quarantine, delete or purge owner files. `REMOVE` means recommended removal only. How plans are actioned is a later governed design decision.

---

## GY-058 — Storing duplicate path lists redundantly in every placement row

**Status:** REJECTED DATA MODEL  
**Decision date:** 2026-09-15

Duplicate membership is derived post-processing. Build a revisioned duplicate-group/content xref from fingerprints to placement IDs, filenames, paths, sources, failure domains and later per-placement recommendations. Do not serialize mutable copies of the same duplicate path list into every file row.

---

## GY-059 — Batch enumerate-everything before fingerprinting

**Status:** REJECTED SCAN ARCHITECTURE  
**Decision date:** 2026-09-16  
**Evidence:** Turn 02 v4/v4.1 owner test

Do not fully enumerate registered storage and retain the resulting file list before fingerprint work begins. On large estates this creates long opaque phases, delays useful evidence, consumes unbounded memory and prevents the owner from distinguishing forward progress from a hung scan.

**Required replacement:** per-source producers stream durable file observations into a bounded queue consumed concurrently by fingerprint workers. Hashing starts as soon as work exists; queue depth and producer/worker progress are observable.

---

## GY-060 — A single current-path label as scan observability

**Status:** REJECTED OBSERVABILITY MODEL  
**Decision date:** 2026-09-16  
**Evidence:** Turn 02 v4.1 owner screenshots: connected job remained operationally opaque while enumerating

A stage label plus one current path is not sufficient evidence that analysis is healthy. Do not require the owner to infer activity from an occasionally changing filename.

**Required replacement:** Analyze continuously shows global and per-source discovered/hashed files and bytes, current folder/file, elapsed/rate, queue depth, worker counts, warnings/errors, last-progress age and recent durable operational events. Work with no progress while work remains becomes visibly STALLED with diagnostic context.

---

## GY-061 — High-frequency work with no owner-visible live event stream

**Status:** REJECTED UX / OPERATIONS MODEL  
**Decision date:** 2026-09-16

A separate Activity page is not sufficient while a long-running analysis is being watched. Analyze requires a compact recent-event stream backed by the same durable event ledger. Event volume may be throttled/coalesced, but progress and failures may not disappear into silent intervals.


---

## GY-062 — Single shared FIFO or uncoordinated source queues

**Status:** REJECTED SCHEDULER ARCHITECTURE  
**Decision date:** 2026-09-17

Do not collapse all storage sources into one opaque FIFO and do not create multiple queues without a coordinating fairness policy. A busy, slow, blocked or backpressured source must not monopolize fingerprint capacity or prevent independent sources from advancing.

**Required replacement:** each active source owns a bounded independently observable queue. One backend job manager/scheduler fairly and work-conservingly allocates a shared fingerprint-worker pool across nonempty queues, exposes per-source queue/worker telemetry, prevents starvation, shifts spare capacity to available work, and preserves forward progress on independent sources when another source blocks.


---

## GY-063 — Directory-presence volume discovery, incomplete evidence table, and unsupervised backend

**Status:** REJECTED OWNER-TEST PATTERN  
**Decision date:** 2026-09-18  
**Evidence:** Turn 02 v5 owner test

Do not present a /mnt or /media directory as an available volume without proving the mount is currently usable. Do not collapse filename/extension/path or omit placement key and filesystem timestamps from the Evidence Database. Do not ship Database cells that cannot be copied or an OMNISEARCH surface that fails to operate on the evidence table. Do not rely on an unsupervised nohup backend whose disappearance turns polling into repeated 502/CORS failures.

**Required replacement:** usable-volume probing with visible selection state; complete separated evidence columns and stable row key; tap-to-copy cells with toast; operational evidence search; and a supervised WSL backend with explicit reconnect state.


## GY-064 — Path-only placement identity and overlapping estate registration
**Status:** REJECTED OWNER-TEST PATTERN  
**Decision date:** 2026-09-18

Reject placement IDs derived only from source+path across revisioned jobs: the second observation collides with the first. Reject client-only duplicate prevention and selectors that hide the WSL root filesystem. Reject deriving estate membership from arbitrary path parsing.

**Required replacement:** job/revision-scoped placement IDs; first-class ESTATE evidence; complete WSL-root navigation; overlap annotation in picker plus backend overlap rejection; registered Estate catalog.


---

## GY-064 — Poll-driven picker rerender, fire-and-forget state, and restart-as-rescan

**Status:** REJECTED OWNER-TEST PATTERN  
**Decision date:** 2026-09-18

Do not rerender an actively scrolled picker because unrelated polling completed. Do not use an elapsed timer as the primary proof that analysis is running. Do not equate transport loss with backend job termination. Do not make restart/recovery blindly create duplicate observations or rehash already durable evidence.

**Required replacement:** preserve picker scroll/DOM interaction state; render backend-owned job state; same-revision durable Continue/recovery that reuses existing observations and queues only unfinished work; new Start only for a genuinely new revision.

---

## GY-065 — Arbitrary-path file serving or privileged HTML preview

**Status:** PROHIBITED  
**Decision date:** 2026-09-18

Do not expose an API that accepts an arbitrary owner filesystem path from the browser. Do not execute owner HTML/Markdown scripts with SOT backend privileges.

**Required replacement:** placement-ID lookup against registered evidence, read-only streaming, sandboxed HTML preview, and explicit external/native open action.


---

## GY-066 — Monolithic polling and data-timeout-as-disconnect

**Status:** REJECTED OWNER-TEST PATTERN  
**Decision date:** 2026-09-18

Do not serialize health, job, events, sources, and thousands of placement rows into one high-frequency poll whose single exception declares the backend disconnected. Do not let a slow evidence query or client timeout masquerade as loss of WSL/Tailscale/backend connectivity.

**Required replacement:** independent lightweight health channel with bounded retry/backoff; separate non-overlapping operational-data polling; lazy/lower-frequency heavy placement retrieval; preserve last-good data and report data/database retry state independently of transport health.


---

## GY-067 — V8 parallel retry-channel patch

**Status:** REJECTED OWNER-TEST CANDIDATE  
**Decision date:** 2026-09-18

The V8 retry patch that introduced independent interval-driven health/data/database loops is rejected. Owner test: unlike the prior V8 baseline, it never established a connection. It is evidence only and may not be a development ancestor.

**Required replacement:** rebuild from the last owner-observed initially connecting V8 baseline (0f633de218406aa78e7f599f0f98dbf259c5efba); retain one guarded poll cycle, establish health first, isolate later data failures from connection state, and omit heavy placements from ordinary polling.


---

## GY-068 — V8/V9 used as recovery baseline after owner rejection

**Status:** REJECTED / DEFUNCT  
**Decision date:** 2026-09-18

Owner clarified that V7, not V8, is the accepted baseline. V8 is broken and V9 is defunct. Neither may be used as an implementation ancestor for recovery.

**Required replacement:** rebuild the V8 owner candidate directly from V7 source commit 3d614c258b9352c7a907acb43ac0ab20ce0fb441; preserve rejected V8/V9 only as evidence; do not patch them forward.


---

## GY-069 — Adding a NOT NULL evidence column without updating every write path

**Status:** REJECTED ROOT CAUSE  
**Decision date:** 2026-09-18  
**Evidence:** owner V7-derived V8 runtime: repeated `source_file_error · NOT NULL constraint failed: placements.estate`, zero discovered/scanned rows.

V7 added required `placements.estate` but retained V6 placement INSERT statements that omitted Estate in both the normal and error-observation paths. The resulting schema/write mismatch made every file observation fail before fingerprinting. The later V7-derived recovery inherited the latent defect because V7 had been treated as a fully accepted baseline based on startup/transport behavior.

**Do not repeat:** a schema change is incomplete until every INSERT/UPDATE/read projection that owns the new field is audited and exercised. Never promote a storage-analysis candidate after only compile, startup, health, or HTTPS gates. Any evidence-schema change requires a real placement-write gate through discovery → durable row → fingerprint plus coverage of the error-evidence write contract.

**Required replacement:** scan-engine rollback to the pre-Estate V6 write baseline, then cleanly reapply Estate as a complete schema/write/read contract with a fresh database and fixture qualification before owner deployment.


---

## GY-070 — Browser-native dialogs, page-scroll UI, fixed evidence columns, and plain-text-only Omnisearch

**Status:** REJECTED OWNER UX PATTERN  
**Decision date:** 2026-09-18

Do not ship browser `alert`, `confirm`, or `prompt` surfaces as application UX. Do not solve dense Estate/Analyze content by making the mobile application page vertically scroll. Do not make Database evidence fit by dropping record fields or using non-persistent fixed columns. Do not treat OMNISEARCH as an undifferentiated substring box when the evidence schema is fielded.

**Required replacement:** SOT toast/modal feedback; viewport-bound mobile-first shell with Estate/Analyze sub-tabs and bounded internal workspaces; complete evidence grid with persistent user-resizable columns; field-aware type-ahead query composer supporting bare terms, field qualifiers, negative terms, and explicit OR.


---

## GY-071 — Flat folder picker, refresh-dependent volume inventory, and WSL pseudo-volumes

**Status:** REJECTED OWNER UX / INVENTORY PATTERN  
**Decision date:** 2026-09-18

Do not require Refresh Volumes to initialize the Estate inventory. Do not present WSL infrastructure paths such as `/mnt/wsl` or `/mnt/wslg` as owner storage authorities. Do not make folder navigation synonymous with Estate selection, and do not force destructive one-level navigation merely to select a nested folder.

**Required replacement:** automatic usable-volume inventory; one WSL root plus real mounted storage authorities; lazy hierarchical Folder Tree with independent left disclosure and right membership controls; `>` available, `<>` covered/selected, `<` selected descendant below; right pane contains explicit roots only; expansion/scroll state is user-owned and restored per volume.


---

## GY-072 — Per-operation SQLite connection churn and recursive DB error logging

**Status:** REJECTED RUNTIME ARCHITECTURE  
**Decision date:** 2026-09-18

Reject opening a new SQLite connection for every rows/execute/event operation. Runtime analysis showed this architecture can lose database availability while leaving the supervised process alive and the job apparently RUNNING. Reject error handlers that attempt an unguarded second write through the same failed database.

**Required replacement:** startup-validated long-lived Store connection, serialized transactions, non-throwing stderr fallback, thread failure containment, and sustained concurrent database/API responsiveness qualification.


---

## GY-073 — SOT changing the established OpenClaw/Tailscale access plane

**Status:** REJECTED HOST-DESTRUCTIVE INSTALLER PATTERN  
**Decision date:** 2026-09-18

Reject SOT taking HTTPS root, creating a separate `:8443` exposure, resetting Serve state, or replacing existing OpenClaw/report routing.

**Required replacement:** preserve the established single HTTPS origin and protected routes; add only `/sot` → `127.0.0.1:8765`; verify OpenClaw root and the Python report server remain reachable.



---

## GY-074 — Startup/health success accepted as sustained analysis qualification

**Status:** REJECTED RUNTIME QUALIFICATION PATTERN  
**Decision date:** 2026-09-18

Owner evidence showed the schema-8 V8 backend remained GREEN and reachable while the real analysis job stopped producing durable progress after source/worker startup. A one-file fixture plus HTTP health does not qualify the scheduler, database, or sustained multi-source runtime.

**Required replacement:** rebuild the engine from the governed pre-Estate baseline rather than patching the stalled candidate; use a fresh schema/database; qualify sustained multi-source discovery/fingerprinting with hundreds of files, multiple workers, progress on every source, concurrent database reads, exact reconciled counters, zero error events, and responsive health before owner deployment.


---

## GY-075 — Global SQLite lock coupling scan workload to HTTP health

**Status:** REJECTED RUNTIME ARCHITECTURE  
**Decision date:** 2026-09-18

Reject a shared SQLite connection/global application lock used by producers, fingerprint workers, API readers and `/api/health`. The pattern can pass a small concurrency fixture yet make a live backend appear disconnected when real Estate writes and polling contend for the same lock.

Also reject ordinary polling that retrieves the full placements collection while analysis is running, and reject qualification that proves only eventual completion without continuously measuring API/control-plane responsiveness under sustained backpressure.

**Required replacement:** dedicated bounded DB-writer queue/thread with batched transactions; independent WAL readers; health independent of writer lock with bounded DB status probe; placements on-demand only; sustained throttled multi-source qualification with concurrent API probes and explicit latency/progress/reconciliation gates.
