// tb-app.js
// App controller. Wires TBMedia → TBTransport + TBTranscribe → TBTranslate.
// Owns all app state, UI, transcript, and lobby logic.
// Modules have no knowledge of each other — all wiring is here.

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
var LANGS = [
  { code: 'en', label: 'English', flag: '🇺🇸' }, { code: 'th', label: 'Thai', flag: '🇹🇭' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' }, { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' }, { code: 'zh', label: 'Chinese (Mandarin)', flag: '🇨🇳' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' }, { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' }, { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' }, { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷' }, { code: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', label: 'Indonesian', flag: '🇮🇩' }, { code: 'ms', label: 'Malay', flag: '🇲🇾' },
  { code: 'fil', label: 'Filipino', flag: '🇵🇭' }, { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', label: 'Swedish', flag: '🇸🇪' }, { code: 'pl', label: 'Polish', flag: '🇵🇱' },
  { code: 'tr', label: 'Turkish', flag: '🇹🇷' }
];

// Expose TTS locale map so tb-transcribe.js can access it
window.TB_TTS_LOCALE = {
  en: 'en-US', th: 'th-TH', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN',
  ar: 'ar-SA', hi: 'hi-IN', ru: 'ru-RU', fr: 'fr-FR', de: 'de-DE',
  es: 'es-ES', it: 'it-IT', pt: 'pt-BR', vi: 'vi-VN', id: 'id-ID',
  ms: 'ms-MY', fil: 'fil-PH', nl: 'nl-NL', sv: 'sv-SE', pl: 'pl-PL', tr: 'tr-TR'
};

var SUB_LINGER = 5000, MAX_TR = 300;
var RK = 'tb_recent_rooms', TP = 'tb_transcript_', RL = 12;

// ── App state ────────────────────────────────────────────────────────────────
var room = { id: null, myLang: '', theirLang: '', role: null, name: '', solo: false };
var micOn = true, camOn = true, transcriptCollapsed = false, transcriptTtsOn = false;
var transcript = [], localSubSeq = 0, partnerSpeakTimer = null, callHistoryPushed = false;
var viewingRoomId = null;
var _debugLog = [];

// ── TBApp public surface (used by other modules for logging/toast) ────────────
var TBApp = {
  log: log,
  toast: toast
};

// ── Utils ────────────────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
function gL(c) {
  c = (c || '').toLowerCase();
  for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === c) return LANGS[i];
  return { code: c || '?', label: (c || '?').toUpperCase(), flag: '🌐' };
}
function detectLang(t, fb) {
  t = (t || '').trim();
  if (!t) return fb || 'en';
  if (/[฀-๿]/.test(t)) return 'th';
  if (/[぀-ヿ]/.test(t)) return 'ja';
  if (/[一-鿿]/.test(t)) return 'zh';
  if (/[가-힯]/.test(t)) return 'ko';
  if (/[؀-ۿ]/.test(t)) return 'ar';
  return fb || 'en';
}

function toast(m) {
  var e = $('toast');
  e.textContent = m;
  e.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { e.classList.remove('show'); }, 2500);
}

function log(ev, d, l) {
  var r = { ts: new Date().toISOString(), ev: ev, d: d || {}, l: l || 'info' };
  _debugLog.push(r);
  if (_debugLog.length > 500) _debugLog.shift();
  var b = $('log-body');
  if (!b) return;
  var div = document.createElement('div');
  div.className = 'log-row ' + (l || 'info');
  div.innerHTML = '<span class="ts">' + r.ts.slice(11, 23) + '</span> <span class="ev">' +
    esc(ev) + '</span> ' + esc(JSON.stringify(d || {}));
  b.appendChild(div);
  b.scrollTop = b.scrollHeight;
}

function openLog() { log('log_open', { hasSpeech: !!(window.SpeechRecognition || window.webkitSpeechRecognition) }); $('log-overlay').classList.add('show'); }
function closeLog() { $('log-overlay').classList.remove('show'); }
function clearLogText() { _debugLog = []; $('log-body').innerHTML = ''; toast('Cleared'); }
function copyLogText() {
  var t = _debugLog.map(function (r) { return r.ts + ' [' + r.ev + '] ' + JSON.stringify(r.d); }).join('\n');
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast('Copied'); });
}

