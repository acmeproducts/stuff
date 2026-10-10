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
