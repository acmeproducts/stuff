from pathlib import Path
import json

plan=Path('MARKET-NAVIGATOR-MASTER-PLAN.md')
s=plan.read_text()
s=s.replace('Updated: 2026-09-12\nNext release scope: Turn 20','Updated: 2026-09-12\nNext release scope: Turn 21',1)
old='- tapping any enabled **legend chip** drills directly to a standalone COMPONENT analytical chart for exactly that series, including tapping the INDEX chip itself;'
new='- tapping any enabled **raw component legend chip** drills directly to a standalone COMPONENT analytical chart for exactly that source series;\n- tapping the current INDEX\'s own legend chip selects/references that INDEX in place and never creates a redundant COMPONENT level;'
if old not in s:
    raise SystemExit('Turn 21 INDEX legend governance anchor missing')
s=s.replace(old,new,1)
old='The breadcrumb never grows beyond `ENV / <INDEX> / <ROOT COMPONENT> + X Components`. ENV and INDEX drill upward. If a derived parent INDEX remains plotted as context and one or more raw comparison series are present, that derived INDEX is not a COMPONENT leaf and is not counted in `+ X`. The first raw series becomes the COMPONENT root and `+ X` counts only the additional raw series. Thus a Growth-context chart containing `GRW + PCE + Payrolls + UNE` is `ENV / GRW / PCE + 2 Components`, not `ENV / GRW / GRW + 3 Components`. A derived-only standalone COMPONENT remains valid as `ENV / GRW / GRW` until a raw series is added.'
new='The breadcrumb never grows beyond `ENV / <INDEX> / <ROOT COMPONENT> + X Components`. ENV and INDEX drill upward. A derived parent INDEX is context, never a COMPONENT leaf, and is never counted in `+ X`. COMPONENT entry from NOW therefore requires a raw/source component root. Thus a Growth-context chart containing `GRW + PCE + Payrolls + UNE` is `ENV / GRW / PCE + 2 Components`; `ENV / GRW / GRW`, `ENV / RSK / RSK`, and `ENV / MAC / MAC` are invalid and must be unreachable. Tapping or opening the parent INDEX while already in its INDEX view keeps the user at INDEX depth.'
if old not in s:
    raise SystemExit('Turn 21 COMPONENT breadcrumb governance anchor missing')
s=s.replace(old,new,1)
old='The inspection readout contains one vertical guide, one point marker, date, native value/unit and Indexed-100 value where valid.'
new='The inspection readout contains one vertical guide, one point marker, date, native value/unit and Indexed-100 value where valid. For every raw/source series, Indexed 100 is plain relative rebasing from that series\' own horizon baseline: `100 * (value / baseline)`. Component direction/weight is used only in derived-index construction and must never invert a raw/source line, crosshair index, Data row, export, AI evidence, or Library snapshot. Thus if SPY rises from its baseline, SPY Indexed 100 must also rise even though SPY contributes with direction `-1` to the derived RSK composite.'
if old not in s:
    raise SystemExit('Turn 21 Indexed 100 governance anchor missing')
s=s.replace(old,new,1)
append='''\n\n## 31. Turn 21 — source-relative indexing and non-duplicating hierarchy\nTurn 21 is a narrow owner-directed correction over qualified Turn 20. It does not redesign the chart engine, derived-index mathematics, Library, AI, evidence cadence, or configuration surfaces.\n\nRelease-blocking corrections:\n- **Raw/source Indexed 100 is always direction-neutral relative performance.** A source value above its own baseline must plot above 100 and a value below baseline must plot below 100. The `direction` field remains exclusively a derived-composite contribution rule.\n- **INDEX self-drill is prohibited.** The current parent INDEX chip is selectable/referenceable in INDEX view but cannot open COMPONENT for itself. Duplicate paths such as `ENV / GRW / GRW` are invalid.\n- **Hierarchy guard:** any attempted NOW transition that would create `ENV / <INDEX> / <same INDEX>` is intercepted and remains at `ENV / <INDEX>`. Raw component chips continue to drill to COMPONENT normally.\n- **Regression case:** in RSK 5YR, later SPY native values greater than earlier SPY native values must also have greater Indexed-100 values; the negative RSK contribution direction must not reverse the displayed SPY series.\n\nTurn 21 acceptance examples: RSK/5YR SPY 2026 native above SPY 2024 implies SPY Indexed 100 above its 2024 value; GRW parent-chip tap remains `ENV / GRW`; Payrolls child-chip tap becomes `ENV / GRW / Payrolls`.\n'''
if '## 31. Turn 21 — source-relative indexing and non-duplicating hierarchy' not in s:
    s=s.rstrip()+append+'\n'
plan.write_text(s)

g=Path('MARKET-NAVIGATOR-GRAVEYARD.md')
t=g.read_text()
append_g='''\n\n## Turn 21 source-index / hierarchy regressions — rejected\n- Applying a derived-index component `direction` (`+1` / `-1`) to the visible raw/source Indexed-100 series is rejected. Direction belongs to composite construction only. A rising SPY source series may reduce the derived RSK contribution, but SPY itself must still plot as rising relative performance.\n- Crosshair, Data, export, AI, or Library values that preserve a direction-inverted source index are rejected; every consumer must agree with the visible source-relative chart state.\n- INDEX self-drill is rejected. `ENV / GRW / GRW`, `ENV / RSK / RSK`, and `ENV / MAC / MAC` must never be produced. The parent INDEX chip remains at INDEX depth; only raw component chips drill to COMPONENT.\n'''
if '## Turn 21 source-index / hierarchy regressions — rejected' not in t:
    t=t.rstrip()+append_g+'\n'
g.write_text(t)

defn_path=Path('data/market-backend/derived-index-definition.json')
d=json.loads(defn_path.read_text())
dc=d.setdefault('display_contract',{})
dc['source_display_formula']='source_index_t = 100 * (value_t / value_t0); component direction is not applied to source-series display or inspection'
dc['source_display_direction_rule']='direction applies only to derived-composite construction; source/component charts remain direction-neutral relative performance'
dc['v2']='The selected derived index reference plus all governed source components are displayed from a common baseline of 100. Source component lines use direction-neutral relative rebasing; the derived index curve retains its governed direction-adjusted composite construction.'
d['version']='2.3.0'
d['status']='canonical-r8-display-separation'
defn_path.write_text(json.dumps(d,indent=2,sort_keys=False)+'\n')
print('TURN 21 GOVERNANCE: PASS')
