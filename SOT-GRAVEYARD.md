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


---

## GY-076 — Remote-per-keystroke evidence search, ambiguous selected tabs, and unguarded file deletion
**Status:** REJECTED OWNER UX / FILE-ACTION PATTERN  
**Decision date:** 2026-09-20

Do not perform a network/GitHub round trip per Omnisearch keystroke, rerender thousands of rows per keystroke without a display bound, use low-contrast query text, omit a clear-search control, or leave active tabs visually ambiguous. Do not expose arbitrary-path, automatic, inferred, query-only, one-click permanent, AI-driven, or Plan-driven file deletion. Do not allow bulk deletion whose scope is implicit or unreviewable.

**Required replacement:** cache placement evidence in the browser session and filter locally; bound rendered search rows while retaining the complete match set for export; provide visible × clear and strong active-tab state. Viewer Trash and Grid bulk Delete are placement-ID-only. Grid bulk Delete is authorized only for explicitly selected visible placement IDs, attempts device Trash/Recycle Bin first, requires a second explicit warning before permanent deletion fallback for the failed-trash subset, preserves per-placement success/failure evidence, and updates authoritative Database/status/classification/Plan/cache/Activity state before reporting completion.


---

## GY-077 — Ephemeral evidence cache, live-keystroke query execution, and overloaded filename action
**Status:** REJECTED OWNER UX PATTERN  
**Decision date:** 2026-09-19

Reject session-only evidence caching, automatic query execution/rerender on every keystroke, disappearing query text, non-sortable/non-resizable evidence headers, filename-as-viewer-link behavior, and viewer geometry that resets.

**Required replacement:** persistent browser-local placement cache; explicit Go/Enter query execution with stable draft/applied query and × reset; # field-selector helper; persistent resize plus ascending/descending primary sort on every visible Database column; filename click copies and separate ↗ launches viewer; viewer geometry persists. Add the dormant per-placement tags array contract now, with tag UX deferred to the next release.


---

## GY-078 — Job-scoped placement identity and historical observations presented as current Database rows
**Status:** REJECTED DATA-MODEL PATTERN  
**Decision date:** 2026-09-19

Reject placement IDs derived from job/revision. Re-scanning the same source/path must not create another current Database row, another durable #, or stale IN_PROCESS evidence beside a completed current observation. Job/revision is history; physical placement identity is stable source + path. Preserve immutable placement number, update the current placement record, and reuse a valid fingerprint when size/modified evidence proves the placement unchanged.

## GY-079 — KEEP/REVIEW fingerprint dump masquerading as a consolidation plan
**Status:** REJECTED PRODUCT PATTERN  
**Decision date:** 2026-09-19

Reject a Plan surface that simply lists every file as KEEP/REVIEW. Until TARGET exists and has an independently verified byte-identical landing, source material is IN PLAY. Plan must summarize landing readiness and source groups, then support the governed SOURCE → TARGET → VERIFY → DISPOSITION lifecycle in the next phase. Backup management is not silently folded into TARGET landing.


## GY-080 — Browser-only/free-form TARGET path masquerading as TARGET configuration
**Status:** REJECTED IMPLEMENTATION PATTERN  
**Decision date:** 2026-09-19

Reject a free-form TARGET path stored only in browser localStorage. TARGET is infrastructure state owned by the SOT backend. It must be selected from real available volumes/folders, may create a destination folder through the governed backend, must be validated for existence/read-write access/storage authority and SOURCE overlap, and must persist on the SOT host with durable activity evidence. Configuration does not itself authorize landing or destructive source disposition.


## GY-081 — Ephemeral/non-populating # helper and redundant filename in displayed Path
**Status:** REJECTED OWNER UX PATTERN  
**Decision date:** 2026-09-19

Reject field-helper behavior tied to transient focus/type-ahead state, auto-dismiss timers, or menu items that fail to populate Omnisearch. The # helper is persistent while used and inserts explicit #field: qualifiers independent of prior focus. Also reject displaying the filename again in the Path column. Preserve the canonical full path internally, but project Path as parent directory in Database/search presentation.


## GY-082 — TARGET registration without a capacity snapshot, or future fit based on raw Estate bytes
**Status:** REJECTED STORAGE-PLANNING PATTERN  
**Decision date:** 2026-09-19

Reject TARGET registration that records only a path. Capture registration-time available and total bytes and retain them as evidence while also exposing current capacity. For future landing-fit analysis, reject comparing TARGET free space to gross Estate size: reconcile TARGET fingerprints to SOT first, then compare current free space only to the unique not-yet-landed content delta.


