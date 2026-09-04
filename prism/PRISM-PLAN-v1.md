<!-- PRISM-PLAN v3.7.0 -->
# PRISM MASTER PLAN v3.7.0

## Governing baseline
PRISM remains governed by the exact last working standalone application baseline.

**ACTIVE BASELINE**
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`

## Frozen accepted behavior
### Filters — compact dynamic active-dimension model
- filters exist only for dimensions currently active in Group / Color / Size;
- duplicate dimensions collapse to one shared filter set;
- colored chips are both filters and legend;
- changing Group / Color / Size immediately removes inactive-dimension filters and adds newly active ones;
- `All` means unrestricted; individual chips directly toggle inclusion;
- Source filtering governs both event inclusion and Source group identity;
- compact horizontal scrolling is allowed only when the active chip inventory cannot fit.

### R21 Map tiles — do not regress
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
- R25 must not create a synthetic sidecar Analysis record in parallel with the canonical R11 `currentAnalysis` record.
- Successful provider completion automatically invokes the existing canonical `saveCurrent()` path through the hidden Save control; the user never sees or presses Save.
- After automatic save, the completed record is re-read from IndexedDB before the run is considered complete.
- Opening Library immediately after completion must display that completed Analysis card.
- Left rail: Omnisearch + independently scrollable Analysis cards.
- Right Analysis surface fills the entire available Library workspace height independent of card count.
- Right surface: compact header + `minmax(0,1fr)` scrollable transcript + compact paperclip/text/send compose row.
- Send performs Research web using the complete selected Analysis as context and appends to the same Analysis ID.

## Immediate correction gate
The current R25 contains two competing AI-to-Library mechanisms: `prism-r25-library-v2.js` creates/updates a synthetic Analysis from `aiResult`, while `prism-r25-ai-library-gate.js` also invokes the canonical Save path. This split authority is rejected.

Correction:
1. Remove AI-run persistence ownership from `prism-r25-library-v2.js`; it owns Library rendering and continuation only.
2. Make `prism-r25-ai-library-gate.js` the sole automatic completion bridge to canonical `saveCurrent()`.
3. On run start capture existing Analysis IDs; on stable successful completion click canonical Save once; re-read IndexedDB; require a newly saved completed record; then open Library.
4. Do not publish if the completed record cannot be found after the canonical save.
5. Leave filter behavior and the R21 Map patch unchanged.

## WorldPulse collector reliability
- shallow checkout;
- bounded retry/backoff for transport/429/5xx;
- valid cache converts exhausted transient upstream failures to stale/no-refresh success;
- malformed/inadequate successful data or no valid cache remains fatal.

## Delivery process
1. Re-fetch exact target blobs before each write.
2. Update Plan and Graveyard before implementation.
3. Remove the duplicate synthetic persistence path.
4. Strengthen canonical auto-save verification.
5. Preserve filters, R21 tiles, AI POV simplification, and Library geometry unchanged.
6. Publish via existing Pages and return the exact cache-busted URL. Owner device testing remains the acceptance gate.
