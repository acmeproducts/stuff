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
const sz = o => N(o).size;
check('how big the hand looks does not change when it is rolled, turned or tipped, only when it moves nearer', near(sz({ size: 0.2 }), 0.2, 0.004) && near(sz({ size: 0.2, roll: 90 }), 0.2, 0.004) && near(sz({ size: 0.2, yaw: 50 }), 0.2, 0.004) && near(sz({ size: 0.2, pitch: 40 }), 0.2, 0.004) && near(sz({ size: 0.26 }), 0.26, 0.005), [sz({ size: 0.2 }), sz({ size: 0.2, roll: 90 }), sz({ size: 0.2, yaw: 50 }), sz({ size: 0.2, pitch: 40 })]);
{ const h = Synth.hand({ size: 0.2, roll: 90 }); h.lm.forEach(p => { p.x = 0.5 + (p.x - 0.5) / 0.75; });      // a tall phone picture: three wide, four high
  check('nor in a tall picture, where across and down are measured on different scales', near(S.handNumbers(h.lm, h.wl, 0.75).size, 0.2, 0.004), S.handNumbers(h.lm, h.wl, 0.75).size); }
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

/* ---- calibrated to the person ---- */
S.signals.slice().forEach(s => S.remove(s.id)); fired.length = 0;
const many = (k, fn) => Array.from({ length: k }, (_, i) => fn(i));
const weak = { open: many(20, () => N({})), closed: many(20, () => N({ pinch: 0.6 })), near: many(20, () => N({ pinch: 0.6, size: 0.3 })), far: many(20, () => N({ pinch: 0.6, size: 0.15 })) };
const weakPinch = N({ pinch: 0.6 });
check('before calibration a weak pinch (thumb and finger not quite touching) does not count', S.pinching('Right', weakPinch, false) === false && S.pinching('Right', N({ pinch: 1 }), false) === true, weakPinch.pinchI);
check('before calibration depth runs over a standard reach: a hand twice as big is the whole way in', near(S.handDepth('Right', 0.15), 0, 0.01) && near(S.handDepth('Right', 0.30), 1, 0.01) && near(S.handDepth('Right', 0.2121), 0.5, 0.01));
let ch = S.calHand(weak);
check('hand calibration learns this person\'s open, closed and reach', near(ch.closed, weakPinch.pinchI, 0.02) && ch.open > 1 && near(ch.near / ch.far, 2, 0.1), ch);
S.setCal('handRight', ch);
check('after it, their weak pinch counts, and an open hand does not', S.pinching('Right', weakPinch, false) === true && S.pinching('Right', N({}), true) === false);
check('and depth runs over their own reach, from pulled back to pushed forward', near(S.handDepth('Right', ch.far), 0, 0.01) && near(S.handDepth('Right', ch.near), 1, 0.01), [ch.far, ch.near]);
check('the other hand is not touched by it', S.pinching('Left', weakPinch, false) === false);
check('open and pinched reading alike is refused in plain words', /too alike/.test(S.calHand({ open: weak.open, closed: weak.open }).error || ''), S.calHand({ open: weak.open, closed: weak.open }).error);
check('losing sight of the hand is refused', /lost sight/.test(S.calHand({ open: weak.open.slice(0, 3), closed: weak.closed }).error || ''));
check('calibration is kept on the device', JSON.parse(mem.x_cal).handRight.closed === ch.closed, mem.x_cal);

