from pathlib import Path
p=Path('market-navigator-turn23-pre-ship.html')
s=p.read_text()
old="for(let p of ['venice','openrouter','anthropic']){$(p+'Key').addEventListener('input',()=>{let r=aiRegistry(),providers=r.providers||{},q=providers[p]||{};if(q.verified){providers[p]={...q,verified:false};saveAIRegistry({...r,providers});setPStatus(p,'changed · validate again',null)}})}"
new="for(let p of ['venice','openrouter','anthropic']){$(p+'Key').addEventListener('input',()=>{let btn=document.querySelector('[data-replace-key=\"'+p+'\"]');setPStatus(p,btn?.dataset.active==='true'?'replacement draft · validate to save':'key entered · validate to save',null)})}"
if old not in s: raise SystemExit('provider key draft listener anchor missing')
s=s.replace(old,new,1)
p.write_text(s)
print('TURN23 KEY-DRAFT POST PASS')
