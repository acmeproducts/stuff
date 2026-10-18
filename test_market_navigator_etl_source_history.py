import datetime as dt
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

HERE=Path(__file__).resolve().parent
def load(name):
    spec=importlib.util.spec_from_file_location(name,HERE/(name+'.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
c=load('market-navigator-r7-data-pipeline');a=load('market-navigator-etl-source-audit')
def point(day,value):return {'t':int(dt.datetime.fromisoformat(day).replace(tzinfo=dt.timezone.utc).timestamp()*1000),'v':value}

class SourceHistory(unittest.TestCase):
    def test_native_period_gaps_do_not_invent_daily_monthly_values(self):
        self.assertEqual(c.missing_native_periods({'native_cadence':'monthly'},[point('2026-01-01',1),point('2026-03-01',3)]),['2026-02-01'])
        self.assertEqual(c.missing_native_periods({'native_cadence':'quarterly'},[point('2026-01-01',1),point('2026-07-01',3)]),['2026-04-01'])
        self.assertEqual(c.missing_native_periods({'native_cadence':'weekly'},[point('2026-10-02',1),point('2026-10-16',3)]),['2026-10-09'])
        self.assertEqual(c.missing_native_periods({'native_cadence':'trading-day'},[point('2026-10-08',1),point('2026-10-12',3)]),['2026-10-09'])

    def test_full_response_retracts_observation_inside_covered_window(self):
        old=[point('2026-09-04',1),point('2026-09-07',2),point('2026-09-08',3)]
        actual=[point('2026-09-04',1),point('2026-09-08',4)]
        self.assertEqual(c.source_snapshot(old,actual,True),actual)

    def test_provider_history_limit_preserves_earlier_retained_observations(self):
        old=[point('2016-09-01',1),point('2026-10-14',2)]
        self.assertEqual(c.source_snapshot(old,[point('2026-10-14',3)],True),[old[0],point('2026-10-14',3)])

    def test_retained_hy_backcast_is_bound_to_exact_accepted_history(self):
        meta=next(x for x in json.loads((HERE/'data/market-backend/data-catalog.json').read_text())['series'] if x['id']=='hySpread')
        archived=json.loads((HERE/'market-navigator-chart-only-review/market-evidence/series/hySpread.json').read_text())
        point=archived['observations'][0]
        self.assertTrue(a.retained_matches(meta,[point])['verified'])
        self.assertFalse(a.retained_matches(meta,[{**point,'v':point['v']+1}])['verified'])

    def test_wrong_fund_identity_is_rejected(self):
        response={'status':{'rCode':200},'data':{'symbol':'OTHER','totalRecords':1,'tradesTable':{'rows':[]}}}
        with patch.object(c,'get',return_value=(json.dumps(response).encode(),200)):
            with self.assertRaisesRegex(RuntimeError,'identity'):c.nasdaq_fund('GAAMHX',True)

if __name__=='__main__':unittest.main()
