import datetime as dt,unittest,importlib.util,json,tempfile,types
from unittest.mock import patch
from pathlib import Path
spec=importlib.util.spec_from_file_location('sync',Path(__file__).with_name('run.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ProbeTests(unittest.TestCase):
    def test_release_probe(self):
        now=dt.datetime(2026,10,20,15,30,tzinfo=dt.timezone.utc)
        source={'provider':'FRED','last':m.ms('2026-10-16'),'sourceVerifiedAt':'2026-10-20T13:00:00Z'}
        self.assertTrue(m.release_probe_due({'native_cadence':'daily'},source,now,'2026-10-19'))
        source['sourceVerifiedAt']='2026-10-20T15:00:00Z'
        self.assertFalse(m.release_probe_due({'native_cadence':'daily'},source,now,'2026-10-19'))
        source['sourceVerifiedAt']='2026-10-20T13:00:00Z'
        for cadence in ('weekly','monthly','trading-day'):
            self.assertFalse(m.release_probe_due({'native_cadence':cadence},source,now,'2026-10-19'))
        source['last']=m.ms('2026-10-19')
        self.assertFalse(m.release_probe_due({'native_cadence':'daily'},source,now,'2026-10-19'))
class CollectionProbeTests(unittest.TestCase):
    def test_scheduled_collection_fetches_new_release_and_coalesces(self):
        now=dt.datetime(2026,10,20,15,30,tzinfo=dt.timezone.utc)
        old=[{'t':m.ms('2026-10-15'),'v':3.23},{'t':m.ms('2026-10-16'),'v':3.31}]
        incoming=old+[{'t':m.ms('2026-10-19'),'v':3.29}]
        meta={'id':'hySpread','native_cadence':'daily','enabled':True}
        scheduler=types.SimpleNamespace(eligibility=lambda *a,**k:(False,'estimated not due'),expectation=lambda *a,**k:{'period':'2026-10-16'})
        collector=types.SimpleNamespace(get=lambda *a:None,chain_for=lambda meta:[{'provider':'FRED','identifier':'BAMLH0A0HYM2'}],_scheduler=scheduler,canon=lambda points:sorted(points,key=lambda p:p['t']))
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            m.write(root/'data/market-backend/data-catalog.json',{'series':[meta]})
            m.write(root/'data/market-backend/publication-rules.json',{'rules':{}})
            m.write(root/'market-evidence/derived-indices-persistent-v1.json',{'commonMarketAnchor':'2026-10-19'})
            m.write(root/'market-evidence/series/hySpread.json',{'id':'hySpread','provider':'FRED','providerIdentifier':'BAMLH0A0HYM2','last':m.ms('2026-10-16'),'sourceVerifiedAt':'2026-10-20T13:00:00Z','observations':old})
            m.write(root/'market-evidence/source-observations/hySpread.json',{'observations':old})
            calls=[]
            def fetch(*args):calls.append(1);return incoming
            with patch.object(m,'load',return_value=collector):
                rows=m.collect(root,now,force=False,fetch=fetch)
                self.assertEqual(calls,[1])
                self.assertEqual(rows[0]['addedDates'],['2026-10-19'])
                self.assertEqual(m.read(root/'market-evidence/series/hySpread.json')['observations'][-1],incoming[-1])
                rows=m.collect(root,now+dt.timedelta(minutes=30),force=False,fetch=fetch)
                self.assertEqual(rows[0]['status'],'not-due')
                self.assertEqual(calls,[1])
if __name__=='__main__':unittest.main()

