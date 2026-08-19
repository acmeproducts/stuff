# SOT 6.8 — Multi-project scheduler, durable inventory reporting, and file explorer

Status: implementation candidate / owner gate required
Build: `2026.08.19.6.8-wsl-multiproject-reporting`

## Owner direction incorporated

1. Fingerprinting progress must stop mixing completed inventory folders with fingerprint completion.
2. Primary fingerprint progress is bytes processed / total bytes. File count is secondary.
3. Multiple projects may run concurrently, but worker count is global rather than multiplied per project.
4. Durable per-file inventory is the reporting source. Reporting does not reread source disks simply to display results.
5. Reporting uses a persistent Project -> Folder -> File information architecture.
6. `repolist.html` remains unchanged and is the interaction donor for dense file tables: omni-search, sortable columns, draggable column order, resizable columns, compact rows and horizontal overflow.

## Processing architecture

A single global pool of four workers is shared across all WIP projects.

```text
Global worker pool (4)
    -> Project A queue
    -> Project B queue
    -> Project C queue
    -> Project D queue
```

Workers rotate fairly between WIP projects. A project no longer implicitly owns four independent workers. This prevents four projects from becoming sixteen readers/hashers.

The scheduler is durable in SQLite (`mp_queue`). A project queue records `run_id`, `state`, `phase`, timestamps and error state. Existing durable `fingerprint_dirs`, `fingerprint_inventory`, `runs`, `manifests`, `projects`, and `sources` remain authoritative.

## Phase model

```text
Inventory
  enumerate source folders
  persist every file path + size + modified_at
        ↓
Fingerprinting
  hash pending files from persisted inventory
  reuse prior hash when size + modified_at are unchanged
        ↓
Complete
  finalize source fingerprints and project state
```

Progress UI must display these dimensions separately:

- Inventory: folders complete / total folders.
- Fingerprinting bytes: bytes hashed / total bytes — primary percentage.
- Fingerprinting files: processed files / total files — secondary count.
- Throughput: bytes per second.
- ETA: remaining bytes / observed throughput.
- Errors: file and folder errors separately.

## Durable inventory fields

The existing `fingerprint_inventory` record remains the run-level durable inventory and must expose at minimum:

- project token
- run ID
- source ID
- relative path
- full path
- filename (derived)
- folder (derived)
- size bytes
- modified timestamp
- fingerprint/hash
- fingerprint status
- error
- discovered timestamp
- hashed timestamp

`manifests` remains the durable successful fingerprint result set.

## Reporting UX

Reporting becomes three persistent logical panels:

```text
PROJECTS          FOLDERS                   FILES
Search projects   Search folders            Omni-search
project list      folder summary cards      dense table
                                           Filename
                                           Size
                                           Modified
                                           Relative path
                                           SHA-256
                                           Status
```

Selecting a project populates its inventoried folders. Selecting a folder populates file detail from SQLite without rescanning the source volume.

Folder summaries show:

- folder name/path
- file count
- total bytes
- newest modified timestamp
- number fingerprinted
- errors when present

The file table inherits the approved interaction model from `repolist.html`:

- sortable headers
- click again reverses sort
- drag columns to reorder
- resize columns
- persisted column order/widths
- horizontal overflow instead of destructive compression
- omni-search across filename, path, hash and status

## API additions

- `GET /api/sot/scheduler/status`
- existing fingerprint start/restart/continue/pause routes are intercepted by the global scheduler
- existing per-project fingerprint status route returns global-scheduler progress semantics
- `GET /api/sot/projects/:project/inventory/folders`
- `GET /api/sot/projects/:project/inventory/files?folder=&q=&sort=&dir=&limit=&offset=`

## Release invariants

- Existing `openclaw-report-server.service` on port 18080 remains the only SOT server.
- No FastAPI/Uvicorn helper.
- No 8081/8082.
- No proxy or Tailscale topology changes.
- `repolist.html` is not modified.
- 6.8 is reconstructed from the verified 6.6 pair plus reviewed 6.7/6.7.1/6.7.3 deltas and the 6.8 delta; failed 6.7.4 is not a baseline.
- Candidate backend and extracted UI scripts must pass Node syntax checks before replacement.
- DB integrity and exact health build are release gates.
- Owner/device gate remains final.
