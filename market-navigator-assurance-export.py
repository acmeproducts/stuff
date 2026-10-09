"""Publish an isolated static review from a qualified generation; retain prior generations."""
import argparse,hashlib,json,shutil
from pathlib import Path
BASE=Path(__file__).resolve().parent

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def export(store,destination):
    store=Path(store);destination=Path(destination);status=json.loads((store/'assurance-status.json').read_text(encoding='utf-8-sig'))
    pointer=json.loads((store/'current.json').read_text());name=pointer['generation']
    if len(name)!=31 or not name.startswith('generation-') or any(c not in '0123456789abcdef' for c in name[11:]):raise ValueError('Invalid generation')
    source=store/name;baseline_days=[json.loads(p.read_text())['calendarDate'] for p in (BASE/'market-navigator-rebuild-data/market-evidence/collection-archive/receipts').glob('*.json')];cutoff=max(baseline_days) if baseline_days else '2026-08-21'
    latest={}
    for path in (source/'market-evidence/collection-archive/receipts').glob('*.json'):
        receipt=json.loads(path.read_text());day=receipt['calendarDate']
        if day>cutoff and (day not in latest or receipt['knownBy']>latest[day][1]['knownBy']):latest[day]=(path,receipt)
    archive_paths={p.relative_to(source).as_posix() for p,_ in latest.values()}
    for _,receipt in latest.values():archive_paths.update('market-evidence/collection-archive/blobs/'+x['blob']+'.json' for x in receipt['provenance'].values())
    target=destination/'generations'/name;target.mkdir(parents=True,exist_ok=True);files={}
    for folder in ('market-evidence','data/market-backend'):
        for path in sorted((source/folder).rglob('*')):
            if not path.is_file() or path.suffix not in ('.json','.bin'):continue
            rel=path.relative_to(source).as_posix()
            if rel.startswith('market-evidence/collection-archive/') and rel not in archive_paths:continue
            out=target/rel;out.parent.mkdir(parents=True,exist_ok=True)
            if out.exists() and digest(out)!=digest(path):raise ValueError('Immutable public generation differs: '+rel)
            if not out.exists():shutil.copy2(path,out)
            files[rel]=digest(out)
    manifest={'schema':'market-navigator-delivery-manifest-v1','generation':name,'revision':pointer['revision'],'files':files}
    (target/'delivery-manifest.json').write_text(json.dumps(manifest,sort_keys=True),encoding='utf-8')
    destination.mkdir(parents=True,exist_ok=True)
    if (store/'assurance-events').exists():shutil.copytree(store/'assurance-events',destination/'assurance-events',dirs_exist_ok=True)
    for stem in ('candidate','custom'):
        html=(BASE/f'market-navigator-rebuild-{stem}.html').read_text(encoding='utf-8-sig')
        html=html.replace('<head>','<head><script src="market-navigator-assurance-broker.js"></script><script defer src="market-navigator-assurance-view.js"></script>',1)
        (destination/f'market-navigator-rebuild-{stem}.html').write_text(html,encoding='utf-8')
    for file in ('market-navigator-assurance-broker.js','market-navigator-assurance-view.js'):shutil.copy2(BASE/file,destination/file)
    (destination/'index.html').write_text('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Market Navigator data assurance</title><script defer src="market-navigator-assurance-view.js"></script></head><body style="background:#081321;color:#e6edf5;font:16px system-ui"><main><h1>Market Navigator Â· Step zero</h1><p>Live source verification and repair evidence. Source limitations are explicit; retained history is preserved.</p><p><a style="color:#27d3f5" href="market-navigator-rebuild-candidate.html">Open Market Navigator</a> Â· <a style="color:#27d3f5" href="market-navigator-rebuild-custom.html">Custom displays</a></p></main></body></html>',encoding='utf-8')
    # All immutable assets and app scripts are complete before the status pointer.
    status['deliveryManifest']=f'generations/{name}/delivery-manifest.json'
    temporary=destination/'assurance-status.pending.json';temporary.write_text(json.dumps(status,sort_keys=True),encoding='utf-8');temporary.replace(destination/'assurance-status.json')
    return {'generation':name,'files':len(files),'bytes':sum((target/rel).stat().st_size for rel in files),'destination':str(destination)}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--store',required=True);p.add_argument('--destination',required=True);args=p.parse_args();print(json.dumps(export(args.store,args.destination)))
