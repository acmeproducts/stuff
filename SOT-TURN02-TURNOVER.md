# SOT Turn 02 — Turnover Plan

**Status:** active roadmap. Supersedes nothing; it operationalises
[`SOT-TURN02-PRE-BASE-PLAN.md`](SOT-TURN02-PRE-BASE-PLAN.md) under the architecture
decision recorded in §3.

**Companion documents**

| Document | Role |
|---|---|
| [`SOT-ARCHITECTURE-PLAN.md`](SOT-ARCHITECTURE-PLAN.md) | What SSOT is and the domain model. Unchanged. |
| [`SOT-GRAVEYARD.md`](SOT-GRAVEYARD.md) | Rejected approaches. Binding. Read before proposing anything. |
| [`SOT-TURN02-PRE-BASE-PLAN.md`](SOT-TURN02-PRE-BASE-PLAN.md) | Slice doctrine (A–D), owner-approved. |
| This document | Verified state, API surface, UI design, gates, release procedure. |

---

## 1. Verified current state

Evidence captured from the live host on 2026-09-15 13:49 PDT. These are observations,
not assumptions.

**The backend is healthy and is not the problem.**

```
build             2026.09.07.sot-turn01-r12-ssot-profile-1
database_version  6
port              18080 (127.0.0.1)
status            ok
```

Declared capabilities include: clean schema migrations, projects, source preflight,
non-blocking background workers, concurrent indexing, per-project play/pause/stop,
global path fingerprint reuse, realtime rollups, live worker paths, live in-file byte
progress, durable activity log, durable project coordination, stale-operation
rejection, atomic evidence cutover, worker-exit fail-closed, incremental SHA-256,
deterministic review, immutable plans, verified target/backup, certification, db-admin.

**Windows-native volume discovery works.** `GET /api/sot/turn01/volumes` returns four
drives with real capacity and `"authority":"windows-native"` — C:, D:, F:, I:. The
GY-001 WSL-only failure mode is not present in the running build.

**Fingerprinting has been reached before.** The capability set above and the R12
lineage confirm indexing and evidence cutover previously ran end to end.

**The failure is confined to the UI.** The page in production
(`SOT-turn01-base.html`, R14) exposes a free-text path box and a list of sources the
owner has added. It never calls `/turn01/volumes`. It therefore appears to "see no
drives" while the engine beneath it enumerates every drive correctly. This is a
presentation defect, not a discovery defect.

## 2. Repository hazard — read this first

`sot-api.js` on `main` is **not** the backend that is running. `main` carries build
`2026.08.24.sot-live-progress-5`, which discovers drives by scanning `/mnt/<letter>` —
the GY-001 architecture. The live host runs `2026.09.07.sot-turn01-r12-ssot-profile-1`,
produced by an installer-composed lineage.

Consequences, binding:

- Never assume a file in `main` is what is deployed. Probe the host.
- Never overwrite the live `sot-api.js` from `main`. It is a regression.
- Backend changes are surgical edits to the running file, backed up and reversible,
  or they are composed through the pinned lineage. Nothing else.

## 3. Architecture decision

**The UI leaves the installer.**

```
GitHub Pages (static, public)        WSL host (private, tailnet only)
acmeproducts.github.io/stuff/  ──►   https://oc-ref.fell-dojo.ts.net/api/sot/*
  SOT.html  (single file)              Node service :18080 + SQLite
```

Rationale: shipping the UI inside the installer coupled every cosmetic change to a
full backend qualification chain. A single failed gate rolled back and left an
arbitrary page in production. Decoupling makes a UI change a `git push` and makes the
backend inert unless the API itself changes.

Requirements:

- Both endpoints are HTTPS. No mixed content.
- The browser must be on the tailnet. This is already true — the owner browses
  `oc-ref.fell-dojo.ts.net` today.
- The backend must answer cross-origin requests. See §3.1.
- The backend is **not** exposed to the public internet. Tailscale remains the only
  network path. Pages hosts bytes, not data.

### 3.1 CORS — the only backend change in Slice A

The running `json()` helper emits no CORS headers and there is no `OPTIONS` handler,
so a Pages-hosted page cannot call the API. Two insertions, applied to the live file:

1. A `SOT_CORS` header constant.
2. `Object.assign(...)` of that constant into the `json()` `writeHead`.
3. An `OPTIONS` short-circuit at the top of `handle()` returning `204`.

The patch is idempotent, `node --check` gated, backed up to `sot-api.js.pre-cors`, and
rolls back automatically if the post-restart probe does not return
`access-control-allow-origin`. The build string must be unchanged afterwards. If the
build string changes, the patch was wrong — restore the backup.

## 4. API surface

Confirmed live: `/health`, `/turn01/volumes`.

Present in the router and exercised by prior UI clients — each must be re-probed in
Slice A before a surface depends on it:

| Endpoint | Use |
|---|---|
| `GET /api/sot/health` | build, schema, liveness |
| `GET /api/sot/turn01/volumes` | Windows-native drive inventory |
| `GET /api/sot/fs?path=` | folder listing for the picker |
| `GET POST /api/sot/projects` | workspace record |
| `GET PUT /api/sot/turn01/projects/{token}/sources` | Source folders |
| `GET PUT /api/sot/turn01/projects/{token}/storage` | Target / Backup roots |
| `POST /api/sot/projects/{token}/fingerprint/{start,pause,continue,stop}` | run control |
| `GET /api/sot/projects/{token}/fingerprint/status` | run progress |
| `GET /api/sot/rollup` | corpus totals |
| `GET /api/sot/scheduler/status` | worker pool |
| `GET /api/sot/turn01/projects/{token}/review` | evidence revision, duplicates |
| `GET /api/sot/activity` | durable activity log |

