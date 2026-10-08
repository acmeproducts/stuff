  var _normalizeOutgoing = normalizeOutgoing;
  normalizeOutgoing = async function (room, text, knownLang) {
    var r = await _normalizeOutgoing.apply(this, arguments);
    try {
      var inT = norm(text || ''), outT = norm((r && r.text) || '');
      if (inT && outT && inT.toLowerCase() !== outT.toLowerCase()) x3Pending = { said: inT, saidLang: (r && r.detected) || knownLang || '', normalized: outT, at: Date.now() };
    } catch (_) {}
    return r;
  };
