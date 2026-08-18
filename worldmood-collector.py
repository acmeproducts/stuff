#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, json, os, re, time, urllib.parse, urllib.request
from pathlib import Path
from collections import defaultdict

VERSION='1.9.0'
GKG=os.environ.get('WORLDPULSE_GKG_URL','https://api.gdeltproject.org/api/v1/gkg_geojson')
DOC=os.environ.get('WORLDPULSE_DOC_URL','https://api.gdeltproject.org/api/v2/doc/doc')
HISTORY=Path(os.environ.get('WORLDPULSE_HISTORY','worldpulse-history.json'))
OUTPUT=Path(os.environ.get('WORLDPULSE_OUTPUT','worldpulse-index.json'))
WINDOWS=(60,180,360,720,1440); MAXROWS=5000; TIMEOUT=45
UA='WorldPulseCollector/1.9 (+https://github.com/acmeproducts/stuff)'
QUALITY={'bbc.com':100,'bbc.co.uk':100,'reuters.com':99,'apnews.com':99,'npr.org':95,'theguardian.com':94,'aljazeera.com':93,'dw.com':92,'france24.com':92,'abc.net.au':91,'cbc.ca':91,'cbsnews.com':87,'nbcnews.com':87,'abcnews.go.com':87,'cnn.com':85,'nytimes.com':85,'washingtonpost.com':85}
TARGET=list(QUALITY)[:11]

def utcnow(): return dt.datetime.now(dt.timezone.utc)
def iso(t): return t.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def parse_time(v):
    if not v:return None
    s=str(v).strip()
    for f in ('%Y-%m-%dT%H:%M:%SZ','%Y%m%dT%H%M%SZ','%Y%m%d%H%M%S'):
        try:return dt.datetime.strptime(s,f).replace(tzinfo=dt.timezone.utc)
        except:pass
    try:
        t=dt.datetime.fromisoformat(s.replace('Z','+00:00')); return t if t.tzinfo else t.replace(tzinfo=dt.timezone.utc)
    except:return None

