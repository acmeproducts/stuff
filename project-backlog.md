# SOT — CURRENT CANONICAL PLAN

**Repository:** `acmeproducts/stuff`
**Single planning authority:** this file only (`project-backlog.md`)
**Status:** CLEAN REBUILD INSTALLED · OBSERVABILITY AND WORKER-LIFECYCLE CORRECTION AUTHORIZED
**Owner ruling:** 2026-08-23

All earlier SOT plans, additive backend overlays, hotfixes, recovery installers, and historical database fixtures are non-authoritative. Git history is sufficient history. No implementation may reconstruct the next release by concatenating those layers.

## 1. Owner ruling

Replace the accumulated SOT backend and its historical live database with one clean implementation built from an empty database.

The clean installer is intentionally destructive within the SOT application state only:

- replace the active SOT API and SOT HTML surfaces;
- delete the live SOT SQLite database and its WAL/SHM sidecars;
- create a new database from the authoritative migration set;
- do not import, bridge, infer, or preserve historical project/corpus rows;
- never delete source, Target, or Backup file content.

There is no rollback to the old SOT database. Candidate code and a fresh temporary database must pass all gates before destructive cutover begins.

## 2. Database contract

The database is created and evolved only by checked-in scripts.

- `sot-db-manage.js create <database>` creates an empty database and applies every ordered migration.
- `sot-db-manage.js migrate <database>` applies only unapplied migrations, in order.
- `sot-db-manage.js status <database>` verifies integrity, migration versions, and migration checksums.
- `sot-db/migrations/NNN-name.sql` is the only place schema DDL may be added, changed, or removed.
- Every applied migration is recorded with its version, name, SHA-256 checksum, and application time.
- A changed checksum for an already-applied migration is a hard error. Published migrations are immutable.
- The API never runs `CREATE TABLE`, `ALTER TABLE`, `DROP`, or opportunistic additive probes at startup or request time.
- Application data mutations use explicit transactions in the backend; schema mutations use migrations only.

This eliminates duplicate-column probes, request-time migration work, ambiguous schema state, and patch-order dependencies.

## 3. Product workflow

The application is one linear workflow:

`PROJECT → PROCESS → REVIEW → EXECUTE → CERTIFY`

Project owns source-scope definition. Sources and plan generation are internal capabilities, not separate primary destinations.

### Project surface

- Top ribbon: `SOT` with version/build, one prominent omnisearch, and an icon-only Admin gear.
- Project ribbon: icon-only Add Project and Delete Selected Project actions.
- The project table is the primary Project surface. Its initial columns are Name, Size, Folder Count, Top Level Item Count, and Last Updated.
- Project name is editable inline and saves on Enter or blur without changing the immutable project token.
- Size/count/update values are populated from durable processed observations; blank values mean that the scope has not yet been processed.
- Every project row owns one Play/Pause toggle and one Stop control. Play starts or resumes indexing, Pause requests a recoverable pause, and Stop ends the current run without discarding fingerprints already completed.
- Every row exposes its current run state and phase plus live files, folders, discovered bytes, processed bytes, reuse count, errors, and last activity. These counters update without opening the project.
- Every active row exposes a determinate progress bar when totals are known, its active worker count, and the current file path owned by every non-idle fingerprint worker. A run may never appear idle merely because its first hash batch has not committed.
- Each row has direct access to that project's durable activity history. The Project surface also has direct access to the SOT-wide activity history.

### Add/Edit Project modal

Project creation and scope editing use the established three-column interaction:

1. actual available volumes/roots;
2. a navigable folder explorer for the selected volume/path;
3. paths currently staged in the Project.

Selecting the current volume root or any parent folder adds that path once and includes all descendants recursively during Processing. The operator is never required to add every child folder. `$RECYCLE.BIN` is never selectable. Saving creates or updates the named project and its complete path membership atomically, then returns to the Project surface ready to proceed to Processing.

Rules:

- exactly one primary forward action per step;
- one Back action moves exactly one step back where reversal is valid;
- no free jumping ahead;
- changing project scope invalidates downstream evidence, plans, and certifications;
- Project setup performs no corpus scan and must be effectively immediate;
- long-running processing and execution are asynchronous and expose current path/file, counters, warnings, errors, throughput, and state;
- indexing/fingerprinting runs outside the HTTP/UI process, so no scan may starve navigation, search, review, planning, execution, administration, or status requests;
- separate projects may index concurrently; a project may have only one active indexing run at a time;
- indexing one project never blocks review, planning, execution, or certification work on another project whose own evidence gates are satisfied;
- row controls are independent: pausing or stopping one project never affects another project or the HTTP/UI process;
- Admin is operational support, not a competing workflow;
- source material is never deleted by SOT.

## 4. Core evidence model

The initial schema owns these first-class entities:

- Projects and project source membership;
- processing runs and current worker state;
- immutable file observations and current-observation pointers;
- authoritative SHA-256 content identity;
- verified Target holdings;
- verified Backup holdings;
- immutable plans and plan items;
- execution actions;
- certifications;
- audit events and system settings.

Core evidence fields include normalized path, relative path, filename, size, modified time, SHA-256, observed time, path hash, and observation hash. Target and Backup holdings are keyed by authoritative SHA-256.

## 5. Source preflight

Every source receives one of:

- `ready`
- `not_mounted`
- `missing`
- `unreadable`
- `ignored_recycle_bin`

New `$RECYCLE.BIN` selections are rejected. Any such row encountered at runtime is warning-only and skipped. A `/mnt/<letter>` directory is ready only when `findmnt` proves the Windows drive is actually mounted; an empty mount-point directory is not sufficient.

