#!/usr/bin/env python3
from pathlib import Path
SRC=Path('market-navigator-turn28-ship.html'); OUT=Path('market-navigator-turn33-pre-ship.html'); s=SRC.read_text()
def one(a,b,label):
 global s
 if s.count(a)!=1: raise SystemExit(f'{label}: expected 1 got {s.count(a)}')
 s=s.replace(a,b,1)
def rr(a,b,new,label):
 global s
 i=s.find(a); j=s.find(b,i)
 if i<0 or j<0: raise SystemExit(f'{label}: anchors missing')
 s=s[:i]+new+s[j:]
one('<div class="card chartCard">','<div class="card chartCard" id="chartSurface33">','identify accepted NOW surface')
one('.standaloneAnalysis26{position:relative}', '.standaloneAnalysis26{position:relative}.turn33Analysis #chartSurface33{position:fixed!important;inset:8px!important;width:auto!important;height:auto!important;z-index:70!important;border-radius:9px!important;box-shadow:0 18px 60px #000c}.turn33Analysis .rail,.turn33Analysis .top{visibility:hidden}.turn33Close{position:fixed;right:16px;top:14px;z-index:90;width:34px;height:34px;border:1px solid var(--line);background:#102338;color:var(--text);border-radius:8px;font-size:18px;font-weight:900}', 'in-place full workspace CSS')
shared=r'''/* TURN33_IN_PLACE_ANALYZE: accepted NOW chart never moves; Analyze is presentation/state mode. */
function snapshotNow33(){return JSON.parse(JSON.stringify({level:S.level,index:S.index,h:S.h,componentsExpanded:S.componentsExpanded,nowVisible:S.nowVisible||[],nowActive:S.nowActive,nowFocus:S.nowFocus,nowRepresentation:S.nowRepresentation,indexDisplay:S.indexDisplay,nowState:S.nowState||null}))}
function restoreNow33(x){S.level=x.level;S.index=x.index;S.h=x.h;S.componentsExpanded=x.componentsExpanded;S.nowVisible=[...(x.nowVisible||[])];S.nowActive=x.nowActive;S.nowFocus=x.nowFocus;S.nowRepresentation=x.nowRepresentation;S.indexDisplay=x.indexDisplay;S.nowState=x.nowState}
function parentIndex33(id){return IDX.includes(id)?id:(IDX.find(k=>(S.def.indices[k]?.components||[]).some(c=>c.id===id))||S.index||'growth')}
async function openStandaloneAnalysis26(id){
 if(S.turn33Analysis)return;let surface=$('chartSurface33');S.turn33Analysis={frozen:snapshotNow33(),surface,parent:surface.parentNode};S.analysisRoot=id;S.h=S.turn33Analysis.frozen.h;S.level=2;S.index=parentIndex33(id);S.componentsExpanded=true;S.nowVisible=IDX.includes(id)?[]:[id];S.nowActive=id;S.nowFocus=id;document.body.classList.add('turn33Analysis');let x=document.createElement('button');x.id='turn33Close';x.className='turn33Close';x.type='button';x.textContent='×';x.setAttribute('aria-label','Close analysis');x.onclick=closeStandaloneAnalysis26;document.body.appendChild(x);await renderV2();if(surface.parentNode!==S.turn33Analysis.parent)throw new Error('TURN33_SURFACE_REPARENTED')
}
async function closeStandaloneAnalysis26(){
 let a=S.turn33Analysis;if(!a)return;let surface=$('chartSurface33');if(surface!==a.surface||surface.parentNode!==a.parent)throw new Error('TURN33_SURFACE_IDENTITY_CHANGED');document.body.classList.remove('turn33Analysis');$('turn33Close')?.remove();restoreNow33(a.frozen);S.turn33Analysis=null;if(S.level===1)renderV1();else await renderV2()
}
'''
insert=s.find('async function openStandaloneAnalysis26(id){')
if insert<0: raise SystemExit('Analyze anchor missing')
s=s[:insert]+shared+s[insert:]
s=s.replace('async function openStandaloneAnalysis26(id){','async function retiredOpenStandaloneAnalysis26(id){',1)
# Rename only the legacy close that follows the retired open; our new close is earlier and remains authoritative.
pos=s.find('async function retiredOpenStandaloneAnalysis26(id){'); cp=s.find('function closeStandaloneAnalysis26',pos)
if cp>=0:s=s[:cp]+s[cp:].replace('function closeStandaloneAnalysis26','function retiredCloseStandaloneAnalysis26',1)
one('</body>','<div id="turn33Marker" class="hidden" data-source-blob="544661884a412c57aac08fada4f961012a4bc496" data-contract="in-place-now-surface"></div></body>','marker')
OUT.write_text(s); print('PASS built',OUT,OUT.stat().st_size)
