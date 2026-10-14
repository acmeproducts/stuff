"""Independent archived-input linkage and native-period index assurance.

Captured information states remain immutable. Projection dates describe native
periods; knownBy describes when those inputs were retained, never release time.
"""
import datetime as dt
import hashlib
import importlib.util
import json
import math
from pathlib import Path

UTC = dt.timezone.utc
CLOCK_CADENCES = {'daily', 'trading-day', 'daily-nav'}
_spec=importlib.util.spec_from_file_location('integrity_native_calendar',Path(__file__).with_name('market-navigator-rebuild-policy.py'))
calendar_policy=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(calendar_policy)


def date_of(stamp):
    return dt.datetime.fromtimestamp(stamp / 1000, UTC).date().isoformat()


def instant(text):
    return dt.datetime.fromisoformat(text.replace('Z', '+00:00')).astimezone(UTC)






def source_blob(root, sid, proof, meta, known_by, cache, require_completed=True):
    """Dereference the evidence statement, independently of embedded values."""
    sha = proof.get('blob', '')
    if len(sha) != 40 or any(c not in '0123456789abcdef' for c in sha):
        raise ValueError('Invalid archived source identity: '+sid)
    if sha not in cache:
        path = Path(root)/'market-evidence/collection-archive/blobs'/(sha+'.json')
        raw = path.read_bytes()
        actual = hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
        if actual != sha:
            raise ValueError('Archived source blob hash differs: '+sid)
        cache[sha] = json.loads(raw)
    source = cache[sha]
    points = source.get('observations') or []
    times = [p.get('t') for p in points]
    if not points or times != sorted(set(times)) or any(
            isinstance(p.get(k), bool) or not isinstance(p.get(k), (int,float))
            or not math.isfinite(p[k]) for p in points for k in ('t','v')):
        raise ValueError('Invalid archived native vector: '+sid)
    revision = hashlib.sha256(json.dumps(points,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    providers = meta.get('provider_chain') or [{'provider':meta['provider'],'identifier':meta['provider_identifier']}]
    if source.get('id') != sid or (source.get('provider'), source.get('providerIdentifier')) not in [
            (p['provider'],p['identifier']) for p in providers]:
        raise ValueError('Archived native identity differs: '+sid)
    if source.get('sourceRevision') != revision or proof.get('sourceRevision') != revision:
        raise ValueError('Archived source revision differs: '+sid)
    if source.get('last') != points[-1]['t'] or source.get('first') != points[0]['t'] or source.get('count') != len(points):
        raise ValueError('Archived native vector metadata differs: '+sid)
    collected = instant(source['last_successful'])
    if source.get('last_error') or collected > known_by or points[-1]['t'] > collected.timestamp()*1000:
        raise ValueError('Archived source availability differs: '+sid)
    if source.get('unit') != meta['native_unit'] or source.get('cadence') != meta['native_cadence']:
        raise ValueError('Archived source unit/cadence differs: '+sid)
    verification=source.get('sourceVerification')
    if verification and (verification.get('sourceRevision')!=revision or verification.get('id')!=sid or verification.get('unit')!=meta['native_unit'] or verification.get('cadence')!=meta['native_cadence']):
        raise ValueError('Archived source upstream verification identity differs: '+sid)
    if require_completed and collected >= dt.datetime(2026,10,8,tzinfo=UTC) and meta['native_cadence'] in ('trading-day','daily-nav') and source['provider'] in ('Yahoo Finance','Stooq','Nasdaq Fund Network'):
        completed=calendar_policy.expected_market_session(collected).isoformat()
        if date_of(points[-1]['t'])>completed:
            raise ValueError('Archived source contains an incomplete market session: '+sid)
    expected = {'nativeTimestamp':points[-1]['t'], 'nativeValue':points[-1]['v'],
                'observationDate':date_of(points[-1]['t']), 'collectedAt':source['last_successful'],
                'provider':source['provider'], 'providerIdentifier':source['providerIdentifier']}
    if any(proof.get(k) != v for k,v in expected.items()):
        raise ValueError('Archived source linkage differs: '+sid)
    if '_captureLedger' not in cache:
        cache['_captureLedger']=[json.loads(p.read_text(encoding='utf-8')) for p in (Path(root)/'market-evidence/collection-archive/receipts').glob('*.json')]
    linked=any(instant(receipt['knownBy'])==known_by and all(
        receipt.get('provenance',{}).get(sid,{}).get(k)==v
        for k,v in {**expected,'sourceRevision':revision}.items()) for receipt in cache['_captureLedger'])
    if not linked:raise ValueError('Archived source differs from retained capture ledger: '+sid)
    return source


def latest_projection(root, row, original, catalog, registry):
    """Repair native-period coverage using actual retained vectors, not interpolation.

    This is explicitly a retrospective latest-vintage calculation. Its knownBy
    is the selected capture, even for an older projected native period.
    """
    capture=max(row['recoveredCalculations'],key=lambda c:instant(c['knownBy']))
    known=instant(capture['knownBy']);cache={}
    sources={sid:source_blob(root,sid,capture['sources'][sid],catalog[sid],known,cache)
             for sid in row['components']}
    rules={x['id']:x for x in registry['components']}
    dates=sorted({date_of(p['t']) for sid,source in sources.items()
                  if catalog[sid]['native_cadence'] in CLOCK_CADENCES
                  and catalog[sid].get('provider_identifier')!='DFF'
                  for p in source['observations']
                  if date_of(p['t'])>original['dates'][-1]
                  and dt.datetime.fromtimestamp(p['t']/1000,UTC).weekday()<5})
    points=[{'t':t,'v':v,'dateKind':'original-published-index',
             'baselineInputs':{sid:{'t':int(dt.datetime.fromisoformat(original['componentObservationDates'][sid][i]).replace(tzinfo=UTC).timestamp()*1000),
                                    'v':original['componentValues'][sid][i],
                                    'provenance':'immutable-original-seed'}
                               for sid in original['components']}}
            for i,(t,v) in enumerate(zip(original['timestamps'],original['values']))]
    if not any(catalog[sid]['native_cadence'] in CLOCK_CADENCES and catalog[sid].get('provider_identifier')!='DFF' for sid in sources):raise ValueError('No recovered native-period clock')
    for day in dates:
        inputs={}
        for sid,source in sources.items():
            eligible=[p for p in source['observations'] if date_of(p['t'])<=day]
            if not eligible:raise ValueError('No retained native input for period: '+sid+' '+day)
            p=eligible[-1];inputs[sid]={'blob':capture['sources'][sid]['blob'],'t':p['t'],'v':p['v']}
        terms=[]
        for sid,p in inputs.items():
            rule=rules[sid];anchor=original['componentValues'][sid][0]
            change=math.log(p['v']/anchor) if rule['transformFamily']=='log_return' else p['v']-anchor
            terms.append(rule['direction']*change/rule['scale']['annualizedScale'])
        points.append({'t':int(dt.datetime.fromisoformat(day).replace(tzinfo=UTC).timestamp()*1000),
                       'v':100+math.fsum(terms)/7,'knownBy':capture['knownBy'],
                       'captureDate':capture['calendarDate'],'dateKind':'native-period-latest-vintage',
                       'componentObservationDates':{sid:date_of(p['t']) for sid,p in inputs.items()},
                       'nativeInputs':inputs})
    return points


def verify_indices(root, model, seed, registry, catalog, now):
    """Verify values against actual blobs; independently derive projection dates."""
    metas = {p['id']:p for p in catalog['series']}
    rules = {p['id']:p for p in registry['components']}
    for sid,rule in rules.items():
        meta=metas[sid]
        if any(meta.get(k)!=rule.get(r) for k,r in [('native_unit','nativeUnit'),('native_cadence','nativeCadence'),('provider','provider'),('provider_identifier','providerIdentifier')]):
            raise ValueError('Catalog identity differs from frozen component registry: '+sid)
    cache = {}
    result = {}
    if set(model['indices'])!=set(seed['indices']) or set(model['indices'])!=set(registry['indices']):raise ValueError('Governed index inventory differs')
    for key,row in model['indices'].items():
        original = seed['indices'][key]
        if row['components']!=original['components']:raise ValueError('Governed index component membership/order differs: '+key)
        n = len(original['dates'])
        latest = {}
        partial_captures=[]
        for i,capture in enumerate(row.get('recoveredCalculations',[]), n):
            known = instant(capture['knownBy'])
            if known > now or set(capture['sources']) != set(row['components']):
                raise ValueError('Invalid index availability or component coverage: '+key)
            native = {}
            terms = []
            for sid in row['components']:
                # Preserve/replay authentic captured information states. Older
                # snapshots may contain a provisional daily candle; they are
                # not used as settled native-period projections.
                source = source_blob(root,sid,capture['sources'][sid],metas[sid],known,cache,require_completed=False)
                last = source['observations'][-1]
                collected=instant(source['last_successful'])
                if collected>=dt.datetime(2026,10,8,tzinfo=UTC) and metas[sid]['native_cadence'] in ('trading-day','daily-nav') and source['provider'] in ('Yahoo Finance','Stooq','Nasdaq Fund Network') and date_of(last['t'])>calendar_policy.expected_market_session(collected).isoformat():
                    partial_captures.append({'id':sid,'knownBy':capture['knownBy'],'referenceDate':date_of(last['t']),'completedThrough':calendar_policy.expected_market_session(collected).isoformat()})
                native[sid] = {'t':last['t'], 'v':last['v'], 'date':date_of(last['t'])}
                if row['componentValues'][sid][i] != last['v'] or row['componentObservationDates'][sid][i] != date_of(last['t']):
                    raise ValueError('Index input differs from archived native vector: '+sid)
                rule = rules[sid]
                anchor = original['componentValues'][sid][0]
                change = math.log(last['v']/anchor) if rule['transformFamily']=='log_return' else last['v']-anchor
                signal = rule['direction']*change/rule['scale']['annualizedScale']
                if not math.isclose(signal,row['componentSignals'][sid][i],rel_tol=0,abs_tol=1e-12):
                    raise ValueError('Independent archived component calculation differs: '+sid)
                terms.append(signal)
            value = 100+math.fsum(terms)/7
            if not math.isclose(value,row['values'][i],rel_tol=0,abs_tol=1e-12):
                raise ValueError('Independent archived index calculation differs: '+key)
            daily = [p['date'] for sid,p in native.items() if metas[sid]['native_cadence'] in CLOCK_CADENCES]
            if not daily:
                raise ValueError('No native-period clock for index: '+key)
            clock = max(daily)
            if clock > original['dates'][-1] and (clock not in latest or known > latest[clock]['known']):
                latest[clock] = {'known':known, 'capture':capture, 'value':row['values'][i], 'native':native}
        if not latest:
            capture=max(row['recoveredCalculations'],key=lambda c:instant(c['knownBy']))
            sources={sid:source_blob(root,sid,p,metas[sid],instant(capture['knownBy']),cache) for sid,p in capture['sources'].items()}
            native={sid:{'t':s['observations'][-1]['t'],'v':s['observations'][-1]['v'],'date':date_of(s['observations'][-1]['t'])} for sid,s in sources.items()}
            last_date=original['dates'][-1]
            if max(p['date'] for sid,p in native.items() if metas[sid]['native_cadence'] in CLOCK_CADENCES)<last_date:raise ValueError('Native clock regressed behind original baseline: '+key)
            last={'capture':capture,'native':native}
        else:
            last_date = max(latest)
            last = latest[last_date]
        component_dates = {sid:p['date'] for sid,p in last['native'].items()}
        result[key] = {'id':key,'status':'verified','latestObservation':last_date,
                       'knownBy':last['capture']['knownBy'], 'capturedStateDate':last['capture']['calendarDate'],
                       'coverageStart':original['dates'][0], 'coverageEnd':last_date,
                       'verifiedRecoveredStates':len(row['recoveredCalculations']),
                       'projectedRecoveredPeriods':len(latest), 'sourceBlobsVerified':True,
                       'projectionState':'latest-vintage' if latest else 'baseline-held',
                       'componentObservationDates':component_dates,
                       'heldComponents':[sid for sid,date in component_dates.items() if date<last_date],
                       'vintage':'latest captured vintage; not historical availability at market close',
                       'unavailableCapturedDays':row.get('unavailableCapturedDays',[]),
                       'provisionalCapturedInputs':partial_captures,
                       'limitations':['Original published rows verified against immutable seed; original upstream availability is not reconstructed']+(['No later native period; original baseline endpoint retained rather than replacing its published value'] if not latest else [])+(['Missing historical collection states remain unavailable; native periods are recalculated from actual retained vectors with later knownBy'] if row.get('unavailableCapturedDays') else [])+(['Authentic older captures include provisional daily candles; their captured states are retained and verified, but completed native projections use the independently checked later settled vectors'] if partial_captures else []),
                       'expectedProjection':[(date,entry['value'],entry['capture']['knownBy']) for date,entry in sorted(latest.items())],
                       '_latestCapture':max(row['recoveredCalculations'],key=lambda c:instant(c['knownBy']))}
    return result


def verify_projection(root, derived, indices, seed, registry, catalog):
    if set(derived['indices'])!=set(seed['indices']) or set(indices)!=set(seed['indices']):raise ValueError('Governed projected index inventory differs')
    metas={x['id']:x for x in catalog['series']};rules={x['id']:x for x in registry['components']};cache={}
    for key,check in indices.items():
        capture=check['_latestCapture'];known=instant(capture['knownBy'])
        actual_sources={sid:source_blob(root,sid,proof,metas[sid],known,cache) for sid,proof in capture['sources'].items()}
        real_dates={date_of(p['t']) for sid,source in actual_sources.items()
                    if metas[sid]['native_cadence'] in CLOCK_CADENCES and metas[sid].get('provider_identifier')!='DFF'
                    for p in source['observations'] if dt.datetime.fromtimestamp(p['t']/1000,UTC).weekday()<5}
        last=max(real_dates);check['latestObservation']=last;check['coverageEnd']=last
        latest_inputs={sid:[p for p in source['observations'] if date_of(p['t'])<=last][-1] for sid,source in actual_sources.items()}
        check['componentObservationDates']={sid:date_of(p['t']) for sid,p in latest_inputs.items()}
        check['heldComponents']=[sid for sid,p in latest_inputs.items() if date_of(p['t'])<last]
        check['knownBy']=capture['knownBy'];check['capturedStateDate']=capture['calendarDate']
        check['projectedRecoveredPeriods']=len([d for d in real_dates if d>seed['indices'][key]['dates'][-1]])
        for horizon,view in derived['indices'][key]['horizons'].items():
            if view['commonNow'] != last:
                raise ValueError('Index projection clock exceeds verified native period: '+key)
            boundary=seed['indices'][key]['dates'][-1]
            original=seed['indices'][key]
            seed_positions={t:i for i,t in enumerate(original['timestamps'])}
            actual=set()
            for point in view['curve']:
                day=date_of(point['t'])
                if day<=boundary:
                    position=seed_positions.get(point['t'])
                    if position is None or point['v']!=original['values'][position]:raise ValueError('Projected original index differs from immutable seed: '+key)
                    expected_inputs={sid:{'t':int(dt.datetime.fromisoformat(original['componentObservationDates'][sid][position]).replace(tzinfo=UTC).timestamp()*1000),
                                          'v':original['componentValues'][sid][position],
                                          'provenance':'immutable-original-seed'} for sid in original['components']}
                    if point.get('baselineInputs')!=expected_inputs or point.get('dateKind')!='original-published-index' or point.get('knownBy') or point.get('nativeInputs'):
                        raise ValueError('Projected original endpoint inputs differ from immutable seed: '+key)
                if day>boundary:
                    actual.add(day)
                    if day not in real_dates or point.get('knownBy')!=capture['knownBy']:raise ValueError('Index projection native date/availability differs: '+key)
                    terms=[]
                    for sid,source in actual_sources.items():
                        native=[p for p in source['observations'] if date_of(p['t'])<=day][-1]
                        proof=point.get('nativeInputs',{}).get(sid)
                        if proof!={'blob':capture['sources'][sid]['blob'],'t':native['t'],'v':native['v']}:
                            raise ValueError('Projected input differs from actual archived vector: '+sid)
                        rule=rules[sid];anchor=seed['indices'][key]['componentValues'][sid][0]
                        change=math.log(native['v'])-math.log(anchor) if rule['transformFamily']=='log_return' else native['v']-anchor
                        terms.append(rule['direction']*change/rule['scale']['annualizedScale'])
                    if not math.isclose(point['v'],100+math.fsum(terms)/7,rel_tol=0,abs_tol=1e-12):raise ValueError('Independent projected formula differs: '+key)
            wanted={day for day in real_dates if boundary<day and view['commonT0']<=day<=view['commonNow']}
            if actual != wanted:
                raise ValueError('Index projected native-period coverage differs: '+key+'/'+horizon)
