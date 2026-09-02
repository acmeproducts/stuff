/* N1 (25·base, plan v20.20.0 §5.1) — #653 rejoin a declined room/thread +
   notification sound configuration line. Adds a fourth option to the
   left-rail clock long-press menu: "Join thread" — paste an invite link, or
   scan its QR where the platform can (BarcodeDetector; hidden elsewhere).
   Joining navigates to the invite's own #j= address — the app's existing
   boot path does the join; nothing in that path is touched. Adds only;
   wraps nothing; replaces nothing. */
(function () {
  function n1Log(ev, d, lvl) { try { if (typeof log === 'function') log(ev, d || {}, lvl || 'ok'); } catch (_) {} }
  function el(tag, attrs, text) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; return e; }
  function extractJoin(text) {
    if (!text) return null;
    var m = String(text).match(/#j=([A-Za-z0-9\-_=+/%.]+)/);
    if (!m) return null;
    var base = location.href.split('?')[0].split('#')[0];
    return base + '#j=' + m[1];
  }
  function go(url) {
    n1Log('n1_join_thread_go', { len: url.length });
    var samePage = url.split('#')[0] === location.href.split('#')[0];
    location.href = url;
    if (samePage) location.reload();
  }
  function openJoin() {
    var scrim = document.getElementById('m-n1join');
    if (!scrim) {
      scrim = el('div', { 'class': 'modal-scrim', id: 'm-n1join' });
      var modal = el('div', { 'class': 'modal' });
      modal.appendChild(el('div', { 'class': 'modal-title' }, 'Join thread'));
      var inp = el('input', { 'class': 'field-input', id: 'n1-join-url', autocomplete: 'off', placeholder: 'Paste invite link' });
      modal.appendChild(inp);
      var row = el('div', { style: 'display:flex;gap:10px;margin-top:12px' });
      if ('BarcodeDetector' in window) {
        var scan = el('button', { 'class': 'btn ghost', id: 'n1-scan' }, 'Scan QR');
        scan.addEventListener('click', function () { n1Scan(); });
        row.appendChild(scan);
      }
      var joinBtn = el('button', { 'class': 'btn', id: 'n1-join' }, 'Join');
      joinBtn.addEventListener('click', function () {
        var url = extractJoin(document.getElementById('n1-join-url').value);
        if (!url) { n1Log('n1_join_thread_bad_link', {}, 'warn'); inp.style.borderColor = '#c0392b'; return; }
        scrim.classList.remove('show');
        go(url);
      });
      row.appendChild(joinBtn);
      modal.appendChild(row);
      var vid = el('video', { id: 'n1-scan-video', playsinline: '', style: 'display:none;width:100%;margin-top:12px;border-radius:12px' });
      modal.appendChild(vid);
      scrim.appendChild(modal);
      scrim.addEventListener('click', function (e) { if (e.target === scrim) { n1StopScan(); scrim.classList.remove('show'); } });
      document.body.appendChild(scrim);
    }
    scrim.classList.add('show');
  }
  var _scanStream = null, _scanTimer = null;
  function n1StopScan() {
    if (_scanTimer) { clearInterval(_scanTimer); _scanTimer = null; }
    if (_scanStream) { try { _scanStream.getTracks().forEach(function (t) { t.stop(); }); } catch (_) {} _scanStream = null; }
    var v = document.getElementById('n1-scan-video'); if (v) { v.srcObject = null; v.style.display = 'none'; }
  }
  function n1Scan() {
    var v = document.getElementById('n1-scan-video');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (stream) {
      _scanStream = stream; v.srcObject = stream; v.style.display = ''; v.play();
      var det = new BarcodeDetector({ formats: ['qr_code'] });
      _scanTimer = setInterval(function () {
        det.detect(v).then(function (codes) {
          for (var i = 0; i < (codes || []).length; i++) {
            var url = extractJoin(codes[i].rawValue);
            if (url) { n1StopScan(); document.getElementById('m-n1join').classList.remove('show'); go(url); return; }
          }
        }).catch(function () {});
      }, 400);
    }).catch(function (e) { n1Log('n1_scan_denied', { e: String(e && e.name || e) }, 'warn'); });
  }
  function wire() {
    var menu = document.querySelector('#m-s13 .modal');
    if (!menu || document.getElementById('s13-join')) return;
    var b = el('button', { 'class': 'btn ghost', id: 's13-join', style: 'margin-top:10px' }, 'Join thread');
    b.addEventListener('click', function () { document.getElementById('m-s13').classList.remove('show'); openJoin(); });
    menu.appendChild(b);
    n1Log('n1_join_thread_wired', {});
    try { n1Log('n1_notif_cfg', { perm: (window.Notification && Notification.permission) || 'unsupported', decl: !!(window.PushManager) }); } catch (_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
