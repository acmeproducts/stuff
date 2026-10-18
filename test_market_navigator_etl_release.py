import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('release',HERE/'market-navigator-etl-run.py')
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)


class Release(unittest.TestCase):
    def test_dependency_closure_excludes_optional_fund(self):
        registry=json.loads((HERE/'data/market-backend/component-registry-v1.json').read_text())
        self.assertEqual(r.affected_indices(registry,['custom_gaamhx']),[])
        expected=[key for key,row in registry['indices'].items() if 'tenYear' in row['components']]
        self.assertEqual(r.affected_indices(registry,['tenYear']),expected)

    def test_accepted_chart_body_is_unchanged(self):
        baseline=(HERE/'market-navigator-chart-only-review/market-navigator-chart-only-candidate.html').read_text(encoding='utf-8')
        candidate=(HERE/'market-navigator-etl-review/index.html').read_text(encoding='utf-8')
        def chart(text):return text[text.index('const MNChart=Object.freeze'):text.index('window.MNChart=MNChart;')]
        self.assertEqual(chart(baseline),chart(candidate))
        accepted=(HERE/'market-navigator-turn28-post-ship.html').read_bytes()
        self.assertEqual(hashlib.sha1(b'blob '+str(len(accepted)).encode()+b'\0'+accepted).hexdigest(),'9ce7f67451f9e1b7804927ce5c56adb667614724')

    def test_failed_attempt_preserves_canonical_bytes(self):
        paths=list((HERE/'market-evidence').rglob('*.json'))+list((HERE/'data/market-backend').glob('*.json'))
        before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
        import os
        with tempfile.TemporaryDirectory() as temp:
            env={**os.environ,'MARKET_NAVIGATOR_FRED_API_KEY':'','MARKET_NAVIGATOR_FRED_API_KEY_SECONDARY':'',
                 'MARKET_NAVIGATOR_REVIEW_ROOT':temp,'MARKET_NAVIGATOR_WORK_ROOT':str(Path(temp)/'working')}
            process=subprocess.run([sys.executable,'-X','utf8',str(HERE/'market-navigator-etl-run.py'),'--retry-stream'],cwd=HERE,env=env,capture_output=True,text=True)
            self.assertEqual(process.returncode,1,process.stdout+process.stderr)
            self.assertIn('MARKET_NAVIGATOR_FRED_API_KEY',process.stdout)
            self.assertEqual(before,{str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths})
            log=json.loads((Path(temp)/'market-evidence/run-log.json').read_text())
            self.assertEqual(log['runs'][-1]['result'],'failed')

    def test_package_is_immutable_and_bad_replacement_keeps_pointer(self):
        previous=r.REVIEW
        with tempfile.TemporaryDirectory() as temp:
            stage=Path(temp)/'stage';r.REVIEW=Path(temp)/'review'
            try:
                path=stage/'market-evidence/series/spy.json';r.write(path,{'observations':[{'t':1,'v':2}]})
                version=r.package(stage);pointer=(r.REVIEW/'channel.json').read_bytes()
                immutable=r.REVIEW/'versions'/version/'market-evidence/series/spy.json'
                immutable.write_text('corrupt')
                with self.assertRaises(ValueError):r.package(stage)
                self.assertEqual((r.REVIEW/'channel.json').read_bytes(),pointer)
            finally:r.REVIEW=previous


if __name__=='__main__':unittest.main()
