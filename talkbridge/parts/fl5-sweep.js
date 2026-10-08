/* ═══════════ GAP PART · FL5-sweep.js ═══════════ */
/* @contract
   replaces: uid, log, saveRooms, loadTr, translateWithRetry, speakText, applyBubbleTheme, linkDeviceUrl, renderPartnerState, chatPayload, handleChatMsg, sendChatText, pbWriteBack, showScreen, wireMsg, renderPbList, pbRerenderCard, pbCommitEdit, pbAddTagTo, closeDrawer, osNotify, bgAddPill, addSpeech, onDGFinal, stopDeepgram, startDeepgram, normalizeOutgoing, waitingOf, bumpWaiting, clearWaiting, onVisible, onRoomNameSignal
   wraps: (none)
   adds: the *Core bodies, the named inner layers, and the moved state: _k1Prefix, _n16Q, _n16Sending, _n16Dev, n16Base, n16Flush, _k2LastErr, k2Refused, _t2WindowMs, _t2Limited, _t2Last, _t2Dropped, d10Dress, d10Refocus, g1Gcode, g1Keep, x3Ico
*/
/* ─────────────────────────────────────────────────────────────────────────────
   FL-5 · THE SHALLOW SWEEP, FLAT (§7.16 cluster 5, §0c-1)

   Every symbol the wrap map still listed after clusters 1–4: thirty-two
   functions, each with one base body and one to three layers over it, now ONE
   function each. Every body is the verbatim text of the layer it came from;
   a layer that called the previous layer by a captured name now calls the
   next inner function by its own name. Layers that REPLACED the previous one
   without calling it (CR3's osNotify / waitingOf / bumpWaiting, R8b's
   renderPartnerState, B's startDeepgram over the base's) leave the replaced
   bodies out — they were dead code, and their log markers with them, each
   declared in the assembler. State that lived inside a layer's closure moves
   here whole under a part-prefixed name (K1's prefix, N16's queue, K2's last
   refusal, T2's allowlist, D10's dressers, G1's cache helpers, X3's icon).
   Three things recorded, none a behaviour change in use:
     · the shared device log's queue is created on first use, so lines logged
       at boot before this part runs still reach it (it used to exist from
       N16's position in the file; the flat log is hoisted ahead of it);
     · K1's prefix is computed here, at the end of the script, so an id minted
       at boot between K1's old position and this part would be unprefixed —
       nothing mints one there (proven by the differential: ids identical);
     · T-net's open-path timing hook (dgWatch) is part of startDeepgram from
       the first call instead of 600 ms after boot.
   The function-object stashes (_cr3Original, _r8Original, _r9Original) that
   nothing read are gone. Proven equivalent by harness-diff-28pos.
   ───────────────────────────────────────────────────────────────────────────── */

/* ═══ uid · base, K1's device prefix ═══ */
function uidCore(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
var _k1Prefix = (typeof deviceId === 'string' && deviceId) ? String(deviceId).replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toLowerCase() : '';
function uid() { return _k1Prefix ? _k1Prefix + '-' + uidCore.apply(this, arguments) : uidCore.apply(this, arguments); }
if (_k1Prefix) { try { log('k1_ids', { prefix: _k1Prefix }, 'ok'); } catch (_) {} }

/* ═══ log · base, N16's shared device log, K2's refusal reader, T2's rate limit ═══ */
function logCore(ev,d,lvl){debugLog.push({ts:new Date().toISOString(),ev:ev,d:d||{},lvl:lvl||'info'});if(debugLog.length>400)debugLog.shift()}
var _n16Q = null, _n16Sending = false;
var _n16Dev = (function () {
  try {
    var k = 'tb_devlog_name', v = localStorage.getItem(k);
    if (!v) {
      var ua = navigator.userAgent || '';
      v = (/iPhone|iPad|iPod/.test(ua) ? 'iphone' : /Android/.test(ua) ? 'android' : 'desktop')
        + '-' + Math.random().toString(36).slice(2, 5);
      localStorage.setItem(k, v);
    }
    return v;
  } catch (_) { return 'dev'; }
})();
function n16Base() {
  try { return (typeof p3RelayHttp === 'function' ? p3RelayHttp() : '').replace(/\/signal.*$/, ''); } catch (_) { return ''; }
}
function n16Flush() {
  if (_n16Sending || !_n16Q || !_n16Q.length) return;
  var b = n16Base(); if (!b) return;
  var rows = _n16Q.splice(0, 100);
  _n16Sending = true;
  fetch(b + '/log', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dev: _n16Dev, rows: rows }), keepalive: true })
    .catch(function () {}).then(function () { _n16Sending = false; });
}
function logN16(ev, d, lvl) {
  try { (_n16Q || (_n16Q = [])).push({ t: Date.now(), e: ev, d: d || {} }); if (_n16Q.length > 400) _n16Q.shift(); } catch (_) {}
  return logCore.apply(this, arguments);
}
var _k2LastErr = null;
function k2Refused() { return /put 409|put 422/.test(_k2LastErr || ''); }
function logK2(ev, d) {
  if (ev === 'pb_writeback_err') _k2LastErr = String((d && d.e) || '');
  return logN16.apply(this, arguments);
}
var _t2WindowMs = 5000;
var _t2Limited = {
  joiner_create_control: 1, rc_home_rendered: 1, rc_panel_rendered: 1,
  md1_rendered: 1, cr3_announce: 1, pr2_declared: 1, pr3_dot: 1
};
var _t2Last = {}, _t2Dropped = {};
function log(ev, d, lvl) {
  try {
    if (_t2Limited[ev]) {
      var now = Date.now();
      if (_t2Last[ev] && now - _t2Last[ev] < _t2WindowMs) { _t2Dropped[ev] = (_t2Dropped[ev] || 0) + 1; return; }
      _t2Last[ev] = now;
      if (_t2Dropped[ev]) {
        var d2 = {}; for (var k in (d || {})) d2[k] = d[k];
        d2.dropped = _t2Dropped[ev]; _t2Dropped[ev] = 0;
        return logK2.call(this, ev, d2, lvl);
      }
    }
  } catch (_) {}
  return logK2.apply(this, arguments);
}
setInterval(n16Flush, 4000);
document.addEventListener('visibilitychange', function () { if (document.hidden) n16Flush(); });
window.addEventListener('pagehide', n16Flush);
try { log('n16_devlog', { dev: _n16Dev }); } catch (_) {}

/* ═══ saveRooms · base, P4 after, CR3 after ═══ */
function saveRoomsCore(){lsSet('tba_rooms',S.rooms)}
function saveRoomsP4() {
  var r = saveRoomsCore.apply(this, arguments);
  try { p4SaveCtx(); } catch (_) {}
  return r;
}
function saveRooms() {
  var r = saveRoomsP4.apply(this, arguments);
  try {
    var sig = S.rooms.map(function (x) { return x.id + ':' + (x.muted ? 1 : 0); }).join(',');
    if (cr3State.muteSig !== undefined && cr3State.muteSig !== sig) { clearTimeout(cr3State.muteTimer); cr3State.muteTimer = setTimeout(function () { cr3Announce('mute'); }, 100); }
    cr3State.muteSig = sig;
  } catch (_) {}
  return r;
}

/* ═══ loadTr · base, E after ═══ */
function loadTrCore(id){return lsGet(trKey(id),[])}
function loadTr(id) {
  var entries = loadTrCore.apply(this, arguments);
  try { seedSpeechSeq(entries); } catch (e) { try { log('seq_seed_err', { e: String(e) }, 'error'); } catch (_) {} }
  return entries;
}

