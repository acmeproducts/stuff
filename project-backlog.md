# SOT Project — Canonical Plan

**Repository:** `acmeproducts/stuff`  
**Canonical planning authority:** `project-backlog.md`  
**Current pre-base artifact:** `sot-turn01-pre-base.html`  
**Status:** **TURN01 PRE-BASE — OWNER-APPROVED MINIMUM CORPUS MODEL / BUILD SEQUENCING**  
**Last governance update:** 2026-08-21

This file is the single current planning authority for SOT. Earlier 0.4.x / 6.x implementation detail remains available in Git history and supporting design files, but it does not override the current owner rulings below.

---

# 0. CURRENT OWNER RULINGS

## 0.1 Authority

Order of authority:

1. current owner ruling;
2. this canonical plan;
3. explicit retained architecture locks / graveyard items in this plan;
4. supporting design documents;
5. older implementation history.

The purpose of governance is to preserve decisions, not to delay implementation.

## 0.2 Live authority split

- **GitHub** is authority for SOT software, schema/migrations, this plan, release artifacts, and optional immutable exports/checkpoints.
- **`oc-ref` WSL** is authority for the live centralized SOT corpus/database.
- **Tailscale** is the private transport to the centralized SOT service.
- The live corpus is not transactionally synchronized through GitHub.
- Existing production SOT HTTP topology remains the report server / port 18080 unless explicitly changed by owner ruling.
- No FastAPI/Uvicorn/file_browser.py helper, no 8081/8082, and no release-driven Tailscale topology changes.

## 0.3 Product model

The SOT database is the product.

A **Project** is only a virtual, editable container of source paths plus notes. It does not own fingerprints, content identity, Target holdings, Backup holdings, or corpus history.

The operational flow is:

`SCOPE → PROCESS → REVIEW → EXECUTE → CERTIFY`

Inventory and fingerprinting are internal processing capabilities, not separate product destinations.

Source is never deleted by SOT execution. SOT establishes and verifies Target and Backup state, then may certify source material as safe to retire. The corpus records what happens to the source afterward.

---

# 1. DESIGN REFERENCE POINT — MINIMUM CORPUS EVIDENCE

## 1.1 A source is a source

Do not make device identity a prerequisite for useful corpus intelligence.

Whether a source is exposed as `G:/`, `X:/`, `/mnt/q`, Android `DCIM`, a mounted share, or a future adapter is incidental to the core evidence model. A source provides paths and files. Device/volume sophistication is added only when real data demonstrates a false-positive/false-negative problem that requires it.

Do not block TURN01 on companion APK design, PWA design, SD-card lifecycle modeling, drive-letter persistence logic, or speculative device edge cases.

## 1.2 Minimum raw evidence per observed file

Retain:

```text
normalized_path
filename
size
modified_at
file_fingerprint
observed_at
```

The raw components remain queryable and inspectable.

## 1.3 Derived deterministic identities

Retain three independent pieces of evidence:

```text
PATH HASH
H(normalized_path)

FILE FINGERPRINT
Authoritative content fingerprint/hash

OBSERVATION HASH
H(normalized_path + file_fingerprint + modified_at + size)
```

The hashes do not replace their component fields.

This gives both deterministic matching and a foundation for later fuzzy/candidate reasoning.

## 1.4 Minimum deterministic interpretations

- same file fingerprint + different path = same content observed at multiple locations;
- same path + different file fingerprint = content changed/replaced at that path;
- same observation hash = effectively unchanged observation;
- file fingerprint already verified in Target = no Target copy required;
- file fingerprint absent from Target = new Target content candidate;
- same filename/size/date without authoritative fingerprint may be presented only as a candidate relationship, never exact duplication.

## 1.5 Progressive refinement rule

Collect the minimum first. Measure false positives, false negatives, throughput, and operational ambiguity against real corpus data. Add evidence fields or identity sophistication only when a demonstrated failure mode justifies it.

---

# 2. VALUE GATE — INGESTION MUST PRODUCE INTELLIGENCE

