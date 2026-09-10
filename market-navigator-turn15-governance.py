from pathlib import Path

PLAN = Path('MARKET-NAVIGATOR-MASTER-PLAN.md')
GRAVE = Path('MARKET-NAVIGATOR-GRAVEYARD.md')


def must_replace(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'missing governance anchor: {label}')
    return text.replace(old, new, 1)


plan = PLAN.read_text()
plan = plan.replace('Updated: 2026-09-09', 'Updated: 2026-09-10', 1)
plan = must_replace(
    plan,
    '- exactly the three derived indices plotted together as column series: **RSK · GRW · MAC**;',
    '- exactly the three derived indices plotted together as line series: **RSK · GRW · MAC**;',
    'V1 line rollback',
)
plan = must_replace(
    plan,
    '- selected derived index reference rendered as a column series;',
    '- selected derived index reference rendered as a line series;',
    'V2 line rollback',
)
plan = must_replace(
    plan,
    '- selected index columns must be visually distinct without overwhelming components;',
    '- selected index line must be visually distinct without overwhelming components;',
    'V2 line identity',
)
plan = must_replace(
    plan,
    '**the selected derived index curve is added to the governed component comparison chart.**',
    '**the selected derived index line is added to the governed component comparison chart.**',
    'V2 evolution wording',
)

old_periodic = '''Quarterly and monthly macro evidence such as GDP and CPI is not excluded. It belongs to a periodic-change analytical treatment that preserves real publication cadence and presents q/q and y/y context when the canonical persisted schema supports both calculations. Direction is summarized as ▲ green positive, ▶ amber neutral, or ▼ red negative within the relevant sentiment context. No q/q or y/y value may be fabricated from an already transformed series that lacks the required underlying level evidence.'''
new_periodic = '''GDP is a periodic-change analytical measure, not a raw level series in the user-facing chart catalog. The canonical Real GDP level (`GDPC1`) is input evidence only. User-facing GDP exposes exactly **GDP q/q** and **GDP y/y**, both derived deterministically from successive real quarterly GDP level observations and persisted as quarterly transformed evidence. The raw GDP level is not selectable. No daily interpolation, horizon-end restamping, or visual carry-forward is permitted. Selection availability for GDP q/q and GDP y/y is based on the existence and currentness of the canonical quarterly transform, not on whether a new quarterly release happens to fall inside a short 1D/5D/MTD chart window. Only genuine quarterly transform observations are plotted; the latest q/q and y/y readings remain visible as periodic context when a short horizon contains no new release.

CPI/Core CPI remain their governed inflation-change series rather than being treated as GDP-style raw levels. Direction for periodic change is summarized as ▲ green positive, ▶ amber neutral, or ▼ red negative within the relevant sentiment context. No q/q or y/y value may be fabricated from an already transformed series that lacks the required underlying level evidence.'''
plan = must_replace(plan, old_periodic, new_periodic, 'GDP q/q y/y contract')

