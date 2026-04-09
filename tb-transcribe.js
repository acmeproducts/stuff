// tb-transcribe.js
// Manages SpeechRecognition lifecycle.
// CONTRACT:
//   - TBTranscribe.start(lang) — begins recognition. Works solo, no peer needed.
//   - TBTranscribe.stop() — stops cleanly.
//   - TBTranscribe.onFinal(fn) — register callback: fn(text, lang)
//   - interimResults is FALSE. Finals only. Eliminates stutter and duplication.
//   - Mute has NO effect on transcription. Transcription is always running.
//   - Handles restart/backoff independently.

var TBTranscribe = (function () {
  'use strict';

  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var DEDUP_MS = 4000;

  var _active = false;
  var _lang = 'en';
  var _gen = 0;
  var _rec = null;
  var _recognizing = false;
  var _restartTimer = null;
  var _backoff = 500;
  var _endBurst = [];
  var _blockedUntil = 0;
  var _recentFinals = [];
  var _onFinalCb = null;

  function onFinal(fn) { _onFinalCb = fn; }

  function start(lang) {
    if (!SpeechRec) { TBApp.log('transcribe_unavailable', {}, 'warn'); return; }
    _lang = lang || 'en';
    _active = true;
    _recentFinals = []; _endBurst = []; _backoff = 500; _blockedUntil = 0;
    TBApp.log('transcribe_start', { lang: _lang });
    _attempt();
  }

  function stop() {
    _active = false;
    _gen++;
    if (_restartTimer) { clearTimeout(_restartTimer); _restartTimer = null; }
    if (_rec) try { _rec.stop(); } catch (_) {}
    _rec = null; _recognizing = false;
    TBApp.log('transcribe_stop', {});
  }

  function _isDupe(text) {
    var now = Date.now(), lo = text.toLowerCase();
    _recentFinals = _recentFinals.filter(function (f) { return now - f.t < DEDUP_MS; });
    for (var i = 0; i < _recentFinals.length; i++) {
      var p = _recentFinals[i].s;
      if (p === lo) return true;
      if (p.length > 5 && lo.length > 5 && (p.indexOf(lo) >= 0 || lo.indexOf(p) >= 0)) return true;
    }
    return false;
  }

  function _record(text) {
    _recentFinals.push({ s: text.toLowerCase(), t: Date.now() });
    if (_recentFinals.length > 5) _recentFinals.shift();
  }

  function _schedule(delay) {
    if (_restartTimer) clearTimeout(_restartTimer);
    _restartTimer = setTimeout(function () {
      _restartTimer = null;
      if (_active && !_recognizing && Date.now() >= _blockedUntil) _attempt();
    }, delay);
  }

  function _attempt() {
    if (!SpeechRec || !_active || _recognizing || Date.now() < _blockedUntil) return;
    var gen = ++_gen;
    var locale = (window.TB_TTS_LOCALE || {})[_lang] || _lang || 'en-US';

    _rec = new SpeechRec();
    _rec.lang = locale;
    _rec.interimResults = false;   // MUST be false — prevents stutter/duplication
    _rec.continuous = true;
    _rec.maxAlternatives = 1;

    _rec.onstart = function () {
      if (gen !== _gen) return;
      _recognizing = true; _backoff = 500; _endBurst = [];
      TBApp.log('transcribe_active', { locale: locale }, 'ok');
    };

    _rec.onresult = function (e) {
      if (gen !== _gen) return;
      var text = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      text = text.replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (_isDupe(text)) { TBApp.log('transcribe_dedup', { t: text.slice(0, 40) }, 'warn'); return; }
      _record(text);
      TBApp.log('transcribe_final', { t: text.slice(0, 60) }, 'ok');
      if (_onFinalCb) _onFinalCb(text, _lang);
    };

    _rec.onend = function () {
      if (gen !== _gen) return;
      _recognizing = false; _rec = null;
      if (!_active) return;
      var now = Date.now();
      _endBurst = _endBurst.filter(function (t) { return now - t < 8000; });
      _endBurst.push(now);
      if (_endBurst.length >= 5) {
        _blockedUntil = now + 20000;
        TBApp.log('transcribe_blocked', { sec: 20 }, 'warn');
        _schedule(20000);
        return;
      }
      _backoff = Math.min(_backoff * 1.5, 4000);
      _schedule(Math.max(1500, _backoff));
    };

    _rec.onerror = function (e) {
      if (gen !== _gen) return;
      _recognizing = false; _rec = null;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        _blockedUntil = Date.now() + 15000;
        TBApp.log('transcribe_denied', {}, 'error');
        TBApp.toast('Mic permission needed');
        return;
      }
      TBApp.log('transcribe_err', { e: e.error }, 'warn');
      if (_active) _schedule(2000);
    };

    try { _rec.start(); } catch (e) {
      _recognizing = false; _rec = null;
      TBApp.log('transcribe_start_fail', { e: String(e) }, 'error');
      if (_active) _schedule(1000);
    }
  }

  return { start: start, stop: stop, onFinal: onFinal };
})();
