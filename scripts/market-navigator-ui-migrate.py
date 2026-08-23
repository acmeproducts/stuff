#!/usr/bin/env python3
from pathlib import Path

p=Path('market-view-ui-v2.html')
s=p.read_text(encoding='utf-8')
MARK='UI semantics v2.1'
if MARK in s:
    print('Market Navigator UI semantics already current')
    raise SystemExit(0)

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'UI migration anchor missing: {label}')
    s=s.replace(old,new,1)

rep(".signal.negative{color:#ffb4b9;background:#3b2229}.move",
    ".signal.negative{color:#ffb4b9;background:#3b2229}.stateRow{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.descriptor{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:850}.contribution{display:inline-flex;align-items:center;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:850}.contribution.favorable{color:#9aefbd;background:#12352a}.contribution.unfavorable{color:#ffb4b9;background:#3b2229}.contribution.neutral{color:#f6d582;background:#342e21}.move",
    'semantic badge css')

rep("function classification(score){return score>=58?['Optimistic','positive']:score<=42?['Pessimistic','negative']:['Neutral','neutral']}function ptxt",
    "function classification(score){return score>=58?['Optimistic','positive']:score<=42?['Pessimistic','negative']:['Neutral','neutral']}function direction(v){const c=moveClass(v);return c==='up'?['Improving','up']:c==='down'?['Deteriorating','down']:['Stable','flat']}function contribution(parentId,componentId){const d=cut(S.indexes[parentId]?.observations||[],S.range),last=d.at(-1),part=(last?.components||[]).find(x=>x.id===componentId),e=part?.effect;if(!Number.isFinite(e))return['Contribution unavailable','neutral'];return e>.1?['Favorable','favorable']:e<-.1?['Unfavorable','unfavorable']:['Neutral','neutral']}function ptxt",
    'semantic helpers')

rep("x.font='9px system-ui';[0,25,50,75,100].forEach(v=>{const y=p.t+(100-v)/100*(h-p.t-p.b);",
    "const yv=v=>p.t+(100-v)/100*(h-p.t-p.b);x.fillStyle='rgba(240,182,78,.09)';x.fillRect(p.l,yv(58),w-p.l-p.r,yv(42)-yv(58));x.font='9px system-ui';[0,25,42,50,58,75,100].forEach(v=>{const y=yv(v);",
    'neutral band')

rep("function sigHTML(score){const[txt,cls]=classification(score);return `<span class=\"signal ${cls}\">${txt}</span>`}function moveHTML(v,unit){return `<span class=\"move ${moveClass(v)}\">${arrow(v)} ${unit==='points'?ptxt(v):pctxt(v)}</span>`}",
    "function sigHTML(score){const[txt,cls]=classification(score);return `<span class=\"signal ${cls}\">${txt}</span>`}function directionHTML(v){const[t,c]=direction(v);return `<span class=\"move ${c}\">${arrow(v)} ${t}</span>`}function contributionHTML(parentId,id){const[t,c]=contribution(parentId,id);return `<span class=\"contribution ${c}\">${t}</span>`}function moveHTML(v,unit){return `<span class=\"move ${moveClass(v)}\">${unit==='points'?ptxt(v):pctxt(v)}</span>`}",
    'semantic render helpers')

s=s.replace("${end?sigHTML(end.v):''}${moveHTML(chg,'points')}","${end?sigHTML(end.v):''}${directionHTML(chg)}${moveHTML(chg,'points')}")

rep("function componentPanel(id){const d=cut(S.series[id].observations,S.range),chg=percent(d);return `<article class=\"componentPanel\" data-component=\"${id}\"><div class=\"componentHead\"><div><div class=\"kicker\">COMPONENT</div><b>${LABEL[id]||id}</b></div><div>${moveHTML(chg,'percent')}</div></div>",
    "function componentPanel(id){const d=cut(S.series[id].observations,S.range),chg=percent(d),parent=S.detail?.id||S.detail?.parent;return `<article class=\"componentPanel\" data-component=\"${id}\"><div class=\"componentHead\"><div><div class=\"kicker\">COMPONENT</div><b>${LABEL[id]||id}</b></div><div class=\"stateRow\">${parent&&S.indexes[parent]?contributionHTML(parent,id):''}${directionHTML(chg)}${moveHTML(chg,'percent')}</div></div>",
    'component contribution')

s=s.replace("<div class=\"headline\"><strong>${LABEL[id]||id}</strong>${moveHTML(chg,'percent')}</div>","<div class=\"headline\"><strong>${LABEL[id]||id}</strong>${S.detail?.parent?contributionHTML(S.detail.parent,id):''}${directionHTML(chg)}${moveHTML(chg,'percent')}</div>",1)

rep("if(isIndex){out.children=(obj.children||[]).map(id=>{const child=S.indexes[id]||S.series[id],x=cut(child.observations,range);return{id,label:LABEL[id]||id,start:x[0]?.v??null,current:x.at(-1)?.v??null,change:S.indexes[id]?points(x):percent(x),changeUnit:S.indexes[id]?'points':'percent'}})}out.news=",
    "if(isIndex){const parentLast=d.at(-1);out.thresholds={pessimisticBelow:42,neutral:[42,58],optimisticAtOrAbove:58};out.children=(obj.children||[]).map(id=>{const child=S.indexes[id]||S.series[id],x=cut(child.observations,range),part=(parentLast?.components||[]).find(p=>p.id===id);return{id,label:LABEL[id]||id,start:x[0]?.v??null,current:x.at(-1)?.v??null,change:S.indexes[id]?points(x):percent(x),changeUnit:S.indexes[id]?'points':'percent',effect:part?.effect??null,contribution:Number.isFinite(part?.effect)?(part.effect>.1?'Favorable':part.effect<-.1?'Unfavorable':'Neutral'):null}})}out.news=",
    'analysis evidence')

rep("const prompt='Analyze this persisted Market Navigator snapshot for an investor. Numeric data is primary evidence; news is contextual only. Do not produce a news digest. Explain observed direction, parent/child relationships, contradictions, macro context, geopolitical/event overlay, and what would change the view. Never invent missing data or causality. '",
    "const prompt='Analyze this persisted Market Navigator snapshot for an investor. FIRST perform an arithmetic integrity check. Parent index values are weighted/arithmetic averages of displayed child SCORES; never divide child scores by their weights. For bounded 0-100 indexes report change only in INDEX POINTS, never percentage return. Use thresholds exactly: below 42=Pessimistic, 42-58=Neutral, 58+=Optimistic. Keep STATE (Optimistic/Neutral/Pessimistic), DIRECTION (Improving/Stable/Deteriorating), and CONTRIBUTION (Favorable/Neutral/Unfavorable) separate. Numeric data is primary evidence; news is contextual only and must not be treated as causal unless numeric evidence demonstrates the relationship. Do not produce a news digest. Explain observed direction, parent/child relationships, contradictions, macro context, event overlay, and what would change the view. Never invent missing data or causality. '",
    'analysis prompt')

rep("<p>Index charts are 0–100 and changes are shown in <b>index points</b>.",
    "<p>Index charts are 0–100 with a visible <b>neutral band from 42–58</b>. State (Optimistic/Neutral/Pessimistic), direction (Improving/Stable/Deteriorating), and child contribution (Favorable/Neutral/Unfavorable) are separate concepts. Changes are shown in <b>index points</b>.",
    'about semantics')

s=s.replace("UI v2 · Regime → Index → Component",f"UI v2.1 · Regime → Index → Component · {MARK}",1)
p.write_text(s,encoding='utf-8')
print('Migrated Market Navigator UI semantics')
