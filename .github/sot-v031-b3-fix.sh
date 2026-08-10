#!/usr/bin/env bash
set -euo pipefail

# Reuse the byte-verified build .3 portal payload already embedded in the prior
# owner-gate workflow. This avoids introducing another source copy.
awk '
  /cat > \/tmp\/project\.b64 <<.PAYLOAD./ {capture=1; next}
  capture && /^PAYLOAD$/ {exit}
  capture {print}
' .github/workflows/sot-v031-b3-owner-rebuild.yml > /tmp/project.b64

test -s /tmp/project.b64
base64 -d /tmp/project.b64 | gzip -d > project.html
echo '9840b0a82d2b6588f4b3311ce2b9f2c009a2c238b1f85ad8e00b7744e936cc19  project.html' | sha256sum -c -

python3 - <<'PY'
from pathlib import Path

p=Path('file_browser.py')
s=p.read_text()
assert 'BUILD_ID = "2026.08.10.2"' in s
s=s.replace('Build: 2026.08.10.2','Build: 2026.08.10.3',1)
s=s.replace('BUILD_ID = "2026.08.10.2"','BUILD_ID = "2026.08.10.3"',1)

# Proven owner-gate defect: the established public /api/fs mount strips that
# prefix, so GET /api/fs?path=/ arrives here as GET /?path=/. Preserve plain
# GET / service info, but make /?path=... perform filesystem browsing.
old='''@app.get("/")\ndef root_info() -> dict[str, Any]:\n    ready, reason = engine_state()\n    return {\n        "service": "sot-helper",\n        "status": "ok",\n        "version": API_VERSION,\n        "build": BUILD_ID,\n        "port": SERVICE_PORT,\n        "engine_ready": ready,\n        "engine_reason": reason,\n    }\n'''
new='''@app.get("/")\ndef root_info(path: Optional[str] = Query(default=None)) -> Any:\n    if path is not None:\n        return list_directory(path)\n    ready, reason = engine_state()\n    return {\n        "service": "sot-helper",\n        "status": "ok",\n        "version": API_VERSION,\n        "build": BUILD_ID,\n        "port": SERVICE_PORT,\n        "engine_ready": ready,\n        "engine_reason": reason,\n    }\n'''
assert old in s
s=s.replace(old,new,1)

# A browser-authorized device target is a project locator at Intake time. It is
# deliberately not presented as a WSL path. Actual copy execution remains
# disabled until the deterministic engine supports that data plane.
marker='''def canonical_target_path(value: str) -> str:\n    path = Path(canonical_path(value))\n    if not path.exists():\n        raise HTTPException(404, "Target path not found")\n    if not path.is_dir():\n        raise HTTPException(400, "Target path is not a directory")\n    return str(path)\n'''
if 'def normalize_target_path' not in s:
    assert marker in s
    s=s.replace(marker,marker+'''\n\ndef normalize_target_path(value: str) -> str:\n    raw = str(value or "").strip()\n    if raw.startswith("device-target://"):\n        return raw\n    return canonical_target_path(raw)\n''',1)
s=s.replace('canonical_target_path(payload.target)', 'normalize_target_path(payload.target)')
s=s.replace('canonical_target_path(payload.path)', 'normalize_target_path(payload.path)')
p.write_text(s)

p=Path('SOT_PROJECT_VERSION')
s=p.read_text().replace('2026.08.10.2','2026.08.10.3')
p.write_text(s)

p=Path('deploy-sot-project.sh')
s=p.read_text().replace('2026.08.10.2','2026.08.10.3')
p.write_text(s)

p=Path('project-backlog.md')
s=p.read_text()
owner_rules='''- **Accessible storage is one user concept. Intake must not make the user choose implementation type first. WSL/mounted and browser-local locations belong in one location chooser when accessible.**\n- **The location chooser is dual-pane: storage/locations on the left, contents on the right.**\n- **Target selection order is storage/device → optional parent folder → final SOT folder where surviving files will be written.**\n- **Intake must communicate the job immediately: “here is my mess; here is where I have space to build the SOT.” Remove redundant summary panels and implementation-language clutter.**\n- **Operations uses Projects / Status / Detail tabs. Projects owns add/change/delete metadata and locations; Status owns high-level state and real pause/stop/retry controls when the engine exists; Detail owns in-depth source/target/run information.**\n- **Reporting needs further product definition. Until the engine exists, show authoritative project metadata/events only and do not invent reconciliation metrics.**\n'''
anchor='- Project identity is the immutable `project_token`; project name is mutable.\n'
if owner_rules.splitlines()[0] not in s:
    s=s.replace(anchor,anchor+owner_rules)

