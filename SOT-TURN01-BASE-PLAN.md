# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** R12 MECHANICALLY QUALIFIED — R13 OWNER UX CORRECTION REQUIRED  
**Date:** 2026-09-07

## Governing model

SOT is one dynamically versioned SSOT virtual storage volume.

`Discover sources → Profile SSOT rN → Omnisearch/select → Action → Profile SSOT rN+1`

Projects are abolished as a first-class operating abstraction. The virtual volume is the structure; Omnisearch is the selector; tags are classification; Action operates on an explicit Profile revision and stable selection.

## Primary surfaces

### Discover

Discover admits and manages physical source folders/volumes. It defines what is scanned/fingerprinted and does not create Projects.

### Profile

Profile is the authoritative committed SSOT revision. It exposes folders/files with path, size, created/modified dates, fingerprint, physical location/protection truth, and direct/effective tags.

**Profile is a hierarchical virtual-volume browser, not a flat database listing.** Its required layout is master-detail:

- **Master:** expandable/collapsible folder hierarchy with source/root context.
- **Detail:** the selected folder's immediate child folders/files, or the selected file's metadata/evidence.
- Selecting a folder in the master updates detail without losing tree expansion.
- Selecting a file shows that file as the detail object while keeping its folder context visible.
- Omnisearch filters the virtual volume while preserving the ancestry/context needed to understand where every result lives.

### Action

Action mutates the SSOT-controlled estate or sidecar metadata from a specific Profile revision and stable selection. Stale revisions are rejected rather than silently applied to newer truth.

## Tags

Tags are global normalized sidecar metadata. They never become Projects or lifecycle owners.

A tag may be assigned directly to a folder or file. Folder tags are inherited by descendants. Effective tags are inherited + direct tags with provenance retained so removing a folder assignment cannot erase an equivalent direct descendant assignment.

### Required tag interaction

The accepted interaction follows the prior UI/Kanban model:

- begin typing in a persistent inline tag editor;
- matching tags from the global pool appear immediately;
- tap/click a match to assign it, or press **Enter** to assign/create the normalized typed tag;
- assigned/effective tags render as chips;
- **the chip `×` is the removal control**;
- there is no generic separate `Remove tag` button in the normal tag workflow;
- an inherited chip identifies its source folder; its `×` removes the governing folder assignment, not an unrelated direct assignment on the descendant;
- bulk add-tag is allowed for a stable selection;
- bulk removal is represented by removable common/effective tag chips for the selected set rather than a generic remove-tag text field/button.

## Omnisearch and bulk selection

Omnisearch operates across folders/files, path/name, fingerprints and tags. Search does not flatten the storage model: matching folders/files remain anchored to their hierarchy.

Selection is explicit and stable. Refresh cannot silently add newly matching items to an existing selection. Bulk Actions must display selection count and Profile revision before mutation.

## Virtual-volume data model

The durable model is:

1. Folder node — path/parent/source identity, aggregate size/count, dates where available, direct tags.
2. File instance — parent/path/name, size, dates, physical location, fingerprint reference, direct tags.
3. Content object — fingerprint identity and all physical/protection truth.
4. Tag — canonical normalized pool identity/display value.
5. Tag assignment — target + provenance + audit metadata.
6. Profile revision — committed SSOT generation.
7. Operation/event — durable Discover/Action audit history.

Physical content identity is fingerprint-based. Path moves and tags do not create new content identity.

## Interaction-state rule

Polling/data refresh may update Profile data but may not destroy owner interaction state. At minimum these survive refresh:

- active tag input value, caret/focus and mobile keyboard;
- type-ahead suggestion list;
- Omnisearch text;
- selected Profile node;
- stable multi-selection;
- expanded folder tree nodes;
- open chevrons/disclosures;
- scroll position;
- modal state.

If an input/textarea/select/contenteditable control is actively being edited, periodic refresh must update state without reconstructing that active editing surface. R12's keyboard dismissal is explicitly rejected.

## Product outcome

