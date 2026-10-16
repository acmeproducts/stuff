#!/usr/bin/env python3
"""Deterministic source collection eligibility; no network or side effects."""
import calendar
import datetime as dt

def date_of(value):
    if value is None: return None
    if isinstance(value, dt.date): return value
    if isinstance(value,(int,float)): return dt.datetime.fromtimestamp(value/1000,dt.timezone.utc).date()
    return dt.date.fromisoformat(str(value)[:10])

def prev_month(d):
    return dt.date(d.year-(d.month==1),(d.month-2)%12+1,1)

def prev_quarter(d):
    q=(d.month-1)//3
    return dt.date(d.year-(q==0),3*((q-1)%4)+1,1)

def eligibility(meta,stored,as_of,rules=None,force=False,last_attempt=None):
    if not meta.get('enabled',True): return False,'disabled'
    if force: return True,'explicit-retry'
    today=date_of(as_of)
    obs=stored.get('observations') or []
    latest=date_of(obs[-1]['t']) if obs else None
    if latest is None:return True,'missing-history'
    cadence=meta.get('native_cadence','daily')
    rule=(rules or {}).get(meta['id'],{})
    last=date_of(last_attempt)
    if cadence in ('daily','trading-day','daily-nav'):
        if today.weekday()>=5:return False,'weekend'
        if latest>=today-dt.timedelta(days=1):return False,'daily-period-present'
        if last==today:return False,'daily-already-checked'
        return True,'daily-due'
    if cadence=='weekly':
        start=today-dt.timedelta(days=today.weekday())
        first=start+dt.timedelta(days={'initialClaims':3,'nfci':2}.get(meta['id'],4))
        if today<first:return False,'weekly-not-due'
        if latest>=start-dt.timedelta(days=7):return False,'weekly-period-present'
        if last and last>=first:return False,'weekly-already-checked'
        return True,'weekly-due'
    if cadence=='monthly':
        target=prev_month(today)
        day=min(int(rule.get('available_by_day_of_month',31)),calendar.monthrange(today.year,today.month)[1])
        first=dt.date(today.year,today.month,day)
        if today<first:return False,'monthly-not-due'
        if latest>=target:return False,'monthly-period-present'
        if last and last>=first:return False,'monthly-already-checked'
        return True,'monthly-due'
    if cadence=='quarterly':
        target=prev_quarter(today)
        end=dt.date(target.year,target.month+2,calendar.monthrange(target.year,target.month+2)[1])
        first=end+dt.timedelta(days=int(rule.get('release_lag_days',45)))
        if today<first:return False,'quarterly-not-due'
        if latest>=target:return False,'quarterly-period-present'
        if last and last>=first:return False,'quarterly-already-checked'
        return True,'quarterly-due'
    raise ValueError('Unsupported native cadence: '+str(cadence))
