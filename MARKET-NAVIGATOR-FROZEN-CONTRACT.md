# Market Navigator — Frozen Contract

Status: **FROZEN — AMENDED 2026-08-23**

This document is the acceptance contract for Market Navigator. It is authoritative for the UI, signal interpretation, drill-down behavior, and validation gates. A build that violates this contract is rejected and must not replace the canonical test surface.

## 1. Core purpose

Market Navigator is a directional situational-awareness product for investors. It is a windshield, not a trading terminal and not a claim of scientific precision.

The product answers one primary question:

> **How favorable is the current investment environment relative to the selected historical period, what evidence is driving that assessment, and is that evidence strengthening or weakening?**

The hierarchy is question-led:

- **Regime:** How favorable is the current overall investment environment relative to the selected period?
- **Risk:** How elevated is current financial/market risk relative to the selected period?
- **Growth:** How strong or weak is current economic/growth momentum relative to the selected period?
- **Macro:** How supportive or restrictive are inflation, policy, rates and financial conditions relative to the selected period?
- **Component:** What does this observable contribute to the parent question relative to its own history?

The user must not need to infer these answers from disconnected labels, navigate through multiple surfaces, or mentally reconcile inconsistent charts.

## 2. Evidence first; interpretation second

Market Navigator uses two distinct layers.

### Deterministic evidence layer

For every raw component, preserve and display when applicable:

- **T0 value** — value at the beginning of the selected horizon.
- **Now value** — latest valid value.
- **Delta** — Now minus T0 in the native unit.
- **Delta %** — percentage change where mathematically meaningful.
- **Relative position** — current percentile or comparable location within the selected historical window.
- **Trend** — rising / falling / stable using a cadence-appropriate recent observation window.
- **Persistence** — how many consecutive comparable observations support that direction.
- **Acceleration** — whether the rate of change is strengthening, steady or weakening when enough observations exist.
- **Confirmation** — whether economically related indicators support the same signal.
- **Source cadence and latest release date.**

These are observations, not opinions.

### Interpretive signal layer

Raw observations are grouped into established economic signal families. The signal family asks an economic/business-cycle question and classifies the combined evidence.

The canonical signal families are:

1. **Inflation Pressure** — Is inflation pressure building, contained, or easing?
2. **Financial Conditions** — Are policy, rates, credit and liquidity becoming more supportive or restrictive?
3. **Growth Momentum** — Is economic activity expanding, stable, slowing, or contracting?
4. **Market Risk / Stress** — Is market and credit stress low, normal, elevated, or acute?

The signal layer must use multiple related observations for confirmation rather than treating every series as an interchangeable weighted input.

## 3. Component roles are economically distinct

Components are not all doing the same job and must not be equal-weighted simply because they exist.

Examples:

- CPI/Core PCE are direct evidence of realized inflation.
- WTI is an inflation/supply-pressure input and contextual confirmer, not a substitute for CPI.
- Breakevens are market inflation expectations.
- Fed Funds/2Y/real 10Y describe policy and discount-rate restraint.
- NFCI and credit spreads describe financial conditions/stress.
- Payrolls and industrial production are coincident activity evidence.
- Initial claims and market/curve measures can provide earlier-cycle information.

The model must preserve those roles explicitly.

## 4. Trend, persistence and confirmation

The system must not classify an indicator from one isolated observation when its release cadence supports a trend assessment.

Cadence-appropriate examples:

- Monthly inflation: three consecutive monthly releases are meaningful persistence.
- Quarterly GDP: evaluate successive quarterly releases; do not fabricate daily GDP.
- Weekly claims/NFCI: use successive weekly observations.
- Daily market/rate series: use short- and medium-window direction rather than one-day noise.

Example interpretation:

> Three successive inflation increases, accompanied by rising WTI and rising inflation expectations, constitute stronger evidence that inflation pressure is building than any one series alone.

Confirmation increases confidence. Divergence reduces confidence and should be shown as mixed/ambiguous rather than forced into a false precise score.

## 5. Controlled language

Numbers describe what happened. Signal language describes economic meaning.

### Components

Use factual language:

- Relative position: Very Low / Low / Normal / High / Very High
- Trend: Falling / Stable / Rising
- Persistence: 1 / 2 / 3+ comparable periods
- Acceleration: Accelerating / Steady / Decelerating when supported
- Implication: Favorable / Neutral / Unfavorable / Ambiguous **for the parent question**

### Signal families

Use domain language:

- Inflation Pressure: Easing / Contained / Building / High & Persistent
- Financial Conditions: Supportive / Neutral / Restrictive / Very Restrictive
- Growth Momentum: Contracting / Weakening / Stable / Improving / Strong
- Market Risk / Stress: Low / Normal / Elevated / High / Acute

Each family also has a direction: Improving / Stable / Deteriorating.

### Regime

Use qualitative investment-environment language:

- Very Favorable
- Favorable
- Neutral / Mixed
- Caution
- Defensive

A numerical plotting coordinate may exist internally for chart continuity, but the words and evidence are primary. The UI must not imply that a value such as 63.482 is a scientifically measured quantity.

## 6. Favorability and color

Positive raw Delta does **not** automatically mean favorable.

Examples:

- Rising growth leadership can be favorable.
- Rising VIX can be unfavorable.
- Rising inflation can be unfavorable even though Delta is positive.
- Falling credit spreads can be favorable even though Delta is negative.

Required color grammar:

- **Green** = favorable evidence or improving condition.
- **Amber** = neutral, mixed, ambiguous or cautionary transition.
- **Red** = unfavorable evidence or deteriorating condition.

Color follows economic meaning, not arithmetic sign.

## 7. Regime classification is interaction-aware, not a simple average

Regime must **not** be defined as the arithmetic mean of Risk, Growth and Macro.

