from pathlib import Path
import re

APP=Path('session-manager-v3.html')
s=APP.read_text(encoding='utf-8')

def bounds(text,name):
    m=re.search(rf'(?:(?:async\s+)?function\s+{re.escape(name)}\s*\()',text)
    if not m: raise SystemExit('function missing: '+name)
    i=m.start(); p=text.find('(',m.start()); depth=0; quote=None; esc=False; j=p
    while j<len(text):
        c=text[j]
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
        else:
            if c in "'\"`": quote=c
            elif c=='(': depth+=1
            elif c==')':
                depth-=1
                if depth==0: j+=1; break
        j+=1
    while j<len(text) and text[j].isspace(): j+=1
    if j>=len(text) or text[j]!='{': raise SystemExit('function body missing: '+name)
    depth=1; j+=1; quote=None; esc=False
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
    return i,j

def replace_fn(name,new):
    global s
    i,j=bounds(s,name); s=s[:i]+new+s[j:]

s=re.sub(r"const BUILD_VERSION='[^']+';","const BUILD_VERSION='2.9.17';",s,count=1)
s=re.sub(r'<span class="version">v[0-9.]+</span>','<span class="version">v2.9.17</span>',s,count=1)
s=re.sub(r"document\.querySelectorAll\('\.version'\)\.forEach\(n=>n\.textContent='v[0-9.]+'\);","document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.17');",s,count=1)
marker='// v2.9.16 — reorderable/customizable project cards + project/global omnisearch.\n'
if marker not in s: raise SystemExit('v2.9.16 marker missing')
if '// v2.9.17 — reliable native project-card dragover/drop across browsers.\n' not in s:
    s=s.replace(marker,marker+'// v2.9.17 — reliable native project-card dragover/drop across browsers.\n',1)

replace_fn('setupProjectDrop',r'''function setupProjectDrop(row,id){row.__sessionDrop=k=>moveSessionToProject(k,id);row.ondragover=e=>{let t=e.dataTransfer?.types;if(!t)return;let types=[...t],projectDrag=types.includes('text/project-id'),sessionDrag=types.includes('text/session-key');if(projectDrag&&id!==UNASSIGNED_ID){e.preventDefault();e.dataTransfer.dropEffect='move';row.classList.remove('projectOrderBefore','projectOrderAfter');let r=row.getBoundingClientRect(),after=e.clientY>=r.top+r.height/2;row.classList.add(after?'projectOrderAfter':'projectOrderBefore');row.dataset.projectDropAfter=after?'1':'0';return}if(!sessionDrag)return;e.preventDefault();e.dataTransfer.dropEffect='move';row.classList.add('dragOver')};row.ondragleave=()=>row.classList.remove('dragOver','projectOrderBefore','projectOrderAfter');row.ondrop=e=>{let types=[...(e.dataTransfer?.types||[])];if(types.includes('text/project-id')&&id!==UNASSIGNED_ID){e.preventDefault();let src=e.dataTransfer.getData('text/project-id'),after=row.dataset.projectDropAfter==='1';row.classList.remove('projectOrderBefore','projectOrderAfter');delete row.dataset.projectDropAfter;if(src)reorderProjectCard(src,id,after);return}if(!types.includes('text/session-key'))return;e.preventDefault();row.classList.remove('dragOver');let k=e.dataTransfer.getData('text/session-key');if(k)row.__sessionDrop(k)}}''')

for x in ["const BUILD_VERSION='2.9.17'",'function setupProjectDrop','id="globalOmni"','id="activeOmni"']:
    if x not in s: raise SystemExit('missing '+x)
APP.write_text(s,encoding='utf-8')
