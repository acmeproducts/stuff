#!/usr/bin/env python3
from __future__ import annotations
import bisect, datetime as dt, hashlib, json
from pathlib import Path
BACKEND=Path('data/market-backend'); ROOT=Path('market-data'); SERIES_DIR=ROOT/'series'; INDEX_DIR=ROOT/'indexes'; VERSION='1.0.0'
SERIES_META={'spy':{'name':'S&P 500 ETF','short':'SPY','kind':'market','unit':'USD'},'qqq':{'name':'Nasdaq-100 ETF','short':'QQQ','kind':'market','unit':'USD'},'vix':{'name':'CBOE Volatility Index','short':'VIX','kind':'market','unit':'index'},'tenYear':{'name':'U.S. 10-Year Treasury Yield','short':'10Y','kind':'market','unit':'percent'},'wti':{'name':'West Texas Intermediate crude oil','short':'WTI','kind':'market','unit':'USD'},'brent':{'name':'Brent crude oil','short':'Brent','kind':'market','unit':'USD'},'gold':{'name':'Gold ETF proxy','short':'Gold','kind':'market','unit':'USD'},'dxy':{'name':'U.S. Dollar Index','short':'DXY','kind':'market','unit':'index'},'cpi':{'name':'Consumer Price Inflation YoY','short':'CPI YoY','kind':'macro','unit':'percent'},'fedFunds':{'name':'Federal Funds Rate','short':'Fed Funds','kind':'macro','unit':'percent'},'twoYear':{'name':'U.S. 2-Year Treasury Yield','short':'2Y','kind':'macro','unit':'percent'},'thirtyYear':{'name':'U.S. 30-Year Treasury Yield','short':'30Y','kind':'macro','unit':'percent'}}
CATEGORY={'risk':{'name':'Risk','components':['spy','wti']},'growth':{'name':'Growth','components':['spy','tenYear']},'macro':{'name':'Macro','components':['tenYear','wti']}}
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
  try:
   t=int(p['t']);v=float(p['v'])
   if v==v:out[t]={'t':t,'v':v}
  except:pass
 return [out[k] for k in sorted(out)]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load_components():
 market=read(BACKEND/'market-cache.json',{}).get('data',{});macro=read(BACKEND/'macro-cache.json',{}).get('data',{});db={}
 for sid,meta in SERIES_META.items():
  if sid in market:src=market[sid];pts=canon(src.get('daily') or []);provider=src.get('provider') or 'Yahoo Finance';status=src.get('status') or ('healthy' if pts else 'unavailable')
  elif sid in macro:src=macro[sid];pts=canon(src.get('points') or []);provider=src.get('provider') or 'FRED';status=src.get('status') or ('healthy' if pts else 'unavailable')
  else:pts=[];provider=None;status='unavailable'
  obj={'schema':'market-navigator-series-v1','databaseVersion':VERSION,'id':sid,**meta,'provider':provider,'status':status,'observations':pts,'count':len(pts),'first':pts[0]['t'] if pts else None,'last':pts[-1]['t'] if pts else None};write(SERIES_DIR/f'{sid}.json',obj);db[sid]=obj
 return db
def value_at(obs,t):
 if not obs:return None
 times=[p['t'] for p in obs];i=bisect.bisect_right(times,t)-1;return obs[i]['v'] if i>=0 else None
def pct_change(obs,t,days=30):
 a=value_at(obs,t);b=value_at(obs,t-days*86400000)
 return None if a is None or b in (None,0) else (a/b-1)*100
def clamp(x):return max(-1,min(1,x))
def effect(sid,p):
 if p is None:return None
 return clamp(p/8) if sid=='spy' else -clamp(p/6) if sid=='tenYear' else -clamp(p/12) if sid=='wti' else None
def category_history(components,db):
 out=[]
 for p in db[components[0]]['observations']:
  t=p['t'];parts=[]
  for sid in components:
   pc=pct_change(db[sid]['observations'],t);ef=effect(sid,pc)
   if ef is None:parts=[];break
   parts.append({'id':sid,'change30dPct':pc,'effect':ef,'value':value_at(db[sid]['observations'],t)})
  if len(parts)==len(components):out.append({'t':t,'v':max(0,min(100,round(50+35*sum(x['effect'] for x in parts)/len(parts)))),'components':parts})
 return out
