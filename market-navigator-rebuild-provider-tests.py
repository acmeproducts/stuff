"""Recovery selection tests use synthetic provider responses in isolated fixtures."""
import contextlib,datetime as dt,importlib.util,io,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
BASE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('qualified_collector',BASE/'market-navigator-rebuild-data/market-navigator-r7-data-pipeline.py')
collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)
spec=importlib.util.spec_from_file_location('provider_test_policy',BASE/'market-navigator-rebuild-policy.py');collector_policy=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector_policy)
NOW=dt.datetime(2026,10,8,13,tzinfo=dt.timezone.utc)
def t(day):return int(dt.datetime.fromisoformat(day).replace(tzinfo=dt.timezone.utc).timestamp()*1000)
def vector(last='2026-10-07',offset=10):
    # Bootstrap fixtures must include every reviewed native session, not a
    # sparse 2018 anchor plus seven 2026 rows mislabeled as full history.
    dates=[];day=dt.date(2026,1,1);end=dt.date.fromisoformat(last)
    while day<=end:
        if day.weekday()<5 and day.isoformat() not in collector_policy.NYSE_CLOSED[2026]:dates.append(day)
        day+=dt.timedelta(days=1)
    return [{'t':t('2018-01-01'),'v':offset}]+[{'t':t(str(day)),'v':offset+(day-dt.date(2026,1,1)).days+1} for day in dates]
