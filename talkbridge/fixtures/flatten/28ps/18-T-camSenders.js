function camSenders() {
  try { return (CALL.pc && CALL.pc.getSenders) ? CALL.pc.getSenders().filter(function (s) { return s.track ? s.track.kind === 'video' : false; }) : []; }
  catch (_) { return []; }
}
