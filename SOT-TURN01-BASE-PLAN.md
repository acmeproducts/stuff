# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** R13 MECHANICALLY QUALIFIED — OWNER MOBILE UX REJECTED — R14 MOBILE-FIRST CORRECTION READY FOR HOST QUALIFICATION  
**Date:** 2026-09-07

## Governing model

SOT is one dynamically versioned SSOT virtual storage volume.

`Discover sources → Profile SSOT rN → Omnisearch/select → Action → Profile SSOT rN+1`

Projects are abolished as a first-class operating abstraction. The virtual volume is the structure; Omnisearch is the selector; tags are classification; Action operates on an explicit Profile revision and stable selection.

## Mobile-first product rule

SOT is a **mobile-first application**. Touch, software-keyboard, viewport-resize, focus, suggestion, selection and scroll behavior on phone/tablet are first-class release contracts, not desktop compatibility details.

A mechanically qualified release is not acceptable if ordinary mobile typing can be interrupted by polling, redraw, viewport change, focus transition, or background state reconciliation.

For any active text/tag editor:

- the DOM node containing the editor must not be reconstructed while the owner is editing;
- software keyboard visibility/focus must survive background refresh;
- keyboard/viewport transitions must not be inferred solely from `document.activeElement`;
- editing state must be explicit application state;
- Enter/tap-to-commit must execute before any redraw;
- the edit lock clears only from an explicit owner interaction outside the editing surface or navigation away.

## Primary surfaces

### Discover

Discover admits and manages physical source folders/volumes. It defines what is scanned/fingerprinted and does not create Projects.

### Profile

Profile is the authoritative committed SSOT revision. It exposes folders/files with path, size, created/modified dates, fingerprint, physical location/protection truth, and direct/effective tags.

Profile is a hierarchical virtual-volume browser, not a flat database listing. Its required layout is master-detail:

- **Master:** expandable/collapsible folder hierarchy with source/root context.
- **Detail:** selected folder immediate child folders/files, or selected file metadata/evidence.
- Selecting a folder updates detail without losing tree expansion.
- Selecting a file shows that file as the detail object while keeping its folder context visible.
- Omnisearch filters the virtual volume while preserving ancestry/context.

### Action

Action mutates the SSOT-controlled estate or sidecar metadata from a specific Profile revision and stable selection. Stale revisions are rejected rather than silently applied to newer truth.

## Tags

Tags are global normalized sidecar metadata. They never become Projects or lifecycle owners.

A tag may be assigned directly to a folder or file. Folder tags are inherited by descendants. Effective tags are inherited + direct tags with provenance retained so removing a folder assignment cannot erase an equivalent direct descendant assignment.

### Required tag interaction

- begin typing in a persistent inline tag editor;
- matching tags from the global pool appear immediately;
- tap/click a match to assign it, or press **Enter** to assign/create the normalized typed tag;
- assigned/effective tags render as chips;
- **the chip `×` is the removal control**;
- there is no generic separate `Remove tag` button in the normal tag workflow;
- inherited chips identify source folder provenance and their `×` removes the governing assignment only;
- bulk add-tag is allowed for a stable selection;
- bulk removal is represented by removable common/effective tag chips for the selected set.

## Omnisearch and bulk selection

Omnisearch operates across folders/files, path/name, fingerprints and tags. Search does not flatten the storage model: matching folders/files remain anchored to hierarchy.

Selection is explicit and stable. Refresh cannot silently add newly matching items to an existing selection. Bulk Actions display selection count and Profile revision before mutation.

## Virtual-volume data model

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

R13 proved that a `document.activeElement`-only guard is insufficient on mobile. R14 therefore requires an explicit tag-edit lock that survives transient mobile focus/viewport changes and blocks active-editor DOM replacement.

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

## Qualified foundation

R12 remains the qualified schema-6/backend foundation.

R13 is mechanically qualified UI lineage for hierarchical master/detail Profile, but owner mobile testing rejects its tag editor because the keyboard can still be dismissed during typing. That rejection is archived as `GY-041`.

## R14 build scope

R14 is a **UI-only clean source advance** from governed R13 source composition. It must not patch the installed/generated R13 HTML.

Required R14 slice:

- preserve R12 backend/schema 6 unchanged;
- preserve R13 folder hierarchy, master/detail, Omnisearch ancestry, selected node, expansion and chip UX;
- add explicit application-level tag editing state;
- acquire tag-edit lock on focus/pointer/type/Enter;
- while lock is active, polling may update state but may not redraw/replace the tag-editor DOM;
- suggestion selection and Enter assignment keep the lock through mutation completion;
- clear lock only on explicit pointer interaction outside the editor or navigation away;
- retain chip `×` removal and no generic Remove Tag button;
- no unsafe physical bulk delete.

## R14 acceptance gates

### Developer

- Clean source advance from pinned R13 composition; no live/generated patch-forward.
- JavaScript syntax/boot passes.
- Explicit tag edit lock exists in state.
- Focus, pointer, typing and Enter all acquire/retain the lock.
- `load()` and `draw()` cannot reconstruct the active editor while lock is set.
- Outside interaction explicitly releases the lock.
- Enter-to-assign and type-ahead remain present.
- Hierarchy/master-detail and chip `×` removal remain present.

### Manager

- Mobile-first keyboard/focus behavior is a primary product contract.
- Tag entry does not depend on desktop-style stable `activeElement` semantics.
- Discover → Profile → Action remains unchanged.
- R12 backend/schema truth remains untouched.

### Red team

- Simulated refresh/redraw path is structurally blocked while tag edit lock is active.
- Mobile focus transitions cannot independently clear the edit lock.
- Enter assignment cannot be pre-empted by redraw.
- Explicit outside interaction can release the lock so navigation still works.
- Chip `×`, hierarchy, expansion and stale selection protections remain intact.
- Unsafe bulk physical delete remains absent.
- Public byte identity, live endpoint health, DB integrity and rollback remain mandatory before owner test URL.

## Governance

- Fetch current `main` and target blob SHA immediately before every write; preserve unrelated work.
- Failed/rejected generated artifacts are evidence only and never implementation ancestors.
- `install-SOT-turn01-base.sh` remains the only active Base installer.
- Mandatory release gate: Developer PASS → Manager PASS → Red-team PASS.
- Owner is the browser/product tester; return one exact WSL installer command only after source qualification is ready, then exact cache-busted test URL after host PASS.
