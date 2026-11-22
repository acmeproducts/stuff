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
  // drones: heat from unbanked havoc, they follow the trail, zap, pulse knocks them out, banking sends them away
  const Bh = W.buildings.find((q) => q.kind === 'garage'); P.pos.set(Bh.x0 + 10, 4.6, Bh.z0 + 8.75); P.yaw = -Math.PI / 2; G.unbanked = 800;
  let maxD = 0, zaps = 0, h0 = 100; G.health = 100;
  for (let i = 0; i < 60 * 14; i++) { b.input.x = Math.sin(i / 50) * 0.5; b.stepSim(1 / 60); const n = b.drones.filter((d) => d.state !== 'off').length; maxD = Math.max(maxD, n); if (G.health < h0 - 5) { zaps++; } h0 = G.health; if (G.health < 40) G.health = 100; }
  res.push(`heat ${G.heat}, drones active peak ${maxD}, loc ${P.loc ? P.loc.B.kind : 'out'}, health dips ${zaps}, unbanked ${G.unbanked}`);
  const before = b.drones.filter((d) => d.state === 'trail' && d.stun <= 0).length; G.pulseCD = 0; b.pulse();
  res.push(`pulse: drones up before ${before}, stunned now ${b.drones.filter((d) => d.stun > 0).length}, cd ${G.pulseCD}`);
  P.pos.set(0, 20, 0); b.input.x = 0; G.unbanked = 500; for (let i = 0; i < 60 * 3; i++) b.stepSim(1 / 60);
  res.push(`after 3 s outside: banked ${G.banked}, unbanked ${G.unbanked}, drones left ${b.drones.filter((d) => d.state !== 'off').length}`);
  // knocked down: lose unbanked, keep flying
  G.unbanked = 300; G.health = 1; P.pos.set(Bh.x0 + 30, 4.6, Bh.z0 + 8.75); for (let i = 0; i < 30; i++) b.stepSim(1 / 60); P.inv = 0;
  const hp = G.health; G.health = -1; P.pitch = -1; for (let i = 0; i < 5; i++) b.stepSim(1 / 60);
  res.push(`knock down: downs ${G.downs}, health ${Math.round(G.health)}, unbanked ${G.unbanked}, state ${b.ui()}`);
  // every environment combination applies
  let n = 0; for (const s of ['spring', 'summer', 'autumn', 'winter', 'auto']) for (const t of ['dawn', 'day', 'dusk', 'night', 'auto']) for (const w of ['clear', 'cloudy', 'rain', 'storm', 'fog', 'snow', 'windy', 'auto']) { b.save.season = s; b.save.tod = t; b.save.weather = w; b.applyEnv(); for (let i = 0; i < 2; i++) b.stepSim(1 / 60); n++; }
  res.push('environment combinations applied: ' + n);
  // every mission kind ends in a result screen; stars computed
  const sc = [];
  for (const m of b.MISSIONS) { b.startRun('mission', m); G.counts.car = 99; G.counts.desk = 99; G.counts.elev = 99; G.lit = 9; G.bestCombo = 99; G.banked = 9999; ['garage', 'office', 'hotel'].forEach((k) => G.bldHit.add(k)); if (m.kind === 'escape') { P.pos.set(0, 30, 0); } for (let i = 0; i < 4; i++) b.stepSim(1 / 60); sc.push(m.id + '=' + b.ui() + ':' + (b.save.stars[m.id] || 0)); }
  res.push('missions: ' + sc.join(' '));
  // time-out path
  b.startRun('mission', b.MISSIONS[0]); G.timeLeft = 0.01; for (let i = 0; i < 3; i++) b.stepSim(1 / 60); res.push('timeout -> ' + b.ui() + ' / ' + document.getElementById('rKind').textContent);
  // all planes build, unlock gates
  const pl = []; for (let i = 0; i < b.PLANES.length; i++) { document.getElementById('hNext'); } b.setState('menu'); document.getElementById('mHangar').click(); for (let i = 0; i < 10; i++) { document.getElementById('hNext').click(); pl.push(document.getElementById('hName').textContent + (document.getElementById('hPick').textContent === 'Locked' ? '(L)' : '')); }
  res.push('hangar: ' + pl.join(' ')); document.querySelector('#hangar button.x').click();
  // memory: rebuild the block many times, GPU objects should not grow
  const m0 = { g: b.renderer.info.memory.geometries, t: b.renderer.info.memory.textures, p: b.renderer.info.programs.length };
  for (let i = 0; i < 12; i++) { b.startRun('free', null); b.stepSim(1 / 60); }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  res.push(`gpu objects before/after 12 rebuilds: geometries ${m0.g}/${b.renderer.info.memory.geometries}, textures ${m0.t}/${b.renderer.info.memory.textures}, programs ${m0.p}/${b.renderer.info.programs.length}`);
  return res;
});
console.log(out.join('\n'));
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
