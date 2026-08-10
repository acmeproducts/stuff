#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const dst = process.argv[3] || (src ? src.replace(/\.html$/i, '') + '-rename-test.html' : '');
if (!src) {
  console.error('Usage: node apply-session-manager-rename-test.js <working-session-manager.html> [output.html]');
  process.exit(2);
}
if (!fs.existsSync(src)) {
  console.error('ERROR: source file not found: ' + src);
  process.exit(2);
}

let s = fs.readFileSync(src, 'utf8');
function once(find, repl, label) {
  if (!s.includes(find)) {
    console.error('ERROR: expected anchor not found: ' + label);
    process.exit(3);
  }
  s = s.replace(find, repl);
}

once("const APP_VERSION='2.2.0'", "const APP_VERSION='2.2.1-test'", 'APP_VERSION');
s = s.replace(/v2\.2\.0/g, 'v2.2.1-test');

once(
  '<button class="btn iconBtn hidden" id="downloadSession" title="Download this transcript as Markdown">⬇</button>',
  '<button class="btn iconBtn hidden" id="downloadSession" title="Download this transcript as Markdown">⬇</button><button class="btn iconBtn hidden" id="renameProof" title="Test sessions.patch on this live connection">Rename Test</button>',
  'header download button'
);

once(
  "$('downloadSession').classList.add('hidden');updateWorkPill();return}",
  "$('downloadSession').classList.add('hidden');$('renameProof').classList.add('hidden');updateWorkPill();return}",
  'header no-session state'
);
once(
  "$('downloadSession').classList.remove('hidden');updateWorkPill()}",
  "$('downloadSession').classList.remove('hidden');$('renameProof').classList.remove('hidden');updateWorkPill()}",
  'header selected-session state'
);

const anchor = 'function beginRename(k,row){';
const proof = String.raw`
async function fetchSessionRow(k){let r=await rpc('sessions.list',{configuredAgentsOnly:true,includeDerivedTitles:true,includeLastMessage:true},30000),a=Array.isArray(r)?r:(r?.sessions||r?.items||[]);return a.map(norm).find(x=>x.key===k)||null}
function syncSessionRow(row){if(!row)return;let i=state.sessions.findIndex(x=>x.key===row.key);if(i>=0)state.sessions[i]={...state.sessions[i],...row};else state.sessions.unshift(row);if(state.current?.key===row.key)state.current={...state.current,...row};renderSessions();header()}
function renameProofModal(){let s=state.current;if(!s)return;let original=String(s.label||'').trim(),stamp=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}),testLabel=original?\`\${original} [PATCH-PROOF \${stamp}]\`:'',scopes=state.scopes.join(', ')||'(none)',reversible=!!original;$('modal').innerHTML=\`<div class="modalbg"><div class="modal" style="width:min(680px,100%)"><div class="mhead"><b>Rename datastore proof</b><span class="grow"></span><button class="btn" id="rpcClose">×</button></div><div class="mbody"><div class="notice"><b>This test does not reconnect or request different permissions.</b><br>It uses the exact WebSocket/RPC connection currently carrying chat traffic.</div><div class="field"><label>Session key</label><input class="input" readonly value="\${esc(s.key)}"></div><div class="field"><label>Current stored label</label><input class="input" readonly value="\${esc(original||'(none)')}"></div><div class="field"><label>Current granted scopes</label><input class="input" readonly value="\${esc(scopes)}"></div><div class="field"><label>Temporary test label</label><input id="rpcLabel" class="input" readonly value="\${esc(testLabel||'(test disabled: this session has no stored label)')}"></div><div id="rpcResult" class="notice" style="background:#121219;border-color:#34343d;color:var(--tx)">Ready. The test will call <code>sessions.patch</code>, then only on success call <code>sessions.list</code> and compare the returned label.</div></div><div class="mfoot"><button class="btn" id="rpcRestore" disabled>Restore original</button><button class="btn primary" id="rpcRun" \${reversible&&state.connected?'':'disabled'}>Run Patch Test</button></div></div></div>\`;let result=$('rpcResult'),run=$('rpcRun'),restore=$('rpcRestore');$('rpcClose').onclick=()=>$('modal').innerHTML='';if(!reversible){result.textContent='Choose a session that already has a stored custom label. This keeps the test safely reversible.';return}run.onclick=async()=>{run.disabled=true;restore.disabled=true;result.textContent=\`STEP 1 — sending sessions.patch on the existing connection...\\n\\nkey: \${s.key}\\nlabel: \${testLabel}\`;dbg('TEST','Rename proof patch start',{key:s.key,label:testLabel,scopes:state.scopes});try{await rpc('sessions.patch',{key:s.key,label:testLabel},15000);result.textContent='STEP 2 — sessions.patch returned OK. Reading the session back through sessions.list...';let row=await fetchSessionRow(s.key);if(!row)throw Error('sessions.list did not return the selected session after patch.');if(row.label!==testLabel)throw Error(\`Read-back mismatch. Expected "\${testLabel}" but Gateway returned "\${row.label||'(empty)'}".\`);syncSessionRow(row);result.textContent=\`PASS — datastore write verified.\\n\\nsessions.patch returned OK and a fresh sessions.list returned the exact same label:\\n\${row.label}\\n\\nNow refresh/open the official Control UI and confirm it shows this same temporary name. Then click Restore original.\`;result.style.borderColor='#285f38';result.style.background='#102319';result.style.color='#bbf7d0';restore.disabled=false;dbg('TEST','Rename proof PASS',{key:s.key,label:row.label})}catch(e){result.textContent=\`FAIL — sessions.patch was not accepted or could not be verified.\\n\\n\${e.message}\\n\\nGranted scopes on this same working chat connection:\\n\${scopes}\`;result.style.borderColor='#6d3036';result.style.background='#281417';result.style.color='#fecaca';dbg('TEST','Rename proof FAIL',{key:s.key,error:e.message,scopes:state.scopes})}};restore.onclick=async()=>{restore.disabled=true;result.textContent=\`Restoring original label...\\n\${original}\`;try{await rpc('sessions.patch',{key:s.key,label:original},15000);let row=await fetchSessionRow(s.key);if(!row)throw Error('sessions.list did not return the session after restore.');if(row.label!==original)throw Error(\`Restore mismatch. Expected "\${original}" but Gateway returned "\${row.label||'(empty)'}".\`);syncSessionRow(row);result.textContent=\`RESTORED — original label written and independently read back:\\n\${row.label}\`;result.style.borderColor='#285f38';result.style.background='#102319';result.style.color='#bbf7d0';dbg('TEST','Rename proof restored',{key:s.key,label:row.label})}catch(e){result.textContent=\`RESTORE FAILED.\\n\\n\${e.message}\`;result.style.borderColor='#6d3036';result.style.background='#281417';result.style.color='#fecaca';restore.disabled=false;dbg('TEST','Rename restore FAIL',{key:s.key,error:e.message})}}}
`;
once(anchor, proof + '\n' + anchor, 'beginRename');

once(
  "$('downloadSession').onclick=downloadTranscript;$('debugBtn').onclick=openDebug;",
  "$('downloadSession').onclick=downloadTranscript;$('renameProof').onclick=renameProofModal;$('debugBtn').onclick=openDebug;",
  'bind download/debug'
);

fs.writeFileSync(dst, s, 'utf8');
console.log('Created: ' + path.resolve(dst));
console.log('Source preserved: ' + path.resolve(src));
console.log('Test behavior: existing live connection only; no reconnect/scope request added by Rename Test.');
