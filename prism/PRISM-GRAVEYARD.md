<!-- PRISM-GRAVEYARD v3.2.0 -->
# PRISM GRAVEYARD v3.2.0

## Governance
Rejected work is evidence, not an implementation ancestor. Owner device testing is the functional acceptance gate; mechanical checks do not substitute for acceptance.

## Active baseline
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`
- Status: **WORKING BASELINE**

## Standing vetoes
- No synthesized rollback when an exact working artifact exists.
- No PRISM-specific temporary GitHub Actions/recovery workflow as the normal publishing mechanism.
- No WSL/repository orchestration architecture for this static browser application.
- No whole-repository rollback in the shared repository.
- No unrelated redesign while correcting governed defects.
- No removal of established functionality to fix one surface.
- No metadata-only source-add success claim.
- No Library state that loses Omnisearch, Analysis-list access, selected detail, or Research web continuation on mobile.
- No Library implementation where DOM cards are the persistence source of truth.
- No heuristic matching of provider results to "an" in-process card; every run must bind to its own durable Analysis ID.
- No Add/Save-to-Library step after Run Analysis; the record exists before execution begins.
- No iframe/nested-wrapper candidate as a legitimate release.
- No Explore implementation that creates/transforms one DOM object per event across the full corpus.
- No hidden Map/Explore/Feed rerender fan-out during ordinary interaction.
- No unselected Source group under an active Source filter.
- No disappearing Group/Color/Size filter slot when roles share a dimension.
- No claim that syntax/DOM assertions prove UX acceptance.

## Rejected lineage
### R6–R10
Historical correction artifacts only. Their individual findings remain evidence.

### R12
Superseded after mobile readability and three-slot filter defects were found.

### R13
Rejected for treemap readability, distant filter interaction and research-workflow defects.

### R14
Rejected in owner device testing because open-Analysis mobile state lost immediate Omnisearch access, the continuation/current-web action was not visible, and inherited Explore froze.

### R15
Rejected. It attempted Library/Explore corrections but did not preserve the intended application closely enough.

### R16
Rejected. It continued the R15 implementation lineage and did not restore the designed application satisfactorily.

### Failed R17 release mechanism
Rejected before application publication. Temporary GitHub Actions release machinery failed and was removed. Do not retry it.

### R18
Invalid release alias: byte-for-byte reuse of rejected R14 application content under a new release name. Not a legitimate implementation ancestor.

### R19
Experimental iframe/runtime patch over R18. Useful evidence for Map topology and early Explore clustering only. Not a governed release ancestor.

### R20
Experimental iframe/runtime patch over rejected lineage. Its adaptive DOM Map tile layout is useful evidence, but the wrapper architecture is rejected.

### R21
Experimental iframe/runtime patch. Owner accepted the visible Map tile sizing, group-heading proximity, group-click focus/adjacent × restore behavior and fixed dimension-control sizing. Those behaviors may be ported, but R21 itself is not an ancestor.

### R22
Rejected Library direction. It hid the Library Analysis rail when an Analysis opened, directly violating the required persistent master/detail workspace.

### R23
Rejected as architecture despite moving closer visually. It remained a nested wrapper over rejected runtime lineage and did not make IndexedDB the authoritative Analysis model.

### R24
Rejected and diagnosed as structurally unusable Library implementation.
- Runtime chain stacked R24 → R23 → R21 → R18/R14, leaving multiple documents, CSS layers and competing event handlers.
- IndexedDB was added as side-effect writes from DOM cards/transcript instead of becoming the authoritative Analysis store.
- Existing and synthetic Analysis cards followed different selection paths.
- Run Analysis created a synthetic in-process card without a durable one-to-one binding to the actual provider request/result.
- Completion detection guessed from generic output DOM mutation and could associate the wrong result.
- IndexedDB content was not fully hydrated back into Library state on startup, so persistence was not a complete read/write model.
- Portrait behavior remained subject to overlapping mobile CSS and nested runtime handlers.
- Attachment/paste/current-web continuation persistence was not implemented as one durable Analysis thread.

## Current correction contract
All four owner-directed workstreams remain active together, with Library as the immediate acceptance gate:
1. Library is an IndexedDB-backed master/detail research workspace. Run Analysis creates the durable record immediately; the Analysis list is rendered from IndexedDB; selection only changes the right pane; full Markdown transcript plus follow-up/web research persists under the same Analysis ID; delete is the retention decision.
2. Explore uses lightweight cardinality-driven clustering with no transformed full-corpus event cloud.
3. Source/filter correctness includes truthful custom-source ingestion and stable defaults.
4. Map/controls/mobile layout ports the owner-accepted R21 Map behavior without inheriting the R21 wrapper architecture.

The next legitimate candidate must begin from the exact standalone R11 baseline and implement corrections directly in that application. No R18–R24 runtime wrapper may be used as its ancestor.
