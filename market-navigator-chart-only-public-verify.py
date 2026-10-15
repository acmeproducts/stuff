"""Verify the published chart-only namespace against accepted immutable bytes."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent


def blob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-commit', required=True)
    parser.add_argument('--base-url', default='https://acmeproducts.github.io/stuff/market-navigator-chart-only-review/')
    args = parser.parse_args()
    fixture = ROOT / 'market-navigator-chart-only-review'
    manifest = json.loads((fixture / 'frozen-fixture-manifest.json').read_text(encoding='utf-8'))
    files = [dict(path=e['path'], expected=e['sha']) for e in manifest['entries']]
    candidate = 'market-navigator-chart-only-candidate.html'
    files.append({'path': candidate, 'expected': blob((fixture / candidate).read_bytes())})
    files.append({'path': 'frozen-fixture-manifest.json', 'expected': blob((fixture / 'frozen-fixture-manifest.json').read_bytes())})

    def verify(entry):
        url = args.base_url.rstrip('/') + '/' + urllib.parse.quote(entry['path'], safe='/')
        request = urllib.request.Request(url, headers={'User-Agent': 'MarketNavigatorChartOnlyDeliveryCheck/1'})
        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read()
        actual = blob(data)
        if actual != entry['expected']:
            raise ValueError('Published bytes differ: ' + entry['path'])
        return {'path': entry['path'], 'gitBlob': actual, 'bytes': len(data)}

    with ThreadPoolExecutor(max_workers=8) as workers:
        results = list(workers.map(verify, files))
    report = {'status': 'PASS', 'scope': 'Published byte identity only; historical accepted data, not live freshness',
              'sourceCommit': args.source_commit, 'acceptedCommit': manifest['commit'],
              'baseURL': args.base_url, 'verifiedFiles': len(results), 'files': results}
    output = ROOT / 'market-navigator-chart-only-evidence' / 'public-byte-verification.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k != 'files'}))


if __name__ == '__main__':
    main()
