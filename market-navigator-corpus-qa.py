"""Independent corpus fault tests; no provider calls, credentials or research-model activation."""
import contextlib, copy, datetime as dt, hashlib, importlib.util, io, json, os, shutil, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location("corpus",Path(__file__).with_name("market-navigator-corpus.py"));corpus=importlib.util.module_from_spec(spec);spec.loader.exec_module(corpus)
ROOT=Path(os.environ.get("MN_CORPUS_FIXTURE_ROOT",".")).resolve()
REAL_DATETIME=dt.datetime
NOW=REAL_DATETIME(2026,10,7,2,20,tzinfo=dt.timezone.utc)
class FixtureDateTime(REAL_DATETIME):
    @classmethod
    def now(cls,tz=None):return NOW.astimezone(tz) if tz else NOW.replace(tzinfo=None)
dt.datetime=FixtureDateTime
# Freeze only the test process and its repair subprocesses. Production has no clock override.
REAL_RUN=corpus.subprocess.run
def fixture_run(command,**kwargs):
    bootstrap="import datetime as d,runpy,sys;R=d.datetime;N=R.fromisoformat('2026-10-07T02:20:00+00:00');"+chr(10)+"class F(R):"+chr(10)+" @classmethod"+chr(10)+" def now(c,tz=None):return N.astimezone(tz) if tz else N.replace(tzinfo=None)"+chr(10)+"d.datetime=F;script=sys.argv.pop(1);sys.argv[0]=script;runpy.run_path(script,run_name='__main__')"
    return REAL_RUN([command[0],"-c",bootstrap,*command[1:]],**kwargs)