The regime classifier evaluates the combination of the signal families. Canonical patterns include:

- **Favorable / Expansion:** growth improving or strong; inflation contained/easing; financial conditions supportive or neutral; risk low/normal.
- **Caution / Late-cycle pressure:** growth remains positive but inflation pressure is building and/or financial conditions are restrictive; risk may be rising.
- **Defensive / Stagflationary pressure:** growth weakening while inflation remains high/persistent and financial conditions are restrictive.
- **Defensive / Contraction:** growth contracting/weakening with elevated market/credit stress and restrictive conditions.
- **Early recovery / Improving:** growth turning upward, inflation contained/easing, financial conditions easing, and risk falling.
- **Neutral / Mixed:** evidence is materially divergent or insufficiently confirmed.

These are transparent rules, not hidden AI judgments. AI explains the classification but does not manufacture it.

## 8. Historical comparison

The selected horizon is global: `1M`, `3M`, `6M`, `YTD`, `1Y`, `5Y`, `All`.

For raw components, the selected window establishes T0 and the comparison distribution.

For every component show:

- T0
- Now
- Delta
- Delta % where meaningful
- selected-window relative position/percentile
- trend/persistence
- implication

Historical regime charts must reconstruct the same signal rules through time. Do not force all histories to start at 50 merely to create movement, and do not rescale each window solely to make a chart appear dramatic.

The meaning of a regime classification must remain stable across horizons. The selected horizon changes the comparison context, not the definition of "Favorable" or "Defensive."

## 9. Frozen default dashboard layout

There is one shared horizon control ribbon across the top of the content area. It controls every chart and commentary block on the page.

### Row 1

**X — Regime history / classification chart**

- Tall compact card, not a panoramic strip.
- Shows historical regime/classification changes through the selected period.
- X-axis has useful date context.
- Hover/touch shows date, classification and supporting signal state.
- The display must provide enough vertical resolution to distinguish materially different regimes.

**Y — What does this mean?**

- Same row as the Regime chart.
- Already populated for the current snapshot.
- States the current Regime classification and confidence/confirmation.
- Explains which signal families are driving it.
- Identifies confirming and conflicting evidence.
- Distinguishes deterministic evidence from news/event overlay.
- AI may write the prose, but deterministic signal results are supplied to it.
- Generated commentary is saved to the Analysis Library.

### Row 2

Three equal tall cards:

**Risk | Growth | Macro**

The visible Macro card summarizes Inflation Pressure + Financial Conditions rather than hiding them inside an arbitrary mean.

Each card shows the family/condition classification, direction, principal confirming evidence and selected-period relative context.

Clicking Risk, Growth or Macro opens component/signal detail in a modal and does not navigate away from the dashboard.

## 10. Component/signal drill-down is modal and scalable

The modal contains:

- Parent signal summary.
- Horizontally scrollable tabs of declared evidence components/sub-signals.
- One tall standardized chart at a time.
- Previous/next controls wrap continuously.
- Swipe left/right cycles and wraps continuously.
- Closing returns to the unchanged dashboard.

Every component view includes the deterministic evidence fields from Section 2 and a concise statement of why that evidence matters to the parent signal.

## 11. Analysis and library

The current dashboard commentary is the first-level analysis.

Users can run/save deeper analysis from Regime, a signal family, or a component.

Every saved analysis record contains at minimum:

- title
- timestamp
- scope
- horizon
- database/model revision
- deterministic component observations
- relative positions
- trends/persistence
- signal-family classifications
- confirming/conflicting evidence
- current Regime classification
- source/evidence list
- generated narrative

AI must validate the supplied deterministic evidence, explain it, and clearly distinguish observation from inference. It must not invent a synthetic causal relationship or change the deterministic classification silently.

## 12. News/event overlay

News remains contextual intelligence and is not a deterministic scoring input unless explicitly declared by a later contract amendment.

AI may discuss news as an event overlay but must not claim causality without supporting numerical evidence.

## 13. Data and collection architecture

The UI reads the canonical persisted database/cache. It does not fan out to market/FRED providers during normal rendering.

The background collector:

- respects per-source cadence/TTL
- retains last-known-good data
- updates only due series
- does not rewrite or migrate UI files

The UI:

- loads persisted data
- renders from persisted observations
- does not trigger provider collection merely because the page opened

## 14. Mandatory validation gates

A build must not be published as canonical unless all of the following pass:

1. Hamburger works on desktop and mobile.
2. One global horizon selector updates Regime, signal cards, commentary and modal context consistently.
3. Every component T0/Now/Delta/Delta% is mathematically correct.
4. Relative-position calculation uses the selected valid observation window.
5. Trend/persistence uses the declared cadence-aware rule.
6. Favorability color matches economic meaning, not numeric sign.
7. Signal-family classifications reconcile to their declared evidence rules.
8. Regime classification reconciles to the transparent regime rule table rather than a simple average.
9. Divergent evidence can produce Mixed/Ambiguous rather than a forced classification.
10. Dashboard charts use consistent geometry and useful X-axis labels.
11. Hover/touch returns exact date/value/classification context.
12. Index/signal click opens a modal without replacing the dashboard.
13. Tabs/next/previous/swipe wrap continuously.
14. Commentary states actual confirming/conflicting evidence rather than generic prose.
15. Analysis generated from a snapshot is saved to the Analysis Library.
16. No background provider fan-out occurs during ordinary UI load.
17. No scheduled data-collection workflow modifies UI files.
18. No canonical publication occurs after a failed validation gate.

## 15. Change control

This contract is frozen.

Implementation may refactor code freely to satisfy it, but behavioral changes require an explicit contract amendment before implementation.

A failed implementation is corrected against this contract; it is not patched by inventing a new interaction model, chart grammar, navigation path or data semantics.
