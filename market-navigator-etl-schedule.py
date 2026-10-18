#!/usr/bin/env python3
"""Deterministic source collection eligibility; no network or side effects."""
import calendar
import datetime as dt

def date_of(value):
    if value is None: return None
    if isinstance(value, dt.datetime): return value.date()
    if isinstance(value, dt.date): return value
    if isinstance(value,(int,float)): return dt.datetime.fromtimestamp(value/1000,dt.timezone.utc).date()
    return dt.date.fromisoformat(str(value)[:10])

def prev_month(d):
    return dt.date(d.year-(d.month==1),(d.month-2)%12+1,1)

def prev_quarter(d):
    q=(d.month-1)//3
    return dt.date(d.year-(q==0),3*((q-1)%4)+1,1)

def eligibility(meta,stored,as_of,rules=None,force=False,last_attempt=None):
    return native_eligibility(meta,stored,as_of,rules,force,last_attempt)

# NYSE official 2026 closures; source: https://www.nyse.com/trade/hours-calendars
MARKET_CLOSED={'2026-01-01','2026-01-19','2026-02-16','2026-04-03','2026-05-25',
               '2026-06-19','2026-07-03','2026-09-07','2026-11-26','2026-12-25'}
UTC=dt.timezone.utc

def instant(value):
    if isinstance(value,dt.datetime):
        if value.tzinfo is None:raise ValueError('Release datetime requires timezone')
        return value.astimezone(UTC)
    if isinstance(value,dt.date):return dt.datetime.combine(value,dt.time.max,UTC)
    if len(str(value))==10:return instant(date_of(value))
    return instant(dt.datetime.fromisoformat(str(value).replace('Z','+00:00')))

def eastern(now):
    def sunday(month,n):
        first=dt.date(now.year,month,1)
        return first+dt.timedelta(days=(6-first.weekday())%7+7*(n-1))
    begin=dt.datetime.combine(sunday(3,2),dt.time(7),UTC)
    end=dt.datetime.combine(sunday(11,1),dt.time(6),UTC)
    return now.astimezone(dt.timezone(dt.timedelta(hours=-4 if begin<=now<end else -5)))

def expectation(meta,as_of,rules=None):
    now=instant(as_of);today=now.date();cadence=meta.get('native_cadence','daily')
    rule=(rules or {}).get(meta['id'],{})
    releases=sorted(rule.get('releases',[]),key=lambda r:instant(r['published_at']))
    if releases and today<=date_of(rule.get('calendar_valid_through',releases[-1]['published_at'])):
        eligible=[r for r in releases if instant(r['published_at'])<=now]
        latest=eligible[-1] if eligible else None
        future=next((r for r in releases if instant(r['published_at'])>now),None)
        return {'period':latest.get('period') if latest else None,'release_at':latest.get('published_at') if latest else None,
                'revision':bool(latest and latest.get('revision')),'next_release':future.get('published_at') if future else None,
                'schedule':'verified-calendar','source':(latest or future or {}).get('source'),'awaiting_release':latest is None}
    release=None
    if cadence in ('daily','trading-day','daily-nav'):
        local=eastern(now);target=local.date()
        hour=int(rule.get('available_hour_eastern',18 if cadence!='daily' else 20))
        if local.hour<hour:target-=dt.timedelta(days=1)
        target-=dt.timedelta(days=int(rule.get('publication_lag_days',0)))
        if cadence in ('trading-day','daily-nav') and target.year!=2026:
            raise ValueError('Official market calendar requires refresh for '+str(target.year))
        closed=set(rule.get('closed_dates',[]))
        if cadence in ('trading-day','daily-nav'):closed.update(MARKET_CLOSED)
        if meta['id']=='move':closed.update({'2026-10-12','2026-11-11'})
        while target.weekday()>=5 or target.isoformat() in closed:target-=dt.timedelta(days=1)
        for _ in range(int(rule.get('publication_lag_sessions',0))):
            target-=dt.timedelta(days=1)
            while target.weekday()>=5 or target.isoformat() in closed:target-=dt.timedelta(days=1)
        return {'period':target.isoformat(),'release_at':None,'revision':False,'next_release':None,
                'schedule':'conservative-estimate','awaiting_release':False}
    if cadence=='weekly':
        start=today-dt.timedelta(days=today.weekday())
        weekday=int(rule.get('release_weekday',{'initialClaims':3,'nfci':2}.get(meta['id'],4)))
        release=start+dt.timedelta(days=weekday)
        if now<dt.datetime.combine(release,dt.time(15),UTC):release-=dt.timedelta(days=7)
        lag=int(rule.get('period_lag_days',{'initialClaims':5,'nfci':5}.get(meta['id'],7)))
        target=release-dt.timedelta(days=lag)
    elif cadence=='monthly':
        day=min(int(rule.get('available_by_day_of_month',31)),calendar.monthrange(today.year,today.month)[1])
        release=dt.date(today.year,today.month,day);target=prev_month(today)
        if now<dt.datetime.combine(release,dt.time(15),UTC):
            target=prev_month(target);prior=prev_month(today)
            release=prior.replace(day=min(day,calendar.monthrange(prior.year,prior.month)[1]))
    elif cadence=='quarterly':
        target=prev_quarter(today)
        end=dt.date(target.year,target.month+2,calendar.monthrange(target.year,target.month+2)[1])
        release=end+dt.timedelta(days=int(rule.get('release_lag_days',45)))
        if now<dt.datetime.combine(release,dt.time(15),UTC):
            target=prev_quarter(target)
            end=dt.date(target.year,target.month+2,calendar.monthrange(target.year,target.month+2)[1])
            release=end+dt.timedelta(days=int(rule.get('release_lag_days',45)))
    else:raise ValueError('Unsupported native cadence: '+str(cadence))
    return {'period':target.isoformat(),'release_at':dt.datetime.combine(release,dt.time(15),UTC).isoformat(),
            'revision':False,'next_release':None,'schedule':'conservative-estimate','awaiting_release':False}

def native_eligibility(meta,stored,as_of,rules=None,force=False,last_attempt=None):
    if not meta.get('enabled',True):return False,'disabled'
    if force:return True,'explicit-retry'
    obs=stored.get('observations') or []
    if not obs:return True,'missing-history'
    if stored.get('missing_periods'):return True,'missing-historical-periods'
    expected=expectation(meta,as_of,rules);cadence=meta.get('native_cadence','daily')
    if expected['awaiting_release']:return False,'awaiting-release'
    target=date_of(expected['period']);latest=date_of(obs[-1]['t'])
    if expected['revision'] and (not last_attempt or instant(last_attempt)<instant(expected['release_at'])):
        return True,'published-revision'
    if latest>=target:return False,cadence+'-period-present'
    if stored.get('last_error'):return True,'retry-failed'
    if last_attempt and date_of(last_attempt)==date_of(as_of):return False,'already-checked-awaiting-provider'
    return True,'retry-failed' if stored.get('last_error') else cadence+'-due'