def align_parent(children):
 out=[]
 for p in children[0]:
  vals=[value_at(c,p['t']) for c in children]
  if all(v is not None for v in vals):out.append({'t':p['t'],'v':round(sum(vals)/len(vals),2),'children':vals})
 return out
def build_indexes(db):
 indexes={}
 for key,cfg in CATEGORY.items():
  pts=category_history(cfg['components'],db);obj={'schema':'market-navigator-index-v1','databaseVersion':VERSION,'id':key,'name':cfg['name'],'scale':{'min':0,'neutral':50,'max':100},'children':cfg['components'],'method':'50 + 35 * mean(component effect); component effects use trailing 30-day percent changes','observations':pts,'count':len(pts),'first':pts[0]['t'] if pts else None,'last':pts[-1]['t'] if pts else None};write(INDEX_DIR/f'{key}.json',obj);indexes[key]=obj
 pts=align_parent([indexes[k]['observations'] for k in ('risk','growth','macro')]);obj={'schema':'market-navigator-index-v1','databaseVersion':VERSION,'id':'regime','name':'Regime Sentiment Index','scale':{'min':0,'neutral':50,'max':100},'children':['risk','growth','macro'],'method':'arithmetic mean of persisted Risk, Growth, and Macro values at each date','observations':pts,'count':len(pts),'first':pts[0]['t'] if pts else None,'last':pts[-1]['t'] if pts else None};write(INDEX_DIR/'regime.json',obj);indexes['regime']=obj;return indexes
def validate(db,indexes):
 errors=[]
 for k in ('risk','growth','macro','regime'):
  if not indexes[k]['observations']:errors.append(f'{k}: no derived observations')
 for p in indexes['regime']['observations'][-500:]:
  vals=[value_at(indexes[k]['observations'],p['t']) for k in ('risk','growth','macro')];expected=round(sum(vals)/3,2)
  if abs(expected-p['v'])>.001:errors.append(f"regime reconciliation failed at {p['t']}");break
 return errors
def main():
 SERIES_DIR.mkdir(parents=True,exist_ok=True);INDEX_DIR.mkdir(parents=True,exist_ok=True);db=load_components();indexes=build_indexes(db);errors=validate(db,indexes);files={}
 for p in sorted(ROOT.glob('series/*.json'))+sorted(ROOT.glob('indexes/*.json')):
  h=sha(p);files[str(p.relative_to(ROOT))]={'revision':h[:16],'sha256':h,'bytes':p.stat().st_size}
 manifest={'schema':'market-navigator-database-v1','databaseVersion':VERSION,'generatedAt':dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'status':'ready' if not errors else 'invalid','marketSeriesReady':all(db[x]['count']>0 for x in ('spy','qqq','vix','tenYear','wti','brent','gold','dxy')),'fredMacroReady':all(db[x]['count']>0 for x in ('cpi','fedFunds','twoYear','thirtyYear')),'series':{k:{'count':v['count'],'first':v['first'],'last':v['last'],'provider':v['provider'],'status':v['status']} for k,v in db.items()},'indexes':{k:{'count':v['count'],'first':v['first'],'last':v['last'],'children':v['children']} for k,v in indexes.items()},'files':files,'validation':{'ok':not errors,'errors':errors},'contract':{'parentChild':'Regime = mean(Risk, Growth, Macro); each category is derived only from its declared component series','uiReadsPersistedDataOnly':True,'allowSyntheticHistory':False,'displayCurrentEqualsLastPlottedPoint':True,'indexChangeUnit':'points','componentChangeUnit':'percent'}};manifest['revision']=hashlib.sha256(json.dumps(manifest,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:16];write(ROOT/'manifest.json',manifest)
 if errors:raise SystemExit('Database validation failed: '+'; '.join(errors))
 print(json.dumps({'ok':True,'revision':manifest['revision'],'marketSeriesReady':manifest['marketSeriesReady'],'fredMacroReady':manifest['fredMacroReady'],'regimeObservations':indexes['regime']['count']},indent=2))
if __name__=='__main__':main()
