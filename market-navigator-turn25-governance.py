#!/usr/bin/env python3
from pathlib import Path

# Turn 25 cumulative qualification trigger: governance remains additive and idempotent.
PLAN=Path('MARKET-NAVIGATOR-MASTER-PLAN.md')
GRAVE=Path('MARKET-NAVIGATOR-GRAVEYARD.md')

p=PLAN.read_text()
g=GRAVE.read_text()

p=p.replace('Next release scope: **Turn 18 rollback qualification → clean reconstruction**','Next release scope: **Turn 25 cumulative consolidation**',1)

section='''

---

## 24. Turn 25 cumulative consolidation — current execution authority
Turn 25 is one consolidation release, not a staircase of partial recovery releases.

### 24.1 Baseline and donor rule
The executable application baseline is the exact qualified Turn 18 artifact:
- commit `97b8c028778f36380de821591e3d6c8125fb14f9`;
- `market-navigator-turn18-pre-ship.html`;
- blob `4a52c7e764513024176aea80cc13c56e05370c11`.

Turns 19–24 remain rejected as application donors. Their approved behavior and qualification evidence are cumulative requirements, not disposable requirements. Rejected code may be discarded; owner-approved behavior may not.

### 24.2 Cumulative acceptance ledger
Turn 25 must deliver all of the following in one candidate before owner test:
1. one NOW analytical workspace; no Explore route/view and no Component modal;
2. neutral ENV with RSK · GRW · MAC and no default emphasis;
3. anchored ENV / RSK|GRW|MAC / COMPONENTS lifecycle, anchor immutability, collapse/re-expand, removable non-anchor chips and Add discovery;
4. source-relative Indexed 100 for raw/source series, exact seven horizons, real-observation display density, common X-domain and no evidence fabrication;
5. WTI direct-series truth and cadence-aware GDP q/q/y/y truth;
6. active-series chart emphasis, native + Indexed 100 inspection, Data/correlation and canonical six-command menu;
7. exact frozen NOW state into AI, Library frozen chart/transcript/continuation, durable persistence and Markdown links;
8. AI preflight/failure paths with no retired-DOM dependency and no invalid-provider Analysis artifact;
9. registered-key/Replace-key UX that never repopulates a saved key and never destroys a working credential on failed replacement;
10. geometry-only rail/ResizeObserver/orientation repaint with no horizon/composition/active/representation mutation and no evidence request;
11. CONFIG tabs AI · Chart Config · Sources · About and existing ten-slot style persistence/import/export;
12. canonical repository-backed Sources control plane, explicit class/identity/measure/provenance/horizon semantics, DOW → DJIA, and repository-backed registered sources including NVDA, V and GAAMHX;
13. healthy registered sources automatically discoverable through NOW → Add; unsupported 1D for daily/NAV sources disabled rather than fabricated;
14. Library Listen/Chat, exactly five centered transport controls, no duplicate title, actual non-empty SpeechSynthesisUtterance handoff, response/row navigation and truthful Android-family pause/resume behavior;
15. console/unhandled/required-resource failures remain release blockers.

A capability is complete only when its semantic gate passes. Adjacent UI state is not evidence of the capability.

### 24.3 Construction rule
Construct Turn 25 from exact Turn 18 source plus fresh implementation written from this Master Plan. Do not copy HTML/JS/CSS implementation from Turns 19–24. Repository-side data/catalog/Health/Source Registry produced by accepted backend work remain canonical current-main inputs and are not application donors.

### 24.4 One-release qualification sequence
**exact Turn 18 blob proof → construct complete Turn 25 candidate → static/JS gate → cumulative desktop + phone product matrix → semantic TTS + Android state gate → AI normal/failure/preflight gate → geometry invariance gate → Sources/control-plane gate → credential gate → backend registry/evidence gate → integrate current main → rerun the entire matrix on the exact merge artifact → Pages verification → owner test**.

No intermediate partial application release is published for owner testing. Any failed cumulative gate keeps Turn 25 unshipped and is corrected on the same consolidation branch.
'''
if '## 24. Turn 25 cumulative consolidation' not in p:
    p=p.rstrip()+section+'\n'

