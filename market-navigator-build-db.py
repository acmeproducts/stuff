#!/usr/bin/env python3
from __future__ import annotations
import bisect, datetime as dt, hashlib, json
from pathlib import Path
BACKEND=Path('data/market-backend');ROOT=Path('market-data');SERIES_DIR=ROOT/'series';INDEX_DIR=ROOT/'indexes';VERSION='1.2.0';DAY=86400000
SERIES_META={
'spy':{'name':'S&P 500 ETF','short':'SPY','kind':'market','unit':'USD'},'qqq':{'name':'Nasdaq-100 ETF','short':'QQQ','kind':'market','unit':'USD'},'vix':{'name':'CBOE Volatility Index','short':'VIX','kind':'market','unit':'index'},'tenYear':{'name':'U.S. 10-Year Treasury Yield','short':'10Y','kind':'market','unit':'percent'},'wti':{'name':'West Texas Intermediate crude oil','short':'WTI','kind':'market','unit':'USD'},'brent':{'name':'Brent crude oil','short':'Brent','kind':'market','unit':'USD'},'gold':{'name':'Gold ETF proxy','short':'Gold','kind':'market','unit':'USD'},'dxy':{'name':'U.S. Dollar Index','short':'DXY','kind':'market','unit':'index'},
'cpi':{'name':'Consumer Price Inflation YoY','short':'CPI YoY','kind':'macro','unit':'percent'},'coreCpi':{'name':'Core CPI YoY','short':'Core CPI','kind':'macro','unit':'percent'},'pce':{'name':'PCE Inflation YoY','short':'PCE','kind':'macro','unit':'percent'},'corePce':{'name':'Core PCE Inflation YoY','short':'Core PCE','kind':'macro','unit':'percent'},'fedFunds':{'name':'Federal Funds Rate','short':'Fed Funds','kind':'macro','unit':'percent'},'twoYear':{'name':'U.S. 2-Year Treasury Yield','short':'2Y','kind':'macro','unit':'percent'},'thirtyYear':{'name':'U.S. 30-Year Treasury Yield','short':'30Y','kind':'macro','unit':'percent'},'curve10y2y':{'name':'10Y minus 2Y Treasury Spread','short':'10Y-2Y','kind':'macro','unit':'percent'},'realTenYear':{'name':'10-Year Real Treasury Yield','short':'10Y Real','kind':'macro','unit':'percent'},'breakeven10y':{'name':'10-Year Breakeven Inflation','short':'10Y BE','kind':'macro','unit':'percent'},'hySpread':{'name':'U.S. High Yield Option-Adjusted Spread','short':'HY Spread','kind':'macro','unit':'percent'},'nfci':{'name':'Chicago Fed National Financial Conditions Index','short':'NFCI','kind':'macro','unit':'index'},'initialClaims':{'name':'Initial Unemployment Claims','short':'Claims','kind':'macro','unit':'count'},'payrolls':{'name':'Total Nonfarm Payrolls','short':'Payrolls','kind':'macro','unit':'thousands'},'industrialProduction':{'name':'Industrial Production','short':'Industrial','kind':'macro','unit':'index'},'retailSales':{'name':'Retail Sales','short':'Retail','kind':'macro','unit':'millions'},'realGdp':{'name':'Real Gross Domestic Product','short':'Real GDP','kind':'macro','unit':'billions'} }
# All scoring is comparative to the selected T0. At T0 every child contributes zero and every index starts at 50.
# scale is the favorable/adverse movement required to saturate that component at +/-1 contribution.
MODEL={
'risk':{'name':'Risk','components':[
 {'id':'vix','weight':.35,'mode':'pct','direction':-1,'scale':30,'role':'market stress'},
 {'id':'hySpread','weight':.35,'mode':'delta','direction':-1,'scale':1.5,'role':'credit stress'},
 {'id':'nfci','weight':.20,'mode':'delta','direction':-1,'scale':.75,'role':'financial stress'},
 {'id':'initialClaims','weight':.10,'mode':'pct','direction':-1,'scale':20,'role':'labor stress'}]},
'growth':{'name':'Growth','components':[
 {'id':'qqq','weight':.35,'mode':'pct','direction':1,'scale':15,'role':'growth-market leadership'},
 {'id':'payrolls','weight':.20,'mode':'pct','direction':1,'scale':1.5,'role':'employment growth'},
 {'id':'industrialProduction','weight':.20,'mode':'pct','direction':1,'scale':4,'role':'production growth'},
 {'id':'retailSales','weight':.15,'mode':'pct','direction':1,'scale':6,'role':'consumption growth'},
 {'id':'realGdp','weight':.10,'mode':'pct','direction':1,'scale':4,'role':'real economic growth'}]},
'macro':{'name':'Macro','components':[
 {'id':'cpi','weight':.15,'mode':'delta','direction':-1,'scale':1.5,'role':'headline inflation'},
 {'id':'corePce','weight':.15,'mode':'delta','direction':-1,'scale':1.0,'role':'underlying inflation'},
 {'id':'fedFunds','weight':.10,'mode':'delta','direction':-1,'scale':1.5,'role':'policy restraint'},
 {'id':'tenYear','weight':.15,'mode':'delta','direction':-1,'scale':1.25,'role':'cost of capital'},
 {'id':'curve10y2y','weight':.15,'mode':'delta','direction':1,'scale':1.25,'role':'curve normalization'},
 {'id':'realTenYear','weight':.15,'mode':'delta','direction':-1,'scale':1.0,'role':'real discount rate'},
 {'id':'breakeven10y','weight':.05,'mode':'delta','direction':-1,'scale':.75,'role':'inflation expectations'},
 {'id':'wti','weight':.10,'mode':'pct','direction':-1,'scale':20,'role':'energy inflation pressure'}]}}

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
def load_components():
 market=read(BACKEND/'market-cache.json',{}).get('data',{});macro=read(BACKEND/'macro-cache.json',{}).get('data',{});db={}
 for sid,meta in SERIES_META.items():
  if sid in market:src=market[sid];pts=canon(src.get('daily') or []);provider=src.get('provider') or 'Yahoo Finance';status=src.get('status') or ('healthy' if pts else 'unavailable');cadence='daily'
  elif sid in macro:src=macro[sid];pts=canon(src.get('points') or []);provider=src.get('provider') or 'FRED';status=src.get('status') or ('healthy' if pts else 'unavailable');cadence=src.get('cadence') or 'unknown'
  else:pts=[];provider=None;status='unavailable';cadence='unknown'
  obj={'schema':'market-navigator-series-v1','databaseVersion':VERSION,'id':sid,**meta,'provider':provider,'status':status,'cadence':cadence,'observations':pts,'count':len(pts),'first':pts[0]['t'] if pts else None,'last':pts[-1]['t'] if pts else None};write(SERIES_DIR/f'{sid}.json',obj);db[sid]=obj
 return db
