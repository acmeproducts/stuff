"""Release gate tests, independent of historical model replay fixtures."""
import datetime as dt,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
HERE=Path(__file__).resolve().parent
def module(name):
 spec=importlib.util.spec_from_file_location(name,HERE/(name+'.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
s=module('run');g=module('freshness');schedule=module('market-navigator-etl-schedule')
NOW=dt.datetime(2026,10,21,8,tzinfo=dt.timezone.utc)
class Completeness(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  self.ids=[('spy','trading-day'),('hySpread','daily'),('fund','daily-nav'),('cpi','monthly')]
  s.write(self.root/'data/market-backend/data-catalog.json',{'series':[{'id':i,'native_cadence':c,'enabled':True} for i,c in self.ids]})
  s.write(self.root/'data/market-backend/publication-rules.json',{'rules':{'cpi':{'available_by_day_of_month':15}}})
  self.dates=['2026-10-14','2026-10-15','2026-10-16','2026-10-19','2026-10-20']
  for i,c in self.ids:self.save(i,self.dates if c!='monthly' else ['2026-09-01'])
 def tearDown(self):self.tmp.cleanup()
 def save(self,i,dates):s.write(self.root/('market-evidence/series/'+i+'.json'),{'observations':[{'t':s.ms(d),'v':10} for d in dates],'last_successful':NOW.isoformat()})
 def audit(self):return g.require_complete(self.root,NOW,s.read,schedule)
 def test_complete_same_date_passes(self):
  q=self.audit();self.assertEqual(q['status'],'PASS');self.assertEqual(q['marketDate'],'2026-10-20');self.assertEqual(q['validUntil'],'2026-10-21T22:00:00+00:00')
 def test_hy_one_day_behind_rejected_even_fresh_collection(self):
  self.save('hySpread',self.dates[:-1])
  with self.assertRaises(g.IncompleteData) as e:self.audit()
  self.assertIn('hySpread',str(e.exception));self.assertEqual(e.exception.report['status'],'BLOCKED')
 def test_interior_gap_rejected_even_current_endpoint(self):
  self.save('hySpread',[d for d in self.dates if d!='2026-10-16'])
  with self.assertRaisesRegex(g.IncompleteData,'2026-10-16'):self.audit()
 def test_daily_nav_is_not_exempt(self):
  self.save('fund',self.dates[:-1])
  with self.assertRaisesRegex(g.IncompleteData,'fund'):self.audit()
 def test_monthly_calendar_overdue_rejected(self):
  self.save('cpi',['2026-08-01'])
  with self.assertRaisesRegex(g.IncompleteData,'cpi'):self.audit()
 def test_weekend_does_not_demand_synthetic_observations(self):
  for i,c in self.ids:
   if c in g.DAILY:self.save(i,self.dates[:3])
  q=g.require_complete(self.root,dt.datetime(2026,10,18,8,tzinfo=s.UTC),s.read,schedule)
  self.assertEqual(q['marketDate'],'2026-10-16')
 def test_no_due_shortcut_cannot_bypass_gate(self):
  base=HERE.parent/'market-navigator-throwaway-review';target=self.root/'should-not-exist'
  with patch.object(s,'collect',return_value=[{'id':'hySpread','status':'not-due','changed':False}]):
   with self.assertRaisesRegex(ValueError,'INCOMPLETE_DATA'):s.synchronize(base,target,NOW)
  self.assertFalse(target.exists())
if __name__=='__main__':unittest.main()
