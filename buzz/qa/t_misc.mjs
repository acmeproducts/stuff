import { open } from './run.mjs';
const { page, errors, close } = await open({});
const out = await page.evaluate(async () => {
  const b = window.__buzz; const res = []; b.save.upDives = false;
  b.startRun('free', null); const W = b.W, P = b.P, G = b.G;
  // every reactive type fires without error
  const types = {}; for (const o of W.reactives) if (!types[o.type]) types[o.type] = o;
  for (const t in types) b.trigger(types[t], 0);
  for (let i = 0; i < 120; i++) b.stepSim(1 / 60);
  res.push('reactive types fired: ' + Object.keys(types).sort().join(',') + ' -> havoc ' + G.unbanked);
  // no drones or heat any more: a long noisy run inside spawns nothing and takes no damage from anything but walls
  const Bh = W.buildings.find((q) => q.kind === 'garage'); P.pos.set(Bh.x0 + 10, 4.6, Bh.z0 + 8.75); P.yaw = -Math.PI / 2; G.unbanked = 5000; G.health = 100; let minH = 100;
  for (let i = 0; i < 60 * 14; i++) { b.input.x = 0; if (!P.loc) { P.pos.set(Bh.x0 + 10, 4.6, Bh.z0 + 8.75); P.yaw = -Math.PI / 2; } b.stepSim(1 / 60); minH = Math.min(minH, G.health); }
  res.push(`14 s inside carrying 5000 havoc: drone objects ${b.drones === undefined ? 'none' : 'PRESENT'}, heat field ${G.heat === undefined ? 'none' : 'PRESENT'}, toast "${document.getElementById('toast').textContent.slice(0, 5)}"`);
  P.landed = null; P.pos.set(0, 70, 0); P.pitch = 0; G.unbanked = 500; for (let i = 0; i < 60 * 3; i++) b.stepSim(1 / 60);
  res.push(`after 3 s outside: banked ${G.banked}, unbanked ${G.unbanked}`);
  // every environment combination applies
  let n = 0; for (const s of ['spring', 'summer', 'autumn', 'winter', 'auto']) for (const t of ['dawn', 'day', 'dusk', 'night', 'auto']) for (const w of ['clear', 'cloudy', 'rain', 'storm', 'fog', 'snow', 'windy', 'auto']) { b.save.season = s; b.save.tod = t; b.save.weather = w; b.applyEnv(); for (let i = 0; i < 2; i++) b.stepSim(1 / 60); n++; }
  res.push('environment combinations applied: ' + n);
  // each level: not finished one short of its task, finished when the task is met, and the time is logged
  const sc = [];
  for (const m of b.MISSIONS) {
    b.startRun('mission', m); for (let i = 0; i < 90; i++) b.stepSim(1 / 60);
    const set = (v) => { if (m.kind === 'count') G.counts[m.types[0]] = v; if (m.kind === 'lights') G.lit = v; if (m.kind === 'combo') G.bestCombo = v; if (m.kind === 'bank' || m.kind === 'bank3') G.banked = v; };
    let early = false;
    if (m.kind === 'escape') { for (let i = 0; i < 30; i++) b.stepSim(1 / 60); early = b.ui() === 'result'; P.pos.set(0, 60, 0); }
    else { set(m.goal - 1); if (m.kind === 'bank3') ['garage', 'office', 'hotel'].forEach((k) => G.bldHit.add(k)); b.stepSim(1 / 60); early = b.ui() === 'result'; if (m.kind === 'bank3') { G.bldHit.delete('hotel'); set(m.goal); b.stepSim(1 / 60); early = early || b.ui() === 'result'; G.bldHit.add('hotel'); } set(m.goal); }
    for (let i = 0; i < 3; i++) b.stepSim(1 / 60);
    const r = b.save.times[m.id]; sc.push(`${m.id}=${b.ui()}${early ? '!early' : ''}:${r && r.best > 1.4 && r.log.length === 1 ? 'timed' : 'NOTIME'}`);
  }
  res.push('levels: ' + sc.join(' ')); res.push('levels done ' + b.levelsDone() + ' of ' + b.MISSIONS.length);
  // all planes build
  const pl = []; b.setState('menu'); document.getElementById('mHangar').click(); for (let i = 0; i < 10; i++) { document.getElementById('hNext').click(); pl.push(document.getElementById('hName').textContent + (document.getElementById('hPick').textContent === 'Locked' ? '(L)' : '')); }
  res.push('hangar: ' + pl.join(' ')); document.querySelector('#hangar button.x').click();
  return res;
});
console.log(out.join('\n'));
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
