#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-idle-refresh-v2.py <base.html> <output.html>')

src = Path(sys.argv[1]).read_text()
old = "load();setInterval(async()=>{try{let [p,r]=await Promise.all([api('/projects'),api('/rollup')]);state.projects=Array.isArray(p)?p:(p.projects||[]);state.rollup=r;renderCards();let psel=selectedProject();if(psel&&state.tab==='index')renderIndex(psel)}catch{}},3000);"
new = r'''function indexJobActive(p){return ['Queued','WIP'].includes(projectState(p))}
function fullyIndexedStable(p){let total=Number(p.size_bytes||0),done=Number(p.bytes_processed||0);return total>0&&done>=total&&!indexJobActive(p)}
function projectDisplaySignature(ps){return JSON.stringify(ps.map(p=>[p.project_token,p.project_name,p.processing_state,p.status,p.size_bytes,p.bytes_processed,p.files_discovered,p.source_count,p.processing_errors,p.evidence_revision]))}
function rollupDisplaySignature(r){return JSON.stringify([r?.active_jobs||0,r?.failed_jobs||0,r?.bytes_discovered||0,r?.files_discovered||0])}
load();setInterval(async()=>{try{let priorRollup=rollupDisplaySignature(state.rollup),r=await api('/rollup');state.rollup=r;let active=state.projects.some(indexJobActive),projectsChanged=false;if(active){let p=await api('/projects'),next=Array.isArray(p)?p:(p.projects||[]);projectsChanged=projectDisplaySignature(next)!==projectDisplaySignature(state.projects);state.projects=next}if(projectsChanged||priorRollup!==rollupDisplaySignature(r))renderCards();let psel=selectedProject();if(psel&&state.tab==='index'&&!fullyIndexedStable(psel))renderIndex(psel)}catch{}},3000);'''
if src.count(old) != 1:
    raise SystemExit(f'pre-base live refresh marker changed unexpectedly: {src.count(old)}')
src = src.replace(old, new, 1)
for marker in ['function fullyIndexedStable(p)', "if(active){let p=await api('/projects')", "state.tab==='index'&&!fullyIndexedStable(psel)"]:
    if marker not in src:
        raise SystemExit(f'idle refresh behavior missing: {marker}')
Path(sys.argv[2]).write_text(src)
print('completed-project idle refresh suppression applied')