## GY-083 — Per-file PowerShell creation lookup in the fingerprint hot path; opaque TARGET registration
**Status:** REJECTED PERFORMANCE / EVIDENCE UX PATTERN  
**Decision date:** 2026-09-19

Reject spawning PowerShell once per file during discovery/fingerprinting to obtain NTFS CreationTime. It can dominate scan runtime. Capture native birth time inline where available; otherwise batch Windows CreationTime acquisition as a post-processing evidence pass that updates only missing Created values without rehashing.

Reject a TARGET that is technically registered but visually indistinguishable from NOT CONFIGURED. Plan must expose registered TARGET identity and visual capacity: GB and percentages for used/free space with proportional bars. Do not falsely call gross unique Estate bytes TARGET-consumed or the final landing delta before TARGET fingerprint reconciliation.


---

## GY-084 — Implicit PowerShell $input, path-echo correlation, and stale Created cache
**Status:** REJECTED EVIDENCE RETRIEVAL / CACHE PATTERN  
**Decision date:** 2026-09-20

Reject treating PowerShell $input as a reliable redirected-stdin contract for batch CreationTime acquisition, correlating returned evidence by echoed path text, collapsing retrieval failures into genuine timestamp unavailability, or leaving persistent Database placement cache stale after backend evidence changes.

**Required replacement:** explicitly read redirected stdin, correlate each request/result by index, classify and log unresolved stages, advance a durable creation-evidence revision after successful updates, and have Database automatically invalidate/reload its placement cache when that revision changes.


---

## GY-085 — Redundant Plan metrics, volume-usage visualization, and non-additive stacked segments
**Status:** REJECTED OWNER UX / DATA-VISUALIZATION PATTERN  
**Decision date:** 2026-09-20

Reject Plan surfaces that repeat the same fact in metric cards, legends, bars, labels and tables; reject showing underlying TARGET-volume used/total as though the TARGET owns the volume; reject separate legends when the exact-data table can serve as the legend; and reject stacking overlapping DUP and EXCESS values as if they were mutually exclusive.

**Required replacement:** exactly three primary blue-family stacked bars with one compact exact-data table beneath each. The table is the legend. Segment tap opens a dismissible × callout. TARGET capacity means current free capacity at the registered TARGET location. Analysis reports exact DUP and EXCESS counts/bytes while keeping stacked segments mathematically additive.


---

## GY-086 — Non-arithmetic Plan tables, REVIEW row, and low-contrast duplicate visualization
**Status:** REJECTED OWNER UX / PLAN-SEMANTICS PATTERN  
**Decision date:** 2026-09-20

Reject Plan tables whose rows do not read as explicit arithmetic; reject REVIEW as a Plan composition row; reject treating all distinct fingerprints as UNIQUE when repeated fingerprints require one explicit KEEP placement; reject DUPLICATE as an additive peer of its own KEEP/EXCESS children; and reject low-contrast blue-only duplicate composition.

**Required replacement:** Analysis is UNIQUE + KEEP + EXCESS = ESTATE, with DUPLICATE as the parent of KEEP and EXCESS; Capacity is ESTATE + OPEN = TARGET; Operations is IN PLAY + LANDED = ESTATE. All owner-facing Plan equations are additive `X + Y = Z`; subtraction is not displayed. Total/result rows appear last. Analysis stacked bar uses blue UNIQUE, yellow KEEP, red EXCESS; Capacity and Operations use high-contrast blue plus white/grey. No unapproved extra Plan metrics or rows.


---

## GY-087 — Approximate donor Grid recreation without donor-spec extraction
**Status:** REJECTED OWNER UX / IMPLEMENTATION PATTERN  
**Decision date:** 2026-09-20

Reject the v9 Grid attempt that rendered empty/skeleton-like tiles, omitted the donor thumbnail-size slider, crowded system-classification chips into the search/header line, and replaced the donor Tag and Notes experiences with generic one-field prompts. Functional button names are not sufficient donor fidelity.

**Required replacement:** keep v8 as the accepted baseline; inspect the actual `acmeproducts/perf/ui-v2.html` implementation and owner screenshots first; specify slider/tile geometry, selection, Tag, Notes + Quality Rating + Content Rating, Folder, and Delete behavior before coding; then implement only in a bumped comparison artifact. Do not modify the v8 artifact.


---

## GY-088 — Vertically stacked Plan sections requiring mobile page scrolling
**Status:** REJECTED OWNER UX / MOBILE NAVIGATION PATTERN  
**Decision date:** 2026-09-20

Reject a Plan surface that vertically stacks ANALYSIS RESULTS, BASIC CAPACITY CHECK, and OPERATIONS STATUS so the user must scroll the page to move between the three primary Plan questions, especially on mobile.

