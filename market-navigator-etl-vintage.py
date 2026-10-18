"""Incrementally extend approved ALFRED sidecars for changed FRED components.

Retains the established pre-collection event history. Never substitutes current
CSV values for historical availability. The caller publishes only after replay.
"""
import datetime as dt
import importlib.util
from pathlib import Path

spec=importlib.util.spec_from_file_location('vintage_api',Path(__file__).with_name('market-navigator-vintage-sidecar.py'))
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)


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


def update(ids, read, write, at):
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
        events=extend(prior,rows)
        revised={**prior,'generatedAt':at,'events':events};write(path,revised)
        manifest['series'][sid]={**manifest['series'][sid],'events':len(events),
                                'initial':sum(e['isInitialRelease'] for e in events),
                                'revisions':sum(e['isRevision'] for e in events),
                                'firstAvailable':events[0]['availableFrom'],'lastAvailable':events[-1]['availableFrom']}
    manifest['generatedAt']=at;write(manifest_path,manifest)
