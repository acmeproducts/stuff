# SOT Architecture Plan

**Status:** AUTHORITATIVE PRODUCT / ARCHITECTURE DIRECTION  
**Updated:** 2026-08-29  
**Repository:** `acmeproducts/stuff`  
**UI ancestor:** `session-manager-v3.html` / ProjectChat interaction shell  
**Lineage model:** TalkBridge-style governed turn/stage chain  

## 0. Turn / stage governance — the chain is the law

SOT now starts a new governed artifact lineage. Every development turn follows exactly this sequence:

`pre-base -> base -> pre-ship -> ship -> post-ship`

A new turn begins only after the prior turn reaches `post-ship` and that stage is accepted as the source for the next turn's `pre-base`.

### 0.1 Turn 01 artifact chain

| Turn · Stage | Purpose | Status | Artifact |
|---|---|---|---|
| 01 · pre-base | Frozen starting point for the new SOT portal lineage | Accepted recovery anchor | `SOT-turn01-pre-base.html` |
| 01 · base | First small governed functional delta from pre-base | Rebuild required after rejected Base-10/Base-11 mount-authority approach | `SOT-turn01-base.html` |
| 01 · pre-ship | Next independently testable delta from base | Not started | `SOT-turn01-pre-ship.html` |
| 01 · ship | Candidate release built only from gated pre-ship | Not started | `SOT-turn01-ship.html` |
| 01 · post-ship | Post-release hardening / final turn candidate | Not started | `SOT-turn01-post-ship.html` |

Turn 02 begins by taking the accepted bytes of `SOT-turn01-post-ship.html` and emitting them as `SOT-turn02-pre-base.html` before any Turn 02 change is made.

### 0.2 Naming is a hard gate

Each build declares its turn and stage before implementation. A build emitted under the wrong filename fails qualification on naming alone.

Canonical naming pattern:

`SOT-turnNN-STAGE.html`

where `STAGE` is exactly one of:

- `pre-base`
- `base`
- `pre-ship`
- `ship`
- `post-ship`

No `final`, `latest`, `fixed`, `v2`, `candidate2`, temporary wrapper, or alternate test filename becomes part of this lineage.

### 0.3 No patch-forward from a failed stage

A failed owner/device gate is failed evidence, not a new baseline.

The recovery rule is:

1. identify the declared clean source stage;
2. restore/copy those exact bytes;
3. rebuild only the scoped delta;
4. run mechanical qualification;
5. publish the same canonical stage filename;
6. read it back and verify exact content;
7. hand off only what still requires device/user testing.

Do **not** patch the failed candidate forward. This is the primary reason for maintaining the five-stage chain.

### 0.4 Testing is expensive; builder owns pre-flight

Before any artifact is handed off for owner testing, the builder must prove everything that can be proven mechanically.

At minimum:

- verify the exact source artifact and source blob/commit used;
- verify the target artifact filename matches the declared turn/stage;
- syntax-check every executable inline script in the complete final HTML;
- run relevant contract/unit/integration/harness tests;
- verify required UI markers/IDs and backend contract markers;
- verify no rejected architecture has reappeared;
- publish through the normal repository path only;
- read the published artifact back from the exact resulting commit/blob;
- byte-verify when the stage is intended to be an exact copy/rollback;
- state clearly what is mechanically proven and what remains for owner/device testing.

Owner testing is reserved for behavior that static checks, automated tests, and read-back cannot establish: actual viewport behavior, touch interaction, perceived responsiveness, real-device storage mounting, and end-to-end operational judgment.

### 0.5 Rules prevent harm, not progress

Governance rules exist to prevent regressions, accidental mutation, untestable releases, and patch-forward failure chains. If a rule's literal wording makes its own safety objective impossible, the conflict must be surfaced explicitly and resolved according to the rule's intent rather than silently bypassed or used as an excuse to stall.

### 0.6 Every stage has one source and one target

Before coding a stage, record:

- **Source artifact** — exact prior gated stage.
- **Target artifact** — exact current-stage filename.
- **Scope** — the small set of behaviors allowed to change.
- **Protected behavior** — what must remain byte/functionally unchanged where practical.
- **Mechanical gate** — what the builder must prove before handoff.
- **Owner gate** — only what requires actual user/device judgment.

This keeps a stage small enough to diagnose and roll back cheaply.

### 0.7 Pre-base is a frozen recovery anchor

`pre-base` is not a scratch file. It is the clean starting artifact for the turn.

Once Turn 01 implementation starts, `SOT-turn01-pre-base.html` is frozen. If `base`, `pre-ship`, `ship`, or `post-ship` fails, recovery always returns to the appropriate prior accepted stage, never to an accumulated failed candidate.

### 0.8 Stage intent

The five stages are intentionally generic rather than tied forever to a particular feature type:

- **pre-base** — exact clean turn starting point.
- **base** — first small independently testable delta.
- **pre-ship** — second small independently testable delta.
- **ship** — integrated release candidate after prior gates.
- **post-ship** — final hardening/observability/corrections for the turn, still governed by rollback discipline.

For Turn 01, the exact feature allocation will be declared before implementation rather than forcing a large all-at-once build.

### 0.9 Turn 01 Base rollback correction — volume authority

Base-10 and Base-11 are rejected evidence and are not valid implementation ancestors. Both candidates introduced a stricter WSL mount/readability validator as a prerequisite for accepting a Windows volume. That architectural choice regressed behavior already proven by earlier SOT lineage: Windows volumes were discovered dynamically and surfaced on the fly.

The authoritative correction is rollback-first:

1. Return to the accepted clean Turn 01 lineage rather than modifying Base-10 or Base-11.
2. Recover the previously proven dynamic Windows volume discovery model as the authority for what volumes SOT can present.
3. Source, Target, and Backup must consume the same discovered available-volume inventory.
4. A newly introduced Node/WSL mount-shape or root-directory enumeration test must **not** become an independent authority that hides a Windows-readable volume that the proven discovery layer reports as available.
5. Filesystem access required for an actual operation must still be validated at the operation boundary. Failure to access a selected volume is an actionable availability/error condition; it is not permission to silently remove that volume from discovery.
6. The next Turn 01 Base candidate must be rebuilt from the accepted pre-base/clean integration lineage with only this governed storage-selection delta. No Base-10/Base-11 generated artifact, mount validator, or installer becomes a build input.
7. Mechanical qualification must explicitly prove that the dynamic inventory remains intact and that Source, Target, and Backup are all driven by that same inventory before owner testing.

Current accepted runtime after automatic rollback remains Base-9. That runtime fact is recovery evidence, not authorization to treat Base-9-generated storage experiments as the source for the new Base implementation.

---

## 1. Governing product model

SOT is a centralized storage source-of-truth system composed of independent project work units.

The UI should inherit the useful structural pattern from `session-manager-v3.html`: a persistent left project rail and a persistent right workspace. It must **not** inherit Session Manager's arbitrary movable-session model.

For SOT:

- **Project cards are independent work units.**
- **Tabs are fixed views of a project lifecycle, not independent objects.**
- Project tabs are not draggable, movable between projects, or reorderable.
- Project cards may be reorderable for user organization, but project order has no workflow meaning.
- All projects ultimately feed one centralized SOT database, scheduler, status model, and Master Plan.
- Project processing remains independent and non-blocking: one project may index while another is reviewed, planned, or executed.

## 2. Primary UI shell

```text
+------------------------------------------------------------------+
| SOT              OMNISEARCH                                  Gear |
+----------------------+-------------------------------------------+
| SOT                  | GLOBAL SOT WORKSPACE                      |
|  global status       | Overview | Master Plan | Activity |       |
|                      | Insights                                  |
| Project A            |                                           |
|  status / metrics    | -- OR, when a project is selected --      |
|                      |                                           |
| Project B            | Scope | Index | Plan | Execute | Insights |
|  status / metrics    |                                           |
|                      | Selected project working surface           |
| Project C            |                                           |
|                      |                                           |
| + Project            |                                           |
+----------------------+-------------------------------------------+
```

