import { open } from './run.mjs';
const portrait = process.argv[2] === 'portrait';
const { page, errors, close } = await open({ touch: true, viewport: portrait ? { width: 412, height: 915 } : { width: 915, height: 412 }, dpr: 1 });
await page.evaluate(() => { const b = __buzz; b.save.season = 'autumn'; b.save.tod = 'day'; b.save.weather = 'clear'; b.applyEnv(); b.setState('menu'); });
if (portrait) { await page.waitForTimeout(500); await page.screenshot({ path: 'shots/p_menu.png' }); }
await page.tap('#mFly'); await page.waitForTimeout(300);
const fly = async (name, secs, x, y, turbo) => {
  await page.evaluate(([secs, x, y, turbo]) => { const b = __buzz; b.input.x = x; b.input.y = y; b.input.turbo = turbo; const n = Math.round(secs * 60); for (let i = 0; i < n; i++) { b.G.health = 100; b.stepSim(1 / 60); } b.updateCamera(0, true); }, [secs, x, y, turbo]);
  await page.waitForTimeout(700); await page.screenshot({ path: `shots/${portrait ? 'p_' : ''}fly_${name}.png` });
  return page.evaluate(() => { const b = __buzz; return `${b.P.pos.x.toFixed(0)},${b.P.pos.y.toFixed(0)},${b.P.pos.z.toFixed(0)} loc=${b.P.loc ? b.P.loc.B.kind + b.P.loc.f : 'out'} havoc=${b.G.unbanked} banked=${b.G.banked} heat=${b.G.heat} drones=${b.drones.filter((d) => d.state !== 'off').length}`; });
};
console.log(await fly('1_start', 1.0, 0, 0, false));
console.log(await fly('2_dive', 2.2, 0, -0.55, false));
console.log(await fly('3_level', 2.0, 0, 0, true));
console.log(await fly('4_bankR', 0.5, 0.9, 0, false));
console.log(await fly('5_toHotel', 2.4, 0, -0.1, false));
console.log(await fly('6', 2.0, 0, 0, false));
console.log(await fly('7', 2.0, 0.3, 0, false));
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
