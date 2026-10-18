"""Incrementally extend approved ALFRED sidecars for changed FRED components.

Retains the established pre-collection event history. Never substitutes current
CSV values for historical availability. The caller publishes only after replay.
"""
import datetime as dt
import importlib.util
from pathlib import Path

spec=importlib.util.spec_from_file_location('vintage_api',Path(__file__).with_name('market-navigator-vintage-sidecar.py'))
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)


def current_revisions(native,rows,at):
    values={dt.datetime.fromtimestamp(p['t']/1000,dt.timezone.utc).date().isoformat():dict(p) for p in native}
    for row in sorted(rows,key=lambda r:r['realtime_start']):
        value=api.clean_value(row.get('value'))
        if row['date'] not in values or value is None or not row['realtime_start']<=at[:10]<=row['realtime_end']:continue
        values[row['date']]['v']=value
    return sorted(values.values(),key=lambda p:p['t'])


def extend(prior, periods):
    events=[dict(e) for e in prior['events']]
    by_period={}
    for event in events:by_period.setdefault(event['observationDate'],[]).append(event)
    for raw in sorted(periods,key=lambda r:(r['realtime_start'],r['date'])):
        value=api.clean_value(raw.get('value'))
        if value is None:continue
        period=raw['date'];available=raw['realtime_start']
        known=sorted(by_period.get(period,[]),key=lambda e:e['availableFrom'])
        previous=next((e for e in reversed(known) if e['availableFrom']<=available),None)
        # FRED clips intervals to the requested realtime_start. An unchanged
        # clipped state is not a new economic release or revision.
        if previous and previous['value']==value:continue
        if previous and previous['availableFrom']==available:
            raise ValueError('Conflicting historical ALFRED event: '+period+' / '+available)
        if previous:
            previous['availableUntil']=(dt.date.fromisoformat(available)-dt.timedelta(days=1)).isoformat()
        event={'observationDate':period,'availableFrom':available,'availableUntil':raw['realtime_end'],
               'value':value,'isInitialRelease':not known,'isRevision':bool(known)}
        events.append(event);by_period.setdefault(period,[]).append(event)
    return sorted(events,key=lambda e:(e['availableFrom'],e['observationDate'],e['value']))


def update(ids, read, write, at,collector=None):
    touched=[]
    registry=read(Path('data/market-backend/component-registry-v1.json'))
    components={r['id']:r for r in registry['components']}
    manifest_path=Path('market-evidence/vintage/manifest.json');manifest=read(manifest_path)
    for sid in sorted(set(ids)&set(components)):
        if components[sid]['provider']!='FRED':continue
        path=Path('market-evidence/vintage')/(sid+'.json');prior=read(path)
        if prior.get('availabilityQualification')=='BLOCKED_NOT_IN_ALFRED':continue
        if prior.get('availabilityQualification')!='QUALIFIED_ALFRED':raise ValueError(sid+': missing qualified vintage baseline')
        if prior['sourceSeriesId']!=components[sid]['providerIdentifier']:raise ValueError(sid+': vintage source identity mismatch')
        if not api.KEY:raise RuntimeError('MARKET_NAVIGATOR_FRED_API_KEY is required to extend governed ALFRED history for '+sid+'; current CSV cannot establish historical availability')
        since=prior['generatedAt'][:10]
        rows=api.get_json({'series_id':prior['sourceSeriesId'],'observation_start':api.START,
                           'realtime_start':since,'realtime_end':at[:10],'output_type':1,'sort_order':'asc'}).get('observations',[])
        if not rows:raise ValueError(sid+': ALFRED returned no availability observations')
        if collector:
            native_path=Path('market-evidence/source-observations')/(sid+'.json');native=read(native_path)
            points=current_revisions(native['observations'],rows,at)
            if points!=native['observations']:
                native.update(observations=points,sourceRevision=collector.sha(points));write(native_path,native)
                catalog=read(Path('data/market-backend/data-catalog.json'))
                meta=next(m for m in catalog['series'] if m['id']==sid)
                canonical=collector.yoy(points) if 'year-over-year percent change' in (meta.get('transformation') or '').lower() else points
                source_path=Path('market-evidence/series')/(sid+'.json');source=read(source_path)
                source.update(observations=canonical,sourceRevision=collector.sha(canonical));write(source_path,source)
                report_path=Path('market-evidence/reports')/(sid+'.json');report=read(report_path)
                horizons=catalog['canonical_horizons'];supported=set(meta.get('supported_horizons') or horizons)
                reports={h:collector.report(canonical,h) if h in supported else {'ready':False,'reason':'unsupported horizon for canonical evidence cadence'} for h in horizons}
                for h,row in reports.items():row.update(source_revision=source['sourceRevision'],source=source['provider'],series_id=sid,horizon=h)
                report.update(reports=reports,computedRevision=collector.sha(reports),generatedAt=at);write(report_path,report)
                operational_path=Path('market-evidence/operational-manifest.json');operational=read(operational_path)
                operational['series'][sid].update(source_revision=source['sourceRevision'],computed_revision=report['computedRevision'])
                write(operational_path,operational);touched.append(sid)
        events=extend(prior,rows)
        if events==prior['events']:continue
        if sid not in touched:touched.append(sid)
        revised={**prior,'generatedAt':at,'events':events};write(path,revised)
        manifest['series'][sid]={**manifest['series'][sid],'events':len(events),
                                'initial':sum(e['isInitialRelease'] for e in events),
                                'revisions':sum(e['isRevision'] for e in events),
                                'firstAvailable':events[0]['availableFrom'],'lastAvailable':events[-1]['availableFrom']}
    if touched:manifest['generatedAt']=at;write(manifest_path,manifest)
    return touched
