import importlib.util
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('vintage',Path(__file__).with_name('market-navigator-etl-vintage.py'))
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)

class Vintage(unittest.TestCase):
    def test_revision_preserves_prior_known_state(self):
        original={'observationDate':'2026-08-01','availableFrom':'2026-09-01','availableUntil':'9999-12-31','value':10,'isInitialRelease':True,'isRevision':False}
        prior={'events':[original]}
        rows=[{'date':'2026-08-01','realtime_start':'2026-09-23','realtime_end':'2026-09-29','value':'10'},
              {'date':'2026-08-01','realtime_start':'2026-09-30','realtime_end':'9999-12-31','value':'11'}]
        result=v.extend(prior,rows)
        self.assertEqual(len(result),2)
        self.assertEqual(result[0]['value'],10)
        self.assertEqual(result[0]['availableUntil'],'2026-09-29')
        self.assertEqual(result[1]['availableFrom'],'2026-09-30')
        self.assertTrue(result[1]['isRevision'])
        self.assertEqual(prior['events'][0]['availableUntil'],'9999-12-31')
        self.assertEqual(v.extend({'events':result},rows),result)

    def test_conflicting_same_release_fails(self):
        prior={'events':[{'observationDate':'2026-08-01','availableFrom':'2026-09-01','value':10}]}
        with self.assertRaises(ValueError):v.extend(prior,[{'date':'2026-08-01','realtime_start':'2026-09-01','value':'11','realtime_end':'9999-12-31'}])

if __name__=='__main__':unittest.main()