def value_at(obs,t):
 if not obs:return None
 times=[p['t'] for p in obs];i=bisect.bisect_right(times,t)-1;return obs[i]['v'] if i>=0 else None
def clamp(x):return max(-1,min(1,x))
def component_effect(cfg,db,t,t0):
 obs=db[cfg['id']]['observations'];a=value_at(obs,t0);b=value_at(obs,t)
 if a is None or b is None:return None
 raw=(b/a-1)*100 if cfg['mode']=='pct' and a else b-a
 effect=clamp(cfg['direction']*raw/cfg['scale'])
 return {'id':cfg['id'],'weight':cfg['weight'],'rawChange':raw,'effect':effect,'valueT0':a,'value':b,'role':cfg['role']}
def index_at(key,db,t,t0):
 parts=[]
 for cfg in MODEL[key]['components']:
  p=component_effect(cfg,db,t,t0)
  if p is not None:parts.append(p)
 coverage=sum(x['weight'] for x in parts)
 if coverage<.60:return None
 weighted=sum(x['effect']*x['weight'] for x in parts)/coverage
 return {'t':t,'v':round(max(0,min(100,50+40*weighted)),2),'coverage':round(coverage,3),'components':parts}
def reference_history(key,db,days=90):
 # Persist a 90-day reference series for diagnostics/backward compatibility. UI recomputes from selected T0.
 anchors=db['spy']['observations'];out=[]
 for p in anchors:
  t=p['t'];z=index_at(key,db,t,t-days*DAY)
  if z:out.append(z)
 return out
def align_parent(children):
 out=[]
 for p in children[0]:
  vals=[value_at(c,p['t']) for c in children]
  if all(v is not None for v in vals):out.append({'t':p['t'],'v':round(sum(vals)/len(vals),2),'children':vals})
 return out
