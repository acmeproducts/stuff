#!/usr/bin/env python3
"""Market Navigator incremental ETL with restart.

Rules (owner):
- A reading's date is a batch id, not a clock time. Every daily reading is stamped
  00:00 UTC of its market day. A day is a business day.
- Never re-pull history already acquired. Each run fetches only from the last stored
  batch day minus a short verification overlap (VERIFY readings), and cross-checks that
  overlap against the source. Mismatches are reported; FRED revisions are applied
  (FRED revises), price mismatches beyond tolerance fail that series.
- Restart safety: everything is written to a staging copy, checked, then moved into
  place file by file. Any failure leaves the data tree untouched and writes a FAIL report.
- The chart shows only complete batches: the index/common anchor ends on the last day
  every live component has a reading. Late readings are stored and shown once complete.
"""
import argparse, csv, datetime as dt, hashlib, json, math, os, shutil, sys, tempfile, time, urllib.parse, urllib.request, bisect
from pathlib import Path
from zoneinfo import ZoneInfo

UTC = dt.timezone.utc
ET = ZoneInfo('America/New_York')
PT = ZoneInfo('America/Los_Angeles')
UA = 'MarketNavigatorETL/1.0 (+acmeproducts/stuff mkt)'
TIMEOUT = 25
VERIFY = 3                      # stored readings re-fetched for cross-check
PRICE_TOL = 0.002               # 0.2% tolerance on Yahoo closes
sys.path.insert(0, str(Path(__file__).resolve().parent))
from compat import MARKET_CLOSED
HOLD = {'monthly','weekly','quarterly'}          # slow series: carried, never used to gate the batch
LIVE = {'trading-day','daily','daily-nav'}

def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
def day_ms(d): return int(dt.datetime.combine(dt.date.fromisoformat(d), dt.time(), UTC).timestamp()*1000)
def ms_day(t): return dt.datetime.fromtimestamp(t/1000, UTC).date().isoformat()
def is_bday(d): return dt.date.fromisoformat(d).weekday() < 5 and d not in MARKET_CLOSED
def prev_bday(d):
    x = dt.date.fromisoformat(d) - dt.timedelta(days=1)
    while not is_bday(x.isoformat()): x -= dt.timedelta(days=1)
    return x.isoformat()
def batch_day(now):
    """Last completed market day: today (ET) only after 16:30 ET, else the previous business day."""
    e = now.astimezone(ET); today = e.date().isoformat()
    if is_bday(today) and (e.hour, e.minute) >= (16, 30): return today
    return prev_bday(today)

# ---------- providers ----------
def http_get(url, accept='*/*'):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r: return r.read(), getattr(r, 'status', 200)

def fetch_yahoo(sym, start, end):
    """Daily closes, stamped by the ET session date. start/end are ISO days inclusive."""
    p1 = int(dt.datetime.combine(dt.date.fromisoformat(start), dt.time(), ET).timestamp())
    p2 = int(dt.datetime.combine(dt.date.fromisoformat(end)+dt.timedelta(days=1), dt.time(), ET).timestamp())
    url = 'https://query1.finance.yahoo.com/v8/finance/chart/'+urllib.parse.quote(sym, safe='')+'?'+urllib.parse.urlencode({'period1':p1,'period2':p2,'interval':'1d','includePrePost':'false','events':'div,splits'})
    raw, http = http_get(url, 'application/json'); j = json.loads(raw)
    r = ((j.get('chart') or {}).get('result') or [None])[0]
    if not r: raise RuntimeError('Yahoo returned no chart result: '+str((j.get('chart') or {}).get('error')))
    ts = r.get('timestamp') or []; cl = (((r.get('indicators') or {}).get('quote') or [{}])[0].get('close') or [])
    out = {}
    for i, t in enumerate(ts):
        try: v = float(cl[i])
        except (TypeError, ValueError, IndexError): continue
        if not math.isfinite(v): continue
        d = dt.datetime.fromtimestamp(int(t), ET).date().isoformat()
        if start <= d <= end and is_bday(d): out[d] = v          # last value for the day wins
    return out, http, hashlib.sha256(raw).hexdigest(), url

