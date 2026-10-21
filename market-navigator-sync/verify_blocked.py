"""Verify a deliberately withheld live publication; never call it qualified data."""
import hashlib,json,time,urllib.request
from pathlib import Path
base=Path('market-navigator-throwaway-review')
url='https://acmeproducts.github.io/stuff/market-navigator-throwaway-review/'
expected=(base/'throwaway.html').read_bytes()
for attempt in range(24):
 try:
  def get(p):
   with urllib.request.urlopen(urllib.request.Request(url+p,headers={'Cache-Control':'no-cache'}),timeout=30) as r:return r.read()
  assert get('throwaway.html')==expected
  c=json.loads(get('connection.json'));assert c['status']=='BLOCKED' and c['displayPermitted'] is False
  print(json.dumps({'status':'CONTAINMENT_VERIFIED','displayPermitted':False,'application_blob':hashlib.sha1(b'blob '+str(len(expected)).encode()+b'\0'+expected).hexdigest(),'url':url+'throwaway.html'}));break
 except Exception:
  if attempt==23:raise
  time.sleep(10)
