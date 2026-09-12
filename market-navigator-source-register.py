#!/usr/bin/env python3
from __future__ import annotations
import argparse,datetime as dt,json,re,urllib.parse,urllib.request
from pathlib import Path

CATALOG=Path('data/market-backend/data-catalog.json')
REGISTRY=Path('data/market-backend/source-registry.json')
UA='MarketNavigatorSourceResolver/1.0 (+https://github.com/acmeproducts/stuff)'
CLASSES={'index','equity','etf','fund_cit'}
TYPE_MAP={'INDEX':'index','EQUITY':'equity','ETF':'etf','MUTUALFUND':'fund_cit'}

def load(p): return json.loads(p.read_text())
def write(p,o): p.write_text(json.dumps(o,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def now(): return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def getj(url):
 req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
 with urllib.request.urlopen(req,timeout=25) as r:return json.loads(r.read())
def clean_id(sym): return 'custom_'+re.sub(r'[^a-z0-9]+','_',sym.lower()).strip('_')

def alias_candidate(q,cls,reg):
 a=(reg.get('aliases') or {}).get(q.upper()+'|'+cls)
 if not a:return None
 return {'symbol':a['symbol'],'name':a['name'],'instrumentClass':a['instrumentClass'],'currency':'USD','exchange':'DJI','measure':a['measure']}

def yahoo_candidates(q):
 url='https://query1.finance.yahoo.com/v1/finance/search?'+urllib.parse.urlencode({'q':q,'quotesCount':12,'newsCount':0,'enableFuzzyQuery':'false'})
 x=getj(url);out=[]
 for z in x.get('quotes') or []:
  cls=TYPE_MAP.get(str(z.get('quoteType') or '').upper())
  if not cls:continue
  sym=str(z.get('symbol') or '').strip()
  if not sym:continue
  out.append({'symbol':sym,'name':z.get('longname') or z.get('shortname') or sym,'instrumentClass':cls,'currency':z.get('currency') or 'USD','exchange':z.get('exchange') or z.get('exchDisp') or '','measure':'index level' if cls=='index' else ('NAV / unit value' if cls=='fund_cit' else 'market price')})
 return out

def resolve(q,cls,reg):
 q=q.strip()
 if not q:raise RuntimeError('empty source request')
 if cls not in CLASSES:raise RuntimeError('instrument class must be index, equity, etf, or fund_cit')
 a=alias_candidate(q,cls,reg)
 if a:return a
 c=yahoo_candidates(q)
 matches=[z for z in c if z['instrumentClass']==cls and z['symbol'].upper()==q.upper()]
 if len(matches)==1:return matches[0]
 same=[z for z in c if z['instrumentClass']==cls]
 if len(same)==1:return same[0]
 if not same:raise RuntimeError(f'no {cls} candidate resolved for {q}')
 raise RuntimeError('ambiguous request; candidates: '+', '.join(z['symbol']+' '+z['name'] for z in same[:6]))

def providers(c):
 sym=c['symbol'];cls=c['instrumentClass'];out=[{'provider':'Yahoo Finance','identifier':sym}]
 if cls in {'equity','etf'} and re.fullmatch(r'[A-Za-z.\-]+',sym):
  out.append({'provider':'Stooq','identifier':sym.lower()+'.us'})
 return out

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--query',required=True);ap.add_argument('--class',dest='cls',required=True,choices=sorted(CLASSES));args=ap.parse_args()
 reg=load(REGISTRY);cat=load(CATALOG);c=resolve(args.query,args.cls,reg);sid=clean_id(c['symbol']);chain=providers(c)
 supported=['5D','MTD','YTD','1YR','3YR','5YR']
 meta={'id':sid,'name':c['name'],'short_name':c['symbol'].replace('^','')[:8],'description':f"User-registered {c['instrumentClass']} resolved from {args.query}.",'domain':'market','category':'custom','role':'objective market evidence','provider':chain[0]['provider'],'provider_identifier':chain[0]['identifier'],'provider_chain':chain,'source_reference_url':'https://finance.yahoo.com/quote/'+urllib.parse.quote(c['symbol'],safe=''),'native_unit':'index' if c['instrumentClass']=='index' else (c.get('currency') or 'USD'),'native_cadence':'daily-nav' if c['instrumentClass']=='fund_cit' else 'trading-day','canonical_storage_cadence':'daily','check_on_daily_run':True,'transformation':'none','required':False,'enabled':True,'supported_horizons':supported,'custom_source':True,'instrument_class':c['instrumentClass'],'canonical_symbol':c['symbol'],'canonical_measure':c['measure'],'currency':c.get('currency'),'exchange':c.get('exchange')}
 series=cat.get('series') or [];found=next((x for x in series if x.get('id')==sid),None)
 if found:found.update(meta)
 else:series.append(meta)
 cat['series']=series
 regs=reg.get('registrations') or [];rec={'id':sid,'query':args.query,'canonicalSymbol':c['symbol'],'canonicalName':c['name'],'instrumentClass':c['instrumentClass'],'measure':c['measure'],'providerChain':chain,'supportedHorizons':supported,'status':'registered-pending-collection','registeredAt':now()}
 old=next((x for x in regs if x.get('id')==sid),None)
 if old:old.update(rec)
 else:regs.append(rec)
 reg['registrations']=regs;reg['updatedAt']=now();write(CATALOG,cat);write(REGISTRY,reg)
 print(json.dumps(rec,indent=2))

if __name__=='__main__':main()
