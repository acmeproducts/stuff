/* Signals: what a camera sees of a hand or a head (and what the watch feels), turned into numbers;
   signals a person teaches from their own body; combinations of them; and the action each one is given.
   Shared by the Lab and X. Nothing here draws a screen. The picture never leaves the device: only numbers are kept.

   Letters  = taught signals: a pose (held) or a move (out and back), from a hand, the head, or the watch.
   Words    = combinations: taught signals made one after another.
   Each can be given one action. */
(function () {
  'use strict';
  var S = {};
  var MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0';
  var HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  var FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  (function () { var m = /[?&]mp=([^&]+)/.exec(location.search); if (m) MP = decodeURIComponent(m[1]); })();

  /* ---------- small geometry ---------- */
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) }; }
  function len(v) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
  function dist(a, b) { return len(sub(a, b)); }
  function cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
  function unit(v) { var l = len(v) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }
  function std(a) { var m = mean(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return a.length ? Math.sqrt(s / a.length) : 0; }
  S.math = { sub: sub, len: len, dist: dist, cross: cross, unit: unit, clamp: clamp };

  /* ---------- a hand, as numbers that do not change when the hand moves around the picture ---------- */
  var FINGERS = { T: [1, 2, 3, 4], I: [5, 6, 7, 8], M: [9, 10, 11, 12], R: [13, 14, 15, 16], P: [17, 18, 19, 20] };
  S.handNumbers = function (lm, wl, aspect) {
    var P = (wl && wl.length === 21) ? wl : lm, palm = dist(P[0], P[9]) || 1e-6, n = {}, k, f;
    for (k in FINGERS) {            // how curled each finger is: 0 straight, 1 folded
      f = FINGERS[k];
      var chain = dist(P[f[0]], P[f[1]]) + dist(P[f[1]], P[f[2]]) + dist(P[f[2]], P[f[3]]);
      n['curl' + k] = clamp((1 - dist(P[f[0]], P[f[3]]) / (chain || 1e-6)) / 0.45, 0, 1);
    }
    n.pinchI = clamp(dist(P[4], P[8]) / palm, 0, 2);     // thumb tip to each fingertip, in palm lengths
    n.pinchM = clamp(dist(P[4], P[12]) / palm, 0, 2);
    n.pinchR = clamp(dist(P[4], P[16]) / palm, 0, 2);
    n.pinchP = clamp(dist(P[4], P[20]) / palm, 0, 2);
    var nrm = unit(cross(sub(P[5], P[0]), sub(P[17], P[0])));   // which way the palm faces
    n.palmX = nrm.x; n.palmY = nrm.y; n.palmZ = nrm.z;
    var up = sub(lm[9], lm[0]), a = Math.atan2(up.x, -up.y);     // how the hand is rolled in the picture (kept as two numbers so it never jumps)
    n.rollS = Math.sin(a); n.rollC = Math.cos(a);
    n.x = (lm[0].x + lm[9].x) / 2; n.y = (lm[0].y + lm[9].y) / 2;   // where it is in the picture, and how big it looks (nearer is bigger)
    /* How big the hand looks: how long a 9 cm palm would be in the picture, as a fraction of the picture's height. Measured against
       the hand's own shape, so turning or rolling the hand does not change it; only moving it nearer or further does. */
    var asp = aspect || 1, edges = [[0, 5], [0, 17], [5, 17], [0, 9]], r = [], i;
    if (wl && wl.length === 21) for (i = 0; i < edges.length; i++) {
      var A = edges[i][0], B = edges[i][1], flat = Math.sqrt((wl[A].x - wl[B].x) * (wl[A].x - wl[B].x) + (wl[A].y - wl[B].y) * (wl[A].y - wl[B].y));
      if (flat > 0.02) r.push(Math.sqrt((lm[A].x - lm[B].x) * asp * (lm[A].x - lm[B].x) * asp + (lm[A].y - lm[B].y) * (lm[A].y - lm[B].y)) / flat);
    }
    r.sort(function (p, q) { return p - q; });
    n.size = r.length ? 0.09 * (r.length % 2 ? r[(r.length - 1) / 2] : (r[r.length / 2 - 1] + r[r.length / 2]) / 2)
                      : Math.sqrt((lm[9].x - lm[0].x) * asp * (lm[9].x - lm[0].x) * asp + (lm[9].y - lm[0].y) * (lm[9].y - lm[0].y));
    return n;
  };
  /* the hand's own three directions, for turning an object the way the hand turns */
  S.handBasis = function (lm, wl) {
    var P = (wl && wl.length === 21) ? wl : lm;
    var y = unit(sub(P[9], P[0])), z = unit(cross(sub(P[5], P[0]), sub(P[17], P[0]))), x = unit(cross(y, z));
    z = unit(cross(x, y));
    return { x: x, y: y, z: z };
  };

  /* ---------- a head, as numbers ---------- */
  var BLEND = { blinkL: ['eyeBlinkLeft'], blinkR: ['eyeBlinkRight'], jaw: ['jawOpen'], brows: ['browInnerUp'], smile: ['mouthSmileLeft', 'mouthSmileRight'], pucker: ['mouthPucker'] };
  S.headNumbers = function (matrix, blend) {
    var n = {}, deg = 180 / Math.PI;
    if (matrix && matrix.data && matrix.data.length >= 16) {
      var m = matrix.data;         // column by column: row r, column c is m[c*4+r]
      n.nod = Math.asin(clamp(-m[9], -1, 1)) * deg;
      n.turn = Math.atan2(m[8], m[10]) * deg;
      n.lean = Math.atan2(m[1], m[5]) * deg;
    }
    if (blend && blend.categories) {
      var by = {};
      blend.categories.forEach(function (c) { by[c.categoryName] = c.score; });
      for (var k in BLEND) { var v = 0, got = 0; BLEND[k].forEach(function (name) { if (by[name] != null) { v += by[name]; got++; } }); if (got) n[k] = v / got; }
    }
    return n;
  };

  /* ---------- which numbers describe each source, and how much each may wander ---------- */
  var HAND_SHAPE = ['curlT', 'curlI', 'curlM', 'curlR', 'curlP', 'pinchI', 'pinchM', 'palmX', 'palmY', 'palmZ', 'rollS', 'rollC'];
  var FEATS = {
    hand: { pose: HAND_SHAPE, move: HAND_SHAPE.concat(['x', 'y', 'size']) },
    head: { pose: ['nod', 'turn', 'lean', 'blinkL', 'blinkR', 'wink', 'both', 'jaw', 'brows', 'smile', 'pucker'], move: ['nod', 'turn', 'lean', 'blinkL', 'blinkR', 'wink', 'both', 'jaw', 'brows', 'smile', 'pucker'] },
    watch: { pose: ['tilt', 'rollS', 'rollC'], move: ['tilt', 'rollS', 'rollC', 'turn'] }
  };
  var FLOOR = { curlT: 0.18, curlI: 0.18, curlM: 0.18, curlR: 0.18, curlP: 0.18, pinchI: 0.16, pinchM: 0.18, pinchR: 0.2, pinchP: 0.2, palmX: 0.3, palmY: 0.3, palmZ: 0.3, rollS: 0.3, rollC: 0.3,
    x: 0.07, y: 0.07, size: 0.03, nod: 7, turn: 8, lean: 7, blinkL: 0.25, blinkR: 0.25, wink: 0.2, both: 0.3, jaw: 0.2, brows: 0.2, smile: 0.25, pucker: 0.25, tilt: 10, turn_w: 60 };
  var ALWAYS = { hand: ['curlT', 'curlI', 'curlM', 'curlR', 'curlP', 'pinchI', 'pinchM'], head: [], watch: ['tilt', 'rollS', 'rollC'] };
  function floorOf(src, f) { return (src === 'watch' && f === 'turn') ? FLOOR.turn_w : (FLOOR[f] || 0.2); }
  function kindOf(src) { return src === 'handL' || src === 'handR' ? 'hand' : src; }
  var NAMES = { wink: 'one eye closed', both: 'both eyes closed', curlT: 'thumb curl', curlI: 'index curl', curlM: 'middle curl', curlR: 'ring curl', curlP: 'little curl', pinchI: 'thumb to index', pinchM: 'thumb to middle',
    palmX: 'palm across', palmY: 'palm up or down', palmZ: 'palm to camera', rollS: 'roll', rollC: 'roll', x: 'place across', y: 'place up or down', size: 'nearness',
    nod: 'nod', turn: 'turn', lean: 'lean', blinkL: 'left blink', blinkR: 'right blink', jaw: 'jaw', brows: 'brows', smile: 'smile', pucker: 'pucker', tilt: 'tilt' };
  S.FEATS = FEATS; S.kindOf = kindOf; S.NAMES = NAMES;
  S.SOURCES = [['handR', 'Right hand'], ['handL', 'Left hand'], ['head', 'Head and face'], ['watch', 'Watch'], ['voice', 'Voice']];
  S.sourceName = function (s) { for (var i = 0; i < S.SOURCES.length; i++) if (S.SOURCES[i][0] === s) return S.SOURCES[i][1]; return s; };

  /* ---------- learning a signal from three showings ----------
     rest: frames while doing nothing. reps: three arrays of frames, each one showing. A frame is {t, n:{number name: value}}.
     If the body ends each showing away from rest and holds there, it is a pose. If it goes out and comes back, it is a move. */
  S.learn = function (src, rest, reps) {
    var kind = kindOf(src), F = FEATS[kind];
    if (!F) return { error: 'unknown source' };
    reps = reps.filter(function (r) { return r.length >= 6; });
    if (reps.length < 2) return { error: 'I did not see enough of it. Keep it in view and try again.' };
    var col = function (frames, f) { var a = []; for (var i = 0; i < frames.length; i++) if (frames[i].n[f] != null) a.push(frames[i].n[f]); return a; };
    var noRest = rest.length < 4;
    if (noRest && kind !== 'hand') return { error: 'I did not see you at rest. Stay in view and try again.' };
    var restM = {};
    F.move.forEach(function (f) { restM[f] = mean(col(rest, f)); });
    // per showing and per number: where it ended, how far it went at most from rest (signed), and how steady the end was
    var stat = reps.map(function (r) {
      var o = {}, tail = r.slice(Math.floor(r.length * 0.75));
      F.move.forEach(function (f) {
        var all = col(r, f), end = col(tail, f); if (!all.length) return;
        var peak = 0; for (var i = 0; i < all.length; i++) if (Math.abs(all[i] - restM[f]) > Math.abs(peak)) peak = all[i] - restM[f];
        o[f] = { end: mean(end), endStd: std(end), peak: peak };
      });
      return o;
    });
    var endOf = function (f) {
      var e = stat.map(function (o) { return o[f] ? o[f].end : null; }).filter(function (v) { return v != null; });
      return e.length ? { m: mean(e), s: std(e) + mean(stat.map(function (o) { return o[f] ? o[f].endStd : 0; })) } : null;
    };
    if (noRest) {   // the hand was out of the picture at rest: the held shape is the whole signal
      var shape = {}, loose = 0;
      F.pose.forEach(function (f) { var e = endOf(f); if (e) { shape[f] = { m: e.m, s: e.s, d: 0 }; if (ALWAYS.hand.indexOf(f) >= 0 && e.s > floorOf(src, f)) loose++; } });
      if (loose > 1) return { error: 'It kept changing. Hold the pose still while it says NOW.' };
      return { kind: 'pose', src: src, feats: shape, hold: 500, why: 'a pose: your hand was out of the picture at rest, so the held shape and the way it faces are the signal' };
    }
    // the number that moved most, counted in units of how much that number normally wanders
    var best = null, bestScore = 0;
    F.move.forEach(function (f) {
      var peaks = stat.map(function (o) { return o[f] ? o[f].peak : 0; });
      var sameWay = peaks.every(function (p) { return p > 0; }) || peaks.every(function (p) { return p < 0; });
      var score = Math.min.apply(null, peaks.map(Math.abs)) / floorOf(src, f);
      if (sameWay && score > bestScore) { bestScore = score; best = f; }
    });
    if (!best || bestScore < 1.2) return { error: 'That looked the same as doing nothing. Make it bigger, or hold it longer.' };
    var peaks = stat.map(function (o) { return o[best].peak; }), ends = stat.map(function (o) { return o[best].end - restM[best]; });
    var cameBack = mean(ends.map(Math.abs)) < 0.45 * mean(peaks.map(Math.abs));
    if (cameBack) {
      return { kind: 'move', src: src, feat: best, dir: peaks[0] > 0 ? 1 : -1, amp: Math.max(0.55 * Math.min.apply(null, peaks.map(Math.abs)), floorOf(src, best)), dur: 1200,
        why: 'a move: ' + (NAMES[best] || best) + (peaks[0] > 0 ? ' rises' : ' falls') + ' and comes back' };
    }
    // a pose is made of the numbers that always describe this source, and of any other number that left rest
    var feats = {}, told = [];
    F.pose.forEach(function (f) {
      var e = endOf(f); if (!e) return;
      var away = e.m - restM[f], differs = Math.abs(away) > 1.2 * floorOf(src, f);
      if (differs) told.push(NAMES[f] || f);
      if (differs || ALWAYS[kind].indexOf(f) >= 0) feats[f] = { m: e.m, s: e.s, d: differs ? (away > 0 ? 1 : -1) : 0 };
    });
    if (!told.length) return { error: 'Held, but too close to doing nothing. Make the pose more different from rest.' };
    return { kind: 'pose', src: src, feats: feats, hold: 500, why: 'a pose: held, and different from rest in ' + told.slice(0, 4).join(', ') + (told.length > 4 ? ' and ' + (told.length - 4) + ' more' : '') };
  };
  function tol(src, f, s) { return Math.max(2.5 * s, floorOf(src, f)); }
  /* would two taught signals be mistaken for each other? */
  S.collides = function (a, b) {
    if (a.src !== b.src || a.kind === 'combo' || b.kind === 'combo') return false;
    if (a.kind === 'word' || b.kind === 'word') return a.kind === b.kind && a.says.some(function (x) { return b.says.some(function (y) { return (' ' + x + ' ').indexOf(' ' + y + ' ') >= 0 || (' ' + y + ' ').indexOf(' ' + x + ' ') >= 0; }); });
    if (a.kind !== b.kind) { var mv = a.kind === 'move' ? a : b, ps = a.kind === 'move' ? b : a; return !!(ps.feats[mv.feat] && ps.feats[mv.feat].d === mv.dir); }
    if (a.kind === 'move') return a.feat === b.feat && a.dir === b.dir;
    if (a.kind === 'pose') { for (var f in a.feats) { if (!b.feats[f]) continue; if (Math.abs(a.feats[f].m - b.feats[f].m) > tol(a.src, f, a.feats[f].s) + tol(b.src, f, b.feats[f].s)) return false; } return true; }
    return false;
  };

  /* ---------- what has been taught, and what each signal is given to do (kept on this device) ---------- */
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }

  /* ---------- calibrated to the person ----------
     Their own ranges, kept on the device (x_cal): how their pinch reads open and closed and how big the hand looks near and far;
     where their head rests and how far it goes each way; how each eye reads open and closed, and which number is which eye.
     Until a source is calibrated the build's own numbers stand in. */
  S.cal = load('x_cal', {});
  S.setCal = function (key, value) { if (value == null) delete S.cal[key]; else S.cal[key] = value; store('x_cal', S.cal); };
  function pct(a, q) { if (!a.length) return NaN; var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.min(b.length - 1, Math.max(0, Math.round(q * (b.length - 1))))]; }
  S.pct = pct;

  /* hand: steps = {open: [numbers], closed: [...], near: [...], far: [...]} as the Calibrate card collected them */
  S.calHand = function (steps) {
    var open = (steps.open || []).map(function (n) { return n.pinchI; }), closed = (steps.closed || []).map(function (n) { return n.pinchI; });
    if (open.length < 8 || closed.length < 8) return { error: 'I lost sight of your hand. Keep it in the picture and try again.' };
    var o = pct(open, 0.5), c = pct(closed, 0.5);
    if (o - c < 0.25) return { error: 'Open and pinched read too alike (' + o.toFixed(2) + ' and ' + c.toFixed(2) + '). Open wider, pinch firmly, and try again.' };
    var out = { open: +o.toFixed(3), closed: +c.toFixed(3) };
    var near = (steps.near || []).map(function (n) { return n.size; }), far = (steps.far || []).map(function (n) { return n.size; });
    if (near.length >= 8 && far.length >= 8) { var a = pct(near, 0.9), b = pct(far, 0.1); if (a / b >= 1.15) { out.near = +a.toFixed(3); out.far = +b.toFixed(3); } }
    return out;
  };
  /* is this hand pinching? closed below a third of the way from their closed reading to their open one, open above six tenths, unchanged between */
  S.pinching = function (side, n, was) {
    var k = S.cal['hand' + side], lo = 0.30, hi = 0.45;
    if (k) { lo = k.closed + 0.35 * (k.open - k.closed); hi = k.closed + 0.6 * (k.open - k.closed); }
    return n.pinchI < lo ? true : n.pinchI > hi ? false : !!was;
  };
  /* where a hand is between pulled back (0) and pushed toward the screen (1), by how big it looks, over their own reach */
  S.handDepth = function (side, size) { var k = S.cal['hand' + side], far = 0.15, near = 0.30; if (k && k.near) { far = k.far; near = k.near; } return clamp(Math.log(size / far) / Math.log(near / far), -0.15, 1.15); };

  /* head: steps = {rest, left, right, up, down}, each a list of raw head numbers */
  S.calHead = function (steps) {
    var need = ['rest', 'left', 'right', 'up', 'down'], i;
    for (i = 0; i < need.length; i++) if (!steps[need[i]] || steps[need[i]].length < 8) return { error: 'I lost sight of your face. Stay in the picture and try again.' };
    var col = function (k, f) { return steps[k].map(function (n) { return n[f]; }); };
    var out = { nod0: pct(col('rest', 'nod'), 0.5), turn0: pct(col('rest', 'turn'), 0.5), lean0: pct(col('rest', 'lean'), 0.5) };
    var far = function (k, f, zero) { var v = col(k, f).map(function (x) { return x - zero; }), hi = pct(v, 0.85), lo = pct(v, 0.15); return Math.abs(hi) > Math.abs(lo) ? hi : lo; };
    out.left = far('left', 'turn', out.turn0); out.right = far('right', 'turn', out.turn0); out.up = far('up', 'nod', out.nod0); out.down = far('down', 'nod', out.nod0);
    if (Math.abs(out.left) < 8 || Math.abs(out.right) < 8 || out.left * out.right > 0) return { error: 'Left and right did not read as two different turns. Turn a little further each way and try again.' };
    if (Math.abs(out.up) < 6 || Math.abs(out.down) < 6 || out.up * out.down > 0) return { error: 'Up and down did not read as two different looks. Go a little further each way and try again.' };
    for (var k in out) out[k] = +out[k].toFixed(1);
    return out;
  };
  /* which way is the head looking, by their own range: half way to their comfortable limit counts */
  S.look = function (n, range) {
    var k = range || S.cal.head; if (!k || !n || n.turn == null) return '';
    var t = n.turn / k.left, u = n.nod / k.up, best = '', top = 0.5;       // n is already measured from their rest
    if (t > top) { best = 'left'; top = t; } if (n.turn / k.right > top) { best = 'right'; top = n.turn / k.right; }
    if (u > top) { best = 'up'; top = u; } if (n.nod / k.down > top) { best = 'down'; top = n.nod / k.down; }
    return best;
  };

  /* watch: steps = {rest, up, rollA, rollB}, each a list of {pitch, roll} in degrees as the watch reports them.
     rest = forearm on the desk, elbow down. Tilt is then the forearm's angle from the desk, raising as plus; roll is the change from this rest. */
  function wrap(x) { x = ((x + 180) % 360 + 360) % 360 - 180; return x; }
  S.wrap = wrap;
  function midAngle(a) { var sx = 0, sy = 0; a.forEach(function (v) { sx += Math.cos(v * Math.PI / 180); sy += Math.sin(v * Math.PI / 180); }); return Math.atan2(sy, sx) * 180 / Math.PI; }
  S.calWatch = function (steps) {
    if (!steps.rest || steps.rest.length < 20) return { error: 'The watch sent too little. Open Wrist on the watch and try again.' };
    var out = { pitch0: pct(steps.rest.map(function (r) { return r.pitch; }), 0.5), roll0: midAngle(steps.rest.map(function (r) { return r.roll; })) };
    if (steps.up && steps.up.length >= 20) { var u = pct(steps.up.map(function (r) { return r.pitch - out.pitch0; }), 0.8); if (u >= 10) out.up = u; }
    var turn = function (k) { return steps[k] && steps[k].length >= 20 ? pct(steps[k].map(function (r) { return wrap(r.roll - out.roll0); }), 0.5) : 0; };
    var a = turn('rollA'), b = turn('rollB');
    if (a * b < 0 && Math.abs(a) >= 10 && Math.abs(b) >= 10) { out.rollA = a; out.rollB = b; }
    for (var k in out) out[k] = +out[k].toFixed(1);
    return out;
  };
  /* the watch's own tilt and roll to the person's: tilt from the desk, roll from their rest */
  S.ownWatch = function (pitch, roll) { var k = S.cal.watch; return k ? { tilt: pitch - k.pitch0, roll: wrap(roll - k.roll0) } : { tilt: pitch, roll: roll }; };
  /* how many degrees of roll start a scroll for this person: a third of the smaller of their two comfortable rolls, within sensible limits */
  S.rollStart = function () { var k = S.cal.watch; return k && k.rollA ? clamp(Math.min(Math.abs(k.rollA), Math.abs(k.rollB)) * 0.33, 8, 24) : 16; };

  /* eyes: steps = {open, both, left, right}; left and right (one eye closed) may be missing if the person cannot wink */
  S.calEyes = function (steps) {
    if (!steps.open || steps.open.length < 8 || !steps.both || steps.both.length < 8) return { error: 'I lost sight of your face. Stay in the picture and try again.' };
    var col = function (k, f) { return steps[k].map(function (n) { return n[f]; }); };
    var out = { openL: pct(col('open', 'blinkL'), 0.3), openR: pct(col('open', 'blinkR'), 0.3), closedL: pct(col('both', 'blinkL'), 0.7), closedR: pct(col('both', 'blinkR'), 0.7), swap: false, wink: false };
    if (out.closedL - out.openL < 0.2 || out.closedR - out.openR < 0.2) return { error: 'Open and closed read too alike (' + out.openL.toFixed(2) + ' open, ' + out.closedL.toFixed(2) + ' closed). Try in better light, facing the camera.' };
    var norm = function (v, o, c) { return (v - o) / (c - o); };
    if (steps.left && steps.left.length >= 8 && steps.right && steps.right.length >= 8) {
      var dl = pct(col('left', 'blinkL'), 0.6), dr = pct(col('left', 'blinkR'), 0.6), el = pct(col('right', 'blinkL'), 0.6), er = pct(col('right', 'blinkR'), 0.6);
      var a = norm(dl, out.openL, out.closedL) - norm(dr, out.openR, out.closedR), b = norm(el, out.openL, out.closedL) - norm(er, out.openR, out.closedR);
      // closing the left eye should push one number up and closing the right the other; which is which is learned, not assumed
      if (a * b < 0 && Math.abs(a) > 0.45 && Math.abs(b) > 0.45) { out.swap = a < 0; out.wink = true; out.winkL = +Math.abs(a).toFixed(2); out.winkR = +Math.abs(b).toFixed(2); }
    }
    ['openL', 'openR', 'closedL', 'closedR'].forEach(function (k) { out[k] = +out[k].toFixed(3); });
    return out;
  };

  /* raw head numbers to the person's own: measured from their rest; each eye from 0 (their open) to 1 (their closed), named for their own left and right */
  S.ownHead = function (raw) {
    var n = {}, k, h = S.cal.head, e = S.cal.eyes;
    for (k in raw) n[k] = raw[k];
    if (h) { if (n.nod != null) n.nod -= h.nod0; if (n.turn != null) n.turn -= h.turn0; if (n.lean != null) n.lean -= h.lean0; }
    if (raw.blinkL != null && raw.blinkR != null) {
      var l = raw.blinkL, r = raw.blinkR;
      if (e) { l = clamp((raw.blinkL - e.openL) / (e.closedL - e.openL), 0, 1.3); r = clamp((raw.blinkR - e.openR) / (e.closedR - e.openR), 0, 1.3); if (e.swap) { var t = l; l = r; r = t; } }
      n.blinkL = l; n.blinkR = r; n.wink = l - r; n.both = Math.min(l, r);
    }
    return n;
  };
  /* the three blink signals, made from the eye calibration: both eyes closed, or one eye closed, held longer than a natural blink */
  S.blinkSignals = function () {
    var e = S.cal.eyes, made = [], want = [['blink both', { both: { m: 1, s: 0.16, d: 1 } }]];
    if (!e) return made;
    if (e.wink) { want.push(['blink left', { wink: { m: e.winkL, s: 0.16 * e.winkL, d: 1 } }]); want.push(['blink right', { wink: { m: -e.winkR, s: 0.16 * e.winkR, d: -1 } }]); }
    ['blink both', 'blink left', 'blink right'].forEach(function (name) {
      var old = S.signals.filter(function (g) { return g.name === name && g.from === 'eyes'; })[0], w = want.filter(function (x) { return x[0] === name; })[0];
      if (old && !w) { S.remove(old.id); return; }
      if (!w) return;
      if (old) { old.feats = w[1]; S.save(); made.push(old); }
      else made.push(S.add({ kind: 'pose', src: 'head', name: name, feats: w[1], hold: 400, from: 'eyes' }));
    });
    state = {};
    return made;
  };
  S.signals = load('x_signals', []);
  S.assign = load('x_assign', {});
  S.save = function () { store('x_signals', S.signals); store('x_assign', S.assign); };
  S.byId = function (id) { for (var i = 0; i < S.signals.length; i++) if (S.signals[i].id === id) return S.signals[i]; return null; };
  S.add = function (sig) {
    sig.id = sig.id || ('s' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36)); sig.made = Date.now();
    var base = String(sig.name || '').trim() || 'signal', name = base, k = 2;
    while (S.signals.some(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })) name = base + ' ' + (k++);
    sig.name = name; S.signals.push(sig); S.save(); state = {}; return sig;
  };
  S.remove = function (id) {
    S.signals = S.signals.filter(function (x) { return x.id !== id && !(x.kind === 'combo' && x.seq.indexOf(id) >= 0); });
    var keep = {}; S.signals.forEach(function (x) { if (S.assign[x.id]) keep[x.id] = S.assign[x.id]; }); S.assign = keep; S.save(); state = {};
  };
  S.setAction = function (id, action) {
    if (action) { for (var k in S.assign) if (S.assign[k] === action && k !== id) delete S.assign[k]; S.assign[id] = action; } else delete S.assign[id];   // one signal, one meaning; one meaning, one signal
    S.save();
  };
  S.ACTIONS = [
    ['more', 'more', 'X'], ['enough', 'enough', 'X'], ['yes', 'yes', 'X'], ['no', 'no', 'X'], ['again', 'again', 'X'], ['back', 'back', 'X'],
    ['take', 'take', 'object'], ['letgo', 'let go', 'object'], ['left', 'turn left', 'object'], ['right', 'turn right', 'object'], ['toward', 'tip toward me', 'object'], ['away', 'tip away', 'object'],
    ['bigger', 'bigger', 'object'], ['smaller', 'smaller', 'object'], ['next', 'next object', 'object'], ['reset', 'put it back', 'object'], ['buzz', 'buzz the watch', 'watch'],
    ['listen', 'start listening', 'voice'], ['deaf', 'stop listening', 'voice']
  ];
  S.actionName = function (id) { for (var i = 0; i < S.ACTIONS.length; i++) if (S.ACTIONS[i][0] === id) return S.ACTIONS[i][1]; return ''; };

  /* ---------- recognising: every new set of numbers from a source is checked against what was taught ---------- */
  var recent = {}, state = {}, listeners = [], lastT = {};
  function within(src, f, ft, v) { var dv = v - ft.m, t = tol(src, f, ft.s); return ft.d && dv * ft.d > 0 ? dv * ft.d <= 3 * t : Math.abs(dv) <= t; }
  S.fires = [];
  S.onFire = function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; };
  function fire(sig, t) {
    var e = { id: sig.id, name: sig.name, src: sig.src || 'combo', kind: sig.kind, t: t, action: S.assign[sig.id] || '' };
    S.fires.push(e); if (S.fires.length > 40) S.fires.shift();
    listeners.slice().forEach(function (fn) { try { fn(e); } catch (x) { /* a listener's fault is its own */ } });
    S.signals.forEach(function (c) {          // words: the same signals, made one after another
      if (c.kind !== 'combo') return;
      var st = state[c.id] || (state[c.id] = { pos: 0, at: 0 });
      if (sig.id === c.seq[st.pos] && (st.pos === 0 || t - st.at <= (c.gap || 2500))) { st.pos++; st.at = t; if (st.pos >= c.seq.length) { st.pos = 0; fire(c, t); } }
      else { st.pos = sig.id === c.seq[0] ? 1 : 0; st.at = t; }
    });
  }
  S.feed = function (src, t, n) {
    var buf = recent[src] || (recent[src] = []), i;
    if (lastT[src] && t - lastT[src] > 600) { buf.length = 0; for (i = 0; i < S.signals.length; i++) if (S.signals[i].src === src) delete state[S.signals[i].id]; }
    lastT[src] = t;
    buf.push({ t: t, n: n }); while (buf.length && t - buf[0].t > 2500) buf.shift();
    for (i = 0; i < S.signals.length; i++) {
      var g = S.signals[i]; if (g.src !== src) continue;
      var st = state[g.id] || (state[g.id] = { since: 0, fired: false, out: 0, cool: 0 });
      if (g.kind === 'pose') {
        var inside = true;
        for (var f in g.feats) { if (n[f] == null || !within(src, f, g.feats[f], n[f])) { inside = false; break; } }
        if (inside) { if (!st.since) st.since = t; if (!st.fired && t - st.since >= (g.hold || 500)) { st.fired = true; fire(g, t); } }
        else { st.since = 0; st.fired = false; }
      } else if (g.kind === 'move') {
        if (n[g.feat] == null || t < st.cool) continue;
        var base = [], k;                               // where this number was a moment ago, before any move began
        for (k = 0; k < buf.length; k++) if (t - buf[k].t >= 500 && buf[k].n[g.feat] != null) base.push(buf[k].n[g.feat]);
        if (base.length < 3) continue;
        if (!st.out) { st.base = mean(base); if ((n[g.feat] - st.base) * g.dir >= g.amp) st.out = t; }
        else if ((n[g.feat] - st.base) * g.dir <= 0.35 * g.amp) { var took = t - st.out; st.out = 0; st.cool = t + 500; if (took <= 2 * (g.dur || 1200) + 400) fire(g, t); }
        else if (t - st.out > 2 * (g.dur || 1200) + 1200) st.out = 0;   // it went and stayed: that is a pose change, not this move
      }
    }
  };
  /* ---------- voice: a word is a signal like any other. It is taught by saying it; what the recogniser heard is what is listened for. ---------- */
  S.norm = function (t) { return String(t || '').toLowerCase().replace(/[^a-z0-9\u00c0-\uffff' ]+/g, ' ').replace(/\s+/g, ' ').trim(); };
  S.learnWord = function (heard) {
    var got = heard.map(S.norm).filter(Boolean), says = [], count = {}, i;
    if (got.length < 2) return { error: 'I heard it ' + (got.length ? 'only once' : 'not at all') + '. Say it after each tone, a little louder.' };
    got.forEach(function (g) { count[g] = (count[g] || 0) + 1; if (says.indexOf(g) < 0) says.push(g); });
    for (i = 0; i < says.length; i++) if (says[i].split(' ').length > 4) return { error: 'That was more than four words. A short word or two works best.' };
    says.sort(function (a, b) { return count[b] - count[a]; });
    return { src: 'voice', kind: 'word', says: says, name: says[0], why: says.map(function (s) { return '\u201c' + s + '\u201d'; }).join(', ') };
  };
  /* some words were heard (still being said, or final). Each taught word in them fires once for the phrase. Returns the taught words found in it. */
  var said = {};
  S.heard = function (text, final, t) {
    var n = ' ' + S.norm(text) + ' ', out = [];
    S.signals.slice().forEach(function (g) {
      if (g.src !== 'voice' || !g.says) return;
      if (!g.says.some(function (p) { return n.indexOf(' ' + p + ' ') >= 0; })) return;
      out.push(g);
      if (said[g.id] && t - said[g.id] < 4000) return;
      said[g.id] = t; fire(g, t);
    });
    if (final) said = {};
    return out;
  };
  S.recent = function (src) { return recent[src] || []; };
  S.resetRecognisers = function () { state = {}; recent = {}; lastT = {}; };

  /* ---------- the eyes: the camera and the two finders ---------- */
  var E = S.eyes = { on: false, video: null, stream: null, hand: null, face: null, want: {}, stage: '', err: '', fps: 0, ms: 0, last: null, cpu: false, _n: 0, _t: 0, _vt: -1 };
  E.start = function (video, want, say) {
    E.stop(); E.video = video; E.want = want || { hands: true }; E.err = ''; E.cpu = false; E.fps = 0; E.ms = 0; E.delay = 0; E.on = true; E._n = 0; E._t = performance.now(); E._vt = -1; E._rv = false; E._rvSeen = false; E._fresh = false;
    say = say || function () {};
    var gen = E._gen = (E._gen || 0) + 1, alive = function () { return E.on && E._gen === gen; };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { E.err = 'This browser gives a page no camera.'; say(E.err); return Promise.resolve(false); }
    E.stage = 'the camera'; say('Asking for the camera…');
    var sz = E.want.size || [640, 480], cam = { facingMode: 'user', width: { ideal: sz[0] }, height: { ideal: sz[1] } };
    if (E.want.fps) cam.frameRate = { ideal: E.want.fps };
    return navigator.mediaDevices.getUserMedia({ video: cam, audio: false }).then(function (s) {
      if (!alive()) { s.getTracks().forEach(function (x) { x.stop(); }); return null; }
      E.stream = s; video.srcObject = s; return video.play();
    }).then(function () {
      if (!alive() || !E.stream) return null;
      /* exact: the camera says when each new picture is there, so each is looked at once and at once.
         It also says when the picture was taken, which gives the camera's own delay. */
      if (E.want.exact && video.requestVideoFrameCallback) {
        E._rv = true; E._rvAt = performance.now();
        var each = function (now, md) {
          if (!alive() || E.video !== video) return;
          E._fresh = true; E._rvSeen = true;
          if (md && md.captureTime) { var d = now - md.captureTime; if (d >= 0 && d < 2000) E.delay = E.delay ? E.delay * 0.9 + d * 0.1 : d; }
          video.requestVideoFrameCallback(each);
        };
        video.requestVideoFrameCallback(each);
      }
      E.stage = 'the finder (its program did not download)'; say('Loading the finder. The first time takes a few seconds…');
      return import(MP + '/vision_bundle.mjs');
    }).then(function (m) {
      if (!m || !alive()) return null;
      E.conn = m.HandLandmarker.HAND_CONNECTIONS || [];
      E.stage = 'the finder (its model did not download or would not run)';
      return m.FilesetResolver.forVisionTasks(MP + '/wasm').then(function (fs) {
        var make = function (cls, model, extra) {
          var opt = function (d) { var o = { baseOptions: { modelAssetPath: model, delegate: d }, runningMode: 'VIDEO' }; for (var k in extra) o[k] = extra[k]; return o; };
          return cls.createFromOptions(fs, opt('GPU')).catch(function () { E.cpu = true; return cls.createFromOptions(fs, opt('CPU')); });
        };
        var jobs = [];
        if (E.want.hands) jobs.push(make(m.HandLandmarker, HAND_MODEL, E.want.keep ? { numHands: E.want.max || 2, minHandPresenceConfidence: 0.3, minTrackingConfidence: 0.3 } : { numHands: E.want.max || 2 }).then(function (h) { E.hand = h; }));
        if (E.want.face) jobs.push(make(m.FaceLandmarker, FACE_MODEL, { numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true }).then(function (f) { E.face = f; }));
        return Promise.all(jobs);
      });
    }).then(function (ok) {
      if (!ok) return false;
      if (!alive()) { E.stop(); return false; }
      E.stage = ''; say(E.cpu ? 'Running without the graphics chip (slower).' : ''); return true;
    }).catch(function (e) { E.err = 'Could not start ' + E.stage + ': ' + String(e && e.message || e).slice(0, 140); say(E.err); return false; });
  };
  E.stop = function () { E.err = '';
    E.on = false;
    try { if (E.stream) E.stream.getTracks().forEach(function (x) { x.stop(); }); } catch (e) { /* gone */ }
    try { if (E.hand) E.hand.close(); } catch (e) { /* gone */ }
    try { if (E.face) E.face.close(); } catch (e) { /* gone */ }
    E.stream = null; E.hand = null; E.face = null; E.last = null; E._rv = false;
  };
  /* Call once per screen refresh. Returns what was seen in a new picture, or null when there is no new picture yet.
     {t, hands:[{side, src, lm, wl, n}], head:{n} or null, ms}
     want: {hands, face, max: how many hands to look for (2 unless said), size: [wide, high] to ask the camera for,
            fps: pictures a second to ask the camera for, exact: look at each picture once, as it comes,
            lean: find the hand and nothing more, keep: hold on to a hand through a blur} */
  E.poll = function () {
    var t = performance.now(), hr = null, fr = null, got = false;
    E.aspect = 1;
    if (window.__labTestEyes && E.on) { var x = window.__labTestEyes(t); if (x) { hr = E.want.hands ? x.hands || null : null; fr = E.want.face ? x.face || null : null; got = true; } }   // lab check only: made-up points in place of the camera
    else if (E.on && E.video && E.video.readyState >= 2 && (E.hand || E.face)) {
      if (E._rv && !E._rvSeen && t - E._rvAt > 1500) E._rv = false;      // the camera never said: watch the clock instead
      if (E._rv ? !E._fresh : E.video.currentTime === E._vt) return null;
      E._fresh = false; E._vt = E.video.currentTime;
      if (E.video.videoWidth && E.video.videoHeight) E.aspect = E.video.videoWidth / E.video.videoHeight;
      try { if (E.hand && E.want.hands) hr = E.hand.detectForVideo(E.video, t); if (E.face && E.want.face) fr = E.face.detectForVideo(E.video, t); got = true; }
      catch (e) { E.err = 'The finder stopped: ' + String(e && e.message || e).slice(0, 120); E.hand = E.face = null; return null; }
      var took = performance.now() - t; E.ms = E.ms ? E.ms * 0.9 + took * 0.1 : took;
    }
    if (!got) return null;
    var frame = { t: t, hands: [], head: null, ms: E.ms }, fed = {};
    var lean = !!E.want.lean, most = E.want.max || 99;
    if (hr && hr.landmarks) for (var i = 0; i < hr.landmarks.length && i < most; i++) {
      var side = hr.handedness && hr.handedness[i] && hr.handedness[i][0] ? hr.handedness[i][0].categoryName : 'Right';
      var wl = hr.worldLandmarks && hr.worldLandmarks[i], h = { side: side, src: side === 'Left' ? 'handL' : 'handR', lm: hr.landmarks[i], wl: wl, n: lean ? null : S.handNumbers(hr.landmarks[i], wl, E.aspect) };
      frame.hands.push(h); if (!lean && !fed[h.src]) { fed[h.src] = 1; S.feed(h.src, t, h.n); }   // every hand is reported; a taught signal is read from one hand a side; a lean look only finds the hand
    }
    if (fr && ((fr.facialTransformationMatrixes && fr.facialTransformationMatrixes.length) || (fr.faceBlendshapes && fr.faceBlendshapes.length))) {
      var rawHead = S.headNumbers(fr.facialTransformationMatrixes && fr.facialTransformationMatrixes[0], fr.faceBlendshapes && fr.faceBlendshapes[0]);
      frame.head = { raw: rawHead, n: S.ownHead(rawHead), lm: fr.faceLandmarks && fr.faceLandmarks[0] };   // raw = as the finder reports; n = measured from the person's own rest and eyes
      S.feed('head', t, frame.head.n);
    }
    E._n++; if (t - E._t >= 1000) { E.fps = E._n * 1000 / (t - E._t); E._n = 0; E._t = t; }
    E.last = frame; return frame;
  };
  /* draw what was found over the picture */
  E.draw = function (canvas, frame) {
    var v = E.video, w = (v && v.videoWidth) || 640, h = (v && v.videoHeight) || 480;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    var x = canvas.getContext('2d'); x.clearRect(0, 0, w, h);
    if (!frame) return;
    frame.hands.forEach(function (hd) {
      var L = hd.lm; x.strokeStyle = hd.side === 'Left' ? '#e5a23b' : '#39c5cf'; x.lineWidth = 3; x.beginPath();
      (E.conn || []).forEach(function (c) { var a = L[c.start], b = L[c.end]; if (a && b) { x.moveTo(a.x * w, a.y * h); x.lineTo(b.x * w, b.y * h); } });
      x.stroke(); x.fillStyle = '#fff';
      for (var j = 0; j < L.length; j++) { x.beginPath(); x.arc(L[j].x * w, L[j].y * h, 4, 0, 6.283); x.fill(); }
    });
    if (frame.head && frame.head.lm) { x.fillStyle = '#b38cf5'; for (var k = 0; k < frame.head.lm.length; k += 5) { var p = frame.head.lm[k]; x.fillRect(p.x * w - 1.5, p.y * h - 1.5, 3, 3); } }
    canvas.dataset.hands = frame.hands.length; canvas.dataset.face = frame.head ? 1 : 0;
  };

  /* ---------- the ears: the browser's own speech recogniser, kept open, and opened again when it stops itself ---------- */
  var A = S.ears = { on: false, rec: null, err: '', last: '', starts: 0, cb: null };
  A.supported = function () { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); };
  function openEars() {
    if (!A.on || A.rec) return;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, r;
    try { r = new SR(); r.continuous = true; r.interimResults = true; } catch (e) { A.err = 'Speech recognition would not start: ' + (e && e.message || e); A.on = false; return; }
    A.rec = r; A.starts++;
    r.onresult = function (e) {
      if (A.rec !== r || !A.cb) return;
      for (var i = e.resultIndex; i < e.results.length; i++) { var x = e.results[i], a = x && x[0]; if (a && a.transcript && String(a.transcript).trim()) A.cb(String(a.transcript).trim(), !!x.isFinal); }
    };
    r.onerror = function (e) {
      var c = e && e.error; A.last = c || '';
      if (c === 'not-allowed' || c === 'service-not-allowed') { A.err = 'The microphone is not allowed for this page.'; A.on = false; }
      else if (c === 'audio-capture') { A.err = 'No microphone was found.'; A.on = false; }
      else if (c === 'language-not-supported') { A.err = 'This browser cannot recognise speech in this language.'; A.on = false; }
    };
    r.onend = function () { if (A.rec !== r) return; A.rec = null; if (A.on) setTimeout(openEars, 250); };   // it stops itself after a pause; keep listening
    try { r.start(); } catch (e2) { A.rec = null; A.err = 'Speech recognition would not start: ' + (e2 && e2.message || e2); A.on = false; }
  }
  A.start = function (cb) {
    A.cb = cb; A.err = '';
    if (!A.supported()) { A.err = 'This browser has no speech recognition.'; A.on = false; return false; }
    A.on = true; openEars(); return A.on;
  };
  A.stop = function () { A.on = false; A.cb = null; var r = A.rec; A.rec = null; if (r) { r.onend = null; r.onresult = null; r.onerror = null; try { r.abort(); } catch (e) { /* already stopped */ } } };

  window.Signals = S;
})();
