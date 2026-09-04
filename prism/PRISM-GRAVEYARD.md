<!-- PRISM-GRAVEYARD v3.6.0 -->
# PRISM GRAVEYARD v3.6.0

## Governance
Rejected work is evidence, not an implementation ancestor. Owner device testing is the functional acceptance gate.

## Active baseline
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`

## Frozen donors
### Compact dynamic dimension filters
The accepted model is the earlier governed active-dimension filter model, not the R25 reconstruction of three role-summary buttons.
- only dimensions active in Group / Color / Size have filters;
- duplicate dimensions collapse to one shared filter set;
- colored chips are both filters and legend;
- no redundant separate legend/chooser;
- changing role dimensions immediately changes the visible filter sets;
- Source filtering must also govern Source group identity.

### R21 Map
Adaptive readable tiles, tight group headings, group focus/adjacent × restore, fixed role-control widths and font fitting/no large-tile truncation remain frozen.

## Standing vetoes
- No invented three-summary-button filter UI presented as restored accepted behavior.
- No filters for inactive dimensions.
- No duplicate filters when Group/Color/Size share a dimension.
- No separate legend duplicating colored filter chips.
- No unselected Source group under active Source filtering.
- No regression of R21 Map.
- No duplicate evidence/provider configuration in AI POV.
- No user Save/Add-to-Library step after AI completion.
- No claim of Library success until completed Analysis is visible there.
- No Library detail height derived from card-stack height.
- No stacked Attach/Research controls or composer overlay.
- No iframe/nested-wrapper/runtime baseline-fetch candidate as a legitimate release.

## R25 failure record
### Filter failure 1 — old surface returned
R25 inherited R11's older ribbon while other later behavior was being patched. The broader regression was correctly identified, but the attempted correction then restored the wrong filter generation.

### Filter failure 2 — wrong historical behavior was declared accepted
The v3.5 plan/graveyard incorrectly promoted a reconstructed R13 three-summary-button/chooser interaction to frozen accepted behavior. Repository history shows the actual governed requirement was the compact dynamic active-dimension model: filters only for active dimensions, duplicate dimensions collapsed, colored chips serving as the legend. The R25 `prism-r25-r13-filters.js` sidecar is therefore rejected.

### Library persistence failure
Completed AI output was visible while no corresponding Analysis appeared in Library. R11 persisted only through `saveCurrent()`; hiding Save without moving completion into canonical persistence caused divergence. Current correction automatically follows the canonical save path after successful output and refreshes Library.

### AI POV redundancy
Selected evidence and Evidence packet duplicated the same events; provider/model controls were duplicated from Config. One evidence list with per-item URL disclosure remains required.

### Library geometry
Full-height independent right detail and compact paperclip/text/send composer remain required.

## Current correction contract
1. **Filters:** compact dynamic active-dimension colored-chip filters/legend; only active dimensions; duplicate dimensions collapse.
2. **Map:** preserve R21 tiles unchanged.
3. **AI POV:** one evidence list + per-item URL chevrons; Config-only provider editing.
4. **Persistence:** completed provider output automatically persists and becomes immediately visible in Library.
5. **Library:** full-height independent right detail + compact bottom research composer.
6. **Explore/Source:** lightweight clustering and truthful Source filtering/ingestion.
7. **WorldPulse:** transient network resilience without hiding genuine integrity failures.
