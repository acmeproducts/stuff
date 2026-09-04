<!-- PRISM-PLAN v3.9.0 -->
# PRISM MASTER PLAN v3.9.0

## Governing baseline
- Canonical working baseline: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`

## Clean donor chain
R26 must be a standalone source file, not a wrapper or runtime patch stack.

The clean standalone R18/R14 source is the donor for the already-working control, AI-web, and Library architecture:
- `prism/prism-turn01-pre-ship-r18.html`
- blob `56ba6eb63bf27073399c471fde44164e16c3990f`

R21 is evidence only for the accepted Map behavior and fixed control widths. Its iframe/wrapper architecture is forbidden. Only its visible Map behavior is transplanted directly into the standalone source diff.

## Frozen R21 controls
- three equal fixed-width Group / Color / Size selectors;
- three aligned filter-summary buttons beneath them;
- summary = dimension + All / one value / n-of-total;
- tapping a summary opens the existing compact canonical-chip chooser; mobile uses bottom sheet;
- no permanently exposed R11 `Filters / legend` rail;
- one canonical filter state only;
- Source filtering governs Source-group identity.

## Frozen R21 Map
- readable adaptive DOM tiles;
- tight group headings;
- group click focuses one group;
- adjacent × restores all groups;
- fixed/equal dimension-control widths;
- large/medium headlines do not truncate; smaller tiles fit text down to the governed minimum and may expand row span when required.

## AI POV
- one selected-evidence list only;
- each selected event contains a chevron disclosure with direct source URLs;
- no second Evidence packet surface;
- provider/model/key editing exists only in Config;
- current-web research uses the verified Config default.

## Library
- successful initial AI research automatically persists to IndexedDB and the in-memory Library projection; no visible Add/Save step;
- the same Analysis ID is selected after save;
- Library right detail occupies the full available workspace height regardless of card count;
- transcript is the independently scrolling middle row;
- compact bottom compose row is paperclip + text + send;
- continuation uses the complete saved Analysis as context and current-web research, appending to the same Analysis ID.

## R26 build law
1. Start from clean standalone R18/R14 blob `56ba6eb63bf27073399c471fde44164e16c3990f` as the already-working descendant of R11.
2. Apply one ordinary source diff directly in the standalone HTML: exact R21 Map behavior + AI evidence consolidation + automatic Library persistence + compact full-height Library compose geometry.
3. No wrapper, iframe, runtime baseline fetch, sidecar script, DOM monkey patch, alternate state machine, or overlay architecture.
4. Do not modify unrelated source ingestion, provider configuration, search, Feed, reader, or export behavior.
5. Validate JavaScript syntax and mechanically inspect the R18→R26 diff before publication.
6. Publish one cache-busted Pages URL for owner testing.

The user's instruction to produce a test release is explicit approval for this R26 diff only. No subsequent forward patch is authorized without a new explicit approval.