const R0 = { nod: -5, turn: 3, lean: 1 }, hs = (o) => many(20, () => H(Object.assign({}, R0, o)));
let hh = S.calHead({ rest: hs({}), left: hs({ turn: 33 }), right: hs({ turn: -25 }), up: hs({ nod: 11 }), down: hs({ nod: -25 }) });
check('head calibration learns the rest position and how far each way', near(hh.turn0, 3, 0.5) && near(hh.left, 30, 1) && near(hh.right, -28, 1) && near(hh.up, 16, 1) && near(hh.down, -20, 1), hh);
check('before head calibration there is no "looking" direction', S.look(S.ownHead(H(R0))) === '');
S.setCal('head', hh);
const own = o => S.ownHead(H(Object.assign({}, R0, o)));
check('after it, head numbers are measured from their rest', near(own({}).turn, 0, 0.5) && near(own({ turn: 23 }).turn, 20, 0.5) && near(own({}).nod, 0, 0.5), own({ turn: 23 }));
check('looking is told by their own range: past half way counts, less does not', S.look(own({ turn: 23 })) === 'left' && S.look(own({ turn: -15 })) === 'right' && S.look(own({ nod: 5 })) === 'up' && S.look(own({ nod: -18 })) === 'down' && S.look(own({ turn: 12 })) === '' && S.look(own({})) === '', [S.look(own({ turn: 23 })), S.look(own({ turn: 12 }))]);
check('turns that read as the same direction are refused', /two different turns/.test(S.calHead({ rest: hs({}), left: hs({ turn: 33 }), right: hs({ turn: 30 }), up: hs({ nod: 11 }), down: hs({ nod: -25 }) }).error || ''));

// this camera names the eyes the other way round from the person: closing their LEFT eye raises the number called "right"
const E = (l, r) => H(Object.assign({}, R0, { blend: { eyeBlinkLeft: l, eyeBlinkRight: r } })), es = (l, r) => many(20, () => E(l, r));
let ee = S.calEyes({ open: es(0.05, 0.08), both: es(0.7, 0.75), left: es(0.15, 0.75), right: es(0.7, 0.2) });
check('eye calibration learns open, closed, and which number is which eye', near(ee.openL, 0.05, 0.01) && near(ee.closedR, 0.75, 0.01) && ee.swap === true && ee.wink === true, ee);
S.setCal('eyes', ee);
const o1 = S.ownHead(E(0.15, 0.75)), o2 = S.ownHead(E(0.7, 0.75)), o3 = S.ownHead(E(0.05, 0.08));
check('after it, each eye reads 0 open to 1 closed, named for the person\'s own left and right', o1.blinkL > 0.9 && o1.blinkR < 0.25 && o1.wink > 0.7 && near(o2.both, 1, 0.05) && near(o3.both, 0, 0.05) && near(o3.wink, 0, 0.05), [o1, o2.both]);
let made = S.blinkSignals().map(x => x.name).sort().join();
check('the three blink signals are made: left, right, both', made === 'blink both,blink left,blink right' && S.signals.length === 3, made);
const eyesFor = (ms, l, r) => play('head', ms, () => S.ownHead(E(l, r)));
eyesFor(1200, 0.05, 0.08); fired.length = 0;
eyesFor(200, 0.7, 0.75); eyesFor(800, 0.05, 0.08);
check('a natural blink fires nothing', fired.length === 0, fired);
eyesFor(700, 0.7, 0.75); eyesFor(600, 0.05, 0.08);
check('both eyes held closed fires blink both, once, and neither of the others', fired.join() === 'blink both', fired);
fired.length = 0; eyesFor(700, 0.15, 0.75); eyesFor(600, 0.05, 0.08);
check('their left eye held closed fires blink left only', fired.join() === 'blink left', fired);
fired.length = 0; eyesFor(700, 0.7, 0.2); eyesFor(600, 0.05, 0.08);
check('their right eye held closed fires blink right only', fired.join() === 'blink right', fired);
S.setAction(id('blink left'), 'take');
S.setCal('eyes', S.calEyes({ open: es(0.05, 0.08), both: es(0.7, 0.75), left: es(0.7, 0.75), right: es(0.7, 0.75) })); S.blinkSignals();
check('someone who cannot close one eye alone gets blink both only, and the others are taken away with their actions', S.signals.map(x => x.name).join() === 'blink both' && Object.keys(S.assign).length === 0 && S.cal.eyes.wink === false, S.signals.map(x => x.name));
check('eyes that read alike open and closed are refused', /too alike/.test(S.calEyes({ open: es(0.3, 0.3), both: es(0.4, 0.4) }).error || ''));

