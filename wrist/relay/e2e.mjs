// End-to-end relay check: a listening page must receive what the watch posts.
// Usage: node e2e.mjs <base-url>
import WebSocket from 'ws';
const base = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/+$/, '');
const code = String(100000 + Math.floor(Math.random() * 900000));
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' · ' + extra : '')); };
const post = (c, o) => fetch(base + '/e/' + c, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o) }).then(r => r.json().then(j => ({ status: r.status, j })));

const h = await fetch(base + '/health').then(r => r.json());
check('health answers', h.ok === true, JSON.stringify(h));
const page = await fetch(base + '/').then(r => r.text());
check('X page is served', page.includes('<title>X · wrist practice</title>'), page.length + ' bytes');
check('bad code is refused', (await fetch(base + '/e/12', { method: 'POST', body: '{}' })).status === 404);

const got = [], other = [];
const ws = new WebSocket(base.replace(/^http/, 'ws') + '/s/' + code);
const ws2 = new WebSocket(base.replace(/^http/, 'ws') + '/s/' + (code === '555555' ? '555556' : '555555'));
ws.on('message', d => got.push(String(d)));
ws2.on('message', d => other.push(String(d)));
await Promise.all([new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); }), new Promise((res, rej) => { ws2.on('open', res); ws2.on('error', rej); })]);
check('page connects', true);
const t0 = Date.now();
const r1 = await post(code, { t: 'swipe', d: 'left', seq: 1 });
check('watch post accepted, one page listening', r1.status === 200 && r1.j.pages === 1, JSON.stringify(r1.j));
await post(code, { t: 'tap', seq: 2 });
await post(code, { t: 'scroll', r: 3, seq: 3 });
await new Promise(r => setTimeout(r, 1200));
check('page received all three, in order', got.length === 3 && got.map(x => JSON.parse(x).seq).join() === '1,2,3', got.join(' | '));
check('another code heard nothing', other.length === 0);
ws.send('ping');
await new Promise(r => setTimeout(r, 600));
check('ping answered', got.includes('pong'));
await new Promise(r => setTimeout(r, 1500));
const log = await fetch(base + '/log').then(r => r.text());
const mine = log.split('\n').filter(l => l.includes('****' + code.slice(-2) + ' '));
check('log holds all three events with the code masked', ['"seq":1', '"seq":2', '"seq":3'].every(k => mine.some(l => l.includes(k))) && !log.includes(code), mine.length + ' lines for this code');
console.log('round trip for first post: ' + (Date.now() - t0) + ' ms total incl. waits');
ws.close(); ws2.close();
console.log(fails ? fails + ' relay checks FAILED' : 'all relay checks passed');
setTimeout(() => process.exit(fails ? 1 : 0), 300);
