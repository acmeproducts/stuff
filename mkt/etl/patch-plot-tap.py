#!/usr/bin/env python3
"""The one approved change to the pristine pages: a tap on a series line selects it only; it never opens the series card.
(Restores the turn 24 plot-tap behavior.) Idempotent; fails loudly if the anchor is not found exactly once."""
import sys
OLD="if(which==='now'&&S.level!==1){if(IDX.includes(sel.id))$('info').classList.add('hidden');else{S.priorV2={...(S.priorV2||{}),component:sel.id};componentCard(sel.id)}}"
NEW="if(which==='now'&&S.level!==1){$('info').classList.add('hidden')}/*PLOT_TAP_SELECT_ONLY*/"
for p in sys.argv[1:]:
    s=open(p).read()
    if 'PLOT_TAP_SELECT_ONLY' in s: print(p,'already patched'); continue
    if s.count(OLD)!=1: raise SystemExit(f'{p}: anchor found {s.count(OLD)} times')
    open(p,'w').write(s.replace(OLD,NEW)); print(p,'patched')
