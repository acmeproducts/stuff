from pathlib import Path

PLAN = Path('MARKET-NAVIGATOR-MASTER-PLAN.md')
GRAVE = Path('MARKET-NAVIGATOR-GRAVEYARD.md')
plan = PLAN.read_text()
grave = GRAVE.read_text()


def rep(old, new, label):
    global plan
    if old not in plan:
        raise SystemExit('Turn 17 plan anchor missing: ' + label)
    plan = plan.replace(old, new, 1)


rep(
    'Legend chips are clickable and correspond one-to-one with visible chart series.\n',
    'Legend chips are clickable and correspond one-to-one with visible chart series. Each legend key reproduces that series\' configured line style and visible thickness; a generic solid color swatch is not sufficient.\n',
    'legend stroke truth',
)

rep(
    'The card is contextual, not a new page. Changing component replaces the card. Changing index or returning to ENVIRONMENT clears it.\n',
    '''The card is contextual, not a new page. Changing component replaces the card. Changing index or returning to ENVIRONMENT clears it.\n\nThe card is a compact non-blocking chart overlay anchored at the top-right of the plot. It uses a white background with black text, consumes only the space required by its content, and permits chart hover/inspection to continue beneath the non-interactive body of the card. Card controls such as **More info** and close remain directly operable.\n\nLegend-chip selection and plotted-line selection are bidirectional. Selecting a component chip immediately updates this card, makes that series the active visual reference, and prepares hover inspection without any second click. Clicking a different plotted series updates the selected chip and this card to that series.\n''',
    'component card interaction',
)

old12 = '''### Active-series visual treatment\nThe white plotted-series outline scheme is retired.\n\nDuring active crosshair/point inspection:\n- the intended active series remains fully opaque and is rendered visually above the others;\n- all other visible series become translucent/backgrounded;\n- configured line thickness does not change;\n- no second click is required to clear emphasis;\n- emphasis follows the existing inspection interaction and clears automatically when inspection ends or context changes;\n- no explanatory popup, separate chart window, or additional interaction state is introduced.\n\nThe goal is immediate visual isolation with zero added friction.\n'''
new12 = '''### Active-series visual treatment\nThe white plotted-series outline scheme is retired.\n\nActive-series emphasis begins at selection, not at crosshair activation:\n- clicking a legend chip immediately makes that series fully opaque/on top and backgrounds the other visible series;\n- moving the mouse/pointer over the chart immediately produces the crosshair and nearest-real-observation readout for the already-selected series; no pointer click is required to begin inspection;\n- hover inspection does not silently change the selected series;\n- clicking a different plotted series changes the active series, selected chip, contextual card where applicable, and visual emphasis in one action;\n- configured line style and thickness do not change during emphasis;\n- touch uses the same selection/inspection semantics without introducing a separate focus mode;\n- horizon/context/series-set changes clear stale crosshair content while preserving only still-valid explicit selection state.\n\nThe goal is immediate visual isolation and examination with zero redundant interaction.\n'''
rep(old12, new12, 'active-series selection flow')

old17 = '''## 17. Canonical context menu\nThere is one context-menu component and exactly one command order everywhere it appears:\n\n1. **AI POV**\n2. **Print**\n3. **Download Markdown**\n4. **Download CSV**\n5. **Download JSON**\n\nIt appears in Section A on ENVIRONMENT, INDEX, COMPONENT, and applicable EXPLORE analytical state.\n\nNo view-specific extra command is permitted inside this menu. Features such as statistics must live elsewhere if retained.\n\nEach action binds to the exact visible series set, horizon, representation, evidence revision, and chart state.\n'''
new17 = '''## 17. Canonical context menu\nThere is one context-menu component and exactly one command order everywhere it appears:\n\n1. **AI POV**\n2. **Data**\n3. **Print**\n4. **Download Markdown**\n5. **Download CSV**\n6. **Download JSON**\n\nIt appears in Section A on ENVIRONMENT, INDEX, COMPONENT, and applicable EXPLORE analytical state.\n\n**Data** is the exact-state data inspector for the selected chart series. For every selected raw series it exposes the complete canonical observation history available to the application, not only observations that happen to fall inside the current horizon. Each observation includes native value and an Indexed 100 value computed against the active chart-window baseline when that baseline is mathematically valid. Derived index series expose all derived observations available in the active chart context. The surface also reports Pearson correlation versus the currently active series. Correlation uses same-date real observations only; it does not interpolate, resample, forward-fill, or fabricate pairings. Insufficient paired observations or zero-variance inputs display `N/A`.\n\nNo other view-specific command is permitted inside this menu. Separate statistics controls must live elsewhere if retained.\n\nThe series set, active reference, chart-window baseline, representation, evidence revision, and chart state come from the exact active analytical state; expanding the Data rows to complete canonical history must not mutate that state.\n'''
rep(old17, new17, 'canonical Data menu')

