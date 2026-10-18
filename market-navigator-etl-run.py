"""Stage three ETL levels; promote a review package only after qualification.

The production evidence paths and accepted application are never destinations.
Failed work records a compact public run log and retains the qualified pointer.
"""
import argparse
import contextlib
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import tempfile

HERE=Path(__file__).resolve().parent
REVIEW=Path(os.environ.get('MARKET_NAVIGATOR_REVIEW_ROOT',str(HERE/'market-navigator-etl-review')))


def load(name):
    spec=importlib.util.spec_from_file_location(name.replace('-','_'),HERE/(name+'.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module


def read(path):return json.loads(Path(path).read_text(encoding='utf-8'))


def affected_indices(registry,changed):
    return [key for key,row in registry['indices'].items() if set(row['components'])&set(changed)]


def write(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    content=json.dumps(value,sort_keys=True,indent=2)+'\n'
    if path.exists() and path.read_text(encoding='utf-8')==content:return
    temporary=path.with_suffix(path.suffix+'.tmp');temporary.write_text(content,encoding='utf-8');temporary.replace(path)


@contextlib.contextmanager
def working(path):
    prior=Path.cwd();os.chdir(path)
    try:yield
    finally:os.chdir(prior)


@contextlib.contextmanager
def source_working_store(base):
    """Retain collected native state for retry without promoting application data."""
    stage=Path(os.environ.get('MARKET_NAVIGATOR_WORK_ROOT',str(HERE/'market-navigator-etl-work')))
    stage.mkdir(parents=True,exist_ok=True)
    if not (stage/'market-evidence').exists():shutil.copytree(base/'market-evidence',stage/'market-evidence')
    if not (stage/'data').exists():shutil.copytree(base/'data',stage/'data')
    # Publication rules and catalog belong to the current implementation;
    # retained observations and availability events survive failed attempts.
    for name in ('data-catalog.json','publication-rules.json','fund-provider-policy.json','fund-provider-qualification.json'):
        shutil.copy2(HERE/'data/market-backend'/name,stage/'data/market-backend'/name)
    yield stage


def qualify(stage,collector,run):
    manifest=read(stage/'market-evidence/operational-manifest.json')
    if run['failed']:raise ValueError('Provider collection failed; see component errors')
    if not manifest['summary']['ready']:raise ValueError('; '.join(manifest['summary']['acceptanceBlockers']))
    catalog=read(stage/'data/market-backend/data-catalog.json')
    rules=read(stage/'data/market-backend/publication-rules.json')['rules']
    for meta in catalog['series']:
        if not meta.get('enabled',True):continue
        missing=manifest['series'].get(meta['id'],{}).get('missing_periods',[])
        if missing:raise ValueError(meta['id']+': missing native periods '+', '.join(missing[:10]))
        source=read(stage/'market-evidence/series'/(meta['id']+'.json'))
        allowed={(x['provider'],x['identifier']) for x in collector.chain_for(meta)}
        if (source['provider'],source['providerIdentifier']) not in allowed:raise ValueError(meta['id']+': source identity mismatch')
        native=read(stage/'market-evidence/source-observations'/(meta['id']+'.json'))
        if (native['provider'],native['providerIdentifier'],native['cadence'])!=(source['provider'],source['providerIdentifier'],meta.get('native_cadence')):raise ValueError(meta['id']+': Level 0 identity mismatch')
        if collector.sha(native['observations'])!=native['sourceRevision']:raise ValueError(meta['id']+': Level 0 revision mismatch')
        calculated=collector.yoy(native['observations']) if 'year-over-year percent change' in (meta.get('transformation') or '').lower() else native['observations']
        if collector.canon(calculated)!=collector.canon(source['observations']):raise ValueError(meta['id']+': Level 0 transformation differs from canonical series')
        expected=collector._scheduler.expectation(meta,collector.now(),rules)['period']
        if expected and collector._scheduler.date_of(source['last'])<collector._scheduler.date_of(expected):
            raise ValueError(meta['id']+': provider has not supplied expected period '+expected)
    persistent=read(stage/'market-evidence/persistent-indices-v1.json')
    registry=read(stage/'data/market-backend/component-registry-v1.json')
    for index,definition in registry['indices'].items():
        row=persistent['indices'][index]
        if row['components']!=definition['components'] or len(row['components'])!=7:raise ValueError(index+': governed constituents changed')


def package(stage):
    paths=list((stage/'market-evidence').glob('*.json'))
    paths+=list((stage/'market-evidence/series').glob('*.json'))
    paths+=list((stage/'market-evidence/source-observations').glob('*.json'))
    paths+=list((stage/'market-evidence/reports').glob('*.json'))
    paths+=list((stage/'market-evidence/vintage').glob('*.json'))
    paths+=list((stage/'data/market-backend').glob('*.json'))
    inventory={str(p.relative_to(stage)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths)}
    version=hashlib.sha256(json.dumps(inventory,sort_keys=True).encode()).hexdigest()
    destination=REVIEW/'versions'/version
    for logical in inventory:
        target=destination/logical;target.parent.mkdir(parents=True,exist_ok=True)
        if target.exists() and target.read_bytes()!=(stage/logical).read_bytes():raise ValueError('Immutable review version differs')
        if not target.exists():shutil.copy2(stage/logical,target)
    descriptor={'schema':'market-navigator-etl-package-v1','qualified':True,'version':version,'resources':inventory}
    write(destination/'package.json',descriptor)
    pointer={'schema':'market-navigator-etl-channel-v1','version':version,'package':'versions/'+version+'/package.json',
             'sha256':hashlib.sha256((destination/'package.json').read_bytes()).hexdigest()}
    write(REVIEW/'channel.json',pointer)
    return version


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--component',default='');parser.add_argument('--retry-stream',action='store_true')
    parser.add_argument('--historical-rebuild',action='store_true');args=parser.parse_args()
    os.environ['MARKET_NAVIGATOR_RETRY_COMPONENT']=args.component
    os.environ['MARKET_NAVIGATOR_RETRY_STREAM']='true' if args.retry_stream else 'false'
    os.environ['MARKET_NAVIGATOR_BOOTSTRAP']='true' if args.historical_rebuild else 'false'
    collector=load('market-navigator-r7-data-pipeline');at=collector.iso()
    previous=read(REVIEW/'channel.json') if (REVIEW/'channel.json').exists() else None
    base=REVIEW/'versions'/previous['version'] if previous else HERE
    run={'at':at,'workflow':(os.environ.get('GITHUB_SERVER_URL','https://github.com')+'/'+os.environ.get('GITHUB_REPOSITORY','acmeproducts/stuff')+'/actions/runs/'+os.environ['GITHUB_RUN_ID']) if os.environ.get('GITHUB_RUN_ID') else None,
         'source_commit':os.environ.get('GITHUB_SHA'),'mode':'historical-rebuild' if args.historical_rebuild else ('component-retry' if args.component else 'stream-retry'),
         'components':[],'result':'failed','failed':0,'success':0,'skipped':0,'published_version':previous['version'] if previous else None}
    error=None
    with source_working_store(base) as stage:
        # Vintage sidecars are source state, not chart resources. Retain their
        # prior qualified history when loading an existing chart package.
        try:
            with working(stage):
                if not (stage/'market-evidence/vintage/manifest.json').exists():
                    os.environ['MARKET_NAVIGATOR_VINTAGE_RESUME']='1'
                    vintage=load('market-navigator-vintage-sidecar')
                    if not vintage.KEY:raise RuntimeError('Governed ALFRED baseline sidecars are absent from this checkout and MARKET_NAVIGATOR_FRED_API_KEY is unavailable. Restore qualified sidecars or configure that repository secret; current FRED CSV values cannot replace historical availability events.')
                    vintage.main()
                collector.main()
                collected=read(stage/'market-evidence/run-log.json')['runs'][-1]
                run.update({key:collected[key] for key in ('components','failed','success','skipped')})
                changed=[c['id'] for c in run['components'] if c.get('changed')]
                if run['failed']:raise ValueError('Provider collection failed')
                due=[c['id'] for c in run['components'] if c['status']=='success']
                if due:
                    changed=list(set(changed)|set(load('market-navigator-etl-vintage').update(due,read,write,at,collector)))
                registry=read(stage/'data/market-backend/component-registry-v1.json')
                affected=affected_indices(registry,changed)
                run['recalculated_indices']=affected
                if affected:
                    load('market-navigator-vintage-audit').main()
                    os.environ['MARKET_NAVIGATOR_AFFECTED_INDICES']=','.join(affected)
                    load('market-navigator-build-persistent-indices').main()
                    load('market-navigator-build-persistent-compat').main()
                load('market-navigator-r7-health').main()
                load('market-navigator-persistent-index-qa').main()
                qualify(stage,collector,run)
                run['missing_observations']=sum(len(s.get('missing_periods',[])) for s in read(stage/'market-evidence/operational-manifest.json')['series'].values())
                if not previous:
                    # The first review cannot inherit source qualification
                    # from a saved arithmetic fixture. Compare every retained
                    # native period against the exact approved provider.
                    import concurrent.futures
                    auditor=load('market-navigator-etl-source-audit');auditor.HERE=stage
                    catalog=read(stage/'data/market-backend/data-catalog.json')
                    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
                        rows=list(pool.map(auditor.audit,[m for m in catalog['series'] if m.get('enabled',True)]))
                    run['historical_source_comparison']=[{'id':x['id'],'status':x['status'],'compared':x.get('comparedPeriods'),
                        'changed':x.get('changedPeriods'),'missing':len(x.get('missingInStored',[])),
                        'provider_unavailable_periods':len(x.get('absentFromProvider',[])),
                        'retained_history':x.get('retainedHistory'),'error':x.get('error')} for x in rows]
                    if any(x['status'] not in ('matches','matches-with-approved-backcast') for x in rows):raise ValueError('Full historical source baseline did not qualify; inspect historical_source_comparison. Retained provider omissions require exact approved archival evidence.')
                metadata_changed=not previous or any(read(stage/'data/market-backend'/name)!=read(base/'data/market-backend'/name) for name in ('data-catalog.json','publication-rules.json','fund-provider-policy.json','fund-provider-qualification.json'))
                run['metadata_changed']=metadata_changed
                run['published_version']=package(stage) if changed or metadata_changed or not previous else previous['version'];run['result']='qualified'
        except Exception as exc:
            error=str(exc);run['error']=error
    path=REVIEW/'market-evidence/run-log.json'
    history=read(path) if path.exists() else {'schema':'market-navigator-run-log-v1','runs':[]}
    history['runs']=(history['runs']+[run])[-90:];write(path,history)
    print(json.dumps(run,indent=2))
    if error:raise SystemExit(1)


if __name__=='__main__':main()