/* ═══ translateWithRetry · base (MyMemory), G1 around (Google first) ═══ */
function translateWithRetryCore(text,from,to,retries){
  if(!text||!from||!to||from===to)return Promise.resolve({text:text,ok:true});
  var k=from+'|'+to+'|'+text;
  if(trCache.has(k)){var v=trCache.get(k);trCache.delete(k);trCache.set(k,v);return Promise.resolve({text:v,ok:true})}
  var attempt=function(n){
    return fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+from+'|'+to)
      .then(function(r){return r.json()})
      .then(function(d){
        if(d&&d.responseStatus===200&&d.responseData){
          var t=d.responseData.translatedText;
          if(t&&t.indexOf('MYMEMORY')<0){
            t=cleanTr(t);
            if(trCache.size>=TR_CACHE_MAX){var first=trCache.keys().next().value;trCache.delete(first)}
            trCache.set(k,t);return{text:t,ok:true};
          }
        }
        throw new Error('bad response');
      })
      .catch(function(e){
        if(n>0){log('trans_retry',{left:n},'warn');return new Promise(function(res){setTimeout(res,300+((retries-n)*250))}).then(function(){return attempt(n-1)})}
        log('trans_fail',{from:from,to:to,e:String(e)},'error');
        return{text:text,ok:false};
      });
  };
  return attempt(retries||0);
}
var g1Gcode = function (c) { return c === 'zh' ? 'zh-CN' : c === 'fil' ? 'tl' : c; };
function g1Keep(k, t) {
  if (trCache.size >= TR_CACHE_MAX) { var first = trCache.keys().next().value; trCache.delete(first); }
  trCache.set(k, t);
}
function translateWithRetry(text, from, to, retries) {
  var self = this, args = arguments;
  if (!text || !from || !to || from === to) return translateWithRetryCore.apply(self, args);
  var k = from + '|' + to + '|' + text;
  if (trCache.has(k)) return translateWithRetryCore.apply(self, args);            /* the frozen cache hit */
  var t0 = Date.now();
  return fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + g1Gcode(from) + '&tl=' + g1Gcode(to) + '&dt=t&q=' + encodeURIComponent(text))
    .then(function (r) { if (!r.ok) throw new Error('google http ' + r.status); return r.json(); })
    .then(function (d) {
      var t = Array.isArray(d) && Array.isArray(d[0]) ? d[0].map(function (x) { return x && x[0] || ''; }).join('') : '';
      t = cleanTr(t); if (!t) throw new Error('google empty');
      g1Keep(k, t);
      try { log('trans_ok', { provider: 'google', from: from, to: to, ms: Date.now() - t0, inChars: text.length, outChars: t.length }, 'ok'); } catch (_) {}
      return { text: t, ok: true };
    })
    .catch(function (ge) {
      try { log('trans_fallback', { provider: 'google', from: from, to: to, ms: Date.now() - t0, e: String(ge && ge.message || ge).slice(0, 60) }, 'warn'); } catch (_) {}
      return Promise.resolve(translateWithRetryCore.apply(self, args)).then(function (r) {
        try { if (r && r.ok) log('trans_ok', { provider: 'mymemory', from: from, to: to, ms: Date.now() - t0, inChars: text.length, outChars: String(r.text || '').length }, 'ok'); } catch (_) {}
        return r;
      });
    });
}

/* ═══ speakText · base, MD before (markdown stripped for speech) ═══ */
function speakTextCore(text,lang){
  text=norm(text);if(!text||!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);u.lang=gL(lang).tts;window.speechSynthesis.speak(u);
}
function speakText(text, lang) { return speakTextCore.call(this, tbmdSpeechStrip(text), lang); }

