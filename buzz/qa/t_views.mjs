import { open } from './run.mjs';
const tag = process.argv[2] || 'day';
const envs = { day: ['summer', 'day', 'clear'], night: ['autumn', 'night', 'clear'], rain: ['spring', 'day', 'rain'], snow: ['winter', 'day', 'snow'], dusk: ['autumn', 'dusk', 'windy'], fog: ['winter', 'dawn', 'fog'] };
const only = process.argv[3];
const { page, errors, close } = await open({ viewport: { width: 915, height: 412 } });
const [season, tod, weather] = envs[tag];
await page.evaluate(([season, tod, weather]) => { const b = window.__buzz; b.save.season = season; b.save.tod = tod; b.save.weather = weather; b.save.fps = true; b.startRun('free', null); }, [season, tod, weather]);
const shot = async (name, pos, yaw, pitch, pre) => {
  if (only && !name.includes(only)) return;
  await page.evaluate(([pos, yaw, pitch, pre]) => {
    const b = window.__buzz; b.P.pos.set(pos[0], pos[1], pos[2]); b.P.yaw = yaw; b.P.pitch = pitch || 0; b.P.speed = 0.0001; b.P.def = Object.assign({}, b.P.def, { spd: 0.0001 });
    if (pre) (0, eval)(pre);
  }, [pos, yaw, pitch, pre]);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `shots/${tag}_${name}.png` });
};
// world layout: office x[-20,20] z[-62,-22]; garage x[-74,-10] z[12,46]; hotel x[8,68] z[14,42]
await shot('1_over', [0, 34, 96], 0, -0.25);
await shot('2_plaza', [0, 6, 30], 0, 0.1);
await shot('3_garage_l1', [-66, 4.6, 20.7], -Math.PI / 2, 0);
await shot('4_garage_ramp', [-58, 1.4, 29], -Math.PI / 2, 0.1);
await shot('5_office_floor', [-15, 12.4, -57], -2.4, 0);
await shot('6_office_atrium', [0, 3, -48], 0.4, 0.9);
await shot('7_hotel_corr', [12, 11.3, 24], -Math.PI / 2, 0);
await shot('8_hotel_lobby', [38, 1.6, 40], 0.5, 0.1);
await shot('9_hotel_out', [38, 10, 70], 0, 0);
console.log('errors:', errors.filter((e) => !e.includes('ReadPixels')).join('\n') || 'none');
await close();
