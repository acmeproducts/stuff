# SOT v0.4.1 — Build 6.7 Parallel Indexing Requirements

Status: LOCKED owner requirements from 2026-08-18 review of build 6.6.

Build 6.6 remains a recovery candidate, not an accepted baseline. Do not reinitialize or delete the authoritative SQLite database until the parallel indexing/fingerprinting implementation is working and the owner explicitly authorizes reinitialization.

## 1. Project Setup is shallow folder discovery only

Project Setup is for selecting source folders, not recursively indexing the volume.

For a volume/root scope:
- enumerate immediate child folders only;
- ignore files located directly in the volume/root;
- do not recursively read every file merely to populate Project Setup;
- folder rows may initially show unknown size/file counts;
- selection/search/sort remain available;
- source staging and project definition persist rather than depending on transient page memory.

This reverses build 6.6 behavior that recursively scanned every folder during Project Setup.

### Deferred backlog item — Discovery Mode

Add a future optional **Discovery Mode** that can pre-index an entire authorized root/volume in advance and cache its folder/file metadata for later projects. This is explicitly deferred and must not be implemented as part of 6.7.

## 2. Explicit Indexing phase before Fingerprinting

Fingerprinting workspace owns two substantive work phases:

1. **Indexing** — recursively enumerate selected source folders and persist file metadata/work inventory.
2. **Fingerprinting** — SHA-256 each readable indexed file.

Indexing establishes the exact denominator used by fingerprinting. Project Setup does not.

## 3. Four-worker execution

Both phases use a fixed worker pool of four workers.

### Browser adapter
- four Blob-backed Web Workers for indexing;
- four Blob-backed Web Workers for fingerprinting;
- worker code is created from Blob URLs so heavy traversal/hash work does not block the main UI thread where browser filesystem APIs permit worker access;
- if a browser API cannot transfer a filesystem handle to a worker, the adapter must report the limitation and use the closest non-blocking worker-safe mechanism rather than pretending four workers are active.

### WSL adapter
- four concurrent backend workers for indexing;
- four concurrent backend workers for fingerprinting;
- no new web service or port;
- existing `session-server.js` on port 18080 remains the only report/API server.

At the start of each phase show one toast only:
- `4 workers running for indexing`
- `4 workers running for fingerprinting`

The toast remains informational; it does not replace durable progress telemetry.

## 4. Running work display — seven columns

Remove the decorative back-and-forth indeterminate progress bar.

During Indexing and Fingerprinting show the running/completed folder work table with exactly these operator-facing columns:

`Folder Name | Item Name | Size Cumulative | # Files Cumulative | Start | End | Cumulative Minutes`

Rules:
- each active worker updates the folder/item it is currently processing;
- cumulative size and file count increase while work proceeds;
- Start is recorded when that folder begins work;
- End remains blank while active and is populated when the folder completes;
- Cumulative Minutes is elapsed minutes for that folder while active and final duration after completion;
- when one folder finishes, the worker immediately takes the next queued folder;
- completed rows remain inspectable for the run.

## 5. Project totals

Display persistent project totals for the current indexing/fingerprint run:

`Folders: N | Files: N | Size: X | Index Minutes: Y`

After fingerprinting begins, retain indexing totals and additionally expose real fingerprint processed/total progress, elapsed time, throughput, errors, and ETA where mathematically valid.

## 6. Durable checkpoints and controls

Controls remain:
- Start
- Pause
- Continue
- Stop
- Restart

Indexing and fingerprinting queues must be persisted in SQLite. Pause/Stop/Continue must survive browser refresh and report-server restart. Continue resumes the same run; Restart is the only action that intentionally discards/rebuilds the active work queue.

A pre-6.6 run that has no durable `fingerprint_inventory` / folder queue is not continuable. UI must state this clearly and offer Restart rather than showing a misleading Continue path.

## 7. Project persistence

Project Setup draft/project state must not disappear because the page is refreshed or because the operator switches routes.

WSL:
- persisted in SQLite;
- created projects appear in the WSL database administration view immediately.

Browser/GitHub Pages:
- persisted in IndexedDB;
- browser IndexedDB is a separate authority from WSL SQLite unless an explicit import/reconcile action is performed;
- do not imply that a browser-created project automatically appears in WSL SQLite.

## 8. Volume enumeration

WSL Source Drives must reliably expose real Windows/WSL volumes available to WSL, including D: and F: when they exist.

Enumeration should combine:
- mounted `/mnt/<letter>` paths;
- actual Windows logical-volume discovery where available;
- accessibility state.

Do not silently omit a known Windows volume merely because its `/mnt/<letter>` mount is temporarily inaccessible. Show it as unavailable/needs mount and log the condition instead.

## 9. SQLite ENOBUFS hardening

The `spawnSync sqlite3 ENOBUFS` failure is a defect.

Requirements:
- SQLite subprocess output buffers must be explicitly sized for realistic diagnostic/database result sets;
- log endpoints must paginate/limit at SQL level;
- no request may attempt to serialize an unbounded table into one subprocess buffer;
- Configuration log loading failure must be logged without taking down SOT or other report pages.

## 10. Database reinitialization

Do not reinitialize yet.

After 6.7 parallel indexing/fingerprinting passes its owner gate, perform a controlled database reinitialization/migration decision with backup first. The owner will explicitly authorize the reset.

## 11. 6.7 owner gate

The build is not acceptable until:
- Project Setup opens a volume by enumerating immediate folders only and ignores root files;
- Project Setup no longer recursively scans every file;
- D: and F: are present when Windows reports they exist, with accessibility state if needed;
- project/draft state persists across refresh;
- Indexing starts with four workers and shows the required seven-column running table;
- project totals show Folders / Files / Size / Index Minutes;
- Fingerprinting starts four workers after indexing establishes the denominator;
- Pause/Continue retains the same durable run and work queues;
- Restart intentionally starts a new run;
- unreadable files become warnings/errors without stopping the entire project;
- Configuration logs load without ENOBUFS;
- no new service/port is introduced;
- shared `/report/` pages remain healthy throughout deployment and rollback testing.
