// 1.4.0: Target mode. Rockets in the air, torpedoes under water, red-X targets, ranges with a clock
import { open } from './run.mjs';
const { page, errors, close } = await open({});
const vis = (id) => page.evaluate((i) => { const e = document.getElementById(i); return !!e && !e.classList.contains('hide') && getComputedStyle(e).display !== 'none'; }, id);

// ---- UI: menu button, ranges list, X in the top right
await page.click('#mTarget', { timeout: 4000 }).catch(() => { });
const ui1 = await page.evaluate(() => { const m = document.getElementById('ranges'); if (!m) return 'no ranges modal'; const x = m.querySelector('button.x'), c = m.querySelector('.card'); const xr = x.getBoundingClientRect(), cr = c.getBoundingClientRect();
  return `ranges modal: opened=${__buzz.ui() === 'ranges'} rows=${m.querySelectorAll('.mis').length} xTopRight=${xr.right <= cr.right && xr.top - cr.top < 20 && cr.right - xr.right < 20}`; });
await page.click('#ranges button.x', { timeout: 4000 }).catch(() => { });
console.log(ui1 + ` closed=${await page.evaluate(() => __buzz.ui())}`);
await page.click('#mTarget', { timeout: 4000 }).catch(() => { }); await page.click('#ranges .mis:nth-child(2)', { timeout: 4000 }).catch(() => { });
console.log(`range brief: ui=${await page.evaluate(() => __buzz.ui())} kind="${await page.evaluate(() => document.getElementById('brKind').textContent)}"`);
await page.click('#brGo', { timeout: 4000 }).catch(() => { });
console.log(`range start: ui=${await page.evaluate(() => __buzz.ui())} target=${await page.evaluate(() => __buzz.G.target)} FIRE shown=${await vis('btnFire')} PULSE shown=${await vis('btnPulse')} goal="${await page.evaluate(() => { __buzz.updateHud(); return document.getElementById('goal').textContent; })}"`);
// the FIRE button fires (pointer events, as a thumb would)
{ const bb = await page.locator('#btnFire').boundingBox().catch(() => null);
  if (bb) { await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(700); const n = await page.evaluate(() => __buzz.G.fired); await page.mouse.up(); console.log(`FIRE button held 0.7 s: shots fired ${n >= 1 ? 'yes' : 'no'} (${n})`); } else console.log('FIRE button: missing'); }
await page.evaluate(() => __buzz.openModal('quick')); await page.click('#qTargets', { timeout: 4000 }).catch(() => { }); const qo = await page.evaluate(() => __buzz.ui()); await page.click('#ranges button.x', { timeout: 4000 }).catch(() => { });
console.log(`quick -> ranges: opened=${qo === 'ranges'} back=${await page.evaluate(() => __buzz.ui())}`);
await page.evaluate(() => __buzz.setState('menu'));

