"""Fault checks for source replay, complete period coverage, durable recovery and expiry."""
import copy,datetime as dt,hashlib,importlib.util,json,os,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
BASE=Path(__file__).resolve().parent

def load(name,file):
    spec=importlib.util.spec_from_file_location(name,BASE/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
a=load('mn_assurance_tests','market-navigator-assurance.py');h=a.h
p=load('mn_assurance_collector','market-navigator-rebuild-data/market-navigator-r7-data-pipeline.py')
r=load('mn_assurance_runner','market-navigator-assurance-run.py')
NOW=dt.datetime(2026,10,9,18,tzinfo=a.UTC)
META={'id':'qqq','provider':'Yahoo Finance','provider_identifier':'QQQ','native_unit':'USD','native_cadence':'trading-day','enabled':True}
POINTS=[{'t':h.midnight(f'2026-10-{d:02d}')+13*3600000,'v':700.+d} for d in (1,2,5,6,7,8)]

def source(points):
    return {'id':'qqq','provider':'Yahoo Finance','providerIdentifier':'QQQ','unit':'USD','cadence':'trading-day','observations':points,'sourceRevision':h.digest(points),'first':points[0]['t'],'last':points[-1]['t'],'count':len(points),'last_successful':NOW.isoformat(),'last_error':None}

def payload(points=POINTS,symbol='QQQ',currency='USD'):
    return json.dumps({'chart':{'result':[{'meta':{'symbol':symbol,'currency':currency},'timestamp':[q['t']//1000 for q in points],'indicators':{'quote':[{'close':[q['v'] for q in points]}]}}]}}).encode()

class Assurance(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.obj=source(copy.deepcopy(POINTS));self.raw=payload();digest=hashlib.sha256(self.raw).hexdigest()
        (self.root/'market-evidence/source-responses').mkdir(parents=True);(self.root/'market-evidence/source-responses'/f'{digest}.bin').write_bytes(self.raw)
        self.receipt={'verificationId':'a'*32,'id':'qqq','checkedAt':NOW.isoformat(),'sourceRevision':self.obj['sourceRevision'],'scope':'full-retained-history','unit':'USD','cadence':'trading-day','method':'retained-provider-response','provider':'Yahoo Finance','identifier':'QQQ','responses':[{'sha256':digest,'url':'https://query1.finance.yahoo.com/v8/finance/chart/QQQ?range=10y'}],'verifiedPoints':self.obj['observations']}
        self.obj['sourceVerification']=self.receipt;h.write(self.root/'market-evidence/source-verifications'/('a'*32+'.json'),self.receipt)
        h.write(self.root/'data/market-backend/data-catalog.json',{'series':[META]});h.write(self.root/'data/market-backend/publication-rules.json',{'rules':{}});h.write(self.root/'market-evidence/series/qqq.json',self.obj)
        reports={horizon:{**p.report(POINTS,horizon),'source_revision':self.obj['sourceRevision']} for horizon in h.H};h.write(self.root/'market-evidence/reports/qqq.json',{'id':'qqq','reports':reports,'computedRevision':h.digest(reports)})
    def tearDown(self):self.temp.cleanup()
    def check(self):return a.source_check(self.root,META,self.obj,NOW)
    def test_fresh_upstream_replay_verifies(self):self.assertEqual('verified',self.check()['status'])
    def test_audit_alone_does_not_claim_source_verification(self):
        del self.obj['sourceVerification'];self.assertEqual('unverified',self.check()['status'])
    def test_source_check_expires(self):self.assertEqual('unverified',a.source_check(self.root,META,self.obj,NOW+dt.timedelta(hours=3))['status'])
    def test_future_check_rejected(self):self.assertEqual('unverified',a.source_check(self.root,META,self.obj,NOW-dt.timedelta(seconds=1))['status'])
    def test_corrupt_response_rejected(self):
        next((self.root/'market-evidence/source-responses').glob('*')).write_bytes(b'{}');self.assertEqual('unverified',self.check()['status'])
    def test_self_consistent_forged_points_do_not_override_response(self):
        self.obj['observations'][2]['v']=999;self.obj['sourceRevision']=h.digest(self.obj['observations']);self.receipt['sourceRevision']=self.obj['sourceRevision'];h.write(self.root/'market-evidence/source-verifications'/('a'*32+'.json'),self.receipt)
        self.assertIn('replay differs',self.check()['why'])
    def test_wrong_raw_symbol_rejected(self):
        with self.assertRaisesRegex(ValueError,'symbol'):a.replay_response(META,self.receipt,payload(symbol='SPY'))
    def test_wrong_raw_currency_rejected(self):
        with self.assertRaisesRegex(ValueError,'currency'):a.replay_response(META,self.receipt,payload(currency='EUR'))
    def test_middle_gap_outside_last_five_sessions_detected(self):
        points=[{'t':h.midnight(d),'v':1} for d in ('2026-09-01','2026-09-03','2026-10-08')];gaps,_=a.gaps(META,points);self.assertIn('2026-09-02',gaps)
    def test_full_market_response_checks_older_gap_before_admission(self):
        points=[{'t':h.midnight(d),'v':1} for d in ('2026-09-01','2026-09-03','2026-10-08')];self.assertIn('2026-09-02',h.policy.missing_history_sessions(META,points))
    def test_market_holiday_is_not_a_gap(self):
        gaps,_=a.gaps(META,[{'t':h.midnight(d),'v':1} for d in ('2026-07-02','2026-07-06')]);self.assertEqual([],gaps)
    def test_monthly_gap(self):
        gaps,_=a.gaps({'native_cadence':'monthly'},[{'t':h.midnight(d),'v':1} for d in ('2025-09-01','2025-11-01')]);self.assertEqual(['2025-10-01'],gaps)
    def test_quarterly_gap(self):
        gaps,_=a.gaps({'native_cadence':'quarterly'},[{'t':h.midnight(d),'v':1} for d in ('2025-01-01','2025-07-01')]);self.assertEqual(['2025-04-01'],gaps)
    def test_weekly_gap(self):
        gaps,_=a.gaps({'native_cadence':'weekly'},[{'t':h.midnight(d),'v':1} for d in ('2026-09-05','2026-09-19')]);self.assertEqual(['2026-09-12'],gaps)
    def test_daily_calendar_series_checks_weekends(self):
        gaps,_=a.gaps({'native_cadence':'daily','provider_identifier':'DFF'},[{'t':h.midnight(d),'v':1} for d in ('2026-10-02','2026-10-05')]);self.assertEqual(['2026-10-03','2026-10-04'],gaps)
    def test_all_enabled_optional_fault_prevents_all_green(self):
        bad=copy.deepcopy(META);bad['id']='optional';cat={'series':[META,bad]};h.write(self.root/'data/market-backend/data-catalog.json',cat)
        result=a.assess(self.root,NOW,{'summary':{'ready':True,'validUntil':(NOW+dt.timedelta(hours=1)).isoformat()}});self.assertEqual('needs-attention',result['state']);self.assertEqual(2,result['summary']['datasets'])
    def test_wrong_unit_detected(self):
        self.obj['unit']='EUR';h.write(self.root/'market-evidence/series/qqq.json',self.obj);result=a.assess(self.root,NOW);self.assertIn('unit/cadence',result['findings'][0]['issues'][0])
    def test_self_consistent_corrupt_report_numbers_rejected(self):
        path=self.root/'market-evidence/reports/qqq.json';report=h.read(path);report['reports']['5D']['mean']=999;report['computedRevision']=h.digest(report['reports']);h.write(path,report)
        result=a.assess(self.root,NOW);self.assertIn('calculation differs',result['findings'][0]['issues'][0])
    def test_partial_response_is_not_full_verification(self):
        self.receipt['scope']='recent-response';self.assertEqual('unverified',self.check()['status'])
    def test_failed_repair_persists_outcome_and_pointer(self):
        store=self.root/'store';h.write(store/'current.json',{'generation':'generation-'+'b'*20,'revision':'b'*20});before=(store/'current.json').read_bytes()
        with patch.object(r.w,'publish',side_effect=ValueError('provider failed')):result=r.run(self.root,store)
        self.assertEqual('needs-attention',result['state']);self.assertEqual(before,(store/'current.json').read_bytes());self.assertEqual(2,len(list((store/'assurance-events').glob('*.json'))));self.assertEqual('repair-failed',h.read(store/'assurance-status.json')['lastOutcome']['kind'])
    def test_full_collector_repairs_middle_and_value_preserves_older_history(self):
        work=self.root/'collect';h.write(work/'data/market-backend/data-catalog.json',{'schema':'market-navigator-data-catalog-v1','series':[META]});h.write(work/'data/market-backend/publication-rules.json',{'rules':{}})
        points=[{'t':h.midnight('2026-09-30'),'v':699}]+copy.deepcopy(POINTS);points=[q for q in points if h.calendar(q['t'])!='2026-10-05'];points[3]['v']=999
        h.write(work/'market-evidence/series/qqq.json',source(points));previous=os.getcwd()
        class Response:
            status=200
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return payload()
        try:
            os.chdir(work)
            with patch.object(p,'BOOT',True),patch.object(p,'now',return_value=NOW),patch.object(p.urllib.request,'urlopen',return_value=Response()):p.main()
        finally:os.chdir(previous)
        repaired=h.read(work/'market-evidence/series/qqq.json');self.assertEqual([{'t':h.midnight('2026-09-30'),'v':699.}]+POINTS,repaired['observations']);check=a.source_check(work,META,repaired,NOW);self.assertEqual('verified',check['status']);self.assertIn('2026-10-05',check['changes']['addedPeriods']);self.assertTrue(check['retainedCapture'])

if __name__=='__main__':unittest.main(verbosity=2)
