"""Owner delivery regressions: source histories and real release eligibility."""
import datetime as dt
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('schedule', Path(__file__).with_name('market-navigator-etl-schedule.py'))
s = importlib.util.module_from_spec(spec)
spec.loader.exec_module(s)


def saved(day, **extra):
    return {'observations': [{'t': int(dt.datetime.fromisoformat(day).replace(tzinfo=dt.timezone.utc).timestamp()*1000), 'v': 1}], **extra}


class Delivery(unittest.TestCase):
    def test_weekend_repairs_missing_completed_friday(self):
        self.assertTrue(s.eligibility({'id':'spy','native_cadence':'trading-day'}, saved('2026-10-15'), '2026-10-17')[0])

    def test_weekend_preserves_completed_friday(self):
        self.assertFalse(s.eligibility({'id':'spy','native_cadence':'trading-day'}, saved('2026-10-16'), '2026-10-17')[0])

    def test_market_holiday_does_not_request_observation(self):
        self.assertFalse(s.eligibility({'id':'spy','native_cadence':'trading-day'}, saved('2026-07-02'), '2026-07-03')[0])

    def test_delayed_provider_is_not_suppressed_by_last_success(self):
        self.assertTrue(s.eligibility({'id':'cpi','native_cadence':'monthly'}, saved('2026-08-01'), '2026-10-16',
                                     {'cpi':{'available_by_day_of_month':15}}, last_attempt='2026-10-15')[0])

    def test_weekly_native_saturday_is_already_collected(self):
        self.assertFalse(s.eligibility({'id':'initialClaims','native_cadence':'weekly'}, saved('2026-10-10'), '2026-10-16')[0])

    def test_releases_use_publication_time_and_revision_cycle(self):
        rule={'cpi':{'releases':[{'period':'2026-09-01','published_at':'2026-10-14T12:30:00Z','source':'https://www.bls.gov/schedule/2026/home.htm'}]}}
        meta={'id':'cpi','native_cadence':'monthly'}
        self.assertFalse(s.eligibility(meta,saved('2026-08-01'),'2026-10-14T12:29:00Z',rule)[0])
        self.assertTrue(s.eligibility(meta,saved('2026-08-01'),'2026-10-14T12:31:00Z',rule)[0])
        self.assertFalse(s.eligibility(meta,saved('2026-09-01'),'2026-10-14T12:31:00Z',rule)[0])

    def test_calendar_revision_can_refresh_current_quarter(self):
        rule={'realGdp':{'releases':[{'period':'2026-04-01','published_at':'2026-09-30T12:30:00Z','revision':True,'source':'https://www.bea.gov/news/schedule/'}]}}
        self.assertTrue(s.eligibility({'id':'realGdp','native_cadence':'quarterly'}, saved('2026-04-01'), '2026-09-30',rule,last_attempt='2026-08-28')[0])

    def test_historical_gap_repairs_even_when_endpoint_is_current(self):
        self.assertTrue(s.eligibility({'id':'spy','native_cadence':'trading-day'}, saved('2026-10-16',missing_periods=['2026-10-13']), '2026-10-17')[0])

    def test_not_due_failure_does_not_force_monthly_collection(self):
        self.assertFalse(s.eligibility({'id':'corePce','native_cadence':'monthly'}, saved('2026-08-01',last_error='timeout'), '2026-10-17', {'corePce':{'available_by_day_of_month':31}})[0])


if __name__ == '__main__':
    unittest.main()
