import { open } from './run.mjs';
const { page, errors, close } = await open({});
const out = await page.evaluate(async () => {
  const b = window.__buzz; const res = { escape: [], fuzz: [], build: [] }; b.save.upDives = false;
  // ---- A. hotel escape reachability by flood fill (0.5 m voxels, 0.34 m clearance), several seeds per mission
  const flood = (W, start, B) => {
    const S = 0.5, x0 = B.x0 - 3, z0 = B.z0 - 3, y0 = 0.25; const nx = Math.ceil((B.x1 - B.x0 + 6) / S), nz = Math.ceil((B.z1 - B.z0 + 6) / S), ny = Math.ceil((B.y1 + 2) / S);
    const seen = new Int32Array(nx * ny * nz).fill(-1); const id = (i, j, k) => (j * nz + k) * nx + i;
    const si = Math.round((start.x - x0) / S), sj = Math.round((start.y - y0) / S), sk = Math.round((start.z - z0) / S);
    const q = new Int32Array(nx * ny * nz); let qh = 0, qt = 0; q[qt++] = id(si, sj, sk); seen[id(si, sj, sk)] = 0;
    let best = -1;
    while (qh < qt) {
      const c = q[qh++]; const i = c % nx, r = (c - i) / nx, k = r % nz, j = (r - k) / nz; const d = seen[c];
      const x = x0 + i * S, y = y0 + j * S, z = z0 + k * S;
      if (x < B.x0 - 1.6 || x > B.x1 + 1.6 || z < B.z0 - 1.6 || z > B.z1 + 1.6 || y > B.y1 + 1.6) { best = d; break; }
      for (const [a, bb, cc] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
        const ii = i + a, jj = j + bb, kk = k + cc; if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz) continue;
        const n = id(ii, jj, kk); if (seen[n] >= 0) continue;
        if (W.solid(x0 + ii * S, y0 + jj * S, z0 + kk * S, 0.34)) { seen[n] = 1e9; continue; }
        seen[n] = d + 1; q[qt++] = n;
      }
    }
    return best < 0 ? null : best * S;
  };
  for (const id of ['m3', 'm7', 'm11']) {
    const m = b.MISSIONS.find((q) => q.id === id);
    for (let n = 0; n < 6; n++) {
      const t0 = performance.now(); b.startRun('mission', m); const bt = performance.now() - t0;
      const W = b.W; const B = W.buildings.find((q) => q.kind === 'hotel');
      const dist = flood(W, b.P.pos, B);
      res.escape.push({ id, n, dist, buildMs: Math.round(bt), startSolid: W.solid(b.P.pos.x, b.P.pos.y, b.P.pos.z, 0.3), fire: B.fire.length, exits: W.exits.filter((e) => e.B === B).length });
    }
  }
  // ---- B. fuzz flight: random stick for a long time in each building; must never end up inside a solid or NaN
  for (const kind of ['garage', 'office', 'hotel', 'free']) {
    b.startRun('free', null); const W = b.W; const P = b.P;
    if (kind !== 'free') { const B = W.buildings.find((q) => q.kind === kind); const s = kind === 'hotel' ? B.deep(3) : B.spawn(); P.pos.set(s.x, s.y, s.z); P.yaw = s.yaw; }
    let bad = 0, nan = 0, maxStep = 0, minY = 99, tr = 0, inside = 0; let rs = 12345;
    const rnd = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };
    const prev = P.pos.clone();
    for (let i = 0; i < 9000; i++) {
      if (i % 25 === 0) { b.input.x = rnd() * 2 - 1; b.input.y = (rnd() * 2 - 1) * (rnd() < 0.5 ? 0.3 : 1); b.input.turbo = rnd() < 0.3; }
      b.G.health = 100; b.stepSim(1 / 60);
      if (!isFinite(P.pos.x + P.pos.y + P.pos.z + P.yaw + P.pitch)) { nan++; break; }
      if (W.solid(P.pos.x, P.pos.y, P.pos.z, 0.12) && !P.landed) bad++;
      maxStep = Math.max(maxStep, P.pos.distanceTo(prev)); prev.copy(P.pos); minY = Math.min(minY, P.pos.y); if (P.loc) inside++;
    }
    b.input.x = b.input.y = 0; b.input.turbo = false;
    res.fuzz.push({ kind, bad, nan, maxStep: +maxStep.toFixed(2), minY: +minY.toFixed(2), insideFrames: inside, havoc: b.G.unbanked + b.G.banked, counts: JSON.stringify(b.G.counts), lit: b.G.lit, state: b.ui() });
  }
  // ---- C. world stats
  const W = b.W; res.build = { boxes: W.instCount, colliders: W.cf.length, reactives: W.reactives.length, perBuilding: W.buildings.map((B) => ({ k: B.kind, floors: B.floors, react: B.rTot.join(',') })), exits: W.exits.length };
  return res;
});
console.log(JSON.stringify(out, null, 1));
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
