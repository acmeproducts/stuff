from pathlib import Path

PLAN = Path('MARKET-NAVIGATOR-MASTER-PLAN.md')
GRAVE = Path('MARKET-NAVIGATOR-GRAVEYARD.md')

plan = PLAN.read_text()
required = [
    'Next release scope: Turn 16',
    '**ENVIRONMENT → <INDEX> → <COMPONENT>**',
    '## 6. Canonical chart chrome — mandatory across ENVIRONMENT, INDEX, and COMPONENT',
    '**clickable breadcrumb [left] | horizon controls [fixed center] | `…` context menu [right]**',
    '`ENVIRONMENT / RSK / VIX + 6 Components`',
    '## 12. Point inspection and active-series emphasis',
    'The white plotted-series outline scheme is retired.',
    'One persistent close `×` is visible at the top-right of the CONFIG surface in every tab.',
    '## 17. Canonical context menu',
]
for item in required:
    if item not in plan:
        raise SystemExit('Turn 16 plan contract missing: ' + item)

grave = GRAVE.read_text()
old_authority = 'The authoritative baseline is the current product contract in `MARKET-NAVIGATOR-MASTER-PLAN.md` plus `MARKET-NAVIGATOR-NOW-EXPLORE-CONTRACT.md`.'
if old_authority in grave:
    grave = grave.replace(old_authority, 'The authoritative baseline is the current product contract in `MARKET-NAVIGATOR-MASTER-PLAN.md`. Historical contracts that use numbered view labels are evidence only and cannot govern the active product surface.', 1)

section = r'''

## Turn 15 owner-visible UX regressions — rejected for Turn 16

Turn 15 remains the qualified data/availability/style capability donor for GDP q/q/y/y, WTI direct availability, line rendering, evidence loading, immutable Library charts, AI/provider state and stale-render guards. The following owner-visible Turn 15 UX behavior is rejected and must not survive Turn 16:

- **Numbered view terminology is not product terminology.** The user-facing analytical hierarchy is only `ENVIRONMENT → <INDEX> → <COMPONENT>`. Numbered labels may not appear in rendered UI, breadcrumbs, reports or owner-facing QA language.
- **Split/inconsistent chart chrome is rejected.** Breadcrumbs, horizons, More menu, legend and footer may not move between different rows/locations depending on analytical depth. ENVIRONMENT, INDEX and COMPONENT use the same Section A / B / C contract.
- **Wrapping the primary chart chrome is rejected.** Section A remains one physical row. Breadcrumb text yields space and truncates; centered horizon controls do not move to a second row.
- **The Turn 15 white plotted-line outline is rejected.** Crosshair inspection instead keeps the intended series opaque/on top while other plotted series recede translucently. This is automatic inspection feedback, not a persistent focus mode and not a second-click interaction.
- **CONFIG without a persistent close control is rejected.** AI, Chart Config and About share one top-right close control that returns to the exact prior application view.
- **Inoperable/clipped Chart Config controls are rejected.** Desktop and mobile must expose all ten series rows, 1–12pt thickness and the five line styles without clipping or unreachable selects.
- **Save-only visual feedback is rejected.** Chart-style edits preview immediately; Save persists. Closing CONFIG before Save restores the persisted style state.
- **Different context menus by analytical view are rejected.** Every governed chart context menu uses exactly: AI POV, Print, Download Markdown, Download CSV, Download JSON.
- **Header build labels and low-value footer text are rejected.** Version/build moves to the centered chart footer beside exact date range and the valid representation selector.

### Recovery rule
Turn 16 is a bounded UX correction over the independently qualified Turn 15 data/analysis capabilities. Do not broaden scope or rewrite the backend. Qualification must prove owner-visible desktop and phone geometry, not just DOM presence.
'''

if '## Turn 15 owner-visible UX regressions — rejected for Turn 16' not in grave:
    grave = grave.rstrip() + section + '\n'

GRAVE.write_text(grave)
print('TURN 16 GOVERNANCE: PASS')
