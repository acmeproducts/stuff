from pathlib import Path
p=Path('market-view.html')
s=p.read_text()
if "const VERSION='3.9.7'" not in s:
    raise SystemExit('Expected 3.9.7 baseline')
old="function categoryIndex(key,r=state.range){const c=CATEGORY[key];let parts=[];for(const id of c.components){const z=q(id,r);if(!z||!coverage(id,r))continue;let effect=0;if(id==='spy')effect=clamp(z.p/8);if(id==='tenYear')effect=-clamp(z.p/6);if(id==='wti')effect=-clamp(z.p/12);parts.push({id,effect,p:z.p})}if(!parts.length)return null;const score=Math.round(50+35*(parts.reduce((a,b)=>a+b.effect,0)/parts.length));const s=Math.max(0,Math.min(100,score));return{score:s,label:s>=58?'Positive':s<=42?'Negative':'Neutral',cls:s>=58?'good':s<=42?'bad':'neutral',parts}}"
new="function categoryIndex(key,r=state.range){const c=CATEGORY[key];let parts=[];for(const id of c.components){const z=q(id,r),d=rangeData(id,r);if(!z||d.length<2)continue;const effect=categoryEffect397(id,z.p);if(effect===null)continue;parts.push({id,effect,p:z.p})}if(!parts.length)return null;const score=Math.round(50+35*(parts.reduce((a,b)=>a+b.effect,0)/parts.length));const s=Math.max(0,Math.min(100,score));return{score:s,label:s>=58?'Positive':s<=42?'Negative':'Neutral',cls:s>=58?'good':s<=42?'bad':'neutral',parts}}"
if old not in s: raise SystemExit('categoryIndex anchor not found')
s=s.replace(old,new,1)
p.write_text(s)
print('category scoring fixed')
