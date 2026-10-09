"""Hosted refresh entry point. Overlay the last public generation onto the retained rebuild base."""
import argparse,importlib.util,json,shutil,uuid
from pathlib import Path
BASE=Path(__file__).resolve().parent

def load(name,file):
    spec=importlib.util.spec_from_file_location(name,BASE/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
r=load('hosted_assurance_run','market-navigator-assurance-run.py');e=load('hosted_assurance_export','market-navigator-assurance-export.py')

def refresh(destination,store):
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
    result=r.run(stage,store)
    if result['generation']:
        proof=e.export(store,destination)
    else:
        destination.mkdir(parents=True,exist_ok=True);shutil.copy2(store/'assurance-status.json',destination/'assurance-status.json');proof={'generation':None,'state':result['state']}
    print(json.dumps({'state':result['state'],'delivery':proof,'error':result.get('error')},indent=2))
    return result['state'].startswith('verified')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--destination',required=True);p.add_argument('--store',required=True);args=p.parse_args();raise SystemExit(0 if refresh(args.destination,args.store) else 1)
