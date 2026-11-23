// 1.3.0: palms, unmarked sea floats, violet dive platforms, the submersible, finds, the treasure map
import { open } from './run.mjs';
const { page, errors, close } = await open({});
const out = await page.evaluate(async () => {
  const b = window.__buzz; const res = []; const G = b.G, P = b.P; const step = (s) => { const n = Math.round(s * 60); for (let i = 0; i < n; i++) b.stepSim(1 / 60); };
  b.save.upDives = false; b.startRun('free', null); let W = b.W;
  res.push(`world: palms ${W.palms.length}, pads ${W.pads.length} (land ${W.pads.filter((p) => p.kind === 'land').length}, sea ${W.pads.filter((p) => p.kind === 'sea').length}, dive ${W.pads.filter((p) => p.kind === 'dive').length}), portals ${W.portals.length}, finds ${W.finds.length}, fish ${W.fish.reduce((a, f) => a + f.n, 0)}`);
  res.push(`sea floats: beams ${W.pads.filter((p) => p.kind === 'sea' && p.beam).length}, lit marks ${W.pads.filter((p) => p.kind === 'sea').reduce((a, p) => a + p.hs.length, 0)}, nearest to shore ${Math.min(...W.pads.filter((p) => p.kind === 'sea').map((p) => p.z - 139)).toFixed(0)} m out; dive platforms with a beam ${W.pads.filter((p) => p.kind === 'dive' && p.beam).length}`);
  // A. every find is reachable from its dive entry (flood fill at the sub's size)
  const reach = [];
  for (const S of b.DIVE_SITES) {
    const pt = W.portals.find((q) => q.site === S); W.under = true;
    const st = 0.5, x0 = S.x - 85, z0 = S.z - 40, nx = 340, nz = 250; let fl = 0; for (const f of W.finds) fl = Math.min(fl, f.y); const y0 = -45, ny = 88;
    const seen = new Uint8Array(nx * ny * nz); const id = (i, j, k) => (j * nz + k) * nx + i; const q = new Int32Array(nx * ny * nz); let qh = 0, qt = 0;
    const s0 = id(Math.round((pt.x - x0) / st), Math.round((b.SEA - 3.2 - y0) / st), Math.round((pt.z - z0) / st)); q[qt++] = s0; seen[s0] = 1;
    while (qh < qt) { const c = q[qh++]; const i = c % nx, r = (c - i) / nx, k = r % nz, j = (r - k) / nz;
      for (const [a, bb, cc] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) { const ii = i + a, jj = j + bb, kk = k + cc; if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz) continue; const n = id(ii, jj, kk); if (seen[n]) continue; if (W.solid(x0 + ii * st, y0 + jj * st, z0 + kk * st, 0.6)) { seen[n] = 2; continue; } seen[n] = 1; q[qt++] = n; } }
    const mine = W.finds.filter((f) => b.FINDS.find((g) => g[0] === f.id)[2] === S.key);
    for (const f of mine) { let ok = false; const R = 3; const fi = Math.round((f.x - x0) / st), fj = Math.round((f.y - y0) / st), fk = Math.round((f.z - z0) / st);
      for (let a = -R; a <= R && !ok; a++) for (let c = -R; c <= R && !ok; c++) for (let d = -R; d <= R && !ok; d++) { if (Math.hypot(a, c, d) * st > 1.8) continue; const ii = fi + a, jj = fj + c, kk = fk + d; if (ii >= 0 && jj >= 0 && kk >= 0 && ii < nx && jj < ny && kk < nz && seen[id(ii, jj, kk)] === 1) ok = true; }
      reach.push(`${f.id}:${ok ? 'ok' : 'BLOCKED'}`); }
    W.under = false;
  }
  res.push(`reachable from the dive entry: ${reach.filter((r) => r.endsWith('ok')).length} of ${reach.length}  ${reach.filter((r) => !r.endsWith('ok')).join(' ')}`);
  // B. sea floats: land, +200 every time; dive platforms +1000 then +400
  const land = (pad) => { P.landed = null; P.lockT = 0; pad.cool = 0; b.setThrottle(0.2, true); P.pos.set(pad.x, pad.y + 1.4, pad.z + 10); P.yaw = 0; P.pitch = 0; P.speed = 5; let t = 0; while (!P.landed && t < 8) { b.stepSim(1 / 60); t += 1 / 60; } return !!(P.landed && P.landed.pad === pad); };
  const lr = [];
  for (const pad of W.pads.filter((p) => p.kind !== 'land')) { const b0 = G.banked; const l1 = land(pad); const g1 = G.banked - b0; b.takeOff(); step(1.5); const l2 = land(pad); const g2 = G.banked - b0 - g1; b.takeOff(); step(1.5); lr.push(`${pad.kind}:${l1 && l2 ? 'L' : 'x'}+${g1}+${g2}`); }
  res.push('sea and dive landings: ' + lr.join(' ')); res.push(`lifetime points ${b.save.points}, session ${G.banked}`);
  // C. dive entry: only the glowing disc takes you down; DIVE button from the platform works; SURFACE brings you back
  { const pt = W.portals[0]; P.landed = null; P.lockT = 0; b.setThrottle(0.4, true); P.pos.set(pt.x + 30, 0.2, pt.z + 30); P.yaw = 0; P.pitch = -0.3; step(1.5); const outside = G.sub;
    P.pos.set(pt.x, 6, pt.z + 30); P.yaw = 0; P.pitch = 0; b.input.y = -0.35; step(4); b.input.y = 0; const inside = G.sub; const y1 = P.pos.y; const fog1 = b.scene.fog.density;
    res.push(`touching water outside the disc dives: ${outside}; flying into the disc dives: ${inside} (y ${y1.toFixed(1)}, under=${W.under}, plane hidden=${!P.mesh.visible}, haze ${fog1})`);
    b.updateHud(); res.push(`sub hud: "${document.getElementById('loc').textContent}" button "${document.getElementById('btnTO').textContent}" shown=${!document.getElementById('btnTO').classList.contains('hide')} lever label ${document.querySelector('#thr .gl').textContent}`);
    // movement: lever bottom = stop and hold depth; forward moves; cannot break the surface or the floor
    b.setThrottle(0, true); step(3); const p0 = P.pos.clone(); step(3); const drift = P.pos.distanceTo(p0);
    b.setThrottle(1, true); b.input.y = 1; step(6); const top = P.pos.y; b.input.y = -1; step(12); const bot = P.pos.y - b.landH(P.pos.x, P.pos.z); b.input.y = 0;
    res.push(`stopped drift ${drift.toFixed(2)} m; nose up for 6 s reaches y ${top.toFixed(2)} (surface ${b.SEA}); nose down for 12 s sits ${bot.toFixed(2)} m above the floor`);
    document.getElementById('btnTO').click(); const up = !G.sub && !W.under; step(1.5);
    res.push(`SURFACE: back in the plane ${up}, airborne ${!P.landed && P.pos.y > b.SEA + 1.5}, plane shown ${P.mesh.visible}, haze back to ${b.scene.fog.density === b.env.fogDensity}, did not fall straight back in ${!G.sub}`);
    const pad = W.pads.find((p) => p.id === 'diveB'); step(3); land(pad); b.updateHud(); const btn = !document.getElementById('btnDive').classList.contains('hide'); document.getElementById('btnDive').click();
    res.push(`DIVE button on a violet platform shown ${btn}; pressing it dives ${G.sub} at ${G.site && G.site.name}`); }
  // D. random sub flight at each site never leaves the water or enters rock
  let bad = 0, nan = 0, rs = 7; const rnd = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };
  for (const S of b.DIVE_SITES) { if (G.sub) b.exitSub(); step(4); P.lockT = 0; b.enterSub(S); b.setThrottle(0.9, true);
    for (let i = 0; i < 7200; i++) { if (i % 40 === 0) { b.input.x = rnd() * 2 - 1; b.input.y = (rnd() * 2 - 1) * 0.8; } b.stepSim(1 / 60); if (!isFinite(P.pos.x + P.pos.y + P.pos.z)) { nan++; break; } if (W.solid(P.pos.x, P.pos.y, P.pos.z, 0.2) || P.pos.y > b.SEA - 0.7) bad++; } }
  b.input.x = b.input.y = 0; res.push(`random sub flight, 2 min at each site: in rock or out of the water ${bad}, NaN ${nan}`);
  // E. finds: only the sub collects them; each is saved and scored; three map pieces unlock everything
  { b.exitSub(); step(4); const f0 = W.finds.find((f) => f.id === 'amphora'); P.pos.set(f0.x, b.SEA + 0.4, f0.z); step(0.5); const byPlane = f0.done;
    const pts0 = b.save.points; const lockedBefore = b.PLANES.filter((p, i) => !b.save.unlockAll && b.levelsDone() < p.unlock).length;
    b.enterSub(b.DIVE_SITES[0]); b.setThrottle(0, true); let got = 0, mapMsg = '';
    for (const f of W.finds.slice()) { if (f.done) continue; P.pos.set(f.x, f.y + 0.6, f.z - 0.8); P.speed = 0; b.stepSim(1 / 60); if (f.done) got++; if (f.id === 'map3') mapMsg = document.getElementById('toast').textContent; }
    res.push(`collected by the plane from above: ${byPlane}; collected by the sub ${got} of ${W.finds.length}; saved ${Object.keys(b.save.finds).length}; points gained ${b.save.points - pts0}`);
    res.push(`treasure map: unlockAll ${b.save.unlockAll}, planes locked before ${lockedBefore}, last toast "${mapMsg.slice(0, 60)}"`); }
  b.setState('menu'); document.getElementById('mHangar').click(); const names = []; for (let i = 0; i < 10; i++) { document.getElementById('hNext').click(); if (document.getElementById('hPick').textContent === 'Locked') names.push(document.getElementById('hName').textContent); }
  document.querySelector('#hangar button.x').click(); res.push(`hangar after the treasure map: locked planes ${names.length}; sky back after leaving for the menu: under=${b.W.under} sub=${G.sub}`);
  document.getElementById('mSpots').click(); res.push(`spots and finds list rows ${document.querySelectorAll('#spotList .spot').length}, done ${document.querySelectorAll('#spotList .spot.done').length}, menu count ${document.getElementById('mPads').textContent}`); document.querySelector('#spots button.x').click();
  // F. a new run does not bring found things back
  b.startRun('free', null); res.push(`new run after finding everything: finds left in the water ${b.W.finds.length}`);
  b.persist(); return res;
});
console.log(out.join('\n'));
await page.reload(); await page.waitForFunction(() => window.__buzz && __buzz.G.state === 'menu');
console.log('after reload: ' + await page.evaluate(() => { const s = __buzz.save; return `finds=${Object.keys(s.finds).length} unlockAll=${s.unlockAll} points=${s.points > 0} seaPads=${Object.keys(s.pads).filter((k) => k.startsWith('raft')).length} divePads=${Object.keys(s.pads).filter((k) => k.startsWith('dive')).length} menu "${document.getElementById('mBest').textContent.split(' · ').slice(0, 2).join(' · ')}"`; }));
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