The left rail is the orchestration/status surface. The right side is the selected SOT or project working surface.

There is no global wizard, stage rail, bottom-of-page progression control, or navigation that hides the project list as part of normal project work.

## 3. The global SOT card

A special, permanent **SOT** card is pinned above all project cards. It is not a project and cannot be moved or deleted.

It provides system-wide rollup information such as:

- number of projects;
- projects indexing / executing / paused / failed;
- projects needing attention;
- total indexed storage;
- potential recoverable storage;
- cross-project conflicts;
- database health;
- scheduler health;
- Master Plan state.

Selecting the SOT card opens the global workspace rather than a project workspace.

Recommended global tabs:

1. **Overview** — centralized status and health.
2. **Master Plan** — authoritative combined executable intent.
3. **Activity** — cross-project job and execution history.
4. **Insights** — global analytics and inference-assisted interpretation.

Global Pause/Stop controls, where appropriate, belong at this level.

## 4. Project cards

The project card is the primary project object. It should answer, without opening the project:

1. What project is this?
2. What is it doing now?
3. Is anything wrong?
4. Does it need user attention?

A card should expose compact live information such as:

```text
Photos
3.8 TB | 1.2M files
INDEXING 72%                         Pause Stop Menu
Plan: stale                          Exceptions: 3
```

Project cards retain direct operational controls such as Play/Pause/Stop and an administrative context menu. Routine lifecycle navigation does not belong on the card; it belongs in the fixed project tabs.

Recommended project context menu:

- Rename
- Duplicate configuration
- Pause / Resume
- Re-index
- Export project
- Archive project
- Delete project

Renaming is inline/non-navigating. Selecting or renaming a project must never unexpectedly move the user to another application context.

## 5. Fixed project tabs

Every project has exactly five fixed working surfaces:

### 5.1 Scope

Defines what the project owns and where its results may go.

Includes:

- Source selection;
- Target selection;
- Backup selection;
- project definition / metadata.

**Source, Target, and Backup must all be selected from backend-discovered available volumes.** Target and Backup are project-owned configuration, not global free-text mount points.

The Source/Target/Backup selector should use the established volume -> folders -> selected-folders interaction model.

The available-volume list is a shared SOT resource and must preserve the proven dynamic discovery behavior. Source, Target, and Backup do not get separate or stricter definitions of volume availability. Operational readability/writability is validated when the relevant operation is attempted and surfaced as an explicit availability/error state rather than by silently suppressing a dynamically discovered volume.

### 5.2 Index

Contains scanning, indexing and fingerprinting operations and evidence.

Includes:

- live files/items read;
- bytes read;
- folder counts;
- fingerprints/content hashes;
- duplicate discovery;
- worker state;
- elapsed time;
- Pause/Resume/Stop;
- errors and retry state.

Indexing must remain non-blocking. Navigating to another project or tab does not stop the worker.

### 5.3 Plan

Shows the project-scoped proposed actions derived from indexed evidence.

Includes:

- findings;
- duplicate groups;
- conflicts;
- proposed file/content actions;
- destination implications;
- validation results;
- approve/revise controls;
- plan revision and evidence revision provenance.

A project plan is a **project-owned contribution to the centralized Master Plan**, not a disconnected plan document.

### 5.4 Execute

Executes an explicitly approved immutable project plan revision through the deterministic SOT execution engine.

Includes:

- approved revision being executed;
- queued/running/completed actions;
- live progress;
- errors;
- retry/recovery controls where valid;
- execution results and audit history.

Opening Execute without an approved valid plan is allowed. The surface should explain why execution is unavailable rather than forcing wizard progression.

### 5.5 Insights

Observational and analytical surface.

Includes:

- storage savings analysis;
- duplicate concentration;
- anomalies;
- historical trends;
- project summaries;
- inference-assisted explanations and recommendations.

Insights are never filesystem authority.

## 6. Tabs are views, not workflow gates

The five tabs are always available and always in the same order:

`Scope | Index | Plan | Execute | Insights`

They are not draggable, reorderable, transferable, closable, or user-created.

