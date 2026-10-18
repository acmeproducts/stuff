import importlib.util, tempfile, json, os, datetime as dt
from pathlib import Path
from unittest.mock import patch
p=Path(__file__).with_name('market-navigator-r7-data-pipeline.py')
spec=importlib.util.spec_from_file_location('r7',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def ms(date):
 return int(dt.datetime.fromisoformat(date).replace(tzinfo=dt.timezone.utc).timestamp()*1000)
def obj(sid):
 pts=[{'t':ms('2016-01-01'),'v':10},{'t':ms('2026-10-14'),'v':11}]
 return {'schema':'market-navigator-evidence-series-v1','id':sid,'provider':'FRED','providerIdentifier':sid,'observations':pts,'count':len(pts),'first':pts[0]['t'],'last':pts[-1]['t'],'sourceRevision':'prior','last_successful':'2026-10-14T00:00:00Z','last_attempted':'2026-10-14T00:00:00Z'}
with tempfile.TemporaryDirectory() as d:
 root=Path(d);(root/'data/market-backend').mkdir(parents=True)
 (root/'market-evidence/series').mkdir(parents=True);(root/'market-evidence/reports').mkdir(parents=True)
 cat={'schema':'market-navigator-data-catalog-v1','canonical_horizons':['1D','5D','MTD','YTD','1YR','3YR','5YR'],'bootstrap_policy':{'minimum_history_years':6},'series':[{'id':sid,'enabled':True,'required':True,'native_cadence':'monthly' if sid=='cpi' else 'daily','provider':'FRED','provider_identifier':sid,'supported_horizons':['1D']} for sid in ['cpi','spy']]}
 (root/'data/market-backend/data-catalog.json').write_text(json.dumps(cat))
 (root/'data/market-backend/publication-rules.json').write_text(json.dumps({'rules':{'cpi':{'available_by_day_of_month':15}}}))
 for sid in ['cpi','spy']:
  (root/f'market-evidence/series/{sid}.json').write_text(json.dumps(obj(sid)))
  (root/f'market-evidence/reports/{sid}.json').write_text(json.dumps({'reports':{'1D':{'ready':True}},'computedRevision':'saved-report-revision'}))
 old=Path.cwd()
 clock=dt.datetime(2026,10,16,23,0,tzinfo=dt.timezone.utc)
 try:
  os.chdir(root)
  m.RETRY_COMPONENT='cpi';m.BOOT=False
  spy_old=obj('spy');spy_old['last_attempted']='2026-10-16T00:00:00Z'
  (root/'market-evidence/series/spy.json').write_text(json.dumps(spy_old))
  with patch.object(m,'now',return_value=clock),patch.object(m,'fetch_source',return_value=([{'t':ms('2026-09-01'),'v':12}],200)):
   m.main()
  log=json.loads((root/'market-evidence/run-log.json').read_text())
  assert len(log['runs'])==1
  status={x['id']:x['status'] for x in log['runs'][0]['components']}
  assert status=={'cpi':'success','spy':'skipped'},status
  assert json.loads((root/'market-evidence/reports/spy.json').read_text())['computedRevision']=='saved-report-revision'
  assert json.loads((root/'market-evidence/series/spy.json').read_text())==spy_old
  m.RETRY_COMPONENT=''
  with patch.object(m,'now',return_value=clock),patch.object(m,'fetch_source',side_effect=AssertionError('unexpected source fetch')):
   m.main()
  log=json.loads((root/'market-evidence/run-log.json').read_text())
  assert len(log['runs'])==2
  assert all(x['status'] in ('skipped','not due') for x in log['runs'][-1]['components'])
 finally:
  os.chdir(old)
print('PASS isolated component retry, unchanged skipped data, and no-fetch second run')