print_section='''

---

## 26. Library Print — binding Turn 25 report contract
Library Print generates a dedicated, self-contained **Market Navigator Analysis Report** from the exact selected frozen Library analysis. It does not print the interactive Library viewport.

The report must:
- place the exact frozen Library chart at the top;
- include the saved analysis title and relevant saved context already belonging to that analysis, including horizon, series, evidence/revision/source information where present;
- include the complete saved analysis/transcript, including long and multiple responses;
- render analysis/transcript as normal document content, never as a scrollable, fixed-height, max-height or viewport-constrained region;
- render Markdown appropriately for print, including headings, paragraphs, lists, tables, blockquotes, images and hyperlinks;
- paginate naturally across as many pages as required;
- use sensible print-break behavior for headings, tables, rows and images;
- exclude all interactive application chrome, including navigation, Library list/search, menus, editing controls, Chat/Listen controls, TTS/player controls, attachments, compose controls, Send controls, sticky UI and tooltips;
- leave paper size, orientation, destination/PDF, page range and page count to browser/device native print controls;
- leave the saved Library analysis and ordinary on-screen Library behavior unchanged before and after printing.

Implementation uses a dedicated print-report surface generated from the selected frozen Library analysis. The application surface is hidden under print media and the report surface is visible. Print-only state is temporary and is cleaned up after printing.

### 26.1 Library Print semantic qualification
Turn 25 qualification must durably prove all of the following on the exact candidate and exact merged-main artifact:
- a selected Library analysis with long/multiple responses prints completely;
- native printing is invoked exactly once;
- the report contains the saved analysis title and saved context;
- the exact frozen chart is present without recomputation or substitution;
- every saved analysis/transcript response is present;
- interactive/navigation/composer/Chat/Listen/TTS controls are absent from the report;
- under print media the ordinary application surface is hidden and the report is visible;
- report/transcript content has no viewport max-height, fixed-height or scroll clipping;
- headings, tables, rows and images have document-oriented print-break rules supporting natural multi-page pagination;
- temporary print-only state is cleaned up after printing;
- returning from print leaves the persisted selected Library analysis byte-for-byte/semantically unchanged.

Merely invoking `window.print()` is not Print implementation or qualification. The complete existing Turn 25 qualification suite remains mandatory in addition to these Print gates.
'''
if '## 26. Library Print — binding Turn 25 report contract' not in p:
    p=p.rstrip()+print_section+'\n'

negative='''

## Turn 25 permanent cumulative-release rule
Rollback changes the executable baseline; it does not roll back approved product requirements.

Permanently rejected:
- recovering one broken capability by publishing a baseline that silently drops other approved capabilities;
- reintroducing approved improvements over a sequence of owner-facing releases where each step can regress previously accepted behavior;
- using a rejected application release as a code donor merely because it contains a desired feature;
- declaring a retained capability green without carrying forward its strongest semantic regression gate;
- publishing an intermediate reconstruction candidate that is knowingly missing items from the cumulative acceptance ledger.

The next owner-facing successor after a rollback must be one cumulative candidate: proven baseline behavior plus every still-approved later requirement, qualified together. If one cumulative gate fails, correct the same candidate; do not create a new partial rung in the release ladder.
'''
if '## Turn 25 permanent cumulative-release rule' not in g:
    g=g.rstrip()+negative+'\n'

print_negative='''

## Permanent Library Print prohibitions
Market Navigator must never:
- print the interactive Library viewport as the Analysis Report;
- leave analysis/transcript content clipped, scrollable, fixed-height, max-height or viewport-height constrained in printed output;
- include application navigation, menus, Library list/search, editing controls, Chat/Listen controls, TTS/player controls, attachments, composer/Send controls, sticky UI or tooltips in the printed report;
- recompute, refetch, substitute or otherwise change the frozen saved chart/evidence merely for printing;
- impose application-owned page count, page range, paper size, orientation or destination instead of native browser/device print controls;
- treat merely invoking `window.print()` as sufficient Print implementation or qualification;
- alter the normal Library screen layout merely to make printing work.
'''
if '## Permanent Library Print prohibitions' not in g:
    g=g.rstrip()+print_negative+'\n'

g=g.replace('Updated: 2026-09-12','Updated: 2026-09-13',1)
p=p.replace('Updated: 2026-09-12','Updated: 2026-09-13',1)
g=g.replace('Updated: 2026-09-13','Updated: 2026-09-14',1)
p=p.replace('Updated: 2026-09-13','Updated: 2026-09-14',1)
PLAN.write_text(p)
GRAVE.write_text(g)
print('TURN 25 GOVERNANCE: PASS')
