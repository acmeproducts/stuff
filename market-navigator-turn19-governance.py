from pathlib import Path
import re

PLAN=Path('MARKET-NAVIGATOR-MASTER-PLAN.md')
GRAVE=Path('MARKET-NAVIGATOR-GRAVEYARD.md')
s=PLAN.read_text()


def replace_section(start,end,body):
    global s
    pat=re.compile(rf'(?ms)^{re.escape(start)}\n.*?(?=^{re.escape(end)}\n)')
    if not pat.search(s):
        raise SystemExit(f'missing section: {start}')
    s=pat.sub(body.rstrip()+'\n\n',s,count=1)

s=s.replace('Next release scope: Turn 18','Next release scope: Turn 19',1)
s=s.replace('**ENVIRONMENT → <INDEX> → <COMPONENT>**','**ENV → <INDEX> → <COMPONENT>**',1)

replace_section('## 6. Canonical chart chrome — mandatory across ENVIRONMENT, INDEX, and COMPONENT','## 7. Horizon contract',r'''## 6. Canonical chart chrome — mandatory across ENV, INDEX, and COMPONENT
All three chart views use the same three-section vertical structure. This is one shared component, not three approximations.

### Section A — single top row
Exactly one physical row at every supported width:

**clickable breadcrumb [left] | horizon controls [fixed center] | `…` context menu [reserved right slot]**

The seven horizon controls remain exactly **1D · 5D · MTD · YTD · 1YR · 3YR · 5YR** and own the fixed center region. The `…` menu owns a permanently reserved right-hand slot. The breadcrumb receives only the remaining left-side width and can never push the center or right region off-screen. The row never wraps.

The canonical visible root token is **ENV**. Breadcrumb forms are:
- `ENV`
- `ENV / RSK`
- `ENV / RSK / VIX`
- with comparisons: `ENV / RSK / VIX + 6 Components`.

At COMPONENT depth, **ENV** and the three-character INDEX token remain protected. Only the leaf/root-component segment may truncate with an ellipsis. Pointer hover exposes its full value; the leaf also carries accessible full-text disclosure for touch/assistive use. Breadcrumb ancestors are directly clickable drill-up navigation. No dedicated Back button is permitted.

### Section B — legend strip
A dedicated legend strip is always present directly below Section A, including single-series charts. Every legend key reproduces the configured line color, style and visible thickness.

Legend interaction is hierarchical:
- in **ENV**, tapping an index chip drills down to that INDEX;
- in **INDEX**, tapping either the INDEX chip or a component chip drills down to a standalone COMPONENT analytical chart for exactly that series;
- in **COMPONENT**, no deeper child exists, so tapping a chip only changes the active/reference series;
- at every chart depth, **long-pressing a legend chip opens series information without drilling**.

Added comparison series live in the legend rather than expanding the breadcrumb beyond the governed `+ X Components` suffix.

### Section C — centered footer
The footer contains one compact centered group:

**version/build | exact visible date range | representation selector**

The representation selector retains the governed modes **Native Y1 · Native Y1 + Y2 · Indexed 100**, enabling only mathematically valid choices. Legacy QA/chart-type text is prohibited.''')

replace_section('## 8. ENVIRONMENT view','## 13. GDP and periodic evidence',r'''## 8. ENV view
ENV is one chart, not a collection of cards.

Required:
- exactly three derived indices **RSK · GRW · MAC** plotted together;
- direction-adjusted Indexed 100 by default;
- no fabricated fourth score curve;
- one common horizon/X-domain;
- shared Section A/B/C chrome from §6;
- tapping an index **legend chip** drills to that INDEX;
- tapping a plotted index line selects it for immediate inspection and visual isolation but does not navigate;
- long-pressing an index legend chip opens compact information without navigating.

## 9. INDEX view
An INDEX view replaces ENV in the same chart footprint and shows the selected index plus every governed component as lines on one common horizon.

Navigation and inspection are deliberately separated:
- tapping any enabled **legend chip** drills directly to a standalone analytical chart for that exact series, including tapping the INDEX chip itself;
- tapping a plotted line selects/focuses that series for inspection without navigating;
- long-pressing a legend chip opens compact series information without navigating;
- the ENV breadcrumb ancestor drills up to ENV.

Missing/stale/sparse/failed/cadence-incompatible evidence remains truthful; source lines contain only real observations and slow-frequency lines end on their real observation dates.

## 10. Series information popover
Series information is optional reference material, not the navigation gate into COMPONENT.

It opens only from a deliberate **legend-chip long press** (or equivalent context gesture). Normal chip taps never auto-open it. The previous mandatory `More info → COMPONENT` bridge is retired.

The popover is compact, non-blocking, white with dark text, and anchored at the chart top-right. It uses minimal whitespace and this hierarchy:
- header: **Open | short/full title | ×**;
- body: **purpose/usage · unit · cadence · Health link**;
- footer: **←** at the left edge and **→** at the right edge.

The arrows traverse the visible legend order without wrapping. They change the active/reference series and popover contents together but do not drill. At the first/last series the unavailable arrow is disabled. `Open` deliberately opens that series as the standalone COMPONENT chart; if already at COMPONENT depth it can reset that selected series as the standalone root.

## 11. COMPONENT view
COMPONENT is the standalone analytical workspace for the selected root series and owns additive comparison series.

Entry is direct from an INDEX legend-chip tap (or EXPLORE). The selected horizon is preserved. A raw component opens in native units/Native Y1 when mathematically valid; a derived RSK/GRW/MAC index remains truthfully represented as Indexed 100 rather than being mislabeled as native evidence.

The breadcrumb never grows beyond `ENV / <INDEX> / <ROOT COMPONENT> + X Components`. ENV and INDEX drill upward. Added comparisons do not replace the root leaf.

At this bottom level:
- legend-chip tap changes the active/reference series only;
- plotted-line tap also changes active/reference series only;
- long press opens the information popover;
- Add Series remains available;
- no further implicit drill level is created.

Automatic representation rules remain:
1. one raw series → Native Y1;
2. compatible raw series → shared Native Y1;
3. exactly two incompatible measurement families → Native Y1 + Y2;
4. three or more incompatible families → Indexed 100;
5. a derived index by itself → Indexed 100.

Required mixed-series examples remain WTI + Brent, CPI + Core CPI, SPY + QQQ + WTI, DXY + VIX, CPI + WTI, and CPI + WTI + VIX.

## 12. Point inspection and active-series emphasis
Point inspection is single-active-series and real-observation based.

The interaction roles are fixed:
- **breadcrumb = drill up**;
- **legend chip = drill down when a child level exists**;
- **plotted series = select/inspect**;
- **long-press legend chip = information**.

Selecting a plotted series immediately makes it fully opaque/on top and fades the other visible series without changing configured line width/style. Hover/pointer movement immediately snaps to the nearest **full-resolution real observation** on the already-selected series; display downsampling never reduces inspection precision.

The inspection readout contains one vertical guide, one point marker, date, native value/unit and Indexed-100 value where valid. It remains pinned when the pointer leaves the chart. It updates when another point on the same active series is inspected, changes to the newly selected plotted series when selection changes, and can be explicitly dismissed with its `×`. Context/horizon changes clear stale inspection. No second click/focus mode and no all-series tooltip are permitted.''')

