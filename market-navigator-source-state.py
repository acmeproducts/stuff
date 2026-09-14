#!/usr/bin/env python3
from __future__ import annotations
import argparse,datetime as dt,json
from pathlib import Path

REGISTRY=Path('data/market-backend/source-registry.json')
HEALTH=Path('market-evidence/health-envelope.json')
SERIES=Path('market-evidence/series')

def read(p,default=None):
 try:return json.loads(p.read_text())
 except Exception:return {} if default is None else default

def write(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def now():return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument('--query',required=True)
 ap.add_argument('--force-failed',action='store_true')
 ap.add_argument('--failure-message',default='')
 args=ap.parse_args()
 reg=read(REGISTRY);regs=reg.get('registrations') or []
 match=[x for x in regs if str(x.get('query','')).lower()==args.query.strip().lower()]
 if not match:raise SystemExit('registration missing for '+args.query)
 rec=match[-1];sid=rec['id'];health=(read(HEALTH).get('series') or {}).get(sid) or {};evidence=read(SERIES/f'{sid}.json',{})
 classification=health.get('classification');count=int(evidence.get('count') or health.get('observationCount') or 0)
 fallback=bool(health.get('providerFallbackUsed',evidence.get('providerFallbackUsed',False)))
 provider=health.get('provider') or evidence.get('provider')
 provider_errors=health.get('providerErrors') or evidence.get('providerErrors') or []
 collector_error=health.get('collectorError') or evidence.get('last_error')
 if args.force_failed:
  status='failed'
 elif count<=0 or classification in ('failed','missing'):
  status='failed'
 elif fallback:
  status='degraded'
 else:
  status='active'
 rec.update({
  'status':status,
  'statusUpdatedAt':now(),
  'observationCount':count,
  'healthClassification':classification,
  'providerUsed':provider,
  'providerFallbackUsed':fallback,
  'providerErrors':provider_errors,
  'collectorError':collector_error,
  'enabledHorizons':[h for h,ready in (health.get('horizonCoverage') or {}).items() if ready],
  'lastSuccessfulCollection':health.get('lastSuccessfulCollection') or evidence.get('last_successful')
 })
 if status=='failed':
  rec['failureReason']=args.failure_message or collector_error or ('Health classification '+str(classification) if classification else 'registration pipeline failed before qualification')
 else:rec.pop('failureReason',None)
 reg['updatedAt']=now();write(REGISTRY,reg)
 print(json.dumps({'id':sid,'status':status,'classification':classification,'count':count,'provider':provider,'fallback':fallback},indent=2))

if __name__=='__main__':main()