/* ═══ applyBubbleTheme · base, M after ═══ */
function applyBubbleThemeCore(){
  var s=$('bubble-theme-tag');if(!s){s=document.createElement('style');s.id='bubble-theme-tag';document.head.appendChild(s)}
  var r=activeRoom();if(!r){s.textContent='';return}
  var preset=themeVal(r,'preset','medium');
  var meBg=themeVal(r,'meBg',themePaletteColor(preset,'pacific-blue'));
  var pnBg=themeVal(r,'pnBg',themePaletteColor(preset,'almond-cream'));
  var meFont=themeVal(r,'meFont','')||(hexLum(meBg)>0.45?'#1A1714':'#ffffff');
  var pnFont=themeVal(r,'pnFont','')||(hexLum(pnBg)>0.45?'#1A1714':'#ffffff');
  var meSize=themeVal(r,'meSize',15),pnSize=themeVal(r,'pnSize',15);
  var meWidth=themeVal(r,'meWidth',75),pnWidth=themeVal(r,'pnWidth',75);
  var hdrColor=themeVal(r,'hdrColor','#5A5552'),hdrSize=themeVal(r,'hdrSize',11);
  s.textContent=
    '.tr-body{grid-template-columns:'+meWidth+'fr 1px '+pnWidth+'fr}'
    +'.tr-col[data-side="left"]{background:'+meBg+'}'
    +'.tr-col[data-side="left"] .tr-text{color:'+meFont+';font-size:'+meSize+'px}'
    +'.tr-col[data-side="left"] .tr-tts{color:'+meFont+';font-size:'+meSize+'px}'
    +'.tr-col[data-side="right"]{background:'+pnBg+'}'
    +'.tr-col[data-side="right"] .tr-text{color:'+pnFont+';font-size:'+pnSize+'px}'
    +'.tr-col[data-side="right"] .tr-tts{color:'+pnFont+';font-size:'+pnSize+'px}'
    +'.tr-head{font-size:'+hdrSize+'px}'
    +'.tr-head .tr-who{color:'+hdrColor+'}'
    +'.tr-head .tr-who.mine{color:'+hdrColor+'}'
    +'.tr-head .tr-time{color:'+hdrColor+';font-size:'+Math.max(8,hdrSize-1)+'px}';
}
function applyBubbleTheme() {
  var r = applyBubbleThemeCore.apply(this, arguments);
  try {
    var room = activeRoom(); if (!room) return r;
    var bg = themeVal(room, 'hdrBg', '');
    var tag = $('bubble-theme-tag');
    if (tag && bg) tag.textContent = tag.textContent + '.tr-head{background:' + bg + '}';
    var picker = $('s4b-hdr-bg');
    if (picker) picker.value = bg || '#F5F1EC';
  } catch (e) { rmLog('header_bg_apply_failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
}

/* ═══ linkDeviceUrl · base, B8c's name stamp, W1's title stamp (the FL-3 copies are now the only definitions) ═══ */
function linkDeviceUrlCore(room){
  var k=(localStorage.getItem('tb_dg_key')||'').trim();
  var tid=(localStorage.getItem('tb_cf_tid')||'').trim();
  var tok=(localStorage.getItem('tb_cf_tok')||'').trim();
  return location.href.split('?')[0].split('#')[0]+'#j='+encInv({r:room.id,ld:1,role:room.role,ml:room.myLang,tl:room.theirLang,myn:room.myName||S.user.name||'',pn:room.partnerName||'',t:room.title||'',th:room.theme||null,k:k,tid:tid,tok:tok});
}
function linkDeviceUrl(room) { return fl3TStamp(fl3Stamp(linkDeviceUrlCore.apply(this, arguments), room), room); }

/* ═══ renderPartnerState · R8b's replacement (the base body was dead) ═══ */
function renderPartnerState() {
      /* The base function's only job was writing "Speaking…" into #rz-timer.
         The slot now has one writer; speaking lives on the presence dot,
         which the timer tick below keeps updated. */
      return;
}

/* ═══ chatPayload · base, X3 after (what was said rides the wire) ═══ */
function chatPayloadCore(e){
  return{type:'chat-msg',chatId:e.id,srcText:e.sourceText,tgtText:e.translatedText,srcLang:e.srcLang,tgtLang:e.tgtLang,senderName:e.senderName,origin:e.origin||'typed',attachment:e.attachment||null,ts:e.ts};
}
function chatPayload(e) {
  var m = chatPayloadCore.apply(this, arguments);
  try { if (m && e && e.said && m.type === 'chat-msg') { m.said = e.said; m.saidLang = e.saidLang || ''; } } catch (_) {}
  return m;
}

/* ═══ handleChatMsg · X3 before (the partner's said held), R around (the waiting count), base ═══ */
function handleChatMsgCore(d,room){
  if(!d)return;
  if(d.chatId){
    if(_chatReceived.has(d.chatId)||transcript.some(function(x){return x.id===d.chatId})){relaySend({type:'chat-ack',chatId:d.chatId,transient:true});return}
    _chatReceived.add(d.chatId);
    relaySend({type:'chat-ack',chatId:d.chatId,transient:true});
  }
  if(d.senderName&&d.senderName!==room.partnerName){room.partnerName=d.senderName;saveRooms();renderRoomHead();renderPanel()}
  var entry={
    id:d.chatId||('ci-'+uid()),kind:'chat',who:'partner',
    sourceText:norm(d.srcText||''),translatedText:norm(d.tgtText||d.srcText||''),
    srcLang:d.srcLang||room.theirLang,tgtLang:d.tgtLang||room.myLang,
    ts:d.ts||Date.now(),senderName:d.senderName||room.partnerName||'Partner',
    origin:d.origin||'typed',attachment:d.attachment||null
  };
  transcript.push(entry);saveTr();
  room.lastAt=Date.now();saveRooms();
  appendMsgDom(entry);
  if(document.hidden){room.unread=(room.unread||0)+1;saveRooms();renderPanel();if(!room.muted)osNotify((entry.senderName||'New message'),entry.translatedText||entry.sourceText||'',room.id)}
  else sendReadReceipts();
  if(room.autoRead&&entry.translatedText)speakText(entry.translatedText,entry.tgtLang);
  log('chat_rx',{t:(d.srcText||'').slice(0,40)},'ok');
}
function handleChatMsgR(d, room) {
  var before = (room && room.unread) || 0;
  var r = handleChatMsgCore.apply(this, arguments);
  try {
    if (room && (room.unread || 0) > before) {
      room.unread = before;
      bumpWaiting(room, 'chat');
      saveRooms();
    }
  } catch (e) { rcLog('chat_count_failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
}
function handleChatMsg(d, room) {
  try {
    var said = d && typeof d.said === 'string' ? norm(d.said) : '';
    x3PendingIn = said && d.srcText ? { said: said, saidLang: String(d.saidLang || ''), normalized: norm(d.srcText), at: Date.now() } : null;
  } catch (_) { x3PendingIn = null; }
  return handleChatMsgR.apply(this, arguments);
}

/* ═══ sendChatText · L guard, J direction log, B normalization, base ═══ */
async function sendChatTextCore(text,attachment,originOverride){
  var room=activeRoom();if(!room)return;
  var src=room.myLang,tgt=room.theirLang,srcText=text,failed=false;
  if(text){
    var detected=detectLang(text);
    if(detected&&detected!==src){
      var normed=await translateWithRetry(text,detected,src,2);
      if(normed.ok&&norm(normed.text).toLowerCase()!==norm(text).toLowerCase())srcText=norm(normed.text);
      else src=detected;
    }
    var tgtText=srcText;
    if(src!==tgt){
      var tr=await translateWithRetry(srcText,src,tgt,1);
      if(tr.ok)tgtText=norm(tr.text);else failed=true;
    }
  }else{var tgtText=''}
  var entry={
    id:'cm-'+uid(),kind:'chat',who:'me',
    sourceText:srcText,translatedText:tgtText,srcLang:src,tgtLang:tgt,
    ts:Date.now(),senderName:room.myName||S.user.name,origin:originOverride||'typed',
    receipt:'sent',translationFailed:failed,attachment:attachment||null
  };
  transcript.push(entry);saveTr();
  room.lastAt=Date.now();saveRooms();renderPanel();
  appendMsgDom(entry);
  if(relaySend(chatPayload(entry)))log('chat_sent',{t:srcText.slice(0,40)},'ok');
  else log('chat_queued',{t:srcText.slice(0,40)},'warn');
}
async function sendChatTextB(text, attachment, originOverride) {
  var room = activeRoom();
  if (room && text) {
    var myGen = GEN.n;
    try {
      var r = await normalizeOutgoing(room, text);
      if (!GEN.is(myGen)) { log('chat_gen_abandoned', { gen: myGen }, 'warn'); return; }
      text = r.text;
      if (r.lang !== room.myLang) log('normalize_incomplete', { was: r.detected, wanted: room.myLang }, 'warn');
    } catch (e) { log('normalize_err', { e: String(e) }, 'error'); }
  }
  return sendChatTextCore.call(this, text, attachment, originOverride);
}
function sendChatTextJ(text, attachment, origin) {
  try {
    var r = activeRoom();
    if (r) jLog('send_direction', { room: String(r.id).slice(-6), from: r.myLang, to: r.theirLang, role: r.role }, 'ok');
  } catch (_) {}
  return sendChatTextB.apply(this, arguments);
}
function sendChatText(text, attachment, origin) {
  var r = activeRoom();
  if (roomSendLocked(r)) { lcLog('send_blocked', { room: r && String(r.id).slice(-6) }, 'warn'); toast('They left this chat'); return; }
  return sendChatTextJ.apply(this, arguments);
}

/* ═══ pbWriteBack · base, K2 around (compare-and-swap on refusal) ═══ */
function pbWriteBackCore(){
  var pk=PB.pk;if(!pk)return Promise.resolve({status:'no-pair'});
  if(!PB.isDirty()){return Promise.resolve({status:'skipped'})}
  var pat=(localStorage.getItem('tb_gh_pat')||'').trim();
  if(!pat)return Promise.resolve({status:'no-pat'});
  var dirp=pk.split('-'),src=dirp[0],tgt=dirp[1];
  // VERSION-MANAGEMENT RULING (2026-07-30): bridge never invents a new, higher version number.
  // It overwrites whichever version it already has loaded (PB.version), or creates 1000 if this
  // pair has never had a file. A new version only ever comes from a separate, external release process.
  var ver=PB.version||1000;
  var v=String(ver);while(v.length<4)v='0'+v;
  var fname='phrasebook-'+src+'-'+tgt+'-'+v+'.json';
  var getUrl='https://api.github.com/repos/'+PB_REPO.owner+'/'+PB_REPO.name+'/contents/'+PB_REPO.dir+'/'+fname+'?ref=main';
  return fetch(getUrl,{headers:ghHeaders()}).then(function(r){
    if(r.status===404)return null; // first-ever save for this pair — no existing file/sha yet
    if(!r.ok)throw new Error('get '+r.status);
    return r.json();
  }).then(function(existing){
    var envelope={type:'phrasebook',pair:pk,version:ver,updatedAt:new Date().toISOString(),updatedBy:S.user.name||'me',cards:PB.cards};
    var content=btoa(unescape(encodeURIComponent(JSON.stringify(envelope,null,2))));
    var putUrl='https://api.github.com/repos/'+PB_REPO.owner+'/'+PB_REPO.name+'/contents/'+PB_REPO.dir+'/'+fname;
    var body={message:'PB update '+pk+' v'+ver,content:content,branch:'main'};
    if(existing&&existing.sha)body.sha=existing.sha;
    return fetch(putUrl,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},ghHeaders()),body:JSON.stringify(body)}).then(function(r2){
      if(!r2.ok)throw new Error('put '+r2.status);return r2.json();
    });
  }).then(function(){
    PB.version=ver;PB.meta={bumpedAt:new Date().toISOString(),updatedBy:S.user.name||'me'};PB.save();PB.clearDirty();pbSyncDot('idle');PB.lastPull={status:'ok',file:fname,n:PB.cards.length,at:Date.now()};renderPbStatus();
    log('pb_writeback',{pair:pk,version:ver},'ok');
    return{status:'ok',version:ver};
  }).catch(function(e){
    log('pb_writeback_err',{e:String(e)},'warn');pbSyncDot('error');
    if(!_pbRetryArmed){_pbRetryArmed=true;window.addEventListener('online',function _r(){window.removeEventListener('online',_r);_pbRetryArmed=false;if(PB.isDirty())pbWriteBack()})}
    return{status:'pending'};
  });
}
function pbWriteBack() {
  var self = this, args = arguments;
  _k2LastErr = null;
  return Promise.resolve(pbWriteBackCore.apply(self, args)).then(function (r) {
    if (!r || r.status !== 'pending' || !k2Refused()) return r;
    var localCards = (PB.cards || []).slice(), localVersion = PB.version;
    /* The other device wrote the SAME version number (the bridge never
       bumps), so the frozen pull's "already at this version" short-cut
       would skip the fetch. Forget the version for the pull; it is put
       back if the pull does not deliver. */
    PB.version = null;
    return Promise.resolve(pbPull()).then(function (p) {
      if (!p || p.status !== 'ok' || p.unchanged) { PB.version = localVersion; throw new Error('pull ' + ((p && p.status) || 'failed')); }
      var remoteCards = (PB.cards || []).slice();          /* pbPull REPLACEs PB.cards with the remote */
      var m = pbMergeCards(localCards, remoteCards);
      PB.cards = m.cards; PB.save(); PB.markDirty();
      try { log('pb_merge', { kept: m.kept, took: m.took, added: m.added, remoteVersion: p && p.version }, 'warn'); } catch (_) {}
      return pbWriteBackCore.call(self);              /* the frozen function: one merge per write, never this wrapper again */
    }).catch(function (e) {
      PB.version = PB.version || localVersion; PB.cards = PB.cards && PB.cards.length ? PB.cards : localCards; PB.save(); PB.markDirty();
      try { log('pb_merge_err', { e: String((e && e.message) || e) }, 'error'); } catch (_) {}
      return r;
    });
  });
}

/* ═══ showScreen · base, PR2 after (the view declared; FL-3's copy of declare) ═══ */
function showScreenCore(v){
  S.view=v;
  ['s0','s1','room','s10'].forEach(function(k){$('scr-'+k).classList.toggle('active',k===v)});
}
function showScreen(v) { var r = showScreenCore.apply(this, arguments); fl3Declare('view_' + v); return r; }

/* ═══ wireMsg · base, M after (receipt popup), X3 after (the check button) ═══ */
function wireMsgCore(node,e){
  if(e.kind==='sys')return;
  var meta=node.querySelector('.meta');
  if(meta){
    meta.addEventListener('click',function(ev){
      if(ev.target.closest('[data-hact]')||ev.target.closest('[data-receipt]'))return;
      var was=node.classList.contains('active');
      document.querySelectorAll('.msg.active').forEach(function(m){m.classList.remove('active')});
      if(!was)node.classList.add('active');
    });
    var hs=meta.querySelector('[data-hact=save]');
    if(hs)hs.addEventListener('click',function(ev){ev.stopPropagation();pbAddCard({source:e.who==='me'?e.sourceText:e.translatedText,target:e.who==='me'?e.translatedText:e.sourceText,sourceLang:e.who==='me'?e.srcLang:e.tgtLang,targetLang:e.who==='me'?e.tgtLang:e.srcLang})});
    var hc=meta.querySelector('[data-hact=clar]');
    if(hc)hc.addEventListener('click',function(ev){ev.stopPropagation();openClarify(e)});
    var hd=meta.querySelector('[data-hact=del]');
    if(hd)hd.addEventListener('click',function(ev){
      ev.stopPropagation();
      if(!confirm('Delete this message?'))return;
      transcript=transcript.filter(function(x2){return x2.id!==e.id});saveTr();renderTranscript();
    });
  }
  node.querySelectorAll('.col').forEach(function(col){
    var txt=col.dataset.side==='left'?(e.who==='me'?e.sourceText:e.translatedText):(e.who==='me'?e.translatedText:e.sourceText);
    col.addEventListener('click',function(ev){
      if(ev.target.closest('[data-att]'))return;
      if(ev.target.closest('[data-ctts]')){ev.stopPropagation();speakText(txt,col.dataset.lang);return}
      useInCompose(txt,null);
    });
    longPress(col,function(x,y){openCtxMenu(e,x,y)});
  });
  var att=node.querySelector('[data-att]');
  if(att)att.addEventListener('click',function(ev){ev.stopPropagation();openAttViewer(e)});
  var rc=node.querySelector('[data-receipt]');
  if(rc)rc.addEventListener('click',function(ev){
    ev.stopPropagation();
    var pop=$('status-pop');
    var label=e.receipt==='read'?'Read':e.receipt==='delivered'?'Delivered':'Sent';
    var ts2=e.receipt==='read'?(e.readAt||e.ts):e.receipt==='delivered'?(e.deliveredAt||e.ts):e.ts;
    pop.textContent=label+' · '+fmtDate(ts2)+' '+fmtTime(ts2);
    var r2=rc.getBoundingClientRect(),ar=$('app').getBoundingClientRect();
    pop.style.left=Math.max(8,r2.left-ar.left-30)+'px';pop.style.top=(r2.top-ar.top-30)+'px';pop.style.display='block';
    clearTimeout(wireMsg._pt);wireMsg._pt=setTimeout(function(){pop.style.display='none'},1500);
  });
}
function wireMsgM(node, e) {
  var r = wireMsgCore.apply(this, arguments);
  try {
    if (node && node.querySelector) {
      var rec = node.querySelector('[data-receipt]');
      if (rec) rec.addEventListener('click', function (ev) { ev.stopPropagation(); showReceiptPopup(e); });
    }
  } catch (err) { rmLog('receipt_wire_failed', { e: String(err && err.message || err) }, 'error'); }
  return r;
}
var x3Ico = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.2"/></svg>';
function wireMsg(node, e) {
  var r = wireMsgM.apply(this, arguments);
  try {
    if (!e || e.kind === 'sys') return r;
    var clar = node.querySelector('.head-acts [data-hact=clar]');
    if (!clar || node.querySelector('[data-hact=check]')) return r;
    var b = document.createElement('button');
    b.className = 'tr-act-btn'; b.setAttribute('data-hact', 'check'); b.title = 'Translation check'; b.innerHTML = x3Ico;
    clar.insertAdjacentElement('afterend', b);
    b.addEventListener('click', function (ev) { ev.stopPropagation(); backCheck(e); });
  } catch (_) {}
  return r;
}

/* ═══ renderPbList / pbRerenderCard / pbAddTagTo · base, D10 after (the tag field dressed; focus kept) ═══ */
function d10Dress(root) {
  var inputs = (root || document).querySelectorAll('[data-taginp]');
  for (var i = 0; i < inputs.length; i++) {
    var ti = inputs[i];
    ti.setAttribute('enterkeyhint', 'enter');
    ti.setAttribute('autocomplete', 'off');
    var p = ti.parentNode;
    if (!(p && p.tagName === 'FORM' && p.hasAttribute('data-tagform'))) {
      var f = document.createElement('form');
      f.setAttribute('data-tagform', ti.getAttribute('data-cid') || '');
      f.setAttribute('action', '#');
      p.insertBefore(f, ti); f.appendChild(ti);
    }
  }
}
function d10Refocus(id, at) {
  var inp = document.querySelector('[data-taginp][data-cid="' + id + '"]');
  if (inp && document.activeElement !== inp) { inp.focus(); try { log('d10_refocus', { id: id, at: at }, 'info'); } catch (_) {} }
}
function renderPbListCore(){
  var host=$('pb-ov-cards');if(!host)return;
  var q=norm($('pb-search').value||'');
  var ts=function(x){var n=+x||(x?+new Date(x):0);return isNaN(n)?0:n};
  var live=PB.live().slice().sort(function(a,b){
    var ea=pbCardEmpty(a)?1:0,eb=pbCardEmpty(b)?1:0;
    if(ea!==eb)return eb-ea; // blank/new cards pinned to the top (S8)
    return ts(b.createdAt)-ts(a.createdAt);
  });
  var cnt=$('pb-count');
  var html='';
  if(!live.length&&!PB.trash().length){
    if(cnt)cnt.textContent='';
    $('pb-cat-chips').innerHTML='';
    html='<div style="padding:32px 16px;text-align:center;color:#9a9592;font-size:14px;line-height:1.6;">No phrasebook loaded.</div>';
  }else if(q){ // search mode: two-side rows (pre-base overlay search)
    var matched=searchFilter(live,q);
    var qLow=q.toLowerCase();
    matched.sort(function(a,b){return pbScore(b,qLow)-pbScore(a,qLow)});
    renderPbChips(matched); // live per-category match counts while typing
    var res=pbFilterByActiveCats(matched);
    var withinCatTotal=res.length;
    var capped=(S_pbActiveCats.length===1&&res.length>5);
    if(capped)res=res.slice(0,5);
    if(cnt)cnt.textContent=capped?(res.length+' of '+withinCatTotal+' phrases'):(res.length+' of '+live.length+' phrases');
    html=res.length?res.map(pbSearchRowHtml).join(''):'<div style="padding:24px;text-align:center;color:#9a9592;">No phrases found.</div>';
  }else{ // no search: full cards, chips show total counts (never a "match" count before typing)
    renderPbChips(live);
    var filtered=pbFilterByActiveCats(live);
    if(cnt)cnt.textContent=filtered.length+' phrases';
    html=filtered.map(pbBubbleHtml).join('');
  }
  host.innerHTML=html;
  $('pb-trash-host').innerHTML=pbTrashSectionHtml(PB.trash());
}
function renderPbList() { var r = renderPbListCore.apply(this, arguments); try { d10Dress(); } catch (_) {} return r; }
function pbRerenderCardCore(id){
  var c=pbCardById(id);var el=document.getElementById('pbb-'+id);
  if(!c||!el)return;
  var w2=document.createElement('div');w2.innerHTML=pbBubbleHtml(c);
  el.replaceWith(w2.firstChild);
  var r=window._pbRefocus;
  if(r&&r.id===id&&Date.now()-r.at<5000){ // Enter commits keep the keyboard put (S8)
    var f=document.querySelector('[data-pbedit="'+r.field+'"][data-cid="'+id+'"]');
    if(f){f.focus();try{var rg=document.createRange();rg.selectNodeContents(f);rg.collapse(false);var sl=window.getSelection();sl.removeAllRanges();sl.addRange(rg)}catch(_){}}
  }
}
function pbRerenderCard(id) { var r = pbRerenderCardCore.apply(this, arguments); try { d10Dress(document.getElementById('pbb-' + id)); } catch (_) {} return r; }
function pbAddTagToCore(id,raw){
  var c=pbCardById(id);if(!c)return;
  var t=(raw||'').toLowerCase().trim().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'').slice(0,24);
  if(!t)return;
  c.tags=c.tags||[];
  if(c.tags.indexOf(t)>=0)return;
  c.tags.push(t);
  pbLogChain(c,'Tag added: #'+t);
  pbTouch(c);
  _pbCS(id).tagsOpen=true;
  pbRerenderCard(id);
  var inp=document.querySelector('[data-taginp][data-cid="'+id+'"]');
  if(inp)inp.focus(); // G9: handler ends with focus
}
function pbAddTagTo(id) {
  var r = pbAddTagToCore.apply(this, arguments);
  setTimeout(function () { d10Refocus(id, 0); }, 0);
  setTimeout(function () { d10Refocus(id, 60); }, 60);
  return r;
}

