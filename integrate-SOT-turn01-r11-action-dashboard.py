#!/usr/bin/env python3
from pathlib import Path
import re,sys

if len(sys.argv)!=3:
    raise SystemExit('usage: integrate-SOT-turn01-r11-action-dashboard.py <r10.html> <r11.html>')
src=Path(sys.argv[1]).read_text()
for x in [
    "const BUILD='SOT-turn01-base-r10-operating-intelligence'",
    'function dashboard(){','function detailHTML(p){','function masterHTML(p){',
    'function intelSummary(i){','function duplicateHTML(i){','async function openSetup(token){'
]:
    if src.count(x)!=1:
        raise SystemExit(f'R10 contract failed {x}: {src.count(x)}')

def span(text,name):
    m=list(re.finditer(r'(?m)(?:async\s+)?function\s+'+re.escape(name)+r'\s*\(',text))
    if len(m)!=1: raise SystemExit(f'function {name} ambiguous {len(m)}')
    a=m[0].start(); b=text.find('{',m[0].end()); d=0; q=None; esc=False
    for i in range(b,len(text)):
        c=text[i]
        if q:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==q: q=None
        else:
            if c in "'\"`": q=c
            elif c=='{': d+=1
            elif c=='}':
                d-=1
                if d==0: return a,i+1
    raise SystemExit('unbalanced '+name)

def repl(text,name,val):
    a,b=span(text,name)
    return text[:a]+val.rstrip()+text[b:]

src=src.replace("const BUILD='SOT-turn01-base-r10-operating-intelligence'","const BUILD='SOT-turn01-base-r11-action-first-cleanup'",1)

css=r'''
/* R11 action-first cleanup surface */
.progressPanel{padding:16px}.journeyHead{display:flex;justify-content:space-between;gap:16px;align-items:flex-end}.journeyHead h2{margin:0}.journeyTotal{font-size:24px;font-weight:900}.journeyTrack{height:24px;border-radius:999px;overflow:hidden;background:#1b2b38;border:1px solid var(--line);margin:14px 0 10px;display:flex}.journeySafe{background:#3da56d;height:100%}.journeyRemain{background:#d89c2f;height:100%}.journeyStats{display:grid;grid-template-columns:1fr 1fr;gap:10px}.journeyStat{border:1px solid var(--line);border-radius:9px;padding:10px;background:#0b1b28}.journeyStat b{display:block;font-size:18px}.nextStep{margin-top:12px;border-left:4px solid var(--blue);border-radius:8px;background:#102132;padding:11px;display:flex;justify-content:space-between;gap:12px;align-items:center}.nextStepText b{display:block;font-size:16px}.actionRec{border:1px solid var(--line);border-radius:9px;background:#0b1b28;margin:8px 0;overflow:hidden}.actionRec summary{cursor:pointer;padding:11px 12px;font-weight:800;list-style-position:inside}.actionRecBody{padding:0 12px 12px}.actionRecBody .mut{margin-bottom:8px}.evidenceDrawer{border:1px solid var(--line);border-radius:9px;margin-top:10px;background:#0b1b28}.evidenceDrawer>summary{cursor:pointer;padding:11px 12px;font-weight:800}.boundedEvidence{max-height:330px;overflow:auto;padding:0 10px 10px;border-top:1px solid var(--line)}.projectPanel .inside{padding:0}.projectHead,.projectRow{display:grid;grid-template-columns:minmax(180px,1.5fr) minmax(140px,1fr) minmax(120px,.8fr) minmax(150px,1fr);gap:10px;align-items:center;padding:10px 12px}.projectHead{font-size:12px;color:var(--mut);border-bottom:1px solid var(--line);font-weight:800}.projectRow{border-bottom:1px solid var(--line)}.projectRow:last-child{border-bottom:0}.projectName{font-weight:900;cursor:pointer}.miniTrack{height:8px;border-radius:999px;overflow:hidden;background:#1b2b38;margin-top:5px}.miniTrack>span{display:block;height:100%;background:#3da56d}.statusText{font-weight:800}.projectModalProgress{margin:12px 0}.projectModalGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.projectModalGrid>div{border:1px solid var(--line);border-radius:9px;padding:10px;background:#0b1b28}.projectModalGrid b{display:block;font-size:18px}.modalActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.unscannedBox{border-left:4px solid var(--amber);background:#211b0d;border-radius:8px;padding:12px;margin-top:10px}.dashboardCompact{margin-bottom:10px}@media(max-width:800px){.journeyHead,.nextStep{align-items:stretch;flex-direction:column}.journeyStats{grid-template-columns:1fr 1fr}.projectHead{display:none}.projectRow{grid-template-columns:1fr auto;gap:7px}.projectRow .projectProgress{grid-column:1/2}.projectRow .projectStatus{grid-column:2/3;grid-row:1/2}.projectRow .projectAction{grid-column:2/3;grid-row:2/3}.projectModalGrid{grid-template-columns:1fr}.boundedEvidence{max-height:260px}}
'''
src=src.replace('</style>',css+'</style>',1)