**safely clean up files → prove required copies exist → certify the cleaned estate → permit source media to be cold-stored or deliberately retired.**

The SSOT should answer: what exists, where it exists, how it is organized/classified, whether it is safe, what can be reclaimed, and what Action is valid next.

## Safety truth

1. Protected requires positive committed content plus required verified independent copies.
2. Zero files/bytes is Unknown/Not indexed, never Protected.
3. Global unique bytes count each fingerprint once regardless of tags/paths.
4. Shared physical content is distinct from redundant source duplication.
5. Verified protection holdings are not disposable duplicate-source waste.
6. Failed/stale discovery or reconciliation cannot erase committed Profile truth.
7. Tags never confer protection, certification or deletion eligibility.
8. No physical delete/removal path may bypass protection/verification evidence.

## R12 status

R12 is the qualified schema-6/backend baseline. Public qualified SHA256:

`2c84d243fe8fe6778b850bd6dcf9de49892163a2a6e91c7623531228417faa47`

Owner rejected its Profile presentation. Rejection is archived as `GY-040`.

## R13 build scope

R13 is a **UI-only clean source advance** unless a concrete blocker proves otherwise. It must be composed from governed source lineage, never by patching the installed/generated R12 HTML.

Required R13 slice:

- preserve R12 schema 6 and backend APIs unchanged;
- replace flat Profile listing with folder-tree master + selected-node detail pane;
- preserve folder/file hierarchy under Omnisearch;
- implement persistent type-ahead tag editor with Enter-to-assign;
- prevent periodic refresh from dismissing keyboard/focus or replacing active editor;
- assigned/effective tags are chips with `×` removal;
- remove generic `Remove tag` button from Profile/Action tag flow;
- expose bulk add-tag for stable selection and common-tag chips with `×` for bulk removal;
- preserve selected node, tree expansion, selection, Omnisearch, disclosure and scroll state across refresh;
- no unsafe bulk physical deletion.

## R13 acceptance gates

### Developer

- Clean UI source advance from pinned qualified lineage; no generated/live patch-forward.
- JavaScript syntax/boot passes.
- Tree derives parent/child hierarchy from Profile paths and distinguishes folder/file nodes.
- Selecting a folder renders only its immediate children in detail; selecting a file renders file detail.
- Omnisearch retains ancestors/context for matches.
- Type-ahead suggestions come from the existing tag pool.
- Enter assigns typed tag without redraw before key handling.
- Active editor survives a polling refresh without DOM replacement/focus loss.
- Assigned tags render chips with `×`; no generic Remove Tag button remains.
- Bulk add and common-chip bulk removal use stable explicit selection.

### Manager

- Profile reads visually as a storage volume/file manager, not a database dump.
- Master-detail relationship is immediately clear.
- Folder hierarchy is navigable without scrolling through a flat estate.
- Tag interaction matches the accepted chip/type-ahead model.
- Discover → Profile → Action remains the top-level product model.
- R12 backend/schema/protection/fingerprint truth remains untouched.

### Red team

- Poll refresh while typing cannot hide the mobile keyboard by reconstructing the active editor.
- Enter on tag input cannot be pre-empted by redraw.
- Chip `×` removes the correct direct or governing inherited assignment.
- Equivalent direct descendant tag survives removal of inherited folder assignment.
- Omnisearch cannot detach a matching file from its folder ancestry.
- Refresh cannot broaden a previously captured bulk selection.
- Unsafe bulk physical delete remains absent.
- Public byte identity, live endpoint health, DB integrity and rollback are mandatory before owner test URL.

## Governance

- Fetch current `main` and target blob SHA immediately before every write; preserve unrelated work.
- Failed/rejected generated artifacts are evidence only and never implementation ancestors.
- `install-SOT-turn01-base.sh` remains the only active Base installer.
- Mandatory release gate: Developer PASS → Manager PASS → Red-team PASS.
- Owner is the browser/product tester; return one exact WSL installer command only after source qualification is ready, then exact cache-busted test URL after host PASS.