old22 = '''## 22. Statistics / latest values / correlation\nStatistics bind to the exact active analytical state.\n\nIf retained, latest values/correlation use one compact chart overlay with explicit close. Closing it is presentation-only and must not mutate series, horizon, axes, representation, or analysis state.\n\nStatistics are not a special item in the canonical `…` menu.\n'''
new22 = '''## 22. Data / statistics / correlation\nThe canonical **Data** command binds to the exact active analytical state and is presentation-only. Closing it must not mutate series, horizon, axes, representation, active selection, or analysis state.\n\nFor raw series, the Data surface contains the complete canonical series history available to the application with native and Indexed 100 values. Indexed 100 is calculated against the active chart-window baseline and preserves the plotted series direction where the current chart applies directional inversion. For derived indices, Data contains the full derived observation set available in the active chart context. Correlation is Pearson correlation versus the active series over same-date real observations from those Data rows. No interpolation, forward-fill, resampling, or synthetic alignment is permitted.\n\nAdditional statistical tools, if retained, are separate from the canonical `…` menu.\n'''
rep(old22, new22, 'Data and correlation contract')

if 'Next release scope: Turn 16' in plan:
    plan = plan.replace('Next release scope: Turn 16', 'Next release scope: Turn 17', 1)

PLAN.write_text(plan)

section = r'''

## Turn 16 interaction/readout regressions — rejected for Turn 17

Turn 16 remains the qualified donor for canonical chart chrome, GDP periodic treatment, WTI direct availability, evidence loading/race guards, representation switching, Chart Config, immutable Library snapshots, and the unified export surface. The following owner-visible Turn 16 behavior is rejected for Turn 17:

- **Generic solid legend swatches are rejected.** A legend key must render the actual configured stroke style and thickness for its series.
- **The bottom-centered dark component card is rejected.** The contextual card is compact, white with black text, top-right, and non-blocking for chart hover except for its explicit controls.
- **Crosshair-gated emphasis is rejected.** Explicit chip selection itself activates series isolation; the user does not click the chart again merely to see the series already selected.
- **Click-only desktop crosshair inspection is rejected.** Pointer hover inspects the selected series immediately.
- **Hover-driven silent series switching is rejected.** Hover examines the active series; clicking another plotted series is the deliberate bidirectional selection action that updates chip/card/emphasis.
- **A context menu without full-series Data is rejected.** Data is canonical and exposes complete canonical raw-series history, native/index values, and same-date correlation versus the active series; it is not limited to the current horizon when a healthy periodic series has no new release inside that horizon.

### Recovery rule
Turn 17 is a bounded interaction/readout correction over the qualified Turn 16 analytical/data architecture. Do not rewrite collectors, evidence storage, GDP/WTI rules, Library architecture, AI/provider behavior, or canonical chart chrome to deliver these changes.
'''
if '## Turn 16 interaction/readout regressions — rejected for Turn 17' not in grave:
    grave = grave.rstrip() + section + '\n'
GRAVE.write_text(grave)

for item in [
    'Each legend key reproduces that series\' configured line style and visible thickness',
    'compact non-blocking chart overlay anchored at the top-right of the plot',
    'Active-series emphasis begins at selection, not at crosshair activation',
    '2. **Data**',
    'complete canonical observation history available to the application',
    '## 22. Data / statistics / correlation',
]:
    if item not in plan:
        raise SystemExit('Turn 17 governed requirement missing: ' + item)

print('TURN 17 GOVERNANCE: PASS')
