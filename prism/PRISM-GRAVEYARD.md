<!-- PRISM-GRAVEYARD v3.4.0 -->
# PRISM GRAVEYARD v3.4.0

## Governance
Rejected work is evidence, not an implementation ancestor. Owner device testing is the functional acceptance gate; mechanical checks do not substitute for acceptance.

## Active baseline
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`
- Status: **WORKING BASELINE**

## Standing vetoes
- No unrelated redesign while correcting a governed defect.
- No removal/regression of accepted R21 Map tile behavior during AI/Library work.
- No duplicate evidence representations in AI POV when they represent the same selected events.
- No separate Evidence packet list duplicating Selected evidence.
- No duplicate editable provider/model/API-key configuration in AI POV; configuration belongs in Config.
- No Add/Save-to-Library step after Run Analysis.
- No heuristic result-to-card matching; one run owns one durable Analysis ID through completion.
- No claim that an AI run is complete unless its Analysis record is actually present/readable in Library.
- No Library detail height derived from Analysis-card count/content height.
- No stacked full-width Attach/Research controls; composer is paperclip + text + send.
- No compose strip that overlays or steals transcript reading height.
- No iframe/nested-wrapper/runtime baseline-fetch candidate as a legitimate release.
- No full-corpus Explore DOM cloud or hidden rerender fan-out.
- No unselected Source group under active Source filtering.
- No scheduled collector converting recoverable upstream timeout into repeated failure notifications while valid cache exists.

## Rejected lineage
### R6–R20
Historical evidence only. R17 temporary release machinery is specifically rejected. R18 was an invalid alias. R19–R20 were wrapper experiments.

### R21 — accepted Map donor
R21 itself is an experimental wrapper, but its Map renderer is frozen accepted behavior: adaptive readable tile sizing, tight group headings, group click focus, adjacent × restore, fixed dimension-control widths, and font fitting/no large-tile truncation. Later work must not regress it.

### R22–R24 — rejected Library ancestry
R22 hid the Analysis rail. R23/R24 relied on nested runtime lineage, competing CSS/handlers, side-effect persistence and/or heuristic provider-result association. Evidence only.

### R25 — repeated AI/Library regression cycle
Owner testing across successive R25 patches exposed multiple failures that must be treated as one systemic regression class rather than isolated CSS bugs.

**A. Compose geometry failure**
- Attachment and Research web became stacked large controls.
- Transcript did not own the full remainder or guarantee a reachable bottom.
- Root cause: inherited composer rules were patched incrementally rather than establishing one authoritative three-row Library stage and compact composer contract.

**B. Detail surface gated by card/list content**
- Right Analysis surface height visually tracked the left card stack instead of filling the Library workspace.
- Root cause: `height:100%` was applied inside an ancestor layout whose available height was content-derived; the detail pane lacked an independent full-workspace sizing contract.

**C. R21 Map regression during Library work**
- Accepted R21 tile behavior disappeared when a later candidate returned to R11 and applied Library patches without porting the accepted Map renderer.
- Root cause: accepted donor behavior was documented but not treated as a frozen regression gate. A feature correction was allowed to change ancestry/surface composition without checking the accepted Map contract.
- Permanent rule: AI/Library work may not touch the R21 Map patch/render path; candidate is rejected if tile behavior differs.

**D. AI POV redundancy returned**
- Selected evidence and Evidence packet display the same underlying events; one merely adds URLs.
- Provider/model controls also returned to AI POV despite configuration already living in Config.
- Root cause: inheriting R11 AI POV wholesale reintroduced controls/content that earlier releases had intentionally removed, and subsequent patches targeted Library/Map without reapplying the simplified AI contract.
- Permanent rule: one Selected evidence list only; URLs live under per-item chevrons; provider/model/key editing exists only in Config.

**E. AI completion still not verifiably entering Library**
- Owner can see completed AI output in AI POV but cannot find/select the corresponding completed Analysis in Library, so Library layout/continuation cannot be acceptance-tested.
- Earlier implementation created an `in_process` IndexedDB record but completion depended on hidden legacy Save Analysis behavior; later MutationObserver patch attempted direct persistence but still did not produce a device-verifiable Library record.
- Root cause class: persistence was attached as an observer/sidecar to legacy AI output rather than making the Analysis record the authoritative run object whose state transition drives both AI POV output and Library projection.
- Permanent rule: Run Analysis creates ID → provider execution belongs to ID → provider result writes ID → Library list hydrates ID. No Save click, no guessed record, no observer-only completion contract. An analysis is not considered complete until `get(id)` returns the completed record and the Library projection can select/render it.

## WorldPulse collector failure / repeated GitHub email root cause
- Workflow runs every 15 minutes.
- Historical `fetch-depth:0` unnecessarily fetched full repository history.
- GDELT GKG HTTPS TLS/SSL timeout propagated as fatal while optional DOC enrichment degraded differently.
- Repetition created GitHub failure-email noise.
- Permanent rule: shallow checkout; bounded retry/backoff; valid cache converts exhausted transient upstream failures to stale/no-refresh success; malformed/inadequate successful data or no valid cache remains fatal.

## Current correction contract
1. **Map:** frozen R21 tile behavior.
2. **AI POV:** one evidence list; each item has chevron-disclosed direct URL/coverage; no duplicate editable provider/model/key block.
3. **Persistence:** exact durable Analysis ID from run start through provider completion; completed record must be immediately Library-readable.
4. **Library:** left Analysis rail + full-height independent right detail; transcript fills/scrolls remainder; compact sticky paperclip/text/send compose strip; send performs current-web research using complete Analysis context and appends to same ID.
5. **Explore/Source:** lightweight clustering and truthful source filtering/ingestion.
6. **WorldPulse:** transient network resilience without suppressing genuine integrity failures.

No further PRISM candidate should be advanced by fixing one item while regressing another item in this contract.
