# SOT Project Governance, Release Plan, Backlog & Graveyard

**Repository:** `acmeproducts/stuff`  
**Canonical application artifact:** `project.html` — one self-contained HTML file with inline CSS/JS  
**Canonical planning/governance document:** `project-backlog.md`  
**Production server mode:** existing `session-server.js` on port 18080  
**Browser/mobile mode:** GitHub Pages or equivalent static HTTPS host with browser-local IndexedDB authority  
**Last governance update:** 2026-08-12

This is the one current SOT control document. It owns the accepted product model, release plan, gates, open items, backlog, deployment problems, and graveyard.

---

# 0. GOVERNANCE

## 0.1 Authority order

1. Current owner ruling.
2. Graveyard vetoes below.
3. Locked release scope.
4. Current product rules/backlog.
5. Older PRDs/history.

## 0.2 Architecture invariants

- `project.html` remains the one browser application artifact.
- There are **two valid execution modes**, not a preview/production hierarchy:
  - **Browser/mobile mode:** GitHub Pages or another static HTTPS host. The authoritative project database is persistent browser IndexedDB on that device/browser profile.
  - **WSL mode:** existing `session-server.js` on port 18080 with configurable SQLite SOT DB.
- A project may be created, operated, completed, administered, and reported entirely in browser/mobile mode. **Migration to WSL is optional.**
- WSL exists because attached drives/server-visible filesystems can be processed more efficiently and with broader filesystem access, not because it is required for project authority.
- Browser `localStorage` is UI-preferences only. **IndexedDB is allowed and required as the authoritative browser/mobile project store.**
- No FastAPI/Uvicorn/file_browser.py/8081/8082 parallel service.
- No SOT release changes Tailscale routing, server topology, or OpenClaw Gateway 18789.
- Browser mode never claims WSL drives are reachable.
- WSL mode uses the existing `/report/api/sot/*` public mount.
- Configuration must create/initialize the selected authority if it does not exist.
- Both modes preserve the same logical schema/identity model so later export/import or migration can be built without changing project semantics.

## 0.3 Locked navigation

1. **Configuration**
2. **Project Setup**
3. **Project Operations**
4. **Database Administration**
5. **SOT Build & Promotion**
6. **Reporting**

Dedup/Analysis remains integrated into Project Operations rather than a separate navigation item.

### Global hamburger

- Permanently fixed top-left.
- Same location/function across breakpoints.
- Expanded/collapsed state persists.
- Expanded/collapsed navigation must remain readable.

---

# 1. ACCEPTED PRODUCT MODEL

## 1.1 Configuration

Configuration is always first.

### Browser/mobile mode

- **Save & validate is enabled.**
- The authoritative browser SOT DB is IndexedDB and is **created automatically if missing**.
- Configuration shows the logical database identity (`IndexedDB://...`) and a backup/export folder selector where browser permissions allow it.
- Integrity validation proves the IndexedDB database can be opened/read/written.
- Browser/mobile mode is a complete host, not a preview.

### WSL mode

- Configure `sot_database_path`.
- Configure backup directory/path.
- **Save & validate creates the SQLite DB if it does not exist.**
- Validate/open existing DB.
- Integrity check.
- Inline folder browser for selecting paths.
- No new server/service/port.

## 1.2 Project Setup — flattened one-surface definition

Project Setup / Project Definition / Add Locations are one surface.

Top row:

- Project Name
- Project Note / Description

No status selector; new project defaults Active and Pending.

Below is the inline three-stage source builder.

### Panel 1 — Source Drives

- Navigation only.
- Panel-local hamburger collapses/expands this panel and persists.
- Browser/mobile: This device opens browser-authorized folder selection.
- WSL: server-visible volumes are shown from the real filesystem API.

### Panel 2 — Source(s)

- Headings stay above rows.
- Selected drive/root appears as a selectable row.
- Check root + Add = stage whole root.
- Click root = browse folders.
- Folder checkboxes support one or many folders.
- Click folder = drill deeper.
- Full folder name/path remains legible.
- Add remains reachable while scrolling.

