"""Independent numerical, historical, cadence and recovery fault checks."""
from unittest.mock import patch
import copy,datetime as dt,importlib.util,json,math,tempfile,unittest
from pathlib import Path

BASE=Path(__file__).resolve().parent
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,BASE/file);obj=importlib.util.module_from_spec(spec);spec.loader.exec_module(obj);return obj
r=module('mn_history','market-navigator-rebuild-history.py');p=r.policy
t=module('mn_transforms','market-navigator-rebuild-transforms.py')
w=module('mn_worker','market-navigator-rebuild-worker.py')
ROOT=BASE/'market-navigator-rebuild-data';NOW=dt.datetime(2026,10,7,22,tzinfo=dt.timezone.utc)

class Recovery(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.seed=r.read(BASE/'market-navigator-rebuild-seed.json')
        cls.registry=r.read(ROOT/'data/market-backend/component-registry-v1.json')
        cls.catalog=r.read(ROOT/'data/market-backend/data-catalog.json');cls.metas={x['id']:x for x in cls.catalog['series']}
        cls.rules=r.read(ROOT/'data/market-backend/publication-rules.json');cls.ids=[x['id'] for x in cls.registry['components']]
        cls.captures=[r.archive_capture(e,BASE/'market-navigator-rebuild-archive/blobs',cls.metas,cls.ids) for e in r.read(BASE/'market-navigator-rebuild-archive-inventory.json')]
        cls.captures.append(r.live_capture(ROOT,cls.metas,cls.ids,NOW))
        cls.model,cls.proof=r.recover(cls.seed,cls.registry,cls.captures)

    def test_original_vectors_unchanged(self):
        for key,old in self.seed['indices'].items():
            new=self.model['indices'][key];n=len(old['dates'])
            for field in ('dates','timestamps','values'):self.assertEqual(old[field],new[field][:n])
            for field in ('componentValues','componentSignals','componentObservationDates'):
                for sid in old[field]:self.assertEqual(old[field][sid],new[field][sid][:n])

    def test_independent_formula_every_recovered_row(self):
        rules={x['id']:x for x in self.registry['components']}
        for key,new in self.model['indices'].items():
            old=self.seed['indices'][key];n=len(old['dates'])
            for i in range(n,len(new['dates'])):
                terms=[]
                for sid in old['components']:
                    rule=rules[sid];value=new['componentValues'][sid][i];anchor=old['componentValues'][sid][0]
                    raw=math.log(value)-math.log(anchor) if rule['transformFamily']=='log_return' else value-anchor
                    signal=rule['direction']*raw/rule['scale']['annualizedScale'];terms.append(signal)
                    self.assertAlmostEqual(signal,new['componentSignals'][sid][i],places=12)
                self.assertAlmostEqual(100+math.fsum(terms)/7,new['values'][i],places=12)

    def test_all_horizons_preserve_requested_windows(self):
        evidence=r.compatibility(self.model,self.registry)
        for index in evidence['indices'].values():
            for h,view in index['horizons'].items():
                self.assertEqual(r.start('2026-10-07',h),view['commonT0'])
                self.assertEqual('2026-10-07',view['commonNow'])
                self.assertEqual(7,view['componentsUsed'])
            self.assertEqual([f'2026-10-{d:02d}' for d in range(2,8)],[r.calendar(x['t']) for x in index['horizons']['5D']['curve']])

    def test_missing_day_rejected_even_with_fresh_tail(self):
        with self.assertRaisesRegex(ValueError,'Missing required daily archive'):
            r.recover(self.seed,self.registry,[c for c in self.captures if c['calendarDate']!='2026-09-28'])

    def test_archived_inputs_not_replaced_with_current_vintage(self):
        historical=next(c for c in self.captures if c['calendarDate']=='2026-09-24')
        for row in self.model['indices'].values():
            i=row['dates'].index('2026-09-24')
            for sid in row['components']:
                self.assertEqual(historical['sources'][sid]['observations'][-1]['v'],row['componentValues'][sid][i])
                self.assertEqual(historical['provenance'][sid]['observationDate'],row['componentObservationDates'][sid][i])

    def test_calendar_coordinates_separate_from_actual_collection(self):
        for row in self.model['indices'].values():
            for receipt in row['recoveredCalculations']:
                self.assertEqual(receipt['calendarDate'],r.instant(receipt['knownBy']).date().isoformat())
                i=row['dates'].index(receipt['calendarDate']);self.assertEqual(r.midnight(receipt['calendarDate']),row['timestamps'][i])
                self.assertNotEqual(row['timestamps'][i],r.instant(receipt['knownBy']).timestamp()*1000)

    def test_same_day_latest_collection_one_row_and_idempotence(self):
        reordered=list(reversed(self.captures))+[self.captures[-1]]
        model,proof=r.recover(self.seed,self.registry,reordered)
        self.assertEqual(self.model,model);self.assertEqual(self.proof,proof)
        for row in model['indices'].values():self.assertEqual(len(row['dates']),len(set(row['dates'])))

    def test_source_mutations_rejected(self):
        source=self.captures[-1]['sources']['qqq']
        mutations=[lambda s:s.update(id='spy'),lambda s:s.update(provider='Fake'),lambda s:s.update(sourceRevision='bad'),lambda s:s.update(count=0),lambda s:s.update(last_successful='2026-10-08T00:00:00Z'),lambda s:s['observations'].append(dict(s['observations'][-1])),lambda s:s['observations'][-1].update(v=float('nan')),lambda s:s['observations'][-1].update(t=NOW.timestamp()*1000+1)]
        for mutation in mutations:
            changed=copy.deepcopy(source);mutation(changed)
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):r.validate_source(changed,'qqq',self.metas,NOW)

    def test_archive_hash_corruption_rejected(self):
        entry=r.read(BASE/'market-navigator-rebuild-archive-inventory.json')[0]
        with tempfile.TemporaryDirectory(dir=BASE) as folder:
            f=next(x for x in entry['files'] if x['path']=='market-evidence/operational-manifest.json')
            Path(folder,f['sha']+'.json').write_text('{}')
            with self.assertRaisesRegex(ValueError,'blob mismatch'):r.archive_capture(entry,folder,self.metas,self.ids)

    def test_every_archive_native_cadence(self):
        for capture in self.captures:r.verify_cadence(capture,self.metas,self.catalog,self.rules)

    def test_stale_native_period_cannot_be_healed_by_success(self):
        source=copy.deepcopy(self.captures[-1]['sources']['qqq']);source['observations']=[{'t':r.midnight('2026-09-22'),'v':700}]
        source.update(last_successful='2026-10-07T21:00:00Z',last_attempted='2026-10-07T21:00:00Z',last_error=None)
        self.assertEqual('stale',p.freshness(self.metas['qqq'],source,self.catalog,self.rules,NOW)[0])

    def test_valid_monthly_period_and_expired_heartbeat(self):
        source=copy.deepcopy(self.captures[-1]['sources']['cpi'])
        self.assertEqual('current',p.freshness(self.metas['cpi'],source,self.catalog,self.rules,NOW)[0])
        source['last_successful']='2026-10-01T00:00:00Z'
        self.assertEqual('stale',p.freshness(self.metas['cpi'],source,self.catalog,self.rules,NOW)[0])

    def test_weekly_ingestion_grace(self):
        meta={'id':'initialClaims','native_cadence':'weekly'}
        before=dt.datetime(2026,10,8,20,tzinfo=dt.timezone.utc);after=dt.datetime(2026,10,9,13,tzinfo=dt.timezone.utc)
        self.assertEqual('2026-09-26',str(p.expected_period(meta,self.catalog,self.rules,before)))
        self.assertEqual('2026-10-03',str(p.expected_period(meta,self.catalog,self.rules,after)))

    def test_quarterly_join_does_not_shift_missing_period(self):
        data=[{'t':r.midnight(date),'v':value} for date,value in [('2025-01-01',100),('2025-07-01',110),('2025-10-01',120),('2026-01-01',130)]]
        qoq=t.quarterly_transform(data,1);yoy=t.quarterly_transform(data,4)
        self.assertEqual(['2025-10-01','2026-01-01'],[r.calendar(x['t']) for x in qoq])
        self.assertEqual(['2026-01-01'],[r.calendar(x['t']) for x in yoy]);self.assertAlmostEqual(30,yoy[0]['v'])

    def test_receipt_restart_recovery(self):
        with tempfile.TemporaryDirectory(dir=BASE) as folder:
            capture=copy.deepcopy(self.captures[-1]);r.save_receipt(folder,capture)
            loaded=r.load_receipts(folder,self.metas,self.ids)
            self.assertEqual(1,len(loaded));self.assertEqual(capture['sources'],loaded[0]['sources'])
            self.assertEqual(r.recover(self.seed,self.registry,self.captures)[0],r.recover(self.seed,self.registry,self.captures[:-1]+loaded)[0])

    def test_optional_recovery_failure_preserves_more_complete_current_generation(self):
        # Synthetic admission outcomes isolate the publication decision.
        with tempfile.TemporaryDirectory(dir=BASE) as folder:
            name='generation-'+'a'*20;Path(folder,name).mkdir()
            pointer=Path(folder,'current.json');pointer.write_text(json.dumps({'generation':name}))
            before=pointer.read_bytes()
            attempted={'summary':{'ready':True,'current':38},'findings':[{'id':'custom_gaamhx','blocking':False}]}
            prior={'summary':{'ready':True,'current':39},'findings':[]}
            with patch.object(w,'audit',side_effect=[attempted,prior]),self.assertRaisesRegex(ValueError,'reduced current native coverage'):
                w.publish(ROOT,folder,archive=BASE/'market-navigator-rebuild-archive',inventory=BASE/'market-navigator-rebuild-archive-inventory.json')
            self.assertEqual(pointer.read_bytes(),before)
            self.assertTrue(any(Path(folder).glob('working-*')))

    def test_failed_generation_does_not_replace_last_good_pointer(self):
        with tempfile.TemporaryDirectory(dir=BASE) as folder:
            pointer=Path(folder,'current.json');pointer.write_text('{"generation":"last-good"}')
            before=pointer.read_bytes()
            with patch.object(w,'audit',side_effect=ValueError('Synthetic admission failure')), self.assertRaisesRegex(ValueError,'Synthetic admission failure'):
                w.publish(ROOT,folder,archive=BASE/'market-navigator-rebuild-archive',inventory=BASE/'market-navigator-rebuild-archive-inventory.json')
            self.assertEqual(before,pointer.read_bytes())

    def test_all_canonical_series_and_retained_inventory_assessed(self):
        report=w.audit(ROOT,NOW)
        self.assertEqual(39,report['summary']['series']);self.assertEqual(38,report['summary']['current'])
        self.assertTrue(report['summary']['ready']);self.assertEqual('stale',report['series']['custom_gaamhx']['status'])
        self.assertEqual('current',report['series']['qqq']['status']);self.assertGreater(report['summary']['files'],150)

if __name__=='__main__':unittest.main(verbosity=2)
