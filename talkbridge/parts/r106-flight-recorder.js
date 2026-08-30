
/* ═══════════ R10.6 PART · correlated, redacted flight recorder ═══════════ */
var R106_TRACE = (function () {
  var KEY = 'tb_r106_trace_v1', CAP = 1600, records = lsGet(KEY, []) || [], n = records.length;
  var secretNames = /(^|_)(auth|authorization|token|secret|password|credential|api.?key|invite.?code|p256dh)($|_)/i;
  var contentNames = /^(t|text|srcText|tgtText|sourceText|translatedText|body)$/i;
  function clean(value, key, depth) {
    if (secretNames.test(String(key || ''))) return '[redacted]';
    if (contentNames.test(String(key || ''))) return '[content omitted]';
    if (depth > 5) return '[depth]';
    if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
    if (typeof value === 'string') return value.length > 240 ? value.slice(0, 240) + '…' : value;
    if (Array.isArray(value)) return value.slice(0, 40).map(function (x) { return clean(x, '', depth + 1); });
    if (typeof value === 'object') {
      var out = {}, keys = Object.keys(value).slice(0, 60);
      for (var i = 0; i < keys.length; i++) out[keys[i]] = clean(value[keys[i]], keys[i], depth + 1);
      return out;
    }
    return String(value);
  }
  function add(stage, action, outcome, detail) {
    var d = clean(detail || {}, '', 0);
    var rec = {
      schema: 'talkbridge-flight-v1', build: 'R10.6', seq: ++n,
      at: new Date().toISOString(), mono: Math.round(performance.now ? performance.now() : 0),
      device: String(deviceId || '').slice(0, 12), stage: stage, action: action, outcome: outcome,
      room: d.room || d.roomId || null, eventId: d.eventId || null, callId: d.callId || null, detail: d
    };
    records.push(rec); if (records.length > CAP) records = records.slice(-CAP);
    if (n % 10 === 0 || /failed|error|rejected/.test(String(outcome))) try { lsSet(KEY, records); } catch (_) {}
    return rec;
  }
  function human(list) {
    return list.map(function (r) {
      var ids = (r.eventId ? ' event=' + r.eventId : '') + (r.callId ? ' call=' + r.callId : '') + (r.room ? ' room=' + String(r.room).slice(-6) : '');
      return r.at + ' [' + r.stage + '/' + r.action + '] ' + r.outcome + ids + ' ' + JSON.stringify(r.detail);
    }).join('\n');
  }
  function snapshot() {
    var copy = records.slice();
    return { schema: 'talkbridge-flight-v1', build: 'R10.6', exportedAt: new Date().toISOString(), human: human(copy), records: copy };
  }
  function observedDisplay(eventId, at) {
    add('os_observation', 'tester_display_time', 'observed', { eventId: eventId, observedAt: at || new Date().toISOString(), source: 'tester' });
  }
  return { add: add, snapshot: snapshot, observedDisplay: observedDisplay, records: function () { return records.slice(); } };
})();

var _r106BaseLog = log;
log = function (ev, data, level) {
  _r106BaseLog.apply(this, arguments);
  try {
    var stage = /^r106_push_|^p3_/.test(ev) ? 'push_client' :
      /^r106_auth_/.test(ev) ? 'authorization' :
      /^r106_event_/.test(ev) ? 'recipient_state' :
      /^relay_|^listen_|^net_relay/.test(ev) ? 'transport' :
      /^call_|^rtc_|^turn_/.test(ev) ? 'call' :
      /^dg_/.test(ev) ? 'transcription' : 'app';
    R106_TRACE.add(stage, ev, level || 'info', data || {});
  } catch (_) {}
};

function r106TraceDownload() {
  var snap = R106_TRACE.snapshot();
  var blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'talkbridge-r106-flight.json'; a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}
function r106TraceWire() {
  var open = $('s4b-debug'), copy = $('debug-copy'), dl = $('debug-dl');
  if (open && !open.__r106Trace) {
    open.__r106Trace = true;
    open.addEventListener('click', function () {
      var snap = R106_TRACE.snapshot(); $('debug-body').textContent = snap.human; $('m-debug').classList.add('show');
    }, true);
  }
  if (copy && !copy.__r106Trace) {
    copy.__r106Trace = true;
    copy.addEventListener('click', function (ev) {
      ev.stopImmediatePropagation(); var snap = R106_TRACE.snapshot();
      if (navigator.clipboard) navigator.clipboard.writeText(snap.human).then(function () { toast('Flight log copied'); });
    }, true);
  }
  if (dl && !dl.__r106Trace) {
    dl.__r106Trace = true;
    dl.addEventListener('click', function (ev) { ev.stopImmediatePropagation(); r106TraceDownload(); }, true);
  }
}
['visibilitychange', 'freeze', 'resume', 'pageshow', 'pagehide'].forEach(function (name) {
  window.addEventListener(name, function () { R106_TRACE.add('lifecycle', name, 'observed', { hidden: !!document.hidden, focused: document.hasFocus ? document.hasFocus() : null, view: S.view, room: S.roomId }); });
});
window.addEventListener('online', function () { R106_TRACE.add('network', 'online', 'observed', {}); });
window.addEventListener('offline', function () { R106_TRACE.add('network', 'offline', 'observed', {}); });
document.addEventListener('DOMContentLoaded', function () {
  R106_TRACE.add('app', 'boot', 'observed', { version: 'R10.6', standalone: r106Standalone(), authPresent: !!r106ReadAuth().token, rooms: S.rooms.length });
  setTimeout(r106TraceWire, 300);
});
