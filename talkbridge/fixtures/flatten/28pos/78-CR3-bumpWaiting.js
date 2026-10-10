  var _cr3BumpWaiting = bumpWaiting;
  bumpWaiting = function (r, kind) { cr3Log('bump_ignored', { room: r && r.id, kind: kind }); };
  bumpWaiting._cr3Original = _cr3BumpWaiting;
