from pathlib import Path
import copy
import json
import re
import subprocess

APP = Path('session-manager-v3.html')
SOT = Path('session-manager-sot.json')
SOURCE_COMMIT = '6a0085184bc88d436d13690c602439b82ea8abb2'
SCOPE = 'wss://oc-ref.fell-dojo.ts.net'

s = APP.read_text(encoding='utf-8')


def bounds(text, name):
    m = re.search(rf'(?:(?:async\s+)?function\s+{re.escape(name)}\s*\([^)]*\)\s*\{{)', text)
    if not m:
        raise SystemExit('function missing: ' + name)
    i = m.start()
    j = m.end()
    depth = 1
    quote = None
    esc = False
    while j < len(text) and depth:
        c = text[j]
        if quote:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == quote:
                quote = None
        else:
            if c in "'\"`":
                quote = c
            elif c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
        j += 1
    if depth:
        raise SystemExit('unbalanced ' + name)
    return i, j


def replace_fn(name, new):
    global s
    i, j = bounds(s, name)
    s = s[:i] + new + s[j:]


# v2.9.14 fences stale v2.9.13 writers by advancing the SOT document schema to v3.
s = re.sub(r"const SOT_VERSION=\d+;", "const SOT_VERSION=3;", s, count=1)
s = re.sub(r"const BUILD_VERSION='[^']+';", "const BUILD_VERSION='2.9.14';", s, count=1)
s = re.sub(r'<span class="version">v[0-9.]+</span>', '<span class="version">v2.9.14</span>', s, count=1)
s = re.sub(
    r"document\.querySelectorAll\('\.version'\)\.forEach\(n=>n\.textContent='v[0-9.]+'\);",
    "document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.14');",
    s,
    count=1,
)

# Compact deterministically by entity and event timestamp. Upsert/delete share one entity key.
replace_fn('compactSotEvents', r'''function compactSotEvents(events){let best=new Map();for(let e of Array.isArray(events)?events:[]){if(!e||!e.id||!e.type)continue;let p=e.payload||{},key;if(e.type==='tab.style')key='tab.style|'+(p.scope||'')+'|'+(p.key||'');else if(e.type==='trash.snapshot')key=e.type+'|'+(p.scope||'');else if(e.type==='settings.snapshot'||e.type==='themes.snapshot')key=e.type;else if(e.type==='projects.snapshot')key=e.type+'|'+(p.scope||'');else if(['project.upsert','project.delete'].includes(e.type))key='project.entity|'+(p.scope||'')+'|'+(p.project?.id||p.projectId||'');else if(e.type==='session.assign')key=e.type+'|'+(p.scope||'')+'|'+(p.key||'');else if(e.type==='project.order')key=e.type+'|'+(p.scope||'')+'|'+(p.projectId||'');else if(e.type==='recovery.marker')key=e.type+'|'+(p.scope||'')+'|'+e.id;else key='other|'+e.id;let prev=best.get(key),newer=!prev||Number(e.ts||0)>Number(prev.ts||0)||(Number(e.ts||0)===Number(prev.ts||0)&&String(e.id)>String(prev.id));if(newer)best.set(key,e)}return[...best.values()].sort((a,b)=>Number(a.ts||0)-Number(b.ts||0)||String(a.id).localeCompare(String(b.id))) }''')

# v2.9.14 reads older documents for migration but always normalizes/writes v3.
replace_fn('normalizeSot', r'''function normalizeSot(doc){if(!doc)return emptySot();if(doc.schema!=='session-manager-sot'||![1,2,3].includes(Number(doc.version))||!Array.isArray(doc.events))throw Error('GitHub SOT has an unsupported schema');let seen=new Set(),events=[];for(let e of doc.events)if(e&&e.id&&e.type&&!seen.has(e.id)){seen.add(e.id);events.push(e)}return{schema:'session-manager-sot',version:SOT_VERSION,events:compactSotEvents(events)}}''')

# Once a canonical project baseline exists remotely, a browser's queued legacy whole-project
# snapshot is never allowed to replace it. Normal project changes use granular v2/v3 events.
replace_fn('mergeSotEvents', r'''function mergeSotEvents(remote,outbox){let doc=normalizeSot(remote||emptySot()),seen=new Set(doc.events.map(e=>e.id)),baselineScopes=new Set(doc.events.filter(e=>e.type==='projects.snapshot').map(e=>String(e.payload?.scope||''))),dropped=0;for(let e of Array.isArray(outbox)?outbox:[]){if(!e?.id||seen.has(e.id))continue;if(e.type==='projects.snapshot'&&baselineScopes.has(String(e.payload?.scope||''))){dropped++;continue}seen.add(e.id);doc.events.push(e)}if(dropped)dbg('WARN','Legacy project snapshot dropped',{source:'local outbox',count:dropped});doc.events=compactSotEvents(doc.events);return doc}''')

