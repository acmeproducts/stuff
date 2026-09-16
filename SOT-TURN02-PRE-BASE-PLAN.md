# SOT Turn 02 Pre-Base Plan

**Stage:** `pre-base`  
**Status:** ACTIVE GOVERNING PLAN — CLEAN LINEAGE — OBSERVABLE ESTATE ANALYSIS  
**Date:** 2026-09-15

## 1. Product objective

SOT is a global, persistent single source of truth for a storage estate spanning local volumes, external volumes, cloud-synchronised folders, WSL-visible storage, and device folders reachable through the owner's network/storage topology.

The product is not a fingerprint browser and indexing is not the outcome. The required outcome is:

`Discover → Fingerprint → Infer → Propose → Verify → Consolidate`

SOT must answer what unique content exists, every known placement, canonical and protection placement, proven redundancy, unresolved cases, reclaimable bytes, and the proposed resulting estate.

## 2. Clean-lineage and failure rule

Historical failed code, databases, generated HTML, installers and runtime artifacts are research evidence only. A rejected candidate never becomes the ancestor of its correction.

Failed gate sequence: stop → preserve evidence → record rejected assumption in Graveyard → update this Plan when the contract changes → rebuild from the last governed clean baseline → rerun the complete gate.

The currently published Turn 02 real-storage surface is rejected as a product baseline because it advanced real-estate/UI work before the governed inference/operations contract was complete and then required patch-forward corrections. It remains evidence only.

## 3. Runtime architecture

- **WSL/private tailnet:** persistent engine, durable SQLite evidence/job/event state, storage adapters, fingerprinting, inference, verification and later execution.
- **GitHub Pages:** static presentation/control client only.
- **Tailscale:** private network path between client and WSL service.
- **Browser:** never owns authoritative job state. Closing, refreshing, navigating or inspecting data must not interrupt backend work.

## 4. Domain and safety contract

### Content object
Immutable logical content identity established initially by strong cryptographic byte fingerprint. Path and filename are not identity.

### Placement
One observed instance of content with storage authority, path, size, availability/evidence revision, role and failure-domain/protection attributes.

### Decision
Every placement resolves to **KEEP**, **PROTECT**, **REMOVE**, or **REVIEW**. REMOVE is a proposal only and never deletion authorization.

### Canonical and protection
Discovery order, row order, filename and path ordering may never choose canonical content. Canonical selection requires explicit policy/evidence. Required independent protection copies are PROTECT, never duplicate waste. No REMOVE decision is permitted unless required independent protection remains established. Uncertainty becomes REVIEW.

## 5. Controlled inference gate

Before real-estate qualification, the clean engine must pass a predetermined synthetic estate of roughly 20–30 placements across at least three storage authorities containing unique files, 2-copy and 3+-copy duplicates, canonical/protection/redundant copies, same-name/different-content, same-content/different-path, stale/unavailable evidence and deliberate ambiguity.

Expected content identities, placements, decisions and reclaimable-byte arithmetic are declared before execution. Pass requires exact agreement, deterministic repeat results, complete rationale and zero filesystem mutation. A fingerprint dump or self-referential expected output is failure.

## 6. Storage selection contract

The owner-facing storage selector is a single canonical three-panel component:

**Available Volumes | Folders | Selected Folders**

It is used consistently for storage roles. Selection uses true Available ↔ Selected semantics. Available-volume discovery is shared and cached; ordinary selection/save does not trigger storage rescans. Folder assignment is metadata-only. Invalid assignments are rejected when assigned; actual availability is revalidated at the operation boundary.

## 7. Durable non-blocking job architecture

Analysis is a backend-owned durable job, not a browser request lifecycle. The UI remains fully usable during discovery, enumeration, hashing and inference.

Required controls:

- Start
- Pause
- Resume
- Stop
- Restart

Pause and stop are cooperative and explicit. Restart creates a new evidence/job revision; it does not silently overwrite or corrupt the last completed evidence set. A browser reload or disconnect does not terminate work.

Independent storage sources may be scanned concurrently. Shared database mutation must be coordinated transactionally so parallel workers cannot create contradictory evidence or UI state.

## 8. Live analysis telemetry

The Analyze surface must expose continuously updated estate and per-source state. At minimum show:

