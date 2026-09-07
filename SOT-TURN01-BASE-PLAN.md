# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** R11 MECHANICALLY QUALIFIED — R12 ARCHITECTURE APPROVED FOR BUILD  
**Date:** 2026-09-06

## Governing model

SOT is one dynamically versioned SSOT: a virtual storage volume representing discovered folders, files, physical locations, fingerprints and storage safety truth.

`Discover sources → Profile SSOT rN → Omnisearch/select → Action → Profile SSOT rN+1`

Projects are abolished as a first-class operating abstraction. They do not own scans, evidence, protection, destinations, lifecycle state or actions. Existing project records are migration evidence only until their source membership is absorbed into Discover.

The virtual volume is the structure; Omnisearch is the selector; tags are classification; Action operates on the selected result set.

## Primary surfaces

### Discover

Discover adds and manages sources. A source is a physical volume/folder admitted to SSOT discovery. Discover owns source selection, scan/fingerprint admission and discovery coverage. It does not create a project.

### Profile

Profile is the current dynamically versioned SSOT. It exposes the virtual volume as folders and files with, where available:

- virtual path / name;
- folder/file type;
- size;
- created date;
- modified date;
- content fingerprint;
- known physical location(s);
- protection / verification state;
- direct and effective tags.

Each successful reconciliation commits a new Profile revision. Failed, cancelled or stale work cannot replace the current committed revision.

Profile contains Omnisearch. Omnisearch can return folders and files and is the primary selection mechanism for individual and bulk actions.

### Action

Action mutates the SSOT-controlled estate or its sidecar metadata from an explicit Profile revision and selection. Actions include tagging, copy/protect, verify, deduplicate/reconcile, relocate, certify and eventually retirement/removal where safety gates permit it.

An Action that changes managed truth must result in reconciliation and a subsequent Profile revision. Stale actions must be rejected rather than applied to a newer incompatible Profile.

## Tags — global sidecar classification

Tags replace Projects as the flexible organizational layer but never become hidden projects.

Tag metadata is maintained in an SSOT sidecar, not written into source files. The implementation follows the established `ui.html` / Kanban interaction model: a global normalized pool, inline chips, `×` removal, type-ahead matching from the pool, and creation/assignment through the same control.

### Global pool

There is one canonical normalized tag pool. Input is normalized before lookup or creation. Equivalent normalized input resolves to the same tag identity. Tag-pool management is distinct from removing a tag assignment from a folder/file.

### Assignment and inheritance

A tag may be assigned directly to a folder or file.

A folder tag is inherited by descendant files/folders in Profile. Effective tags are the union of applicable inherited folder tags and direct tags. Provenance is retained so removing an inherited folder assignment does not delete a direct assignment of the same tag on a descendant.

Inheritance should be resolved from sidecar assignments/profile ancestry rather than materializing unnecessary duplicate assignment rows.

### Inline tag UX

In Profile/Omnisearch results:

- assigned/effective tags render as chips;
- an `×` removes the applicable direct assignment at that level;
- typing in the tag field immediately suggests normalized matches from the global pool;
- selecting a suggestion assigns it;
- valid new normalized input may create the canonical pool entry and assign it;
- tag controls must work for one item or a bulk selection.

## Omnisearch and bulk actions

Omnisearch operates across the SSOT virtual volume rather than across Projects. It can search/filter folders and files using path/name and Profile fields, including tags.

The result set is an actionable selection. The user can select one, many or all current results and invoke a bulk Action. Bulk tag add/remove is the first required bulk-action implementation and establishes the selection/action contract for later protect, verify, reconcile, relocate and certify operations.

Bulk actions must show selection count/scope before mutation and must not silently broaden when Profile refreshes.

## Virtual-volume data model

The durable model must represent these concepts without creating a second truth system:

1. **Folder node** — virtual path/parent/source identity, available dates/metadata and direct tag assignments.
2. **File instance** — path/name, parent, size, dates, physical location and fingerprint reference.
3. **Content object** — permanent fingerprint identity, known physical instances and protection/verification truth.
4. **Tag** — canonical normalized global-pool identity/display value.
5. **Tag assignment** — tag, target node/content identity as appropriate, assignment provenance and revision/audit metadata.
6. **Profile revision** — committed SSOT snapshot/reconciliation generation against which searches and actions are bound.
7. **Operation/event** — durable Action/Discover execution and audit history.

Physical content identity remains fingerprint-based. Path moves, tags and storage-role changes do not create new content identity.

## Product outcome

The primary job remains:

**safely clean up files → prove required copies exist → certify the cleaned estate → permit source media to be cold-stored or deliberately retired.**

