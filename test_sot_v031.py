#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import os
import re
import tempfile
import sys
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path('/mnt/data')
HTML = ROOT / 'project_v031_build.html'
BACKEND = ROOT / 'file_browser_v031.py'
DEPLOY = ROOT / 'deploy-sot-project-v031.sh'


def assert_static(html_text: str, backend_text: str, deploy_text: str) -> None:
    assert "UI Version: 0.3.1" in html_text
    assert "Build: 2026.08.10.1" in html_text
    assert "const APP_VERSION='0.3.1'" in html_text
    assert "const BUILD_ID='2026.08.10.1'" in html_text
    assert "function createPathHistory(start='/')" in html_text, 'browser must use logical navigation history'
    assert "const nav=createPathHistory('/')" in html_text
    assert 'function parentPath(' not in html_text, 'calculated parent-path navigation is graveyarded'
    assert "files.map(name=>`<div class=\"file-row\"" in html_text, 'returned files must be visible'
    assert "body:JSON.stringify({parent_path:parentPath,folder_name:folderName})" in html_text
    assert "defaultFolderName:state.intake.name.trim()" in html_text
    assert "id=\"addDeviceSource\"" in html_text
    assert "$('#addDeviceSource').onclick=()=>pickLocalDeviceSource" in html_text
    assert "showDirectoryPicker" in html_text
    assert "webkitdirectory" in html_text
    assert "source_type:'browser_local'" in html_text
    assert "Reauthorize / verify" in html_text
    assert "enumerateDirectoryHandle" in html_text
    assert "source_fingerprint" in html_text

    assert 'API_VERSION = "0.3.1"' in backend_text
    assert 'BUILD_ID = "2026.08.10.1"' in backend_text
    assert '@app.post("/api/fs/mkdir")' in backend_text
    assert 'target.mkdir()' in backend_text
    assert 'if not target.is_dir()' in backend_text
    assert 'source_type TEXT NOT NULL DEFAULT \'wsl_path\'' in backend_text
    assert '"browser_local"' in backend_text
    assert 'PRAGMA journal_mode=WAL' in backend_text
    assert 'Idempotency key was already used for a different project request' in backend_text

    assert 'REPORT_DIR="${WORKSPACE}/https/report/SOT"' in deploy_text
    assert 'ts serve --bg --set-path=/api http://127.0.0.1:8081' in deploy_text
    assert '--port 8082' not in deploy_text
    assert 'http://127.0.0.1:8082' not in deploy_text


def mutation_checks(html_text: str, backend_text: str, deploy_text: str) -> None:
    mutations = []
    mutations.append((
        html_text.replace("const nav=createPathHistory('/')", "const nav={depth:()=>1}", 1), backend_text, deploy_text,
        'browser-history mutation',
    ))
    mutations.append((
        html_text.replace("files.map(name=>`<div class=\"file-row\"", "[].map(name=>`<div class=\"file-row\"", 1), backend_text, deploy_text,
        'hide-files mutation',
    ))
    mutations.append((
        html_text.replace("$('#addDeviceSource').onclick=()=>pickLocalDeviceSource", "void 0;// unreachable-local-device", 1), backend_text, deploy_text,
        'local-device reachability mutation',
    ))
    mutations.append((
        html_text, backend_text.replace('target.mkdir()', 'pass  # mkdir removed', 1), deploy_text,
        'mkdir no-op mutation',
    ))
    mutations.append((
        html_text, backend_text, deploy_text.replace('ts serve --bg --set-path=/api http://127.0.0.1:8081', 'ts serve --bg --set-path=/api http://127.0.0.1:8082', 1),
        '8082 topology mutation',
    ))
    for h, b, d, name in mutations:
        caught = False
        try:
            assert_static(h, b, d)
        except AssertionError:
            caught = True
        assert caught, f'mutation gate failed to catch: {name}'


def load_backend(db_path: Path):
    os.environ['SOT_PROJECT_DB'] = str(db_path)
    spec = importlib.util.spec_from_file_location('sot_v031_backend', BACKEND)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