helpers=r'''
function safeBytes(p){return Math.max(0,Math.min(Number(p.logical_bytes||0),Number(p.protected_bytes||0)))}
function progressPct(p){let t=Number(p.logical_bytes||0);return t?Math.max(0,Math.min(100,100*safeBytes(p)/t)):0}
function projectNext(p){
  if(live(p))return{label:'View activity',kind:'activity'};
  if(p.condition==='needs_sources')return{label:'Configure sources',kind:'setup'};
  if(p.condition==='needs_scan'||!Number(p.logical_bytes||0))return{label:'Start scan',kind:'scan'};
  if(safeBytes(p)<Number(p.logical_bytes||0))return{label:'Protect / verify',kind:'protect'};
  return{label:'Review certification',kind:'certify'};
}
function projectAction(p){let a=projectNext(p),t=p.project_token;if(a.kind==='scan')return`scan('${t}')`;if(a.kind==='setup')return`openSetup('${t}')`;if(a.kind==='activity')return`openProjectDetail('${t}')`;return`openProjectDetail('${t}')`}
function globalNext(){let ps=state.ssot?.projects||[],running=ps.find(live),unscanned=ps.find(p=>p.condition==='needs_scan'||!Number(p.logical_bytes||0)),unsafe=ps.find(p=>Number(p.logical_bytes||0)>safeBytes(p));if(running)return{title:'Storage work is running',detail:'Open the active project to see progress and controls.',label:'View activity',token:running.project_token};if(unscanned)return{title:'Scan the next unindexed project',detail:'Fingerprint evidence is required before cleanup or protection decisions are safe.',label:'Review projects',token:unscanned.project_token};if(unsafe)return{title:'Protect and verify remaining content',detail:'Required independent verified copies must exist before source cleanup or retirement.',label:'Review projects',token:unsafe.project_token};return{title:'Review certification',detail:'All currently indexed content is protected. Review project evidence before cold-storage or retirement decisions.',label:'Review projects',token:ps[0]?.project_token||''}}
function scrollProjects(token=''){if(token)state.selected=token;let el=document.getElementById('projectPanel');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
function recommendationHTML(i){let recs=i?.recommendations||[];if(!recs.length)return'<div class="empty">No immediate recommendation is available.</div>';return recs.map((r,idx)=>{let text=(r.title+' '+r.detail).toLowerCase(),dup=text.includes('duplicate'),label=dup?'Review duplicate evidence':'Review projects',action=dup?"toggleEvidence()":"scrollProjects()";return`<details class="actionRec"><summary>${esc(r.title)} — tap for next step</summary><div class="actionRecBody"><div class="mut">${esc(r.detail)}</div><button class="btn primary" onclick="${action}">${label}</button></div></details>`}).join('')}
function toggleEvidence(){let d=document.getElementById('globalEvidence');if(!d)return;d.open=!d.open;if(d.open)d.scrollIntoView({behavior:'smooth',block:'nearest'})}
async function openProjectDetail(token){state.selected=token;let p=(state.ssot?.projects||[]).find(x=>x.project_token===token);if(!p)return;if(!state.projectIntel[token])state.projectIntel[token]=await api('/turn01/intelligence?project_token='+encodeURIComponent(token)+'&limit=100').catch(()=>null);let i=state.projectIntel[token],total=Number(p.logical_bytes||0),safe=safeBytes(p),remain=Math.max(0,total-safe),next=projectNext(p);$('#deepTitle').textContent=p.project_name;let body='';if(!total||p.condition==='needs_scan'){body=`<div class="unscannedBox"><b>This project has not been indexed yet.</b><div class="mut">There is no cleanup, duplicate, or protection result to interpret until a scan commits fingerprint evidence.</div></div><div class="modalActions"><button class="btn primary" onclick="scan('${token}');$('#deep').close()">Start scan</button><button class="btn" onclick="openSetup('${token}')">Sources / Target / Backup</button></div>`}else{body=`<div class="projectModalProgress"><b>${bytes(safe)} safe / ${bytes(total)} in scope</b><div class="journeyTrack"><span class="journeySafe" style="width:${progressPct(p)}%"></span><span class="journeyRemain" style="width:${100-progressPct(p)}%"></span></div><div class="mut">${bytes(remain)} remaining before this project can be treated as fully protected.</div></div><div class="projectModalGrid"><div><span class="mut">Duplicate groups</span><b>${Number(i?.summary?.duplicate_groups||0).toLocaleString()}</b></div><div><span class="mut">Redundant source bytes</span><b>${bytes(i?.summary?.duplicate_waste_bytes||0)}</b></div><div><span class="mut">Shared across projects</span><b>${bytes(i?.summary?.shared_bytes||0)}</b></div></div><div class="nextStep"><div class="nextStepText"><span class="mut">Next step</span><b>${esc(next.label)}</b></div><button class="btn primary" onclick="openSetup('${token}')">Sources / Target / Backup</button></div><details class="evidenceDrawer"><summary>Project duplicate evidence</summary><div class="boundedEvidence">${duplicateHTML(i)}</div></details><div class="modalActions"><button class="btn" onclick="openSetup('${token}')">Storage setup</button><button class="btn" onclick="deep('${token}')">Deep dive</button></div>`}$('#deepBody').innerHTML=body;$('#deep').showModal()}
'''
insert=src.index('function dashboard(){')
src=src[:insert]+helpers+'\n'+src[insert:]

