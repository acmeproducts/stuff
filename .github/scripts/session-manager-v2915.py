from pathlib import Path
import re

APP=Path('session-manager-v3.html')
s=APP.read_text(encoding='utf-8')


def bounds(text,name):
    m=re.search(rf'(?:(?:async\s+)?function\s+{re.escape(name)}\s*\([^)]*\)\s*\{{)',text)
    if not m:
        raise SystemExit('function missing: '+name)
    i=m.start(); j=m.end(); depth=1; quote=None; esc=False
    while j<len(text) and depth:
        c=text[j]
        if quote:
            if esc:
                esc=False
            elif c=='\\':
                esc=True
            elif c==quote:
                quote=None
        else:
            if c in "'\"`":
                quote=c
            elif c=='{':
                depth+=1
            elif c=='}':
                depth-=1
        j+=1
    if depth:
        raise SystemExit('unbalanced '+name)
    return i,j


def replace_fn(name,new):
    global s
    i,j=bounds(s,name)
    s=s[:i]+new+s[j:]

# Version only; keep the owner-verified gateway APP_VERSION untouched.
s=re.sub(r"const BUILD_VERSION='[^']+';","const BUILD_VERSION='2.9.15';",s,count=1)
s=re.sub(r'<span class="version">v[0-9.]+</span>','<span class="version">v2.9.15</span>',s,count=1)
s=re.sub(r"document\.querySelectorAll\('\.version'\)\.forEach\(n=>n\.textContent='v[0-9.]+'\);","document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.15');",s,count=1)
if '// v2.9.15 — preserve local active project/session navigation across SOT receives.' not in s:
    s=s.replace('// v2.9.14 — canonical project baseline repair, SOT v3 stale-writer fence, one-shot recovery marker.','// v2.9.14 — canonical project baseline repair, SOT v3 stale-writer fence, one-shot recovery marker.\n// v2.9.15 — preserve local active project/session navigation across SOT receives.',1)

