# Market Navigator — Frozen Contract

Status: **FROZEN**

This document is the acceptance contract for Market Navigator. It is authoritative for the UI, scoring presentation, drill-down behavior, and validation gates. A build that violates this contract is rejected and must not replace the canonical test surface.

## 1. Core purpose

Market Navigator is a directional situational-awareness product for investors. It is a windshield, not a trading terminal. The default page must answer, at a glance:

1. Where was the market state at the selected horizon start?
2. Where is it now?
3. How much did it move?
4. Was that move favorable or unfavorable?
5. What weighted children caused the move?
6. What does the combined evidence mean?

The user must not need to infer these answers from disconnected labels, navigate through multiple surfaces, or mentally reconcile inconsistent charts.

## 2. One mathematical grammar at every level

The hierarchy is recursive:

**Regime → Risk / Growth / Macro → Components**

Every parent must be derived from its declared weighted children. The same data grammar applies at every level.

For every Regime, Index, and Component view, the data contract contains:

- **T0 value** — the value at the beginning of the selected horizon.
- **Now value** — the latest valid value for that same horizon.
- **Delta** — `Now - T0` in the native display unit.
- **Delta %** — `(Now / T0 - 1) × 100` when mathematically meaningful.
- **Direction** — improving / stable / deteriorating.
- **Favorability** — favorable / neutral / unfavorable relative to the parent model.
- **Weight** — the component's declared contribution weight when it has a parent.
- **Weighted contribution** — the child's actual signed contribution to the parent movement.

For bounded 0–100 indexes, **Delta in index points is primary**. Delta % may be shown as supplemental context but must never be presented as an investment return.

For rates, yields, spreads, and similar percentage-level components, Delta must use percentage points/basis-point logic rather than misleading percentage-return language where appropriate.

## 3. T0-relative physics

The selected horizon is global. Choosing `1M`, `3M`, `6M`, `YTD`, `1Y`, `5Y`, or `All` establishes the same T0 across the entire dashboard.

The index baseline for comparative scoring is **T0 = 50**.

All parent and child paths shown for that horizon must be computed from the same T0 and the same declared weighting model.

The current parent value must reconcile to the weighted child values at the same timestamp. The displayed current value must equal the final plotted point.

No synthetic history may be invented to fill missing observations.

## 4. Favorability is semantic, not sign-only

Positive raw Delta does **not** automatically mean favorable.

Examples:

- Rising growth leadership can be favorable.
- Rising VIX can be unfavorable.
- Rising Treasury yields can be unfavorable for growth/valuation even though the numeric Delta is positive.
- Falling credit spreads can be favorable even though the numeric Delta is negative.

Favorability therefore comes from the model's declared direction/sign for that component, not from the raw sign alone.

### Required color grammar

Color communicates favorability consistently everywhere:

- **Green** = favorable contribution.
- **Amber** = neutral / not decisive.
- **Red** = unfavorable contribution.

This color applies to the Delta/favorability treatment, including the relevant numeric change and contribution indicator.

Color must never contradict the model semantics. A positive numeric Delta may be red when that rise is unfavorable; a negative numeric Delta may be green when that decline is favorable.

State classification and favorability remain separate concepts.

## 5. State, direction, and favorability are separate

Never collapse these into one badge.

Each index has:

- **State:** Optimistic / Neutral / Pessimistic.
- **Direction:** Improving / Stable / Deteriorating from T0 to Now.
- **Favorability:** applies to a child/component's contribution to its parent.

A score can be Neutral while Improving. That is valid. The UI must make the distinction immediately understandable rather than producing contradictory-looking labels.

## 6. Frozen default dashboard layout

There is one shared horizon control ribbon across the top of the content area. It controls every chart and commentary block on the page.

### Row 1

**X — Regime chart**

- Tall, compact landscape/portrait-like card; not a panoramic strip.
- Enough vertical height that movement across the neutral boundaries is visually meaningful.
- Displays T0, Now, Delta, Delta %, State, Direction.
- Shows the Regime path over the selected horizon.
- Two visually clear horizontal neutral-boundary lines at **42 and 58**.
- No large text label stamped across the neutral zone.
- X-axis uses sufficiently close date anchors to provide time context.
- Hover/touch crosshair shows date and exact value.
- Start and final values are visibly attached to the path.

**Y — Regime commentary / What does this mean?**