TURN01 is not successful merely because paths can be enumerated or fingerprints written.

**Every observation should immediately increase what the corpus can know.**

As observations/fingerprints arrive, the centralized SOT database must continuously derive at least:

- files and bytes observed;
- unique content fingerprints;
- exact duplicate copies/groups;
- duplicate/redundant bytes;
- new versus previously known content;
- changed/replaced path observations;
- content already verified in Target;
- content missing from Target;
- bytes actually requiring transfer to Target;
- Target content with verified Backup coverage;
- Target content missing verified Backup coverage;
- potentially recoverable source capacity;
- project overlap and project-exclusive remainder where sufficient evidence exists.

Every finding/recommendation must drill down to deterministic raw evidence.

---

# 3. TURN01 PRE-BASE PURPOSE

The first new owner-testable artifact is:

`sot-turn01-pre-base.html`

This is intentionally a **pre-base**, not an accepted baseline.

TURN01 must reuse the plumbing and lessons that already work instead of starting over:

- WSL mount/volume discovery that is proven readable by the production report service;
- single production SOT HTTP surface on the report server / port 18080;
- path browsing and deep-path selection;
- project persistence;
- file-level inventory/fingerprint work;
- durable SQLite SOT storage under `oc-ref`;
- global multi-project worker/scheduler plumbing;
- reporting/file-detail concepts and repolist-style interaction patterns;
- Target-analysis concepts already introduced in 6.9.x;
- global hash reuse where the evidence is valid.

TURN01 replaces the clunky feature-centric UI and fills the missing intelligence/execution lifecycle. It is not a cosmetic rewrite.

---

# 4. TURN01 IMPLEMENTATION SEQUENCE

The sequence is deliberately cumulative. Each step must leave the application more useful and feed real evidence into the next step.

## TURN01-1 — Streamlined Project CRUD + scope

Redefine Project as a virtual editable container of paths.

Required project data:

```text
project_name
project_note
sources[]
source_note per source
```

Required behavior:

- one project omnibox for search/recall;
- `+ New Project` as a secondary action;
- no project dropdown selector;
- selected project name editable inline;
- project note editable inline;
- save on Enter or blur;
- source-specific note editable inline;
- add/remove source membership without deleting corpus observations/fingerprints;
- invoke source/path picker only when adding/changing scope;
- dismiss picker when selection is finished;
- reuse existing working WSL volume/path browse plumbing.

**Primary value:** projects can be created and edited rapidly without mixing project editing with a permanent file explorer.

## TURN01-2 — Expand/collapse Project → Source → SOT data

The Projects workspace must communicate scope and evidence hierarchically.

Model:

```text
PROJECT
  └─ SOURCE
       └─ SOT DATA / FINDINGS
```

Project expands to Sources. Source expands to current corpus evidence.

Source-level summary should expose where evidence exists:

- source note;
- file count;
- bytes;
- last observation;
- fingerprint coverage;
- unique bytes;
- duplicate bytes;
- Target coverage;
- Backup coverage;
- current processing state;
- errors/warnings.

Dense file detail is a drilldown, not the default project editor.

**Primary value:** one coherent project surface communicates both what is in scope and what SOT currently knows about it.

## TURN01-3 — Global scheduler / simultaneous projects

Reuse and harden the existing global multi-project scheduler.

Required behavior:

- multiple projects may process simultaneously;
- one global queue/worker ceiling, not N workers per project;
- fair project interleaving;
- processing never blocks the UI;
- current project/source/path/file visible for each active worker;
- files/bytes discovered visible in real time;
- files/bytes fingerprinted visible in real time;
- hash/fingerprint reuse visible;
- throughput visible;
- errors/warnings visible;
- ETA shown where meaningful;
- queue/wait/paused state visible;
- no long-lived opaque `Reading...` state.

TURN01 does not require speculative device-aware scheduling. Measure real throughput first, then tune concurrency.

**Primary value:** several real projects can be started quickly and the operator always knows what the engine is doing.