The UI must not force Scope -> Index -> Plan -> Execute as a wizard. The backend determines whether an operation is currently valid.

Tabs may show state badges, for example:

```text
Scope OK | Index 61% | Plan ! stale | Execute - | Insights 12
```

A user may inspect Insights while Index is running, inspect an old Plan while new evidence is generated, or inspect Execute before approval.

## 7. Project state vs project activity

These are separate concepts.

### Durable project state

Representative progression:

`Unconfigured -> Ready -> Indexed -> Planned -> Approved -> Executed`

This describes the durable validity/maturity of project artifacts.

### Current activity

Representative values:

`Idle | Indexing | Planning | Executing | Paused | Error`

Activity describes what a worker is doing now.

A project can therefore be durably `Indexed` while currently `Indexing` again because its source changed.

## 8. Revision and invalidation model

Downstream validity must be revision-based rather than a collection of fragile booleans.

Track at minimum:

- evidence revision;
- project plan revision;
- approval revision;
- execution revision / run identity.

Example:

```text
Evidence revision 14
Plan revision 8 (derived from Evidence 13)
Approval revision 8
Current Evidence 14
Result: Plan 8 is stale; replanning required.
```

Rules:

- Scope changes invalidate dependent indexed evidence/currentness.
- New evidence invalidates a Plan derived from an older evidence revision.
- Changing an approved Plan creates a new revision and invalidates the previous approval for the new revision.
- Execution remains bound to the exact approved revision with which it started.
- Invalidating currentness does not erase historical evidence, plans, approvals, or execution records.

## 9. Central Master Plan

The Master Plan is best treated as a **compiled artifact** generated from validated project plans and centralized constraints.

```text
Project A Plan --\
Project B Plan ----> validation + conflict resolution ---> MASTER PLAN
Project C Plan --/
```

The Master Plan is derived from the SOT database and must not become an unrelated manually maintained document that can drift away from database truth.

It provides the authoritative answer to:

> What exactly would SOT do if execution proceeded now?

Every Master Plan action retains project ownership and provenance.

## 10. Immutable execution contract

Execution consumes an immutable approved plan revision.

Example:

`Execute Project A / Plan Revision 8`

If the project is subsequently replanned, that produces Revision 9. A running Revision 8 execution does not silently mutate into Revision 9.

Execution records must retain enough provenance to identify:

- project;
- evidence revision;
- project plan revision;
- approval revision;
- Master Plan revision/snapshot where applicable;
- action identity;
- source/target/backup paths or content identities;
- result;
- timestamps;
- error/recovery state.

## 11. Cross-project conflicts are first-class

Centralization must detect interactions that independent project UIs cannot safely resolve alone.

Examples include:

- overlapping source trees;
- one project's Target inside another project's Source;
- multiple projects planning actions against the same content/path;
- Target and Backup resolving to the same physical volume when separation is required;
- destination capacity becoming insufficient;
- destination becoming unavailable;
- concurrent jobs contending for the same physical device.

Conflicts must surface on the global SOT card and in the Master Plan. They must not be buried only in logs.

## 12. Central scheduler, independent jobs

Projects own jobs; **SOT owns scheduling**.

Multiple projects may be active concurrently, but individual projects do not independently decide how aggressively to consume shared storage resources.

The scheduler should understand at least:

- physical/logical volumes;
- worker availability;
- jobs currently touching a volume;
- read/write contention;
- priorities;
- pause/stop state;
- execution locks and safety constraints.

Independent SSDs may be processed concurrently while multiple high-I/O jobs against one HDD may be serialized or throttled.

The scheduler must never block the UI.

## 13. Needs Attention queue

Every project can raise normalized attention conditions, for example:

```text
Photos      ! Plan stale
Videos      ! Worker failed
Archive     ! Target unavailable
Documents   OK
```

The global SOT card rolls these up as **Projects needing attention**.

Selecting that status should expose an actionable consolidated queue rather than requiring the user to inspect every project manually.

## 14. Omnisearch

Omnisearch is a global navigation and retrieval mechanism, not merely a text filter.

It should ultimately search across:

- projects;
- files and folders;
- content hashes/fingerprints;
- duplicate groups;
- plan actions;
- exceptions;
- activity/execution records.

Selecting a result should navigate directly to the relevant project, fixed tab, and object where possible.

Example:

`IMG_4837.CR3` -> `Photos / Insights / Duplicate Group 184`

## 15. Inference capability

SOT should support inference providers because management, analysis and planning can benefit materially from them.

Provider/model configuration belongs in the global Configuration/Gear surface. Existing repo patterns for Venice and OpenRouter should be reused where appropriate rather than inventing a second credential model.

Initial useful inference roles:

- explain duplicate groups and anomalies;
- summarize project health;
- interpret long activity/error histories;
- identify unusual storage patterns;
- compare cleanup/organization alternatives;
- propose project plans;
- answer natural-language questions over SOT evidence.

### Hard authority boundary

Inference is advisory/analytical only.

The required progression is:

`Inference -> structured proposal -> deterministic validation -> SOT Plan -> approval -> execution`

An LLM response never directly becomes a filesystem mutation. The SOT API, validation rules, Master Plan and execution engine remain authoritative.

Provider credentials must not be written into the centralized portable SOT database or GitHub SOT artifacts.

## 16. Backend ownership model

The centralized SOT database remains the source of truth.

Project-owned data includes:

- project identity/name;
- Source configuration;
- Target configuration;
- Backup configuration;
- indexing/evidence revisions;
- project plans and revisions;
- project approvals;
- project execution history;
- project attention conditions.

Global SOT-owned data includes:

- project registry;
- centralized content/fingerprint truth;
- duplicate/cross-project relationships;
- Master Plan;
- global scheduler;
- global conflicts;
- global status/health;
- global activity/audit trail.

## 17. UI ancestry: what to reuse and what not to reuse

### Reuse from Session Manager / ProjectChat

- persistent left project rail;
- independent project cards;
- persistent right workspace;
- responsive/mobile-friendly shell concepts;
- project selection behavior;
- project-card administrative context-menu pattern;
- prominent omnisearch pattern;
- inline non-navigating rename pattern;
- project ordering if useful for user organization.

### Do not transplant

- arbitrary user-created session tabs;
- moving tabs between projects;
- tab drag/reorder mechanics;
- tab-specific assignment semantics;
- chat/session lifecycle concepts that do not map to SOT;
- workflow-as-navigation or wizard progression.

## 18. Explicitly rejected architecture

The following model is rejected and must not be restored as the governing SOT UI or storage authority:

- global stage/wizard rail;
- bottom-of-page progression controls;
- a selected-project workflow that hides or effectively leaves project management;
- redundant `PROJECT` header/subtext when already operating in project context;
- hidden Review navigation;
- inert Projects navigation requiring a separate Back control;
- Target/Backup configured through global/free-text mount points;
- project processing that blocks navigation or other projects;
- treating fixed lifecycle surfaces as movable Session Manager tabs;
- replacing proven dynamic Windows volume discovery with a stricter WSL mount/readability gate that can suppress a Windows-readable volume;
- treating Base-10 or Base-11 as a baseline after their owner/mechanical gate failures.

## 19. Architectural summary

```text
                         CENTRAL SOT
              database | scheduler | Master Plan
                  conflicts | activity | status
                             |
          +------------------+------------------+
          |                  |                  |
      PROJECT A          PROJECT B          PROJECT C
          |                  |                  |
 Scope Index Plan     Scope Index Plan     Scope Index Plan
 Execute Insights     Execute Insights     Execute Insights
          |                  |                  |
          +------------------+------------------+
                             |
                       EXECUTION ENGINE
```

The governing mental model is:

- **Left = orchestration and status.**
- **Right = selected SOT/project working surface.**
- **SOT card = system-wide working surface.**
- **Fixed tabs = views, not workflow gates.**
- **Projects = independent work units.**
- **Database = truth.**
- **Master Plan = compiled executable intent.**
- **Scheduler = centralized resource authority.**
- **AI = analyst/advisor, never filesystem authority.**
