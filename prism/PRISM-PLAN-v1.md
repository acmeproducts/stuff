<!-- PRISM-PLAN v2.13.0 -->
# PRISM MASTER PLAN v2.13.0

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
- **AI remains global:** Row 1 → AI POV and the established right-panel analytical flow. Provider keys, model selection and validation remain exclusively in top-right Config; the AI panel consumes that verified runtime and does not repeat configuration.
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
- each Analysis can be downloaded independently as Markdown, print-to-PDF, JSON or CSV;
- JSON and CSV Analysis files can be imported/merged through the existing top-right Config gear surface;
- import is non-destructive and updates by Analysis identity rather than erasing unrelated saved work;
- existing whole-Library JSON import remains compatible where practical.

AI POV and every Library continuation are current-web research operations over the saved PRISM evidence package. Provider-native web search must be enabled automatically. Results render as artifact-quality Markdown with active direct URLs; tables and Mermaid diagrams may be used when they materially clarify supported findings. Any external fact, source, further-reading item, related topic or research suggestion introduced by AI must have its direct URL adjacent to it. If the model cannot supply a reliable direct URL, it must omit that external reference rather than produce an unlinked lead or fabricate a URL. Paywalled material must not be referenced or recommended, with one explicit exception: WSJ is allowed because the owner has a subscription.

AI panel structure is fixed: a chevron-disclosed, internally scrollable selected-context section; Prompt; Analysis; and a sticky action footer containing visible running state plus Run analysis and one-click Add to Library. Provider/model/key fields and the old Continue action are prohibited in this panel. Library continuation happens only in the Library composer and appends to the same device-persisted research item.

## ACTIVE WORKSTREAM 3 — Dimension / filter system
### Core law
**Each Group / Color / Size role always has one corresponding visible filter control.**

Row 2 therefore always contains three role-aligned controls in Group / Color / Size order. If the same underlying dimension is selected in two roles, both role slots remain visible and mirror one shared dimension filter state; the event predicate is evaluated once, avoiding contradictory double-filtering. If a dimension leaves all active roles, its state is cleared.

### Two-row control contract
The analytical ribbon is a fixed two-row hierarchy with no horizontal scrolling:

- Row 1: Group dimension • Color dimension • Size dimension | AI POV | filtered item count.
- The global time-window control remains available in the top utility header because it is not a visualization dimension.
- Row 2: exactly three compact role-aligned summary controls, one for Group, one for Color and one for Size.
- Summary controls display `All`, the sole selected value, or `N of M`; they never enumerate an expanding value catalog inline.
- AI POV and the filtered item count remain outside every scrolling filter surface.
- Dimension selector values display only the dimension name (`Subject`, `Region`, `Importance`, and so on). Repeating `Group ·`, `Color ·` or `Size ·` inside every value is prohibited because role is already conveyed by selector position and its accessible label.

Tapping a Row 2 summary opens a content-sized popover directly below the control that was tapped, flipping above only when viewport space requires it. It must never emerge as a distant bottom sheet. The selection surface contains toggle chips only—no checkboxes, `Only` buttons, include/exclude modes or Apply button.

When the committed filter state is `All`, opening the selector presents the individual value chips off, ready for narrowing. Tapping individual chips selects the exact desired subset. Tapping the `All` chip activates every current value, after which unwanted chips can be turned off. Closing the surface commits automatically. Zero selected values and every current value selected both normalize to the semantic `All` state so newly ingested sources remain included.

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

### Filter chips carry the color key
There is **no separate inert legend**.

Every dimension value in the adaptive selector is represented by a colored toggle chip. The same dimension/value color is used when that field drives visual Color. The selector therefore remains the interactive filter and the exact color key without forcing every value into the persistent ribbon.

If a dimension is selected in multiple roles, every role retains its Row 2 control, but those controls open and mirror the same chip set.