### Panel 3 — Project Name

- Dynamic heading uses current project name.
- Staged source review only; no duplicate source list elsewhere.
- Full canonical path/locator retained.
- Long display paths truncate with full path inspectable.
- Click source tile to add optional note/context.
- × removes only that source.

### Layout

- Builder height is resizable and persisted.
- Wide layouts use persisted draggable pane separators.
- Narrow/mobile layouts stack the three logical panels instead of requiring landscape.
- Headers/actions remain sticky/reachable.

### Create Project

The only final action is **Create Project**.

- Browser/mobile writes project + source records to authoritative IndexedDB.
- WSL writes to authoritative SQLite through existing SOT API.
- Project persists across refresh in the same authority.
- Final Target SOT is deferred until analysis establishes required capacity.

## 1.3 Project Operations

Project Operations is a mini portal.

### Project pane

- Active projects listed with name and created date.
- Hover/focus exposes project note + source paths/notes.
- × is soft delete.
- Deleted / Restore disclosure is first.
- Soft delete preserves project/source/history.

### Selected project status

Show:

- Pending / WIP / Closed
- Created Date
- Activity
- % complete from real evidence
- Start time
- ETC only when evidence exists
- Run
- Stop
- Reporting chip
- **Complete Project** action so a project can be explicitly closed in either browser/mobile or WSL mode.

### Browser/mobile execution

Browser/mobile projects can run locally when the browser has current permission/access to the source.

Current release supports a real local inventory pass over browser-authorized selected files/folders:

- counts files;
- totals bytes;
- records inventory evidence;
- updates project operation state;
- does not invent dedup/hash/copy evidence.

If browser permissions are lost after refresh/restart, source reconnection/reauthorization is required before another local run.

A completed local project remains valid and does **not** have to migrate to WSL.

### WSL execution

WSL operations use the same project lifecycle but can later execute higher-throughput deterministic scan/hash/copy engine stages against attached/server-visible drives.

### Reporting chip

Shows available evidence only:

- sources/notes;
- file count/bytes when inventoried;
- duplicates only when analyzed;
- status/progress evidence.

## 1.4 Database Administration

Must work against the active authority:

- browser/mobile → IndexedDB records;
- WSL → SQLite records through allowlisted API.

Required direction:

- table selector;
- row/column viewer;
- project/source metadata edits;
- active/inactive changes;
- soft delete/restore;
- immutable identity protection;
- no arbitrary SQL console.

## 1.5 SOT Build & Promotion

After inventory/dedup evidence and an approved copy set:

- choose target SOT and backup target;
- generate deterministic copy scripts/commands;
- preflight/dry run;
- execute copy-only plan;
- verify;
- promote verified target;
- persist lineage.

A promoted SOT may become a future source.

```text
Source A + Source B → SOT 1 → later source → SOT 2 → later source → SOT 3
```

## 1.6 Reporting

Schema/evidence-backed only:

- counts by Pending/WIP/Closed;
- active/deleted counts;
- source counts;
- creation timeline;
- project/source metadata;
- inventory totals where available;
- duplicate totals where available;
- lineage where available.

---

# 2. LOGICAL DATA MODEL

The same logical model exists in IndexedDB and SQLite.

## Project

```text
project_token           immutable
project_name
active
created_at
updated_at
status                  Pending | WIP | Closed
current_stage
current_run_id
notes
deleted_at
progress_percent
start_time
estimated_completion_at
```

## Source

```text
source_id
project_token
source_type             browser_local | wsl_path | promoted_sot
original_path_or_locator
normalized_path_or_locator
operator_label
operator_note
registered_at
last_seen_at
fingerprint
fingerprinted_at
source_status
parent_sot_generation_id
file_count              evidence when inventoried
byte_size               evidence when inventoried
```

## Planned engine datasets

