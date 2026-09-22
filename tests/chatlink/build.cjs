// Deterministic additive build. Donor applications are never edited.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const donor=fs.readFileSync(path.join(root,'chat-lab.html'),'utf8').replace(/\r\n/g,'\n');
const blob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(donor)+'\0').update(donor).digest('hex');
assert.equal(blob,'dc6d75eaa53990663c6ebc081f23b2f49a41e95c','Accepted donor changed; review before rebuilding');
let s=donor;
function replace(a,b){assert.ok(s.includes(a),'Missing patch anchor: '+a.slice(0,70));s=s.replace(a,b);}
function between(a,b,newText){const start=s.indexOf(a),end=s.indexOf(b,start);assert.ok(start>=0&&end>start);s=s.slice(0,start)+newText+s.slice(end);}
replace('<title>Chat Tabletop</title>','<title>Chatlink · Conversations</title>');
replace('</style>',fs.readFileSync(path.join(__dirname,'portal.css'),'utf8')+'\n</style>');
replace('<div id="diag-panel">',fs.readFileSync(path.join(__dirname,'portal.html'),'utf8')+'\n<div id="diag-panel">');
replace("var CHAT_BUILD='lab-keyboard-patch-20260919'","var CHAT_BUILD='chatlink-turn01-pre-base-r1'");
between('    function readRoomFromUrl(){','    function langOf(side)',"    function readRoomFromUrl(){return {id:'',label:'Chatlink',southLang:'en',northLang:'th'}}\n");
between('    function loadHist(){','\n\n    /* ================= DIAGNOSTICS',"    function loadHist(){HIST=[]}\n    function saveHist(){ /* Persistence is owned by the room-scoped portal adapter. */ }\n");
between('    function sendFrom(side,textOverride,keepMic){','    function speakIfOn(',"    function sendFrom(side,textOverride,keepMic){return portal.submit(side,textOverride,keepMic)}\n\n");
replace('        HIST.forEach(function(e){',"        var limit=portal.pageSize(panel);\n        if(HIST.length>limit){var older=document.createElement('button');older.className='cl-older';older.textContent='Load earlier messages';older.onclick=function(){portal.older(panel)};host.appendChild(older);}\n        HIST.slice(-limit).forEach(function(e){");
replace("HIST=HIST.filter(function(x){return x.id!==e.id});saveHist();renderAll()","portal.deleteMessage(e.id)");
replace('        hdr.appendChild(del);','        hdr.appendChild(del);portal.decorateMessage(e,hdr);');
replace('        changedDraft(side);\n        updateClear(side);','        changedDraft(side);\n        portal.scheduleDraft();\n        updateClear(side);');
// Native input and all programmatic edits pass through this single draft notification.
replace('    function changedDraft(side){\n        editRev', '    function changedDraft(side){\n        if(portal)portal.scheduleDraft();\n        editRev');
replace("        ['south','north'].forEach(function(panel){renderPanel(panel)});","        ['south','north'].forEach(function(panel){renderPanel(panel)});");
replace("    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();",fs.readFileSync(path.join(__dirname,'portal.js'),'utf8')+"\n    function startChatlink(){boot();portal.start().catch(function(e){document.getElementById('cl-save-state').textContent='Storage unavailable';document.getElementById('cl-error').textContent=e.message;document.getElementById('cl-error').classList.add('show');});}\n    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startChatlink);else startChatlink();");
// The accepted speech implementation is unchanged. Guard its UI entry points externally.
replace("if(!(INPUT.owner===side&&INPUT.mode==='kb'))requestInput(side,'kb');","if(portal.visible()&&!(INPUT.owner===side&&INPUT.mode==='kb'))requestInput(side,'kb');");
// No remote conversation telemetry from this local portal.
between('    function remoteLog(kind,data){','    function flushRemoteLog(){',"    function remoteLog(kind,data){}\n");
replace("window.sideAsRoom=sideAsRoom;","window.chatlink=portal;window.sideAsRoom=sideAsRoom;");
replace("toastMsg((LANG_NAMES[lang]||lang)+' dictionary: '+words.length+' words');",'/* Dictionary readiness remains in diagnostics without covering owner controls. */');
fs.writeFileSync(path.join(root,'chatlink-turn01-pre-base.html'),s);
console.log('Built chatlink-turn01-pre-base.html from accepted lab '+blob);