def fetch_fred(sid, start, end):
    """FRED observations. Uses the API with the repository key when present (fredgraph.csv times out from GitHub runners); falls back to fredgraph.csv. Retries with backoff."""
    keys = [k for k in (os.environ.get('MARKET_NAVIGATOR_FRED_API_KEY'), os.environ.get('MARKET_NAVIGATOR_FRED_API_KEY_SECONDARY')) if k]
    attempts = []
    for key in keys: attempts.append(('api', key))
    attempts.append(('csv', None))
    last_err = None
    for kind, key in attempts:
        for tries in range(2):
            try:
                if kind == 'api':
                    q = {'series_id': sid, 'observation_start': start, 'observation_end': end, 'file_type': 'json', 'limit': 100000, 'api_key': key}
                    url = 'https://api.stlouisfed.org/fred/series/observations?'+urllib.parse.urlencode(q)
                    raw, http = http_get(url, 'application/json'); j = json.loads(raw); out = {}
                    for o in j.get('observations', []):
                        if o.get('value', '.').strip() in ('', '.'): continue
                        try: out[o['date']] = float(o['value'])
                        except ValueError: pass
                    safe = url.replace(key, '[redacted]')
                    return out, http, hashlib.sha256(raw).hexdigest(), safe
                url = 'https://fred.stlouisfed.org/graph/fredgraph.csv?'+urllib.parse.urlencode({'id': sid, 'cosd': start, 'coed': end})
                raw, http = http_get(url, 'text/csv,*/*'); rows = raw.decode('utf-8-sig', 'replace').splitlines(); out = {}
                for r in csv.reader(rows[1:]):
                    if len(r) < 2 or r[1].strip() in ('', '.'): continue
                    try: out[r[0]] = float(r[1])
                    except ValueError: pass
                return out, http, hashlib.sha256(raw).hexdigest(), url
            except Exception as e:
                last_err = e; time.sleep(3*(tries+1))
    raise RuntimeError('FRED unreachable (api key present: %s): %s' % (bool(keys), str(last_err)[:120]))

# ---------- core ----------
YOY = {}
def yoy_from_levels(raw, start):
    out = {}
    for d, v in raw.items():
        y = dt.date.fromisoformat(d); prior = y.replace(year=y.year-1).isoformat()
        if d >= start and prior in raw and raw[prior] > 0: out[d] = (v/raw[prior]-1)*100
    return out
def load_catalog(root):
    c = json.load(open(root/'data'/'market-backend'/'data-catalog.json'))
    for x in c['series']:
        YOY[x['id']] = str(x.get('transformation', '')).startswith('year-over-year percent change')

def load_series(root):
    d = root/'market-evidence'/'series'; out = {}
    for f in sorted(d.glob('*.json')):
        out[f.stem] = json.load(open(f))
    return out