corpus.subprocess.run=fixture_run
class CorpusTests(unittest.TestCase):
    def test_whole_inventory_has_no_silent_omissions(self):
        r=corpus.audit(ROOT,NOW)
        expected={p.relative_to(ROOT).as_posix() for folder in ("market-evidence","data/market-backend") for p in (ROOT/folder).rglob("*.json") if p.name not in ("corpus-health.json","corpus-repair.json")}
        self.assertEqual(set(r["files"]),expected)
        self.assertEqual(len(r["series"]),len(corpus.read(ROOT/"data/market-backend/data-catalog.json")["series"]))
        self.assertEqual(set(r["indices"]),{"growth","macro","risk"})
        self.assertEqual(r["series"]["pmi"]["status"],"disabled")
        self.assertTrue(all("pointChecks" in x for x in r["files"].values()))
        self.assertTrue(any(x["role"]=="research-only" for x in r["files"].values()))
    def test_GDP_parent_math_detects_level_overwrite(self):
        cat=corpus.read(ROOT/"data/market-backend/data-catalog.json")
        gdp=corpus.read(ROOT/"market-evidence/series/realGdp.json")
        derived=corpus.quarterly_transform(gdp["observations"],1)
        self.assertNotEqual(gdp["observations"][-1]["v"],derived[-1]["v"])
        # An independent reference-period join verifies the transformation, including a missing-quarter gap.
        rows=[{"t":dt.datetime(y,m,1,tzinfo=dt.timezone.utc).timestamp()*1000,"v":v} for y,m,v in ((2025,1,100),(2025,4,104),(2025,10,112),(2026,1,120))]
        actual=corpus.quarterly_transform(rows,1)
        self.assertEqual([x["t"] for x in actual],[rows[1]["t"],rows[3]["t"]])
        self.assertAlmostEqual(actual[0]["v"],4)
        self.assertAlmostEqual(actual[1]["v"],(120/112-1)*100)
        self.assertAlmostEqual(corpus.quarterly_transform(rows,4)[0]["v"],20)
    def test_wall_clock_not_stale_market_anchor(self):
        obj=corpus.read(ROOT/"market-evidence/series/qqq.json");cat=corpus.read(ROOT/"data/market-backend/data-catalog.json");rules=corpus.read(ROOT/"data/market-backend/publication-rules.json");meta=next(x for x in cat["series"] if x["id"]=="qqq")
        later=NOW+dt.timedelta(days=20);obj["last_successful"]=later.isoformat()
        status,_,_=corpus.freshness(meta,obj,cat,rules,later)
        self.assertEqual(status,"stale","fresh HTTP timestamp cannot conceal old observations")
    def test_stopped_collection_even_if_monthly_reference_valid(self):
        cat=corpus.read(ROOT/"data/market-backend/data-catalog.json");rules=corpus.read(ROOT/"data/market-backend/publication-rules.json");meta=next(x for x in cat["series"] if x["id"]=="cpi");obj=corpus.read(ROOT/"market-evidence/series/cpi.json");obj["last_successful"]=(NOW-dt.timedelta(days=3)).isoformat()
        status,_,why=corpus.freshness(meta,obj,cat,rules,NOW)
        self.assertEqual(status,"stale");self.assertIn("heartbeat",why)
    def test_weekly_release_boundary_and_ingestion_grace(self):
        rules=corpus.read(ROOT/"data/market-backend/publication-rules.json")["rules"]
        n=lambda s:dt.datetime.fromisoformat(s.replace("Z","+00:00"))
        self.assertEqual(str(corpus.weekly_expected(rules["nfci"],n("2026-10-07T12:29:00Z"))),"2026-09-25")
        self.assertEqual(str(corpus.weekly_expected(rules["nfci"],n("2026-10-08T12:31:00Z"))),"2026-10-02")
        self.assertEqual(str(corpus.weekly_expected(rules["initialClaims"],n("2026-10-07T02:00:00Z"))),"2026-09-26")
        self.assertEqual(str(corpus.weekly_expected(rules["initialClaims"],n("2026-10-09T12:31:00Z"))),"2026-10-03")
        # Labor Day shifts Wednesday's NFCI release and its ingestion deadline.
        self.assertEqual(str(corpus.weekly_expected(rules["nfci"],n("2026-09-10T12:31:00Z"))),"2026-08-28")
        self.assertEqual(str(corpus.weekly_expected(rules["nfci"],n("2026-09-11T12:31:00Z"))),"2026-09-04")
    def test_daily_timezone_does_not_age_at_UTC_midnight(self):
        self.assertEqual(str(corpus.eastern(dt.datetime(2026,10,7,2,tzinfo=dt.timezone.utc)).date()),"2026-10-06")
    def test_consumer_deadline_catches_stopped_heartbeat_before_another_audit(self):
        cat=corpus.read(ROOT/"data/market-backend/data-catalog.json");rules=corpus.read(ROOT/"data/market-backend/publication-rules.json");meta=next(x for x in cat["series"] if x["id"]=="cpi");obj=corpus.read(ROOT/"market-evidence/series/cpi.json")
        obj["last_successful"]=(NOW-dt.timedelta(hours=47)).isoformat()
        deadline=corpus.instant(corpus.freshness_deadline(meta,obj,cat,rules,NOW))
        self.assertEqual(deadline,NOW+dt.timedelta(hours=1))
    def test_consumer_deadline_uses_native_weekly_release_boundary(self):
        cat=corpus.read(ROOT/"data/market-backend/data-catalog.json");rules=corpus.read(ROOT/"data/market-backend/publication-rules.json");meta=next(x for x in cat["series"] if x["id"]=="nfci");obj=corpus.read(ROOT/"market-evidence/series/nfci.json")
        now=dt.datetime(2026,10,7,13,tzinfo=dt.timezone.utc);obj["last_successful"]=now.isoformat()
        deadline=corpus.instant(corpus.freshness_deadline(meta,obj,cat,rules,now))
        expected=dt.datetime(2026,10,8,12,30,tzinfo=dt.timezone.utc)
        self.assertLess(abs((deadline-expected).total_seconds()),1)
    def test_monthly_quarterly_do_not_stretch_reference_dates(self):
        cat=corpus.read(ROOT/"data/market-backend/data-catalog.json");rules=corpus.read(ROOT/"data/market-backend/publication-rules.json")
        for sid in ("cpi","corePce","realGdp","initialClaims","nfci"):
            meta=next(x for x in cat["series"] if x["id"]==sid);obj=corpus.read(ROOT/f"market-evidence/series/{sid}.json")
            self.assertEqual(corpus.freshness(meta,obj,cat,rules,NOW)[0],"current",sid)
    def test_finite_unique_future_revision_metadata_contract(self):
        base=corpus.read(ROOT/"market-evidence/series/qqq.json")
        mutations=[]
        z=copy.deepcopy(base);z["observations"][0]["v"]=float("nan");mutations.append((z,"non-finite or malformed observation"))
        z=copy.deepcopy(base);z["observations"][1]["t"]=z["observations"][0]["t"];mutations.append((z,"unordered or duplicate timestamp"))
        z=copy.deepcopy(base);z["observations"][-1]["t"]=(NOW+dt.timedelta(days=1)).timestamp()*1000;mutations.append((z,"future observation"))
        z=copy.deepcopy(base);z["sourceRevision"]="tampered";mutations.append((z,"source revision mismatch"))
        z=copy.deepcopy(base);z["count"]+=1;mutations.append((z,"count differs from observations"))
        z=copy.deepcopy(base);z["last"]=0;mutations.append((z,"first/last differs from observations"))
        for z,error in mutations:self.assertIn(error,corpus.points_errors(z,NOW))
    def clone(self,temp):
        target=Path(temp)
        for folder in ("market-evidence","data/market-backend"):shutil.copytree(ROOT/folder,target/folder)
        for src in Path(__file__).parent.glob("market-navigator*.py"):
            if src.name in ("market-navigator-corpus.py","market-navigator-r7-data-pipeline.py","market-navigator-r7-health.py","market-navigator-source-state.py","market-navigator-build-persistent-compat.py"):shutil.copy2(src,target/src.name)
        shutil.copy2(Path(__file__).with_name("market-navigator-persistent-index-qa.py"),target/"market-navigator-persistent-index-qa.py")
        return target
    def test_repair_append_only_formula_no_archival_promotion_and_idempotence(self):
        with tempfile.TemporaryDirectory() as temp:
            root=self.clone(temp);before=corpus.read(root/"market-evidence/persistent-indices-v1.json")
            for z in before["indices"].values():
                if z.get("prospectiveCaptures"):
                    for field in ("dates","timestamps","values"):z[field].pop()
                    for field in ("componentSignals","componentValues","componentObservationDates"):
                        for sid in z["components"]:z[field][sid].pop()
                    z["prospectiveCaptures"].pop()
            corpus.write(root/"market-evidence/persistent-indices-v1.json",before)
            retained={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for folder in ("data/market-backend/sources","market-evidence/trend-series") for p in (root/folder).rglob("*.json")}
            report,result=corpus.repair(root,dt.datetime.now(dt.timezone.utc))
            self.assertTrue(report["summary"]["ready"],result)
            after=corpus.read(root/"market-evidence/persistent-indices-v1.json")
            for key,z in before["indices"].items():
                zz=after["indices"][key];n=len(z["dates"])
                for field in ("dates","timestamps","values"):self.assertEqual(zz[field][:n],z[field],(key,field))
                for field in ("componentSignals","componentValues","componentObservationDates"):
                    for sid in z["components"]:self.assertEqual(zz[field][sid][:n],z[field][sid],(key,field,sid))
                for i,value in enumerate(zz["values"]):self.assertAlmostEqual(value,100+sum(zz["componentSignals"][sid][i] for sid in zz["components"])/7,10)
            for path,hash in retained.items():self.assertEqual(hash,hashlib.sha256((root/path).read_bytes()).hexdigest(),path)
            for sid,lag in (("gdpQoq",1),("gdpYoy",4)):
                obj=corpus.read(root/f"market-evidence/series/{sid}.json");parent=corpus.read(root/"market-evidence/series/realGdp.json")
                self.assertEqual(obj["observations"],corpus.quarterly_transform(parent["observations"],lag))
                self.assertEqual(obj["transformSourceRevision"],parent["sourceRevision"])
            digest=hashlib.sha256((root/"market-evidence/persistent-indices-v1.json").read_bytes()).hexdigest()
            report,result=corpus.repair(root,dt.datetime.now(dt.timezone.utc))
            self.assertTrue(report["summary"]["ready"]);self.assertEqual(digest,hashlib.sha256((root/"market-evidence/persistent-indices-v1.json").read_bytes()).hexdigest())
            self.assertEqual(result["actions"][-1]["changes"],{})
    def test_failed_repair_cannot_publish_partial_payload(self):
        with tempfile.TemporaryDirectory() as temp:
            root=self.clone(temp);path=root/"market-evidence/series/qqq.json";obj=corpus.read(path);obj["observations"][1]["t"]=obj["observations"][0]["t"];corpus.write(path,obj)
            before={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for folder in ("market-evidence","data/market-backend") for p in (root/folder).rglob("*.json") if p.name not in ("corpus-health.json","corpus-repair.json")}
            report,result=corpus.repair(root,dt.datetime.now(dt.timezone.utc))
            self.assertFalse(report["summary"]["ready"]);self.assertEqual(report["publicationStatus"],"held")
            for p,hash in before.items():self.assertEqual(hash,hashlib.sha256((root/p).read_bytes()).hexdigest(),p)
    def test_same_day_revision_requires_explicit_capture_not_restatement(self):
        with tempfile.TemporaryDirectory() as temp:
            root=self.clone(temp);report,result=corpus.repair(root,dt.datetime.now(dt.timezone.utc));self.assertTrue(report["summary"]["ready"])
            p=root/"market-evidence/series/qqq.json";obj=corpus.read(p);obj["observations"][-1]["v"]+=1;obj["sourceRevision"]=corpus.digest(obj["observations"]);corpus.write(p,obj)
            man=corpus.read(root/"market-evidence/operational-manifest.json");man["series"]["qqq"]["source_revision"]=obj["sourceRevision"];corpus.write(root/"market-evidence/operational-manifest.json",man)
            digest=hashlib.sha256((root/"market-evidence/persistent-indices-v1.json").read_bytes()).hexdigest()
            report,result=corpus.repair(root,dt.datetime.now(dt.timezone.utc));self.assertFalse(report["summary"]["ready"])
            self.assertEqual(hashlib.sha256((root/"market-evidence/persistent-indices-v1.json").read_bytes()).hexdigest(),digest)
    def test_real_later_same_day_capture_repairs_without_rewriting_history(self):
        with tempfile.TemporaryDirectory() as temp:
            root=self.clone(temp);report,_=corpus.repair(root,NOW);self.assertTrue(report['summary']['ready'])
            before=corpus.read(root/'market-evidence/persistent-indices-v1.json');row=before['indices']['growth'];n=len(row['dates'])
            obj=corpus.read(root/'market-evidence/series/qqq.json');later=corpus.instant(obj['last_successful'])+dt.timedelta(hours=1)
            obj['observations'][-1]['v']+=1;obj['sourceRevision']=corpus.digest(obj['observations']);obj['last_successful']=obj['last_attempted']=later.isoformat();corpus.write(root/'market-evidence/series/qqq.json',obj)
            man=corpus.read(root/'market-evidence/operational-manifest.json');man['series']['qqq'].update(source_revision=obj['sourceRevision'],last_successful=obj['last_successful'],last_attempted=obj['last_attempted']);corpus.write(root/'market-evidence/operational-manifest.json',man)
            report,result=corpus.repair(root,NOW);self.assertTrue(report['summary']['ready'],result)
            current=corpus.read(root/'market-evidence/persistent-indices-v1.json')['indices']['growth']
            for field in ('dates','timestamps','values'):self.assertEqual(current[field][:n],row[field])
            for field in ('componentSignals','componentValues','componentObservationDates'):
                for sid in row['components']:self.assertEqual(current[field][sid][:n],row[field][sid])
            self.assertEqual(current['dates'][-1],row['dates'][-1]);self.assertGreater(current['timestamps'][-1],row['timestamps'][-1]);self.assertEqual(current['timestamps'][-1],int(later.timestamp()*1000))
            self.assertTrue(result['actions'][-1]['changes']['growth']['sameDay'])
            digest=hashlib.sha256((root/'market-evidence/persistent-indices-v1.json').read_bytes()).hexdigest();report,_=corpus.repair(root,NOW);self.assertTrue(report['summary']['ready']);self.assertEqual(digest,hashlib.sha256((root/'market-evidence/persistent-indices-v1.json').read_bytes()).hexdigest())
    def test_collection_after_audit_start_recovers_missing_qqq_before_publication(self):
        with tempfile.TemporaryDirectory() as temp:
            root=self.clone(temp);baseline,_=corpus.repair(root,NOW);self.assertTrue(baseline['summary']['ready']);path=root/'market-evidence/series/qqq.json';obj=corpus.read(path);path.unlink()
            completed=NOW-dt.timedelta(seconds=5);obj['last_successful']=obj['last_attempted']=completed.isoformat();obj['observations'][-1]['v']+=1;obj['sourceRevision']=corpus.digest(obj['observations'])
            original_run=corpus.subprocess.run
            def recollect(command,**kwargs):
                if command[1].endswith('market-navigator-r7-data-pipeline.py'):
                    self.assertIn('qqq',kwargs['env']['MARKET_NAVIGATOR_SERIES_IDS'].split(','));staged=Path(kwargs['cwd']);corpus.write(staged/'market-evidence/series/qqq.json',obj)
                    man=corpus.read(staged/'market-evidence/operational-manifest.json');man['series']['qqq'].update(source_revision=obj['sourceRevision'],last_attempted=obj['last_attempted'],last_successful=obj['last_successful']);corpus.write(staged/'market-evidence/operational-manifest.json',man)
                    return corpus.subprocess.CompletedProcess(command,0,'','')
                return original_run(command,**kwargs)
            with patch.object(corpus.subprocess,'run',recollect):report,result=corpus.repair(root,NOW-dt.timedelta(seconds=30),collect=True)
            self.assertTrue(report['summary']['ready'],(result,report['findings']));self.assertEqual(report['publicationStatus'],'qualified');self.assertEqual(report['series']['qqq']['status'],'current');self.assertEqual(corpus.read(path)['last_successful'],completed.isoformat())
    def test_targeted_pipeline_keeps_other_sources_and_fallback_lineage_separate(self):
        module=corpus.load_module("pipeline",Path(__file__).with_name("market-navigator-r7-data-pipeline.py"))
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);module.CATALOG=root/"catalog.json";module.ROOT=root/"evidence";module.SERIES=module.ROOT/"series";module.REPORTS=module.ROOT/"reports";module.MANIFEST=module.ROOT/"manifest.json";module.BOOT=False
            meta={"id":"qqq","provider":"Yahoo Finance","provider_identifier":"QQQ","native_unit":"USD","native_cadence":"trading-day","provider_chain":[{"provider":"Yahoo Finance","identifier":"QQQ"},{"provider":"Stooq","identifier":"qqq.us"}]}
            corpus.write(module.CATALOG,{"schema":"market-navigator-data-catalog-v1","series":[meta,{"id":"other","enabled":True}],"canonical_horizons":list(corpus.H)})
            corpus.write(module.MANIFEST,{"series":{"other":{"source_revision":"keep"}}})
            old=[{"t":dt.datetime(2025,1,1,tzinfo=dt.timezone.utc).timestamp()*1000,"v":111}]
            corpus.write(module.SERIES/"qqq.json",{"observations":old,"provider":"Yahoo Finance","providerIdentifier":"QQQ"})
            replacement=[{"t":int((NOW-dt.timedelta(days=i)).timestamp()*1000),"v":200+i} for i in (10,1)]
            requests=[]
            def fake(provider,symbol,boot):
                requests.append((provider,symbol,boot))
                if provider=="Yahoo Finance":raise RuntimeError("provider temporarily unavailable")
                return replacement,200
            with patch.dict(os.environ,{"MARKET_NAVIGATOR_SERIES_IDS":"qqq"}),patch.object(module,"fetch_source",fake),contextlib.redirect_stdout(io.StringIO()):module.main()
            obj=corpus.read(module.SERIES/"qqq.json");self.assertEqual(obj["observations"],replacement)
            self.assertNotIn(old[0],obj["observations"]);self.assertEqual(requests,[("Yahoo Finance","QQQ",False),("Stooq","qqq.us",False),("Stooq","qqq.us",True)])
            self.assertEqual(corpus.read(module.MANIFEST)["series"]["other"],{"source_revision":"keep"})
    def test_health_does_not_repeat_retired_collector_attempt(self):
        module=corpus.load_module("health_policy",Path(__file__).with_name("market-navigator-r7-health.py"))
        module.SERIES=ROOT/"market-evidence/series";module.RULES=ROOT/"data/market-backend/publication-rules.json"
        cat=corpus.read(ROOT/"data/market-backend/data-catalog.json");meta=next(x for x in cat["series"] if x["id"]=="qqq");obj=corpus.read(module.SERIES/"qqq.json");state=corpus.read(ROOT/"market-evidence/operational-manifest.json")["series"]["qqq"]
        _,_,why,*_=module.classify(meta,obj["last"],state,{"lastAttempt":"2026-09-03","lastError":"retired cache failure"},cat,NOW.date(),obj["last"])
        self.assertNotIn("2026-09-03",why);self.assertIn(obj["last_attempted"],why)
    def test_published_asset_guard_retries_once_and_rejects_bad_paths(self):
        module=corpus.load_module("pages_guard",Path(__file__).with_name("market-navigator-corpus-pages.py"))
        expected=hashlib.sha256(b"canonical").hexdigest();calls=[]
        def repaired(url):
            calls.append(url);return b"old" if len(calls)==1 else b"canonical"
        self.assertEqual(module.verify_asset("https://example.test","market-evidence/series/qqq.json",expected,repaired),"market-evidence/series/qqq.json")
        self.assertEqual(len(calls),2)
        with self.assertRaises(RuntimeError):module.verify_asset("https://example.test","market-evidence/series/qqq.json",expected,lambda url:b"stale")
        with self.assertRaises(ValueError):module.verify_asset("https://example.test","../unrelated.json",expected,lambda url:b"canonical")
if __name__=="__main__":
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(CorpusTests))
    Path("market-navigator-corpus-test-report.json").write_text(json.dumps({"status":"PASS" if result.wasSuccessful() else "FAIL","tests":result.testsRun,"failures":len(result.failures),"errors":len(result.errors),"fixture":str(ROOT),"network":"none","realProviderAvailability":"not tested"},indent=2)+"\n")
    raise SystemExit(0 if result.wasSuccessful() else 1)
