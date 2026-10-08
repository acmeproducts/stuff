"""Prepare an exact, owned-path-only data-foundation checkpoint manifest."""
import hashlib,json
from pathlib import Path

BASE=Path(__file__).resolve().parent
names=['MARKET-NAVIGATOR-DATA-FIRST-REBUILD.md','MARKET-NAVIGATOR-ROLLBACK-ASSESSMENT.md','market-navigator-rebuild-baseline.cjs','market-navigator-rebuild-baseline.html','market-navigator-rebuild-runtime.cjs','market-navigator-rebuild-history.py','market-navigator-rebuild-policy.py','market-navigator-rebuild-transforms.py','market-navigator-rebuild-worker.py','market-navigator-rebuild-archives.py','market-navigator-rebuild-fetch.py','market-navigator-rebuild-tests.py','market-navigator-rebuild-qa.cjs','market-navigator-rebuild-live-recovery.py','market-navigator-rebuild-package.py','market-navigator-rebuild-server.cjs','market-navigator-rebuild-seed.json','market-navigator-rebuild-archive-inventory.json','.github/workflows/market-navigator-rebuild.yml']
names.extend(p.relative_to(BASE).as_posix() for p in (BASE/'market-navigator-rebuild-data').rglob('*.json'))
names.extend('market-navigator-rebuild-data/'+name for name in ('market-navigator-r7-data-pipeline.py','market-navigator-r7-health.py','market-navigator-source-state.py','market-navigator-rebuild-transforms.py','market-navigator-rebuild-policy.py'))
names.extend('market-navigator-rebuild-evidence/'+name for name in ('baseline-data-qualification.json','live-recovery.json','corpus-admission.json','chromium-chrome-1440-data-first.png','chromium-chrome-1887-data-first.png','chromium-chrome-800-data-first.png','chromium-chrome-412-data-first.png'))
entries=[]
for name in sorted(set(names)):
    payload=(BASE/name).read_bytes()
    assert name.startswith(('market-navigator-rebuild','MARKET-NAVIGATOR-', '.github/workflows/market-navigator-rebuild'))
    entries.append({'path':name,'sha':hashlib.sha1(b'blob '+str(len(payload)).encode()+b'\0'+payload).hexdigest(),'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest()})
(BASE/'market-navigator-rebuild-package-manifest.json').write_text(json.dumps(entries,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':len(entries),'bytes':sum(e['bytes'] for e in entries),'stage':'qualified data on original Turn 28 chart; NOW extraction remains independent work in progress'}))
