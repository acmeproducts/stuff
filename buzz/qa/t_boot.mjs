import { open } from './run.mjs';
const { page, errors, close } = await open({ query: '?debug=1' });
const st = await page.evaluate(() => window.__buzz ? { state: __buzz.G.state, boxes: __buzz.W && __buzz.W.instCount, col: __buzz.W && __buzz.W.cf.length, react: __buzz.W && __buzz.W.reactives.length, env: __buzz.env && __buzz.env.label } : null);
console.log('state', JSON.stringify(st));
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/menu.png' });
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await close();
