/* ═══════════ 30·pre-ship PART · TS-1 transcript-store.js — THE CHATS LEAVE LOCALSTORAGE FOR INDEXEDDB (§7.24) ═══════════ */
/* @contract
   replaces: (none)
   wraps: lsSet (tba_tr_* keys only), loadTrCore, p2Entry (outermost, run once), Storage.prototype.removeItem (tba_tr_* keys only)
   adds: TS, tsLog, tsHash, tsSig, tsClean, tsKeyId, tsOpen, tsDb, tsTx, tsRange, tsMirror, tsGet, tsSave, tsFlush, tsFlushAll, tsAbsorb, tsLoadAll, tsMergeHeld, tsRefresh, tsDrop, tsFinish, tsStart, TS_RETRY, _tsLsSet, _tsLoadTrCore, _tsEntry, _tsRemove
   markers (tsLog's own prefix 'ts_'): ready, absorbed, early_read, flush_failed, row_failed, fallback, refresh, dropped

   THE OWNER: the iPhone's chats filled localStorage (QuotaExceededError, 2026-10-23); the standalone proof (§7.23) passed on both
   phones; §7.24 approved ("Both, video first"; decision 1: an OLDER page shows migrated rooms empty — their chats are safe here).
   THE RULE (G56): capacity, not resilience — the chats LEAVE localStorage; every caller above keeps calling loadTr / saveTr /
   lsSet(trKey(id), arr) synchronously, exactly as before. Under them:
   - THE MIRROR: every room's chat is held in memory; loadTrCore(id) returns the mirror's array ITSELF.
   - WHAT IS STORED IS WHAT LOCALSTORAGE STORED: JSON-clean entries, one row each ({room, n, i, id, e}), numbered by the store inside
     the write (add, never put, for a new row), a unique [room, id] index; only a changed entry is rewritten; a deletion rewrites
     nothing; order is rewritten only when it changes.
   - THE HOLD: p2Entry (the app's start) waits until every room is loaded; a load before then gets a temporary array; a save before
     then is HELD and merged BY ID at READY (and written to the old key as well, so a page that dies in the hold loses nothing).
   - ABSORPTION AT EVERY START: every tba_tr_* key is merged in BY ID, verified, and removed only if it is still the exact text read.
   - NO SILENT FALLBACK: no IndexedDB → mode ls (the old behaviour). IndexedDB failing or slower than 10 s → mode journal: saves go
     to the old keys (absorbed at the next start), logged.
   - TWO COPIES: a flush that COMMITS posts {room}; the other copy flushes its own first, then refreshes that room IN PLACE.
   REVIEW (2026-10-27, independent, 7 must-fix applied before any code): see §7.24. */
var TS = { mode: 'loading', db: null, rooms: new Map(), early: new Map(), held: new Map(), dirty: new Set(), flushing: new Map(), again: new Set(),
  attHash: new WeakMap(), me: (function () { try { return crypto.getRandomValues(new Uint32Array(1))[0].toString(36); } catch (_) { return String(Date.now()); } })(),   /* never Math.random: the app's ids draw on it */
   bc: null, entered: false, t0: Date.now(), DB: 'tb-chats', HOLD_MS: 10000, warned: false };