Examples:
- Group=Subject + Color=Sentiment + Size=Importance → Subject + Sentiment + Importance chip sets.
- Group=Tier + Color=Sentiment + Size=Importance → Tier + Sentiment + Importance.
- Group=Source + Color=Tier + Size=Corroboration → Source + Tier + Corroboration.
- Group=Subject + Color=Subject + Size=Importance → three visible controls (Subject, Subject, Importance); the two Subject controls mirror one Subject chip set.

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
- labels degrade gracefully with tile area: the largest tiles show large multi-line headlines and useful metadata, medium tiles show fewer lines, and geometry too small for a readable label stays unlabeled rather than displaying meaningless initials;
- do not turn every tile into a card or reduce event coverage simply to make labels fit.
- the treemap fills the available Map canvas without large decorative margins;
- tapping a group header focuses that complete group; the focused group name is displayed with an adjacent × control that restores the all-groups view in one tap.

Size encoding also needs materially stronger differentiation. R6 Importance sizing is visually compressed.

Required sizing law:
- use deliberately separated governed weights/nonlinear scaling rather than near-linear raw values;
- Importance: Critical / High / Medium / Low must produce clearly different areas;
- Corroboration: 4+ / 3 / 2 / 1 source must produce clearly separated areas;
- Recency buckets must likewise produce meaningful area differences;
- preserve usable treemap hierarchy while making bucket differences immediately legible.
- use a deliberately steep 144 / 64 / 28 / 12 scale for the four governed buckets; recovered area must be spent on readable headlines and metadata rather than blank color;
- use wrapped multi-line headlines, larger tile type and progressively richer metadata to spend available area on information;
- use a compact, dark, viewport-confined tooltip so mobile inspection never produces the oversized white overlay seen in R12 owner testing.

## ACTIVE WORKSTREAM 5 — Truthful custom-source ingestion
Owner testing of R7 proved that Config → Sources → Add source was a metadata-only control. It stored the source in browser configuration but never fetched or parsed the feed, never merged its articles into the canonical corpus, and therefore could not expose the source in the active source inventory, Source filter or event provenance.

Required behavior:
- a custom RSS, Atom, JSON or public API source appears in the source inventory immediately when added;
- PRISM fetches it on add and refreshes configured custom sources on startup;
- RSS/Atom XML and supported JSON article arrays normalize into the existing Source Article schema before Event canonicalization;
- successfully ingested articles join Map, Explore, Feed, reader provenance, search, Source grouping/filtering and AI evidence without creating a separate state universe;
- custom source articles persist on the device so an established source can remain available as explicitly marked cached content when a later refresh fails;
- each custom source reports fetching, ready, cached or failed status plus article/event counts; configuration success may never be presented as ingestion success;
- direct browser fetch is attempted first; when blocked by cross-origin policy, the existing static deployment may use an explicitly disclosed compatibility relay and must report that mode;
- Refresh and Remove are source-local, with removal deleting that source's cached articles and recomputing the corpus without disturbing other sources or Library Analyses;
- duplicate source names and duplicate URLs are rejected rather than silently creating ambiguous Source identities.

## This gate is explicitly NOT an Explore redesign
Explore consumes the corrected shared dimensions/filters and color encoding, but its baseline layout/geometry remains untouched for this gate.

## R6 candidate
- Artifact: `prism/prism-turn01-pre-ship-r6.html`
- Application commit: `7331f6f35c8323bdf8e2c46ff411ba2abf5b5131`
- Blob: `fc441b5739fd4c462e914f5c963cd101fbacfc4d`
- Status: **REJECTED FOR CORRECTION — SOURCE FILTER DEFECT / MAP SIZE-DENSITY INCOMPLETE**

R6 established the portal, Analysis → Library path, and compact dynamic filter surface, but it is not accepted until the source-filter truthfulness and Map density/size corrections above are mechanically addressed.

## R7 candidate
- Artifact: `prism/prism-turn01-pre-ship-r7.html`
- Application commit: `17c27b402bcbb04b3f80cc07e2a0ebc78c768a85`
- Blob: `c12e254450f724e9b3d0fdcd4c13867d7603279f`
- Status: **REJECTED — CUSTOM SOURCE CONTROL SAVED METADATA WITHOUT INGESTING CONTENT**

