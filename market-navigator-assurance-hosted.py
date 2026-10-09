"""Hosted refresh entry point. Overlay the last public generation onto the retained rebuild base."""
import argparse,importlib.util,json,shutil,uuid
from pathlib import Path
BASE=Path(__file__).resolve().parent

def load(name,file):
    spec=importlib.util.spec_from_file_location(name,BASE/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
r=load('hosted_assurance_run','market-navigator-assurance-run.py');e=load('hosted_assurance_export','market-navigator-assurance-export.py')

def refresh(destination,store,qualify_recovery=False):
    destination=Path(destination).resolve();store=Path(store).resolve();stage=store/('hosted-input-'+uuid.uuid4().hex);stage.mkdir(parents=True)
    for folder in ('market-evidence','data/market-backend'):shutil.copytree(BASE/'market-navigator-rebuild-data'/folder,stage/folder)
    status_path=destination/'assurance-status.json'
    if status_path.exists():
        prior=json.loads(status_path.read_text());pointer=prior.get('generation')
        if pointer:
            name=pointer['generation']
            if len(name)!=31 or not name.startswith('generation-') or any(c not in '0123456789abcdef' for c in name[11:]):raise ValueError('Invalid previous generation')
            public=destination/'generations'/name
            for folder in ('market-evidence','data/market-backend'):shutil.copytree(public/folder,stage/folder,dirs_exist_ok=True)
            shutil.copytree(stage,store/name);r.h.write(store/'current.json',pointer)
        r.h.write(store/'assurance-status.json',prior)
        if (destination/'assurance-events').exists():shutil.copytree(destination/'assurance-events',store/'assurance-events',dirs_exist_ok=True)
    injected=None
    if qualify_recovery:
        path=stage/'market-evidence/series/qqq.json';source=r.h.read(path);by_date={r.h.calendar(p['t']):p for p in source['observations']};missing='2026-09-02';changed='2026-09-03';expected=by_date[changed]['v'];source['observations'].remove(by_date[missing]);by_date[changed]['v']=99999;source.update(count=len(source['observations']),sourceRevision=r.h.digest(source['observations']));r.h.write(path,source)
        path=stage/'market-evidence/series/spy.json';source=r.h.read(path);source['unit']='EUR';r.h.write(path,source)
        before=r.a.assess(stage,admission={'summary':{'ready':True,'validUntil':'2099-01-01T00:00:00+00:00'}})
        if before['series']['qqq']['status']!='needs-attention' or before['series']['spy']['status']!='needs-attention':raise ValueError('Hosted injected defects were not detected')
        injected={'schema':'market-navigator-hosted-recovery-fault-proof-v1','priorGeneration':pointer if status_path.exists() else None,'missingQQQDate':missing,'corruptQQQDate':changed,'expectedQQQValue':expected,'wrongSPYUnit':'EUR','detectedBeforeRepair':True,'damagedInputPreserved':stage.name}
    result=r.run(stage,store)
    if injected:
        if not result['state'].startswith('verified'):raise ValueError('Hosted injected defects did not recover: '+str(result.get('error')))
        qualified=store/result['generation']['generation'];qqq=r.h.read(qualified/'market-evidence/series/qqq.json');spy=r.h.read(qualified/'market-evidence/series/spy.json');by_date={r.h.calendar(p['t']):p for p in qqq['observations']}
        if injected['missingQQQDate'] not in by_date or by_date[injected['corruptQQQDate']]['v']!=injected['expectedQQQValue'] or spy['unit']!='USD':raise ValueError('Hosted repaired observations/units differ')
        injected.update(repairedGeneration=result['generation'],allDatasetsVerified=result['assurance']['summary']['verified'],missingObservationRestored=by_date[injected['missingQQQDate']]['v'],corruptValueRepaired=by_date[injected['corruptQQQDate']]['v'],spyUnitRepaired=spy['unit'],previousPublishedGenerationPreserved=not injected['priorGeneration'] or (destination/'generations'/injected['priorGeneration']['generation']).exists())
        r.h.write(store/'hosted-fault-proof.json',injected);r.h.write(destination/'hosted-fault-proof.json',injected)

    if result['generation']:
        proof=e.export(store,destination)
    else:
        destination.mkdir(parents=True,exist_ok=True);shutil.copy2(store/'assurance-status.json',destination/'assurance-status.json');proof={'generation':None,'state':result['state']}
    print(json.dumps({'state':result['state'],'delivery':proof,'error':result.get('error')},indent=2))
    return result['state'].startswith('verified')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--destination',required=True);p.add_argument('--store',required=True);p.add_argument('--qualify-recovery',action='store_true');args=p.parse_args();raise SystemExit(0 if refresh(args.destination,args.store,args.qualify_recovery) else 1)
