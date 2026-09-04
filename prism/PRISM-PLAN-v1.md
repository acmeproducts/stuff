<!-- PRISM-PLAN v3.5.0 -->
# PRISM MASTER PLAN v3.5.0

## Governing baseline
PRISM remains governed by the exact last working standalone application baseline.

**ACTIVE BASELINE**
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`
- Status: **WORKING BASELINE / IMPLEMENTATION ANCESTOR**

R12–R25 are evidence only unless an individual behavior is explicitly accepted below. No iframe/nested-wrapper/bootstrap-fetch release is an implementation ancestor.

## Frozen accepted behavior
### R21 Map tiles — do not regress
- readable adaptive tiles;
- tight group headings;
- clickable group focus;
- adjacent × to restore all groups;
- fixed/equal dimension-control widths;
- no headline truncation in large/medium tiles and font fitting for smaller tiles.

### R13 filter/control behavior — restore exactly
The agreed filter contract is the R13-style two-row control surface, not the R11 flat scrolling chip rail:
- Row 1: exactly three equal role selectors: Group / Color / Size, then AI POV and filtered item count.
- Row 2: exactly three role-aligned filter summary buttons, one for Group, one for Color, one for Size.
- Each summary shows the active dimension label plus `All`, the single selected value, or `n of total`.
- If two roles use the same dimension, both role slots remain visible and mirror the same filter state.
- Tapping a summary opens the compact chip-only filter chooser for that dimension; on mobile it is a bottom sheet, not a horizontally scrolling legend rail.
- The old `Filters / legend` label plus permanently exposed flat chips is not acceptable.
- Library/AI work must not alter this filter contract.

## AI POV contract
- Exactly one Selected evidence list.
- Direct source/coverage URL(s) live under a chevron on each selected evidence item.
- No separate Evidence packet surface.
- No duplicate editable provider/model/API-key controls in AI POV; those remain in Config.
- Scope remains only where it changes the actual analysis corpus.

## Library contract
- IndexedDB `prism/analyses` is authoritative.
- Every AI run creates one durable Analysis ID at start.
- Provider completion must result in a completed record that is actually readable from IndexedDB and visible in Library without a user Save/Add step.
- While R25 still inherits the R11 internal `currentAnalysis` implementation, successful completion must automatically invoke the existing canonical persistence path so the base `analyses` array and IndexedDB cannot diverge. The Save control remains hidden; there is no user action.
- Any stale synthetic `in_process` record created by earlier R25 sidecars for the same prompt must be removed after the canonical completed record is confirmed.
- A run is not accepted until opening Library shows the completed card.

### Library layout
- Left rail: Omnisearch + independently scrollable Analysis cards.
- Right Analysis surface fills the entire available Library workspace height independent of card count.
- Right surface is three rows: compact header; `minmax(0,1fr)` independently scrollable transcript; compact compose row.
- Transcript can reach the true final rendered line.
- Composer is paperclip icon left + expanding text/paste field center + send icon right.
- Send performs Research web using the complete selected Analysis as context and appends to the same Analysis ID.

## Regression isolation
- R21 Map renderer remains untouched.
- R13-style filter renderer is restored without changing event/filter truth.
- AI/Library fixes must not reintroduce flat-chip filters, old tiles, duplicate evidence, or duplicate provider configuration.

## WorldPulse collector reliability
- Frequent collector uses shallow checkout.
- GDELT transport/429/5xx failures receive bounded retry/backoff.
- Valid prior history/index converts exhausted transient upstream failures to stale/no-refresh success.
- Malformed or inadequate successful data and no valid cache remain fatal.

## Delivery process
1. Re-fetch `main` and exact target blobs before each write.
2. Update Plan and Graveyard before candidate publication.
3. Preserve the existing R21 map patch unchanged.
4. Restore the R13 filter interaction contract over the existing underlying R11 filter state.
5. Replace observer-only Library completion with device-verifiable automatic canonical persistence and remove stale duplicate in-process records.
6. Assert: three filter summaries; compact chooser; one evidence list; no duplicate provider/model block; completed AI record present in Library; full-height detail; compact composer; R21 patch still unchanged.
7. Publish via existing Pages and return the exact cache-busted URL. Owner device testing is the functional acceptance gate.
