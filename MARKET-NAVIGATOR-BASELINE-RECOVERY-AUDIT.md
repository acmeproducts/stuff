# Baseline recovery audit and recovery plan — 2026-10-22

Status: **CHART RECOVERY HOLD — AUDIT COMPLETE; IMPLEMENTATION NOT STARTED.**
This is a management review requested by the owner, not another chart patch or a declaration that the release works.

## Accountability and versions

I approved the release and overstated what the checks proved. Passing data reconciliation, HTML pinning and hundreds of combinations did not establish compliance with the chart's market-session geometry. The owner should not have had to find this.

- Approved interaction baseline: `market-navigator-chart-correction/approved-throwaway.html`, blob `ee38d9c9da9af4b2795695a39519c76e6c5e5239`.
- Rejected published chart examined: blob `03fac31e5cfc91f2351257e19e227ec98842f557`; batch implementation source `e3c7be33a0e45d84ef392d24c239e912d708a88c`.
- Source snapshot examined: `d944aa0f79d3c542c9731ca30cc50529841d1ae8`.
- Owner screenshot: 1000385566.jpg, ENV / RSK, 5D, NFCI selected, As of October 20.
- The baseline remains the interaction reference. It is not proof that every inherited time-axis behavior complies with the written spec. A blind rollback alone would leave the weekend-spacing defect.

## What the implementation and review missed

| Finding | Evidence | Consequence |
| --- | --- | --- |
| 5D chooses five market dates but uses calendar milliseconds for X distances. | Source projector divides `q.t - w.start` by elapsed milliseconds. October 14, 15, 16, 19, 20 are five sessions; the Friday-to-Monday interval is three times the Thursday-to-Friday interval. | Weekends occupy plot width even though no weekend label appears. This contradicts the market-session rule. |
| A weekly display point changes the whole chart's end. | `sourceSet25` appends a synthetic `held:true` point at `w.end` (23:59:59.999). Current `observationWindow` uses midnight only when every point is midnight-aligned, including these synthetic points. | Adding NFCI changes the domain from October 20 midnight to the end of October 20. Real daily readings stop short while the artificial weekly tail reaches the right axis. |
| The earlier right-edge correction fixed only the daily-only case. | The approved baseline trims held tails to the last real observation. The replacement removed that behavior and made the projection conditional on the selected points. | The baseline's aligned real endpoints regressed in a mixed-cadence chart. |
| The baseline also contains an inherited spec mismatch. | Baseline projection still uses calendar milliseconds. It also builds held source display points. | Restoring the old file without checking it against the spec would repeat part of the failure. An accepted interaction baseline is not an independently verified data/display contract. |
| The 504-case period gate missed the reported combination. | Its selected source set is `[anchor, qqq, wti, copper, dxy, hySpread]`: daily sources, no NFCI/weekly/monthly/quarterly series. | It never tested the synthetic weekly endpoint that changes the projection. |
| Pixel expectations repeat the implementation's assumption. | The audit's `xy` helper also divides elapsed timestamps by `window.plotEnd - window.start`. Tests reject weekend tick labels, but never require equal adjacent-session spacing. | The tests can validate the wrong geometry against the same wrong formula. |
| The all-source date test omits held points from its key assertions. | The date test checks real points with `z.points.filter(q => !q.held)`. | Correct raw values/source dates can pass while a synthetic point controls the domain incorrectly. |
| Browser display preparation crosses the data boundary. | Browser `sourceSet25` chooses references, computes normalized values, and adds held endpoints; `observationWindow` then derives geometry from those prepared points. | Batch qualification does not validate every display point ultimately used to lay out the chart. Patch layering has left multiple definitions of what the chart period means. |

The screenshot does **not by itself prove raw provider values or index weights were corrupted**. It does prove that the release's presentation acceptance was insufficient. Data receipts and chart compliance are separate claims; neither can stand in for the other.

## Reproduction, not a proposed fix

Run from the repository root:

```
node market-navigator-acceptance/recovery-audit/reproduce.cjs market-navigator-acceptance/recovery-audit/seams.json market-navigator-acceptance/recovery-audit/result.json
```

The harness executes the actual baseline/current `sourceSet25` and `observationWindow` functions with synthetic values and the reported date/cadence arrangement. This is a geometry diagnosis, not a new provider-data qualification.

