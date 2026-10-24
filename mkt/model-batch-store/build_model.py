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
    for h,x in pers['indices'][k]['horizons'].items():
        if h=='1D': continue
        T0=x['commonT0']; slots=[]; idx={}
        for p in x['curve']:
            d=day(p['t'])
            if d.weekday()>=5: continue
            slots.append(str(d)); idx[str(d)]=p['v']
        cal=[d for d in B('spy') if T0<=d<=NOW]; slots=sorted(cal); assert slots and slots[-1]==NOW  # ONE common trading calendar (SPY batches) for every index and series
        series=[]
        t0v=idx.get(slots[0])
        series.append({'id':k,'label':k.upper(),'kind':'index','unit':'Index','axis':'Y1','available':True,'reason':'ok',
            'fixed':[round(idx.get(s),6) if s in idx else None for s in slots],'horizon':[round(100+(idx[s]-t0v),6) if s in idx else None for s in slots],'native':[round(idx[s],6) if s in idx else None for s in slots]})
        for cid,c in comps.items():
            m=B(cid); u=cat[cid].get('native_unit',''); add=c['transform']!='log_return'
            slow=not any(k2 in str(cat[cid].get('native_cadence','')) for k2 in DAILY)
            if slow:  # contract rule: latest governed state available by the batch date; the source date is retained
                src=[last_le(m,s) for s in slots]; pts=[v for _,v in src]; sd=[d for d,_ in src]
                real=len({d for d in sd if d is not None and d>T0})
            else:
                pts=[m.get(s) for s in slots]; sd=[s if m.get(s) is not None else None for s in slots]; real=sum(v is not None for v in pts)
            _,bT0=last_le(m,T0); _,bA=last_le(m,ANCHOR)
            av=real>=2
            series.append({'id':cid,'label':cat[cid].get('short_name',cid),'kind':'component','unit':u,'cadence':cat[cid].get('native_cadence'),'axis':'Y2' if u.startswith('USD') else 'Y1','available':av,'reason':'ok' if av else 'fewer than 2 readings in horizon',
                'sourceDate':sd if av else None,'native':pts if av else None,'horizon':[rebase(v,bT0,add) for v in pts] if av else None,'fixed':[rebase(v,bA,add) for v in pts] if av else None})
        pkg={'index':k,'horizon':h,'t0':T0,'now':NOW,'slots':slots,'series':series}
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
