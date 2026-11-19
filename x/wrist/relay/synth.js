/* Lab check only: a made-up hand and a made-up head, shaped as the two finders report them.
   Used by signals-check.js (the engine alone) and signals-page-test.py (the Lab cards). Not served, not part of the product.

   hand({side, x, y, size, curl, pinch, roll, yaw, pitch})
     side 'Right' or 'Left'; x, y where the palm is in the picture (0..1); size = how long the palm looks (0.2 is an arm's length away);
     curl = one number or five [thumb, index, middle, ring, little], 0 straight to 1 folded; pinch 0..1 = thumb tip brought to the index tip;
     roll, yaw, pitch in degrees.
   face({turn, nod, lean, blend}) in degrees; blend = {jawOpen: 0.8, ...} */
(function (root) {
  'use strict';
  var RAD = Math.PI / 180;
  function rx(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; }
  function ry(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; }
  function rz(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; }
  function lerp(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }

  function hand(o) {
    o = o || {};
    var curl = o.curl == null ? 0 : o.curl, c = typeof curl === 'number' ? [curl, curl, curl, curl, curl] : curl;
    var mirror = o.side === 'Left' ? -1 : 1, P = [], i, k;
    // the hand lying flat: wrist at the origin, fingers along +y, thumb on the -x side
    P[0] = [0, 0, 0];
    var th = [[-0.35, 0.25, 0], [-0.6, 0.5, 0], [-0.8, 0.7, 0], [-0.95, 0.9, 0]];
    var tc = c[0] * 80 * RAD;                                   // the thumb folds across the palm
    for (i = 1; i < 4; i++) { var d = [th[i][0] - th[i - 1][0], th[i][1] - th[i - 1][1], 0]; d = rz(d, tc * i * 0.9); th[i] = [th[i - 1][0] + d[0], th[i - 1][1] + d[1], 0.02 * i * c[0]]; }
    for (i = 0; i < 4; i++) P[1 + i] = th[i];
    var base = [[-0.35, 0.9, 0], [-0.1, 1.0, 0], [0.15, 0.95, 0], [0.38, 0.8, 0]], seg = [0.45, 0.3, 0.25];
    for (k = 0; k < 4; k++) {
      var at = base[k], bend = 0; P[5 + k * 4] = at;
      for (i = 0; i < 3; i++) { bend += c[k + 1] * 90 * RAD; at = [at[0], at[1] + seg[i] * Math.cos(bend), at[2] + seg[i] * Math.sin(bend)]; P[6 + k * 4 + i] = at; }
    }
    if (o.pinch) { var tip = P[8]; P[4] = lerp(P[4], tip, o.pinch); P[3] = lerp(P[3], lerp(P[2], tip, 0.6), o.pinch); }
    var size = o.size == null ? 0.2 : o.size, cx = o.x == null ? 0.5 : o.x, cy = o.y == null ? 0.5 : o.y, lm = [], wl = [];
    for (i = 0; i < 21; i++) {
      var q = [P[i][0] * mirror, -(P[i][1] - 0.5), P[i][2]];     // the picture's y runs downward; turn about the middle of the palm
      q = rx(q, (o.pitch || 0) * RAD); q = ry(q, (o.yaw || 0) * RAD); q = rz(q, (o.roll || 0) * RAD);
      lm.push({ x: cx + q[0] * size, y: cy + q[1] * size, z: q[2] * size });
      wl.push({ x: q[0] * 0.09, y: q[1] * 0.09, z: q[2] * 0.09 });
    }
    return { side: o.side || 'Right', lm: lm, wl: wl };
  }

  function face(o) {
    o = o || {};
    var a = (o.turn || 0) * RAD, b = (o.nod || 0) * RAD, c = (o.lean || 0) * RAD;
    var col = function (v) { return ry(rx(rz(v, c), b), a); }, X = col([1, 0, 0]), Y = col([0, 1, 0]), Z = col([0, 0, 1]);
    var cats = [], blend = o.blend || {}, names = ['eyeBlinkLeft', 'eyeBlinkRight', 'jawOpen', 'browInnerUp', 'mouthSmileLeft', 'mouthSmileRight', 'mouthPucker'];
    names.forEach(function (n) { cats.push({ categoryName: n, score: blend[n] || 0 }); });
    var lm = []; for (var i = 0; i < 40; i++) { var t = i / 40 * 6.283; lm.push({ x: 0.5 + 0.12 * Math.cos(t), y: 0.42 + 0.16 * Math.sin(t), z: 0 }); }
    return { matrix: { data: [X[0], X[1], X[2], 0, Y[0], Y[1], Y[2], 0, Z[0], Z[1], Z[2], 0, 0, 0, -40, 1] }, blend: { categories: cats }, lm: lm };
  }

  /* what the page's camera runner expects back from its test hook */
  function seen(hands, f) {
    var out = { hands: { landmarks: [], worldLandmarks: [], handedness: [] }, face: null };
    (hands || []).forEach(function (h) { out.hands.landmarks.push(h.lm); out.hands.worldLandmarks.push(h.wl); out.hands.handedness.push([{ categoryName: h.side, score: 0.98 }]); });
    if (f) out.face = { facialTransformationMatrixes: [f.matrix], faceBlendshapes: [f.blend], faceLandmarks: [f.lm] };
    return out;
  }

  var api = { hand: hand, face: face, seen: seen };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Synth = api;
})(typeof window !== 'undefined' ? window : globalThis);
