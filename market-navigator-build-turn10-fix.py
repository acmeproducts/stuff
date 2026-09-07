from pathlib import Path
p=Path('market-navigator-turn10-pre-ship.html')
s=p.read_text()
old="function freshnessNote(id){let h=health(id),cad=String(h.cadence||cat(id).native_cadence||''),latest=h.actualLatestCanonicalObservation||'',anchor=S.derived.commonMarketAnchor;if(!latest||!cad||latest===anchor)return'';if(h.classification==='current')return`${label(id)} ${cad} · latest ${latest} · current for release cadence`;return`${label(id)} ${cad} · latest ${latest} · ${h.classification||'lagged'}`}"
new="function freshnessNote(id,series){let h=health(id),cad=String(h.cadence||cat(id).native_cadence||series?.cadence||''),last=(series?.observations||[]).at(-1),latest=h.actualLatestCanonicalObservation||h.latestObservation||(last?new Date(last.t).toISOString().slice(0,10):''),anchor=S.derived.commonMarketAnchor;if(!latest||!cad||latest===anchor)return'';if(h.classification==='current')return`${label(id)} ${cad} · latest ${latest} · current for release cadence`;return`${label(id)} ${cad} · latest ${latest} · ${h.classification||'release cadence'}`}"
if old not in s: raise SystemExit('freshness function anchor missing')
s=s.replace(old,new)
s=s.replace("fresh=loaded.map(z=>freshnessNote(z.id)).filter(Boolean)","fresh=loaded.map(z=>freshnessNote(z.id,z.s)).filter(Boolean)")
p.write_text(s)
print('Turn 10 freshness fallback applied')
