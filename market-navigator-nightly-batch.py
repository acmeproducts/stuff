#!/usr/bin/env python3
"""Nightly all-or-nothing batch: `gate` checks the fresh run against the last published state; `index` appends the persistent indices."""
import datetime as dt,importlib.util,json,subprocess,sys
from pathlib import Path
ANCHOR='2016-09-01';S=Path('market-evidence/series');PI=Path('market-evidence/persistent-indices-v1.json');BATCH=Path('market-evidence/batch.json')
FAST={'trading-day','daily','daily-nav'}
def rd(p):return json.loads(Path(p).read_text())
COMP={c['id'] for c in rd('data/market-backend/component-registry-v1.json')['components']}
def head(p):
    r=subprocess.run(['git','show','HEAD:'+str(p)],capture_output=True)
    return json.loads(r.stdout) if r.returncode==0 else None
def day(ms):return dt.datetime.fromtimestamp(ms/1000,dt.timezone.utc).date().isoformat()
def ms(d):return int(dt.datetime.fromisoformat(d).replace(tzinfo=dt.timezone.utc).timestamp()*1000)
def catalog():return [s for s in rd('data/market-backend/data-catalog.json')['series'] if s.get('enabled',True)]
def gate():
    bad=[];info={};today=dt.datetime.now(dt.timezone.utc).date()
    for m in catalog():
        sid=m['id'];o=rd(S/f'{sid}.json');old=head(S/f'{sid}.json') or {}
        if o.get('last_error'):bad.append(f'{sid}: collection error: {o["last_error"]}')
        if not o.get('observations'):bad.append(f'{sid}: no observations');continue
        if (o.get('last_successful') or '')[:10]!=today.isoformat():bad.append(f'{sid}: not refreshed this run')
        if sid in COMP and day(o['first'])>ANCHOR:bad.append(f'{sid}: history starts {day(o["first"])}, after anchor {ANCHOR}')
        if old.get('first') and o['first']>old['first'] and not m.get('transform_source_id'):bad.append(f'{sid}: lost early history ({day(old["first"])} -> {day(o["first"])})')
        if old.get('count') and o['count']<old['count']-3:bad.append(f'{sid}: shrank {old["count"]} -> {o["count"]}')
        if old.get('last') and o['last']<old['last']:bad.append(f'{sid}: last date moved back')
        info[sid]={'cadence':m.get('native_cadence'),'first':day(o['first']),'last':day(o['last']),'count':o['count']}
    fast=[v['last'] for v in info.values() if v['cadence'] in FAST]
    batch=min(fast) if fast else None
    if batch is None or (today-dt.date.fromisoformat(batch)).days>5:bad.append(f'batch date {batch} is stale')
    if bad:
        print('BATCH REJECTED - nothing will be published:');[print(' -',b) for b in bad];sys.exit(1)
    BATCH.write_text(json.dumps({'schema':'market-navigator-batch-v1','batchDate':batch,'builtAt':dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'status':'ACCEPTED','series':info},indent=1,sort_keys=True)+'\n')
    print('BATCH ACCEPTED',batch,len(info),'series')
def index():
    batch=rd(BATCH)['batchDate'];src=Path('market-navigator-build-persistent-indices.py').read_text()
    a='dates=sorted({e["date"] for sid in ids for e in events[sid] if e["date"]>=ANCHOR})'
    b='dates=sorted({e["date"] for sid in ids for e in events[sid] if ANCHOR<=e["date"]<=BATCH}|{BATCH})'
    assert src.count(a)==1;src=src.replace(a,b)
    a2='events[sid]=vintage_events(sid) if row["provider"]=="FRED" else canonical_events(sid)'
    b2='events[sid]=(vintage_events(sid) if (VINTAGE/f"{sid}.json").exists() else canonical_events(sid)) if row["provider"]=="FRED" else canonical_events(sid)'
    assert src.count(a2)==1;src=src.replace(a2,b2)
    old=head(PI);g={'__name__':'nightly_index','BATCH':batch};exec(compile(src,'builder','exec'),g)
    g['main']()
    new=rd(PI)
    if old:
        for k,v in old['indices'].items():
            n=new['indices'][k];L=len(v['dates']);cut=[i for i,d in enumerate(n['dates']) if d>v['dates'][-1]]
            start=cut[0] if cut else len(n['dates'])
            for f in ('dates','timestamps','values'):n[f]=v[f]+n[f][start:]
            for f in ('componentSignals','componentValues','componentObservationDates'):
                for sid in v['components']:n[f][sid]=v[f][sid]+n[f][sid][start:]
        new['history']='APPEND_ONLY_SINCE_'+old['indices'][next(iter(old['indices']))]['dates'][-1]
    for k,n in new['indices'].items():
        assert n['dates'][0]==ANCHOR and abs(n['values'][0]-100)<1e-9,k
        assert n['dates'][-1]==batch,(k,n['dates'][-1],batch)
        assert n['dates']==sorted(set(n['dates']))
        assert len(n['dates'])==len(n['values'])==len(n['timestamps'])
        if old:
            assert n['values'][:len(old['indices'][k]['values'])]==old['indices'][k]['values'],k+': published history changed'
    PI.write_text(json.dumps(new,separators=(',',':'),sort_keys=True)+'\n')
    print('INDEX APPENDED, all end',batch)
{'gate':gate,'index':index}[sys.argv[1]]()
