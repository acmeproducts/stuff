#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, email.utils, hashlib, json, os, re, time, urllib.error, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path
from zoneinfo import ZoneInfo

VERSION='2.2.0'; ROOT=Path('data/market-backend'); NEWS_DIR=ROOT/'sources/news'; MARKET_DIR=ROOT/'sources/market'; MACRO_DIR=ROOT/'sources/macro'; UA='MarketNavigatorCollector/2.2 (+https://github.com/acmeproducts/stuff)'; TIMEOUT=25
NEWS={'wsj-markets':('WSJ Markets','https://feeds.a.dj.com/rss/RSSMarketsMain.xml'),'bbc-business':('BBC Business','https://feeds.bbci.co.uk/news/business/rss.xml'),'bbc-world':('BBC World','https://feeds.bbci.co.uk/news/world/rss.xml'),'ft-markets':('Financial Times Markets','https://www.ft.com/markets?format=rss'),'ft-world':('Financial Times World','https://www.ft.com/world?format=rss'),'marketwatch':('MarketWatch','https://feeds.marketwatch.com/marketwatch/topstories/'),'morningstar':('Morningstar','https://www.morningstar.com/rss/market-news'),'cnbc-world':('CNBC World','https://www.cnbc.com/id/100727362/device/rss/rss.html'),'nyt-business':('New York Times Business','https://rss.nytimes.com/services/xml/rss/nyt/Business.xml'),'nyt-world':('New York Times World','https://rss.nytimes.com/services/xml/rss/nyt/World.xml')}
MARKET={'spy':('SPY','SPY','Broad equities'),'qqq':('QQQ','QQQ','Growth equities'),'vix':('VIX','^VIX','Market fear'),'tenYear':('10Y','^TNX','Cost of capital'),'wti':('WTI','CL=F','U.S. oil benchmark'),'brent':('Brent','BZ=F','Global oil benchmark'),'gold':('Gold','GLD','Gold proxy'),'dxy':('DXY','DX-Y.NYB','U.S. dollar')}
# key: display name, FRED series, cadence, transform
MACRO={
'cpi':('CPI YoY','CPIAUCSL','monthly','yoy'),'coreCpi':('Core CPI YoY','CPILFESL','monthly','yoy'),'pce':('PCE Inflation YoY','PCEPI','monthly','yoy'),'corePce':('Core PCE YoY','PCEPILFE','monthly','yoy'),
'fedFunds':('Fed Funds','DFF','daily','level'),'twoYear':('2Y Treasury','DGS2','daily','level'),'thirtyYear':('30Y Treasury','DGS30','daily','level'),'curve10y2y':('10Y-2Y Curve','T10Y2Y','daily','level'),'realTenYear':('10Y Real Yield','DFII10','daily','level'),'breakeven10y':('10Y Breakeven','T10YIE','daily','level'),'hySpread':('High Yield Spread','BAMLH0A0HYM2','daily','level'),
'nfci':('Chicago Fed NFCI','NFCI','weekly','level'),'initialClaims':('Initial Claims','ICSA','weekly','level'),
'payrolls':('Nonfarm Payrolls','PAYEMS','monthly','level'),'industrialProduction':('Industrial Production','INDPRO','monthly','level'),'retailSales':('Retail Sales','RSAFS','monthly','level'),'realGdp':('Real GDP','GDPC1','quarterly','level')}
TTL={'daily':1440,'weekly':4320,'monthly':10080,'quarterly':43200}
GEO=re.compile(r'\b(iran|israel|gaza|ukraine|russia|china|taiwan|nato|missile|drone|strike|war|ceasefire|sanction|hormuz|red sea|shipping attack|opec)\b',re.I);OUTLOOK=re.compile(r'\b(outlook|forecast|expects?|expectations?|projection|guidance|strategy|target|scenario)\b',re.I)
TOPICS=[('geopolitics',GEO),('oil',re.compile(r'\b(oil|crude|brent|wti|opec|gasoline|energy)\b',re.I)),('inflation',re.compile(r'\b(cpi|pce|inflation|prices?)\b',re.I)),('rates',re.compile(r'\b(fed|federal reserve|treasury|yield|interest rate|bond)\b',re.I)),('gold',re.compile(r'\b(gold|bullion|precious metal)\b',re.I)),('currency',re.compile(r'\b(dollar|dxy|currency|forex|yen|euro)\b',re.I)),('equities',re.compile(r'\b(stock|stocks|equities|s&p|nasdaq|dow|earnings)\b',re.I))]
def now():return dt.datetime.now(dt.timezone.utc)
def iso(t=None):return (t or now()).astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def ptime(v):
 try:t=dt.datetime.fromisoformat(v.replace('Z','+00:00'));return t if t.tzinfo else t.replace(tzinfo=dt.timezone.utc)
 except:return None
