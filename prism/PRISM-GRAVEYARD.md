<!-- PRISM-GRAVEYARD v3.5.0 -->
# PRISM GRAVEYARD v3.5.0

## Governance
Rejected work is evidence, not an implementation ancestor. Owner device testing is the functional acceptance gate; mechanical checks do not substitute for acceptance.

## Active baseline
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`

## Frozen donors
### R13 filter interaction
Accepted filter UX is the role-aligned two-row R13 contract: three Group/Color/Size selectors plus three corresponding summary buttons that open compact chip choosers. The R11 flat horizontally scrolling `Filters / legend` chip rail is rejected and must not return.

### R21 Map
Accepted Map donor remains adaptive readable tiles, tight group headings, group focus/adjacent × restore, fixed role-control widths and font fitting/no large-tile truncation.

## Standing vetoes
- No flat R11 `Filters / legend` chip rail after the R13 filter contract has been accepted.
- No loss of any Group/Color/Size filter slot when dimensions overlap.
- No regression of R21 Map while changing filters, AI, or Library.
- No duplicate Selected evidence/Evidence packet surfaces.
- No duplicate editable provider/model/API-key controls in AI POV.
- No user Save/Add-to-Library step after Research with AI.
- No observer-only or prompt-guess persistence presented as successful Library integration.
- No claim of Library success until the completed Analysis is visibly projected from IndexedDB.
- No Library detail height derived from card-stack height.
- No stacked Attach/Research controls or composer overlay.
- No iframe/nested-wrapper/runtime baseline-fetch candidate as a legitimate release.

## R25 — rejected as a release; retain only isolated evidence
R25 accumulated sidecar patches over R11 and repeatedly restored older UI while attempting to fix later surfaces. It is not an implementation ancestor.

### Failure A — filter regression was missed entirely
The owner screenshot on 2026-09-03 showed the old R11 top ribbon: plain Group/Color/Size selects plus a horizontally scrolling `Filters / legend` row of exposed chips. This is several releases behind the already-working R13 filter contract.

**Root cause**
- R25 bootstraps exact R11 and its patches focused on Map, Library and AI.
- The accepted R13 filter renderer (`filterSummaries`, `filterTrigger`, compact `filterPanel`) was never ported.
- Prior governance froze R21 tiles but failed to freeze the R13 filter interaction with equal specificity, so a visually obvious regression passed the release process.

**Permanent rule**
Filter UX is now a named frozen donor. Any candidate showing `Filters / legend` + permanently exposed chip blocks is mechanically rejected before device testing.

### Failure B — completed AI output still did not enter Library
The screenshot shows a fully rendered AI answer, yet owner testing found no corresponding Library Analysis.

**Root cause**
- R11 `runAI()` creates `currentAnalysis` only after the provider succeeds, but persistence occurs only in `saveCurrent()`.
- R25 hid the Save button without changing that canonical completion path.
- A sidecar separately created an `in_process` IndexedDB record and later tried to infer/match the run by prompt/MutationObserver. That produced two competing state machines: legacy `currentAnalysis`/`analyses` and sidecar IndexedDB lifecycle.
- Even when the sidecar wrote a record, the inherited Library renderer's in-memory `analyses` array could remain stale, so device-visible Library state was not guaranteed.

**Permanent rule**
Until the standalone implementation is rebuilt, an R25 correction must automatically invoke the canonical save path after provider success, verify the completed record, refresh the inherited Library projection, and remove any stale sidecar in-process duplicate. Long-term standalone candidate must make the Analysis ID authoritative inside `runAI()` itself.

### Failure C — AI POV redundancy
Selected evidence and Evidence packet duplicated the same events; provider/model configuration reappeared in AI POV. Permanent rule remains one evidence list with per-item URL disclosure and Config-only provider editing.

### Failure D — Library geometry
Earlier R25 passes stacked composer controls and allowed the right detail surface to be content/card-height constrained. Permanent contract remains full-height right pane with independently scrolling transcript and compact paperclip/text/send composer.

## Current correction contract
1. **Filters:** restore frozen R13 two-row role-aligned summary/chooser interaction.
2. **Map:** preserve frozen R21 tiles unchanged.
3. **AI POV:** one evidence list + per-item URL chevrons; no duplicate provider/model editor.
4. **Persistence:** completed provider output automatically follows canonical persistence and becomes immediately visible in Library; no Save click and no prompt-guess-only lifecycle.
5. **Library:** full-height independent right detail + compact bottom research composer.
6. **Explore/Source:** lightweight clustering and truthful source filtering/ingestion.
7. **WorldPulse:** transient network resilience without hiding genuine integrity failures.

No further candidate advances if any frozen donor is absent, even if the current defect appears fixed.