/* ═══ pbCommitEdit · base, R9 around (the target side mirrored) ═══ */
function pbCommitEditCore(id,field,value){
  var c=pbCardById(id);if(!c)return;
  var v=norm(value);
  var changed=(v!==norm(c[field]||''));
  c[field]=v;
  if(field==='source'){
    if(changed){
      var bt=c.backtranslate=c.backtranslate||{};
      if(bt.verdict){bt.verdict='';pbLogChain(c,'Verdict reset to pending (source changed)')} // G8: conditional reset only
      c.tags=(c.tags||[]).filter(function(t){return t!=='✓Verified'});
      pbTouch(c);
    }
    if(!v){pbRerenderCard(id);return}
    // owner ruling: Enter in source, changed or not, re-translates target and re-runs BT
    translateWithRetry(v,c.sourceLang,c.targetLang,1).then(function(r){
      if(r.ok&&norm(r.text)!==norm(c.target||'')){c.target=norm(r.text);pbTouch(c)}
      return pbRunBT(c);
    });
    pbRerenderCard(id);
    return;
  }
  // target edited by hand: keep it, re-run BT
  if(changed){pbTouch(c);if(v)pbRunBT(c)}
  pbRerenderCard(id);
}
function pbCommitEdit(id, field, value) {
  try {
    if (field === 'target') {
      var c = pbCardById(id);
      if (!c) return;
      var v = norm(value);
      var prior = norm(c[field] || '');
      var changed = (v !== prior);
      c[field] = v;                                  /* S-RULE-4: edited side kept */
      return pbCommitEditTargetMirror(c, v, changed, prior);
    }
  } catch (e) { r8Log('r9_target_mirror_failed', { e: String(e && e.message || e) }, 'error'); }
  return pbCommitEditCore.apply(this, arguments);       /* source, notes, everything else: original */
}

