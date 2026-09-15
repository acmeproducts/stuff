# SOT Turn 02 Pre-Base Plan

**Stage:** `pre-base`  
**Status:** ACTIVE GOVERNING PLAN — CLEAN LINEAGE — INFERENCE FIRST  
**Date:** 2026-09-15

## 1. Product objective

SOT is a global, persistent single source of truth for a storage estate spanning local volumes, external volumes, cloud-synchronised folders, WSL-visible storage, and device folders reachable through the owner's network/storage topology.

The product is not a fingerprint browser and indexing is not the outcome.

The required outcome is:

`Discover → Fingerprint → Infer → Propose → Verify → Consolidate`

SOT must turn storage evidence into an actionable consolidation proposal that answers:

- what unique content exists;
- every known placement of that content;
- which placement should be canonical;
- which additional placement(s) are required for protection;
- which placements are proven redundant;
- which cases cannot safely be decided automatically;
- how many bytes can be reclaimed;
- what the resulting estate would look like after the proposal is executed.

Commercial/project-oriented duplicate scans are not the target mental model. SOT maintains one global content truth across the estate.

## 2. Clean-lineage rule

Turn 02 does not rehabilitate the previous implementation.

Historical code, databases, generated HTML, installers, fingerprint output, and deployed runtime are **research evidence only** unless a component is later independently proven against this plan and deliberately adopted.

No previous artifact is the implementation baseline merely because it once ran or passed a mechanical gate.

The new implementation must be designed backward from the required consolidation answer.

## 3. Runtime architecture

The intended production split remains:

- **WSL/private tailnet side:** persistent engine, durable database, storage adapters, fingerprinting, inference, verification, execution.
- **GitHub Pages:** static client only.
- **Tailscale:** private network path between client/devices and the WSL service; the data service is not made public merely to serve the client.
- **Browser:** presentation/control surface, never the authoritative job or evidence state machine.

This architecture is a target contract, not permission to salvage the old runtime.

## 4. Domain contract

### 4.1 Content object

A content object is identified by a cryptographic content fingerprint. A path is not identity.

### 4.2 Placement

A placement is one observed instance of a content object and records at minimum:

- content identity;
- storage authority/device/volume;
- path;
- size;
- availability/observation evidence;
- storage role and relevant protection attributes.

### 4.3 Decision

Every placement participating in consolidation must resolve to one of:

- **KEEP** — selected canonical placement;
- **PROTECT** — additional independent placement required by protection policy;
- **REMOVE** — proven redundant placement eligible for later controlled cleanup;
- **REVIEW** — insufficient evidence or policy ambiguity prevents a safe deterministic decision.

`REMOVE` is a proposal state. It does not itself authorize deletion.

### 4.4 Canonical selection

Discovery order, path sort order, database row order, and "first copy found" may never determine canonical placement.

Canonical placement is selected only from explicit storage roles/policy and deterministic evidence. If those rules do not establish a safe answer, the decision is `REVIEW`.

### 4.5 Protection

A protection copy is not duplicate waste. Required independent protection placements are classified `PROTECT` and excluded from reclaimable bytes.

Protection policy must be explicit and testable. Until a policy proves a placement redundant, uncertainty resolves to `REVIEW`, never `REMOVE`.

## 5. Required first useful output

The first owner-useful SOT surface is a consolidation proposal, not a fingerprint table.

At minimum it reports:

- total observed bytes and placements;
- unique content bytes and content-object count;
- redundant bytes and duplicate-group count;
- bytes safely proposed for reclamation;
- bytes/items requiring review;
- proposed canonical/protection estate;
- actions required to move from current estate to proposed estate;
- rationale/evidence for every KEEP / PROTECT / REMOVE / REVIEW decision.

Raw fingerprint rows may exist for diagnostics but are never the primary product result.

## 6. Turn 02 first implementation target — controlled inference fixture

The first implementation target is deliberately small and synthetic. It must not operate on the owner's real storage estate.

Create a controlled fixture representing three storage authorities/volumes and roughly 20–30 files with predetermined truth, including:

- unique content;
- two-copy exact duplicates;
- three-or-more-copy exact duplicates;
- a canonical + required protection copy + redundant copy;
- same filenames with different content;
- same content under different filenames/paths;
- unavailable/stale placement evidence;
- a deliberately ambiguous case that must become REVIEW.

The fixture definition must declare the expected content identities, placements, classifications, reclaimable bytes, and resulting proposed estate before the engine is run.

## 7. Turn 02 inference engine

Against the controlled fixture, implement only enough clean engine to:

1. discover fixture placements;
2. compute cryptographic content identity;
3. group placements globally by content identity;
4. apply explicit canonical/protection policy;
5. classify every relevant placement KEEP / PROTECT / REMOVE / REVIEW;
6. calculate reclaimable bytes excluding KEEP, PROTECT, and REVIEW;
7. produce a deterministic machine-readable consolidation plan;
8. produce a concise owner-readable summary of the same plan.

No copy, move, rename, or delete operation is in this gate.

No AI/LLM is required for deterministic exact-content inference.

## 8. Acceptance gate

Turn 02 does not advance because fingerprinting completed.

It advances only when the engine's complete consolidation plan exactly matches the fixture's predetermined truth.

Mandatory checks:

- every fixture content object is identified correctly;
- every placement is accounted for;
- every classification matches expected truth;
- protection copies are never counted as waste;
- ambiguous/insufficient evidence becomes REVIEW;
- reclaimable-byte arithmetic is exact;
- repeated runs over identical evidence produce byte-for-byte equivalent decision content apart from explicitly non-semantic timestamps/IDs;
- no filesystem mutation occurs;
- the result explains why each decision was made.

A fingerprint dump without these decisions is a failed gate.

## 9. Failure protocol

A failed gate is not patched forward.

Required sequence:

1. stop;
2. identify the root cause;
3. preserve failure evidence;
4. add the rejected assumption/approach to `SOT-GRAVEYARD.md` when applicable;
5. update this authoritative plan if the product/architecture contract changes;
6. return to the last accepted baseline;
7. rebuild the governed delta;
8. rerun the complete gate.

Rejected candidates are evidence only and never become ancestors.

## 10. Progression after the inference gate

Only after the controlled inference fixture passes:

1. replace fixture discovery with clean real storage adapters;
2. prove discovery/fingerprinting against bounded non-destructive test folders;
3. feed that evidence through the already-qualified inference contract;
4. expose the qualified result through the static GitHub Pages client;
5. add persistent incremental reconciliation so the global SOT remains current;
6. add verified copy/protection actions;
7. only then add controlled cleanup/retirement execution.

Real estate ingestion does not precede inference qualification.

## 11. Deferred

Until the deterministic consolidation path is qualified, defer:

- AI/LLM recommendations;
- semantic/near-duplicate detection;
- tags;
- dashboards unrelated to consolidation decisions;
- project-oriented owner workflows;
- bulk destructive operations;
- certification/reporting beyond what is necessary to prove the consolidation plan.

## 12. Governance and repository discipline

The stage chain remains:

`pre-base → base → pre-ship → ship → post-ship`

Before each repository write, fetch current `main` and current target blob SHA. Preserve unrelated work.

The Graveyard is binding negative specification. The Plan is binding positive specification.

The next coding action after this governance update is the controlled inference fixture and deterministic inference engine described above — not storage-picker repair, old database analysis, UI reconstruction, CORS work, or real-volume indexing.
