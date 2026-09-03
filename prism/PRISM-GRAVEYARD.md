<!-- PRISM-GRAVEYARD v3.3.0 -->
# PRISM GRAVEYARD v3.3.0

## Governance
Rejected work is evidence, not an implementation ancestor. Owner device testing is the functional acceptance gate; mechanical checks do not substitute for acceptance.

## Active baseline
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`
- Status: **WORKING BASELINE**

## Standing vetoes
- No synthesized rollback when an exact working artifact exists.
- No PRISM-specific temporary GitHub Actions/recovery workflow as the normal publishing mechanism.
- No WSL/repository orchestration architecture for this static browser application.
- No whole-repository rollback in the shared repository.
- No unrelated redesign while correcting governed defects.
- No removal of established functionality to fix one surface.
- No metadata-only source-add success claim.
- No Library state that loses Omnisearch, Analysis-list access, selected detail, or Research web continuation on mobile.
- No Library implementation where DOM cards are the persistence source of truth.
- No heuristic matching of provider results to an in-process card; every run binds to its own durable Analysis ID.
- No Add/Save-to-Library step after Run Analysis.
- No iframe, nested-wrapper, or runtime baseline-fetch candidate as a legitimate release.
- No Explore implementation that creates/transforms one DOM object per event across the full corpus.
- No hidden Map/Explore/Feed rerender fan-out during ordinary interaction.
- No unselected Source group under an active Source filter.
- No disappearing Group/Color/Size filter slot when roles share a dimension.
- No claim that syntax/DOM assertions prove UX acceptance.
- No stacked full-width `Attach` + `Research web` controls in a Library Analysis pane.
- No compose strip that overlays, occludes, or steals the scrollable height required by the Analysis transcript.
- No scheduled collector that converts a recoverable upstream network timeout into repeated failure notifications while a valid cached dataset exists.
- No full-history repository checkout for a frequent data collector that only requires the current tree.

## Rejected lineage
### R6–R10
Historical correction artifacts only. Their individual findings remain evidence.

### R12
Superseded after mobile readability and three-slot filter defects were found.

### R13
Rejected for treemap readability, distant filter interaction and research-workflow defects.

### R14
Rejected in owner device testing because open-Analysis mobile state lost immediate Omnisearch access, the continuation/current-web action was not visible, and inherited Explore froze.

### R15–R16
Rejected. They did not preserve the intended application closely enough.

### Failed R17 release mechanism
Rejected before application publication. Temporary GitHub Actions release machinery failed and was removed. Do not retry it.

### R18
Invalid release alias: byte-for-byte reuse of rejected R14 application content under a new release name.

### R19–R20
Experimental wrapper/runtime patches. Useful Map/Explore evidence only; not governed ancestors.

### R21
Experimental wrapper. Owner accepted visible Map tile sizing, group-heading proximity, group-click focus/adjacent × restore behavior and fixed dimension-control sizing. Port behavior only.

### R22
Rejected Library direction because opening an Analysis hid the Library Analysis rail.

### R23
Rejected architecture despite closer visual direction. Nested rejected runtime lineage and no authoritative IndexedDB Analysis model.

### R24
Rejected structurally unusable Library implementation.
- Nested runtime chain and competing documents/CSS/handlers.
- IndexedDB side-effect writes rather than authoritative hydration model.
- Synthetic and existing cards used different paths.
- Provider result association was heuristic instead of exact Analysis-ID binding.
- Portrait behavior remained vulnerable to overlapping mobile CSS.

### R25 — partial improvement, compose geometry rejected
Owner portrait test on 2026-09-03 showed meaningful improvement in persistent Library master/detail visibility, card selection and Analysis rendering, but exposed a new concrete layout failure.

**Observed defect**
- Attachment rendered as a large full-width `Attach` button.
- Research continuation rendered as a second large full-width `Research web` button.
- Together with the textarea these controls occupied/overlaid a large portion of the Analysis pane.
- The Analysis transcript did not behave as the sole flex/grid remainder with an independently reachable bottom, so the composer visibly occluded useful reading area and did not guarantee that the final transcript content could be scrolled clear of it.

**Root cause**
- R25 inserted attachment as an additional button into the inherited composer without redefining the composer as a compact horizontal chat-control row.
- Its CSS made `.libraryStage` a three-row grid but retained inherited composer layout rules and used `position:sticky`; the new attachment button and existing full-width action therefore participated as stacked controls instead of fixed-width edge icons.
- The transcript had `overflow:auto` but no explicit composer-aware bottom scroll padding/final-layout scroll guarantee. The result was nominal scrolling without a reliable unobstructed terminal reading position.
- R25 itself is also a runtime bootstrap-fetch wrapper over R11, so it remains evidence rather than a legitimate standalone release.

**Permanent correction rule**
- Composer is one horizontal row: paperclip icon left, expanding textarea center, send icon right; labels are accessible names/tooltips, not large visible buttons.
- Transcript is `minmax(0,1fr)`, independently scrollable, has bottom scroll padding, and is scrolled after rendered Markdown settles.
- Pending attachment names may add a compact secondary line only when needed.

## WorldPulse collector failure / repeated GitHub email root cause
Observed recurring `WorldPulse data collector / collect` failures are not an email-system defect.

**Trigger chain**
1. `.github/workflows/worldmood-collector.yml` is scheduled every 15 minutes.
2. Checkout uses `fetch-depth: 0`, so every run unnecessarily retrieves full repository/branch history before collection.
3. `worldmood-collector.py:get_json()` makes GDELT HTTPS requests with a single `urllib.request.urlopen(..., timeout=45)` attempt.
4. A GDELT TLS/SSL handshake timeout propagates as an unhandled exception from the GKG path.
5. Python exits non-zero; the collect job fails; GitHub produces annotations/failure notification email.
6. Because the schedule repeats every 15 minutes, intermittent upstream failures create repeated inbox noise.

**Deep-request failure classification**
- GDELT GKG and DOC are remote dependencies and may time out, reset TLS, throttle, or return temporary 5xx/429 responses independently of PRISM/WorldPulse correctness.
- `quality_titles()` already catches its DOC failure and degrades to an empty title supplement, but the primary `gkg()` request has no equivalent retry/fallback boundary.
- The primary data request therefore has stricter fatal behavior than the optional enrichment request, despite an existing rolling history/index being specifically designed to preserve recent valid data.

**Permanent correction rule**
- Bounded retry/backoff for transient transport/429/5xx errors.
- Valid cached WorldPulse history/index means exhausted transient upstream retries become `stale/cache retained` and successful no-op execution, not workflow failure.
- No valid cache, malformed response, too-small mapped pull after a successful upstream response, or window-integrity failure remains fatal.
- Frequent workflow uses shallow checkout; only bounded history needed for a rebase is fetched at commit time.

## Current correction contract
1. Library: authoritative IndexedDB master/detail; compact icon compose strip; independently scrollable full-height transcript; exact Analysis-ID lifecycle.
2. Explore: lightweight cardinality-driven clustering, no transformed full-corpus cloud.
3. Source/filter: truthful ingestion and stable defaults.
4. Map/mobile: port owner-accepted R21 behavior without wrapper ancestry.
5. WorldPulse: shallow scheduled checkout plus retry/cache-retention handling for transient GDELT failures while preserving hard integrity failures.

The next legitimate PRISM candidate begins from exact standalone R11 and implements corrections directly. R18–R25 may supply behavioral evidence only.