// ── Persistence ──────────────────────────────────────────────────────────────
function trKey(id) { return TP + (id || room.id); }
function saveTr() { if (room.id) try { localStorage.setItem(trKey(), JSON.stringify(transcript)); } catch (_) {} }
function loadTr(id) { try { var r = localStorage.getItem(trKey(id || room.id)); return r ? JSON.parse(r) : []; } catch (_) { return []; } }
function clearTrS(id) { try { localStorage.removeItem(trKey(id)); } catch (_) {} }
function getRecent() { try { return JSON.parse(localStorage.getItem(RK) || '[]'); } catch (_) { return []; } }
function setRecent(r) { localStorage.setItem(RK, JSON.stringify(r.slice(0, RL))); }
function saveRecent() {
  if (!room.id) return;
  var rows = getRecent().filter(function (r) { return r.id !== room.id; });
  rows.unshift({ id: room.id, name: room.name || (gL(room.myLang).flag + ' ↔ ' + gL(room.theirLang).flag), myLang: room.myLang, theirLang: room.theirLang, ts: Date.now() });
  setRecent(rows);
  renderRecent();
}
function delRecent(id) { setRecent(getRecent().filter(function (r) { return r.id !== id; })); clearTrS(id); renderRecent(); }

// ── UI sync ──────────────────────────────────────────────────────────────────
function syncMic() {
  $('mic-btn').classList.toggle('off', !micOn);
  $('mic-on').style.display = micOn ? '' : 'none';
  $('mic-off').style.display = micOn ? 'none' : '';
}
function syncCam() {
  $('cam-btn').classList.toggle('off', !camOn);
  $('cam-on').style.display = camOn ? '' : 'none';
  $('cam-off').style.display = camOn ? 'none' : '';
  $('local-video').style.display = camOn ? '' : 'none';
}
function syncTranscriptBtn() {
  var b = $('transcript-toggle-btn');
  if (!b) return;
  b.setAttribute('aria-expanded', transcriptCollapsed ? 'false' : 'true');
}
function syncTtsBtn() {
  var b = $('transcript-tts-toggle');
  if (!b) return;
  b.setAttribute('aria-pressed', transcriptTtsOn ? 'true' : 'false');
  var on = b.querySelector('.tts-on'), off = b.querySelector('.tts-off');
  if (on) on.style.display = transcriptTtsOn ? '' : 'none';
  if (off) off.style.display = transcriptTtsOn ? 'none' : '';
}
function markPartnerTalking() {
  var i = $('partner-speaking-indicator');
  if (!i) return;
  i.classList.add('show');
  clearTimeout(partnerSpeakTimer);
  partnerSpeakTimer = setTimeout(function () { i.classList.remove('show'); }, 1200);
}
function showSub(text, cls) {
  var a = $('subtitle-area'), el = document.createElement('div');
  el.className = 'subtitle-line ' + cls;
  el.textContent = text;
  a.appendChild(el);
  while (a.children.length > 2) a.children[0].remove();
  setTimeout(function () { if (el.parentNode) el.remove(); }, SUB_LINGER);
}
function speakText(text, lang) {
  text = norm(text);
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = (window.TB_TTS_LOCALE || {})[lang] || lang || 'en-US';
  window.speechSynthesis.speak(u);
}
function toggleTranscriptTts() {
  transcriptTtsOn = !transcriptTtsOn;
  syncTtsBtn();
  if (!transcriptTtsOn && window.speechSynthesis) window.speechSynthesis.cancel();
}
function toggleTranscript() {
  transcriptCollapsed = !transcriptCollapsed;
  $('call-screen').classList.toggle('transcript-collapsed', transcriptCollapsed);
  syncTranscriptBtn();
}
function swapVideos() { $('call-videos').classList.toggle('swapped'); }

// ── Remote video display ─────────────────────────────────────────────────────
function showRemoteStream(remoteStream) {
  var rv = $('remote-video');
  if (rv.srcObject !== remoteStream) rv.srcObject = remoteStream;
  var tracks = remoteStream.getTracks();
  var hasVideo = tracks.some(function (t) { return t.kind === 'video' && t.readyState === 'live'; });
  var hasAny = tracks.some(function (t) { return t.readyState === 'live'; });
  if (hasAny) {
    rv.muted = true;  // must be muted for autoplay policy
    rv.play()
      .then(function () { rv.muted = false; })  // unmute after play() succeeds
      .catch(function (e) { log('remote_play_fail', { e: String(e) }, 'warn'); });
    $('solo-banner').style.display = 'none';
  }
  $('no-video-msg').style.display = hasVideo ? 'none' : '';
}

