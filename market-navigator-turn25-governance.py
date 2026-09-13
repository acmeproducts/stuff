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

g=g.replace('Updated: 2026-09-12','Updated: 2026-09-13',1)
p=p.replace('Updated: 2026-09-12','Updated: 2026-09-13',1)
PLAN.write_text(p)
GRAVE.write_text(g)
print('TURN 25 GOVERNANCE: PASS')