def load(p,d):
 try:return json.loads(p.read_text())
 except:return d
def write(p,o):
 p.parent.mkdir(parents=True,exist_ok=True);x=json.dumps(o,ensure_ascii=False,indent=2,sort_keys=True)+'\n';old=p.read_text() if p.exists() else None
 if old==x:return False
 p.write_text(x);return True
def get(url,accept='*/*'):
 q=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':accept});st=time.time()
 try:
  with urllib.request.urlopen(q,timeout=TIMEOUT) as r:return r.read(),{'http':getattr(r,'status',200),'ms':int((time.time()-st)*1000),'etag':r.headers.get('ETag'),'lastModified':r.headers.get('Last-Modified')}
 except urllib.error.HTTPError as e:raise RuntimeError(f'HTTP {e.code}')
 except urllib.error.URLError as e:raise RuntimeError(f'network: {e.reason}')
def state(p,n,u,ttl):
 s=load(p,{});s.setdefault('source',n);s['url']=u;s.setdefault('status','new');s.setdefault('failureCount',0);s.setdefault('records',[]);s['ttlMinutes']=ttl;return s
def due(s,force=False):
 if force:return True
 n=now();r=ptime(s.get('nextRetry'));e=ptime(s.get('expiresAt'));return not ((r and n<r) or (e and n<e))
def ok(s,m,ttl,count):
 n=now();s.update(status='healthy',lastAttempt=iso(n),lastSuccess=iso(n),expiresAt=iso(n+dt.timedelta(minutes=ttl)),nextRetry=None,failureCount=0,lastError=None,recordsCount=count,http=m.get('http'),latencyMs=m.get('ms'),etag=m.get('etag'),lastModified=m.get('lastModified'))
def fail(s,e):
 n=now();f=int(s.get('failureCount') or 0)+1;h=[1,3,6,12][min(f-1,3)];s.update(status='stale' if s.get('records') else 'unavailable',lastAttempt=iso(n),failureCount=f,lastError=str(e),nextRetry=iso(n+dt.timedelta(hours=h)),expiresAt=iso(n+dt.timedelta(hours=h)),recordsCount=len(s.get('records') or []))
def node_text(n,names):
 for c in list(n):
  if c.tag.split('}')[-1].lower() in names:return ' '.join(''.join(c.itertext()).split())
 return ''
def node_link(n):
 for c in list(n):
  if c.tag.split('}')[-1].lower()=='link':return (c.attrib.get('href') or c.text or '').strip()
 return ''
def feed_time(v):
 try:t=email.utils.parsedate_to_datetime(v);return iso(t if t.tzinfo else t.replace(tzinfo=dt.timezone.utc))
 except:
  try:return iso(dt.datetime.fromisoformat(v.replace('Z','+00:00')))
  except:return iso()
def parse_feed(data,slug,source):
 root=ET.fromstring(data);out=[]
 for n in [x for x in root.iter() if x.tag.split('}')[-1].lower() in ('item','entry')][:80]:
  title=node_text(n,('title',)) or 'Untitled';desc=node_text(n,('description','summary','content','encoded'));link=node_link(n);pub=node_text(n,('pubdate','published','updated','date'));guid=node_text(n,('guid','id'));stable=guid or link or f'{source}|{title}|{pub}';topics=[k for k,r in TOPICS if r.search(title+' '+desc)] or ['general'];out.append({'id':slug+':'+hashlib.sha1(stable.encode()).hexdigest()[:20],'sourceId':slug,'source':source,'title':title,'url':link,'publishedAt':feed_time(pub),'description':desc[:1200],'topics':topics,'geopolitical':'geopolitics' in topics,'outlook':bool(OUTLOOK.search(title+' '+desc))})
 return out
