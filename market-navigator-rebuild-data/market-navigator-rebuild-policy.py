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


def expected_period(meta, catalog, rules, now):
    local = eastern(now)
    today = local.date()
    cadence = meta.get('native_cadence')
    rule = rules.get('rules', {}).get(meta['id'], {})
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
    expected = expected_period(meta, catalog, rules, now)
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
    if now-collected > dt.timedelta(hours=48):
        return 'stale', expected_text, reason+' Collection heartbeat exceeds 48 hours.'
    if source.get('last_error'):
        return 'failed', expected_text, reason+' Latest collection failed.'
    return 'current', expected_text, reason