The SSOT should answer: what exists, where it exists, how it is classified, whether it is safe, what can be reclaimed, and what Action is valid next.

## UI state / refresh rule

Polling or event refresh may update Profile data but may not destroy interaction state. Open chevrons/disclosures, Omnisearch text, selection, tag editing, scroll position, modal state and focus must survive refresh unless the underlying object itself disappears or the user closes/changes that state.

The R11 defect where expanded chevrons repeatedly auto-close is explicitly rejected and must be corrected in R12.

## Safety truth

1. Protected requires positive committed content plus required verified independent copies.
2. Zero files/bytes is Unknown/Not indexed, never Protected.
3. Global unique bytes count each fingerprint once regardless of tags or paths.
4. Shared physical content is distinct from redundant source duplication.
5. Verified protection holdings are not disposable duplicate-source waste.
6. A failed/new discovery or reconciliation cannot erase prior committed Profile truth.
7. Active-operation truth does not overwrite committed Profile truth.
8. Storage-role, path or tag changes do not change fingerprint identity.
9. No delete/removal recommendation may precede protection/verification evidence.
10. Certification is owner-facing proof that applicable cleanup/protection/verification policy is satisfied.
11. Tags classify/select; they never independently confer protection, certification or deletion eligibility.

## R12 build scope

R12 is the clean architectural transition from the mechanically qualified R11 lineage. It must not patch the installed/generated R11 HTML.

Required R12 slice:

- Replace project-oriented primary navigation with **Discover / Profile / Action**.
- Discover manages source admission without requiring project creation.
- Profile presents the SSOT virtual folder/file volume and current Profile revision.
- Add Omnisearch over virtual folders/files.
- Add canonical global tag pool and sidecar tag assignments.
- Implement folder tag inheritance with direct/inherited provenance.
- Implement inline tag chips, `×` assignment removal and type-ahead pool matching using the established UI/Kanban behavior.
- Implement stable result selection and bulk tag add/remove as the first bulk Action.
- Action surface reflects the current Profile revision/selection and provides the governed mutation entry point.
- Preserve durable operation/activity observability as supporting evidence rather than a top-level operating abstraction.
- Preserve existing fingerprint, location, protection and reconciliation truth while removing Projects from the owner-facing operating model.
- Preserve open chevrons/disclosures and other interaction state across refresh.

This release does not enable unsafe bulk deletion. Physical cleanup/removal remains gated by verified protection evidence and later explicit acceptance.

## R12 acceptance gates

### Developer

- Clean source advance from governed qualified lineage; no patch-forward from rejected/generated live artifact.
- Schema migration is additive/reversible and preserves existing SSOT evidence.
- Discover can admit/manage sources without creating a new project.
- Profile returns virtual folders/files with required metadata and committed revision.
- Global tag normalization/pool tests pass.
- Folder inheritance/direct-tag provenance tests pass.
- Omnisearch tag/path filtering tests pass.
- Bulk tag add/remove is bound to explicit Profile revision + stable selection.
- Chevrons and Omnisearch/selection state survive refresh.
- JavaScript syntax/boot and backend parse tests pass.

### Manager

- Default product reads as Discover → Profile → Action, not Projects/Dashboard.
- SSOT is visibly the sole operating object.
- Tags provide classification without acquiring lifecycle/storage ownership.
- Omnisearch is the primary selector for bulk Action.
- Existing protection/fingerprint/location truth remains available and unambiguous.
- No unrelated deployment/workflow architecture changes.

### Red team

- A folder tag is inherited by descendants; removing it removes only that inherited provenance and does not erase an equivalent direct descendant assignment.
- Normalization cannot create duplicate canonical tags for equivalent input.
- A bulk action cannot silently act on items added by a refresh after selection.
- A stale Profile revision cannot mutate a newer incompatible SSOT state.
- Refresh does not auto-close expanded disclosures.
- Tags cannot make unprotected content appear safe/certified.
- No physical delete/removal path bypasses protection/verification gates.
- Public byte identity, live endpoint health, database integrity and rollback remain mandatory before owner test URL.

## Governance

- Fetch current `main` and every target blob SHA immediately before writes; preserve unrelated work.
- Failed/rejected generated artifacts are evidence only and never implementation ancestors.
- `install-SOT-turn01-base.sh` remains the only active Base installer.
- Owner is the browser/product tester; mechanically reproducible failures must be caught before handoff.
- Mandatory release gate is Developer PASS → Manager PASS → Red-team PASS.
- Release handoff requires one exact WSL installer command; after successful host qualification, return the exact cache-busted owner test URL.
