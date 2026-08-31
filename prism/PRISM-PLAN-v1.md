<!-- PRISM-PLAN v1.8.0 -->
# PRISM MASTER PLAN v1.8.0

## Governance
Every materially rejected architecture is recorded before replacement. Current work is still Turn 01 pre-ship.

## Stable baseline
Non-Explore baseline remains the accepted R3/R4 lineage: collapsible left rail, central work surface, collapsible right context panel, one global ribbon/state, Map, Feed, AI POV/provider validation, source management and Library. R4 Explore is rejected and is not a forward baseline.

## Explore contract — R5
Explore is no longer a globe and no longer a giant perspective matrix.

### Macro view
A simple **2D X × Y matrix** is the default Explore surface.
- X is a user-selected categorical dimension.
- Y is a user-selected categorical dimension.
- Z / Size is a third selected dimension and controls cluster prominence/weight.
- Color is a selected categorical dimension.
- Every X×Y intersection is one cluster, not a container full of individually laid-out stories.
- A cluster summarizes count, dominant/selected Color values, Z distribution and top headlines.
- Empty intersections may be suppressed or visually minimized; the macro view must remain readable.

Default: X=Subject, Y=Region, Z=Importance, Color=Sentiment.

### Cluster drill-in
Tapping a cluster opens that one intersection as an immersive cluster view.
- The selected X and Y values are frozen as the cluster context.
- News tiles become individually selectable.
- Tiles may use LumaSphere-like depth/rotation around the cluster center so the user can rotate and zoom the cluster, but this interaction exists **only inside the selected cluster**, never across the whole corpus.
- wheel/trackpad and pinch zoom; drag rotates the cluster field.
- clear visible `×` exits back to the exact macro X×Y matrix state.
- selection persists when entering/exiting drill-in.

### Filters are legends
The filter chips are the legend. No second inert legend exists.
- If Color=Sentiment, Positive/Neutral/Negative chips carry the same colors used in clusters/tiles.
- If Color=Tier, Tier chips carry the colors.
- If a selected dimension is not Color, its chips remain normal filter chips without redundant legend chrome.

### Bucketing
Importance is categorical for filtering and cluster summary:
- Critical 80–100
- High 60–79
- Medium 40–59
- Low 0–39

Tier remains Breaking / Major / Significant / Developing where data supports it. Corroboration remains 1 / 2 / 3 / 4+ sources. Recency uses governed time buckets when selected.

### Dimension/filter law
Every selected analytical dimension has one corresponding filter. The filter tray is exactly the deduplicated union of X, Y, Color and Z. Removing a dimension clears its stale filter state. Source filtering appears only when Source is selected as a dimension; Config→Sources remains acquisition configuration.

## R5 acceptance gate
1. Macro Explore is a clean 2D X×Y matrix with one summary cluster per intersection.
2. No individual story-card packing in macro matrix cells.
3. Cluster size/prominence reflects Z.
4. Tap cluster → immersive cluster drill-in with news tiles, rotate, zoom and select.
5. `×` → exact prior macro matrix state.
6. Filter chips double as Color legend; no separate legend.
7. Importance filter is bucketed, not a raw range slider.
8. Existing non-Explore baseline is not redesigned by this gate.

## Ledger
- R2: recovery shell baseline.
- R3: dimension/filter correction candidate.
- R4: **REJECTED Explore implementation** — giant perspective X×Y card matrix is visually dense and misinterprets the macro-vs-drill requirement.
- R5: **ACTIVE** — 2D X×Y cluster matrix → selected cluster immersive drill-in.
