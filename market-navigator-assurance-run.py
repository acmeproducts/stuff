"""One durable full-corpus recovery attempt, with outcome available even on failure."""
import argparse,datetime as dt,importlib.util,json,os,shutil,sys,uuid
from pathlib import Path
BASE=Path(__file__).resolve().parent

def load(name,file):
    spec=importlib.util.spec_from_file_location(name,BASE/file);obj=importlib.util.module_from_spec(spec);spec.loader.exec_module(obj);return obj
w=load('mn_assurance_worker','market-navigator-rebuild-worker.py');a=w.assurance;h=w.h

def run(root,store):
    root=Path(root).resolve();store=Path(store).resolve();store.mkdir(parents=True,exist_ok=True)
    status_path=store/'assurance-status.json';prior=h.read(status_path) if status_path.exists() else None
    pointer_path=store/'current.json';pointer=h.read(pointer_path) if pointer_path.exists() else None
    attempt=a.event(store,'repair-started',priorGeneration=pointer,sourceRoot=root.name)
    status={'schema':'market-navigator-operational-assurance-v1','state':'repairing','heartbeatAt':attempt['at'],'attemptId':attempt['id'],'lastAttempt':attempt,'lastSuccess':prior.get('lastSuccess') if prior else None,'generation':pointer,'assurance':prior.get('assurance') if prior else None,'retryAfterSeconds':1800}
    h.write(status_path,status)
    try:
        published=w.publish(root,store,collect=True,strict_assurance=True)
        pointer=h.read(pointer_path);report=h.read(Path(published['generation'])/'market-evidence/data-assurance.json')
        outcome=a.event(store,'repair-qualified',attemptId=attempt['id'],generation=pointer,summary=report['summary'],changes={sid:r['sourceVerification'].get('changes',{}) for sid,r in report['series'].items()})
        status.update(state=report['state'],heartbeatAt=outcome['at'],lastSuccess=outcome,lastOutcome=outcome,generation=pointer,assurance=report)
        h.write(status_path,status);return status
    except Exception as error:
        outcome=a.event(store,'repair-failed',attemptId=attempt['id'],error=str(error),retainedGeneration=pointer)
        stages=sorted(store.glob('working-*'),key=lambda p:p.stat().st_mtime)
        failed_report=None
        if stages and (stages[-1]/'market-evidence/data-assurance.json').exists():failed_report=h.read(stages[-1]/'market-evidence/data-assurance.json')
        status.update(state='needs-attention',heartbeatAt=outcome['at'],lastOutcome=outcome,attemptAssurance=failed_report,error=str(error))
        h.write(status_path,status);return status

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root',required=True);parser.add_argument('--store',required=True);args=parser.parse_args()
    result=run(args.root,args.store);print(json.dumps({'state':result['state'],'generation':result['generation'],'error':result.get('error')},indent=2));sys.exit(0 if result['state'].startswith('verified') else 1)