Processing cannot start while a non-ignored source is blocking.

## 6. Processing and deterministic intelligence

Processing performs:

1. source preflight;
2. recursive enumeration with `$RECYCLE.BIN` skipped;
3. metadata reuse when the current observation is unchanged;
4. SHA-256 hashing only for new or changed files;
5. durable observation/content persistence;
6. downstream invalidation when current evidence changes.

Progress is durable and queryable while work is running. Folder, project, and SOT rollups expose accumulating folders, files, bytes, processed bytes, reusable hashes, computed hashes, active jobs, and errors. The SOT rollup also reports exact corpus-wide duplicate groups, duplicate copies, and duplicate bytes from distinct current physical paths.

Observability is part of correctness, not optional presentation:

- the SOT ribbon reports active projects, active workers, phase counts, discovered/processed files and bytes, discovered folders, reused/computed hashes, errors, and stable corpus duplicate totals;
- each project row reports the same project-scoped counters, progress percentage, active worker count, and live worker paths;
- the Processing surface reports every live worker path, folder-level discovery/processing counters, and the project's recent durable activity;
- SOT-wide and project-scoped activity APIs return ordered durable events with project name, event type, timestamp, and structured detail;
- activity is visible from the Project ribbon, each project row, and Administration;
- durable events cover worker launch, worker start, phase changes, periodic discovery progress, periodic fingerprint progress, pause, resume, stop, completion, error, and worker exit;
- progress events are rate-limited and transactional so logging cannot become a throughput bottleneck;
- worker standard error and exit code/signal are captured with a bounded size. An unexpected worker exit atomically changes an active run and its project to `Error`, clears its worker ownership, and records the failure. No exited worker may leave a durable run stranded at `Queued` or `WIP`.

Fingerprint reuse is global, not confined to one project. When an already-observed normalized file path has the same size and modified time, its authoritative SHA-256 is reused across project membership and later runs. Content identity and verified Target/Backup holdings also remain global, so SOT never repeats hashing, copying, or verification work merely because the same path or content participates in another project.

Pause and Stop are durable requests. A pause leaves the run resumable. A stop closes the run as operator-stopped; starting again creates a new run that reuses every completed global path fingerprint from the stopped run. Both requests interrupt an in-flight hash promptly and never delete source content or completed fingerprint evidence.

Review reports at minimum current file/byte totals, unique content, exact duplicates, changed paths, Target coverage, Backup coverage, required Target bytes, required Backup bytes, warnings, and blocking conditions.

## 7. Plan, execute, certify

Plans are immutable snapshots tied to the project's evidence revision.

For each authoritative content object, a plan deterministically chooses:

- no action when verified Target and Backup holdings exist;
- establish Target then Backup when Target is absent;
- establish Backup when Target exists but Backup is absent.

Execution uses content-addressed destinations, copies to a temporary file, verifies SHA-256, and atomically promotes the verified file. It records every action. It never deletes a source.

Certification succeeds only when every current content object has verified Target and Backup holdings, there are no blocking source states, and the plan/evidence revision is current.

## 8. Runtime topology

Keep the existing production topology:

- `openclaw-report-server.service`
- `session-server.js`
- port `18080`
- SOT API under `/api/sot/*` and the existing public `/report` routing
- live application state under `~/.openclaw/sot/`

Do not introduce another service, port, proxy, or Tailscale change.

Indexing and execution workers are child processes owned by `openclaw-report-server.service`; they do not listen on another port. SQLite remains in WAL mode and every worker commits bounded transactions so read/status traffic continues during background work.

## 9. Required acceptance gate

Before publication, a test must create a brand-new database and prove:

1. Project create, recall, rename, and note edit.
2. Source add and `ready` preflight.
3. Processing of a tiny fixture containing two unique files, one exact duplicate, and one nested path.
4. Exact expected review counts and duplicate intelligence.
5. Deterministic plan generation.
6. Target copy and SHA-256 verification.
7. Backup copy and SHA-256 verification.
8. Certification only after Target and Backup verification.
9. A source mutation creates new evidence, invalidates downstream state, and generates the expected new plan.
10. Migration status and SQLite integrity are clean.
11. API module load and ordinary requests emit no schema or duplicate-column errors.
12. Two project indexing runs can overlap while health, project list, SOT rollup, review, and plan requests remain responsive.
13. A second project reuses an unchanged path fingerprint instead of hashing that file again.
14. Folder, project, and SOT progress counters advance durably while indexing is active, including SOT duplicate totals after completion.
15. Project-row Play/Pause affects only that project, resumes successfully, and keeps status traffic responsive.
16. Project-row Stop closes only that run, preserves completed global fingerprints, and a later Play starts a clean run that reuses them.
17. The project table updates state, phase, files, folders, bytes, reuse, errors, and last activity while work runs.
18. The SOT ribbon, project row, Processing surface, and activity APIs expose live worker count and current file paths before the first hash batch commits.
19. Durable activity records worker lifecycle, phase transitions, rate-limited discovery/fingerprint progress, operator controls, completion, and errors in chronological order.
20. Killing an indexing child process produces a bounded worker-exit event and changes the active run/project to `Error`; it cannot remain `Queued` or `WIP`.
21. The Project ribbon, every project row, and Administration open a live SOT-wide or project-scoped activity log without blocking indexing.

The historical clean-cut installer could wipe the old SOT database only after its empty-database acceptance test. Every later updater must migrate the installed database in place and preserve all project/corpus rows.
