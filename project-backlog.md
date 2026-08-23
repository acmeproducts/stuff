# SOT — CURRENT CANONICAL PLAN

**Repository:** `acmeproducts/stuff`  
**Single planning authority:** this file only (`project-backlog.md`)  
**Status:** STABILIZATION BEFORE FURTHER WORKFLOW UI DEVELOPMENT  
**Last governance update:** 2026-08-23

All other SOT plan/design documents are historical reference only unless this file explicitly incorporates them. Do not create another competing plan document.

## 1. Current owner ruling

The current TURN01/R2 wizard is **not an accepted baseline**. The concept of a linear wizard remains correct, but development must stop treating the current live corpus/database as a trustworthy development fixture until its state is inspected and snapshotted.

The immediate priority is not more UI. It is to establish a deterministic, inspectable test environment and prove the end-to-end data path.

## 2. Product workflow that remains authoritative

The application is one linear workflow:

`PROJECT → SOURCES → PROCESS → REVIEW → PLAN → EXECUTE → CERTIFY`

Rules:

- exactly one primary forward action per step;
- Step 2+ has one Back action that moves exactly one step back;
- no free jumping ahead;
- later-step state is invalidated when upstream scope/evidence changes;
- implementation details such as manifests, fingerprints, workers, and DB tables do not become competing product surfaces;
- Admin is operational support, not part of the project workflow.

## 3. Stabilization gate — must happen before another wizard release

### 3.1 Database truth first

Add DB Admin that can:

- show database path, size, modification time, integrity result, journal mode, and per-table row counts;
- create a consistent SQLite backup;
- create a SQL dump;
- list previous backups/dumps;
- do this without changing project/workflow state.

Before any schema cleanup or corpus reset, create both a SQLite backup and SQL dump of the current live DB.

### 3.2 Do not develop against an ambiguous historical corpus

The current DB has been used by multiple successive application models. Preserve it, inspect it, and then create a clean test corpus for end-to-end development.

The historical DB is evidence to retain, not the default fixture for proving the new workflow.

### 3.3 Source preflight before processing

Before a project is allowed to process, every source must receive a fast preflight result:

- `ready`
- `not_mounted`
- `missing`
- `unreadable`
- `ignored_recycle_bin`

A selected Windows/WSL drive path under `/mnt/<letter>` is not ready merely because an empty mount directory exists. The actual drive mount must be confirmed.

Processing must never begin against an unmounted source and then hang.

### 3.4 `$RECYCLE.BIN` policy correction

New source selection continues to reject `$RECYCLE.BIN` as a source.

Historical database rows containing `$RECYCLE.BIN` are **not fatal**. They are reported as a warning and skipped. They must not block an otherwise valid project or stop enumeration.

The previous 6.9.1 negative gate that treated `$RECYCLE.BIN` as an invalid path remains useful for preventing new additions, but it is not the runtime policy for legacy rows.

## 4. Clean end-to-end test fixture

After DB backup/dump and preflight controls exist, create a small deterministic fixture source under WSL-local storage so mount state cannot interfere with the test.

Fixture should contain a small known set such as:

- unique file A;
- unique file B;
- exact duplicate of A at a different path;
- one nested directory;
- one later mutation case where B changes.

The fixture must be small enough to process in seconds.

## 5. End-to-end acceptance test sequence

Run the new workflow against the clean fixture and prove each transition with API/data assertions before relying on UI behavior.

1. **Project** — create project; recall it; rename/edit note.
2. **Sources** — add fixture source; source preflight = ready.
3. **Process** — enumerate/fingerprint fixture; job completes; no hang.
4. **Review** — exact expected file count, unique fingerprint count, duplicate group, bytes, and current observations are visible.
5. **Plan** — deterministic plan derives only from current evidence.
6. **Execute** — record/perform Target establishment for the fixture and verify fingerprints.
7. **Backup** — record/perform Backup establishment and verify fingerprints.
8. **Certify** — project/source becomes certifiable only after required Target + Backup evidence exists.
9. Mutate B and rerun; changed observation must invalidate stale downstream state and produce the expected new plan.

No owner-test wizard release is offered until this fixture passes end to end.

## 6. Performance rule

Step 1 and Step 2 must be effectively immediate and must not scan the corpus.

Heavy intelligence is calculated only when the active workflow step requires it. One request must not repeatedly recalculate the same project intelligence/plan for every gate.

Long-running work is asynchronous and exposes current source/path/file, counters, warnings, and state.

## 7. Data model rule

Core evidence remains path/content based:

- normalized path
- filename
- size
- modified time
- authoritative file fingerprint
- observed time
- path hash
- observation hash

Device identity is not a prerequisite for the core corpus model.

Target and Backup state are keyed by authoritative file fingerprint.

## 8. Runtime/topology locks

Keep the existing production topology:

- `openclaw-report-server.service`
- `session-server.js`
- port `18080`
- SOT API under existing `/api/sot/*` / `/report/api/sot/*`
- live DB under `~/.openclaw/sot/`

Do not introduce another server, port, proxy, FastAPI/Uvicorn service, or Tailscale topology change.

SOT never deletes source material during execution.

## 9. Immediate implementation order

1. DB Admin status + SQLite backup + SQL dump + snapshot list.
2. Project source preflight with real mount detection.
3. Legacy `$RECYCLE.BIN` warning/skip behavior.
4. Snapshot current live DB.
5. Build clean tiny fixture corpus.
6. Run API-level end-to-end fixture test.
7. Fix backend/state defects discovered by that fixture.
8. Only then rebuild the wizard UI against the proven workflow API.

## 10. Current owner gate

Do not call any release a baseline until:

- current DB is backed up and inspectable;
- source preflight prevents unmounted-volume hangs;
- legacy `$RECYCLE.BIN` cannot block a run;
- the clean fixture passes Project → Sources → Process → Review → Plan → Execute → Certify;
- Step 1/2 are responsive;
- project selection and project creation are proven functional from both API and UI.
