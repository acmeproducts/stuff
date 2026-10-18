"""Read-only full-history comparison against the catalog's exact source identity.

Does not repair, publish, certify source revisions, or change approved mathematics.
The retained report distinguishes provider access failures from observed differences.
"""
import concurrent.futures
import datetime as dt
import importlib.util
import json
import hashlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
FROZEN=HERE/'market-navigator-chart-only-review'
spec = importlib.util.spec_from_file_location('collector', HERE / 'market-navigator-r7-data-pipeline.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


def retained_matches(meta,points):
    """C4 permits only HY's exact approved current-vintage backcast prefix.

    This is archival baseline verification, not a claim that today's provider
    still serves those observations or that HY has historical ALFRED vintages.
    """
    result={'verified':False,'periods':len(points),'qualification':'unverified-retained-history'}
    if meta['id']!='hySpread' or not points:return result
    expected='c328f01c3321e95408ea944bc74f63b13a1ae388'
    logical='market-evidence/series/hySpread.json'
    payload=(FROZEN/logical).read_bytes().replace(b'\r\n',b'\n')
    actual=hashlib.sha1(b'blob '+str(len(payload)).encode()+b'\0'+payload).hexdigest()
    if actual!=expected:return result
    baseline=json.loads(payload)
    if (baseline.get('id'),baseline.get('provider'),baseline.get('providerIdentifier'),baseline.get('unit'),baseline.get('cadence'))!=('hySpread','FRED','BAMLH0A0HYM2',meta.get('native_unit'),meta.get('native_cadence')):return result
    date=lambda p:dt.datetime.fromtimestamp(p['t']/1000,dt.timezone.utc).date().isoformat()
    archived={date(p):p['v'] for p in baseline['observations']}
    if all(date(p) in archived and archived[date(p)]==p['v'] for p in points):
        result.update(verified=True,qualification='C4-approved retrospective current-vintage backcast; not historical as-known data',
                      baseline_commit='996e9a71b72db5bfbea3ba77750077daaa2fb7ab',baseline_blob=expected)
    return result


def audit(meta):
    sid = meta['id']
    saved = collector.read(HERE / 'market-evidence/series' / (sid + '.json'))
    chain=collector.chain_for(meta)
    primary=next((p for p in chain if (p['provider'],p['identifier'])==(saved.get('provider'),saved.get('providerIdentifier'))),chain[0])
    identity = {'provider': primary['provider'], 'identifier': primary['identifier']}
    result = {'id': sid, 'frequency': meta['native_cadence'], 'approvedSource': identity,
              'storedSource': {'provider': saved.get('provider'), 'identifier': saved.get('providerIdentifier')}}
    try:
        observations, http = collector.fetch_source(identity['provider'], identity['identifier'], True)
        if 'year-over-year percent change' in (meta.get('transformation') or '').lower():
            observations = collector.yoy(observations)
        def dates(points):
            return {dt.datetime.fromtimestamp(p['t']/1000, dt.timezone.utc).date().isoformat(): p['v'] for p in points}
        upstream, stored = dates(observations), dates(saved.get('observations', []))
        if stored:
            # Qualify the entire accumulated baseline, rather than counting
            # newly returned older provider history as a missing stored period.
            upstream={d:v for d,v in upstream.items() if d>=min(stored)}
        common = sorted(upstream.keys() & stored.keys())
        different = [{'period': d, 'stored': stored[d], 'upstream': upstream[d]} for d in common
                     if abs(upstream[d]-stored[d]) > max(1e-8, abs(upstream[d])*1e-8)]
        result.update(http=http, upstreamCount=len(upstream), storedCount=len(stored), comparedPeriods=len(common),
                      upstreamFirst=min(upstream), upstreamLast=max(upstream),
                      missingInStored=sorted(upstream.keys()-stored.keys()),
                      absentFromProvider=sorted(stored.keys()-upstream.keys()),
                      changedPeriods=len(different), changeExamples=different[:10],
                      sourceIdentityMatches=identity == result['storedSource'],
                      status='differences' if different or upstream.keys()!=stored.keys() or identity!=result['storedSource'] else 'matches')
        absent=result['absentFromProvider']
        if absent and all(d<min(upstream) for d in absent):
            retained=[p for p in saved['observations'] if dt.datetime.fromtimestamp(p['t']/1000,dt.timezone.utc).date().isoformat() in set(absent)]
            proof=retained_matches(meta,retained);result['retainedHistory']=proof
            if proof['verified'] and not different and not result['missingInStored'] and result['sourceIdentityMatches']:
                result['status']='matches-with-approved-backcast'
    except Exception as error:
        result.update(status='provider-failed', error=str(error))
    return result


def main():
    catalog = collector.read(HERE / 'data/market-backend/data-catalog.json')
    metas = [m for m in catalog['series'] if m.get('enabled', True)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(audit, metas))
    report = {'schema': 'market-navigator-source-comparison-v1',
              'checkedAt': collector.iso(), 'sourceCommit': '0e9d3852e3bda24eab3e9c8c309897b500cf3082',
              'scope': 'full history returned by primary approved providers; no substituted source; no data changed',
              'qualified': all(r['status'] in ('matches','matches-with-approved-backcast') for r in rows), 'components': rows}
    out = HERE / 'market-navigator-etl-source-audit.json'
    out.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    print(json.dumps([{'id': r['id'], 'status': r['status'], 'error': r.get('error'),
                       'changed': r.get('changedPeriods'), 'latest': r.get('upstreamLast')} for r in rows], indent=2))
    raise SystemExit(0 if report['qualified'] else 1)


if __name__ == '__main__':
    main()
