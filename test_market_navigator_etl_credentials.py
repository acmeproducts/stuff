import importlib.util
import io
from pathlib import Path
import unittest
from unittest.mock import patch
import urllib.error

spec=importlib.util.spec_from_file_location('fred_credentials',Path(__file__).with_name('market-navigator-vintage-sidecar.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class Credentials(unittest.TestCase):
    def test_primary_accepted_does_not_call_secondary(self):
        with patch.object(m,'KEY','primary-test'),patch.object(m,'KEYS',['primary-test','secondary-test']),patch.object(m.urllib.request,'urlopen') as fetch:
            fetch.return_value.__enter__.return_value.read.return_value=b'{"observations":[]}'
            self.assertEqual(m.get_json({'series_id':'DFF'}),{'observations':[]})
            self.assertEqual(fetch.call_count,1)

    def test_secondary_recovers_key_failure(self):
        failed=urllib.error.HTTPError('redacted',429,'rate limited',{},io.BytesIO(b'{"error":"primary-test"}'))
        from unittest.mock import MagicMock
        response=MagicMock();response.__enter__.return_value.read.return_value=b'{"observations":[]}'
        with patch.object(m,'KEY','primary-test'),patch.object(m,'KEYS',['primary-test','secondary-test']),patch.object(m.urllib.request,'urlopen',side_effect=[failed,response]) as fetch:
            m.get_json({'series_id':'DFF'})
            self.assertEqual(fetch.call_count,2)
            self.assertIn('api_key=secondary-test',fetch.call_args.args[0].full_url)

    def test_provider_error_redacts_credentials_and_does_not_switch_series_error(self):
        failed=urllib.error.HTTPError('redacted',400,'invalid series',{},io.BytesIO(b'primary-test secondary-test invalid series'))
        with patch.object(m,'KEY','primary-test'),patch.object(m,'KEYS',['primary-test','secondary-test']),patch.object(m.urllib.request,'urlopen',side_effect=failed) as fetch:
            with self.assertRaises(RuntimeError) as error:m.get_json({'series_id':'missing'})
            self.assertNotIn('primary-test',str(error.exception));self.assertNotIn('secondary-test',str(error.exception))
            self.assertEqual(fetch.call_count,1)

if __name__=='__main__':unittest.main()