R7 corrects selected-Source group identity, applies deliberately separated governed Size weights, adds geometry-tolerant richer Map labels, and replaces the R6 Library list presentation with the governed self-contained Library research portal. Explore geometry, global AI placement, Config placement, Portal shell and reader architecture remain unchanged.

Owner testing then exposed a separate source-acquisition defect: Add source confirmed configuration even though no feed request, parsing, normalization or corpus merge existed. R7 remains preserved as the exact rejected artifact; the correction proceeds in R8.

## R8 candidate
- Artifact: `prism/prism-turn01-pre-ship-r8.html`
- Application commit: `2499dc68169ce27f7ca431a4f36c0736218d9803`
- Blob: `8aa25482879705c95dfcf28ad560b43f55d46ac5`
- Status: **REJECTED FOR CORRECTION — DEFAULT SOURCE INVENTORY COULD DISAPPEAR IN PERSISTED STATE**

R8 replaces the metadata-only Add source path with live custom-source acquisition. Existing R7 custom-source configurations migrate forward and refresh automatically. Add + fetch, startup refresh, RSS/Atom and common JSON normalization, shared-corpus recomputation, device article persistence, direct/repository-cache/relay mode disclosure, status/count truthfulness, duplicate protection, retry and non-destructive removal are implemented without changing Explore, AI, Config placement, Portal, reader or Library architecture.

Deployed qualification at application commit `2499dc68169ce27f7ca431a4f36c0736218d9803`:
- an existing configured BBC Business RSS URL refreshed automatically after reload;
- the RSS source reported `ready · repository cache`, 42 articles and 40 canonical events;
- selecting that custom source as the sole Source filter produced 32 current-window events and a rendered treemap;
- a same-origin JSON source reported `ready · direct` with 250 normalized articles;
- source-local removal deleted the JSON source while preserving the RSS source and shared corpus;
- application console warning/error log remained empty.

Owner testing then exposed that the default source set was runtime-derived and could disappear from the Source surface when an older persisted configuration had disabled every default. R8 also coupled the new source-article store to a version upgrade of the shared PRISM database; an older open tab could block that upgrade and leave startup at an empty source state. R8 remains preserved as the exact rejected artifact; the correction proceeds in R9.

## R9 candidate
- Artifact: `prism/prism-turn01-pre-ship-r9.html`
- Application commit: `6d0b240f3f83ae846b321d33286c85f37c6e4463`
- Blob: `8e2a0ad0beb3fbdd6b7ad853dc4d4a9b6c0b19f1`
- Status: **SUPERSEDED FOR CORRECTION — PORTAL TOGGLE WAS OUTSIDE ITS LEFT RAIL**

R9 makes the nine repository sources an explicit permanent inventory independent of cache/runtime availability. A one-time source-configuration migration restores all nine when the prior R8 state had hidden every default, while later deliberate Disable all choices remain persistent under the new schema. Sources exposes an explicit Restore defaults action and distinguishes default loading/cache/unavailable status truthfully.

Source-article persistence moves to an isolated `prism_sources` database. The existing shared PRISM database is opened without a version upgrade, so an older open tab cannot block startup merely because R9 needs source storage. Existing R8 source articles migrate forward when available. Explore, AI, Config placement, Portal, reader and Library architecture remain unchanged.

Deployed qualification at application commit `6d0b240f3f83ae846b321d33286c85f37c6e4463`:
- clean startup loaded 283 articles into 270 canonical events and reported all nine repository defaults active;
- Disable all left all nine default inventory rows visible and unchecked; Restore defaults returned all nine to enabled state;
- Source grouping exposed exactly the nine governed defaults, and selecting BBC Business produced 28 current-window events;
- Explore rendered the same filtered corpus, the portal rail collapsed/expanded, and Config plus AI remained in their established locations;
- Library retained its own Analysis-card rail, Omnisearch and independent work surface with no visualization controls;
- application-origin console warning/error log remained empty.

Owner review corrected the portal control ownership: the hamburger was placed in the global top header even though it controlled only the left portal rail. R9 remains preserved as the exact source-default correction artifact; the scoped placement correction proceeds in R10.