# A recovery marker is a migration action, not a perpetual command. Apply each marker once per
# browser origin so normal Missing confirmation counts are not reset by every SOT receive.
old_marker = "else if(e.type==='recovery.marker'&&p.scope===projectScope()&&p.clearMissing){state.projectState.missing={};state.projectState.missingCandidates={}}"
new_marker = "else if(e.type==='recovery.marker'&&p.scope===projectScope()&&p.clearMissing){let mk='oc_session_manager_recovery_'+String(e.id||'');let seenMarker=false;try{seenMarker=localStorage.getItem(mk)==='1'}catch{}if(!seenMarker){state.projectState.missing={};state.projectState.missingCandidates={};try{localStorage.setItem(mk,'1')}catch{}dbg('SOT','Recovery marker applied once',{id:e.id})}}"
if old_marker not in s:
    raise SystemExit('recovery marker branch not found')
s = s.replace(old_marker, new_marker, 1)

s = s.replace("['Project sync mode','SOT v2 cross-origin / fine-grained / non-destructive']", "['Project sync mode','SOT v3 cross-origin / fine-grained / non-destructive']", 1)

# Add a release comment without disturbing the owner-verified APP_VERSION/Gateway handshake.
anchor = "// Gateway identity/signature/connect implementation remains the owner-verified v2.1 baseline used by v2.3.0."
release_comment = "// v2.9.14 — canonical project baseline repair, SOT v3 stale-writer fence, one-shot recovery marker."
if release_comment not in s:
    if anchor not in s:
        raise SystemExit('version comment anchor missing')
    s = s.replace(anchor, anchor + '\n' + release_comment, 1)

APP.write_text(s, encoding='utf-8')

# Restore the canonical rich project baseline from the already validated v2.9.12 recovery commit.
source_text = subprocess.check_output(
    ['git', 'show', f'{SOURCE_COMMIT}:session-manager-sot.json'], text=True
)
source_doc = json.loads(source_text)
rich = None
for event in source_doc.get('events', []):
    if (
        event.get('type') == 'projects.snapshot'
        and event.get('payload', {}).get('scope') == SCOPE
        and event.get('deviceId') == 'recovery-v2912'
    ):
        rich = copy.deepcopy(event['payload']['state'])
        break
if rich is None:
    raise SystemExit('validated v2.9.12 recovery snapshot not found')

expected_names = {
    'General', 'arcive', 'codex/cc', 'investigate dbl', 'oc troubleshoot',
    'meditate', 'session manager', 'SOT - Storage', 'scrape', 'dev/code stream'
}
actual_names = {p.get('name') for p in rich.get('projects', [])}
if actual_names != expected_names:
    raise SystemExit(f'unexpected recovery project set: {sorted(actual_names)}')
member_count = sum(len(p.get('sessions', [])) for p in rich.get('projects', []))
if member_count != 64:
    raise SystemExit(f'unexpected recovery membership count: {member_count}')

# Missing is observational/local metadata. Do not resurrect historical Missing flags in the baseline.
rich['missing'] = {}
rich['missingCandidates'] = {}
rich['recovered'] = {}

current = json.loads(SOT.read_text(encoding='utf-8'))
kept = []
project_types = {'projects.snapshot', 'project.upsert', 'project.delete', 'session.assign', 'project.order', 'recovery.marker'}
for event in current.get('events', []):
    payload = event.get('payload') or {}
    if event.get('type') in project_types and payload.get('scope') == SCOPE:
        continue
    kept.append(event)

max_ts = max([int(e.get('ts') or 0) for e in kept] + [0])
base_ts = max_ts + 1
kept.append({
    'id': 'recovery-v2914-project-baseline',
    'deviceId': 'recovery-v2914',
    'ts': base_ts,
    'type': 'projects.snapshot',
    'payload': {'scope': SCOPE, 'state': rich},
})
kept.append({
    'id': 'recovery-v2914-marker',
    'deviceId': 'recovery-v2914',
    'ts': base_ts + 1,
    'type': 'recovery.marker',
    'payload': {'scope': SCOPE, 'clearMissing': True},
})

current['schema'] = 'session-manager-sot'
current['version'] = 3
current['events'] = sorted(kept, key=lambda e: (int(e.get('ts') or 0), str(e.get('id') or '')))
SOT.write_text(json.dumps(current, indent=2) + '\n', encoding='utf-8')
