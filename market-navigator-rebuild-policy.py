"""Native publication expectations for the independent data-first rebuild.

Observation dates and collection heartbeats are checked separately. A successful
HTTP request cannot make an old reference period current.
"""
import calendar
import datetime as dt
import math

UTC = dt.timezone.utc


def eastern(now):
    # US daylight saving boundaries; no machine-local timezone dependency.
    def sunday(month, occurrence):
        first = dt.date(now.year, month, 1)
        return first + dt.timedelta(days=(6-first.weekday()) % 7 + 7*(occurrence-1))
    begin = dt.datetime.combine(sunday(3, 2), dt.time(7), UTC)
    end = dt.datetime.combine(sunday(11, 1), dt.time(6), UTC)
    return now.astimezone(dt.timezone(dt.timedelta(hours=-4 if begin <= now < end else -5)))


def holidays(year):
    def nth(month, weekday, occurrence):
        first = dt.date(year, month, 1)
        return first + dt.timedelta(days=(weekday-first.weekday()) % 7 + 7*(occurrence-1))
    def observed(date):
        return date + dt.timedelta(days=-1 if date.weekday() == 5 else 1 if date.weekday() == 6 else 0)
    fixed = {observed(dt.date(y, m, d)) for y in (year-1, year, year+1)
             for m, d in ((1, 1), (6, 19), (7, 4), (11, 11), (12, 25))}
    fixed.update((nth(1, 0, 3), nth(2, 0, 3), nth(9, 0, 1), nth(10, 0, 2), nth(11, 3, 4)))
    may_end = dt.date(year, 6, 1) - dt.timedelta(days=1)
    fixed.add(may_end-dt.timedelta(days=may_end.weekday()))
    return fixed


# Stricter native deadlines apply to operational qualification from October 8.
# Historical captures retain their collection-time policy and actual native dates.
# Official NYSE/ICE 2026–2028 schedule verified October 8, 2026.
# https://www.nyse.com/trade/hours-calendars
# The two-hour ingestion grace is an application policy, not an exchange rule.
NYSE_CLOSED = {
 2025: {'2025-12-25'},
 2026: {'2026-01-01','2026-01-19','2026-02-16','2026-04-03','2026-05-25','2026-06-19','2026-07-03','2026-09-07','2026-11-26','2026-12-25'},
 2027: {'2027-01-01','2027-01-18','2027-02-15','2027-03-26','2027-05-31','2027-06-18','2027-07-05','2027-09-06','2027-11-25','2027-12-24'},
 2028: {'2028-01-17','2028-02-21','2028-04-14','2028-05-29','2028-06-19','2028-07-04','2028-09-04','2028-11-23','2028-12-25'}
}
NYSE_EARLY = {'2026-11-27','2026-12-24','2027-11-26','2028-07-03','2028-11-24'}

def expected_market_session(now):
    local=eastern(now)
    if local.year not in (2026,2027,2028):
        raise ValueError('Official market calendar requires refresh for this year')
    day=local.date()
    for _ in range(15):
        text=day.isoformat()
        if day.weekday()<5 and text not in NYSE_CLOSED.get(day.year,set()):
            deadline=dt.datetime.combine(day,dt.time(15 if text in NYSE_EARLY else 18),local.tzinfo)
            if local>=deadline:return day
        day-=dt.timedelta(days=1)
    raise ValueError('No qualified market session')

def previous_bank_session(day):
    for _ in range(15):
        day-=dt.timedelta(days=1)
        if day.weekday()<5 and day not in holidays(day.year):return day
    raise ValueError('No qualified bank session')

