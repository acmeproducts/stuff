  /* Display cache of the projection; never an increment. */
  var _cr3WaitingOf = waitingOf;
  waitingOf = function (r) { if (!r) return { chat: 0, voice: 0, video: 0 }; if (!r.waiting) r.waiting = { chat: 0, voice: 0, video: 0 }; return r.waiting; };
  waitingOf._cr3Original = _cr3WaitingOf;