def api_checks() -> None:
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        db_path = td / 'projects.sqlite'
        visible = td / 'visible'
        visible.mkdir()
        src = visible / 'Source A'
        src.mkdir()
        (src / 'one.txt').write_text('one')
        files_only = visible / 'FilesOnly'
        files_only.mkdir()
        (files_only / 'a.jpg').write_bytes(b'abc')
        target_parent = visible / 'SOT'
        target_parent.mkdir()

        mod = load_backend(db_path)
        mod.allowed_roots = lambda: [visible]
        mod.discover_mounts = lambda: [visible]
        mod.build_root_entries = lambda: [('T:', visible)]

        with TestClient(mod.app) as client:
            h = client.get('/api/projects/health')
            assert h.status_code == 200, h.text
            assert h.json()['version'] == '0.3.1'
            assert h.json()['build'] == '2026.08.10.1'
            assert h.json()['engine_ready'] is False

            root = client.get('/api/fs', params={'path': '/'})
            assert root.status_code == 200, root.text
            assert root.json()['path'] == '/'
            assert root.json()['folders'] == ['T:']

            listing = client.get('/api/fs', params={'path': str(files_only)})
            assert listing.status_code == 200, listing.text
            assert listing.json()['folders'] == []
            assert listing.json()['files'] == ['a.jpg']

            mk = client.post('/api/fs/mkdir', json={'parent_path': str(target_parent), 'folder_name': 'DJI #1'})
            assert mk.status_code == 200, mk.text
            target = Path(mk.json()['path'])
            assert mk.json()['created'] is True
            assert target.is_dir()

            again = client.post('/api/fs/mkdir', json={'parent_path': str(target_parent), 'folder_name': 'DJI #1'})
            assert again.status_code == 200
            assert again.json()['created'] is False
            assert again.json()['already_existed'] is True

            bad = client.post('/api/fs/mkdir', json={'parent_path': str(target_parent), 'folder_name': '../escape'})
            assert bad.status_code == 422
            invalid = client.post('/api/fs/mkdir', json={'parent_path': str(target_parent), 'folder_name': 'bad:name'})
            assert invalid.status_code == 422
            occupied = target_parent / 'occupied'
            occupied.write_text('file')
            conflict = client.post('/api/fs/mkdir', json={'parent_path': str(target_parent), 'folder_name': 'occupied'})
            assert conflict.status_code == 409

            local_fp = 'a' * 64
            payload = {
                'project_name': 'DJI #1',
                'sources': [
                    str(src),
                    {
                        'source_type': 'browser_local',
                        'client_source_id': 'DEV-123',
                        'operator_label': 'This device · DCIM',
                        'locator': 'device://DEV-123/DCIM',
                        'source_fingerprint': local_fp,
                        'metadata': {
                            'directory_name': 'DCIM',
                            'top_level_files': 10,
                            'top_level_folders': 2,
                            'picker': 'showDirectoryPicker',
                        },
                    },
                ],
                'target': str(target),
                'notes': 'test',
                'idempotency_key': 'idem-1',
            }
            created = client.post('/api/projects', json=payload, headers={'Idempotency-Key': 'idem-1'})
            assert created.status_code == 200, created.text
            body = created.json()
            assert body['deduplicated'] is False
            token = body['project']['project_token']
            assert token.startswith('PRJ-')
            sources = body['project']['sources']
            assert {s['source_type'] for s in sources} == {'wsl_path', 'browser_local'}
            local = next(s for s in sources if s['source_type'] == 'browser_local')
            assert local['client_source_id'] == 'DEV-123'
            assert local['source_fingerprint'] == local_fp
            assert local['metadata']['directory_name'] == 'DCIM'

            retry = client.post('/api/projects', json=payload, headers={'Idempotency-Key': 'idem-1'})
            assert retry.status_code == 200
            assert retry.json()['deduplicated'] is True
            assert retry.json()['project']['project_token'] == token

            changed = dict(payload)
            changed['project_name'] = 'Different request'
            idem_conflict = client.post('/api/projects', json=changed, headers={'Idempotency-Key': 'idem-1'})
            assert idem_conflict.status_code == 409

            renamed = client.patch(f'/api/projects/{token}', json={'project_name': 'DJI Master'})
            assert renamed.status_code == 200
            assert renamed.json()['project_token'] == token
            assert renamed.json()['project_name'] == 'DJI Master'

            projects = client.get('/api/projects')
            assert projects.status_code == 200
            assert any(p['project_token'] == token for p in projects.json()['projects'])

            aggregate = client.get('/api/reports/aggregate')
            assert aggregate.status_code == 200
            assert aggregate.json()['projects_total'] == 1
            assert aggregate.json()['sources_total'] == 2
            assert aggregate.json()['raw_bytes_scanned'] is None

            timeline = client.get('/api/reports/timeline')
            assert timeline.status_code == 200
            assert any(e['event_type'] == 'PROJECT_RENAMED' for e in timeline.json()['events'])

            not_ready = client.post(f'/api/projects/{token}/start', json={})
            assert not_ready.status_code == 501
            assert not_ready.json()['detail']['code'] == 'ENGINE_NOT_READY'

        # New app/client instance against the same DB: server state persists independently of browser state.
        mod2 = load_backend(db_path)
        mod2.allowed_roots = lambda: [visible]
        mod2.discover_mounts = lambda: [visible]
        with TestClient(mod2.app) as client2:
            persisted = client2.get('/api/projects')
            assert persisted.status_code == 200
            assert persisted.json()['projects'][0]['project_token'] == token
            assert persisted.json()['projects'][0]['project_name'] == 'DJI Master'


