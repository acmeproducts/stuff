# SOT Turn 02 Pre-Base Plan

**Stage:** `pre-base`  
**Status:** VOLUME-FIRST SERVICE REBUILD  
**Date:** 2026-09-13

## Governing correction

The first Turn 02 shell is rejected evidence only. Clearing mutable data was acceptable; reducing SOT to a browser shell was not.

**Keep the engine. Simplify the control surface.**

SOT is a persistent Node service with SQLite durable state. The browser is an API client. Closing the browser must not stop indexing, hashing, verification, or other server-side work. Python may be used for build and qualification only, not as the deployed application engine.

## Backend lineage

Restore the previously qualified volume-aware Base-22 lineage from pinned clean sources:

- `9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js`
- `1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py`
- `1abfeef83cc1f4da25de09e297361beb5320d516/generate-SOT-turn01-base22.py`

This provides Windows-native volume discovery and browsing, Source/Target/Backup storage assignment, persistent Node API service, background fingerprint processing, bounded hash workers, scheduler status, rollups, and SQLite state.

Turn 02 uses a fresh schema-4 database because that is the explicit contract of this qualified engine. No prior owner data is carried forward.

## Owner-facing surfaces

### Storage
- Show discovered Windows/WSL volumes with capacity and availability.
- Browse folders from a selected volume.
- Assign one or more Source folders.
- Assign Target and Backup folders.
- Persist configuration in the service.
- One hidden internal SSOT workspace record is allowed; Project is not an owner-facing abstraction.

### SSOT
- Show indexed files and bytes.
- Show unique fingerprints/content objects.
- Show duplicate counts and reclaimable bytes when available.
- Show current Source/Target/Backup placement truth.

### Work
- Start or re-index.
- Pause, resume, and stop.
- Show current phase/state and file/byte progress.
- Show worker-pool size and active workers.
- Work continues independently of the browser.

## Concurrency and UI rules

- The server owns concurrency through its bounded worker pool.
- The browser never emulates parallelism.
- Progress refresh updates status nodes only; it must not reconstruct active controls, pickers, inputs, navigation, or scroll state.
- Mobile touch targets are at least 44px and the folder picker is volume-first.

## Exclusions for pre-base

No owner-facing Projects, no seven-step wizard, no tags, no AI, no browser-owned processing, and no alternate runtime architecture.

## Mandatory release gates

### Developer
- Compose the pinned volume-aware Node backend from clean source lineage.
- Backend and UI JavaScript parse.
- Fresh schema-4 DB has integrity `ok` and zero owner/work rows.
- Volume inventory, scheduler, rollup, and worker-pool contracts are present.

### Manager
- Storage / SSOT / Work only.
- Volumes and Source/Target/Backup roles are obvious.
- Persistent service and worker status are visible.
- No owner-facing Project abstraction.

### Red team
- Archive current DB/backend/UI before cutover.
- Fresh DB contains no carried-forward owner data.
- Runtime is the persistent Node service using SQLite.
- Volume discovery is live.
- Status polling cannot replace active interaction DOM.
- Public byte identity and rollback are verified before owner test.

## Progression

`volume/storage setup → background indexing → SSOT truth → protection/copy actions`