def update_series(sid, s, batch, mock):
    """Fetch new readings for one series. Returns (changed, report)."""
    prov, ident, cad = s.get('provider'), s.get('providerIdentifier'), s.get('cadence')
    obs = s.get('observations') or []
    rep = {'id': sid, 'provider': prov, 'cadence': cad, 'status': 'SKIP', 'fetched': 0, 'added': 0, 'revised': 0, 'mismatch': []}
    if prov not in ('Yahoo Finance', 'FRED'):
        rep['reason'] = 'provider not automated'; return False, rep
    if not obs:
        rep['reason'] = 'no stored history to extend'; return False, rep
    stored = {ms_day(o['t']): float(o['v']) for o in obs}
    days = sorted(stored)
    last = days[-1]
    if last >= batch and cad in LIVE:
        rep.update(status='CURRENT', last=last); return False, rep
    start = days[-VERIFY] if len(days) >= VERIFY else days[0]
    if cad in HOLD:   # slow series: look back far enough to catch a late or revised release
        start = (dt.date.fromisoformat(last) - dt.timedelta(days=100)).isoformat()
    try:
        if mock is not None:
            http, digest, url = 200, 'mock', 'mock'
            src = yoy_from_levels(mock.get(sid, {}), start) if YOY.get(sid) else {d: v for d, v in mock.get(sid, {}).items() if start <= d <= batch}
            src = {d: v for d, v in src.items() if d <= batch}
        elif prov == 'Yahoo Finance': src, http, digest, url = fetch_yahoo(ident, start, batch)
        elif YOY.get(sid):
            # stored as year-over-year percent; FRED serves the index level, so fetch 13 extra months and compute
            back = (dt.date.fromisoformat(start) - dt.timedelta(days=400)).isoformat()
            raw, http, digest, url = fetch_fred(ident, back, batch)
            src = yoy_from_levels(raw, start)
        else: src, http, digest, url = fetch_fred(ident, start, batch)
    except Exception as e:
        rep.update(status='ERROR', error=str(e)[:300]); s['last_attempted'] = dt.datetime.now(UTC).isoformat(timespec='seconds').replace('+00:00','Z'); s['last_error'] = str(e)[:300]
        return False, rep
    rep.update(fetched=len(src), window=[start, batch], http=http, sourceDigest=digest, transform='yoy_percent_from_level' if YOY.get(sid) else 'none')
    # cross-check overlap
    for d in sorted(src):
        if d in stored:
            a, b = stored[d], src[d]
            if a != b:
                tol = PRICE_TOL if prov == 'Yahoo Finance' else 0.0
                bad = abs(a-b) > tol*max(abs(a), 1e-9)
                rep['mismatch'].append({'day': d, 'stored': a, 'source': b, 'applied': not (prov == 'Yahoo Finance' and bad)})
    hard = [m for m in rep['mismatch'] if not m['applied']]
    if hard:
        rep.update(status='ERROR', error=f'{len(hard)} price readings differ from source beyond tolerance; series left unchanged')
        return False, rep
    changed = False
    for d, v in src.items():
        if cad in LIVE and not is_bday(d): continue
        if d not in stored: rep['added'] += 1; changed = True
        elif stored[d] != v: rep['revised'] += 1; changed = True
        stored[d] = v
    s['observations'] = [{'t': day_ms(d), 'v': stored[d]} for d in sorted(stored)]
    s['count'] = len(s['observations']); s['first'] = s['observations'][0]['t']; s['last'] = s['observations'][-1]['t']
    now = dt.datetime.now(UTC).isoformat(timespec='seconds').replace('+00:00','Z')
    s.update(last_attempted=now, last_successful=now, last_error=None, http=http, sourceRevision=digest, batchStamped=True, etlSource=url.split('?')[0])
    newlast = ms_day(s['last'])
    rep.update(status='OK' if (cad in HOLD or newlast >= batch) else 'LATE', last=newlast)
    return changed, rep