def browser_history_gate() -> None:
    import subprocess
    html = HTML.read_text()
    m = re.search(r"function createPathHistory\(start='/'\)\{.*?\}\}", html)
    assert m, 'createPathHistory function not found'
    js = m.group(0) + """
const h=createPathHistory('/');
if(h.current()!=='/'||h.depth()!==1)throw new Error('bad start');
h.push('/mnt/f');h.push('/mnt/f/SOT');h.push('/mnt/f/SOT/DJI');
if(h.previous()!=='/mnt/f/SOT')throw new Error('bad previous 1');
if(h.commitUp()!=='/mnt/f/SOT')throw new Error('bad up 1');
if(h.previous()!=='/mnt/f')throw new Error('bad previous 2');
if(h.commitUp()!=='/mnt/f')throw new Error('bad up 2');
if(h.previous()!=='/')throw new Error('bad previous root');
if(h.commitUp()!=='/')throw new Error('bad root up');
if(h.depth()!==1||h.current()!=='/')throw new Error('bad final root');
"""
    subprocess.run(['node', '-e', js], check=True, capture_output=True, text=True)


def migration_gate() -> None:
    import sqlite3
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        db_path = td / 'old.sqlite'
        c = sqlite3.connect(db_path)
        c.executescript("""
        CREATE TABLE projects (
          project_token TEXT PRIMARY KEY, project_name TEXT NOT NULL,
          initial_project_name TEXT NOT NULL, created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL, status TEXT NOT NULL, current_stage TEXT NOT NULL,
          current_run_id TEXT, target_path TEXT, openclaw_session_key TEXT, notes TEXT,
          semantic_signature TEXT NOT NULL, promoted_at TEXT, deleted_at TEXT
        );
        CREATE TABLE project_sources (
          source_id TEXT PRIMARY KEY, project_token TEXT NOT NULL,
          source_fingerprint TEXT NOT NULL, current_path TEXT NOT NULL,
          operator_label TEXT, status TEXT NOT NULL, added_at TEXT NOT NULL,
          last_seen_at TEXT NOT NULL, fingerprint_evidence_json TEXT
        );
        CREATE TABLE project_targets (
          target_id TEXT PRIMARY KEY, project_token TEXT NOT NULL, target_path TEXT NOT NULL,
          label TEXT, status TEXT NOT NULL, added_at TEXT NOT NULL, promoted_at TEXT
        );
        CREATE TABLE project_runs (
          run_id TEXT PRIMARY KEY, project_token TEXT NOT NULL, started_at TEXT, ended_at TEXT,
          status TEXT NOT NULL, restart_of_run_id TEXT, checkpoint_state TEXT
        );
        CREATE TABLE project_events (
          event_id TEXT PRIMARY KEY, project_token TEXT NOT NULL, run_id TEXT,
          timestamp TEXT NOT NULL, event_type TEXT NOT NULL, actor TEXT, message TEXT, details_json TEXT
        );
        CREATE TABLE idempotency_keys (
          idempotency_key TEXT PRIMARY KEY, project_token TEXT NOT NULL,
          request_hash TEXT NOT NULL, created_at TEXT NOT NULL
        );
        """)
        c.commit(); c.close()
        mod = load_backend(db_path)
        mod.init_db()
        c = sqlite3.connect(db_path)
        cols = {r[1] for r in c.execute('PRAGMA table_info(project_sources)').fetchall()}
        c.close()
        assert {'source_type','original_locator','client_source_id','metadata_json'} <= cols