/* ---- the watch, calibrated: this person's arm rests with the watch rolled well over (the owner's reads about -125 degrees) ---- */
const wr = (pitch, roll) => many(40, () => ({ pitch: pitch, roll: roll }));
check('before watch calibration tilt and roll are the watch\'s own', S.ownWatch(-7, -125).tilt === -7 && S.ownWatch(-7, -125).roll === -125 && S.rollStart() === 16);
let cw = S.calWatch({ rest: wr(-7, -125), up: wr(48, -30), rollA: wr(-7, -170), rollB: wr(-7, -85) });
check('watch calibration learns the rest, the raise and the roll each way', near(cw.pitch0, -7, 0.2) && near(cw.roll0, -125, 0.2) && near(cw.up, 55, 0.5) && near(cw.rollA, -45, 0.5) && near(cw.rollB, 40, 0.5), cw);
S.setCal('watch', cw);
check('after it, tilt is the forearm\'s angle from the desk, raising as plus', near(S.ownWatch(-7, -125).tilt, 0, 0.2) && near(S.ownWatch(48, -125).tilt, 55, 0.2));
check('and roll is the change from their rest, the short way round', near(S.ownWatch(-7, -125).roll, 0, 0.2) && near(S.ownWatch(-7, 175).roll, -60, 0.2) && near(S.ownWatch(-7, -85).roll, 40, 0.2), S.ownWatch(-7, 175));
check('how much roll starts a scroll comes from their own range', near(S.rollStart(), 13.2, 0.3), S.rollStart());
check('a watch that sent too little is refused', /too little/.test(S.calWatch({ rest: wr(0, 0).slice(0, 5) }).error || ''));
check('rolls that read as the same direction leave the roll range out, and keep the rest', (() => { const c = S.calWatch({ rest: wr(-7, -125), rollA: wr(-7, -100), rollB: wr(-7, -90) }); return c.rollA === undefined && near(c.roll0, -125, 0.2); })());

/* ---- voice: a word is taught by saying it, and fires like any other signal ---- */
S.signals.length = 0; S.assign = {}; S.save(); fired.length = 0;
check('voice is a source that can be taught', S.SOURCES.some(s => s[0] === 'voice') && S.actionName('listen') === 'start listening' && S.actionName('deaf') === 'stop listening');
let hw = S.learnWord(['Hey lab.', 'hey Lab', 'a lab']);
check('a word said three times is learned as what was heard, the commonest first', hw.src === 'voice' && hw.kind === 'word' && hw.name === 'hey lab' && hw.says.join('|') === 'hey lab|a lab', hw);
check('heard once is not enough', /only once/.test(S.learnWord(['', 'hey lab', '']).error || '') && /not at all/.test(S.learnWord(['', '', '']).error || ''));
check('more than four words is refused', /four words/.test(S.learnWord(['one two three four five', 'one two three four five']).error || ''));
const hot = S.add(hw), cold = S.add(S.learnWord(['that is all', 'that is all', 'that is all']));
S.setAction(hot.id, 'listen'); S.setAction(cold.id, 'deaf');
check('a word that contains a taught word is seen as too alike', S.collides(S.learnWord(['hey lab now', 'hey lab now']), hot) && !S.collides(S.learnWord(['good morning', 'good morning']), hot));
const acts = []; S.onFire(e => acts.push(e.name + ':' + e.action + ':' + e.src));
let vg = S.heard('so I said hey', false, 1000);
check('other words fire nothing', vg.length === 0 && acts.length === 0);
vg = S.heard('so I said hey lab', false, 1200);
check('the word fires as it is being said, with its action', vg.length === 1 && acts.join() === 'hey lab:listen:voice', acts);
S.heard('so I said hey lab what', false, 1500); S.heard('So I said, hey lab! What time is it?', true, 1900);
check('and once for the phrase, however long the phrase runs', acts.length === 1, acts);
S.heard('hey lab', true, 2400);
check('said again in a new phrase it fires again', acts.length === 2, acts);
S.heard('a lab', true, 9000);
check('what the recogniser mis-heard during teaching counts too', acts.length === 3, acts);
S.heard('heyday laboratory', true, 15000);
check('part of a longer word does not count', acts.length === 3, acts);
S.heard('That is all.', true, 20000);
check('the cold word fires with its own action', acts[3] === 'that is all:deaf:voice', acts);
S.heard('hey lab', false, 30000); S.heard('hey lab', false, 35000);
check('a phrase that never ends does not hold the word for ever', acts.length === 6, acts);
const two = S.add({ kind: 'combo', name: 'wake and sleep', seq: [hot.id, cold.id], gap: 2500 }); acts.length = 0;
S.heard('hey lab', true, 40000); S.heard('that is all', true, 41000);
check('words join into combinations like any other signals', acts.join() === 'hey lab:listen:voice,that is all:deaf:voice,wake and sleep::combo', acts);
check('with no recogniser in the browser the ears say so and stay off', S.ears.start(() => {}) === false && /no speech recognition/.test(S.ears.err) && S.ears.on === false);
{
  const made = []; global.window.SpeechRecognition = function () { made.push(this); }; global.window.SpeechRecognition.prototype = { start() { this.on = true; }, abort() { this.on = false; } };
  const txt = []; const ok = S.ears.start((t, f) => txt.push(t + (f ? '.' : '…')));
  const res = (t, f) => { const a = [{ transcript: t }]; a.isFinal = f; return { resultIndex: 0, results: [a] }; };
  made[0].onresult(res(' hello ', false)); made[0].onresult(res('hello there', true)); made[0].onresult(res('  ', true));
  check('the ears open the recogniser, kept open, and pass on what is heard, trimmed, empty results dropped', ok && made.length === 1 && made[0].continuous === true && made[0].interimResults === true && txt.join('|') === 'hello…|hello there.', txt);
  made[0].onerror({ error: 'no-speech' }); const first = made[0]; first.onend();
  check('a pause that ends the recogniser is not an error', S.ears.on === true && S.ears.err === '');
  S.ears.stop();
  check('stopped, it lets go of the recogniser and listens to nothing', first.on === true && S.ears.on === false && S.ears.rec === null);
  S.ears.start(() => {}); made[made.length - 1].onerror({ error: 'not-allowed' });
  check('a refused microphone is said plainly and it stops trying', S.ears.on === false && /not allowed/.test(S.ears.err), S.ears.err);
  S.ears.stop(); delete global.window.SpeechRecognition;
}