- Same row as Regime chart.
- Already populated from the current persisted snapshot; the user should not need to click another surface to get basic interpretation.
- Commentary must explain the actual weighted causes of the Regime movement.
- It must state the contribution from Risk, Growth, and Macro and identify the largest favorable and unfavorable child drivers.
- Commentary must distinguish numeric evidence from news/event overlay.
- It may be generated by AI, but the numeric evidence and arithmetic are deterministic inputs.
- Generated commentary is saved to the Analysis Library.

### Row 2

Three equal cards:

**Risk | Growth | Macro**

- Tall charts, not shallow strips.
- Same chart geometry and visual grammar.
- Same global horizon/T0.
- Each displays T0, Now, Delta, Delta %, State, Direction.
- Neutral boundaries at 42 and 58.
- Hover/touch crosshair.
- Clicking a card does **not** navigate away from the dashboard.

## 7. Component drill-down is modal and scalable

Clicking Risk, Growth, or Macro opens a modal over the dashboard.

The modal contains:

- Index summary at top.
- A horizontally scrollable tab strip of all declared components.
- Each tab includes the component name and model weight.
- One tall standardized component chart at a time.
- Previous/next controls wrap continuously.
- Swipe left/right cycles components and wraps continuously.
- Closing the modal returns to the unchanged dashboard.

The component modal must scale to an arbitrary number of components without adding new dashboard rows or creating a separate navigation hierarchy.

Every component view shows:

- T0 raw value.
- Now raw value.
- Raw Delta.
- Delta % when meaningful.
- Weight.
- Weighted contribution to parent.
- Favorability with green/amber/red semantics.
- Direction.
- Start/end values on the plotted line.
- Date X-axis.
- Hover/touch crosshair.

## 8. Analysis and library

Analysis is part of the product, not a disconnected developer tool.

The current dashboard commentary is the first-level analysis.

Users can run/save deeper analysis from Regime, an Index, or a Component.

Every saved analysis record contains at minimum:

- title
- timestamp
- scope
- horizon
- database/model revision
- T0 value
- Now value
- Delta
- Delta % where meaningful
- State
- Direction
- weighted children/components
- favorability and weighted contribution
- source/evidence list
- generated narrative

The library default view is compact. Full actions such as delete/download/export appear only after opening a record.

## 9. News/event overlay

News remains part of the product as contextual intelligence.

News is **not** used as a deterministic scoring input unless the scoring model explicitly declares it.

AI may discuss news as an event overlay but must not claim causality without supporting numerical evidence.

News classification can be favorable/neutral/unfavorable and user correction may eventually build a classification corpus, but this is separate from the deterministic Regime arithmetic.

## 10. Data and collection architecture

The UI reads the canonical persisted database/cache. It does not fan out to market/FRED providers during normal rendering.

The collection workflow is separate from UI deployment.

The background collector:

- runs on its own schedule
- respects per-source cadence/TTL
- retains last-known-good data
- updates only due series
- builds/validates persisted market data
- does not rewrite or migrate the UI

The UI:

- loads persisted data
- renders immediately from the cache/database
- does not manufacture alternate index histories
- does not trigger provider collection merely because the page opened

## 11. Mandatory validation gates

A build must not be published as canonical unless all of the following pass:

1. Hamburger works on desktop and mobile.
2. One global horizon selector updates Regime, Risk, Growth, Macro, commentary, and component-modal context consistently.
3. Every displayed Now value equals its final plotted point.
4. Every displayed Delta equals Now minus T0.
5. Every displayed Delta % is mathematically correct where applicable.
6. Favorability color matches model semantics, not merely numeric sign.
7. Regime arithmetic reconciles to Risk/Growth/Macro.
8. Risk/Growth/Macro arithmetic reconciles to declared weighted components.
9. Weight totals reconcile to the model contract or explicitly report missing coverage.
10. Neutral boundaries render at 42 and 58 on every index chart.
11. All four dashboard charts use the same geometry/grammar.
12. Charts have visible date X-axis labels.
13. Hover/touch crosshair returns exact date/value.
14. Index click opens component modal without replacing the dashboard.
15. Component tabs/next/previous/swipe wrap continuously.
16. Commentary states the weighted drivers rather than generic prose.
17. Analysis generated from a snapshot is saved to the Analysis Library.
18. No background provider fan-out occurs during ordinary UI load.
19. No scheduled data-collection workflow modifies UI files.
20. No canonical publication occurs after a failed validation gate.

## 12. Change control

This contract is frozen.

Implementation may refactor code freely to satisfy it, but behavioral changes to this document require an explicit contract amendment before implementation.

A failed implementation is corrected against this contract; it is not patched by inventing a new interaction model, new chart grammar, new navigation path, or new data semantics.