TS.ready = new Promise(function (r) { TS._resolve = r; });
var _tsLsSet = lsSet, _tsLoadTrCore = loadTrCore, _tsEntry = p2Entry, _tsRemove = Storage.prototype.removeItem;
function tsLog(what, d, lvl) { try { log('ts_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function tsHash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + s.length; }
/* an entry's signature: the hash of its JSON, a large attachment hashed once per attachment object */
function tsSig(e) {
  return tsHash(JSON.stringify(e, function (k, v) {
    if (k === 'attachment' && v && typeof v === 'object') { var h = TS.attHash.get(v); if (!h) { h = tsHash(JSON.stringify(v)); TS.attHash.set(v, h); } return '#att:' + h; }
    return v;
  }));
}
function tsClean(e) { return JSON.parse(JSON.stringify(e)); }   /* exactly what localStorage kept: no function, no DOM reference */
function tsKeyId(e) { return (e && typeof e.id === 'string' && e.id) ? e.id : undefined; }

/* ─────────── the store ─────────── */
function tsOpen() {
  return new Promise(function (res, rej) {
    var r; try { r = indexedDB.open(TS.DB, 1); } catch (e) { rej(e); return; }
    r.onupgradeneeded = function () {
      var db = r.result;
      var m = db.createObjectStore('msgs', { keyPath: ['room', 'n'] });
      m.createIndex('byId', ['room', 'id'], { unique: true });
      db.createObjectStore('rooms', { keyPath: 'room' });
      db.createObjectStore('meta', { keyPath: 'k' });
    };
    r.onsuccess = function () {
      var db = r.result;
      db.onversionchange = function () { try { db.close(); } catch (_) {} if (TS.db === db) TS.db = null; };
      db.onclose = function () { if (TS.db === db) TS.db = null; };
      res(db);
    };
    r.onerror = function () { rej(r.error); };
  });
}
function tsDb() { return TS.db ? Promise.resolve(TS.db) : tsOpen().then(function (db) { TS.db = db; return db; }); }
var TS_RETRY = { InvalidStateError: 1, UnknownError: 1, TransactionInactiveError: 1 };
/* one transaction; resolves with fn's value when it COMMITS; a dropped connection is reopened and retried once (the proof's wrapper) */
function tsTx(names, mode, fn) {
  function once() {
    return tsDb().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(names, mode), S = {}, out;
        [].concat(names).forEach(function (n) { S[n] = t.objectStore(n); });
        t.oncomplete = function () { res(out); };
        t.onerror = function (e) { if (e && e.stopPropagation) e.stopPropagation(); };
        t.onabort = function () { rej(t.error || new DOMException('aborted', 'AbortError')); };
        try { out = fn(S, t); } catch (e) { try { t.abort(); } catch (_) {} rej(e); }
      });
    });
  }
  return once().catch(function (e) {
    if (!TS_RETRY[e && e.name]) throw e;
    try { if (TS.db) TS.db.close(); } catch (_) {} TS.db = null;
    return once();
  });
}
function tsRange(room) { return IDBKeyRange.bound([room, -Infinity], [room, Infinity]); }

