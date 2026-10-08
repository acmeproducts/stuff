/* ═══════════ GAP PART · FL4-render.js ═══════════ */
/* @contract
   replaces: renderPanel, renderHome, renderTranscript, renderRoomHead, appendMsgDom, msgHtml, roomCardHtml, wireRoomCards
   wraps: (none)
   adds: fl4Raf, fl4Latched, fl4CellFill, x3Pending, X3_PENDING_MS, x3PendingIn, renderPanelCore, renderHomeCore, renderTranscriptCore, renderRoomHeadCore, msgHtmlCore, appendMsgDomCore, roomCardHtmlCore, wireRoomCardsCore
*/
/* ─────────────────────────────────────────────────────────────────────────────
   FL-4 · THE RENDER PATH, FLAT (§7.16 cluster 4, §0c-1)

   Eight symbols that each had one base body and one to five layers stacked on
   it by assignment or by a later declaration, now ONE function each. Every
   body below is the verbatim text of the layer it came from, in the order the
   stack ran it; the layers themselves are removed from the base by their
   banked text (talkbridge/fixtures/flatten/28pos). Nothing is new: no marker,
   no message type, no element. Proven equivalent by harness-diff-28pos.

   renderPanel     R (declaration, replaced the base) → J after → L after → P3 after → P6 after → T1 latch
   renderHome      R → NP after → T1 latch
   renderTranscript base → T1 latch
   renderRoomHead  base → M after
   msgHtml         base → R8 after (origin mark swapped in the produced markup)
   appendMsgDom    X3 before (the said kept) → base → MD1 after (markdown painted)
   roomCardHtml    R → P6 after (the thread button)
   wireRoomCards   L (declaration, replaced R's) → P6 after (the thread button wired)

   The T1 latch is reproduced per renderer with the same state and the same
   trailing re-render through the public name (what `latched.apply` did).
   X3's in-flight "said" records move here whole (the appendMsgDom layer that
   consumed them is now the flat function; the normalizeOutgoing and
   handleChatMsg layers that fill them stay in X3 until the sweep) — the three
   declarations are top-level now, nothing else about them changed.
   ───────────────────────────────────────────────────────────────────────────── */

/* ── T1's frame scheduler and latch, verbatim in substance ────────────────── */
var fl4Raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : function (f) { return setTimeout(f, 16); };
function fl4Latched(st, name, core, outer, self, args) {
  if (st.busy) { st.pending++; return; }
  st.busy = true;
  var r = core.apply(self, args);
  fl4Raf(function () {
    st.busy = false;
    if (st.pending) {
      var n = st.pending; st.pending = 0;
      try { log('t1_coalesced', { fn: name, n: n }, 'info'); } catch (_) {}
      outer.apply(self, args);
    }
  });
  return r;
}
var _fl4PanelLatch = { busy: false, pending: 0 };
var _fl4HomeLatch = { busy: false, pending: 0 };
var _fl4TranscriptLatch = { busy: false, pending: 0 };

/* ── X3's in-flight said records (moved whole) ───────────────────────────── */
var x3Pending = null;                       /* { said, saidLang, normalized, at } — one message in flight at a time */
var X3_PENDING_MS = 60000;
var x3PendingIn = null;                     /* the partner's said, held from the wire for the entry about to be born */

/* ── MD1's cell painter (moved whole) ────────────────────────────────────── */
function fl4CellFill(node, side, text) {
  var cell = node.querySelector('.tr-col[data-side="' + side + '"] .tr-text');
  if (!cell) return;
  var html = tbmd_renderMarkdown(text);
  if (html) cell.innerHTML = html;
}