```text
runs
inventory_runs
files
content_index
duplicate_clusters
conflicts
copy_plans
copy_jobs
verification
sot_generations
lineage
admin_events
```

---

# 3. CURRENT RELEASE — v0.3.1

## build 2026.08.12.5.0 — FAILED

- source selector still modal/overlapping;
- wrong mobile behavior;
- incomplete configuration/operations model.

## build 2026.08.12.5.1 — FAILED / SUPERSEDED

Owner gate established a critical architecture correction:

- Save & Validate was disabled on GitHub Pages.
- Browser/mobile was incorrectly treated as static preview only.
- Project creation/operation incorrectly depended on eventual WSL migration.

This violated the product intent: **a mobile browser can be the complete SOT project host; WSL is an optional higher-throughput/filesystem-access mode.**

## build 2026.08.12.5.2 — CURRENT CANDIDATE

### Scope

- dual authority adapter: IndexedDB browser/mobile or SQLite WSL;
- browser/mobile IndexedDB auto-created if missing;
- Save & Validate enabled in browser/mobile;
- integrity/read-write validation in browser/mobile;
- Project Setup creates durable local projects on GitHub Pages/mobile;
- source selection captures browser-authorized folder/file metadata;
- local real inventory Run when source is authorized;
- local source reconnect after permission/session loss;
- explicit Complete Project → Closed;
- local soft-delete/restore;
- local Database Administration CRUD foundation;
- local Reporting from real project/inventory evidence;
- same UI/lifecycle remains compatible with WSL mode;
- no WSL dependency for project completion.

### Automated gates

- UI build marker `2026.08.12.5.2`.
- IndexedDB opens and auto-creates stores.
- Save & Validate enabled on GitHub Pages/mobile.
- config read/write round trip.
- project create/load/update round trip in IndexedDB.
- project survives refresh.
- project Complete sets Closed/100% and persists.
- soft-delete/restore round trip.
- local source inventory totals actual selected File objects.
- no fake duplicate/hash/copy evidence.
- GitHub Pages never shows WSL volumes.
- WSL mode remains under existing `/report/api/sot/*` path.
- no 8081/8082/FastAPI dependency.

### Owner/device gate — GitHub Pages/mobile

1. Exact 5.2 served.
2. Configuration Save & Validate is enabled.
3. First Save & Validate creates/validates local DB without WSL.
4. Refresh retains configuration.
5. Create a project from a local folder.
6. Refresh; project still exists in Operations.
7. Reporting/source metadata persists.
8. Reconnect source if browser permission/session access is gone.
9. Run performs a real local inventory and records file count/bytes.
10. Complete Project marks Closed and persists after refresh.
11. Soft delete/restore works.
12. Database Administration reads/edits the same local authority.
13. No WSL migration is required.

### WSL gate — after browser/mobile gate

- exact build deployed/verified;
- Save & Validate creates SQLite DB if missing;
- config/integrity works;
- server-visible drives enumerate;
- project create/load/admin/report persist in SQLite;
- no parallel server or topology change.

---

# 4. RELEASE PLAN AFTER v0.3.1

## v0.4.0 — Fingerprint + Inventory Engine

- durable fingerprints/history;
- recursive manifest;
- resumable runs/checkpoints;
- browser-local and WSL engine adapters where platform capability permits;
- Start/Stop/continue backed by real execution;
- no copy.

## v0.5.0 — Dedup / Analysis inside Operations

- exact duplicate confirmation;
- duplicate groups;
- conflicts/different list;
- surviving-size estimate;
- target + backup capacity recommendation;
- approved canonical copy set.

## v0.6.0 — SOT Build Plan + Generated Scripts

- target selection;
- generated copy plan/scripts;
- collision-safe mapping;
- preflight/dry run;
- copy-only.

## v0.7.0 — Verified Copy Execution

- resumable copy execution;
- checkpoints;
- verification;
- separate copy throughput telemetry.

## v0.8.0 — Promotion + Lineage

