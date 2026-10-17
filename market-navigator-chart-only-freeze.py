"""Fetch the accepted code/data pair unchanged; never reconstruct observations."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent / 'market-navigator-chart-only-review'
MANIFEST = ROOT / 'frozen-fixture-manifest.json'


def git_blob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def main():
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    commit = manifest['commit']

    def fetch(entry):
        target = ROOT / entry['path']
        if not target.resolve().is_relative_to(ROOT.resolve()):
            raise ValueError('Fixture path escapes review namespace')
        if target.exists():
            data = target.read_bytes()
            if git_blob(data) != entry['sha']:
                raise ValueError('Preserve mismatched existing fixture: ' + entry['path'])
            return len(data)
        url = ('https://raw.githubusercontent.com/acmeproducts/stuff/' + commit + '/' +
               urllib.parse.quote(entry['source'], safe='/'))
        request = urllib.request.Request(url, headers={'User-Agent': 'MarketNavigatorFrozenFixture/1'})
        with urllib.request.urlopen(request, timeout=90) as response:
            data = response.read()
        if git_blob(data) != entry['sha']:
            raise ValueError('Source hash mismatch: ' + entry['path'])
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open('xb') as handle:
            handle.write(data)
        return len(data)

    with ThreadPoolExecutor(max_workers=8) as workers:
        sizes = list(workers.map(fetch, manifest['entries']))
    result = {'commit': commit, 'verifiedFiles': len(sizes), 'verifiedBytes': sum(sizes),
              'dataPolicy': 'Exact accepted historical bytes; no updates or reconstruction'}
    print(json.dumps(result))


if __name__ == '__main__':
    main()