/* ─────────── the mirror ─────────── */
function tsMirror(room) {
  var m = TS.rooms.get(room);
  if (!m) { m = { arr: [], nOf: new WeakMap(), byN: new Map(), sig: new Map(), pos: new Map() }; TS.rooms.set(room, m); }
  return m;
}
function tsGet(room) {
  if (TS.mode === 'idb') return tsMirror(room).arr;
  if (TS.mode === 'loading') {                    /* before READY: a temporary array (the old copy if one is left), the same one each time */
    if (!TS.early.has(room)) { TS.early.set(room, _tsLoadTrCore(room)); tsLog('early_read', { room: String(room).slice(-6) }, 'warn'); }
    return TS.early.get(room);
  }
  return _tsLoadTrCore(room);
}
function tsSave(room, arr) {
  if (TS.mode === 'loading') { TS.held.set(room, arr); TS.early.set(room, arr); try { _tsLsSet(trKey(room), arr); } catch (_) {} return; }
  var m = tsMirror(room);
  if (Array.isArray(arr)) m.arr = arr;            /* an array REPLACED (filter) becomes the mirror */
  TS.dirty.add(room);
  Promise.resolve().then(function () { tsFlush(room); });   /* one flush per room per task */
}
/* write what changed in one room: ONE readwrite transaction; numbers from the store; only changed rows; gone rows deleted */
function tsFlush(room) {
  if (TS.mode !== 'idb') return Promise.resolve();
  if (TS.flushing.has(room)) { TS.again.add(room); return TS.flushing.get(room); }
  if (!TS.dirty.has(room)) return Promise.resolve();
  TS.dirty.delete(room);
  var m = tsMirror(room), arr = m.arr, plan = [], live = new Set(), seenId = new Set(), lastI = -1, broken = false, sawNew = false;
  for (var k = 0; k < arr.length; k++) {
    var e = arr[k], sig, clean;
    try { sig = tsSig(e); } catch (er) { tsLog('row_failed', { room: String(room).slice(-6), e: String(er && er.name || er) }, 'error'); continue; }
    var n = (e && typeof e === 'object') ? m.nOf.get(e) : undefined, id = tsKeyId(e);
    if (id && seenId.has(id)) id = undefined; else if (id) seenId.add(id);
    var p = n != null ? m.pos.get(n) : undefined;
    if (p != null && (p <= lastI || sawNew)) broken = true;   /* an existing row after a new one, or out of order: the order changed */
    if (n == null) sawNew = true;
    if (n != null) live.add(n);
    plan.push({ e: e, n: n, id: id, sig: sig, p: p });
    if (p != null && p > lastI) lastI = p;
  }
  /* positions: new entries after the last; if the order changed anywhere, the whole room is renumbered (rare: the history merge's sort) */
  var top = -1; plan.forEach(function (x) { if (x.p != null && x.p > top) top = x.p; });
  plan.forEach(function (x, idx) { x.i = broken ? idx : (x.p != null ? x.p : ++top); });
  var gone = []; m.sig.forEach(function (_, n) { if (!live.has(n)) gone.push(n); });
  var res = { writes: 0, adds: 0, deletes: gone.length };
  var run = tsTx(['rooms', 'msgs'], 'readwrite', function (S) {
    gone.forEach(function (n) { S.msgs.delete([room, n]); });   /* first: a row re-added under a new number must not meet its old self */
    var g = S.rooms.get(room);
    g.onsuccess = function () {
      var rec = g.result || { room: room, next: 1 };
      plan.forEach(function (x) {
        if (x.n == null) {
          x.n = rec.next++; res.adds++;
          var row = { room: room, n: x.n, i: x.i, e: tsClean(x.e) }; if (x.id) row.id = x.id;
          var a = S.msgs.add(row);
          a.onerror = function (ev) {                    /* the same message added by the other copy first: adopt its number */
            if (!a.error || a.error.name !== 'ConstraintError' || !x.id) return;
            ev.preventDefault(); ev.stopPropagation();
            var q = S.msgs.index('byId').get([room, x.id]);
            q.onsuccess = function () { if (q.result) { x.n = q.result.n; var r2 = { room: room, n: x.n, i: x.i, id: x.id, e: tsClean(x.e) }; S.msgs.put(r2); } };
          };
        } else if (m.sig.get(x.n) !== x.sig || m.pos.get(x.n) !== x.i) {
          res.writes++;
          var row2 = { room: room, n: x.n, i: x.i, e: tsClean(x.e) }; if (x.id) row2.id = x.id;
          S.msgs.put(row2);
        }
      });
      S.rooms.put(rec);
    };
  }).then(function () {
    plan.forEach(function (x) { if (x.e && typeof x.e === 'object') m.nOf.set(x.e, x.n); m.byN.set(x.n, x.e); m.sig.set(x.n, x.sig); m.pos.set(x.n, x.i); });
    gone.forEach(function (n) { m.sig.delete(n); m.pos.delete(n); m.byN.delete(n); });
    TS.last = res;
    try { if (TS.bc) TS.bc.postMessage({ room: room, from: TS.me }); } catch (_) {}
  }, function (er) {
    TS.dirty.add(room);                           /* kept dirty: retried at the next save and on return */
    var name = String(er && er.name || er);
    if (name === 'QuotaExceededError') {
      try { log('storage_write_failed', { key: trKey(room), e: name, store: 'idb' }, 'error'); } catch (_) {}
      if (!_storageWarnedThisSession) { _storageWarnedThisSession = true; try { toast(l10n('toast_storage_full'), 6000); } catch (_) {} }
    } else tsLog('flush_failed', { room: String(room).slice(-6), e: name }, 'error');
  }).then(function () {
    TS.flushing.delete(room);
    if (TS.again.has(room)) { TS.again.delete(room); return tsFlush(room); }
  });
  TS.flushing.set(room, run);
  return run;
}
/* every room checked (a translation that landed after a room switch changed the mirror without a save): on hide and on return */
function tsFlushAll() {
  if (TS.mode !== 'idb') return Promise.resolve();
  TS.rooms.forEach(function (m, room) {
    for (var k = 0; k < m.arr.length; k++) { var e = m.arr[k], n = (e && typeof e === 'object') ? m.nOf.get(e) : undefined; var s; try { s = tsSig(e); } catch (_) { continue; } if (n == null || m.sig.get(n) !== s) { TS.dirty.add(room); break; } }
    if (!TS.dirty.has(room) && m.sig.size !== m.arr.length) TS.dirty.add(room);
  });
  return Promise.all(Array.from(TS.dirty).map(tsFlush));
}

