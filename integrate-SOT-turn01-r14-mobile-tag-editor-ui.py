#!/usr/bin/env python3
from pathlib import Path
import sys
if len(sys.argv)!=3: raise SystemExit('usage: integrate-SOT-turn01-r14-mobile-tag-editor-ui.py <r13.html> <r14.html>')
p=Path(sys.argv[1]); src=p.read_text()
need=["const BUILD='SOT-turn01-base-r13-hierarchical-master-detail'","function editingSurface(){","function tagSuggest(input){","async function tagKey(e,input){","async function commitTagEditor(){","function draw(){"]
for x in need:
    if src.count(x)!=1: raise SystemExit(f'R13 contract failed {x}: {src.count(x)}')
src=src.replace("const BUILD='SOT-turn01-base-r13-hierarchical-master-detail'","const BUILD='SOT-turn01-base-r14-mobile-first-tag-editor'",1)
old="expandedFolders:new Set(JSON.parse(localStorage.getItem('sot.r13.expanded')||'[]'))}"
new="expandedFolders:new Set(JSON.parse(localStorage.getItem('sot.r13.expanded')||'[]')),tagEditLock:false}"
if src.count(old)!=1: raise SystemExit('state marker changed')
src=src.replace(old,new,1)
src=src.replace("function editingSurface(){let a=document.activeElement;return !!a&&(a.matches('input,textarea,select')||a.isContentEditable)}","function editingSurface(){let a=document.activeElement;return state.tagEditLock||!!a&&(a.matches('input,textarea,select')||a.isContentEditable)}",1)
src=src.replace("function tagSuggest(input){let box=$('#tagSuggestions')","function beginTagEdit(){state.tagEditLock=true}\nfunction endTagEdit(){state.tagEditLock=false}\nfunction tagSuggest(input){state.tagEditLock=true;let box=$('#tagSuggestions')",1)
src=src.replace("async function tagKey(e,input){if(e.key==='Enter')","async function tagKey(e,input){state.tagEditLock=true;if(e.key==='Enter')",1)
src=src.replace("async function commitTagEditor(){let input=$('#tagEditor')","async function commitTagEditor(){state.tagEditLock=true;let input=$('#tagEditor')",1)
old_input='id="tagEditor" autocomplete="off" enterkeyhint="done" placeholder="Begin typing tag…" oninput="tagSuggest(this)" onkeydown="tagKey(event,this)"'
new_input='id="tagEditor" autocomplete="off" enterkeyhint="done" placeholder="Begin typing tag…" onfocus="beginTagEdit()" onpointerdown="beginTagEdit()" oninput="tagSuggest(this)" onkeydown="tagKey(event,this)"'
if src.count(old_input)!=1: raise SystemExit('tag editor input contract changed')
src=src.replace(old_input,new_input,1)
# Explicit outside-tap unlock. Capture phase runs before nav/tree handlers and allows their redraw.
needle="insert=src.index('function dashboard(){')"
if needle not in src: raise SystemExit('unexpected integrator source marker')
# Add runtime listener before dashboard function in generated HTML.
runtime="""
document.addEventListener('pointerdown',e=>{if(!state.tagEditLock)return;let host=e.target.closest?.('.tagEditorWrap');if(!host){endTagEdit()}},true)
document.addEventListener('focusin',e=>{if(e.target?.id==='tagEditor')beginTagEdit()},true)
"""
idx=src.index('function dashboard(){')
src=src[:idx]+runtime+"\n"+src[idx:]
# draw must never replace the editor while the explicit mobile lock is active.
src=src.replace("function draw(){rememberDisclosure();","function draw(){if(state.tagEditLock&&document.getElementById('tagEditor'))return;rememberDisclosure();",1)
for x in ["SOT-turn01-base-r14-mobile-first-tag-editor","tagEditLock","beginTagEdit()","onfocus=\"beginTagEdit()\"","if(state.tagEditLock&&document.getElementById('tagEditor'))return","document.addEventListener('pointerdown'","if(!host){endTagEdit()}"]:
    if x not in src: raise SystemExit('R14 output contract missing '+x)
Path(sys.argv[2]).write_text(src)
print('R14 mobile-first tag editor lock integrated')
