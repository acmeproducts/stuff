<!-- PRISM-PLAN v3.1.0 -->
# PRISM MASTER PLAN v3.1.0

## Governing baseline
PRISM is restored to the last working application baseline.

**ACTIVE BASELINE**
- Canonical artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`
- Status: **WORKING BASELINE / IMPLEMENTATION ANCESTOR**

R15 and R16 remain rejected evidence only. No PRISM-specific release machinery, GitHub Actions workaround, WSL publishing architecture, or whole-repository rollback is permitted for ordinary application development.

## Next release scope
The next candidate is a direct forward correction from the R11 baseline and contains all four workstreams below. No narrower scope limitation applies.

### 1. Library research workflow
- Library Omnisearch remains immediately reachable, including while an Analysis is open on mobile.
- Selecting a saved Analysis opens the complete transcript and continuing conversation.
- A persistent bottom compose strip remains visible above safe-area/browser chrome.
- Continuation action is explicitly **Research web**.
- Research web uses the Config-selected verified provider and current-web research over the saved PRISM evidence package plus prior turns.
- Every successful turn appends to the same Analysis and persists on-device.
- AI/current-web output renders as Markdown with working direct hyperlinks; external research leads without a reliable direct URL are omitted; paywalled references are excluded except WSJ.

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
- Custom source status distinguishes fetching, ready, cached and failed, with truthful article/event counts.
- Source-local refresh/retry/remove remains non-destructive to other sources and Library Analyses.
- Default source inventory remains visible and stable across persisted state; older persisted states cannot silently erase governed defaults.

### 4. Map / controls / mobile layout
- Row 1 contains Group / Color / Size selectors plus AI POV and filtered item count without redundant role prefixes inside selector values.
- Row 2 always contains exactly three role-aligned filter summaries, including when roles share the same underlying dimension; duplicates mirror one shared filter state.
- Filter summaries open compact chip-only popovers anchored to their trigger, flipping only as needed to remain on-screen.
- Map uses materially separated governed size weights and spends available geometry on readable wrapped headlines and useful metadata rather than blank area.
- Mobile tooltip is compact, dark and viewport-confined.
- Map group focus exposes an adjacent × control restoring all groups.
- Portal hamburger remains the first control at the top-left of its rail; Config remains top-right; AI POV remains global.
- Mobile layout must not hide Library Omnisearch, Research web composer, filter controls, Map focus controls, Config or core navigation.

## Preserve
Unless a requirement above explicitly changes it, preserve R11 Map/Feed/search/reader/selection/AI/provider/Config/navigation behavior and visual hierarchy. No unrelated redesign.

## Delivery process
1. Verify current `main` and current blobs of each PRISM file before writing.
2. Build the new candidate directly from the exact R11 application baseline; donor logic from rejected artifacts may be studied but rejected artifacts are not wholesale ancestors.
3. Update Plan and Graveyard in the same release cycle.
4. Run lightweight mechanical gates: HTML/inline-JS parse, unique DOM IDs, required control/function assertions, baseline-preservation anchors, and explicit checks for all four workstreams.
5. Publish directly to `main` using the existing Pages deployment.
6. Return the exact cache-busted Pages test URL. Owner device testing is the functional acceptance gate.