/* ─────────── start-up ─────────── */
/* every tba_tr_* key merged in BY ID, one room per transaction, verified, removed only if unchanged since it was read */
function tsAbsorb() {
  var keys = [], d = { rooms: 0, msgs: 0, kb: 0, removed: 0, broken: 0, kept: 0 }, t0 = Date.now();
  try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('tba_tr_') === 0) keys.push(k); } } catch (_) {}
  return keys.reduce(function (p, key) {
    return p.then(function () {
      var raw = null; try { raw = localStorage.getItem(key); } catch (_) {}
      if (raw == null) return;
      var arr; try { arr = JSON.parse(raw); } catch (_) { arr = null; }
      if (!Array.isArray(arr)) { d.broken++; tsLog('absorbed', { room: key.slice(-6), broken: true }, 'warn'); return; }
      var room = key.slice(7); d.rooms++; d.msgs += arr.length; d.kb += raw.length;
      return tsTx(['rooms', 'msgs'], 'readwrite', function (S) {
        var box = { ok: false };
        var g = S.rooms.get(room), h = S.msgs.getAll(tsRange(room));
        h.onsuccess = function () {
          var have = h.result || [], ids = new Set(), sigs = new Map(), maxI = -1;
          have.forEach(function (r) { if (r.id) ids.add(r.id); else { var s0 = tsSig(r.e); sigs.set(s0, (sigs.get(s0) || 0) + 1); } if (r.i > maxI) maxI = r.i; });
          var rec = g.result || { room: room, next: 1 }, seen = new Set();
          arr.forEach(function (e) {
            var id = tsKeyId(e);
            if (id) { if (ids.has(id)) return; if (seen.has(id)) id = undefined; else seen.add(id); }   /* already in: merged; the same id twice in one copy: both kept, the second unindexed */
            else { var s = tsSig(e), c = sigs.get(s) || 0; if (c > 0) { sigs.set(s, c - 1); return; } }   /* without an id: as many as the store lacks */
            var row = { room: room, n: rec.next++, i: ++maxI, e: tsClean(e) }; if (id) row.id = id;
            S.msgs.add(row);
          });
          S.rooms.put(rec);
          box.ok = true;
        };
        return box;
      }).then(function (box) {
        if (!box.ok) { d.kept++; return; }
        /* verified: every entry of the old copy is in the store */
        return tsTx('msgs', 'readonly', function (S) { var b = {}; var q = S.msgs.getAll(tsRange(room)); q.onsuccess = function () { b.v = q.result; }; return b; }).then(function (b) {
          var ids = new Set(), sigs = new Set(); (b.v || []).forEach(function (r) { if (r.id) ids.add(r.id); sigs.add(tsSig(r.e)); });
          var all = arr.every(function (e) { var id = tsKeyId(e); return (id && ids.has(id)) || sigs.has(tsSig(e)); });
          var now = null; try { now = localStorage.getItem(key); } catch (_) {}
          if (all && now === raw) { try { _tsRemove.call(localStorage, key); d.removed++; } catch (_) { d.kept++; } }
          else d.kept++;
        });
      });
    });
  }, Promise.resolve()).then(function () {
    d.kb = Math.round(d.kb / 1024); d.ms = Date.now() - t0;
    if (keys.length) tsLog('absorbed', d, 'ok');
    return d;
  });
}
/* every room's rows into the mirror, in order */
function tsLoadAll() {
  return tsTx('msgs', 'readonly', function (S) { var b = {}; var q = S.msgs.getAll(); q.onsuccess = function () { b.v = q.result; }; return b; }).then(function (b) {
    var by = new Map(), msgs = 0, bytes = 0;
    (b.v || []).forEach(function (r) { if (!by.has(r.room)) by.set(r.room, []); by.get(r.room).push(r); });
    by.forEach(function (rows, room) {
      rows.sort(function (x, y) { return x.i - y.i; });
      var m = tsMirror(room);
      rows.forEach(function (r) { var e = r.e; m.arr.push(e); if (e && typeof e === 'object') m.nOf.set(e, r.n); m.byN.set(r.n, e); m.pos.set(r.n, r.i); m.sig.set(r.n, tsSig(e)); msgs++; try { bytes += JSON.stringify(e).length; } catch (_) {} });
    });
    return { rooms: by.size, msgs: msgs, kb: Math.round(bytes / 1024) };
  });
}
/* saves made during the hold, merged BY ID into the loaded mirror: a new id appended, an existing id takes the held entry — never a wholesale replace */
function tsMergeHeld() {
  TS.held.forEach(function (arr, room) {
    if (!Array.isArray(arr)) return;
    var m = tsMirror(room), at = new Map();
    m.arr.forEach(function (e, k) { var id = tsKeyId(e); if (id) at.set(id, k); });
    arr.forEach(function (e) { var id = tsKeyId(e); if (id && at.has(id)) m.arr[at.get(id)] = e; else if (id) { at.set(id, m.arr.length); m.arr.push(e); } else { var s = tsSig(e); if (!m.arr.some(function (x) { return !tsKeyId(x) && tsSig(x) === s; })) m.arr.push(e); } });
    TS.dirty.add(room);
  });
  TS.held.clear(); TS.early.clear();
  return Promise.all(Array.from(TS.dirty).map(tsFlush));
}
/* the other copy wrote this room: our own changes first, then the room re-read IN PLACE (the same array, the same entry objects) */
function tsRefresh(room) {
  if (TS.mode !== 'idb') return Promise.resolve();
  return (TS.dirty.has(room) || TS.flushing.has(room) ? tsFlush(room) : Promise.resolve()).then(function () {
    return tsTx('msgs', 'readonly', function (S) { var b = {}; var q = S.msgs.getAll(tsRange(room)); q.onsuccess = function () { b.v = q.result; }; return b; });
  }).then(function (b) {
    var rows = (b.v || []).sort(function (x, y) { return x.i - y.i; }), m = tsMirror(room), keep = [];
    rows.forEach(function (r) {
      var e = m.byN.get(r.n);
      if (e && typeof e === 'object' && r.e && typeof r.e === 'object') { Object.keys(e).forEach(function (k) { if (!(k in r.e)) delete e[k]; }); Object.keys(r.e).forEach(function (k) { e[k] = r.e[k]; }); }
      else { e = r.e; if (e && typeof e === 'object') m.nOf.set(e, r.n); m.byN.set(r.n, e); }
      m.pos.set(r.n, r.i); m.sig.set(r.n, tsSig(e)); keep.push(e);
    });
    var live = new Set(rows.map(function (r) { return r.n; }));
    m.sig.forEach(function (_, n) { if (!live.has(n)) { m.sig.delete(n); m.pos.delete(n); m.byN.delete(n); } });
    m.arr.length = 0; Array.prototype.push.apply(m.arr, keep);
    tsLog('refresh', { room: String(room).slice(-6), msgs: keep.length }, 'info');
    try { if (S.view === 'room' && S.roomId === room && typeof renderTranscript === 'function') renderTranscript(); } catch (_) {}
  }).catch(function (e) { tsLog('flush_failed', { room: String(room).slice(-6), e: String(e && e.name || e), at: 'refresh' }, 'error'); });
}
function tsDrop(room) {
  TS.rooms.delete(room); TS.dirty.delete(room);
  return tsTx(['rooms', 'msgs'], 'readwrite', function (S) { S.msgs.delete(tsRange(room)); S.rooms.delete(room); }).then(function () {
    tsLog('dropped', { room: String(room).slice(-6) }, 'ok');
    try { if (TS.bc) TS.bc.postMessage({ room: room, from: TS.me, drop: true }); } catch (_) {}
  }).catch(function (e) { tsLog('flush_failed', { room: String(room).slice(-6), e: String(e && e.name || e), at: 'drop' }, 'error'); });
}
function tsFinish(mode, why) {
  if (TS.mode !== 'loading') return;
  TS.mode = mode;
  if (mode !== 'idb') {
    /* the held saves were already written to the old keys; this page life runs as before (they are absorbed at the next start) */
    TS.held.clear(); TS.early.clear();
    tsLog('fallback', { why: why, mode: mode }, 'warn');
  }
  TS._resolve(mode);
}
function tsStart() {
  if (!window.indexedDB) { tsFinish('ls', 'no-indexeddb'); return; }
  var timer = setTimeout(function () { tsFinish('journal', 'slow'); }, TS.HOLD_MS);
  tsDb().then(function () { return tsAbsorb(); }).then(function () { return tsLoadAll(); }).then(function (st) {
    if (TS.mode !== 'loading') { try { if (TS.db) TS.db.close(); } catch (_) {} TS.db = null; return; }   /* too late: this page life stays on the old keys */
    clearTimeout(timer);
    TS.mode = 'idb';
    try { TS.bc = new BroadcastChannel('tb-chats'); TS.bc.onmessage = function (ev) { var d = ev.data || {}; if (!d.room || d.from === TS.me) return; if (d.drop) { TS.rooms.delete(d.room); return; } tsRefresh(d.room); }; } catch (_) { TS.bc = null; }
    return tsMergeHeld().then(function () {
      var mirror = 0; TS.rooms.forEach(function (m) { mirror += m.arr.length; });
      tsLog('ready', { mode: 'idb', rooms: st.rooms, msgs: st.msgs, kb: st.kb, ms: Date.now() - TS.t0 }, 'ok');
      TS._resolve('idb');
    });
  }).catch(function (e) { clearTimeout(timer); tsFinish('journal', String(e && e.name || e)); });
}

