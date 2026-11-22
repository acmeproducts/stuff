// an autopilot flies each hotel escape with the real flight model, to prove the routes are flyable and to size the star times
import { open } from './run.mjs';
const { page, errors, close } = await open({});
const out = await page.evaluate(async () => {
  const b = window.__buzz; const res = []; b.save.upDives = false;
  const plan = (W, start, B, clr) => {
    const S = 0.5, x0 = B.x0 - 4, z0 = B.z0 - 4, y0 = 0.25; const nx = Math.ceil((B.x1 - B.x0 + 8) / S), nz = Math.ceil((B.z1 - B.z0 + 8) / S), ny = Math.ceil((B.y1 + 2) / S);
    const par = new Int32Array(nx * ny * nz).fill(-2); const id = (i, j, k) => (j * nz + k) * nx + i;
    const s0 = id(Math.round((start.x - x0) / S), Math.round((start.y - y0) / S), Math.round((start.z - z0) / S));
    const q = new Int32Array(nx * ny * nz); let qh = 0, qt = 0; q[qt++] = s0; par[s0] = -1;
    const pos = (c) => { const i = c % nx, r = (c - i) / nx, k = r % nz, j = (r - k) / nz; return [x0 + i * S, y0 + j * S, z0 + k * S, i, j, k]; };
    while (qh < qt) {
      const c = q[qh++]; const [x, y, z, i, j, k] = pos(c);
      if (x < B.x0 - 2.5 || x > B.x1 + 2.5 || z < B.z0 - 2.5 || z > B.z1 + 2.5) { const path = []; let n = c; while (n >= 0) { const p = pos(n); path.push([p[0], p[1], p[2]]); n = par[n]; } return path.reverse(); }
      for (const [a, bb, cc] of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0],[0,-1,0]]) {
        const ii = i + a, jj = j + bb, kk = k + cc; if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz) continue;
        const n = id(ii, jj, kk); if (par[n] !== -2) continue;
        if (W.solid(x0 + ii * S, y0 + jj * S, z0 + kk * S, clr)) { par[n] = -3; continue; }
        par[n] = c; q[qt++] = n;
      }
    }
    return null;
  };
  for (const id of ['m3', 'm7', 'm11']) {
    const m = b.MISSIONS.find((q) => q.id === id); const times = [];
    for (let n = 0; n < 8; n++) {
      b.startRun('mission', m); const W = b.W, P = b.P; const B = W.buildings.find((q) => q.kind === 'hotel');
      const path = plan(W, P.pos, B, 0.6) || plan(W, P.pos, B, 0.45) || plan(W, P.pos, B, 0.34);
      if (!path) { times.push('NOPATH'); continue; }
      let pi = 0, t = 0, hits = 0, lastH = 100; const tv = P.pos.clone();
      while (b.ui() === 'play' && t < 150) {
        // advance along the path to the point ~2.2 m ahead
        while (pi < path.length - 1 && Math.hypot(path[pi][0] - P.pos.x, path[pi][1] - P.pos.y, path[pi][2] - P.pos.z) < 1.4) pi++;
        // aim at the furthest path point within 5 m that is in clear view
        let ti = pi; tv.set(0, 0, 0);
        for (let k = pi + 1; k < Math.min(path.length, pi + 12); k++) { tv.set(path[k][0], path[k][1], path[k][2]); if (tv.distanceTo(P.pos) > 5 || !W.clearLine(P.pos, tv, 0.33)) break; ti = k; }
        const tg = path[ti]; if (ti - 3 > pi) pi = ti - 3; const dx = tg[0] - P.pos.x, dy = tg[1] - P.pos.y, dz = tg[2] - P.pos.z; const dh = Math.hypot(dx, dz);
        const wantYaw = Math.atan2(-dx, -dz); let e = wantYaw - P.yaw; e = Math.atan2(Math.sin(e), Math.cos(e));
        b.input.x = dh > 0.4 ? Math.max(-1, Math.min(1, -e * 2.2)) : 0;
        b.input.y = Math.max(-1, Math.min(1, Math.atan2(dy, Math.max(dh, 0.3)) / 1.2 * 1.3));
        b.input.turbo = false;
        b.stepSim(1 / 60); t += 1 / 60;
        if (b.G.health < lastH) hits++; lastH = b.G.health;
      }
      b.input.x = b.input.y = 0;
      times.push(b.G.escaped ? `${b.G.elapsed.toFixed(0)}s/${hits}hit/${path.length / 2 | 0}m` : `FAIL(t=${t.toFixed(0)} hp=${b.G.health | 0} at ${P.pos.x | 0},${P.pos.y | 0},${P.pos.z | 0})`);
      b.setState('menu');
    }
    res.push(id + ': ' + times.join('  '));
  }
  // clean starts: no impact in the first second of any mission
  const starts = [];
  for (const m of b.MISSIONS) { let bad = 0; for (let n = 0; n < 6; n++) { b.startRun('mission', m); const y0 = b.P.yaw; for (let i = 0; i < 70; i++) b.stepSim(1 / 60); if (b.G.health < 100 || Math.abs(b.P.yaw - y0) > 0.01) bad++; } starts.push(m.id + ':' + bad); }
  res.push('bad starts of 6 -> ' + starts.join(' '));
  return res;
});
console.log(out.join('\n'));
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
