/* PROOF of the "phantom Korean bubble": replays the owner's real log (lengths, scripts and confidences only, no words) through the real app on a controlled clock.
   Part of the normal suite since the preview fix (it failed on every build before it). Run alone: CASE='GHOST PROOF' AUDIO_MODE=open node tests/audio-turn/regression.cjs
   Episodes B, C and D must draw no Korean while only English was spoken; A (a healthy turn from the same log) must still draw English. */
const GHOST_FX=JSON.parse(require('node:fs').readFileSync(require('node:path').join(root,'tests/audio-turn/fixtures/ghost-log-2026-11-20.json'),'utf8'));
async function ghostReplay(page,events,tailMs){
 await create(page,'GhostProof','en','ko');await page.waitForTimeout(300);
 await page.clock.install({time:Date.now()});
 const line=[];let now=0;
 const sample=async()=>{const rows=await page.evaluate(()=>[...document.querySelectorAll('#tx-south .cl-live')].map(r=>({north:/\bn\b/.test(r.querySelector('.bub').className),hangul:/[\uAC00-\uD7AF]/.test(r.innerText)})));line.push({t:now,rows})};
 const step=async ms=>{while(ms>0){const d=Math.min(50,ms);await page.clock.runFor(d);now+=d;ms-=d;await sample()}};
 for(const e of events){
  if(e.t>now)await step(e.t-now);
  await page.evaluate(e=>{const mk=(n,s)=>s==='hangul'?'네'.repeat(n):'a'.repeat(n);
   if(e.op==='clear')window.clLive(e.pipe,'','',0);
   else window.clLive(e.pipe,e.committed?mk(e.committed,e.script):'',e.committed&&e.len===e.committed?'':mk(e.len-(e.committed||0),e.script),e.conf)},e);
  await sample();
 }
 await step(tailMs||0);
 return line;
}
const shownHangul=line=>line.filter(s=>s.rows.some(r=>r.hangul));
const runs=line=>{const out=[];line.forEach(s=>{const st=s.rows.length?(s.rows.some(r=>r.hangul)?'KOREAN':'english'):'none',l=out[out.length-1];if(l&&l.st===st)l.to=s.t;else out.push({st:st,from:s.t,to:s.t})});return out.map(r=>r.st+' '+r.from+'-'+r.to+'ms').join(' | ')};
test('GHOST PROOF A (control, healthy turn from the same log): only English is ever drawn',async({page})=>{
 const line=await ghostReplay(page,GHOST_FX.A,1500);
 assert.equal(shownHangul(line).length,0,'a Korean preview was drawn in a healthy turn');
 assert.ok(line.some(s=>s.rows.length),'the English preview was drawn');
});
for(const [k,tail,what] of [['B',9000,'a 1-character Korean guess that never finishes outranks the English reading and is drawn (then held 4 s)'],['C',25000,'a 2-character Korean guess outranks the English reading by 0.01 and the Korean preview stays on screen after the English has finished'],['D',3000,'after the English finishes, the old Korean guess is the only entry left, so a Korean preview is drawn before the English bubble exists']])
 test('GHOST PROOF '+k+': '+what,async({page})=>{
  const line=await ghostReplay(page,GHOST_FX[k],tail),bad=shownHangul(line);
  assert.equal(bad.length,0,'a Korean preview was on screen for '+bad.length*50+' ms (first at +'+(bad[0]&&bad[0].t)+' ms, last at +'+(bad.length&&bad[bad.length-1].t)+' ms) while only English was spoken. What was drawn: '+runs(line));
 });
/* Episode E (second device log, 08:16:01): the Korean listener FINISHED a 7-character guess (confidence 0.54) before the English turn ended, so the turn-end clean-up (which only drops unfinished guesses) kept it;
   when the English cleared it was the only entry left, was drawn as a Korean preview, then frozen and held by the one-bubble hold (nothing adopts it, so it stays up to 4 s). Off until the fix: GHOST_PROOF_E=1. */
(process.env.GHOST_PROOF_E?test:skip)('GHOST PROOF E: a Korean guess that FINISHED during the English turn is never drawn, and never held',async({page})=>{
 const line=await ghostReplay(page,GHOST_FX.E,6000),bad=shownHangul(line);
 assert.equal(bad.length,0,'a Korean preview was on screen for '+bad.length*50+' ms (first at +'+(bad[0]&&bad[0].t)+' ms, last at +'+(bad.length&&bad[bad.length-1].t)+' ms) while only English was spoken. What was drawn: '+runs(line));
});
