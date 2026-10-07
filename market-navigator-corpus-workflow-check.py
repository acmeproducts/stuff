"""Validate only the owned Market Navigator workflows and publication seams."""
from pathlib import Path
import yaml

for name in ('market-evidence-pipeline', 'market-navigator-corpus-qualification', 'market-navigator-corpus-pages', 'market-navigator-recovery-qualification'):
    workflow = yaml.safe_load(Path('.github/workflows/' + name + '.yml').read_text())
    assert workflow.get('jobs'), name
    assert workflow.get('on') or workflow.get(True), name
    print(name, 'syntax PASS')
w = Path('.github/workflows/market-evidence-pipeline.yml').read_text()
assert w.count('python3 market-navigator-corpus.py --repair --collect --strict') == 3
assert w.count('git worktree add --detach "$status_dir" origin/main') == 2
assert w.count('gh workflow run static.yml --ref main') == 2
assert '37 0-22 * * *' in w
assert 'if: success()' in w
assert w.count('python3 market-navigator-corpus.py --strict --output market-evidence/corpus-health.json') == 2
print('Last-good publication boundaries PASS')
