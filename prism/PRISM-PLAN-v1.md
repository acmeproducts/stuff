<!-- PRISM-PLAN v3.8.0 -->
# PRISM MASTER PLAN v3.8.0

## Governing baseline
PRISM remains governed by the exact last working standalone application baseline.

**ACTIVE BASELINE**
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`

## Frozen accepted R21 surface
The owner acceptance statement is explicit: R21 was the working surface. Therefore the frozen donor is the complete R21 interaction contract, not only its tile renderer.

### R21 filters and controls
R21 inherits the R18/R14 control surface and then fixes control widths. The accepted filter UX is:
- Row 1: three equal fixed-width dimension selectors: Group, Color, Size; time window remains in the top header; AI POV and item count remain compact.
- Row 2: three equal filter-summary buttons aligned to Group / Color / Size.
- Each summary shows the active dimension label and `All`, one selected value, or `n of total`.
- Tapping a summary opens the compact chip chooser for that dimension; on mobile the chooser is a bottom sheet.
- Filter chips remain the actual canonical filter controls; the summary surface is a projection onto those controls, not a second filter state.
- The old R11 permanently exposed horizontal `Filters / legend` chip rail is not the R21 accepted surface and must not be shown.
- Any duplicate role pointing to the same dimension may share the same underlying filter set while retaining the three role-aligned summary slots R21 presents.
- Source filtering continues to govern event inclusion and Source-group identity.

### R21 Map tiles
- readable adaptive tiles;
- tight group headings;
- clickable group focus;
- adjacent × restore;
- fixed/equal dimension-control widths;
- no headline truncation in large/medium tiles and font fitting for smaller tiles.

## AI POV contract
- Exactly one Selected evidence list.
- Direct source/coverage URL(s) live under a chevron on each selected item.
- No separate Evidence packet surface.
- No duplicate editable provider/model/API-key controls in AI POV; configuration remains in Config.

## Library contract
- IndexedDB `prism/analyses` is authoritative.
- One AI run has exactly one persistence path.
- Initial AI completion persists automatically through the canonical R11 `saveCurrent()` path; no visible user Save/Add step.
- After automatic save, the completed record is re-read from IndexedDB before completion is accepted.
- Opening Library immediately after completion displays the completed Analysis card.
- Left rail: Omnisearch + independently scrollable Analysis cards.
- Right Analysis surface fills the available Library workspace height independently of card count.
- Right surface: compact header + `minmax(0,1fr)` scrollable transcript + compact paperclip/text/send compose row.
- Send performs Research web using the complete selected Analysis as context and appends to the same Analysis ID.

## Immediate correction gate
1. Restore the exact R21 summary-filter interaction over the existing canonical R11 filter state; do not create a second filter engine.
2. Use the existing hidden R11 chip buttons as the authoritative state/action targets, and project them into R21 summaries + chooser.
3. Keep the R21 Map renderer unchanged.
4. Keep the single-path AI-to-Library correction unchanged.
5. Keep AI POV simplification and Library geometry unchanged.

## Delivery process
1. Re-fetch exact target blobs before each write.
2. Update Plan and Graveyard first.
3. Add a dedicated R21-filter projection sidecar; no changes to canonical R11 state logic.
4. Load that sidecar in R25 after the R11 document is hydrated.
5. Mechanically verify the old `Filters / legend` rail is hidden, three R21 summary slots render, each chooser proxies canonical chip clicks, R21 Map patch SHA is unchanged, and existing Library/AI patches remain loaded.
6. Publish via existing Pages and return the exact cache-busted URL. Owner device testing remains the acceptance gate.