- Oracle: five sessions October 14, 15, 16, 19, 20 occupy fractions **0, .25, .5, .75, 1**.
- Baseline fractions: **0, .1667, .3333, .8333, 1**. It aligns the final daily observation, but still gives weekends width.
- Current fractions with NFCI: **0, .1429, .2857, .7143, .8571**.
- At a 374-pixel plot width, the current daily endpoint is **53.43 pixels short**. That corresponds to the screenshot's approximately 54-pixel right-side gap.
- Current daily-only domain ends at midnight; adding the weekly held point switches it to 23:59:59.999.
- NFCI's retained native series ends October 16. Its October 20 display endpoint is held display geometry, not an October 20 source observation.

## Recovery path and exit gates

### 1. Freeze chart changes and establish the baseline delta ledger

Use the already approved baseline above; do not search for or invent another baseline. Inventory the constructor's 108 declared transformations against it. Classify each as an explicitly approved owner change, a required data adapter, or an unproven correction. Record which functions it changes, which test independently proves it and whether it alters stored observations, model arithmetic, display values or coordinates.

Do not ship another sequence of viewport/endpoint patches. Do not combine this recovery with rail/config redesign, provider replacement, a new index model or changes to fixed anchors. Keep the daily-batch delivery policy separate and preserve the last verified batch.

**Exit:** a reviewable baseline-versus-candidate change ledger and one bounded recovery candidate. This audit produces the reviewable plan; it does not perform a live rollback or release.

### 2. Establish one verified batch-to-chart contract

The batch must provide the governed session calendar, common cutoff, horizon session lists, original source observation dates/timestamps, native values, precomputed Fixed/Horizon comparison values and reference provenance. Reuse the already governed calculations; do not invent a new calculation method.

For 5D, publish the five official market-session IDs and their order. Session boundaries must not be derived from whichever series is selected. A late, sparse or weekly series cannot change the requested session grid.

Resolve source display against the existing written rule: **no silent visual carry-forward of source lines**. A source endpoint is its actual observation. Composite carry-forward allowed by the index model remains distinct from source observations. Any explicitly supported held-state decoration must be identified as a decoration and must not create observations, crosshair dates, axis bounds or a new time domain.

Move financial/reference/horizon preparation to the verified batch payload. The browser consumes those values and maps the certified coordinates to pixels; responsive layout and drawing remain presentation work. No second set of financial calculations in NOW versus Analyze versus export.

**Exit:** source payload, reference/indexed values and model contributions reconcile at Levels 0, 1 and 3, with one common batch date and an inspectable session grid.

### 3. Restore one shared renderer from the approved mechanics

Restore the approved interaction behavior and replace the competing time-domain paths with one session projection. For 5D the five session slots are equally spaced; Friday-to-Monday is one adjacent-session interval. Explicitly retain the documented semantics of other horizons rather than blindly applying a new time scale everywhere.

No series addition, removal, highlight, sparse cadence or held decoration can change the session domain or push real endpoints away from the right boundary. Y1/Y2 retain the approved unit-family ownership. Adding actual values may legitimately change autoscale limits; that must not change dates, reference values, family assignment or plot-frame alignment.

Use the same projection for strokes, steps/bars, ticks, hit testing, crosshairs, snapshots and new exports in NOW and Analyze. Preserve already saved Library evidence as captured.

**Exit:** one implementation of period/session ownership, with no fallback based on the selected series' timestamp shape.

### 4. Replace the inadequate acceptance oracles before claiming a fix

Add these independent checks first; the rejected chart must fail them:

1. Five official sessions across a weekend and a market holiday have five equal slots, no weekend/holiday slots and the correct cutoff.
2. The screenshot's RSK components with NFCI selected, under Fixed/Horizon and Indexed/Y1+Y2, keep identical session coordinates before/after NFCI addition or highlight.
3. Repeat with every weekly/monthly/quarterly source, including one real observation, no in-window observation and different real final dates.
4. Daily series with the same final observation date meet the same right boundary. A genuinely earlier source reading remains earlier; never extend it to make it look current.
5. Verify actual painted coordinates against session ordinals generated independently from the governed calendar, not against the renderer's timestamp formula.
6. Verify tooltip date | indexed value | native value against the same certified observation and reference. No held/weekend/fabricated inspection reading.
7. Verify source/native/indexed values, batch identity, fixed anchors, index weights/signs/scales and per-horizon contributions against the existing verified package.
8. Preserve crosshair-versus-legend gestures, persistent choices and source styles, family axes, all horizon controls, compact footer and the 6 a.m. batch policy.
9. Replay NOW and Analyze on phone/desktop profiles with visible pixel evidence, including the exact rejected NFCI arrangement. Review those screenshots against the contract, not merely for whether they render.

