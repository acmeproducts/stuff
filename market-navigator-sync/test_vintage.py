import importlib.util
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('vintage',Path(__file__).with_name('market-navigator-etl-vintage.py'))
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)

class Vintage(unittest.TestCase):
    def test_old_period_revision_updates_native_value_only_when_published(self):
        native=[{'t':946684800000,'v':10}]
        rows=[{'date':'2000-01-01','realtime_start':'2026-10-20','realtime_end':'9999-12-31','value':'12'},
              {'date':'2000-01-01','realtime_start':'2026-10-17','realtime_end':'2026-10-19','value':'11'}]
        self.assertEqual(v.current_revisions(native,rows,'2026-10-18T00:00:00Z'),[{'t':946684800000,'v':11}])
        self.assertEqual(native[0]['v'],10)

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


class ProviderResponse(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec=importlib.util.spec_from_file_location('response_sidecar',Path(__file__).with_name('market-navigator-vintage-sidecar.py'))
        cls.sidecar=importlib.util.module_from_spec(spec);spec.loader.exec_module(cls.sidecar)
    def test_maintenance_is_an_actionable_outage(self):
        with self.assertRaisesRegex(RuntimeError,'FRED_MAINTENANCE'):
            self.sidecar.decode_response(b'<!doctype html><html><title>Site Maintenance | St. Louis Fed</title></html>')
    def test_invalid_html_is_not_accepted_as_data(self):
        with self.assertRaisesRegex(RuntimeError,'FRED_INVALID_RESPONSE'):self.sidecar.decode_response(b'<html>upstream gateway failure</html>')
    def test_empty_response_is_not_accepted_as_data(self):
        with self.assertRaisesRegex(RuntimeError,'FRED_INVALID_RESPONSE'):self.sidecar.decode_response(b'')
    def test_valid_observations_remain_unchanged(self):
        self.assertEqual(self.sidecar.decode_response(b'{"observations":[{"date":"2026-10-19","value":"3"}]}'),{'observations':[{'date':'2026-10-19','value':'3'}]})

if __name__=='__main__':unittest.main()
