from pathlib import Path

p = Path('market-navigator-build-turn15.py')
s = p.read_text()
old = "new_avail = \"async function seriesAvailability(id,h=S.h,k=S.index||'risk'){try{let src=await getSeries(id),inside=obsRange(src,horizonWindow(h,k)).length,hh=health(id),periodic=(id==='gdpQoq'||id==='gdpYoy');if(inside>0)return{available:true,reason:'in-window',count:inside};if(periodic&&(src.observations||[]).length)return{available:true,reason:'periodic-transform',count:0};if((String(cat(id).native_cadence||hh.cadence||'').includes('daily')||String(cat(id).native_cadence||hh.cadence||'').includes('trading'))&&hh.horizonCoverage?.[h]&&(src.observations||[]).length)return{available:true,reason:'health-covered',count:0};return{available:false,reason:'no-real-observation',count:0}}catch(e){return{available:false,reason:'evidence-error',error:String(e?.message||e)}}}async function seriesAvailable(id,h=S.h,k=S.index||'risk'){return(await seriesAvailability(id,h,k)).available}\""
new = "new_avail = \"async function seriesAvailability(id,h=S.h,k=S.index||'risk'){try{let src=await getSeries(id),inside=obsRange(src,horizonWindow(h,k)).length,hh=health(id),cadence=String(cat(id).native_cadence||hh.cadence||'').toLowerCase(),periodic=(id==='gdpQoq'||id==='gdpYoy'||cadence.includes('month')||cadence.includes('quarter'));if(inside>0)return{available:true,reason:'in-window',count:inside};if(periodic&&(src.observations||[]).length&&hh.classification!=='failed')return{available:true,reason:(id==='gdpQoq'||id==='gdpYoy')?'periodic-transform':'periodic-current',count:0};if((cadence.includes('daily')||cadence.includes('trading'))&&hh.horizonCoverage?.[h]&&(src.observations||[]).length)return{available:true,reason:'health-covered',count:0};return{available:false,reason:'no-real-observation',count:0}}catch(e){return{available:false,reason:'evidence-error',error:String(e?.message||e)}}}async function seriesAvailable(id,h=S.h,k=S.index||'risk'){return(await seriesAvailability(id,h,k)).available}\""
if old not in s:
    raise SystemExit('Turn 15 availability anchor not found')
s = s.replace(old, new, 1)
p.write_text(s)
print('TURN 15 PERIODIC AVAILABILITY: UPDATED')
