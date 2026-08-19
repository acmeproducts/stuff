from pathlib import Path
p=Path('market-view.html')
s=p.read_text()
if "const VERSION='3.9.0'" not in s:
    raise SystemExit('Expected Market Navigator 3.9.0 baseline')
s=s.replace('<title>Market Navigator 3.9</title>','<title>Market Navigator 3.9.1</title>')
s=s.replace('Version 3.9</small>','Version 3.9.1</small>')
s=s.replace("const VERSION='3.9.0'","const VERSION='3.9.1'")
anchor='</script></body></html>'
if anchor not in s: raise SystemExit('closing script anchor missing')
override=r'''
/* 3.9.1: every rendered chart carries a visible legend identifying its series. */
function chartLegend(canvas,list,{normalized=false}={}){
  const old=canvas.parentElement?.querySelector(':scope > .chartLegend');
  if(old)old.remove();
  if(!list?.length)return;
  const legend=document.createElement('div');
  legend.className='chartLegend';
  legend.setAttribute('aria-label','Chart legend');
  legend.innerHTML=list.map(s=>`<span class="chartLegendItem"><i style="background:${s.color||'#6db7ff'}"></i><b>${s.name||META[s.id]?.short||s.id}</b>${normalized?'<em>Indexed to 100 at period start</em>':''}</span>`).join('');
  canvas.insertAdjacentElement('beforebegin',legend);
}
const _chart391=chart;
chart=function(canvas,list,opts={}){chartLegend(canvas,list,opts);return _chart391(canvas,list,opts)};
'''
s=s.replace(anchor,override+'\n</script></body></html>')
css='''.chartLegend{display:flex;align-items:center;gap:12px;flex-wrap:wrap;min-height:24px;padding:2px 2px 6px;color:var(--muted);font-size:10px}.chartLegendItem{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}.chartLegendItem i{display:inline-block;width:18px;height:3px;border-radius:3px}.chartLegendItem b{color:var(--text);font-size:11px}.chartLegendItem em{font-style:normal;color:var(--muted);margin-left:2px}@media(max-width:520px){.chartLegend{gap:8px;overflow-x:auto;flex-wrap:nowrap;min-height:26px}.chartLegendItem em{display:none}}'''
s=s.replace('</style></head>',css+'\n</style></head>')
p.write_text(s)
print('Patched Market Navigator to 3.9.1 with chart legends')
