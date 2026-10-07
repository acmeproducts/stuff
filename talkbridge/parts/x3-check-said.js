/* ═══════════ GAP PART · X3-check-said.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: wireMsg, normalizeOutgoing, appendMsgDom, chatPayload, handleChatMsg
   adds: btScore, btVerdict, backCheck, x3Pending
*/
/* ─────────────────────────────────────────────────────────────────────────────
   X-3 · THE TRANSLATION CHECK — WHAT WAS SAID, WHAT WAS NORMALIZED, WHAT WAS
         DELIVERED (owner, 2026-10-03, "GO build this as 28 pre-ship c3")

   c2 (X-2) put the check behind one header button and used chat-test's card.
   Its first real use found a gap in the record, not in the translation:
   normalization (by design — code switching: a Korean speaker who drops into
   English still means it as Korean speech) rewrites what the microphone heard
   into the speaker's own language BEFORE the base ever sees it, and the base
   keeps only the rewrite. So when English was spoken into the Korean phone the
   card could show only the Korean, and its score covered only the Korean →
   English → Korean loop. The English itself was kept nowhere.

   c3 keeps it, and scores both. Two hooks, neither replacing anything:
     normalizeOutgoing  — when the rewrite differs from what came in, the heard
                          words and their language are held for the message
                          about to be born (one pending record, 60 s);
     appendMsgDom       — the first own message whose text IS that rewrite
                          takes the record as `said` / `saidLang`, saved with
                          the transcript, logged once as `said_kept`.
   Both paths (in-call speech via onDGFinal, chat via sendChatText — the chat
   microphone funnels through the latter) create their entry and then call
   appendMsgDom, so one hook covers both.

   c4 (owner's card 2026-10-07: "typed on the keyboard when in fact it is
   not … the spoken language doesn't show English"): two more hooks —
     chatPayload        — a chat message carries `said` / `saidLang` on the wire
                          when its entry has them (same message type, two
                          fields; nothing else changes);
     handleChatMsg      — the receiver holds them for the partner entry about
                          to be born, which the appendMsgDom hook attaches by
                          the same text match. So the person who RECEIVED the
                          message sees what was actually said, in its own
                          language, which is who the check is for.
   And the Route row knows the chat microphone (`origin: 'voice'`) as Voice.
   In-call speech still carries `said` on the sender's side only: its wire
   messages (`subtitle` / `subtitle-update`) are built inside the frozen base
   and read by the flat relay path, so the receiver's copy of a spoken line
   waits for 28·ship (recorded in the plan).

   The card, in the owner's own layout (ASCII, 2026-10-03):
     SAID              source 1 — what was heard, in its language
     NORMALIZED        source 2 — the rewrite (only when there was one)
     TRANSLATED        the target — what the partner received
     BACK-TRANSLATION  the target brought back into the normalized language
     ROUTE
     Said vs Translated        comp 1 — direct when SAID is already in the
                                        target's language, else via a
                                        back-translation into SAID's language
     Normalized vs Translated  comp 2 — NORMALIZED vs BACK-TRANSLATION
   With no rewrite there is one source and one comparison.

   chat-test's card CSS is still copied byte for byte (the harness proves each
   rule against chat-test.html); btScore / btVerdict are chat-test's, verbatim;
   the AI review stays out (no AI tier). The header button is c2's.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof wireMsg !== 'function' || typeof translateWithRetry !== 'function' || typeof normalizeOutgoing !== 'function' || typeof appendMsgDom !== 'function' || typeof chatPayload !== 'function' || typeof handleChatMsg !== 'function') return;
  var st = document.createElement('style');
  st.textContent = [
    '.cl-bt{position:absolute;inset:0;z-index:20;background:rgba(15,23,42,.35);display:flex;align-items:center;justify-content:center;padding:12px}',
    '.cl-bt-card{background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(15,23,42,.25);width:100%;max-width:520px;max-height:100%;overflow:auto;padding:12px 14px;color:#0f172a;font-size:14px}',
    '.cl-bt-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}.cl-bt-head b{flex:1;font-size:15px}',
    '.cl-bt-head button{min-width:40px;min-height:40px;border:0;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-size:14px;padding:0 10px}',
    '.cl-bt-ai{margin:8px 0 2px}.cl-bt-ai.off{font-size:11px;color:#94a3b8}.cl-bt-ai-head{display:flex;gap:6px;align-items:center}.cl-bt-reason{font-size:13px;color:#334155;margin-top:4px}.cl-bt-sugg{margin-top:8px;padding:8px;border-radius:10px;background:#eff6ff}.cl-bt-use{margin-top:6px;min-height:36px;border:0;border-radius:10px;background:linear-gradient(135deg,rgba(96,165,250,.95),rgba(59,130,246,.95));color:#fff;padding:0 12px}.cl-bt-by{font-size:10px;color:#94a3b8;margin-top:4px}.cl-bt-verdict.secondary{opacity:.7;font-weight:600}',
    '.cl-bt-grid{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px}.cl-bt-grid th,.cl-bt-grid td{text-align:left;vertical-align:top;padding:7px 8px}.cl-bt-grid th{font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}.cl-bt-grid th{width:1%}.cl-bt-grid .cl-bt-lang{font-size:11px;font-weight:500;color:#64748b;text-transform:none;letter-spacing:0;margin-top:2px;white-space:normal;max-width:96px}.cl-bt-grid tr:nth-child(odd){background:#f1f5f9}.cl-bt-grid tr:nth-child(even){background:#fff}',
    '.cl-bt-sec{margin:8px 0}.cl-bt-lbl{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}',
    '.cl-bt-verdict{display:inline-block;border-radius:999px;padding:3px 10px;font-weight:700;font-size:12px}',
    '.cl-bt-verdict.match{background:#dcfce7;color:#166534}.cl-bt-verdict.partial{background:#fef9c3;color:#854d0e}.cl-bt-verdict.miss{background:#fee2e2;color:#991b1b}.cl-bt-verdict.wait{background:#e2e8f0;color:#334155}',
  ].join('\n');
  document.head.appendChild(st);
  var ICO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.2"/></svg>';

  /* chat-test.html · btScore / btVerdict, verbatim */
  function btScore(a,b){
      var clean=function(t){return String(t||'').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'')};
      var x=clean(a),y=clean(b);if(!x||!y)return 0;if(x===y)return 1;
      var bg=function(t){var m={};for(var i=0;i<t.length-1;i++){var k=t.slice(i,i+2);m[k]=(m[k]||0)+1}return m};
      var A=bg(x),B=bg(y),n=0,na=0,nb=0,k;for(k in A){na+=A[k];if(B[k])n+=Math.min(A[k],B[k])}for(k in B)nb+=B[k];
      return na+nb?2*n/(na+nb):0;
  }
  function btVerdict(score){return score>=0.8?'match':score>=0.5?'partial':'miss'}

  /* ── the record: what was heard, kept beside the rewrite ─────────────────── */
  var x3Pending = null;                       /* { said, saidLang, normalized, at } — one message in flight at a time */
  var X3_PENDING_MS = 60000;
  var _normalizeOutgoing = normalizeOutgoing;
  normalizeOutgoing = async function (room, text, knownLang) {
    var r = await _normalizeOutgoing.apply(this, arguments);
    try {
      var inT = norm(text || ''), outT = norm((r && r.text) || '');
      if (inT && outT && inT.toLowerCase() !== outT.toLowerCase()) x3Pending = { said: inT, saidLang: (r && r.detected) || knownLang || '', normalized: outT, at: Date.now() };
    } catch (_) {}
    return r;
  };
  var x3PendingIn = null;                     /* the partner's said, held from the wire for the entry about to be born */
  var _appendMsgDom = appendMsgDom;
  appendMsgDom = function (e, batch) {
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
    return _appendMsgDom.apply(this, arguments);
  };
  /* the wire: a chat message carries what was said; the receiver holds it for its entry */
  var _chatPayload = chatPayload;
  chatPayload = function (e) {
    var m = _chatPayload.apply(this, arguments);
    try { if (m && e && e.said && m.type === 'chat-msg') { m.said = e.said; m.saidLang = e.saidLang || ''; } } catch (_) {}
    return m;
  };
  var _handleChatMsg = handleChatMsg;
  handleChatMsg = function (d, room) {
    try {
      var said = d && typeof d.said === 'string' ? norm(d.said) : '';
      x3PendingIn = said && d.srcText ? { said: said, saidLang: String(d.saidLang || ''), normalized: norm(d.srcText), at: Date.now() } : null;
    } catch (_) { x3PendingIn = null; }
    return _handleChatMsg.apply(this, arguments);
  };

  /* ── the card, in the owner's layout; chat-test's CSS, words and scoring ──── */
  function backCheck(e){
      var shell=document.getElementById('scr-room')||document.body,old=shell.querySelector('.cl-bt');if(old)old.remove();
      var ov=document.createElement('div');ov.className='cl-bt';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Translation check');
      var card=document.createElement('div');card.className='cl-bt-card';ov.appendChild(card);
      var head=document.createElement('div');head.className='cl-bt-head';var ttl=document.createElement('b');ttl.textContent='Translation check';
      var copy=document.createElement('button');copy.type='button';copy.textContent='Copy';var x=document.createElement('button');x.type='button';x.textContent='✕';x.setAttribute('aria-label','Close');
      head.append(ttl,copy,x);card.appendChild(head);
      var tbl=document.createElement('table');tbl.className='cl-bt-grid';var tb=document.createElement('tbody');tbl.appendChild(tb);card.appendChild(tbl);
      var rows=[];
      function row(label,lang,text){var tr=document.createElement('tr'),a=document.createElement('th'),b=document.createElement('div'),c=document.createElement('td');a.textContent=label;b.textContent=lang;b.className='cl-bt-lang';a.appendChild(b);c.textContent=text;tr.append(a,c);tb.appendChild(tr);var r={label:label,lang:lang,text:text,tr:tr,set:function(l,t){if(l!=null){this.lang=l;b.textContent=l}if(t!=null){this.text=t;c.textContent=t}}};rows.push(r);return r}
      var name=function(c){return c?gL(c).name:'?'};
      var rewritten=!!(e.said&&norm(e.said).toLowerCase()!==norm(e.sourceText||'').toLowerCase());
      var said=rewritten?e.said:(e.sourceText||''),saidLang=rewritten?(e.saidLang||e.srcLang):e.srcLang;
      var normalized=e.sourceText||'',normLang=e.srcLang;
      var target=e.translatedText||'',tgtLang=e.tgtLang;
      row('Said',name(saidLang),said);
      if(rewritten)row('Normalized',name(normLang),normalized);
      row('Translated',name(tgtLang),target||'(no translation yet)');
      var rBack=row('Back-translation','…','…');
      var spokenOrigin=(e.origin==='spoken'||e.origin==='voice');
      row('Route',spokenOrigin?'Voice':e.origin==='phrase'?'Phrasebook':'Keyboard',e.origin==='spoken'?'Spoken into the microphone during a call':e.origin==='voice'?'Spoken into the chat microphone':e.origin==='phrase'?'Sent from the phrasebook':'Typed on the keyboard');
      /* the results, one line per comparison, in the owner's order */
      var res=document.createElement('div');res.className='cl-bt-sec';card.appendChild(res);
      function resultLine(label){var d=document.createElement('div');d.style.cssText='display:flex;align-items:center;gap:8px;margin-top:6px';var l=document.createElement('span');l.textContent=label;l.style.cssText='flex:1;font-size:13px';var v=document.createElement('span');v.className='cl-bt-verdict wait';v.textContent='Checking…';d.append(l,v);res.appendChild(d);return {label:label,pill:v,verdict:'',score:null,set:function(sc,txt){this.score=sc;this.verdict=txt||btVerdict(sc);v.className='cl-bt-verdict '+this.verdict;v.textContent=txt?txt:((this.verdict==='match'?'Match':this.verdict==='partial'?'Partial':'Miss')+' · '+Math.round(sc*100)+'%')},fail:function(txt){this.verdict=txt.toLowerCase();v.className='cl-bt-verdict miss';v.textContent=txt}}}
      var comp1=resultLine('Said vs Translated');
      var comp2=rewritten?resultLine('Normalized vs Translated'):null;
      var report={comps:[comp1].concat(comp2?[comp2]:[])};
      x.onclick=function(){ov.remove()};ov.addEventListener('click',function(ev){if(ev.target===ov)ov.remove()});
      copy.onclick=function(){var txt=rows.map(function(r){return r.label+' ('+r.lang+'): '+r.text}).join('\n')+report.comps.map(function(c){return '\n'+c.label+': '+c.verdict+(c.score!=null?' ('+Math.round(c.score*100)+'%)':'')}).join('');
          navigator.clipboard.writeText(txt).then(function(){copy.textContent='Copied';setTimeout(function(){copy.textContent='Copy'},1400)}).catch(function(){copy.textContent='Copy failed'})};
      shell.appendChild(ov);x.focus();
      function done(){
          var failed=report.comps.some(function(c){return c.score==null});
          var d={outcome:failed?'error':'ok',rewritten:rewritten,saidLang:saidLang,src:normLang,tgt:tgtLang,chars:String(said).length,said:comp1.score==null?null:+comp1.score.toFixed(2),saidVerdict:comp1.verdict};
          if(comp2){d.normalized=comp2.score==null?null:+comp2.score.toFixed(2);d.normalizedVerdict=comp2.verdict}
          /* chat-test's fields keep their names: verdict / score are the headline comparison, Said vs Translated */
          d.verdict=comp1.verdict;d.score=d.said;
          log('bt_check',d,failed?'error':(d.verdict==='miss'||(comp2&&comp2.verdict==='miss'))?'warn':'ok');
      }
      if(!target){report.comps.forEach(function(c){c.fail('No translation')});rBack.set('—','—');log('bt_check',{outcome:'ok',verdict:'no translation',rewritten:rewritten,saidLang:saidLang,src:normLang,tgt:tgtLang},'warn');return}
      /* the back-translation into the normalized language (a second one into SAID's language only when SAID is in a third language) */
      var back=function(lang){return lang===tgtLang?Promise.resolve({ok:true,text:target,direct:true}):translateWithRetry(target,tgtLang,lang,1)};
      var pNorm=back(normLang);
      var pSaid=(saidLang===normLang)?pNorm:back(saidLang);
      pNorm.then(function(r){
          if(!ov.isConnected)return;
          if(!r.ok){rBack.set(name(normLang),'(back-translation failed)');if(comp2)comp2.fail('Check failed');if(saidLang===normLang)comp1.fail('Check failed')}
          else{rBack.set(name(normLang)+(r.direct?' · same as target':''),r.text);if(comp2)comp2.set(btScore(normalized,r.text));if(saidLang===normLang)comp1.set(btScore(said,r.text))}
          if(saidLang===normLang){done();return}
          return pSaid.then(function(r2){
              if(!ov.isConnected)return;
              if(!r2.ok)comp1.fail('Check failed');else comp1.set(btScore(said,r2.text));
              done();
          });
      }).catch(function(){if(!ov.isConnected)return;report.comps.forEach(function(c){c.fail('Check failed')});log('bt_check',{outcome:'error',saidLang:saidLang,src:normLang,tgt:tgtLang},'error')});
  }

  var _wireMsg = wireMsg;
  wireMsg = function (node, e) {
    var r = _wireMsg.apply(this, arguments);
    try {
      if (!e || e.kind === 'sys') return r;
      var clar = node.querySelector('.head-acts [data-hact=clar]');
      if (!clar || node.querySelector('[data-hact=check]')) return r;
      var b = document.createElement('button');
      b.className = 'tr-act-btn'; b.setAttribute('data-hact', 'check'); b.title = 'Translation check'; b.innerHTML = ICO;
      clar.insertAdjacentElement('afterend', b);
      b.addEventListener('click', function (ev) { ev.stopPropagation(); backCheck(e); });
    } catch (_) {}
    return r;
  };
  window.btScore = btScore; window.btVerdict = btVerdict; window.backCheck = backCheck; window.x3Pending = function () { return x3Pending; }; window.x3PendingIn = function () { return x3PendingIn; };
})();
