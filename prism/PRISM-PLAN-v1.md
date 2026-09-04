<!-- PRISM-PLAN v3.6.0 -->
# PRISM MASTER PLAN v3.6.0

## Governing baseline
PRISM remains governed by the exact last working standalone application baseline.

**ACTIVE BASELINE**
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`

## Frozen accepted behavior
### Filters — compact dynamic active-dimension model
The prior v3.5 assumption that R13 summary buttons were the accepted filter UX was incorrect and is withdrawn.

The governed filter model established before R13 is:
- filters exist only for dimensions currently active in Group / Color / Size;
- if multiple roles use the same dimension, that dimension has one shared filter set, not duplicate role filters;
- filter values are immediately visible as compact colored chips;
- those same colored chips are the legend; there is no redundant separate legend or modal chooser;
- changing Group / Color / Size immediately removes inactive-dimension filters and adds newly active ones;
- `All` means the dimension is unrestricted; individual chips directly toggle inclusion;
- Source filtering governs both event inclusion and Source group identity so no unselected Source group can remain visible;
- ribbon remains compact and horizontally scrollable only when the active chip inventory cannot fit.

### R21 Map tiles — do not regress
- readable adaptive tiles;
- tight group headings;
- clickable group focus;
- adjacent × to restore all groups;
- fixed/equal dimension-control widths;
- no headline truncation in large/medium tiles and font fitting for smaller tiles.

## AI POV contract
- Exactly one Selected evidence list.
- Direct source/coverage URL(s) live under a chevron on each selected evidence item.
- No separate Evidence packet surface.
- No duplicate editable provider/model/API-key controls in AI POV; those remain in Config.

## Library contract
- IndexedDB `prism/analyses` is authoritative.
- Completed AI work must automatically persist through the canonical Library path; no user Save/Add step.
- Completed record must be visible in Library immediately.
- Left rail: Omnisearch + independently scrollable Analysis cards.
- Right Analysis surface fills the entire available Library workspace height independent of card count.
- Right surface is compact header + independently scrollable transcript + compact paperclip/text/send compose row.
- Send performs Research web using the complete selected Analysis as context and appends to the same Analysis ID.

## Regression isolation
- Do not replace compact dynamic chips with three summary buttons or a separate filter chooser.
- Do not alter R21 Map tile renderer while changing filters, AI, or Library.
- Do not reintroduce duplicate evidence/provider surfaces.

## WorldPulse collector reliability
- Frequent collector uses shallow checkout.
- GDELT transport/429/5xx failures receive bounded retry/backoff.
- Valid prior history/index converts exhausted transient upstream failures to stale/no-refresh success.
- Malformed/inadequate successful data or no valid cache remains fatal.

## Delivery process
1. Re-fetch target blobs before each write.
2. Update Plan and Graveyard before candidate publication.
3. Remove the incorrect R13-summary filter sidecar from R25.
4. Preserve the canonical compact dynamic active-dimension chip model and R21 Map patch unchanged.
5. Preserve the current AI/Library persistence and full-height Library corrections.
6. Publish via existing Pages and return the exact cache-busted URL. Owner device testing remains the acceptance gate.
