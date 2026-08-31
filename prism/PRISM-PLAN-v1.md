<!-- PRISM-PLAN v2.4.0 -->
# PRISM MASTER PLAN v2.4.0

## Governing baseline
The owner has identified the exact existing application baseline. All prior rollback guesses are superseded.

**ACTIVE BASELINE — DO NOT RECONSTRUCT OR SUBSTITUTE**
- Artifact: `prism/prism-turn01-pre-ship.html`
- Baseline URL: `https://acmeproducts.github.io/stuff/prism/prism-turn01-pre-ship.html?v=7988e0f397152afc06f3ae57009682c31fb2fd86`
- Current file identity: title `PRISM · Turn 01 pre-ship.3`
- Status: **ACTIVE FORWARD BASELINE**

The baseline remains frozen. Forward candidates fork from this exact application; no synthesized replacement baseline is permitted.

## Preserve unchanged
- **Explore stays as the baseline implementation for this gate.** No Explore redesign, geometry replacement, or new visualization experiment.
- **Config stays where it is:** top-right configuration entry and existing configuration surface.
- **AI stays where it is:** global analytical ribbon → AI POV and existing AI panel flow.
- Existing Map, Feed, search, event reader, source handling, AI/provider behavior, selection semantics, and cache architecture must not be removed.

## ACTIVE WORKSTREAM 1 — Portal shell
Introduce the classic portal shell around the baseline application:
- collapsible left navigation rail;
- persistent collapse/expand control;
- central work surface resizes with rail state;
- Explore / Map / Feed / Library remain reachable;
- rail changes do not reset search, dimensions, filters, selection, AI evidence, or active view;
- Config and AI are not moved into the rail.

## ACTIVE WORKSTREAM 2 — Analysis → Library
A completed AI POV result must become a durable Analysis object:
- **Add Analysis to Library** becomes active after a successful AI result;
- save exact prompt, response Markdown, provider/model, selected evidence/provenance, event/source references and timestamps;
- never store API keys in Analysis objects;
- saved analyses appear in Library immediately;
- Library opens a saved analysis for review/continuation;
- saving the same active analysis updates it rather than generating uncontrolled duplicates;
- import/export stays compatible.

## ACTIVE WORKSTREAM 3 — Dimension / filter system
### Core law
**Every selectable dimension has one corresponding filter, and only currently selected dimensions appear as filters.**

Visible filters = deduplicated union of active Group + Color + Size dimensions. If a dimension leaves all active roles, its filter disappears and its state is cleared.

### Governed dimensions
- Subject
- Region
- Sentiment
- Tier
- Source
- Corroboration
- Importance
- Recency

A field may appear as a dimension only if it has explicit value/bucket semantics suitable for filter chips.

### Buckets
**Importance**
- Critical: 80–100
- High: 60–79
- Medium: 40–59
- Low: 0–39

**Tier**
- Breaking
- Major
- Significant
- Developing
where supported by canonical event data.

**Corroboration**
- 1 source
- 2 sources
- 3 sources
- 4+ sources

**Recency**
- 0–6h
- 6–24h
- 1–3d
- 3–7d
with the available chip set constrained by the active global time window.

### Filter chips are the legend
There is **no separate inert legend**.

Every dimension value is represented by a colored toggle chip. The same dimension/value color is used when that field drives visual Color. Therefore the filter chips are simultaneously the interactive filter and the legend.

If a dimension is selected in multiple roles, it renders exactly one chip set.

Examples:
- Group=Subject + Color=Sentiment + Size=Importance → Subject + Sentiment + Importance chip sets.
- Group=Tier + Color=Sentiment + Size=Importance → Tier + Sentiment + Importance.
- Group=Source + Color=Tier + Size=Corroboration → Source + Tier + Corroboration.
- Group=Subject + Color=Subject + Size=Importance → one Subject set + one Importance set.

## This gate is explicitly NOT an Explore redesign
Explore consumes the corrected shared dimensions/filters and color encoding, but its baseline layout/geometry remains untouched for this gate.

## R6 candidate
- Artifact: `prism/prism-turn01-pre-ship-r6.html`
- Application commit: `7331f6f35c8323bdf8e2c46ff411ba2abf5b5131`
- Blob: `fc441b5739fd4c462e914f5c963cd101fbacfc4d`
- Status: **IMPLEMENTED CANDIDATE — OWNER TEST REQUIRED**

R6 is a descendant of the exact baseline and changes only the governed gate scope:
1. portal shell / collapsible left rail;
2. Analysis → Library activation and reopen/continue controls;
3. dynamic active-dimension filters, governed buckets, colored filter-as-legend chips, and removal of redundant legend surfaces.

## Acceptance gate
R6 is acceptable only if:
1. it preserves the baseline application functionality;
2. left portal rail collapses/expands and center resizes correctly;
3. Config remains in its baseline location/flow;
4. AI remains in its baseline location/flow;
5. completed AI analysis can be added to Library and reopened;
6. every active dimension has exactly one corresponding filter;
7. no inactive dimension has a visible or hidden active filter;
8. Importance, Corroboration, Recency and Tier use governed bucket/value semantics;
9. filter chips are colored and serve as the legend; no redundant legend remains;
10. Map, Feed, Sources, AI/provider configuration, reader, selection and Library do not regress;
11. Explore remains the baseline visualization for this gate.

## Standing process law
Rollback/recovery always uses a specific existing repository artifact. Never manufacture a substitute baseline. Once the owner identifies the baseline, governance and implementation must continue from that artifact until the owner explicitly changes it.