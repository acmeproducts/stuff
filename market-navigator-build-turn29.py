#!/usr/bin/env python3
"""Build Turn 29 Analysis + Health evidence candidate directly from qualified Turn 28 Ship."""
from pathlib import Path
import hashlib,json

SRC=Path('market-navigator-turn28-ship.html')
OUT=Path('market-navigator-turn29-pre-ship.html')
DERIVED=Path('market-evidence/derived-indices-persistent-v1.json')
EXPECTED_BLOB='544661884a412c57aac08fada4f961012a4bc496'

def git_blob(data): return hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()
def once(s,a,b,label):
    n=s.count(a)
    if n!=1: raise SystemExit(f'Turn 29 blocked: {label}: expected 1 match, found {n}')
    return s.replace(a,b,1)
def state_for(index_id, block):
    h=block.get('horizons',{}).get('5YR') or {}
    curve=[float(p['v']) for p in h.get('curve',[]) if isinstance(p,dict) and p.get('v') is not None]
    if len(curve)<30:return {'label':'Unavailable','percentile':None,'value':h.get('value')}
    now=float(curve[-1]);rank=sum(v<=now for v in curve)/len(curve)
    band='low' if rank<1/3 else 'high' if rank>2/3 else 'mid'
    if band=='mid':label='Neutral'
    elif index_id=='growth':label='Positive' if band=='high' else 'Negative'
    else:label='Negative' if band=='high' else 'Positive'
    return {'label':label,'percentile':round(rank*100,1),'value':now}
def main():
    raw=SRC.read_bytes()
    if git_blob(raw)!=EXPECTED_BLOB:raise SystemExit('Turn 29 blocked: Turn 28 Ship baseline blob mismatch')
    d=json.loads(DERIVED.read_text());states={k:state_for(k,v) for k,v in d['indices'].items() if k in ('growth','risk','macro')};s=raw.decode()
    state_json=json.dumps(states,separators=(',',':'))
    js=f'''\n/* TURN29_CURRENT_STATE_EVIDENCE_ONLY — intentionally no drill-down/dashboard rendering */\nconst MN_CURRENT_STATE_29={state_json};\nfunction currentStateEvidence29(){{return {{schema:'mn-current-state-v1',purpose:'DESCRIPTIVE_ANALYSIS_HEALTH',forecast:false,uiPlacement:'ANALYSIS_HEALTH_ONLY',dashboard:'DEFERRED_PENDING_PART_B',window:'trailing 5YR empirical distribution',bands:'lower third / middle third / upper third',semantics:{{growth:'higher=more positive',risk:'higher=more negative',macro:'higher inflation/monetary-policy pressure=more negative'}},indices:MN_CURRENT_STATE_29}}}}\n'''
    s=once(s,'mnxWireWhenReady();\nboot();',js+'\nmnxWireWhenReady();\nboot();','current-state evidence runtime')
    s=once(s,"function aiEvidenceState(state){let chart=state.chart||{};return{","function aiEvidenceState(state){let chart=state.chart||{};return{currentState:currentStateEvidence29(),",'AI current-state evidence')
    s=once(s," const terms=[\n", " const terms=[\n  ['Current state','Descriptive Positive / Neutral / Negative reading from the governed persistent index relative to its own trailing five-year empirical distribution.','Analysis/Health evidence only. This is not a 10–30 day forecast and is not approved for the drill-down strip. Middle third is Neutral; for GRW higher is Positive, while for RSK and MAC higher risk/pressure is Negative.'],\n",'Health glossary current state')
    marker='<div id="turn29BuildMarker" class="hidden" data-build="2026.09.30.turn29-analysis-health-only"></div>'
    s=once(s,'</body>',marker+'</body>','Turn 29 marker')
    s=s.replace('Market Navigator · Turn 28 Corrective Candidate','Market Navigator · Turn 29 Analysis + Health Candidate')
    OUT.write_text(s)
    Path('market-evidence/current-state-v1.json').write_text(json.dumps({'schema':'mn-current-state-v1','generatedFrom':d.get('generatedAt'),'definitionVersion':d.get('definitionVersion'),'purpose':'DESCRIPTIVE_ANALYSIS_HEALTH','forecast':False,'uiPlacement':'ANALYSIS_HEALTH_ONLY','dashboard':'DEFERRED_PENDING_PART_B','method':'trailing 5YR empirical terciles','indices':states},indent=2)+'\n')
    print(json.dumps(states,indent=2));print(f'built {OUT} bytes={OUT.stat().st_size} baseline={EXPECTED_BLOB}')
if __name__=='__main__':main()
