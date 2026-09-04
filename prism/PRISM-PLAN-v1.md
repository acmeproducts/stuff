<!-- PRISM-PLAN v3.4.0 -->
# PRISM MASTER PLAN v3.4.0

## Governing baseline
PRISM remains governed by the exact last working standalone application baseline.

**ACTIVE BASELINE**
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`
- Status: **WORKING BASELINE / IMPLEMENTATION ANCESTOR**

R12–R25 are evidence only unless an individual behavior is explicitly called out below as accepted donor behavior. No iframe/nested-wrapper/bootstrap-fetch release is an implementation ancestor.

## Frozen accepted behavior
### R21 Map tiles — do not regress
The owner-approved R21 Map behavior is frozen:
- readable adaptive tiles;
- tight group headings;
- clickable group focus;
- adjacent × to restore all groups;
- fixed/equal dimension-control widths;
- no headline truncation in large/medium tiles and font fitting for smaller tiles.
Any Library/AI change must leave this renderer unchanged.

### Library target
- IndexedDB `prism/analyses` is authoritative.
- Every AI run creates one durable Analysis ID before provider execution and completion writes directly back to that exact record.
- No hidden Save/Add-to-Library dependency and no heuristic migration to another card.
- Library startup and every completed analysis refresh the card list from IndexedDB.
- Selected Analysis right pane fills the full available Library page height independent of the number/height of cards in the left rail.
- Right pane is three rows: compact header; `minmax(0,1fr)` independently scrollable transcript; compact compose row.
- Transcript reaches the real bottom and is not clipped/occluded by the composer.
- Compose is one sticky chat row: paperclip icon left, expanding text field center, send icon right.
- Send performs current-web research using the complete selected Analysis as context and appends to the same Analysis ID.

## Immediate R25 correction gate
### AI POV simplification
- There is exactly one selected-evidence list.
- The separate Evidence packet list is removed as redundant.
- Each selected-evidence item owns a compact chevron disclosure. Expanding it reveals its direct source/coverage URL(s); collapsed state keeps the AI POV compact.
- Provider/model/API-key configuration is not duplicated inside AI POV. Provider credentials/models remain configured and verified in Config only.
- AI POV may show only the already-selected/verified provider status if operationally useful; it must not expose duplicate editable provider/model/key controls.
- Scope remains part of the analysis request only where it adds distinct behavior.

### Direct persistence acceptance gate
A run is not considered successful until all of the following are true:
1. A durable Analysis card exists immediately with `in_process` status.
2. Provider completion updates the same ID to `complete` with the rendered response.
3. Opening Library shows that card without requiring Save/Add-to-Library.
4. Selecting it displays the complete analysis in the full-height right pane.
5. The bottom compose row remains visible and follow-up Research web appends a new turn to the same record.

### Regression isolation
- AI POV and Library corrections must not modify R21 Map tile DOM/CSS/render logic.
- No release is advanced if Map tiles differ from the accepted R21 geometry before the Library gate is testable.

## Explore / Source / Map standing scope
- Explore remains lightweight cardinality-driven clustering with ordinary vertical scrolling.
- Selected Source values govern event inclusion and Source grouping truthfully.
- Custom RSS/Atom/common JSON sources must enter the shared corpus with truthful state/counts.
- Three role-aligned Group/Color/Size controls remain visible and stable.

## WorldPulse collector reliability
- Frequent collector uses shallow checkout.
- GDELT transport/429/5xx failures receive bounded retry/backoff.
- If valid prior history/index exist, exhausted transient upstream failures retain cache and exit as successful stale/no-refresh runs.
- Malformed data, inadequate mapped data after a successful response, invalid windows, or absence of a valid cache remain fatal.

## Delivery process
1. Re-fetch `main` and exact target blobs before every write.
2. Update Plan and Graveyard before candidate publication.
3. Make only the smallest correction needed for the current acceptance gate.
4. Preserve frozen R21 Map behavior byte-for-behavior while changing AI/Library.
5. Mechanically assert: one evidence list; no duplicate editable provider/model controls in AI POV; selected-item URL disclosure; exact Analysis-ID lifecycle; full-height Library stage; compact compose strip; R21 Map patch still loaded unchanged.
6. Publish through existing Pages deployment.
7. Return exact cache-busted Pages URL. Owner device testing is the functional acceptance gate.
