import importlib.util,datetime as dt
from pathlib import Path
p=Path(__file__).with_name('market-navigator-etl-schedule.py')
spec=importlib.util.spec_from_file_location('eligibility',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def stored(s):
 t=int(dt.datetime.fromisoformat(s).replace(tzinfo=dt.timezone.utc).timestamp()*1000)
 return {'observations':[{'t':t,'v':1}]}
cases=[
 ('realGdp','quarterly','2026-10-16','2026-04-01',False),
 ('realGdp','quarterly','2026-11-16','2026-04-01',True),
 ('realGdp','quarterly','2026-11-16','2026-07-01',False),
 ('initialClaims','weekly','2026-10-14','2026-10-01',False),
 ('initialClaims','weekly','2026-10-15','2026-10-01',True),
 ('cpi','monthly','2026-10-14','2026-08-01',False),
 ('cpi','monthly','2026-10-16','2026-08-01',True),
 ('cpi','monthly','2026-10-16','2026-09-01',False),
 ('spy','trading-day','2026-10-17','2026-10-15',False),
 ('spy','trading-day','2026-10-16','2026-10-14',True),
]
for sid,cad,t,latest,expected in cases:
 actual,_=m.eligibility({'id':sid,'native_cadence':cad},stored(latest),t,{'cpi':{'available_by_day_of_month':15}})
 assert actual==expected,(sid,t,actual,expected)
assert m.eligibility({'id':'spy','native_cadence':'trading-day'},stored('2026-10-14'),'2026-10-16',force=True)[0]
assert not m.eligibility({'id':'spy','native_cadence':'trading-day'},stored('2026-10-14'),'2026-10-16',last_attempt='2026-10-16')[0]
print('PASS 12 scheduling, skip, and retry cases')
