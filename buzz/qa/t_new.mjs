// 1.1.0 features: stick direction, speed lever, Zen, glide, landing spots, vertical take-off, terrain, persistence
import { open } from './run.mjs';
const { page, errors, close } = await open({});
const out = await page.evaluate(async () => {
  const b = window.__buzz; const res = []; const G = b.G, P = b.P; const step = (s) => { const n = Math.round(s * 60); for (let i = 0; i < n; i++) b.stepSim(1 / 60); };
  const place = (x, y, z, yaw) => { P.landed = null; P.lockT = 0; P.liftT = 0; P.pos.set(x, y, z); P.yaw = yaw; P.pitch = 0; P.speed = 6; b.input.x = b.input.y = 0; };
  // A. defaults on a fresh browser
  res.push(`fresh defaults: upDives=${b.save.upDives} zen=${b.save.zen} throttle=${b.save.throttle}`);
  b.startRun('free', null); place(0, 80, 0, 0); b.input.y = 1; step(1); const pUp = P.pitch; b.save.upDives = false; place(0, 80, 0, 0); b.input.y = 1; step(1);
  res.push(`stick up: dives by default (pitch ${pUp.toFixed(2)}), climbs when switched (pitch ${P.pitch.toFixed(2)})`); b.save.upDives = true; b.input.y = 0;
  // B. speed lever
  const sp = []; for (const t of [0.15, 0.5, 1]) { place(0, 80, 0, 0); b.setThrottle(t, true); step(4); sp.push((P.speed * 3.6).toFixed(0)); }
  res.push(`lever 15/50/100% -> ${sp.join(' / ')} km/h`); b.setThrottle(0.5, true);
  // C. Zen: slower, nothing scores, no alarms, no damage, no drones; quiet things still react
  b.save.zen = true; b.startRun('free', null); const W = b.W; const gar = W.buildings.find((q) => q.kind === 'garage');
  place(0, 80, 0, 0); step(4); const zenV = P.speed * 3.6;
  place(gar.x0 + 8, 4.4, gar.z0 + 8.75, -Math.PI / 2); for (let i = 0; i < 400; i++) { b.input.x = Math.sin(i / 30) * 0.4; b.stepSim(1 / 60); }
  const cars = W.reactives.filter((o) => o.type === 'car' && o.done).length; const tree = W.reactives.find((o) => o.type === 'tree'); place(tree.x - 6, tree.y, tree.z, -Math.PI / 2); step(1.5);
  G.unbanked = 5000; P.pos.set(0, 30, 0); for (let i = 0; i < 600; i++) b.stepSim(1 / 60); const h0 = G.health; P.pos.set(gar.x0 + 30, 4.4, gar.z0 + 8); P.pitch = -1; step(1);
  res.push(`zen: G.zen=${G.zen} cruise ${zenV.toFixed(0)} km/h, car alarms ${cars}, tree rustled ${tree.done}, havoc ${G.unbanked + G.banked}, health ${G.health}, hudZen ${document.getElementById('hud').classList.contains('zen')}`);
  b.save.zen = false;
  // D. glide: engine off, sinks, leaves no trail, nothing reacts, drones cannot track and give up
  b.startRun('free', null); const W2 = b.W; const g2 = W2.buildings.find((q) => q.kind === 'garage');
  place(0, 250, 300, Math.PI); b.setThrottle(0, true); step(1); const y0 = P.pos.y, x0 = P.pos.x, z0 = P.pos.z; G.trail.length = 0; let t = 0, dist = 0; const prev = P.pos.clone();
  while (!P.landed && t < 400 && P.pos.y > 40) { b.stepSim(1 / 60); t += 1 / 60; dist += Math.hypot(P.pos.x - prev.x, P.pos.z - prev.z); prev.copy(P.pos); }
  res.push(`glide: G.glide=${G.glide}, sank ${(y0 - P.pos.y).toFixed(0)} m in ${t.toFixed(0)} s over ${dist.toFixed(0)} m (ratio ${(dist / (y0 - P.pos.y)).toFixed(1)}:1), trail points ${G.trail.length}`);
  { const car = W2.reactives.find((o) => o.type === 'car' && !o.done && o.f === 2);
    b.setThrottle(0, true); b.input.x = 0; P.landed = null; P.pos.set(car.x, car.y + 1.2, car.z); P.yaw = 0; P.pitch = 0; P.speed = 4; step(0.4); const silent = !car.done; step(3); const parked = !!P.landed;
    b.setThrottle(0.5, true); P.landed = null; P.pos.set(car.x, car.y + 1.2, car.z); P.speed = 4; step(0.3);
    res.push(`glide silence: gliding over a parked car sets it off: ${!silent}; rolled to a stop on the floor: ${parked}; same car with engine on reacts: ${car.done}`); }
  b.setThrottle(0.5, true);
  // E. landing spots: low and slow lands, gives the bonus once, saved; fast does not land; take-off is vertical
  b.startRun('free', null); const W3 = b.W; const rows = [];
  for (const pad of W3.pads) {
    const bank0 = G.banked; b.setThrottle(1, true); place(pad.x, pad.y + 0.7, pad.z + 12, 0); P.speed = 20; step(1.2); const fastLanded = !!P.landed; const warn = document.getElementById('warn').textContent;
    if (P.landed) { b.takeOff(); step(3); } pad.cool = 0;
    b.setThrottle(0.2, true); place(pad.x, pad.y + 1.6, pad.z + 10, 0); P.speed = 5; let tt = 0; while (!P.landed && tt < 9) { b.stepSim(1 / 60); tt += 1 / 60; }
    const landed = !!(P.landed && P.landed.pad === pad); const bonus = G.banked - bank0; const y1 = P.pos.y;
    b.takeOff(); step(1.4); const rose = P.pos.y - y1; const air = !P.landed;
    rows.push(`${pad.id}:${landed ? 'L' : 'x'}${fastLanded ? '!fast' : ''}+${bonus}/up${rose.toFixed(1)}${air ? '' : '!stuck'}${/SLOW/.test(warn) ? '' : '(nowarn)'}`);
  }
  res.push('pads ' + rows.join(' ')); res.push(`pads saved ${Object.keys(b.save.pads).length} of ${b.PAD_LIST.length}; menu shows ${(b.setState('menu'), document.getElementById('mPads').textContent)}`);
  // second landing gives the smaller bonus
  b.startRun('free', null); { const pad = b.W.pads.find((p) => p.id === 'plaza'); b.setThrottle(0.2, true); place(pad.x, pad.y + 0.7, pad.z + 10, 0); P.speed = 5; let tt = 0; while (!P.landed && tt < 9) { b.stepSim(1 / 60); tt += 1 / 60; } res.push(`repeat landing bonus ${G.banked}; TAKE OFF button shown ${(b.stepSim(1 / 60), !document.getElementById('btnTO').classList.contains('hide') || 'after hud refresh')}`); }
  // F. engine-off touchdown anywhere, then vertical take-off with every plane
  const vt = [];
  for (let i = 0; i < b.PLANES.length; i++) {
    b.save.plane = i; b.setState('menu'); document.getElementById('mHangar').click(); document.querySelector('#hangar button.x').click(); b.startRun('free', null);
    place(-40, 6, -4, Math.PI / 2); b.setThrottle(0, true); let tt = 0; while (!P.landed && tt < 30) { b.stepSim(1 / 60); tt += 1 / 60; }
    const down = !!P.landed, yG = P.pos.y; b.takeOff(); step(1.5); vt.push(`${b.PLANES[i].name}:${down ? 'down' : 'NOLAND'}${tt.toFixed(0)}s/up${(P.pos.y - yG).toFixed(1)}${P.landed ? '!stuck' : ''}/thr${b.input.thr.toFixed(1)}`);
  }
  b.save.plane = 1; res.push('engine-off touchdown + vertical take-off: ' + vt.join(' '));
  // G. terrain: long random flight over mountains, park and sea never goes under the ground or water
  b.startRun('free', null); b.setThrottle(0.8, true); let under = 0, nan = 0, rs = 99; const rnd = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; }; const seen = {};
  const starts = [[0, 40, -200, 0], [-300, 12, 0, 1], [0, 8, 200, Math.PI], [200, 60, -400, 0.5], [150, 20, 420, 2]];
  for (const s of starts) { place(s[0], s[1], s[2], s[3]); for (let i = 0; i < 5400; i++) { if (i % 30 === 0) { b.input.x = rnd() * 2 - 1; b.input.y = (rnd() * 2 - 1) * 0.6; } G.health = 100; b.stepSim(1 / 60); if (!isFinite(P.pos.x + P.pos.y + P.pos.z)) { nan++; break; } if (P.pos.y < b.groundY(P.pos.x, P.pos.z) + 0.05 && !P.landed) under++; if (P.landed) b.takeOff(); if (i % 60 === 0) seen[document.getElementById('loc').textContent.split(' ·')[0]] = 1; } }
  b.input.x = b.input.y = 0;
  res.push(`terrain fuzz 7.5 min: under ground ${under}, NaN ${nan}`);
  // T. levels are timed: best is kept, the log is newest first, planes unlock by levels done, old stars still count
  { const m = b.MISSIONS[0]; const run = (secs) => { b.startRun('mission', m); for (let i = 0; i < secs * 60; i++) b.stepSim(1 / 60); G.counts.car = m.goal; b.stepSim(1 / 60); return document.getElementById('rKind').textContent + ' | ' + document.getElementById('rTime').textContent + ' | ' + document.getElementById('rText').textContent; };
    const locked0 = b.PLANES.filter((p, i) => p.unlock > b.levelsDone()).length;
    const a1 = run(5), a2 = run(3), a3 = run(4); const r = b.save.times[m.id];
    res.push(`timed: [${a1}] [${a2}] [${a3}]`); res.push(`time log: best ${r.best} runs ${r.runs} log ${r.log.join(',')}; levels done ${b.levelsDone()}; planes locked ${locked0} -> ${b.PLANES.filter((p) => p.unlock > b.levelsDone()).length}`);
    b.save.stars.m2 = 2; res.push(`old star counts as done: ${b.levelsDone()}`); delete b.save.stars.m2;
    b.startRun('mission', m); for (let i = 0; i < 200; i++) b.stepSim(1 / 60); res.push(`no time limit: after 3 s without doing the task ui=${b.ui()}, hud "${(b.stepSim(1 / 60), document.getElementById('pTime').textContent || 'pending hud')}"`); b.setState('menu'); }
  // H. save everything, reload, check
  b.save.upDives = false; b.save.zen = true; b.save.sound = false; b.save.fps = false; b.save.season = 'winter'; b.save.tod = 'dusk'; b.save.weather = 'snow'; b.save.plane = 0; b.setThrottle(0.31, true); b.persist();
  return res;
});
console.log(out.join('\n'));
await page.reload(); await page.waitForFunction(() => window.__buzz && __buzz.G.state === 'menu');
console.log('after reload: ' + await page.evaluate(() => { const b = __buzz, s = b.save; return `upDives=${s.upDives} zen=${s.zen} sound=${s.sound} fps=${s.fps} env=${s.season}/${s.tod}/${s.weather} plane=${s.plane} throttle=${s.throttle} lever=${b.input.thr} pads=${Object.keys(s.pads).length} times=${JSON.stringify(s.times.m1)} menuLevels=${document.getElementById('mStars').textContent} menuZen=${document.getElementById('mZen').checked} menuPads=${document.getElementById('mPads').textContent} label=${b.env.label}`; }));
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
