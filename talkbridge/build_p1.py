#!/usr/bin/env python3
"""P1 build script — single deterministic pass: bridge-turn08-base.html -> bridge-turn08-p1.html
All Package-1 changes live here. Never edit the output by hand."""
import re, sys, hashlib

base=open("bridge-turn08-base.html").read()
pre=open("bridge-turn08-pre-base.html").read()

def need(cond,msg):
    if not cond: sys.exit("BUILD ABORT: "+msg)

# 1. donor visible HTML (byte-preserved), sealed in an inert <template>
body=pre[pre.find('<body')+len('<body>'):pre.rfind('</body>')]
donor_html=re.sub(r'<script[\s\S]*?</script>','',body)
handlers=sorted(set(re.findall(r'on(?:click|input|change|keydown|submit|load|error)="([a-zA-Z_]+)\(', donor_html)))

# 2. promoter module (activation at room entry only; modules-first order; documented adaptations)
promoter=open("promoter_module.js").read().replace("__EXPOSE__", ",".join('"%s"'%h for h in handlers))
anchor="try{TBGATE.boot();}catch(e){}"
need(base.count(anchor)==1,"TBGATE anchor")
out=base.replace(anchor, anchor+"\n"+promoter)

# 3. dormant freeze lengths (UTF-16 units, matching browser string length)
jsm=re.search(r'<script id="tb-bridge-js" type="text/tb-dormant">([\s\S]*?)</script>',out)
cssm=re.search(r'<script id="tb-bridge-css" type="text/tb-dormant">([\s\S]*?)</script>',out)
need(jsm and cssm,"dormant blocks")
js16=len(jsm.group(1).encode('utf-16-le'))//2; css16=len(cssm.group(1).encode('utf-16-le'))//2
freeze='<script>window.__TB_DORMANT_JS_LEN=%d;window.__TB_DORMANT_CSS_LEN=%d;</script>'%(js16,css16)
tpl='<template id="tb-bridge-tpl">'+donor_html+'</template>\n'+freeze+'\n'
out=out.replace('<script id="tb-bridge-js"', tpl+'<script id="tb-bridge-js"',1)

# 4. retired surfaces stay dead even after activation
supp="<style id='tb-retired-suppress'>#tb-bridge-root #lobby,#tb-bridge-root #lobby-waiting,#tb-bridge-root #thankyou-page{display:none !important;}</style>"
out=out.replace('</head>', supp+'\n</head>',1)

# 5. front door: shell new-chat routes to bridge
old="""  var opts={myLang:myVal,partnerLang:peerVal,autoRead:!(ar&&!ar.checked),capability:capVal};
  closeNewChatModal(false);
  createNewSession(false,opt"""
need(out.count(old)==1,"front door anchor")
out=out.replace(old, old.replace("createNewSession(false,opt",
  "if(true){ TBROUTE.createRoom(myVal,peerVal); return; } /* bridge owns conversation in P1 */\n  createNewSession(false,opt"))

# 6. single-owner guards on shell old organs (engage after promotion via config overrides)
old2="  setSocketState('connecting');"
need(out.count(old2)==1,"shell relay anchor")
out=out.replace(old2,"  if(!TBCONFIG.get('use.shell.relay')){addDiagLog('shell relay disabled by organ gate');return;}\n"+old2)
old3="if(v==='/'||v==='..'){\n    ta.value='';autoResize();updateSendBtn();\n    openPhrasebookModal();\n    retur"
need(out.count(old3)==1,"slash PB anchor")
out=out.replace(old3,"if(v==='/'||v==='..'){\n    ta.value='';autoResize();updateSendBtn();\n    if(TBCONFIG.get('use.shell.pb')){openPhrasebookModal();}else{addDiagLog('old PB disabled by organ gate');}\n    retur")
shell_end=out.find('<template id="tb-bridge-tpl">')
m=re.search(r'function sendMessage\s*\(', out[:shell_end]); need(m,"shell sendMessage")
ins=out.find('{', m.start())+1
out=out[:ins]+"\n  if(!TBCONFIG.get('use.shell.compose')){addDiagLog('shell composer disabled by organ gate');return;}"+out[ins:]

# 7. joiner links auto-activate
out=out.replace("</body>","<script>try{TBROUTE.bootJoinCheck();}catch(e){}</script>\n</body>",1)

open("bridge-turn08-p1.html","w").write(out)
print("BUILT bridge-turn08-p1.html", len(out), "sha256:", hashlib.sha256(out.encode()).hexdigest()[:16])