# ---------- index ----------
def extend_index(root, rep):
    """Append persistent index rows through the last day every live component has, using the stored model's own anchors/scales."""
    pf = root/'market-evidence'/'persistent-indices-v1.json'; p = json.load(open(pf))
    reg = json.load(open(root/'data'/'market-backend'/'component-registry-v1.json')); meta = {c['id']: c for c in reg['components']}
    ser = {}
    for sid in meta:
        s = json.load(open(root/'market-evidence'/'series'/f'{sid}.json'))
        ser[sid] = (s['cadence'], [ms_day(x['t']) for x in s['observations']], [float(x['v']) for x in s['observations']])
    def asof(sid, d):
        c, ds, vs = ser[sid]; k = bisect.bisect_right(ds, d)-1
        return (ds[k], vs[k]) if k >= 0 else None
    anch = {}
    for idx, r in p['indices'].items():
        for sid in r['components']:
            v = r['componentValues'][sid][-1]; sg = r['componentSignals'][sid][-1]; m = meta[sid]; dr = m['direction']; sc = m['scale']['annualizedScale']
            anch[sid] = v/math.exp(sg*sc*dr) if m['transformFamily'] == 'log_return' else v-sg*sc*dr
    end = min(ser[sid][1][-1] for r in p['indices'].values() for sid in r['components'] if ser[sid][0] not in HOLD)
    added = 0
    for idx, r in p['indices'].items():
        d = dt.date.fromisoformat(r['dates'][-1])
        while True:
            d += dt.timedelta(days=1); D = d.isoformat()
            if D > end: break
            if not is_bday(D): continue
            row = {}; ok = True
            for sid in r['components']:
                m = meta[sid]; fam = m['transformFamily']; sc = m['scale']['annualizedScale']
                if ser[sid][0] in HOLD:
                    a = asof(sid, D); od, v = a if a else (r['componentObservationDates'][sid][-1], r['componentValues'][sid][-1])
                else:
                    a = asof(sid, D)
                    if a is None or a[0] != D: ok = False; break
                    od, v = a
                mv = math.log(v/anch[sid]) if fam == 'log_return' else v-anch[sid]
                row[sid] = (m['direction']*mv/sc, v, od)
            if not ok: continue
            r['dates'].append(D); r['timestamps'].append(day_ms(D)); r['values'].append(100+sum(x[0] for x in row.values())/7); added += 1
            for sid, (sg, v, od) in row.items():
                r['componentSignals'][sid].append(sg); r['componentValues'][sid].append(v); r['componentObservationDates'][sid].append(od)
    p['generatedAt'] = dt.datetime.now(UTC).isoformat(timespec='seconds').replace('+00:00','Z')
    p['extension'] = {'through': end, 'rule': 'rows appended for each business day where every live component has a reading; slow series carried at latest release'}
    json.dump(p, open(pf, 'w'), separators=(',',':'), sort_keys=True)
    rep['index'] = {'commonEnd': end, 'rowsAdded': added}
    return end

def build_compat(root):
    """Rebuild derived-indices-persistent-v1.json (horizon viewports) from the persistent file. 5D = current day + 4 previous business days."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import compat
    cwd = os.getcwd(); os.chdir(root)
    try: compat.main()
    finally: os.chdir(cwd)

def refresh_health(root, report, common):
    """Keep the card's Health/Latest fields truthful: latest observation, collector status and timestamps from this run."""
    hp = root/'market-evidence'/'health-envelope.json'
    if not hp.exists(): return
    h = json.load(open(hp)); now = dt.datetime.now(UTC).isoformat(timespec='seconds').replace('+00:00','Z')
    byid = {r['id']: r for r in report['series']}
    for sid, row in (h.get('series') or {}).items():
        sp = root/'market-evidence'/'series'/f'{sid}.json'
        if not sp.exists(): continue
        s = json.load(open(sp)); obs = s.get('observations') or []
        if obs: row['actualLatestCanonicalObservation'] = ms_day(obs[-1]['t']); row['latestObservation'] = ms_day(obs[-1]['t'])
        r = byid.get(sid)
        if r:
            row['collectorStatus'] = 'healthy' if r['status'] in ('OK','CURRENT','LATE') else ('unchanged' if r['status']=='SKIP' else 'error')
            row['collectorError'] = r.get('error'); row['classification'] = 'current' if r['status'] in ('OK','CURRENT','LATE') else row.get('classification')
            row['lastCollectionAttempt'] = s.get('last_attempted'); row['lastSuccessfulCollection'] = s.get('last_successful'); row['observationCount'] = len(obs)
            row['why'] = f"Canonical evidence ends {row.get('actualLatestCanonicalObservation')}; common market anchor {common}. Collector last success {s.get('last_successful')}."
    h['generatedAt'] = now; h['marketAnchor'] = common
    json.dump(h, open(hp, 'w'), separators=(',',':'), sort_keys=True)