// ── Transcript ───────────────────────────────────────────────────────────────
function trHtml(e) {
  var lang = e.srcLang || room.myLang || 'en';
  var locale = (window.TB_TTS_LOCALE || {})[lang] || 'en-US';
  var ts = new Date(e.ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  var who = e.who === 'me' ? 'You' : 'Partner';
  var label = who + ' · ' + gL(lang).label;
  var tgtLabel = gL(e.tgtLang || room.theirLang || lang).label;
  var src = e.sourceText || '', tgt = e.translatedText || src;
  return '<div class="tr-entry"><div class="tr-bubble">' +
    '<div class="tr-head"><div class="tr-who ' + (e.who === 'me' ? 'mine' : '') + '">' + esc(label) + '</div>' +
    '<div class="tr-time">' + esc(ts) + '</div></div>' +
    '<div class="tr-body">' +
    '<div class="tr-col source"><div class="tr-label">' + esc(gL(lang).label) + '</div>' +
    '<div class="tr-text">' + esc(src) + '</div>' +
    '<button class="tr-tts" onclick="speakText(' + JSON.stringify(src) + ',' + JSON.stringify(lang) + ')">' +
    '<svg viewBox="0 0 24 24"><path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg></button></div>' +
    '<div class="tr-divider"></div>' +
    '<div class="tr-col"><div class="tr-label">' + esc(tgtLabel) + '</div>' +
    '<div class="tr-text">' + esc(tgt) + '</div>' +
    '<button class="tr-tts" onclick="speakText(' + JSON.stringify(tgt) + ',' + JSON.stringify(e.tgtLang || room.theirLang || lang) + ')">' +
    '<svg viewBox="0 0 24 24"><path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg></button></div>' +
    '</div></div></div>';
}

function appendTrDom(entry) {
  var b = $('transcript-body'), w = $('call-transcript');
  if (!b) return;
  var em = b.querySelector('.tr-empty');
  if (em) em.remove();
  var near = (w.scrollHeight - w.scrollTop - w.clientHeight) < 60;
  b.insertAdjacentHTML('beforeend', trHtml(entry));
  if (near) w.scrollTop = w.scrollHeight;
}

function renderTr() {
  var b = $('transcript-body');
  if (!b) return;
  if (!transcript.length) { b.innerHTML = '<div class="tr-empty">Speak to see transcript here.</div>'; return; }
  b.innerHTML = transcript.slice(-120).map(trHtml).join('');
  $('call-transcript').scrollTop = $('call-transcript').scrollHeight;
}

function addTr(who, src, tr, sL, tL, ss) {
  src = norm(src); tr = norm(tr) || src;
  if (!src) return;
  var prev = transcript.length ? transcript[transcript.length - 1] : null;
  if (prev && prev.who === who && prev.sourceText === src && Date.now() - prev.ts < 5000) return;
  var entry = { who: who, sourceText: src, translatedText: tr, srcLang: sL, tgtLang: tL, subtitleSeq: ss || null, ts: Date.now() };
  transcript.push(entry);
  if (transcript.length > MAX_TR) transcript.splice(0, transcript.length - MAX_TR);
  saveTr();
  appendTrDom(entry);
  if (transcriptTtsOn && src) speakText(src, sL || room.myLang);
}

function patchTr(who, ss, newTr, sL, tL) {
  newTr = norm(newTr);
  if (!newTr) return;
  for (var i = transcript.length - 1; i >= 0; i--) {
    if (transcript[i].who === who && transcript[i].subtitleSeq === ss) {
      if (transcript[i].translatedText === newTr) return;
      transcript[i].translatedText = newTr;
      transcript[i].ts = Date.now();
      saveTr(); renderTr(); return;
    }
  }
  addTr(who, newTr, newTr, sL, tL, ss);
}

function copyTr() {
  if (!transcript.length) { toast('No transcript'); return; }
  var t = transcript.map(function (e) {
    var ts = new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return '[' + ts + '] ' + (e.who === 'me' ? 'You' : 'Partner') + ': ' + e.sourceText +
      (e.translatedText && e.translatedText !== e.sourceText ? ' → ' + e.translatedText : '');
  }).join('\n');
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast('Copied'); });
}

