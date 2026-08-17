from pathlib import Path
import json, re, subprocess, time, uuid

APP=Path('session-manager-v3.html')
SOT=Path('session-manager-sot.json')
s=APP.read_text(encoding='utf-8')


def bounds(text,name):
    m=re.search(rf'(?:(?:async\s+)?function\s+{re.escape(name)}\s*\([^)]*\)\s*\{{)',text)
    if not m: raise SystemExit('function missing: '+name)
    i=m.start(); j=m.end(); depth=1; quote=None; esc=False
    while j<len(text) and depth:
        c=text[j]
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
        else:
            if c in "'\"`": quote=c
            elif c=='{': depth+=1
            elif c=='}': depth-=1
        j+=1
    if depth: raise SystemExit('unbalanced '+name)
    return i,j


def replace_fn(name,new):
    global s
    i,j=bounds(s,name); s=s[:i]+new+s[j:]

# Recover the last known-good project organization from Git history.
raw=subprocess.check_output(['git','show','86fe3a910c7727498d5392419db321a479141138:session-manager-sot.json'],text=True)
good=json.loads(raw)
snaps=[e for e in good.get('events',[]) if e.get('type')=='projects.snapshot' and e.get('payload',{}).get('scope')=='wss://oc-ref.fell-dojo.ts.net']
if not snaps: raise SystemExit('good project snapshot not found')
recovery=max(snaps,key=lambda e:e.get('ts',0))
state=recovery['payload']['state']
state['missing']={}
state['recovered']=state.get('recovered') or {}

# Upgrade current SOT while preserving non-project state. The old destructive project snapshot is replaced.
cur=json.loads(SOT.read_text(encoding='utf-8')) if SOT.exists() else {'schema':'session-manager-sot','version':1,'events':[]}
events=[]
for e in cur.get('events',[]):
    if e.get('type')=='projects.snapshot' and e.get('payload',{}).get('scope')=='wss://oc-ref.fell-dojo.ts.net':
        continue
    events.append(e)
now=int(time.time()*1000)
rec_event={
    'id':str(uuid.uuid4()),'deviceId':'recovery-v2912','ts':now,
    'type':'projects.snapshot','payload':{'scope':'wss://oc-ref.fell-dojo.ts.net','state':state}
}
marker={
    'id':str(uuid.uuid4()),'deviceId':'recovery-v2912','ts':now+1,
    'type':'recovery.marker','payload':{
        'scope':'wss://oc-ref.fell-dojo.ts.net','release':'2.9.12','clearMissing':True,
        'sourceCommit':'86fe3a910c7727498d5392419db321a479141138',
        'reason':'Restore last intact project organization and fence stale whole-state snapshots.'
    }
}
events.extend([rec_event,marker])
SOT.write_text(json.dumps({'schema':'session-manager-sot','version':2,'events':events},indent=2)+'\n',encoding='utf-8')

# Versioning.
s=re.sub(r"const BUILD_VERSION='[^']+';","const BUILD_VERSION='2.9.12';",s,count=1)
s=s.replace("document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.8');","document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.12');")
s=re.sub(r'<span class="version">v[0-9.]+</span>','<span class="version">v2.9.12</span>',s,count=1)
s=s.replace("const APP_VERSION='2.3.0', PV=4", "const SOT_VERSION=2;\nconst APP_VERSION='2.3.0', PV=4",1)

# Project mutations become fine-grained SOT events. Whole snapshots remain accepted only as migration/recovery baselines.
replace_fn('compactSotEvents',r'''function compactSotEvents(events){let singles={},styles={},projectEvents={},order=[];for(let e of Array.isArray(events)?events:[]){if(!e||!e.id||!e.type)continue;let p=e.payload||{},key;if(e.type==='tab.style')key='tab.style|'+(p.scope||'')+'|'+(p.key||'');else if(e.type==='trash.snapshot')key=e.type+'|'+(p.scope||'');else if(e.type==='settings.snapshot'||e.type==='themes.snapshot')key=e.type;else if(e.type==='projects.snapshot')key=e.type+'|'+(p.scope||'');else if(['project.upsert','project.delete'].includes(e.type))key=e.type+'|'+(p.scope||'')+'|'+(p.project?.id||p.projectId||'');else if(e.type==='session.assign')key=e.type+'|'+(p.scope||'')+'|'+(p.key||'');else if(e.type==='project.order')key=e.type+'|'+(p.scope||'')+'|'+(p.projectId||'');else key='other|'+e.id;if(!(key in singles))order.push(key);singles[key]=e}return order.map(k=>singles[k])}''')