**Exit:** the new oracles fail the rejected implementation, pass the recovery candidate, and the full existing suite passes without weakening assertions. Automated profiles do not replace physical Windows 11/Android acceptance.

### 5. One review candidate, then controlled publication

Provide one recovery URL only after the above proof and visual review. Accompany it with the baseline delta ledger, receipt identifying the exact data batch, independent failed-before/passed-after evidence and the audit of preserved behavior. Do not ask the owner to discover omitted cases.

Record the candidate hash and review result before any production chart replacement. Neither a green workflow nor the old 504-case count is sufficient on its own.

## Current action boundary

Completed in this turn: source/spec/baseline audit, deterministic reproduction and this recovery plan.
No chart code, data values, model formula, workflow or deployed product file was changed by this audit. The daily-batch delivery contract remains in force.


## Recovery addendum — model boundary and owner interaction clarification

The X-axis diagnosis is not a certification of the data model. No X-axis correction has been implemented during these audits.

### Confirmed structural weakness

The current source adapter creates real observations and synthetic held endpoints in the same point array. It also computes indexed/reference values in the browser. Downstream projection, snapshots and hit testing then consume that mixed array. The batch receipt verifies stored source/model facts but does not certify all display points later manufactured by the renderer. This is a broken boundary between verified data and chart preparation, not merely a mislabeled X tick.

Current selection likewise has multiple representations (`sel`, local `active`, `S.nowActive` and captured chart active state). Inspection changes `sel` to the nearest series regardless of tap distance, while selection/outline synchronization occurs only inside a 24-pixel gate. A pure-function probe confirms that a distance-25 inspection can show A while B remains selected. This proves a permitted inconsistent state; it does not claim that the exact physical Android tap sequence has already been reproduced.

Current popup code positions a normal interior box at `point.x + 8`, uses one inline date/index/native row, and has no visible series-title row. The owner's newly specified left-side, three-row shape supersedes that old layout.

### Required data-to-chart contract before recovery implementation

1. **Source observations:** stable observation IDs, source series ID, actual observation date/timestamp, native value and unit, collection/publication provenance and retained source evidence. A collection time is not an observation date.
2. **Governed index facts:** model version, fixed anchors, weights/signs/scales, per-component contribution and index evaluation session, referencing the actual source observations used. Preserve the approved formulas; do not create another model to compensate for display faults.
3. **Certified horizon payload:** batch identity/cutoff, official ordered session grid, eligibility, references and precomputed native/indexed comparison values for each supported horizon/reference. Keep source observations, index evaluations and any permitted display decorations as distinct types. Decorations cannot enter source counts, period selection, axis-domain ownership or crosshair readings.
4. **View state:** one authoritative selected series ID per consumer, with a committed observation ID for inspection. Outline, marker and popup derive from that state; they do not independently decide which series is active. Browser work is pixel/layout/interaction work, not a second financial calculation pipeline.

These contracts must reconcile Level 0 source observations, Level 1 horizon/reference values and Level 3 index contributions/values against the same verified batch. Existing evidence does not establish corruption of raw provider values or approved model weights. That must be determined by reconciliation, not by changing providers, dates, weights or anchors speculatively.

### Added acceptance witnesses

The owner clarification in MARKET-NAVIGATOR-CHART-OWNER-CLARIFICATIONS.md is controlling. Machine-readable expectations are in market-navigator-acceptance/recovery-audit/owner-additions.json and are **specified, not yet implemented or passed**.

- Select B, then tap A: exactly A is outlined and the marker/popup identify A; repeat with a nearby miss, overlapping lines, touch, rerender and parked NOW/Analyze.
- Verify the three rows, readable near-square proportions, actionable date link and matching certified indexed/native values.
- Verify left-of-point placement at both endpoints and the center, on phone/desktop, with long labels/values and rail open/closed. No right-side fallback, clipped essential content or geometry changes.
- Validate typed data/horizon contracts before geometry tests. Reject synthetic source observations, a display-owned session domain and consumer-specific financial arithmetic.
- Retain the existing legend-only information card, family axes, persistent choices, exports and saved Library evidence.

The probes in recovery-audit/inspect-interactions.cjs and interaction-seams.json reproduce current-code weaknesses with mocked events/layout. They are forensic evidence, not browser, physical-device or data-model acceptance. No runtime patch is being added as a separate quick fix.
