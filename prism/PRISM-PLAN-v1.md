<!-- PRISM-PLAN v2.3.0 -->
# PRISM MASTER PLAN v2.3.0

## Governing baseline
The owner has identified the exact existing application baseline. All prior rollback guesses are superseded.

**ACTIVE BASELINE — DO NOT RECONSTRUCT OR SUBSTITUTE**
- Artifact: `prism/prism-turn01-pre-ship.html`
- Baseline URL: `https://acmeproducts.github.io/stuff/prism/prism-turn01-pre-ship.html?v=7988e0f397152afc06f3ae57009682c31fb2fd86`
- Current file identity: title `PRISM · Turn 01 pre-ship.3`
- Status: **ACTIVE FORWARD BASELINE**

The file at this artifact path is the product starting point. Forward work modifies/forks from this exact application; no synthesized replacement baseline is permitted.

## Preserve unchanged
The following are explicitly preserved unless the owner later changes scope:
- **Explore stays exactly as it is for this gate.** No Explore redesign, geometry change, sphere replacement, or visualization experimentation.
- **Config stays where it is.** Do not relocate or redesign the configuration entry/surface in this gate.
- **AI stays where it is.** Do not relocate or redesign the AI POV entry/surface in this gate.
- Existing Map, Feed, search, event reader, source handling, AI/provider behavior, selection semantics, and other working baseline behavior must not be removed while changing layout/filter/library behavior.

## ACTIVE WORKSTREAM 1 — Portal shell
Introduce the classic PRISM portal shell around the existing application without changing Config or AI placement.

Required behavior:
- left navigation rail;
- rail collapses and expands from a persistent control;
- central work surface resizes when the rail changes state;
- existing primary surfaces remain reachable: Explore, Map, Feed, Library;
- desktop/tablet layout must not underlap the work surface;
- shell state changes must not reset search, dimensions, filters, selection, AI evidence, or current view;
- the portal work is a shell/layout change only, not a reason to rewrite working feature implementations.

## ACTIVE WORKSTREAM 2 — Analysis → Library
Activate the existing analysis/library path so an AI result can become a durable Library object.

Required behavior:
- a completed AI POV result exposes **Add to Library** / **Save Analysis** as an active action;
- saving persists the exact analysis, including selected-event evidence/provenance, provider/model, prompt, response Markdown, timestamps, and source references;
- saving must not store API keys;
- saved analyses appear immediately in Library without reload;
- Library can open the saved analysis as a complete research object, not a title-only placeholder;
- duplicate saves of the same active analysis must update/continue that analysis rather than silently create uncontrolled duplicates;
- existing import/export behavior remains compatible with saved Analysis objects.

## ACTIVE WORKSTREAM 3 — Dimension / filter system
The analytical controls must become internally consistent and dynamic.

### Core law
**Every selectable dimension has one corresponding filter, and only currently selected dimensions appear as filters.**

The visible filter set is the deduplicated union of the active analytical dimension roles (currently Group, Color, Size; future roles follow the same law).

If a dimension leaves all active roles, its filter disappears and its filter state is cleared so there is no invisible filtering.

### Dimension eligibility
A field may be offered as a dimension only if it has explicit bucket/value semantics that can also be rendered as filter chips.

Current governed dimensions include:
- Subject
- Region
- Sentiment
- Tier
- Source
- Corroboration
- Importance
- Recency

### Required bucketing
Dimensions that are not naturally discrete must be bucketed before they can function coherently as both dimensions and filters.

**Importance**
- Critical: 80–100
- High: 60–79
- Medium: 40–59
- Low: 0–39

**Tier**
Use the actual tier values supported by the canonical event data. Where present, expose the governed buckets consistently (for example Breaking / Major / Significant / Developing). Do not invent a tier value for events that do not have one.

**Corroboration**
- 1 source
- 2 sources
- 3 sources
- 4+ sources

**Recency**
Use stable age buckets inside the selected global time window rather than a raw continuous slider. Bucket labels must remain understandable as the 24h / 3d / 7d window changes.

### Filter chips are the legend
There is **no separate inert legend**.

Every dimension value is represented by a chip. Chips have two simultaneous jobs:
1. show the visual encoding/color for that value when the dimension is being used for Color;
2. act as the toggle filter for that value.

Rules:
- when Color=Sentiment, Positive / Neutral / Negative filter chips carry the exact colors used in Map/Explore/Feed;
- when Color=Tier, Tier chips carry the exact tier colors;
- when Color=Subject, Subject chips carry the exact subject colors;
- the same rule applies to Region, Source, Corroboration, Importance, Recency, or any future color-capable dimension;
- no second row of legend-only chips may duplicate those filter chips;
- chip state must clearly distinguish included/excluded values while retaining the color cue;
- if the same dimension is selected in multiple roles, it still renders only one filter-chip set.

### Dynamic alignment examples
- Group=Subject + Color=Sentiment + Size=Importance → filters: Subject + Sentiment + Importance.
- Group=Tier + Color=Sentiment + Size=Importance → filters: Tier + Sentiment + Importance.
- Group=Source + Color=Tier + Size=Corroboration → filters: Source + Tier + Corroboration.
- Group=Subject + Color=Subject + Size=Importance → one Subject filter set + one Importance filter set.
- Change Group from Source to Region → Source filter disappears and clears; Region filter appears.

## This gate is explicitly NOT an Explore redesign
The immediate objective is to get the **portal layout**, **Analysis → Library**, and **dimension/filter model** correct while preserving the current Explore implementation exactly enough to avoid another visualization tangent.

Do not change Explore merely because the new dimensions/filters affect the data it receives. Its rendering code is frozen for this gate except for the minimum wiring required to consume the corrected shared state without visual redesign.

## Acceptance gate
The next candidate is acceptable only if all of the following are true:
1. it starts from `prism/prism-turn01-pre-ship.html` baseline, not another artifact;
2. left portal rail collapses/expands and the central surface resizes correctly;
3. Config remains in its current product location/flow;
4. AI remains in its current product location/flow;
5. a completed AI analysis can be saved into Library and reopened as a complete analysis;
6. every active dimension has exactly one corresponding filter;
7. no inactive dimension has a visible or hidden active filter;
8. Importance, Corroboration, Recency, and Tier use governed bucket/value semantics suitable for dimensions and filters;
9. filter chips are colored and serve as the legend; there is no redundant legend chip system;
10. Map, Feed, Sources, AI/provider configuration, event reader, selection, and Library do not regress;
11. Explore remains visually/interaction-wise the current baseline implementation for this gate.

## Standing process law
Rollback/recovery always uses a specific existing repository artifact. Never manufacture a substitute baseline. Once the owner identifies the baseline, governance and implementation must point to that artifact until the owner explicitly changes it.
