/* Lab check for signals.lib.js alone: made-up hands, heads and watch numbers go in; learned signals and fires come out.
   Usage: node signals-check.js */
'use strict';
const mem = {};
global.window = {}; global.location = { search: '' };
global.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
global.performance = { now: () => 0 };
require('./signals.lib.js');
const S = global.window.Signals, Synth = require('./synth.js');

let fails = 0;
function check(name, ok, extra) { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra === undefined || extra === '' ? '' : ' · ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)))); }
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* ---- the numbers ---- */
const N = o => { const h = Synth.hand(o); return S.handNumbers(h.lm, h.wl); };
let n = N({});
check('open hand: every finger reads straight', ['curlT', 'curlI', 'curlM', 'curlR', 'curlP'].every(k => n[k] < 0.1), n);
n = N({ curl: 1 });
check('fist: every finger reads folded', ['curlI', 'curlM', 'curlR', 'curlP'].every(k => n[k] > 0.9) && n.curlT > 0.4, n);
n = N({ curl: [1, 0, 1, 1, 1] });
check('pointing: index straight, the rest folded', n.curlI < 0.1 && n.curlM > 0.9 && n.curlP > 0.9, n);
check('pinch: thumb to index goes from far to touching', N({}).pinchI > 0.6 && N({ pinch: 1 }).pinchI < 0.05, [N({}).pinchI, N({ pinch: 1 }).pinchI]);
const a = N({ x: 0.3, y: 0.4, size: 0.15 }), b = N({ x: 0.7, y: 0.6, size: 0.25 });
check('moving the hand around the picture leaves its shape numbers alone', ['curlI', 'pinchI', 'palmZ', 'rollC'].every(k => near(a[k], b[k], 0.02)) && near(b.x - a.x, 0.4, 0.03) && b.size > a.size, [a.curlI, b.curlI]);
check('rolling the hand a quarter turn shows in the roll numbers only', near(Math.abs(N({ roll: 90 }).rollS), 1, 0.05) && near(N({ roll: 90 }).curlI, 0, 0.1), N({ roll: 90 }).rollS);
check('turning the palm over flips which way it faces', N({}).palmZ * N({ yaw: 180 }).palmZ < -0.5, [N({}).palmZ, N({ yaw: 180 }).palmZ]);
const H = o => { const f = Synth.face(o); return S.headNumbers(f.matrix, f.blend); };
let hn = H({ turn: 20, nod: -12, lean: 8, blend: { jawOpen: 0.8, mouthSmileLeft: 0.6, mouthSmileRight: 0.4 } });
check('head: turn, nod and lean come back in degrees', near(hn.turn, 20, 0.5) && near(hn.nod, -12, 0.5) && near(hn.lean, 8, 0.5), hn);
check('head: jaw and smile come back from 0 to 1', near(hn.jaw, 0.8, 0.01) && near(hn.smile, 0.5, 0.01), hn);

/* ---- teaching, as the Teach card does it: rest, then three showings ---- */
let clock = 1000;
const FPS = 15;
function frames(ms, numbersAt) { const out = []; for (let t = 0; t < ms; t += 1000 / FPS) out.push({ t: clock + t, n: numbersAt(t / ms) }); clock += ms; return out; }
function teach(src, rest, show) {
  const r = rest ? frames(1500, rest) : (clock += 1500, []), reps = [];
  for (let i = 0; i < 3; i++) { reps.push(frames(2200, show)); clock += 1200; }
  return S.learn(src, r, reps);
}
const heldAfter = (from, to) => f => N(f < 0.3 ? from : to);                 // goes there in the first third and stays
const outAndBack = (at, key, by) => f => { const o = Object.assign({}, at); o[key] = (at[key] || 0) + by * Math.sin(Math.PI * Math.min(1, f / 0.7)) * (f < 0.7 ? 1 : 0); return N(o); };
function play(src, ms, numbersAt) { frames(ms, numbersAt).forEach(fr => S.feed(src, fr.t, fr.n)); }
const fired = []; S.onFire(e => fired.push(e.name));
const count = name => fired.filter(x => x === name).length;

let g = teach('handR', () => N({}), heldAfter({}, { curl: 1 }));
check('a fist held three times is learned as a pose', g.kind === 'pose' && /curl/.test(g.why), g.why || g.error);
g.name = 'fist'; S.add(g);
g = teach('handR', () => N({}), heldAfter({}, { curl: [1, 0, 1, 1, 1] }));
check('pointing is learned as a different pose, with no collision warning', g.kind === 'pose' && !S.signals.some(s => S.collides(s, g)), g.why || g.error);
g.name = 'point'; S.add(g);
g = teach('handR', () => N({}), heldAfter({}, { curl: 0.95 }));
check('a second fist is flagged as looking like the first', g.kind === 'pose' && S.signals.filter(s => S.collides(s, g)).map(s => s.name).join() === 'fist', S.signals.filter(s => S.collides(s, g)).map(s => s.name));
g = teach('handR', () => N({}), outAndBack({ x: 0.5 }, 'x', 0.25));
check('a hand swept sideways and back is learned as a move', g.kind === 'move' && g.feat === 'x', g.why || g.error);
g.name = 'sweep'; S.add(g);
g = teach('handR', () => N({}), () => N({}));
check('showing nothing is refused in plain words', !!g.error && /doing nothing/.test(g.error), g.error);
g = teach('handL', null, () => N({ side: 'Left', curl: [0, 0, 0, 1, 1] }));
check('a hand that is out of the picture at rest can still teach a held shape', g.kind === 'pose' && /out of the picture/.test(g.why), g.why || g.error);
g.name = 'left two'; S.add(g);
g = teach('head', () => H({}), f => H({ nod: -18 * Math.sin(Math.PI * Math.min(1, f / 0.6)) * (f < 0.6 ? 1 : 0) }));
check('a nod and back is learned as a head move on the nod number', g.kind === 'move' && g.feat === 'nod' && g.dir === -1, g.why || g.error);
g.name = 'nod'; S.add(g);
g = teach('head', () => H({}), f => H({ blend: { browInnerUp: f < 0.25 ? 0 : 0.8 } }));
check('raised brows, held, is learned as a head pose made of the brows alone', g.kind === 'pose' && Object.keys(g.feats).join() === 'brows', g.feats && Object.keys(g.feats));
g.name = 'brows'; S.add(g);
const W = (tilt, roll, turn) => ({ tilt: tilt, rollS: Math.sin(roll * Math.PI / 180), rollC: Math.cos(roll * Math.PI / 180), turn: turn || 0 });
g = teach('watch', () => W(0, 0), f => W(f < 0.3 ? 0 : -45, 0));
check('the watch held tilted is learned as a watch pose', g.kind === 'pose' && g.src === 'watch', g.why || g.error);
g.name = 'wrist down'; S.add(g);
check('what was taught is kept on the device', JSON.parse(mem.x_signals).length === 7, Object.keys(mem));

/* ---- recognising ---- */
play('handR', 1200, () => N({})); fired.length = 0;
play('handR', 400, () => N({ curl: 1 }));
check('a fist shown for less than the hold time does not fire', count('fist') === 0, fired);
play('handR', 600, () => N({})); play('handR', 900, () => N({ curl: 1 }));
check('a fist held fires once, not once a frame', count('fist') === 1, fired);
play('handR', 800, () => N({ curl: 1, x: 0.3, y: 0.7, size: 0.26 }));
check('still held somewhere else in the picture: no second fire', count('fist') === 1, fired);
play('handR', 600, () => N({})); play('handR', 900, () => N({ curl: 1, roll: 40 }));
check('a fist rolled a little is still the fist', count('fist') === 2, fired);
check('pointing never fired while making fists', count('point') === 0, fired);
play('handR', 600, () => N({})); play('handR', 900, () => N({ curl: [1, 0, 1, 1, 1] }));
check('pointing fires pointing, and not the fist', count('point') === 1 && count('fist') === 2, fired);
play('handR', 1500, () => N({})); fired.length = 0;
play('handR', 1800, outAndBack({ x: 0.5 }, 'x', 0.25)); play('handR', 600, () => N({}));
check('the sweep fires once when it comes back', count('sweep') === 1, fired);
play('handR', 1800, outAndBack({ x: 0.5 }, 'x', -0.25)); play('handR', 600, () => N({}));
check('the same sweep the other way does not fire', count('sweep') === 1, fired);
play('handR', 1500, f => N({ x: 0.5 + 0.25 * Math.min(1, f * 3) })); play('handR', 3000, () => N({ x: 0.75 }));
check('moving the hand over and leaving it there does not fire the sweep', count('sweep') === 1, fired);
fired.length = 0; play('head', 1500, () => H({}));
play('head', 1200, f => H({ nod: -18 * Math.sin(Math.PI * f) })); play('head', 500, () => H({}));
check('a nod fires the nod', count('nod') === 1, fired);
play('head', 1500, f => H({ turn: 25 * Math.sin(Math.PI * f) })); play('head', 500, () => H({}));
check('shaking the head does not fire the nod', count('nod') === 1, fired);
play('head', 900, () => H({ blend: { browInnerUp: 0.85 }, turn: 12 }));
check('brows fire with the head turned a little, because the pose is the brows alone', count('brows') === 1, fired);
fired.length = 0; play('watch', 1000, () => W(0, 0)); play('watch', 900, () => W(-60, 0));
check('the watch tilted further than taught still counts', count('wrist down') === 1, fired);
play('watch', 700, () => W(0, 0)); play('watch', 900, () => W(0, 90));
check('the watch rolled instead does not', count('wrist down') === 1, fired);
clock += 5000; fired.length = 0;
play('handR', 300, () => N({ curl: 1 }));
check('a hand that comes back into view already in the pose still has to hold it', count('fist') === 0, fired);
play('handR', 400, () => N({ curl: 1 }));
check('and then fires', count('fist') === 1, fired);

/* ---- letters make words ---- */
const id = name => S.signals.filter(s => s.name === name)[0].id;
const word = S.add({ kind: 'combo', name: 'fist then nod', seq: [id('fist'), id('nod')], gap: 2500 });
const nodOnce = () => { play('head', 1500, () => H({})); play('head', 1200, f => H({ nod: -18 * Math.sin(Math.PI * f) })); play('head', 500, () => H({})); };
const fistOnce = () => { play('handR', 700, () => N({})); play('handR', 800, () => N({ curl: 1 })); play('handR', 300, () => N({})); };
fired.length = 0; play('head', 1500, () => H({}));
play('handR', 700, () => N({})); play('handR', 800, () => N({ curl: 1 })); play('head', 1200, f => H({ nod: -18 * Math.sin(Math.PI * f) })); play('head', 400, () => H({}));
check('a fist and then a nod fires the combination', count('fist then nod') === 1, fired);
fired.length = 0; nodOnce(); fistOnce();
check('the same two the other way round does not', count('fist then nod') === 0 && count('fist') === 1 && count('nod') === 1, fired);
fired.length = 0; fistOnce(); clock += 4000; nodOnce();
check('nor do they when too long passes between them', count('fist then nod') === 0, fired);

/* ---- one signal, one action ---- */
S.setAction(id('fist'), 'take'); S.setAction(id('nod'), 'next'); S.setAction(word.id, 'reset');
S.setAction(id('point'), 'take');
check('giving an action to a second signal takes it from the first', S.assign[id('point')] === 'take' && !S.assign[id('fist')] && S.assign[id('nod')] === 'next', S.assign);
let got = null; const off = S.onFire(e => { if (e.name === 'point') got = e; });
play('handR', 700, () => N({})); play('handR', 900, () => N({ curl: [1, 0, 1, 1, 1] })); off();
check('a fire carries the action it was given', got && got.action === 'take' && got.src === 'handR', got);
S.remove(id('fist'));
check('removing a signal removes the combinations made with it and their actions', !S.signals.some(s => s.kind === 'combo') && !S.assign[word.id] && S.signals.length === 6, S.signals.map(s => s.name));
check('a slow move and a pose on the same number are flagged', S.collides({ kind: 'move', src: 'head', feat: 'nod', dir: -1 }, { kind: 'pose', src: 'head', feats: { nod: { m: -20, s: 1, d: -1 } } }) === true);

console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
process.exit(fails ? 1 : 0);