def import_backend_path(path: Path, db_path: Path, name: str):
    os.environ['SOT_PROJECT_DB'] = str(db_path)
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


def idempotency_mutation_check() -> None:
    original = BACKEND.read_text()
    mutant = original.replace(
        'if prior["request_hash"] != request_hash:',
        'if False:  # MUTATION: accept mismatched idempotency request',
        1,
    )
    assert mutant != original
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        mut_path = td / 'idem_mutant.py'
        mut_path.write_text(mutant)
        src = td / 'src'; src.mkdir(); (src/'a.txt').write_text('x')
        mod = import_backend_path(mut_path, td/'db.sqlite', 'sot_idem_mutant')
        with TestClient(mod.app) as client:
            p1 = {'project_name':'A','sources':[str(src)],'idempotency_key':'K'}
            r1 = client.post('/api/projects', json=p1, headers={'Idempotency-Key':'K'})
            assert r1.status_code == 200
            p2 = {'project_name':'B','sources':[str(src)],'idempotency_key':'K'}
            r2 = client.post('/api/projects', json=p2, headers={'Idempotency-Key':'K'})
            killed = r2.status_code != 409
            assert killed, 'idempotency conflict test did not kill the mutant'


def mkdir_mutation_check() -> None:
    original = BACKEND.read_text()
    mutant = original.replace('        target.mkdir()\n', '        pass  # MUTATION: pretend mkdir happened\n', 1)
    assert mutant != original
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        mut_path = td / 'mkdir_mutant.py'
        mut_path.write_text(mutant)
        visible = td / 'visible'; visible.mkdir()
        parent = visible / 'parent'; parent.mkdir()
        mod = import_backend_path(mut_path, td/'db.sqlite', 'sot_mkdir_mutant')
        mod.allowed_roots = lambda: [visible]
        mod.discover_mounts = lambda: [visible]
        with TestClient(mod.app) as client:
            r = client.post('/api/fs/mkdir', json={'parent_path':str(parent),'folder_name':'new-folder'})
            # The real gate requires HTTP 200 plus a real directory. The mutant must fail one or both.
            killed = r.status_code != 200 or not (parent/'new-folder').is_dir()
            assert killed, 'mkdir gate did not kill the no-op mutant'


def main() -> None:
    html_text = HTML.read_text()
    backend_text = BACKEND.read_text()
    deploy_text = DEPLOY.read_text()
    assert_static(html_text, backend_text, deploy_text)
    mutation_checks(html_text, backend_text, deploy_text)
    browser_history_gate()
    migration_gate()
    idempotency_mutation_check()
    mkdir_mutation_check()
    api_checks()
    print('PASS: v0.3.1 static, mutation, API, persistence and engine-not-ready gates')


if __name__ == '__main__':
    main()
