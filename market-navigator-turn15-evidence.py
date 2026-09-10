from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
import json
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path('.')
SERIES_DIR = ROOT / 'market-evidence' / 'series'
GDP_PATH = SERIES_DIR / 'realGdp.json'
CATALOG_PATH = ROOT / 'data' / 'market-backend' / 'data-catalog.json'
HEALTH_PATH = ROOT / 'market-evidence' / 'health-envelope.json'


def dump(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=False) + '\n')


def clean_num(v: float) -> float:
    return round(float(v), 10)


raw = json.loads(GDP_PATH.read_text())
obs = raw.get('observations') or []
if len(obs) < 5:
    raise SystemExit('realGdp requires at least five quarterly observations')

# Preserve the canonical real observation timestamps. Only the value is transformed.
qoq = []
yoy = []
for i, cur in enumerate(obs):
    cv = float(cur['v'])
    if i >= 1:
        pv = float(obs[i - 1]['v'])
        if pv == 0:
            raise SystemExit('realGdp contains zero prior value; q/q undefined')
        qoq.append({'t': int(cur['t']), 'v': clean_num((cv / pv - 1.0) * 100.0)})
    if i >= 4:
        pv4 = float(obs[i - 4]['v'])
        if pv4 == 0:
            raise SystemExit('realGdp contains zero year-prior value; y/y undefined')
        yoy.append({'t': int(cur['t']), 'v': clean_num((cv / pv4 - 1.0) * 100.0)})

source_revision = raw.get('sourceRevision') or sha256(GDP_PATH.read_bytes()).hexdigest()
generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


def transformed(series_id: str, description: str, observations: list[dict]) -> dict:
    out = {
        'cadence': 'quarterly',
        'catalogVersion': raw.get('catalogVersion'),
        'count': len(observations),
        'description': description,
        'first': observations[0]['t'],
        'http': 200,
        'id': series_id,
        'last': observations[-1]['t'],
        'last_attempted': raw.get('last_attempted'),
        'last_error': None,
        'last_successful': raw.get('last_successful'),
        'observations': observations,
        'pipelineVersion': '2.0.0-turn15-gdp-transform',
        'provider': raw.get('provider', 'FRED'),
        'providerIdentifier': raw.get('providerIdentifier', 'GDPC1'),
        'schema': 'market-navigator-evidence-series-v1',
        'sourceRevision': source_revision,
        'transformGeneratedAt': generated_at,
        'transformSourceId': 'realGdp',
        'unit': 'percent',
    }
    payload = json.dumps(observations, separators=(',', ':'), sort_keys=True).encode()
    out['transformRevision'] = sha256(payload).hexdigest()
    return out


qoq_obj = transformed(
    'gdpQoq',
    'Real U.S. GDP quarter-over-quarter percent change, derived deterministically from canonical GDPC1 quarterly levels.',
    qoq,
)
yoy_obj = transformed(
    'gdpYoy',
    'Real U.S. GDP year-over-year percent change, derived deterministically from canonical GDPC1 quarterly levels.',
    yoy,
)
dump(SERIES_DIR / 'gdpQoq.json', qoq_obj)
dump(SERIES_DIR / 'gdpYoy.json', yoy_obj)

catalog = json.loads(CATALOG_PATH.read_text())
series_list = catalog.get('series')
if not isinstance(series_list, list):
    raise SystemExit('data catalog series must be a list')
raw_entry = next((x for x in series_list if x.get('id') == 'realGdp'), None)
if raw_entry is None:
    raise SystemExit('realGdp catalog entry missing')


def catalog_transform(series_id: str, name: str, short_name: str, transform: str, description: str) -> dict:
    item = deepcopy(raw_entry)
    item.update({
        'id': series_id,
        'name': name,
        'short_name': short_name,
        'native_unit': 'percent',
        'native_cadence': 'quarterly',
        'description': description,
        'enabled': True,
        'transform': transform,
        'transform_source_id': 'realGdp',
        'user_selectable': True,
    })
    # Keep FRED/GDPC1 provenance and source URL from the raw level entry.
    return item


series_list[:] = [x for x in series_list if x.get('id') not in {'gdpQoq', 'gdpYoy'}]
series_list.extend([
    catalog_transform(
        'gdpQoq', 'Real GDP q/q', 'GDP q/q', 'qoq_percent_change',
        'Quarter-over-quarter percent change in Real U.S. GDP derived from canonical GDPC1 levels.',
    ),
    catalog_transform(
        'gdpYoy', 'Real GDP y/y', 'GDP y/y', 'yoy_percent_change',
        'Year-over-year percent change in Real U.S. GDP derived from canonical GDPC1 levels.',
    ),
])
dump(CATALOG_PATH, catalog)

health = json.loads(HEALTH_PATH.read_text())
hseries = health.get('series')
if not isinstance(hseries, dict) or 'realGdp' not in hseries:
    raise SystemExit('realGdp health entry missing')
base_health = hseries['realGdp']


def health_transform(series_id: str, name: str, short_name: str, transform_label: str, obj: dict) -> dict:
    item = deepcopy(base_health)
    item.update({
        'id': series_id,
        'name': name,
        'shortName': short_name,
        'affectedIndices': [],
        'chartImpact': f'Affects direct Analysis using {short_name}.',
        'collectorError': None,
        'classification': base_health.get('classification', 'current'),
        'transform': transform_label,
        'transformSourceId': 'realGdp',
        'transformRevision': obj['transformRevision'],
        'analysisAvailability': 'periodic-transform',
        'observationCount': obj['count'],
    })
    return item


hseries['gdpQoq'] = health_transform('gdpQoq', 'Real GDP q/q', 'GDP q/q', 'qoq_percent_change', qoq_obj)
hseries['gdpYoy'] = health_transform('gdpYoy', 'Real GDP y/y', 'GDP y/y', 'yoy_percent_change', yoy_obj)
dump(HEALTH_PATH, health)

# Mechanical transform assertions.
last_raw = float(obs[-1]['v'])
prev_raw = float(obs[-2]['v'])
year_raw = float(obs[-5]['v'])
assert abs(qoq[-1]['v'] - ((last_raw / prev_raw - 1) * 100)) < 1e-8
assert abs(yoy[-1]['v'] - ((last_raw / year_raw - 1) * 100)) < 1e-8
assert qoq_obj['last'] == raw['last'] == yoy_obj['last']
print(f"TURN 15 GDP: q/q={qoq[-1]['v']:.4f}% y/y={yoy[-1]['v']:.4f}% at {qoq[-1]['t']}")
