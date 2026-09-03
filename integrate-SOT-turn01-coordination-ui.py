#!/usr/bin/env python3
from pathlib import Path
import re,sys
if len(sys.argv)!=3: raise SystemExit('usage: integrate-SOT-turn01-coordination-ui.py <base.html> <output.html>')
src=Path(sys.argv[1]).read_text()
pat=re.compile(r"setInterval\(async\(\)=>\{try\{let \[p,r\]=await Promise\.all\(\[api\('/projects'\),api\('/rollup'\)\]\);[\s\S]*?\}\},3000\);")
ms=list(pat.finditer(src))
if len(ms)!=1: raise SystemExit(f'coordination UI refresh marker changed: {len(ms)}')
new=r'''let sotInteractionUntil=0;
function sotOperatorBusy(){let a=document.activeElement;return Date.now()<sotInteractionUntil||!!document.querySelector('.modal.open,.modal[open],dialog[open]')||!!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))}
['pointerdown','keydown','focusin','input'].forEach(t=>document.addEventListener(t,()=>{sotInteractionUntil=Date.now()+2500},{capture:true,passive:true}));
function projectDisplaySignature(ps){return JSON.stringify(ps.map(p=>[p.project_token,p.project_name,p.processing_state,p.processing_phase,p.status,p.size_bytes,p.bytes_processed,p.files_discovered,p.files_processed,p.source_count,p.processing_errors,p.evidence_revision,p.lifecycle_state,p.active_operation_id]))}
function rollupDisplaySignature(r){return JSON.stringify([r?.active_jobs||0,r?.failed_jobs||0,r?.bytes_discovered||0,r?.bytes_processed||0,r?.files_discovered||0,r?.files_processed||0])}
setInterval(async()=>{try{let [p,r]=await Promise.all([api('/projects'),api('/rollup')]),next=Array.isArray(p)?p:(p.projects||[]),changed=projectDisplaySignature(next)!==projectDisplaySignature(state.projects),rollChanged=rollupDisplaySignature(r)!==rollupDisplaySignature(state.rollup);state.projects=next;state.rollup=r;if(!sotOperatorBusy()&&(changed||rollChanged)){let y=window.scrollY;renderCards();requestAnimationFrame(()=>window.scrollTo(0,y));let psel=selectedProject();if(psel&&state.tab==='index')renderIndex(psel)}}catch{}},3000);'''
src=src[:ms[0].start()]+new+src[ms[0].end():]
for marker in ['function sotOperatorBusy()','sotInteractionUntil','p.lifecycle_state','requestAnimationFrame(()=>window.scrollTo(0,y))']:
    if marker not in src: raise SystemExit('missing coordination UI contract '+marker)
Path(sys.argv[2]).write_text(src)
print('SOT non-destructive refresh integrated')
