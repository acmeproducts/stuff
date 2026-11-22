// real touch input through every screen; every modal must close with its X (top right)
import { open } from './run.mjs';
const { page, errors, close } = await open({ touch: true, viewport: { width: 915, height: 412 }, dpr: 2 });
const log = []; const ui = () => page.evaluate(() => __buzz.ui());
const xOk = (id) => page.evaluate((id) => { const m = document.getElementById(id), c = m.querySelector('.card').getBoundingClientRect(), x = m.querySelector('button.x').getBoundingClientRect(); return x.width >= 36 && c.right - x.right < 16 && x.top - c.top < 16 && x.top >= 0; }, id);
const tapX = async (id) => { const ok = await xOk(id); await page.tap(`#${id} button.x`); await page.waitForTimeout(120); return ok; };
await page.evaluate(() => { const b = __buzz; b.save.season = 'summer'; b.save.tod = 'day'; b.save.weather = 'clear'; b.applyEnv(); b.setState('menu'); });
await page.waitForTimeout(500); await page.screenshot({ path: 'shots/ui_1_menu.png' });
// menu modals
for (const [btn, id] of [['mMissions', 'missions'], ['mHangar', 'hangar'], ['mSpots', 'spots'], ['mEnv', 'envm'], ['mSet', 'quick']]) {
  await page.tap('#' + btn); await page.waitForTimeout(150); const opened = await ui();
  if (id === 'spots') await page.screenshot({ path: 'shots/ui_2_spots.png' }); if (id === 'quick') await page.screenshot({ path: 'shots/ui_2_settings.png' });
  const ok = await tapX(id); log.push(`menu ${id}: opened=${opened === id} xTopRight=${ok} closed=${(await ui()) === 'menu'}`);
}
await page.tap('#mMissions'); await page.tap('#misList .mis:nth-child(1)'); log.push('brief -> ' + await ui());
log.push('brief X back to ' + (await tapX('brief'), await ui())); await page.tap('#misList .mis:nth-child(1)');
await page.tap('#brGo'); await page.waitForTimeout(1200); log.push('start -> ' + await ui()); await page.screenshot({ path: 'shots/ui_4_play.png' });
// stick + speed lever together
const cdp = await page.context().newCDPSession(page);
const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
const touch2 = (type, pts, timestamp) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts, timestamp });
const thr = await page.evaluate(() => { const r = document.getElementById('thr').getBoundingClientRect(); return { x: r.left + r.width / 2, top: r.top, h: r.height }; });
await touch('touchStart', [{ x: 200, y: 250, id: 1 }]); await touch('touchMove', [{ x: 250, y: 215, id: 1 }]); await page.waitForTimeout(300);
log.push('stick input ' + JSON.stringify(await page.evaluate(() => ({ x: +__buzz.input.x.toFixed(2), y: +__buzz.input.y.toFixed(2) }))));
await touch('touchStart', [{ x: 250, y: 215, id: 1 }, { x: thr.x, y: thr.top + thr.h * 0.25, id: 2 }]); await page.waitForTimeout(200);
log.push('lever while steering thr=' + await page.evaluate(() => __buzz.input.thr.toFixed(2) + ' x=' + __buzz.input.x.toFixed(2)));
await touch('touchMove', [{ x: 250, y: 215, id: 1 }, { x: thr.x, y: thr.top + thr.h - 6, id: 2 }]); await page.waitForTimeout(200);
log.push('lever bottom glide=' + await page.evaluate(() => (__buzz.input.thr === 0) + ' saved=' + __buzz.save.throttle));
await page.screenshot({ path: 'shots/ui_5_stick.png' });
await touch('touchMove', [{ x: 250, y: 215, id: 1 }, { x: thr.x, y: thr.top + thr.h * 0.5, id: 2 }]); await touch('touchEnd', []); await page.waitForTimeout(200);
log.push('after all up x=' + await page.evaluate(() => __buzz.input.x + ' thr=' + __buzz.input.thr.toFixed(2)));
await page.tap('#map'); await page.waitForTimeout(500); log.push('map big ' + await page.evaluate(() => __buzz.G.mapBig)); await page.screenshot({ path: 'shots/ui_6_map.png' }); await page.tap('#map');
await page.tap('#btnPulse'); await page.waitForTimeout(150); log.push('pulse cd ' + await page.evaluate(() => __buzz.G.pulseCD.toFixed(1)));
// double tap opens the quick menu; a single tap does not
await page.touchscreen.tap(420, 230); await page.waitForTimeout(600); log.push('single tap -> ' + await ui());
{ // two taps 120 ms apart; explicit event times, because this software-rendered lab takes over a second per dispatch
  const t0 = Date.now() / 1000;
  await touch2('touchStart', [{ x: 420, y: 230, id: 7 }], t0); await touch2('touchEnd', [], t0 + 0.03); await touch2('touchStart', [{ x: 424, y: 232, id: 8 }], t0 + 0.12); await touch2('touchEnd', [], t0 + 0.15);
  await page.waitForTimeout(250); log.push('double tap -> ' + await ui() + ' ; switches untouched=' + await page.evaluate(() => __buzz.save.sound === true && __buzz.save.upDives === true && __buzz.save.fps === true && __buzz.input.thr > 0.1)); await page.waitForTimeout(500); }