## R10 candidate
- Artifact: `prism/prism-turn01-pre-ship-r10.html`
- Application commit: `01a6e026c52f38b7986d01ae2e237e863d3fc8c4`
- Blob: `6e8219577693e1b6244c64269740e80bb9ff1325`
- Status: **SUPERSEDED FOR CORRECTION — HAMBURGER WAS TOP-RIGHT WITHIN THE RAIL**

R10 moves the hamburger into the left rail header. Its sole action is to collapse or expand that rail. The collapsed state retains a narrow rail strip containing the same toggle so the user can reopen it on desktop and mobile; the toggle exposes truthful expand/collapse title, label and `aria-expanded` state. The global top header no longer contains a portal toggle. Map, Explore, Feed, AI, Config, Sources and Library behavior remain unchanged.

Deployed qualification at application commit `01a6e026c52f38b7986d01ae2e237e863d3fc8c4`:
- deployed inline JavaScript parses successfully;
- exactly one hamburger exists and it is a descendant of the left portal rail;
- the global top header contains no hamburger;
- collapse and expand produce the matching title, accessible label and `aria-expanded` state;
- collapsed desktop and mobile rules retain the 44-pixel rail strip containing the toggle.

Owner review clarified that rail ownership also requires conventional placement: the hamburger must be the first control at the top-left of the rail. Branding is secondary and may yield space to the toggle. R10 remains preserved as the exact rail-local-control artifact; the position correction proceeds in R11.

## R11 candidate
- Artifact: `prism/prism-turn01-pre-ship-r11.html`
- Application commit: `f590c7742d13d9e8497fd8d3e7ff3d73644e4d6d`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Status: **DEPLOYED MECHANICAL VALIDATION PASSED — OWNER TEST PENDING**

R11 makes the hamburger the first element in the left rail header, placing it at the rail's top-left on desktop and mobile. Compact branding follows to its right and remains hidden in the collapsed state. Collapse/expand behavior, the persistent collapsed toggle strip and all product surfaces remain unchanged.

Deployed qualification at application commit `f590c7742d13d9e8497fd8d3e7ff3d73644e4d6d`:
- deployed inline JavaScript parses successfully;
- the hamburger is the first element in the left rail header;
- compact branding follows the hamburger rather than preceding it;
- the R10 collapse/expand handler and persistent collapsed rail strip are unchanged.

## R12 candidate
- Artifact: `prism/prism-turn01-pre-ship-r12.html`
- Application commit: `0f8932c61125b32661d28c688eac902b1afd6c07`
- Blob: `4069ec8db8f803cda14d3572ff8c04cd3522de6c`
- Status: **SUPERSEDED FOR CORRECTION — MOBILE READABILITY / THREE-SLOT FILTER CONTRACT**

R12 replaces the expanding inline filter-value row with the governed two-row control hierarchy. Row 1 contains the three dimension controls followed by fixed AI POV and filtered item count. Row 2 contains one compact summary per active deduplicated filter. Each summary opens the chip-only adaptive modal/bottom sheet described above.

The existing AI right panel is reorganized—not replaced—into a fixed status header, scrollable context/prompt/result body and fixed action footer. AI POV exposes `Analyzing…` in Row 1 and the panel header for the full request duration. Research with AI, Continue and Add to Library remain reachable without scrolling. A completed analysis saves or updates its stable Analysis identity with one click and changes immediately to `Saved to Library`, preventing duplicate clicks.

Deployed qualification at application commit `0f8932c61125b32661d28c688eac902b1afd6c07`:
- inline JavaScript parses successfully;
- all DOM IDs are unique and required R12 controls exist;
- boot reaches Ready against the repository cache and renders the ECharts treemap;
- exactly three compact filter summaries render for the default Group/Color/Size dimensions;
- semantic All opens with individual chips off; direct subset, All-then-exclude and close-to-commit transitions pass;
- Row 1 and the panel header both expose the processing state without scrolling;
- the fixed Add to Library action becomes available after a completed analysis and acknowledges a one-click persisted save.

