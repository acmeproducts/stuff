# SOT Turn 02 Pre-Base Plan

**Stage:** `pre-base`  
**Status:** ACTIVE GOVERNING PLAN — CLEAN LINEAGE — OBSERVABLE ESTATE ANALYSIS  
**Date:** 2026-09-15

## 1. Product objective
SOT is a global persistent single source of truth for a storage estate. Its Turn 02 product boundary is analysis and an evidence-backed recommended consolidation plan:

`Discover → Fingerprint → Cross-reference → Infer → Plan`

Turn 02 does **not** copy, move, rename, quarantine, delete, purge, or otherwise mutate owner files. `REMOVE` means recommended removal only. How a plan is actioned is explicitly deferred.

## 2. Clean-lineage and failure rule
Historical failed code, databases, generated HTML, installers and runtime artifacts are research evidence only. A rejected candidate never becomes the ancestor of its correction.

Failed gate sequence: stop → preserve evidence → record rejected assumption in Graveyard → update this Plan when the contract changes → rebuild from the last governed clean baseline → rerun the complete gate.

The prior Turn 02 clean-3 candidate is rejected because it reused an incompatible historical SQLite database without a schema/version boundary and failed at startup (`no such column: job_id`). It is evidence only.

## 3. Runtime architecture
- **WSL/private tailnet:** persistent engine, versioned SQLite evidence/job/event state, storage adapters, fingerprinting, cross-reference and inference.
- **GitHub Pages:** static presentation/control client only.
- **Browser:** never owns authoritative job state. Closing, refreshing, navigating or inspecting data must not interrupt backend work.
- **No filesystem mutation:** the engine is read-only with respect to registered owner storage throughout Turn 02.

## 4. Frozen evidence schema contract
### 4.1 Placement/file observation
Every observed file placement records at minimum:
- `placement_id` — stable identity for this observed placement;
- `content_id` — identity shared by byte-identical content after hashing;
- `source_id` and storage authority/volume;
- failure domain;
- full filename including extension;
- normalized extension;
- full path;
- created/birth time where the filesystem exposes it;
- modified time;
- exact size in bytes;
- scanned date/time;
- fingerprint (SHA-256 initially);
- lifecycle status;
- plan recommendation;
- disposition;
- evidence/scan revision;
- last verified date/time;
- availability/evidence state;
- error state/detail;
- duplicate group ID and duplicate cardinality after post-processing;
- role where explicitly governed;
- plan/decision rationale.

### 4.2 Lifecycle status
Status is strictly the analysis lifecycle:

`NONE → IN_PROCESS → HASHED → PLANNED → COMPLETED`

Errors and availability are orthogonal evidence fields and do not become lifecycle states. `COMPLETED` means SOT completed analysis/planning for the record; it never means a filesystem recommendation was executed.

### 4.3 Plan
Plan is the recommended action only:
- `KEEP`
- `PROTECT`
- `REMOVE`
- `REVIEW`

`REMOVE` is never deletion authorization.

### 4.4 Disposition
Disposition is retained as a separate field for future action accounting. In Turn 02 it remains `NONE`/unresolved because plan execution is out of scope.

### 4.5 Content object
A content object represents immutable byte identity. One file existing in six locations is one content object with six placements. Filename/path are not content identity.

### 4.6 Evidence history
Observations are revisioned rather than destructively overwritten. A later scan seeing four placements after an earlier scan saw five must remain distinguishable from never having observed the fifth placement.

## 5. Duplicate cross-reference — required post-processing
After fingerprints are available, SOT builds a derived duplicate cross-reference for every content object with cardinality greater than one. It is not redundantly embedded as a serialized list in each placement row.

Each duplicate group exposes:
- stable duplicate group ID;
- fingerprint/content ID;
- cardinality;
- content size;
- total physical bytes represented by all placements;
- excess duplicate placement bytes;
- every placement ID;
- every filename and complete path;
- source/volume and failure domain for every placement;
- role where defined;
- per-placement plan and rationale once inference completes;
- evidence revision.

Selecting any placement must allow immediate traversal to all byte-identical filenames/paths. Selecting a duplicate group must expose the complete placement xref. Historical group membership remains attributable to its evidence revision.

## 6. Canonical/protection inference contract
Discovery order, row order, filename and path ordering may never silently choose canonical content. Required independent protection copies are `PROTECT`, never duplicate waste. If policy/evidence cannot establish a safe recommendation, use `REVIEW`.