replace_fn('emptySot',"function emptySot(){return{schema:'session-manager-sot',version:SOT_VERSION,events:[]}}")
replace_fn('normalizeSot',r'''function normalizeSot(doc){if(!doc)return emptySot();if(doc.schema!=='session-manager-sot'||![1,2].includes(Number(doc.version))||!Array.isArray(doc.events))throw Error('GitHub SOT has an unsupported schema');let seen=new Set(),events=[];for(let e of doc.events)if(e&&e.id&&e.type&&!seen.has(e.id)){seen.add(e.id);events.push(e)}return{schema:'session-manager-sot',version:SOT_VERSION,events}}''')

replace_fn('saveProjectState',r'''function saveProjectState(){persistProjectStateLocal()}''')

# Emit explicit organization operations.
replace_fn('addProject',r'''function addProject(){let name=prompt('Project name','New Project');if(name===null)return;name=name.trim();if(!name){toast('Project name cannot be empty','err');return}let p={id:'p-'+uid(),name,sessions:[],activeSession:''};projects().push(p);state.projectState.activeProjectId=p.id;saveProjectState();sotEmit('project.upsert',{scope:projectScope(),project:JSON.parse(JSON.stringify(p))});renderSessions();renderProjectTabs();header();toast('Project created','ok')}''')
replace_fn('renameProject',r'''function renameProject(id){let p=projects().find(x=>x.id===id);if(!p)return;let n=prompt('Rename project',p.name);if(n===null)return;n=n.trim();if(!n)return;p.name=n;saveProjectState();sotEmit('project.upsert',{scope:projectScope(),project:JSON.parse(JSON.stringify(p))});renderSessions();header()}''')
replace_fn('createProjectNamed',r'''function createProjectNamed(n){n=String(n||'').trim();if(!n)throw Error('Project name cannot be empty');let x=projectNameExists(n);if(x)return x;let p={id:'p-'+uid(),name:n,sessions:[],activeSession:''};projects().push(p);saveProjectState();sotEmit('project.upsert',{scope:projectScope(),project:JSON.parse(JSON.stringify(p))});return p}''')

# Assignment event helper inserted before contextMove.
needle='function contextMove(k,target,origin,originSession){'
helper="function emitSessionAssignment(k,targetId){let p=targetId===UNASSIGNED_ID?null:projects().find(x=>x.id===targetId);sotEmit('session.assign',{scope:projectScope(),key:String(k),projectId:p?.id||UNASSIGNED_ID})}\n"
if helper not in s:
    s=s.replace(needle,helper+needle,1)

# Add event emission after organization mutations.
for old,new in [
    ("saveProjectState();restoreOrigin(origin,next);toast(target===UNASSIGNED_ID?'Moved to Unassigned':'Session reassigned','ok')", "saveProjectState();emitSessionAssignment(k,target);restoreOrigin(origin,next);toast(target===UNASSIGNED_ID?'Moved to Unassigned':'Session reassigned','ok')"),
    ("saveProjectState();renderSessions();renderProjectTabs();header();if(next)select(next)", "saveProjectState();emitSessionAssignment(k,targetId);renderSessions();renderProjectTabs();header();if(next)select(next)"),
    ("setActiveTabOrder(p,a);saveProjectState();renderProjectTabs()", "setActiveTabOrder(p,a);saveProjectState();sotEmit('project.order',{scope:projectScope(),projectId:p.id,order:[...a]});renderProjectTabs()")
]:
    s=s.replace(old,new)

# Deleting a project is explicit; stale peers cannot recreate it merely by publishing an old snapshot.
i,j=bounds(s,'deleteProject')
fn=s[i:j]
fn=fn.replace("saveProjectState();let k=state.projectState.unassignedActive", "saveProjectState();sotEmit('project.delete',{scope:projectScope(),projectId:id});for(let mk of moved)emitSessionAssignment(mk,UNASSIGNED_ID);let k=state.projectState.unassignedActive")
s=s[:i]+fn+s[j:]