## TURN01-4 — Central SOT database

The live corpus remains centralized under `oc-ref` WSL SOT data storage.

TURN01 persistence must support at minimum:

```text
projects
project_sources
file_observations
path_hash
file_fingerprint
observation_hash
observation history/current state
target_holdings
backup_holdings
execution/transfer records
source_dispositions
```

Existing valid 6.9.x data must be reused/migrated where deterministic mapping is possible rather than discarded and rehashed unnecessarily.

**Primary value:** all projects/scans enrich one reusable corpus instead of producing isolated job output.

## TURN01-5 — Real-time SOT DB intelligence

Intelligence is continuously derived as observations are persisted.

At minimum calculate and display:

- unique content;
- exact duplicate copies/groups;
- duplicate bytes;
- known versus new content;
- changed/replaced path observations;
- content already in Target;
- content absent from Target;
- new Target bytes required;
- Backup coverage/missing Backup;
- potentially recoverable source bytes;
- project overlap;
- project-exclusive remainder.

No separate manual “run analysis” should be required simply to update facts that can be derived from current corpus state.

**Primary value:** ingestion immediately turns into useful findings.

## TURN01-6 — Ad hoc SOT intelligence

Provide a Corpus workspace independent of projects.

One omnibox/query surface should allow deterministic inquiry across:

- path;
- filename;
- file fingerprint;
- size/date;
- project membership;
- duplicate/copy count;
- Target present/missing;
- Backup verified/missing;
- changed/current observation state;
- source disposition.

Required example questions/results:

- show all observations of this fingerprint;
- show duplicate content with more than N copies;
- show content absent from Target;
- show Target content without verified Backup;
- show changed content since prior observation;
- show content shared between Project A and Project B;
- show the exclusive remainder of a project;
- show sources already safe to retire / archived / disposed.

Natural-language assistance can come later. TURN01 requires inspectable deterministic query results first.

**Primary value:** the SOT database becomes directly useful as an index of indices, not merely a backend for project pages.

## TURN01-7 — Real-time dynamic execution plan

The execution plan is a live derived view of corpus state, not a manually constructed checklist.

For each authoritative file fingerprint in project scope classify dynamically:

```text
TARGET VERIFIED       → no-op
TARGET MISSING        → transfer candidate
TARGET VERIFIED / BACKUP MISSING → backup candidate
CONFLICT              → unresolved
SOURCE CHANGED        → stale / re-evaluate
```

Continuously show:

- no-op files/bytes;
- transfer files/bytes;
- backup files/bytes;
- unresolved items;
- source bytes potentially certifiable after successful Target + Backup completion.

Scope changes, new fingerprints, Target verification, or Backup verification automatically recalculate affected plan items.

Every plan item must drill down to source observation + fingerprint + Target/Backup evidence.

**Primary value:** the corpus tells the operator what actually needs to happen now, while suppressing redundant copy work automatically.

## TURN01-8 — Record transfer, Target, Backup, and source disposition

TURN01 must record the complete lifecycle even if physical copy automation is phased in after the record model exists.

For every Target/Backup/disposition event retain at minimum:

```text
file_fingerprint
source_path / source_observation
target_path / library_location
transfer_timestamp
target_verification_state
target_verification_timestamp
backup_path / backup_library_location
backup_timestamp
backup_verification_state
backup_verification_timestamp
source_disposition
source_disposition_location
source_disposition_timestamp
operator_note
```

Minimum source disposition states:

```text
active
safe_to_retire
archived
cold_stored
disposed_external
```

SOT execution does not delete source. It records the evidence supporting retirement and then records the actual operator disposition, including library/location and time/date.

**Primary value:** SOT remains current after consolidation rather than ending when a copy job completes.

---

# 5. TURN01 UX MODEL

Global navigation should converge toward:

```text
Projects
Corpus
Activity
Admin
```

## Projects

One project omnibox plus the coherent project lifecycle.

A selected project presents:

```text
SCOPE → PROCESS → REVIEW → EXECUTE → CERTIFY
```

