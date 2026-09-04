<!-- PRISM-GRAVEYARD v3.8.0 -->
# PRISM GRAVEYARD v3.8.0

## Governance
Rejected work is evidence, not an implementation ancestor. Owner device testing is the functional acceptance gate.

## Active baseline
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`

## Frozen donor: R21 complete visible interaction
### R21 filter/control surface
Repository evidence shows R21 runs over R18/R14, whose visible filter surface is three role-aligned summary buttons opening a chip chooser. R21 itself explicitly fixes `.filterSummaries`, `.filterTrigger`, and `.dimensionCtl` widths. Therefore the repeated claim that the accepted R21 filter UX was R11's permanently exposed dynamic chip rail was false.

Frozen R21 behavior:
- three equal dimension controls: Group / Color / Size;
- three equal aligned filter-summary buttons beneath them;
- summary = dimension + All/single/n-of-total;
- tapping summary opens compact canonical chip chooser; mobile uses bottom sheet;
- canonical chip state remains the only filter state;
- no permanently exposed R11 `Filters / legend` rail;
- Source filter truth continues to govern Source groups.

### R21 Map
Adaptive readable tiles, tight group headings, group focus/adjacent × restore, fixed role-control widths and font fitting/no large-tile truncation remain frozen.

## Standing vetoes
- No claim that R11's permanently exposed chip rail is the accepted R21 filter UI.
- No second independent filter state layered over canonical filters.
- No regression of R21 Map.
- No duplicate evidence/provider configuration in AI POV.
- No user Save/Add-to-Library step after AI completion.
- No competing AI-to-Library persistence mechanisms.
- No claim of Library success until a completed Analysis is re-read from IndexedDB.
- No Library detail height derived from card-stack height.
- No stacked Attach/Research controls or composer overlay.

## R25 failure record
### Filter failure — donor identity repeatedly wrong
R25 repeatedly fell back to R11 filters, then a correction was removed because the Plan incorrectly described the old chip rail as the accepted behavior. Historical R21 source proves the opposite: R21 explicitly styles `.filterSummaries` and `.filterTrigger`, inherited from R18/R14. This is now a permanent governance correction: when the owner says R21 was perfect, R21's complete visible control surface is the donor.

### Map
R21 Map behavior remains frozen and must not change while filters are corrected.

### AI POV
One selected-evidence list with URL disclosure; no duplicate Evidence packet or provider configuration.

### Library
One canonical automatic persistence path; completed record must appear immediately; right detail fills workspace; compact bottom Research web composer.

## Current correction contract
1. **Filters:** restore R21 summary buttons + chooser as a projection of canonical R11 chip state.
2. **Map:** preserve R21 tile patch unchanged.
3. **AI POV:** one evidence list + URL chevrons; Config-only provider editing.
4. **Persistence:** canonical automatic save only.
5. **Library:** confirmed completed record visible immediately; full-height detail + compact composer.
