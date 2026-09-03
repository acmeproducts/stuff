#!/usr/bin/env python3
from __future__ import annotations
import bisect, datetime as dt, hashlib, json
from pathlib import Path
BACKEND=Path('data/market-backend');ROOT=Path('market-data');SERIES_DIR=ROOT/'series';INDEX_DIR=ROOT/'indexes';VERSION='1.3.0';DAY=86400000
SERIES_META={
'spy':{'name':'S&P 500 ETF','short':'SPY','kind':'market','unit':'USD'},'qqq':{'name':'Nasdaq-100 ETF','short':'QQQ','kind':'market','unit':'USD'},'vix':{'name':'CBOE Volatility Index','short':'VIX','kind':'market','unit':'index'},'tenYear':{'name':'U.S. 10-Year Treasury Yield','short':'10Y','kind':'market','unit':'percent'},'wti':{'name':'West Texas Intermediate crude oil','short':'WTI','kind':'market','unit':'USD'},'brent':{'name':'Brent crude oil','short':'Brent','kind':'market','unit':'USD'},'gold':{'name':'Gold ETF proxy','short':'Gold','kind':'market','unit':'USD'},'dxy':{'name':'U.S. Dollar Index','short':'DXY','kind':'market','unit':'index'},
'cpi':{'name':'Consumer Price Inflation YoY','short':'CPI YoY','kind':'macro','unit':'percent'},'coreCpi':{'name':'Core CPI YoY','short':'Core CPI','kind':'macro','unit':'percent'},'pce':{'name':'PCE Inflation YoY','short':'PCE','kind':'macro','unit':'percent'},'corePce':{'name':'Core PCE Inflation YoY','short':'Core PCE','kind':'macro','unit':'percent'},'fedFunds':{'name':'Federal Funds Rate','short':'Fed Funds','kind':'macro','unit':'percent'},'twoYear':{'name':'U.S. 2-Year Treasury Yield','short':'2Y','kind':'macro','unit':'percent'},'thirtyYear':{'name':'U.S. 30-Year Treasury Yield','short':'30Y','kind':'macro','unit':'percent'},'curve10y2y':{'name':'10Y minus 2Y Treasury Spread','short':'10Y-2Y','kind':'macro','unit':'percent'},'curve10y3m':{'name':'10Y minus 3M Treasury Spread','short':'10Y-3M','kind':'macro','unit':'percent'},'hySpread':{'name':'U.S. High Yield Option-Adjusted Spread','short':'HY Spread','kind':'macro','unit':'percent'},'nfci':{'name':'Chicago Fed National Financial Conditions Index','short':'NFCI','kind':'macro','unit':'index'},'payrolls':{'name':'Total Nonfarm Payrolls','short':'Payrolls','kind':'macro','unit':'thousands'},'copper':{'name':'Copper','short':'Copper','kind':'market','unit':'USD'},'smallCaps':{'name':'Small Caps','short':'Small Caps','kind':'market','unit':'USD'},'manufacturingProduction':{'name':'Industrial Production: Manufacturing (NAICS)','short':'IPMAN','kind':'macro','unit':'index'},'unemployment':{'name':'Unemployment Rate','short':'Unemp','kind':'macro','unit':'percent'},'hyg':{'name':'High Yield Corporate Bond ETF','short':'HYG','kind':'market','unit':'USD'},'move':{'name':'MOVE Treasury Volatility Index','short':'MOVE','kind':'market','unit':'index'} }

def read(p,d=None):
 try:return json.loads(p.read_text(encoding='utf-8'))
 except:return {} if d is None else d
def write(p,o):
 p.parent.mkdir(parents=True,exist_ok=True);x=json.dumps(o,ensure_ascii=False,indent=2,sort_keys=True)+'\n';old=p.read_text(encoding='utf-8') if p.exists() else None
 if old==x:return False
 p.write_text(x,encoding='utf-8');return True
def canon(points):
 out={}
 for p in points or []:
  try:t=int(p['t']);v=float(p['v']);out[t]={'t':t,'v':v}
  except:pass
 return [out[k] for k in sorted(out)]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def governed_model():
 definition=read(BACKEND/'derived-index-definition.json',{})
 indexes=definition.get('indices',{})
 if set(indexes)!={'risk','growth','macro'}:raise SystemExit('derived-index-definition.json missing canonical risk/growth/macro definitions')
 model={}
 for key in ('risk','growth','macro'):
  cfg=indexes[key];components=[]
  for c in cfg.get('components',[]):
   components.append({'id':c['id'],'direction':int(c['direction']),'role':c.get('role',''),'weight':1/len(cfg['components'])})
  model[key]={'name':cfg['name'],'higher_means':cfg.get('higher_means'),'construction_detail':cfg.get('construction_detail'),'components':components}
 return definition,model
def load_components(model):
 market=read(BACKEND/'market-cache.json',{}).get('data',{});macro=read(BACKEND/'macro-cache.json',{}).get('data',{});db={}
 ids={c['id'] for cfg in model.values() for c in cfg['components']}|set(SERIES_META)
 for sid in sorted(ids):
  meta=SERIES_META.get(sid,{'name':sid,'short':sid,'kind':'unknown','unit':'unknown'})
  if sid in market:src=market[sid];pts=canon(src.get('daily') or []);provider=src.get('provider') or 'Yahoo Finance';status=src.get('status') or ('healthy' if pts else 'unavailable');cadence='daily'
  elif sid in macro:src=macro[sid];pts=canon(src.get('points') or []);provider=src.get('provider') or 'FRED';status=src.get('status') or ('healthy' if pts else 'unavailable');cadence=src.get('cadence') or 'unknown'
  else:pts=[];provider=None;status='unavailable';cadence='unknown'
  obj={'schema':'market-navigator-series-v1','databaseVersion':VERSION,'id':sid,**meta,'provider':provider,'status':status,'cadence':cadence,'observations':pts,'count':len(pts),'first':pts[0]['t'] if pts else None,'last':pts[-1]['t'] if pts else None};write(SERIES_DIR/f'{sid}.json',obj);db[sid]=obj
 return db