def get_json(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'}); t=time.time()
    with urllib.request.urlopen(req,timeout=TIMEOUT) as r:return json.loads(r.read().decode('utf-8','replace')),r.status,round((time.time()-t)*1000)
def dom(u):
    try:return urllib.parse.urlparse(u).netloc.lower().removeprefix('www.')
    except:return ''
def qscore(d):
    d=str(d or '').lower().removeprefix('www.')
    for k,v in QUALITY.items():
        if d==k or d.endswith('.'+k):return v
    return 0
def reg(lat,lon):
    if lat < -60:return 'Antarctica'
    if -170<=lon<-30 and lat>=7:return 'North America'
    if -95<=lon<-30 and lat<15:return 'South America'
    if -20<=lon<55 and lat>=35:return 'Europe'
    if -25<=lon<60 and -40<lat<35:return 'Africa'
    if (lon>=110 or lon<-170) and lat<-10:return 'Oceania'
    return 'Asia'
def slug(u):
    try:
        s=urllib.parse.urlparse(u).path.strip('/').split('/')[-1]; s=re.sub(r'[-_]+',' ',s); s=re.sub(r'\.(html?|amp)$','',s,flags=re.I); s=re.sub(r'\b\d{5,}\b','',s); s=' '.join(s.split()); return s[:1].upper()+s[1:] if len(s)>=12 else ''
    except:return ''

def quality_titles():
    ors=' OR '.join(f'domain:{d}' for d in TARGET)
    p=urllib.parse.urlencode({'query':f'({ors}) sourcelang:english','mode':'ArtList','maxrecords':'250','format':'json','timespan':'60min','sort':'DateDesc'})
    try:
        j,http,ms=get_json(DOC+'?'+p); out={}
        for a in j.get('articles',[]):
            u=a.get('url') or ''
            if u:out[u]={'title':(a.get('title') or '').strip(),'domain':a.get('domain') or dom(u),'published':a.get('seendate') or ''}
        return out,{'ok':True,'http':http,'ms':ms,'records':len(out)}
    except Exception as e:return {},{'ok':False,'error':str(e)}

def gkg():
    p=urllib.parse.urlencode({'QUERY':'','TIMESPAN':'60','OUTPUTFIELDS':'name,geores,url,domain,lang,tone,urltone,date,datetime,themes,names,title','MAXROWS':str(MAXROWS)})
    u=GKG+'?'+p; j,http,ms=get_json(u); return j.get('features',[]),http,ms

def norm(f,titles):
    g=f.get('geometry') or {}; c=g.get('coordinates') or []
    if g.get('type')!='Point' or len(c)<2:return None
    try:lon=float(c[0]);lat=float(c[1])
    except:return None
    p=f.get('properties') or {}; name=str(p.get('name') or 'Other').strip(); parts=[x.strip() for x in name.split(',') if x.strip()]
    city=parts[0] if parts else name; country=str(p.get('country') or p.get('countryname') or (parts[-1] if parts else 'Other')).strip() or 'Other'; admin=str(p.get('adm1') or p.get('admin1') or p.get('state') or p.get('province') or (parts[-2] if len(parts)>=3 else 'Other')).strip() or 'Other'
    url=p.get('url') or p.get('articleurl') or ''; domain=p.get('domain') or dom(url)
    try:tone=float(p.get('urltone',p.get('tone',0)) or 0)
    except:tone=0.0
    t=parse_time(p.get('datetime') or p.get('date')) or utcnow(); title=(titles.get(url,{}).get('title') or p.get('title') or '').strip() or slug(url)
    return {'id':f'{url}|{round(lat,3)}|{round(lon,3)}','published':iso(t),'lat':round(lat,5),'lon':round(lon,5),'region':reg(lat,lon),'country':country,'admin1':admin,'city':city,'tone':round(tone,3),'count':max(1,int(float(p.get('count',1) or 1))),'url':url,'domain':domain,'title':title,'lang':p.get('lang') or '','quality':qscore(domain)}

def load_history():
    try:return json.loads(HISTORY.read_text(encoding='utf-8')).get('records',[])
    except:return []
def merge(old,new):
    cut=utcnow()-dt.timedelta(hours=26); m={}
    for r in old+new:
        t=parse_time(r.get('published'))
        if not t or t<cut:continue
        m[r.get('id') or r.get('url')]=r
    return sorted(m.values(),key=lambda r:r.get('published',''),reverse=True)[:30000]
def sentiment(rows):
    p=n=u=0
    for r in rows:
        c=max(1,int(r.get('count',1))); t=float(r.get('tone',0) or 0)
        if t>1.5:p+=c
        elif t<-1.5:n+=c
        else:u+=c
    z=p+n+u
    if not z:return {'positive':0,'neutral':100,'negative':0}
    pp=round(100*p/z);nn=round(100*n/z);uu=100-pp-nn
    if uu<0:
        if pp>=nn:pp+=uu
        else:nn+=uu
        uu=0
    return {'positive':pp,'neutral':uu,'negative':nn}
def headlines(rows,limit=25):
    nowt=utcnow(); seen=set(); out=[]
    def score(r):
        age=max(0,(nowt-(parse_time(r.get('published')) or nowt)).total_seconds()/3600); return int(r.get('quality',0))*4+max(0,30-age*2)+(25 if len((r.get('title') or '').strip())>=18 else -60)
    for r in sorted(rows,key=score,reverse=True):
        title=(r.get('title') or '').strip(); url=r.get('url') or ''
        if not url or len(title)<12:continue
        key=re.sub(r'[^a-z0-9]+',' ',title.lower()).strip()[:100]
        if url in seen or key in seen:continue
        if int(r.get('quality',0))<=0 and len(out)>=max(8,limit//2):continue
        seen.add(url);seen.add(key);out.append({k:r.get(k,'') for k in ('title','url','domain','published','quality','tone','lang','city','admin1','country','region')})
        if len(out)>=limit:break
    return out
def report(rows,level,name,path):
    if not rows:return None
    cnt=sum(max(1,int(r.get('count',1))) for r in rows); lat=sum(float(r['lat'])*max(1,int(r.get('count',1))) for r in rows)/cnt; lon=sum(float(r['lon'])*max(1,int(r.get('count',1))) for r in rows)/cnt
    return {'level':level,'name':name,'path':path,'sentiment':sentiment(rows),'mentions':cnt,'lat':round(lat,4),'lon':round(lon,4),'headlines':headlines(rows,30 if level in ('world','region') else 25)}
def build(rows,mins):
    cut=utcnow()-dt.timedelta(minutes=mins); rows=[r for r in rows if (parse_time(r.get('published')) or dt.datetime.min.replace(tzinfo=dt.timezone.utc))>=cut]; reports={}
    def add(k,r):
        if r:reports[k]=r
    add('world',report(rows,'world','World',[])); rg=defaultdict(list)
    for x in rows:rg[x['region']].append(x)
    rkids=[]
    for rn,rr in rg.items():
        rk='region|'+rn; rrpt=report(rr,'region',rn,[rn]);add(rk,rrpt);rkids.append({'name':rn,'key':rk,'mentions':rrpt['mentions'],'sentiment':rrpt['sentiment'],'lat':rrpt['lat'],'lon':rrpt['lon']}); cg=defaultdict(list)
        for x in rr:cg[x['country']].append(x)
        ckids=[]
        for cn,cr in cg.items():
            ck=f'country|{rn}|{cn}';crpt=report(cr,'country',cn,[rn,cn]);add(ck,crpt);ckids.append({'name':cn,'key':ck,'mentions':crpt['mentions'],'sentiment':crpt['sentiment']});ag=defaultdict(list)
            for x in cr:ag[x['admin1']].append(x)
            akids=[]
            for an,ar in ag.items():
                ak=f'admin1|{rn}|{cn}|{an}';arpt=report(ar,'admin1',an,[rn,cn,an]);add(ak,arpt);akids.append({'name':an,'key':ak,'mentions':arpt['mentions'],'sentiment':arpt['sentiment']});cityg=defaultdict(list)
                for x in ar:cityg[x['city']].append(x)
                cikids=[]
                for ci,cir in cityg.items():
                    cik=f'city|{rn}|{cn}|{an}|{ci}';cirpt=report(cir,'city',ci,[rn,cn,an,ci]);add(cik,cirpt);cikids.append({'name':ci,'key':cik,'mentions':cirpt['mentions'],'sentiment':cirpt['sentiment']})
                reports[ak]['children']=sorted(cikids,key=lambda z:z['mentions'],reverse=True)[:80]
            reports[ck]['children']=sorted(akids,key=lambda z:z['mentions'],reverse=True)[:80]
        reports[rk]['children']=sorted(ckids,key=lambda z:z['mentions'],reverse=True)[:80]
    if 'world' in reports:reports['world']['children']=sorted(rkids,key=lambda z:z['mentions'],reverse=True)
    return {'minutes':mins,'records':len(rows),'reports':reports}

def main():
    titles,tstat=quality_titles(); feats,http,ms=gkg(); new=[r for r in (norm(f,titles) for f in feats) if r]
    if len(new)<100:raise SystemExit(f'Refusing to publish: only {len(new)} mapped records in 60m pull')
    hist=merge(load_history(),new); HISTORY.write_text(json.dumps({'schema':'worldpulse-history-v1','generated_at':iso(utcnow()),'records':hist},separators=(',',':')),encoding='utf-8')
    windows={str(m):build(hist,m) for m in WINDOWS}; one=windows['60']['records']
    for m in ('180','360','720','1440'):
        if one>=100 and windows[m]['records']<max(50,int(one*.5)):raise SystemExit(f'Refusing invalid {m}m window: {windows[m]["records"]} vs {one}')
    out={'schema':'worldpulse-index-v1','app_version':VERSION,'generated_at':iso(utcnow()),'source_note':'Rolling 24h precomputed index built from repeated healthy 60-minute GDELT pulls. Broad GDELT drives geography/sentiment; reputable publishers are ranked first in the reader.','quality_publishers':QUALITY,'collector':{'gkg_http':http,'gkg_ms':ms,'gkg_raw':len(feats),'mapped_new':len(new),'history_records':len(hist),'quality_doc':tstat},'windows':windows}
    OUTPUT.write_text(json.dumps(out,separators=(',',':')),encoding='utf-8'); print(json.dumps({'ok':True,'new':len(new),'history':len(hist),'windows':{k:v['records'] for k,v in windows.items()},'quality_doc':tstat},indent=2))
if __name__=='__main__':main()