function exportTxt() {
  if (!transcript.length) { toast('No transcript'); return; }
  var t = 'TalkBridge Transcript\n' + (room.name ? room.name + '\n' : '') + new Date().toLocaleString() + '\n\n' +
    transcript.map(function (e) {
      var ts = new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return '[' + ts + '] ' + (e.who === 'me' ? 'You' : 'Partner') + ' (' + ((e.srcLang || '?').toUpperCase()) + '): ' +
        e.sourceText + (e.translatedText && e.translatedText !== e.sourceText ? '\n → (' + ((e.tgtLang || '?').toUpperCase()) + '): ' + e.translatedText : '');
    }).join('\n\n');
  var blob = new Blob([t], { type: 'text/plain' });
  var u = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = u; a.download = 'talkbridge-' + new Date().toISOString().slice(0, 10) + '.txt';
  a.click();
  setTimeout(function () { URL.revokeObjectURL(u); }, 0);
  toast('Exported');
}

// ── Invite link ───────────────────────────────────────────────────────────────
function encInv(p) { try { return btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (_) { return ''; } }
function decInv(s) { if (!s) return null; try { var b = s.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '='; return JSON.parse(decodeURIComponent(escape(atob(b)))); } catch (_) { return null; } }
function invUrl() { return location.href.split('?')[0].split('#')[0] + '#j=' + encInv({ r: room.id, ml: room.myLang, tl: room.theirLang, n: room.name || '' }); }
function copyLink() { var u = invUrl(); if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { toast('Link copied'); }); }
function shareLink() { var u = invUrl(); if (navigator.share) navigator.share({ title: 'TalkBridge', url: u }).catch(function () {}); else copyLink(); }

// ── Relay message handler (from Transport) ───────────────────────────────────
function onRelayMessage(d) {
  if (d.type === 'hello') {
    $('solo-banner').style.display = 'none';
    return;
  }
  if (d.type === 'subtitle') {
    markPartnerTalking();
    if (d.text && d.targetLang === room.myLang) showSub(d.text, 'partner');
    addTr('partner', d.sourceText, d.text, d.sourceLang, d.targetLang, d.subtitleSeq);
    return;
  }
  if (d.type === 'subtitle-update') {
    markPartnerTalking();
    if (d.text && d.targetLang === room.myLang) showSub(d.text, 'partner');
    patchTr('partner', d.subtitleSeq, d.text, d.sourceLang, d.targetLang);
    return;
  }
}

// ── Transcribe → Translate → Broadcast (pipeline wired here) ─────────────────
TBTranscribe.onFinal(function (text, lang) {
  var src = detectLang(text, room.myLang);
  var tgt = room.theirLang;
  var ss = ++localSubSeq;
  showSub(text, 'mine');
  TBTransport.send({ type: 'subtitle', subtitleSeq: ss, text: text, sourceText: text, sourceLang: src, targetLang: tgt });
  addTr('me', text, text, src, tgt, ss);
  TBTranslate.text(text, src, tgt).then(function (tr) {
    tr = norm(tr) || text;
    if (tr !== text) {
      TBTransport.send({ type: 'subtitle-update', subtitleSeq: ss, text: tr, sourceText: text, sourceLang: src, targetLang: tgt });
      patchTr('me', ss, tr, src, tgt);
    }
  });
});

// ── Call entry and exit ───────────────────────────────────────────────────────
async function enterCall() {
  // Step 1: Media — must succeed before anything else starts
  var stream;
  try {
    stream = await TBMedia.init();
  } catch (e) {
    toast('Camera and mic access required');
    log('media_fail', { e: String(e) }, 'error');
    return false;
  }

  // Step 2: Local video immediately
  $('local-video').srcObject = stream;

  // Step 3: Show call UI
  transcript = loadTr() || [];
  $('lobby').classList.add('hidden');
  if (!callHistoryPushed) { history.pushState({ tbView: 'call' }, '', location.href); callHistoryPushed = true; }
  $('call-screen').classList.add('active');
  $('solo-banner').style.display = '';
  $('no-video-msg').style.display = '';
  renderTr(); syncMic(); syncCam(); syncTranscriptBtn(); syncTtsBtn();
  $('lobby-link').textContent = invUrl();

  // Step 4: Transcribe — starts immediately, works solo
  TBTranscribe.start(room.myLang);

  // Step 5: Transport — relay opens, WebRTC starts inside ws.onopen
  TBTransport.onRemoteStream(showRemoteStream);
  TBTransport.onConnected(function () { log('app_peer_connected', {}, 'ok'); });
  TBTransport.onDisconnected(function (reason) {
    if (reason === 'hangup') toast('Partner left');
    else log('app_peer_disconnected', { reason: reason }, 'warn');
  });
  TBTransport.onRelayMessage(onRelayMessage);
  TBTransport.init(room, stream);

  return true;
}

