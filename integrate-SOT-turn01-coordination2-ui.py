#!/usr/bin/env python3
from pathlib import Path
import re,sys
if len(sys.argv)!=3: raise SystemExit('usage: integrate-SOT-turn01-coordination2-ui.py <coordination-ui.html> <output.html>')
s=Path(sys.argv[1]).read_text()
old="if(!sotOperatorBusy()&&(changed||rollChanged)){let y=window.scrollY;renderCards();requestAnimationFrame(()=>window.scrollTo(0,y));let psel=selectedProject();if(psel&&state.tab==='index')renderIndex(psel)}"
new=r'''if(!sotOperatorBusy()&&(changed||rollChanged)){
  let pageY=window.scrollY,cards=$('cards'),railY=cards?cards.scrollTop:0,content=$('content'),contentY=content?content.scrollTop:0;
  let selected=state.selected,tab=state.tab,globalTab=state.globalTab,projectTab=state.projectTab,query=state.query;
  let active=document.activeElement,focusKey=active?.dataset?.select||active?.dataset?.run||active?.dataset?.pause||active?.dataset?.stop||active?.dataset?.menu||'';
  renderCards();
  state.selected=selected;state.tab=tab;state.globalTab=globalTab;state.projectTab=projectTab;state.query=query;
  requestAnimationFrame(()=>{window.scrollTo(0,pageY);if(cards)cards.scrollTop=railY;if(content)content.scrollTop=contentY;if(focusKey){let f=document.querySelector(`[data-select="${CSS.escape(focusKey)}"],[data-run="${CSS.escape(focusKey)}"],[data-pause="${CSS.escape(focusKey)}"],[data-stop="${CSS.escape(focusKey)}"],[data-menu="${CSS.escape(focusKey)}"]`);if(f)f.focus({preventScroll:true})}});
  let psel=selectedProject();if(psel&&state.tab==='index'&&!document.querySelector('.modalBg'))renderIndex(psel)
}'''
if s.count(old)!=1: raise SystemExit(f'v2 UI reconciliation marker changed: {s.count(old)}')
s=s.replace(old,new,1)
for marker in ['railY=cards?cards.scrollTop:0','state.selected=selected','state.tab=tab','state.query=query','focus({preventScroll:true})']:
    if marker not in s: raise SystemExit('missing v2 UI contract '+marker)
Path(sys.argv[2]).write_text(s)
print('SOT coordination UI v2 integrated')
