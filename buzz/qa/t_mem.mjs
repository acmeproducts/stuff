import { open } from './run.mjs';
const { page, errors, close } = await open({});
const rows = [];
for (let i = 0; i < 7; i++) {
  await page.evaluate(() => { const b = __buzz; b.startRun('free', null); b.setState('menu'); });
  await page.waitForTimeout(1300);
  rows.push(await page.evaluate(() => { const i = __buzz.renderer.info; return `${i.memory.geometries}/${i.memory.textures}/${i.programs.length}`; }));
}
console.log('geometries/textures/programs per rebuild: ' + rows.join('  '));
const kd = await page.evaluate(() => { const b = __buzz; b.startRun('free', null); b.G.unbanked = 300; for (let i = 0; i < 80; i++) b.stepSim(1 / 60); b.P.inv = 0; b.damage(500); for (let i = 0; i < 5; i++) b.stepSim(1 / 60); return `knock down: downs ${b.G.downs}, health ${Math.round(b.G.health)}, unbanked ${b.G.unbanked}, state ${b.ui()}`; });
console.log(kd);
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