- total files and bytes discovered/expected where knowable;
- scanned files and bytes;
- remaining files and bytes where knowable;
- percentage/progress;
- unique content count/bytes;
- duplicate-group count and duplicate bytes;
- REVIEW count/bytes;
- safely reclaimable bytes;
- elapsed time and throughput;
- current source/folder/file activity;
- warnings/errors/skipped/unreadable counts.

The primary owner visual is a compact proportional estate-analysis strip rather than large disconnected metric cards. Per-source rows show their own state and progress.

Activity must be visually unmistakable: queued, enumerating, hashing, inferring, paused, stopping, stopped, complete and failed are distinct explicit states.

## 9. Connection contract

Connection is automatic using the persisted backend endpoint. A manual Connect button is not part of the normal workflow.

A continuously visible health indicator uses:

- **GREEN** — backend reachable and healthy with current heartbeat;
- **YELLOW** — degraded, stale heartbeat, reconnecting, or backend reports warning state;
- **RED** — disconnected or backend health failure.

The client retries automatically with bounded backoff and updates the indicator immediately. Connection failures never disappear silently.

## 10. Persistent event logging — no silent failures

Logging is a product requirement and part of qualification. Every meaningful operation produces a durable structured event in SQLite, including positive and negative outcomes.

Required events include backend startup, connection/heartbeat state, job creation/start/pause/resume/stop/restart/completion/failure, source scan start/progress/completion, folder enumeration, file hashing outcomes, unreadable/skipped files, retries, storage availability changes, database commits/rollbacks, inference start/completion and decision-summary creation.

Every event records at minimum timestamp, severity, event type, job/source identity where applicable, human-readable message and structured detail where useful.

Exceptions may not be swallowed. Every caught operational failure must either be surfaced as an API error and/or written to the durable event log. There are no silent failures.

The UI provides a searchable/filterable Activity Log with severity, time, job, source and message. Positive INFO events and WARNING/ERROR events are both visible.

## 11. Database/evidence browser

The database remains inspectable while background analysis runs. The Database surface provides Omnisearch and filters over content objects/placements/evidence without blocking the scanner.

At minimum the owner can search/filter by storage source, path, content hash, duplicate group/cardinality, decision, size and evidence/scan state. Selecting a content object shows all known placements and the evidence/rationale behind its classification.

Reads must use short-lived/read-safe database access so inspection cannot block worker progress for material periods.

## 12. Owner-facing information architecture

Top-level application surfaces:

1. **Estate** — registered storage, capacity/index state and governed three-panel storage selector.
2. **Analyze** — background job controls, live estate telemetry and per-source activity.
3. **Database** — searchable evidence/content/placement browser.
4. **Plan** — consolidation proposal with KEEP/PROTECT/REMOVE/REVIEW rationale.
5. **Activity** — durable positive/negative event log.

The header contains compact global status and the red/yellow/green backend health indicator. Navigation and database inspection remain usable during all analysis states.

## 13. Required first useful consolidation output

At minimum report total observed bytes/placements, unique content bytes/count, redundant bytes/duplicate groups, safely reclaimable bytes, REVIEW bytes/items, proposed canonical/protection estate, required actions and rationale/evidence for every decision.

## 14. Qualification sequence

1. Rebuild the clean inference fixture and prove the decision/safety contract.
2. Add durable job/event schema and prove pause/resume/stop/restart semantics against bounded synthetic work.
3. Prove concurrent source workers cannot corrupt evidence/job state.
4. Prove telemetry arithmetic against known fixture totals.
5. Prove every injected operational failure creates visible API/job state plus a durable log event.
6. Prove database/evidence reads remain usable while analysis runs.
7. Add bounded real-storage adapters and the canonical three-panel selector.
8. Expose the qualified backend through the static Pages client with automatic health/reconnect.
9. Only after these gates pass, hand the owner the application test URL.

Internal fixture/qualification pages are not owner deliverables. The owner tests the application.

## 15. Deferred

Until the deterministic consolidation and operations path is qualified, defer AI/LLM recommendations, semantic/near-duplicate detection, tags unrelated to consolidation, bulk destructive operations and certification/reporting beyond qualification needs.

## 16. Governance

Stage chain remains:

`pre-base → base → pre-ship → ship → post-ship`

Before every repository write, fetch current `main` and the current target blob SHA. Preserve unrelated work. Plan is binding positive specification; Graveyard is binding negative specification.

The next implementation action is a clean rebuild satisfying Sections 5–14. Do not patch the rejected current Pages/backend candidate forward.
