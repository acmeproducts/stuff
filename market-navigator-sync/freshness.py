"""Release completeness. Provider lag never grants a live publication exception."""
import datetime as dt
DAILY={'daily','trading-day','daily-nav'}
class IncompleteData(ValueError):
    def __init__(self,report):
        self.report=report
        super().__init__('INCOMPLETE_DATA: '+ '; '.join(r['id']+': '+', '.join(r['problems']) for r in report['sources'] if r['problems']))
def audit(root,now,read,scheduler):
    catalog=read(root/'data/market-backend/data-catalog.json')
    rules=read(root/'data/market-backend/publication-rules.json')['rules']
    metas=[m for m in catalog['series'] if m.get('enabled',True)]
    vectors={m['id']:read(root/('market-evidence/series/'+m['id']+'.json'))['observations'] for m in metas}
    clock=next(m for m in metas if m['id']=='spy')
    expected=scheduler.expectation(clock,now,rules)['period']
    trading=[scheduler.date_of(p['t']).isoformat() for m in metas if m['native_cadence']=='trading-day' for p in vectors[m['id']]]
    target=max([expected]+trading)
    market=sorted(set(scheduler.date_of(p['t']).isoformat() for p in vectors['spy'] if scheduler.date_of(p['t']).isoformat()<=target))
    required=market[-5:]
    if target not in required:required=(required+[target])[-5:]
    rows=[]
    for m in metas:
        dates={scheduler.date_of(p['t']).isoformat() for p in vectors[m['id']]}
        latest=max(dates) if dates else None
        daily=m['native_cadence'] in DAILY
        wanted=target if daily else scheduler.expectation(m,now,rules)['period']
        problems=[]
        if not latest:problems.append('empty source')
        elif wanted and latest<wanted:problems.append('latest '+latest+' < required '+wanted)
        missing=[d for d in required if d not in dates] if daily else []
        if missing:problems.append('missing selected market sessions '+','.join(missing))
        rows.append({'id':m['id'],'cadence':m['native_cadence'],'latest':latest,'required':wanted,'missingMarketSessions':missing,'problems':problems,'status':'BLOCKED' if problems else 'PASS'})
    # Expire at the next completed market session, even if an ETL job never runs.
    expiry=None
    for hour in range(1,24*11):
        probe=now.replace(minute=0,second=0,microsecond=0)+dt.timedelta(hours=hour)
        if scheduler.expectation(clock,probe,rules)['period']>target:
            expiry=probe.isoformat();break
    if not expiry:raise ValueError('No governed next-session expiry')
    return {'schema':'market-navigator-release-completeness-v1','status':'BLOCKED' if any(r['problems'] for r in rows) else 'PASS','marketDate':target,'checkedAt':now.isoformat(),'validUntil':expiry,'requiredMarketSessions':required,'requiredSourceIds':[m['id'] for m in metas],'sources':rows}
def require_complete(root,now,read,scheduler):
    report=audit(root,now,read,scheduler)
    if report['status']!='PASS':raise IncompleteData(report)
    return report
