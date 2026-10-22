"""One closing-day batch, due by 06:00 America/Los_Angeles the next day."""
import argparse,datetime as dt,json,os,shutil,tempfile
from pathlib import Path
from zoneinfo import ZoneInfo
import run as s
import historical

ZONE='America/Los_Angeles'
POLICY='daily-close-batch-v1'
def deadline(day):
    return dt.datetime.combine(dt.date.fromisoformat(day)+dt.timedelta(days=1),dt.time(6),ZoneInfo(ZONE))
def contract(now,closed,cutoff,closed_days):
    due=max((day for day in closed_days if deadline(day)<=now),default=None)
    state='LATE' if due and cutoff<due else 'READY' if cutoff>=closed else 'WAITING'
    calendar=s.load('market-navigator-etl-schedule');next_day=dt.date.fromisoformat(cutoff)+dt.timedelta(days=1)
    while next_day.weekday()>4 or next_day.isoformat() in calendar.MARKET_CLOSED:next_day+=dt.timedelta(days=1)
    if next_day.year!=2026:raise ValueError('Official market calendar requires refresh')
    return {'policy':POLICY,'timezone':ZONE,'deadlineLocal':'06:00','requestedDate':closed,'dueDate':due,'servingDate':cutoff,'deliveryDeadline':deadline(closed).isoformat(),'state':state,'lastCompleteBatchServed':True,'nextBatchDate':next_day.isoformat(),'nextDeliveryDeadline':deadline(next_day.isoformat()).isoformat()}
def market_days(now,root):
    scheduler=s.load('market-navigator-r7-data-pipeline')._scheduler
    catalog=s.read(root/'data/market-backend/data-catalog.json')
    clock=next(m for m in catalog['series'] if m['id']=='spy')
    rules=s.read(root/'data/market-backend/publication-rules.json')['rules']
    closed=scheduler.expectation(clock,now,rules)['period']
    if not closed:raise ValueError('No completed closing-day batch date')
    day=dt.date.fromisoformat(closed);days=[]
    for _ in range(20):
        if day.year!=2026:raise ValueError('Official market calendar requires refresh')
        if day.weekday()<5 and day.isoformat() not in scheduler.MARKET_CLOSED:days.append(day.isoformat())
        day-=dt.timedelta(days=1)
    return closed,days
def publish_receipt(output,now,closed,days,collection):
    root=output/'market-navigator-rebuild-data'
    doc=s.read(root/'market-evidence/sync-proof.json');proof=doc['qualification'];fresh=proof['freshness']
    if proof['status']!='PASS' or fresh['status']!='PASS':raise ValueError('Batch qualification failed')
    cutoff=fresh['marketDate']
    if any(r['cadence'] in ('daily','trading-day','daily-nav') and (r['latest']!=cutoff or r['required']!=cutoff or r['missingMarketSessions']) for r in fresh['sources']):raise ValueError('Mixed-date daily batch')
    batch=contract(now,closed,cutoff,days)
    fresh.update(scope='daily-batch',validUntil=None,batch=batch,checkedAt=now.isoformat())
    doc.pop('historical',None);doc.update(batch=batch,collection=collection)
    proof['sourceProofMode']='independently verified retained provider responses; complete closing-day batch'
    s.write(root/'market-evidence/sync-proof.json',doc)
    health=s.read(root/'market-evidence/health-envelope.json')
    for row in health['series'].values():
        row.update(classification='verified-batch',why='Complete verified closing-day batch through '+cutoff)
    health.update(batch=batch);s.write(root/'market-evidence/health-envelope.json',health)
    for path in ['market-evidence/operational-manifest.json','data/market-backend/source-registry.json']:
        p=root/path
        if not p.exists():continue
        doc_scope=s.read(p);doc_scope.pop('historicalCutoff',None);doc_scope['batch']=batch
        for row in doc_scope.get('series',{}).values():row['status']='verified-batch'
        for row in doc_scope.get('registrations',[]):row['healthClassification']='verified-batch'
        s.write(p,doc_scope)
    resources={str(p.relative_to(root)).replace('\\','/'):s.hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.rglob('*')) if p.is_file() and p.name!='package.json'}
    version=s.digest(resources);s.write(root/'package.json',{'schema':'market-navigator-etl-package-v1','qualified':True,'version':version,'resources':resources})
    s.write(output/'connection.json',{'status':'PASS','application_blob':s.APP,'approved_baseline_blob':'ee38d9c9da9af4b2795695a39519c76e6c5e5239','data_version':version,'batch':batch,'qualification':proof,'jobstream_ui':True})
    return {'status':'PASS','unchanged':False,'version':version,'batch':batch,'collection':collection,'qualification':proof,'run':os.environ.get('GITHUB_SERVER_URL','https://github.com')+'/'+os.environ.get('GITHUB_REPOSITORY','acmeproducts/stuff')+'/actions/runs/'+os.environ.get('GITHUB_RUN_ID','local')}