src=repl(src,'masterHTML',r'''function masterHTML(p){let [s]=condition(p),total=Number(p.logical_bytes||0),pct=progressPct(p),next=projectNext(p);return`<div class="projectRow ${state.selected===p.project_token?'selected':''}"><div><div class="projectName" onclick="openProjectDetail('${p.project_token}')">${esc(p.project_name)}</div><div class="mut">${Number(p.fingerprints||p.content_count||0).toLocaleString()} fingerprints</div></div><div class="projectProgress"><b>${total?`${bytes(safeBytes(p))} safe of ${bytes(total)}`:'Not indexed'}</b><div class="miniTrack"><span style="width:${pct}%"></span></div></div><div class="projectStatus statusText">${esc(s)}</div><div class="projectAction"><button class="btn ${next.kind==='scan'?'primary':''}" onclick="${projectAction(p)}">${esc(next.label)}</button></div></div>`}''')

src=repl(src,'detailHTML',r'''function detailHTML(p){return''}''')

src=repl(src,'dashboard',r'''function dashboard(){let s=state.ssot,g=s.global,total=Number(g.unique_bytes||0),safe=Math.max(0,Math.min(total,Number(g.protected_bytes||0))),remain=Math.max(0,total-safe),pct=total?100*safe/total:0,active=s.projects.filter(live),q=state.query.toLowerCase(),ps=s.projects.filter(p=>!q||p.project_name.toLowerCase().includes(q)),next=globalNext(),i=state.intel;return`<div class="ey">Single source of truth</div><h1>Storage dashboard</h1><section class="panel dashboardCompact"><div class="progressPanel"><div class="journeyHead"><div><div class="ey">Cleanup & protection progress</div><h2>${bytes(total)} in scope</h2></div><div class="journeyTotal">${pct.toFixed(1)}% safe</div></div><div class="journeyTrack" aria-label="${pct.toFixed(1)} percent safe"><span class="journeySafe" style="width:${pct}%"></span><span class="journeyRemain" style="width:${100-pct}%"></span></div><div class="journeyStats"><div class="journeyStat"><span class="mut">Safe / certified-ready</span><b>${bytes(safe)}</b></div><div class="journeyStat"><span class="mut">Remaining</span><b>${bytes(remain)}</b></div></div><div class="nextStep"><div class="nextStepText"><span class="mut">Next step</span><b>${esc(next.title)}</b><span class="mut">${esc(next.detail)}</span></div><button class="btn primary" onclick="scrollProjects('${next.token||''}')">${esc(next.label)}</button></div></div></section><section class="panel dashboardCompact"><div class="panelHead"><h2>Next actions</h2><span class="mut">Diagnosis only matters when it leads to a safe action</span></div><div class="inside">${recommendationHTML(i)}<details id="globalEvidence" class="evidenceDrawer"><summary>Duplicate evidence · ${Number(i?.summary?.duplicate_groups||0).toLocaleString()} groups · ${bytes(i?.summary?.duplicate_waste_bytes||0)} redundant</summary><div class="boundedEvidence">${duplicateHTML(i)}</div></details></div></section>${active.length?`<section class="panel dashboardCompact"><div class="panelHead"><h2>Active now</h2><b>${active.length} operation${active.length===1?'':'s'}</b></div><div class="inside">${active.map(activeHTML).join('')}</div></section>`:''}<section id="projectPanel" class="panel projectPanel"><div class="panelHead"><h2>Projects</h2><span class="mut">Progress, safety, and the one action that moves each project forward</span></div><div class="inside"><div class="projectHead"><b>Project</b><b>Progress</b><b>Status</b><b>Next action</b></div>${ps.map(masterHTML).join('')||'<div class="empty">No projects match this search.</div>'}</div></section>`}''')

for banned in ['<h3>Largest duplicate groups</h3>${duplicateHTML(state.intel)}','${sel?detailHTML(sel):\'\'}']:
    if banned in src:
        raise SystemExit('R11 failed to remove unbounded dashboard detail: '+banned)
for need in ['SOT-turn01-base-r11-action-first-cleanup','Cleanup & protection progress','Safe / certified-ready','Remaining','Next actions','tap for next step','boundedEvidence','Progress, safety, and the one action','openProjectDetail','This project has not been indexed yet.','Start scan','Protect / verify','Review certification']:
    if need not in src:
        raise SystemExit('R11 output contract missing '+need)

Path(sys.argv[2]).write_text(src)
print('R11 action-first cleanup dashboard integrated')