/* ═══ roomCardHtml · R body, then P6's thread button ═══ */
function roomCardHtmlCore(r, where) {
  try {
    var w = waitingOf(r);
    var acts = WAIT.map(function (k) {
      var n = w[k] || 0;
      return '<span class="rc2-act' + (n ? ' on' : '') + '">' + RC_ICON[k] +
             (n ? '<span class="rc2-n">' + n + '</span>' : '') + '</span>';
    }).join('');

    /* Own language first, from this viewer's perspective. */
    var flags = gL(r.myLang).flag + ' ' + gL(r.theirLang).flag;

    var right1 = r.muted
      ? '<span class="rc2-bell"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.6 13V9A6.5 6.5 0 0 0 8 5.3M6.3 6.3C5.7 7.1 5.4 8 5.4 9v4l-2 3v1h14"/><path d="M10 21a2 2 0 0 0 4 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg></span>'
      : '<button class="rc2-del" data-del="' + r.id + '" aria-label="Delete"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';

    return '<div class="rc2" data-room="' + r.id + '" data-where="' + (where || 'panel') + '">' +
      '<div class="rc2-name">' + esc(roomTitle(r)) + '</div>' + right1 +
      '<div class="rc2-who">' + esc(r.myName || S.user.name || 'Me') + ' ↔ ' + esc(r.partnerName || '?') + '</div>' +
      '<div class="rc2-when">' + fmtAgo(r.lastAt || r.createdAt) + '</div>' +
      '<div class="rc2-acts">' + acts + '</div>' +
      '<div class="rc2-flags">' + flags + '</div>' +
      '</div>';
  } catch (e) {
    rcLog('card_render_failed', { room: r && r.id, e: String(e && e.message || e) }, 'error');
    return '';
  }
}
function roomCardHtml(r, where) {
  var h = roomCardHtmlCore.apply(this, arguments);
    try {
      if (h && r && !r.sendLocked) h = h.replace('</div><div class="rc2-flags">', '<button class="rc2-plus" data-thread="' + r.id + '" aria-label="Add a thread">+</button></div><div class="rc2-flags">');
    } catch (_) {}
  return h;
}

