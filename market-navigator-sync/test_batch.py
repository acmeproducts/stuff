"""Daily batch acceptance: seven components, same closing date, 06:00 Pacific."""
import datetime as dt,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import shutil
from zoneinfo import ZoneInfo
import batch as b
import run as s

UTC=dt.timezone.utc
class DailyBatch(unittest.TestCase):
 def test_five_early_two_overnight(self):
  days=['2026-10-20','2026-10-19']
  early=dt.datetime(2026,10,20,20,tzinfo=ZoneInfo(b.ZONE))
  self.assertEqual(b.contract(early,'2026-10-20','2026-10-19',days)['state'],'WAITING')
  overnight=dt.datetime(2026,10,21,5,tzinfo=ZoneInfo(b.ZONE))
  self.assertEqual(b.contract(overnight,'2026-10-20','2026-10-19',days)['state'],'WAITING')
  self.assertEqual(b.contract(overnight,'2026-10-20','2026-10-20',days)['state'],'READY')
 def test_deadline_is_exact(self):
  days=['2026-10-20','2026-10-19']
  before=dt.datetime(2026,10,21,5,59,59,tzinfo=ZoneInfo(b.ZONE))
  at=before+dt.timedelta(seconds=1)
  self.assertEqual(b.contract(before,'2026-10-20','2026-10-19',days)['state'],'WAITING')
  self.assertEqual(b.contract(at,'2026-10-20','2026-10-19',days)['state'],'LATE')
  self.assertEqual(b.contract(at,'2026-10-20','2026-10-20',days)['state'],'READY')
 def test_older_missed_batch_is_late_even_before_next_deadline(self):
  self.assertEqual(b.contract(dt.datetime(2026,10,21,20,tzinfo=ZoneInfo(b.ZONE)),'2026-10-21','2026-10-19',['2026-10-21','2026-10-20','2026-10-19'])['state'],'LATE')
 def test_weekend_does_not_invent_a_batch(self):
  day=dt.datetime(2026,10,18,10,tzinfo=ZoneInfo(b.ZONE))
  self.assertEqual(b.contract(day,'2026-10-16','2026-10-16',['2026-10-16','2026-10-15'])['state'],'READY')
 def test_deadline_tracks_daylight_saving(self):
  self.assertEqual(b.deadline('2026-10-20').astimezone(UTC).hour,13)
  self.assertEqual(b.deadline('2026-11-02').astimezone(UTC).hour,14)
 def fixture(self,root,late=False):
  rows=[{'id':'s'+str(i),'cadence':'daily','latest':'2026-10-19' if late and i==6 else '2026-10-20','required':'2026-10-20','status':'PASS','missingMarketSessions':[],'problems':[]} for i in range(7)]
  data=root/'market-navigator-rebuild-data'
  s.write(data/'market-evidence/sync-proof.json',{'qualification':{'status':'PASS','freshness':{'schema':'market-navigator-release-completeness-v1','status':'PASS','marketDate':'2026-10-20','requiredSourceIds':[r['id'] for r in rows],'sources':rows}},'historical':{'cutoff':'2026-10-20'}})
  s.write(data/'market-evidence/health-envelope.json',{'series':{r['id']:{} for r in rows}})
  return data
 def test_mixed_component_dates_cannot_be_promoted(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);self.fixture(root,True)
   with self.assertRaisesRegex(ValueError,'Mixed-date'):b.publish_receipt(root,dt.datetime(2026,10,21,13,tzinfo=UTC),'2026-10-20',['2026-10-20'],{})
 def test_same_day_batch_is_immutable_complete_and_hash_bound(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);data=self.fixture(root)
   now=dt.datetime(2026,10,22,14,tzinfo=UTC)
   result=b.publish_receipt(root,now,'2026-10-21',['2026-10-21','2026-10-20'],{'status':'INCOMPLETE','error':'two inputs missing'})
   self.assertEqual(result['batch']['state'],'LATE');self.assertEqual(result['batch']['servingDate'],'2026-10-20')
   q=s.read(data/'market-evidence/sync-proof.json')['qualification']['freshness']
   self.assertEqual(q['scope'],'daily-batch');self.assertIsNone(q['validUntil']);self.assertEqual(q['status'],'PASS')
   self.assertTrue(all(r['latest']=='2026-10-20' for r in q['sources']))
   descriptor=s.read(data/'package.json')
   for path,digest in descriptor['resources'].items():self.assertEqual(s.hashlib.sha256((data/path).read_bytes()).hexdigest(),digest)
   self.assertEqual(descriptor['version'],s.digest(descriptor['resources']))
 def test_collection_failure_keeps_verified_batch_before_and_after_deadline(self):
  for hour,state in [(12,'WAITING'),(13,'LATE')]:
   with self.subTest(hour=hour),tempfile.TemporaryDirectory() as tmp:
    base=Path(tmp)/'base';base.mkdir();self.fixture(base);output=Path(tmp)/'published'
    now=dt.datetime(2026,10,22,hour,tzinfo=UTC)
    before=(base/'market-navigator-rebuild-data/market-evidence/sync-proof.json').read_bytes()
    def qualified(base_arg,source,candidate,**kwargs):shutil.copytree(base,candidate)
    with patch.object(b,'market_days',return_value=('2026-10-21',['2026-10-21','2026-10-20'])),patch.object(b.s,'synchronize',side_effect=RuntimeError('provider timeout')),patch.object(b.historical,'build',side_effect=qualified):
     result=b.synchronize(base,output,now)
    self.assertEqual(result['status'],'PASS');self.assertEqual(result['batch']['state'],state);self.assertEqual(result['batch']['servingDate'],'2026-10-20')
    self.assertEqual((base/'market-navigator-rebuild-data/market-evidence/sync-proof.json').read_bytes(),before)
 def test_no_unqualified_batch_can_be_published(self):
  with tempfile.TemporaryDirectory() as tmp:
   base=Path(tmp)/'base';base.mkdir();self.fixture(base);output=Path(tmp)/'published'
   with patch.object(b,'market_days',return_value=('2026-10-21',['2026-10-21','2026-10-20'])),patch.object(b.s,'synchronize',side_effect=RuntimeError('provider timeout')),patch.object(b.historical,'build',side_effect=ValueError('unqualified')):
    with self.assertRaisesRegex(ValueError,'unqualified'):b.synchronize(base,output,dt.datetime(2026,10,22,13,tzinfo=UTC))
   self.assertFalse(output.exists())
if __name__=='__main__':unittest.main()