/* ═══ closeDrawer · base, M before (never over a nameless room) ═══ */
function closeDrawerCore(){commitRoomName();$('drawer-s4b').classList.remove('open');document.querySelectorAll('.info-pop.show').forEach(function(p){p.classList.remove('show')})}
function closeDrawer() {
  if (holdOnBlankName()) { rmLog('drawer_close_blocked_empty_name', {}, 'warn'); return; }
  return closeDrawerCore.apply(this, arguments);
}

/* ═══ osNotify · CR3's replacement (the base body and P4's layer were dead) ═══ */
function osNotify(title, body, roomId) { cr3Log('os_notify_owned_by_relay', { room: roomId }); }

/* ═══ bgAddPill · base, CR3 before (no local missed pill) ═══ */
function bgAddPillCore(roomId,text){
  if(S.roomId===roomId){addSysPill(text);return}
  var tr=loadTr(roomId);tr.push({id:'sp-'+uid(),kind:'sys',text:text,ts:Date.now()});lsSet(trKey(roomId),tr);
}
function bgAddPill(roomId, text) {
  if (typeof text === 'string' && text.indexOf('Missed ') === 0) { cr3Log('local_missed_pill_dropped', { room: roomId }); return; }
  return bgAddPillCore.apply(this, arguments);
}

