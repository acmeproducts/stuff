"""Exercise actual governed recollection against an isolated stale QQQ fixture."""
import datetime as dt,importlib.util,json,shutil
from pathlib import Path
BASE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('mn_worker',BASE/'market-navigator-rebuild-worker.py');worker=importlib.util.module_from_spec(spec);spec.loader.exec_module(worker);h=worker.h
fault=BASE/'market-navigator-rebuild-live-fault';store=BASE/'market-navigator-rebuild-live-fault-generations'
if not fault.exists():shutil.copytree(BASE/'market-navigator-rebuild-data',fault)
elif (BASE/'market-navigator-rebuild-evidence/live-recovery.json').exists():raise SystemExit('Completed run is preserved; choose a new fixture name.')
path=fault/'market-evidence/series/qqq.json';source=h.read(path);source['observations']=[p for p in source['observations'] if h.calendar(p['t'])<='2026-09-22'];source.update(last=source['observations'][-1]['t'],count=len(source['observations']),sourceRevision=h.digest(source['observations']))
h.write(path,source)
path=fault/'market-evidence/reports/qqq.json';report=h.read(path)
for item in report['reports'].values():item['source_revision']=source['sourceRevision']
h.write(path,report)
before=worker.audit(fault)
assert before['series']['qqq']['status']=='stale' and not before['summary']['ready']
repaired=worker.publish(fault,store,collect=True)
after=worker.audit(Path(repaired['generation']))
assert after['summary']['ready'] and after['series']['qqq']['status']=='current'
new_source=h.read(Path(repaired['generation'])/'market-evidence/series/qqq.json')
assert h.calendar(new_source['last'])=='2026-10-07'
assert h.read(fault/'market-evidence/series/qqq.json')['last']==source['last'],'Damaged fixture is preserved as evidence'
result={'schema':'market-navigator-live-recovery-proof-v1','fault':'QQQ retains old September 22 observations despite a recent successful heartbeat','before':before['series']['qqq'],'after':after['series']['qqq'],'repairedNativeDate':h.calendar(new_source['last']),'generation':repaired['revision'],'workerActuallyCollected':True,'fiveDayCoverage':h.read(Path(repaired['generation'])/'market-evidence/rebuild-proof.json')['fiveDayCoverage'],'originalFaultPreserved':True,'remainingFindings':after['findings']}
h.write(BASE/'market-navigator-rebuild-evidence/live-recovery.json',result);print(json.dumps(result,indent=2))
