<!-- PRISM-PLAN v2.6.0 -->
# PRISM MASTER PLAN v2.6.0

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

## ACTIVE WORKSTREAM 2 — Analysis → self-contained Library research portal
A completed AI POV result becomes a durable Analysis object through **Add Analysis to Library**. Save the exact prompt, response Markdown, provider/model, selected evidence/provenance, event/source references, full timestamped conversation and timestamps. Never store API keys in Analysis objects. Saving the same active analysis updates it rather than generating uncontrolled duplicates.

Library is a self-contained research surface after an Analysis has been saved. It is not a replay of Map/Explore controls and it does not persist or present Group, Color, Size, time-window or filter state.

Required Library structure:
- Library has its own left rail inside the Library surface;
- the Library rail contains Library Omnisearch and the filtered Analysis cards;
- selecting an Analysis opens the complete saved analysis and its continuing conversation in the Library work surface;
- a persistent compose strip at the bottom continues the selected Analysis without returning to Map, Explore, Feed, the event reader or the global AI drawer;
- every successful continuation is appended to the same Analysis and persisted on the device immediately;
- Library search state is local to Library and does not alter global search, visualization dimensions, filters, selection or source configuration.

Library Omnisearch searches titles, prompts, responses, event metadata, source names and source URLs. It supports:
- ordinary positive terms;
- `-negative` exclusions;
- `*` and `?` wildcards;
- `source:` and `url:` field qualifiers, including negative and wildcard forms.

Examples: `federal reserve`, `rates -crypto`, `source:Reuters`, `-source:*tabloid*`, `url:*federalreserve.gov*`.

Library portability:
- each Analysis can be downloaded independently as JSON or CSV;
- JSON and CSV Analysis files can be imported/merged through the existing top-right Config gear surface;
- import is non-destructive and updates by Analysis identity rather than erasing unrelated saved work;
- existing whole-Library JSON import remains compatible where practical.

AI POV and every Library continuation must render Markdown links as active direct URLs. Any external fact, source, further-reading item, related topic or research suggestion introduced by AI must have its direct URL adjacent to it. If the model cannot supply a reliable direct URL, it must omit that external reference rather than produce an unlinked lead or fabricate a URL. Paywalled material must not be referenced or recommended, with one explicit exception: WSJ is allowed because the owner has a subscription.

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

### R6 source-filter defect — mandatory correction
Owner test reproduced a correctness failure:
- Group = Source;
- only BBC World selected in the Source filter;
- a New York Times group remained visible.

Cause class: an event can have coverage from several sources. R6 correctly tests whether the event has selected-source coverage, but Source grouping can still resolve to a different, unselected coverage source.

Required behavior:
- selected Source values govern both event inclusion and the Source group identity shown on Map/Explore;
- if Source is filtered and used as Group, an event must resolve to a selected matching source, never an arbitrary first coverage source;
- no unselected Source group/header may remain visible under a Source filter;
- event reader provenance may still show all enabled coverage because acquisition/provenance is distinct from analytical grouping.

## ACTIVE WORKSTREAM 4 — Map information density and size differentiation
The compact ribbon/filter surface has recovered substantial canvas space. Use the recovered space for richer Map information.

Required behavior:
- large tiles should show more than a truncated headline when geometry allows;
- useful tile metadata may include subject/region context, Importance bucket/score, corroboration/source count and recency;
- labels degrade gracefully with tile area: large tiles show richer metadata, medium tiles fewer lines, tiny tiles only headline/abbreviation;
- do not turn every tile into a card or reduce event coverage simply to make labels fit.

Size encoding also needs materially stronger differentiation. R6 Importance sizing is visually compressed.

Required sizing law:
- use deliberately separated governed weights/nonlinear scaling rather than near-linear raw values;
- Importance: Critical / High / Medium / Low must produce clearly different areas;
- Corroboration: 4+ / 3 / 2 / 1 source must produce clearly separated areas;
- Recency buckets must likewise produce meaningful area differences;
- preserve usable treemap hierarchy and avoid one extreme tile consuming the entire map.

## This gate is explicitly NOT an Explore redesign
Explore consumes the corrected shared dimensions/filters and color encoding, but its baseline layout/geometry remains untouched for this gate.

## R6 candidate
- Artifact: `prism/prism-turn01-pre-ship-r6.html`
- Application commit: `7331f6f35c8323bdf8e2c46ff411ba2abf5b5131`
- Blob: `fc441b5739fd4c462e914f5c963cd101fbacfc4d`
- Status: **REJECTED FOR CORRECTION — SOURCE FILTER DEFECT / MAP SIZE-DENSITY INCOMPLETE**

R6 established the portal, Analysis → Library path, and compact dynamic filter surface, but it is not accepted until the source-filter truthfulness and Map density/size corrections above are mechanically addressed.

## BACKLOG — Config → Customize color schemes
Do not pull this into the current gate unless the owner explicitly activates it.

Add a **Customize** button inside Configuration opening a color-scheme modal with:
- preset schemes;
- create/edit named custom schemes;
- load/apply saved scheme;
- save locally;
- export;
- import/merge without silently overwriting a same-named scheme.

Semantic constraints across presets/custom schemes:
- negative/adverse = red family;
- positive = green family; blue or white are acceptable alternate positive/constructive encodings where appropriate;
- caution/warning = yellow family;
- other categorical values can use flexible distinguishable colors as long as these semantic constraints remain intact.

The scheme schema must support all current color-capable dimensions and future dimensions, not only Sentiment.

## Acceptance gate
The next candidate is acceptable only if:
1. it preserves the baseline application functionality;
2. left portal rail collapses/expands and center resizes correctly;
3. Config remains in its baseline location/flow;
4. AI remains in its baseline location/flow;
5. completed AI analysis can be added to Library and opened entirely inside the Library portal;
6. every active dimension has exactly one corresponding filter;
7. no inactive dimension has a visible or hidden active filter;
8. Importance, Corroboration, Recency and Tier use governed bucket/value semantics;
9. filter chips are colored and serve as the legend; no redundant legend remains;
10. a Source-only filter cannot leave an unselected Source group visible;
11. Map tiles use available area for richer information when geometry permits;
12. Size produces materially visible bucket/value area differences;
13. Library has no persistent dimension/filter controls and has its own Omnisearch + Analysis-card left rail;
14. Library Omnisearch proves positive, `-negative`, wildcard, `source:` and `url:` matching;
15. a selected Analysis renders its complete timestamped conversation and continues from a bottom compose strip with device persistence;
16. each Analysis downloads as JSON and CSV, and Config imports/merges both formats non-destructively;
17. AI prompt policy requires direct URLs for every external reference/research suggestion and excludes paywalled references except WSJ;
18. Map, Feed, Sources, AI/provider configuration, reader, selection and Library do not regress;
19. Explore remains the baseline visualization for this gate.

## Standing process law
Rollback/recovery always uses a specific existing repository artifact. Never manufacture a substitute baseline. Once the owner identifies the baseline, governance and implementation must continue from that artifact until the owner explicitly changes it.