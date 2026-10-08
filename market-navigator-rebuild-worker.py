"""Collect, recover and qualify before atomically publishing a data generation.

All previous generations and collected receipts are preserved. Readers pin one
generation, so collection cannot expose half-updated native and index evidence.
"""
import argparse,datetime as dt,importlib.util,json,math,os,shutil,subprocess,sys,uuid
from pathlib import Path
BASE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('mn_rebuild_history',BASE/'market-navigator-rebuild-history.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
spec=importlib.util.spec_from_file_location('mn_rebuild_archives',BASE/'market-navigator-rebuild-archives.py');archives=importlib.util.module_from_spec(spec);spec.loader.exec_module(archives)

def audit(root,now=None):
    root=Path(root);now=now or dt.datetime.now(h.UTC)
    cat=h.read(root/'data/market-backend/data-catalog.json');rules=h.read(root/'data/market-backend/publication-rules.json');registry=h.read(root/'data/market-backend/component-registry-v1.json')
    model=h.read(root/'market-evidence/persistent-indices-v1.json');derived=h.read(root/'market-evidence/derived-indices-persistent-v1.json')
    if h.blob((root/'data/market-backend/component-registry-v1.json').read_bytes())!=h.REGISTRY_BLOB:raise ValueError('Frozen governed registry changed')
    required={x['id'] for x in registry['components']};series={};findings=[];files={}
    for meta in cat['series']:
        if not meta.get('enabled',True):continue
        sid=meta['id'];path=root/'market-evidence/series'/f'{sid}.json'
        try:
            source=h.read(path);h.validate_source(source,sid,{sid:meta},now)
            status,expected,why=h.policy.freshness(meta,source,cat,rules,now)
            report=h.read(root/'market-evidence/reports'/f'{sid}.json')
            if report.get('id')!=sid or any(x.get('source_revision')!=source['sourceRevision'] for x in report['reports'].values()):raise ValueError('Report/native source revision differs')
        except (ValueError,KeyError,OSError,TypeError) as error:status='failed';expected=None;why=str(error)
        series[sid]={'status':status,'expectedNativePeriod':expected,'why':why,'requiredForIndices':sid in required}
        if status!='current':findings.append({'id':sid,'status':status,'blocking':sid in required,'why':why})
    # Derivation and original history are independently rechecked on admission.
    seed=h.read(BASE/'market-navigator-rebuild-seed.json')
    if h.blob((BASE/'market-navigator-rebuild-seed.json').read_bytes())!=h.BASELINE_BLOB:raise ValueError('Immutable original model changed')
    transforms={x['id']:x for x in registry['components']}
    for key,row in model['indices'].items():
        original=seed['indices'][key];n=len(original['dates'])
        for field in ('dates','timestamps','values'):
            if row[field][:n]!=original[field]:raise ValueError('Original published vector changed: '+key)
        for field in ('componentValues','componentSignals','componentObservationDates'):
            for sid,values in original[field].items():
                if row[field][sid][:n]!=values:raise ValueError('Original component history changed: '+sid)
        expected=[str(dt.date.fromisoformat(original['dates'][-1])+dt.timedelta(days=i)) for i in range(1,(dt.date.fromisoformat(row['dates'][-1])-dt.date.fromisoformat(original['dates'][-1])).days+1)]
        if row['dates'][n:]!=expected:raise ValueError('Incomplete index history: '+key)
        if len(row.get('recoveredCalculations',[]))!=len(expected):raise ValueError('Recovered provenance missing: '+key)
        for i,receipt in enumerate(row['recoveredCalculations'],n):
            if receipt['calendarDate']!=row['dates'][i] or row['timestamps'][i]!=h.midnight(row['dates'][i]):raise ValueError('Index calendar/provenance mismatch')
            terms=[]
            for sid in row['components']:
                source=receipt['sources'][sid];value=row['componentValues'][sid][i];anchor=original['componentValues'][sid][0];rule=transforms[sid]
                if value!=source['nativeValue'] or row['componentObservationDates'][sid][i]!=source['observationDate']:raise ValueError('Recovered input/provenance mismatch: '+sid)
                change=math.log(value/anchor) if rule['transformFamily']=='log_return' else value-anchor
                signal=rule['direction']*change/rule['scale']['annualizedScale'];terms.append(signal)
                if not math.isclose(signal,row['componentSignals'][sid][i],rel_tol=0,abs_tol=1e-12):raise ValueError('Frozen component calculation mismatch: '+sid)
            if not math.isclose(100+math.fsum(terms)/7,row['values'][i],rel_tol=0,abs_tol=1e-12):raise ValueError('Frozen index calculation mismatch: '+key)
    if h.compatibility(model,registry)!=derived:raise ValueError('Index projection differs from qualified persistent model')
    last_expected=max(h.instant(h.read(root/'market-evidence/series'/f'{sid}.json')['last_successful']).date().isoformat() for sid in required)
    if derived['commonMarketAnchor']!=last_expected:raise ValueError('Index construction lags actual native collection')
    # Inventory retained legacy/research evidence too; it never supplies live data.
    for folder in ('market-evidence','data/market-backend'):
        for path in sorted((root/folder).rglob('*.json')):
            rel=path.relative_to(root).as_posix();payload=path.read_bytes();value=json.loads(payload)
            role='canonical-native' if rel.startswith('market-evidence/series/') else 'native-report' if rel.startswith('market-evidence/reports/') else 'collected-archive' if '/collection-archive/' in rel else 'qualified-index' if path.name in ('persistent-indices-v1.json','derived-indices-persistent-v1.json') else 'retained-reference'
            files[rel]={'blob':h.blob(payload),'role':role,'schema':value.get('schema') if isinstance(value,dict) else None,'bytes':len(payload)}
    ready=not any(x['blocking'] for x in findings)
    return {'schema':'market-navigator-rebuild-admission-v1','generatedAt':now.isoformat(),'anchor':derived['commonMarketAnchor'],'series':series,'findings':findings,'files':files,'summary':{'ready':ready,'series':len(series),'current':sum(x['status']=='current' for x in series.values()),'files':len(files),'requiredCurrent':all(series[sid]['status']=='current' for sid in required)},'rule':'Complete recovered history, native cadence, collector heartbeat and report/index coherence qualify together.'}

def publish(root,store,collect=False,archive=None,inventory=None):
    root=Path(root).resolve();store=Path(store).resolve();store.mkdir(parents=True,exist_ok=True)
    stage=store/('working-'+uuid.uuid4().hex);stage.mkdir()
    for folder in ('market-evidence','data/market-backend'):shutil.copytree(root/folder,stage/folder)
    for name in ('market-navigator-r7-data-pipeline.py','market-navigator-r7-health.py','market-navigator-source-state.py','market-navigator-rebuild-transforms.py','market-navigator-rebuild-policy.py'):
        shutil.copy2(root/name if (root/name).exists() else BASE/name,stage/name)
    if collect:
        environment=dict(os.environ,MARKET_NAVIGATOR_BOOTSTRAP='false',MARKET_NAVIGATOR_SERIES_IDS='')
        result=subprocess.run([sys.executable,'market-navigator-r7-data-pipeline.py'],cwd=stage,env=environment,text=True,capture_output=True,timeout=180)
        (stage/'collector-result.txt').write_text(result.stdout+'\n'+result.stderr)
        if result.returncode:raise ValueError('Required canonical collection failed; previous generation retained. '+result.stdout[-2000:])
    archive=Path(archive or BASE/'market-navigator-rebuild-archive');inventory=Path(inventory or BASE/'market-navigator-rebuild-archive-inventory.json')
    registry=h.read(stage/'data/market-backend/component-registry-v1.json');ids=[x['id'] for x in registry['components']]
    seed_path=BASE/'market-navigator-rebuild-seed.json';seed=h.read(seed_path)
    first=min(x['dates'][-1] for x in seed['indices'].values());last=max(h.instant(h.read(stage/'market-evidence/series'/f'{sid}.json')['last_successful']).date().isoformat() for sid in ids)
    receipt_days={h.read(p)['calendarDate'] for p in (stage/'market-evidence/collection-archive/receipts').glob('*.json')}
    needed={str(dt.date.fromisoformat(first)+dt.timedelta(days=i)) for i in range(1,(dt.date.fromisoformat(last)-dt.date.fromisoformat(first)).days)}-receipt_days
    runtime_inventory=store/'archive-inventory.json'
    catalog=h.read(stage/'data/market-backend/data-catalog.json');metas={x['id']:x for x in catalog['series']};rules=h.read(stage/'data/market-backend/publication-rules.json')
    def qualify_archive(entry):h.verify_cadence(h.archive_capture(entry,archive/'blobs',metas,ids),metas,catalog,rules)
    entries=archives.ensure_days(runtime_inventory if runtime_inventory.exists() and inventory.name=='market-navigator-rebuild-archive-inventory.json' else inventory,archive,needed,ids,qualify_archive)
    h.write(runtime_inventory,entries)
    h.build(stage,archive,seed_path,runtime_inventory)
    subprocess.run([sys.executable,'market-navigator-r7-health.py'],cwd=stage,check=True,capture_output=True,timeout=30)
    report=audit(stage)
    if not report['summary']['ready']:raise ValueError('New generation failed admission; previous generation retained.')
    h.write(stage/'market-evidence/rebuild-admission.json',report)
    revision=h.digest({'files':report['files'],'anchor':report['anchor']})[:20];generation=store/('generation-'+revision)
    if not generation.exists():stage.rename(generation)
    # Pointer replacement is the sole publication mutation. Never delete checkpoints.
    h.write(store/'current.json',{'generation':generation.name,'revision':revision,'anchor':report['anchor'],'qualifiedAt':report['generatedAt']})
    return {'revision':revision,'generation':str(generation),'summary':report['summary'],'findings':report['findings']}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root',default='market-navigator-rebuild-data');parser.add_argument('--store',default='market-navigator-rebuild-generations');parser.add_argument('--collect',action='store_true');parser.add_argument('--audit',action='store_true');args=parser.parse_args()
    try:print(json.dumps(audit(args.root) if args.audit else publish(args.root,args.store,args.collect),indent=2))
    except Exception as error:print(json.dumps({'ready':False,'error':str(error)}));sys.exit(1)