- verified target → promoted SOT generation;
- promoted SOT becomes future source;
- complete ancestry retained.

## v0.9.0 — OpenClaw Orchestration / Reporting Expansion

- same deterministic backend contracts;
- expanded exports/reporting.

## v1.0.0 — MVP Hardening

- multi-TB real corpus tests;
- crash/restart/source-removal fault injection;
- IndexedDB/browser persistence tests;
- SQLite throughput/locking tests;
- owner end-to-end reconciliation in both modes.

---

# 5. OPEN ITEMS

- Browser permission persistence/reconnect behavior across Android/browser versions.
- Export/import/migration between browser IndexedDB projects and WSL SQLite projects.
- Exact fingerprint algorithm/threshold.
- Exact copy-script technology by execution mode.
- Source-note history model.
- Near-duplicate media analysis remains optional after exact dedup.

---

# 6. LIVE BACKLOG

- schema/version migration tooling for both IndexedDB and SQLite;
- browser DB export/import backup;
- richer admin audit history;
- source relink/reconnect review;
- tags/sidecar metadata;
- encrypted/sensitive classification;
- network-share reconnect handling;
- scan/copy performance history;
- Android background/sleep interruption handling;
- lineage visualization;
- cold/warm/hot tier reporting;
- multi-instance SOT support — future only.

---

# 7. SAFETY / DATA INVARIANTS

1. Sources are read-only inputs.
2. Copy-only; no automatic source move/delete.
3. Human validation before physical source retirement.
4. `project_token` immutable; project name mutable.
5. Soft delete preserves lineage/history.
6. Project completion is an explicit persisted lifecycle state and does not imply unperformed dedup/copy work.
7. UI never invents inventory/dedup/hash/copy evidence.
8. Verification failure blocks SOT promotion.
9. Scan and copy throughput are distinct measurements.
10. Promoted SOT lineage survives future use as a source.
11. Browser/mobile authority and WSL authority use the same logical project/source identity model.

---

# 8. GRAVEYARD — DO NOT REINTRODUCE

- G-001 separate FastAPI/Uvicorn/file_browser.py SOT server.
- G-002 ports 8081/8082 SOT service.
- G-003 release-driven Tailscale/server topology changes.
- G-004 **RETIRED/OVERRIDDEN:** browser-local authority veto. Current owner ruling explicitly permits IndexedDB as authoritative for browser/mobile projects; only `localStorage` remains forbidden as project authority.
- G-005 fake lifecycle controls/status.
- G-006 final SOT target required during Project Setup.
- G-007 source-selection modal.
- G-008 separate Dedup/Analysis nav section.
- G-009 Panel 1 directly selecting source.
- G-010 landscape-required source selection.
- G-011 decorative/tutorial-heavy source browser.
- G-012 moving/disappearing global hamburger.
- G-013 GitHub Pages showing WSL/server-only drives.
- G-014 test URL before exact served-build verification.
- G-015 ephemeral/self-triggering workflows as routine patch mechanism.
- G-016 destructive project delete instead of soft-delete/restore.
- G-017 patch-forward from failed owner candidate.
- G-018 losing lineage when promoted SOT becomes later source.
- G-019 requiring browser/mobile project migration to WSL before it can be authoritative or completed.
- G-020 disabling Configuration Save & Validate merely because the app is running on GitHub Pages/mobile.

---

# 9. RELEASE HANDOFF TEMPLATE

**Release:**  
**Baseline:**  
**Scope:**  
**Automated gates:** PASS/FAIL  
**Deployment:** exact commit + result  
**Verified test URL:** only after exact served build is verified  
**Owner/device gates:** ordered test sequence  
**Known limitations:** explicit  
**Owner result:** PASS / FAIL

---

# 10. DEFINITION OF DONE

DONE requires the exact served artifact to be verified and the applicable owner/device gate to pass. Browser/mobile acceptance does not depend on WSL migration. WSL acceptance is a separate execution-mode gate.