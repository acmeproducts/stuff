/* ═══════════ GAP PART · X1-check-card.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: (none)
   adds: x1Bigrams, x1Score, x1Verdict, x1Open, x1Close
*/
/* ─────────────────────────────────────────────────────────────────────────────
   X-1 · THE TRANSLATION CHECK CARD (owner, 2026-10-03)

   chat-test proved the gesture on the phone: double-tap a bubble's header and
   a card shows what was said, what the other side received, and what that
   comes back as when translated home again. A wording score (shared letter
   pairs, the Dice coefficient) says Match / Partial / Miss. Copy puts the
   three lines on the clipboard for a report. No AI review here — that tier is
   deferred by the owner's ruling.

   Nothing existing moves. The header's single tap (highlight), its three
   buttons and the long-press menu are untouched: the second tap of a pair is
   detected on pointerup, on the same bubble, inside 350 ms and 30 px; a tap
   on a header button or the receipt is never counted. The back-translation
   goes through translateWithRetry as every translation does, so the G-1
   provider order and the cache apply to it.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof translateWithRetry !== 'function') return;
  var X1_MS = 350, X1_PX = 30;
  var st = document.createElement('style');
  st.textContent = '#m-x1 .x1-row{margin:8px 0}#m-x1 .x1-lbl{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-dim);margin-bottom:2px}'
    + '#m-x1 .x1-txt{font-size:14px;line-height:1.35;word-break:break-word}#m-x1 .x1-txt.wait{color:var(--ink-dim);font-style:italic}'
    + '#m-x1 .x1-score{display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;font-size:12.5px;font-weight:700;background:#eee;color:#333}'
    + '#m-x1 .x1-score.match{background:#dff5e3;color:#1d6b35}#m-x1 .x1-score.partial{background:#fff1cc;color:#7a5a00}#m-x1 .x1-score.miss{background:#ffdcd6;color:#8f1d0e}';
  document.head.appendChild(st);
  var scrim = document.createElement('div');
  scrim.className = 'modal-scrim'; scrim.id = 'm-x1';
  scrim.innerHTML = '<div class="modal"><div class="modal-title">Translation check</div>'
    + '<div class="x1-row"><div class="x1-lbl">Spoken <span id="x1-sl"></span></div><div class="x1-txt" id="x1-src"></div></div>'
    + '<div class="x1-row"><div class="x1-lbl">Translation <span id="x1-tl"></span></div><div class="x1-txt" id="x1-tr"></div></div>'
    + '<div class="x1-row"><div class="x1-lbl">Back-translation</div><div class="x1-txt wait" id="x1-bt">Checking…</div><div class="x1-score" id="x1-score" style="display:none"></div></div>'
    + '<div class="modal-row"><button class="btn ghost" id="x1-copy">Copy</button><button class="btn" id="x1-close">Close</button></div></div>';
  var host = document.getElementById('m-clarify'); if (host && host.parentNode) host.parentNode.appendChild(scrim); else document.body.appendChild(scrim);

  function x1Bigrams(s) {
    s = String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
    var m = {}, n = 0;
    for (var i = 0; i + 1 < s.length; i++) { var g = s.slice(i, i + 2); if (g === ' ' + ' ') continue; m[g] = (m[g] || 0) + 1; n++; }
    return { m: m, n: n, s: s };
  }
  /* Dice coefficient over letter pairs: 1 is the same wording, 0 shares nothing */
  function x1Score(a, b) {
    var A = x1Bigrams(a), B = x1Bigrams(b);
    if (!A.n && !B.n) return A.s === B.s ? 1 : 0;
    if (!A.n || !B.n) return 0;
    var shared = 0;
    for (var g in A.m) if (B.m[g]) shared += Math.min(A.m[g], B.m[g]);
    return (2 * shared) / (A.n + B.n);
  }
  function x1Verdict(score) { return score >= 0.8 ? 'match' : score >= 0.5 ? 'partial' : 'miss'; }

  var cur = null;
  function x1Close() { scrim.classList.remove('show'); cur = null; }
  function x1Open(e) {
    if (!e || e.kind === 'sys') return;
    cur = e;
    var src = e.sourceText || '', tr = e.translatedText || '';
    document.getElementById('x1-sl').textContent = e.srcLang ? '· ' + gL(e.srcLang).name : '';
    document.getElementById('x1-tl').textContent = e.tgtLang ? '· ' + gL(e.tgtLang).name : '';
    document.getElementById('x1-src').textContent = src;
    document.getElementById('x1-tr').textContent = tr;
    var bt = document.getElementById('x1-bt'), sc = document.getElementById('x1-score');
    bt.textContent = 'Checking…'; bt.className = 'x1-txt wait'; sc.style.display = 'none'; sc.className = 'x1-score';
    scrim.classList.add('show');
    try { log('x1_card', { id: e.id }, 'ok'); } catch (_) {}
    var t0 = Date.now();
    if (!tr || !e.srcLang || !e.tgtLang || e.srcLang === e.tgtLang) { bt.textContent = src ? '(same language)' : '(nothing to check)'; return; }
    translateWithRetry(tr, e.tgtLang, e.srcLang, 1).then(function (r) {
      if (cur !== e) return;
      var back = (r && r.ok) ? String(r.text || '') : '';
      if (!back) { bt.textContent = 'Back-translation unavailable'; try { log('bt_check', { id: e.id, ok: false, ms: Date.now() - t0 }, 'warn'); } catch (_) {} return; }
      bt.textContent = back; bt.className = 'x1-txt';
      var score = x1Score(src, back), v = x1Verdict(score);
      sc.textContent = (v === 'match' ? 'Match' : v === 'partial' ? 'Partial' : 'Miss') + ' · ' + Math.round(score * 100) + '%';
      sc.className = 'x1-score ' + v; sc.style.display = '';
      cur.__x1Back = back;
      try { log('bt_check', { id: e.id, ok: true, score: Math.round(score * 100) / 100, verdict: v, ms: Date.now() - t0 }, 'ok'); } catch (_) {}
    });
  }
  document.getElementById('x1-close').addEventListener('click', x1Close);
  scrim.addEventListener('click', function (ev) { if (ev.target === scrim) x1Close(); });
  document.getElementById('x1-copy').addEventListener('click', function () {
    if (!cur) return;
    var lines = 'Spoken (' + (cur.srcLang || '?') + '): ' + (cur.sourceText || '') + '\nTranslation (' + (cur.tgtLang || '?') + '): ' + (cur.translatedText || '')
      + '\nBack-translation: ' + (cur.__x1Back || document.getElementById('x1-bt').textContent) + '\n' + document.getElementById('x1-score').textContent;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lines).then(function () { toast('Copied'); }, function () { toast('Copy failed'); });
      else toast('Copy unavailable');
    } catch (_) { toast('Copy failed'); }
  });

  /* the gesture: a second pointerup on the same bubble's header, soon and close */
  var last = null;
  function onUp(ev) {
    var meta = ev.target && ev.target.closest ? ev.target.closest('.meta') : null;
    if (!meta) { last = null; return; }
    if (ev.target.closest('[data-hact]') || ev.target.closest('[data-receipt]')) { last = null; return; }
    var msg = meta.closest('.msg[data-id]'); if (!msg) { last = null; return; }
    var id = msg.getAttribute('data-id'), now = Date.now(), x = ev.clientX || 0, y = ev.clientY || 0;
    if (last && last.id === id && now - last.t < X1_MS && Math.abs(x - last.x) < X1_PX && Math.abs(y - last.y) < X1_PX) {
      last = null;
      var e = null; try { e = (transcript || []).filter(function (t) { return t.id === id; })[0] || null; } catch (_) {}
      if (e) x1Open(e);
      return;
    }
    last = { id: id, t: now, x: x, y: y };
  }
  function bind() { var t = document.getElementById('transcript'); (t || document).addEventListener('pointerup', onUp); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
  window.x1Open = x1Open; window.x1Score = x1Score; window.x1Verdict = x1Verdict; window.x1Close = x1Close; window.x1Bigrams = x1Bigrams;
})();
