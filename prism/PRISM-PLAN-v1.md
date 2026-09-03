<!-- PRISM-PLAN v3.2.0 -->
# PRISM MASTER PLAN v3.2.0

## Governing baseline
PRISM remains governed by the exact last working standalone application baseline.

**ACTIVE BASELINE**
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`
- Status: **WORKING BASELINE / IMPLEMENTATION ANCESTOR**

R12–R24 are evidence only unless an individual behavior is explicitly called out below as accepted donor behavior. No iframe/nested-wrapper release is an implementation ancestor. No PRISM-specific release machinery, GitHub Actions workaround, WSL publishing architecture, or whole-repository rollback is permitted for ordinary application development.

## Owner-accepted donor behavior
The Map behavior demonstrated in R21 is accepted evidence and must be ported into the next legitimate standalone candidate without adopting the R21 wrapper architecture:
- readable adaptive tiles;
- tight group headings;
- clickable group focus;
- adjacent × to restore all groups;
- fixed/equal dimension-control widths;
- no headline truncation in large/medium tiles and font fitting for smaller tiles.

## Next release scope
The next legitimate candidate is a direct forward correction from the exact R11 standalone application and contains all four workstreams below. The Library workstream is now the highest-priority acceptance gate.

### 1. Library = persistent IndexedDB research workspace
#### Authoritative data model
- IndexedDB is the sole authoritative store for Library Analyses. DOM cards are projections of stored Analysis records, never the source of truth.
- Each Analysis record has a durable ID, title, created timestamp, updated timestamp, lifecycle status (`in_process`, `complete`, `failed`), original request/context package, ordered transcript turns, source/evidence references, attachments/pasted content metadata, and provider/research metadata needed to continue the thread.
- Library startup hydrates the Analysis list from IndexedDB. Reloading the page must reconstruct the same cards, selected transcript content, timestamps and lifecycle state.
- Deleting an Analysis removes the Analysis record and its associated persisted transcript/attachment records. Delete is the explicit retention decision.

#### Run Analysis lifecycle
- Pressing **Run Analysis** immediately creates the IndexedDB Analysis record and Library card with status **In process** before provider execution begins.
- There is no Add to Library / Save to Library step.
- The running provider request is associated with that exact Analysis ID.
- Successful completion appends the returned Markdown result to that Analysis and changes status to **Complete**.
- Failure changes that same record to **Failed** and retains the record/error context for retry or deletion.
- Multiple runs must never share or guess an `In process` card by DOM state; each run is keyed by its own Analysis ID.

#### Library interaction contract
- Selecting **Library** opens a permanent master/detail workspace inside the normal PRISM content area.
- The main PRISM navigation rail remains a separate outer rail. Tapping/clicking within the Library content may collapse the outer PRISM rail to maximize portrait width; it must not collapse the Library Analysis rail.
- Library left pane is always the Analysis rail: Library Omnisearch plus vertically scrollable Analysis cards.
- Library right pane is initially blank until an Analysis is selected.
- Each card contains only the Analysis title, Created date, Last updated date, lifecycle status when relevant, and × delete.
- Tapping anywhere on a card other than × selects it. Selection changes only the right detail pane; the Analysis rail remains present and scrollable.
- The selected Analysis pane uses all remaining width and full available height in portrait and landscape.
- The Analysis document is independently and effectively infinitely scrollable and renders the entire ordered transcript as sanitized Markdown with direct working hyperlinks.
- The sticky compose strip is anchored to the bottom of the selected Analysis pane and never scrolls away.
- Continuation action is explicitly **Research web**.
- Follow-up supports typed questions, pasted content and attachments, uses the complete selected Analysis transcript/context plus current web research through the Config-selected verified provider, appends the response to the same Analysis ID, persists it, updates `updated`, and scrolls to the newly appended turn.
- External research leads without a reliable direct URL are omitted; paywalled references are excluded except WSJ.
- Portrait mode is a first-class target: selecting an Analysis must work without navigation replacement, hidden cards, or a dead detail pane.

### 2. Explore performance and clustering
- Group is the sole overview cluster dimension.
- Overview cluster count equals unique cardinality of the active Group dimension after time-window, search, enabled-source and filter constraints.
- Example: seven active Source values means exactly seven Source clusters.
- Overview renders one lightweight cluster per value with count and representative headlines, not one transformed DOM object per event.
- Cluster drill-in is bounded and retains event selection/reader behavior.
- Explore uses ordinary vertical scrolling/touch behavior; the inherited all-event orb transform layer is removed from the new candidate.
- Ordinary Explore interaction rerenders only the visible analytical surface; hidden Map/Feed/Explore work is not fanned out.

### 3. Source/filter correctness
- Selected Source values govern both event inclusion and Source group identity.
- If Source is filtered and Group=Source, no unselected Source group may remain visible.
- Custom RSS/Atom/common JSON sources must fetch, normalize and join the shared corpus rather than merely saving metadata.
- Custom source status distinguishes configured, fetching, ready, cached and failed, with truthful article/event counts.
- Custom source-local refresh/retry/remove remains non-destructive to other sources and Library Analyses.
- Default source inventory remains visible and stable across persisted state; older persisted states cannot silently erase governed defaults.

### 4. Map / controls / mobile layout
- Row 1 contains Group / Color / Size selectors plus AI POV and filtered item count without redundant role prefixes inside selector values.
- Row 2 always contains exactly three role-aligned filter summaries, including when roles share the same underlying dimension; duplicates mirror one shared filter state.
- Filter summaries open compact chip-only popovers anchored to their trigger, flipping only as needed to remain on-screen.
- Port the owner-accepted R21 Map tile/group-focus behavior directly into the standalone candidate.
- Mobile tooltip is compact, dark and viewport-confined.
- Portal hamburger remains the first control at the top-left of its rail; Config remains top-right; AI POV remains global.
- Mobile layout must not hide Library Omnisearch, Analysis cards, selected Analysis detail, Research web composer, filter controls, Map focus controls, Config or core navigation.

## Preserve
Unless a requirement above explicitly changes it, preserve exact R11 Map/Feed/search/reader/selection/AI/provider/Config/navigation behavior and visual hierarchy. No unrelated redesign.

## Delivery process
1. Verify current `main` and current blobs of every PRISM file immediately before each write.
2. Build the legitimate candidate from the exact R11 application content. Rejected/wrapper artifacts may be studied only as behavioral donors; they must not be runtime ancestors.
3. Update Plan and Graveyard in the same release cycle before publishing the candidate.
4. Run lightweight mechanical gates appropriate to the changed surface: HTML/inline-JS syntax, unique DOM IDs, no iframe wrapper lineage, IndexedDB schema and hydrate/write/delete assertions, Run Analysis ID binding, master/detail portrait assertions, sticky Research web composer, Markdown rendering, and the standing Explore/Source/Map assertions.
5. Publish directly to `main` using the existing Pages deployment.
6. Return the exact cache-busted Pages test URL. Owner device testing is the functional acceptance gate.
