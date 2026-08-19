from pathlib import Path
p=Path('market-view.html')
s=p.read_text()
if "const VERSION='3.9.4'" not in s:
    raise SystemExit('Expected 3.9.4 baseline')

s=s.replace('<title>Market Navigator 3.9.4</title>','<title>Market Navigator 3.9.5</title>')
s=s.replace('Version 3.9.4</small>','Version 3.9.5</small>')
s=s.replace("const VERSION='3.9.4'","const VERSION='3.9.5'")
s=s.replace('Market Navigator 3.9.4\nUsage:','Market Navigator 3.9.5\nUsage:')
s=s.replace('Version: 3.9.4','Version: 3.9.5')

# 3.9.1 compatibility code appears after the 3.9.3 implementation and therefore
# shadows the intended renderNow/openDetail functions. Rename only the legacy
# definitions, identified by their distinctive bodies.
old="function renderNow(){const r=regimeSummary(state.range),cats=['risk','growth','macro'].map(k=>({k,z:categoryIndex(k,state.range),c:CATEGORY[k]}));"
if old not in s:
    raise SystemExit('Legacy renderNow anchor not found')
s=s.replace(old,"function renderNow391Legacy(){const r=regimeSummary(state.range),cats=['risk','growth','macro'].map(k=>({k,z:categoryIndex(k,state.range),c:CATEGORY[k]}));",1)

old="async function openDetail(id){state.detail={id,range:state.range};if(location.hash!==`#detail/${encodeURIComponent(id)}`){navigateDetail391(id);return}$('#saveDetail').style.display='';$('#detailModal').classList.add('open');await drawDetail391()}"
if old not in s:
    raise SystemExit('Legacy openDetail anchor not found')
s=s.replace(old,"async function openDetail391Legacy(id){state.detail={id,range:state.range};if(location.hash!==`#detail/${encodeURIComponent(id)}`){navigateDetail391(id);return}$('#saveDetail').style.display='';$('#detailModal').classList.add('open');await drawDetail391()}",1)

# Stop the 3.9.1 wrapper from replacing the 3.9.3 category-index chart with a
# normalized component comparison. Preserve the function only as an unused legacy helper.
old="const _drawCategory391=drawCategory;drawCategory=async function(){await _drawCategory391();const c=$('#detailChart');if(state.detail?.category&&c){const key=state.detail.category,list=normalize(CATEGORY[key].components.filter(id=>META[id]?.symbol),state.range);chart(c,list,{range:state.range,axes:true,normalized:true,index:true})}}"
if old not in s:
    raise SystemExit('Legacy drawCategory wrapper anchor not found')
s=s.replace(old,"const drawCategory391Legacy=drawCategory;",1)

# Route legacy #detail links through the current detail modal renderer instead of
# the obsolete 3.9.1 renderer. This preserves browser-back compatibility without
# changing the current modal-first navigation contract.
s=s.replace("await drawDetail391();return}}location.replace('#home')","await drawDetail();return}}location.replace('#home')",1)

p.write_text(s)
print('Patched Market Navigator to 3.9.5')