Only one primary forward action should be visually dominant at a time.

## Corpus

Ad hoc deterministic query and evidence drilldown.

## Activity

Global queue, active projects, workers, current files/paths, throughput, reuse, waits, errors.

## Admin

Database health, configuration, Target/Backup definitions, build/version, migrations, diagnostics.

Fingerprinting is infrastructure, not top-level navigation.

---

# 6. TARGET / BACKUP / CERTIFICATION RULES

## Target

Target holdings are first-class corpus evidence keyed by authoritative content fingerprint.

If a fingerprint is already verified in Target, later projects must not schedule another Target copy solely because the content appears under another source path.

## Backup

Backup holdings are first-class evidence linked to authoritative content fingerprint / Target holding.

## Certification

A source/path may be marked `safe_to_retire` only when current corpus evidence shows the required content is established in Target, required Backup coverage is verified, and no newer conflicting source observation invalidates that conclusion.

Certification is corpus state, not deletion.

---

# 7. TURN01 OWNER GATE

`sot-turn01-pre-base.html` is ready for owner testing only when one coherent end-to-end run can demonstrate:

1. create, recall, edit, and rename projects from one omnibox;
2. edit project note and source-specific notes inline;
3. add/remove multiple source paths using existing browse plumbing;
4. expand Project → Source → SOT evidence without navigating across unrelated product modules;
5. process at least two projects simultaneously while the UI remains responsive;
6. show current project/source/path/file and real processing counters while work occurs;
7. persist minimum raw observation evidence plus path hash, file fingerprint, and observation hash into the centralized SOT database;
8. immediately derive duplicate/unique/change/Target/Backup intelligence from real observations;
9. perform ad hoc corpus queries independent of a project;
10. dynamically derive an execution plan that suppresses content already verified in Target;
11. record source→Target transfer evidence;
12. record Target→Backup evidence;
13. record source disposition including archive/cold-storage/library location and time/date;
14. drill every finding/recommendation/plan item to deterministic supporting evidence.

If these cannot be demonstrated end-to-end, TURN01 is incomplete even if individual pieces function.

---

# 8. IMPLEMENTATION DISCIPLINE

- Reuse proven plumbing; do not rewrite working mount/browse/scheduler/database components without a demonstrated cause.
- Correct the root cause of failures; do not patch forward blindly after owner-gate failures once an accepted baseline exists.
- TURN01 is still pre-base: no implementation becomes an accepted baseline until the owner accepts it.
- UI must never invent evidence, progress, intelligence, Target state, Backup state, or certification state.
- Long-running work must always expose what it is doing.
- No source mutation/deletion during SOT execution.
- GitHub deployment/version and live served build must be distinguishable and verifiable.
- No unrequested service/port/proxy/Tailscale topology changes.

---

# 9. RETAINED GRAVEYARD / DO NOT REINTRODUCE

- separate FastAPI/Uvicorn/file_browser.py SOT server;
- ports 8081/8082 for SOT;
- release-driven Tailscale topology changes;
- `localStorage` as authoritative SOT/project database;
- fake lifecycle/progress/status;
- synthetic Root that masquerades as real storage;
- treating an empty `/mnt/<letter>` directory as a mounted readable volume;
- discarding root-level files from browse results;
- folder/source aggregate fingerprint as a substitute for per-file fingerprint evidence;
- full rescan of unchanged known scopes as the default behavior;
- project dropdown selector;
- duplicate project search controls;
- permanent file explorer embedded beside project metadata;
- separate top-level Fingerprinting destination;
- source deletion as part of SOT execution;
- recommendation/plan items that cannot be traced to deterministic evidence.

---

# 10. NEXT ACTION

Build planning now proceeds directly against this sequence and the existing repository/runtime plumbing.

The immediate implementation target is **TURN01-1 + the minimum supporting database/API changes required to make that UI operate against the centralized corpus**, while preserving the full TURN01 owner gate as the definition of the initial pre-base release.