class ProviderRecovery(unittest.TestCase):
    def run_case(self,fetch,old_provider='Yahoo Finance',sid='custom_nvda',alternate=None):
        catalog=json.loads((BASE/'market-navigator-rebuild-data/data/market-backend/data-catalog.json').read_text(encoding='utf-8'))
        meta=next(x for x in catalog['series'] if x['id']==sid);meta['required']=False
        if sid=='custom_gaamhx':
            policy=json.loads((BASE/'market-navigator-rebuild-provider-policy.json').read_text(encoding='utf-8'))['policies'][0]
            self.assertTrue(all(meta.get(k)==v for k,v in policy['identity'].items()))
            meta['provider_chain'].append(policy['provider'])
        self.assertEqual([x['provider'] for x in collector.chain_for(meta)],['Yahoo Finance'] if sid=='qqq' else ['Yahoo Finance','Nasdaq Fund Network'] if sid=='custom_gaamhx' else ['Yahoo Finance','Stooq'])
        catalog['series']=[meta]
        fixture_base=BASE/'market-navigator-rebuild-test-fixtures';fixture_base.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=fixture_base) as tmp:
            root=Path(tmp).resolve();root.relative_to(fixture_base.resolve())
            (root/'data/market-backend').mkdir(parents=True);(root/'market-evidence/series').mkdir(parents=True)
            (root/'data/market-backend/data-catalog.json').write_text(json.dumps(catalog),encoding='utf-8')
            (root/'data/market-backend/publication-rules.json').write_bytes((BASE/'market-navigator-rebuild-data/data/market-backend/publication-rules.json').read_bytes())
            old={'provider':old_provider,'providerIdentifier':collector.chain_for(meta)[0 if old_provider=='Yahoo Finance' else 1]['identifier'],'observations':vector('2026-09-22',999),'last_successful':'2026-09-22T20:00:00Z'}
            native=root/'market-evidence/series'/f'{sid}.json';native.write_text(json.dumps(old),encoding='utf-8')
            import os
            prior=Path.cwd()
            try:
                os.chdir(root)
                with patch.object(collector,'now',return_value=NOW),patch.object(collector,'fetch_source',side_effect=fetch),patch.object(collector,'yahoo',side_effect=alternate or (lambda identifier,bootstrap,host,bounded=False:fetch('Yahoo Finance',identifier,bootstrap))),contextlib.redirect_stdout(io.StringIO()):
                    collector.main()
                return json.loads(native.read_text(encoding='utf-8')),old
            finally:os.chdir(prior)
    def test_stale_http_success_uses_next_approved_provider_without_splicing(self):
        calls=[]
        def fetch(provider,identifier,bootstrap):
            calls.append((provider,identifier,bootstrap))
            return (vector('2026-09-22',1) if provider=='Yahoo Finance' else vector(offset=20)),200
        source,old=self.run_case(fetch)
        self.assertEqual(source['provider'],'Stooq');self.assertTrue(source['providerFallbackUsed']);self.assertIsNone(source['last_error'])
        self.assertEqual(source['observations'],vector(offset=20));self.assertNotEqual(source['observations'][0],old['observations'][0]);self.assertTrue(calls[-1][2])
        self.assertIn('not current canonical evidence',source['providerErrors'][0])
    def test_all_stale_responses_preserve_history_and_failed_collection(self):
        source,old=self.run_case(lambda *_:(vector('2026-09-22'),200))
        self.assertEqual(source['observations'],old['observations']);self.assertEqual(source['last_successful'],old['last_successful']);self.assertIsNotNone(source['last_error'])
    def test_future_primary_tries_qualified_fallback(self):
        def fetch(provider,*_):return (vector('2026-10-09') if provider=='Yahoo Finance' else vector()),200
        source,_=self.run_case(fetch);self.assertEqual(source['provider'],'Stooq');self.assertIsNone(source['last_error'])
    def test_healthy_primary_does_not_request_fallback(self):
        calls=[]
        def fetch(provider,*_):calls.append(provider);return vector(),200
        source,_=self.run_case(fetch);self.assertEqual(calls,['Yahoo Finance']);self.assertFalse(source['providerFallbackUsed'])
    def test_return_to_primary_replaces_vendor_history_with_qualified_bootstrap(self):
        calls=[]
        def fetch(provider,identifier,bootstrap):calls.append(bootstrap);return vector(offset=35),200
        source,_=self.run_case(fetch,'Stooq');self.assertEqual(calls,[True]);self.assertEqual(source['observations'],vector(offset=35))
    def test_qqq_stale_primary_uses_same_provider_alternate_endpoint(self):
        calls=[]
        def primary(provider,identifier,bootstrap):calls.append((provider,identifier));return vector('2026-09-22'),200
        def alternate(identifier,bootstrap,host):calls.append((host,identifier));return vector(),200
        source,_=self.run_case(primary,sid='qqq',alternate=alternate)
        self.assertEqual(calls,[('Yahoo Finance','QQQ'),('query2.finance.yahoo.com','QQQ')])
        self.assertEqual(source['provider'],'Yahoo Finance');self.assertFalse(source['providerFallbackUsed']);self.assertIsNone(source['last_error']);self.assertEqual(source['observations'][-1]['t'],t('2026-10-07'))
    def test_qqq_alternate_failure_preserves_old_history(self):
        def alternate(*_):raise ValueError('Synthetic endpoint unavailable')
        source,old=self.run_case(lambda *_:(vector('2026-09-22'),200),sid='qqq',alternate=alternate)
        self.assertEqual(source['observations'],old['observations']);self.assertEqual(source['last_successful'],old['last_successful']);self.assertIsNotNone(source['last_error'])
    def test_bounded_period_recovers_stale_range_without_changing_provider(self):
        calls=[]
        def alternate(identifier,bootstrap,host,bounded=False):calls.append((host,bounded));return (vector() if bounded else vector('2026-09-22')),200
        source,_=self.run_case(lambda *_:(vector('2026-09-22'),200),sid='qqq',alternate=alternate)
        self.assertEqual(calls,[('query2.finance.yahoo.com',False),('query2.finance.yahoo.com',True)]);self.assertIsNone(source['last_error']);self.assertEqual(source['provider'],'Yahoo Finance');self.assertFalse(source['providerFallbackUsed'])
        self.assertEqual(source['providerEndpointTrace'][-1]['endpoint'],'query2.finance.yahoo.com/bounded-period')
    def test_unfinished_current_daily_candle_is_not_published_as_completed(self):
        source,_=self.run_case(lambda *_:(vector('2026-10-08'),200),sid='qqq')
        self.assertEqual(source['observations'][-1]['t'],t('2026-10-07'));self.assertIsNone(source['last_error'])
    def test_fresh_tail_with_missing_middle_session_recovers_from_approved_provider(self):
        incomplete=[p for p in vector() if p['t']!=t('2026-10-05')]
        def fetch(provider,*_):return (incomplete if provider=='Yahoo Finance' else vector(offset=20)),200
        source,_=self.run_case(fetch)
        self.assertEqual(source['provider'],'Stooq');self.assertIn('Missing recent native sessions',source['providerErrors'][0])
        self.assertEqual(source['observations'],vector(offset=20))
    def test_fund_fallback_replaces_stale_vendor_history_with_bootstrap(self):
        calls=[]
        def fetch(provider,identifier,bootstrap):
            calls.append((provider,identifier,bootstrap))
            return (vector('2026-09-22',1) if provider=='Yahoo Finance' else vector(offset=20)),200
        source,old=self.run_case(fetch,sid='custom_gaamhx')
        self.assertEqual(source['provider'],'Nasdaq Fund Network');self.assertTrue(source['providerFallbackUsed'])
        self.assertEqual(source['observations'],vector(offset=20));self.assertNotEqual(source['observations'][0],old['observations'][0])
        self.assertEqual(calls[-1],('Nasdaq Fund Network','GAAMHX',True));self.assertIsNone(source['last_error'])
class NasdaqFundContract(unittest.TestCase):
    def response(self,symbol='GAAMHX',total=1,volume='N/A'):
        return {'status':{'rCode':200},'data':{'symbol':symbol,'totalRecords':total,'tradesTable':{'rows':[{'date':'10/07/2026','close':'11.4187','open':'11.4187','high':'11.4187','low':'11.4187','volume':volume}]}}}
    def fetch(self,response):
        with patch.object(collector,'get',return_value=(json.dumps(response).encode(),200)):
            return collector.nasdaq_fund('GAAMHX',True)
    def test_exact_symbol_dated_nav_is_accepted(self):
        points,status=self.fetch(self.response());self.assertEqual(points,[{'t':t('2026-10-07'),'v':11.4187}]);self.assertEqual(status,200)
    def test_wrong_symbol_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError,'identity'):self.fetch(self.response(symbol='OTHER'))
    def test_incomplete_history_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError,'incomplete'):self.fetch(self.response(total=2))
    def test_stock_trade_record_is_not_substituted_for_fund_nav(self):
        with self.assertRaisesRegex(RuntimeError,'fund NAV'):self.fetch(self.response(volume='1200'))
if __name__=='__main__':unittest.main(verbosity=2)
