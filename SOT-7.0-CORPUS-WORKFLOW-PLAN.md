# SOT 7.0 — Corpus-Centric Workflow Plan

**Status:** DESIGN AUTHORITY — implementation intentionally deferred until owner review  
**Purpose:** Replace feature-centric UX with one coherent operational workflow around the global SOT corpus.

---

# 1. Product thesis

The SOT database is the product.

A **Project** is only a virtual, editable scope: a name plus a set of paths. It does not own fingerprints, content identity, target state, backup state, or duplicate intelligence.

The global corpus owns durable knowledge about:

- physical/logical volumes and their stable identities;
- paths and path observations;
- files and metadata observations;
- content identity / fingerprints;
- relationships between observations and content;
- Target holdings;
- Backup holdings;
- plans, actions, verification, and certification history.

The central operational loop is:

`SCOPE → PROCESS → REVIEW → EXECUTE → CERTIFY`

There is only **one primary forward action** in each stage.

The user should never have to reason about separate product modules called inventory, fingerprinting, reporting, remediation, or certification. Those are internal capabilities supporting the five-stage flow.

---

# 2. Rational minimum workflow

## Stage 1 — SCOPE

**Question answered:** What body of source paths should be considered together?

### UI

Project header:

- one project omnibox for search / recall;
- `+ New project` secondary action;
- selected project name editable inline;
- selected project note editable inline;
- update on Enter or blur;
- no dropdown project selector;
- no duplicate project search controls elsewhere.

Project body:

- current project paths;
- `+ Add paths` opens the path picker as a focused sub-surface/card/tab, not embedded permanently beside project editing;
- paths removable from the project without deleting corpus observations or fingerprints;
- path membership may overlap with other projects.

### Information communicated

For each path:

- display name;
- current observed locator;
- stable source/volume identity when known;
- last observed/indexed time;
- known files / bytes;
- processing freshness state: `Known`, `Changed`, `Needs processing`, `Unavailable`.

### Primary action

`PROCESS PROJECT →`

Enabled when at least one valid path is in scope.

### System behavior

The action does not blindly rescan everything. It asks the global corpus what is already known, what metadata is still valid, and what must actually be inventoried/fingerprinted.

---

## Stage 2 — PROCESS

**Question answered:** What is the corpus learning right now, and how long will it take?

From the user's perspective there is one operation: **Process**.

Internally it may execute:

1. source/path availability verification;
2. lightweight stillness/change checks;
3. incremental inventory;
4. fingerprint/hash reuse lookup;
5. hashing only where authoritative content identity is missing or stale;
6. persistence into the global corpus.

### UI

Top summary:

- total paths;
- paths already current;
- paths requiring work;
- files discovered;
- bytes discovered;
- files fingerprinted/reused;
- bytes fingerprinted/reused;
- aggregate throughput;
- ETA where meaningful;
- errors/warnings.

Show inventory and fingerprint work as separate internal progress rows, but under the single **Processing** stage.

Example:

```text
PROCESSING

Inventory        18,442 files discovered     2.80 TB
Fingerprint      11,203 / 18,442             1.72 / 2.80 TB
Reuse            7,910 hashes reused
Throughput       426 MB/s
ETA              43 min
```

### Live activity

Never show only `Reading...`.

Always communicate current work:

```text
Worker 1   Project A   Q:\Photos\2025\IMG_10492.jpg
Worker 2   Project B   R:\Camera\DCIM\MOV_0088.mp4
Worker 3   Project A   D:\Video\1999\Christmas.avi
Worker 4   Project C   Q:\Photos\2024\IMG_7721.jpg
```

If the engine is walking a directory before files are known, show:

```text
Reading Q:\Photos\2025\August
1,842 folders discovered
42,736 files discovered
683 GB discovered
```

The UI must remain responsive and nonblocking throughout.

### Primary action

While work remains: no fake forward action; primary control is `Pause processing` only if needed.

When enough authoritative corpus state exists for analysis:

`REVIEW FINDINGS →`

The project may enter Review while lower-priority/background enrichment continues, provided findings explicitly show any incomplete-confidence areas.

---

# 3. Global scheduler model

Processing is **global infrastructure**, not project-owned execution.