/* ═══ addSpeech · R8b before (duplicates dropped), R8 after (the call kind), F around (the identifier proof), base ═══ */
function addSpeechCore(who,srcT,trT,sL,tL,ss,failed){
  var room=activeRoom();if(!room)return;
  var id='sp-'+(who==='me'?'m':'p')+'-'+ss;
  var ex=transcript.find(function(e){return e.id===id});
  if(ex){ex.sourceText=srcT;ex.translatedText=trT;saveTr();replaceMsgDom(ex);return}
  var entry={id:id,kind:'speech',who:who,origin:'spoken',sourceText:srcT,translatedText:trT,srcLang:sL,tgtLang:tL,subtitleSeq:ss,ts:Date.now(),
    senderName:who==='me'?(room.myName||S.user.name):(room.partnerName||'Partner'),translationFailed:!!failed};
  transcript.push(entry);saveTr();
  room.lastAt=Date.now();saveRooms();
  appendMsgDom(entry);
}
function addSpeechF(who, srcT, trT, sL, tL, ss, failed) {
  var id = 'sp-' + (who === 'me' ? 'm' : 'p') + '-' + ss;
  var before = transcript ? transcript.length : -1;
  var clash = null;
  if (transcript) {
    for (var i = 0; i < transcript.length; i++) {
      if (transcript[i] && transcript[i].id === id) { clash = transcript[i]; break; }
    }
  }

  var r = addSpeechCore.apply(this, arguments);
  var after = transcript ? transcript.length : -1;

  if (clash) {
    /* An identifier was reissued. The older line has just been rewritten. */
    log('transcript_collision', {
      id: id, seq: ss, len: before,
      lost: String(clash.sourceText || '').slice(0, 40),
      wrote: String(srcT || '').slice(0, 40)
    }, 'error');
  } else {
    log('speech_added', { id: id, seq: ss, before: before, after: after, added: after - before }, 'ok');
  }
  return r;
}
function addSpeechR8(who, srcT, trT, sL, tL, ss, failed) {
  var r = addSpeechF.apply(this, arguments);
  try {
    var id = 'sp-' + (who === 'me' ? 'm' : 'p') + '-' + ss;
    var e = transcript.find(function (x) { return x.id === id; });
    if (e && !e.callKind) {
      e.callKind = (CALL && CALL.active) ? (CALL.kind === 'video' ? 'video' : 'voice') : 'chat';
      saveTr();
      r8Log('speech_kind', { kind: e.callKind }, 'ok');
    }
  } catch (err) { r8Log('speech_kind_failed', { e: String(err && err.message || err) }, 'error'); }
  return r;
}
function addSpeech(who, srcT, trT, sL, tL, ss, failed) {
  /* Only my own speech is de-duplicated. The partner's arrives over the
     relay already arbitrated, and suppressing there would drop a genuine
     repetition by the other person. */
  if (who === 'me' && isDuplicatePhrase(srcT)) {
    r8Log('speech_suppressed', {}, 'ok');
    return;
  }
  return addSpeechR8.apply(this, arguments);
}

