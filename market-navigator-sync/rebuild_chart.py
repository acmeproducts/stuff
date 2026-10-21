from pathlib import Path
import hashlib,json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
def main():
    subprocess.run([sys.executable,'market-navigator-chart-correction-build.py'],cwd=ROOT,check=True)
    raw=(ROOT/'.evidence/chart-correction-candidate/throwaway.html').read_bytes()
    blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
    receipt=json.loads((ROOT/'.evidence/chart-correction-build.json').read_text())
    assert receipt['baseline']=='ee38d9c9da9af4b2795695a39519c76e6c5e5239' and receipt['candidate']==blob
    old=re.search(r"APP='([a-f0-9]{40})'",(ROOT/'market-navigator-sync/run.py').read_text()).group(1)
    for name in ['run.py','browser.cjs','verify_public.py','README.md']:
        p=ROOT/'market-navigator-sync'/name;text=p.read_text(encoding='utf-8');assert old in text,name;p.write_text(text.replace(old,blob),encoding='utf-8')
    (ROOT/'market-navigator-sync/approved-chart.html').write_bytes(raw)
    inputs=['market-navigator-chart-correction-build.py','market-navigator-sync/rebuild_chart.py']+[str(p.relative_to(ROOT)).replace('\\','/') for p in sorted((ROOT/'market-navigator-chart-correction').iterdir()) if p.suffix in ('.js','.css','.html','.json')]
    contract=json.loads((ROOT/'market-navigator-acceptance/contract.json').read_text())
    inputs+=['market-navigator-sync/freshness.py','market-navigator-sync/test_freshness.py','market-navigator-sync/test_consumer_freshness.cjs','market-navigator-sync/test_blocked_browser.cjs','market-navigator-acceptance/contract.json','market-navigator-acceptance/run.cjs']+contract['authority']+contract['suites']
    (ROOT/'.evidence/chart-construction-proof.json').write_text(json.dumps({'application_blob':blob,'input_hashes':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in inputs}},indent=2))
    print(json.dumps({'application_blob':blob}))
if __name__=='__main__':main()
