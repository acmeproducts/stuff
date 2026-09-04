<!-- PRISM-GRAVEYARD v3.7.0 -->
# PRISM GRAVEYARD v3.7.0

## Governance
Rejected work is evidence, not an implementation ancestor. Owner device testing is the functional acceptance gate.

## Active baseline
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`

## Frozen donors
### Compact dynamic dimension filters
- only dimensions active in Group / Color / Size have filters;
- duplicate dimensions collapse to one shared filter set;
- colored chips are both filters and legend;
- changing role dimensions immediately changes visible filter sets;
- Source filtering governs Source group identity.

### R21 Map
Adaptive readable tiles, tight group headings, group focus/adjacent × restore, fixed role-control widths and font fitting/no large-tile truncation remain frozen.

## Standing vetoes
- No filters for inactive dimensions, duplicate role filters, or redundant separate legend.
- No regression of R21 Map.
- No duplicate evidence/provider configuration in AI POV.
- No user Save/Add-to-Library step after AI completion.
- No two competing AI-to-Library persistence mechanisms.
- No claim of Library success until a completed Analysis is actually re-read from IndexedDB.
- No Library detail height derived from card-stack height.
- No stacked Attach/Research controls or composer overlay.
- No iframe/nested-wrapper/runtime baseline-fetch candidate as a legitimate release.

## R25 failure record
### Filters
R25 repeatedly inherited or reconstructed obsolete filter surfaces. The accepted model is the compact dynamic active-dimension colored-chip filter/legend model. The later three-summary-button reconstruction is rejected.

### Map
R21 tile behavior was previously lost during unrelated Library work. It is now a frozen donor and may not change during this correction.

### AI POV
Selected evidence and Evidence packet duplicated the same events; provider/model controls duplicated Config. One evidence list with per-item URL disclosure remains required.

### Library geometry
Right Analysis detail must fill the workspace independently of left-card count and terminate in the compact paperclip/text/send Research web composer.

### Library persistence failure — root cause refined
The current R25 has two competing persistence owners:
1. `prism-r25-library-v2.js` intercepts Run Analysis, creates a synthetic `in_process` Analysis ID, observes `aiResult`, and updates that synthetic record.
2. `prism-r25-ai-library-gate.js` separately observes the same output and attempts to invoke R11's canonical hidden Save path.

This is split authority over the same run. It can create duplicate/stale records, race completion, and leave the visible Library projection disconnected from R11's canonical `currentAnalysis` lifecycle.

**Permanent rule:** one run, one persistence owner. R25 Library code renders/searches/selects/continues saved analyses only. Initial AI completion persists solely through the canonical R11 Save path, automatically and invisibly. Completion is not accepted until a newly saved completed record is re-read from IndexedDB and Library is opened from that confirmed state.

## Current correction contract
1. **Filters:** compact dynamic active-dimension colored-chip filters/legend.
2. **Map:** preserve R21 tiles unchanged.
3. **AI POV:** one evidence list + per-item URL chevrons; Config-only provider editing.
4. **Persistence:** one canonical automatic save path; no synthetic parallel Analysis.
5. **Library:** confirmed completed record visible immediately; full-height detail + compact bottom research composer.
6. **Explore/Source:** lightweight clustering and truthful Source filtering/ingestion.
7. **WorldPulse:** transient network resilience without hiding genuine integrity failures.
