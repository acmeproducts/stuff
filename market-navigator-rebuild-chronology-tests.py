"""Hand-authored temporal oracle and coherent source-linkage fault gates."""
import copy, datetime as dt, importlib.util, json, math, shutil, tempfile, unittest
from pathlib import Path
from unittest.mock import patch

BASE=Path(__file__).resolve().parent
def load(name,file):
    spec=importlib.util.spec_from_file_location(name,BASE/file)
    obj=importlib.util.module_from_spec(spec);spec.loader.exec_module(obj);return obj
h=load('chronology_history','market-navigator-rebuild-history.py')
w=load('chronology_worker','market-navigator-rebuild-worker.py')
integrity=h.integrity
INCIDENT=BASE/'market-navigator-review-evidence/2026-10-12/generation'
NOW=dt.datetime(2026,10,12,15,2,35,tzinfo=dt.timezone.utc)


class ProductionTemporalOracle(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(dir=BASE);self.root=Path(self.temp.name)
        self.original={'dates':['2026-10-08'],'timestamps':[h.midnight('2026-10-08')],'values':[100.],'components':['spy','cpi'],'componentValues':{'spy':[100.],'cpi':[50.]},'componentObservationDates':{'spy':['2026-10-08'],'cpi':['2026-08-01']}}
        self.row={**copy.deepcopy(self.original),'components':['spy','cpi'],'recoveredCalculations':[]}
        self.catalog={'spy':{'id':'spy','native_cadence':'trading-day','native_unit':'USD','provider':'Yahoo Finance','provider_identifier':'SPY'},'cpi':{'id':'cpi','native_cadence':'monthly','native_unit':'Index','provider':'FRED','provider_identifier':'CPIAUCSL'}}
        self.registry={'components':[{'id':sid,'direction':1,'transformFamily':'signed_level_change','scale':{'annualizedScale':1}} for sid in ('spy','cpi')]}
    def tearDown(self):self.temp.cleanup()
    def capture(self,known,spy_points,unit=None):
        proof={}
        for sid,points in [('spy',[{'t':h.midnight(date),'v':value} for date,value in spy_points]),('cpi',[{'t':h.midnight('2026-08-01'),'v':50.}])]:
            meta=self.catalog[sid]
            source={'id':sid,'provider':meta['provider'],'providerIdentifier':meta['provider_identifier'],'unit':unit if sid=='spy' and unit else meta['native_unit'],'cadence':meta['native_cadence'],'observations':points,'count':len(points),'first':points[0]['t'],'last':points[-1]['t'],'sourceRevision':h.digest(points),'last_successful':known,'last_error':None}
            raw=h.encode(source);sha=h.blob(raw);path=self.root/'market-evidence/collection-archive/blobs'/(sha+'.json');path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
            proof[sid]={'blob':sha,'sourceRevision':source['sourceRevision'],'nativeTimestamp':points[-1]['t'],'nativeValue':points[-1]['v'],'observationDate':h.calendar(points[-1]['t']),'collectedAt':known,'provider':source['provider'],'providerIdentifier':source['providerIdentifier']}
        c={'calendarDate':known[:10],'knownBy':known,'sources':proof}
        h.write(self.root/'market-evidence/collection-archive/receipts'/(known.replace(':','-')+'.json'),{'knownBy':known,'provenance':proof})
        self.row['recoveredCalculations'].append(c);return c
    def project(self):return integrity.latest_projection(self.root,self.row,self.original,self.catalog,self.registry)
    def test_authentic_provisional_capture_is_preserved_but_not_admitted_as_settled(self):
        known='2026-10-12T14:00:00Z';capture=self.capture(known,[('2026-10-09',100.),('2026-10-12',107.)])
        proof=capture['sources']['spy'];source=integrity.source_blob(self.root,'spy',proof,self.catalog['spy'],h.instant(known),{},require_completed=False)
        self.assertEqual(107.,source['observations'][-1]['v'])
        with self.assertRaisesRegex(ValueError,'incomplete market session'):self.project()
    def test_actual_production_weekend_revision_and_monday_cutoff(self):
        for known,points,end in [
            ('2026-10-09T22:00:00Z',[('2026-10-08',100.),('2026-10-09',107.)],'2026-10-09'),
            ('2026-10-10T12:00:00Z',[('2026-10-08',100.),('2026-10-09',114.)],'2026-10-09'),
            ('2026-10-11T12:00:00Z',[('2026-10-08',100.),('2026-10-09',114.)],'2026-10-09'),
            ('2026-10-12T14:00:00Z',[('2026-10-08',100.),('2026-10-09',114.)],'2026-10-09'),
            ('2026-10-12T23:00:00Z',[('2026-10-08',100.),('2026-10-09',114.),('2026-10-12',121.)],'2026-10-12')]:
            self.capture(known,points);projected=self.project();self.assertEqual(end,h.calendar(projected[-1]['t']));self.assertEqual(known,projected[-1]['knownBy'])
        self.assertEqual(['2026-10-08','2026-10-09','2026-10-12'],[h.calendar(p['t']) for p in projected]);self.assertEqual([100.,102.,103.],[p['v'] for p in projected])
        self.assertEqual('2026-10-12T23:00:00Z',projected[1]['knownBy'])
    def test_incomplete_monday_quote_cannot_advance_clock(self):
        self.capture('2026-10-12T14:00:00Z',[('2026-10-09',107.),('2026-10-12',114.)])
        with self.assertRaisesRegex(ValueError,'incomplete market session'):self.project()
    def test_wrong_archived_units_rejected_even_when_rehashed(self):
        self.capture('2026-10-12T14:00:00Z',[('2026-10-09',107.)],unit='EUR')
        with self.assertRaisesRegex(ValueError,'unit/cadence differs'):self.project()
    def test_native_period_gap_repaired_from_retained_vector_with_later_availability(self):
        self.capture('2026-10-12T14:00:00Z',[('2026-10-08',100.),('2026-10-09',114.)])
        self.original['dates']=['2026-10-07'];self.original['timestamps']=[h.midnight('2026-10-07')]
        projected=self.project();self.assertEqual(['2026-10-07','2026-10-08','2026-10-09'],[h.calendar(p['t']) for p in projected]);self.assertEqual('2026-10-12T14:00:00Z',projected[1]['knownBy'])
    def test_seed_boundary_preserves_original_published_value(self):
        self.original['dates']=['2026-10-09'];self.original['timestamps']=[h.midnight('2026-10-09')]
        self.capture('2026-10-10T12:00:00Z',[('2026-10-09',114.)])
        self.assertEqual([100.],[p['v'] for p in self.project()]);self.assertEqual(1,len(self.row['recoveredCalculations']))
    def test_coherent_archived_vector_and_blob_change_does_not_rewrite_capture_ledger(self):
        capture=self.capture('2026-10-12T14:00:00Z',[('2026-10-09',107.)]);proof=capture['sources']['spy']
        source=json.loads((self.root/'market-evidence/collection-archive/blobs'/(proof['blob']+'.json')).read_text());source['observations'][-1]['v']=999.
        source['sourceRevision']=h.digest(source['observations']);raw=h.encode(source);sha=h.blob(raw)
        (self.root/'market-evidence/collection-archive/blobs'/(sha+'.json')).write_bytes(raw);proof.update(blob=sha,sourceRevision=source['sourceRevision'],nativeValue=999.)
        with self.assertRaisesRegex(ValueError,'retained capture ledger'):self.project()

class ExactArchiveRecovery(unittest.TestCase):
    def test_invalid_archive_identity_cannot_resolve_a_filesystem_path(self):
        with self.assertRaisesRegex(ValueError,'Invalid exact archive identity'):
            h.archived_bytes(Path('not-accessed.json'),'../../outside')
    def test_bad_blob_restored_from_exact_cache_and_corrupt_bytes_preserved(self):
        with tempfile.TemporaryDirectory(dir=BASE) as folder:
            root=Path(folder);payload=b'{"captured":"historical","value":107}\n';sha=h.blob(payload)
            cache=root/'cache';(cache/'blobs').mkdir(parents=True);(cache/'blobs'/(sha+'.json')).write_bytes(payload)
            target=root/'stage'/('original-'+sha+'.json');target.parent.mkdir();target.write_bytes(b'wrong')
            self.assertEqual(payload,h.archived_bytes(target,sha,cache));self.assertEqual(payload,target.read_bytes())
            self.assertEqual([b'wrong'],[p.read_bytes() for p in target.parent.glob('*.quarantined-*')])
    def test_wrong_hash_retrieval_does_not_replace_historical_bytes(self):
        import base64,io
        with tempfile.TemporaryDirectory(dir=BASE) as folder:
            root=Path(folder);target=root/'source.json';target.write_bytes(b'bad retained original');sha=h.blob(b'expected')
            response=io.BytesIO(json.dumps({'sha':sha,'encoding':'base64','content':base64.b64encode(b'wrong retrieval').decode()}).encode())
            with patch.object(h.urllib.request,'urlopen',return_value=response),self.assertRaisesRegex(ValueError,'response hash differs'):
                h.archived_bytes(target,sha,root/'empty-cache')
            self.assertEqual(b'bad retained original',target.read_bytes())
    def test_unavailable_exact_archive_never_uses_fresh_provider_values(self):
        with tempfile.TemporaryDirectory(dir=BASE) as folder:
            root=Path(folder);target=root/'source.json';target.write_bytes(b'retained bad evidence')
            with patch.object(h.urllib.request,'urlopen',side_effect=OSError('unavailable')),self.assertRaisesRegex(ValueError,'Exact archived source unavailable'):
                h.archived_bytes(target,h.blob(b'authentic past state'),root/'empty-cache')
            self.assertEqual(b'retained bad evidence',target.read_bytes())

class SeedAdmissionContract(unittest.TestCase):
    def test_seed_held_case_passes_full_admission_with_explicit_limitations(self):
        # A small explicitly trusted baseline fixture qualifies the production
        # audit boundary without rewriting the actual immutable repository seed.
        real_root=BASE/'market-navigator-rebuild-data';real_seed=h.read(BASE/'market-navigator-rebuild-seed.json')
        registry=h.read(real_root/'data/market-backend/component-registry-v1.json');catalog=h.read(real_root/'data/market-backend/data-catalog.json');metas={m['id']:m for m in catalog['series']}
        clock=dt.datetime(2026,10,8,2,tzinfo=dt.timezone.utc);ids=[r['id'] for r in registry['components']]
        with tempfile.TemporaryDirectory(dir=BASE) as folder:
            root=Path(folder)
            for directory in ('data/market-backend','market-evidence/series','market-evidence/reports'):
                shutil.copytree(real_root/directory,root/directory,dirs_exist_ok=True)
            for sid in ids:
                path=root/'market-evidence/series'/(sid+'.json');source=h.read(path);source['last_successful']=clock.isoformat();h.write(path,source)
            capture=h.live_capture(root,metas,ids,clock);h.save_receipt(root,capture)
            seed=copy.deepcopy(real_seed)
            for key,row in seed['indices'].items():
                row['dates']=['2026-10-07'];row['timestamps']=[h.midnight('2026-10-07')];row['values']=[row['values'][0]]
                for field in ('componentValues','componentSignals','componentObservationDates'):
                    row[field]={sid:[values[0]] for sid,values in row[field].items()}
            model,_=h.recover(seed,registry,[capture]);h.write(root/'market-evidence/persistent-indices-v1.json',model)
            trusted=root/'trusted';trusted.mkdir();(trusted/'market-navigator-rebuild-seed.json').write_bytes(h.encode(seed));original_read=w.h.read
            def fixture_read(path):
                if Path(path)==BASE/'market-navigator-rebuild-seed.json':return seed
                return original_read(path)
            with patch.object(w,'BASE',trusted),patch.object(w.h,'BASELINE_BLOB',h.blob(h.encode(seed))),patch.object(w.h,'read',side_effect=fixture_read):
                projected=w.h.compatibility(model,registry,catalog,root);h.write(root/'market-evidence/derived-indices-persistent-v1.json',projected)
                report=w.audit(root,clock)
            self.assertTrue(report['summary']['ready']);self.assertEqual(3,report['summary']['indicesVerified'])
            self.assertTrue(all(x['projectionState']=='baseline-held' for x in report['indices'].values()))
            exporter=load('chronology_delivery','market-navigator-assurance-export.py');store=root/'delivery-store';name='generation-'+'a'*20
            for directory in ('market-evidence','data/market-backend'):shutil.copytree(root/directory,store/name/directory,dirs_exist_ok=True)
            h.write(store/'current.json',{'generation':name,'revision':'a'*20});h.write(store/'assurance-status.json',{'generation':{'generation':name,'revision':'a'*20}})
            delivered=root/'delivered';exporter.export(store,delivered)
            bundle=delivered/'generations'/name
            with patch.object(w,'BASE',trusted),patch.object(w.h,'BASELINE_BLOB',h.blob(h.encode(seed))),patch.object(w.h,'read',side_effect=fixture_read):
                self.assertEqual(3,w.audit(bundle,clock)['summary']['indicesVerified'])
            # Damage only the temporary delivery fixture; original capture survives.
            archive_blob=next((bundle/'market-evidence/collection-archive/blobs').glob('*.json'));archive_blob.write_bytes(b'{}')
            with self.assertRaisesRegex(ValueError,'Governed archive evidence hash differs'):exporter.referenced_index_evidence(bundle)
            projected['indices']['risk']['horizons']['5D']['curve'][0]['baselineInputs']['spy']['v']*=2
            h.write(root/'market-evidence/derived-indices-persistent-v1.json',projected)
            with patch.object(w,'BASE',trusted),patch.object(w.h,'BASELINE_BLOB',h.blob(h.encode(seed))),patch.object(w.h,'read',side_effect=fixture_read),self.assertRaisesRegex(ValueError,'Projected original endpoint inputs differ'):
                w.audit(root,clock)

class HealthScopeContract(unittest.TestCase):
    def test_native_source_success_does_not_hide_index_limitations(self):
        fixture=load('health_native_fixture','market-navigator-assurance-tests.py');case=fixture.Assurance();case.setUp()
        try:
            report=fixture.a.assess(case.root,fixture.NOW,admission={'summary':{'ready':True,'validUntil':(fixture.NOW+dt.timedelta(minutes=30)).isoformat()},'indices':{'risk':{'id':'risk','status':'verified','componentObservationDates':{'qqq':'2026-10-08'},'limitations':['Original availability not reconstructed']}}})
            self.assertEqual('verified',report['series']['qqq']['status']);self.assertEqual('verified-with-limitations',report['state']);self.assertEqual('verified-with-limitations',report['indices']['risk']['status'])
        finally:case.tearDown()

class MixedCalendarContract(unittest.TestCase):
    def test_macro_cutoff_does_not_crop_completed_equity_periods(self):
        root=BASE/'market-navigator-rebuild-data';model=h.read(root/'market-evidence/persistent-indices-v1.json');registry=h.read(root/'data/market-backend/component-registry-v1.json');catalog=h.read(root/'data/market-backend/data-catalog.json')
        # Isolate the compatibility consumer of projected curves. The projection
        # itself has separate real-blob numerical and completed-session tests.
        def projected(_root,row,original,_catalog,_registry):
            key=next(k for k,v in model['indices'].items() if v is row);days=['2026-10-08','2026-10-09'] if key=='macro' else ['2026-10-08','2026-10-09','2026-10-12']
            points=[{'t':t,'v':v} for t,v in zip(original['timestamps'],original['values'])]
            for day in days:
                points.append({'t':h.midnight(day),'v':row['values'][-1],'knownBy':'2026-10-13T02:00:00Z','nativeInputs':{sid:{'t':h.midnight(day),'v':row['componentValues'][sid][-1]} for sid in row['components']}})
            return points
        with patch.object(h.integrity,'latest_projection',side_effect=projected):evidence=h.compatibility(model,registry,catalog,root)
        self.assertEqual('2026-10-12',evidence['commonMarketAnchor'])
        self.assertEqual('2026-10-12',evidence['indices']['growth']['horizons']['5D']['commonNow']);self.assertEqual('2026-10-12',evidence['indices']['risk']['horizons']['5D']['commonNow']);self.assertEqual('2026-10-09',evidence['indices']['macro']['horizons']['5D']['commonNow'])
        self.assertEqual('2026-10-12',h.calendar(evidence['indices']['growth']['horizons']['5D']['curve'][-1]['t']))

@unittest.skipUnless(INCIDENT.exists(),'Frozen owner incident available on evidence-enabled qualification')
class IncidentContract(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(dir=BASE);self.root=Path(self.temp.name)
        shutil.copytree(INCIDENT,self.root,dirs_exist_ok=True)
        h.build(self.root,BASE/'market-navigator-rebuild-archive',BASE/'market-navigator-rebuild-seed.json',BASE/'market-navigator-rebuild-archive-inventory.json',NOW)
    def tearDown(self):self.temp.cleanup()
    def test_october_12_incident_ends_on_native_friday(self):
        report=w.audit(self.root,NOW);derived=h.read(self.root/'market-evidence/derived-indices-persistent-v1.json')
        self.assertTrue(report['summary']['ready']);self.assertEqual(3,report['summary']['indicesVerified'])
        self.assertEqual('2026-10-09',derived['commonMarketAnchor'])
        for key,index in derived['indices'].items():
            self.assertEqual(['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09'],[h.calendar(p['t']) for p in index['horizons']['5D']['curve']])
            self.assertEqual('2026-10-12T14:45:17Z',index['horizons']['5D']['curve'][-1]['knownBy'])
    def test_coherent_index_input_tampering_rejected(self):
        model=h.read(self.root/'market-evidence/persistent-indices-v1.json');registry=h.read(self.root/'data/market-backend/component-registry-v1.json');row=model['indices']['risk'];sid='spy';i=len(row['dates'])-1;wrong=row['componentValues'][sid][i]*2
        row['componentValues'][sid][i]=wrong;row['recoveredCalculations'][-1]['sources'][sid]['nativeValue']=wrong
        rule=next(x for x in registry['components'] if x['id']==sid)
        row['componentSignals'][sid][i]=rule['direction']*math.log(wrong/row['componentValues'][sid][0])/rule['scale']['annualizedScale'];row['values'][i]=100+math.fsum(row['componentSignals'][x][i] for x in row['components'])/7
        h.write(self.root/'market-evidence/persistent-indices-v1.json',model)
        with self.assertRaisesRegex(ValueError,'Archived source linkage differs: spy'):w.audit(self.root,NOW)
    def test_actual_blob_corruption_rejected(self):
        model=h.read(self.root/'market-evidence/persistent-indices-v1.json');proof=model['indices']['risk']['recoveredCalculations'][-1]['sources']['spy']
        (self.root/'market-evidence/collection-archive/blobs'/(proof['blob']+'.json')).write_text('{}')
        with self.assertRaisesRegex(ValueError,'Archived source blob hash differs'):w.audit(self.root,NOW)

if __name__=='__main__':unittest.main(verbosity=2)
