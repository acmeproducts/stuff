"""Models what a batch-stamped collector would store. Input: the Sep 27 floor pair (read-only). Output: one pre-aggregated package per index x horizon. The front end must only draw these; it must do no date math and no rebasing."""
import json,sys,os,datetime as dt
SRC=sys.argv[1]; OUT=sys.argv[2]
J=lambda p:json.load(open(os.path.join(SRC,p)))
day=lambda t:dt.datetime.fromtimestamp(t/1000,dt.timezone.utc).date()
cat={x['id']:x for x in J('data/market-backend/data-catalog.json')['series']} if isinstance(J('data/market-backend/data-catalog.json').get('series'),list) else None
if cat is None:
    c=J('data/market-backend/data-catalog.json'); L=c.get('series') or c.get('sources') or list(c.values()); cat={x['id']:x for x in L if isinstance(x,dict) and 'id' in x}
defn=J('data/market-backend/derived-index-definition-persistent-v1.json')['indices']
pers=J('market-evidence/derived-indices-persistent-v1.json'); NOW=pers['commonMarketAnchor']; ANCHOR='2016-09-01'
DAILY=('daily','trading','nav')
def batches(sid):
    """MODEL ASSUMPTION: batch id = date part of the stored stamp; weekend stamps dropped for daily sources; last reading of a batch wins."""
    cad=str(cat[sid].get('native_cadence','')); ob=json.load(open(os.path.join(SRC,f'market-evidence/series/{sid}.json')))['observations']; m={}
    for o in ob:
        d=day(o['t'])
        if any(k in cad for k in DAILY) and d.weekday()>=5: continue
        if o.get('v') is None: continue
        if str(d)<=NOW: m[str(d)]=float(o['v'])
    return m
cache={}
def B(sid):
    if sid not in cache: cache[sid]=batches(sid)
    return cache[sid]
def last_le(m,d):
    ks=[k for k in m if k<=d]; return (max(ks),m[max(ks)]) if ks else (None,None)
def rebase(v,base,additive):
    if v is None or base is None: return None
    return round(100+(v-base),6) if additive else (round(100+((v/base)-1)*100,6) if base>0 else None)
os.makedirs(OUT,exist_ok=True); report={'now':NOW,'assumptions':['batch id = date part of stored stamp','weekend stamps dropped for daily sources','last reading in a batch wins','5D/MTD/... start (T0) taken from the floor index file','Horizon-mode index = 100 + (value - value at T0)'],'packages':[]}
for k,idef in defn.items():
    comps={c['id']:c for c in idef['components']}
    full={str(day(p['t'])):p['v'] for p in pers['indices'][k]['horizons']['5YR']['curve'] if day(p['t']).weekday()<5}
    for h in ['1D','5D','MTD','YTD','1YR','3YR','5YR']:
        cal=sorted(d for d in B('spy') if d<=NOW); assert cal[-1]==NOW
        nd=dt.date.fromisoformat(NOW)
        if h=='1D': slots=cal[-1:]
        elif h=='5D': slots=cal[-5:]          # current business day + 4 previous
        elif h=='MTD': slots=[d for d in cal if d>=NOW[:8]+'01']
        elif h=='YTD': slots=[d for d in cal if d>=NOW[:5]+'01-01']
        else:
            n=int(h[0]); start=str(nd.replace(year=nd.year-n)); slots=[d for d in cal if d>=start]
        T0=slots[0]; idx=full
        series=[]
        t0v=idx.get(slots[0])
        series.append({'id':k,'label':k.upper(),'kind':'index','unit':'Index','axis':'Y1','available':True,'reason':'ok',
            'fixed':[round(idx.get(s),6) if s in idx else None for s in slots],'horizon':[round(100+(idx[s]-t0v),6) if (s in idx and t0v is not None) else None for s in slots],'native':[round(idx[s],6) if s in idx else None for s in slots]})
        for cid,c in comps.items():
            m=B(cid); u=cat[cid].get('native_unit',''); add=c['transform']!='log_return'
            slow=not any(k2 in str(cat[cid].get('native_cadence','')) for k2 in DAILY)
            if slow:  # contract rule: latest governed state available by the batch date; the source date is retained
                src=[last_le(m,s) for s in slots]; pts=[v for _,v in src]; sd=[d for d,_ in src]
                real=len({d for d in sd if d is not None and d>T0})
            else:
                pts=[m.get(s) for s in slots]; sd=[s if m.get(s) is not None else None for s in slots]; real=sum(v is not None for v in pts)
            bT0=m.get(T0) if not slow else last_le(m,T0)[1]; _,bA=last_le(m,ANCHOR)
            av=(real>=1) if h=='1D' else (real>=2)
            series.append({'id':cid,'label':cat[cid].get('short_name',cid),'kind':'component','unit':u,'cadence':cat[cid].get('native_cadence'),'axis':'Y2' if u.startswith('USD') else 'Y1','available':av,'reason':'ok' if av else ('no reading in horizon' if h=='1D' else 'fewer than 2 readings in horizon'),
                'sourceDate':sd if av else None,'native':pts if av else None,'horizon':[rebase(v,bT0,add) for v in pts] if av else None,'fixed':[rebase(v,bA,add) for v in pts] if av else None})
        pkg={'index':k,'horizon':h,'render':'point' if h=='1D' else 'line','t0':T0,'now':NOW,'slots':slots,'series':series}
        json.dump(pkg,open(os.path.join(OUT,f'{k}-{h}.json'),'w'),separators=(',',':'))
        # validation
        n=len(slots); bad=[]
        for s in series:
            if s['available']:
                for mode in ('native','horizon','fixed'):
                    if s[mode] is not None and len(s[mode])!=n: bad.append((s['id'],mode,'length'))
                if s['horizon'] is not None and s['horizon'][-1] is None and s['kind']=='component': bad.append((s['id'],'no value at NOW batch'))
        report['packages'].append({'indexGaps':sum(v is None for v in series[0]['fixed']),'index':k,'horizon':h,'slots':n,'first':slots[0],'last':slots[-1],'available':[s['id'] for s in series if s['available']],'greyed':[s['id'] for s in series if not s['available']],'problems':bad})