# Missing is now observational. Never remove a session from its project because a gateway listing omitted it.
replace_fn('reconcileProjects',r'''function reconcileProjects(previous=[]){if(!state.projectState)state.projectState=loadProjectState();let ps=state.projectState,now=new Map(state.sessions.map(x=>[x.key,x])),prev=new Map((Array.isArray(previous)?previous:[]).map(x=>[x.key,x])),trash=trashKeySet(),changed=false;if(!ps.missingCandidates)ps.missingCandidates={};for(let row of state.sessions){let old=ps.known[row.key]||{},label=name(row);ps.known[row.key]={label,lastSeen:Date.now(),sessionId:row.sessionId||old.sessionId||null,agentId:row.agentId||old.agentId||null};delete ps.missingCandidates[row.key];if(ps.missing[row.key]){ps.recovered[row.key]={label:ps.missing[row.key].label||label,previousProjectId:ps.missing[row.key].previousProjectId||null,previousProjectName:ps.missing[row.key].previousProjectName||'',missingSince:ps.missing[row.key].missingSince||null,recoveredAt:Date.now(),reason:'recovered'};delete ps.missing[row.key];changed=true}}let candidates=new Set([...Object.keys(ps.known),...ps.projects.flatMap(p=>p.sessions)]),toMiss=[];for(let k of candidates){if(now.has(k)||trash.has(k))continue;toMiss.push(k)}let knownCount=Math.max(1,candidates.size);if(toMiss.length>5&&toMiss.length/knownCount>0.3){dbg('WARN','Session list looks implausible; missing reclassification skipped',{returned:now.size,wouldMark:toMiss.length,known:knownCount});toast(`Session list from gateway looks incomplete (${now.size} returned, ${toMiss.length} absent) — project organization preserved`,'err');toMiss=[]}let observed=new Set(toMiss);for(let k of Object.keys(ps.missingCandidates))if(!observed.has(k))delete ps.missingCandidates[k];for(let k of toMiss){let old=ps.known[k]||{},prior=prev.get(k),p=projects().find(x=>x.sessions.includes(k)),c=ps.missingCandidates[k]||{count:0,firstSeen:Date.now()};c.count=(Number(c.count)||0)+1;c.lastSeen=Date.now();c.label=old.label||name(prior)||k;c.previousProjectId=p?.id||null;c.previousProjectName=p?.name||'';ps.missingCandidates[k]=c;dbg('WARN','Missing candidate awaiting confirmation',{key:k,count:c.count,previousProjectName:c.previousProjectName});if(c.count>=3&&!ps.missing[k]){ps.missing[k]={label:c.label,previousProjectId:c.previousProjectId,previousProjectName:c.previousProjectName,missingSince:c.firstSeen,lastSeen:old.lastSeen||null,sessionId:old.sessionId||prior?.sessionId||null,agentId:old.agentId||prior?.agentId||null};changed=true}}for(let k of trash){if(ps.missing[k]){delete ps.missing[k];changed=true}delete ps.missingCandidates[k]}if(state.missingInspectKey&&!ps.missing[state.missingInspectKey])clearMissingInspector();persistProjectStateLocal()}''')

# normalizeProjectState must retain the observational confirmation map.
i,j=bounds(s,'normalizeProjectState')
fn=s[i:j]
fn=fn.replace("recovered:normMap(x.recovered),tabStyles:normMap(x.tabStyles)","recovered:normMap(x.recovered),missingCandidates:normMap(x.missingCandidates),tabStyles:normMap(x.tabStyles)")
s=s[:i]+fn+s[j:]