/* ---- the eyes: each picture is looked at once, and a lean look does no more than find the hand ---- */
{
  const E = S.eyes, calls = [], lm = Array.from({ length: 21 }, (_, i) => ({ x: 0.5, y: 0.3 + i * 0.01, z: 0 }));
  E.stop(); S.resetRecognisers(); E.on = true; E.want = { hands: true, max: 1, lean: true, exact: true };
  E.hand = { detectForVideo: (v, t) => { calls.push(t); return { landmarks: [lm, lm], worldLandmarks: [lm, lm], handedness: [[{ categoryName: 'Right' }], [{ categoryName: 'Left' }]] }; }, close() {} };
  E.video = { readyState: 4, currentTime: 1, videoWidth: 640, videoHeight: 480 };
  E._rv = true; E._rvSeen = true; E._fresh = false;
  check('told by the camera of each new picture, it looks at nothing until one comes', E.poll() === null && calls.length === 0);
  E._fresh = true; const f1 = E.poll(), again = E.poll();
  check('a new picture is looked at once, not again on the next screen refresh', !!f1 && again === null && calls.length === 1, calls.length);
  check('asked for one hand, one is reported; a lean look works out no numbers and feeds no taught signal', !!f1 && f1.hands.length === 1 && f1.hands[0].n === null && f1.hands[0].lm === lm && S.recent('handR').length === 0, f1 && f1.hands.length);
  E._rvSeen = false; E._rvAt = performance.now() - 2000; E._fresh = false; E.video.currentTime = 2;
  const f2 = E.poll();
  check('if the camera never tells it, it goes back to watching the clock, so the card is not left blind', E._rv === false && !!f2, E._rv);
  E.want = { hands: true }; E.video.currentTime = 3; const f3 = E.poll();
  check('an ordinary look still reports every hand with its numbers', !!f3 && f3.hands.length === 2 && f3.hands[0].n && typeof f3.hands[0].n.size === 'number');
  E.hand = null; E.on = false; E.video = null; S.resetRecognisers();
}

console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
process.exit(fails ? 1 : 0);
