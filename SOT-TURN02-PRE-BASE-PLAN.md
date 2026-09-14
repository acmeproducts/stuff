# SOT Turn 02 Pre-Base Plan

**Stage:** `pre-base`  
**Status:** OWNER ALIGNMENT REQUIRED — DESIGN ONLY — NO IMPLEMENTATION AUTHORIZED  
**Date:** 2026-09-14

## 1. Purpose

Turn 02 is a recovery turn. The objective is not to add features. The objective is to get back to a small, understandable, persistent storage application that can be installed from WSL, used from the browser, survive browser closure, and complete one storage workflow correctly before any higher-level functionality is added.

The governing lesson from Turn 01 and the first Turn 02 reset is documented in `SOT/archive/2026-09-14-turn02-recovery-design/GY-044.md`:

> SOT repeatedly reached mechanically qualified subsystems without reaching a stable owner-operable product.

This plan therefore changes the release strategy from **component accumulation** to **vertical-slice qualification**.

No application code is to be changed until the owner approves this plan.

## 2. Product definition

SOT is one persistent single-source-of-truth storage service.

The owner-facing mental model is intentionally simple:

`Storage → Work → SSOT → Action`

- **Storage** answers: what physical volumes/folders are admitted, and which are Source, Target, and Backup?
- **Work** answers: what is the service doing now, how far has it progressed, and can it be paused/resumed/stopped?
- **SSOT** answers: what content is currently known, where does it exist, what is duplicated, and what is protected?
- **Action** answers: what safe mutation is allowed next against a specific committed SSOT revision?

Projects are not an owner-facing abstraction. If an internal compatibility record is temporarily required by a recovered backend, it is an implementation detail only and may not own independent user-visible lifecycle state.

The primary outcome remains:

**safely clean up files → prove required copies exist → certify the cleaned estate → permit source media to be cold-stored or deliberately retired.**

## 3. Non-negotiable runtime architecture

The deployed product must have exactly one runtime architecture:

- persistent Node service;
- SQLite durable database;
- browser is an API client only;
- Windows/WSL storage discovery and browsing are owned by the service;
- background indexing/fingerprinting is server-side;
- concurrency is server-owned through bounded workers;
- browser closure cannot stop indexing, hashing, verification, copying, or other work;
- durable operation/event records explain what happened;
- one canonical installer performs archive → qualification → cutover → post-cutover verification → rollback on failure.

Python may compose or qualify a release, but Python is not the deployed application engine.

## 4. What history actually proved

Historical releases are evidence sources, not application ancestors unless explicitly named as a clean source contract.

### 4.1 Proven and reusable contracts

**Windows volume discovery / browsing**

Base-20 through Base-22 proved the important low-level storage behavior: Windows volumes can be discovered dynamically, Windows-native folder access can expose volumes WSL-only enumeration cannot, and Source/Target/Backup can share one storage authority.

**Persistent processing**

The qualified Node/SQLite line proved persistent service behavior, background fingerprint work, bounded worker coordination, scheduler/rollup state, and browser-independent processing.

**Coordination / observability**

The later coordination backend proved the need for durable operation IDs, lifecycle/event history, explicit cancellation/failure state, and protection against stale worker completion overwriting newer state.

**Committed SSOT revision truth**

R12 proved schema-6 SSOT/Profile concepts, committed revision checking, and content/tag provenance behavior at the backend layer.

**Hierarchical virtual-volume presentation**

R13 proved the correct general Profile presentation: master-detail hierarchy rather than a flat database dump.

### 4.2 Proven failures that must not return

- separate Source versus Target/Backup storage authority;
- WSL-only browse/readability as authority for Windows volumes;
- repeated storage enumeration on ordinary selection/save;
- whole-surface polling redraws;
- polling that destroys picker, disclosure, input, focus, keyboard, scroll, or selection state;
- plan/current-state presentation that can contradict committed evidence;
- mechanically qualified UI markers standing in for an owner-operable workflow;
- adding tags/AI/analytics while basic Storage/Work/SSOT remains unstable;
- simplifying the UI by replacing the persistent service with a thin browser shell;
- patch-forward recovery from rejected generated artifacts.

## 5. Recovery rule: one vertical slice at a time