**Required replacement:** each governed Plan bar and its related exact-data table is one mutually exclusive Plan subtab. Keep all three subtabs directly accessible at the top of Plan, preserve the active subtab through rerenders, confine any necessary overflow to the active subtab content, and do not change the underlying §42 arithmetic or Plan state when switching sections.


---

## GY-089 — Coloring total rows or plotting totals as bar components
**Status:** REJECTED OWNER UX / PLAN-VISUALIZATION PATTERN  
**Decision date:** 2026-09-20

Reject assigning a legend-color swatch to the bottom total/result row of a Plan table or drawing that total/result as an additional stacked-bar component. This makes the legend imply a plotted segment that does not exist and obscures the arithmetic relationship between component rows and their total.

**Required replacement:** legend swatches belong only to colored bar components. The bottom row is the total/result and has no swatch. Analysis is UNIQUE + KEEP + EXCESS = ESTATE; Capacity is ESTATE + OPEN = TARGET; Operations is IN PLAY + LANDED = ESTATE, with IN PLAY blue and LANDED white/grey.


---

## GY-090 — Filesystem mutation treated as complete before SOT reconciliation
**Status:** REJECTED DATA-INTEGRITY / OPERATIONS PATTERN  
**Decision date:** 2026-09-20

Reject Folder or Delete implementations that report success solely because the underlying filesystem call succeeded. Reject optimistic UI removal/path changes that leave Database rows, current placement/status evidence, duplicate/system classification, Plan arithmetic, persistent browser caches, or Activity inconsistent with the filesystem.

**Required replacement:** every explicit owner-initiated Grid mutation is a governed operation with per-placement durable results. Folder updates authoritative current placement/path evidence and preserves history; cross-filesystem moves verify destination byte identity before source removal. Delete retires current placement evidence only after filesystem success. Every committed mutation advances the evidence/cache revision, recomputes affected duplicate/system classification and Plan inputs/results, records Activity, and refreshes Grid/Database/Plan from backend-authoritative state before the operation is reported complete. Partial success remains explicit per placement.

---

## GY-091 — Enter-only tag commit, footer Close in Edit Tags, oversized Plan tables, redundant Database filename path, and horizontal scroll reset

**Status:** REJECTED OWNER-TEST UX PATTERN  
**Decision date:** 2026-09-20

Reject Grid tag entry that persists only on Enter; blur must commit the same pending non-empty tag input through the same idempotent path. Reject a footer **Close** button in Edit Tags; use an upper-right × close affordance.

Reject Plan subtab tables that retain a fixed/minimum width on mobile and therefore waste horizontal space or require horizontal fighting. Use compact proportional columns that fit the available content width.

Reject displaying or exporting the filename redundantly inside Database **Path**. Path is projected as parent directory while the full physical path remains authoritative internal evidence.

Reject Database rerenders that reset the evidence table horizontal position to the left edge. Selection, sort, polling and local rerender must preserve the user's current horizontal and vertical table scroll position.

---

## GY-092 — Capturing SQLite preservation checksum before stopping the predecessor service, and reusing a failed schema-12 cutover database

**Status:** REJECTED HOST-CUTOVER / MIGRATION PATTERN  
**Decision date:** 2026-09-20

Reject installer logic that hashes an actively served SQLite database and later requires the main database file to remain byte-identical across service shutdown. Clean SQLite/WAL shutdown may checkpoint committed evidence into the main file and change its byte hash even though logical data remains valid. This creates a false cutover failure.

Also reject retrying a rolled-back Release A cutover against the schema-12 database created by that failed attempt. Once rollback restores the predecessor runtime, the failed schema-12 database is no longer authoritative and may become stale relative to v11.

**Required replacement:** finish pre-cutover qualification first; stop the old supervised service; validate and hash the stabilized predecessor database only after stop/checkpoint; archive any existing failed-attempt schema-12 database; recreate schema-12 from stabilized v11; verify predecessor checksum after migration; and archive the new schema-12 attempt on any subsequent rollback before restoring the old service.



## 2026-09-20 — RELEASE A DATABASE / TAG UI NEGATIVE RULES

The following are rejected for Release A and must not return:

- Redundant **Evidence Database** heading inside the Database pane.
- Database-local **COMPLETED · Analysis complete** or equivalent job-status strip consuming vertical space.
- Dedicated Database **Go** button for OMNISEARCH.
- Separate persistent **Export CSV** and **Export JSON** toolbar buttons.
- Weak hover treatment that merely changes brightness; Database row hover must be white background with black text.
- Non-zebra Database rows.
- Bottom **Close** action in Edit Tags.
- Mixed-case owner tags persisted by either UI or backend.
- Any tag normalization that changes immutable UNIQUE / KEEP / EXCESS system classifications.


