import datetime as dt,unittest,importlib.util
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
if __name__=='__main__':unittest.main()
