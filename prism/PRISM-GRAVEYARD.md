<!-- PRISM-GRAVEYARD v4.0.0 -->
# PRISM GRAVEYARD v4.0.0

## Governance
Rejected work is evidence, not an implementation ancestor. Owner device testing is the functional acceptance gate. A forward release requires explicit owner approval.

## Clean lineage
- canonical R11 blob `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- clean standalone R18/R14 donor blob `56ba6eb63bf27073399c471fde44164e16c3990f`
- standalone R26 is the immediate source baseline for the explicitly authorized R27 ordinary diff.

## Permanent architecture veto
- no iframe release;
- no runtime baseline fetch;
- no wrapper/bootstrap release;
- no sidecar patch-stack release;
- no injected overlay or DOM monkey patch;
- no Web Worker for the AI network wait;
- no second filter or Analysis persistence state machine;
- no patching a rejected candidate forward without explicit approval.

## Frozen controls / AI POV
Three equal Group/Color/Size selectors plus three aligned filter summaries opening the canonical chooser remain. AI POV remains one selected-evidence surface with per-event source URL disclosure and Config-only provider/model/key editing.

## R26 defects now explicitly rejected
### Post-completion Library creation
R26 created the durable Analysis only after the provider response completed. This is rejected. The Analysis identity and `processing` Library card must exist before the network request begins, then the same ID progresses to `ready` or `failed`.

### Analysis card metadata
R26 card metadata (`updated · turns · links`) and separate Delete button are rejected. Card is title + ×, Created/Updated line, and Status line only.

### Library vertical geometry
Any layout where the compose strip aligns to the bottom of the card list rather than the bottom of the Library reading surface is rejected. The detail surface is fixed-header / independently scrolling transcript / pinned-bottom composer at full workspace height.

### Incomplete research transcript
A Library detail that does not visibly preserve each original/follow-up query, uploaded-context entry, response, and date/time in chronological order is rejected.

### Missing Analysis Omnisearch
Library-card Omnisearch is not a substitute for a search inside the selected Analysis. The selected Analysis requires its own top-right search supporting positive, `-negative`, `*wildcard*`, and `?` matching.

### R26 fixed-row Map
The `.r21Group` fixed grid with 92/96/104px rows and big/medium/small span classes is rejected. It produces oversized repetitive rectangles rather than NewsMap density.

## R27 Map reference contract
`IJMacD/newsmap-js` is the visual and geometry reference only: packed variable-area rectangles, dense full-height surface, thin dark borders, compact white Arial/Helvetica text around 7pt base, approximately 1.1 line height, category/group color families, and clipping only for genuinely tiny rectangles. PRISM must implement this directly in its standalone source without importing the reference application's architecture.

## Current R27 acceptance contract
1. Analysis record/card exists with `processing` status before AI fetch begins.
2. Same ID transitions to `ready` or `failed` and is re-read from IndexedDB.
3. PRISM navigation remains usable while AI fetch is pending.
4. Card is title + × / Created|Updated / Status only.
5. Library reading surface fills workspace; transcript scrolls; compose is pinned to its bottom.
6. Complete research conversation is timestamped and retained on the same Analysis ID.
7. Selected Analysis has independent top-right Omnisearch with negative exclusion and wildcarding.
8. Map uses packed NewsMap-like variable width/height geometry with no fixed-row lattice.
9. R27 remains one standalone HTML source with no wrapper, sidecar, worker, runtime bootstrap, overlay patch, or alternate persistence engine.
10. Any R28 or later forward change requires new explicit owner approval.