# ---------- run ----------
def run(root, out_reports, mock=None, now=None):
    now = now or dt.datetime.now(UTC); batch = batch_day(now)
    report = {'schema': 'mkt-etl-run-v1', 'startedAt': now.isoformat(), 'batch': batch, 'status': 'RUNNING', 'series': [], 'root': str(root)}
    lock = root/'.etl.lock'
    if lock.exists() and time.time()-lock.stat().st_mtime < 3*3600: raise SystemExit('another ETL run holds the lock: '+str(lock))
    lock.write_text(now.isoformat())
    stage = Path(tempfile.mkdtemp(prefix='mkt-etl-stage-', dir=root.parent))
    try:
        for sub in ('market-evidence', 'data'): shutil.copytree(root/sub, stage/sub)
        load_catalog(stage); series = load_series(stage); changed_ids = []
        for sid, s in series.items():
            ch, rep = update_series(sid, s, batch, mock); report['series'].append(rep)
            log(f"{sid:28s} {rep['status']:8s} fetched={rep['fetched']} added={rep['added']} revised={rep['revised']} mismatch={len(rep['mismatch'])} {rep.get('error','')}")
            json.dump(s, open(stage/'market-evidence'/'series'/f'{sid}.json', 'w'), separators=(',',':'))
            if ch: changed_ids.append(sid)
        errors = [r for r in report['series'] if r['status'] == 'ERROR']
        live = [r for r in report['series'] if r['cadence'] in LIVE and r['status'] in ('OK','CURRENT','LATE')]
        report['changedSeries'] = changed_ids; report['errors'] = [{'id': r['id'], 'error': r['error']} for r in errors]
        common = extend_index(stage, report); build_compat(stage)
        refresh_health(stage, report, common)
        d = json.load(open(stage/'market-evidence'/'derived-indices-persistent-v1.json'))
        if d['commonMarketAnchor'] != common: raise RuntimeError(f"anchor mismatch {d['commonMarketAnchor']} vs {common}")
        for idx in d['indices']:
            c = d['indices'][idx]['horizons']['5D']['curve']
            if len(c) != 5 or any(not is_bday(ms_day(x['t'])) for x in c): raise RuntimeError(f'5D curve for {idx} is not five business days: '+str([ms_day(x['t']) for x in c]))
        # commit: move staged files into place one by one
        for sub in ('market-evidence', 'data'):
            for f in sorted((stage/sub).rglob('*')):
                if f.is_file():
                    dest = root/f.relative_to(stage); dest.parent.mkdir(parents=True, exist_ok=True)
                    if not dest.exists() or dest.read_bytes() != f.read_bytes(): os.replace(f, dest)
        late = [r['id'] for r in live if r['status'] == 'LATE']
        report.update(status='PASS' if not errors else 'PASS_WITH_ERRORS', commonMarketAnchor=common, lateSeries=late, finishedAt=dt.datetime.now(UTC).isoformat())
    except BaseException as e:
        report.update(status='FAIL', error=str(e)[:500], finishedAt=dt.datetime.now(UTC).isoformat())
        raise
    finally:
        shutil.rmtree(stage, ignore_errors=True); lock.unlink(missing_ok=True)
        out_reports.mkdir(parents=True, exist_ok=True)
        json.dump(report, open(out_reports/f'{batch}.json', 'w'), indent=1, sort_keys=True)
        json.dump(report, open(out_reports/'last-run.json', 'w'), indent=1, sort_keys=True)
        log('RESULT', report['status'], 'batch', batch, 'anchor', report.get('commonMarketAnchor'), 'errors', len(report.get('errors', [])), 'late', report.get('lateSeries'))
    return report

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--root', required=True); ap.add_argument('--reports', required=True)
    ap.add_argument('--mock-from', help='directory whose market-evidence/series acts as the provider (offline test)')
    ap.add_argument('--now', help='ISO UTC time for testing')
    a = ap.parse_args()
    mock = None
    if a.mock_from:
        mock = {}
        for f in Path(a.mock_from, 'market-evidence', 'series').glob('*.json'):
            s = json.load(open(f)); mock[f.stem] = {ms_day(o['t']): float(o['v']) for o in s.get('observations') or []}
    now = dt.datetime.fromisoformat(a.now).astimezone(UTC) if a.now else None
    rep = run(Path(a.root).resolve(), Path(a.reports).resolve(), mock, now)
    sys.exit(0 if rep['status'].startswith('PASS') else 1)

if __name__ == '__main__': main()