**Slice A deliverable zero:** a probe script that calls every row above against the
live host and records status and shape into `SOT/archive/<stamp>-api-probe/`. No UI
work starts before that file exists. A surface built on an assumed endpoint is how
this project got lost.

`{token}` is the project token. "Project" survives as an internal workspace key only.
It is never shown to the owner — see GY on owner-facing Projects.

## 5. Slices

Doctrine: one slice at a time, accepted by the owner before the next begins. No slice
may introduce a surface belonging to a later slice, even greyed out.

### Slice A — Storage

**Does:** discovers volumes, browses folders, assigns Source / Target / Backup,
persists them, survives a browser close.

**UI:** one screen. A volume strip across the top — one card per drive, name, free of
total, a capacity bar. Below it three role rows: Sources (a list, add and remove),
Target (one), Backup (one). Each row has a button that opens a folder picker modal.
The picker opens on the volume list, drills down through real folders, shows the
current path as a breadcrumb, and has one confirm button. Typing a path by hand is
permitted as a fallback but is never the only way to pick a folder — that omission is
what produced the dead R14 screen. A service status line shows build and liveness.
Nothing else on the page.

**Gates:**

| Gate | Pass condition |
|---|---|
| A1 CORS | Origin-bearing request returns `access-control-allow-origin`; build string unchanged |
| A2 Discovery | Every drive returned by `/turn01/volumes` renders with correct capacity |
| A3 Browse | Picker descends at least three levels on a real drive and returns real folders |
| A4 Assign | Source, Target, Backup all settable; Sources accepts more than one |
| A5 Persist | Close the browser fully, reopen, configuration is identical |
| A6 Isolation | No Work, SSOT or Action surface is reachable |
| A7 Non-destructive | Backend build, schema and database row counts unchanged by the whole slice |

### Slice B — Work

**Does:** starts, pauses, resumes and stops indexing server-side; progress survives a
browser close.

**UI:** second tab. State, phase, worker pool, active workers, files processed of
discovered, bytes processed of discovered, a progress bar, four controls, and the
durable activity log.

**Gates:** B1 start from Slice A config; B2 progress advances; B3 close the browser
for five minutes, reopen, the run advanced while away; B4 pause holds and resume
continues from the same counters; B5 stop is clean and leaves no orphan workers;
B6 the activity log survives a service restart; B7 nothing in the committed Profile
changed.

### Slice C — Committed SSOT Profile

**Does:** presents the estate as committed truth — hierarchy, content identity,
duplicates, protection status, evidence revision.

**UI:** third tab. Hierarchical master–detail. Corpus metrics, placement summary, and
an evidence panel showing revision number, duplicate groups and reclaimable bytes.

**Gates:** C1 a failed or stale run never replaces the previous revision; C2 the old
revision remains authoritative and readable throughout a new run; C3 commit is atomic;
C4 verified protection copies are never counted as disposable duplicates; C5 identity
is the fingerprint, paths are instances of it.

### Slice D — Safe Action

**Does:** copy, verify, and only then mark eligible for cleanup.

**UI:** fourth tab. Proposed plan, per-item evidence, explicit confirm. No bulk delete
control anywhere.

**Gates:** D1 no mutation without evidence bound to a named revision; D2 copy is
verified before the source is eligible; D3 plans are immutable once issued; D4 every
action is reversible or refused; D5 red-team finds no path to deletion without
verified protection.

### Deferred — not in scope until A–D are accepted

Tags, AI, analytics, dashboards, certification reporting, cold-storage retirement
workflow. Listing them here is a boundary, not a promise of sequence.

## 6. Release procedure

**UI:** edit the single file, push to `main`, reload the Pages URL. No installer, no
service restart, no database touch. Roll back with `git revert`.

**Backend:** only when the API must change. Surgical patch to the live file, backed up,
`node --check` gated, health-probed after restart, automatic restore on failure.

**Every slice** writes its gate results to
`SOT/archive/<stamp>-turn02-slice-<x>/` before the owner is asked to test.

## 7. Prohibited

Binding, from `SOT-GRAVEYARD.md` and from this turn's failures:

- WSL `/mnt/<letter>` scanning or `findmnt` as the discovery authority (GY-001).
- Owner-facing "Projects" as an organising concept.
- Tags as the replacement for Projects. The replacement is committed Profile revisions.
- Shipping UI inside the installer.
- Overwriting live backend files from `main`.
- Rebuilding anything that is observed working. Salvage first, and prove what is
  broken before replacing it.
- Presenting a surface whose backing endpoint has not been probed.
- Database resets as a routine step of a UI change.

## 8. Immediate next actions

1. Apply the CORS patch (§3.1) and confirm the build string is unchanged.
2. Run the API probe (§4) and commit its output to the archive.
3. Build Slice A against only the endpoints the probe confirmed.
4. Owner tests A1–A7. Nothing proceeds until A is accepted.