Owner mobile testing then exposed three R12 readability defects: selector values spent scarce width repeating role prefixes; duplicate dimensions were deduplicated into fewer than three visible filter controls; and the 120 / 58 / 26 / 11 treemap scale produced oversized, information-sparse tiles while tile labels remained too small. R12 remains preserved as the exact compact-control artifact; the scoped correction proceeds in R13.

## R13 candidate
- Artifact: `prism/prism-turn01-pre-ship-r13.html`
- Application commit: `e3f657b6a45129aace2e5f4b90280a4a9a4c0583`
- Blob: `246938c8ebf54afa2856a6cbe4233c40545774e4`
- Status: **REJECTED FOR CORRECTION — TREEMAP READABILITY / DISTANT FILTER / RESEARCH WORKFLOW**

R13 keeps the R12 two-row control and AI architecture while making the mobile surface readable. Row 1 selector values contain only dimension names. Row 2 always contains three controls aligned to Group, Color and Size; duplicate underlying dimensions remain visible and mirror one shared filter state. Map sizing uses the bounded governed 64 / 44 / 29 / 19 scale, larger wrapped labels with progressive metadata, and a compact dark tooltip confined to the viewport.

Deployed qualification at application commit `e3f657b6a45129aace2e5f4b90280a4a9a4c0583`:
- inline JavaScript parses successfully and boot reaches Ready from the 269-article repository cache with a rendered ECharts treemap;
- Group, Color and Size selectors display only dimension names, with their roles retained in accessible labels and fixed position;
- the default state and a duplicate Group=Subject / Color=Subject state both render exactly three ordered filter controls;
- duplicate Subject controls mirror one shared subset and the underlying predicate is evaluated once;
- a selected Source still governs both event inclusion and the only visible Source group identity;
- Importance weights resolve exactly to 64 / 44 / 29 / 19, large labels wrap with context and metrics, and the dark tooltip is viewport-confined;
- the exact R12 artifact remains unchanged at blob `4069ec8db8f803cda14d3572ff8c04cd3522de6c`;
- the public GitHub Pages artifact returns HTTP 200 and hashes to the committed R13 blob above.

Owner mobile testing showed that R13 still packed most events into unlabeled or initial-only rectangles inside a map with excessive unused margin. Filter selection traveled to a bottom sheet far from its trigger. The AI panel duplicated Config concerns and retained an unnecessary Continue action, while Library rendered saved output as a constrained card rather than a live research workspace. R13 remains preserved as the exact rejected artifact; correction proceeds in R14.

## R14 candidate
- Artifact: `prism/prism-turn01-pre-ship-r14.html`
- Application commit: `7eec8d502600c090b263e74fad7c564ebbf89ee3`
- Blob: `56ba6eb63bf27073399c471fde44164e16c3990f`
- Test URL: `https://acmeproducts.github.io/stuff/prism/prism-turn01-pre-ship-r14.html?v=7eec8d502600c090b263e74fad7c564ebbf89ee3`
- Status: **DEPLOYED MECHANICAL VALIDATION PASSED — OWNER TEST PENDING**

R14 keeps Explore, global AI placement, top-right Config placement, Portal shell and reader architecture unchanged. It removes AI runtime setup from the AI panel, enables provider-native current-web research automatically, requires adjacent direct URLs and enforces the WSJ-only paywall exception. The panel is Context → Prompt → Analysis with a sticky run/save footer and no Continue action.

Library becomes a flowing master/detail research workspace with its own Omnisearch rail, full transcript, persistent bottom research composer, device-persisted continuation, and Markdown/PDF/JSON/CSV artifacts. The filter chip popover anchors to the tapped Row 2 control. The Map fills its canvas, uses 144 / 64 / 28 / 12 governed weights, spends large geometry on readable multi-line content, suppresses unreadable micro-labels, and supports one-tap group focus/clear.