def collect_news(force):
 merged={};health={}
 for slug,(name,url) in NEWS.items():
  p=NEWS_DIR/f'{slug}.json';s=state(p,name,url,30)
  if due(s,force):
   try:
    data,m=get(url,'application/rss+xml, application/xml, text/xml, */*');r=parse_feed(data,slug,name)
    if not r:raise RuntimeError('valid feed returned zero stories')
    s['records']=r;ok(s,m,30,len(r))
   except Exception as e:fail(s,e)
   write(p,s)
  for x in s.get('records') or []:merged[x.get('url') or x['id']]=x
  health['news:'+slug]={k:v for k,v in s.items() if k!='records'}
 return sorted(merged.values(),key=lambda x:x.get('publishedAt',''),reverse=True)[:600],health
def yurl(sym,rng,intv):return 'https://query1.finance.yahoo.com/v8/finance/chart/'+urllib.parse.quote(sym,safe='')+'?'+urllib.parse.urlencode({'range':rng,'interval':intv,'includePrePost':'true','events':'div,splits'})
def ypoints(sym,rng,intv):
 data,m=get(yurl(sym,rng,intv),'application/json');j=json.loads(data);r=((j.get('chart') or {}).get('result') or [None])[0]
 if not r:raise RuntimeError('Yahoo returned no chart result')
 ts=r.get('timestamp') or [];cl=(((r.get('indicators') or {}).get('quote') or [{}])[0].get('close') or []);pts=[]
 for i,t in enumerate(ts):
  try:v=float(cl[i]);pts.append({'t':int(t)*1000,'v':v})
  except:pass
 if len(pts)<2:raise RuntimeError('Yahoo returned insufficient points')
 return pts,m
def mergepts(a,b,limit):
 m={int(x['t']):{'t':int(x['t']),'v':float(x['v'])} for x in a if 't'in x and 'v'in x};m.update({int(x['t']):{'t':int(x['t']),'v':float(x['v'])} for x in b});return sorted(m.values(),key=lambda x:x['t'])[-limit:]
def active_market():
 n=now().astimezone(ZoneInfo('America/New_York'));return n.weekday()<5 and 4<=n.hour<=20
def collect_market(force):
 out={};health={};ttl=60 if active_market() else 360
 for key,(short,sym,role) in MARKET.items():
  p=MARKET_DIR/f'{key}.json';s=state(p,short,yurl(sym,'5d','15m'),ttl);s.setdefault('symbol',sym);s.setdefault('role',role);s.setdefault('daily',[]);s.setdefault('intraday',[]);n=now();ld=ptime(s.get('lastDailySuccess'));attempted=False
  if force or not ld or n-ld>=dt.timedelta(hours=20):
   attempted=True
   try:r,m=ypoints(sym,'5y','1d');s['daily']=mergepts(s['daily'],r,6000);s['lastDailySuccess']=iso(n);s['dailyError']=None
   except Exception as e:s['dailyError']=str(e)
  if due(s,force):
   attempted=True
   try:r,m=ypoints(sym,'5d','15m');s['intraday']=mergepts(s['intraday'],r,3000);ok(s,m,ttl,len(s['intraday']))
   except Exception as e:fail(s,e)
  if attempted:s['records']=[];write(p,s)
  out[key]={'id':key,'short':short,'symbol':sym,'role':role,'provider':'Yahoo Finance','status':s.get('status'),'lastSuccess':s.get('lastSuccess'),'lastDailySuccess':s.get('lastDailySuccess'),'daily':s.get('daily') or [],'intraday':s.get('intraday') or []};health['market:'+key]={k:v for k,v in s.items() if k not in ('records','daily','intraday')}
 return out,health