def value_at(obs,t):
 if not obs:return None
 times=[p['t'] for p in obs];i=bisect.bisect_right(times,t)-1;return obs[i]['v'] if i>=0 else None
def oriented(obs,t,t0,direction):
 a=value_at(obs,t0);b=value_at(obs,t)
 if a is None or b is None or a<=0:return None
 return 100+direction*((b/a)-1)*100
def index_at(key,model,db,t,t0):
 parts=[]
 for cfg in model[key]['components']:
  z=oriented(db[cfg['id']]['observations'],t,t0,cfg['direction'])
  if z is not None:parts.append({'id':cfg['id'],'v':z,'role':cfg['role']})
 if not parts:return None
 return {'t':t,'v':round(sum(x['v'] for x in parts)/len(parts),4),'components':parts,'available':len(parts),'governed':len(model[key]['components'])}
def reference_history(key,model,db,days=90):
 anchors=db.get('spy',{}).get('observations',[]);out=[]
 for p in anchors:
  z=index_at(key,model,db,p['t'],p['t']-days*DAY)
  if z:out.append(z)
 return out
def align_parent(children):
 out=[]
 for p in children[0]:
  vals=[value_at(c,p['t']) for c in children]
  if all(v is not None for v in vals):out.append({'t':p['t'],'v':round(sum(vals)/len(vals),4),'children':vals})
 return out
def build_indexes(model,db):
 indexes={}
 for key in ('risk','growth','macro'):
  pts=reference_history(key,model,db);children=[x['id'] for x in model[key]['components']];obj={'schema':'market-navigator-index-v3','databaseVersion':VERSION,'id':key,'name':model[key]['name'],'baseline':100,'children':children,'directions':{x['id']:x['direction'] for x in model[key]['components']},'method':'direction-oriented Indexed 100; equal mean of available ratio-eligible governed components; UI computes selected-horizon T0 path from canonical model and persisted real observations','observations':pts,'count':len(pts),'first':pts[0]['t'] if pts else None,'last':pts[-1]['t'] if pts else None};write(INDEX_DIR/f'{key}.json',obj);indexes[key]=obj
 pts=align_parent([indexes[k]['observations'] for k in ('risk','growth','macro')]);obj={'schema':'market-navigator-index-v3','databaseVersion':VERSION,'id':'regime','name':'Market','baseline':100,'children':['risk','growth','macro'],'method':'arithmetic mean of Risk, Growth and Macro reference histories','observations':pts,'count':len(pts),'first':pts[0]['t'] if pts else None,'last':pts[-1]['t'] if pts else None};write(INDEX_DIR/'regime.json',obj);indexes['regime']=obj;return indexes
def validate(model,db):
 errors=[]
 for key,cfg in model.items():
  if len(cfg['components'])!=7:errors.append(f'{key}: expected 7 governed components')
  for c in cfg['components']:
   if c['id'] not in db:errors.append(f"{key}: missing persisted representation {c['id']}")
 return errors
def main():
 SERIES_DIR.mkdir(parents=True,exist_ok=True);INDEX_DIR.mkdir(parents=True,exist_ok=True);definition,model=governed_model();db=load_components(model);indexes=build_indexes(model,db);errors=validate(model,db)
 model_obj={'schema':'market-navigator-governed-model-v2','databaseVersion':VERSION,'baseline':100,'formula':definition['display_contract']['component_formula'],'indexFormula':definition['display_contract']['index_formula'],'displayContract':definition['display_contract'],'indexes':model};write(ROOT/'model.json',model_obj)
 files={}
 for p in sorted(ROOT.glob('series/*.json'))+sorted(ROOT.glob('indexes/*.json'))+[ROOT/'model.json']:
  h=sha(p);files[str(p.relative_to(ROOT))]={'revision':h[:16],'sha256':h,'bytes':p.stat().st_size}
 manifest={'schema':'market-navigator-database-v1','databaseVersion':VERSION,'generatedAt':dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'status':'ready' if not errors else 'invalid','series':{k:{'count':v['count'],'first':v['first'],'last':v['last'],'provider':v['provider'],'status':v['status'],'cadence':v['cadence']} for k,v in db.items()},'indexes':{k:{'count':v['count'],'first':v['first'],'last':v['last'],'children':v['children']} for k,v in indexes.items()},'modelFile':'model.json','definitionFile':'../data/market-backend/derived-index-definition.json','files':files,'validation':{'ok':not errors,'errors':errors},'contract':{'uiReadsPersistedDataOnly':True,'allowSyntheticHistory':False,'selectedHorizonBaseline':100,'v2Replacement':True,'componentInfoBeforeV3':True,'exploreSeparate':True}};manifest['revision']=hashlib.sha256(json.dumps(manifest,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:16];write(ROOT/'manifest.json',manifest)
 if errors:raise SystemExit('Database validation failed: '+'; '.join(errors))
 print(json.dumps({'ok':True,'revision':manifest['revision'],'governed':{k:[x['id'] for x in v['components']] for k,v in model.items()}},indent=2))
if __name__=='__main__':main()