evidence='''\n## 1.4 Owner gate — v0.3.1 build 2026.08.10.2 FAILED\n\nThe real WSL/Windows gate proved two defects:\n\n1. `GET /api/fs?path=/` returned the helper service-info object, not storage roots. The established public `/api/fs` mount strips its prefix, so that call arrived as `GET /?path=/`; build .2 had repurposed `/` as service information. This is the proven cause of the empty WSL picker.\n2. Intake UX failed the owner gate: separate WSL/device source controls, a single-pane picker, backwards target wording, and a redundant summary card made the setup implementation-centric and unnecessarily difficult.\n\nBuild .2 is not accepted. Build `2026.08.10.3` remains v0.3.1 and corrects the same locked Intake/filesystem surface.\n\n'''
if '## 1.4 Owner gate — v0.3.1 build 2026.08.10.2 FAILED' not in s:
    s=s.replace('# 2. RELEASE CHAIN',evidence+'# 2. RELEASE CHAIN')

s=s.replace('**Status:** CANDIDATE BUILT — automated candidate gates PASS; repo readback verified; owner/device gate NOT YET RUN.', '**Status:** build 2026.08.10.2 FAILED owner gate; build 2026.08.10.3 is the active v0.3.1 candidate.')
s=s.replace('**Owner/device gate:** NOT YET RUN.', '**Owner/device gate:** build .2 FAIL; build .3 NOT YET RUN.')

req='''\n## 3.8 Owner-gate rebuild — build 2026.08.10.3\n\nMandatory corrections within the same v0.3.1 surface:\n\n- Existing public `/api/fs?path=/` returns real storage roots without changing Tailscale or ports.\n- Intake is project name + source locations + SOT workspace + optional notes + Create project.\n- One **Add locations** action handles accessible source types transparently.\n- Dual-pane explorer: locations/storage left, folder/file contents right.\n- Target flow: storage/device → optional parent folder → final SOT folder.\n- Operations tabs: Projects / Status / Detail.\n- Reporting stays limited to authoritative metadata/events pending separate definition and real engine data.\n\n'''
if '## 3.8 Owner-gate rebuild — build 2026.08.10.3' not in s:
    s=s.replace('# 4. RELEASE PLAN AFTER v0.3.1',req+'# 4. RELEASE PLAN AFTER v0.3.1')

grave='''\n## G-010 — Source-type-first, summary-heavy Intake\n\n**Date buried:** 2026-08-10  \n**Status:** VETOED  \n**Approach:** separate “WSL / mounted source” and “This device” decisions, single-pane browsing, parent-first target language, and a second summary card.  \n**Why buried:** failed the owner gate because it exposes implementation details, reverses the target mental model, and makes a simple storage-reconciliation setup feel difficult.  \n**Replacement:** one Add locations action, dual-pane explorer, target sequence storage → optional parent → final SOT folder, and one streamlined Intake surface.\n\n'''
if '## G-010 — Source-type-first, summary-heavy Intake' not in s:
    s=s.replace('# 8. DONE / CURRENT IMPLEMENTATION LEDGER',grave+'# 8. DONE / CURRENT IMPLEMENTATION LEDGER')
p.write_text(s)
PY

# Static gates: do not require or alter runtime infrastructure.
python3 -m py_compile file_browser.py
bash -n deploy-sot-project.sh
python3 - <<'PY'
from pathlib import Path
import re
s=Path('project.html').read_text()
m=re.search(r'<script>(.*?)</script>',s,re.S)
assert m
Path('/tmp/project-v031-b3.js').write_text(m.group(1))
PY
node --check /tmp/project-v031-b3.js

grep -q 'Build: 2026.08.10.3' project.html
grep -q 'Where is your stuff?' project.html
grep -q 'Where should the SOT be built?' project.html
grep -q 'Add locations' project.html
grep -q 'Storage → optional parent folder → final SOT folder.' project.html
grep -q 'grid-template-columns:240px minmax(0,1fr)' project.html
grep -q '>Projects</button>' project.html
grep -q '>Status</button>' project.html
grep -q '>Detail</button>' project.html
! grep -q '＋ WSL / mounted source' project.html
! grep -q 'Project intake' project.html

grep -q 'def root_info(path: Optional\[str\] = Query(default=None))' file_browser.py
grep -q 'return list_directory(path)' file_browser.py
grep -q 'BUILD_ID = "2026.08.10.3"' file_browser.py
grep -q 'def normalize_target_path' file_browser.py
! grep -q '8082' deploy-sot-project.sh
! grep -q 'tailscale serve' deploy-sot-project.sh

git config user.name 'SOT release builder'
git config user.email 'actions@users.noreply.github.com'
git rm -f .github/workflows/sot-v031-b3-owner-rebuild.yml .github/workflows/sot-v031-b3-fix.yml .github/sot-v031-b3-fix.sh
git add project.html file_browser.py deploy-sot-project.sh SOT_PROJECT_VERSION project-backlog.md
git commit -m 'Rebuild SOT v0.3.1 build 2026.08.10.3 after owner gate'
git pull --rebase origin main
git push origin HEAD:main