def expected_period(meta, catalog, rules, now):
    local = eastern(now)
    today = local.date()
    cadence = meta.get('native_cadence')
    rule = rules.get('rules', {}).get(meta['id'], {})
    if now >= dt.datetime(2026,10,8,tzinfo=UTC) and cadence == 'trading-day' and meta.get('provider') in ('Yahoo Finance','Stooq'):
        return expected_market_session(now)
    if now >= dt.datetime(2026,10,8,tzinfo=UTC) and cadence == 'daily' and meta.get('provider') == 'FRED':
        completed=today if today.weekday()<5 and today not in holidays(today.year) and local.hour>=18 else previous_bank_session(today)
        return previous_bank_session(completed)
    if cadence == 'monthly':
        overrides = catalog.get('publication_schedule', {}).get('series_overrides', {}).get(meta['id'], {})
        release = min(int(rule.get('available_by_day_of_month') or overrides.get('expected_day_of_month') or 31), calendar.monthrange(today.year, today.month)[1])
        offset = 1 if today.day >= release else 2
        month = today.year*12 + today.month-1-offset
        return dt.date(month//12, month % 12+1, 1)
    if cadence == 'quarterly':
        offset = 2 if today.month in (1, 4, 7, 10) and today.day < 30 else 1
        quarter = today.year*4 + (today.month-1)//3-offset
        return dt.date(quarter//4, quarter % 4*3+1, 1)
    if cadence == 'weekly' and 'release_weekday' in rule:
        weekday = rule['release_weekday']
        scheduled = today-dt.timedelta(days=(today.weekday()-weekday) % 7)
        closed = holidays(today.year)
        for _ in range(4):
            release = scheduled
            if weekday == 2 and any(release-dt.timedelta(days=n) in closed for n in (0, 1, 2)):
                release += dt.timedelta(days=1)
            while release.weekday() > 4 or release in closed:
                release += dt.timedelta(days=1)
            deadline = dt.datetime.combine(release, dt.time(rule.get('release_hour', 8), rule.get('release_minute', 30)), local.tzinfo) + dt.timedelta(hours=rule.get('ingestion_grace_hours', 24))
            if local >= deadline:
                return scheduled-dt.timedelta(days=rule['reference_days_before_release'])
            scheduled -= dt.timedelta(days=7)
        raise ValueError('Cannot determine weekly release: '+meta['id'])
    return None


def missing_recent_sessions(meta, points, now):
    """Require five real completed sessions for declared market daily series."""
    if now < dt.datetime(2026,10,8,tzinfo=UTC) or meta.get('provider') not in ('Yahoo Finance','Stooq','Nasdaq Fund Network') or meta.get('native_cadence') not in ('trading-day','daily-nav') or not points:
        return []
    actual=dt.datetime.fromtimestamp(points[-1]['t']/1000,UTC).date()
    day=min(actual,expected_market_session(now));expected=[]
    while len(expected)<5:
        if day.weekday()<5 and day.isoformat() not in NYSE_CLOSED.get(day.year,set()):expected.append(day)
        day-=dt.timedelta(days=1)
    observed={dt.datetime.fromtimestamp(p['t']/1000,UTC).date() for p in points}
    return [d.isoformat() for d in sorted(expected) if d not in observed]


def freshness(meta, source, catalog, rules, now):
    points = source.get('observations') or []
    if not points:
        return 'missing', None, 'No canonical observations.'
    try:
        times = [p['t'] for p in points]
        if times != sorted(set(times)) or any(not math.isfinite(p['v']) or p['t'] > now.timestamp()*1000 for p in points):
            raise ValueError('Invalid observation vector')
        actual = dt.datetime.fromtimestamp(times[-1]/1000, UTC).date()
        collected = dt.datetime.fromisoformat(source['last_successful'].replace('Z', '+00:00')).astimezone(UTC)
        attempted = dt.datetime.fromisoformat((source.get('last_attempted') or source['last_successful']).replace('Z', '+00:00')).astimezone(UTC)
        if collected > now or attempted > now:
            raise ValueError('Future collection instant')
    except (KeyError, ValueError, TypeError, OverflowError):
        return 'failed', None, 'Invalid observations or collection metadata.'
    try:
        expected = expected_period(meta, catalog, rules, now)
    except ValueError as error:
        return 'failed', None, str(error)
    cadence = meta.get('native_cadence', 'unknown')
    if expected is not None:
        stale = actual < expected
        reason = f'Native reference period {actual}; publication rule expects {expected}.'
    else:
        default = 'default_'+cadence.replace('-', '_')
        rule = rules.get('rules', {}).get(meta['id'], rules.get('rules', {}).get(default, {}))
        allowance = int(rule.get('max_expected_age_days') or catalog.get('publication_schedule', {}).get('cadence_rules', {}).get(cadence, {}).get('current_max_age_days') or 5)
        age = (eastern(now).date()-actual).days
        stale = age > allowance
        reason = f'Native observation {actual}; age {age} days; governed {cadence} allowance {allowance} days.'
        if cadence not in ('daily', 'trading-day', 'daily-nav', 'weekly'):
            return 'failed', None, 'No governed native publication rule: '+cadence
    expected_text = str(expected) if expected else None
    if stale:
        return 'failed' if source.get('last_error') else 'stale', expected_text, reason
    missing=missing_recent_sessions(meta,points,now)
    if missing:return 'failed', expected_text, 'Missing recent native sessions despite current tail: '+', '.join(missing)
    if now-collected > dt.timedelta(hours=48):
        return 'stale', expected_text, reason+' Collection heartbeat exceeds 48 hours.'
    if source.get('last_error'):
        return 'failed', expected_text, reason+' Latest collection failed.'
    return 'current', expected_text, reason


def valid_until(meta, source, catalog, rules, now):
    """Bound validity to the next native deadline, heartbeat, or hourly recheck."""
    ceiling=min(now+dt.timedelta(hours=1),dt.datetime.fromisoformat(source['last_successful'].replace('Z','+00:00'))+dt.timedelta(hours=48))
    actual=dt.datetime.fromtimestamp(source['observations'][-1]['t']/1000,UTC).date()
    def expired(when):
        expected=expected_period(meta,catalog,rules,when)
        return expected is not None and actual<expected
    if expired(now):return now
    if not expired(ceiling):return ceiling
    low,high=now,ceiling
    while (high-low).total_seconds()>1:
        middle=low+(high-low)/2
        if expired(middle):high=middle
        else:low=middle
    return low