Projects submit required work into one scheduler.

```text
Project A ─┐
Project B ─┼──→ Global Scheduler ─→ worker pool ─→ global SOT corpus
Project C ─┘
```

The scheduler must understand at least:

- project priority / fairness;
- stable physical source identity;
- whether two paths resolve to the same physical device;
- whether a file/path has already been inventoried;
- whether a verified hash can be reused;
- whether metadata indicates change;
- whether work is CPU-bound or I/O-bound.

### Worker policy

Do not equate `N projects` with `N × worker_count`.

Initial policy:

- configurable global CPU/hash ceiling;
- device-aware read concurrency;
- normally 1–2 concurrent readers per physical spinning/external source unless measurement proves more helps;
- simultaneous work across independent devices;
- fair interleaving of projects sharing the same device;
- UI exposes queue, active workers, throughput, device bottlenecks, and reuse rate.

### Required performance instrumentation

For every worker/job:

- project;
- source/path;
- current file or directory;
- files/sec;
- bytes/sec;
- cumulative files/bytes;
- reused vs newly hashed;
- wait reason (`device busy`, `queued`, `paused`, `unavailable`).

This is required before tuning worker counts.

---

# 4. Corpus identity model

The system must not confuse a drive letter with durable identity.

## Content

Authoritative content identity is SHA-256 (or future stronger approved content identity).

## Observation

An observation answers: where and when did the system see this content or candidate content?

Minimum observation attributes:

- stable volume/device identity when available;
- observed locator / mount / drive letter;
- volume-relative path;
- filename;
- size;
- modified time;
- created time where reliable, but never as sole identity;
- observation timestamp;
- current availability.

## Fast reuse / stillness checks

A rational hierarchy:

1. **Authoritative:** existing verified SHA-256/content identity.
2. **Strong reuse on same stable volume:** stable volume identity + volume-relative path + size + modified time.
3. **Directory stillness signature:** deterministic tree of relative path + size + modified time for fast change detection.
4. **Cross-device metadata similarity:** candidate only; never treated as authoritative duplication without content evidence.

Creation time is metadata, not a primary identity key because copies/filesystem transfers can alter it.

---

# 5. Stage 3 — REVIEW

**Question answered:** What does the corpus tell us, and what should we do?

This is the intellectual center of the product.

The system should produce **findings and recommendations**, not merely a file table.

### Project findings

At minimum:

- source bytes in scope;
- unique content bytes;
- exact duplicate bytes;
- exact duplicate file count/groups;
- content already established in Target;
- new content absent from Target;
- conflicts / ambiguous path-name relationships;
- changed files since prior observation;
- unavailable or incomplete source paths;
- estimated new Target requirement;
- estimated source capacity that can eventually become certifiable redundant.

Example:

```text
3.21 TB source material
2.14 TB unique content
1.07 TB duplicate/redundant content

1.89 TB already verified in Target
251 GB new Target content required
413 conflicts
72 changed files awaiting current content identity

Potential source capacity certifiable after completion: 2.94 TB
```

### Global context

Project review also shows how its scope relates to the overall corpus:

- overlap with other projects;
- paths already included elsewhere;
- content already in Target;
- content already backed up;
- path/project reconfiguration opportunities.

### Project rationalization intelligence

The system should be able to propose:

- `Project A overlaps Project B by 92%`;
- `Move paths X/Y from A to B to make scopes mutually exclusive`;
- `Project C contains no unique remaining scope and can be retired`;
- `Split the non-overlapping remainder into a new project`;
- `These projects are largely equivalent; consolidate them`.

Project rationalization changes project/path membership only. It does not delete corpus evidence.

### Primary action

`GENERATE PLAN →`

---

# 6. Ad hoc SOT query capability

The global SOT database is an index of observations/content/holdings and therefore requires direct inquiry independent of projects.

Primary navigation should ultimately include **Corpus**.

Corpus provides:

- one omnibox;
- Project → Path → File drilldown;
- repolist-style dense table;
- sortable columns;
- draggable/reorderable columns;
- resizable columns;
- persisted column preferences;
- filter chips / query builder;
- later, natural-language-to-deterministic-query assistance.

Examples of supported questions:

- files larger than 2 GB with more than two observed copies;
- content present on Q: and R: but absent from Target;
- Target content lacking verified Backup coverage;
- source paths already certified safe to retire;
- content changed after its Target holding was established;
- all observations of a specific SHA-256;
- projects containing a given path/content item;
- projects whose scopes are substantially similar.

Natural-language answers must resolve to inspectable deterministic query results, not opaque model conclusions.

---

# 7. Stage 4 — EXECUTE

**Question answered:** What approved deterministic actions establish the centralized Target and its verified Backup?

The plan is generated from corpus state.

It must distinguish:

- content already verified in Target → **no copy**;
- content absent from Target → copy candidate;
- conflicting candidate destinations → resolve before execution;
- Target capacity requirement;
- Backup capacity requirement;
- verification operations.

Example plan summary:

```text
Already verified in Target     18,201 files     no action
Copy to Target                  3,844 files     251 GB
Resolve before execution           19 conflicts
Target free space                3.8 TB
Backup requirement               251 GB
```

### Primary action

`APPROVE & EXECUTE →`

### Execution invariant

This stage **never deletes source**.

Execution flow:

`Source → Target → verify Target → Backup → verify Backup`

The corpus records every planned and actual action, including content identity, source observation, destination, timestamps, verification, failures, retries, and final state.

If the same authoritative content is encountered later in any project and a verified Target holding already exists, the generated plan must not duplicate it.

---

# 8. Target and Backup are first-class corpus holdings

Target is not merely a path configured in an execution screen.

A Target holding records:

- content identity;
- canonical target locator/path;
- first established time;
- last verified time;
- verification method/status;
- target generation / plan/action provenance.

Backup holding records the same concepts for independent protection of Target content.

The corpus must be able to answer:

- Does this content already exist in Target?
- Is that Target copy currently verified?
- Does it have an independently verified Backup?
- Did source content change after the Target holding was established?

---

# 9. Stage 5 — CERTIFY

**Question answered:** Which source paths are now proven redundant and safe to retire operationally?

Certification requires deterministic evidence.

Minimum gate for a source path:

- every required unique content object has a verified Target holding;
- every required Target holding has verified Backup coverage;
- no unresolved conflicts affecting that source;
- no newer source observation invalidates the Target state;
- plan/action history is complete and auditable.

Status example:

```text
Q:\Old Photos

8,143 files · 641 GB
Target coverage        100%
Target verified        YES
Backup verified        YES
Outstanding conflicts  0
Changed since plan     0

SAFE TO RETIRE
```

### Primary action

`CERTIFY SOURCE →`

Certification changes corpus state only.

It **does not delete the source**.

The operator may later physically retire, cold-store, or delete source media outside this workflow. The SOT retains historical evidence permanently according to retention policy.

---

# 10. Navigation model

Rational minimum global navigation:

1. **Projects** — scope and five-stage workflow.
2. **Corpus** — ad hoc SOT explorer/query/intelligence.
3. **Activity** — global processor, queues, workers, devices, throughput, errors.
4. **Admin** — database, target/backup definitions, system diagnostics, build/promotion.

Fingerprinting is removed as a top-level destination.

Reporting is absorbed into Corpus/Review.

Remediation is represented by Review → Execute.

Certification is the terminal operational stage of a project/path, not a standalone generic tool.

---

# 11. Project workspace UI

Selecting a project opens one coherent workspace.

Header:

```text
[ Project omnibox ................................ ]   [+ New]
Family Media Consolidation        [inline editable]
optional note                      [inline editable]
```

Stage rail / progress:

```text
SCOPE  ── PROCESS ── REVIEW ── EXECUTE ── CERTIFY
```

Rules:

- completed stages show completion state;
- current stage is dominant;
- future stages are visible but not presented as competing primary actions;
- only one primary forward action appears;
- system can move backward when scope changes invalidate later findings/plans;
- changing project paths after Review automatically marks findings/plan stale and returns workflow state to the earliest invalidated stage.

No page should combine unrelated editing and browsing simply because both are technically related.

Path picker is invoked when needed and dismissed when selection is complete.

---

# 12. State invalidation rules

