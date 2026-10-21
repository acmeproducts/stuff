"""Build an explicitly historical, independently qualified common-cutoff package."""
import argparse,datetime as dt,json,shutil,tempfile
from pathlib import Path
import run as s

def build(base,source,output,now=None):
    base,source,output=map(lambda p:Path(p).resolve(),(base,source,output))
    now=now or dt.datetime.now(s.UTC)
    if output.exists():raise ValueError('Historical output must be new')
    catalog=s.read(source/'data/market-backend/data-catalog.json')
    metas=[m for m in catalog['series'] if m.get('enabled',True)]
    daily=[s.date(s.read(source/f"market-evidence/series/{m['id']}.json")['observations'][-1]['t']) for m in metas if m['native_cadence'] in ('daily','trading-day','daily-nav')]
    latest=min(daily);scheduler=s.load('market-navigator-r7-data-pipeline')._scheduler
    failures=[]
    with tempfile.TemporaryDirectory(prefix='mn-historical-',dir=output.parent) as tmp:
        for offset in range(15):
            cutoff=(dt.date.fromisoformat(latest)-dt.timedelta(days=offset)).isoformat()
            if dt.date.fromisoformat(cutoff).weekday()>4 or cutoff in scheduler.MARKET_CLOSED:continue
            stage=Path(tmp)/str(offset);shutil.copytree(base,stage,ignore=shutil.ignore_patterns('previous'))
            root=stage/'market-navigator-rebuild-data';shutil.copytree(source,root,dirs_exist_ok=True)
            for meta in metas:
                sid=meta['id'];native=s.read(root/f'market-evidence/source-observations/{sid}.json')
                points=[p for p in native['observations'] if s.date(p['t'])<=cutoff]
                if not points:raise ValueError('No historical observations: '+sid)
                native.update(observations=points,sourceRevision=s.digest(points))
                s.write(root/f'market-evidence/source-observations/{sid}.json',native)
                row=s.read(root/f'market-evidence/series/{sid}.json');canonical=s.canonical(points,meta)
                row.update(observations=canonical,sourceRevision=s.digest(canonical),count=len(canonical),first=canonical[0]['t'],last=canonical[-1]['t'])
                s.write(root/f'market-evidence/series/{sid}.json',row)
            for meta in metas:
                vintage=root/f"market-evidence/vintage/{meta['id']}.json"
                if vintage.exists():
                    record=s.read(vintage)
                    if 'events' in record:
                        record['events']=[e for e in record['events'] if e['availableFrom']<=cutoff and e['observationDate']<=cutoff]
                        s.write(vintage,record)
            evaluated=dt.datetime.fromisoformat(cutoff+'T23:59:59+00:00')
            try:completeness=s.require_complete(root,evaluated)
            except ValueError as error:
                if not hasattr(error,'report'):raise
                failures.append({'cutoff':cutoff,'report':error.report});continue
            if completeness['status']!='PASS':continue
            derived=s.rebuild(root);proof=s.qualify(root)
            if derived['commonMarketAnchor']!=cutoff:raise ValueError('Historical chart cutoff differs')
            previous=s.read(base/'market-navigator-rebuild-data/market-evidence/persistent-indices-v1.json')
            current=s.read(root/'market-evidence/persistent-indices-v1.json')
            for index,row in current['indices'].items():
                for sid in row['components']:
                    if row['componentValues'][sid][0]!=previous['indices'][index]['componentValues'][sid][0]:raise ValueError('Historical source revision changes frozen model anchor: '+sid)
            completeness.update(scope='explicit-historical',evaluatedAt=evaluated.isoformat(),checkedAt=now.isoformat(),validUntil=None)
            proof.update(freshness=completeness,sourceProofMode='independently parsed retained provider responses; current-vintage historical cutoff')
            s.write(root/'market-evidence/sync-proof.json',{'generatedAt':now.isoformat(),'qualification':proof,'historical':{'cutoff':cutoff,'notPointInTimeVintage':True}})
            health=s.read(root/'market-evidence/health-envelope.json');health.update(marketAnchor=cutoff,generatedAt=now.isoformat())
            for meta in metas:
                row=s.read(root/f"market-evidence/series/{meta['id']}.json")
                health['series'][meta['id']].update(actualLatestCanonicalObservation=s.date(row['last']),observationCount=row['count'],classification='historical',why='Explicit complete historical cutoff '+cutoff+'; not current data')
            s.write(root/'market-evidence/health-envelope.json',health)
            opath=root/'market-evidence/operational-manifest.json'
            operational=s.read(opath);operational.update(generatedAt=now.isoformat(),historicalCutoff=cutoff)
            for meta in metas:
                sid=meta['id'];row=s.read(root/f'market-evidence/series/{sid}.json');reports=s.read(root/f'market-evidence/reports/{sid}.json')
                operational['series'][sid].update(status='historical',first_observation=row['first'],latest_observation=row['last'],observation_count=row['count'],source_revision=row['sourceRevision'],computed_revision=reports['computedRevision'],horizon_readiness={key:bool(r['ready']) for key,r in reports['reports'].items()})
            s.write(opath,operational)
            rpath=root/'data/market-backend/source-registry.json';registry=s.read(rpath)
            for entry in registry.get('registrations',[]):
                if entry['id'] not in {m['id'] for m in metas}:continue
                row=s.read(root/f"market-evidence/series/{entry['id']}.json");entry.update(observationCount=row['count'],healthClassification='historical')
            registry['historicalCutoff']=cutoff;s.write(rpath,registry)
            resources={str(p.relative_to(root)).replace('\\','/'):__import__('hashlib').sha256(p.read_bytes()).hexdigest() for p in sorted(root.rglob('*')) if p.is_file() and p.name!='package.json'}
            version=s.digest(resources);s.write(root/'package.json',{'schema':'market-navigator-etl-package-v1','qualified':True,'version':version,'resources':resources})
            app=(s.HERE/'approved-chart.html').read_bytes()
            (stage/'throwaway.html').write_bytes(app)
            s.write(stage/'connection.json',{'status':'HISTORICAL_AVAILABLE','historicalCutoff':cutoff,'requiresExplicitChoice':True,'application_blob':s.blob(app),'data_version':version,'qualification':proof})
            shutil.copytree(stage,output)
            return {'status':'HISTORICAL_AVAILABLE','cutoff':cutoff,'data_version':version,'qualification':proof}
    raise ValueError('No fully complete historical cutoff found within 15 calendar days')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--source',required=True);p.add_argument('--output',required=True);a=p.parse_args()
    # No previous publication is overwritten if historical qualification fails.
    print(json.dumps(build(a.base,a.source,a.output)))
