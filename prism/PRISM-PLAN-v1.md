<!-- PRISM-PLAN v3.3.0 -->
# PRISM MASTER PLAN v3.3.0

## Governing baseline
PRISM remains governed by the exact last working standalone application baseline.

**ACTIVE BASELINE**
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`
- Status: **WORKING BASELINE / IMPLEMENTATION ANCESTOR**

R12–R25 are evidence only unless an individual behavior is explicitly called out below as accepted donor behavior. No iframe/nested-wrapper/bootstrap-fetch release is an implementation ancestor. No PRISM-specific release machinery, WSL publishing architecture, or whole-repository rollback is permitted for ordinary application development.

## Owner-accepted donor behavior
The Map behavior demonstrated in R21 is accepted evidence and must be ported into the next legitimate standalone candidate without adopting the R21 wrapper architecture:
- readable adaptive tiles;
- tight group headings;
- clickable group focus;
- adjacent × to restore all groups;
- fixed/equal dimension-control widths;
- no headline truncation in large/medium tiles and font fitting for smaller tiles.

R25 portrait Library behavior is accepted only as directional evidence: persistent Analysis rail, selectable cards, visible selected Analysis, IndexedDB-backed cards, title/Created/Updated/status/delete card treatment. Its compose-strip geometry is rejected and must not be carried forward.

## Immediate release objective
Build the next candidate directly from the exact R11 standalone HTML and inline the corrected Library behavior into that document. Do not load R11 at runtime, do not iframe another release, and do not depend on R18–R25 at runtime.

### 1. Library = persistent IndexedDB research workspace
#### Authoritative data model
- IndexedDB `prism/analyses` is the sole authoritative store for Library Analyses. DOM cards are projections of stored records, never the source of truth.
- Each Analysis record has a durable ID, title, created timestamp, updated timestamp, lifecycle status (`in_process`, `complete`, `failed`), original request/context package, ordered transcript turns, source/evidence references, attachments/pasted content metadata, and provider/research metadata needed to continue the thread.
- Library startup hydrates the Analysis list from IndexedDB.
- Deleting an Analysis removes its persisted record. Delete is the explicit retention decision.

#### Run Analysis lifecycle
- Pressing **Run Analysis** immediately creates the IndexedDB Analysis record and Library card with status **In process** before provider execution begins.
- There is no Add to Library / Save to Library step.
- The provider request is associated with that Analysis ID; success updates that record to **Complete**, failure to **Failed**.
- Multiple runs must never share or guess an in-process record.

#### Portrait master/detail interaction
- Selecting **Library** opens the Library master/detail workspace inside normal PRISM content.
- The outer PRISM navigation rail may collapse when Library content is used; the Library Analysis rail itself remains visible/reachable.
- Left pane remains Omnisearch + vertically scrollable Analysis cards.
- Right pane is blank until an Analysis is selected.
- Card content: title, Created, Updated, lifecycle status, × delete. Tapping anywhere else selects it.
- Selection changes only the right pane.

#### Analysis transcript and compose geometry — mandatory R26 correction
- The selected Analysis pane is a strict three-row layout: compact Analysis header; `minmax(0,1fr)` independently scrollable transcript; compact compose row.
- The transcript consumes every available vertical pixel above the compose strip, scrolls vertically through the complete Markdown thread, and can always scroll to the final rendered line without content being covered by the composer.
- Transcript uses bottom scroll-padding/padding sufficient for comfortable final-line visibility and safe-area handling.
- Compose strip is one compact horizontal chat row, never a stacked panel:
  - left: **paperclip icon button** for attachments;
  - center: expanding text/paste textarea;
  - right: **send icon button** whose action is Research web.
- The attachment control must not display the word `Attach`; the send control must not display `Research web` as a large button. Both retain accessible `aria-label`/`title` text.
- Attachment filenames/status may appear as a small secondary line only when files are actually pending.
- The compose row stays at the bottom of the selected Analysis pane and does not overlay or occlude transcript content.
- On open and after a new research turn, the transcript scrolls to the actual bottom after Markdown layout completes.
- Follow-up uses complete selected Analysis history, evidence, pasted context/attachments and current web through the configured provider; result appends to the same record and updates `updated`.

### 2. Explore performance and clustering
- Group is the sole overview cluster dimension.
- Overview cluster count equals unique cardinality of the active Group dimension after time-window, search, enabled-source and filter constraints.
- One lightweight cluster per value; no transformed full-corpus event cloud.
- Ordinary vertical scrolling/touch; no hidden-surface rerender fan-out.

### 3. Source/filter correctness
- Selected Source values govern inclusion and Source group identity.
- No unselected Source group under an active Source filter.
- Custom RSS/Atom/common JSON sources fetch, normalize and enter the corpus with truthful configured/fetching/ready/cached/failed states.
- Default inventory remains stable across persisted state.

### 4. Map / controls / mobile layout
- Exactly three role-aligned Group / Color / Size controls.
- Anchored compact filter popovers.
- Port accepted R21 Map tile/group-focus behavior into the standalone candidate.
- Mobile tooltip compact and viewport-confined.
- Portal hamburger top-left; Config top-right; AI POV global.

## WorldPulse collector reliability correction
WorldPulse is a repository data dependency and its recurring failure noise is now part of the governed operating plan.

### Diagnosed failure
- `.github/workflows/worldmood-collector.yml` runs every 15 minutes.
- `actions/checkout` currently uses `fetch-depth: 0`, forcing a full repository/branch-history fetch on every collection run even though the collector only needs the current tree.
- `worldmood-collector.py` performs external HTTPS requests to GDELT. A GDELT TLS handshake timeout currently propagates unhandled through `urllib.request.urlopen`, exits Python with code 1, marks the Action failed, and generates GitHub failure email/annotations.
- A temporary upstream transport failure is therefore incorrectly treated as a collector integrity failure.

### Required correction
- Change checkout to shallow `fetch-depth: 1`; fetch only a bounded amount of history immediately before rebase/push when needed.
- Add bounded retry/backoff around external JSON requests and classify timeout/TLS/temporary HTTP failures as transient.
- If the GKG request remains transiently unavailable but a previously valid WorldPulse history/index exists, retain the last good dataset, emit a clear `stale/upstream unavailable` log record, and exit successfully with no data rewrite.
- Continue to fail loudly when there is no valid prior dataset or when parsing/data-integrity gates fail; genuine collector defects must remain visible.
- Keep the 15-minute cadence unless separately changed; reliability correction removes notification spam without hiding real failures.

## Preserve
Unless explicitly changed above, preserve R11 Map/Feed/search/reader/selection/AI/provider/Config/navigation behavior and visual hierarchy. No unrelated redesign.

## Delivery process
1. Re-fetch current blobs of every target file immediately before writing.
2. Update Plan and Graveyard before candidate/data-pipeline publication.
3. Build candidate from exact R11 standalone content with corrected Library code inline; no runtime wrapper ancestry.
4. Mechanically verify: no iframe/bootstrap fetch, unique IDs, portrait master/detail, compact icon composer, transcript overflow/min-height/scroll padding, IndexedDB hydrate/write/delete, Run Analysis lifecycle binding, Markdown links.
5. For WorldPulse verify Python syntax, retry/fallback paths, shallow checkout, bounded rebase fetch, and that a simulated transient upstream outage with existing history exits 0 without rewriting valid data.
6. Publish directly to `main` using existing Pages deployment and return exact cache-busted test URL. Owner device testing remains the UX acceptance gate.