turn15_section = r'''

---

## Turn 15 locked correction — 2026-09-10

Turn 15 is the immediate next release and is release-blocking. It implements the owner-approved rollback/correction after Turn 14 without unrelated product work.

### Chart geometry
- The Turn 14 column/bar experiment is rejected.
- V1 Market uses three line series: RSK, GRW and MAC.
- V2 uses the selected derived index as a line plus its governed component lines in the same chart footprint.
- V3/Analysis uses line rendering for current derived and raw series unless a future explicitly approved chart type says otherwise.
- White active-reference outlining remains; assigned identity color remains visible inside the white reference treatment.

### GDP contract
- Raw `realGdp` is backend evidence only and is not user-selectable.
- User-facing GDP series are exactly `GDP q/q` and `GDP y/y`.
- q/q = `(GDP_t / GDP_t-1 - 1) * 100` from canonical quarterly levels.
- y/y = `(GDP_t / GDP_t-4 - 1) * 100` from canonical quarterly levels.
- The transforms are persisted, deterministic, quarterly, auditable and derived only from real canonical level observations.
- Short-horizon selection does not mark GDP q/q/y/y unavailable merely because no new release occurs inside that horizon.
- No synthetic daily GDP observations or synthetic timestamps are permitted.

### Availability and WTI truthfulness
Availability is not one boolean truth. The implementation must keep these states distinct:
1. source/collector health;
2. evidence load/revision integrity;
3. direct-analysis availability;
4. derived-index mathematical eligibility.

A failure to fetch or parse evidence must surface as an evidence error and must never be silently converted into `unavailable for <horizon>`.

WTI is the mandatory regression case. Its historical zero crossing may make it ineligible for the Growth composite's ratio-rebasing formula, but that composite-construction exclusion must **never** suppress WTI's real source observations from V2, EXPLORE or V3 direct analysis. WTI remains directly selectable whenever canonical evidence exists for the selected analytical use.

### CONFIG contract
CONFIG contains exactly three top tabs:

**AI | Chart Config | About**

AI retains the existing provider/model/key behavior. Chart Config owns:
- three presets: **Normal · Bright · Colorblind**;
- ten persistent series slots;
- per-slot color;
- per-slot line thickness **1pt–12pt**;
- per-slot line style **line · dash · dash-dot · dot · dot-dash**;
- persistence;
- JSON export/import.

Series style is identity-bound, not array-position-bound. Removing another series must not recolor or restyle a surviving series. Immutable Library charts preserve the saved color, thickness and line style even if global settings later change.

### More-menu contract
A compact `…` menu is available on V1 Market, V2 index+components, V3/Analysis and EXPLORE. The analytical actions are:
- **AI POV**;
- **Print**;
- **Download Markdown**;
- **Download CSV** chart-series data;
- **Download JSON** chart-series/state data.

V3 may additionally retain Stats. EXPLORE actions operate on the current selected-series analytical state and are disabled when no series is selected.

### Race elimination
Turn 15 must eliminate stale asynchronous UI writes:
- one in-flight fetch promise per canonical series per boot;
- render-generation guards for V2 and V3 so an older horizon/series response cannot overwrite a newer state;
- existing EXPLORE/picker generation guards remain mandatory;
- boot-time catalog, health and derived evidence form one immutable browser session snapshot;
- failed evidence loads report the actual failure reason rather than an availability falsehood.

### Mandatory Turn 15 qualification
Release is blocked unless automated browser qualification proves:
- V1 RSK/GRW/MAC are lines, not columns;
- V2 selected index and governed components are lines;
- WTI is visible/selectable in Growth V2 on 5D despite composite ratio ineligibility;
- WTI is directly selectable in V3 and EXPLORE;
- raw Real GDP is not selectable;
- GDP q/q and GDP y/y are present, deterministic and selectable as periodic evidence;
- WTI + Brent share compatible native Y1;
- CPI + WTI uses native Y1 + Y2;
- all three CONFIG tabs work;
- all ten chart-style slots expose color, 1–12pt thickness and the five governed line styles and persist after reload;
- V1, V2, V3 and EXPLORE expose the governed `…` menu/download actions;
- rapid horizon changes cannot allow a stale V2/V3 render to replace the final selected horizon;
- public Pages boot has no page/console/resource errors.
'''
if '## Turn 15 locked correction — 2026-09-10' not in plan:
    plan += turn15_section
PLAN.write_text(plan)

grave = GRAVE.read_text()
grave = grave.replace('Updated: 2026-09-09', 'Updated: 2026-09-10', 1)
turn14_grave = r'''

## Turn 14 chart-type / availability correction — rejected decisions 2026-09-10

Turn 14 remains useful as a capability donor for Library chart persistence, active-reference highlighting, series identity colors, AI/provider continuity and other independently qualified behavior. The following Turn 14 decisions are rejected and must not be patched forward as product requirements:

- **Derived-index column/bar rendering is rejected.** The owner explicitly rolled it back. V1 and V2 return to the line-chart comparison model.
- **Composite eligibility must not control direct-series visibility.** WTI was suppressed in Growth V2 because the derived-index evidence listed WTI as ratio-ineligible after its historical zero crossing. That is a composite-construction fact, not permission to hide valid WTI source evidence from direct chart analysis.
- **`seriesAvailable()` may not swallow every exception and return `false`.** Fetch, parse, missing-file and revision failures are evidence errors and must be distinguishable from a legitimate no-new-release condition.
- **Raw GDP-level selection is rejected.** User-facing GDP is q/q and y/y derived deterministically from canonical quarterly Real GDP levels.
- **Color-only chart configuration is incomplete.** The accepted Chart Config contract also requires 1–12pt thickness and five governed line styles for ten persistent identity slots.
- **Partial More menus are incomplete.** V1, V2, V3 and EXPLORE require AI POV, Print, Markdown, CSV and JSON actions against the exact current analytical state.
- **Qualification that proves WTI only at 5YR is insufficient.** WTI 5D direct-analysis availability is a mandatory regression gate.

### Recovery
Turn 15 is a narrow correction from the clean current architecture. Preserve independently qualified Turn 14 capabilities, but replace the rejected decisions above directly in source. Do not reintroduce bars/columns through Library migration, derived-index defaults or later chart refactors.
'''
if '## Turn 14 chart-type / availability correction — rejected decisions 2026-09-10' not in grave:
    grave += turn14_grave
GRAVE.write_text(grave)

print('TURN 15 GOVERNANCE: UPDATED')