/* ═══ wireRoomCards · L body (the declaration that replaced R's), then P6's thread wiring ═══ */
function wireRoomCardsCore(host) {
  if (!host) return 0;
  var cards = host.querySelectorAll('.rc2');
  cards.forEach(function (el) {
    el.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-del]')) return;
      var id = el.dataset.room;
      try {
        if (el.dataset.where === 'home') dismissHome(id, true); else closePanel();
        enterRoom(id);
      } catch (e) { rcLog('card_tap_failed', { e: String(e && e.message || e) }, 'error'); }
    });
  });
  host.querySelectorAll('[data-del]').forEach(function (el) {
    el.addEventListener('click', function (ev) { ev.stopPropagation(); softDeleteRoom(el.dataset.del); });
  });
  return cards.length;
}
function wireRoomCards(host) {
  var r = wireRoomCardsCore.apply(this, arguments);
    try {
      if (host) Array.prototype.forEach.call(host.querySelectorAll('[data-thread]'), function (el) {
        el.addEventListener('click', function (ev) { ev.stopPropagation(); ev.preventDefault(); p6AskName(el.dataset.thread); });
      });
    } catch (e) { p6Log('wire_failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
}

/* ═══ renderHome · R body, NP after, T1 latch ═══ */
function renderHomeCore() {
  try {
    var host = ensureHomeHost();
    if (!host) { rcLog('home_no_host', {}, 'warn'); return; }
    var cards = homeCards();
    var h = '<div class="home-sum">' + esc(homeSummaryText()) + '</div>';
    cards.forEach(function (r) { h += roomCardHtml(r, 'home'); });
    host.innerHTML = h;
    var wired = wireRoomCards(host);
    rcLog('home_rendered', { cards: cards.length, wired: wired || 0 }, 'ok');
  } catch (e) {
    rcLog('home_render_failed', { e: String(e && e.message || e) }, 'error');
  }
}
function renderHomeFlat() {
  var r = renderHomeCore.apply(this, arguments);
    try { suppressPasswordUI(); } catch (_) {}
  return r;
}
function renderHome() { return fl4Latched(_fl4HomeLatch, 'renderHome', renderHomeFlat, renderHome, this, arguments); }

/* ═══ renderPanel · R body, J after, L after, P3 after, P6 after, T1 latch ═══ */
function renderPanelCore() {
  var body = $('panel-body'); if (!body) { rcLog('panel_no_body', {}, 'warn'); return; }
  try {
    var live = S.rooms.filter(function (r) { return !r.deletedAt; })
      .sort(function (a, b) { return (b.lastAt || b.createdAt) - (a.lastAt || a.createdAt); });
    var bin = S.rooms.filter(function (r) { return r.deletedAt; });

    var h = '';
    live.forEach(function (r) { h += roomCardHtml(r, 'panel'); });

    if (bin.length) {
      h += '<div class="bin-sec' + (renderPanel._binOpen ? ' open' : '') + '" id="bin-sec"><div class="bin-head" id="bin-head">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>' +
        'Recycle bin (' + bin.length + ')</div><div class="bin-body">';
      bin.forEach(function (r) {
        h += '<div class="bin-row"><span class="rc-title">' + esc(roomTitle(r)) + '</span>' +
          '<button class="bin-act" data-restore="' + r.id + '">Restore</button>' +
          '<button class="bin-act danger" data-harddel="' + r.id + '">Delete Forever</button></div>';
      });
      h += '</div></div>';
    }

    body.innerHTML = h || '<div style="text-align:center;color:var(--ink-dim);font-size:13.5px;padding:30px 10px">No conversations yet</div>';

    var wired = wireRoomCards(body);

    body.querySelectorAll('[data-restore]').forEach(function (el) {
      el.addEventListener('click', function () {
        var r = roomById(el.dataset.restore);
        if (r) { delete r.deletedAt; saveRooms(); rcLog('room_restored', { room: r.id }, 'ok'); renderPanel(); }
      });
    });
    body.querySelectorAll('[data-harddel]').forEach(function (el) {
      el.addEventListener('click', function () {
        var r = roomById(el.dataset.harddel); if (!r) return;
        S.rooms = S.rooms.filter(function (x) { return x.id !== r.id; });
        try { localStorage.removeItem(trKey(r.id)); } catch (_) {}
        saveRooms(); rcLog('room_hard_deleted', { room: r.id }, 'ok'); renderPanel();
      });
    });
    var bh = $('bin-head');
    if (bh) bh.addEventListener('click', function () {
      renderPanel._binOpen = !renderPanel._binOpen;
      $('bin-sec').classList.toggle('open', renderPanel._binOpen);
    });

    rcLog('panel_rendered', { live: live.length, bin: bin.length, wired: wired || 0 }, 'ok');
    renderHome();
  } catch (e) {
    rcLog('panel_render_failed', { e: String(e && e.message || e) }, 'error');
  }
}
function renderPanelFlat() {
  var r = renderPanelCore.apply(this, arguments);
  syncCreateControl();                                                     /* J after */
    try {
      var body = $('panel-body');
      if (body) body.querySelectorAll('[data-restore]').forEach(function (el) {
        el.addEventListener('click', function (ev) { ev.stopPropagation(); restoreRoom(el.dataset.restore); });
      });
    } catch (e) { lcLog('restore_wire_failed', { e: String(e && e.message || e) }, 'error'); }
    try { p3SyncMutes(); } catch (_) {}
    try {
      var body = $('panel-body'); if (!body) return r;
      var h = '';
      S.rooms.filter(function (x) { return !x.deletedAt && x.threadInvites && x.threadInvites.length; }).forEach(function (parent) {
        parent.threadInvites.forEach(function (inv) { h += p6InviteCardHtml(parent, inv); });
      });
      if (h) {
        var wrap = document.createElement('div'); wrap.id = 'p6-invites'; wrap.innerHTML = h;
        body.insertBefore(wrap, body.firstChild);
        Array.prototype.forEach.call(wrap.querySelectorAll('.p6-inv'), function (card) {
          var pid = card.dataset.p6Parent, tid = card.dataset.p6Thread;
          card.querySelector('[data-p6-accept]').addEventListener('click', function (ev) { ev.stopPropagation(); p6Accept(pid, tid); });
          card.querySelector('[data-p6-decline]').addEventListener('click', function (ev) { ev.stopPropagation(); p6Decline(pid, tid); });
        });
      }
    } catch (e) { p6Log('panel_failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
}
function renderPanel() { return fl4Latched(_fl4PanelLatch, 'renderPanel', renderPanelFlat, renderPanel, this, arguments); }

/* ═══ renderTranscript · base body, T1 latch ═══ */
function renderTranscriptCore(){
  var t=$('transcript');t.innerHTML='';_lastDateStr=null;
  transcript.forEach(function(e){appendMsgDom(e,true)});
  t.scrollTop=t.scrollHeight;
  sendReadReceipts();
}
function renderTranscript() { return fl4Latched(_fl4TranscriptLatch, 'renderTranscript', renderTranscriptCore, renderTranscript, this, arguments); }

/* ═══ renderRoomHead · base body, M after ═══ */
function renderRoomHeadCore(){
  var r=activeRoom();if(!r)return;
  $('room-head-title').textContent=r.partnerName||'?';
  var wrap=$('room-head-title').parentNode;
  wrap.title=r.lastSeenAt?('Last seen '+fmtDate(r.lastSeenAt)+' '+fmtTime(r.lastSeenAt)):'Not seen yet';
}
function renderRoomHead() {
  var r = renderRoomHeadCore.apply(this, arguments);
  try {
    var el = $('room-head-title');
    if (el && !el.dataset.rmWired) {
      el.dataset.rmWired = '1';
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (ev) { ev.stopPropagation(); showRoomNamePopup(); });
    }
  } catch (e) { rmLog('head_wire_failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
}

/* ═══ msgHtml · base body, R8 after ═══ */
function msgHtmlCore(e){
  var room=activeRoom();
  if(e.kind==='sys')return'<div class="pill" data-id="'+esc(e.id)+'"><span>'+esc(e.text)+' <i class="pill-ts">&middot; '+esc(fmtDate(e.ts))+' '+esc(fmtTime(e.ts))+'</i></span></div>';
  var mine=e.who==='me';
  var leftText,rightText,leftLang,rightLang;
  if(mine){leftText=e.sourceText;rightText=e.translatedText;leftLang=e.srcLang;rightLang=e.tgtLang}
  else{leftText=e.translatedText;rightText=e.sourceText;leftLang=e.tgtLang;rightLang=e.srcLang}
  var who=mine?(e.senderName||room.myName||S.user.name):(e.senderName||room.partnerName||'?');
  var origin=e.origin==='spoken'?'<span class="origin-mark"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg></span>':e.origin==='phrase'?'<span class="origin-mark"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>':'';
  var acts='<span class="tr-head-acts head-acts">'
    +'<button class="tr-act-btn" data-hact="save" title="Save to phrasebook"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button>'
    +'<button class="tr-act-btn" data-hact="del" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>'
    +'<button class="tr-act-btn" data-hact="clar" title="Clarify"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>'
    +'</span>';
  var head='<div class="tr-head meta"><span class="tr-who who'+(mine?' mine':'')+'">'+origin+esc(who)+'</span>'+acts
    +'<span class="tr-time">'+fmtTime(e.ts)+receiptHtml(e)+'</span></div>';
  var TT='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
  var body='<div class="tr-body cols">'
    +'<div class="tr-col col tr-col-tap" data-side="left" data-lang="'+esc(leftLang)+'">'
      +'<div class="tr-col-row"><div class="tr-text">'+esc(leftText)+attHtml(e)+'</div>'
      +'<button class="tr-tts" data-ctts tabindex="-1">'+TT+'</button></div></div>'
    +'<div class="tr-divider divider"></div>'
    +'<div class="tr-col col source second tr-col-tap" data-side="right" data-lang="'+esc(rightLang)+'">'
      +'<div class="tr-col-row"><div class="tr-text">'+esc(rightText)+'</div>'
      +'<button class="tr-tts" data-ctts tabindex="-1">'+TT+'</button></div></div>'
    +'</div>';
  var fail=e.translationFailed?'<div class="fail-badge">⚠ not translated</div>':'';
  var inner;
  if(room.meta==='off')inner=body+fail;
  else if(room.meta==='bottom')inner=body+fail+head.replace('tr-head meta','tr-head meta bottom-head');
  else inner=head+body+fail;
  return'<div class="msg'+(mine?' mine':'')+'" data-id="'+esc(e.id)+'"><div class="tr-bubble'+(e.kind==='chat'?' is-chat':'')+'">'+inner+'</div></div>';
}
function msgHtml(e) {
  var html = msgHtmlCore.apply(this, arguments);
    try {
      if (!e) return html;
      var want = originIcon(e);
      if (!want) return html;
      if (/<span class="origin-mark">/.test(html)) {
        /* Only the leading origin mark is swapped; the header's action buttons
           and receipt markup are left exactly as the base produced them. */
        return html.replace(/<span class="origin-mark">[\s\S]*?<\/span>/, want);
      }
      /* Typed entries: the base produced NO mark, so one is inserted at the
         head of the who-span — the exact slot the spoken mark occupies.
         READ FROM THE BASE, not assumed: msgHtml's head is
         '<span class="tr-who who' + (mine ? ' mine' : '') + '">'. The earlier
         build anchored on class="who" — markup that renderer never produces —
         and shipped an inserter that could not insert. */
      return html.replace(/(<span class="tr-who who[^"]*">)/, '$1' + want);
    } catch (err) {
      r8Log('origin_mark_failed', { e: String(err && err.message || err) }, 'error');
      return html;
    }
}

/* ═══ appendMsgDom · X3 before, base body, MD1 after ═══ */
function appendMsgDomCore(e,batch){
  var t=$('transcript');if(!t||S.view!=='room')return;
  var frag=document.createDocumentFragment();
  datePillIfNeeded(e,frag);
  var w=document.createElement('div');w.innerHTML=msgHtml(e);
  var node=w.firstChild;
  frag.appendChild(node);
  t.appendChild(frag);
  wireMsg(node,e);
  if(!batch){
    var nearBottom=t.scrollHeight-t.scrollTop-t.clientHeight<180;
    if(nearBottom||e.who==='me')requestAnimationFrame(function(){t.scrollTop=t.scrollHeight});
    else $('scroll-down').classList.add('show');
  }
}
function appendMsgDom(e, batch) {
  try {
      if (e && e.kind !== 'sys' && !e.said) {
        var p = e.who === 'me' ? x3Pending : (e.who === 'partner' ? x3PendingIn : null);
        if (p) {
          if (Date.now() - p.at > X3_PENDING_MS) { if (e.who === 'me') x3Pending = null; else x3PendingIn = null; }
          else if (norm(e.sourceText || '').toLowerCase() === p.normalized.toLowerCase()) {
            e.said = p.said; e.saidLang = p.saidLang;
            if (e.who === 'me') x3Pending = null; else x3PendingIn = null;
            try { saveTr(); } catch (_) {}
            log('said_kept', { id: e.id, lang: e.saidLang, chars: e.said.length, who: e.who }, 'ok');
          }
        }
      }
  } catch (_) {}
  var r = appendMsgDomCore.apply(this, arguments);
    try {
      if (!e || e.kind === 'sys') return r;
      if (typeof attHtml === 'function' && attHtml(e) !== '') return r;   /* attachment guard */
      var t = $('transcript'); if (!t) return r;
      var node = t.querySelector('.msg[data-id="' + e.id + '"]'); if (!node) return r;
      var mine = e.who === 'me';
      fl4CellFill(node, 'left',  mine ? e.sourceText     : e.translatedText);
      fl4CellFill(node, 'right', mine ? e.translatedText : e.sourceText);
      try { if (typeof log === 'function') log('md1_rendered', { id: String(e.id).slice(-6) }, 'ok'); } catch (_) {}
    } catch (_) {}
  return r;
}
