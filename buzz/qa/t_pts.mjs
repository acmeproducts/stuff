// 1.5.0: the points counter on screen, and points spent on a higher top speed
import { open } from './run.mjs';
const { page, errors, close } = await open({});
const txt = (id) => page.evaluate((i) => { const e = document.getElementById(i); return e ? e.textContent : 'MISSING'; }, id);
await page.evaluate(() => { const b = __buzz; b.save.points = 0; b.save.speedLv = 0; b.save.upDives = false; b.startRun('free', null); });
await page.waitForTimeout(400);
console.log(`counter at the start: "${await txt('sBank')}" label "${await page.evaluate(() => document.querySelector('#score small').textContent)}"`);
// land on a spot: +500 must show as a gain and the counter must climb to it, not jump
await page.evaluate(() => { const b = __buzz, P = b.P, pad = b.W.pads.find((p) => p.id === 'plaza'); b.setThrottle(0.2, true); P.pos.set(pad.x, pad.y + 1.4, pad.z + 10); P.yaw = 0; P.pitch = 0; P.speed = 5; let t = 0; while (!P.landed && t < 8) { b.stepSim(1 / 60); t += 1 / 60; } });
const seen = []; for (let i = 0; i < 30; i++) { seen.push(+(await txt('sBank')).replace(/\D/g, '')); await page.waitForTimeout(150); }
const gain = await txt('gain'); const uniq = [...new Set(seen)];
console.log(`after a +500 landing: gain shown "${gain}", counter passed through ${uniq.length > 2 ? 'several values' : 'NO steps'} and ended at ${seen[seen.length - 1]}, never above 500 ${Math.max(...seen) <= 500}, never went down ${seen.every((v, i) => !i || v >= seen[i - 1])}`);
const out = await page.evaluate(async () => {
  const b = window.__buzz, G = b.G, P = b.P, res = []; const step = (s) => { for (let i = 0; i < Math.round(s * 60); i++) b.stepSim(1 / 60); };
  if (!b.speedCost) return ['no speed upgrades'];
  const topSpeed = (thr) => { b.takeOff(); P.landed = null; P.lockT = 9; b.setThrottle(thr, true); P.pos.set(0, 120, 300); P.yaw = Math.PI; P.pitch = 0; b.input.x = b.input.y = 0; for (let i = 0; i < 600; i++) { P.pos.set(0, 120, 300); P.pitch = 0; b.stepSim(1 / 60); } return P.speed; };
  const v50a = topSpeed(0.5), v60a = topSpeed(0.6), v100a = topSpeed(1);
  res.push(`level 0: wallet ${b.wallet()}, top ${Math.round(b.speedTop() * 100)}%, next costs ${b.speedCost(1)}, can buy with 500 ${b.wallet() >= b.speedCost(1)}`);
  b.save.points = 499; const no = b.buySpeed(1); b.save.points = 1700; const yes = b.buySpeed(1); const w1 = b.wallet(); const lv1 = b.save.speedLv;
  const v50b = topSpeed(0.5), v60b = topSpeed(0.6), v100b = topSpeed(1);
  res.push(`buy with 499 points ${no}; buy with 1700 points ${yes}: level ${lv1}, wallet ${w1}, top ${Math.round(b.speedTop() * 100)}%`);
  res.push(`lever 50% ${(v50a * 3.6).toFixed(0)} -> ${(v50b * 3.6).toFixed(0)} km/h, lever 60% ${(v60a * 3.6).toFixed(0)} -> ${(v60b * 3.6).toFixed(0)} km/h, lever 100% ${(v100a * 3.6).toFixed(0)} -> ${(v100b * 3.6).toFixed(0)} km/h; lower part of the lever unchanged ${Math.abs(v50a - v50b) < 0.05 && Math.abs(v60a - v60b) < 0.05}; top faster by ${((v100b / v100a - 1) * 100).toFixed(1)}%`);
  const back = b.buySpeed(-1); res.push(`step back refunds: ${back}, level ${b.save.speedLv}, wallet ${b.wallet()}`);
  b.save.points = 5200; const n = b.buySpeed(99); res.push(`buy all with 5200 points: bought ${n} steps, level ${b.save.speedLv}, wallet ${b.wallet()}, top ${Math.round(b.speedTop() * 100)}%`);
  b.save.points = 9e6; b.buySpeed(99); const maxLv = b.save.speedLv; const more = b.buySpeed(1); const vmax = topSpeed(1); let bad = 0, nan = 0, rs = 5; const rnd = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };
  P.pos.set(0, 30, 82); P.yaw = 0; b.setThrottle(1, true); for (let i = 0; i < 5400; i++) { if (i % 30 === 0) { b.input.x = rnd() * 2 - 1; b.input.y = (rnd() * 2 - 1) * 0.6; } b.stepSim(1 / 60); if (!isFinite(P.pos.x + P.pos.y + P.pos.z)) { nan++; break; } if (b.W.solid(P.pos.x, P.pos.y, P.pos.z, 0.05)) bad++; } b.input.x = b.input.y = 0;
  res.push(`unlimited points: stops at level ${maxLv}, one more ${more}, top ${Math.round(b.speedTop() * 100)}% = ${(vmax * 3.6).toFixed(0)} km/h; 90 s of random flight flat out at that speed: inside something solid ${bad}, NaN ${nan}`);
  // the sub gets the same share of extra speed
  b.buySpeed(-99); b.save.points = 0; P.lockT = 0; b.enterSub(b.DIVE_SITES[0]); b.setThrottle(1, true); P.pitch = 0; for (let i = 0; i < 240; i++) { P.pos.y = b.SEA - 6; P.pos.x = b.DIVE_SITES[0].x + 16; P.pos.z = b.DIVE_SITES[0].z; b.stepSim(1 / 60); } const s0 = P.speed; b.save.points = 1e5; b.buySpeed(5); for (let i = 0; i < 240; i++) { P.pos.y = b.SEA - 6; P.pos.x = b.DIVE_SITES[0].x + 16; P.pos.z = b.DIVE_SITES[0].z; b.stepSim(1 / 60); } res.push(`sub flat out: ${(s0 * 3.6).toFixed(0)} km/h at level 0, ${(P.speed * 3.6).toFixed(0)} km/h at level 5`);
  b.exitSub(); b.buySpeed(-99); b.save.points = 3000; b.buySpeed(2); b.persist(); b.setState('menu'); return res;
});
console.log(out.join('\n'));
// the screen: Settings -> Top speed, X in the top right, back to Settings; the buttons do what the functions do
await page.evaluate(() => __buzz.startRun('free', null)); await page.evaluate(() => __buzz.openModal('quick'));
await page.click('#qSpeed', { timeout: 4000 }).catch(() => { });
const ui = await page.evaluate(() => { const m = document.getElementById('speed'); if (!m) return 'no speed modal'; const x = m.querySelector('button.x'), c = m.querySelector('.card'); const xr = x.getBoundingClientRect(), cr = c.getBoundingClientRect(); return `opened=${__buzz.ui() === 'speed'} xTopRight=${xr.right <= cr.right && xr.top - cr.top < 20 && cr.right - xr.right < 20}`; });
const before = await page.evaluate(() => [__buzz.save.speedLv, __buzz.wallet()]);
await page.click('#spPlus', { timeout: 4000 }).catch(() => { }); const plus = await page.evaluate(() => [__buzz.save.speedLv, __buzz.wallet()]);
await page.click('#spMinus', { timeout: 4000 }).catch(() => { }); await page.click('#spMinus', { timeout: 4000 }).catch(() => { }); const minus = await page.evaluate(() => [__buzz.save.speedLv, __buzz.wallet()]);
await page.click('#spMax', { timeout: 4000 }).catch(() => { }); const mx = await page.evaluate(() => [__buzz.save.speedLv, __buzz.wallet()]);
const shown = await txt('spNow'); await page.click('#speed button.x', { timeout: 4000 }).catch(() => { });
console.log(`top speed screen: ${ui} back=${await page.evaluate(() => __buzz.ui())}; start level ${before[0]} wallet ${before[1]}; plus -> ${plus.join('/')}; minus twice -> ${minus.join('/')}; max -> ${mx.join('/')}; shows "${shown}"; lever label "${await page.evaluate(() => document.querySelector('#thr .tl').textContent)}"`);
await page.reload(); await page.waitForFunction(() => window.__buzz && __buzz.G.state === 'menu');
console.log('after reload: ' + await page.evaluate(() => `level ${__buzz.save.speedLv} wallet ${__buzz.wallet()} top ${Math.round(__buzz.speedTop() * 100)}% menu "${document.getElementById('mBest').textContent.split(' · ').slice(0, 2).join(' · ')}"`));
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
