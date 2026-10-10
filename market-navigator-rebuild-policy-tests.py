"""Independent market publication deadlines; ingestion grace is application policy."""
import datetime as dt,importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('policy',Path(__file__).with_name('market-navigator-rebuild-policy.py'));policy=importlib.util.module_from_spec(spec);spec.loader.exec_module(policy)
def instant(s):return dt.datetime.fromisoformat(s.replace('Z','+00:00'))
class PublicationCalendar(unittest.TestCase):
    def test_regular_close_and_ingestion_grace(self):
        self.assertEqual(str(policy.expected_market_session(instant('2026-10-08T21:59:59Z'))),'2026-10-07')
        self.assertEqual(str(policy.expected_market_session(instant('2026-10-08T22:00:00Z'))),'2026-10-08')
    def test_early_close_and_grace(self):
        self.assertEqual(str(policy.expected_market_session(instant('2026-11-27T19:59:59Z'))),'2026-11-25')
        self.assertEqual(str(policy.expected_market_session(instant('2026-11-27T20:00:00Z'))),'2026-11-27')
    def test_exchange_holiday_is_not_bank_calendar(self):
        self.assertEqual(str(policy.expected_market_session(instant('2026-04-03T23:00:00Z'))),'2026-04-02')
        self.assertEqual(str(policy.expected_market_session(instant('2026-10-12T23:00:00Z'))),'2026-10-12')
        self.assertEqual(str(policy.previous_bank_session(dt.date(2026,10,13))),'2026-10-09')
    def test_2028_saturday_new_year_has_no_friday_exchange_observation(self):
        self.assertEqual(str(policy.expected_market_session(instant('2027-12-31T23:00:00Z'))),'2027-12-31')
    def test_july_2_2026_is_regular_session(self):
        self.assertEqual(str(policy.expected_market_session(instant('2026-07-02T19:00:00Z'))),'2026-07-01')
    def test_dst_and_weekend(self):
        self.assertEqual(str(policy.expected_market_session(instant('2026-03-09T21:59:59Z'))),'2026-03-06')
        self.assertEqual(str(policy.expected_market_session(instant('2026-03-09T22:00:00Z'))),'2026-03-09')
    def test_unknown_year_requires_official_refresh(self):
        with self.assertRaisesRegex(ValueError,'requires refresh'):policy.expected_market_session(instant('2029-01-08T23:00:00Z'))
    def test_validity_expires_at_native_deadline_before_hourly_refresh(self):
        now=instant('2026-10-08T21:50:00Z');source={'last_successful':now.isoformat(),'observations':[{'t':int(instant('2026-10-07T00:00:00Z').timestamp()*1000),'v':1}]}
        expiry=policy.valid_until({'id':'qqq','native_cadence':'trading-day','provider':'Yahoo Finance'},source,{}, {},now)
        self.assertLessEqual(expiry,instant('2026-10-08T22:00:00Z'));self.assertGreater(expiry,instant('2026-10-08T21:59:58Z'))
if __name__=='__main__':unittest.main(verbosity=2)