def fred_url(series):return 'https://fred.stlouisfed.org/graph/fredgraph.csv?'+urllib.parse.urlencode({'id':series,'cosd':'2019-01-01'})
def fred_points(series):
 data,m=get(fred_url(series),'text/csv,*/*');lines=data.decode('utf-8-sig','replace').splitlines();out=[]
 for line in lines[1:]:
  cols=line.split(',')
  if len(cols)<2 or cols[1].strip() in ('','.'):continue
  try:out.append({'t':int(dt.datetime.fromisoformat(cols[0]).replace(tzinfo=dt.timezone.utc).timestamp()*1000),'v':float(cols[1])})
  except:pass
 if len(out)<2:raise RuntimeError('FRED returned insufficient points')
 return out,m
def yoy(raw):return [{'t':raw[i]['t'],'v':(raw[i]['v']/raw[i-12]['v']-1)*100} for i in range(12,len(raw)) if raw[i-12]['v']]
def collect_macro(force):
 out={};health={}
 for key,(short,series,cad,transform) in MACRO.items():
  ttl=TTL[cad];p=MACRO_DIR/f'{key}.json';s=state(p,short,fred_url(series),ttl);s['cadence']=cad;s['seriesId']=series;s['transform']=transform
  migrated=s.get('provider')!='FRED' or s.get('seriesId')!=series
  if migrated:s['expiresAt']=None;s['nextRetry']=None;s['failureCount']=0
  if due(s,force) or migrated:
   try:
    pts,m=fred_points(series);pts=yoy(pts) if transform=='yoy' else pts;s['records']=pts[-6000:];s['provider']='FRED';ok(s,m,ttl,len(s['records']))
   except Exception as e:fail(s,e)
   write(p,s)
  out[key]={'id':key,'short':short,'seriesId':series,'cadence':cad,'transform':transform,'provider':'FRED','status':s.get('status'),'lastSuccess':s.get('lastSuccess'),'points':s.get('records') or []};health['macro:'+key]={k:v for k,v in s.items() if k!='records'}
 return out,health
def dataset(path,schema,payload,health,extra=None):
 times=[ptime(x.get('lastSuccess')) for x in health.values() if x.get('lastSuccess')];obj={'schema':schema,'collectorVersion':VERSION,'generatedAt':iso(max(times) if times else now()),'data':payload};obj.update(extra or {});write(path,obj)
def fileinfo(p):b=p.read_bytes();return {'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
def main():
 force=os.environ.get('MARKET_NAVIGATOR_FORCE','').lower() in ('1','true','yes');[p.mkdir(parents=True,exist_ok=True) for p in (NEWS_DIR,MARKET_DIR,MACRO_DIR)];news,nh=collect_news(force);market,mh=collect_market(force);macro,xh=collect_macro(force);health={**nh,**mh,**xh};np=ROOT/'news-cache.json';mp=ROOT/'market-cache.json';xp=ROOT/'macro-cache.json';hp=ROOT/'source-health.json';mf=ROOT/'market-manifest.json';dataset(np,'market-navigator-news-v1',news,nh,{'records':len(news)});dataset(mp,'market-navigator-market-v1',market,mh,{'series':len(market)});dataset(xp,'market-navigator-macro-v1',macro,xh,{'series':len(macro)});dataset(hp,'market-navigator-health-v1',health,health,{'records':len(health)});files={}
 for k,p in [('market',mp),('macro',xp),('news',np),('health',hp)]:
  o=json.loads(p.read_text());i=fileinfo(p);files[k]={**i,'path':str(p),'revision':i['sha256'][:16],'updatedAt':o['generatedAt'],'records':len(o.get('data',{})) if isinstance(o.get('data'),dict) else len(o.get('data',[]))}
 manifest={'schema':'market-navigator-manifest-v1','collectorVersion':VERSION,'generatedAt':iso(),'files':files,'policy':{'clientContract':'same-origin persistent database; UI never fans out to providers','fred':'FRED authoritative for economic history with cadence-aware TTLs and last-known-good retention','macroCadence':TTL,'marketDailyHistory':'20h TTL; 5y daily foundation merged by timestamp','marketIntraday':'60m while market-active, 6h otherwise','news':'30m TTL; failure backoff 1h/3h/6h/12h'}};manifest['revision']=hashlib.sha256(json.dumps(manifest,sort_keys=True).encode()).hexdigest()[:16];write(mf,manifest);print('Market Navigator collector',VERSION,manifest['revision'])
if __name__=='__main__':main()