/* ─────────── the wraps ─────────── */
lsSet = function (k, v) {
  if (typeof k === 'string' && k.indexOf('tba_tr_') === 0 && TS.mode !== 'ls' && TS.mode !== 'journal') return tsSave(k.slice(7), v);
  return _tsLsSet.apply(this, arguments);
};
loadTrCore = function (id) { return (TS.mode === 'ls' || TS.mode === 'journal') ? _tsLoadTrCore.apply(this, arguments) : tsGet(id); };
Storage.prototype.removeItem = function (k) {
  if (this === window.localStorage && typeof k === 'string' && k.indexOf('tba_tr_') === 0 && TS.mode === 'idb') tsDrop(k.slice(7));
  return _tsRemove.apply(this, arguments);
};
/* the app's start waits for the chats (run once; the live DOMContentLoaded listener calls p2Entry by name) */
p2Entry = function () {
  if (TS.entered) return; TS.entered = true;
  var self = this, args = arguments;
  if (TS.mode !== 'loading') return _tsEntry.apply(self, args);   /* already settled (no IndexedDB): exactly as before, no extra turn */
  TS.ready.then(function () { _tsEntry.apply(self, args); });
};
document.addEventListener('visibilitychange', function () { if (document.hidden) tsFlushAll(); else if (TS.dirty.size) tsFlushAll(); });
window.addEventListener('pagehide', function () { tsFlushAll(); });
tsStart();
