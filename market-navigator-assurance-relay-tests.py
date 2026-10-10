"""Relay metadata never renews verification; retries remain bounded."""
import contextlib,datetime as dt,importlib.util,io,json,os,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('mn_relay_hosted',Path(__file__).with_name('market-navigator-assurance-hosted.py'));hosted=importlib.util.module_from_spec(spec);spec.loader.exec_module(hosted)
class Relay(unittest.TestCase):
 def check(self,state,expected):
  with tempfile.TemporaryDirectory() as tmp:
   base=Path(tmp);(base/'market-navigator-rebuild-data/market-evidence').mkdir(parents=True);(base/'market-navigator-rebuild-data/data/market-backend').mkdir(parents=True)
   lease='2026-10-10T11:39:15Z';status={'state':state,'generation':None,'heartbeatAt':'2026-10-10T10:39:18Z','lastSuccess':{'at':'2026-10-10T10:39:18Z'},'assurance':{'validUntil':lease},'error':'synthetic failure' if state=='needs-attention' else None}
   def run(root,store):hosted.r.h.write(store/'assurance-status.json',status);return status
   with patch.object(hosted,'BASE',base),patch.object(hosted.r,'run',run),patch.dict(os.environ,{'MN_RELAY_INTERVAL_SECONDS':'1200','GITHUB_RUN_ID':'12345','MN_WORKFLOW_RUN_URL':'https://github.com/acmeproducts/stuff/actions/runs/12345'}),contextlib.redirect_stdout(io.StringIO()):
    hosted.refresh(base/'public',base/'store')
   published=json.loads((base/'public/assurance-status.json').read_text());self.assertEqual(published['assurance']['validUntil'],lease);self.assertEqual(published['heartbeatAt'],status['heartbeatAt']);self.assertEqual(published['publisher']['intervalSeconds'],expected);self.assertEqual(published['publisher']['workflowRunId'],'12345');self.assertGreater(dt.datetime.fromisoformat(published['publisher']['nextAttemptNotBefore']),dt.datetime.now(dt.timezone.utc))
 def test_verified_cycle_is_twenty_minutes_without_extended_lease(self):self.check('verified',1200)
 def test_failed_cycle_retries_in_five_minutes_preserving_last_proof(self):self.check('needs-attention',300)
 def test_serialization_and_guard_failure_stop_dispatch(self):
  wf=Path('.github/workflows/market-navigator-assurance-live.yml').read_text(encoding='utf-8-sig');self.assertIn('cancel-in-progress: false',wf);self.assertIn("steps.recovery.outcome != 'skipped'",wf);self.assertLess(wf.index("assert s['publisher']['mode']"),wf.index('gh workflow run market-navigator-assurance-live.yml'));self.assertIn('while remaining>0:',wf)
if __name__=='__main__':unittest.main(verbosity=2)