## 2026-09-21 — RELEASE A TOP-RIBBON NEGATIVE RULES

The following are rejected for Release A and must not return:

- Repeating the Release A/version name both in the brand and in the connection-health text.
- Full text labels for Estate / Analyze / Database / Grid / Plan / Activity consuming the mobile top ribbon.
- A horizontally scrolling top-level navigation ribbon on ordinary phone widths.
- An AI control that is absent from the ribbon even though Release B is reserved for AI activation.
- An apparently active AI control in Release A.
- Any Release A AI click/navigation/provider/backend behavior. The AI icon is present but inert until Release B.
- Icon-only controls without accessible `title` / `aria-label` names.
- Reordering the governed top-level sequence away from Estate → Analyze → Database → Grid → Plan → AI → Activity.


## 2026-09-21 — OMNISEARCH FIELD-DISCOVERY NEGATIVE RULES

The following are rejected and must not return:

- A permanent standalone `#` field-picker button on Database or Grid.
- Separate Database and Grid query grammars.
- Requiring the user to know or type `system_classification` when the user-facing alias `class` is available.
- Hiding `lifecycle` merely because `class` exists; they are separate searchable concepts.
- Distinct-value autocomplete that blocks or constrains manual text/wildcard input.
- Full timestamp spam for Created/Modified value suggestions when a calendar-date list is sufficient.
- Autocomplete that silently changes a user-entered query.
- Search results that automatically become selected mutation scope.
- Field autocomplete driven by arbitrary object keys rather than the governed searchable-column set.

Required replacement: typing `#` in OMNISEARCH invokes in-field column autocomplete; the first letter narrows matching governed fields; selecting a field produces ascending distinct-value suggestions; manual typing and wildcards override suggestion use; `class` maps to `system_classification`; `folder` maps to the parent directory of canonical `path`; Database and Grid share the same parser and semantics.


## 2026-09-21 — RELEASE B AI / DATABASE NEGATIVE RULES

The following are rejected and must not return:

- Conversation-only AI left rail as the primary object.
- Treating all Release B AI as permanently advisory when a governed Auto Tag Apply path is approved.
- Allowing AI to write tags without a reviewable proposal and explicit owner approval.
- Allowing AI to alter UNIQUE / KEEP / EXCESS.
- Allowing AI to directly edit SQLite or call arbitrary filesystem operations.
- Allowing proposed TARGET folder structures or landing plans to execute in Release B without a separately governed landing/migration engine.
- Hiding task scope/evidence revision from the owner.
- Applying a stale AI proposal without revalidation.
- Losing task state/transcript because the browser reloads or the user navigates away.
- A visible Database Path column that repeats the filename.
- Subtle dark-on-dark Database zebra striping.
- Hover/selected Database rows that are not white with black bold text.

Required replacement: task-centric AI with durable Task Cards, right-side task workspace and sticky compose; Auto Tag is proposal → review → explicit Apply through the governed metadata API; analysis tasks remain read-only; TARGET structure/landing tasks remain proposal-only in Release B; visible Database Folder excludes filename; zebra rows alternate dark grey/white with the governed text colors.


## 2026-09-21 — RELEASE B MOBILE STABILITY / AI SCOPE NEGATIVE RULES

Rejected and must not return:

- Background polling that rebuilds Database and snaps horizontal scroll left.
- Database row selection implemented by rebuilding the complete table.
- The superseded light charcoal zebra treatment (#343a40) when a darker row is required.
- Viewer-launch control to the right of a long Filename.
- Rendering the complete long filename in the Database cell when 25-character truncation is governed.
- Copying only the truncated filename.
- Separate Database and Grid search state.
- AI scope dropdowns for Entire SOT / query / explicit selection / Plan.
- AI tasks silently using a scope different from the shared OMNISEARCH.
- Periodic AI polling that repeatedly reconstructs the complete AI rail/stage and causes flicker or disrupts typing/scroll position.
- Task Cards that omit the search criteria used for their evidence scope.

Required replacement: stable Database DOM/scroll behavior; darker charcoal zebra; left-side viewer launch + 25-character filename presentation with full-name copy; one shared Database/Grid OMNISEARCH; AI scope equals current shared search, with blank search meaning Entire SOT; Task Cards persist the criteria; task-specific prompt is prefilled and editable; AI polling updates only running task state without full-surface flicker.


## 2026-09-21 — PLAN / REPORT COLUMN LAYOUT NEGATIVE RULES

Rejected and must not return:

- Plan/report tables stretched to 100% width when their content does not require it.
- Mobile-only minimum widths that create avoidable horizontal whitespace.
- Artificially wide gaps between Item / Files / Size / Percent columns.

Required replacement: content-sized compact report columns with only normal cell padding; horizontal scrolling only when the actual content requires it.


## 2026-09-21 — VOLUME DISCOVERY NEGATIVE RULES

Rejected and must not return:

- Treating `/mnt/*` enumeration as the complete set of Windows-available volumes.
- Silently hiding a Windows-visible drive because WSL has not mounted it.
- Showing an unmounted Windows drive as if it were selectable for source/target operations.
- Empty Folder Tree behavior with no explanation when a Windows drive is not mounted in WSL.
- Automatically invoking privileged mount operations from SOT.

Required replacement: merge Windows logical-drive discovery with WSL mount discovery, show unmounted Windows-visible drives explicitly as unavailable, and promote them to selectable only after WSL can actually access the mounted path.


## 2026-09-21 — LIVE WINDOWS VOLUME / MOUNT NEGATIVE RULES

Rejected and must not return:

- Treating current WSL mount state as durable truth.
- Requiring the owner to know in advance which Windows drives need static `fstab` entries.
- Showing “Not mounted in WSL” as the terminal product behavior when SOT can govern the mount itself.
- Trusting `/mnt/<letter>` directory existence as proof of a real Windows volume.
- Hiding a Windows-visible drive because the current WSL mount is absent.
- Giving the SOT server unrestricted sudo.
- Mounting to arbitrary owner-supplied paths.
- Replacing an unrelated mount at `/mnt/<letter>`.
- Accepting only `drvfs` and rejecting WSL2 Windows mounts reported as `9p`.
- Caching Windows drive inventory only at service startup.
- Tight-loop privileged remount attempts for a persistently unavailable device.
- Treating a transiently disconnected source as evidence that its historical placements should be deleted or reclassified.

Required replacement: recover the proven Turn 01 dynamic Windows discovery + narrow `sot-mount-drive` lazy-mount architecture; reconcile live Windows inventory with verified `9p`/`drvfs` mount-table state; mount/revalidate at discovery and operation boundaries; keep failures visible and non-destructive.


## 2026-09-21 — AI COMPARE-PATH NEGATIVE RULES

Rejected and must not return:

- Restricting all AI analysis to rows already indexed in the SOT Database.
- Treating identical filename stems as proof that two media files are equivalent.
- Calling an MP4 valid/legitimate solely because a corresponding AVI name exists.
- Recommending deletion of a legacy source when the converted counterpart failed media probing or materially differs in duration without explicit review.
- Hiding unmatched files from either comparison side.
- AI-initiated move/archive/trash/delete from Compare Paths / Folders in Release B.
- Transcoding or rewriting media merely to perform verification.

Required replacement: read-only Compare Paths / Folders task with deterministic enumeration, exact-name + normalized-name evidence, optional read-only ffprobe metadata, pair/unmatched reporting, evidence-oriented conversion confidence, and advisory cold-storage/soft-delete review recommendations only.


## 2026-09-22 — ESTATE PANEL 2 FOLDER SEARCH NEGATIVE RULES

Rejected and must not return:

- Making Folder Search depend on files already indexed in the SOT Database.
- Returning file paths as Panel 3 Estate roots when a `#file:` term matched; the selectable result is the containing folder path.
- Clearing search/checkbox state during routine live-volume refresh.
- Tiny per-row transfer controls that are difficult to tap.
- Requiring one-at-a-time transfer when multiple search results are checked.
- Adding overlapping parent/child roots to Panel 3.
- Treating “Move checked” as a filesystem move.
- Following symlinked directory trees during search.
- Unbounded recursive search responses.

Required replacement: read-only filesystem search beneath the active reconciled volume; `#folder:` / `#file:` / negative wildcard grammar; unique checked-by-default folder-path results; Select all / Deselect all / Move checked >; per-row large `>`; overlap-safe transfer into Selected Estate Roots.


## 2026-09-22 — CORRECTED FOLDER SEARCH + CONVERTED-FILE AI NEGATIVE RULES

The earlier inline Folder Search and A/B Compare Paths implementations are rejected.

Do not reintroduce:

- inline Folder Search result lists inside Panel 2;
- Select all / Deselect all button pairs as the primary result-selection model;
- automatic removal/collapse of registered descendant Estate roots when an ancestor is added;
- suppressing a search result merely because a related parent/child/sibling path is registered;
- treating owner-selected Estate roots as a minimal normalized root set;
- A-versus-B comparison semantics;
- temporary Path A / Path B controls;
- one-time comparison source selection that must be rebuilt for each later scan;
- name-only claims that a converted file is verified;
- AI-generated media verification without deterministic FFmpeg-suite evidence;
- destructive move/archive/trash/delete actions from converted-file comparison.

Required replacement:

- Folder Search opens a modal with top-right X;
- exact already-registered/pending paths only are excluded;
- all results initially selected;
- live `# selected ×` chip where body transfers selected paths and × deselects all;
- per-result large `>` transfer;
- explicit owner-selected Estate roots remain preserved even when overlapping;
- scan/accounting prevents duplicate content totals rather than deleting registrations;
- persistent **Compare Converted Files** task using the standard three-panel source picker;
- task-specific Comparison Sources persist and are reusable;
- comparison runs within the union of registered task sources;
- deterministic basename grouping + ffprobe + read-only ffmpeg validation precede AI interpretation;
- Refresh rescans the same persisted sources and incorporates newly added/changed files.


## 2026-09-22 — RELEASE C ARTIFACT NEGATIVE RULES

Do not overwrite, repurpose, or rename Release B files to ship the corrective Folder Search / converted-file comparison work.

Required replacement: publish the correction under the unique Release C artifact/runtime names, preserve Release B for rollback/comparison, and deploy Release C from its own runtime directory/service.


## 2026-09-22 — FOLDER SEARCH ACTIVATION REGRESSION NEGATIVE RULES

Do not reintroduce:

- Folder Search draft loss caused by routine Estate re-rendering.
- Structural volume signatures that include volatile free-space counters and therefore cause needless picker re-renders.
- Search UI with no explicit clear-X control.
- Waiting for a potentially long recursive filesystem search to complete before opening the results modal.
- Search failure paths that leave the user with no persistent visible state.

Required replacement: durable draft state, explicit clear-X, immediate Search Results modal with Searching… state, stable structural volume signature, and visible in-modal failure/result transitions.


## 2026-09-22 — FOLDER SEARCH PROGRESS NEGATIVE RULES

Do not reintroduce a Folder Search modal that only says “Searching…” with no observable progress.

Required replacement while search is running:

- visible Search root;
- visible Current path being enumerated;
- continuously increasing Elapsed timer;
- live Folders scanned count;
- live Files scanned count;
- live Matches count;
- asynchronous search status polling so large directories remain visibly active even when the current path does not change for an extended interval.


## 2026-09-22 — SOURCE READINESS / PLAN FRESHNESS NEGATIVE RULES

Do not reintroduce:

- Analyze → Sources showing only the latest job's `job_sources` rows while newly registered Estate roots disappear from the processing surface.
- Newly registered sources that have no visible PENDING / READY state.
- Requiring a full all-source rescan merely to ingest newly registered roots.
- Plan charts that look authoritative while registered sources have never been analyzed.
- Registration that silently starts expensive fingerprint work.

Required replacement: authoritative registered-source inventory in Analyze, explicit pending readiness, Analyze pending (N), incremental source-ID job start, global post-job classification refresh, and a visible Plan stale-evidence banner until all registered sources are current.


## 2026-09-22 — SOURCE FRESHNESS TRIGGER NEGATIVE RULES

Do not reintroduce:

- periodic 15/30-minute or similar background filesystem rescans for source freshness;
- treating CURRENT as “was analyzed once” when startup/volume selection detects metadata drift;
- source freshness checks that read file contents;
- parent-source stale state caused solely by files owned by a deeper explicitly registered child source;
- reanalysis that leaves missing files active in Database evidence.

Required replacement: single-user triggers only at SOT startup and owner volume selection; metadata-only signature comparison; stale→PENDING handoff; missing/new/changed placement reconciliation; successful reanalysis clears stale and advances authoritative Database/Plan evidence.


## 2026-09-23 — CONVERTED-FILE REFRESH / SOURCE-PICKER RESPONSIVENESS NEGATIVE RULES

Do not reintroduce:

- synchronous recursive comparison inventory, ffprobe, or ffmpeg work inside the Refresh HTTP request before the task is marked Running;
- browser Refresh requests that sit long enough to abort and appear inert;
- bulk Comparison Source selection that performs one persisted scope write per selected path;
- UI that waits for each scope write before showing the selected source locally.

Required replacement: immediate Running acknowledgement, background deterministic evidence construction, durable failed state on background errors, immediate local source-selection feedback, and one persisted scope update for bulk source transfer.


---

## 2026-09-23 — RELEASE D JOB-QUEUE / CONVERTED-MEDIA NEGATIVE RULES

Rejected and must not return:

- one global “latest job” as the only analysis control target;
- refusing a new analysis solely because a different job is already running;
- browser-owned or transient source selections as execution scope;
- changing an existing job when new Estate roots are selected later;
- calling an Estate picker action “Register selected” when the owner action is to launch processing;
- requiring the owner to infer progress from worker-launch events or visit Activity to discover what a job is doing;
- queue rows without current path/folder, counters, elapsed time, last-progress age and stall visibility;
- Stop-only job control with no per-job Abort + Delete / Restart lifecycle;
- comparison-source edits that persist path-by-path before the owner commits the job;
- using the Compare Converted Files chat compose button as a filesystem “Refresh” execution control;
- requiring an AI provider key merely to run deterministic converted-media verification;
- re-enumerating or re-running ffprobe/ffmpeg because the owner sends a conversational AI follow-up;
- a comparison run whose source paths cannot be reconstructed after browser reload;
- opaque converted-media execution with no current path, phase, counters, timing, running deterministic results or durable job log;
- allocating AI transcript ordinal with a read-then-insert race;
- permanently latching the SQLite writer into a failed state after one rejected statement.

Required replacement:

- durable FIFO analysis jobs with immutable persisted source/path snapshots and a backend scheduler;
- explicit **Kick off job** from Estate selection, with later selections creating later jobs;
- Analyze **Queue** with per-job status/progress/log and Abort + Delete / Restart;
- deterministic stalled-job detection from persisted last-progress timestamps;
- Comparison Sources modal with top-right × and **Go!** that atomically persists scope and enqueues the deterministic comparison job;
- Compare Converted Files right-panel job telemetry and durable event history;
- chat compose labeled **Send**, operating only on the latest completed deterministic comparison evidence;
- atomic serialized AI-turn ordinal allocation and a recoverable SQLite writer.


---

## 2026-09-23 — RELEASE D WINDOWS-VOLUME CUTOVER NEGATIVE RULES

Rejected and must not return:

- classifying a verified `/mnt/c`, `/mnt/d`, etc. Windows-backed `9p` / `drvfs` mount as `windows:false` merely because PowerShell/CIM discovery returned no rows;
- making successful Release D cutover depend on PowerShell inventory when the actual mounted Windows volume has already been independently verified;
- silently losing Windows-drive identity during a systemd-user-service launch while the same drive remains mounted and readable.

Required replacement:

- merge verified mounted-drive evidence with Windows logical-drive inventory;
- synthesize Windows drive identity from the verified mount source when PowerShell metadata is absent;
- preserve `windows:true`, `windows_drive`, availability, mount state and capacity for those verified mounts;
- mechanically qualify the PowerShell-unavailable / verified-mount-present case.


---

## 2026-09-23 — RELEASE D QUEUE-STATE NEGATIVE RULES

Rejected and must not return:

- Analyze polling that auto-closes a Job log the owner opened;
- treating disclosure state as disposable render state;
- showing historical Release C/pre-D jobs as “0 sources” solely because `job_scope_sources` did not exist when those jobs were created;
- offering Restart for a job with no recoverable persisted source scope and then surfacing a 400 error;
- modifying historical file evidence as part of scope-snapshot migration.

Required replacement:

- persist open/closed Job-log state across queue polling;
- backfill missing historical job scope metadata from durable `job_sources` + `sources` rows only;
- enable Restart only when a durable/recovered scope exists;
- leave historical evidence and job results unchanged.


---

## 2026-09-23 — RELEASE D PARALLEL QUEUE / OBSERVABILITY NEGATIVE RULES

Rejected and must not return:

- queue polling that moves the owner back to the top of Analyze;
- queue or Compare polling that closes an owner-opened disclosure;
- a nominal multi-job scheduler that serializes unrelated source scopes;
- repeated Restart taps that create duplicate queued work for sources already QUEUED/RUNNING/PAUSED/STOPPING;
- hiding source overlap so multiple legacy/restart jobs with similar counts cannot be distinguished;
- queue cards that only show aggregate counts without the frozen source roots and per-source processed/remaining state;
- a healthy large-file hash being labeled STALLED because durable progress updates only after the file completes;
- FAILED/terminal jobs consuming active scheduler capacity;
- Compare Converted Files reporting only `Verified 11` without identifying which basenames/files were actually verified;
- Compare Job logs auto-closing on poll;
- deriving comparison outcome from a new rescan when persisted deterministic evidence already exists.

Required replacement:

- persistent Analyze scroll position;
- persistent Queue Contents + Job log disclosure state and inner scroll positions;
- Start All / Pause All scheduler control;
- four-way default concurrent analysis dispatch for non-overlapping source scopes with multiple workers per job;
- source-level live-work deduplication at enqueue/Restart;
- explicit overlap/suppression reporting;
- durable hash heartbeats;
- per-source content/progress/remaining display;
- persistent Compare log disclosure and source list;
- deterministic persisted per-basename/pair outcome rendering.


---

## 2026-09-25 — RELEASE D LIFECYCLE / OMNISEARCH / COLOR-PRESET NEGATIVE RULES

Rejected and must not return: first-action irreversible removal for a Job or Source; hiding soft-deleted Jobs/Sources so they cannot be restored; removing placement/file evidence when removing job metadata or a source registration; final job-record removal while its runtime is active; duplicating a soft-deleted source instead of restoring it; always-expanded Queue/Sources rows; polling that resets disclosure choice; Omnisearch selection on pointerdown; blur-driven autocomplete closure during touch scrolling; a non-scrollable suggestion surface; one fixed Database zebra style; one fixed Database hover style; or color settings without a dedicated Colors tab.

Required replacement: visible SOFT DELETED status with Restore and an explicit final-remove action for Jobs and Sources; metadata/registration removal only, with evidence and historical snapshots preserved; persistent chevron disclosure cards; click activation plus touch-pan autocomplete; General and Colors config tabs; persisted app, zebra, and hover presets with current styling as the default.


---

## 2026-09-25 — RELEASE D STATUS-GROUP HIERARCHY NEGATIVE RULES

Rejected and must not return:

- one flat Queue containing all Job cards regardless of status;
- one flat Sources list containing all Source cards regardless of status;
- replacing individual Job/Source chevrons with status grouping instead of nesting them;
- grouping by status without preserving the owner's open/closed group choices across polling;
- hiding exact Job/Source status inside a broad group label;
- separate frontend-only stall timing that can disagree with the scheduler's configured stall threshold;
- completed or soft-deleted history expanded by default and consuming the working view.

Required replacement: fixed outer groups Running, Stalled, Error, Completed and Soft Deleted; persistent group chevrons; each Job/Source remains independently collapsible inside its group; exact inner status remains visible; Running/Stalled/Error default open while Completed/Soft Deleted default closed; Source Stalled grouping uses scheduler stall_seconds telemetry.


---

## 2026-09-25 — RELEASE D SIMPLIFIED ANALYZE GROUPING NEGATIVE RULES

Rejected and must not return:

- separate outer **Stalled** and **Error** groups;
- different group taxonomies between Queue and Sources;
- Source classification as Stalled solely because its last progress timestamp is old;
- exact/raw job state used as the primary badge when it disagrees with the outer canonical group;
- Restart or other job execution controls on the Sources surface;
- Completed jobs with errors shown as healthy Completed;
- a long list ordered before the items requiring owner attention.

Required replacement:

- identical four-group order on Queue and Sources: **Action Needed → Running → Completed → Soft Deleted**;
- Action Needed combines stalled/error/interrupted/aborted/stopped failure conditions;
- Queue owns all job execution/restart controls;
- Sources is a catalog of processing outcome/currentness plus source-registration lifecycle;
- canonical group label is the visible badge on both Job and Source cards;
- raw Job/Source states remain diagnostic detail only;
- Action Needed and Running default open; Completed and Soft Deleted default closed.


---

## 2026-09-26 — RELEASE D ANALYZE POLISH NEGATIVE RULES

Rejected and must not return:

- red outline on the entire Queue Action Needed group;
- red outline on every Action Needed Job card regardless of whether that card is open/active;
- readiness text telling the owner to launch work for sources already covered by live Queue jobs;
- “N active” in the Sources catalog header;
- Source status derived only from a historical last-job state when current live Queue scope is available;
- Restart or other job-execution controls rendered by Source cards;
- duplicate restart-parent text in a collapsed Job subtitle;
- a canonical Job badge that can be pushed offscreen by the subtitle on mobile;
- a zero-count default-open status group with a large empty body;
- two-line Queue telemetry that wastes mobile vertical space;
- Source detail centered on worker/job mechanics instead of source outcome/currentness/errors.

Required replacement:

- neutral Queue Action Needed group outline; red border only on the open/active Job card inside that group;
- readiness computed against live job source scopes;
- **N registered** source header;
- Sources grouped by live coverage plus source processing outcome;
- Queue-only job controls;
- compact restart subtitle and compact one-line Queue telemetry;
- zero-count groups collapsed;
- right-pinned canonical badge;
- outcome-first Source details with successful analysis and error information.