const out = await page.evaluate(async () => {
  const b = window.__buzz; const res = []; const G = b.G, P = b.P; const step = (s) => { const n = Math.round(s * 60); for (let i = 0; i < n; i++) b.stepSim(1 / 60); };
  if (!b.RANGES) return ['no RANGES'];
  b.save.upDives = false;
  // A. an ordinary run has no targets and no weapons
  b.startRun('free', null); let W = b.W; b.updateHud();
  res.push(`free roam: targets ${W.targets.length}, weapons ${G.target}, fire() ${b.fire()}, FIRE hidden ${document.getElementById('btnFire').classList.contains('hide')}, pier pad ${!!W.pads.find((p) => p.id === 'pier')}`);
  res.push(`ranges: ${b.RANGES.map((r) => r.id + ':' + r.dom).join(' ')}`);
  const aimAt = (from, t) => { const dx = t.x - from.x, dy = t.y - from.y, dz = t.z - from.z; const d = Math.hypot(dx, dy, dz); P.pos.set(from.x, from.y, from.z); P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.asin(dy / d); P.roll = 0; };
  const lineClear = (ax, ay, az, t, stop) => { const dx = t.x - ax, dy = t.y - ay, dz = t.z - az; const d = Math.hypot(dx, dy, dz); const n = Math.ceil(d / 0.4); for (let i = 1; i < n; i++) { const k = i / n; if (d * (1 - k) < stop) break; if (W.solid(ax + dx * k, ay + dy * k, az + dz * k, 0.25)) return false; } return true; };
  // every target stands in the open: balloons and mines clear of anything solid, trees and palms on dry land, sea targets under water
  { b.startRun('target', null); W = b.W; let stuck = [], dry = [], wet = [];
    for (const t of W.targets) { if (t.kind === 'balloon' && W.solid(t.x, t.y, t.z, 1.9)) stuck.push(t.id); if (t.kind === 'mine') { W.under = true; if (W.solid(t.x, t.y, t.z, 2.0)) stuck.push(t.id); W.under = false; }
      if ((t.kind === 'tree' || t.kind === 'palm') && b.landH(t.x, t.z) < b.waterY(t.x, t.z) + 0.2) wet.push(t.id); if (t.dom === 'sea' && t.y > b.SEA - 2.5) dry.push(t.id); }
    res.push(`placement: ${W.targets.length} targets, inside something solid ${stuck.length} ${stuck.join(' ')}, trees in water ${wet.length}, sea targets too shallow ${dry.length}; counts match the list ${b.RANGES.every((r) => W.targets.filter((t) => t.range === r.id).length === r.n)}`); }
  // B. air ranges: every target can be hit from somewhere sensible, the count goes up, the range ends with a time
  const times = {};
  for (const R of b.RANGES.filter((r) => r.dom === 'air')) {
    b.startRun('target', R); W = b.W; const tg = W.targets.slice(); const log = []; const early = b.ui();
    if (R.id === 't1') { const pr = W.targets.find((t) => t.kind === 'pier'); res.push(`pier before: deck solid ${W.solid(42, 1.75, 150, 0.1)}, pier pad ${!!W.pads.find((p) => p.id === 'pier')}, marked pillar target ${!!pr}`); }
    for (const t of tg) {
      let shot = null;
      for (const dist of [38, 26, 55]) { for (let a = 0; a < 16 && !shot; a++) for (const el of [0.12, 0.35, -0.05, 0.7]) { const ang = a / 16 * Math.PI * 2; const x = t.x + Math.cos(ang) * Math.cos(el) * dist, z = t.z + Math.sin(ang) * Math.cos(el) * dist, y = t.y + Math.sin(el) * dist; if (y < b.groundY(x, z) + 1.5) continue; if (W.solid(x, y, z, 0.6)) continue; if (lineClear(x, y, z, t, t.r * 0.8)) { shot = { x, y, z }; break; } } if (shot) break; }
      if (!shot) { log.push(t.id + ':NOLINE'); continue; }
      P.landed = null; P.lockT = 9; b.setThrottle(0.3, true); aimAt(shot, t); P.speed = 8; G.fireCD = 0; b.stepSim(1 / 60); aimAt(shot, t); G.fireCD = 0; const ok = b.fire(); let s = 0; while (!t.done && s < 3) { b.stepSim(1 / 60); s += 1 / 60; }
      log.push(t.id + ':' + (ok && t.done ? 'hit' : 'MISS'));
      if (t.kind === 'pier') { step(4); res.push(`pier after the marked pillar is hit: deck solid ${W.solid(42, 1.75, 150, 0.1)}, head solid ${W.solid(42, 1.75, 212, 0.1)}, pier pad ${!!W.pads.find((p) => p.id === 'pier')}`); }
    }
    step(3); const r = b.save.times[R.id];
    res.push(`air range ${R.id} "${R.name}": ${tg.length} targets ${log.join(' ')} | before the last hit ui=${early} | after ui=${b.ui()} "${document.getElementById('rKind').textContent}" time saved ${!!(r && r.best > 0)}`);
    times[R.id] = r && r.best;
  }
  // result modal: retry starts the same range again with everything standing
  document.getElementById('rRetry').click(); W = b.W; res.push(`retry: ui=${b.ui()} range ${G.range && G.range.id} targets standing ${W.targets.filter((t) => !t.done).length} of ${W.targets.length}`);
  b.setState('menu');
  // C. sea ranges: start under water at the site; every target has a firing position the sub can swim to
  for (const R of b.RANGES.filter((r) => r.dom === 'sea')) {
    b.startRun('target', R); W = b.W; const S = b.DIVE_SITES.find((s) => s.key === R.site); const started = G.sub && W.under; const tg = W.targets.slice(); const log = [];
    const pt = W.portals.find((q) => q.site === S);
    const st = 0.5, x0 = S.x - 80, z0 = S.z - 45, nx = 320, nz = 250, y0 = -45, ny = 88;
    const seen = new Uint8Array(nx * ny * nz); const id = (i, j, k) => (j * nz + k) * nx + i; const q = new Int32Array(nx * ny * nz); let qh = 0, qt = 0;
    const s0 = id(Math.round((pt.x - x0) / st), Math.round((b.SEA - 3.2 - y0) / st), Math.round((pt.z - z0) / st)); q[qt++] = s0; seen[s0] = 1;
    while (qh < qt) { const c = q[qh++]; const i = c % nx, r = (c - i) / nx, k = r % nz, j = (r - k) / nz;
      for (const [a, bb, cc] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) { const ii = i + a, jj = j + bb, kk = k + cc; if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz) continue; const n = id(ii, jj, kk); if (seen[n]) continue; if (W.solid(x0 + ii * st, y0 + jj * st, z0 + kk * st, 0.6)) { seen[n] = 2; continue; } seen[n] = 1; q[qt++] = n; } }
    let wallBefore = null; const wall = tg.find((t) => t.kind === 'wall'); if (wall) wallBefore = W.solid(wall.x, wall.y, wall.z, 0.3);
    for (const t of tg) {
      let shot = null; const ti = Math.round((t.x - x0) / st), tj = Math.round((t.y - y0) / st), tk = Math.round((t.z - z0) / st);
      for (const R2 of [14, 9, 20, 6]) { for (let a = 0; a < 16 && !shot; a++) for (const el of [0, 0.3, -0.3, 0.7]) { const ang = a / 16 * Math.PI * 2; const ii = ti + Math.round(Math.cos(ang) * Math.cos(el) * R2 / st), kk = tk + Math.round(Math.sin(ang) * Math.cos(el) * R2 / st), jj = tj + Math.round(Math.sin(el) * R2 / st);
        if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz || seen[id(ii, jj, kk)] !== 1) continue; const x = x0 + ii * st, y = y0 + jj * st, z = z0 + kk * st; if (lineClear(x, y, z, t, t.r + 1.2)) { shot = { x, y, z }; break; } } if (shot) break; }
      if (!shot) { log.push(t.id + ':NOLINE'); continue; }
      b.setThrottle(0, true); aimAt(shot, t); P.speed = 0; G.fireCD = 0; b.stepSim(1 / 60); aimAt(shot, t); G.fireCD = 0; const ok = b.fire(); let s = 0; while (!t.done && s < 5) { b.stepSim(1 / 60); s += 1 / 60; }
      log.push(t.id + ':' + (ok && t.done ? 'hit' : 'MISS'));
    }
    if (wall) res.push(`cave wall: solid before ${wallBefore}, solid after ${W.solid(wall.x, wall.y, wall.z, 0.3)}`);
    step(3); const r = b.save.times[R.id];
    res.push(`sea range ${R.id} "${R.name}": started under water ${started}, ${tg.length} targets ${log.join(' ')} | after ui=${b.ui()} "${document.getElementById('rKind').textContent}" time saved ${!!(r && r.best > 0)}`);
    b.setState('menu');
  }
  // D. ramming a mine sets it off; a rocket cannot reach a sea target and a torpedo cannot reach an air one
  { const R = b.RANGES.find((r) => r.dom === 'sea'); b.startRun('target', R); W = b.W; const m = W.targets.find((t) => t.kind === 'mine'); b.setThrottle(0.6, true); P.pos.set(m.x, m.y, m.z - 6); P.yaw = Math.PI; P.pitch = 0; let s = 0; while (!m.done && s < 4) { b.stepSim(1 / 60); s += 1 / 60; } res.push(`ramming a mine sets it off: ${m.done}`); b.setState('menu'); }
  // E. free fire: every target in the world, no clock, no result screen
  { b.startRun('target', null); W = b.W; const n = W.targets.length; const air = W.targets.filter((t) => t.dom === 'air').length; b.updateHud(); const goal = document.getElementById('goal').textContent;
    // lock-on: a target ahead inside the cone is picked up
    const t = W.targets.find((q) => q.kind === 'balloon'); aimAt({ x: t.x + 3, y: t.y - 2, z: t.z + 60 }, t); P.yaw += 0.08; P.landed = null; b.stepSim(1 / 60); b.updateAim(); const locked = G.lock === t; const p0 = b.save.points;
    for (const q of W.targets.slice()) b.destroyTarget(q); step(4);
    res.push(`free fire: ${n} targets (${air} air, ${n - air} sea), goal "${goal}", lock-on picks the target ahead ${locked}, all destroyed -> ui=${b.ui()}, points gained ${b.save.points - p0}`); }
  // F. two minutes of random flying and shooting, then a minute in the sub
  { let nan = 0, bad = 0, rs = 11; const rnd = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; }; b.startRun('target', null); W = b.W; b.setThrottle(0.7, true); let maxShots = 0;
    for (let i = 0; i < 7200; i++) { if (i % 45 === 0) { b.input.x = rnd() * 2 - 1; b.input.y = (rnd() * 2 - 1) * 0.6; } if (i % 20 === 0) b.fire(); b.stepSim(1 / 60); maxShots = Math.max(maxShots, G.shots.length); if (!isFinite(P.pos.x + P.pos.y + P.pos.z)) { nan++; break; } }
    b.enterSub(b.DIVE_SITES[1]); b.setThrottle(0.8, true);
    for (let i = 0; i < 3600; i++) { if (i % 40 === 0) { b.input.x = rnd() * 2 - 1; b.input.y = (rnd() * 2 - 1) * 0.8; } if (i % 30 === 0) b.fire(); b.stepSim(1 / 60); maxShots = Math.max(maxShots, G.shots.length); if (!isFinite(P.pos.x + P.pos.y + P.pos.z)) { nan++; break; } if (W.solid(P.pos.x, P.pos.y, P.pos.z, 0.2)) bad++; }
    b.input.x = b.input.y = 0; res.push(`shooting fuzz 3 min: NaN ${nan}, sub in rock ${bad}, most shots alive at once ${maxShots <= 8 ? 'within 8' : maxShots}, fired ${G.fired > 100}`); b.setState('menu'); }
  // G. levels are untouched by ranges
  res.push(`levels done still ${b.levelsDone()} of ${b.MISSIONS.length}; range times ${Object.keys(b.save.times).filter((k) => k.startsWith('t')).length}`);
  b.persist(); return res;
});
console.log(out.join('\n'));
await page.reload(); await page.waitForFunction(() => window.__buzz && __buzz.G.state === 'menu');
await page.click('#mTarget', { timeout: 4000 }).catch(() => { });
console.log('after reload: ' + await page.evaluate(() => { const s = __buzz.save; return `range times kept ${Object.keys(s.times).filter((k) => /^t\d/.test(k)).length}; list shows a best time on ${[...document.querySelectorAll('#ranges .mis .stars')].filter((e) => / s|:/.test(e.textContent)).length} rows`; }));
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
