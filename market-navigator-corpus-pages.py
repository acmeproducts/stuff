"""Verify that every audited Market Navigator byte reached Pages, not only the Git repository."""
import argparse, concurrent.futures, hashlib, json, urllib.parse, urllib.request
from pathlib import Path
def verify_asset(base,path,expected,fetch=None):
    if not path.endswith(".json") or ".." in Path(path).parts or not path.startswith(("market-evidence/","data/market-backend/")):raise ValueError("Non-owned corpus asset: "+path)
    url=base.rstrip("/")+"/"+urllib.parse.quote(path,safe="/")+"?corpus_sha="+expected
    def get(url):
        with urllib.request.urlopen(urllib.request.Request(url,headers={"Cache-Control":"no-cache"}),timeout=25) as r:return r.read()
    fetch=fetch or get
    last=None
    for _ in range(2):
        try:
            actual=hashlib.sha256(fetch(url)).hexdigest()
            if actual!=expected:raise ValueError("Published byte mismatch: "+path)
            return path
        except Exception as e:last=e
    raise RuntimeError(str(last))
def main():
    ap=argparse.ArgumentParser();ap.add_argument("--base-url",default="https://acmeproducts.github.io/stuff");ap.add_argument("--root",default=".");args=ap.parse_args()
    root=Path(args.root);path="market-evidence/corpus-health.json";raw=(root/path).read_bytes();report=json.loads(raw)
    assets={p:v["sha256"] for p,v in report["files"].items()}
    if report.get("publicationStatus")=="held":
        # A held report describes rejected staged data. Verify the retained repository payload instead.
        assets={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in assets if (root/p).is_file()}
    assets[path]=hashlib.sha256(raw).hexdigest()
    failures=[];verified=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        pending={pool.submit(verify_asset,args.base_url,p,sha):p for p,sha in assets.items()}
        for f in concurrent.futures.as_completed(pending):
            try:verified.append(f.result())
            except Exception as e:failures.append(dict(path=pending[f],error=str(e)))
    result=dict(schema="market-navigator-corpus-pages-verification-v1",status="FAIL" if failures else "PASS",baseUrl=args.base_url,verified=len(verified),expected=len(assets),maximumAttemptsPerAsset=2,failures=failures,corpusPublicationStatus=report.get("publicationStatus"))
    Path("market-navigator-corpus-pages-report.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps(result,indent=2))
    if failures:raise SystemExit(1)
if __name__=="__main__":main()