# Apply SOT v2 operations deterministically. Legacy snapshots can seed only; they cannot replace richer local state.
replace_fn('applySotEvents',r'''function applySotEvents(events){state.sotApplying=true;let styled=new Set();try{if(!state.projectState)state.projectState=loadProjectState();for(let e of events){let p=e?.payload||{};if(e.type==='settings.snapshot'){if(p.clientType)state.settings.clientType=p.clientType==='botschat'?'botschat':'standard';if(p.appearance)state.settings.appearance=normalizeAppearance(p.appearance)}else if(e.type==='projects.snapshot'){if(p.scope===projectScope()&&p.state){let incoming=normalizeProjectState(p.state),local=normalizeProjectState(state.projectState),localMembers=local.projects.reduce((n,x)=>n+x.sessions.length,0),incomingMembers=incoming.projects.reduce((n,x)=>n+x.sessions.length,0);if(local.projects.length<=1&&localMembers===0){state.projectState=incoming}else if(incoming.projects.length>=local.projects.length&&incomingMembers>=localMembers){state.projectState=incoming}else dbg('WARN','Legacy project snapshot dropped',{incomingProjects:incoming.projects.length,localProjects:local.projects.length,incomingMembers,localMembers})}}else if(e.type==='project.upsert'&&p.scope===projectScope()&&p.project?.id){let q=state.projectState.projects.find(x=>x.id===p.project.id),inc={id:String(p.project.id),name:String(p.project.name||'Project'),sessions:Array.isArray(p.project.sessions)?[...new Set(p.project.sessions.map(String))]:[],activeSession:String(p.project.activeSession||'')};if(q){q.name=inc.name;if(!q.sessions.length&&inc.sessions.length)q.sessions=inc.sessions;if(!q.activeSession)q.activeSession=inc.activeSession}else state.projectState.projects.push(inc)}else if(e.type==='project.delete'&&p.scope===projectScope()&&p.projectId){state.projectState.projects=state.projectState.projects.filter(x=>x.id!==String(p.projectId));if(!state.projectState.projects.length)state.projectState.projects=[{id:'general',name:'General',sessions:[],activeSession:''}]}else if(e.type==='session.assign'&&p.scope===projectScope()&&p.key){let k=String(p.key);for(let q of state.projectState.projects){q.sessions=q.sessions.filter(x=>x!==k);if(q.activeSession===k)q.activeSession=q.sessions[0]||''}state.projectState.unassignedOrder=(state.projectState.unassignedOrder||[]).filter(x=>x!==k);if(p.projectId&&p.projectId!==UNASSIGNED_ID){let q=state.projectState.projects.find(x=>x.id===p.projectId);if(q&&!q.sessions.includes(k))q.sessions.unshift(k)}else state.projectState.unassignedOrder.unshift(k);delete state.projectState.missing[k];delete state.projectState.missingCandidates?.[k]}else if(e.type==='project.order'&&p.scope===projectScope()&&p.projectId&&Array.isArray(p.order)){if(p.projectId===UNASSIGNED_ID)state.projectState.unassignedOrder=[...new Set(p.order.map(String))];else{let q=state.projectState.projects.find(x=>x.id===p.projectId);if(q){let own=new Set(q.sessions),a=p.order.map(String).filter(k=>own.has(k)),rest=q.sessions.filter(k=>!a.includes(k));q.sessions=[...a,...rest]}}}else if(e.type==='recovery.marker'&&p.scope===projectScope()&&p.clearMissing){state.projectState.missing={};state.projectState.missingCandidates={}}else if(e.type==='tab.style'){if(p.scope===projectScope()&&p.key){if(!state.projectState.tabStyles)state.projectState.tabStyles={};let k=String(p.key),c=normalizeTabStyle(p.style||{});if(p.style&&(c.bg||c.fg||c.size))state.projectState.tabStyles[k]=c;else delete state.projectState.tabStyles[k];styled.add(k)}}else if(e.type==='themes.snapshot'){if(Array.isArray(p.themes))localStorage.setItem(K.themes,JSON.stringify({schema:'session-manager-theme-library',version:1,themes:p.themes}))}else if(e.type==='trash.snapshot'){if(p.scope===trashScope()&&p.bucket&&typeof p.bucket==='object'){let all=trashStore();all[trashScope()]=p.bucket;localStorage.setItem(K.trash,JSON.stringify(all))}}}localStorage.setItem(K.settings,JSON.stringify(state.settings));persistProjectStateLocal();applyAppearance();applyClientType();renderSessions();renderProjectTabs();header()}finally{state.sotApplying=false}}''')

# Diagnostics clearly expose the new non-destructive synchronization model.
i,j=bounds(s,'debugEnvironment')
fn=s[i:j]
fn=fn.replace("['SOT queued changes',String(sotOutbox().length)]", "['Project sync mode','SOT v2 fine-grained / non-destructive'],['SOT queued changes',String(sotOutbox().length)]")
s=s[:i]+fn+s[j:]

# UI version in the second script.
s=s.replace("document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.8');bindMobile();","document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.12');bindMobile();")
APP.write_text(s,encoding='utf-8')
print('session-manager-v3.html patched to v2.9.12; SOT recovered and upgraded to v2')