function cleanUp() {
  saveTr();
  TBTranscribe.stop();
  TBTransport.hangup();
  TBMedia.stop();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  $('call-screen').classList.remove('active', 'transcript-collapsed');
  $('lobby').classList.remove('hidden');
  $('subtitle-area').innerHTML = '';
  $('no-video-msg').style.display = '';
  $('partner-speaking-indicator').classList.remove('show');
  clearTimeout(partnerSpeakTimer);
  var rv = $('remote-video'); rv.srcObject = null; rv.muted = true;
  transcript = []; micOn = true; camOn = true;
  transcriptCollapsed = false; transcriptTtsOn = false;
  callHistoryPushed = false; localSubSeq = 0;
  room = { id: null, myLang: '', theirLang: '', role: null, name: '', solo: false };
  syncMic(); syncCam(); syncTranscriptBtn(); syncTtsBtn();
  renderRecent();
}

function hangUp() { cleanUp(); }

// ── Controls ──────────────────────────────────────────────────────────────────
function toggleMic() {
  micOn = !micOn;
  TBMedia.muteAudio(!micOn);  // gates audio track only — Transcribe unaffected
  syncMic();
}
function toggleCam() {
  camOn = !camOn;
  TBMedia.muteVideo(!camOn);
  syncCam();
}

// ── Lobby ────────────────────────────────────────────────────────────────────
function populateLangs() {
  ['my-lang', 'their-lang'].forEach(function (id) {
    var s = $(id);
    s.innerHTML = '<option value="" disabled selected>Select language…</option>' +
      LANGS.map(function (l) { return '<option value="' + l.code + '">' + l.flag + ' ' + l.label + '</option>'; }).join('');
    s.onchange = syncBtn;
  });
  syncBtn();
}
function syncBtn() { $('create-btn').disabled = !($('my-lang').value && $('their-lang').value); }

async function createRoom() {
  room.myLang = $('my-lang').value; room.theirLang = $('their-lang').value;
  room.name = ($('room-name').value || '').trim();
  if (!room.myLang || !room.theirLang) { toast('Select both languages'); return; }
  room.id = uid(); room.role = 'creator'; room.solo = false;
  saveRecent();
  await enterCall();
}

function handleHash(p) {
  if (!p || !p.r) return;
  $('joining-screen').classList.add('show');
  room.id = p.r; room.myLang = p.tl; room.theirLang = p.ml;
  room.name = p.n || ''; room.role = 'joiner'; room.solo = false;
  saveRecent();
  enterCall()
    .then(function () { $('joining-screen').classList.remove('show'); })
    .catch(function () { $('joining-screen').classList.remove('show'); history.replaceState({}, '', location.pathname); });
  history.replaceState({}, '', location.pathname);
}

function backToSetup() {
  TBMedia.stop();
  $('lobby-setup').style.display = '';
  $('lobby-waiting').style.display = 'none';
}

async function reuseRoom(id) {
  var rec = getRecent().find(function (r) { return r.id === id; });
  if (!rec) return;
  room.id = rec.id; room.myLang = rec.myLang; room.theirLang = rec.theirLang;
  room.role = 'creator'; room.name = rec.name || ''; room.solo = false;
  $('my-lang').value = rec.myLang; $('their-lang').value = rec.theirLang;
  $('room-name').value = rec.name || '';
  syncBtn(); saveRecent();
  await enterCall();
}