Turn 02 does not attempt the complete historical feature set in one build.

Each slice must be mechanically qualified and owner-tested before the next slice is implemented. A failed slice returns to its declared clean source and is rebuilt; it never becomes the next ancestor.

### Slice A — Persistent foundation + Storage

This is the first coding target after owner approval.

Required behavior:

1. Start one persistent Node service with one SQLite database.
2. Discover available Windows/WSL volumes from one authoritative service-side inventory.
3. Report real capacity/availability from the appropriate native authority.
4. Browse folders on every discovered readable volume through the service.
5. Assign one or more Source folders.
6. Assign Target and Backup folders.
7. Create a destination folder from the same picker when needed.
8. Persist Storage assignments in SQLite.
9. Close/reopen the browser and recover exactly the same Storage configuration.
10. No indexing starts merely because Storage configuration changed.

Owner-facing UI for Slice A is only the Storage surface plus enough service status to know the backend is connected.

**Slice A exit condition:** the owner can install from one WSL command, open the browser, configure real Source/Target/Backup storage, reopen the application, and see the same correct configuration without UI fighting or hidden rescans.

### Slice B — Work / indexing

Only after Slice A acceptance.

Required behavior:

1. Start or re-index admitted Sources.
2. Use a bounded server-side worker pool for fingerprint work.
3. Persist one durable operation record and append-only event history.
4. Pause/resume/stop are explicit service operations.
5. Closing the browser does not stop work.
6. Reopening the browser reconstructs current state from durable service truth.
7. Progress includes files, bytes, phase, elapsed time, workers, errors/retries, and operation ID.
8. A new mutating operation cannot overwrite or be overwritten by stale completion from an older operation.
9. UI refresh patches status data only. It must not reconstruct active Storage controls or active interaction DOM.

**Slice B exit condition:** the owner can start indexing, close/reopen the browser, observe correct continuing progress, pause/resume/stop, and inspect a durable event trail explaining the run.

### Slice C — committed SSOT Profile

Only after Slice B acceptance.

Required behavior:

1. Indexing writes to a candidate evidence generation.
2. A completed successful reconciliation commits one new Profile revision atomically.
3. Failed/cancelled/stale work cannot replace the current committed Profile.
4. The previous committed Profile remains usable until the new revision commits.
5. Profile presents the estate hierarchically: folder tree + selected-folder/file detail.
6. Each file instance retains path/location metadata and fingerprint/content identity.
7. Shared content is counted once globally by fingerprint.
8. Duplicate/source-copy counts are distinct from verified protection copies.
9. Omnisearch may filter the committed Profile but cannot mutate it.
10. Polling cannot close disclosures, reset hierarchy expansion, change selection, or alter scroll/focus state.

**Slice C exit condition:** the owner can complete an index, browse an authoritative committed SSOT revision, understand duplicate/protection truth, re-index, and see the old revision remain authoritative until the new one commits.

### Slice D — safe Action

Only after Slice C acceptance.

Initial Action scope is deliberately narrow:

1. copy content to Target/Backup;
2. verify the new independent copy;
3. identify redundant Source copies only after protection requirements are satisfied;
4. deduplicate/retire only through an explicit approved action bound to a Profile revision;
5. certify content/estate state only from positive committed evidence.

Every Action must record source Profile revision, stable content identities, intended mutation, result, timestamps, and errors. Stale Profile revisions are rejected, not silently upgraded.

**Slice D exit condition:** the owner can take a known content object from unsafe → copied → verified → eligible for cleanup/certification with complete evidence and no ambiguity about which revision was acted on.

## 6. Features explicitly deferred until A-D are accepted

The following are not part of the recovery critical path:

- tags and tag inheritance;
- AI provider/model configuration;
- AI recommendations;
- advanced analytics;
- generalized planning UI;
- project/scoped workspaces;
- decorative dashboards;
- secondary export/import conveniences not needed for qualification.

They may be reconsidered only after the basic storage system works end to end.

## 7. UI contract

The browser is a control surface over durable service state, not a second state machine.

Required rules:

- no full-page or full-surface redraw on polling;
- status refresh updates only owned status nodes;
- inputs/pickers/disclosures/navigation remain mounted while active;
- open chevrons stay open across refresh;
- selected volume/folder remains selected;
- picker browse position survives refresh and reopen where appropriate;
- search text, scroll, focus and mobile keyboard are never reset by background polling;
- a server update may mark displayed data stale, but may not silently replace an active user selection;
- mobile touch targets are at least 44px;
- no horizontal-scroll dependency for primary controls.

## 8. State model

There is one authoritative service-owned operation model.

Representative operation states:

`queued → running → paused → completed`

with terminal alternatives:

`failed | cancelled`

A completed Profile revision is separate from an active operation. Starting a new index does not erase the last committed Profile.

Every mutating operation has:

- operation ID;
- operation kind;
- start Profile/evidence revision where applicable;
- generation/ownership token;
- timestamps;
- current state;
- progress counters;
- event log;
- failure/cancellation reason;
- result revision when successfully committed.

Only the currently owned generation may commit its result.

## 9. Storage truth model

The durable model is:

`fingerprint/content object → physical locations → storage role / verified-copy evidence → protection state → allowed next action`

Rules:

1. Physical identity is fingerprint-based.
2. Paths/locations describe instances, not content identity.
3. Source/Target/Backup roles come from one discovered storage catalog.
4. Shared content counts once globally.
5. Verified protection holdings are never classified as disposable duplicate waste.
6. Zero indexed files/bytes is Unknown/Not indexed, never Safe.
7. A stale/failed operation cannot erase current committed truth.
8. Physical deletion/retirement requires positive verification evidence and explicit Action.

## 10. Build lineage and governance

The five-stage chain remains:

`pre-base → base → pre-ship → ship → post-ship`

For Turn 02:

- `pre-base` defines and proves Slice A foundation.
- later stages may advance only after the preceding stage is accepted.
- a rejected candidate is evidence only.
- no rejected generated HTML, installer, runtime DB, or wrapper is an implementation ancestor.
- recover proven source contracts from immutable historical commits, but compose a clean current source tree rather than chaining old generated candidates.

Before every repository write:

1. fetch current `main`;
2. fetch current target-file blob SHA;
3. preserve unrelated repository work;
4. write only the governed SOT file(s).

## 11. Mandatory release gate for every slice

### Developer pass

Prove executable mechanics, not marker presence alone:

- syntax/boot;
- database integrity/migrations;
- exact API behaviors;
- behavioral fixture for the slice;
- operation/event persistence;
- stale-generation protection;
- non-destructive UI refresh behavior where applicable.

### Manager pass

Prove the product contract:

- only the approved slice changed;
- accepted prior behavior remains intact;
- the owner-facing workflow is coherent end to end;
- no deferred feature has leaked into scope;
- the release can be explained in one short owner test sequence.

### Red-team pass

Attempt to break the actual candidate:

- browser close/reopen during work;
- unavailable/removable volume;
- stale worker completion;
- failed/cancelled operation;
- service restart;
- repeated polling during active interaction;
- database integrity/rollback;
- exact public byte identity.

### Owner/device pass

Only after all three mechanical passes.

The owner receives:

1. one exact WSL install command;
2. the exact expected gate summary;
3. one cache-busted public test URL;
4. a short test script limited to the current slice.

No owner handoff occurs merely because an installer was generated.

## 12. Slice A implementation source policy

The next coding turn must first perform a source audit and pin the smallest clean set of historical contracts needed for:

- persistent Node/SQLite service;
- Windows-native volume discovery/browse/capacity;
- one shared Source/Target/Backup storage authority;
- canonical folder creation;
- durable configuration;
- minimal service health.

The audit must explicitly separate:

- **reuse as source** — clean implementation that is known to work;
- **reuse as test/contract only** — useful behavior whose historical implementation carried rejected architecture;
- **do not reuse** — rejected generated candidate, browser-owned runtime, UI patch chain, or conflicting project/state model.

No UI or backend implementation begins until that source table is recorded in the release archive for Slice A.

## 13. Next deliverable after owner approval

After the owner gives the green light, the next deliverable is **not** another broad SOT application.

It is:

**Turn 02 Slice A: persistent foundation + Storage only**, delivered through the single canonical WSL installer and qualified through Developer → Manager → Red-team before the owner sees the test URL.
