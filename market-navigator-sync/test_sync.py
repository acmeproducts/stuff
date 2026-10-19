"""Real-package regressions: update, old-period revision and failure isolation."""
import copy,datetime as dt,importlib.util,json,os,tempfile,unittest
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('sync',HERE/'run.py');s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
BASE=Path(os.environ.get('MN_SYNC_TEST_BASE',str(HERE.parent/'market-navigator-throwaway-review'))).resolve()
FIXED_VERSION='7f4c5201e83de290cd7aba9cc0d5757b18707ab5f1cc3bdb49e9531cc093f7f9'
class Sync(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory();cls.folder=Path(cls.temp.name)
        fixed=HERE.parent/'market-navigator-etl-review/versions'/FIXED_VERSION
        base=BASE
        if fixed.exists():
            import shutil
            base=cls.folder/'fixed-input';base.mkdir();shutil.copytree(fixed,base/'market-navigator-rebuild-data')
            (base/'throwaway.html').write_bytes((HERE/'approved-chart.html').read_bytes())
        assert s.read(base/'market-navigator-rebuild-data/package.json')['version']==FIXED_VERSION,'Tests require the existing immutable qualification fixture, not moving live data'
        def unchanged(meta,source,native,now):return copy.deepcopy(native['observations'])
        cls.first=cls.folder/'first';cls.initial=s.synchronize(base,cls.first,dt.datetime(2026,10,19,5,tzinfo=s.UTC),True,unchanged,lambda *a:None)
    @classmethod
    def tearDownClass(cls):cls.temp.cleanup()
    def test_initial_sync_corrects_all_horizons_and_daily_macro(self):
        q=self.initial['qualification'];self.assertEqual((q['level0Series'],q['level1SeriesHorizons'],q['level3IndexHorizons']),(39,273,21))
        row=s.read(self.first/'market-navigator-rebuild-data/market-evidence/derived-indices-persistent-v1.json')['indices']['macro']['horizons']['5D']
        self.assertEqual([s.date(p['t']) for p in row['curve']],['2026-10-12','2026-10-13','2026-10-14','2026-10-15','2026-10-16'])
        self.assertAlmostEqual(row['curve'][0]['v'],102.66239106901966)
        report=s.read(self.first/'market-navigator-rebuild-data/market-evidence/reports/cpi.json')['reports']['5D']
        self.assertFalse(report['ready']);self.assertEqual(report['observation_count'],0)
        self.assertEqual(s.blob((self.first/'throwaway.html').read_bytes()),s.APP)
    def test_old_period_revision_rebuilds_affected_index_without_rebasing(self):
        def revised(meta,source,native,now):
            points=copy.deepcopy(native['observations'])
            if meta['id']=='qqq':
                for p in points:
                    if s.date(p['t'])=='2026-10-14':p['v']+=1
            return points
        second=self.folder/'second';result=s.synchronize(self.first,second,dt.datetime(2026,10,19,6,tzinfo=s.UTC),True,revised,lambda *a:None)
        self.assertEqual(result['changedSeries'],['qqq'])
        a=s.read(self.first/'market-navigator-rebuild-data/market-evidence/persistent-indices-v1.json');b=s.read(second/'market-navigator-rebuild-data/market-evidence/persistent-indices-v1.json')
        self.assertEqual(a['anchorDate'],b['anchorDate']);self.assertEqual(a['indices']['risk']['values'],b['indices']['risk']['values']);self.assertEqual(a['indices']['macro']['values'],b['indices']['macro']['values'])
        i=a['indices']['growth']['dates'].index('2026-10-14');self.assertNotEqual(a['indices']['growth']['values'][i],b['indices']['growth']['values'][i]);self.assertEqual(a['indices']['growth']['values'][0],b['indices']['growth']['values'][0])
    def test_source_failure_never_replaces_existing_package(self):
        before=(self.first/'market-navigator-rebuild-data/package.json').read_bytes()
        target=self.folder/'failed'
        def failed(*a):raise RuntimeError('deliberate provider failure')
        with self.assertRaisesRegex(RuntimeError,'deliberate'):s.synchronize(self.first,target,dt.datetime(2026,10,19,6,tzinfo=s.UTC),True,failed)
        self.assertFalse(target.exists());self.assertEqual(before,(self.first/'market-navigator-rebuild-data/package.json').read_bytes())
    def test_next_session_and_weekend_boundaries_remain_current(self):
        now=dt.datetime(2026,10,20,1,tzinfo=s.UTC);collector=s.load('market-navigator-r7-data-pipeline')
        rules=s.read(self.first/'market-navigator-rebuild-data/data/market-backend/publication-rules.json')['rules']
        def next_session(meta,source,native,at):
            points=copy.deepcopy(native['observations']);expected=collector._scheduler.expectation(meta,at,rules)['period']
            if expected and s.date(points[-1]['t'])<expected:points.append({'t':s.ms(expected),'v':points[-1]['v']})
            return points
        def availability(root,rows,at):
            registry=s.read(root/'data/market-backend/component-registry-v1.json');required={r['id'] for r in registry['components'] if r['provider']=='FRED'}
            extension=s.load('market-navigator-etl-vintage')
            for row in rows:
                if not row['changed'] or row['id'] not in required:continue
                sid=row['id'];path=root/f'market-evidence/vintage/{sid}.json';v=s.read(path)
                if v['availabilityQualification']!='QUALIFIED_ALFRED':continue
                p=s.read(root/f'market-evidence/source-observations/{sid}.json')['observations'][-1]
                v['events']=extension.extend(v,[{'date':s.date(p['t']),'realtime_start':'2026-10-19','realtime_end':'9999-12-31','value':str(p['v'])}]);s.write(path,v)
        output=self.folder/'next-session';result=s.synchronize(self.first,output,now,True,next_session,availability)
        derived=s.read(output/'market-navigator-rebuild-data/market-evidence/derived-indices-persistent-v1.json')
        self.assertEqual(derived['commonMarketAnchor'],'2026-10-19')
        for index in ('risk','growth','macro'):
            self.assertEqual([s.date(p['t']) for p in derived['indices'][index]['horizons']['1D']['curve']],['2026-10-16','2026-10-19'])
            self.assertEqual([s.date(p['t']) for p in derived['indices'][index]['horizons']['5D']['curve']],['2026-10-13','2026-10-14','2026-10-15','2026-10-16','2026-10-19'])
        self.assertEqual(result['qualification']['level3IndexHorizons'],21)
    def test_missing_index_date_is_rejected(self):
        root=self.first/'market-navigator-rebuild-data';p=root/'market-evidence/derived-indices-persistent-v1.json';before=p.read_bytes();obj=s.read(p)
        obj['indices']['macro']['horizons']['5D']['curve'].pop(0);s.write(p,obj)
        try:
            with self.assertRaisesRegex(ValueError,'coverage mismatch'):s.qualify(root,allow_fixture=True)
        finally:p.write_bytes(before)
    def test_wrong_report_window_is_rejected(self):
        root=self.first/'market-navigator-rebuild-data';p=root/'market-evidence/reports/cpi.json';before=p.read_bytes();obj=s.read(p);obj['reports']['5D']['window_start']='2026-04-01';s.write(p,obj)
        try:
            with self.assertRaisesRegex(ValueError,'horizon mismatch'):s.qualify(root,allow_fixture=True)
        finally:p.write_bytes(before)
    def test_no_due_sources_reuse_verified_version(self):
        def forbidden(*a):raise AssertionError('Should not fetch a source before due')
        output=self.folder/'no-due';r=s.synchronize(self.first,output,dt.datetime(2026,10,19,5,1,tzinfo=s.UTC),False,forbidden)
        self.assertTrue(r['unchanged']);self.assertEqual(r['version'],self.initial['version'])
    def test_incorrect_aggregate_is_rejected(self):
        root=self.first/'market-navigator-rebuild-data';p=root/'market-evidence/reports/spy.json';before=p.read_bytes();obj=s.read(p);obj['reports']['5D']['mean']+=1;s.write(p,obj)
        try:
            with self.assertRaisesRegex(ValueError,'horizon mismatch'):s.qualify(root,allow_fixture=True)
        finally:p.write_bytes(before)
    def test_provider_window_rollover_preserves_previously_verified_history(self):
        import shutil
        root=self.folder/'rolling-source';shutil.copytree(self.first/'market-navigator-rebuild-data',root)
        before=s.read(root/'market-evidence/source-observations/hySpread.json')['observations']
        def rolling(meta,source,native,now):
            return copy.deepcopy(native['observations'][1894:] if meta['id']=='hySpread' else native['observations'])
        rows=s.collect(root,dt.datetime(2026,10,19,6,tzinfo=s.UTC),True,rolling,self.initial['version'])
        self.assertEqual(before,s.read(root/'market-evidence/source-observations/hySpread.json')['observations'])
        row=next(r for r in rows if r['id']=='hySpread');self.assertEqual(row['approvedRetainedPrefix'],1894)
        self.assertEqual(s.read(root/'market-evidence/series/hySpread.json')['retainedHistoryProof']['previousVersion'],self.initial['version'])
if __name__=='__main__':unittest.main()