# SOT owns project STRUCTURE, not UI navigation. Previously every receive re-applied the
# canonical projects.snapshot including activeProjectId="__unassigned__", which caused an
# already-open project to jump to Unassigned whenever SOT synchronized. Preserve each
# browser origin's active project and active tab while still accepting structural changes.
replace_fn('applySotEvents',r'''function applySotEvents(events){state.sotApplying=true;let styled=new Set();try{if(!state.projectState)state.projectState=loadProjectState();for(let e of events){let p=e?.payload||{};if(e.type==='settings.snapshot'){if(p.clientType)state.settings.clientType=p.clientType==='botschat'?'botschat':'standard';if(p.appearance)state.settings.appearance=normalizeAppearance(p.appearance)}else if(e.type==='projects.snapshot'){if(p.scope===projectScope()&&p.state){let incoming=normalizeProjectState(p.state),local=normalizeProjectState(state.projectState),localMembers=local.projects.reduce((n,x)=>n+x.sessions.length,0),incomingMembers=incoming.projects.reduce((n,x)=>n+x.sessions.length,0),accept=local.projects.length<=1&&localMembers===0||incoming.projects.length>=local.projects.length&&incomingMembers>=localMembers;if(accept){let nav={activeProjectId:local.activeProjectId,unassignedActive:local.unassignedActive,activeSessions:Object.fromEntries(local.projects.map(q=>[q.id,q.activeSession||'']))};state.projectState=incoming;let ids=new Set(state.projectState.projects.map(q=>q.id)),wanted=nav.activeProjectId;if(wanted===UNASSIGNED_ID||ids.has(wanted))state.projectState.activeProjectId=wanted;else if(ids.has('general'))state.projectState.activeProjectId='general';else state.projectState.activeProjectId=state.projectState.projects[0]?.id||UNASSIGNED_ID;let un=new Set(unassignedSessionKeys());state.projectState.unassignedActive=nav.unassignedActive&&un.has(nav.unassignedActive)?nav.unassignedActive:'';for(let q of state.projectState.projects){let a=nav.activeSessions[q.id];q.activeSession=a&&q.sessions.includes(a)?a:''}dbg('SOT','Project structure applied; local navigation preserved',{activeProjectId:state.projectState.activeProjectId,incomingActiveProjectId:incoming.activeProjectId,projects:state.projectState.projects.length,members:incomingMembers})}else dbg('WARN','Legacy project snapshot dropped',{incomingProjects:incoming.projects.length,localProjects:local.projects.length,incomingMembers,localMembers})}}else if(e.type==='project.upsert'&&p.scope===projectScope()&&p.project?.id){let q=state.projectState.projects.find(x=>x.id===p.project.id),inc={id:String(p.project.id),name:String(p.project.name||'Project'),sessions:Array.isArray(p.project.sessions)?[...new Set(p.project.sessions.map(String))]:[],activeSession:''};if(q){q.name=inc.name;if(!q.sessions.length&&inc.sessions.length)q.sessions=inc.sessions}else state.projectState.projects.push(inc)}else if(e.type==='project.delete'&&p.scope===projectScope()&&p.projectId){let deleted=String(p.projectId),wasActive=state.projectState.activeProjectId===deleted;state.projectState.projects=state.projectState.projects.filter(x=>x.id!==deleted);if(!state.projectState.projects.length)state.projectState.projects=[{id:'general',name:'General',sessions:[],activeSession:''}];if(wasActive)state.projectState.activeProjectId=state.projectState.projects[0]?.id||UNASSIGNED_ID}else if(e.type==='session.assign'&&p.scope===projectScope()&&p.key){let k=String(p.key);for(let q of state.projectState.projects){q.sessions=q.sessions.filter(x=>x!==k);if(q.activeSession===k)q.activeSession=q.sessions[0]||''}state.projectState.unassignedOrder=(state.projectState.unassignedOrder||[]).filter(x=>x!==k);if(p.projectId&&p.projectId!==UNASSIGNED_ID){let q=state.projectState.projects.find(x=>x.id===p.projectId);if(q&&!q.sessions.includes(k))q.sessions.unshift(k)}else state.projectState.unassignedOrder.unshift(k);delete state.projectState.missing[k];delete state.projectState.missingCandidates?.[k]}else if(e.type==='project.order'&&p.scope===projectScope()&&p.projectId&&Array.isArray(p.order)){if(p.projectId===UNASSIGNED_ID)state.projectState.unassignedOrder=[...new Set(p.order.map(String))];else{let q=state.projectState.projects.find(x=>x.id===p.projectId);if(q){let own=new Set(q.sessions),a=p.order.map(String).filter(k=>own.has(k)),rest=q.sessions.filter(k=>!a.includes(k));q.sessions=[...a,...rest]}}}else if(e.type==='recovery.marker'&&p.scope===projectScope()&&p.clearMissing){let mk='oc_session_manager_recovery_'+String(e.id||'');let seenMarker=false;try{seenMarker=localStorage.getItem(mk)==='1'}catch{}if(!seenMarker){state.projectState.missing={};state.projectState.missingCandidates={};try{localStorage.setItem(mk,'1')}catch{}dbg('SOT','Recovery marker applied once',{id:e.id})}}else if(e.type==='tab.style'){if(p.scope===projectScope()&&p.key){if(!state.projectState.tabStyles)state.projectState.tabStyles={};let k=String(p.key),c=normalizeTabStyle(p.style||{});if(p.style&&(c.bg||c.fg||c.size))state.projectState.tabStyles[k]=c;else delete state.projectState.tabStyles[k];styled.add(k)}}else if(e.type==='themes.snapshot'){if(Array.isArray(p.themes))localStorage.setItem(K.themes,JSON.stringify({schema:'session-manager-theme-library',version:1,themes:p.themes}))}else if(e.type==='trash.snapshot'){if(p.scope===trashScope()&&p.bucket&&typeof p.bucket==='object'){let all=trashStore();all[trashScope()]=p.bucket;localStorage.setItem(K.trash,JSON.stringify(all))}}}localStorage.setItem(K.settings,JSON.stringify(state.settings));persistProjectStateLocal();applyAppearance();applyClientType();renderSessions();renderProjectTabs();header()}finally{state.sotApplying=false}}''')

# The sidebar itself must remain a pure layout control; assert that it never mutates project navigation.
i,j=bounds(s,'setSidebar')
sidebar=s[i:j]
if 'activeProjectId' in sidebar or 'UNASSIGNED_ID' in sidebar:
    raise SystemExit('setSidebar unexpectedly mutates project navigation')

if "const SOT_VERSION=3;" not in s:
    raise SystemExit('unexpected SOT version; v2.9.15 must retain SOT v3')
if "const APP_VERSION='2.3.0'" not in s:
    raise SystemExit('owner-verified gateway APP_VERSION changed unexpectedly')

APP.write_text(s,encoding='utf-8')