Deployed qualification at application commit `7eec8d502600c090b263e74fad7c564ebbf89ee3`:
- inline JavaScript parses successfully, DOM IDs are unique, and the application boots from the 269-article repository cache with a rendered ECharts treemap;
- exactly three role-aligned filters render, the selector anchors immediately below its trigger, and a selected Source governs both event inclusion and the only visible Source group;
- governed Importance weights resolve to 144 / 64 / 28 / 12, the treemap occupies the full canvas, hero labels use 22-pixel multi-line text, and unreadable geometry suppresses labels;
- a group click focuses that group and exposes the named × control, which restores the all-groups map;
- AI POV contains Context → Prompt → Analysis and only Run analysis plus Add to Library in its fixed footer; API keys, provider/model validation and the default runtime remain in Config;
- OpenRouter, Anthropic and Venice request contracts enable provider-native current-web search, append returned direct citations, and reject non-WSJ paywalled references;
- Library card selection opens the flowing research workspace, URL Omnisearch and negative URL exclusion pass, live-web provenance survives JSON/CSV normalization, and Markdown/PDF/JSON/CSV artifact actions are present;
- the exact R13 artifact remains unchanged at blob `246938c8ebf54afa2856a6cbe4233c40545774e4`;
- the public GitHub Pages artifact returns HTTP 200, contains 104,580 bytes and hashes exactly to the committed R14 blob above.

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
6. Group, Color and Size each retain one visible role-aligned filter control, including when roles share a dimension; duplicate controls mirror one underlying filter state;
7. no inactive dimension has a visible or hidden active filter;
8. Importance, Corroboration, Recency and Tier use governed bucket/value semantics;
9. filter chips are colored and serve as the legend; no redundant legend remains;
10. a Source-only filter cannot leave an unselected Source group visible;
11. Map tiles use available area for larger wrapped headlines and richer information when geometry permits, and mobile tooltips remain compact and viewport-confined;
12. Size produces materially visible 144 / 64 / 28 / 12 bucket/value area differences, and large areas are used for readable information rather than blank color;
13. Library has no persistent dimension/filter controls and has its own Omnisearch + Analysis-card left rail;
14. Library Omnisearch proves positive, `-negative`, wildcard, `source:` and `url:` matching;
15. a selected Analysis renders its complete timestamped conversation and continues from a bottom compose strip with device persistence;
16. each Analysis exports as Markdown, print-to-PDF, JSON and CSV, and Config imports/merges JSON/CSV non-destructively;
17. AI prompt policy requires direct URLs for every external reference/research suggestion and excludes paywalled references except WSJ;
18. Map, Feed, Sources, AI/provider configuration, reader, selection and Library do not regress;
19. Explore remains the baseline visualization for this gate;
20. adding a valid custom RSS/Atom or JSON source fetches and normalizes its articles, exposes truthful status/counts, and makes the source available throughout the shared corpus and Source controls;
21. a custom source refresh failure is visible and cannot masquerade as successful ingestion; cached fallback, retry and removal behave non-destructively.
22. all nine repository defaults remain visible in Source inventory regardless of enabled/cache state, a prior all-hidden R8 state restores once on migration, and source startup does not require upgrading the shared PRISM database.
23. the hamburger exists inside the left portal rail, performs only rail collapse/expand, remains reachable while collapsed, and is absent from the global top header.
24. the hamburger is the first control in the rail header and occupies the rail's top-left position; branding is secondary to its right.
25. the ribbon has a non-scrolling Row 1 for Group/Color/Size + AI POV + item count and a non-scrolling Row 2 with exactly three role-aligned summaries; visible selector values do not repeat `Group ·`, `Color ·` or `Size ·`.
26. each filter summary opens a chip-only popover immediately below its trigger (or above only to remain on-screen); semantic All opens with individual chips off, All activates every current value, close commits, and zero/every value normalize to All.
27. AI processing remains visible in Row 1 and the fixed panel header, while Run analysis and one-click Add to Library remain available in a fixed panel footer without scrolling; the panel contains no provider/key/model setup and no Continue action.
28. Library continuation automatically uses the Config-selected verified provider, searches the current web over the saved PRISM package and persists the appended turn without leaving Library.
29. tapping a Map group focuses that group and exposes a named × control that restores all groups; unreadably small tile geometry does not display initials as substitute content.

## Standing process law
Rollback/recovery always uses a specific existing repository artifact. Never manufacture a substitute baseline. Once the owner identifies the baseline, governance and implementation must continue from that artifact until the owner explicitly changes it.