The workflow must be data-driven, not a manually clicked wizard.

Examples:

- add/remove project path → Scope changed → processing delta required;
- metadata stillness check passes → existing fingerprint evidence remains valid;
- file metadata/content changed → affected findings become stale;
- Target holding added/verified → Review/Plan may improve without rehashing source;
- Backup verification changes → Certification recalculates;
- new duplicate enters corpus → Target plan does not change if content already established;
- source becomes unavailable → certification cannot advance unless existing evidence remains sufficient under policy.

The UI communicates why a stage changed state.

---

# 13. Minimum intelligence engine

Before any AI-style recommendations, implement deterministic corpus intelligence.

Required first analyses:

1. exact content duplicates by SHA-256;
2. unique bytes/files per project/path;
3. Target coverage by authoritative content identity;
4. Backup coverage by Target content identity;
5. changed-since-last-observation / changed-since-target;
6. conflict detection for same intended target path with different content;
7. reclaimable source capacity estimate after certification;
8. required new Target bytes;
9. required Backup bytes;
10. project overlap by path and by content;
11. project-exclusive remainder;
12. project consolidation/split suggestions from deterministic overlap thresholds.

Only after these results are inspectable should natural-language recommendation generation sit on top.

---

# 14. Data entities — rational minimum

## Content

Authoritative content identity.

## Observation

A witnessed file/path/volume state at a time and locator.

## Project

User-defined scope of paths.

## ProjectPath

Membership relationship only.

## TargetHolding

Verified centralized SOT copy of Content.

## BackupHolding

Verified independent protection of a TargetHolding/Content.

## Finding

Deterministic conclusion from corpus state, scoped globally or to a project.

## Plan

Versioned immutable proposed action set derived from a specific corpus snapshot.

## Action

Actual execution record against a plan item.

## Certification

Evidence-backed statement that a source/path is safe to retire.

These entities are the conceptual schema authority. Existing implementation tables can migrate toward this model incrementally.

---

# 15. Non-negotiable UX rules

- one project omnibox globally in the Projects workspace;
- no project dropdown selector;
- inline project editing on Enter/blur;
- no permanent file explorer embedded beside project metadata;
- path picker appears only when adding/changing scope;
- one primary forward action per stage;
- processing never blocks UI;
- every long-running operation shows exactly what is happening now;
- worker/device activity is visible globally;
- findings explain meaning, not merely counts;
- plans are generated from findings/corpus evidence;
- source is never deleted by execution;
- certification is evidence, not deletion;
- Target and Backup state are first-class corpus knowledge;
- already-established content is never recopied merely because another project encounters it;
- all recommendations must be drillable to deterministic supporting evidence.

---

# 16. Implementation order

Do not attempt the entire workflow in one release.

## Phase A — UX + orchestration foundation

- Projects workspace with one omnibox;
- project stage rail;
- Scope card + invoked path picker;
- global Activity page;
- remove Fingerprinting as primary top-level mental model;
- Processing stage consumes current 6.9 corpus/fingerprint infrastructure.

## Phase B — deterministic Review intelligence

- exact duplicates;
- unique/redundant bytes;
- Target coverage model;
- required Target capacity;
- conflicts;
- project/content overlap;
- Corpus explorer/query.

## Phase C — plan model

- immutable plan versions;
- target placement rules;
- no-op items for already-established Target content;
- projected source/target/backup impact;
- approval gate.

## Phase D — execution

- source → target copy;
- content verification;
- target → backup;
- backup verification;
- retry/error/reconciliation;
- no source deletion.

## Phase E — certification + project rationalization

- safe-to-retire certification;
- stale certification invalidation;
- project overlap recommendations;
- transfer/split/consolidate project scopes;
- cold-storage/retirement reporting.

---

# 17. Definition of success

The product is coherent when a new operator can understand it without knowing the database schema or implementation terminology:

1. choose or create a project;
2. add the paths that belong in its scope;
3. process what the corpus does not already know;
4. review what the system learned and recommends;
5. approve a plan that establishes only missing unique content in Target and Backup;
6. verify completion;
7. certify redundant sources as safe to retire;
8. query the corpus at any time to understand what exists, where, and why.

That is the rational minimum SOT product.