def verified_previous(base):
    found=[]
    for candidate in (base,base/'previous'):
        root=candidate/'market-navigator-rebuild-data'
        try:
            descriptor=s.read(root/'package.json')
            if s.digest(descriptor['resources'])!=descriptor['version']:continue
            for path,digest in descriptor['resources'].items():
                target=(root/path).resolve()
                if not target.is_relative_to(root.resolve()) or s.hashlib.sha256(target.read_bytes()).hexdigest()!=digest:raise ValueError('Previous batch integrity failed')
            proof=s.read(root/'market-evidence/sync-proof.json')['qualification'];q=proof['freshness']
            if proof['status']=='PASS' and q['status']=='PASS' and q.get('scope') in ('daily-batch','explicit-historical'):found.append((q['marketDate'],candidate))
        except (OSError,ValueError,KeyError,TypeError):continue
    return max(found,key=lambda item:item[0]) if found else None
def synchronize(base,output,now=None,force=False):
    base,output=Path(base).resolve(),Path(output).resolve();now=now or dt.datetime.now(s.UTC)
    closed,days=market_days(now,base/'market-navigator-rebuild-data');previous=verified_previous(base)
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='mn-batch-',dir=output.parent) as tmp:
        stage=Path(tmp)/'collected';collection={'status':'PASS'}
        try:
            s.synchronize(base,stage,now,force)
            source=stage/'market-navigator-rebuild-data'
        except Exception as error:
            message=str(error)
            for name in ('MARKET_NAVIGATOR_FRED_API_KEY','MARKET_NAVIGATOR_FRED_API_KEY_SECONDARY'):
                key=os.environ.get(name)
                if key:message=message.replace(key,'[redacted]')
            collection={'status':'INCOMPLETE' if hasattr(error,'report') else 'ERROR','error':message}
            if hasattr(error,'report'):collection['freshness']=error.report
            candidates=sorted((Path(tmp)/'rejected-evidence').glob('*'))
            source=candidates[-1] if candidates else (previous[1] if previous else base)/'market-navigator-rebuild-data'
            # Keep the rejected native collection and raw provider captures for diagnosis.
            if candidates:shutil.copytree(source,output.parent/'rejected-evidence'/candidates[-1].name)
        candidate=Path(tmp)/'qualified'
        try:historical.build(base,source,candidate,now=now,latest_limit=closed)
        except Exception:
            # A bad new collection cannot replace a previously qualified batch.
            if candidate.exists():
                if candidate.resolve().parent!=Path(tmp).resolve():raise ValueError('Unexpected batch candidate path')
                shutil.rmtree(candidate)
            fallback=previous[1] if previous else base
            historical.build(base,fallback/'market-navigator-rebuild-data',candidate,now=now,latest_limit=closed)
        if previous and s.read(candidate/'connection.json').get('historicalCutoff',previous[0])<previous[0]:
            if candidate.resolve().parent!=Path(tmp).resolve():raise ValueError('Unexpected batch candidate path')
            shutil.rmtree(candidate)
            historical.build(base,previous[1]/'market-navigator-rebuild-data',candidate,now=now,latest_limit=closed)
        result=publish_receipt(candidate,now,closed,days,collection)
        if output.exists():raise ValueError('Batch output must be new')
        shutil.copytree(candidate,output)
        return result
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--base',required=True);parser.add_argument('--output',required=True);parser.add_argument('--force',action='store_true');args=parser.parse_args()
    try:result=synchronize(args.base,args.output,force=args.force)
    except Exception as error:
        s.write(Path(args.output).parent/'sync-status.json',{'status':'FAIL','error':str(error),'displayPermitted':False});raise
    s.write(Path(args.output).parent/'sync-status.json',result)
    print(json.dumps({key:result[key] for key in ('status','version','batch','collection')}))
if __name__=='__main__':main()