Turn 02 inference produces recommendations only. It performs no action against owner files.

## 7. Controlled inference gate
Before real-estate qualification, the engine must pass a predetermined synthetic estate of roughly 20–30 placements across at least three storage authorities containing unique files, 2-copy and 3+-copy duplicates, same-name/different-content, same-content/different-path, changed versions, stale/unavailable evidence and deliberate ambiguity.

Expected content identities, xrefs, lifecycle states, recommendations and byte arithmetic are declared independently before execution. Pass requires exact agreement, deterministic repeat results, complete rationale and zero filesystem mutation.

## 8. Storage selection contract
The owner-facing selector is one canonical three-panel component:

**Available Volumes | Folders | Selected Folders**

Selection uses true Available ↔ Selected semantics. Available-volume discovery is shared/cached; ordinary selection/save does not trigger storage rescans.

## 9. Durable non-blocking analysis jobs
Analysis is backend-owned and durable. Required controls are Start, Pause, Resume, Stop and Restart. Restart creates a new evidence revision. Browser reload/disconnect does not terminate work. Independent storage sources may scan concurrently; shared database mutation is transactional.

## 10. Live telemetry
Analyze exposes total/scanned/remaining files and bytes, unique content count/bytes, duplicate-group count and duplicate excess bytes, REVIEW count/bytes, recommended reclaimable bytes, elapsed/throughput, current source/folder/file, warnings/errors/skipped/unreadable counts, plus per-source state/progress.

`Reclaimable` means bytes currently recommended `REMOVE`; it is not a deletion count or executed savings.

## 11. Connection and logging
Connection is automatic from the persisted backend endpoint with continuously visible GREEN/YELLOW/RED health. Failures never disappear silently.

Every meaningful positive or negative backend operation creates a durable structured SQLite event with timestamp, severity, event type, job/source identity where applicable, message and structured detail. Exceptions may not be swallowed.

## 12. Database/evidence browser
The database remains inspectable while analysis runs. Omnisearch and filters cover filename, extension, path, source, fingerprint/content ID, duplicate group/cardinality, lifecycle status, plan, size, evidence revision, availability and errors. Content/group drill-down exposes all placements and rationale.

## 13. Owner-facing information architecture
1. **Estate** — registered storage and canonical three-panel selector.
2. **Analyze** — controls, telemetry and live activity.
3. **Database** — searchable placement/content/evidence browser.
4. **Plan** — recommended KEEP/PROTECT/REMOVE/REVIEW proposal and rationale.
5. **Activity** — durable positive/negative event log.

## 14. Schema/version boundary
Every database has explicit schema metadata and version. A clean-lineage schema may not silently open an incompatible historical database. Startup must either open the exact supported schema or create a new versioned database while preserving the incompatible predecessor as evidence. `CREATE TABLE IF NOT EXISTS` is not a migration strategy.

The installer must never destroy an older database to make a new candidate start.

## 15. Qualification sequence
1. Create the versioned schema from this frozen contract.
2. Prove startup against both a fresh environment and the known incompatible historical Turn 02 database without modifying that historical database.
3. Prove the controlled inference fixture including duplicate xref and lifecycle transitions.
4. Prove durable pause/resume/stop/restart and evidence revisions.
5. Prove concurrent source workers cannot corrupt evidence/job state.
6. Prove telemetry arithmetic.
7. Prove injected failures become visible durable events.
8. Prove database reads remain usable during analysis.
9. Prove bounded real-storage read-only adapters and the three-panel selector.
10. Expose the qualified backend through the static Pages client with automatic health/reconnect.
11. Only then hand the owner the application test URL.

Internal qualification surfaces are not owner deliverables.

## 16. Deferred
Deferred beyond Turn 02: all plan execution; copying; moving; renaming; quarantine; deletion/purge; disposition semantics beyond `NONE`; AI/LLM recommendations; semantic/near-duplicate detection; unrelated tagging.

## 17. Governance
Stage chain remains `pre-base → base → pre-ship → ship → post-ship`.

Before every repository write, fetch current `main` and current target blob SHA. Preserve unrelated work. Plan is binding positive specification; Graveyard is binding negative specification. Failed generated artifacts remain evidence only and are never patched forward.