# Keep terminology truthful in active prohibitions and qualification text.
s=s.replace('- breadcrumb growth beyond `ENVIRONMENT / <INDEX> / <ROOT COMPONENT> + X Components`;','- breadcrumb growth beyond `ENV / <INDEX> / <ROOT COMPONENT> + X Components`;')
s=s.replace('- moving horizon controls away from fixed center alignment;','- allowing breadcrumb content to push the fixed-center horizons or reserved `…` slot off-screen;')

# Replace stale release-state section while preserving the appended TTS/backlog contract that follows it.
pat=re.compile(r'(?ms)^## 29\. Current release state\n.*?(?=^## Turn 17 card navigation and Library listen contract\n)')
if not pat.search(s):
    raise SystemExit('missing section 29')
s=pat.sub(r'''## 29. Current release state
Turn 18 is the current qualified release baseline. Turn 19 is a bounded interaction/navigation correction over that qualified baseline.

Turn 19 changes only:
- visible root token **ENV**;
- protected Section A geometry so breadcrumb text can never displace horizons or `…`;
- breadcrumb drill-up / legend drill-down / plotted-series inspect semantics;
- direct INDEX legend → standalone COMPONENT entry, including the INDEX itself;
- bottom-level legend taps as active/reference selection only;
- long-press-only compact information popover;
- pinned dismissible crosshair/readout behavior.

Turn 18 horizon-aware display density, Turn 17 Data/correlation and browser TTS, GDP q/q/y/y, WTI truthfulness, Chart Config, exports, AI/provider state, evidence coherence/race guards and immutable Library chart behavior remain protected regressions.

''',s,count=1)

# Correct old QA count wording if present.
s=s.replace('- same five commands;','- same six commands;')

PLAN.write_text(s)

g=GRAVE.read_text()
entry=r'''
## Turn 18 top-strip and hierarchy friction — rejected for Turn 19 (2026-09-11)
Turn 18 remains the qualified donor for horizon-aware display density and the previously accepted data/Library/configuration capabilities. The following owner-visible interaction behavior is rejected:

- visible root breadcrumb text `ENVIRONMENT`; the canonical visible token is now **ENV**;
- equal/flexible top-row geometry that allows breadcrumb length to displace or hide the fixed horizons or right-side `…` menu;
- whole-breadcrumb truncation that can consume protected ENV/INDEX ancestry; only the COMPONENT leaf may ellipsize;
- automatically opening the large series-information card during ordinary chip or plotted-series selection;
- requiring `More info` as the mandatory bridge from INDEX to COMPONENT;
- using an INDEX legend-chip tap merely as selection when a deeper standalone analytical chart exists;
- clearing the selected inspection readout merely because the pointer leaves the plot;
- introducing any extra click/toggle to make a selected series ready for inspection.

### Recovery rule
Turn 19 uses one explicit interaction grammar: **breadcrumb drills up; legend chips drill down where a child exists; plotted series select/inspect; long press opens information.** At COMPONENT depth legend taps change active/reference series because there is no deeper hierarchy. The compact long-press popover is reference UI, not a navigation gate. Turn 18 display-density and data truth behavior must not change.
'''
if '## Turn 18 top-strip and hierarchy friction — rejected for Turn 19' not in g:
    g=g.rstrip()+'\n\n'+entry.strip()+'\n'
GRAVE.write_text(g)
print('TURN 19 GOVERNANCE: PASS')
