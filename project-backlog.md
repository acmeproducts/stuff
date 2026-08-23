# SOT — CURRENT CANONICAL PLAN

**Repository:** `acmeproducts/stuff`
**Single planning authority:** this file only (`project-backlog.md`)
**Status:** CLEAN REBUILD AUTHORIZED
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

`PROJECT → SOURCES → PROCESS → REVIEW → PLAN → EXECUTE → CERTIFY`

Rules:

- exactly one primary forward action per step;
- one Back action moves exactly one step back where reversal is valid;
- no free jumping ahead;
- changing project scope invalidates downstream evidence, plans, and certifications;
- Step 1 and Step 2 perform no corpus scans and must be effectively immediate;
- long-running processing and execution are asynchronous and expose current path/file, counters, warnings, errors, throughput, and state;
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

The installer may wipe the live SOT database only after this empty-database acceptance test passes locally on the candidate artifacts.