json.dump(report,open(os.path.join(OUT,'_report.json'),'w'),indent=1)
for r in report['packages']: print(r['index'],r['horizon'],'idxGaps',r['indexGaps'],'slots',r['slots'],r['first'],'->',r['last'],'greyed',r['greyed'],'PROBLEMS' if r['problems'] else '',r['problems'])

# ---- one package per horizon with EVERY series aligned to the common calendar, plus a manifest (what the dumb front end reads)
ADD_UNITS=('percent','percentage')
manifest={'now':NOW,'horizons':['1D','5D','MTD','YTD','1YR','3YR','5YR'],'indices':{},'catalog':[]}
for k,idef in defn.items(): manifest['indices'][k]={'name':idef['name'],'label':k.upper(),'components':[c['id'] for c in idef['components']]}
comp_tr={c['id']:c['transform'] for idef in defn.values() for c in idef['components']}
ids=[sid for sid in cat if os.path.exists(os.path.join(SRC,f'market-evidence/series/{sid}.json')) and cat[sid].get('enabled',True)]
for sid in ids: manifest['catalog'].append({'id':sid,'label':cat[sid].get('short_name',sid),'name':cat[sid].get('name',sid),'unit':cat[sid].get('native_unit',''),'quote':(cat[sid].get('native_unit','')+' per share') if cat[sid].get('native_unit')=='USD' else cat[sid].get('native_unit',''),'axis':'Y2' if cat[sid].get('native_unit','').startswith('USD') else 'Y1','cadence':cat[sid].get('native_cadence','')})
for k in defn: manifest['catalog'].append({'id':k,'label':k.upper(),'name':defn[k]['name'],'unit':'Index','cadence':'derived'})
colors={'risk':'#29d3ff','growth':'#ffd166','macro':'#5be3a0'}
for h in manifest['horizons']:
    cal=sorted(d for d in B('spy') if d<=NOW); nd=dt.date.fromisoformat(NOW)
    slots=cal[-1:] if h=='1D' else cal[-5:] if h=='5D' else [d for d in cal if d>=NOW[:8]+'01'] if h=='MTD' else [d for d in cal if d>=NOW[:5]+'01-01'] if h=='YTD' else [d for d in cal if d>=str(nd.replace(year=nd.year-int(h[0])))]
    T0=slots[0]; S={}
    for k in defn:
        full={str(day(p['t'])):p['v'] for p in pers['indices'][k]['horizons']['5YR']['curve'] if day(p['t']).weekday()<5}
        t0=full.get(T0); raw=[full.get(s) for s in slots]
        S[k]={'unit':'Index','axis':'Y1','available':all(v is not None for v in raw) or sum(v is not None for v in raw)>=(1 if h=='1D' else 2),'reason':'ok','native':[None if v is None else round(v,6) for v in raw],'fixed':[None if v is None else round(v,6) for v in raw],'horizon':[None if (v is None or t0 is None) else round(100+(v-t0),6) for v in raw]}
    for sid in ids:
        m=B(sid); u=cat[sid].get('native_unit',''); cad=str(cat[sid].get('native_cadence',''))
        slow=not any(k2 in cad for k2 in DAILY)
        if slow:
            src=[last_le(m,s) for s in slots]; pts=[v for _,v in src]; sd=[d for d,_ in src]; real=len({d for d in sd if d is not None and d>T0}); bT0=last_le(m,T0)[1]
        else:
            pts=[m.get(s) for s in slots]; sd=[s if m.get(s) is not None else None for s in slots]; real=sum(v is not None for v in pts); bT0=m.get(T0)
        add=(comp_tr.get(sid)!='log_return') if sid in comp_tr else (u.startswith(ADD_UNITS) or (bT0 is not None and bT0<=0))
        _,bA=last_le(m,ANCHOR); av=(real>=1) if h=='1D' else (real>=2)
        S[sid]={'unit':u,'cadence':cad,'axis':'Y2' if u.startswith('USD') else 'Y1','available':av,'reason':'ok' if av else 'not enough readings in horizon','sourceDate':sd if av else None,'native':pts if av else None,'horizon':[rebase(v,bT0,add) for v in pts] if av else None,'fixed':[rebase(v,bA,add) for v in pts] if av else None}
    json.dump({'horizon':h,'render':'point' if h=='1D' else 'line','now':NOW,'t0':T0,'slots':slots,'series':S},open(os.path.join(OUT,f'series-{h}.json'),'w'),separators=(',',':'))
json.dump(manifest,open(os.path.join(OUT,'manifest.json'),'w'),separators=(',',':'))
print('series packages written',len(ids)+3,'series x',len(manifest['horizons']),'horizons')
