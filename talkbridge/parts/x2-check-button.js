/* ═══════════ GAP PART · X2-check-button.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: wireMsg
   adds: btScore, btVerdict, backCheck
*/
/* ─────────────────────────────────────────────────────────────────────────────
   X-2 · THE TRANSLATION CHECK, ONE TAP (owner, 2026-10-03)

   c1's double-tap worked but was hard to land. The owner's ruling: tap the
   bubble header once (as today, the action row appears) and a fourth button —
   a circle with a counter-clockwise arrow — sits next to Clarify. One tap on
   it opens the check. The card is chat-test.html's card: its CSS rules are
   copied byte for byte below (the harness proves each rule against
   chat-test.html), its DOM is built the same way, in the same order, with the
   same words — title, Copy, ✕, the verdict pill, the zebra table (Spoken /
   Back-translation / Target / Route), the one-line note on what the score
   means. btScore and btVerdict are chat-test's, verbatim.

   Left out, by the owner's standing ruling: the AI review (chat-test r15) —
   TalkBridge has no AI tier, so neither the AI box nor its "add a key" line.
   The Route row says what TalkBridge knows about a message: voice, keyboard
   or phrasebook.

   wireMsg is wrapped (hook, never replace): the base wires its three buttons,
   then this part inserts the fourth after Clarify. Nothing else moves.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof wireMsg !== 'function' || typeof translateWithRetry !== 'function') return;
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

  /* chat-test.html · backCheck, the same card: shell is the room screen; no AI box; Route from TalkBridge's own record */
  function backCheck(e){
      var shell=document.getElementById('scr-room')||document.body,old=shell.querySelector('.cl-bt');if(old)old.remove();
      var ov=document.createElement('div');ov.className='cl-bt';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Translation check');
      var card=document.createElement('div');card.className='cl-bt-card';ov.appendChild(card);
      var head=document.createElement('div');head.className='cl-bt-head';var ttl=document.createElement('b');ttl.textContent='Translation check';
      var copy=document.createElement('button');copy.type='button';copy.textContent='Copy';var x=document.createElement('button');x.type='button';x.textContent='✕';x.setAttribute('aria-label','Close');
      head.append(ttl,copy,x);card.appendChild(head);
      var verdict=document.createElement('span');verdict.className='cl-bt-verdict wait';verdict.textContent='Checking…';card.appendChild(verdict);
      var tbl=document.createElement('table');tbl.className='cl-bt-grid';var tb=document.createElement('tbody');tbl.appendChild(tb);card.appendChild(tbl);
      var rows=[];
      function row(label,lang,text){var tr=document.createElement('tr'),a=document.createElement('th'),b=document.createElement('div'),c=document.createElement('td');a.textContent=label;b.textContent=lang;b.className='cl-bt-lang';a.appendChild(b);c.textContent=text;tr.append(a,c);tb.appendChild(tr);var r={label:label,lang:lang,text:text,tr:tr,set:function(l,t){if(l!=null){this.lang=l;b.textContent=l}if(t!=null){this.text=t;c.textContent=t}}};rows.push(r);return r}
      var how=document.createElement('div');how.style.cssText='font-size:11px;color:#64748b;margin-top:8px';how.textContent='Score compares the wording of Spoken and Back-translation, not meaning. Same meaning in different words scores lower.';card.appendChild(how);
      var name=function(c){return c?gL(c).name:'?'};
      var spoken=e.sourceText||'';
      var rSpoken=row('Spoken',name(e.srcLang),spoken),rBack=row('Back-translation','…','…'),rTarget=row('Target',name(e.tgtLang),e.translatedText||'(no translation yet)');
      row('Route',e.origin==='spoken'?'Voice':e.origin==='phrase'?'Phrasebook':'Keyboard',e.origin==='spoken'?'Spoken into the microphone':e.origin==='phrase'?'Sent from the phrasebook':'Typed on the keyboard');
      var report={verdict:'',score:null};
      x.onclick=function(){ov.remove()};ov.addEventListener('click',function(ev){if(ev.target===ov)ov.remove()});
      copy.onclick=function(){var txt=rows.map(function(r){return r.label+' ('+r.lang+'): '+r.text}).join('\n')+'\nResult: '+report.verdict+(report.score!=null?' ('+Math.round(report.score*100)+'%)':'');
          navigator.clipboard.writeText(txt).then(function(){copy.textContent='Copied';setTimeout(function(){copy.textContent='Copy'},1400)}).catch(function(){copy.textContent='Copy failed'})};
      shell.appendChild(ov);x.focus();
      function finish(back,lang,note){
          if(!ov.isConnected)return;
          var sc=btScore(spoken,back),v=btVerdict(sc);rBack.set(name(lang)+(note?' · '+note:''),back);report.score=sc;report.verdict=v;
          verdict.className='cl-bt-verdict '+v;verdict.textContent=(v==='match'?'Match':v==='partial'?'Partial':'Miss')+' · '+Math.round(sc*100)+'%';
          log('bt_check',{outcome:'ok',verdict:v,score:+sc.toFixed(2),spokenLang:lang,src:e.srcLang,tgt:e.tgtLang,rewritten:false,chars:String(spoken).length},v==='miss'?'warn':'ok');
      }
      if(!e.translatedText){verdict.className='cl-bt-verdict miss';verdict.textContent='No translation';report.verdict='no translation';rBack.set('—','—');return}
      var lang=e.srcLang;
      if(lang===e.tgtLang){finish(e.translatedText,lang,'same as target');return}
      translateWithRetry(e.translatedText,e.tgtLang,lang,1).then(function(r){
          if(!ov.isConnected)return;
          if(!r.ok){rBack.set(name(lang),'(back-translation failed)');verdict.className='cl-bt-verdict miss';verdict.textContent='Check failed';report.verdict='check failed';log('bt_check',{outcome:'error',spokenLang:lang,tgt:e.tgtLang},'error');return}
          finish(r.text,lang);
      });
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
  window.btScore = btScore; window.btVerdict = btVerdict; window.backCheck = backCheck;
})();
