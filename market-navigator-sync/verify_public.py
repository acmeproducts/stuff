"""Read-only verification of the actual public validation publication."""
import hashlib,json,time,urllib.request
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]/'market-navigator-throwaway-review'
URL='https://acmeproducts.github.io/stuff/market-navigator-throwaway-review/'
def get(path):
    request=urllib.request.Request(URL+path,headers={'Cache-Control':'no-cache','User-Agent':'MarketNavigatorPublicationVerification/1.0'})
    with urllib.request.urlopen(request,timeout=30) as response:return response.read()
def main():
    expected=json.loads((BASE/'market-navigator-rebuild-data/package.json').read_text())
    errors=[]
    for attempt in range(12):
        try:
            app=get('throwaway.html');assert hashlib.sha1(b'blob '+str(len(app)).encode()+b'\0'+app).hexdigest()=='3103a98d2aac9e5c054537660a6b2480d9752b9c','Public chart is not the approved source'
            descriptor=json.loads(get('market-navigator-rebuild-data/package.json'));assert descriptor==expected,'Public data version has not reached this deployment'
            paths=['market-evidence/derived-indices-persistent-v1.json','market-evidence/sync-proof.json','market-evidence/reports/cpi.json','market-evidence/series/wti.json','market-evidence/series/copper.json','market-evidence/health-envelope.json']
            for path in paths:
                assert hashlib.sha256(get('market-navigator-rebuild-data/'+path)).hexdigest()==expected['resources'][path],path
            print(json.dumps({'status':'PASS','url':URL+'throwaway.html','version':expected['version'],'approvedChart':'3103a98d2aac9e5c054537660a6b2480d9752b9c','publicResourceHashes':len(paths)}));return
        except Exception as e:
            errors.append(str(e))
            if attempt<11:time.sleep(10)
    raise RuntimeError('Public publication verification failed: '+json.dumps(errors))
if __name__=='__main__':main()

