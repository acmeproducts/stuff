function bumpWaiting(r, kind) {
  if (!r || WAIT.indexOf(kind) < 0) { rcLog('waiting_bump_ignored', { kind: kind }, 'warn'); return; }
  var w = waitingOf(r);
  w[kind] = (w[kind] || 0) + 1;
  r.unread = waitingTotal(r);   /* legacy field kept in step for anything still reading it */
  rcLog('waiting_bump', { room: r.id, kind: kind, chat: w.chat, voice: w.voice, video: w.video }, 'ok');
}