await page.screenshot({ path: 'shots/ui_7_quick.png' });
for (const [btn, id] of [['qEnv', 'envm'], ['qPlanes', 'hangar'], ['qSpots', 'spots'], ['qMissions', 'missions']]) {
  await page.tap('#' + btn); await page.waitForTimeout(200); const opened = await ui(); if (id === 'hangar') { await page.tap('#hNext'); await page.tap('#hNext'); await page.waitForTimeout(700); await page.screenshot({ path: 'shots/ui_8_hangar.png' }); await page.tap('#hPick'); }
  if (id === 'envm') { await page.tap('#envm [data-env="weather"]'); await page.screenshot({ path: 'shots/ui_8_env.png' }); }
  const ok = await tapX(id); log.push(`quick ${id}: opened=${opened === id} xTopRight=${ok} back=${await ui()}`);
}
log.push('locked plane not taken: plane ' + await page.evaluate(() => __buzz.save.plane) + ' weather ' + await page.evaluate(() => __buzz.save.weather));
// switches
await page.tap('#rowGlide'); log.push('glide switch thr=' + await page.evaluate(() => __buzz.input.thr)); await page.tap('#rowGlide'); log.push('glide off thr=' + await page.evaluate(() => __buzz.input.thr.toFixed(2)));
log.push('quick X -> ' + (await tapX('quick'), await ui()));
await page.tap('#btnPause'); log.push('pause button -> ' + await ui()); await tapX('quick');
await page.evaluate(() => { const b = __buzz; b.G.counts.car = 30; b.finishMission(); });
await page.waitForTimeout(200); log.push('result -> ' + await ui() + ' timed ' + await page.evaluate(() => !!__buzz.save.times.m1 && __buzz.save.times.m1.runs === 1)); await page.screenshot({ path: 'shots/ui_9_result.png' });
await page.tap('#rNext'); log.push('next -> ' + await ui() + ' ' + await page.evaluate(() => document.getElementById('brName').textContent)); await tapX('brief'); log.push('brief X -> ' + await ui());
await page.evaluate(() => { const b = __buzz; b.startRun('mission', b.MISSIONS[0]); b.finishMission(); }); log.push('result X -> ' + (await tapX('result'), await ui()));
await page.tap('#mEscape'); log.push('escape -> ' + await ui() + ' ' + await page.evaluate(() => document.getElementById('brName').textContent));
await page.tap('#brGo'); await page.waitForTimeout(1200); await page.screenshot({ path: 'shots/ui_10_escape.png' });
await page.reload(); await page.waitForFunction(() => window.__buzz && __buzz.G.state === 'menu');
log.push('after reload runs ' + await page.evaluate(() => __buzz.save.times.m1.runs) + ' menu ' + await page.evaluate(() => document.getElementById('mStars').textContent));
console.log(log.join('\n'));
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