function viewRoomTr(id) {
  var rec = getRecent().find(function (r) { return r.id === id; });
  var entries = loadTr(id); viewingRoomId = id;
  $('room-tr-title').textContent = (rec && rec.name ? rec.name : 'Room') + ' — Transcript';
  var b = $('room-tr-body');
  if (!entries.length) {
    b.innerHTML = '<div style="color:var(--text-muted);padding:16px;font-style:italic;">No transcript saved.</div>';
  } else {
    b.innerHTML = entries.map(function (e) {
      var ts = new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      var w = e.who === 'me' ? 'You' : 'Partner';
      var wc = e.who === 'me' ? 'color:var(--teal-bright)' : 'color:var(--text-dim)';
      var same = e.sourceText === e.translatedText;
      return '<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;' + wc + '">' + w + ' · ' + (e.srcLang || '').toUpperCase() + ' · ' + ts + '</div>' +
        '<div style="color:var(--text-dim);margin-top:2px">' + esc(e.sourceText) + '</div>' +
        (same ? '' : '<div style="color:var(--text);margin-top:2px">→ ' + esc(e.translatedText) + '</div>') + '</div>';
    }).join('');
  }
  $('room-tr-overlay').classList.add('show');
}
function closeRoomTr() { $('room-tr-overlay').classList.remove('show'); }
function copyRoomTr() {
  var entries = loadTr(viewingRoomId);
  if (!entries.length) { toast('No transcript'); return; }
  var t = entries.map(function (e) {
    var ts = new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return '[' + ts + '] ' + (e.who === 'me' ? 'You' : 'Partner') + ': ' + e.sourceText +
      (e.translatedText !== e.sourceText ? ' → ' + e.translatedText : '');
  }).join('\n');
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast('Copied'); });
}

function renderRecent() {
  var w = $('recent-rooms'), l = $('recent-rooms-list'), rows = getRecent();
  w.style.display = rows.length ? '' : 'none';
  l.innerHTML = rows.map(function (r) {
    var t = new Date(r.ts).toLocaleString();
    var h = !!loadTr(r.id).length;
    return '<div class="recent-item"><div class="recent-item-top">' +
      '<button class="recent-open jr" data-id="' + esc(r.id) + '">' + esc(r.name) + '<small>' + esc(t) + '</small></button>' +
      '</div><div class="recent-actions">' +
      '<button class="recent-act jr" data-id="' + esc(r.id) + '">▶ Reopen</button>' +
      (h ? '<button class="recent-act jv" data-id="' + esc(r.id) + '">📄 Transcript</button>' : '') +
      '<button class="recent-act danger jd" data-id="' + esc(r.id) + '">✕ Delete</button>' +
      '</div></div>';
  }).join('');
  l.querySelectorAll('.jr').forEach(function (b) { b.onclick = function () { reuseRoom(b.dataset.id); }; });
  l.querySelectorAll('.jv').forEach(function (b) { b.onclick = function () { viewRoomTr(b.dataset.id); }; });
  l.querySelectorAll('.jd').forEach(function (b) { b.onclick = function () { delRecent(b.dataset.id); }; });
}

// ── Init ──────────────────────────────────────────────────────────────────────
populateLangs(); renderRecent(); syncMic(); syncCam(); syncTranscriptBtn(); syncTtsBtn();

$('call-transcript').addEventListener('scroll', function () {
  var near = ($('call-transcript').scrollHeight - $('call-transcript').scrollTop - $('call-transcript').clientHeight) < 60;
  var ind = $('transcript-more-indicator');
  if (ind) ind.classList.toggle('show', !near);
});
$('local-video').addEventListener('click', swapVideos);
$('remote-video').addEventListener('click', swapVideos);

var hp = new URLSearchParams((location.hash || '').replace(/^#/, ''));
var inv = hp.get('j');
if (inv) { var p = decInv(inv); if (p && p.r) handleHash(p); }

window.addEventListener('popstate', function () {
  if ($('call-screen').classList.contains('active') && room.id) { hangUp(); history.pushState({}, '', location.href); }
});
window.addEventListener('visibilitychange', function () {
  if (!document.hidden && room.id && $('call-screen').classList.contains('active')) {
    TBTranscribe.stop();
    TBTranscribe.start(room.myLang);
  }
});
window.addEventListener('pagehide', function () {
  if (room.id) { saveTr(); TBTransport.send({ type: 'hangup', reason: 'pagehide' }); }
  TBTranscribe.stop();
  TBMedia.stop();
});