def build_indexes(db):
 indexes={}
 for key in ('risk','growth','macro'):
  pts=reference_history(key,db);obj={'schema':'market-navigator-index-v2','databaseVersion':VERSION,'id':key,'name':MODEL[key]['name'],'scale':{'min':0,'neutralLow':42,'neutral':50,'neutralHigh':58,'max':100},'children':[x['id'] for x in MODEL[key]['components']],'weights':{x['id']:x['weight'] for x in MODEL[key]['components']},'method':'90-day reference only; production UI computes selected-horizon T0-relative path from model.json and persisted component series','observations':pts,'count':len(pts),'first':pts[0]['t'] if pts else None,'last':pts[-1]['t'] if pts else None};write(INDEX_DIR/f'{key}.json',obj);indexes[key]=obj
 pts=align_parent([indexes[k]['observations'] for k in ('risk','growth','macro')]);obj={'schema':'market-navigator-index-v2','databaseVersion':VERSION,'id':'regime','name':'Regime Sentiment Index','scale':{'min':0,'neutralLow':42,'neutral':50,'neutralHigh':58,'max':100},'children':['risk','growth','macro'],'weights':{'risk':1/3,'growth':1/3,'macro':1/3},'method':'arithmetic mean of Risk, Growth and Macro; production UI recomputes all children from selected T0','observations':pts,'count':len(pts),'first':pts[0]['t'] if pts else None,'last':pts[-1]['t'] if pts else None};write(INDEX_DIR/'regime.json',obj);indexes['regime']=obj;return indexes
def validate(db,indexes):
 errors=[]
 for key,cfg in MODEL.items():
  if abs(sum(x['weight'] for x in cfg['components'])-1)>.0001:errors.append(f'{key}: weights do not sum to 1')
  available=sum(x['weight'] for x in cfg['components'] if db.get(x['id'],{}).get('count',0)>0)
  if available<.60:errors.append(f'{key}: insufficient populated component weight {available:.2f}')
 for p in indexes['regime']['observations'][-500:]:
  vals=[value_at(indexes[k]['observations'],p['t']) for k in ('risk','growth','macro')]
  if None not in vals and abs(round(sum(vals)/3,2)-p['v'])>.001:errors.append(f"regime reference reconciliation failed at {p['t']}");break
 return errors
def main():
 SERIES_DIR.mkdir(parents=True,exist_ok=True);INDEX_DIR.mkdir(parents=True,exist_ok=True);db=load_components();indexes=build_indexes(db);errors=validate(db,indexes)
 model={'schema':'market-navigator-relative-model-v1','databaseVersion':VERSION,'baseline':{'T0IndexValue':50,'neutralLow':42,'neutralHigh':58},'formula':'For selected horizon T0, each component effect = clamp(direction * movement(T0→t) / scale, -1, 1); index = 50 + 40 * weighted mean(effect); weights renormalize only if populated coverage >=60%; Regime = mean(Risk,Growth,Macro).','indexes':MODEL};write(ROOT/'model.json',model)
 files={}
 for p in sorted(ROOT.glob('series/*.json'))+sorted(ROOT.glob('indexes/*.json'))+[ROOT/'model.json']:
  h=sha(p);files[str(p.relative_to(ROOT))]={'revision':h[:16],'sha256':h,'bytes':p.stat().st_size}
 manifest={'schema':'market-navigator-database-v1','databaseVersion':VERSION,'generatedAt':dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'status':'ready' if not errors else 'invalid','marketSeriesReady':all(db[x]['count']>0 for x in ('spy','qqq','vix','tenYear','wti','brent','gold','dxy')),'fredMacroReady':all(db[x]['count']>0 for x in ('cpi','fedFunds','twoYear','thirtyYear')),'expandedFredCoverage':{k:db[k]['count'] for k in SERIES_META if db[k]['kind']=='macro'},'series':{k:{'count':v['count'],'first':v['first'],'last':v['last'],'provider':v['provider'],'status':v['status'],'cadence':v['cadence']} for k,v in db.items()},'indexes':{k:{'count':v['count'],'first':v['first'],'last':v['last'],'children':v['children']} for k,v in indexes.items()},'modelFile':'model.json','files':files,'validation':{'ok':not errors,'errors':errors},'contract':{'parentChild':'Regime = mean(Risk, Growth, Macro); each child is weighted from declared component movements relative to selected T0','selectedHorizonBaseline':50,'uiReadsPersistedDataOnly':True,'allowSyntheticHistory':False,'indexChangeUnit':'points from T0','componentChangeUnit':'raw relative movement','stateDirectionContributionSeparated':True}};manifest['revision']=hashlib.sha256(json.dumps(manifest,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:16];write(ROOT/'manifest.json',manifest)
 if errors:raise SystemExit('Database validation failed: '+'; '.join(errors))
 print(json.dumps({'ok':True,'revision':manifest['revision'],'expandedFred':manifest['expandedFredCoverage'],'regimeReferenceObservations':indexes['regime']['count']},indent=2))
if __name__=='__main__':main()