/* ═══ onDGFinal · base, B around (generation + normalization) ═══ */
async function onDGFinalCore(text){
  text=norm(stripDGTags(text));if(!text)return;
  if(!text.replace(/[\s.,!?;:'"()\-]/g,''))return;
  if(/[฀-๿]/.test(text)){text=text.replace(/([ิ-ูเ-ไ]) ([฀-๿])/g,'$1$2').replace(/([฀-๿]) ([ะ-ู็-๎])/g,'$1$2')}
  if(isDupe(text)){log('dg_dedup',{t:text.slice(0,40)},'warn');return}
  recFinal(text);log('dg_final',{t:text.slice(0,60)},'ok');
  var room=activeRoom();if(!room||!(CALL.active||CHATMIC.on))return;
  if(!CALL.active){ // chat mic: spoken text is chat text, same bubble path as typed
    sendChatText(text,null,'voice');
    return;
  }
  // in-call: on-video caption overlay (baseline behavior, unchanged) AND fold into the persistent transcript.
  // bubble creation happens FIRST and unconditionally, before any translation call, so a translate/network
  // hiccup mid-call can never silently prevent the spoken line from landing in the transcript.
  var src=room.myLang,tgt=room.theirLang,ss=++localSubSeq;
  showSub(text,'mine');
  addSpeech('me',text,text,src,tgt,ss,false);
  var srcText=text;
  try{
    var detected=detectLang(text);
    if(detected&&detected!==src){ // normalization law: original never displayed
      var n=await translateWithRetry(text,detected,src,2);
      if(n.ok&&norm(n.text).toLowerCase()!==norm(text).toLowerCase()){srcText=norm(n.text);patchSpeech('me',ss,srcText,false)}
      else src=detected;
    }
    relaySend({type:'subtitle',subtitleSeq:ss,text:srcText,sourceText:srcText,sourceLang:src,targetLang:tgt,provisional:true});
    var tr=await translateWithRetry(srcText,src,tgt,2);
    var trText=tr.ok?norm(tr.text):srcText,failed=(!tr.ok&&src!==tgt);
    relaySend({type:'subtitle-update',subtitleSeq:ss,text:trText,sourceText:srcText,sourceLang:src,targetLang:tgt});
    patchSpeech('me',ss,trText,failed);
  }catch(e){
    log('dg_final_translate_err',{e:String(e)},'error'); // bubble already landed above even though translation failed
  }
}
async function onDGFinal(text, gen, knownLang) {
  if (typeof gen === 'number' && !GEN.is(gen)) { log('dg_final_stale_gen', { gen: gen }, 'warn'); return; }
  var room = activeRoom();
  if (room && text) {
    var myGen = GEN.n;
    try {
      var r = await normalizeOutgoing(room, text, knownLang);
      if (!GEN.is(myGen)) { log('dg_final_gen_abandoned', { gen: myGen }, 'warn'); return; }
      text = r.text;
      if (r.lang !== room.myLang) log('normalize_incomplete', { was: r.detected, wanted: room.myLang }, 'warn');
    } catch (e) { log('normalize_err', { e: String(e) }, 'error'); }
  }
  return onDGFinalCore.call(this, text);
}

/* ═══ stopDeepgram · base, A before (the generation and the held line cleared) ═══ */
function stopDeepgramCore(){
  _stopDgWatchdog();dgActive=false;
  if(_dgPrimHoldTimer){clearTimeout(_dgPrimHoldTimer);_dgPrimHoldTimer=null;_dgPrimHeldText=null}
  if(dgWs){try{dgWs.close()}catch(_){}dgWs=null}
  if(dgWsEn){try{dgWsEn.close()}catch(_){}dgWsEn=null}
  stopDGAudio();log('dg_stopped',{});
}
function stopDeepgram() {
  dgGen = 0;
  if (_dgPrimHoldTimer !== null) { clearTimeout(_dgPrimHoldTimer); _dgPrimHoldTimer = null; }
  _dgPrimHeldText = null;
  return stopDeepgramCore.apply(this, arguments);
}

/* ═══ startDeepgram · B's body (the base's was dead), M around (mute, offline close), T before (the open-path watch) ═══ */
function startDeepgramCore() {
  var room = activeRoom();
  if (!room || !(CALL.active || CHATMIC.on)) return;

  var key = CALL.keys().dg;
  if (!key) { toast('Deepgram key missing — no live transcription'); log('dg_no_key', {}, 'warn'); return; }
  if (dgActive || (dgWs && dgWs.readyState < 2)) { log('dg_skip_active', {}, 'warn'); return; }

  var stream = micStream();
  if (!stream) { log('dg_no_stream', {}, 'error'); return; }

  var langParam = dgLangParam(room);
  var myGen = GEN.n;
  dgGen = myGen;

  var url = 'wss://api.deepgram.com/v1/listen?model=nova-3&language=' + encodeURIComponent(langParam) +
            '&encoding=linear16&sample_rate=16000&channels=1&interim_results=false&punctuate=false&endpointing=400';

  dgWs = new WebSocket(url, ['token', key]);
  var mySocket = dgWs;
  var myEnSocket = null;

  /* live() is the single predicate for "this callback still matters". */
  function live() { return dgWs === mySocket && GEN.is(myGen); }

  dgWs.onopen = function () {
    if (!live()) { try { mySocket.close(); } catch (_) {} return; }
    if (!(CALL.active || CHATMIC.on)) { try { dgWs.close(); } catch (_) {} return; }
    dgFailCount = 0; dgHideFailBanner();
    log('dg_open', { lang: langParam, multi: langParam === 'multi', gen: myGen }, 'ok');
    try {
      var audioTracks = (stream ? stream.getAudioTracks() : []).filter(function (t) { return t.readyState === 'live'; });
      if (!audioTracks.length) { log('dg_no_audio', {}, 'error'); dgWs.close(); return; }
      var dgStream = new MediaStream(audioTracks);
      dgAudioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      dgSrc = dgAudioCtx.createMediaStreamSource(dgStream);
      var silentGain = dgAudioCtx.createGain();
      silentGain.gain.value = 0;
      silentGain.connect(dgAudioCtx.destination);

      function pump(f) {
        if (!live() || dgWs.readyState !== 1 || !micPipelineOn()) return;
        var b = new Int16Array(f.length);
        for (var i = 0; i < f.length; i++) { var s = Math.max(-1, Math.min(1, f[i])); b[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; }
        dgWs.send(b.buffer);
        if (myEnSocket && myEnSocket.readyState === 1) myEnSocket.send(b.buffer);
      }
      function scriptProc() {
        if (!live()) return;
        dgProc = dgAudioCtx.createScriptProcessor(4096, 1, 1);
        dgProc.onaudioprocess = function (e) { pump(e.inputBuffer.getChannelData(0)); };
        dgSrc.connect(dgProc); dgProc.connect(silentGain);
        dgActive = true; log('dg_scriptproc_active', {}, 'warn');
      }
      if (dgAudioCtx.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
        var wblob = new Blob([DG_WORKLET_CODE], { type: 'application/javascript' });
        var wurl = URL.createObjectURL(wblob);
        dgAudioCtx.audioWorklet.addModule(wurl).then(function () {
          URL.revokeObjectURL(wurl);
          if (!live() || dgWs.readyState !== 1) return;
          var wnode = new AudioWorkletNode(dgAudioCtx, 'tb-audio-capture');
          wnode.port.onmessage = function (ev) { pump(ev.data); };
          dgSrc.connect(wnode); wnode.connect(silentGain);
          dgProc = wnode; dgActive = true; log('dg_worklet_active', {}, 'ok');
        }).catch(function (e) {
          URL.revokeObjectURL(wurl); log('worklet_fallback', { e: String(e) }, 'warn'); scriptProc();
        });
      } else scriptProc();
    } catch (e) { log('dg_audio_err', { e: String(e) }, 'error'); dgActive = false; }
  };

  dgWs.onmessage = function (e) {
    if (!live()) return;
    _dgLastMsg = Date.now();
    try {
      var d = JSON.parse(e.data);
      var alt = d.channel && d.channel.alternatives && d.channel.alternatives[0];
      if (alt && alt.transcript && d.is_final) {
        if (myEnSocket) {
          dgArbitrateNative(alt.transcript, function (t) { if (GEN.is(myGen)) onDGFinal(t, myGen, room.myLang); });
        } else {
          onDGFinal(alt.transcript, myGen, dgUseMulti(room) ? null : room.myLang);
        }
      }
    } catch (_) {}
  };

  dgWs.onerror = function () { if (live()) log('dg_error', {}, 'error'); };

  dgWs.onclose = function (ev) {
    if (dgWs !== mySocket) { log('dg_stale_close_ignored', { code: ev.code }, 'warn'); return; }
    if (!GEN.is(myGen)) { log('dg_stale_gen_close_ignored', { code: ev.code, gen: myGen }, 'warn'); return; }
    log('dg_close', { code: ev.code, capturedGen: myGen, currentGen: GEN.n }, 'warn');
    var neverOpened = !dgActive;
    dgActive = false; stopDGAudio(); _stopDgWatchdog();
    if (myEnSocket) { try { myEnSocket.close(); } catch (_) {} myEnSocket = null; }
    if (!(CALL.active || CHATMIC.on)) return;
    if (neverOpened) {
      dgFailCount++;
      log('dg_credential_failure', { count: dgFailCount, code: ev.code }, 'error');
      if (dgFailCount >= DG_MAX_FAILS) { dgShowFailBanner(); return; }
    }
    setTimeout(function () {
      if (!GEN.is(myGen)) { log('dg_stale_gen_retry_dropped', { gen: myGen }, 'warn'); return; }
      if ((CALL.active || CHATMIC.on) && !dgActive) startDeepgram();
    }, 2000);
  };

  if (dgUseDual(room)) {
    var urlEn = 'wss://api.deepgram.com/v1/listen?model=nova-3&language=en' +
                '&encoding=linear16&sample_rate=16000&channels=1&interim_results=false&punctuate=false&endpointing=400';
    myEnSocket = new WebSocket(urlEn, ['token', key]);
    var enSock = myEnSocket;
    myEnSocket.onmessage = function (e) {
      if (myEnSocket !== enSock || !GEN.is(myGen)) return;
      _dgLastMsg = Date.now();
      try {
        var d = JSON.parse(e.data);
        var alt = d.channel && d.channel.alternatives && d.channel.alternatives[0];
        if (!(alt && alt.transcript && d.is_final)) return;
        dgDeliverEnglish(alt.transcript, myGen);
      } catch (_) {}
    };
    myEnSocket.onerror = function () { if (myEnSocket === enSock) log('dg_en_error', {}, 'error'); };
    myEnSocket.onclose = function (ev) {
      log('dg_en_close', { code: ev.code, capturedGen: myGen, currentGen: GEN.n }, 'warn');
      if (myEnSocket === enSock) myEnSocket = null;
    };
    log('dg_en_open', { myLang: room.myLang }, 'ok');
  }

  _dgLastMsg = Date.now();
  _stopDgWatchdog();
  _dgWatchdogTimer = setInterval(function () {
    if (!GEN.is(myGen)) { _stopDgWatchdog(); return; }
    if (!dgActive || !(CALL.active || CHATMIC.on)) { _stopDgWatchdog(); return; }
    if (Date.now() - _dgLastMsg > DG_WATCHDOG_MS) {
      log('dg_watchdog_restart', { silent_ms: Date.now() - _dgLastMsg }, 'warn');
      stopDeepgram();
      setTimeout(function () {
        if (!GEN.is(myGen)) return;
        if ((CALL.active || CHATMIC.on) && !dgActive) startDeepgram();
      }, 1000);
    }
  }, 5000);
}
function startDeepgramM() {
  if (CALL.active && !CALL.micOn) { rmLog('transcription_suppressed_muted', {}, 'ok'); return; }
  var r = startDeepgramCore.apply(this, arguments);
  try {
    if (dgWs && dgWs.addEventListener) {
      dgWs.addEventListener('close', function (ev) {
        if (ev.code === 1006 && typeof navigator !== 'undefined' && navigator.onLine === false) {
          rmLog('transcription_dropped_offline', { code: ev.code }, 'warn');
        }
      });
    }
  } catch (_) {}
  return r;
}
function startDeepgram() { dgWatch(); return startDeepgramM.apply(this, arguments); }

/* ═══ normalizeOutgoing · B's body, X3 after (what was said held beside the rewrite) ═══ */
async function normalizeOutgoingCore(room, text, knownLang) {
  /* When the caller knows what language the text is in — because it arrived on
     a channel listening for exactly that language — that is used directly.
     Detection is a fallback for when nothing knows. */
  var detected = knownLang || await detectLangAsync(text);
  if (detected === 'th') text = applyNorthernThaiMap(text);
  var r = resolveEffectiveLang(room, detected);
  var srcText = text, srcLang = r.srcLang;
  if (r.normalizeFrom) {
    var n = await translateWithRetry(text, r.normalizeFrom, srcLang, 2);
    var out = n && n.text ? norm(n.text) : '';
    var same = !!out && out.toLowerCase() === norm(text).toLowerCase();
    if (n.ok && out && !same) {
      srcText = out;
    } else {
      /* Normalization did not produce a rewrite. Two very different causes hide
         behind that, and they need opposite fixes, so the reason is recorded
         rather than inferred:
           failed  — the rewrite call did not come back
           empty   — it came back with nothing
           same    — it came back identical, which may mean the text was already
                     in the room's language and detection was wrong about it */
      var why = !n.ok ? 'failed' : (!out ? 'empty' : 'same');
      log('normalize_no_rewrite', {
        why: why, from: r.normalizeFrom, to: srcLang,
        inText: String(text).slice(0, 40),
        outText: String(out).slice(0, 40)
      }, 'warn');
      srcLang = r.normalizeFrom;
    }
  }
  return { text: srcText, lang: srcLang, detected: detected };
}
async function normalizeOutgoing(room, text, knownLang) {
  var r = await normalizeOutgoingCore.apply(this, arguments);
  try {
    var inT = norm(text || ''), outT = norm((r && r.text) || '');
    if (inT && outT && inT.toLowerCase() !== outT.toLowerCase()) x3Pending = { said: inT, saidLang: (r && r.detected) || knownLang || '', normalized: outT, at: Date.now() };
  } catch (_) {}
  return r;
}

/* ═══ waitingOf / bumpWaiting · CR3's replacements (the base bodies were dead: the relay's projection owns the counts) ═══ */
function waitingOf(r) { if (!r) return { chat: 0, voice: 0, video: 0 }; if (!r.waiting) r.waiting = { chat: 0, voice: 0, video: 0 }; return r.waiting; }
function bumpWaiting(r, kind) { cr3Log('bump_ignored', { room: r && r.id, kind: kind }); }

/* ═══ clearWaiting · base, R8 after (the home card's dismissal threshold reset) ═══ */
function clearWaitingCore(r) {
  if (!r) return;
  var before = waitingTotal(r);
  r.waiting = { chat: 0, voice: 0, video: 0 };
  r.unread = 0;
  if (before) rcLog('waiting_cleared', { room: r.id, was: before }, 'ok');
}
function clearWaiting(r) {
  var out = clearWaitingCore.apply(this, arguments);
  try {
    if (r && r.id) {
      var m = homeDismissed();
      if (m && typeof m[r.id] === 'number') {
        delete m[r.id];
        saveHomeDismissed(m);
        r8Log('dismiss_threshold_reset', { room: r.id }, 'ok');
      }
    }
  } catch (e) { r8Log('dismiss_reset_failed', { e: String(e && e.message || e) }, 'error'); }
  return out;
}

/* ═══ onVisible · T-net's body, CR3 after (recovery) ═══ */
function onVisibleCore(why) {
  var away = Date.now() - NET.lastVisible;
  NET.lastVisible = Date.now();
  netLog('returned', { why: why, awayMs: away, inRoom: !!S.roomId, inCall: !!CALL.active });
  if (!S.roomId) return;
  reconnectRelayNow(why);
  forceCallReconnect(why);
}
function onVisible(why) {
  var r = onVisibleCore.apply(this, arguments);
  try { cr3Recover(why); } catch (_) {}
  return r;
}

/* ═══ onRoomNameSignal · M's body, K4 around (last write wins) ═══ */
function onRoomNameSignalCore(roomId, d) {
  if (!d || d.type !== 'sys-pill' || typeof d.newRoomName !== 'string') return false;
  var r = roomById(roomId || d.room);
  var to = String(d.newRoomName).slice(0, 40);
  if (!r || !to) return false;
  var from = typeof d.wasRoomName === 'string' ? d.wasRoomName : (r.title || '');
  if (r.title !== to) {
    r.title = to;
    saveRooms();
    rmLog('rename_received', { from: from, to: to, by: d.byName || '' }, 'ok');
    try { renderRoomHead(); renderPanel(); } catch (_) {}
  }
  /* false, deliberately: the base still needs to write and render the pill. */
  return false;
}
function onRoomNameSignal(roomId, d) {
  if (d && d.type === 'sys-pill' && typeof d.newRoomName === 'string') {
    var r = roomById(roomId || d.room);
    var ts = Number(d.ts) || 0, mine = (r && Number(r.titleTs)) || 0;
    var to = String(d.newRoomName).slice(0, 40);
    if (r && ts && mine && (ts < mine || (ts === mine && to <= (r.title || '')))) {
      try { log('k4_rename_stale', { kept: r.title, ignored: to, ts: ts, mine: mine }, 'warn'); } catch (_) {}
      return false;                       /* the base still writes and renders the pill */
    }
    var out = onRoomNameSignalCore.apply(this, arguments);
    if (r && ts && r.title === to) { r.titleTs = ts; try { saveRooms(); } catch (_) {} }
    return out;
  }
  return onRoomNameSignalCore.apply(this, arguments);
}
